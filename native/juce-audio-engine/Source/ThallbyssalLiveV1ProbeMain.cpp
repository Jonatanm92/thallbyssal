#include "ThallbyssalLiveV1NamChain.h"

#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_core/juce_core.h>

#include <cmath>
#include <iostream>
#include <memory>

namespace
{
enum ExitCode
{
    ok = 0,
    usageError = 2,
    inputError = 3,
    outputError = 4,
    renderError = 5
};

struct Options
{
    juce::File input;
    juce::File outputDirectory;
    double sampleRate = 48000.0;
    int blockSize = 128;
};

juce::String getArgumentValue(int argc, char* argv[], const juce::String& name)
{
    for (int index = 1; index < argc - 1; ++index)
    {
        if (juce::String(argv[index]) == name)
            return juce::String(argv[index + 1]);
    }

    return {};
}

bool hasArgument(int argc, char* argv[], const juce::String& name)
{
    for (int index = 1; index < argc; ++index)
    {
        if (juce::String(argv[index]) == name)
            return true;
    }

    return false;
}

void printUsage()
{
    std::cout << "ThallbyssalLiveV1Probe\n"
              << "  --input <input.wav>\n"
              << "  --out <output-directory>\n"
              << "  [--sample-rate <hz>]\n"
              << "  [--block-size <samples>]\n";
}

bool parseOptions(int argc, char* argv[], Options& options, juce::String& error)
{
    if (hasArgument(argc, argv, "--help"))
        return false;

    options.input = juce::File(getArgumentValue(argc, argv, "--input"));
    options.outputDirectory = juce::File(getArgumentValue(argc, argv, "--out"));

    const auto sampleRateValue = getArgumentValue(argc, argv, "--sample-rate");
    if (sampleRateValue.isNotEmpty())
        options.sampleRate = sampleRateValue.getDoubleValue();

    const auto blockSizeValue = getArgumentValue(argc, argv, "--block-size");
    if (blockSizeValue.isNotEmpty())
        options.blockSize = blockSizeValue.getIntValue();

    if (options.input.getFullPathName().isEmpty())
    {
        error = "Missing --input.";
        return false;
    }

    if (options.outputDirectory.getFullPathName().isEmpty())
    {
        error = "Missing --out.";
        return false;
    }

    if (!(options.sampleRate > 0.0) || options.blockSize <= 0)
    {
        error = "Invalid sample rate or block size.";
        return false;
    }

    return true;
}

float findPeak(const juce::AudioBuffer<float>& buffer, int samples)
{
    float peak = 0.0f;
    for (int channel = 0; channel < buffer.getNumChannels(); ++channel)
        for (int sample = 0; sample < samples; ++sample)
            peak = juce::jmax(peak, std::abs(buffer.getSample(channel, sample)));

    return peak;
}

void writeMetadata(const juce::File& metadataFile,
                   const Options& options,
                   const ThallbyssalLiveV1NamChain& chain,
                   const juce::File& processedWav,
                   const juce::AudioFormatReader& reader,
                   juce::int64 samplesRendered,
                   float rawInputPeak,
                   float outputPeak)
{
    const auto& config = chain.getConfig();
    const auto& status = chain.getStatus();

    auto metadata = std::make_unique<juce::DynamicObject>();
    metadata->setProperty("schemaVersion", 1);
    metadata->setProperty("renderer", "ThallbyssalLiveV1Probe");
    metadata->setProperty("dspEntrypoint", "ThallbyssalLiveV1NamChain::process");
    metadata->setProperty("activeSoundTarget", "Live V1 source recovery probe - not Current Best parity");
    metadata->setProperty("inputWav", options.input.getFullPathName());
    metadata->setProperty("processedWav", processedWav.getFullPathName());
    metadata->setProperty("sampleRate", options.sampleRate);
    metadata->setProperty("blockSize", options.blockSize);
    metadata->setProperty("inputChannels", static_cast<int>(reader.numChannels));
    metadata->setProperty("outputChannels", 2);
    metadata->setProperty("samplesRendered", static_cast<double>(samplesRendered));
    metadata->setProperty("rawInputPeakLinear", rawInputPeak);
    metadata->setProperty("outputPeakLinear", outputPeak);

    metadata->setProperty("bigBottomModel", config.bigBottomModel.getFullPathName());
    metadata->setProperty("gojiraModel", config.gojiraModel.getFullPathName());
    metadata->setProperty("bldogIr", config.bldogIr.getFullPathName());
    metadata->setProperty("hlbstIr", config.hlbstIr.getFullPathName());
    metadata->setProperty("gojiraIr", config.gojiraIr.getFullPathName());

    metadata->setProperty("bldogGainDb", config.bldogGainDb);
    metadata->setProperty("gojiraGainDb", config.gojiraGainDb);
    metadata->setProperty("edgeGainDb", config.edgeGainDb);
    metadata->setProperty("finalGainDb", config.finalGainDb);
    metadata->setProperty("bigBottomBldogLoaded", status.bigBottomBldogLoaded);
    metadata->setProperty("bigBottomHlbstLoaded", status.bigBottomHlbstLoaded);
    metadata->setProperty("gojiraLoaded", status.gojiraLoaded);
    metadata->setProperty("irsLoaded", status.irsLoaded);
    metadata->setProperty("ready", status.ready);
    metadata->setProperty("v1Formula", "center=0.64*BLDOG+0.36*edge; side=0.22*(BLDOG-edge); +1.5dB@1400Hz,Q=0.9; final recovered gain; no V2 softclip.");
    metadata->setProperty("note", "Internal local live V1 NAM runtime probe. This validates source recovery plumbing only; it does not prove Current Best tone parity. No UI change. No DI modification. No asset bundling.");

    metadataFile.replaceWithText(juce::JSON::toString(juce::var(metadata.release()), true));
}
}

int main(int argc, char* argv[])
{
    Options options;
    juce::String error;

    if (!parseOptions(argc, argv, options, error))
    {
        if (error.isNotEmpty())
            std::cerr << error << "\n";
        printUsage();
        return usageError;
    }

    if (!options.input.existsAsFile())
    {
        std::cerr << "Input WAV does not exist: " << options.input.getFullPathName() << "\n";
        return inputError;
    }

    if (!options.outputDirectory.createDirectory())
    {
        std::cerr << "Could not create output directory: " << options.outputDirectory.getFullPathName() << "\n";
        return outputError;
    }

    const auto processedWav = options.outputDirectory.getChildFile("processed.wav");
    const auto metadataFile = options.outputDirectory.getChildFile("render-metadata.json");
    if (processedWav.existsAsFile() || metadataFile.existsAsFile())
    {
        std::cerr << "Probe output already exists. Refusing to overwrite: " << options.outputDirectory.getFullPathName() << "\n";
        return outputError;
    }

    juce::AudioFormatManager formatManager;
    formatManager.registerBasicFormats();

    std::unique_ptr<juce::AudioFormatReader> reader(formatManager.createReaderFor(options.input));
    if (reader == nullptr || reader->lengthInSamples <= 0)
    {
        std::cerr << "Unsupported or unreadable input WAV: " << options.input.getFullPathName() << "\n";
        return inputError;
    }

    if (std::abs(reader->sampleRate - options.sampleRate) > 0.5)
    {
        std::cerr << "Input sample rate does not match requested sample rate.\n";
        return inputError;
    }

    ThallbyssalLiveV1NamChain chain;
    auto config = ThallbyssalLiveV1NamChain::Config::localPrivateDefaults();
    if (!chain.prepare(config, options.sampleRate, options.blockSize, error))
    {
        std::cerr << error << "\n";
        return renderError;
    }

    juce::WavAudioFormat wavFormat;
    std::unique_ptr<juce::FileOutputStream> outputStream(processedWav.createOutputStream());
    if (outputStream == nullptr || !outputStream->openedOk())
    {
        std::cerr << "Could not create output WAV: " << processedWav.getFullPathName() << "\n";
        return outputError;
    }

    std::unique_ptr<juce::AudioFormatWriter> writer(
        wavFormat.createWriterFor(outputStream.get(), options.sampleRate, 2, 24, {}, 0));
    if (writer == nullptr)
    {
        std::cerr << "Could not create WAV writer.\n";
        return outputError;
    }
    outputStream.release();

    juce::AudioBuffer<float> inputBuffer(static_cast<int>(reader->numChannels), options.blockSize);
    juce::AudioBuffer<float> monoBuffer(1, options.blockSize);
    juce::AudioBuffer<float> outputBuffer(2, options.blockSize);

    juce::int64 samplesRendered = 0;
    float rawInputPeak = 0.0f;
    float outputPeak = 0.0f;

    while (samplesRendered < reader->lengthInSamples)
    {
        const auto samplesThisBlock = static_cast<int>(
            juce::jmin<juce::int64>(options.blockSize, reader->lengthInSamples - samplesRendered));

        inputBuffer.clear();
        monoBuffer.clear();
        outputBuffer.clear();
        reader->read(&inputBuffer, 0, samplesThisBlock, samplesRendered, true, true);

        int activeInputChannel = 0;
        float activeInputPeak = 0.0f;
        for (int channel = 0; channel < inputBuffer.getNumChannels(); ++channel)
        {
            float channelPeak = 0.0f;
            for (int sample = 0; sample < samplesThisBlock; ++sample)
                channelPeak = juce::jmax(channelPeak, std::abs(inputBuffer.getSample(channel, sample)));

            if (channelPeak > activeInputPeak)
            {
                activeInputPeak = channelPeak;
                activeInputChannel = channel;
            }
        }

        monoBuffer.copyFrom(0, 0, inputBuffer, activeInputChannel, 0, samplesThisBlock);
        rawInputPeak = juce::jmax(rawInputPeak, findPeak(monoBuffer, samplesThisBlock));

        if (!chain.process(monoBuffer.getReadPointer(0),
                           outputBuffer.getWritePointer(0),
                           outputBuffer.getWritePointer(1),
                           samplesThisBlock,
                           error))
        {
            std::cerr << error << "\n";
            return renderError;
        }

        outputPeak = juce::jmax(outputPeak, findPeak(outputBuffer, samplesThisBlock));

        if (!writer->writeFromAudioSampleBuffer(outputBuffer, 0, samplesThisBlock))
        {
            std::cerr << "Failed while writing live V1 probe WAV.\n";
            return renderError;
        }

        samplesRendered += samplesThisBlock;
    }

    writeMetadata(metadataFile, options, chain, processedWav, *reader, samplesRendered, rawInputPeak, outputPeak);
    std::cout << "Rendered live V1 NAM product-path probe: " << processedWav.getFullPathName() << "\n";
    std::cout << "Metadata: " << metadataFile.getFullPathName() << "\n";
    return ok;
}
