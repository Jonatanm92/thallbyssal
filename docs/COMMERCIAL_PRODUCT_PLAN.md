# Thallbyssal Commercial Product Plan

Working product name: **Thallbyssal**

Thallbyssal is the commercial amp-sim product track inside this repository. The goal is an original standalone and VST3 guitar amp sim for low-tuned modern metal, thall, djent, ambient clean layers, pitch effects, and IR-based cabinet shaping.

This project must not present itself as a clone of any commercial amp sim, artist plugin, or named artist tone. It can target the same user problem: fast access to heavy, clear, low-tuned guitar tones with practical recording tools.

## Product Shape

Version 1 should ship as:

- Windows standalone app
- Windows VST3 plugin
- Shared DSP engine for both targets
- Original brand, UI, presets, and documentation
- Local preset save/load
- User IR loading
- Tuner
- Mono/stereo output
- Installer or packaged zip with clear install instructions

Mac AU/VST3 can come after the Windows path is stable.

## Core Modules

1. Input and metering
   - Input gain in dB
   - Auto input gain calibration
   - Input/output peak meters
   - Mono/stereo output switch
   - Noise gate before amp

2. Pedalboard
   - Gate
   - Grinder-style boost with only drive and level controls
   - Low octave layer
   - Pitch transpose
   - Whammy/dive automation support later

3. DI Sculpt
   - Amount and Smooth controls
   - Visual curve display
   - Goal: reshape weak DI toward a tighter modern metal input response

4. Rhythm amp
   - Gain
   - Bass
   - Mid
   - Treble
   - Presence
   - Master
   - Output

5. Cabinet/IR
   - Factory cabinet voicing
   - Load IR A
   - Load IR B
   - Blend
   - Low cut
   - High cut
   - Room/body control
   - Cab output level

6. Clean and ambient
   - Separate clean amp page
   - Ambient FX rack with separate modules
   - Reverse, shimmer, stutter, ring modulation, granular-style movement

7. Presets
   - Factory rhythm presets
   - Factory lead presets
   - Factory clean/ambient presets
   - User preset save/load
   - Preset names must be original and not use artist or competitor product names

## Commercial Readiness Requirements

Before selling:

- Product name clearance check by a human, including trademark search in target markets
- JUCE license decision for closed-source commercial distribution
- VST3 license review
- Windows code signing plan
- Installer/package plan
- Crash/error logging plan that does not collect private audio by default
- Clear EULA/privacy/readme
- Minimum test matrix across REAPER, at least one other DAW, and standalone mode
- Audio QA with multiple DI files, tunings, interfaces, and buffer sizes

## Current Decision

The first commercial target is **Standalone + VST3**. The React app remains useful for songwriting/export planning, but the commercial amp sim lives in the native JUCE code.

## References

- JUCE licensing overview: https://juce.com/get-juce/
- JUCE CMake/plugin formats reference: https://github.com/juce-framework/JUCE/blob/master/docs/CMake%20API.md
- Steinberg VST3 license: https://steinbergmedia.github.io/vst3_dev_portal/resources/VST3_License_Agreement.pdf
- Apple Developer ID/notarization: https://developer.apple.com/support/developer-id/
- Microsoft Windows code signing options: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
