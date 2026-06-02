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
