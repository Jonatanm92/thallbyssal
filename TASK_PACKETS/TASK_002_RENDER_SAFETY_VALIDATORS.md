# TASK_002_RENDER_SAFETY_VALIDATORS

## Goal

Strengthen validators that prove DI files are unchanged, no GUI automation exists, no fake render exists, outputs stay under `AMP_SIM_LAB/renders` or approved generated render roots, and no DSP files were touched.

## Allowed Files

- `AMP_SIM_LAB/test-harness/render-hook`
- `AMP_SIM_LAB/test-harness/*.mjs` when needed for validation wiring
- `AMP_SIM_LAB/reports`
- Documentation describing safety checks

## Forbidden Files

- `native/juce-audio-engine/Source/ThallLabDspEngine.*`
- `native/juce-audio-engine/Source/PluginProcessor.*`
- Original DI, IR, NAM, or user-provided files
- GUI automation scripts
- Public release, checkout, telemetry, auth, DRM, or cloud code

## Explicit No-DSP Rule

Do not modify DSP/core sound files. Validators may read hashes or metadata for protected files, but must not alter them.

## Step-by-Step Instructions

1. Read `AGENTS.md` and existing render safety scripts.
2. List current validator coverage.
3. Add or improve checks for unchanged DI hashes.
4. Add or improve checks for GUI automation indicators.
5. Add or improve checks that render output paths stay in approved render roots.
6. Add or improve checks that fake copy-render success is impossible or flagged.
7. Add or improve checks that DSP/core files are unchanged during render adapter runs.
8. Update tests and reports.

## Required Tests

- `npm run lab:render:safety`
- `npm run lab:test`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if validating safety requires changing DSP/core behavior, modifying original DI files, or automating the GUI.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
