# TASK_003_BASELINE_REGRESSION_REPORTS

## Goal

Improve `baseline:create` and `baseline:compare` reports. Do not judge tone quality. Only report peak, RMS, LUFS-estimate, clipping, render success/failure, and file references.

## Allowed Files

- `AMP_SIM_LAB/test-harness/render-hook/baseline-create.mjs`
- `AMP_SIM_LAB/test-harness/render-hook/baseline-compare.mjs`
- `AMP_SIM_LAB/test-harness/render-hook`
- `AMP_SIM_LAB/reports`
- Internal docs for baseline reports

## Forbidden Files

- DSP/core sound files
- Preset tone values
- Original DI, IR, NAM, or user-provided files
- GUI automation
- Public release or telemetry code

## Explicit No-DSP Rule

Do not modify DSP/core sound files or change render tone. Baseline tools are report-only.

## Step-by-Step Instructions

1. Read existing baseline scripts.
2. Identify current JSON and HTML output structure.
3. Add clearer metric tables for peak, RMS, LUFS-estimate, clipping, and render status.
4. Add comparison deltas for metrics only.
5. Avoid language that rates tone as good, bad, better, worse, brutal, or clear.
6. Add tests or assertions where the harness supports them.
7. Generate reports using existing commands.

## Required Tests

- `npm run lab:baseline:create`
- `npm run lab:baseline:compare`
- `npm run lab:test`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if requested changes require judging tone quality, altering presets, or changing DSP/core sound.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
