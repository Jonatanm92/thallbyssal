#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_core/juce_core.h>

#include <memory>

class ThallbyssalLiveV1NamChain
{
public:
    struct Config
    {
        enum class ProbeVariant
        {
            liveV1,
            a2FullRigRecoveryV0
        };

        juce::File bigBottomModel;
        juce::File gojiraModel;
        juce::File bldogIr;
        juce::File hlbstIr;
        juce::File gojiraIr;

        double bldogGainDb = -17.629548297742456;
        double gojiraGainDb = -19.775606700373558;
        double edgeGainDb = -15.665085331251513;
        double finalGainDb = -0.529763242394424;
        ProbeVariant probeVariant = ProbeVariant::liveV1;

        static Config localPrivateDefaults();
    };

    struct Status
    {
        bool ready = false;
        bool bigBottomBldogLoaded = false;
        bool bigBottomHlbstLoaded = false;
        bool gojiraLoaded = false;
        bool irsLoaded = false;
        double sampleRate = 0.0;
        int maxBlockSize = 0;
        juce::String lastError;
    };

    ThallbyssalLiveV1NamChain();
    ~ThallbyssalLiveV1NamChain();

    ThallbyssalLiveV1NamChain(const ThallbyssalLiveV1NamChain&) = delete;
    ThallbyssalLiveV1NamChain& operator=(const ThallbyssalLiveV1NamChain&) = delete;

    bool prepare(const Config& config, double sampleRate, int maxBlockSize, juce::String& error);
    void reset();

    bool process(const float* monoInput, float* leftOutput, float* rightOutput, int numSamples, juce::String& error);

    bool isReady() const noexcept;
    const Status& getStatus() const noexcept;
    const Config& getConfig() const noexcept;

private:
    struct Impl;
    std::unique_ptr<Impl> impl;
};
