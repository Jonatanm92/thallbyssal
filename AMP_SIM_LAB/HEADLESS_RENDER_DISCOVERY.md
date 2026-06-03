# Headless Render Discovery

Generated: 2026-06-02
Task: Wave 2 Task 001 - Headless Render Discovery
Branch: `agent/wave2-001-headless-render-discovery`

## Discovery Decision

Decision: implement.

More precisely: a safe local headless/offline render path is already present, so no new renderer implementation is needed for this task. The existing path can be used by AMP_SIM_LAB without GUI automation, fake render behavior, preset edits, DI edits, or DSP/core sound modifications.

If the question is whether a new command must be created, the answer is no. The repo already has the command boundary:

```bash
npm run lab:render -- --input <input.wav> --preset <preset.json> --out <render-folder>
```

Dry-run and safety validation commands also exist:

```bash
npm run lab:render:dry-run
npm run lab:render:safety
```

## Candidate Audio Entrypoint Found

Candidate audio entrypoint found: yes.

The native headless renderer is:

- Target: `ThallbyssalOfflineRenderer`
- Source: `native/juce-audio-engine/Source/OfflineRendererMain.cpp`
- Build declaration: `native/juce-audio-engine/CMakeLists.txt`
- Wrapper: `native/juce-audio-engine/scripts/render-offline.ps1`
- Lab adapter: `AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs`

The renderer processes audio directly through the existing DSP engine:

- `ThallLabDspEngine::prepare`
- `ThallLabDspEngine::setParameters`
- `ThallLabDspEngine::process`

This is a read-only dependency on protected DSP/core files for discovery purposes. No DSP/core sound change is required.

## Preset Loading Path Found

Preset loading path found: yes.

`native/juce-audio-engine/Source/OfflineRendererMain.cpp` loads local JSON with `juce::JSON::parse`, selects either a single preset object or an array item through `--preset-id`, and maps supported preset shapes into `ThallLabDspEngine::Parameters`.

Supported preset shapes observed:

- Native preset JSON with `target: "thall-lab-native-juce"` or an `audio` object.
- AMP_SIM_LAB placeholder preset JSON with fields such as `preset_id`, `input_gain`, `output_gain`, `amp_section_settings`, and `effects_settings`.
- Preset arrays, requiring `--preset-id` when more than one preset is present.

Cab IR references, when present, are resolved next to the preset JSON and must exist before rendering. Presets are read as fixed inputs; no preset file or preset value needs to be modified.

## WAV IO Path Found

WAV IO path found: yes.

Evidence in `native/juce-audio-engine/Source/OfflineRendererMain.cpp`:

- Reads input WAV through `juce::AudioFormatManager`, `registerBasicFormats()`, and `createReaderFor(...)`.
- Writes `processed.wav` through `juce::WavAudioFormat`, `createWriterFor(...)`, and `writeFromAudioSampleBuffer(...)`.
- Refuses unsupported channel counts.
- Refuses sample-rate mismatch instead of silently resampling.
- Refuses to overwrite an existing `processed.wav` or `render-metadata.json`.

Evidence in `native/juce-audio-engine/CMakeLists.txt`:

- `ThallbyssalOfflineRenderer` links `juce::juce_audio_formats`.

## Safety Assessment

Implementation is safe: yes, because the implementation already exists and can be called through the lab boundary without changing core sound.

Safety conditions observed:

- `AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs` detects `native/juce-audio-engine/scripts/render-offline.ps1` as a local headless command.
- The adapter uses `spawnSync` with `shell: false` and `windowsHide: true`.
- The adapter records input DI hashes before and after render attempts.
- The adapter records protected DSP/core file hashes before and after render attempts.
- The adapter reports `guiAutomationUsed: false`.
- Output paths are checked to remain under the configured render root.
- `native/juce-audio-engine/scripts/render-offline.ps1` maps repo-relative `AMP_SIM_LAB/renders/...` requests into the generated lab render root.
- The native renderer writes a processed output through WAV writer APIs, not by copying the input WAV.

Default generated roots on this Windows machine:

- Native build: `D:\CodexBuilds\thallbyssal-native`
- Lab output: `D:\CodexBuilds\thallbyssal-lab`
- Render root: `D:\CodexBuilds\thallbyssal-lab\renders`

## Exact Files That Would Need To Be Created

For a safe headless/offline render command: none.

The required command, native target, wrapper, and lab adapter already exist. Creating a second renderer would add risk without solving a current blocker.

Operational generated files may be created outside the repo by existing commands:

- Native build artifacts under `D:\CodexBuilds\thallbyssal-native`
- Render reports under `D:\CodexBuilds\thallbyssal-lab\reports`
- Render outputs under `D:\CodexBuilds\thallbyssal-lab\renders`

Those generated files are not repo source files and must not overwrite original DI, IR, preset, or user-provided files.

## Exact Files That Would Need To Be Modified

For a safe headless/offline render command: none.

Existing files that already provide the path:

- `package.json`
- `AMP_SIM_LAB/RENDER_HOOK_CONTRACT.md`
- `AMP_SIM_LAB/test-harness/lab-paths.mjs`
- `AMP_SIM_LAB/test-harness/render-hook/run-render.mjs`
- `AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs`
- `AMP_SIM_LAB/test-harness/render-hook/render-safety.mjs`
- `native/juce-audio-engine/CMakeLists.txt`
- `native/juce-audio-engine/Source/OfflineRendererMain.cpp`
- `native/juce-audio-engine/scripts/render-offline.ps1`

This task modified only:

- `AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md`

## DSP/Core Touch Assessment

DSP/core files would be touched: no.

Protected DSP/core files are used as read-only dependencies and safety hash targets:

- `native/juce-audio-engine/Source/ThallLabDspEngine.h`
- `native/juce-audio-engine/Source/ThallLabDspEngine.cpp`
- `native/juce-audio-engine/Source/PluginProcessor.h`
- `native/juce-audio-engine/Source/PluginProcessor.cpp`

No DSP/core sound file needs to be created or modified to use the existing headless renderer. If a future task proposes changes to those files to improve rendering, that task must stop and request founder approval.

## DI And Preset Touch Assessment

DI files touched: no.

Preset files touched: no.

The render path reads input WAV and preset JSON as fixed inputs. It writes metadata, metrics, and processed output only under approved generated lab roots.

## Blockers

No founder approval blocker was found for using the existing safe headless path.

Operational blockers before a real render may still exist:

- The native renderer binary may be missing until `npm run native:configure` and `npm run native:build` have been run successfully.
- The machine must have CMake and Visual Studio C++ build tooling available for native builds.
- Real render input WAV files must exist in approved founder-owned DI locations.
- Referenced preset JSON and IR files must exist locally.
- Input sample rate must match the requested render sample rate because this internal renderer does not resample.
- Existing output folders are refused to avoid destructive overwrites.

## Next Recommended Task

Run native build validation and a real render smoke test through the existing path, using only approved founder-owned DI files and approved local presets:

```bash
npm run native:configure
npm run native:build
npm run lab:render:dry-run
npm run lab:render:safety
```

If the renderer binary, approved DI, and preset are present, run:

```bash
npm run lab:render -- --input <input.wav> --preset <preset.json> --out AMP_SIM_LAB/renders/<session>/<job>
```
