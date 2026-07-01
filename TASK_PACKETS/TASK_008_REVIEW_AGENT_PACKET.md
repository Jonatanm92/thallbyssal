# TASK_008_REVIEW_AGENT_PACKET

## Goal

Create a checklist for a review-only Codex or Claude Code agent that reviews PRs for P0/P1 issues and never writes code unless explicitly asked.

This packet is especially for Thallbyssal factory branches where docs, lab tooling, beta packets, and source-parity evidence may change while the product DSP must remain protected.

## Allowed Files

- `TASK_PACKETS/TASK_008_REVIEW_AGENT_PACKET.md`
- Docs-only review checklist files

## Forbidden Files

- Any implementation code unless a future task explicitly asks the review agent to patch
- DSP/core sound files
- Original DI, IR, NAM, or user-provided files
- Generated release, checkout, licensing, telemetry, auth, DRM, or public launch code
- Audio, render, binary, NAM, IR, model, cache, `node_modules`, VST3, EXE, or DLL files

## Explicit No-DSP Rule

A review agent must flag DSP/core modifications as P0 unless founder approval is included in the task.

Protected examples include:

- `native/juce-audio-engine/Source/ThallLabDspEngine.*`
- `native/juce-audio-engine/Source/PluginProcessor.*`
- gain staging, tone stack, gate, transpose, cab/IR, NAM loading, oversampling, limiter, presets, or default behavior

## Step-by-Step Instructions

1. Read `AGENTS.md`.
2. Read `program.md`.
3. Inspect `git status --short --branch`.
4. Review changed files before reading summaries.
5. Prioritize P0/P1 risks over style.
6. Flag unapproved DSP/core changes as P0.
7. Flag fake render paths as P0.
8. Flag GUI automation as P0.
9. Flag destructive DI writes as P0.
10. Flag audio/NAM/IR/model/render/binary files in Git as P0/P1 depending on whether they are staged/committed.
11. Flag trademark/copyright/brand/artist claims as P1.
12. Flag missing validators as P1 when a durable rule or tooling behavior is changed.
13. Do not write code unless explicitly asked.

## Current Project-Specific Review Checks

- Source parity is not approved while `npm run lab:known-good-beta:recovery` reports `blocked-missing-known-good-beta-renders`.
- The exact known-good beta WAV evidence is missing unless the recovery report says all required SHA256 hashes match.
- Private or unknown-license NAM/IR/audio assets must remain internal-only and `doNotShip=true`.
- Release artifacts may exist locally, but local artifacts are not public release approval.
- Beta docs may be ready while public release remains blocked.
- Presets may validate structurally while still not being approved for public release.
- Cabquake Natural Punch is documentation/planning only unless a later task explicitly approves realtime DSP.
- ToneTrace AI is prototype/lab-only unless model and stem-separation licenses are resolved.

## Required Tests

- No tests required for read-only review unless the review task asks to run validation.
- If validating a PR locally, prefer the commands listed in that task packet.
- For broad factory/docs/tooling branches, the default safe validation set is:

```powershell
npm run lab:validate
npm run lab:test
npm test -- --run
npm run build
git diff --check
git ls-files "*.wav" "*.flac" "*.aiff" "*.aif" "*.mp3" "*.ogg" "*.nam" "*.ir" "*.onnx" "*.pt" "*.pth" "*.exe" "*.dll" "*.vst3" "*.zip"
```

Add these when relevant:

```powershell
npm run lab:render:safety
npm run lab:beta-readiness:strict
npm run lab:known-good-beta:recovery
```

## Stop Condition

Stop if asked to modify implementation code without explicit write permission.

Stop and ask for owner input if the review outcome would require:

- changing product sound
- changing NAM/IR assets
- changing public defaults
- merging to main
- sending a beta package
- approving a release-safe asset/license decision
- declaring a tone winner without owner listening

## Summary Format

- findings first, ordered by severity
- files reviewed
- tests run
- pass/fail
- whether DSP/core was touched by the PR
- whether original DI files were changed by the PR
- whether audio/NAM/IR/model/render/binary files were staged or committed
- source parity status
- public release status
- blockers
- next recommended task
