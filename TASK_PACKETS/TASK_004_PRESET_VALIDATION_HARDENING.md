# TASK_004_PRESET_VALIDATION_HARDENING

## Goal

Improve preset schema validation, duplicate detection, invalid category detection, suspicious trademark/brand/artist claims, and HTML summary.

## Allowed Files

- `AMP_SIM_LAB/test-harness/validate-presets.mjs`
- `AMP_SIM_LAB/PRESET_SCHEMA.md`
- `AMP_SIM_LAB/PRESET_VALIDATION_PLAN.md`
- `AMP_SIM_LAB/presets` schema/examples when values are not protected tone decisions
- `AMP_SIM_LAB/reports`

## Forbidden Files

- DSP/core sound files
- Approved factory tone preset values unless explicitly requested
- Original DI, IR, NAM, or user-provided files
- Public marketing claims
- Checkout, licensing, DRM, telemetry, auth, or cloud code

## Explicit No-DSP Rule

Do not modify DSP/core sound files. Do not change tone values to make validation pass without founder approval.

## Step-by-Step Instructions

1. Read `PRESET_SCHEMA.md` and existing preset validator.
2. Add stricter required field checks.
3. Add duplicate `preset_id` and duplicate name detection.
4. Add category allowlist validation.
5. Add suspicious claim detection for brand, artist, song, album, and trademark-like names.
6. Improve JSON and HTML summaries.
7. Add tests in the lab harness when practical.
8. Do not rename approved product presets without approval.

## Required Tests

- `npm run lab:presets`
- `npm run lab:test`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if hardening requires changing protected tone values or making public product claims.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
