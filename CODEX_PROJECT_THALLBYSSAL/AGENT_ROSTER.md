# Thallbyssal Agent Roster

Create one Codex agent/thread per row. Use the listed branch and prompt.

Safe assigned tasks are pre-approved. These agents should implement and validate without asking for founder approval unless they hit a stop condition in `AUTONOMY_RULES.md`.

| Agent | Model | Branch | Prompt | Purpose |
| --- | --- | --- | --- | --- |
| Coordinator | GPT-5 high | `codex/project-coordinator` | `AGENT_PROMPTS/AGENT_000_COORDINATOR.md` | Keep the queue organized and decide what to run next. |
| Render Discovery | GPT-5 high | `codex/task-001-headless-render-discovery` | `AGENT_PROMPTS/AGENT_001_HEADLESS_RENDER_DISCOVERY.md` | Inspect safe headless render options. |
| Render Safety | GPT-5 high | `codex/task-002-render-safety-validators` | `AGENT_PROMPTS/AGENT_002_RENDER_SAFETY_VALIDATORS.md` | Harden render safety validators. |
| Baseline Reports | GPT-5 medium | `codex/task-003-baseline-regression-reports` | `AGENT_PROMPTS/AGENT_003_BASELINE_REGRESSION_REPORTS.md` | Improve baseline metric reports. |
| Preset Validation | GPT-5 medium/high | `codex/task-004-preset-validation-hardening` | `AGENT_PROMPTS/AGENT_004_PRESET_VALIDATION_HARDENING.md` | Harden preset validation. |
| Audition Page | GPT-5 medium/high | `codex/task-005-demo-audition-page` | `AGENT_PROMPTS/AGENT_005_DEMO_AUDITION_PAGE.md` | Improve internal audition page. |
| Beta Packet | GPT-5 medium | `codex/task-006-beta-tester-packet-hardening` | `AGENT_PROMPTS/AGENT_006_BETA_TESTER_PACKET.md` | Improve beta docs/templates. |
| CI Plan | GPT-5 medium | `codex/task-007-ci-build-matrix-plan` | `AGENT_PROMPTS/AGENT_007_CI_BUILD_MATRIX_PLAN.md` | Plan future build matrix. |
| Review Agent | GPT-5 high | `codex/task-008-review-agent-packet` | `AGENT_PROMPTS/AGENT_008_REVIEW_AGENT.md` | Review-only safety checklist. |
| Report Index | GPT-5 medium | `codex/task-009-report-index-polish` | `AGENT_PROMPTS/AGENT_009_REPORT_INDEX_POLISH.md` | Polish internal report index. |
| Usage Plan | GPT-5 medium | `codex/task-010-usage-saving-factory-plan` | `AGENT_PROMPTS/AGENT_010_USAGE_SAVING_FACTORY_PLAN.md` | Make agent work usage-efficient. |

## Priority Order

Best order if you want practical progress:

1. `AGENT_002_RENDER_SAFETY_VALIDATORS`
2. `AGENT_009_REPORT_INDEX_POLISH`
3. `AGENT_005_DEMO_AUDITION_PAGE`
4. `AGENT_004_PRESET_VALIDATION_HARDENING`
5. `AGENT_010_USAGE_SAVING_FACTORY_PLAN`

## Do Not Start In Parallel Yet

Avoid running multiple agents that edit the same files:

- render hook files
- report generation files
- preset validation files
- native DSP/core files
