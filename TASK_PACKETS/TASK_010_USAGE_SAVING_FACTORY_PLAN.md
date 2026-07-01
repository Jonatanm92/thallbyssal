# TASK_010_USAGE_SAVING_FACTORY_PLAN

## Goal

Create a usage-efficient operating plan for Codex tasks: small prompts, small branches, fewer repeated builds, no wasteful attempts, and clear stop conditions.

## Allowed Files

- `TASK_PACKETS/TASK_010_USAGE_SAVING_FACTORY_PLAN.md`
- Docs-only operating plan files
- `THALLBYSSAL_FACTORY_QUEUE.md` only if queue wording needs clarification

## Forbidden Files

- DSP/core sound files
- Implementation code unless a future task explicitly asks for implementation
- Original DI, IR, NAM, or user-provided files
- Automation that changes code without review

## Explicit No-DSP Rule

Do not modify DSP/core sound files. This is an operating plan only.

## Step-by-Step Instructions

1. Read `AGENTS.md` and the factory queue.
2. Define small prompt guidelines.
3. Define small branch guidelines.
4. Define when to run full builds versus targeted checks.
5. Define when to spawn agents and when not to.
6. Define stop conditions for unsafe, unclear, or wasteful work.
7. Define final summary format for all agents.
8. Do not weaken required validation or founder approval rules.

## Operating Plan

### Default Task Shape

Keep each Codex task small enough to review in one sitting:

- one branch
- one clear goal
- one narrow file set
- one final commit when validation passes
- no opportunistic DSP, tone, preset, UI redesign, or release work

If a task starts to need more than one goal, split it into a follow-up task instead of broadening the current branch.

### Prompt Shape

Use prompts that include:

- exact task name
- allowed paths
- forbidden paths
- whether DSP/core sound may be touched
- validation commands
- stop conditions
- expected deliverables

Avoid prompts like "make it better" unless the task is explicitly read-only discovery or founder-approved sound work.

### Branch Shape

Use normal branches with the `codex/` prefix unless the founder asks for a different name.

Recommended branch naming:

```text
codex/<task-id>-<short-purpose>
```

Examples:

```text
codex/task-006-beta-packet-hardening
codex/task-009-report-index-polish
codex/current-best-source-parity-lock
```

Do not create orphan worktrees. If a task depends on previous factory commits, base it on the latest safe dependency branch or stop and report the ambiguity.

### Validation Tiers

Use targeted validation first, then full validation before commit.

For docs-only changes:

```powershell
npm run lab:validate
npm test -- --run
npm run build
git diff --check
```

For lab/test-harness changes:

```powershell
npm run lab:test
npm test -- --run
npm run build
git diff --check
```

For render-related changes:

```powershell
npm run lab:render:safety
npm run lab:test
npm test -- --run
npm run build
git diff --check
```

For beta-package changes:

```powershell
npm run lab:beta-pack
npm run lab:beta-readiness:strict
npm run lab:test
npm test -- --run
npm run build
git diff --check
```

Always run the forbidden tracked asset check before commit:

```powershell
git ls-files "*.wav" "*.flac" "*.aiff" "*.aif" "*.mp3" "*.ogg" "*.nam" "*.ir" "*.onnx" "*.pt" "*.pth" "*.exe" "*.dll" "*.vst3" "*.zip"
```

### Build Usage

Do not run native builds just to validate docs. Native builds are appropriate when:

- a native build script changed
- a packaging/release artifact task requires current artifacts
- a founder explicitly asks to launch or build the playable beta
- a bug report depends on the current Standalone/VST3 binary

When native builds are run, report the artifact path and whether any installed VST3 was overwritten as a build side effect.

### Agent Spawning

Spawn or hand off separate agents only for independent lanes:

- docs review
- test-harness validation
- asset/legal audit
- read-only code audit
- owner-gate summary

Do not spawn extra agents for protected sound changes, unclear branch state, merge decisions, or tasks that need one coherent local build/test loop.

### Crash/Context Reduction

To reduce Codex Desktop instability:

- avoid huge command outputs when a summary command is enough
- prefer targeted `Get-Content -TotalCount` and `rg` queries
- avoid running several heavy builds in parallel
- commit safe finished work before starting the next task
- keep final reports short and link files instead of pasting long generated content

### Stop Conditions

Stop and ask the founder if:

- DSP/core tone changes are needed
- source parity needs missing known-good beta WAVs
- a license/asset decision is needed
- the next step is merge-to-main, beta-send, public default, or release approval
- validation fails and cannot be fixed inside the allowed paths
- Git state is unsafe or contains unrelated dirty files in the task area

### Final Summary Standard

Every task summary should include:

- branch/worktree
- commit hash, if committed
- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- whether audio/NAM/IR/model/render/binary files were staged or committed
- blockers
- next recommended task

## Required Tests

- `npm run lab:validate`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if the plan encourages skipping validation, bypassing founder approval, touching DSP/core without approval, or making broad unreviewed changes.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
