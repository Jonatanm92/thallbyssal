#include "ThallbyssalLiveV1NamChain.h"

#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_core/juce_core.h>

#include <cmath>
#include <iostream>
#include <memory>
#include <vector>

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
    double startSeconds = 0.0;
    double durationSeconds = 0.0;
    juce::String safetyMode = "none";
    double safetyCeilingDb = -1.0;
    double safetyDrive = 2.0;
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
              << "  [--block-size <samples>]\n"
              << "  [--start-seconds <seconds>]\n"
              << "  [--duration-seconds <seconds>]\n"
              << "  [--safety-mode none|peak-normalize|hard-ceiling|soft-ceiling]\n"
              << "  [--safety-ceiling-db <dbfs>]\n"
              << "  [--safety-drive <amount>]\n";
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

    const auto startSecondsValue = getArgumentValue(argc, argv, "--start-seconds");
    if (startSecondsValue.isNotEmpty())
        options.startSeconds = startSecondsValue.getDoubleValue();

    const auto durationSecondsValue = getArgumentValue(argc, argv, "--duration-seconds");
    if (durationSecondsValue.isNotEmpty())
        options.durationSeconds = durationSecondsValue.getDoubleValue();

    const auto safetyModeValue = getArgumentValue(argc, argv, "--safety-mode");
    if (safetyModeValue.isNotEmpty())
        options.safetyMode = safetyModeValue.trim().toLowerCase();

    const auto safetyCeilingValue = getArgumentValue(argc, argv, "--safety-ceiling-db");
    if (safetyCeilingValue.isNotEmpty())
        options.safetyCeilingDb = safetyCeilingValue.getDoubleValue();

    const auto safetyDriveValue = getArgumentValue(argc, argv, "--safety-drive");
    if (safetyDriveValue.isNotEmpty())
        options.safetyDrive = safetyDriveValue.getDoubleValue();

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

    if (options.startSeconds < 0.0 || options.durationSeconds < 0.0)
    {
        error = "Start and duration must not be negative.";
        return false;
    }

    if (options.safetyMode != "none"
        && options.safetyMode != "peak-normalize"
        && options.safetyMode != "hard-ceiling"
        && options.safetyMode != "soft-ceiling")
    {
        error = "Unsupported safety mode: " + options.safetyMode;
        return false;
    }

    if (!(options.safetyCeilingDb < 0.0) || !(options.safetyDrive > 0.0))
    {
        error = "Safety ceiling must be below 0 dBFS and safety drive must be positive.";
        return false;
    }

    return true;
}

float decibelsToGain(double db)
{
    return static_cast<float>(std::pow(10.0, db / 20.0));
}

float findPeak(const juce::AudioBuffer<float>& buffer, int samples)
{
    float peak = 0.0f;
    for (int channel = 0; channel < buffer.getNumChannels(); ++channel)
        for (int sample = 0; sample < samples; ++sample)
            peak = juce::jmax(peak, std::abs(buffer.getSample(channel, sample)));

    return peak;
}

float findChannelPeak(const juce::AudioBuffer<float>& buffer, int channel, int samples)
{
    float peak = 0.0f;
    for (int sample = 0; sample < samples; ++sample)
        peak = juce::jmax(peak, std::abs(buffer.getSample(channel, sample)));

    return peak;
}

std::vector<float> resampleLinear(const std::vector<float>& input, double inputSampleRate, double outputSampleRate)
{
    if (input.empty())
        return {};

    if (std::abs(inputSampleRate - outputSampleRate) <= 0.5)
        return input;

    const auto outputSamples = static_cast<size_t>(std::ceil(static_cast<double>(input.size()) * outputSampleRate / inputSampleRate));
    std::vector<float> output(outputSamples, 0.0f);
    const auto ratio = inputSampleRate / outputSampleRate;

    for (size_t sample = 0; sample < output.size(); ++sample)
    {
        const auto sourcePosition = static_cast<double>(sample) * ratio;
        const auto index = static_cast<size_t>(std::floor(sourcePosition));
        const auto nextIndex = std::min(index + 1, input.size() - 1);
        const auto fraction = static_cast<float>(sourcePosition - static_cast<double>(index));
        const auto current = input[std::min(index, input.size() - 1)];
        const auto next = input[nextIndex];
        output[sample] = current + (next - current) * fraction;
    }

    return output;
}

float findStereoPeak(const std::vector<float>& left, const std::vector<float>& right)
{
    float peak = 0.0f;
    for (auto sample : left)
        peak = juce::jmax(peak, std::abs(sample));
    for (auto sample : right)
        peak = juce::jmax(peak, std::abs(sample));
    return peak;
}

float softCeilingSample(float sample, float ceiling, double drive)
{
    const auto absolute = std::abs(sample);
    if (absolute <= ceiling)
        return sample;

    constexpr auto maxSafe = 0.9985f;
    const auto excess = static_cast<double>(absolute - ceiling);
    const auto shaped = static_cast<float>(ceiling + (maxSafe - ceiling) * (1.0 - std::exp(-drive * excess)));
    return std::copysign(juce::jlimit(0.0f, maxSafe, shaped), sample);
}

void applySafetyMode(std::vector<float>& left, std::vector<float>& right, const Options& options, float rawOutputPeak)
{
    if (options.safetyMode == "none")
        return;

    const auto ceiling = decibelsToGain(options.safetyCeilingDb);

    if (options.safetyMode == "peak-normalize")
    {
        if (rawOutputPeak <= ceiling || rawOutputPeak <= 1.0e-12f)
            return;

        const auto gain = ceiling / rawOutputPeak;
        for (auto& sample : left)
            sample *= gain;
        for (auto& sample : right)
            sample *= gain;
        return;
    }

    if (options.safetyMode == "hard-ceiling")
    {
        for (auto& sample : left)
            sample = juce::jlimit(-ceiling, ceiling, sample);
        for (auto& sample : right)
            sample = juce::jlimit(-ceiling, ceiling, sample);
        return;
    }

    if (options.safetyMode == "soft-ceiling")
    {
        for (auto& sample : left)
            sample = softCeilingSample(sample, ceiling, options.safetyDrive);
        for (auto& sample : right)
            sample = softCeilingSample(sample, ceiling, options.safetyDrive);
    }
}

void writeMetadata(const juce::File& metadataFile,
                   const Options& options,
                   const ThallbyssalLiveV1NamChain& chain,
                   const juce::File& processedWav,
                   const juce::AudioFormatReader& reader,
                   int activeInputChannel,
                   juce::int64 sourceSamples,
                   juce::int64 samplesRendered,
                   float rawInputPeak,
                   float rawOutputPeak,
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
    metadata->setProperty("inputSampleRate", reader.sampleRate);
    metadata->setProperty("blockSize", options.blockSize);
    metadata->setProperty("startSeconds", options.startSeconds);
    metadata->setProperty("durationSecondsRequested", options.durationSeconds);
    metadata->setProperty("inputChannels", static_cast<int>(reader.numChannels));
    metadata->setProperty("activeInputChannel", activeInputChannel);
    metadata->setProperty("outputChannels", 2);
    metadata->setProperty("sourceSamples", static_cast<double>(sourceSamples));
    metadata->setProperty("samplesRendered", static_cast<double>(samplesRendered));
    metadata->setProperty("resampled", std::abs(reader.sampleRate - options.sampleRate) > 0.5);
    metadata->setProperty("rawInputPeakLinear", rawInputPeak);
    metadata->setProperty("rawOutputPeakLinear", rawOutputPeak);
    metadata->setProperty("outputPeakLinear", outputPeak);
    metadata->setProperty("safetyMode", options.safetyMode);
    metadata->setProperty("safetyCeilingDb", options.safetyCeilingDb);
    metadata->setProperty("safetyDrive", options.safetyDrive);

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

    const auto sourceSamples = reader->lengthInSamples;
    juce::AudioBuffer<float> sourceBuffer(static_cast<int>(reader->numChannels), static_cast<int>(sourceSamples));
    sourceBuffer.clear();
    reader->read(&sourceBuffer, 0, static_cast<int>(sourceSamples), 0, true, true);

    int activeInputChannel = 0;
    float activeInputPeak = 0.0f;
    for (int channel = 0; channel < sourceBuffer.getNumChannels(); ++channel)
    {
        const auto channelPeak = findChannelPeak(sourceBuffer, channel, static_cast<int>(sourceSamples));
        if (channelPeak > activeInputPeak)
        {
            activeInputPeak = channelPeak;
            activeInputChannel = channel;
        }
    }

    std::vector<float> sourceMono(static_cast<size_t>(sourceSamples), 0.0f);
    for (juce::int64 sample = 0; sample < sourceSamples; ++sample)
        sourceMono[static_cast<size_t>(sample)] = sourceBuffer.getSample(activeInputChannel, static_cast<int>(sample));

    const auto resampledMono = resampleLinear(sourceMono, reader->sampleRate, options.sampleRate);
    const auto requestedStartSample = static_cast<juce::int64>(std::floor(options.startSeconds * options.sampleRate));
    const auto renderStartSample = juce::jlimit<juce::int64>(0, static_cast<juce::int64>(resampledMono.size()), requestedStartSample);
    const auto availableSamples = static_cast<juce::int64>(resampledMono.size()) - renderStartSample;
    const auto requestedDurationSamples = options.durationSeconds > 0.0
        ? static_cast<juce::int64>(std::ceil(options.durationSeconds * options.sampleRate))
        : availableSamples;
    const auto renderSamples = juce::jlimit<juce::int64>(0, availableSamples, requestedDurationSamples);
    juce::AudioBuffer<float> monoBuffer(1, options.blockSize);
    juce::AudioBuffer<float> outputBuffer(2, options.blockSize);
    std::vector<float> renderedLeft(static_cast<size_t>(renderSamples), 0.0f);
    std::vector<float> renderedRight(static_cast<size_t>(renderSamples), 0.0f);

    juce::int64 samplesRendered = 0;
    float rawInputPeak = activeInputPeak;
    float rawOutputPeak = 0.0f;

    while (samplesRendered < renderSamples)
    {
        const auto samplesThisBlock = static_cast<int>(
            juce::jmin<juce::int64>(options.blockSize, renderSamples - samplesRendered));

        monoBuffer.clear();
        outputBuffer.clear();
        monoBuffer.copyFrom(0, 0, resampledMono.data() + renderStartSample + samplesRendered, samplesThisBlock);

        if (!chain.process(monoBuffer.getReadPointer(0),
                           outputBuffer.getWritePointer(0),
                           outputBuffer.getWritePointer(1),
                           samplesThisBlock,
                           error))
        {
            std::cerr << error << "\n";
            return renderError;
        }

        rawOutputPeak = juce::jmax(rawOutputPeak, findPeak(outputBuffer, samplesThisBlock));

        const auto outputOffset = static_cast<size_t>(samplesRendered);
        for (int sample = 0; sample < samplesThisBlock; ++sample)
        {
            renderedLeft[outputOffset + static_cast<size_t>(sample)] = outputBuffer.getSample(0, sample);
            renderedRight[outputOffset + static_cast<size_t>(sample)] = outputBuffer.getSample(1, sample);
        }

        samplesRendered += samplesThisBlock;
    }

    applySafetyMode(renderedLeft, renderedRight, options, rawOutputPeak);
    const auto outputPeak = findStereoPeak(renderedLeft, renderedRight);

    juce::int64 samplesWritten = 0;
    while (samplesWritten < renderSamples)
    {
        const auto samplesThisBlock = static_cast<int>(
            juce::jmin<juce::int64>(options.blockSize, renderSamples - samplesWritten));

        outputBuffer.clear();
        const auto outputOffset = static_cast<size_t>(samplesWritten);
        outputBuffer.copyFrom(0, 0, renderedLeft.data() + outputOffset, samplesThisBlock);
        outputBuffer.copyFrom(1, 0, renderedRight.data() + outputOffset, samplesThisBlock);

        if (!writer->writeFromAudioSampleBuffer(outputBuffer, 0, samplesThisBlock))
        {
            std::cerr << "Failed while writing live V1 probe WAV.\n";
            return renderError;
        }

        samplesWritten += samplesThisBlock;
    }

    writeMetadata(metadataFile,
                  options,
                  chain,
                  processedWav,
                  *reader,
                  activeInputChannel,
                  sourceSamples,
                  samplesRendered,
                  rawInputPeak,
                  rawOutputPeak,
                  outputPeak);
    std::cout << "Rendered live V1 NAM product-path probe: " << processedWav.getFullPathName() << "\n";
    std::cout << "Metadata: " << metadataFile.getFullPathName() << "\n";
    return ok;
}
