# Current Best Source Recovery Search Report

Generated: 2026-06-27

## Scope

This report records a local read-only search for the exact source tree that produced the known-good Current Best internal beta.

No product DSP, Golden Reference A, product default, NAM/IR/audio assets, or original DI files were changed.

## Result

Status: SOURCE NOT RECOVERED

The exact source directory used by the known-good beta build is missing:

- Expected source root from CMake/vcxproj:
  - `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit`
- Current status:
  - source root missing
  - `.git` directory missing
  - `native\juce-audio-engine\Source\PluginProcessor.cpp` missing at that path
  - `native\juce-audio-engine\Source\ThallbyssalLiveV1NamChain.cpp` missing at that path

## Build Cache Evidence

The known-good private beta build cache exists:

- Build directory:
  - `D:\CodexBuilds\thallbyssal-current-best-private-beta`
- CMake cache flags:
  - `THALLBYSSAL_CURRENT_BEST_INTERNAL_BETA=ON`
  - `THALLBYSSAL_ENABLE_NAM_RUNTIME=ON`
  - `THALLBYSSAL_LIVE_V1_NAM_DEFAULT_ON=ON`
  - `THALLBYSSAL_NAM_CORE_DIR=D:\CodexBuilds\thallbyssal-nam-runtime-probe\NeuralAmpModelerCore`
- Generated project compile items included:
  - `PluginProcessor.cpp`
  - `ThallLabDspEngine.cpp`
  - `GoldenReferenceCore.cpp`
  - `OversampledAmpCore.cpp`
  - `SoundEngine2Chain.cpp`
  - `ThallbyssalLiveV1NamChain.cpp`
  - `ThallbyssalProductRuntimeProbeMain.cpp`

The build cache proves the exact beta was built from a source tree that had Current Best compile flags, but it does not contain the missing source files themselves.

## Runtime Marker Evidence

The active known-good beta runtime marker remains:

- `CURRENT BEST A2 FULL-RIG / GATE V0.7 / OUT+0.3 / PG8 / TW-OFF / CF2 / GS1 / PSET2 / BST1 / CHF1 / CHUG-UI2`

Local reports with the final PSET2/BST1/CHF1 evidence:

- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-product-runtime-probe-pset2-bst1-chf1.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-product-runtime-probe-pset2-bst1-chf1-ui-final.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-product-runtime-probe-pset2-bst1-chf1-final.json`

These are runtime evidence, not source recovery.

## Worktree Search Evidence

Multiple worktrees contain `ThallbyssalLiveV1NamChain.cpp`, `ThallbyssalProductRuntimeProbeMain.cpp`, and `PluginProcessor.cpp`, but the inspected candidates do not contain the final PSET2/BST1/CHF1/CHUG-UI2 product source.

Relevant findings:

- `youtubekanal-gitarr-covers-codex-beta-nam-a2-audition` contains A2 audition renderer code and local gain override support.
- That A2 audition path uses offline RMS/peak level matching in renderer tools:
  - target RMS options
  - peak ceiling options
  - gain limited by peak ceiling
- That path is not the final Current Best product source:
  - it uses A2 audition defaults such as `finalGainDb = -12.0`
  - it does not contain the final runtime marker
  - it is an audition/offline render path, not proven product parity

## Current Narrow Technical Finding

The source-rehydration probe can now test local gain hypotheses:

- Old Live V1 probe gain region:
  - branch gains around `-17/-19 dB`
  - final gain around `-0.53 dB`
  - measured roughly `29-30 dB` below the known-good beta
- A2 manifest gain region:
  - branch gains around `-3 dB`
  - final gain around `+18 dB`
  - measured close to or above known-good beta loudness
  - clipped heavily in the raw probe

This means the missing source behavior is probably not just the NAM runtime. The missing behavior is the Current Best A2 output/headroom/safety/polish chain around the high final-gain region.

Follow-up diagnostic output/headroom evidence:

- Probe-only safety modes were added to `ThallbyssalLiveV1ProbeMain.cpp`.
- `peak-normalize`, `hard-ceiling`, and `soft-ceiling` were rendered against the first 6 seconds of:
  - `D:\REAPER\DI Boostalizer.wav`
  - `D:\REAPER\PICK ATTACK.wav`
- All six safety renders completed and measured `0` clipped samples.
- The safety pass did not recover Current Best parity:
  - `peak-normalize` removed clipping but lost too much RMS and low/low-mid energy.
  - `hard-ceiling` and `soft-ceiling` removed clipping but remained too mid/high-forward compared with the known-good beta.
- This narrows the missing behavior further: the known-good beta likely contains product-specific output polish, EQ/headroom calibration, or a more specific A2 full-rig chain shape beyond simple gain plus limiter.

Runtime evidence matrix added after the search:

- Tool: `npm run lab:current-best:evidence`
- Repo document: `AMP_SIM_LAB/CURRENT_BEST_RUNTIME_EVIDENCE_MATRIX.md`
- Generated local reports:
  - `D:\CodexBuilds\thallbyssal-lab\reports\current-best-runtime-evidence-matrix.json`
  - `D:\CodexBuilds\thallbyssal-lab\reports\current-best-runtime-evidence-matrix.md`
- Final stable 48 kHz generated-input target:
  - peak mean: about `0.932767` linear
  - RMS mean: about `0.475805` linear
  - clipped samples: `0`

Source recovery plan:

- `AMP_SIM_LAB/CURRENT_BEST_A2_FULL_RIG_SOURCE_RECOVERY_PLAN.md`
- This plan records the exact probe gap between the current Live V1 source probe and the known-good A2 full-rig runtime marker.

## What Was Not Found

- No exact source root for the known-good beta.
- No clean Git worktree matching the final Current Best runtime marker.
- No source file containing the final PSET2/BST1/CHF1/CHUG-UI2 marker.
- No safe direct port target from the dirty integration tree.

## Next Safe Step

Do not install or overwrite the playable known-good beta.

The next safe implementation task is reconstructing the actual Current Best A2 full-rig product chain from evidence:

1. Keep product DSP untouched.
2. Keep Golden Reference A untouched.
3. Keep product defaults untouched.
4. Keep all local NAM/IR/audio assets doNotShip=true.
5. Recover the product-specific A2 output polish/headroom behavior that sits beyond simple peak safety.
6. Recover the exact Current Best settings represented by `PSET2 / BST1 / CHF1 / CHUG-UI2`.
7. Render the same 6-second historical DI windows.
8. Compare against known-good beta with `npm run lab:source-parity`.
9. Reject any variant with clipping/non-finite samples.
10. Treat the result as measurement evidence only, not listening approval.

This should be done as source recovery tooling, not as product sound design.
