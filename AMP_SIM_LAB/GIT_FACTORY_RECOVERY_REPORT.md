# Git Factory Recovery Report

Generated: 2026-06-02

## Canonical Repo Root

Canonical Thallbyssal / Guitar Workflow Toolkit repo root:

`C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit`

Important packaging note:

The parent folder also has a `.git` directory:

`C:\Users\grise\Documents\youtubekanal-gitarr covers`

That parent Git repo appears to be an accidental wrapper around the actual project. The actual Node project, `package.json`, AGENTS rules, factory queue, task packets, native source, and full AMP_SIM_LAB live in `guitar-workflow-toolkit`.

## Correct Project Evidence

Inside the canonical project root:

- `package.json` exists.
- `AGENTS.md` exists.
- `THALLBYSSAL_FACTORY_QUEUE.md` exists.
- `TASK_PACKETS` exists.
- `AMP_SIM_LAB` contains the full lab source, plans, presets, reports, test harness, render hook, and dashboard.
- `native/juce-audio-engine` exists.
- `src` exists.

## Current Branch

Current branch before recovery packaging:

`agent/task-005-demo-audition-page`

## Existing Commit State

The canonical repo had no commits before recovery packaging.

Evidence:

- `git status` reported `No commits yet`.
- `git log --oneline -5` failed with `fatal: your current branch 'agent/task-005-demo-audition-page' does not have any commits yet`.
- `git worktree list` showed one worktree at commit `0000000 [agent/task-005-demo-audition-page]`.

## Why Old Agent Branches Cannot Be Reviewed

The current branch name exists only as an unborn branch with no commits. `git branch -a` produced no reviewable branch refs.

Because the repository has no commit history, no old Wave 1 branch-specific diff review can be proven from Git.

Creating fake branch refs now would manufacture history, so it is forbidden.

The recovery checkpoint should preserve the currently verified safe lab state as a baseline for future real branches. It must not pretend to be the missing Wave 1 branches.

## Duplicate AMP_SIM_LAB Paths

Duplicate AMP_SIM_LAB paths exist:

- `C:\Users\grise\Documents\youtubekanal-gitarr covers\AMP_SIM_LAB`
- `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB`

The root-level `AMP_SIM_LAB` contains:

- `24H_FACTORY_REVIEW_REPORT.md`
- `COMMAND_STARTUP_DIAGNOSIS.md`
- `FUTURE_AGENT_BRANCH_WORKFLOW.md`
- `GIT_FACTORY_RECOVERY_REPORT.md`
- `test-harness`

The nested `guitar-workflow-toolkit\AMP_SIM_LAB` is the real project lab. The root-level folder appears to be an accidental duplicate created while commands were run from the parent Git wrapper.

This recovery does not move or delete either folder.

## Safety Gate Results

All required safety gates passed after running from:

`C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit`

Commands:

- `npm run lab:all` - passed
- `npm run lab:baseline:create` - passed, 14 jobs stored
- `npm run lab:baseline:compare` - passed, 14 jobs compared, render success changes 0
- `npm run lab:beta-readiness:strict` - passed, blockers 0, warnings 2
- `npm test -- --run` - passed, 13 test files, 64 tests
- `npm run build` - passed

Note: `npm run lab:all`, `lab:baseline:create`, `lab:baseline:compare`, and `lab:beta-readiness:strict` require writing generated reports under `D:\CodexBuilds\thallbyssal-lab`, so they were run with approval outside the workspace sandbox.

## Git Hygiene

The canonical project `.gitignore` was updated to exclude generated/heavy AMP_SIM_LAB audio artifacts:

- `AMP_SIM_LAB/renders/`
- `AMP_SIM_LAB/di-test-files/*.wav`
- `AMP_SIM_LAB/di-test-files/*.aif`
- `AMP_SIM_LAB/di-test-files/*.aiff`
- `AMP_SIM_LAB/di-test-files/*.flac`

The existing `.gitignore` already excludes:

- `node_modules`
- `dist`
- `.vite`
- coverage
- dev-server logs
- exports/imports
- native build output

## Files Safe To Checkpoint

Safe checkpoint candidates:

- source files
- docs
- task packets
- package files
- TypeScript config
- Vite config
- native source/config files already present in the working tree
- lab test harness scripts
- lab markdown/source plans
- `.gitignore`
- this recovery report
- future branch workflow doc

## Files Excluded From Checkpoint

Excluded or should remain untracked:

- `node_modules/`
- build/dist/cache folders
- generated render outputs
- generated heavy audio files
- original DI WAV/AIF/AIFF/FLAC files
- generated logs
- exports/imports folders

AMP_SIM_LAB reports may be committed only when they are markdown/source reports and useful for review. Large generated binary/audio artifacts should not be committed.

## DSP/Core Sound Touched

No DSP/core sound files were modified during this recovery packaging task.

No tone behavior, gain staging, oversampling, saturation, tone stack, cab/IR behavior, or preset values were intentionally changed in this recovery task.

## Original DI Files Touched

No original DI files were modified during this recovery packaging task.

## Checkpoint Attempt Result

Checkpoint creation was attempted on:

`factory/lab-foundation-checkpoint`

Commit message attempted:

`chore: establish AMP_SIM_LAB factory checkpoint`

The commit was blocked by missing Git author identity:

```text
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
Omit --global to set the identity only in this repository.

fatal: unable to auto-detect email address (got 'grise@DESKTOP-Q572SF1.(none)')
```

No fake identity was configured.

Safe files are staged and ready to commit after the founder sets Git identity.

## Recommendation

Blocked until Git identity is configured, then create checkpoint.

Reason:

- command startup works
- safety gates passed
- `.gitignore` now protects generated/heavy lab artifacts
- no DSP/core sound changes were made in this recovery task
- no original DI files were modified in this recovery task
- old Wave 1 branches cannot be reviewed because there are no commits/reviewable refs
- commit is currently blocked only by missing Git user config

The checkpoint should be created on:

`factory/lab-foundation-checkpoint`

Commit message:

`chore: establish AMP_SIM_LAB factory checkpoint`
