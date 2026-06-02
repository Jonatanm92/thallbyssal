# TASK_001_HEADLESS_RENDER_DISCOVERY

## Goal

Inspect whether a safe headless/offline render command can be created. Do not implement a renderer if DSP/core changes are required. Output the discovery report to `AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md`.

## Allowed Files

- `AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md`
- Existing docs that only describe discovery findings
- Read-only inspection of native project files and lab scripts

## Forbidden Files

- `native/juce-audio-engine/Source/ThallLabDspEngine.*`
- `native/juce-audio-engine/Source/PluginProcessor.*`
- Any DSP/core sound, tone, cab/IR, preset value, saturation, gain-staging, or GUI automation file
- Original DI, IR, NAM, or user-provided audio files

## Explicit No-DSP Rule

Do not modify DSP/core sound files. If a real headless render command requires DSP/core changes, stop and write a founder approval request.

## Step-by-Step Instructions

1. Read `AGENTS.md` and `AMP_SIM_LAB/RENDER_HOOK_CONTRACT.md`.
2. Inspect existing render scripts and native build targets.
3. Identify any existing safe headless/offline renderer entrypoint.
4. Identify whether preset loading can happen without GUI automation.
5. Identify whether WAV read/write dependencies already exist.
6. Write `AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md` with findings.
7. Do not add implementation code.
8. If blocked, include exact blocker and next approval required.

## Required Tests

- `npm run lab:validate`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop immediately if implementation would require DSP/core changes, GUI automation, copying input to output, or writing outside approved lab folders.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
