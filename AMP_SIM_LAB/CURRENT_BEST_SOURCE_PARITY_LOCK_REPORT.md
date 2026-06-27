# Current Best Source Parity Lock Report

Generated: 2026-06-27

## Phase 0 Result

Status: BLOCKED

Phase 0 created a clean source-parity worktree, but a source build that reproduces the active Current Best internal beta cannot be attempted safely yet because the exact source tree used for the active beta is missing.

## Worktree

- Worktree: `D:\CodexWorktrees\thallbyssal-current-best-source-parity-lock`
- Branch: `codex/current-best-source-parity-lock`
- Base commit: `65dc309d2da99e3ad3cd22b706c8b65642611afb`
- Base commit subject: `docs: add level-matched tone-gap listening pack`

This is a normal Git worktree, not an orphan worktree.

## Active Runtime Evidence

The active internal beta artifacts still exist:

- Standalone: `D:\CodexBuilds\thallbyssal-current-best-private-beta\Thallbyssal_artefacts\Release\Standalone\Thallbyssal.exe`
- Installed VST3: `C:\Program Files\Common Files\VST3\Thallbyssal.vst3`
- Known-good package: `D:\CodexBuilds\thallbyssal-lab\packages\current-best-known-good-beta\20260624T153049Z`

Hash evidence:

- Standalone SHA256: `CCE011FE514866F570386AE496774B2189B2F002373B6940D2A766F291C47AAD`
- Installed VST3 binary SHA256: `84F37F84F0E96919B63E5B68726C002F3396CAD593656EE1D4FC8815048F0076`

Runtime probe evidence:

- Probe executable: `D:\CodexBuilds\thallbyssal-current-best-private-beta\ThallbyssalProductRuntimeProbe_artefacts\Release\ThallbyssalProductRuntimeProbe.exe`
- Probe exit: success
- `liveV1NamActive`: true
- Latency: 0 samples
- Clipped samples: 0 in the probe output
- Current runtime marker:
  - `CURRENT BEST A2 FULL-RIG / GATE V0.7 / OUT+0.3 / PG8 / TW-OFF / CF2 / GS1 / PSET2 / BST1 / CHF1 / CHUG-UI2`

This matters because older hardening reports also mention a PSET1 checkpoint. The currently active probe reports PSET2/BST1/CHF1/CHUG-UI2, so future recovery work must treat runtime truth and historical PSET1 reports separately.

## Historical Guard Evidence

The known-good package records:

- Package generated: `2026-06-24T15:30:49.126Z`
- `doNotShip`: true
- `internalBetaOnly`: true
- Private assets included: false
- Private manifest hash recorded, raw asset paths not copied
- Audio-lock report copied: yes

Audio lock evidence from the package:

- Baseline WAVs: 64
- Candidate WAVs: 64
- Same: 64
- Different: 0
- Result: PASS

## Source Evidence

The active CMake cache points to a source directory that no longer exists:

- `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\native\juce-audio-engine`
- Current status: missing

The active build cache contains Current Best compile flags:

- `THALLBYSSAL_ENABLE_NAM_RUNTIME=ON`
- `THALLBYSSAL_LIVE_V1_NAM_DEFAULT_ON=ON`
- `THALLBYSSAL_CURRENT_BEST_INTERNAL_BETA=ON`
- `THALLBYSSAL_NAM_CORE_DIR=D:\CodexBuilds\thallbyssal-nam-runtime-probe\NeuralAmpModelerCore`

The clean Git base does not contain the Current Best source path:

- No `THALLBYSSAL_CURRENT_BEST_INTERNAL_BETA` source definition.
- No Current Best NAM runtime source files in the clean branch.
- No `NamRuntimeAdapter.cpp/.h`.
- No `ThallbyssalLiveV1NamChain.cpp/.h`.
- No product runtime probe source.

The dirty integration worktree contains some later NAM/runtime work, but it is not safe as a parity source:

- Worktree: `D:\CodexWorktrees\youtubekanal-gitarr-covers-integration-se2-modules-integration\guitar-workflow-toolkit`
- Branch: `codex/dual-amp-clean-ambient-channel`
- Dirty state: many modified/untracked files
- It contains useful later controls, including Boostalizer, input routing, Grind, Chug Focus, and Thickness-style work.
- It does not contain the exact Current Best runtime marker found in the active beta probe.
- It likely includes later experimental changes that previously caused harsh/clipped/sprangt behavior.

## Why No Candidate Build Was Produced

Building from the clean branch would produce the older algorithmic `ThallLabDspEngine` path, not the active Current Best NAM/IR beta.

Building from the dirty integration tree would not be a source parity build. It would be an uncontrolled recovery build with unrelated experimental changes and no proof that it matches the known-good beta.

Phase 0 therefore stops before creating a candidate binary.

## Safe Next Step

Do not install or build a playable candidate from the dirty integration tree.

The next safe implementation step is a narrow source-rehydration task:

1. Create a new clean branch from `codex/current-best-source-parity-lock`.
2. Port only the minimum NAM runtime loader, manifest resolution, product runtime probe, and UI snapshot source needed to compile a Current Best probe.
3. Do not port Boostalizer, Chug Focus, Thickness, Whammy, presets, gate changes, output changes, or UI feature changes yet.
4. Build only an external probe/standalone candidate in `D:\CodexBuilds`, not installed over the known-good beta.
5. Require the probe marker, load status, clipping checks, and audio-lock comparison before any playable install.

## Stop Condition

Current Best source parity is not proven. The known-good beta binary should remain the playable reference until a source-built candidate passes parity validation.
