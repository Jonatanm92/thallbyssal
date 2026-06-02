# Thall Lab JUCE Audio Engine

Native audio prototype and product build path for the Guitar Workflow Toolkit.

This is the real-time native path for low-latency input/output, ASIO-capable device selection, mono/stereo output switching, a native high-gain amp monitor, fixed-wet real-time transpose, an automatic low-octave layer blend, one-knob palm-mute catch/tightening, dual cab IR loading, clean-space amp EQ, and separate pedal-style FX modules. The React/Vite app should be treated as the planner/export editor; live guitar monitoring belongs here.

It is an original audio engine. It is not a clone of any commercial amp, bass, pitch, or FX plugin.

## What It Does Now

- Starts a standalone JUCE desktop app.
- Builds the first Thallbyssal product target as Standalone + VST3.
- Builds an internal-only headless offline renderer for AMP_SIM_LAB regression renders.
- Opens a native audio device selector.
- Can use ASIO/WASAPI/CoreAudio device types when the local JUCE build and drivers support them.
- Processes live mono guitar input into selectable mono or stereo output.
- Provides simple controls for:
  - input gain, 5-second auto input gain, and output level with dB meters
  - mono/stereo output mode
  - transpose shift as a 100% wet tuning-style pitch shift
  - Low Oct blend for a parallel `-12` octave voice under the main tuning
  - one-knob Palm Catch for tighter low-tuned palm mutes
  - gate threshold
  - grinder drive/level
  - DI Sculpt amount/smooth with a visual DI match target curve
  - original tone preset selection
  - rhythm amp gain/bass/mid/treble/presence/master/output
  - Cab Mix with Factory Mellow Cab default voicing, cab-style IR A/B loaders, A/B blend, low cut, high cut, room, and cab level
  - Clean Space mix/space/level plus bass/mid/treble/presence/tone shaping
  - FX Rack with separate shimmer, reverse, stutter, and ring pedal modules
- Loads `thall-lab-preset.json` files exported from the React app.
- Loads user cab IR files for the convolution cabinet stage.
- Uses a heavier native amp path with input transpose, optional low-octave layer, palm-mute catch, input gate, boost shaping, DI shaping, body/presence filtering, soft compression, dual-IR cab blending, post-IR cab shaping, optional clean-space processing, and optional FX processing.

## Prerequisites On Windows

Install these before building:

```powershell
winget install --id Kitware.CMake -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --source winget --override "--quiet --wait --norestart --installPath D:\VSBuildTools2022 --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
```

Also install your audio interface driver, for example Focusrite Control / Focusrite USB ASIO.

ASIO support depends on JUCE, the compiler setup, and the ASIO SDK/licensing situation on the machine. If ASIO is not available immediately, build and test with WASAPI first, then enable ASIO once the SDK/driver path is ready.

## Check Setup

```powershell
powershell -ExecutionPolicy Bypass -File native/juce-audio-engine/scripts/check-prereqs.ps1
```

## Configure And Build

```powershell
powershell -ExecutionPolicy Bypass -File native/juce-audio-engine/scripts/configure.ps1
powershell -ExecutionPolicy Bypass -File native/juce-audio-engine/scripts/build.ps1
```

From the repository root, the same flow is available as:

```bash
npm run native:configure
npm run native:build
npm run native:open
npm run native:open:visual
npm run native:shortcut
npm run native:open:plugin-standalone
npm run native:open:thallbyssal
```

Native builds default to `D:\CodexBuilds\thallbyssal-native` on this machine to avoid C: drive space and Windows path-length issues. Override with `THALLBYSSAL_NATIVE_BUILD_DIR` if needed.

The visual standalone app you play guitar through is generated under:

```text
D:\CodexBuilds\thallbyssal-native\ThallLabAudioEngine_artefacts\Release\Thall Lab Audio Engine.exe
```

Open that app with:

```bash
npm run native:open
npm run native:open:visual
```

Create a Windows desktop shortcut to that visual app with:

```bash
npm run native:shortcut
```

The Thallbyssal product target is generated under:

```text
D:\CodexBuilds\thallbyssal-native\Thallbyssal_artefacts\
```

The VST3 artifact is generated somewhere below that folder, usually under a `VST3` subfolder. The standalone plugin shell can be opened with:

```bash
npm run native:open:plugin-standalone
npm run native:open:thallbyssal
```

The first Thallbyssal plugin build intentionally uses JUCE's generic parameter editor. The professional amp-sim UI will be built after the product target is stable in DAWs.

## Internal Headless Renderer

AMP_SIM_LAB uses this internal-only renderer for founder-owned DI test files:

```text
D:\CodexBuilds\thallbyssal-native\ThallbyssalOfflineRenderer_artefacts\Release\ThallbyssalOfflineRenderer.exe
```

The lab wrapper is:

```powershell
powershell -ExecutionPolicy Bypass -File native/juce-audio-engine/scripts/render-offline.ps1 `
  -InputWav AMP_SIM_LAB/di-test-files/low_tuned_chugs.wav `
  -PresetJson AMP_SIM_LAB/presets/examples/high_gain_foundation_01.json `
  -OutputDir AMP_SIM_LAB/renders/manual-test `
  -SampleRate 48000 `
  -BlockSize 128
```

This path is local-only. It does not open the GUI, automate a DAW, copy the input as fake success, or modify DSP files.

## Using A React Export Preset

1. In the React app, open `Songwriter Lab`.
2. Choose a guitar tone preset, bass settings, transpose value, pedals, and optional IR.
3. Click `Save JUCE preset` or `Create Songwriter Pack`.
4. In the native JUCE app, click `Load preset JSON` and choose `thall-lab-preset.json`.
5. Confirm the `MONO`/`STEREO` output switch matches the exported preset.
6. If the preset references an IR that cannot be found next to the preset or under `imports/`, click `Load IR` and choose it manually.

## Low-Latency Setup

1. Open the standalone app with `npm run native:open`.
2. In the audio device selector, choose your audio interface driver. Prefer ASIO if it is available.
3. Select the guitar input channel and your headphone/output pair.
4. Use the smallest stable buffer your system can handle, usually 64 or 128 samples.
5. Turn off direct monitoring on the interface if you hear both clean and processed guitar at the same time.
6. Load a `thall-lab-preset.json` from the web app when you want the standalone app to follow the same tone idea.

## Next Native Milestones

1. Add the visual pedalboard UI directly to the standalone app.
2. Add pedalboard DSP blocks for the exported Forge Pedalboard settings.
3. Add native whammy automation preview and write lanes for REAPER export.
4. Add MIDI input/output and bass plugin export helpers.
5. Add optional VST3 plugin target once the standalone engine is stable.
