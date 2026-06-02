# TASK_006_BETA_TESTER_PACKET_HARDENING

## Goal

Improve private beta instructions, bug report template, tone feedback template, install/uninstall placeholders, known issues, and safety disclaimers.

## Allowed Files

- `AMP_SIM_LAB/BETA_TESTER_PACKET.md`
- `AMP_SIM_LAB/beta-pack`
- `AMP_SIM_LAB/test-harness/create-beta-pack.mjs`
- `AMP_SIM_LAB/test-harness/generate-beta-readiness.mjs`
- `AMP_SIM_LAB/reports`

## Forbidden Files

- DSP/core sound files
- Checkout, licensing, DRM, telemetry, analytics, cloud sync, auth, or public launch code
- Original DI, IR, NAM, or user-provided files
- Public claims about exact modeled amps, artists, brands, or songs

## Explicit No-DSP Rule

Do not modify DSP/core sound files. Beta packet work is documentation, packaging placeholder, and validation only.

## Step-by-Step Instructions

1. Read current beta packet and beta readiness scripts.
2. Improve installation placeholder instructions without pretending release is final.
3. Improve uninstall placeholder instructions.
4. Add bug report and tone feedback templates.
5. Add supported OS/DAW placeholder language.
6. Add known issues and beta safety disclaimers.
7. Ensure no private user data collection is introduced.
8. Update beta readiness checks if needed.

## Required Tests

- `npm run lab:beta-readiness:strict`
- `npm run lab:beta-pack`
- `npm run lab:test`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if the task asks for licensing, telemetry, auth, public beta launch, checkout, or DSP/core sound changes.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
