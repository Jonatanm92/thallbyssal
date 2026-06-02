# TASK_008_REVIEW_AGENT_PACKET

## Goal

Create a checklist for a review-only Codex agent that reviews PRs for P0/P1 issues and never writes code unless explicitly asked.

## Allowed Files

- `TASK_PACKETS/TASK_008_REVIEW_AGENT_PACKET.md`
- Docs-only review checklist files

## Forbidden Files

- Any implementation code unless a future task explicitly asks the review agent to patch
- DSP/core sound files
- Original DI, IR, NAM, or user-provided files
- Generated release, checkout, licensing, telemetry, auth, DRM, or public launch code

## Explicit No-DSP Rule

A review agent must flag DSP/core modifications as P0 unless founder approval is included in the task.

## Step-by-Step Instructions

1. Read `AGENTS.md`.
2. Review changed files before reading summaries.
3. Prioritize P0/P1 risks over style.
4. Flag unapproved DSP/core changes as P0.
5. Flag fake render paths as P0.
6. Flag GUI automation as P0.
7. Flag destructive DI writes as P0.
8. Flag trademark/copyright/brand/artist claims as P1.
9. Flag missing validators as P1.
10. Do not write code unless explicitly asked.

## Required Tests

- No tests required for review-only work unless the review task asks to run validation.
- If validating a PR locally, prefer the commands listed in that task packet.

## Stop Condition

Stop if asked to modify implementation code without explicit write permission.

## Summary Format

- findings first, ordered by severity
- files reviewed
- tests run
- pass/fail
- whether DSP/core was touched by the PR
- whether original DI files were changed by the PR
- blockers
- next recommended task
