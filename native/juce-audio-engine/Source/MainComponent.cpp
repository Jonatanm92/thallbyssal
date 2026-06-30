#include "MainComponent.h"

#include <cmath>

void MainComponent::AmpSimLookAndFeel::drawRotarySlider(juce::Graphics& g,
                                                        int x,
                                                        int y,
                                                        int width,
                                                        int height,
                                                        float sliderPos,
                                                        float rotaryStartAngle,
                                                        float rotaryEndAngle,
                                                        juce::Slider& slider)
{
    const auto bounds = juce::Rectangle<float>(static_cast<float>(x), static_cast<float>(y), static_cast<float>(width), static_cast<float>(height)).reduced(7.0f);
    const auto diameter = juce::jmin(bounds.getWidth(), bounds.getHeight());
    const auto knob = juce::Rectangle<float>(bounds.getCentreX() - diameter * 0.5f,
                                             bounds.getCentreY() - diameter * 0.5f,
                                             diameter,
                                             diameter).reduced(3.0f);
    const auto radius = knob.getWidth() * 0.5f;
    const auto centre = knob.getCentre();
    const auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    const auto accent = slider.findColour(juce::Slider::rotarySliderFillColourId);

    // soft drop shadow
    g.setColour(juce::Colour(0xff02050a).withAlpha(0.62f));
    g.fillEllipse(knob.translated(0.0f, 3.0f).expanded(4.0f));

    // tick ring
    for (int tick = 0; tick <= 10; ++tick)
    {
        const auto tickAngle = rotaryStartAngle + (static_cast<float>(tick) / 10.0f) * (rotaryEndAngle - rotaryStartAngle);
        const auto inner = juce::Point<float>(centre.x + std::cos(tickAngle - juce::MathConstants<float>::halfPi) * (radius + 9.0f),
                                             centre.y + std::sin(tickAngle - juce::MathConstants<float>::halfPi) * (radius + 9.0f));
        const auto outer = juce::Point<float>(centre.x + std::cos(tickAngle - juce::MathConstants<float>::halfPi) * (radius + 14.0f),
                                             centre.y + std::sin(tickAngle - juce::MathConstants<float>::halfPi) * (radius + 14.0f));
        g.setColour((tick % 5 == 0 ? juce::Colour(0xffd7fff0) : juce::Colour(0xff506172)).withAlpha(0.58f));
        g.drawLine(inner.x, inner.y, outer.x, outer.y, tick % 5 == 0 ? 1.6f : 1.0f);
    }

    // value track + glowing fill arc
    juce::Path track;
    track.addCentredArc(centre.x, centre.y, radius + 5.0f, radius + 5.0f, 0.0f, rotaryStartAngle, rotaryEndAngle, true);
    g.setColour(juce::Colour(0xff182331));
    g.strokePath(track, juce::PathStrokeType(5.0f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    juce::Path arc;
    arc.addCentredArc(centre.x, centre.y, radius + 5.0f, radius + 5.0f, 0.0f, rotaryStartAngle, angle, true);
    g.setColour(accent.withAlpha(0.25f));
    g.strokePath(arc, juce::PathStrokeType(8.0f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded)); // glow
    g.setColour(accent);
    g.strokePath(arc, juce::PathStrokeType(5.0f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    // beveled metal rim
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff5b6878), knob.getX(), knob.getY(),
                                           juce::Colour(0xff0d1117), knob.getRight(), knob.getBottom(), false));
    g.fillEllipse(knob);

    // brushed cap
    const auto cap = knob.reduced(radius * 0.16f);
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff3b4654), cap.getX(), cap.getY(),
                                           juce::Colour(0xff0b0e13), cap.getRight(), cap.getBottom(), false));
    g.fillEllipse(cap);

    // faint concentric brushing
    g.setColour(juce::Colour(0xff8795a7).withAlpha(0.05f));
    for (float rr = radius * 0.78f; rr > radius * 0.22f; rr -= 3.0f)
        g.drawEllipse(juce::Rectangle<float>(rr * 2.0f, rr * 2.0f).withCentre(centre), 0.6f);

    // bevel highlight + inner shadow
    g.setColour(juce::Colours::white.withAlpha(0.10f));
    g.drawEllipse(cap.reduced(1.0f), 1.4f);
    g.setColour(juce::Colour(0xff05070b).withAlpha(0.55f));
    g.drawEllipse(cap.reduced(radius * 0.30f), 4.0f);

    // dark centre well with a hint of accent
    g.setColour(juce::Colour(0xff0a0f15).withAlpha(0.6f));
    g.fillEllipse(knob.reduced(radius * 0.62f));
    g.setColour(accent.withAlpha(0.16f));
    g.fillEllipse(knob.reduced(radius * 0.70f));

    // indicator + glowing tip
    juce::Path pointer;
    const auto pointerLength = radius * 0.78f;
    const auto pointerThickness = juce::jmax(2.5f, radius * 0.12f);
    pointer.addRoundedRectangle(-pointerThickness * 0.5f, -pointerLength, pointerThickness, pointerLength * 0.56f, pointerThickness * 0.5f);
    pointer.applyTransform(juce::AffineTransform::rotation(angle).translated(centre.x, centre.y));
    g.setColour(juce::Colour(0xfff8fafc));
    g.fillPath(pointer);

    const auto tip = juce::Point<float>(centre.x + std::cos(angle - juce::MathConstants<float>::halfPi) * (radius * 0.6f),
                                        centre.y + std::sin(angle - juce::MathConstants<float>::halfPi) * (radius * 0.6f));
    g.setColour(accent.withAlpha(0.55f));
    g.fillEllipse(juce::Rectangle<float>(9.0f, 9.0f).withCentre(tip));
    g.setColour(accent.brighter(0.6f));
    g.fillEllipse(juce::Rectangle<float>(4.5f, 4.5f).withCentre(tip));

    if (slider.isMouseOverOrDragging())
    {
        g.setColour(accent.withAlpha(0.16f));
        g.fillEllipse(knob.expanded(5.0f));
    }
}

void MainComponent::AmpSimLookAndFeel::drawButtonBackground(juce::Graphics& g,
                                                            juce::Button& button,
                                                            const juce::Colour& backgroundColour,
                                                            bool shouldDrawButtonAsHighlighted,
                                                            bool shouldDrawButtonAsDown)
{
    const auto bounds = button.getLocalBounds().toFloat().reduced(0.5f);
    const auto active = button.getToggleState();
    const auto base = active ? juce::Colour(0xff1a8fb3) : backgroundColour;
    const auto top = shouldDrawButtonAsDown ? base.darker(0.32f) : base.brighter(active ? 0.28f : 0.12f);
    const auto bottom = shouldDrawButtonAsDown ? base.darker(0.52f) : base.darker(active ? 0.12f : 0.34f);

    g.setGradientFill(juce::ColourGradient(top, bounds.getX(), bounds.getY(), bottom, bounds.getX(), bounds.getBottom(), false));
    g.fillRoundedRectangle(bounds, 5.0f);

    g.setColour((active ? juce::Colour(0xff45d6ff) : juce::Colour(0xff506172)).withAlpha(shouldDrawButtonAsHighlighted ? 0.95f : 0.62f));
    g.drawRoundedRectangle(bounds.reduced(0.5f), 5.0f, shouldDrawButtonAsHighlighted ? 1.6f : 1.0f);

    if (active)
    {
        g.setColour(juce::Colour(0xffbaffef).withAlpha(0.16f));
        g.fillRoundedRectangle(bounds.reduced(3.0f), 3.5f);
    }
}

void MainComponent::AmpSimLookAndFeel::drawComboBox(juce::Graphics& g,
                                                    int width,
                                                    int height,
                                                    bool isButtonDown,
                                                    int buttonX,
                                                    int buttonY,
                                                    int buttonW,
                                                    int buttonH,
                                                    juce::ComboBox& box)
{
    juce::ignoreUnused(isButtonDown, buttonX, buttonY, buttonW, buttonH, box);
    const auto bounds = juce::Rectangle<float>(0.5f, 0.5f, static_cast<float>(width) - 1.0f, static_cast<float>(height) - 1.0f);
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff142131), 0.0f, 0.0f, juce::Colour(0xff080c12), 0.0f, bounds.getBottom(), false));
    g.fillRoundedRectangle(bounds, 5.0f);
    g.setColour(juce::Colour(0xff45d6ff).withAlpha(0.82f));
    g.drawRoundedRectangle(bounds, 5.0f, 1.0f);

    juce::Path arrow;
    const auto cx = bounds.getRight() - 18.0f;
    const auto cy = bounds.getCentreY();
    arrow.startNewSubPath(cx - 5.0f, cy - 3.0f);
    arrow.lineTo(cx, cy + 3.0f);
    arrow.lineTo(cx + 5.0f, cy - 3.0f);
    g.setColour(juce::Colour(0xffd7fff0));
    g.strokePath(arrow, juce::PathStrokeType(2.0f));
}

juce::Font MainComponent::AmpSimLookAndFeel::getTextButtonFont(juce::TextButton&, int buttonHeight)
{
    return juce::Font(juce::FontOptions(juce::jmin(14.0f, static_cast<float>(buttonHeight) * 0.36f), juce::Font::bold));
}

MainComponent::MainComponent()
{
    setLookAndFeel(&ampSimLookAndFeel);

    titleLabel.setText("THALLBYSSAL", juce::dontSendNotification);
    titleLabel.setJustificationType(juce::Justification::centredLeft);
    styleLabel(titleLabel, 26.0f, true);
    addAndMakeVisible(titleLabel);

    statusLabel.setText("Abyss rig standalone. Select ASIO, choose guitar input, then shape the chain.", juce::dontSendNotification);
    statusLabel.setJustificationType(juce::Justification::centredLeft);
    styleLabel(statusLabel, 14.0f);
    statusLabel.setColour(juce::Label::textColourId, juce::Colour(0xff98f5d0));
    addAndMakeVisible(statusLabel);

    meterLabel.setText("Input -inf dB | Gate open 0% | DI -inf dB | Amp -inf dB | Out -inf dB", juce::dontSendNotification);
    meterLabel.setJustificationType(juce::Justification::centredLeft);
    styleLabel(meterLabel, 15.0f, true);
    addAndMakeVisible(meterLabel);

    irLabel.setText("Cab: Factory Mellow Cab", juce::dontSendNotification);
    irLabel.setJustificationType(juce::Justification::centredLeft);
    styleLabel(irLabel, 13.0f);
    addAndMakeVisible(irLabel);

    inputGain = &addSlider("Input", -18.0, 18.0, 0.0, " dB");
    transposeSemitones = &addSlider("Shift", -24.0, 24.0, 0.0, " st");
    octaveLayerBlend = &addSlider("Low Oct", 0.0, 100.0, 0.0, "%");
    palmMuteAmount = &addSlider("Catch", 0.0, 100.0, 62.0, "%");
    palmMuteFocus = &addSlider("Focus", 30.0, 2500.0, 720.0, " Hz");
    gateThreshold = &addSlider("Threshold", -85.0, -25.0, -58.0, " dB");
    gateRelease = &addSlider("Hold", 8.0, 220.0, 48.0, " ms");
    grinderAmount = &addSlider("Grind", 0.0, 100.0, 72.0, "%");
    diCurve = &addSlider("Curve", 0.0, 100.0, 82.0, "%");
    diAmount = &addSlider("Amount", 0.0, 100.0, 0.0, "%");
    diSmooth = &addSlider("Smooth", 0.0, 100.0, 48.0, "%");
    ampDrive = &addSlider("Gain", 1.0, 12.0, 8.4);
    ampBass = &addSlider("Bass", 0.0, 100.0, 26.0, "%");
    ampMid = &addSlider("Mid", 0.0, 100.0, 62.0, "%");
    ampTreble = &addSlider("Treble", 0.0, 100.0, 72.0, "%");
    ampPresence = &addSlider("Presence", 0.0, 100.0, 68.0, "%");
    ampMaster = &addSlider("Master", 0.0, 100.0, 70.0, "%");
    ampOutput = &addSlider("Output", -18.0, 12.0, 0.0, " dB");
    cabBlend = &addSlider("A/B mix", -100.0, 100.0, 0.0, "%");
    cabLowCut = &addSlider("Low cut", 20.0, 300.0, 20.0, " Hz");
    cabHighCut = &addSlider("High cut", 2000.0, 20000.0, 20000.0, " Hz");
    cabResonance = &addSlider("Room", 0.0, 100.0, 28.0, "%");
    cabLevel = &addSlider("Cab level", -18.0, 18.0, 0.0, " dB");
    cleanMix = &addSlider("Mix", 0.0, 100.0, 0.0, "%");
    cleanSpace = &addSlider("Space", 0.0, 100.0, 58.0, "%");
    cleanBass = &addSlider("Bass", 0.0, 100.0, 48.0, "%");
    cleanMid = &addSlider("Mid", 0.0, 100.0, 44.0, "%");
    cleanTreble = &addSlider("Treble", 0.0, 100.0, 62.0, "%");
    cleanPresence = &addSlider("Presence", 0.0, 100.0, 58.0, "%");
    cleanTone = &addSlider("Tone", 0.0, 100.0, 58.0, "%");
    cleanLevel = &addSlider("Level", -18.0, 12.0, 0.0, " dB");
    cleanDelayMix = &addSlider("Delay", 0.0, 100.0, 18.0, "%");
    cleanDelayTime = &addSlider("Time", 80.0, 1200.0, 380.0, " ms");
    cleanDelayFeedback = &addSlider("Feedback", 0.0, 100.0, 28.0, "%");
    cleanReverbMix = &addSlider("Reverb", 0.0, 100.0, 34.0, "%");
    cleanReverbDecay = &addSlider("Decay", 0.0, 100.0, 58.0, "%");
    ambientBlend = &addSlider("FX mix", 0.0, 100.0, 0.0, "%");
    ambientSize = &addSlider("Size", 0.0, 100.0, 58.0, "%");
    ambientFeedback = &addSlider("Fdbk", 0.0, 100.0, 34.0, "%");
    ambientGrain = &addSlider("Grain", 0.0, 100.0, 38.0, "%");
    ambientPitch = &addSlider("Pitch", -12.0, 12.0, 0.0, " st");
    ambientTone = &addSlider("Tone", 0.0, 100.0, 62.0, "%");
    ambientShimmer = &addSlider("Shmr", 0.0, 100.0, 22.0, "%");
    ambientReverse = &addSlider("Rev", 0.0, 100.0, 0.0, "%");
    ambientStutter = &addSlider("Stut", 0.0, 100.0, 0.0, "%");
    ambientRing = &addSlider("Ring", 0.0, 100.0, 0.0, "%");
    outputLevel = &addSlider("Output", -36.0, 12.0, 0.0, " dB");

    tonePresetLabel.setText("Tone preset", juce::dontSendNotification);
    styleLabel(tonePresetLabel, 13.0f, true);
    addAndMakeVisible(tonePresetLabel);
    tonePresetBox.addItem("Vild Standard Rhythm", 1);
    tonePresetBox.addItem("Humanity Low-Tuned Cut", 2);
    tonePresetBox.addItem("Glass Pick Attack", 3);
    tonePresetBox.addItem("Black Hole Breakdown", 4);
    tonePresetBox.addItem("Surgical Djent", 5);
    tonePresetBox.addItem("Ambient Clean Base", 6);
    tonePresetBox.addItem("Mirage Clear Chug", 7);
    tonePresetBox.addItem("Drop E Weight", 8);
    tonePresetBox.addItem("Lead Teeth", 9);
    tonePresetBox.addItem("Clean Void Bloom", 10);
    tonePresetBox.setSelectedId(1, juce::dontSendNotification);
    tonePresetBox.addListener(this);
    tonePresetBox.setColour(juce::ComboBox::backgroundColourId, juce::Colour(0xff111827));
    tonePresetBox.setColour(juce::ComboBox::textColourId, juce::Colours::white);
    tonePresetBox.setColour(juce::ComboBox::outlineColourId, juce::Colour(0xff4db6d8));
    addAndMakeVisible(tonePresetBox);

    rigTabButton.addListener(this);
    cabTabButton.addListener(this);
    cleanTabButton.addListener(this);
    fxTabButton.addListener(this);
    styleButton(rigTabButton);
    styleButton(cabTabButton);
    styleButton(cleanTabButton);
    styleButton(fxTabButton);
    addAndMakeVisible(rigTabButton);
    addAndMakeVisible(cabTabButton);
    addAndMakeVisible(cleanTabButton);
    addAndMakeVisible(fxTabButton);

    ampEnabled.setToggleState(true, juce::dontSendNotification);
    cleanEnabled.setToggleState(false, juce::dontSendNotification);
    ambientEnabled.setToggleState(false, juce::dontSendNotification);
    ampEnabled.addListener(this);
    cleanEnabled.addListener(this);
    ambientEnabled.addListener(this);
    styleButton(ampEnabled);
    styleButton(cleanEnabled);
    styleButton(ambientEnabled);
    addAndMakeVisible(ampEnabled);
    addAndMakeVisible(cleanEnabled);
    addAndMakeVisible(ambientEnabled);

    loadPresetButton.addListener(this);
    autoInputButton.addListener(this);
    outputModeButton.addListener(this);
    loadIrButton.addListener(this);
    loadIrBButton.addListener(this);
    factoryCabButton.addListener(this);
    clearIrAButton.addListener(this);
    clearIrBButton.addListener(this);
    cabSectionButton.addListener(this);
    cabIrButton.addListener(this);
    styleButton(loadPresetButton);
    styleButton(autoInputButton);
    styleButton(outputModeButton);
    styleButton(loadIrButton);
    styleButton(loadIrBButton);
    styleButton(factoryCabButton);
    styleButton(clearIrAButton);
    styleButton(clearIrBButton);
    styleButton(cabSectionButton);
    styleButton(cabIrButton);
    addAndMakeVisible(loadPresetButton);
    addAndMakeVisible(autoInputButton);
    outputModeButton.setClickingTogglesState(true);
    outputModeButton.setToggleState(true, juce::dontSendNotification);
    addAndMakeVisible(outputModeButton);
    addAndMakeVisible(loadIrButton);
    addAndMakeVisible(loadIrBButton);
    addAndMakeVisible(factoryCabButton);
    addAndMakeVisible(clearIrAButton);
    addAndMakeVisible(clearIrBButton);
    cabSectionButton.setClickingTogglesState(true);
    cabSectionButton.setToggleState(true, juce::dontSendNotification);
    cabIrButton.setClickingTogglesState(true);
    cabIrButton.setToggleState(true, juce::dontSendNotification);
    addAndMakeVisible(cabSectionButton);
    addAndMakeVisible(cabIrButton);

    inputChannelLabel.setText("Input source", juce::dontSendNotification);
    styleLabel(inputChannelLabel, 12.0f, true);
    addAndMakeVisible(inputChannelLabel);
    inputChannelBox.addItem("Auto", 1);
    inputChannelBox.addItem("Input 1", 2);
    inputChannelBox.addItem("Input 2", 3);
    for (int inputNumber = 3; inputNumber <= 8; ++inputNumber)
        inputChannelBox.addItem("Input " + juce::String(inputNumber), inputNumber + 1);
    inputChannelBox.setSelectedId(1, juce::dontSendNotification);
    inputChannelBox.addListener(this);
    inputChannelBox.setColour(juce::ComboBox::backgroundColourId, juce::Colour(0xff111827));
    inputChannelBox.setColour(juce::ComboBox::textColourId, juce::Colours::white);
    inputChannelBox.setColour(juce::ComboBox::outlineColourId, juce::Colour(0xff4db6d8));
    addAndMakeVisible(inputChannelBox);

    ampPanelLabel.setText("RHYTHM AMP", juce::dontSendNotification);
    ioPanelLabel.setText("AUDIO I/O", juce::dontSendNotification);
    pedalPanelLabel.setText("PEDALS", juce::dontSendNotification);
    diPanelLabel.setText("RIFT SCULPTOR", juce::dontSendNotification);
    cleanPanelLabel.setText("CLEAN SPACE", juce::dontSendNotification);
    cabPanelLabel.setText("CAB MIX", juce::dontSendNotification);
    fxPanelLabel.setText("FX RACK", juce::dontSendNotification);
    cabSlotALabel.setText("IR A: Factory Mellow Cab", juce::dontSendNotification);
    cabSlotBLabel.setText("IR B: Empty", juce::dontSendNotification);
    styleLabel(ampPanelLabel, 14.0f, true);
    styleLabel(ioPanelLabel, 14.0f, true);
    styleLabel(pedalPanelLabel, 14.0f, true);
    styleLabel(diPanelLabel, 14.0f, true);
    styleLabel(cleanPanelLabel, 14.0f, true);
    styleLabel(cabPanelLabel, 14.0f, true);
    styleLabel(fxPanelLabel, 14.0f, true);
    styleLabel(cabSlotALabel, 13.0f, true);
    styleLabel(cabSlotBLabel, 13.0f, true);
    addAndMakeVisible(ampPanelLabel);
    addAndMakeVisible(ioPanelLabel);
    addAndMakeVisible(pedalPanelLabel);
    addAndMakeVisible(diPanelLabel);
    addAndMakeVisible(cleanPanelLabel);
    addAndMakeVisible(cabPanelLabel);
    addAndMakeVisible(fxPanelLabel);
    addAndMakeVisible(cabSlotALabel);
    addAndMakeVisible(cabSlotBLabel);

    for (auto* pedal : { &gatePedal, &grindPedal })
    {
        pedal->setClickingTogglesState(true);
        pedal->addListener(this);
        styleButton(*pedal);
        addAndMakeVisible(*pedal);
    }

    gatePedal.setToggleState(true, juce::dontSendNotification);
    grindPedal.setToggleState(true, juce::dontSendNotification);

    for (auto* ambientSwitch : { &shimmerSwitch, &reverseSwitch, &stutterSwitch, &ringSwitch })
    {
        ambientSwitch->setClickingTogglesState(true);
        ambientSwitch->addListener(this);
        styleButton(*ambientSwitch);
        addAndMakeVisible(*ambientSwitch);
    }

    deviceSelector = std::make_unique<juce::AudioDeviceSelectorComponent>(
        deviceManager,
        0,
        32,
        0,
        32,
        true,
        true,
        true,
        false);
    deviceViewport.setViewedComponent(deviceSelector.get(), false);
    deviceViewport.setScrollBarsShown(true, false);
    addAndMakeVisible(deviceViewport);

    applyNativeTonePreset("vild-standard-rhythm");
    setAudioChannels(2, 2);
    updateEngineFromUi();
    startTimerHz(30);
    setSize(1320, 980);
}

MainComponent::~MainComponent()
{
    setLookAndFeel(nullptr);
    shutdownAudio();
}

void MainComponent::prepareToPlay(int samplesPerBlockExpected, double sampleRate)
{
    currentSampleRate = sampleRate;
    currentBlockSize = samplesPerBlockExpected;
    inputScratch.setSize(1, juce::jmax(1, samplesPerBlockExpected), false, false, true);
    engine.prepare(sampleRate, samplesPerBlockExpected);
    updateEngineFromUi();
}

void MainComponent::getNextAudioBlock(const juce::AudioSourceChannelInfo& bufferToFill)
{
    auto* buffer = bufferToFill.buffer;
    if (buffer == nullptr || bufferToFill.numSamples <= 0 || buffer->getNumChannels() <= 0)
        return;

    const auto samplesToProcess = juce::jmin(bufferToFill.numSamples, inputScratch.getNumSamples());

    inputScratch.clear();
    int activeInputChannel = 0;
    const auto requestedInputChannel = getRequestedInputChannel(buffer->getNumChannels());
    if (requestedInputChannel >= 0)
    {
        activeInputChannel = requestedInputChannel;
    }
    else
    {
        float activeInputPeak = 0.0f;
        for (int channel = 0; channel < buffer->getNumChannels(); ++channel)
        {
            float channelPeak = 0.0f;
            for (int sample = 0; sample < samplesToProcess; ++sample)
                channelPeak = juce::jmax(channelPeak, std::abs(buffer->getSample(channel, bufferToFill.startSample + sample)));

            if (channelPeak > activeInputPeak)
            {
                activeInputPeak = channelPeak;
                activeInputChannel = channel;
            }
        }
    }
    inputScratch.copyFrom(0, 0, *buffer, activeInputChannel, bufferToFill.startSample, samplesToProcess);

    if (autoInputGainActive)
    {
        const auto* rawInput = inputScratch.getReadPointer(0);
        for (int sampleIndex = 0; sampleIndex < samplesToProcess; ++sampleIndex)
            autoInputGainPeak = juce::jmax(autoInputGainPeak, std::abs(rawInput[sampleIndex]));
    }

    buffer->clear(bufferToFill.startSample, bufferToFill.numSamples);

    auto* left = buffer->getWritePointer(0, bufferToFill.startSample);
    auto* right = buffer->getNumChannels() > 1 ? buffer->getWritePointer(1, bufferToFill.startSample) : left;

    engine.process(inputScratch.getReadPointer(0), left, right, samplesToProcess);
}

void MainComponent::releaseResources()
{
    engine.reset();
}

int MainComponent::getRequestedInputChannel(int availableChannels) const
{
    const auto selectedId = inputChannelBox.getSelectedId();
    if (selectedId <= 1)
        return -1;

    const auto requestedInputChannel = selectedId - 2;
    return juce::isPositiveAndBelow(requestedInputChannel, availableChannels) ? requestedInputChannel : -1;
}

void MainComponent::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff05070b));

    auto bounds = getLocalBounds().reduced(22);
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff152333),
                                           static_cast<float>(bounds.getX()),
                                           static_cast<float>(bounds.getY()),
                                           juce::Colour(0xff07090d),
                                           static_cast<float>(bounds.getRight()),
                                           static_cast<float>(bounds.getBottom()),
                                           false));
    g.fillRoundedRectangle(bounds.toFloat(), 8.0f);

    auto header = bounds.removeFromTop(108);
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff111827),
                                           static_cast<float>(header.getX()),
                                           static_cast<float>(header.getY()),
                                           juce::Colour(0xff05070b),
                                           static_cast<float>(header.getRight()),
                                           static_cast<float>(header.getBottom()),
                                           false));
    g.fillRoundedRectangle(header.toFloat(), 8.0f);
    g.setColour(juce::Colour(0xff45d6ff));
    g.drawRoundedRectangle(header.toFloat().reduced(0.5f), 8.0f, 1.0f);
    g.setColour(juce::Colour(0xff45d6ff).withAlpha(0.10f));
    for (int line = 0; line < 12; ++line)
    {
        const auto x = header.getX() + 18 + line * 72;
        if (x < header.getRight() - 18)
            g.drawVerticalLine(x, static_cast<float>(header.getY() + 10), static_cast<float>(header.getBottom() - 10));
    }
    drawSignalChain(g, header.reduced(18, 10).removeFromRight(600).removeFromBottom(36));

    auto ioArea = bounds.removeFromRight(360).reduced(10, 0);
    auto leftStrip = bounds.removeFromLeft(126).reduced(0, 8);
    auto rightStrip = bounds.removeFromRight(126).reduced(0, 8);
    auto rigArea = bounds.reduced(10, 0);

    drawPanel(g, ioArea, {}, juce::Colour(0xff6ee7b7));
    drawPanel(g, leftStrip, {}, juce::Colour(0xff45d6ff));
    drawPanel(g, rightStrip, {}, juce::Colour(0xfffacc15));

    rigArea.removeFromTop(46);

    if (activePage == EditorPage::rig)
    {
        auto pedalArea = rigArea.removeFromTop(340).reduced(0, 8);
        drawPanel(g, pedalArea, {}, juce::Colour(0xfff97316));
        auto pedalSlots = pedalArea.reduced(20, 58);
        auto topSlots = pedalSlots.removeFromTop(pedalSlots.getHeight() / 2);
        auto bottomSlots = pedalSlots;
        auto gateSlot = topSlots.removeFromLeft(topSlots.getWidth() / 2).reduced(8, 5);
        auto grindSlot = topSlots.reduced(8, 5);
        auto transposeSlot = bottomSlots.removeFromLeft(bottomSlots.getWidth() / 2).reduced(8, 5);
        auto palmSlot = bottomSlots.reduced(8, 5);
        drawHardwareSlot(g, gateSlot, "GATE", juce::Colour(0xff38bdf8));
        drawHardwareSlot(g, grindSlot, "GRIND", juce::Colour(0xfff97316));
        drawHardwareSlot(g, transposeSlot, "TRANSPOSE / LOW OCT", juce::Colour(0xffa78bfa));
        drawHardwareSlot(g, palmSlot, "PALM CATCH", juce::Colour(0xff6ee7b7));

        auto diArea = rigArea.removeFromTop(150).reduced(0, 8);
        drawPanel(g, diArea, {}, juce::Colour(0xfffacc15));

        auto ampArea = rigArea.reduced(0, 8);
        drawPanel(g, ampArea, {}, juce::Colour(0xff45d6ff));
        auto ampFace = ampArea.reduced(18, 54);
        g.setGradientFill(juce::ColourGradient(juce::Colour(0xff1d2734),
                                               static_cast<float>(ampFace.getX()),
                                               static_cast<float>(ampFace.getY()),
                                               juce::Colour(0xff080b10),
                                               static_cast<float>(ampFace.getRight()),
                                               static_cast<float>(ampFace.getBottom()),
                                               false));
        g.fillRoundedRectangle(ampFace.toFloat(), 10.0f);
        g.setColour(juce::Colour(0xff45d6ff).withAlpha(0.38f));
        g.drawRoundedRectangle(ampFace.toFloat().reduced(0.5f), 10.0f, 1.0f);
        g.setColour(juce::Colour(0xff263443));
        for (int line = 0; line < 8; ++line)
        {
            const auto y = ampFace.getY() + 18 + line * 15;
            g.drawHorizontalLine(y, static_cast<float>(ampFace.getX() + 14), static_cast<float>(ampFace.getRight() - 14));
        }
        g.setColour(juce::Colour(0xffd7fff0).withAlpha(0.38f));
        g.setFont(juce::FontOptions(15.0f, juce::Font::bold));
        g.drawText("THALLBYSSAL ABYSS RIG", ampFace.reduced(18, 14).removeFromBottom(26), juce::Justification::centredLeft);

        auto curveArea = diArea.reduced(18, 42);
        curveArea = curveArea.removeFromRight(260);
        drawDiCurve(g, curveArea);
    }
    else if (activePage == EditorPage::cab)
    {
        auto cabPaintArea = rigArea.reduced(0, 8);
        drawPanel(g, cabPaintArea, {}, juce::Colour(0xfffacc15));

        auto room = cabPaintArea.reduced(18, 48);
        g.setGradientFill(juce::ColourGradient(juce::Colour(0xff17202b),
                                               static_cast<float>(room.getX()),
                                               static_cast<float>(room.getY()),
                                               juce::Colour(0xff07090d),
                                               static_cast<float>(room.getX()),
                                               static_cast<float>(room.getBottom()),
                                               false));
        g.fillRoundedRectangle(room.toFloat(), 10.0f);
        auto floor = room.removeFromBottom(room.getHeight() / 3);
        g.setColour(juce::Colour(0xff0d1118));
        g.fillRoundedRectangle(floor.toFloat(), 9.0f);
        g.setColour(juce::Colour(0xff2a3444).withAlpha(0.55f));
        for (int line = 0; line < 9; ++line)
        {
            const auto x = floor.getX() + line * floor.getWidth() / 8;
            g.drawLine(static_cast<float>(x),
                       static_cast<float>(floor.getY()),
                       static_cast<float>(room.getCentreX()),
                       static_cast<float>(floor.getBottom()),
                       1.0f);
        }

        auto speakerArea = cabPaintArea.reduced(34, 72).removeFromTop(320);
        drawCabinetGraphic(g, speakerArea.removeFromLeft(speakerArea.getWidth() / 2).reduced(14, 0), "IR A", loadedIrAName);
        drawCabinetGraphic(g, speakerArea.reduced(14, 0), "IR B", loadedIrBName);
    }
    else if (activePage == EditorPage::clean)
    {
        auto cleanPaintArea = rigArea.reduced(0, 8);
        drawPanel(g, cleanPaintArea, {}, juce::Colour(0xff6ee7b7));
        drawCleanRigGraphic(g, cleanPaintArea.reduced(24, 62));
    }
    else
    {
        auto fxPaintArea = rigArea.reduced(0, 8);
        drawPanel(g, fxPaintArea, {}, juce::Colour(0xffa78bfa));
        auto fxSlots = fxPaintArea.reduced(24, 84);
        auto topSlots = fxSlots.removeFromTop(fxSlots.getHeight() / 2);
        auto bottomSlots = fxSlots;
        drawHardwareSlot(g, topSlots.removeFromLeft(topSlots.getWidth() / 2).reduced(10, 8), "SHIMMER PITCH", juce::Colour(0xffa78bfa));
        drawHardwareSlot(g, topSlots.reduced(10, 8), "REVERSE SPACE", juce::Colour(0xff6ee7b7));
        drawHardwareSlot(g, bottomSlots.removeFromLeft(bottomSlots.getWidth() / 2).reduced(10, 8), "STUTTER GATE", juce::Colour(0xfff97316));
        drawHardwareSlot(g, bottomSlots.reduced(10, 8), "RING SCREAM", juce::Colour(0xffff4d6d));
    }

    drawClipMeter(g, leftStrip.reduced(18).removeFromBottom(80), cachedInputPeak, "INPUT");
    drawClipMeter(g, rightStrip.reduced(18).removeFromBottom(80), cachedOutputPeak, "OUTPUT");
}

void MainComponent::resized()
{
    auto bounds = getLocalBounds().reduced(34);
    auto header = bounds.removeFromTop(108);
    titleLabel.setBounds(header.removeFromTop(32));
    statusLabel.setBounds(header.removeFromTop(24));
    meterLabel.setBounds(header.removeFromTop(24));
    irLabel.setBounds(header.removeFromTop(20));

    bounds.removeFromTop(18);

    auto ioArea = bounds.removeFromRight(360).reduced(10, 0);
    auto leftStrip = bounds.removeFromLeft(126).reduced(12, 18);
    auto rightStrip = bounds.removeFromRight(126).reduced(12, 18);
    auto rigArea = bounds.reduced(10, 0);

    for (auto* slider : sliders)
        slider->setVisible(false);

    for (auto* label : sliderLabels)
        label->setVisible(false);

    for (auto* label : { &ampPanelLabel, &pedalPanelLabel, &diPanelLabel, &cleanPanelLabel, &cabPanelLabel, &fxPanelLabel, &cabSlotALabel, &cabSlotBLabel, &tonePresetLabel, &inputChannelLabel })
        label->setVisible(false);

    juce::Button* pageButtons[] = { &ampEnabled, &cleanEnabled, &ambientEnabled, &loadPresetButton, &loadIrButton, &loadIrBButton, &factoryCabButton, &clearIrAButton, &clearIrBButton, &cabSectionButton, &cabIrButton, &gatePedal, &grindPedal, &shimmerSwitch, &reverseSwitch, &stutterSwitch, &ringSwitch };
    for (auto* button : pageButtons)
        button->setVisible(false);

    tonePresetBox.setVisible(false);
    inputChannelBox.setVisible(false);

    auto sliderIndex = [this](juce::Slider* slider)
    {
        for (int index = 0; index < sliders.size(); ++index)
            if (sliders[index] == slider)
                return index;

        return -1;
    };

    auto placeKnobs = [this, sliderIndex](juce::Rectangle<int> area, std::initializer_list<juce::Slider*> knobs)
    {
        const auto count = static_cast<int>(knobs.size());
        if (count <= 0 || area.isEmpty())
            return;

        auto columnWidth = area.getWidth() / count;
        for (auto* knob : knobs)
        {
            const auto index = sliderIndex(knob);
            if (index < 0)
                continue;

            auto column = area.removeFromLeft(columnWidth).reduced(8, 0);
            sliderLabels[index]->setJustificationType(juce::Justification::centred);
            sliderLabels[index]->setBounds(column.removeFromTop(22));
            sliders[index]->setBounds(column.reduced(0, 4));
            sliderLabels[index]->setVisible(true);
            sliders[index]->setVisible(true);
        }
    };

    auto styleTab = [](juce::TextButton& button, bool active)
    {
        button.setColour(juce::TextButton::buttonColourId, active ? juce::Colour(0xff38bdf8) : juce::Colour(0xff111827));
        button.setColour(juce::TextButton::textColourOffId, active ? juce::Colour(0xff041018) : juce::Colours::white);
        button.setColour(juce::TextButton::textColourOnId, active ? juce::Colour(0xff041018) : juce::Colours::white);
    };

    ioPanelLabel.setBounds(ioArea.removeFromTop(28));
    deviceViewport.setBounds(ioArea);
    if (deviceSelector != nullptr)
        deviceSelector->setBounds(0, 0, juce::jmax(300, deviceViewport.getWidth() - 18), 720);

    ioPanelLabel.setVisible(true);
    placeKnobs(leftStrip.removeFromTop(172), { inputGain });
    autoInputButton.setBounds(leftStrip.removeFromTop(36).reduced(2));
    autoInputButton.setVisible(true);
    inputChannelLabel.setBounds(leftStrip.removeFromTop(22).reduced(2, 0));
    inputChannelBox.setBounds(leftStrip.removeFromTop(34).reduced(2));
    inputChannelLabel.setVisible(true);
    inputChannelBox.setVisible(true);
    placeKnobs(rightStrip.removeFromTop(192), { outputLevel });
    outputModeButton.setBounds(rightStrip.removeFromTop(38).reduced(2));
    outputModeButton.setVisible(true);

    auto tabRow = rigArea.removeFromTop(40);
    rigTabButton.setBounds(tabRow.removeFromLeft(104).reduced(4));
    cabTabButton.setBounds(tabRow.removeFromLeft(124).reduced(4));
    cleanTabButton.setBounds(tabRow.removeFromLeft(104).reduced(4));
    fxTabButton.setBounds(tabRow.removeFromLeft(90).reduced(4));
    rigTabButton.setVisible(true);
    cabTabButton.setVisible(true);
    cleanTabButton.setVisible(true);
    fxTabButton.setVisible(true);
    styleTab(rigTabButton, activePage == EditorPage::rig);
    styleTab(cabTabButton, activePage == EditorPage::cab);
    styleTab(cleanTabButton, activePage == EditorPage::clean);
    styleTab(fxTabButton, activePage == EditorPage::fx);

    if (activePage == EditorPage::rig)
    {
        auto pedalArea = rigArea.removeFromTop(340).reduced(16, 18);
        auto pedalHeader = pedalArea.removeFromTop(32);
        pedalPanelLabel.setBounds(pedalHeader.removeFromLeft(160));
        loadPresetButton.setBounds(pedalHeader.removeFromRight(180).reduced(4, 0));
        pedalPanelLabel.setVisible(true);
        loadPresetButton.setVisible(true);

        auto modules = pedalArea.reduced(10, 8);
        auto topModules = modules.removeFromTop(modules.getHeight() / 2);
        auto bottomModules = modules;
        auto gateModule = topModules.removeFromLeft(topModules.getWidth() / 2).reduced(10, 4);
        auto grinderModule = topModules.reduced(10, 4);
        auto transposeModule = bottomModules.removeFromLeft(bottomModules.getWidth() / 2).reduced(10, 4);
        auto palmMuteModule = bottomModules.reduced(10, 4);
        gatePedal.setBounds(gateModule.removeFromTop(40).removeFromLeft(120).reduced(4));
        grindPedal.setBounds(grinderModule.removeFromTop(40).removeFromLeft(132).reduced(4));
        gatePedal.setVisible(true);
        grindPedal.setVisible(true);
        placeKnobs(gateModule.reduced(0, 10), { gateThreshold });
        placeKnobs(grinderModule.reduced(0, 10), { grinderAmount });
        placeKnobs(transposeModule.reduced(0, 10), { transposeSemitones, octaveLayerBlend });
        placeKnobs(palmMuteModule.reduced(0, 10), { palmMuteAmount, palmMuteFocus });

        auto diArea = rigArea.removeFromTop(150).reduced(16, 18);
        diPanelLabel.setBounds(diArea.removeFromTop(24));
        diPanelLabel.setVisible(true);
        diArea.removeFromRight(270);
        placeKnobs(diArea.reduced(0, 6), { diAmount, diSmooth });

        auto ampArea = rigArea.reduced(16, 18);
        ampPanelLabel.setBounds(ampArea.removeFromTop(24));
        ampPanelLabel.setVisible(true);
        auto presetRow = ampArea.removeFromTop(34);
        tonePresetLabel.setBounds(presetRow.removeFromLeft(96));
        tonePresetBox.setBounds(presetRow.removeFromLeft(280));
        ampEnabled.setBounds(presetRow.removeFromLeft(130).reduced(8, 2));
        tonePresetLabel.setVisible(true);
        tonePresetBox.setVisible(true);
        ampEnabled.setVisible(true);
        placeKnobs(ampArea.reduced(0, 6), { ampDrive, ampBass, ampMid, ampTreble, ampPresence, ampMaster, ampOutput });

    }
    else if (activePage == EditorPage::cab)
    {
        auto cabArea = rigArea.reduced(18, 22);
        auto cabHeader = cabArea.removeFromTop(36);
        cabPanelLabel.setBounds(cabHeader.removeFromLeft(140));
        factoryCabButton.setBounds(cabHeader.removeFromRight(138).reduced(4, 2));
        cabIrButton.setBounds(cabHeader.removeFromRight(112).reduced(4, 2));
        cabSectionButton.setBounds(cabHeader.removeFromRight(138).reduced(4, 2));
        cabPanelLabel.setVisible(true);
        factoryCabButton.setVisible(true);
        cabIrButton.setVisible(true);
        cabSectionButton.setVisible(true);

        auto slotRow = cabArea.removeFromTop(326);
        auto slotA = slotRow.removeFromLeft(slotRow.getWidth() / 2).reduced(8);
        auto slotB = slotRow.reduced(8);
        cabSlotALabel.setBounds(slotA.removeFromTop(34).reduced(10, 0));
        auto slotAButtons = slotA.removeFromBottom(82);
        loadIrButton.setBounds(slotAButtons.removeFromTop(42).withSizeKeepingCentre(170, 36));
        clearIrAButton.setBounds(slotAButtons.removeFromTop(34).withSizeKeepingCentre(118, 28));
        cabSlotBLabel.setBounds(slotB.removeFromTop(34).reduced(10, 0));
        auto slotBButtons = slotB.removeFromBottom(82);
        loadIrBButton.setBounds(slotBButtons.removeFromTop(42).withSizeKeepingCentre(170, 36));
        clearIrBButton.setBounds(slotBButtons.removeFromTop(34).withSizeKeepingCentre(118, 28));
        loadIrButton.setVisible(true);
        loadIrBButton.setVisible(true);
        clearIrAButton.setVisible(true);
        clearIrBButton.setVisible(true);
        cabSlotALabel.setVisible(true);
        cabSlotBLabel.setVisible(true);

        auto knobArea = cabArea.removeFromTop(210).reduced(0, 18);
        placeKnobs(knobArea, { cabBlend, cabLowCut, cabHighCut, cabResonance, cabLevel });
    }
    else if (activePage == EditorPage::clean)
    {
        auto cleanArea = rigArea.reduced(18, 22);
        cleanPanelLabel.setBounds(cleanArea.removeFromTop(28));
        cleanPanelLabel.setVisible(true);
        cleanEnabled.setBounds(cleanArea.removeFromTop(44).removeFromLeft(170).reduced(4));
        cleanEnabled.setVisible(true);
        auto cleanMasterRow = cleanArea.removeFromTop(142).reduced(0, 10);
        placeKnobs(cleanMasterRow, { cleanMix, cleanLevel, cleanTone });
        auto cleanDelayRow = cleanArea.removeFromTop(142).reduced(0, 10);
        placeKnobs(cleanDelayRow, { cleanDelayMix, cleanDelayTime, cleanDelayFeedback });
        auto cleanReverbRow = cleanArea.removeFromTop(142).reduced(0, 10);
        placeKnobs(cleanReverbRow, { cleanReverbMix, cleanReverbDecay, cleanSpace });
        placeKnobs(cleanArea.reduced(0, 18), { cleanBass, cleanMid, cleanTreble, cleanPresence });
    }
    else
    {
        auto fxArea = rigArea.reduced(18, 22);
        fxPanelLabel.setBounds(fxArea.removeFromTop(28));
        fxPanelLabel.setVisible(true);
        auto masterRow = fxArea.removeFromTop(88);
        ambientEnabled.setBounds(masterRow.removeFromLeft(128).reduced(4, 18));
        ambientEnabled.setVisible(true);
        placeKnobs(masterRow.removeFromLeft(160).reduced(0, 4), { ambientBlend });

        auto modules = fxArea.reduced(0, 8);
        auto topModules = modules.removeFromTop(modules.getHeight() / 2);
        auto bottomModules = modules;
        auto shimmerModule = topModules.removeFromLeft(topModules.getWidth() / 2).reduced(12, 8);
        auto reverseModule = topModules.reduced(12, 8);
        auto stutterModule = bottomModules.removeFromLeft(bottomModules.getWidth() / 2).reduced(12, 8);
        auto ringModule = bottomModules.reduced(12, 8);

        shimmerSwitch.setBounds(shimmerModule.removeFromTop(40).removeFromLeft(120).reduced(4));
        reverseSwitch.setBounds(reverseModule.removeFromTop(40).removeFromLeft(120).reduced(4));
        stutterSwitch.setBounds(stutterModule.removeFromTop(40).removeFromLeft(120).reduced(4));
        ringSwitch.setBounds(ringModule.removeFromTop(40).removeFromLeft(100).reduced(4));
        shimmerSwitch.setVisible(true);
        reverseSwitch.setVisible(true);
        stutterSwitch.setVisible(true);
        ringSwitch.setVisible(true);

        placeKnobs(shimmerModule.reduced(0, 8), { ambientShimmer, ambientPitch, ambientTone });
        placeKnobs(reverseModule.reduced(0, 8), { ambientReverse, ambientSize });
        placeKnobs(stutterModule.reduced(0, 8), { ambientStutter, ambientGrain });
        placeKnobs(ringModule.reduced(0, 8), { ambientRing, ambientFeedback });
    }
}

void MainComponent::sliderValueChanged(juce::Slider*)
{
    updateEngineFromUi();
}

void MainComponent::buttonClicked(juce::Button* button)
{
    if (button == &autoInputButton)
    {
        startAutoInputGain();
        return;
    }

    if (button == &outputModeButton)
    {
        outputModeButton.setButtonText(outputModeButton.getToggleState() ? "STEREO" : "MONO");
        showActionStatus(outputModeButton.getToggleState() ? "Output mode: stereo" : "Output mode: mono");
        updateEngineFromUi();
        return;
    }

    if (button == &rigTabButton)
    {
        activePage = EditorPage::rig;
        resized();
        repaint();
        return;
    }

    if (button == &cabTabButton)
    {
        activePage = EditorPage::cab;
        resized();
        repaint();
        return;
    }

    if (button == &cleanTabButton)
    {
        activePage = EditorPage::clean;
        resized();
        repaint();
        return;
    }

    if (button == &fxTabButton)
    {
        activePage = EditorPage::fx;
        resized();
        repaint();
        return;
    }

    if (button == &loadPresetButton)
    {
        choosePresetFile();
        return;
    }

    if (button == &loadIrButton)
    {
        fileChooser = std::make_unique<juce::FileChooser>("Load cabinet IR A", juce::File(), "*.wav;*.aif;*.aiff;*.flac;*.mp3;*.ogg");
        fileChooser->launchAsync(juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                                 [this](const juce::FileChooser& chooser)
                                 {
                                     const auto file = chooser.getResult();
                                     if (file.existsAsFile())
                                         loadIrFile(file, 0);
                                 });
        return;
    }

    if (button == &loadIrBButton)
    {
        fileChooser = std::make_unique<juce::FileChooser>("Load cabinet IR B", juce::File(), "*.wav;*.aif;*.aiff;*.flac;*.mp3;*.ogg");
        fileChooser->launchAsync(juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                                 [this](const juce::FileChooser& chooser)
                                 {
                                     const auto file = chooser.getResult();
                                     if (file.existsAsFile())
                                         loadIrFile(file, 1);
        });
        return;
    }

    if (button == &factoryCabButton)
    {
        resetToFactoryCab();
        return;
    }

    if (button == &cabSectionButton)
    {
        showActionStatus(cabSectionButton.getToggleState() ? "Cab section enabled." : "Cab section bypassed.");
        updateEngineFromUi();
        return;
    }

    if (button == &cabIrButton)
    {
        showActionStatus(cabIrButton.getToggleState() ? "Cabs / IR enabled." : "Cabs / IR bypassed.");
        updateEngineFromUi();
        return;
    }

    if (button == &clearIrAButton)
    {
        clearCabSlot(0);
        return;
    }

    if (button == &clearIrBButton)
    {
        clearCabSlot(1);
        return;
    }

    updateEngineFromUi();
}

void MainComponent::comboBoxChanged(juce::ComboBox* comboBox)
{
    if (comboBox == &tonePresetBox)
    {
        applyNativeTonePreset(tonePresetBox.getText());
        return;
    }

    if (comboBox == &inputChannelBox)
    {
        showActionStatus("Input source: " + inputChannelBox.getText());
        return;
    }
}

void MainComponent::timerCallback()
{
    updateAutoInputGain();
    updateStatusText();
    repaint();
}

void MainComponent::updateEngineFromUi()
{
    ThallLabDspEngine::Parameters params;
    params.inputGainDb = static_cast<float>(inputGain->getValue());
    params.transposeSemitones = static_cast<float>(transposeSemitones->getValue());
    params.octaveLayerBlend = static_cast<float>(octaveLayerBlend->getValue());
    params.palmMuteAmount = static_cast<float>(palmMuteAmount->getValue());
    params.palmMuteFocusHz = static_cast<float>(palmMuteFocus->getValue());
    params.gateThresholdDb = static_cast<float>(gateThreshold->getValue());
    params.gateReleaseMs = static_cast<float>(gateRelease->getValue());
    params.grinderAmount = static_cast<float>(grinderAmount->getValue());
    params.diCurve = static_cast<float>(diCurve->getValue());
    params.diAmount = static_cast<float>(diAmount->getValue());
    params.diSmooth = static_cast<float>(diSmooth->getValue());
    params.ampDrive = static_cast<float>(ampDrive->getValue());
    params.ampBass = static_cast<float>(ampBass->getValue());
    params.ampMid = static_cast<float>(ampMid->getValue());
    params.ampTreble = static_cast<float>(ampTreble->getValue());
    params.ampPresence = static_cast<float>(ampPresence->getValue());
    params.ampMaster = static_cast<float>(ampMaster->getValue());
    params.ampOutputDb = static_cast<float>(ampOutput->getValue());
    params.cabBlend = static_cast<float>((cabBlend->getValue() + 100.0) * 0.5);
    params.cabLowCutHz = static_cast<float>(cabLowCut->getValue());
    params.cabHighCutHz = static_cast<float>(cabHighCut->getValue());
    params.cabResonance = static_cast<float>(cabResonance->getValue());
    params.cabLevel = static_cast<float>(cabLevel->getValue());
    params.cabSectionEnabled = cabSectionButton.getToggleState();
    params.cabIrEnabled = cabIrButton.getToggleState();
    params.cleanBlend = cleanEnabled.getToggleState() ? static_cast<float>(cleanMix->getValue()) : 0.0f;
    params.cleanSpace = static_cast<float>(cleanSpace->getValue());
    params.cleanBass = static_cast<float>(cleanBass->getValue());
    params.cleanMid = static_cast<float>(cleanMid->getValue());
    params.cleanTreble = static_cast<float>(cleanTreble->getValue());
    params.cleanPresence = static_cast<float>(cleanPresence->getValue());
    params.cleanTone = static_cast<float>(cleanTone->getValue());
    params.cleanLevel = static_cast<float>(cleanLevel->getValue());
    params.cleanDelayMix = static_cast<float>(cleanDelayMix->getValue());
    params.cleanDelayTimeMs = static_cast<float>(cleanDelayTime->getValue());
    params.cleanDelayFeedback = static_cast<float>(cleanDelayFeedback->getValue());
    params.cleanReverbMix = static_cast<float>(cleanReverbMix->getValue());
    params.cleanReverbDecay = static_cast<float>(cleanReverbDecay->getValue());
    params.ambientBlend = ambientEnabled.getToggleState() ? static_cast<float>(ambientBlend->getValue()) : 0.0f;
    params.ambientSize = static_cast<float>(ambientSize->getValue());
    params.ambientFeedback = static_cast<float>(ambientFeedback->getValue());
    params.ambientGrain = static_cast<float>(ambientGrain->getValue());
    params.ambientPitch = static_cast<float>(ambientPitch->getValue());
    params.ambientTone = static_cast<float>(ambientTone->getValue());
    params.ambientShimmer = shimmerSwitch.getToggleState() ? static_cast<float>(ambientShimmer->getValue()) : 0.0f;
    params.ambientReverse = reverseSwitch.getToggleState() ? static_cast<float>(ambientReverse->getValue()) : 0.0f;
    params.ambientStutter = stutterSwitch.getToggleState() ? static_cast<float>(ambientStutter->getValue()) : 0.0f;
    params.ambientRing = ringSwitch.getToggleState() ? static_cast<float>(ambientRing->getValue()) : 0.0f;
    params.outputGainDb = static_cast<float>(outputLevel->getValue());
    params.stereoOutput = outputModeButton.getToggleState();
    params.ampEnabled = ampEnabled.getToggleState();
    params.gateEnabled = gatePedal.getToggleState();
    params.grinderEnabled = grindPedal.getToggleState();
    params.ambientEnabled = ambientEnabled.getToggleState();
    engine.setParameters(params);
}

void MainComponent::applyNativeTonePreset(const juce::String& presetNameOrId)
{
    struct TonePreset
    {
        const char* id;
        const char* name;
        double input;
        double gateThreshold;
        double gateRelease;
        double grindAmount;
        double grindTone;
        double curve;
        double amount;
        double smooth;
        double gain;
        double bass;
        double mid;
        double treble;
        double presence;
        double master;
        double ampOutput;
        double cabLow;
        double cabHigh;
        double cabBody;
        double ambientBlend;
        double ambientSize;
        double ambientFeedback;
        double ambientGrain;
        double ambientPitch;
        double ambientTone;
        double ambientShimmer;
        double ambientReverse;
        double ambientStutter;
        double ambientRing;
        double output;
        bool gate;
        bool grinder;
        bool amp;
        double transpose = 0;
        double octaveBlend = 0;
        double palmAmount = 62;
        double palmFocus = 720;
        double grindLevel = 72;
        double cabBlend = 0;
        double cabLevel = 0;
        double cleanMix = 42;
        double cleanSpace = 78;
        double cleanBass = 48;
        double cleanMid = 44;
        double cleanTreble = 62;
        double cleanPresence = 58;
        double cleanTone = 62;
        double cleanLevel = -8;
        double cleanDelayMix = 22;
        double cleanDelayTime = 430;
        double cleanDelayFeedback = 30;
        double cleanReverbMix = 42;
        double cleanReverbDecay = 64;
    };

    static constexpr TonePreset presets[] = {
        { "vild-standard-rhythm", "Vild Standard Rhythm", 0, -62, 42, 74, 74, 72, 0, 48, 8.4, 26, 62, 72, 68, 70, 0, 95, 13500, 28, 0, 58, 34, 38, 0, 62, 22, 0, 0, 0, 0, true, true, true },
        { "humanity-low-tuned-cut", "Humanity Low-Tuned Cut", 0, -60, 36, 80, 78, 76, 0, 46, 9.2, 22, 66, 76, 72, 72, 0, 105, 12800, 30, 0, 52, 30, 34, 0, 62, 16, 0, 0, 0, 0, true, true, true },
        { "glass-pick-attack", "Glass Pick Attack", 0, -66, 34, 68, 92, 62, 0, 58, 7.8, 24, 54, 84, 82, 68, 0, 95, 15000, 24, 0, 40, 26, 30, 0, 68, 10, 0, 0, 0, 0, true, true, true },
        { "black-hole-breakdown", "Black Hole Breakdown", 0, -58, 58, 76, 48, 70, 0, 50, 9.6, 30, 54, 62, 54, 74, 0, 90, 11500, 38, 0, 66, 42, 48, -5, 46, 28, 0, 0, 0, 0, true, true, true },
        { "surgical-djent", "Surgical Djent", 0, -68, 28, 70, 82, 82, 0, 54, 7.4, 18, 70, 76, 74, 68, 0, 110, 14500, 24, 0, 38, 24, 28, 0, 70, 8, 0, 0, 0, 0, true, true, true },
        { "ambient-clean-base", "Ambient Clean Base", 0, -72, 130, 18, 42, 34, 0, 72, 2, 48, 46, 66, 42, 54, 0, 72, 7200, 42, 42, 78, 58, 64, 7, 70, 54, 36, 18, 12, -8, false, false, false },
        { "mirage-clear-chug", "Mirage Clear Chug", 0, -64, 32, 66, 86, 64, 0, 56, 7.8, 18, 56, 78, 82, 68, 0, 95, 15000, 24, 0, 46, 28, 28, 0, 70, 12, 0, 0, 0, 0, true, true, true },
        { "drop-e-weight", "Drop E Weight", 0, -60, 44, 78, 58, 74, 0, 46, 9.4, 28, 60, 66, 60, 74, 0, 85, 11800, 42, 0, 58, 36, 42, -12, 52, 24, 0, 0, 0, 0, true, true, true },
        { "lead-teeth", "Lead Teeth", 0, -68, 42, 62, 88, 58, 0, 60, 8.4, 22, 64, 84, 86, 66, 0, 105, 16000, 22, 0, 54, 30, 32, 7, 72, 18, 0, 0, 0, 0, true, true, true },
        { "clean-void-bloom", "Clean Void Bloom", 0, -74, 150, 12, 40, 26, 0, 80, 2, 50, 42, 72, 62, 58, 0, 68, 7600, 48, 58, 86, 66, 72, 7, 76, 70, 42, 20, 10, -8, false, false, false }
    };

    for (int index = 0; index < static_cast<int>(std::size(presets)); ++index)
    {
        const auto& preset = presets[index];
        if (presetNameOrId == preset.id || presetNameOrId == preset.name)
        {
            tonePresetBox.setSelectedId(index + 1, juce::dontSendNotification);
            inputGain->setValue(preset.input, juce::dontSendNotification);
            transposeSemitones->setValue(preset.transpose, juce::dontSendNotification);
            octaveLayerBlend->setValue(preset.octaveBlend, juce::dontSendNotification);
            palmMuteAmount->setValue(preset.palmAmount, juce::dontSendNotification);
            palmMuteFocus->setValue(preset.palmFocus, juce::dontSendNotification);
            gateThreshold->setValue(preset.gateThreshold, juce::dontSendNotification);
            gateRelease->setValue(preset.gateRelease, juce::dontSendNotification);
            grinderAmount->setValue(preset.grindAmount, juce::dontSendNotification);
            diCurve->setValue(preset.curve, juce::dontSendNotification);
            diAmount->setValue(preset.amount, juce::dontSendNotification);
            diSmooth->setValue(preset.smooth, juce::dontSendNotification);
            ampDrive->setValue(preset.gain, juce::dontSendNotification);
            ampBass->setValue(preset.bass, juce::dontSendNotification);
            ampMid->setValue(preset.mid, juce::dontSendNotification);
            ampTreble->setValue(preset.treble, juce::dontSendNotification);
            ampPresence->setValue(preset.presence, juce::dontSendNotification);
            ampMaster->setValue(preset.master, juce::dontSendNotification);
            ampOutput->setValue(preset.ampOutput, juce::dontSendNotification);
            cabBlend->setValue(preset.cabBlend, juce::dontSendNotification);
            cabLowCut->setValue(preset.cabLow, juce::dontSendNotification);
            cabHighCut->setValue(preset.cabHigh, juce::dontSendNotification);
            cabResonance->setValue(preset.cabBody, juce::dontSendNotification);
            cabLevel->setValue(preset.cabLevel, juce::dontSendNotification);
            cleanMix->setValue(preset.cleanMix, juce::dontSendNotification);
            cleanSpace->setValue(preset.cleanSpace, juce::dontSendNotification);
            cleanBass->setValue(preset.cleanBass, juce::dontSendNotification);
            cleanMid->setValue(preset.cleanMid, juce::dontSendNotification);
            cleanTreble->setValue(preset.cleanTreble, juce::dontSendNotification);
            cleanPresence->setValue(preset.cleanPresence, juce::dontSendNotification);
            cleanTone->setValue(preset.cleanTone, juce::dontSendNotification);
            cleanLevel->setValue(preset.cleanLevel, juce::dontSendNotification);
            cleanDelayMix->setValue(preset.cleanDelayMix, juce::dontSendNotification);
            cleanDelayTime->setValue(preset.cleanDelayTime, juce::dontSendNotification);
            cleanDelayFeedback->setValue(preset.cleanDelayFeedback, juce::dontSendNotification);
            cleanReverbMix->setValue(preset.cleanReverbMix, juce::dontSendNotification);
            cleanReverbDecay->setValue(preset.cleanReverbDecay, juce::dontSendNotification);
            ambientBlend->setValue(preset.ambientBlend, juce::dontSendNotification);
            ambientSize->setValue(preset.ambientSize, juce::dontSendNotification);
            ambientFeedback->setValue(preset.ambientFeedback, juce::dontSendNotification);
            ambientGrain->setValue(preset.ambientGrain, juce::dontSendNotification);
            ambientPitch->setValue(preset.ambientPitch, juce::dontSendNotification);
            ambientTone->setValue(preset.ambientTone, juce::dontSendNotification);
            ambientShimmer->setValue(preset.ambientShimmer, juce::dontSendNotification);
            ambientReverse->setValue(preset.ambientReverse, juce::dontSendNotification);
            ambientStutter->setValue(preset.ambientStutter, juce::dontSendNotification);
            ambientRing->setValue(preset.ambientRing, juce::dontSendNotification);
            outputLevel->setValue(preset.output, juce::dontSendNotification);
            gatePedal.setToggleState(preset.gate, juce::dontSendNotification);
            grindPedal.setToggleState(preset.grinder, juce::dontSendNotification);
            cabSectionButton.setToggleState(true, juce::dontSendNotification);
            cabIrButton.setToggleState(true, juce::dontSendNotification);
            ampEnabled.setToggleState(preset.amp, juce::dontSendNotification);
            cleanEnabled.setToggleState(!preset.amp, juce::dontSendNotification);
            ambientEnabled.setToggleState(!preset.amp, juce::dontSendNotification);
            shimmerSwitch.setToggleState(preset.ambientShimmer > 0.0, juce::dontSendNotification);
            reverseSwitch.setToggleState(preset.ambientReverse > 0.0, juce::dontSendNotification);
            stutterSwitch.setToggleState(preset.ambientStutter > 0.0, juce::dontSendNotification);
            ringSwitch.setToggleState(preset.ambientRing > 0.0, juce::dontSendNotification);
            showActionStatus("Tone preset: " + juce::String(preset.name));
            updateEngineFromUi();
            return;
        }
    }
}

void MainComponent::updateStatusText()
{
    cachedInputPeak = engine.getInputPeak();
    cachedOutputPeak = engine.getOutputPeak();
    if (actionStatusText.isNotEmpty() && juce::Time::getMillisecondCounterHiRes() >= actionStatusExpiresAtMs)
        actionStatusText.clear();

    const auto inputDb = juce::Decibels::gainToDecibels(engine.getInputPeak(), -96.0f);
    const auto diDb = juce::Decibels::gainToDecibels(engine.getDiPeak(), -96.0f);
    const auto ampDb = juce::Decibels::gainToDecibels(engine.getAmpPeak(), -96.0f);
    const auto outputDb = juce::Decibels::gainToDecibels(engine.getOutputPeak(), -96.0f);
    meterLabel.setText("Input " + juce::String(inputDb, 1) + " dB | Gate open "
                           + juce::String(engine.getGateGain() * 100.0f, 0)
                           + "% | DI " + juce::String(diDb, 1)
                           + " dB | Amp " + juce::String(ampDb, 1)
                           + " dB | Out " + juce::String(outputDb, 1) + " dB",
                       juce::dontSendNotification);

    if (auto* device = deviceManager.getCurrentAudioDevice())
    {
        const auto inputSourceText = inputChannelBox.getSelectedId() <= 1 ? juce::String("Input Auto") : inputChannelBox.getText();
        auto statusText = "Device: " + device->getName()
                          + " | Type: " + deviceManager.getCurrentAudioDeviceType()
                          + " | " + juce::String(currentSampleRate, 0) + " Hz"
                          + " | Block " + juce::String(currentBlockSize)
                          + " | " + inputSourceText
                          + " | " + (outputModeButton.getToggleState() ? "Stereo" : "Mono");
        if (actionStatusText.isNotEmpty())
            statusText += " | " + actionStatusText;

        statusLabel.setText(statusText, juce::dontSendNotification);
        return;
    }

    statusLabel.setText(actionStatusText.isNotEmpty() ? actionStatusText : "No audio device open. Select ASIO/WASAPI device below.",
                        juce::dontSendNotification);
}

void MainComponent::showActionStatus(const juce::String& message)
{
    actionStatusText = message;
    actionStatusExpiresAtMs = juce::Time::getMillisecondCounterHiRes() + 4200.0;
    statusLabel.setText(message, juce::dontSendNotification);
}

void MainComponent::choosePresetFile()
{
    fileChooser = std::make_unique<juce::FileChooser>("Load thall-lab-preset.json", juce::File(), "*.json");
    fileChooser->launchAsync(juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                             [this](const juce::FileChooser& chooser)
                             {
                                 const auto file = chooser.getResult();
                                 if (file.existsAsFile())
                                     loadPresetFile(file);
                             });
}

void MainComponent::chooseIrFile()
{
    fileChooser = std::make_unique<juce::FileChooser>("Load cabinet IR", juce::File(), "*.wav;*.aif;*.aiff;*.flac;*.mp3;*.ogg");
    fileChooser->launchAsync(juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                             [this](const juce::FileChooser& chooser)
                             {
                                 const auto file = chooser.getResult();
                                 if (file.existsAsFile())
                                     loadIrFile(file, 0);
                             });
}

void MainComponent::loadPresetFile(const juce::File& file)
{
    const auto parsed = juce::JSON::parse(file);
    const auto* root = parsed.getDynamicObject();

    if (root == nullptr)
    {
        statusLabel.setText("Could not read preset JSON.", juce::dontSendNotification);
        return;
    }

    auto getObject = [root](const juce::Identifier& id) -> juce::DynamicObject*
    {
        return root->getProperty(id).getDynamicObject();
    };
    auto getNumber = [](juce::DynamicObject* object, const juce::Identifier& id, double fallback) -> double
    {
        if (object == nullptr)
            return fallback;

        const auto value = object->getProperty(id);
        return value.isDouble() || value.isInt() || value.isInt64() ? static_cast<double>(value) : fallback;
    };
    auto getBool = [](juce::DynamicObject* object, const juce::Identifier& id, bool fallback) -> bool
    {
        if (object == nullptr)
            return fallback;

        const auto value = object->getProperty(id);
        return value.isBool() ? static_cast<bool>(value) : fallback;
    };
    auto getString = [](juce::DynamicObject* object, const juce::Identifier& id) -> juce::String
    {
        if (object == nullptr)
            return {};

        return object->getProperty(id).toString();
    };

    auto* audio = getObject("audio");
    auto* transpose = getObject("transpose");
    auto* octaveLayer = getObject("octaveLayer");
    auto* palmMute = getObject("palmMute");
    auto* gate = getObject("gate");
    auto* grinder = getObject("grinder");
    auto* di = getObject("di");
    auto* amp = getObject("amp");
    auto* cab = getObject("cab");
    auto* clean = getObject("clean");
    auto* ambient = getObject("ambient");
    auto* fx = getObject("fx");
    if (fx == nullptr)
        fx = ambient;

    const auto presetId = getString(amp, "presetId");
    if (presetId.isNotEmpty())
        applyNativeTonePreset(presetId);

    inputGain->setValue(getNumber(audio, "inputGainDb", inputGain->getValue()), juce::dontSendNotification);
    const auto requestedTranspose = getNumber(transpose, "semitones", getNumber(audio, "transposeSemitones", transposeSemitones->getValue()));
    transposeSemitones->setValue(requestedTranspose, juce::dontSendNotification);
    octaveLayerBlend->setValue(getNumber(octaveLayer, "blend", getNumber(transpose, "mix", octaveLayerBlend->getValue())), juce::dontSendNotification);
    palmMuteAmount->setValue(getNumber(palmMute, "amount", getNumber(palmMute, "sensitivity", palmMuteAmount->getValue())), juce::dontSendNotification);
    palmMuteFocus->setValue(getNumber(palmMute, "focusHz", palmMuteFocus->getValue()), juce::dontSendNotification);
    outputLevel->setValue(getNumber(audio, "outputGainDb", outputLevel->getValue()), juce::dontSendNotification);
    const auto outputMode = getString(audio, "outputMode").toLowerCase();
    if (outputMode == "mono" || outputMode == "stereo")
    {
        outputModeButton.setToggleState(outputMode != "mono", juce::dontSendNotification);
        outputModeButton.setButtonText(outputModeButton.getToggleState() ? "STEREO" : "MONO");
    }
    gatePedal.setToggleState(getBool(gate, "enabled", gatePedal.getToggleState()), juce::dontSendNotification);
    gateThreshold->setValue(getNumber(gate, "thresholdDb", gateThreshold->getValue()), juce::dontSendNotification);
    gateRelease->setValue(getNumber(gate, "releaseMs", gateRelease->getValue()), juce::dontSendNotification);
    grindPedal.setToggleState(getBool(grinder, "enabled", grindPedal.getToggleState()), juce::dontSendNotification);
    grinderAmount->setValue(getNumber(grinder, "amount", grinderAmount->getValue()), juce::dontSendNotification);
    grinderAmount->setValue(getNumber(grinder, "drive", grinderAmount->getValue()), juce::dontSendNotification);
    diCurve->setValue(getNumber(di, "curve", diCurve->getValue()), juce::dontSendNotification);
    diAmount->setValue(getNumber(di, "amount", diAmount->getValue()), juce::dontSendNotification);
    diSmooth->setValue(getNumber(di, "smooth", diSmooth->getValue()), juce::dontSendNotification);
    ampEnabled.setToggleState(getBool(amp, "enabled", ampEnabled.getToggleState()), juce::dontSendNotification);
    ampDrive->setValue(getNumber(amp, "gain", getNumber(amp, "drive", ampDrive->getValue())), juce::dontSendNotification);
    ampBass->setValue(getNumber(amp, "bass", ampBass->getValue()), juce::dontSendNotification);
    ampMid->setValue(getNumber(amp, "mid", ampMid->getValue()), juce::dontSendNotification);
    ampTreble->setValue(getNumber(amp, "treble", ampTreble->getValue()), juce::dontSendNotification);
    ampPresence->setValue(getNumber(amp, "presence", ampPresence->getValue()), juce::dontSendNotification);
    ampMaster->setValue(getNumber(amp, "master", ampMaster->getValue()), juce::dontSendNotification);
    ampOutput->setValue(getNumber(amp, "outputDb", getNumber(amp, "output", ampOutput->getValue())), juce::dontSendNotification);
    cabBlend->setValue(getNumber(cab, "blend", (cabBlend->getValue() + 100.0) * 0.5) * 2.0 - 100.0, juce::dontSendNotification);
    cabLowCut->setValue(getNumber(cab, "lowCutHz", cabLowCut->getValue()), juce::dontSendNotification);
    cabHighCut->setValue(getNumber(cab, "highCutHz", cabHighCut->getValue()), juce::dontSendNotification);
    cabResonance->setValue(getNumber(cab, "room", getNumber(cab, "resonance", cabResonance->getValue())), juce::dontSendNotification);
    cabLevel->setValue(getNumber(cab, "level", cabLevel->getValue()), juce::dontSendNotification);
    cabSectionButton.setToggleState(getBool(cab, "enabled", cabSectionButton.getToggleState()), juce::dontSendNotification);
    cabIrButton.setToggleState(getBool(cab, "irEnabled", cabIrButton.getToggleState()), juce::dontSendNotification);
    cleanEnabled.setToggleState(getBool(clean, "enabled", cleanEnabled.getToggleState()), juce::dontSendNotification);
    cleanMix->setValue(getNumber(clean, "mix", cleanMix->getValue()), juce::dontSendNotification);
    cleanSpace->setValue(getNumber(clean, "space", cleanSpace->getValue()), juce::dontSendNotification);
    cleanBass->setValue(getNumber(clean, "bass", cleanBass->getValue()), juce::dontSendNotification);
    cleanMid->setValue(getNumber(clean, "mid", cleanMid->getValue()), juce::dontSendNotification);
    cleanTreble->setValue(getNumber(clean, "treble", cleanTreble->getValue()), juce::dontSendNotification);
    cleanPresence->setValue(getNumber(clean, "presence", cleanPresence->getValue()), juce::dontSendNotification);
    cleanTone->setValue(getNumber(clean, "tone", cleanTone->getValue()), juce::dontSendNotification);
    cleanLevel->setValue(getNumber(clean, "level", cleanLevel->getValue()), juce::dontSendNotification);
    cleanDelayMix->setValue(getNumber(clean, "delayMix", cleanDelayMix->getValue()), juce::dontSendNotification);
    cleanDelayTime->setValue(getNumber(clean, "delayTimeMs", cleanDelayTime->getValue()), juce::dontSendNotification);
    cleanDelayFeedback->setValue(getNumber(clean, "delayFeedback", cleanDelayFeedback->getValue()), juce::dontSendNotification);
    cleanReverbMix->setValue(getNumber(clean, "reverbMix", cleanReverbMix->getValue()), juce::dontSendNotification);
    cleanReverbDecay->setValue(getNumber(clean, "reverbDecay", cleanReverbDecay->getValue()), juce::dontSendNotification);
    ambientEnabled.setToggleState(getBool(fx, "enabled", ambientEnabled.getToggleState()), juce::dontSendNotification);
    ambientBlend->setValue(getNumber(fx, "mix", getNumber(fx, "blend", ambientBlend->getValue())), juce::dontSendNotification);
    ambientSize->setValue(getNumber(fx, "size", ambientSize->getValue()), juce::dontSendNotification);
    ambientFeedback->setValue(getNumber(fx, "feedback", ambientFeedback->getValue()), juce::dontSendNotification);
    ambientGrain->setValue(getNumber(fx, "grain", ambientGrain->getValue()), juce::dontSendNotification);
    ambientPitch->setValue(getNumber(fx, "pitch", ambientPitch->getValue()), juce::dontSendNotification);
    ambientTone->setValue(getNumber(fx, "tone", ambientTone->getValue()), juce::dontSendNotification);
    ambientShimmer->setValue(getNumber(fx, "shimmer", ambientShimmer->getValue()), juce::dontSendNotification);
    ambientReverse->setValue(getNumber(fx, "reverse", ambientReverse->getValue()), juce::dontSendNotification);
    ambientStutter->setValue(getNumber(fx, "stutter", ambientStutter->getValue()), juce::dontSendNotification);
    ambientRing->setValue(getNumber(fx, "ring", ambientRing->getValue()), juce::dontSendNotification);
    shimmerSwitch.setToggleState(getBool(fx, "shimmerEnabled", shimmerSwitch.getToggleState()), juce::dontSendNotification);
    reverseSwitch.setToggleState(getBool(fx, "reverseEnabled", reverseSwitch.getToggleState()), juce::dontSendNotification);
    stutterSwitch.setToggleState(getBool(fx, "stutterEnabled", stutterSwitch.getToggleState()), juce::dontSendNotification);
    ringSwitch.setToggleState(getBool(fx, "ringEnabled", ringSwitch.getToggleState()), juce::dontSendNotification);
    updateEngineFromUi();

    const auto irFileName = getString(audio, "cabIrFileName");
    if (irFileName.isNotEmpty())
    {
        const auto siblingIr = file.getSiblingFile(irFileName);
        const auto importedIr = file.getParentDirectory().getParentDirectory().getChildFile("imports").getChildFile(irFileName);

        if (siblingIr.existsAsFile())
            loadIrFile(siblingIr, 0);
        else if (importedIr.existsAsFile())
            loadIrFile(importedIr, 0);
        else
            irLabel.setText("Cab IR referenced by preset: " + irFileName + " (load manually)", juce::dontSendNotification);
    }

    const auto irBFileName = getString(audio, "cabIrBFileName");
    if (irBFileName.isNotEmpty())
    {
        const auto siblingIr = file.getSiblingFile(irBFileName);
        const auto importedIr = file.getParentDirectory().getParentDirectory().getChildFile("imports").getChildFile(irBFileName);

        if (siblingIr.existsAsFile())
            loadIrFile(siblingIr, 1);
        else if (importedIr.existsAsFile())
            loadIrFile(importedIr, 1);
    }

    showActionStatus("Loaded preset: " + file.getFileName()
                     + " | Shift " + juce::String(transposeSemitones->getValue(), 0) + " st"
                     + " | Low Oct " + juce::String(octaveLayerBlend->getValue(), 0) + "%"
                     + " | " + outputModeButton.getButtonText());
}

bool MainComponent::loadIrFile(const juce::File& file, int slot)
{
    if (!engine.loadCabIrFile(file, slot))
    {
        irLabel.setText("IR load failed: " + file.getFileName(), juce::dontSendNotification);
        showActionStatus("IR load failed: " + file.getFileName());
        return false;
    }

    if (slot == 1)
    {
        loadedIrBName = file.getFileName();
        if (!engine.hasCabIr(0))
            loadedIrAName = "Empty";
    }
    else
    {
        loadedIrAName = file.getFileName();
        loadedIrName = loadedIrAName;
    }

    updateCabLabels();
    showActionStatus("Loaded IR " + juce::String(slot == 1 ? "B" : "A") + ": " + file.getFileName());
    return true;
}

void MainComponent::clearCabSlot(int slot)
{
    engine.clearCabIr(slot);
    if (slot == 1)
        loadedIrBName = "Empty";
    else
        loadedIrAName = engine.hasCabIr(1) ? "Empty" : "Factory Mellow Cab";

    updateCabLabels();
    showActionStatus(slot == 1 ? "Cleared IR B." : "Cleared IR A.");
}

void MainComponent::resetToFactoryCab()
{
    engine.clearCabIr();
    loadedIrName = "Factory Mellow Cab";
    loadedIrAName = "Factory Mellow Cab";
    loadedIrBName = "Empty";
    cabBlend->setValue(0.0, juce::dontSendNotification);
    cabLowCut->setValue(20.0, juce::dontSendNotification);
    cabHighCut->setValue(20000.0, juce::dontSendNotification);
    cabLevel->setValue(0.0, juce::dontSendNotification);
    cabSectionButton.setToggleState(true, juce::dontSendNotification);
    cabIrButton.setToggleState(true, juce::dontSendNotification);
    updateEngineFromUi();
    updateCabLabels();
    showActionStatus("Factory cab restored. External IR A/B cleared.");
}

void MainComponent::updateCabLabels()
{
    const auto hasA = engine.hasCabIr(0);
    const auto hasB = engine.hasCabIr(1);

    if (!hasA && !hasB)
    {
        loadedIrName = "Factory Mellow Cab";
        loadedIrAName = "Factory Mellow Cab";
        loadedIrBName = "Empty";
        cabSlotALabel.setText("IR A: " + loadedIrAName, juce::dontSendNotification);
        cabSlotBLabel.setText("IR B: " + loadedIrBName, juce::dontSendNotification);
        irLabel.setText("Cab: Factory Mellow Cab", juce::dontSendNotification);
        return;
    }

    if (!hasA)
        loadedIrAName = "Empty";
    if (!hasB)
        loadedIrBName = "Empty";

    loadedIrName = hasA ? loadedIrAName : loadedIrBName;
    cabSlotALabel.setText("IR A: " + loadedIrAName, juce::dontSendNotification);
    cabSlotBLabel.setText("IR B: " + loadedIrBName, juce::dontSendNotification);
    irLabel.setText("External IRs: A " + loadedIrAName + " | B " + loadedIrBName, juce::dontSendNotification);
}

void MainComponent::startAutoInputGain()
{
    autoInputGainActive = true;
    autoInputGainPeak = 0.0f;
    autoInputGainStartedAtMs = juce::Time::getMillisecondCounterHiRes();
    autoInputButton.setButtonText("Listening...");
    showActionStatus("Auto Input Gain: play your hardest chugs for 5 seconds.");
}

void MainComponent::updateAutoInputGain()
{
    if (!autoInputGainActive)
        return;

    const auto elapsedMs = juce::Time::getMillisecondCounterHiRes() - autoInputGainStartedAtMs;
    const auto remainingSeconds = juce::jmax(0, 5 - static_cast<int>(elapsedMs / 1000.0));
    autoInputButton.setButtonText("Auto " + juce::String(remainingSeconds) + "s");

    if (elapsedMs < 5000.0)
        return;

    autoInputGainActive = false;
    autoInputButton.setButtonText("Auto Input");

    if (autoInputGainPeak < 0.0003f)
    {
        showActionStatus("Auto Input Gain: no strong guitar signal detected.");
        return;
    }

    const auto rawPeakDb = juce::Decibels::gainToDecibels(autoInputGainPeak, -96.0f);
    const auto targetPeakDb = -9.0f;
    const auto newInputDb = juce::jlimit(-18.0, 18.0, static_cast<double>(targetPeakDb - rawPeakDb));
    inputGain->setValue(newInputDb, juce::sendNotificationSync);
    showActionStatus("Auto Input Gain set to " + juce::String(newInputDb, 1) + " dB from raw peak "
                     + juce::String(rawPeakDb, 1) + " dB.");
}

juce::Slider& MainComponent::addSlider(const juce::String& name, double min, double max, double value, const juce::String& suffix)
{
    auto* label = new juce::Label();
    label->setText(name, juce::dontSendNotification);
    styleLabel(*label, 13.0f, true);
    addAndMakeVisible(label);
    sliderLabels.add(label);

    auto* slider = new juce::Slider(juce::Slider::RotaryHorizontalVerticalDrag, juce::Slider::TextBoxBelow);
    slider->setRange(min, max, 1.0);
    slider->setValue(value, juce::dontSendNotification);
    slider->setTextValueSuffix(suffix);
    slider->setColour(juce::Slider::rotarySliderFillColourId, juce::Colour(0xff45d6ff));
    slider->setColour(juce::Slider::rotarySliderOutlineColourId, juce::Colour(0xff263443));
    slider->setColour(juce::Slider::thumbColourId, juce::Colour(0xfffacc15));
    slider->setColour(juce::Slider::textBoxBackgroundColourId, juce::Colour(0xff111827));
    slider->setColour(juce::Slider::textBoxTextColourId, juce::Colours::white);
    slider->setColour(juce::Slider::textBoxOutlineColourId, juce::Colour(0xff334155));
    slider->addListener(this);
    addAndMakeVisible(slider);
    sliders.add(slider);
    return *slider;
}

void MainComponent::styleButton(juce::Button& button)
{
    button.setColour(juce::TextButton::buttonColourId, juce::Colour(0xff111827));
    button.setColour(juce::TextButton::buttonOnColourId, juce::Colour(0xff1f8fb5));
    button.setColour(juce::TextButton::textColourOffId, juce::Colour(0xffd7fff0));
    button.setColour(juce::TextButton::textColourOnId, juce::Colours::white);
}

void MainComponent::styleLabel(juce::Label& label, float size, bool bold)
{
    label.setColour(juce::Label::textColourId, juce::Colour(0xffd7fff0));
    label.setFont(juce::FontOptions(size, bold ? juce::Font::bold : juce::Font::plain));
}

void MainComponent::drawPanel(juce::Graphics& g, juce::Rectangle<int> area, const juce::String& title, juce::Colour accent)
{
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff121a24),
                                           static_cast<float>(area.getX()),
                                           static_cast<float>(area.getY()),
                                           juce::Colour(0xff06090e),
                                           static_cast<float>(area.getRight()),
                                           static_cast<float>(area.getBottom()),
                                           false));
    g.fillRoundedRectangle(area.toFloat(), 8.0f);
    g.setColour(accent.withAlpha(0.08f));
    g.fillRoundedRectangle(area.reduced(3).toFloat(), 6.0f);
    g.setColour(accent.withAlpha(0.72f));
    g.drawRoundedRectangle(area.toFloat().reduced(0.5f), 8.0f, 1.0f);

    if (title.isNotEmpty())
    {
        g.setColour(accent);
        g.setFont(juce::FontOptions(13.0f, juce::Font::bold));
        g.drawText(title, area.reduced(16, 10).removeFromTop(20), juce::Justification::centredLeft);
    }
}

void MainComponent::drawHardwareSlot(juce::Graphics& g, juce::Rectangle<int> area, const juce::String& title, juce::Colour accent)
{
    g.setColour(juce::Colour(0xff02050a).withAlpha(0.52f));
    g.fillRoundedRectangle(area.translated(0, 4).toFloat(), 7.0f);
    g.setGradientFill(juce::ColourGradient(accent.withAlpha(0.26f),
                                           static_cast<float>(area.getX()),
                                           static_cast<float>(area.getY()),
                                           juce::Colour(0xff080d14),
                                           static_cast<float>(area.getRight()),
                                           static_cast<float>(area.getBottom()),
                                           false));
    g.fillRoundedRectangle(area.toFloat(), 7.0f);
    g.setColour(accent.withAlpha(0.42f));
    g.drawRoundedRectangle(area.toFloat().reduced(0.5f), 7.0f, 1.0f);

    auto face = area.reduced(12, 12);
    g.setColour(juce::Colour(0xff101821));
    g.fillRoundedRectangle(face.toFloat(), 6.0f);
    g.setColour(juce::Colour(0xff223044));
    for (int line = 0; line < 5; ++line)
    {
        const auto y = face.getY() + 14 + line * 14;
        if (y < face.getBottom() - 12)
            g.drawHorizontalLine(y, static_cast<float>(face.getX() + 10), static_cast<float>(face.getRight() - 10));
    }

    g.setColour(accent);
    g.setFont(juce::FontOptions(12.0f, juce::Font::bold));
    g.drawText(title, face.reduced(12, 8).removeFromTop(18), juce::Justification::centredLeft);
}

void MainComponent::drawCabinetGraphic(juce::Graphics& g, juce::Rectangle<int> area, const juce::String& title, const juce::String& subtitle)
{
    g.setColour(juce::Colour(0xff05070b).withAlpha(0.62f));
    g.fillEllipse(area.withHeight(28).translated(0, area.getHeight() - 8).toFloat());

    auto cab = area.reduced(18, 10);
    cab.removeFromBottom(22);
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff1e2630),
                                           static_cast<float>(cab.getX()),
                                           static_cast<float>(cab.getY()),
                                           juce::Colour(0xff090b0f),
                                           static_cast<float>(cab.getRight()),
                                           static_cast<float>(cab.getBottom()),
                                           false));
    g.fillRoundedRectangle(cab.toFloat(), 9.0f);
    g.setColour(juce::Colour(0xfffacc15).withAlpha(0.48f));
    g.drawRoundedRectangle(cab.toFloat().reduced(0.5f), 9.0f, 1.2f);

    auto grille = cab.reduced(18, 24);
    grille.removeFromTop(20);
    grille.removeFromBottom(24);
    g.setColour(juce::Colour(0xff111827));
    g.fillRoundedRectangle(grille.toFloat(), 7.0f);
    g.setColour(juce::Colour(0xff293241));
    for (int line = 0; line < 13; ++line)
    {
        const auto y = grille.getY() + 8 + line * juce::jmax(5, grille.getHeight() / 15);
        if (y < grille.getBottom() - 6)
            g.drawHorizontalLine(y, static_cast<float>(grille.getX() + 8), static_cast<float>(grille.getRight() - 8));
    }

    auto speakerRow = grille.reduced(18, 16);
    auto speakerA = speakerRow.removeFromLeft(speakerRow.getWidth() / 2).reduced(8);
    auto speakerB = speakerRow.reduced(8);
    for (auto speaker : { speakerA, speakerB })
    {
        const auto circle = speaker.withSizeKeepingCentre(juce::jmin(speaker.getWidth(), speaker.getHeight()),
                                                          juce::jmin(speaker.getWidth(), speaker.getHeight())).toFloat();
        g.setColour(juce::Colour(0xff07090d));
        g.fillEllipse(circle);
        g.setColour(juce::Colour(0xff384657));
        g.drawEllipse(circle.reduced(1.0f), 2.0f);
        g.setColour(juce::Colour(0xff18212d));
        g.fillEllipse(circle.reduced(circle.getWidth() * 0.22f));
        g.setColour(juce::Colour(0xff45d6ff).withAlpha(0.18f));
        g.drawEllipse(circle.reduced(circle.getWidth() * 0.34f), 1.0f);
    }

    g.setColour(juce::Colour(0xffd7fff0));
    g.setFont(juce::FontOptions(15.0f, juce::Font::bold));
    g.drawText(title, cab.reduced(18, 10).removeFromTop(22), juce::Justification::centredLeft);
    g.setColour(juce::Colour(0xff9fb8c5));
    g.setFont(juce::FontOptions(12.0f, juce::Font::bold));
    g.drawText(subtitle.isNotEmpty() ? subtitle : "Empty", cab.reduced(18, 12).removeFromBottom(20), juce::Justification::centredLeft);
}

void MainComponent::drawSignalChain(juce::Graphics& g, juce::Rectangle<int> area)
{
    if (area.isEmpty())
        return;

    struct ChainStage
    {
        const char* label;
        bool enabled;
        juce::Colour colour;
    };

    const ChainStage stages[] = {
        { "IN", true, juce::Colour(0xff45d6ff) },
        { "GATE", gatePedal.getToggleState(), juce::Colour(0xff38bdf8) },
        { "GRIND", grindPedal.getToggleState(), juce::Colour(0xfff97316) },
        { "RIFT", diAmount != nullptr && diAmount->getValue() > 0.5, juce::Colour(0xfffacc15) },
        { "AMP", ampEnabled.getToggleState(), juce::Colour(0xff45d6ff) },
        { "CAB", cabSectionButton.getToggleState(), juce::Colour(0xfffacc15) },
        { "FX", ambientEnabled.getToggleState(), juce::Colour(0xffa78bfa) },
        { "OUT", true, juce::Colour(0xff6ee7b7) }
    };

    g.setColour(juce::Colour(0xff02050a).withAlpha(0.42f));
    g.fillRoundedRectangle(area.toFloat(), 5.0f);
    g.setColour(juce::Colour(0xff334155).withAlpha(0.70f));
    g.drawRoundedRectangle(area.toFloat().reduced(0.5f), 5.0f, 1.0f);

    auto strip = area.reduced(8, 6);
    const auto stageCount = static_cast<int>(sizeof(stages) / sizeof(stages[0]));
    const auto stageWidth = strip.getWidth() / stageCount;
    for (const auto& stage : stages)
    {
        auto cell = strip.removeFromLeft(stageWidth).reduced(3, 0);
        const auto colour = stage.enabled ? stage.colour : juce::Colour(0xff475569);
        g.setColour(stage.enabled ? colour.withAlpha(0.20f) : juce::Colour(0xff111827));
        g.fillRoundedRectangle(cell.toFloat(), 4.0f);
        g.setColour(colour.withAlpha(stage.enabled ? 0.90f : 0.42f));
        g.drawRoundedRectangle(cell.toFloat().reduced(0.5f), 4.0f, 1.0f);

        drawStatusLed(g, cell.removeFromLeft(14).reduced(3, 5), stage.enabled, colour);
        g.setColour(stage.enabled ? juce::Colour(0xffd7fff0) : juce::Colour(0xff94a3b8));
        g.setFont(juce::FontOptions(10.0f, juce::Font::bold));
        g.drawText(stage.label, cell.reduced(1, 0), juce::Justification::centred);
    }
}

void MainComponent::drawCleanRigGraphic(juce::Graphics& g, juce::Rectangle<int> area)
{
    auto amp = area.removeFromTop(230);
    g.setColour(juce::Colour(0xff02050a).withAlpha(0.52f));
    g.fillRoundedRectangle(amp.translated(0, 5).toFloat(), 8.0f);
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff18322c),
                                           static_cast<float>(amp.getX()),
                                           static_cast<float>(amp.getY()),
                                           juce::Colour(0xff07100f),
                                           static_cast<float>(amp.getRight()),
                                           static_cast<float>(amp.getBottom()),
                                           false));
    g.fillRoundedRectangle(amp.toFloat(), 8.0f);
    g.setColour(juce::Colour(0xff6ee7b7).withAlpha(0.58f));
    g.drawRoundedRectangle(amp.toFloat().reduced(0.5f), 8.0f, 1.2f);

    auto grille = amp.reduced(22, 26);
    auto title = grille.removeFromTop(28);
    g.setColour(juce::Colour(0xffd7fff0));
    g.setFont(juce::FontOptions(15.0f, juce::Font::bold));
    g.drawText("CLEAN VOID AMP", title, juce::Justification::centredLeft);

    auto cloth = grille.reduced(0, 8);
    g.setColour(juce::Colour(0xff0b1516));
    g.fillRoundedRectangle(cloth.toFloat(), 6.0f);
    g.setColour(juce::Colour(0xff1c3a36));
    for (int line = 0; line < 15; ++line)
    {
        const auto y = cloth.getY() + 8 + line * 8;
        if (y < cloth.getBottom() - 8)
            g.drawHorizontalLine(y, static_cast<float>(cloth.getX() + 10), static_cast<float>(cloth.getRight() - 10));
    }
    for (int line = 0; line < 20; ++line)
    {
        const auto x = cloth.getX() + 10 + line * 16;
        if (x < cloth.getRight() - 10)
            g.drawVerticalLine(x, static_cast<float>(cloth.getY() + 8), static_cast<float>(cloth.getBottom() - 8));
    }

    area.removeFromTop(20);
    auto modules = area.removeFromTop(230);
    auto delay = modules.removeFromLeft(modules.getWidth() / 2).reduced(8);
    auto reverb = modules.reduced(8);
    drawHardwareSlot(g, delay, "DELAY ENGINE", juce::Colour(0xff45d6ff));
    drawHardwareSlot(g, reverb, "VOID REVERB", juce::Colour(0xff6ee7b7));
}

void MainComponent::drawStatusLed(juce::Graphics& g, juce::Rectangle<int> area, bool enabled, juce::Colour accent)
{
    const auto dot = area.toFloat().withSizeKeepingCentre(static_cast<float>(juce::jmin(area.getWidth(), area.getHeight())),
                                                          static_cast<float>(juce::jmin(area.getWidth(), area.getHeight())));
    g.setColour(juce::Colour(0xff02050a));
    g.fillEllipse(dot.expanded(2.0f));
    g.setColour(enabled ? accent : juce::Colour(0xff334155));
    g.fillEllipse(dot);
    if (enabled)
    {
        g.setColour(accent.withAlpha(0.20f));
        g.fillEllipse(dot.expanded(5.0f));
    }
}

void MainComponent::drawClipMeter(juce::Graphics& g, juce::Rectangle<int> area, float peak, const juce::String& label)
{
    const auto db = juce::Decibels::gainToDecibels(peak, -96.0f);
    const auto normalized = juce::jlimit(0.0f, 1.0f, (db + 60.0f) / 60.0f);

    g.setColour(juce::Colour(0xff0b1118));
    g.fillRoundedRectangle(area.toFloat(), 6.0f);
    g.setColour(juce::Colour(0xff334155).withAlpha(0.65f));
    g.drawRoundedRectangle(area.toFloat().reduced(0.5f), 6.0f, 1.0f);

    auto scale = area.reduced(6, 20);
    const float marks[] = { -48.0f, -24.0f, -12.0f, -6.0f, 0.0f };
    for (const auto mark : marks)
    {
        const auto markNorm = juce::jlimit(0.0f, 1.0f, (mark + 60.0f) / 60.0f);
        const auto y = scale.getBottom() - static_cast<int>(markNorm * scale.getHeight());
        g.setColour(mark >= -6.0f ? juce::Colour(0xfffacc15).withAlpha(0.55f) : juce::Colour(0xff64748b).withAlpha(0.50f));
        g.drawHorizontalLine(y, static_cast<float>(scale.getX()), static_cast<float>(scale.getRight()));
    }

    auto fill = area.reduced(7, 22);
    fill.removeFromTop(static_cast<int>((1.0f - normalized) * fill.getHeight()));
    g.setColour(db > -1.0f ? juce::Colour(0xffff4d6d) : db > -6.0f ? juce::Colour(0xfffacc15) : juce::Colour(0xff45d6ff));
    g.fillRoundedRectangle(fill.toFloat(), 3.0f);
    g.setColour(juce::Colour(0xffd7fff0));
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText(label, area.removeFromTop(16), juce::Justification::centred);
    g.drawText(juce::String(db, 1) + " dB", area.removeFromBottom(16), juce::Justification::centred);
}

void MainComponent::drawDiCurve(juce::Graphics& g, juce::Rectangle<int> area)
{
    g.setColour(juce::Colour(0xff0b1118));
    g.fillRoundedRectangle(area.toFloat(), 8.0f);
    g.setColour(juce::Colour(0xff334155));
    g.drawRoundedRectangle(area.toFloat().reduced(0.5f), 8.0f, 1.0f);

    auto graph = area.reduced(14, 18);
    g.setColour(juce::Colour(0xff1f2937));
    for (int line = 1; line < 4; ++line)
    {
        const auto y = graph.getY() + (graph.getHeight() * line) / 4;
        g.drawHorizontalLine(y, static_cast<float>(graph.getX()), static_cast<float>(graph.getRight()));
    }

    const auto amountValue = diAmount != nullptr ? static_cast<float>(diAmount->getValue() / 100.0) : 0.75f;
    const auto smoothValue = diSmooth != nullptr ? static_cast<float>(diSmooth->getValue() / 100.0) : 0.3f;

    juce::Path curvePath;
    for (int point = 0; point < graph.getWidth(); ++point)
    {
        const auto xNorm = static_cast<float>(point) / static_cast<float>(juce::jmax(1, graph.getWidth() - 1));
        const auto lowTighten = std::pow(1.0f - xNorm, 2.35f) * amountValue * 0.38f;
        const auto lowMidCut = std::sin(xNorm * juce::MathConstants<float>::pi) * amountValue * 0.16f;
        const auto biteRise = std::pow(xNorm, 1.58f) * amountValue * 0.35f;
        const auto jagged = std::sin(xNorm * 38.0f) * amountValue * (1.0f - smoothValue) * 0.06f;
        const auto matched = 0.58f + lowTighten - lowMidCut - biteRise + jagged;
        const auto flat = 0.54f - std::sin(xNorm * juce::MathConstants<float>::pi) * 0.04f;
        const auto yNorm = juce::jlimit(0.05f, 0.95f, matched * (1.0f - smoothValue * 0.78f) + flat * smoothValue * 0.78f);
        const auto x = static_cast<float>(graph.getX() + point);
        const auto y = static_cast<float>(graph.getY()) + yNorm * static_cast<float>(graph.getHeight());

        if (point == 0)
            curvePath.startNewSubPath(x, y);
        else
            curvePath.lineTo(x, y);
    }

    g.setColour(juce::Colour(0xfffacc15));
    g.strokePath(curvePath, juce::PathStrokeType(2.5f));
    g.setColour(juce::Colour(0xffd7fff0));
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText("DI match target", area.reduced(12, 6).removeFromTop(14), juce::Justification::centredLeft);
}
