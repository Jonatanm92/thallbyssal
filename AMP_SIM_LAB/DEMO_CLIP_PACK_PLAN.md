# Thallbyssal Internal Demo Clip Pack Plan

## Goal

Create an internal review pack that helps the founder compare existing real-render clips, technical metrics, and review decisions without changing the sound.

## Scope

This pack is report-only. It indexes render reports and local processed WAV references that already exist under the approved lab output root. It does not render audio, copy audio, normalize audio, tune presets, alter DI files, or touch DSP/core files.

## Source Of Truth

- Render results: `D:\CodexBuilds\thallbyssal-lab\reports\render-results.json`
- Audition metadata: `D:\CodexBuilds\thallbyssal-lab\reports\audition-matrix.json`
- Local processed clip references: `D:\CodexBuilds\thallbyssal-lab\renders\...\processed.wav`
- Local metrics references: `D:\CodexBuilds\thallbyssal-lab\renders\...\metrics.json`

## Generated Outputs

- `D:\CodexBuilds\thallbyssal-lab\reports\demo-clip-pack.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\demo-clips-index.html`
- `AMP_SIM_LAB/demo-site/demo-clips-index.html`
- `D:\CodexBuilds\thallbyssal-lab\reports\index.html` links the generated demo clip pack report.

## Row Fields

Each clip row includes:

- Render batch and session
- DI file name
- Preset name
- Processed clip path/reference
- Metrics path/reference
- Peak, RMS, and LUFS estimate
- Clipping status
- Dry-run vs real-render label
- Suggested use case: `chug`, `rhythm`, `dynamic picking`, `noise test`, or `lead`
- Founder rating placeholder
- Founder notes placeholder
- Keep / improve / reject placeholder

## Use Case Mapping

Suggested use case labels are derived from render job metadata, DI slot names, DI filenames, preset category, and preset name. The mapping is report-only and never changes audio behavior:

- `noise test` when the row references noise-floor material.
- `lead` when the row references lead material.
- `chug` when the row references chug material.
- `dynamic picking` when the row references dynamic or pick-attack material.
- `rhythm` as the default internal review category.

## Founder Review Workflow

1. Run `npm run lab:report-index` after a real-render batch is available.
2. Open the generated internal report at `D:\CodexBuilds\thallbyssal-lab\reports\demo-clips-index.html`.
3. Review clips and metrics row by row.
4. Record founder rating, notes, and keep / improve / reject decisions in a separate review note or future feedback data file.
5. Share only selected clips later, after private beta sharing rules are defined.

## Safety Rules

- Do not modify DSP/core sound.
- Do not modify tone behavior or preset tone values.
- Do not modify DI files.
- Do not create fake renders.
- Do not copy input WAV to output.
- Do not commit processed WAVs or generated render audio.
- Do not add public launch, checkout, licensing, telemetry, analytics, auth, cloud sync, or external release code.
