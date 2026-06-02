# Render Hook Contract

This contract defines the internal-only render boundary for AMP_SIM_LAB. It exists to test founder-owned DI files and internal preset placeholders without changing Thallbyssal tone behavior.

Core rule: **do not change the core sound/DSP.**

## Input WAV Requirements

- Files must be founder-owned or explicitly licensed.
- WAV is required for automated render tests.
- Dry mono DI is preferred.
- 44.1 kHz or higher is required.
- 24-bit, 32-bit PCM, or 32-bit float is preferred.
- Original DI files must never be overwritten or modified.
- Copyrighted riffs, stems, released songs, downloaded samples, and unlicensed IRs are forbidden.

## Preset JSON Requirements

- Presets must be local JSON files.
- Presets must not contain trademarked amp, artist, song, or product claims.
- Presets must be treated as fixed input data.
- The render hook must not tune, optimize, normalize, rename, or automatically edit preset values.
- Missing or invalid preset files must fail with a clear error.

## Output WAV Requirements

- Real rendered output, when available, must be written only under the configured AMP_SIM_LAB renders folder.
- On this Windows machine the default render root is:

```text
D:\CodexBuilds\thallbyssal-lab\renders
```

- A render session must use:

```text
AMP_SIM_LAB/renders/
  /YYYY-MM-DD_HHMMSS/
    /preset_id/
      input-metadata.json
      processed.wav
      metrics.json
```

- Batch jobs may add the DI slot to the job folder name to prevent overwrites.
- Generated reports may be overwritten under `AMP_SIM_LAB/reports`; original DI files may not be overwritten.

## Expected Command Interface

Manual render:

```bash
npm run lab:render -- --input <input.wav> --preset <preset.json> --out <render-folder>
```

Dry-run render:

```bash
npm run lab:render:dry-run
```

Strict safety validation:

```bash
npm run lab:render:strict
```

Batch audition render:

```bash
npm run lab:audition:render
```

## Error Behavior

- Missing input WAV: fail with an explicit error.
- Missing preset JSON: fail with an explicit error.
- Output outside render root: fail with an explicit error.
- No safe headless render entrypoint: return `blocked` or `dry_run`; do not attempt GUI automation.
- Render failure: record failure in JSON and HTML reports.
- Metrics failure: record failure; do not delete render files.

## Safety Rules

- No DSP edits.
- No GUI automation.
- No public release paths.
- No checkout, auth, DRM, telemetry, analytics, licensing, or cloud sync.
- No external APIs.
- No paid APIs.
- No private user data collection.
- No automatic loudness normalization.
- No destructive file writes.
- No overwriting original DI files.

## Real Render Definition

A real render means:

- A safe, explicit, local, headless/offline render entrypoint exists.
- The adapter invokes `native/juce-audio-engine/scripts/render-offline.ps1` without opening or automating the visual standalone GUI.
- The adapter passes an input WAV, preset JSON, and output WAV path.
- The entrypoint writes a processed WAV under the render root.
- AMP_SIM_LAB measures the processed WAV and records metrics.

Current local renderer:

```text
D:\CodexBuilds\thallbyssal-native\ThallbyssalOfflineRenderer_artefacts\Release\ThallbyssalOfflineRenderer.exe
```

Audio entrypoint:

```text
ThallLabDspEngine::prepare
ThallLabDspEngine::setParameters
ThallLabDspEngine::process
```

## Dry-Run Definition

Dry-run means:

- Input and preset files are validated.
- Output folders and metadata are planned.
- No processed WAV is written.
- The report states why real render is unavailable.
- This mode is valid for test-harness development only.

## Forbidden

- Automating `Thall Lab Audio Engine.exe`.
- Clicking, typing, or screen-scraping any GUI.
- Modifying `ThallLabDspEngine.*`, `PluginProcessor.*`, or amp parameters to make rendering easier.
- Using public release packaging as a test render path.
- Making claims that the product models or sounds exactly like any protected brand, amp, artist, or song.
