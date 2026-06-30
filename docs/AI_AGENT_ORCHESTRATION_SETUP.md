# AI Agent Orchestration Setup

This repo now has a practical version of the workflow described in `D:\karpathy-ai-setup.pdf`.

It is adapted for Thallbyssal, where sound decisions are owner-gated and private assets must not leak into Git.

## Files

- `AGENTS.md` - canonical governance and safety rules.
- `CLAUDE.md` - short Claude Code entrypoint that redirects to `AGENTS.md`.
- `program.md` - current objective, metrics, boundaries, agent lanes, and stop conditions.
- `THALLBYSSAL_FACTORY_QUEUE.md` - task queue.

## Recommended Multi-Agent Layout

Use separate terminal windows or separate Codex/Claude worktrees.

| Window | Role | Good tasks |
| --- | --- | --- |
| Agent 1 | Implementation | small lab tooling, docs, validators |
| Agent 2 | Research | read reports, map blockers, compare evidence |
| Agent 3 | Review | inspect branch for safety, fake renders, asset leakage |
| Agent 4 | Owner prep | create concise owner-gate summaries |

Keep each agent on one branch and one task.

## Good First Prompt For Claude Code

```text
Read AGENTS.md, CLAUDE.md, and program.md.
Do not modify DSP, product defaults, presets, Golden Reference A, NAM/IR/audio/model assets, or release behavior.
Inspect git status and summarize the current safest next task.
Do not implement until you identify whether the task is safe or owner-gated.
```

## Safe Autopilot Prompt

```text
Read AGENTS.md, CLAUDE.md, program.md, and THALLBYSSAL_FACTORY_QUEUE.md.
Continue with one safe docs/tooling/testing task only.
Do not touch protected DSP/core sound files.
Do not add audio/NAM/IR/model/render/binary files to Git.
Run relevant validation.
Commit only the intended files.
Stop at the first owner gate.
```

## Review Prompt

```text
Review the current branch against AGENTS.md and program.md.
Prioritize P0/P1 findings:
- DSP/core sound changes without approval
- fake renders
- private asset leakage
- missing validation
- stale queue/status docs
Return findings first with file/line references.
Do not edit files.
```

## AutoResearch Rules

Use AutoResearch only for objective lab tasks.

Good:

- render safety failures
- source parity deltas
- preset validation warnings
- build-cache failures
- missing artifact recovery

Not good:

- deciding which tone sounds best
- tuning amp feel by measurements only
- choosing release defaults
- approving UI visual identity

## Current Practical Next Steps

1. Keep source parity branch reviewable on GitHub.
2. Recover or regenerate exact known-good beta baseline WAVs.
3. Use `npm run lab:known-good-beta:recovery` to verify them.
4. Re-run source parity only after exact baseline evidence exists.
5. Keep product tone untouched until the owner explicitly approves a sound task.
