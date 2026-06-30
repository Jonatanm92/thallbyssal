# CLAUDE.md

Claude Code instructions for the Thallbyssal / Guitar Workflow Toolkit repository.

## Canonical Rules

Read `AGENTS.md` first. It is the canonical governance file for all agents.

This file is intentionally short. Do not duplicate the full governance policy here.

## Operating Mode

Use Karpathy-style macro actions:

- Work at task level, not line-edit level.
- Keep one agent focused on one narrow task.
- Prefer measurable validation over subjective claims.
- Keep outputs reviewable and small.
- Stop at owner gates instead of guessing on sound, legal, release, or merge decisions.

## Protected Areas

Do not touch product DSP, core sound, presets, Golden Reference A, NAM/IR assets, or product defaults unless the current user prompt explicitly approves that exact scope.

Protected behavior includes:

- tone
- gain staging
- gate/transpose/tone stack
- cab/IR behavior
- saturation, oversampling, limiting
- factory preset values

If a task risks these areas, write a founder approval request using the template in `AGENTS.md`.

## Preferred Workflow

1. Inspect the worktree:
   - `git status --short --branch`
   - read relevant docs/tests before editing
2. Define the narrow task boundary.
3. Make the smallest safe change.
4. Run relevant validation.
5. Report:
   - files changed
   - tests run
   - pass/fail
   - DSP/core touched yes/no
   - original DI changed yes/no
   - blockers
   - next recommended task

## Current Program

Read `program.md` for the current orchestration plan, metrics, boundaries, and agent lanes.

## Useful Commands

```powershell
git status --short --branch
npm run lab:validate
npm run lab:test
npm run lab:render:safety
npm test -- --run
npm run build
```

For native build work:

```powershell
npm run native:configure
npm run native:build
```

The native build script now avoids stale CMake cache collisions by using a worktree-specific build folder when needed.

## Output Safety

Generated audio, reports, renders, binaries, and private assets stay outside Git unless the task explicitly says otherwise and `AGENTS.md` allows it.

Never commit:

- WAV/FLAC/AIFF/MP3/OGG
- NAM/IR/model files
- VST3/EXE/DLL
- renders
- node_modules
- cache folders
