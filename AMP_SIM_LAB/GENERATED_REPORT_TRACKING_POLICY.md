# Generated Report Tracking Policy

Date: 2026-06-03

## Founder Decision

Generated report files should not be tracked in Git.

Generator scripts, markdown docs and plans, source templates, tests, checklists, and `.gitkeep` placeholders are source artifacts and may be tracked. Generated HTML, JSON, render audio, session output, local DI/audio files, and machine-specific outputs should be regenerated locally instead of committed.

## Track

- Generator scripts.
- Markdown docs and plans.
- Source templates.
- Tests.
- Checklists.
- `.gitkeep` placeholders.

## Do Not Track

- `AMP_SIM_LAB/reports/*.html`.
- `AMP_SIM_LAB/reports/*.json`.
- Generated demo pages that contain local render, session, or audio paths.
- `processed.wav`.
- Generated render audio.
- Local DI/audio files.
- Machine-specific generated outputs.

## Why Generated Reports Are Not Tracked

Generated reports often contain local render paths, session paths, timestamps, and machine-specific output details. Tracking them makes branches conflict more often, creates stale report snapshots, and risks committing local render/session/audio references that should remain local to the lab machine.

Keeping generated reports out of Git makes the repository focus on source, tests, and reproducible generators. Reviewers can regenerate fresh outputs locally from the tracked generator scripts when they need current report evidence.

## Regenerate Reports Locally

Use the tracked generators and lab scripts from the repo root:

```powershell
npm run lab:report-index
npm run lab:all
```

Task-specific generators may also be run directly when a branch documents one, for example:

```powershell
node AMP_SIM_LAB/test-harness/generate-preset-audition-selection.mjs
node AMP_SIM_LAB/test-harness/demo-clip-pack.mjs
```

Generated outputs should remain local unless a task explicitly converts a report into a manually maintained source document.

## Allowed Exceptions

A manually maintained source template can be tracked if it does not contain local render, audio, or session output. The template should be edited as source and should not be the generated result of a local render/report run.

`.gitkeep` placeholders may be tracked to preserve empty output directories without tracking generated files.

## Examples

| Artifact | Track? | Reason |
| --- | --- | --- |
| Generator script | Yes | Source used to reproduce reports locally. |
| Generated `AMP_SIM_LAB/reports/*.html` | No | Generated local report output. |
| Generated `AMP_SIM_LAB/reports/*.json` | No | Generated local data output. |
| `.gitkeep` | Yes | Placeholder, not generated report data. |
| `processed.wav` | No | Generated render audio output. |
| DI WAV | No | Local source audio file. |
