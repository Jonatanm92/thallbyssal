# Future Agent Branch Workflow

This repository previously had no commits and no recoverable reviewable `agent/task-*` branch refs. Future multi-agent work must be made reviewable from the start.

## Foundation

All future task branches must branch from one of:

- `factory/lab-foundation-checkpoint`
- `main` after the checkpoint is merged or renamed into the main baseline

Do not branch from an uncommitted working tree.

## One Task, One Branch

Each task must have:

- one branch
- one assigned task packet
- one reviewable diff
- one final summary

Use branch names from `THALLBYSSAL_FACTORY_QUEUE.md` when available.

## Branch Must Exist Before Review

A task is not complete unless its branch/ref exists locally.

Reviewers must be able to run:

```bash
git branch --list
git diff <base>..<task-branch>
```

If the branch does not exist, the task is not reviewable.

## No Manufactured History

Do not recreate fake historical agent branches.

Do not manufacture branch histories for old work.

Old Wave 1 branches are unreviewable unless actual refs are recovered.

## Review Before Merge

No merge without a review-agent pass.

The review-agent must check:

- DSP/core sound changes
- fake render paths
- GUI automation
- destructive writes
- original DI file changes
- generated heavy files
- public release, checkout, licensing, telemetry, auth, DRM, analytics, or cloud-sync code
- copyright/trademark/brand/artist/song claims

## Safe Task Rule

Safe assigned tasks are pre-approved, but they still need a real branch and reviewable diff.

Agents should implement safe tasks autonomously inside allowed paths, then run validation and report results.

Agents must stop and ask the founder before DSP/core sound changes, destructive writes, public/commercial/legal systems, external APIs, GUI automation, fake renders, original user-file changes, or work outside allowed paths.

## Completion Requirements

Every task must end with:

- files changed
- validation commands run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- whether generated heavy files were staged
- blockers
- next recommended task

