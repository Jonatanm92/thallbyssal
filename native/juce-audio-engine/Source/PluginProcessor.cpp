#include "PluginProcessor.h"

namespace
{
using ParameterLayout = juce::AudioProcessorValueTreeState::ParameterLayout;

void addFloat(ParameterLayout& layout,
              const char* id,
              const char* name,
              float minimum,
              float maximum,
              float interval,
              float defaultValue,
              const char* label)
{
    layout.add(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { id, 1 },
        name,
        juce::NormalisableRange<float>(minimum, maximum, interval),
        defaultValue,
        juce::AudioParameterFloatAttributes().withLabel(label)));
}

void addBool(ParameterLayout& layout, const char* id, const char* name, bool defaultValue)
{
    layout.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID { id, 1 }, name, defaultValue));
}
}

ThallbyssalAudioProcessor::ThallbyssalAudioProcessor()
    : AudioProcessor(BusesProperties()
                         .withInput("Input", juce::AudioChannelSet::stereo(), true)
                         .withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      parameters(*this, nullptr, "ThallbyssalParameters", createParameterLayout())
{
}

void ThallbyssalAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    monoInput.setSize(1, juce::jmax(1, samplesPerBlock), false, false, true);
    engine.prepare(sampleRate, samplesPerBlock);
    updateEngineParameters();
}

void ThallbyssalAudioProcessor::releaseResources()
{
    engine.reset();
}

bool ThallbyssalAudioProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const
{
    const auto input = layouts.getMainInputChannelSet();
    const auto output = layouts.getMainOutputChannelSet();

    if (input != juce::AudioChannelSet::mono() && input != juce::AudioChannelSet::stereo())
        return false;

    return output == juce::AudioChannelSet::mono() || output == juce::AudioChannelSet::stereo();
}

void ThallbyssalAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused(midiMessages);
    juce::ScopedNoDenormals noDenormals;

    const auto numSamples = buffer.getNumSamples();
    const auto numInputChannels = juce::jmin(getTotalNumInputChannels(), buffer.getNumChannels());
    const auto numOutputChannels = juce::jmin(getTotalNumOutputChannels(), buffer.getNumChannels());

    if (numSamples <= 0 || numOutputChannels <= 0)
        return;

    if (monoInput.getNumSamples() < numSamples)
        monoInput.setSize(1, numSamples, false, false, true);

    monoInput.clear(0, 0, numSamples);
    int activeInputChannel = 0;
    float activeInputPeak = 0.0f;
    for (int channel = 0; channel < numInputChannels; ++channel)
    {
        float channelPeak = 0.0f;
        for (int sample = 0; sample < numSamples; ++sample)
            channelPeak = juce::jmax(channelPeak, std::abs(buffer.getSample(channel, sample)));

        if (channelPeak > activeInputPeak)
        {
            activeInputPeak = channelPeak;
            activeInputChannel = channel;
        }
    }

    if (numInputChannels > 0)
        monoInput.copyFrom(0, 0, buffer, activeInputChannel, 0, numSamples);

    buffer.clear();
    updateEngineParameters();

    auto* left = buffer.getWritePointer(0);
    auto* right = numOutputChannels > 1 ? buffer.getWritePointer(1) : left;
    engine.process(monoInput.getReadPointer(0), left, right, numSamples);
}

juce::AudioProcessorEditor* ThallbyssalAudioProcessor::createEditor()
{
    return new juce::GenericAudioProcessorEditor(*this);
}

void ThallbyssalAudioProcessor::setCurrentProgram(int index)
{
    juce::ignoreUnused(index);
}

const juce::String ThallbyssalAudioProcessor::getProgramName(int index)
{
    juce::ignoreUnused(index);
    return {};
}

void ThallbyssalAudioProcessor::changeProgramName(int index, const juce::String& newName)
{
    juce::ignoreUnused(index, newName);
}

void ThallbyssalAudioProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    const auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());

    if (xml != nullptr)
        copyXmlToBinary(*xml, destData);
}

void ThallbyssalAudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));

    if (xml != nullptr && xml->hasTagName(parameters.state.getType()))
        parameters.replaceState(juce::ValueTree::fromXml(*xml));
}

ParameterLayout ThallbyssalAudioProcessor::createParameterLayout()
{
    ParameterLayout layout;

    addFloat(layout, "inputGainDb", "Input", -18.0f, 18.0f, 0.1f, 0.0f, "dB");
    addFloat(layout, "outputGainDb", "Output", -36.0f, 12.0f, 0.1f, 0.0f, "dB");
    addBool(layout, "monoOutput", "Mono Output", false);

    addFloat(layout, "transposeSemitones", "Transpose", -24.0f, 24.0f, 1.0f, 0.0f, "st");
    addFloat(layout, "lowOctBlend", "Low Oct", 0.0f, 100.0f, 0.1f, 0.0f, "%");
    addFloat(layout, "palmCatch", "Palm Catch", 0.0f, 100.0f, 0.1f, 62.0f, "%");
    addFloat(layout, "palmCatchFocusHz", "Palm Catch Focus", 30.0f, 2500.0f, 1.0f, 720.0f, "Hz");

    addFloat(layout, "gateThresholdDb", "Gate Threshold", -85.0f, -25.0f, 0.1f, -62.0f, "dB");
    addFloat(layout, "gateReleaseMs", "Gate Hold", 8.0f, 220.0f, 0.1f, 48.0f, "ms");
    addFloat(layout, "grinderDrive", "Grinder Drive", 0.0f, 100.0f, 0.1f, 72.0f, "%");

    addFloat(layout, "diAmount", "DI Amount", 0.0f, 100.0f, 0.1f, 0.0f, "%");
    addFloat(layout, "diSmooth", "DI Smooth", 0.0f, 100.0f, 0.1f, 48.0f, "%");

    addFloat(layout, "ampGain", "Amp Gain", 1.0f, 12.0f, 0.1f, 8.4f, "");
    addFloat(layout, "ampBass", "Amp Bass", 0.0f, 100.0f, 0.1f, 26.0f, "%");
    addFloat(layout, "ampMid", "Amp Mid", 0.0f, 100.0f, 0.1f, 62.0f, "%");
    addFloat(layout, "ampTreble", "Amp Treble", 0.0f, 100.0f, 0.1f, 72.0f, "%");
    addFloat(layout, "ampPresence", "Amp Presence", 0.0f, 100.0f, 0.1f, 68.0f, "%");
    addFloat(layout, "ampMaster", "Amp Master", 0.0f, 100.0f, 0.1f, 70.0f, "%");
    addFloat(layout, "ampOutputDb", "Amp Output", -18.0f, 12.0f, 0.1f, 0.0f, "dB");

    addBool(layout, "cabSectionEnabled", "Cab Section", true);
    addBool(layout, "cabIrEnabled", "Cabs / IR", true);
    addFloat(layout, "cabLowCutHz", "Cab Low Cut", 20.0f, 300.0f, 1.0f, 20.0f, "Hz");
    addFloat(layout, "cabHighCutHz", "Cab High Cut", 2000.0f, 20000.0f, 1.0f, 20000.0f, "Hz");
    addFloat(layout, "cabRoom", "Cab Room", 0.0f, 100.0f, 0.1f, 28.0f, "%");
    addFloat(layout, "cabLevelDb", "Cab Level", -18.0f, 18.0f, 0.1f, 0.0f, "dB");

    addFloat(layout, "cleanMix", "Clean Mix", 0.0f, 100.0f, 0.1f, 0.0f, "%");
    addFloat(layout, "cleanSpace", "Clean Space", 0.0f, 100.0f, 0.1f, 58.0f, "%");
    addFloat(layout, "cleanDelayMix", "Clean Delay", 0.0f, 100.0f, 0.1f, 18.0f, "%");
    addFloat(layout, "cleanDelayTimeMs", "Clean Delay Time", 80.0f, 1200.0f, 1.0f, 380.0f, "ms");
    addFloat(layout, "cleanDelayFeedback", "Clean Delay Feedback", 0.0f, 100.0f, 0.1f, 28.0f, "%");
    addFloat(layout, "cleanReverbMix", "Clean Reverb", 0.0f, 100.0f, 0.1f, 34.0f, "%");
    addFloat(layout, "cleanReverbDecay", "Clean Reverb Decay", 0.0f, 100.0f, 0.1f, 58.0f, "%");
    addFloat(layout, "cleanLevelDb", "Clean Level", -18.0f, 12.0f, 0.1f, 0.0f, "dB");

    return layout;
}

float ThallbyssalAudioProcessor::parameterValue(const juce::String& parameterId) const
{
    if (const auto* value = parameters.getRawParameterValue(parameterId))
        return value->load();

    return 0.0f;
}

bool ThallbyssalAudioProcessor::boolParameterValue(const juce::String& parameterId) const
{
    return parameterValue(parameterId) >= 0.5f;
}

void ThallbyssalAudioProcessor::updateEngineParameters()
{
    ThallLabDspEngine::Parameters dspParameters;
    dspParameters.inputGainDb = parameterValue("inputGainDb");
    dspParameters.outputGainDb = parameterValue("outputGainDb");
    dspParameters.stereoOutput = !boolParameterValue("monoOutput");
    dspParameters.transposeSemitones = parameterValue("transposeSemitones");
    dspParameters.octaveLayerBlend = parameterValue("lowOctBlend");
    dspParameters.palmMuteAmount = parameterValue("palmCatch");
    dspParameters.palmMuteFocusHz = parameterValue("palmCatchFocusHz");
    dspParameters.gateThresholdDb = parameterValue("gateThresholdDb");
    dspParameters.gateReleaseMs = parameterValue("gateReleaseMs");
    dspParameters.grinderAmount = parameterValue("grinderDrive");
    dspParameters.diAmount = parameterValue("diAmount");
    dspParameters.diSmooth = parameterValue("diSmooth");
    dspParameters.diCurve = 82.0f;
    dspParameters.ampDrive = parameterValue("ampGain");
    dspParameters.ampBass = parameterValue("ampBass");
    dspParameters.ampMid = parameterValue("ampMid");
    dspParameters.ampTreble = parameterValue("ampTreble");
    dspParameters.ampPresence = parameterValue("ampPresence");
    dspParameters.ampMaster = parameterValue("ampMaster");
    dspParameters.ampOutputDb = parameterValue("ampOutputDb");
    dspParameters.cabLowCutHz = parameterValue("cabLowCutHz");
    dspParameters.cabHighCutHz = parameterValue("cabHighCutHz");
    dspParameters.cabResonance = parameterValue("cabRoom");
    dspParameters.cabLevel = parameterValue("cabLevelDb");
    dspParameters.cabSectionEnabled = boolParameterValue("cabSectionEnabled");
    dspParameters.cabIrEnabled = boolParameterValue("cabIrEnabled");
    dspParameters.cleanBlend = parameterValue("cleanMix");
    dspParameters.cleanSpace = parameterValue("cleanSpace");
    dspParameters.cleanDelayMix = parameterValue("cleanDelayMix");
    dspParameters.cleanDelayTimeMs = parameterValue("cleanDelayTimeMs");
    dspParameters.cleanDelayFeedback = parameterValue("cleanDelayFeedback");
    dspParameters.cleanReverbMix = parameterValue("cleanReverbMix");
    dspParameters.cleanReverbDecay = parameterValue("cleanReverbDecay");
    dspParameters.cleanLevel = parameterValue("cleanLevelDb");
    dspParameters.ampEnabled = true;
    dspParameters.gateEnabled = true;
    dspParameters.grinderEnabled = true;
    dspParameters.ambientEnabled = false;

    engine.setParameters(dspParameters);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new ThallbyssalAudioProcessor();
}
