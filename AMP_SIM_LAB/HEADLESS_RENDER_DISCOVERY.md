# Headless Render Discovery

Generated: 2026-06-02

## Discovery Decision

Use the existing local headless/offline renderer path. No renderer implementation is needed for this task.

The repository already contains a safe headless entrypoint and lab adapter wiring:

- Native console target: `ThallbyssalOfflineRenderer`
- Native source: `native/juce-audio-engine/Source/OfflineRendererMain.cpp`
- Native wrapper: `native/juce-audio-engine/scripts/render-offline.ps1`
- Lab adapter: `AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs`
- Manual command: `npm run lab:render -- --input <input.wav> --preset <preset.json> --out <render-folder>`
- Dry-run command: `npm run lab:render:dry-run`
- Safety command: `npm run lab:render:safety`

This path satisfies the discovery contract because it is explicit, local, headless, reportable, and does not require GUI automation or DSP/core sound edits.

## Contract Review

`AMP_SIM_LAB/RENDER_HOOK_CONTRACT.md` defines the expected real render boundary:

- Invoke `native/juce-audio-engine/scripts/render-offline.ps1`.
- Pass input WAV, preset JSON, output directory, sample rate, block size, and optional preset id.
- Write processed output only under the configured AMP_SIM_LAB renders root.
- Record metadata and metrics.
- Return blocked or dry-run if the safe entrypoint is unavailable.
- Never automate `Thall Lab Audio Engine.exe`.
- Never modify `ThallLabDspEngine.*`, `PluginProcessor.*`, or amp parameters to make rendering easier.

The inspected files match this contract.

## Existing Render Entrypoint

`native/juce-audio-engine/CMakeLists.txt` already declares:

- `juce_add_console_app(ThallbyssalOfflineRenderer)`
- `Source/OfflineRendererMain.cpp`
- shared linkage to the existing DSP source through `${THALLBYSSAL_DSP_SOURCES}`
- `juce::juce_audio_formats`
- `juce::juce_dsp`

The console target is separate from the visual standalone and plugin targets. It does not require opening a DAW, plugin UI, or standalone app.

## Native Wrapper

`native/juce-audio-engine/scripts/render-offline.ps1` already resolves:

- Existing DI/input WAV path.
- Existing preset JSON path.
- Output directory under the generated lab render root.
- Renderer binary under the native build directory.

Default Windows roots:

- Native build: `D:\CodexBuilds\thallbyssal-native`
- Lab output: `D:\CodexBuilds\thallbyssal-lab`
- Render root: `D:\CodexBuilds\thallbyssal-lab\renders`

The wrapper refuses output outside the render root and reports a clear blocker if the renderer binary is missing.

## Lab Adapter

`AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs` already detects `render-offline.ps1` as a safe local headless command.

Safety behavior observed:

- Real mode uses `spawnSync` with `shell: false` and `windowsHide: true`.
- Dry-run mode validates planned paths and writes metadata without processed WAV output.
- Output paths are checked to remain inside the render root.
- Input DI hashes are captured before and after render attempts.
- DSP/core file hashes are captured before and after render attempts.
- Result safety fields explicitly report `guiAutomationUsed: false`.
- Result safety fields report whether DSP/core files changed.

## Preset Loading Without GUI

Preset loading can happen without GUI automation.

`OfflineRendererMain.cpp` parses local JSON with JUCE and supports:

- Native preset JSON with `target: "thall-lab-native-juce"` or an `audio` object.
- AMP_SIM_LAB placeholder preset JSON with `preset_id`, `input_gain`, `output_gain`, `amp_section_settings`, and `effects_settings`.
- Preset arrays selected by `--preset-id`.
- Cab IR file references resolved next to the preset JSON.

The renderer maps preset values into `ThallLabDspEngine::Parameters`, calls `prepare`, calls `setParameters`, and processes audio buffers directly. It does not need the visual `MainComponent` or any GUI action.

## WAV Read/Write Dependencies

WAV read/write dependencies already exist.

Evidence in `OfflineRendererMain.cpp`:

- `juce::AudioFormatManager`
- `registerBasicFormats()`
- `createReaderFor(options.input)`
- `juce::WavAudioFormat`
- `createWriterFor(...)`
- `writeFromAudioSampleBuffer(...)`

Evidence in `CMakeLists.txt`:

- `ThallbyssalOfflineRenderer` links `juce::juce_audio_formats`.

## Current Blockers

No DSP/core approval blocker was found for discovery or for using the existing renderer path.

Operational blockers before a real render can succeed:

- `npm run native:configure` and `npm run native:build` may be required if the renderer binary is missing.
- The local machine must have CMake and Visual Studio 2022 C++ build tools available.
- Real render input WAV files must exist in approved founder-owned DI locations.
- Preset JSON and any referenced IR files must exist locally.
- Input sample rate must match the requested sample rate because the renderer does not resample.
- Existing output folders are refused to avoid overwrites.

## DSP/Core Status

DSP/core sound changes are not required.

Read-only discovery identified protected files only as existing dependencies and safety hash targets:

- `native/juce-audio-engine/Source/ThallLabDspEngine.h`
- `native/juce-audio-engine/Source/ThallLabDspEngine.cpp`
- `native/juce-audio-engine/Source/PluginProcessor.h`
- `native/juce-audio-engine/Source/PluginProcessor.cpp`

These files must remain unmodified unless the founder explicitly approves a DSP/core task.

## Next Recommended Task

Run native build validation and one safe lab render attempt through the existing path:

1. `npm run native:configure`
2. `npm run native:build`
3. `npm run lab:render:dry-run`
4. `npm run lab:render:safety`
5. If approved founder-owned DI and presets are present, run a real `npm run lab:render -- --input <input.wav> --preset <preset.json> --out AMP_SIM_LAB/renders/<session>/<job>`
