#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "ThallLabDspEngine.h"

class ThallbyssalAudioProcessor final : public juce::AudioProcessor
{
public:
    ThallbyssalAudioProcessor();
    ~ThallbyssalAudioProcessor() override = default;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    bool isBusesLayoutSupported(const BusesLayout& layouts) const override;
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Thallbyssal"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 2.5; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int index) override;
    const juce::String getProgramName(int index) override;
    void changeProgramName(int index, const juce::String& newName) override;

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();
    float parameterValue(const juce::String& parameterId) const;
    bool boolParameterValue(const juce::String& parameterId) const;
    void updateEngineParameters();

    juce::AudioProcessorValueTreeState parameters;
    ThallLabDspEngine engine;
    juce::AudioBuffer<float> monoInput;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(ThallbyssalAudioProcessor)
};
