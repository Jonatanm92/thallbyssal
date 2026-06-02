# TASK_009_REPORT_INDEX_POLISH

## Goal

Improve internal report index UX. It should link all lab reports clearly and show status badges. Internal only.

## Allowed Files

- `AMP_SIM_LAB/test-harness/generate-report-index.mjs`
- `AMP_SIM_LAB/reports`
- Internal report index docs

## Forbidden Files

- DSP/core sound files
- Public launch or marketing site code
- External services, analytics, telemetry, auth, checkout, licensing, DRM
- Original DI, IR, NAM, or user-provided files

## Explicit No-DSP Rule

Do not modify DSP/core sound files. Report index work is display and local report linking only.

## Step-by-Step Instructions

1. Read current report index generator.
2. Inventory all known lab report files.
3. Add clear internal links for each report.
4. Add status badges based on existing report data where available.
5. Keep styling local and static.
6. Avoid public launch language or product claims.
7. Regenerate the index.

## Required Tests

- `npm run lab:report-index`
- `npm run lab:test`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if the task requires external hosting, public marketing, analytics, or DSP/core changes.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
