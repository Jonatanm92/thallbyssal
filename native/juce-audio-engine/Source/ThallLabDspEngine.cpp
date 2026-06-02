#include "ThallLabDspEngine.h"

namespace
{
float onePoleCoefficient(float frequency, double sampleRate)
{
    return 1.0f - std::exp(-2.0f * juce::MathConstants<float>::pi * frequency / static_cast<float>(sampleRate));
}

float highpassSample(float sample, float cutoff, double sampleRate, float& state, float& inputState)
{
    const auto rc = 1.0f / (2.0f * juce::MathConstants<float>::pi * cutoff);
    const auto dt = 1.0f / static_cast<float>(sampleRate);
    const auto alpha = rc / (rc + dt);
    state = alpha * (state + sample - inputState);
    inputState = sample;
    return state;
}

float softLimitOutput(float sample)
{
    constexpr auto outputCeiling = 0.96f;
    constexpr auto limiterDrive = 1.35f;
    const auto limited = std::tanh(sample * limiterDrive) / std::tanh(limiterDrive);
    return juce::jlimit(-outputCeiling, outputCeiling, limited * outputCeiling);
}
}

void ThallLabDspEngine::prepare(double newSampleRate, int maxBlockSize)
{
    sampleRate = newSampleRate > 0.0 ? newSampleRate : 48000.0;
    maximumBlockSize = juce::jmax(32, maxBlockSize);
    diBuffer.setSize(1, maximumBlockSize);
    ampBuffer.setSize(1, maximumBlockSize);
    cabBufferA.setSize(1, maximumBlockSize);
    cabBufferB.setSize(1, maximumBlockSize);
    cabMixBuffer.setSize(1, maximumBlockSize);
    transposeDelayBuffer.setSize(1, static_cast<int>(sampleRate * 0.22));
    cleanDelayBuffer.setSize(1, static_cast<int>(sampleRate * 2.0));
    cleanEchoBuffer.setSize(1, static_cast<int>(sampleRate * 3.0));
    cleanReverbBuffer.setSize(1, static_cast<int>(sampleRate * 2.5));
    ambientDelayBuffer.setSize(1, static_cast<int>(sampleRate * 2.5));

    prepareCabConvolution(cabConvolutionA);
    prepareCabConvolution(cabConvolutionB);
    reset();
}

void ThallLabDspEngine::prepareCabConvolution(juce::dsp::Convolution& convolution)
{
    juce::dsp::ProcessSpec spec;
    spec.sampleRate = sampleRate;
    spec.maximumBlockSize = static_cast<juce::uint32>(maximumBlockSize);
    spec.numChannels = 1;
    convolution.prepare(spec);
}

void ThallLabDspEngine::reset()
{
    ampLowpassState = 0.0f;
    ampHighpassState = 0.0f;
    ampHighpassInputState = 0.0f;
    diHighpassState = 0.0f;
    diHighpassInputState = 0.0f;
    diLowState = 0.0f;
    diBiteState = 0.0f;
    gateEnvelope = 0.0f;
    gateGain = 0.0f;
    grinderHighpassState = 0.0f;
    grinderHighpassInputState = 0.0f;
    grinderLowState = 0.0f;
    grinderToneState = 0.0f;
    cabHighpassState = 0.0f;
    cabHighpassInputState = 0.0f;
    cabLowpassState = 0.0f;
    cabResonanceState = 0.0f;
    transposeDelayBuffer.clear();
    transposeWritePosition = 0;
    transposePhase = 0.0f;
    octaveLayerPhase = 0.5f;
    transposeTransientState = 0.0f;
    palmMuteLowState = 0.0f;
    palmMuteEnvelope = 0.0f;
    palmMuteHighpassState = 0.0f;
    palmMuteHighpassInputState = 0.0f;
    ampBodyState = 0.0f;
    ampMidState = 0.0f;
    ampTrebleState = 0.0f;
    ampPresenceState = 0.0f;
    ampCompressorEnvelope = 0.0f;
    cleanDelayBuffer.clear();
    cleanEchoBuffer.clear();
    cleanReverbBuffer.clear();
    cleanDelayWritePosition = 0;
    cleanEchoWritePosition = 0;
    cleanReverbWritePosition = 0;
    cleanToneState = 0.0f;
    cleanFeedbackState = 0.0f;
    cleanLowState = 0.0f;
    cleanMidState = 0.0f;
    cleanPresenceState = 0.0f;
    cleanReverbDampState = 0.0f;
    ambientDelayBuffer.clear();
    ambientDelayWritePosition = 0;
    ambientFeedbackState = 0.0f;
    ambientShimmerState = 0.0f;
    ambientReverseState = 0.0f;
    ambientToneState = 0.0f;
    ambientGrainPhase = 0.0f;
    ambientStutterPhase = 0.0f;
    ambientRingPhase = 0.0f;
    outputStereoState = 0.0f;
}

void ThallLabDspEngine::setParameters(const Parameters& newParameters)
{
    parameters = newParameters;
}

bool ThallLabDspEngine::loadCabIrFile(const juce::File& file)
{
    return loadCabIrFile(file, 0);
}

bool ThallLabDspEngine::loadCabIrFile(const juce::File& file, int slot)
{
    if (!file.existsAsFile())
        return false;

    juce::AudioFormatManager formatManager;
    formatManager.registerBasicFormats();

    std::unique_ptr<juce::AudioFormatReader> reader(formatManager.createReaderFor(file));
    if (reader == nullptr || reader->lengthInSamples <= 0)
        return false;

    const auto samplesToLoad = static_cast<int>(
        juce::jmin<juce::int64>(reader->lengthInSamples, static_cast<juce::int64>(sampleRate * 2.0)));
    juce::AudioBuffer<float> irBuffer(1, samplesToLoad);

    juce::AudioBuffer<float> sourceBuffer(static_cast<int>(reader->numChannels), samplesToLoad);
    reader->read(&sourceBuffer, 0, samplesToLoad, 0, true, true);

    irBuffer.clear();
    for (int channel = 0; channel < sourceBuffer.getNumChannels(); ++channel)
        irBuffer.addFrom(0, 0, sourceBuffer, channel, 0, samplesToLoad, 1.0f / static_cast<float>(sourceBuffer.getNumChannels()));

    normaliseCabIrBuffer(irBuffer);

    auto& convolution = slot == 1 ? cabConvolutionB : cabConvolutionA;
    convolution.loadImpulseResponse(std::move(irBuffer),
                                    reader->sampleRate,
                                    juce::dsp::Convolution::Stereo::no,
                                    juce::dsp::Convolution::Trim::yes,
                                    juce::dsp::Convolution::Normalise::no);
    prepareCabConvolution(convolution);

    if (slot == 1)
        cabIrBLoaded = true;
    else
        cabIrALoaded = true;

    convolution.reset();
    return true;
}

void ThallLabDspEngine::clearCabIr()
{
    clearCabIr(0);
    clearCabIr(1);
}

void ThallLabDspEngine::clearCabIr(int slot)
{
    if (slot == 1)
    {
        cabIrBLoaded = false;
        cabConvolutionB.reset();
        return;
    }

    cabIrALoaded = false;
    cabConvolutionA.reset();
}

void ThallLabDspEngine::normaliseCabIrBuffer(juce::AudioBuffer<float>& buffer)
{
    if (buffer.getNumChannels() <= 0 || buffer.getNumSamples() <= 0)
        return;

    double sum = 0.0;
    float peak = 0.0f;
    for (int sampleIndex = 0; sampleIndex < buffer.getNumSamples(); ++sampleIndex)
    {
        const auto sample = buffer.getSample(0, sampleIndex);
        sum += sample;
        peak = juce::jmax(peak, std::abs(sample));
    }

    const auto dcOffset = static_cast<float>(sum / static_cast<double>(buffer.getNumSamples()));
    double energy = 0.0;
    for (int sampleIndex = 0; sampleIndex < buffer.getNumSamples(); ++sampleIndex)
    {
        const auto corrected = buffer.getSample(0, sampleIndex) - dcOffset;
        buffer.setSample(0, sampleIndex, corrected);
        energy += static_cast<double>(corrected) * static_cast<double>(corrected);
    }

    const auto rms = static_cast<float>(std::sqrt(energy / static_cast<double>(buffer.getNumSamples())));
    peak = buffer.getMagnitude(0, buffer.getNumSamples());
    if (peak <= 0.000001f)
        return;

    const auto peakGain = 0.86f / peak;
    const auto energyGain = rms > 0.000001f ? 0.075f / rms : peakGain;
    const auto gain = juce::jlimit(0.12f, 8.0f, juce::jmin(peakGain, energyGain));
    buffer.applyGain(gain);
}

void ThallLabDspEngine::process(const float* input, float* left, float* right, int numSamples)
{
    const auto inputGain = juce::Decibels::decibelsToGain(parameters.inputGainDb);
    const auto outputGain = juce::Decibels::decibelsToGain(parameters.outputGainDb);
    const auto samplesToProcess = juce::jmin(numSamples, ampBuffer.getNumSamples());
    auto* diSamples = diBuffer.getWritePointer(0);
    auto* ampSamples = ampBuffer.getWritePointer(0);

    lastInputPeak = 0.0f;
    lastDiPeak = 0.0f;
    lastAmpPeak = 0.0f;
    lastOutputPeak = 0.0f;

    for (int sampleIndex = 0; sampleIndex < samplesToProcess; ++sampleIndex)
    {
        const auto rawInput = input != nullptr ? input[sampleIndex] * inputGain : 0.0f;
        const auto transposed = processTranspose(rawInput);
        const auto palmCaught = processPalmMuteCatcher(transposed);
        const auto rigDriveMakeup = 0.95f;
        const auto rigInput = palmCaught * rigDriveMakeup;
        const auto gated = processNoiseGate(rigInput);
        const auto ground = processGrinder(gated);
        const auto sculpted = processDiSculpt(ground);
        const auto amped = parameters.ampEnabled ? processAmp(sculpted) : sculpted;

        lastInputPeak = juce::jmax(lastInputPeak, std::abs(rawInput));
        lastDiPeak = juce::jmax(lastDiPeak, std::abs(sculpted));
        lastAmpPeak = juce::jmax(lastAmpPeak, std::abs(amped));

        diSamples[sampleIndex] = sculpted;
        ampSamples[sampleIndex] = amped;
    }

    processCabIrMix(samplesToProcess);
    auto* cabSamples = cabMixBuffer.getWritePointer(0);
    const auto canWriteStereo = parameters.stereoOutput && right != left;
    const auto stereoCoef = onePoleCoefficient(420.0f, sampleRate);

    for (int sampleIndex = 0; sampleIndex < samplesToProcess; ++sampleIndex)
    {
        const auto cabbed = parameters.cabSectionEnabled
                                 ? processCabFilter(cabSamples[sampleIndex]) * juce::Decibels::decibelsToGain(parameters.cabLevel)
                                 : cabSamples[sampleIndex];
        const auto clean = processCleanSpace(diSamples[sampleIndex], cabbed);
        const auto ambient = processAmbient(diSamples[sampleIndex], cabbed + clean);
        const auto mixed = softLimitOutput((cabbed + clean + ambient) * outputGain);

        if (canWriteStereo)
        {
            outputStereoState += stereoCoef * (mixed - outputStereoState);
            const auto transientSide = mixed - outputStereoState;
            const auto spaceSide = ambient * 0.34f + clean * 0.16f + transientSide * 0.08f;
            const auto side = juce::jlimit(-0.22f, 0.22f, spaceSide);
            const auto leftSample = softLimitOutput(mixed - side);
            const auto rightSample = softLimitOutput(mixed + side);

            left[sampleIndex] = leftSample;
            right[sampleIndex] = rightSample;
            lastOutputPeak = juce::jmax(lastOutputPeak, juce::jmax(std::abs(leftSample), std::abs(rightSample)));
        }
        else
        {
            left[sampleIndex] = mixed;
            right[sampleIndex] = mixed;
            lastOutputPeak = juce::jmax(lastOutputPeak, std::abs(mixed));
        }
    }

    for (int sampleIndex = samplesToProcess; sampleIndex < numSamples; ++sampleIndex)
    {
        left[sampleIndex] = 0.0f;
        right[sampleIndex] = 0.0f;
    }
}

float ThallLabDspEngine::getInputPeak() const
{
    return lastInputPeak;
}

float ThallLabDspEngine::getDiPeak() const
{
    return lastDiPeak;
}

float ThallLabDspEngine::getAmpPeak() const
{
    return lastAmpPeak;
}

float ThallLabDspEngine::getOutputPeak() const
{
    return lastOutputPeak;
}

float ThallLabDspEngine::getGateGain() const
{
    return gateGain;
}

bool ThallLabDspEngine::hasCabIr() const
{
    return cabIrALoaded || cabIrBLoaded;
}

bool ThallLabDspEngine::hasCabIr(int slot) const
{
    return slot == 1 ? cabIrBLoaded : cabIrALoaded;
}

float ThallLabDspEngine::processTranspose(float sample)
{
    if (transposeDelayBuffer.getNumSamples() < 512)
        return sample;

    transposeDelayBuffer.setSample(0, transposeWritePosition, sample);

    const auto semitones = juce::jlimit(-24.0f, 24.0f, parameters.transposeSemitones);
    auto output = sample;
    if (std::abs(semitones) >= 0.01f)
        output = renderPitchShift(semitones, transposePhase);

    transposeTransientState += onePoleCoefficient(950.0f, sampleRate) * (sample - transposeTransientState);
    const auto transposeTransient = sample - transposeTransientState;
    const auto transposeTransientBlend = juce::jlimit(0.0f, 0.22f, std::abs(semitones) / 24.0f * 0.18f);
    output += transposeTransient * transposeTransientBlend;

    if (semitones < 0.0f)
    {
        const auto transposeLevelCompensationDb = juce::jlimit(0.0f, 5.5f, -semitones * 0.23f);
        output *= juce::Decibels::decibelsToGain(transposeLevelCompensationDb);
    }

    const auto layerBlend = juce::jlimit(0.0f, 1.0f, parameters.octaveLayerBlend / 100.0f);
    if (layerBlend > 0.001f)
    {
        const auto layerSemitones = juce::jlimit(-24.0f, 24.0f, semitones - 12.0f);
        const auto layer = renderPitchShift(layerSemitones, octaveLayerPhase);
        output = juce::jlimit(-1.25f, 1.25f, output + layer * layerBlend * 0.72f);
    }

    transposeWritePosition = (transposeWritePosition + 1) % transposeDelayBuffer.getNumSamples();
    return output;
}

float ThallLabDspEngine::renderPitchShift(float semitones, float& phase)
{
    const auto ratio = std::pow(2.0f, semitones / 12.0f);
    const auto fastSweepSamples = static_cast<float>(sampleRate) * 0.024f;
    const auto sweepSamples = juce::jlimit(420.0f,
                                           static_cast<float>(transposeDelayBuffer.getNumSamples() - 96),
                                           fastSweepSamples);
    const auto minDelaySamples = 28.0f;
    const auto phaseIncrement = juce::jlimit(0.00005f, 0.030f, std::abs(1.0f - ratio) / juce::jmax(1.0f, sweepSamples * 0.78f));

    auto readForPhase = [this, semitones, minDelaySamples, sweepSamples](float tapPhase)
    {
        const auto sweepPhase = semitones > 0.0f ? 1.0f - tapPhase : tapPhase;
        return readTransposeDelay(minDelaySamples + sweepPhase * sweepSamples);
    };

    const auto phaseA = phase;
    auto phaseB = phase + 0.5f;
    if (phaseB >= 1.0f)
        phaseB -= 1.0f;

    const auto windowA = std::sin(phaseA * juce::MathConstants<float>::pi);
    const auto windowB = std::sin(phaseB * juce::MathConstants<float>::pi);
    const auto shifted = (readForPhase(phaseA) * windowA + readForPhase(phaseB) * windowB)
                         / juce::jmax(0.001f, windowA + windowB);

    phase += phaseIncrement;
    if (phase >= 1.0f)
        phase -= std::floor(phase);

    return shifted;
}

float ThallLabDspEngine::readTransposeDelay(float delaySamples) const
{
    const auto bufferSize = transposeDelayBuffer.getNumSamples();
    if (bufferSize <= 1)
        return 0.0f;

    auto readPosition = static_cast<float>(transposeWritePosition) - delaySamples;
    while (readPosition < 0.0f)
        readPosition += static_cast<float>(bufferSize);
    while (readPosition >= static_cast<float>(bufferSize))
        readPosition -= static_cast<float>(bufferSize);

    const auto indexA = static_cast<int>(readPosition);
    const auto indexB = (indexA + 1) % bufferSize;
    const auto fraction = readPosition - static_cast<float>(indexA);
    const auto sampleA = transposeDelayBuffer.getSample(0, indexA);
    const auto sampleB = transposeDelayBuffer.getSample(0, indexB);
    return sampleA + (sampleB - sampleA) * fraction;
}

float ThallLabDspEngine::processPalmMuteCatcher(float sample)
{
    const auto amount = juce::jlimit(0.0f, 1.0f, parameters.palmMuteAmount / 100.0f);
    if (amount <= 0.001f)
        return sample;

    const auto sensitivity = juce::jmap(amount, 0.22f, 0.86f);
    const auto tightness = juce::jmap(amount, 0.32f, 0.88f);
    const auto click = juce::jmap(amount, 0.22f, 0.72f);
    const auto level = juce::Decibels::decibelsToGain(juce::jmap(amount, 0.0f, 1.0f, -0.7f, 1.2f));
    const auto focusHz = juce::jlimit(30.0f, 2500.0f, parameters.palmMuteFocusHz);
    const auto focusNorm = juce::jlimit(0.0f,
                                        1.0f,
                                        std::log(focusHz / 30.0f) / std::log(2500.0f / 30.0f));
    const auto bodyFollowHz = juce::jlimit(35.0f, 360.0f, 55.0f + focusHz * 0.10f + tightness * 80.0f);

    palmMuteLowState += onePoleCoefficient(bodyFollowHz, sampleRate) * (sample - palmMuteLowState);
    const auto lowBody = palmMuteLowState;
    const auto transient = highpassSample(sample, focusHz, sampleRate, palmMuteHighpassState, palmMuteHighpassInputState);

    const auto detector = std::abs(lowBody) * (1.4f + sensitivity * 4.2f)
                          + std::abs(transient) * (0.24f + click * (0.82f + focusNorm * 0.58f));
    const auto threshold = juce::jmap(sensitivity, 0.0f, 1.0f, 0.46f, 0.055f);
    const auto target = juce::jlimit(0.0f, 1.0f, (detector - threshold) / juce::jmax(0.001f, threshold * 2.4f));
    const auto attack = 0.30f + sensitivity * 0.28f;
    const auto release = 0.012f + tightness * 0.050f;
    palmMuteEnvelope += (target - palmMuteEnvelope) * (target > palmMuteEnvelope ? attack : release);

    const auto lowTightened = sample - lowBody * palmMuteEnvelope * (0.24f + tightness * 0.72f);
    const auto clickLift = transient * palmMuteEnvelope * (0.10f + click * (0.36f + focusNorm * 0.32f));
    const auto controlledBody = lowBody * palmMuteEnvelope * (1.0f - tightness) * 0.07f;
    return juce::jlimit(-1.25f, 1.25f, (lowTightened + clickLift + controlledBody) * level);
}

float ThallLabDspEngine::processNoiseGate(float sample)
{
    if (!parameters.gateEnabled)
    {
        gateGain = 1.0f;
        return sample;
    }

    const auto threshold = juce::Decibels::decibelsToGain(parameters.gateThresholdDb);
    const auto attackCoeff = onePoleCoefficient(420.0f, sampleRate);
    const auto releaseMs = juce::jlimit(8.0f, 220.0f, parameters.gateReleaseMs);
    const auto releaseCoeff = 1.0f - std::exp(-1.0f / (0.001f * releaseMs * static_cast<float>(sampleRate)));
    const auto targetEnvelope = std::abs(sample);
    gateEnvelope += (targetEnvelope - gateEnvelope) * (targetEnvelope > gateEnvelope ? attackCoeff : releaseCoeff);

    const auto openAmount = juce::jlimit(0.0f, 1.0f, (gateEnvelope - threshold * 0.45f) / juce::jmax(0.000001f, threshold * 0.9f));
    const auto targetGain = openAmount * openAmount * (3.0f - 2.0f * openAmount);
    gateGain += (targetGain - gateGain) * (targetGain > gateGain ? 0.58f : releaseCoeff);

    return sample * gateGain;
}

float ThallLabDspEngine::processGrinder(float sample)
{
    if (!parameters.grinderEnabled)
        return sample;

    const auto amount = juce::jlimit(0.0f, 100.0f, parameters.grinderAmount) / 100.0f;
    if (amount <= 0.001f)
        return sample;

    const auto tone = juce::jmap(amount, 0.0f, 1.0f, 0.52f, 0.78f);
    const auto highpassCut = juce::jmap(amount, 0.0f, 1.0f, 95.0f, 210.0f);
    const auto high = highpassSample(sample, highpassCut, sampleRate, grinderHighpassState, grinderHighpassInputState);

    grinderLowState += onePoleCoefficient(210.0f, sampleRate) * (high - grinderLowState);
    const auto tightened = high - grinderLowState * (0.18f + amount * 0.55f);

    grinderToneState += onePoleCoefficient(1100.0f + tone * 2100.0f, sampleRate) * (tightened - grinderToneState);
    const auto pick = tightened - grinderToneState;
    const auto boosted = tightened * (1.0f + amount * 0.64f) + pick * (0.22f + tone * 0.44f);
    const auto grinderOutputCompensation = juce::Decibels::decibelsToGain(juce::jmap(amount, 0.0f, 1.0f, -0.8f, 1.4f));

    return juce::jlimit(-1.4f, 1.4f, boosted * grinderOutputCompensation);
}

float ThallLabDspEngine::processDiSculpt(float sample)
{
    const auto amount = juce::jlimit(0.0f, 100.0f, parameters.diAmount) / 100.0f;
    const auto smooth = juce::jlimit(0.0f, 100.0f, parameters.diSmooth) / 100.0f;
    if (amount <= 0.001f)
        return sample;

    const auto smoothGentle = smooth * 0.24f;
    const auto dryBlend = 1.0f - amount;
    const auto lowControlHz = 105.0f + amount * 92.0f;
    diLowState += onePoleCoefficient(lowControlHz, sampleRate) * (sample - diLowState);
    const auto body = diLowState;
    const auto bodyTighten = body * amount * (0.035f + (1.0f - smoothGentle) * 0.105f);
    const auto lowControlled = sample - bodyTighten;

    const auto upperFocus = highpassSample(sample,
                                           460.0f + amount * 1050.0f,
                                           sampleRate,
                                           diHighpassState,
                                           diHighpassInputState);
    diBiteState += onePoleCoefficient(760.0f + amount * 2600.0f + smoothGentle * 900.0f, sampleRate) * (upperFocus - diBiteState);
    const auto pickEdge = upperFocus - diBiteState;
    const auto bite = std::tanh(pickEdge * (1.4f + amount * 4.2f)) * amount * (0.08f + (1.0f - smoothGentle) * 0.24f);
    const auto presence = upperFocus * amount * (0.035f + (1.0f - smoothGentle) * 0.11f);
    const auto diSculptToneMatch = lowControlled + bite + presence;

    return juce::jlimit(-1.35f, 1.35f, sample * dryBlend + diSculptToneMatch * amount);
}

float ThallLabDspEngine::processAmp(float sample)
{
    const auto drive = juce::jmax(1.0f, parameters.ampDrive);
    const auto driveNorm = juce::jlimit(0.0f, 1.0f, (drive - 1.0f) / 11.0f);
    const auto bass = juce::jlimit(0.0f, 100.0f, parameters.ampBass) / 100.0f;
    const auto mid = juce::jlimit(0.0f, 100.0f, parameters.ampMid) / 100.0f;
    const auto treble = juce::jlimit(0.0f, 100.0f, parameters.ampTreble) / 100.0f;
    const auto presence = juce::jlimit(0.0f, 100.0f, parameters.ampPresence) / 100.0f;
    const auto master = juce::jlimit(0.0f, 100.0f, parameters.ampMaster) / 100.0f;
    const auto output = juce::Decibels::decibelsToGain(parameters.ampOutputDb);

    const auto highpassCut = juce::jmap(bass, 0.0f, 1.0f, 125.0f, 62.0f);
    const auto highpassed = highpassSample(sample, highpassCut, sampleRate, ampHighpassState, ampHighpassInputState);

    const auto ampPreSaturationLevel = 3.55f + std::pow(driveNorm, 1.14f) * 10.7f;
    const auto stageA = std::tanh(highpassed * ampPreSaturationLevel);
    const auto stageBInput = stageA * (1.18f + mid * 0.56f) + stageA * stageA * stageA * (0.12f + driveNorm * 0.18f);
    const auto shaped = std::tanh(stageBInput * (1.16f + driveNorm * 1.92f));

    ampLowpassState += onePoleCoefficient(3100.0f + treble * 4300.0f, sampleRate) * (shaped - ampLowpassState);
    ampBodyState += onePoleCoefficient(115.0f, sampleRate) * (shaped - ampBodyState);
    ampMidState += onePoleCoefficient(720.0f, sampleRate) * (shaped - ampMidState);
    ampTrebleState += onePoleCoefficient(2200.0f + treble * 1700.0f, sampleRate) * (shaped - ampTrebleState);
    ampPresenceState += onePoleCoefficient(3600.0f + presence * 2600.0f, sampleRate) * (shaped - ampPresenceState);

    const auto ampToneAuthority = 1.08f + (1.0f - driveNorm) * 0.22f;
    const auto lows = ampBodyState * juce::jmap(bass, 0.0f, 1.0f, -0.42f, 0.34f) * ampToneAuthority;
    const auto mids = (ampMidState - ampBodyState) * juce::jmap(mid, 0.0f, 1.0f, -0.52f, 0.48f) * ampToneAuthority;
    const auto highs = (ampTrebleState - ampMidState) * (0.06f + treble * 0.54f) * ampToneAuthority;
    const auto air = (shaped - ampPresenceState) * (0.06f + presence * 0.74f) * ampToneAuthority;
    const auto focusedCore = ampLowpassState * (0.98f + treble * 0.12f);
    const auto voiced = focusedCore + lows + mids + highs + air;

    ampCompressorEnvelope += (std::abs(voiced) - ampCompressorEnvelope) * (std::abs(voiced) > ampCompressorEnvelope ? 0.14f : 0.004f);
    const auto compression = 1.0f / (1.0f + juce::jmax(0.0f, ampCompressorEnvelope - 0.58f) * 0.82f);

    const auto ampCalibratedOutput = 0.46f;
    return std::tanh(voiced * compression * 1.18f) * juce::jmap(master, 0.0f, 1.0f, 0.12f, 1.72f) * output * ampCalibratedOutput;
}

float ThallLabDspEngine::processCabFilter(float sample)
{
    const auto lowCut = juce::jlimit(20.0f, 300.0f, parameters.cabLowCutHz);
    const auto highCut = juce::jlimit(2000.0f, 20000.0f, parameters.cabHighCutHz);
    const auto resonance = juce::jlimit(0.0f, 100.0f, parameters.cabResonance) / 100.0f;
    auto filtered = sample;

    if (lowCut > 22.0f)
        filtered = highpassSample(filtered, lowCut, sampleRate, cabHighpassState, cabHighpassInputState);
    else
    {
        cabHighpassState = 0.0f;
        cabHighpassInputState = sample;
    }

    if (highCut < 19500.0f)
    {
        cabLowpassState += onePoleCoefficient(highCut, sampleRate) * (filtered - cabLowpassState);
        filtered = cabLowpassState;
    }
    else
    {
        cabLowpassState = filtered;
    }

    cabResonanceState += onePoleCoefficient(118.0f, sampleRate) * (filtered - cabResonanceState);
    return filtered + cabResonanceState * (resonance - 0.5f) * 0.16f;
}

float ThallLabDspEngine::processCleanSpace(float input, float amped)
{
    const auto blend = juce::jlimit(0.0f, 100.0f, parameters.cleanBlend) / 100.0f;
    if (blend <= 0.001f || cleanDelayBuffer.getNumSamples() <= 1 || cleanEchoBuffer.getNumSamples() <= 1 || cleanReverbBuffer.getNumSamples() <= 1)
        return 0.0f;

    const auto space = juce::jlimit(0.0f, 100.0f, parameters.cleanSpace) / 100.0f;
    const auto bass = juce::jlimit(0.0f, 100.0f, parameters.cleanBass) / 100.0f;
    const auto mid = juce::jlimit(0.0f, 100.0f, parameters.cleanMid) / 100.0f;
    const auto treble = juce::jlimit(0.0f, 100.0f, parameters.cleanTreble) / 100.0f;
    const auto presence = juce::jlimit(0.0f, 100.0f, parameters.cleanPresence) / 100.0f;
    const auto tone = juce::jlimit(0.0f, 100.0f, parameters.cleanTone) / 100.0f;
    const auto level = juce::Decibels::decibelsToGain(parameters.cleanLevel);
    const auto delayMix = juce::jlimit(0.0f, 100.0f, parameters.cleanDelayMix) / 100.0f;
    const auto delayFeedback = juce::jlimit(0.0f, 100.0f, parameters.cleanDelayFeedback) / 100.0f;
    const auto delayTimeMs = juce::jlimit(80.0f, 1200.0f, parameters.cleanDelayTimeMs);
    const auto reverbMix = juce::jlimit(0.0f, 100.0f, parameters.cleanReverbMix) / 100.0f;
    const auto reverbDecay = juce::jlimit(0.0f, 100.0f, parameters.cleanReverbDecay) / 100.0f;

    const auto cleanInput = juce::jlimit(-1.0f, 1.0f, input * 0.56f + amped * 0.018f);
    cleanToneState += onePoleCoefficient(1100.0f + tone * 6800.0f, sampleRate) * (cleanInput - cleanToneState);

    cleanLowState += onePoleCoefficient(120.0f + bass * 110.0f, sampleRate) * (cleanToneState - cleanLowState);
    cleanMidState += onePoleCoefficient(520.0f + mid * 720.0f, sampleRate) * (cleanToneState - cleanMidState);
    cleanPresenceState += onePoleCoefficient(2500.0f + presence * 5200.0f, sampleRate) * (cleanToneState - cleanPresenceState);

    const auto lowLift = cleanLowState * juce::jmap(bass, 0.0f, 1.0f, -0.34f, 0.38f);
    const auto midShape = (cleanMidState - cleanLowState) * juce::jmap(mid, 0.0f, 1.0f, -0.32f, 0.34f);
    const auto highLift = (cleanToneState - cleanMidState) * (0.06f + treble * 0.48f);
    const auto airLift = (cleanToneState - cleanPresenceState) * (0.04f + presence * 0.46f);
    const auto voiced = juce::jlimit(-1.0f, 1.0f, cleanToneState + lowLift + midShape + highLift + airLift);

    const auto smearSamples = juce::jlimit(240,
                                          cleanDelayBuffer.getNumSamples() - 1,
                                          static_cast<int>(sampleRate * juce::jmap(space, 0.0f, 1.0f, 0.018f, 0.135f)));
    auto smearReadPosition = cleanDelayWritePosition - smearSamples;
    if (smearReadPosition < 0)
        smearReadPosition += cleanDelayBuffer.getNumSamples();

    const auto cleanSmear = cleanDelayBuffer.getSample(0, smearReadPosition);
    cleanFeedbackState += onePoleCoefficient(190.0f + tone * 780.0f, sampleRate) * (cleanSmear - cleanFeedbackState);
    cleanDelayBuffer.setSample(0,
                               cleanDelayWritePosition,
                               juce::jlimit(-0.92f, 0.92f, voiced + cleanFeedbackState * (0.14f + space * 0.42f)));
    cleanDelayWritePosition = (cleanDelayWritePosition + 1) % cleanDelayBuffer.getNumSamples();

    const auto echoSamples = juce::jlimit(64,
                                         cleanEchoBuffer.getNumSamples() - 1,
                                         static_cast<int>(sampleRate * delayTimeMs / 1000.0));
    auto echoReadPosition = cleanEchoWritePosition - echoSamples;
    if (echoReadPosition < 0)
        echoReadPosition += cleanEchoBuffer.getNumSamples();

    const auto echo = cleanEchoBuffer.getSample(0, echoReadPosition);
    cleanEchoBuffer.setSample(0,
                              cleanEchoWritePosition,
                              juce::jlimit(-0.92f, 0.92f, voiced + echo * (0.08f + delayFeedback * 0.62f)));
    cleanEchoWritePosition = (cleanEchoWritePosition + 1) % cleanEchoBuffer.getNumSamples();

    auto readReverbTap = [this](int delaySamples)
    {
        auto readPosition = cleanReverbWritePosition - delaySamples;
        while (readPosition < 0)
            readPosition += cleanReverbBuffer.getNumSamples();
        return cleanReverbBuffer.getSample(0, readPosition);
    };

    const auto tapA = readReverbTap(juce::jlimit(96, cleanReverbBuffer.getNumSamples() - 1, static_cast<int>(sampleRate * (0.047f + space * 0.031f))));
    const auto tapB = readReverbTap(juce::jlimit(96, cleanReverbBuffer.getNumSamples() - 1, static_cast<int>(sampleRate * (0.083f + space * 0.067f))));
    const auto tapC = readReverbTap(juce::jlimit(96, cleanReverbBuffer.getNumSamples() - 1, static_cast<int>(sampleRate * (0.139f + space * 0.113f))));
    const auto tapD = readReverbTap(juce::jlimit(96, cleanReverbBuffer.getNumSamples() - 1, static_cast<int>(sampleRate * (0.211f + space * 0.181f))));
    const auto reverbTail = (tapA * 0.34f - tapB * 0.27f + tapC * 0.25f + tapD * 0.18f);
    cleanReverbDampState += onePoleCoefficient(1250.0f + tone * 4200.0f, sampleRate) * (reverbTail - cleanReverbDampState);
    cleanReverbBuffer.setSample(0,
                                cleanReverbWritePosition,
                                juce::jlimit(-0.84f, 0.84f, voiced * (0.30f + space * 0.22f)
                                                          + cleanReverbDampState * (0.22f + reverbDecay * 0.68f)));
    cleanReverbWritePosition = (cleanReverbWritePosition + 1) % cleanReverbBuffer.getNumSamples();

    const auto wetDelay = echo * delayMix * 0.68f;
    const auto wetReverb = cleanReverbDampState * reverbMix * (0.42f + space * 0.34f);
    return juce::jlimit(-1.0f, 1.0f, (voiced + cleanSmear * space * 0.16f + wetDelay + wetReverb) * blend * level * 0.78f);
}

void ThallLabDspEngine::processCabIrMix(int samplesToProcess)
{
    cabMixBuffer.makeCopyOf(ampBuffer, true);

    if (!parameters.cabSectionEnabled || !parameters.cabIrEnabled || (!cabIrALoaded && !cabIrBLoaded))
        return;

    cabBufferA.makeCopyOf(ampBuffer, true);
    cabBufferB.makeCopyOf(ampBuffer, true);

    if (cabIrALoaded)
    {
        juce::dsp::AudioBlock<float> block(cabBufferA);
        auto subBlock = block.getSubBlock(0, static_cast<size_t>(samplesToProcess));
        juce::dsp::ProcessContextReplacing<float> context(subBlock);
        cabConvolutionA.process(context);
    }
    else
    {
        cabBufferA.clear();
    }

    if (cabIrBLoaded)
    {
        juce::dsp::AudioBlock<float> block(cabBufferB);
        auto subBlock = block.getSubBlock(0, static_cast<size_t>(samplesToProcess));
        juce::dsp::ProcessContextReplacing<float> context(subBlock);
        cabConvolutionB.process(context);
    }
    else
    {
        cabBufferB.clear();
    }

    const auto blend = juce::jlimit(0.0f, 100.0f, parameters.cabBlend) / 100.0f;
    const auto aGain = cabIrALoaded && cabIrBLoaded ? 1.0f - blend : (cabIrALoaded ? 1.0f : 0.0f);
    const auto bGain = cabIrALoaded && cabIrBLoaded ? blend : (cabIrBLoaded ? 1.0f : 0.0f);
    auto* mix = cabMixBuffer.getWritePointer(0);
    const auto* a = cabBufferA.getReadPointer(0);
    const auto* b = cabBufferB.getReadPointer(0);

    for (int sampleIndex = 0; sampleIndex < samplesToProcess; ++sampleIndex)
        mix[sampleIndex] = a[sampleIndex] * aGain + b[sampleIndex] * bGain;
}

float ThallLabDspEngine::processAmbient(float input, float amped)
{
    if (!parameters.ambientEnabled || ambientDelayBuffer.getNumSamples() <= 1)
        return 0.0f;

    const auto blend = juce::jlimit(0.0f, 100.0f, parameters.ambientBlend) / 100.0f;
    if (blend <= 0.001f)
        return 0.0f;

    const auto size = juce::jlimit(0.0f, 100.0f, parameters.ambientSize) / 100.0f;
    const auto feedback = juce::jlimit(0.0f, 100.0f, parameters.ambientFeedback) / 100.0f;
    const auto grain = juce::jlimit(0.0f, 100.0f, parameters.ambientGrain) / 100.0f;
    const auto pitchSemitones = juce::jlimit(-12.0f, 12.0f, parameters.ambientPitch);
    const auto pitchDepth = std::abs(pitchSemitones) / 12.0f;
    const auto tone = juce::jlimit(0.0f, 100.0f, parameters.ambientTone) / 100.0f;
    const auto shimmer = juce::jlimit(0.0f, 100.0f, parameters.ambientShimmer) / 100.0f;
    const auto reverse = juce::jlimit(0.0f, 100.0f, parameters.ambientReverse) / 100.0f;
    const auto stutter = juce::jlimit(0.0f, 100.0f, parameters.ambientStutter) / 100.0f;
    const auto ring = juce::jlimit(0.0f, 100.0f, parameters.ambientRing) / 100.0f;

    const auto delaySamples = juce::jlimit(1600, ambientDelayBuffer.getNumSamples() - 1,
                                          static_cast<int>(sampleRate * juce::jmap(size, 0.0f, 1.0f, 0.08f, 0.72f)));
    auto wrapReadPosition = [this](int position)
    {
        while (position < 0)
            position += ambientDelayBuffer.getNumSamples();
        while (position >= ambientDelayBuffer.getNumSamples())
            position -= ambientDelayBuffer.getNumSamples();
        return position;
    };

    ambientGrainPhase += (0.32f + grain * 4.8f) / static_cast<float>(sampleRate);
    if (ambientGrainPhase >= 1.0f)
        ambientGrainPhase -= 1.0f;

    const auto grainWindow = std::sin(2.0f * juce::MathConstants<float>::pi * ambientGrainPhase);
    const auto grainOffset = static_cast<int>(grainWindow * grain * static_cast<float>(sampleRate) * 0.026f);
    const auto readPosition = wrapReadPosition(ambientDelayWritePosition - delaySamples + grainOffset);
    const auto pitchRatio = std::pow(2.0f, pitchSemitones / 12.0f);
    const auto pitchDelaySamples = juce::jlimit(800,
                                               ambientDelayBuffer.getNumSamples() - 1,
                                               static_cast<int>(static_cast<float>(delaySamples) / pitchRatio));
    const auto pitchReadPosition = wrapReadPosition(ambientDelayWritePosition - pitchDelaySamples);

    const auto delayed = ambientDelayBuffer.getSample(0, readPosition);
    const auto pitchTap = ambientDelayBuffer.getSample(0, pitchReadPosition);
    const auto pitched = delayed + (pitchTap - delayed) * pitchDepth;
    ambientShimmerState += onePoleCoefficient(3600.0f + shimmer * 4200.0f, sampleRate) * (delayed - ambientShimmerState);
    ambientReverseState += onePoleCoefficient(5.0f + reverse * 18.0f, sampleRate) * (delayed - ambientReverseState);
    ambientToneState += onePoleCoefficient(780.0f + tone * 5400.0f, sampleRate) * (pitched - ambientToneState);

    ambientRingPhase += (18.0f + ring * 155.0f) / static_cast<float>(sampleRate);
    if (ambientRingPhase >= 1.0f)
        ambientRingPhase -= 1.0f;

    ambientStutterPhase += (2.0f + stutter * 24.0f) / static_cast<float>(sampleRate);
    if (ambientStutterPhase >= 1.0f)
        ambientStutterPhase -= 1.0f;

    const auto ringMod = std::sin(2.0f * juce::MathConstants<float>::pi * ambientRingPhase);
    const auto stutterGate = stutter <= 0.01f ? 1.0f : (ambientStutterPhase > (0.58f - stutter * 0.34f) ? 1.0f : 0.12f);
    const auto toneHigh = pitched - ambientToneState;
    const auto toned = ambientToneState + toneHigh * (0.24f + tone * 1.22f);
    const auto texture = toned + (delayed - ambientShimmerState) * shimmer * 0.62f
                         + ambientReverseState * reverse * 0.48f
                         + (pitchTap - delayed) * pitchDepth * 0.34f
                         + delayed * ringMod * ring * 0.36f;

    ambientFeedbackState += onePoleCoefficient(180.0f + size * 320.0f, sampleRate) * (texture - ambientFeedbackState);
    const auto writeSample = input * 0.28f + amped * 0.08f + ambientFeedbackState * (0.18f + feedback * 0.62f);
    ambientDelayBuffer.setSample(0, ambientDelayWritePosition, juce::jlimit(-0.95f, 0.95f, writeSample));
    ambientDelayWritePosition = (ambientDelayWritePosition + 1) % ambientDelayBuffer.getNumSamples();

    return texture * blend * stutterGate * 0.72f;
}
