# Thallbyssal Finish-To-Beta Checklist

Generated: 2026-07-01

## Purpose

This checklist defines the shortest safe path from the current internal Thallbyssal state to a reviewable private beta.

It does not approve a public release, change product defaults, change Golden Reference A, change DSP, change presets, or legalize any private NAM/IR/audio assets.

## Current Status

| Area | Status | Evidence |
| --- | --- | --- |
| Internal beta docs | Ready with warnings | `npm run lab:beta-readiness:strict` reports `0` blockers and `3` warnings. |
| Standalone/VST3 artifact presence | Present with warnings | `npm run lab:release` reports required Standalone and VST3 artifacts exist with `0` errors and `3` warnings. |
| Preset validation | Valid but not release-approved | `npm run lab:validate-presets` reports `0` errors and `9` release-readiness warnings. |
| Known-good source parity | Blocked | `npm run lab:known-good-beta:recovery` reports `blocked-missing-known-good-beta-renders`. |
| Public release readiness | Not ready | Private/unknown-license assets and founder approval gates remain unresolved. |

## Non-Negotiable Boundaries

- Do not modify DSP/core tone without explicit founder approval.
- Do not change Golden Reference A.
- Do not change product defaults without explicit founder approval.
- Do not commit audio, NAM, IR, render, model, binary, cache, or private asset files.
- Unknown-license assets remain internal-only and `doNotShip=true`.
- Founder listening is required before tone, default, preset, beta-send, or release decisions.

## Hard Blocker

Strict Current Best source parity is blocked because the exact known-good beta baseline WAVs are missing:

| File | Expected SHA256 |
| --- | --- |
| `p01-current-best-baseline__di-boostalizer.wav` | `65b719131e5c4f70aaf4d090163605adc4025f49e6725c97f92ca5bdfa260a62` |
| `p01-current-best-baseline__low-tuned-chugs.wav` | `ad5e8d711852aff1c36f21e8952bb546f61ea696b9d4a4131434fa5dba9bd4fb` |
| `p01-current-best-baseline__noise.wav` | `8000fc0d46304de8cb0a029de449675b0139c8e76171478c987d1b457fca3b0d` |
| `p01-current-best-baseline__pick-attack.wav` | `487ce39670be3f98058825aa875b690e24d637e38626222852a8a694a3479312` |

Expected historical directory:

```text
D:\CodexBuilds\thallbyssal-lab\renders\current-best-preset-bank\20260624T120444Z\wav
```

Recovery command:

```powershell
npm run lab:known-good-beta:recovery
```

## Finish Path

### Phase 1 - Evidence Lock

Goal: prevent accidental regression while keeping the playable beta protected.

1. Restore the four exact known-good beta WAVs if they exist in an old cache, backup, artifact folder, or external storage.
2. If the files cannot be restored, regenerate them from the exact known-good beta build if that build is available.
3. If exact restoration is impossible, create a new baseline only after explicit founder approval.
4. Re-run:

```powershell
npm run lab:known-good-beta:recovery
npm run lab:all
```

Gate: source parity is either verified or explicitly replaced by a newly approved baseline.

### Phase 2 - Private Beta Package

Goal: create one clean owner/tester package without changing tone.

1. Build current Standalone and VST3 artifacts from the approved branch.
2. Run:

```powershell
npm run lab:beta-readiness:strict
npm run lab:release
npm run lab:validate-presets
npm run lab:render:safety
npm test -- --run
npm run build
```

3. Package only allowed files and docs.
4. Keep private NAM/IR/audio assets outside Git and outside any public release artifact.

Gate: founder approves that the package is the intended private beta candidate.

### Phase 3 - Owner Playtest Gate

Goal: test the playable beta like an amp sim, not like a lab experiment.

Minimum playtest checklist:

- Standalone launches and loads Current Best without fallback.
- Correct guitar input channel is selected.
- Gate feels natural enough for high-gain playing.
- Gain, EQ, Presence, Master, Output feel predictable.
- Presets stay on the selected preset and do not silently reset to baseline.
- No hard-strike clipping/splatter.
- Noise/ring/squeal is controlled without killing palm-mute attack.
- UI is readable at the normal plugin size.

Gate: founder says either `private beta approved`, or provides a short blocker list.

### Phase 4 - Release-Safe Asset Track

Goal: replace internal target assets with legal product assets.

1. Keep current NAM/IR chain as internal sound target only.
2. Capture or license equivalent amp/core and cab/speaker assets.
3. Compare first-party/licensed assets against the internal target.
4. Do blind owner listening.
5. Only mark assets shippable after license evidence exists.

Gate: license ledger is complete and founder approves the release-safe tone.

## Current Warnings To Track

- Release artifacts warn that `VST3_AUTO_MANIFEST` is disabled for development stability.
- Optional visual standalone app artifact is missing.
- Presets validate structurally but are not approved for public release.
- Known-good beta baseline WAVs are missing, so source parity is blocked.

## Next Recommended Task

Run a narrow beta package hardening pass:

```text
TASK_006 beta-packet
```

Reason: beta docs and artifacts already validate with no blockers, and this task can improve owner/tester handoff without touching DSP/core tone.
