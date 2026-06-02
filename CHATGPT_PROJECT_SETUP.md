# ChatGPT / Codex Project Setup

Use this file to create a ChatGPT Project or to brief multiple Codex threads working on Thallbyssal.

## Project Name

Thallbyssal Amp Sim + Guitar Workflow Toolkit

## Short Description

Local standalone + VST3 amp sim project with an internal lab for safe render testing, preset validation, beta prep, and market validation. Also includes a React/Vite guitar workflow app for REAPER Lua templates and songwriting support.

## Recommended Project Instructions

Paste this into the Project instructions:

```text
You are working on Thallbyssal, a local standalone + VST3 amp sim and guitar workflow toolkit.

The founder owns the sound.

Safe assigned tasks are pre-approved. If the task stays inside allowed paths and does not touch protected sound/DSP, destructive writes, public/commercial systems, external APIs, copyrighted/trademarked assets, GUI automation, fake renders, or original user files, implement it without asking the founder for permission.

Never modify core DSP, tone behavior, gain staging, oversampling, saturation, tone stack, cab/IR behavior, transpose behavior, limiter behavior, or approved preset values without explicit founder approval in the current task.

Never automate the GUI.
Never fake audio rendering by copying input to output.
Never overwrite original DI/reference/IR/user files.
Never add checkout, licensing, DRM, telemetry, analytics, cloud sync, auth, or public launch code.
Never use copyrighted riffs, samples, brand names, artist names, song names, logos, or trademarked amp model names in public/product-facing assets.

Keep AMP_SIM_LAB separated from core sound/DSP.
Generated outputs should stay under D:\CodexBuilds\thallbyssal-lab or other approved D: lab/build folders.

Prefer small PR-sized changes.
One agent = one branch = one task.
If a task requires protected DSP/core changes, stop and write a founder approval request with files, risk, validation, and rollback plan.

Before finishing, report:
- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
```

## Files To Pin Or Upload In The Project

Start with these files:

- `AGENTS.md`
- `THALLBYSSAL_PROJECT.md`
- `THALLBYSSAL_FACTORY_QUEUE.md`
- `TASK_PACKETS/TASK_001_HEADLESS_RENDER_DISCOVERY.md`
- `TASK_PACKETS/TASK_002_RENDER_SAFETY_VALIDATORS.md`
- `TASK_PACKETS/TASK_003_BASELINE_REGRESSION_REPORTS.md`
- `TASK_PACKETS/TASK_004_PRESET_VALIDATION_HARDENING.md`
- `TASK_PACKETS/TASK_005_DEMO_AUDITION_PAGE.md`
- `TASK_PACKETS/TASK_006_BETA_TESTER_PACKET_HARDENING.md`
- `TASK_PACKETS/TASK_007_CI_BUILD_MATRIX_PLAN.md`
- `TASK_PACKETS/TASK_008_REVIEW_AGENT_PACKET.md`
- `TASK_PACKETS/TASK_009_REPORT_INDEX_POLISH.md`
- `TASK_PACKETS/TASK_010_USAGE_SAVING_FACTORY_PLAN.md`
- `AMP_SIM_LAB/AMP_SIM_LAB_DASHBOARD.md`
- `AMP_SIM_LAB/RENDER_HOOK_CONTRACT.md`
- `AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md`
- `AMP_SIM_LAB/PRESET_SCHEMA.md`
- `AMP_SIM_LAB/PRESET_VALIDATION_PLAN.md`
- `AMP_SIM_LAB/AUDIO_REGRESSION_TEST_PLAN.md`
- `AMP_SIM_LAB/BETA_TESTER_PACKET.md`
- `AMP_SIM_LAB/MARKET_VALIDATION_PLAN.md`
- `AMP_SIM_LAB/RELEASE_SAFETY_CHECKLIST.md`

## Chat / Thread Lanes

Create separate chats for:

- Architect / coordinator
- Native amp sim safety review
- AMP_SIM_LAB render safety
- Report/audition UX
- Beta packet and market validation
- Guitar Workflow Toolkit / REAPER templates
- Songwriting lab discovery
- Review-only agent

## Model Recommendations

- Architect/coordinator: GPT-5 high.
- DSP/native implementation or review: GPT-5 high/xhigh.
- Safety/review agent: GPT-5 high.
- UI/design polish: GPT-5 medium/high.
- Docs, task packets, summaries: medium.
- Build/test runners: low/medium.

## First Prompt For A New Agent

```text
Read AGENTS.md, CODEX_PROJECT_THALLBYSSAL/AUTONOMY_RULES.md, THALLBYSSAL_PROJECT.md, THALLBYSSAL_FACTORY_QUEUE.md, and your assigned TASK_PACKETS file.

Work only on your assigned task and allowed paths.
Safe assigned tasks are pre-approved. Do not ask for permission before implementing inside allowed paths.
Do not touch DSP/core sound files unless the task contains explicit founder approval.
Do not implement adjacent features.
Run the required validation from the task packet.
End with files changed, tests run, pass/fail, DSP/core touched yes/no, original DI changed yes/no, blockers, and next recommended task.
```

## 24h Factory Operating Pattern

1. Pick one task from `THALLBYSSAL_FACTORY_QUEUE.md`.
2. Create one branch using the listed branch name.
3. Open the matching task packet.
4. Edit only allowed files.
5. Run only required validation unless the task touches shared infrastructure.
6. Do not retry broken approaches endlessly; stop at the task's stop condition.
7. Review P0/P1 safety risks before merging.
8. Move on to the next smallest task.

## Immediate Founder Decisions

- Audition the new DI Sculpt-bypassed renders.
- Decide whether the default tone should be strengthened through amp/cab/input calibration instead of DI Sculpt.
- Decide which lab report UX should be improved first.
- Decide whether songwriting lab remains in this repo or becomes a separate future product.
