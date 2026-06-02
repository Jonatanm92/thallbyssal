#include "ThallLabDspEngine.h"

#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_core/juce_core.h>

#include <cmath>
#include <memory>

namespace
{
enum ExitCode
{
    ok = 0,
    usageError = 2,
    inputError = 3,
    presetError = 4,
    outputError = 5,
    renderError = 6
};

struct RenderOptions
{
    juce::File input;
    juce::File preset;
    juce::File outputDirectory;
    juce::File renderRoot;
    juce::String presetId;
    double sampleRate = 48000.0;
    int blockSize = 128;
};

struct PresetLoadResult
{
    ThallLabDspEngine::Parameters parameters;
    juce::File irA;
    juce::File irB;
    bool cabIrARequested = false;
    bool cabIrBRequested = false;
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
    std::cout << "ThallbyssalOfflineRenderer\n"
              << "  --input <input.wav>\n"
              << "  --preset <preset.json>\n"
              << "  --out <output-directory>\n"
              << "  --sample-rate <hz>\n"
              << "  --block-size <samples>\n"
              << "  [--preset-id <id>]\n"
              << "  [--render-root <directory>]\n";
}

bool isInsideDirectory(const juce::File& root, const juce::File& candidate)
{
    const auto rootPath = root.getFullPathName().trimCharactersAtEnd("\\/").toLowerCase();
    const auto candidatePath = candidate.getFullPathName().trimCharactersAtEnd("\\/").toLowerCase();

    return candidatePath == rootPath
           || candidatePath.startsWith(rootPath + "\\")
           || candidatePath.startsWith(rootPath + "/");
}

float getNumber(juce::DynamicObject* object, const juce::Identifier& id, float fallback)
{
    if (object == nullptr)
        return fallback;

    const auto value = object->getProperty(id);
    if (value.isDouble() || value.isInt() || value.isInt64())
        return static_cast<float>(value);

    return fallback;
}

bool getBool(juce::DynamicObject* object, const juce::Identifier& id, bool fallback)
{
    if (object == nullptr)
        return fallback;

    const auto value = object->getProperty(id);
    return value.isBool() ? static_cast<bool>(value) : fallback;
}

juce::String getString(juce::DynamicObject* object, const juce::Identifier& id)
{
    if (object == nullptr)
        return {};

    return object->getProperty(id).toString();
}

juce::DynamicObject* getObject(juce::DynamicObject* object, const juce::Identifier& id)
{
    if (object == nullptr)
        return nullptr;

    return object->getProperty(id).getDynamicObject();
}

juce::DynamicObject* selectPresetObject(juce::var& parsed, const juce::String& presetId, juce::String& error)
{
    if (auto* root = parsed.getDynamicObject())
        return root;

    auto* presets = parsed.getArray();
    if (presets == nullptr || presets->isEmpty())
    {
        error = "Preset JSON must be an object or non-empty array.";
        return nullptr;
    }

    if (presetId.isNotEmpty())
    {
        for (auto& preset : *presets)
        {
            auto* object = preset.getDynamicObject();
            if (object != nullptr && object->getProperty("preset_id").toString() == presetId)
                return object;
        }

        error = "Preset id not found in preset array: " + presetId;
        return nullptr;
    }

    if (presets->size() == 1)
    {
        if (auto* object = presets->getReference(0).getDynamicObject())
            return object;
    }

    error = "Preset array needs --preset-id.";
    return nullptr;
}

void applyGatePreset(ThallLabDspEngine::Parameters& parameters, const juce::String& value)
{
    const auto gate = value.toLowerCase();

    if (gate == "off")
    {
        parameters.gateEnabled = false;
        return;
    }

    parameters.gateEnabled = true;

    if (gate == "fast")
    {
        parameters.gateThresholdDb = -55.0f;
        parameters.gateReleaseMs = 28.0f;
    }
    else if (gate == "medium")
    {
        parameters.gateThresholdDb = -62.0f;
        parameters.gateReleaseMs = 48.0f;
    }
    else if (gate == "diagnostic")
    {
        parameters.gateThresholdDb = -82.0f;
        parameters.gateReleaseMs = 120.0f;
    }
    else if (gate == "tight")
    {
        parameters.gateThresholdDb = -58.0f;
        parameters.gateReleaseMs = 38.0f;
    }
}

void applyGrinderPreset(ThallLabDspEngine::Parameters& parameters, const juce::String& value)
{
    const auto grinder = value.toLowerCase();

    if (grinder == "off")
    {
        parameters.grinderEnabled = false;
        parameters.grinderAmount = 0.0f;
        return;
    }

    parameters.grinderEnabled = true;

    if (grinder == "high")
        parameters.grinderAmount = 82.0f;
    else if (grinder == "medium")
        parameters.grinderAmount = 58.0f;
    else if (grinder == "low")
        parameters.grinderAmount = 34.0f;
}

void configureFromLabPreset(PresetLoadResult& result, juce::DynamicObject* root)
{
    auto& parameters = result.parameters;
    auto* amp = getObject(root, "amp_section_settings");
    auto* effects = getObject(root, "effects_settings");
    const auto category = getString(root, "category").toLowerCase();

    parameters.inputGainDb = getNumber(root, "input_gain", parameters.inputGainDb);
    parameters.outputGainDb = getNumber(root, "output_gain", parameters.outputGainDb);
    parameters.ampDrive = getNumber(amp, "gain", parameters.ampDrive);
    parameters.ampBass = getNumber(amp, "bass", parameters.ampBass);
    parameters.ampMid = getNumber(amp, "mid", parameters.ampMid);
    parameters.ampTreble = getNumber(amp, "treble", parameters.ampTreble);
    parameters.ampPresence = getNumber(amp, "presence", parameters.ampPresence);
    parameters.ampMaster = getNumber(amp, "master", parameters.ampMaster);

    applyGatePreset(parameters, getString(effects, "gate"));
    applyGrinderPreset(parameters, getString(effects, "grinder"));
    parameters.octaveLayerBlend = getNumber(effects, "low_octave", parameters.octaveLayerBlend);

    if (category == "clean" || category == "fx")
    {
        parameters.ampEnabled = false;
        parameters.cleanBlend = getNumber(effects, "clean_space", category == "clean" ? 42.0f : 24.0f);
        parameters.cleanDelayMix = getNumber(effects, "clean_delay", parameters.cleanDelayMix);
        parameters.cleanDelayFeedback = getNumber(effects, "clean_delay_feedback", parameters.cleanDelayFeedback);
        parameters.cleanReverbMix = getNumber(effects, "clean_reverb", parameters.cleanReverbMix);
        parameters.cleanReverbDecay = getNumber(effects, "clean_reverb_decay", parameters.cleanReverbDecay);
        parameters.ambientEnabled = true;
        parameters.ambientBlend = getNumber(effects, "reverse", getNumber(effects, "shimmer", 28.0f));
    }

    parameters.ambientShimmer = getNumber(effects, "shimmer", parameters.ambientShimmer);
    parameters.ambientReverse = getNumber(effects, "reverse", parameters.ambientReverse);
    parameters.ambientStutter = getNumber(effects, "stutter", parameters.ambientStutter);
    parameters.ambientRing = getNumber(effects, "ring", parameters.ambientRing);
}

void configureFromNativePreset(PresetLoadResult& result, juce::DynamicObject* root, const juce::File& presetFile)
{
    auto& parameters = result.parameters;
    auto* audio = getObject(root, "audio");
    auto* transpose = getObject(root, "transpose");
    auto* octaveLayer = getObject(root, "octaveLayer");
    auto* palmMute = getObject(root, "palmMute");
    auto* gate = getObject(root, "gate");
    auto* grinder = getObject(root, "grinder");
    auto* di = getObject(root, "di");
    auto* amp = getObject(root, "amp");
    auto* cab = getObject(root, "cab");
    auto* clean = getObject(root, "clean");
    auto* fx = getObject(root, "fx");

    parameters.inputGainDb = getNumber(audio, "inputGainDb", parameters.inputGainDb);
    parameters.outputGainDb = getNumber(audio, "outputGainDb", parameters.outputGainDb);
    parameters.stereoOutput = getString(audio, "outputMode").toLowerCase() != "mono";
    parameters.transposeSemitones = getNumber(transpose, "semitones", getNumber(audio, "transposeSemitones", parameters.transposeSemitones));
    parameters.octaveLayerBlend = getNumber(octaveLayer, "blend", parameters.octaveLayerBlend);
    parameters.palmMuteAmount = getNumber(palmMute, "amount", parameters.palmMuteAmount);
    parameters.palmMuteFocusHz = getNumber(palmMute, "focusHz", parameters.palmMuteFocusHz);
    parameters.gateEnabled = getBool(gate, "enabled", parameters.gateEnabled);
    parameters.gateThresholdDb = getNumber(gate, "thresholdDb", parameters.gateThresholdDb);
    parameters.gateReleaseMs = getNumber(gate, "releaseMs", parameters.gateReleaseMs);
    parameters.grinderEnabled = getBool(grinder, "enabled", parameters.grinderEnabled);
    parameters.grinderAmount = getNumber(grinder, "drive", getNumber(grinder, "amount", parameters.grinderAmount));
    parameters.diAmount = getNumber(di, "amount", parameters.diAmount);
    parameters.diSmooth = getNumber(di, "smooth", parameters.diSmooth);
    parameters.diCurve = getNumber(di, "curve", parameters.diCurve);
    parameters.ampEnabled = getBool(amp, "enabled", parameters.ampEnabled);
    parameters.ampDrive = getNumber(amp, "gain", getNumber(amp, "drive", parameters.ampDrive));
    parameters.ampBass = getNumber(amp, "bass", parameters.ampBass);
    parameters.ampMid = getNumber(amp, "mid", parameters.ampMid);
    parameters.ampTreble = getNumber(amp, "treble", parameters.ampTreble);
    parameters.ampPresence = getNumber(amp, "presence", parameters.ampPresence);
    parameters.ampMaster = getNumber(amp, "master", parameters.ampMaster);
    parameters.ampOutputDb = getNumber(amp, "outputDb", getNumber(amp, "output", parameters.ampOutputDb));
    parameters.cabBlend = getNumber(cab, "blend", parameters.cabBlend);
    parameters.cabLowCutHz = getNumber(cab, "lowCutHz", parameters.cabLowCutHz);
    parameters.cabHighCutHz = getNumber(cab, "highCutHz", parameters.cabHighCutHz);
    parameters.cabResonance = getNumber(cab, "room", getNumber(cab, "resonance", parameters.cabResonance));
    parameters.cabLevel = getNumber(cab, "level", parameters.cabLevel);
    parameters.cabSectionEnabled = getBool(cab, "enabled", parameters.cabSectionEnabled);
    parameters.cabIrEnabled = getBool(cab, "irEnabled", parameters.cabIrEnabled);
    parameters.cleanBlend = getBool(clean, "enabled", false) ? getNumber(clean, "mix", parameters.cleanBlend) : 0.0f;
    parameters.cleanSpace = getNumber(clean, "space", parameters.cleanSpace);
    parameters.cleanBass = getNumber(clean, "bass", parameters.cleanBass);
    parameters.cleanMid = getNumber(clean, "mid", parameters.cleanMid);
    parameters.cleanTreble = getNumber(clean, "treble", parameters.cleanTreble);
    parameters.cleanPresence = getNumber(clean, "presence", parameters.cleanPresence);
    parameters.cleanTone = getNumber(clean, "tone", parameters.cleanTone);
    parameters.cleanLevel = getNumber(clean, "level", parameters.cleanLevel);
    parameters.cleanDelayMix = getNumber(clean, "delayMix", parameters.cleanDelayMix);
    parameters.cleanDelayTimeMs = getNumber(clean, "delayTimeMs", parameters.cleanDelayTimeMs);
    parameters.cleanDelayFeedback = getNumber(clean, "delayFeedback", parameters.cleanDelayFeedback);
    parameters.cleanReverbMix = getNumber(clean, "reverbMix", parameters.cleanReverbMix);
    parameters.cleanReverbDecay = getNumber(clean, "reverbDecay", parameters.cleanReverbDecay);
    parameters.ambientEnabled = getBool(fx, "enabled", parameters.ambientEnabled);
    parameters.ambientBlend = parameters.ambientEnabled ? getNumber(fx, "mix", parameters.ambientBlend) : 0.0f;
    parameters.ambientSize = getNumber(fx, "size", parameters.ambientSize);
    parameters.ambientFeedback = getNumber(fx, "feedback", parameters.ambientFeedback);
    parameters.ambientGrain = getNumber(fx, "grain", parameters.ambientGrain);
    parameters.ambientPitch = getNumber(fx, "pitch", parameters.ambientPitch);
    parameters.ambientTone = getNumber(fx, "tone", parameters.ambientTone);
    parameters.ambientShimmer = getBool(fx, "shimmerEnabled", true) ? getNumber(fx, "shimmer", parameters.ambientShimmer) : 0.0f;
    parameters.ambientReverse = getBool(fx, "reverseEnabled", true) ? getNumber(fx, "reverse", parameters.ambientReverse) : 0.0f;
    parameters.ambientStutter = getBool(fx, "stutterEnabled", true) ? getNumber(fx, "stutter", parameters.ambientStutter) : 0.0f;
    parameters.ambientRing = getBool(fx, "ringEnabled", true) ? getNumber(fx, "ring", parameters.ambientRing) : 0.0f;

    const auto irA = getString(audio, "cabIrFileName");
    if (irA.isNotEmpty())
    {
        result.irA = presetFile.getSiblingFile(irA);
        result.cabIrARequested = true;
    }

    const auto irB = getString(audio, "cabIrBFileName");
    if (irB.isNotEmpty())
    {
        result.irB = presetFile.getSiblingFile(irB);
        result.cabIrBRequested = true;
    }
}

PresetLoadResult loadPreset(const juce::File& presetFile, const juce::String& presetId, juce::String& error)
{
    auto parsed = juce::JSON::parse(presetFile);
    auto* root = selectPresetObject(parsed, presetId, error);
    PresetLoadResult result;

    if (root == nullptr)
        return result;

    const auto target = getString(root, "target");
    if (target == "thall-lab-native-juce" || getObject(root, "audio") != nullptr)
        configureFromNativePreset(result, root, presetFile);
    else if (root->hasProperty("preset_id"))
        configureFromLabPreset(result, root);
    else
        error = "Unsupported preset JSON shape.";

    return result;
}

bool parseOptions(int argc, char* argv[], RenderOptions& options, juce::String& error)
{
    if (hasArgument(argc, argv, "--help"))
        return false;

    options.input = juce::File(getArgumentValue(argc, argv, "--input"));
    options.preset = juce::File(getArgumentValue(argc, argv, "--preset"));
    options.outputDirectory = juce::File(getArgumentValue(argc, argv, "--out"));
    options.renderRoot = juce::File(getArgumentValue(argc, argv, "--render-root"));
    options.presetId = getArgumentValue(argc, argv, "--preset-id");

    const auto sampleRateText = getArgumentValue(argc, argv, "--sample-rate");
    if (sampleRateText.isNotEmpty())
        options.sampleRate = sampleRateText.getDoubleValue();

    const auto blockSizeText = getArgumentValue(argc, argv, "--block-size");
    if (blockSizeText.isNotEmpty())
        options.blockSize = blockSizeText.getIntValue();

    if (options.input.getFullPathName().isEmpty() || options.preset.getFullPathName().isEmpty() || options.outputDirectory.getFullPathName().isEmpty())
    {
        error = "Missing required --input, --preset, or --out argument.";
        return false;
    }

    if (options.sampleRate < 44100.0 || options.sampleRate > 192000.0)
    {
        error = "Unsupported sample rate. Use 44100 to 192000 Hz.";
        return false;
    }

    if (options.blockSize < 32 || options.blockSize > 8192)
    {
        error = "Unsupported block size. Use 32 to 8192 samples.";
        return false;
    }

    return true;
}

void writeMetadata(const juce::File& metadataFile,
                   const RenderOptions& options,
                   const PresetLoadResult& preset,
                   const juce::File& processedWav,
                   const juce::AudioFormatReader& reader,
                   int outputChannels,
                   juce::int64 totalSamples,
                   float rawInputPeak,
                   float postInputPeak,
                   float diPeak,
                   float ampPeak,
                   float finalGateGain,
                   float outputPeak)
{
    auto metadata = std::make_unique<juce::DynamicObject>();
    metadata->setProperty("schemaVersion", 1);
    metadata->setProperty("renderer", "ThallbyssalOfflineRenderer");
    metadata->setProperty("inputWav", options.input.getFullPathName());
    metadata->setProperty("presetJson", options.preset.getFullPathName());
    metadata->setProperty("presetId", options.presetId);
    metadata->setProperty("processedWav", processedWav.getFullPathName());
    metadata->setProperty("sampleRate", options.sampleRate);
    metadata->setProperty("blockSize", options.blockSize);
    metadata->setProperty("inputChannels", static_cast<int>(reader.numChannels));
    metadata->setProperty("outputChannels", outputChannels);
    metadata->setProperty("inputSamples", static_cast<double>(reader.lengthInSamples));
    metadata->setProperty("renderedSamples", static_cast<double>(totalSamples));
    metadata->setProperty("rawInputPeakLinear", rawInputPeak);
    metadata->setProperty("inputPeakLinear", postInputPeak);
    metadata->setProperty("diPeakLinear", diPeak);
    metadata->setProperty("ampPeakLinear", ampPeak);
    metadata->setProperty("outputPeakLinear", outputPeak);
    metadata->setProperty("finalGateGainLinear", finalGateGain);
    metadata->setProperty("cabIrARequested", preset.cabIrARequested);
    metadata->setProperty("cabIrBRequested", preset.cabIrBRequested);
    metadata->setProperty("cabIrALoaded", preset.cabIrARequested && preset.irA.existsAsFile());
    metadata->setProperty("cabIrBLoaded", preset.cabIrBRequested && preset.irB.existsAsFile());
    metadata->setProperty("cabIrAPath", preset.irA.getFullPathName());
    metadata->setProperty("cabIrBPath", preset.irB.getFullPathName());
    metadata->setProperty("ampEnabled", preset.parameters.ampEnabled);
    metadata->setProperty("gateEnabled", preset.parameters.gateEnabled);
    metadata->setProperty("grinderEnabled", preset.parameters.grinderEnabled);
    metadata->setProperty("ambientEnabled", preset.parameters.ambientEnabled);
    metadata->setProperty("stereoOutput", preset.parameters.stereoOutput);
    metadata->setProperty("inputGainDb", preset.parameters.inputGainDb);
    metadata->setProperty("outputGainDb", preset.parameters.outputGainDb);
    metadata->setProperty("ampDrive", preset.parameters.ampDrive);
    metadata->setProperty("ampMaster", preset.parameters.ampMaster);
    metadata->setProperty("ampOutputDb", preset.parameters.ampOutputDb);
    metadata->setProperty("grinderAmount", preset.parameters.grinderAmount);
    metadata->setProperty("palmMuteFocusHz", preset.parameters.palmMuteFocusHz);
    metadata->setProperty("gateThresholdDb", preset.parameters.gateThresholdDb);
    metadata->setProperty("gateReleaseMs", preset.parameters.gateReleaseMs);
    metadata->setProperty("diAmount", preset.parameters.diAmount);
    metadata->setProperty("diSmooth", preset.parameters.diSmooth);
    metadata->setProperty("cabBlend", preset.parameters.cabBlend);
    metadata->setProperty("cabLevel", preset.parameters.cabLevel);
    metadata->setProperty("cabLowCutHz", preset.parameters.cabLowCutHz);
    metadata->setProperty("cabHighCutHz", preset.parameters.cabHighCutHz);
    metadata->setProperty("cabSectionEnabled", preset.parameters.cabSectionEnabled);
    metadata->setProperty("cabIrEnabled", preset.parameters.cabIrEnabled);
    metadata->setProperty("dspEntrypoint", "ThallLabDspEngine::process");
    metadata->setProperty("note", "Internal local AMP_SIM_LAB render. No GUI automation. No DSP edits.");

    metadataFile.replaceWithText(juce::JSON::toString(juce::var(metadata.release()), true));
}
}

int main(int argc, char* argv[])
{
    RenderOptions options;
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

    if (!options.preset.existsAsFile())
    {
        std::cerr << "Preset JSON does not exist: " << options.preset.getFullPathName() << "\n";
        return presetError;
    }

    if (options.renderRoot.getFullPathName().isNotEmpty() && !isInsideDirectory(options.renderRoot, options.outputDirectory))
    {
        std::cerr << "Output directory must stay inside render root: " << options.renderRoot.getFullPathName() << "\n";
        return outputError;
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
        std::cerr << "Render output already exists. Refusing to overwrite: " << options.outputDirectory.getFullPathName() << "\n";
        return outputError;
    }

    juce::AudioFormatManager formatManager;
    formatManager.registerBasicFormats();

    std::unique_ptr<juce::AudioFormatReader> reader(formatManager.createReaderFor(options.input));
    if (reader == nullptr)
    {
        std::cerr << "Unsupported or unreadable input WAV: " << options.input.getFullPathName() << "\n";
        return inputError;
    }

    if (reader->numChannels < 1 || reader->numChannels > 2)
    {
        std::cerr << "Unsupported input channel count: " << static_cast<int>(reader->numChannels) << "\n";
        return inputError;
    }

    if (std::abs(reader->sampleRate - options.sampleRate) > 0.5)
    {
        std::cerr << "Input sample rate " << reader->sampleRate
                  << " does not match requested sample rate " << options.sampleRate
                  << ". Resampling is not implemented in this internal renderer.\n";
        return inputError;
    }

    juce::String presetErrorText;
    auto preset = loadPreset(options.preset, options.presetId, presetErrorText);
    if (presetErrorText.isNotEmpty())
    {
        std::cerr << presetErrorText << "\n";
        return presetError;
    }

    ThallLabDspEngine engine;
    engine.prepare(options.sampleRate, options.blockSize);
    engine.setParameters(preset.parameters);

    if (preset.cabIrARequested && !preset.irA.existsAsFile())
    {
        std::cerr << "Requested IR A does not exist: " << preset.irA.getFullPathName() << "\n";
        return presetError;
    }

    if (preset.cabIrBRequested && !preset.irB.existsAsFile())
    {
        std::cerr << "Requested IR B does not exist: " << preset.irB.getFullPathName() << "\n";
        return presetError;
    }

    if (preset.cabIrARequested && !engine.loadCabIrFile(preset.irA, 0))
    {
        std::cerr << "Failed to load IR A: " << preset.irA.getFullPathName() << "\n";
        return presetError;
    }

    if (preset.cabIrBRequested && !engine.loadCabIrFile(preset.irB, 1))
    {
        std::cerr << "Failed to load IR B: " << preset.irB.getFullPathName() << "\n";
        return presetError;
    }

    const int outputChannels = preset.parameters.stereoOutput ? 2 : 1;
    juce::WavAudioFormat wavFormat;
    std::unique_ptr<juce::FileOutputStream> outputStream(processedWav.createOutputStream());
    if (outputStream == nullptr || !outputStream->openedOk())
    {
        std::cerr << "Could not create output WAV: " << processedWav.getFullPathName() << "\n";
        return outputError;
    }

    std::unique_ptr<juce::AudioFormatWriter> writer(
        wavFormat.createWriterFor(outputStream.get(),
                                  options.sampleRate,
                                  static_cast<unsigned int>(outputChannels),
                                  24,
                                  {},
                                  0));
    if (writer == nullptr)
    {
        std::cerr << "Could not create WAV writer.\n";
        return outputError;
    }
    outputStream.release();

    juce::AudioBuffer<float> inputBuffer(static_cast<int>(reader->numChannels), options.blockSize);
    juce::AudioBuffer<float> monoBuffer(1, options.blockSize);
    juce::AudioBuffer<float> outputBuffer(outputChannels, options.blockSize);

    juce::int64 samplesRendered = 0;
    float rawInputPeak = 0.0f;
    float postInputPeak = 0.0f;
    float diPeak = 0.0f;
    float ampPeak = 0.0f;
    float finalGateGain = 0.0f;
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

        for (int sample = 0; sample < samplesThisBlock; ++sample)
            rawInputPeak = juce::jmax(rawInputPeak, std::abs(monoBuffer.getSample(0, sample)));

        auto* left = outputBuffer.getWritePointer(0);
        auto* right = outputChannels > 1 ? outputBuffer.getWritePointer(1) : left;
        engine.process(monoBuffer.getReadPointer(0), left, right, samplesThisBlock);
        postInputPeak = juce::jmax(postInputPeak, engine.getInputPeak());
        diPeak = juce::jmax(diPeak, engine.getDiPeak());
        ampPeak = juce::jmax(ampPeak, engine.getAmpPeak());
        finalGateGain = engine.getGateGain();

        for (int channel = 0; channel < outputChannels; ++channel)
        {
            for (int sample = 0; sample < samplesThisBlock; ++sample)
                outputPeak = juce::jmax(outputPeak, std::abs(outputBuffer.getSample(channel, sample)));
        }

        if (!writer->writeFromAudioSampleBuffer(outputBuffer, 0, samplesThisBlock))
        {
            std::cerr << "Failed while writing processed WAV.\n";
            return renderError;
        }

        samplesRendered += samplesThisBlock;
    }

    writeMetadata(metadataFile,
                  options,
                  preset,
                  processedWav,
                  *reader,
                  outputChannels,
                  samplesRendered,
                  rawInputPeak,
                  postInputPeak,
                  diPeak,
                  ampPeak,
                  finalGateGain,
                  outputPeak);

    std::cout << "Rendered: " << processedWav.getFullPathName() << "\n";
    std::cout << "Metadata: " << metadataFile.getFullPathName() << "\n";
    return ok;
}
