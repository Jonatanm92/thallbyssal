#include "ThallbyssalLiveV1NamChain.h"

#include "NamRuntimeAdapter.h"

#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_dsp/juce_dsp.h>

#include <algorithm>
#include <cmath>
#include <limits>
#include <vector>

namespace
{
constexpr double pi = 3.141592653589793238462643383279502884;

double decibelsToGain(double db)
{
    return std::pow(10.0, db / 20.0);
}

struct Biquad
{
    double b0 = 1.0;
    double b1 = 0.0;
    double b2 = 0.0;
    double a1 = 0.0;
    double a2 = 0.0;
    double z1 = 0.0;
    double z2 = 0.0;

    void reset()
    {
        z1 = 0.0;
        z2 = 0.0;
    }

    double process(double input)
    {
        const auto output = b0 * input + z1;
        z1 = b1 * input - a1 * output + z2;
        z2 = b2 * input - a2 * output;
        return output;
    }
};

Biquad makePeak(double sampleRate, double gainDb, double frequency, double q)
{
    const auto a = std::pow(10.0, gainDb / 40.0);
    const auto w0 = 2.0 * pi * frequency / sampleRate;
    const auto alpha = std::sin(w0) / (2.0 * q);
    const auto cosw = std::cos(w0);
    const auto b0 = 1.0 + alpha * a;
    const auto b1 = -2.0 * cosw;
    const auto b2 = 1.0 - alpha * a;
    const auto a0 = 1.0 + alpha / a;
    const auto a1 = -2.0 * cosw;
    const auto a2 = 1.0 - alpha / a;

    return { b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0 };
}

Biquad makeHighShelf(double sampleRate, double gainDb, double frequency, double q)
{
    const auto a = std::pow(10.0, gainDb / 40.0);
    const auto w0 = 2.0 * pi * frequency / sampleRate;
    const auto alpha = std::sin(w0) / (2.0 * q);
    const auto cosw = std::cos(w0);
    const auto sqrtA = std::sqrt(a);

    const auto b0 = a * ((a + 1.0) + (a - 1.0) * cosw + 2.0 * sqrtA * alpha);
    const auto b1 = -2.0 * a * ((a - 1.0) + (a + 1.0) * cosw);
    const auto b2 = a * ((a + 1.0) + (a - 1.0) * cosw - 2.0 * sqrtA * alpha);
    const auto a0 = (a + 1.0) - (a - 1.0) * cosw + 2.0 * sqrtA * alpha;
    const auto a1 = 2.0 * ((a - 1.0) - (a + 1.0) * cosw);
    const auto a2 = (a + 1.0) - (a - 1.0) * cosw - 2.0 * sqrtA * alpha;

    return { b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0 };
}

struct GrinderState
{
    double highpassState = 0.0;
    double highpassPrevious = 0.0;
    double lowState = 0.0;
    double toneState = 0.0;

    void reset()
    {
        highpassState = 0.0;
        highpassPrevious = 0.0;
        lowState = 0.0;
        toneState = 0.0;
    }
};

double processGrinderSample(double input, double sampleRate, double amountPercent, GrinderState& state)
{
    const auto amount = std::clamp(amountPercent, 0.0, 100.0) / 100.0;
    if (amount <= 0.001)
        return input;

    const auto tone = 0.52 + amount * (0.78 - 0.52);
    const auto highpassCut = 95.0 + amount * (210.0 - 95.0);
    const auto rc = 1.0 / (2.0 * pi * highpassCut);
    const auto dt = 1.0 / sampleRate;
    const auto highpassAlpha = rc / (rc + dt);
    state.highpassState = highpassAlpha * (state.highpassState + input - state.highpassPrevious);
    state.highpassPrevious = input;

    const auto sample = state.highpassState;
    const auto lowCoef = 1.0 - std::exp(-2.0 * pi * 210.0 / sampleRate);
    const auto toneCoef = 1.0 - std::exp(-2.0 * pi * (1100.0 + tone * 2100.0) / sampleRate);
    const auto comp = decibelsToGain(-0.8 + amount * (1.4 - (-0.8)));

    state.lowState += lowCoef * (sample - state.lowState);
    const auto tightened = sample - state.lowState * (0.18 + amount * 0.55);
    state.toneState += toneCoef * (tightened - state.toneState);
    const auto pick = tightened - state.toneState;
    const auto boosted = tightened * (1.0 + amount * 0.64) + pick * (0.22 + tone * 0.44);
    return std::clamp(boosted * comp, -1.4, 1.4);
}

double softDensitySample(double input, double amount)
{
    const auto drive = 1.0 + 1.2 * amount;
    const auto normaliser = std::tanh(drive);
    const auto dry = 1.0 - 0.18 * amount;
    const auto wet = 0.18 * amount;
    const auto saturated = std::tanh(input * drive) / normaliser;
    return dry * input + wet * saturated;
}

bool checkFile(const juce::File& file, const char* label, juce::String& error)
{
    if (file.existsAsFile())
        return true;

    error = juce::String(label) + " does not exist: " + file.getFullPathName();
    return false;
}

bool loadNormalisedIr(const juce::File& file,
                      double sampleRate,
                      juce::AudioBuffer<float>& irBuffer,
                      juce::String& error)
{
    juce::AudioFormatManager formatManager;
    formatManager.registerBasicFormats();

    std::unique_ptr<juce::AudioFormatReader> reader(formatManager.createReaderFor(file));
    if (reader == nullptr || reader->lengthInSamples <= 0)
    {
        error = "Could not read IR: " + file.getFullPathName();
        return false;
    }

    if (std::abs(reader->sampleRate - sampleRate) > 0.5)
    {
        error = "IR sample rate does not match live V1 sample rate: " + file.getFullPathName();
        return false;
    }

    const auto samplesToLoad = static_cast<int>(std::min<juce::int64>(reader->lengthInSamples,
                                                                      static_cast<juce::int64>(std::numeric_limits<int>::max())));
    juce::AudioBuffer<float> source(static_cast<int>(reader->numChannels), samplesToLoad);
    source.clear();
    reader->read(&source, 0, samplesToLoad, 0, true, true);

    irBuffer.setSize(1, samplesToLoad, false, false, true);
    irBuffer.clear();
    for (int channel = 0; channel < source.getNumChannels(); ++channel)
        irBuffer.addFrom(0, 0, source, channel, 0, samplesToLoad, 1.0f / static_cast<float>(source.getNumChannels()));

    auto peak = 0.0f;
    for (int sample = 0; sample < samplesToLoad; ++sample)
        peak = std::max(peak, std::abs(irBuffer.getSample(0, sample)));

    if (peak > 1.0e-8f)
        irBuffer.applyGain(1.0f / peak);

    return true;
}

bool loadConvolutionIr(juce::dsp::Convolution& convolution,
                       const juce::File& file,
                       double sampleRate,
                       int maxBlockSize,
                       juce::String& error)
{
    juce::AudioBuffer<float> irBuffer;
    if (!loadNormalisedIr(file, sampleRate, irBuffer, error))
        return false;

    convolution.loadImpulseResponse(std::move(irBuffer),
                                    sampleRate,
                                    juce::dsp::Convolution::Stereo::no,
                                    juce::dsp::Convolution::Trim::no,
                                    juce::dsp::Convolution::Normalise::no);

    const juce::dsp::ProcessSpec spec { sampleRate, static_cast<juce::uint32>(maxBlockSize), 1 };
    convolution.prepare(spec);
    convolution.reset();
    return true;
}

bool prepareNam(thallbyssal::NamRuntimeAdapter& adapter,
                const juce::File& modelFile,
                double sampleRate,
                int maxBlockSize,
                juce::String& error)
{
    if (!adapter.loadModel(modelFile.getFullPathName().toStdString()))
    {
        error = "NAM model load failed: " + juce::String(adapter.lastError());
        return false;
    }

    const auto expected = adapter.expectedSampleRate();
    if (expected > 0.0 && std::abs(expected - sampleRate) > 0.5)
    {
        error = "NAM model expected sample rate does not match live V1 sample rate: " + modelFile.getFullPathName();
        return false;
    }

    if (!adapter.prepare(sampleRate, maxBlockSize))
    {
        error = "NAM prepare failed: " + juce::String(adapter.lastError());
        return false;
    }

    return true;
}

juce::String unquotePath(juce::String path)
{
    path = path.trim();

    if (path.length() >= 2
        && ((path.startsWithChar('"') && path.endsWithChar('"'))
            || (path.startsWithChar('\'') && path.endsWithChar('\''))))
        return path.substring(1, path.length() - 1);

    return path;
}

juce::File defaultPrivateAssetConfigFile()
{
    return juce::File::getSpecialLocation(juce::File::userApplicationDataDirectory)
        .getChildFile("Thallbyssal")
        .getChildFile("private-assets.properties");
}

juce::StringPairArray readPrivateAssetOverrides()
{
    juce::StringPairArray overrides;
    auto configPath = unquotePath(juce::SystemStats::getEnvironmentVariable("THALLBYSSAL_PRIVATE_ASSET_CONFIG", ""));
    auto configFile = configPath.isNotEmpty() ? juce::File(configPath) : defaultPrivateAssetConfigFile();

    if (!configFile.existsAsFile())
        return overrides;

    for (auto line : juce::StringArray::fromLines(configFile.loadFileAsString()))
    {
        line = line.trim();
        if (line.isEmpty() || line.startsWithChar('#') || line.startsWithChar(';'))
            continue;

        const auto key = line.upToFirstOccurrenceOf("=", false, false).trim();
        const auto value = unquotePath(line.fromFirstOccurrenceOf("=", false, false));
        if (key.isNotEmpty() && value.isNotEmpty())
            overrides.set(key, value);
    }

    return overrides;
}

juce::String overrideValue(const juce::StringPairArray& overrides, const char* key)
{
    return unquotePath(overrides.getValue(key, {}));
}

juce::File choosePrivateAssetRoot(const juce::StringPairArray& overrides)
{
    const auto configRoot = overrideValue(overrides, "assetRoot");
    if (configRoot.isNotEmpty())
        return juce::File(configRoot);

    const auto envRoot = unquotePath(juce::SystemStats::getEnvironmentVariable("THALLBYSSAL_PRIVATE_ASSET_ROOT", ""));
    if (envRoot.isNotEmpty())
        return juce::File(envRoot);

    const juce::File dRoot("D:/CodexBuilds/thallbyssal-lab/founder-assets");
    if (dRoot.isDirectory())
        return dRoot;

    const juce::File cRoot("C:/CodexBuilds/thallbyssal-lab/founder-assets");
    if (cRoot.isDirectory())
        return cRoot;

    return dRoot;
}

juce::File assetPath(const juce::StringPairArray& overrides,
                     const juce::File& root,
                     const char* key,
                     const juce::String& relativePath)
{
    const auto explicitPath = overrideValue(overrides, key);
    if (explicitPath.isNotEmpty())
        return juce::File(explicitPath);

    return root.getChildFile(relativePath);
}
}

struct ThallbyssalLiveV1NamChain::Impl
{
    Config config;
    Status status;
    double sampleRate = 48000.0;
    int maxBlockSize = 0;

    thallbyssal::NamRuntimeAdapter bldogNam;
    thallbyssal::NamRuntimeAdapter hlbstNam;
    thallbyssal::NamRuntimeAdapter gojiraNam;

    juce::dsp::Convolution bldogConvolution;
    juce::dsp::Convolution hlbstConvolution;
    juce::dsp::Convolution gojiraConvolution;

    GrinderState bldogGrinder;
    GrinderState hlbstGrinder;

    Biquad bldogMid;
    Biquad bldogHigh;
    Biquad hlbstMid;
    Biquad hlbstHigh;
    Biquad centerMid;
    Biquad sideMid;

    std::vector<double> input;
    std::vector<double> pre;
    std::vector<double> namOut;
    std::vector<double> bldog;
    std::vector<double> hlbst;
    std::vector<double> gojira;
    std::vector<double> edge;
    juce::AudioBuffer<float> convolutionBuffer;

    void allocate(int samples)
    {
        input.assign(static_cast<size_t>(samples), 0.0);
        pre.assign(static_cast<size_t>(samples), 0.0);
        namOut.assign(static_cast<size_t>(samples), 0.0);
        bldog.assign(static_cast<size_t>(samples), 0.0);
        hlbst.assign(static_cast<size_t>(samples), 0.0);
        gojira.assign(static_cast<size_t>(samples), 0.0);
        edge.assign(static_cast<size_t>(samples), 0.0);
        convolutionBuffer.setSize(1, samples, false, false, true);
    }

    void resetFilters()
    {
        bldogGrinder.reset();
        hlbstGrinder.reset();
        bldogMid = makePeak(sampleRate, 2.4, 1600.0, 0.9);
        bldogHigh = makeHighShelf(sampleRate, 3.0, 4300.0, 0.707);
        hlbstMid = makePeak(sampleRate, 2.0, 1200.0, 0.9);
        hlbstHigh = makeHighShelf(sampleRate, 2.0, 4300.0, 0.707);
        centerMid = makePeak(sampleRate, 1.5, 1400.0, 0.9);
        sideMid = makePeak(sampleRate, 1.5, 1400.0, 0.9);
    }

    bool runNam(thallbyssal::NamRuntimeAdapter& adapter, int numSamples, juce::String& error)
    {
        if (!adapter.processBlock(pre.data(), namOut.data(), numSamples))
        {
            error = "NAM process failed: " + juce::String(adapter.lastError());
            return false;
        }

        return true;
    }

    void runConvolution(juce::dsp::Convolution& convolution, int numSamples)
    {
        convolutionBuffer.clear();
        auto* write = convolutionBuffer.getWritePointer(0);
        for (int sample = 0; sample < numSamples; ++sample)
            write[sample] = static_cast<float>(namOut[static_cast<size_t>(sample)]);

        juce::dsp::AudioBlock<float> block(convolutionBuffer);
        juce::dsp::ProcessContextReplacing<float> context(block);
        convolution.process(context);
    }

    bool processBigBottomBranch(thallbyssal::NamRuntimeAdapter& adapter,
                                juce::dsp::Convolution& convolution,
                                GrinderState& grinder,
                                Biquad& mid,
                                Biquad& high,
                                double grinderAmount,
                                double driveDb,
                                std::vector<double>& destination,
                                int numSamples,
                                juce::String& error)
    {
        const auto drive = decibelsToGain(driveDb);
        for (int sample = 0; sample < numSamples; ++sample)
            pre[static_cast<size_t>(sample)] = processGrinderSample(input[static_cast<size_t>(sample)] * drive,
                                                                    sampleRate,
                                                                    grinderAmount,
                                                                    grinder);

        if (!runNam(adapter, numSamples, error))
            return false;

        runConvolution(convolution, numSamples);

        const auto* convolved = convolutionBuffer.getReadPointer(0);
        for (int sample = 0; sample < numSamples; ++sample)
        {
            auto value = static_cast<double>(convolved[sample]);
            value = mid.process(value);
            value = high.process(value);
            destination[static_cast<size_t>(sample)] = softDensitySample(value, 0.42);
        }

        return true;
    }

    bool processGojiraBranch(int numSamples, juce::String& error)
    {
        const auto drive = decibelsToGain(6.0);
        for (int sample = 0; sample < numSamples; ++sample)
            pre[static_cast<size_t>(sample)] = std::clamp(input[static_cast<size_t>(sample)] * drive, -4.0, 4.0);

        if (!runNam(gojiraNam, numSamples, error))
            return false;

        runConvolution(gojiraConvolution, numSamples);

        const auto* convolved = convolutionBuffer.getReadPointer(0);
        const auto gojiraGain = decibelsToGain(config.gojiraGainDb);
        for (int sample = 0; sample < numSamples; ++sample)
            gojira[static_cast<size_t>(sample)] = static_cast<double>(convolved[sample]) * gojiraGain;

        return true;
    }
};

ThallbyssalLiveV1NamChain::Config ThallbyssalLiveV1NamChain::Config::localPrivateDefaults()
{
    const auto overrides = readPrivateAssetOverrides();
    const auto root = choosePrivateAssetRoot(overrides);

    Config config;
    config.bigBottomModel = assetPath(overrides, root, "bigBottomModel", "nam-models/Big Bottom Thall no cab.nam");
    config.gojiraModel = assetPath(overrides, root, "gojiraModel", "nam-models/tone3000-candidates/tone3000-gojira-evh-5150iii-a1.nam");
    config.bldogIr = assetPath(overrides, root, "bldogIr", "irs/Extra intressanta IR/V1LDHJARTA-MUV-1 - AA-BLDOG R.wav");
    config.hlbstIr = assetPath(overrides, root, "hlbstIr", "irs/Extra intressanta IR/V1LDHJARTA-MUV-1 - AA-HLBST-LDF.wav");
    config.gojiraIr = assetPath(overrides, root, "gojiraIr", "irs/tone3000-candidates/tone3000-gojira-ir.wav");
    return config;
}

ThallbyssalLiveV1NamChain::ThallbyssalLiveV1NamChain()
    : impl(std::make_unique<Impl>())
{
}

ThallbyssalLiveV1NamChain::~ThallbyssalLiveV1NamChain() = default;

bool ThallbyssalLiveV1NamChain::prepare(const Config& config, double newSampleRate, int newMaxBlockSize, juce::String& error)
{
    impl->status = {};
    impl->config = config;
    impl->sampleRate = newSampleRate;
    impl->maxBlockSize = newMaxBlockSize;

    if (std::abs(newSampleRate - 48000.0) > 0.5)
    {
        error = "Live V1 NAM chain is currently scoped to 48000 Hz.";
        impl->status.lastError = error;
        return false;
    }

    if (newMaxBlockSize <= 0)
    {
        error = "Live V1 NAM chain max block size must be positive.";
        impl->status.lastError = error;
        return false;
    }

    if (!checkFile(config.bigBottomModel, "Big Bottom NAM model", error)
        || !checkFile(config.gojiraModel, "Gojira NAM model", error)
        || !checkFile(config.bldogIr, "BLDOG IR", error)
        || !checkFile(config.hlbstIr, "HLBST IR", error)
        || !checkFile(config.gojiraIr, "Gojira IR", error))
    {
        impl->status.lastError = error;
        return false;
    }

    if (!prepareNam(impl->bldogNam, config.bigBottomModel, newSampleRate, newMaxBlockSize, error)
        || !prepareNam(impl->hlbstNam, config.bigBottomModel, newSampleRate, newMaxBlockSize, error)
        || !prepareNam(impl->gojiraNam, config.gojiraModel, newSampleRate, newMaxBlockSize, error))
    {
        impl->status.lastError = error;
        return false;
    }

    impl->status.bigBottomBldogLoaded = impl->bldogNam.isLoaded() && impl->bldogNam.isPrepared();
    impl->status.bigBottomHlbstLoaded = impl->hlbstNam.isLoaded() && impl->hlbstNam.isPrepared();
    impl->status.gojiraLoaded = impl->gojiraNam.isLoaded() && impl->gojiraNam.isPrepared();

    if (!loadConvolutionIr(impl->bldogConvolution, config.bldogIr, newSampleRate, newMaxBlockSize, error)
        || !loadConvolutionIr(impl->hlbstConvolution, config.hlbstIr, newSampleRate, newMaxBlockSize, error)
        || !loadConvolutionIr(impl->gojiraConvolution, config.gojiraIr, newSampleRate, newMaxBlockSize, error))
    {
        impl->status.lastError = error;
        return false;
    }

    impl->status.irsLoaded = true;
    impl->allocate(newMaxBlockSize);
    impl->resetFilters();
    impl->status.ready = true;
    impl->status.sampleRate = newSampleRate;
    impl->status.maxBlockSize = newMaxBlockSize;
    impl->status.lastError = {};
    return true;
}

void ThallbyssalLiveV1NamChain::reset()
{
    impl->bldogConvolution.reset();
    impl->hlbstConvolution.reset();
    impl->gojiraConvolution.reset();
    impl->resetFilters();

    if (impl->bldogNam.isLoaded())
        (void) impl->bldogNam.prepare(impl->sampleRate, impl->maxBlockSize);
    if (impl->hlbstNam.isLoaded())
        (void) impl->hlbstNam.prepare(impl->sampleRate, impl->maxBlockSize);
    if (impl->gojiraNam.isLoaded())
        (void) impl->gojiraNam.prepare(impl->sampleRate, impl->maxBlockSize);
}

bool ThallbyssalLiveV1NamChain::process(const float* monoInput,
                                        float* leftOutput,
                                        float* rightOutput,
                                        int numSamples,
                                        juce::String& error)
{
    if (!impl->status.ready)
    {
        error = "Live V1 NAM chain is not ready.";
        impl->status.lastError = error;
        return false;
    }

    if (monoInput == nullptr || leftOutput == nullptr || rightOutput == nullptr)
    {
        error = "Live V1 NAM chain received null buffers.";
        impl->status.lastError = error;
        return false;
    }

    if (numSamples <= 0 || numSamples > impl->maxBlockSize)
    {
        error = "Live V1 NAM chain block size is outside the prepared range.";
        impl->status.lastError = error;
        return false;
    }

    for (int sample = 0; sample < numSamples; ++sample)
        impl->input[static_cast<size_t>(sample)] = static_cast<double>(monoInput[sample]);

    if (!impl->processBigBottomBranch(impl->bldogNam,
                                      impl->bldogConvolution,
                                      impl->bldogGrinder,
                                      impl->bldogMid,
                                      impl->bldogHigh,
                                      82.0,
                                      12.0,
                                      impl->bldog,
                                      numSamples,
                                      error)
        || !impl->processBigBottomBranch(impl->hlbstNam,
                                         impl->hlbstConvolution,
                                         impl->hlbstGrinder,
                                         impl->hlbstMid,
                                         impl->hlbstHigh,
                                         72.0,
                                         12.0,
                                         impl->hlbst,
                                         numSamples,
                                         error)
        || !impl->processGojiraBranch(numSamples, error))
    {
        impl->status.lastError = error;
        return false;
    }

    const auto bldogGain = decibelsToGain(impl->config.bldogGainDb);
    const auto edgeGain = decibelsToGain(impl->config.edgeGainDb);
    const auto finalGain = decibelsToGain(impl->config.finalGainDb);

    for (int sample = 0; sample < numSamples; ++sample)
    {
        const auto index = static_cast<size_t>(sample);
        const auto bldogMatched = impl->bldog[index] * bldogGain;
        impl->edge[index] = (impl->hlbst[index] * 0.88 + impl->gojira[index] * 0.12) * edgeGain;

        auto center = 0.64 * bldogMatched + 0.36 * impl->edge[index];
        auto side = bldogMatched - impl->edge[index];
        center = impl->centerMid.process(center);
        side = impl->sideMid.process(side) * 0.22;

        const auto left = (center + side) * finalGain;
        const auto right = (center - side) * finalGain;

        if (!std::isfinite(left) || !std::isfinite(right))
        {
            error = "Live V1 NAM chain produced a non-finite sample.";
            impl->status.lastError = error;
            return false;
        }

        if (leftOutput == rightOutput)
            leftOutput[sample] = static_cast<float>((left + right) * 0.5);
        else
        {
            leftOutput[sample] = static_cast<float>(left);
            rightOutput[sample] = static_cast<float>(right);
        }
    }

    impl->status.lastError = {};
    return true;
}

bool ThallbyssalLiveV1NamChain::isReady() const noexcept
{
    return impl->status.ready;
}

const ThallbyssalLiveV1NamChain::Status& ThallbyssalLiveV1NamChain::getStatus() const noexcept
{
    return impl->status;
}

const ThallbyssalLiveV1NamChain::Config& ThallbyssalLiveV1NamChain::getConfig() const noexcept
{
    return impl->config;
}
