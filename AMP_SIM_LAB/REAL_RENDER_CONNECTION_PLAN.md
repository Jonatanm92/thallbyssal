# Real Render Connection Plan

Date: 2026-06-03
Branch: `planning/real-render-connection-plan`
Status: planning only

This is an internal AMP_SIM_LAB implementation plan. It must not be used as public-facing product copy.

## Product Goal

Connect the existing safe headless/offline render path to AMP_SIM_LAB so Thallbyssal can create real processed render outputs without changing the sound engine.

Real render unlocks:

- Actual `processed.wav` output.
- Before/after DI demos.
- Preset audition clips.
- Baseline comparisons.
- Private beta listening packs.
- Confidence before public release.

## Sellable App Direction

Private/internal direction only:

- Own brand: Thallbyssal.
- Product focus: modern low-tuned metal amp sim.
- Feel target: tight attack, fast gate behavior, strong chug response, clear note separation, and mix-ready rhythm presets.
- QA direction: render-based checks that compare generated clips and metrics before private beta distribution.
- Demo direction: private beta demo pipeline built from founder-owned DI files and approved local preset data.
- Public-facing assets must not use competitor, artist, amp, plugin, model, or brand names.
- Public-facing copy must not claim Thallbyssal clones, models, recreates, or sounds like any named product, amp, artist, or brand.

## Existing Render Path

The safe render path already exists and should be connected rather than reimplemented.

### Command Boundary

Manual render:

```bash
npm run lab:render -- --input <input.wav> --preset <preset.json> --out <render-folder>
```

Supporting commands:

```bash
npm run lab:render:dry-run
npm run lab:render:safety
npm run lab:render:strict
npm run lab:audition:render
```

### Renderer Components

- Native target: `ThallbyssalOfflineRenderer`
- Native source: `native/juce-audio-engine/Source/OfflineRendererMain.cpp`
- Build declaration: `native/juce-audio-engine/CMakeLists.txt`
- Wrapper: `native/juce-audio-engine/scripts/render-offline.ps1`
- Lab adapter: `AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs`
- Manual command runner: `AMP_SIM_LAB/test-harness/render-hook/run-render.mjs`

Expected local renderer binary:

```text
D:\CodexBuilds\thallbyssal-native\ThallbyssalOfflineRenderer_artefacts\Release\ThallbyssalOfflineRenderer.exe
```

Default generated roots on this Windows machine:

```text
Native build: D:\CodexBuilds\thallbyssal-native
Lab output: D:\CodexBuilds\thallbyssal-lab
Render root: D:\CodexBuilds\thallbyssal-lab\renders
```

### Renderer Dependencies

- CMake and Visual Studio C++ build tooling must be available locally.
- Native build setup may require:

```bash
npm run native:configure
npm run native:build
```

- The wrapper script maps repo-relative `AMP_SIM_LAB/renders/...` output requests into the generated lab render root.
- The adapter must keep using `spawnSync` with `shell: false` and `windowsHide: true`.

### Required Input WAV Format

- Founder-owned or explicitly licensed WAV files only.
- Dry mono DI is preferred.
- 44.1 kHz or higher is required.
- 24-bit, 32-bit PCM, or 32-bit float is preferred.
- The native renderer refuses unsupported channel counts.
- The native renderer refuses sample-rate mismatch instead of silently resampling.
- Original DI files must never be overwritten or modified.

### Required Preset JSON Format

- Presets must be local JSON files.
- Presets must not contain trademarked amp, artist, song, product, or brand claims.
- Presets must be treated as fixed input data.
- Native preset JSON may use `target: "thall-lab-native-juce"` or an `audio` object.
- AMP_SIM_LAB placeholder preset JSON may use fields such as `preset_id`, `input_gain`, `output_gain`, `amp_section_settings`, and `effects_settings`.
- Preset arrays require `--preset-id` when more than one preset is present.
- Cab/IR references, when present, are resolved next to the preset JSON and must exist before rendering.
- The render hook must not tune, optimize, normalize, rename, or automatically edit preset values.

### Output Structure

Real rendered output must be written only under the configured render root.

The render session shape is:

```text
AMP_SIM_LAB/renders/
  /YYYY-MM-DD_HHMMSS/
    /preset_id-or-job-id/
      input-metadata.json
      processed.wav
      metrics.json
```

Batch jobs may add the DI slot to the job folder name to prevent overwrites. The native renderer refuses to overwrite an existing `processed.wav` or `render-metadata.json`.

## Implementation Boundaries

### Allowed In The Future Implementation

- Connect the existing safe headless render command.
- Produce `processed.wav` under `AMP_SIM_LAB/renders` through the configured generated render root.
- Generate render metadata.
- Run metrics.
- Update render-results reports.
- Update the demo audition page to point at real clips.
- Create baseline data from real renders.

### Forbidden

- No DSP/core sound changes.
- No tone tuning.
- No GUI automation.
- No fake render.
- No copying input WAV to output.
- No preset tone changes.
- No DI edits.
- No competitor, artist, amp, plugin, model, product, or brand claims.
- No public release, checkout, licensing, DRM, telemetry, analytics, auth, cloud-sync, or paid/cloud API code.

## Required Founder Assets

Before real renders are connected, the founder must provide or confirm:

- At least 3 founder-owned DI WAV files:
  - `low_tuned_chugs.wav`
  - `humbucker_palm_mutes.wav`
  - `dynamic_pick_attack.wav`
- Presets to test.
- Any local IR/cab references are founder-owned or properly licensed.
- The render binary/tooling exists locally, including CMake and Visual Studio C++ tooling if a native build is required.

## Implementation Task Packet

Copy-paste prompt for the next implementation task:

```text
REAL_RENDER_CONNECTION_IMPLEMENTATION

Canonical repo root:
C:/Users/grise/Documents/youtubekanal-gitarr covers/guitar-workflow-toolkit

Stable base branch:
factory/lab-foundation-checkpoint

Implementation branch:
feature/real-render-connection

Goal:
Connect AMP_SIM_LAB to the existing safe headless/offline render path so founder-owned DI WAV files and approved local preset JSON files produce real processed.wav outputs, render metadata, metrics, render-results entries, demo audition clips, and real-render baselines.

Hard rules:
- Start from factory/lab-foundation-checkpoint.
- Create branch feature/real-render-connection.
- Do not merge into main.
- Do not start Wave 3.
- Do not modify DSP/core sound.
- Do not modify tone behavior, gain staging, oversampling, saturation, tone stack, cab/IR behavior, preset tone values, or cab/IR behavior.
- Do not modify DI files.
- Do not use GUI automation.
- Do not automate Thall Lab Audio Engine.exe or any visual standalone GUI.
- Do not fake renders.
- Do not copy input WAV files to processed.wav.
- Do not change dependencies unless explicitly required and approved before implementation.
- Do not run npm audit fix.
- Do not run npm audit fix --force.
- Do not create checkout, licensing, DRM, telemetry, analytics, auth, cloud-sync, public release code, paid APIs, or external API integrations.
- Do not use competitor, artist, amp, plugin, model, product, or brand names in public-facing assets.
- Stop if the renderer path is missing, unsafe, or requires DSP/core changes.

Evidence docs to read first:
- AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md
- AMP_SIM_LAB/RENDER_HOOK_CONTRACT.md
- AMP_SIM_LAB/WAVE_2_LANDED_REPORT.md
- AMP_SIM_LAB/WAVE_2_INTEGRATION_REPORT.md
- AMP_SIM_LAB/SECURITY_DEPENDENCY_AUDIT_LANDED_REPORT.md

Existing safe command boundary:
npm run lab:render -- --input <input.wav> --preset <preset.json> --out <render-folder>

Known renderer path:
native/juce-audio-engine/scripts/render-offline.ps1

Expected renderer binary:
D:\CodexBuilds\thallbyssal-native\ThallbyssalOfflineRenderer_artefacts\Release\ThallbyssalOfflineRenderer.exe

Required founder inputs:
- AMP_SIM_LAB founder-owned DI WAV files for low_tuned_chugs.wav, humbucker_palm_mutes.wav, and dynamic_pick_attack.wav.
- Approved local preset JSON files to test.
- Confirmation that referenced local IR/cab files are owned or licensed.
- Confirmation that native render tooling exists locally.

Implementation steps:
1. Confirm repo root with git rev-parse --show-toplevel.
2. Confirm clean worktree with git status --short.
3. Switch to factory/lab-foundation-checkpoint.
4. Create feature/real-render-connection.
5. Read the evidence docs listed above.
6. Verify the native wrapper and renderer binary path.
7. If missing, run only approved native configure/build commands if local tooling is present; otherwise stop and report the missing path.
8. Verify the adapter still uses safe headless execution and no GUI automation.
9. Wire existing AMP_SIM_LAB render jobs to invoke the safe command boundary.
10. Produce processed.wav only under AMP_SIM_LAB/renders via the configured generated render root.
11. Write render metadata including input hash, preset path/id, renderer provenance, output path, sample rate, channel count, and safety status.
12. Run metrics on each processed.wav.
13. Update render-results JSON/HTML and demo audition page to show real clips, not dry-run placeholders.
14. Create real-render baseline output from the produced renders.
15. Add or update tests proving missing renderer paths block safely, output paths remain inside the render root, processed.wav is not byte-identical to input, DSP/core hashes stay unchanged, and DI files stay unchanged.
16. Run npm run lab:all.
17. Run npm run lab:render:safety.
18. Run npm run lab:validate-presets.
19. Run npm run lab:baseline:create.
20. Run npm run lab:baseline:compare.
21. Run npm test -- --run.
22. Run npm run build.
23. Create/update AMP_SIM_LAB/REAL_RENDER_CONNECTION_IMPLEMENTATION_REPORT.md with commands, outputs, paths, metrics, blockers if any, and guardrail confirmations.
24. Commit only the implementation/report files needed for real render connection.

Stop conditions:
- Renderer wrapper is missing.
- Renderer binary is missing and cannot be built locally without new unapproved tooling.
- Any implementation requires changes to ThallLabDspEngine.*, PluginProcessor.*, tone values, gain staging, saturation, tone stack, cab/IR behavior, presets, or DI files.
- Any render output would leave the configured render root.
- Any proposed path uses GUI automation.
- Any proposed output is a copied dry DI or fake processed.wav.
```

## Demo/Beta Unlock Plan

After real render works, define these next tasks:

- `REAL_RENDER_DEMO_CLIP_PACK`: assemble before/after clips from founder-owned DI and real `processed.wav` outputs.
- `PRIVATE_BETA_LISTENING_PAGE`: create an internal-only listening page for private beta reviewers with no checkout, telemetry, analytics, auth, cloud sync, or public release systems.
- `PRESET_AUDITION_SELECTION`: choose the first focused set of mix-ready rhythm presets based on founder listening feedback and measured render behavior.
- `THALLBYSSAL_POSITIONING_DRAFT`: draft public-safe positioning around modern low-tuned metal, tight attack, fast gate feel, and mix-ready workflow without competitor, artist, amp, plugin, model, product, or brand claims.

## Success Criteria

- At least 3 real `processed.wav` files are created from founder-owned DI files.
- 0 clipping unless intentionally documented in the implementation report.
- Metrics are generated for every real render.
- Demo audition page shows real clips, not dry-runs.
- Baseline create/compare works on real renders.
- `npm run lab:all` passes.
- `npm test -- --run` passes.
- `npm run build` passes.
- DSP/core files remain untouched.
- DI files remain untouched.
- Preset tone values remain unchanged.
