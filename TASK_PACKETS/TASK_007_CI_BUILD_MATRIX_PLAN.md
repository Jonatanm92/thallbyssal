# TASK_007_CI_BUILD_MATRIX_PLAN

## Goal

Create a CI/build matrix plan for Windows/macOS later. Do not add paid services or public release pipeline.

## Allowed Files

- `AMP_SIM_LAB/release-checklists`
- `AMP_SIM_LAB/TECHNICAL_BUILD_OPTIONS.md`
- New docs-only CI/build matrix plan files

## Forbidden Files

- `.github/workflows` unless a future task explicitly asks to implement CI
- DSP/core sound files
- Secrets, paid service configs, deploy configs, release automation, signing automation
- Checkout, licensing, telemetry, auth, DRM, or public launch code

## Explicit No-DSP Rule

Do not modify DSP/core sound files. This task is planning only.

## Step-by-Step Instructions

1. Read release checklist and technical build options.
2. Draft Windows standalone/VST3 build planning.
3. Draft macOS standalone/AU/VST3 future planning.
4. Include sample rates, buffer sizes, plugin scan, installer, and artifact checks as plan items.
5. Note what is intentionally not implemented.
6. Avoid adding real CI config or external service dependencies.

## Required Tests

- `npm run lab:validate`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop before adding real CI, paid services, signing, secrets, deployment, public release, or DSP/core changes.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
