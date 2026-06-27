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

## What Was Not Found

- No exact source root for the known-good beta.
- No clean Git worktree matching the final Current Best runtime marker.
- No source file containing the final PSET2/BST1/CHF1/CHUG-UI2 marker.
- No safe direct port target from the dirty integration tree.

## Next Safe Step

Do not install or overwrite the playable known-good beta.

The next safe implementation task is a diagnostic-only A2 output/headroom probe:

1. Keep product DSP untouched.
2. Keep Golden Reference A untouched.
3. Keep product defaults untouched.
4. Keep all local NAM/IR/audio assets doNotShip=true.
5. Add probe-only output safety variants around the A2 gain hypothesis.
6. Render the same 6-second historical DI windows.
7. Compare against known-good beta with `npm run lab:source-parity`.
8. Reject any variant with clipping/non-finite samples.
9. Treat the result as measurement evidence only, not listening approval.

This should be done as source recovery tooling, not as product sound design.
