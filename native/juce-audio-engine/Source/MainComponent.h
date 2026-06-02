#pragma once

#include <juce_audio_formats/juce_audio_formats.h>
#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include "ThallLabDspEngine.h"

class MainComponent final : public juce::AudioAppComponent,
                            private juce::Slider::Listener,
                            private juce::Button::Listener,
                            private juce::ComboBox::Listener,
                            private juce::Timer
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay(int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock(const juce::AudioSourceChannelInfo& bufferToFill) override;
    void releaseResources() override;
    void resized() override;
    void paint(juce::Graphics& g) override;

private:
    class AmpSimLookAndFeel final : public juce::LookAndFeel_V4
    {
    public:
        void drawRotarySlider(juce::Graphics& g,
                              int x,
                              int y,
                              int width,
                              int height,
                              float sliderPos,
                              float rotaryStartAngle,
                              float rotaryEndAngle,
                              juce::Slider& slider) override;
        void drawButtonBackground(juce::Graphics& g,
                                  juce::Button& button,
                                  const juce::Colour& backgroundColour,
                                  bool shouldDrawButtonAsHighlighted,
                                  bool shouldDrawButtonAsDown) override;
        void drawComboBox(juce::Graphics& g,
                          int width,
                          int height,
                          bool isButtonDown,
                          int buttonX,
                          int buttonY,
                          int buttonW,
                          int buttonH,
                          juce::ComboBox& box) override;
        juce::Font getTextButtonFont(juce::TextButton&, int buttonHeight) override;
    };

    void sliderValueChanged(juce::Slider* slider) override;
    void buttonClicked(juce::Button* button) override;
    void comboBoxChanged(juce::ComboBox* comboBox) override;
    void timerCallback() override;
    void updateEngineFromUi();
    void updateStatusText();
    void showActionStatus(const juce::String& message);
    void applyNativeTonePreset(const juce::String& presetId);
    void choosePresetFile();
    void chooseIrFile();
    void loadPresetFile(const juce::File& file);
    bool loadIrFile(const juce::File& file, int slot);
    void clearCabSlot(int slot);
    void resetToFactoryCab();
    void updateCabLabels();
    int getRequestedInputChannel(int availableChannels) const;
    juce::Slider& addSlider(const juce::String& name, double min, double max, double value, const juce::String& suffix = {});
    void styleButton(juce::Button& button);
    void styleLabel(juce::Label& label, float size = 14.0f, bool bold = false);
    void drawPanel(juce::Graphics& g, juce::Rectangle<int> area, const juce::String& title, juce::Colour accent);
    void drawHardwareSlot(juce::Graphics& g, juce::Rectangle<int> area, const juce::String& title, juce::Colour accent);
    void drawCabinetGraphic(juce::Graphics& g, juce::Rectangle<int> area, const juce::String& title, const juce::String& subtitle);
    void drawSignalChain(juce::Graphics& g, juce::Rectangle<int> area);
    void drawCleanRigGraphic(juce::Graphics& g, juce::Rectangle<int> area);
    void drawStatusLed(juce::Graphics& g, juce::Rectangle<int> area, bool enabled, juce::Colour accent);
    void drawClipMeter(juce::Graphics& g, juce::Rectangle<int> area, float peak, const juce::String& label);
    void drawDiCurve(juce::Graphics& g, juce::Rectangle<int> area);
    void startAutoInputGain();
    void updateAutoInputGain();

    enum class EditorPage
    {
        rig,
        cab,
        clean,
        fx
    };

    juce::OwnedArray<juce::Slider> sliders;
    juce::OwnedArray<juce::Label> sliderLabels;
    AmpSimLookAndFeel ampSimLookAndFeel;

    juce::Slider* inputGain = nullptr;
    juce::Slider* transposeSemitones = nullptr;
    juce::Slider* octaveLayerBlend = nullptr;
    juce::Slider* palmMuteAmount = nullptr;
    juce::Slider* palmMuteFocus = nullptr;
    juce::Slider* gateThreshold = nullptr;
    juce::Slider* gateRelease = nullptr;
    juce::Slider* grinderAmount = nullptr;
    juce::Slider* diCurve = nullptr;
    juce::Slider* diAmount = nullptr;
    juce::Slider* diSmooth = nullptr;
    juce::Slider* ampDrive = nullptr;
    juce::Slider* ampBass = nullptr;
    juce::Slider* ampMid = nullptr;
    juce::Slider* ampTreble = nullptr;
    juce::Slider* ampPresence = nullptr;
    juce::Slider* ampMaster = nullptr;
    juce::Slider* ampOutput = nullptr;
    juce::Slider* cabBlend = nullptr;
    juce::Slider* cabLowCut = nullptr;
    juce::Slider* cabHighCut = nullptr;
    juce::Slider* cabResonance = nullptr;
    juce::Slider* cabLevel = nullptr;
    juce::Slider* cleanMix = nullptr;
    juce::Slider* cleanSpace = nullptr;
    juce::Slider* cleanBass = nullptr;
    juce::Slider* cleanMid = nullptr;
    juce::Slider* cleanTreble = nullptr;
    juce::Slider* cleanPresence = nullptr;
    juce::Slider* cleanTone = nullptr;
    juce::Slider* cleanLevel = nullptr;
    juce::Slider* cleanDelayMix = nullptr;
    juce::Slider* cleanDelayTime = nullptr;
    juce::Slider* cleanDelayFeedback = nullptr;
    juce::Slider* cleanReverbMix = nullptr;
    juce::Slider* cleanReverbDecay = nullptr;
    juce::Slider* ambientBlend = nullptr;
    juce::Slider* ambientSize = nullptr;
    juce::Slider* ambientFeedback = nullptr;
    juce::Slider* ambientGrain = nullptr;
    juce::Slider* ambientPitch = nullptr;
    juce::Slider* ambientTone = nullptr;
    juce::Slider* ambientShimmer = nullptr;
    juce::Slider* ambientReverse = nullptr;
    juce::Slider* ambientStutter = nullptr;
    juce::Slider* ambientRing = nullptr;
    juce::Slider* outputLevel = nullptr;

    juce::ToggleButton ampEnabled { "Rhythm Amp" };
    juce::ToggleButton cleanEnabled { "Clean Space" };
    juce::ToggleButton ambientEnabled { "FX Rack" };
    juce::TextButton rigTabButton { "RIG" };
    juce::TextButton cabTabButton { "CAB MIX" };
    juce::TextButton cleanTabButton { "CLEAN" };
    juce::TextButton fxTabButton { "FX" };
    juce::TextButton loadPresetButton { "Load preset JSON" };
    juce::TextButton autoInputButton { "Auto Input" };
    juce::TextButton outputModeButton { "STEREO" };
    juce::TextButton loadIrButton { "Load IR A" };
    juce::TextButton loadIrBButton { "Load IR B" };
    juce::TextButton factoryCabButton { "Factory Cab" };
    juce::TextButton clearIrAButton { "Clear A" };
    juce::TextButton clearIrBButton { "Clear B" };
    juce::TextButton cabSectionButton { "CAB SECTION" };
    juce::TextButton cabIrButton { "CABS / IR" };
    juce::ComboBox inputChannelBox;
    juce::ComboBox tonePresetBox;
    juce::Label inputChannelLabel;
    juce::Label tonePresetLabel;
    juce::Label titleLabel;
    juce::Label statusLabel;
    juce::Label meterLabel;
    juce::Label irLabel;
    juce::Label ampPanelLabel;
    juce::Label ioPanelLabel;
    juce::Label pedalPanelLabel;
    juce::Label diPanelLabel;
    juce::Label cleanPanelLabel;
    juce::Label cabPanelLabel;
    juce::Label fxPanelLabel;
    juce::Label cabSlotALabel;
    juce::Label cabSlotBLabel;
    juce::TextButton gatePedal { "GATE" };
    juce::TextButton grindPedal { "GRIND" };
    juce::TextButton shimmerSwitch { "SHIMMER" };
    juce::TextButton reverseSwitch { "REVERSE" };
    juce::TextButton stutterSwitch { "STUTTER" };
    juce::TextButton ringSwitch { "RING" };
    juce::Viewport deviceViewport;
    std::unique_ptr<juce::AudioDeviceSelectorComponent> deviceSelector;
    std::unique_ptr<juce::FileChooser> fileChooser;
    ThallLabDspEngine engine;
    juce::AudioBuffer<float> inputScratch;
    juce::String loadedIrName = "Factory Mellow Cab";
    juce::String loadedIrAName = "Factory Mellow Cab";
    juce::String loadedIrBName = "Empty";
    EditorPage activePage = EditorPage::rig;
    double currentSampleRate = 0.0;
    int currentBlockSize = 0;
    float cachedInputPeak = 0.0f;
    float cachedOutputPeak = 0.0f;
    bool autoInputGainActive = false;
    double autoInputGainStartedAtMs = 0.0;
    float autoInputGainPeak = 0.0f;
    juce::String actionStatusText;
    double actionStatusExpiresAtMs = 0.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(MainComponent)
};
