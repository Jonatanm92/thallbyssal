# Current Best A2 Full-Rig Source Recovery Plan

Generated: 2026-06-28

## Scope

This plan defines the next source-recovery step for the known-good Current Best internal beta.

It does not approve product DSP changes, preset changes, default changes, asset bundling, beta installation, or owner listening.

## Hard Boundaries

- Do not overwrite the known-good playable beta.
- Do not install a rebuilt VST3 or Standalone over the known-good beta.
- Do not modify `PluginProcessor.*`.
- Do not modify Golden Reference A.
- Do not modify product defaults.
- Do not commit NAM, IR, WAV, render, model, binary, cache, or private asset files.
- Keep all local NAM/IR/audio assets `doNotShip=true`.

## Runtime Evidence Target

Known-good final marker:

```text
CURRENT BEST A2 FULL-RIG / GATE V0.7 / OUT+0.3 / PG8 / TW-OFF / CF2 / GS1 / PSET2 / BST1 / CHF1
```

Longer active marker also included `CHUG-UI2`.

Generated-input runtime target from `npm run lab:current-best:evidence`:

- final stable 48 kHz peak mean: about `0.932767` linear;
- final stable 48 kHz RMS mean: about `0.475805` linear;
- clipped samples: `0`;
- latency: `0`;
- NAM active: yes;
- 48 kHz direct path at 48 kHz host rate;
- 48 kHz adapter path at 44.1 kHz and 96 kHz host rates.

## Current Source Probe

Current diagnostic source probe:

- class: `ThallbyssalLiveV1NamChain`;
- entrypoint: `ThallbyssalLiveV1ProbeMain.cpp`;
- branch topology:
  - BLDOG Big Bottom branch;
  - HLBST Big Bottom branch;
  - Gojira edge branch;
- branch voicing:
  - fixed branch grinder values;
  - branch drive around `12 dB`;
  - branch mid/high filters;
  - `edge = HLBST * 0.88 + Gojira * 0.12`;
  - `center = 0.64 * BLDOG + 0.36 * edge`;
  - `side = BLDOG - edge`;
  - `center/side +1.5 dB @ 1400 Hz`;
  - `side *= 0.22`;
  - final gain from local private config.

Current measurement result:

- older Live V1 default gain region is about `29-30 dB` too low versus known-good beta;
- A2 high-gain local config reaches loudness direction but clips heavily without product safety;
- diagnostic `peak-normalize`, `hard-ceiling`, and `soft-ceiling` remove clipping but do not recover known-good beta balance.

## Missing Source Behavior

The source probe does not yet represent the known-good Current Best product chain.

Missing or unproven pieces:

1. A2 full-rig host/NAM sample-rate adapter behavior.
2. `OUT+0.3` output calibration.
3. `PG8` peak guard or peak/headroom stage.
4. `TW-OFF` tone-width/tight-width state.
5. `CF2` cab/filter/polish state.
6. `GS1` gain-staging state.
7. `PSET2` final preset or profile state.
8. `BST1` boost state.
9. `CHF1` chug focus or chug-family state.
10. `CHUG-UI2` final chug UI mapping/state.

## Code Evidence From Nearby Worktrees

The `codex-beta-nam-a2-audition` worktree contains audition-only code that may explain part of the missing behavior, but it is not final product source.

Useful evidence:

- `ThallbyssalV2LocalChain.cpp` includes a `RecoveredNamBrutalLoudV2GojiraEdge` mode.
- That mode uses:
  - `center = 0.68 * BLDOG + 0.32 * edge`;
  - additional center EQ around `1400 Hz`, `260 Hz`, and `2350 Hz`;
  - additional side EQ plus high-pass around `95 Hz`;
  - `side *= 0.255`;
  - V2 softclip with `drive = 1.18`;
  - final level-match to `-16 dB` RMS with `-1 dB` peak ceiling.
- This explains why simple source-probe ceiling modes can remove clipping but remain spectrally wrong: the older audition path had more than a peak limiter.

Limits of this evidence:

- It is offline/audition code, not confirmed Current Best product code.
- It uses render-time level matching, which may not exist in realtime product form.
- It does not contain the final `PSET2/BST1/CHF1/CHUG-UI2` runtime marker.

## Next Probe Variant

Implement a new diagnostic-only source recovery probe variant before any product integration.

Suggested name:

```text
A2 Full-Rig Recovery Probe v0
```

Allowed files:

- probe-only source files;
- probe-only CMake target if needed;
- AMP_SIM_LAB source-parity tooling;
- AMP_SIM_LAB docs/reports.

Forbidden files:

- `PluginProcessor.*`;
- Golden Reference A files;
- factory preset values;
- product defaults;
- private NAM/IR/audio/model/render/binary assets.

Diagnostic behavior to add:

1. Keep the current Live V1 probe intact.
2. Add a separate probe mode or entrypoint for A2 full-rig recovery.
3. Preserve source-probe ability to read local private asset config.
4. Add explicit metadata for every recovered marker component:
   - `OUT+0.3`;
   - `PG8`;
   - `TW-OFF`;
   - `CF2`;
   - `GS1`;
   - `PSET2`;
   - `BST1`;
   - `CHF1`;
   - `CHUG-UI2`.
5. Implement only one hypothesis at a time, each with metadata:
   - V1 raw formula;
   - V2 center/side formula;
   - V2 softclip/headroom;
   - output calibration;
   - final polish filters.
6. Render the same 6-second historical DI windows.
7. Compare with `npm run lab:source-parity`.
8. Reject a candidate if it has clipped or non-finite samples.

## Pass Criteria Before Playable Install

A source-built candidate is not allowed to replace the known-good beta until it passes all of these:

1. Runtime marker matches expected Current Best marker family.
2. NAM runtime loads successfully.
3. IRs load successfully.
4. Generated-input probe reports NAM active, zero latency, and zero clipped samples.
5. Runtime evidence target remains close to final known-good stable peak/RMS.
6. Source parity comparison against known-good beta renders is measurement-ready or has only explained sample-rate review status.
7. Source parity deltas no longer show the known failure modes:
   - `29-30 dB` too quiet;
   - tens of thousands of clipped samples;
   - excessive mid/high energy from simple ceiling modes;
   - excessive low/low-mid loss from peak-normalize mode.
8. Owner listening is explicitly requested only after technical parity evidence is acceptable.

## Stop Conditions

Stop before product integration if:

- exact source behavior cannot be recovered from evidence;
- parity remains dependent on offline file normalization rather than realtime-safe DSP;
- private asset paths or unknown-license assets would need to be committed;
- implementation requires changing product DSP or defaults without explicit owner approval;
- source-built output sounds or measures like the previously reported clipped/sprangt path.
