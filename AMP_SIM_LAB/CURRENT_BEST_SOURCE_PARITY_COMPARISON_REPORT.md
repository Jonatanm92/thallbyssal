# Current Best Source Parity Comparison Report

Generated: 2026-06-27

## Scope

This report records the first local measurement comparison between the source-built NAM recovery probe and the known-good Current Best internal beta render set.

This is not a tone approval, not a parity approval, and not a product integration approval.

## Latest Pass

The 2026-06-27 windowed pass added `--start-seconds` and `--duration-seconds` support to the local-only `ThallbyssalLiveV1Probe` so the source probe can render the same 6-second DI windows used by the known-good beta audio-lock renders.

The duration mismatch is now removed for the compared files.

Two local-only passes now exist:

1. Live V1 default-gain probe: roughly 29-30 dB lower RMS than the known-good Current Best baseline.
2. A2-manifest gain override probe: roughly level-aligned or slightly louder than the known-good Current Best baseline, but clips heavily and does not match the beta spectral balance.

This narrows the source recovery blocker: the missing Current Best gain staging is now partially identified, but the raw probe still lacks the product safety/output/polish behavior needed to match the known-good beta.

## Inputs

- Source probe renders: local-only `ThallbyssalLiveV1Probe` outputs under `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration`.
- Known-good beta renders: local-only Current Best baseline renders from the audio-lock set under `D:\CodexBuilds\thallbyssal-lab\renders\current-best-preset-bank`.
- Compared pairs:
  - DI Boostalizer baseline.
  - Pick Attack baseline.

The local manifest and generated JSON/HTML/Markdown comparison reports live under `D:\CodexBuilds\thallbyssal-lab` and must not be committed if they contain private paths.

## Measurement Evidence

### Windowed Live V1 Default-Gain Probe

DI Boostalizer:

- Comparable pair: yes.
- Parity status: `review-render-format-or-duration-mismatch`.
- Source probe metadata target: `Live V1 source recovery probe - not Current Best parity`.
- Input resampled: yes, 44100 Hz to 48000 Hz.
- Source render: 48000 Hz, stereo, `6.000 s`.
- Known-good beta render: 44100 Hz, stereo, `6.000 s`.
- Duration delta: `0.000 s`.
- Peak delta, source minus known-good beta: `-24.87 dB`.
- RMS delta, source minus known-good beta: `-29.97 dB`.
- Crest delta, source minus known-good beta: `+5.10 dB`.
- Low band delta: `-33.37 dB`.
- Low-mid band delta: `-31.37 dB`.
- Mid band delta: `-26.61 dB`.
- High band delta: `-24.06 dB`.
- Clipped sample delta: `0`.

Pick Attack:

- Comparable pair: yes.
- Parity status: `review-render-format-or-duration-mismatch`.
- Source probe metadata target: `Live V1 source recovery probe - not Current Best parity`.
- Input resampled: yes, 96000 Hz to 48000 Hz.
- Source render: 48000 Hz, stereo, `6.000 s`.
- Known-good beta render: 96000 Hz, stereo, `6.000 s`.
- Duration delta: `0.000 s`.
- Peak delta, source minus known-good beta: `-26.11 dB`.
- RMS delta, source minus known-good beta: `-28.64 dB`.
- Crest delta, source minus known-good beta: `+2.52 dB`.
- Low band delta: `-33.16 dB`.
- Low-mid band delta: `-30.53 dB`.
- Mid band delta: `-26.35 dB`.
- High band delta: `-25.67 dB`.
- Clipped sample delta: `0`.

### Windowed A2-Manifest Gain Override Probe

This pass used a local-only doNotShip config matching the known Current Best A2 manifest gain shape at a high level:

- Branch gain direction: approximately `-3 dB` instead of the older Live V1 `-17/-19 dB` region.
- Final gain direction: approximately `+18 dB` instead of the older Live V1 `-0.53 dB` region.
- Raw asset paths remain local-only and are not recorded here as product assets.

DI Boostalizer:

- Comparable pair: yes.
- Parity status: `review-render-format-or-duration-mismatch`.
- Source render: 48000 Hz, stereo, `6.000 s`.
- Known-good beta render: 44100 Hz, stereo, `6.000 s`.
- Duration delta: `0.000 s`.
- Peak delta, source minus known-good beta: `+0.52 dB`.
- RMS delta, source minus known-good beta: `+1.79 dB`.
- Crest delta, source minus known-good beta: `-1.27 dB`.
- Low band delta: `-1.44 dB`.
- Low-mid band delta: `+0.63 dB`.
- Mid band delta: `+5.02 dB`.
- High band delta: `+7.36 dB`.
- Clipped sample delta: `+48823`.

Pick Attack:

- Comparable pair: yes.
- Parity status: `review-render-format-or-duration-mismatch`.
- Source render: 48000 Hz, stereo, `6.000 s`.
- Known-good beta render: 96000 Hz, stereo, `6.000 s`.
- Duration delta: `0.000 s`.
- Peak delta, source minus known-good beta: `+0.53 dB`.
- RMS delta, source minus known-good beta: `+3.15 dB`.
- Crest delta, source minus known-good beta: `-2.62 dB`.
- Low band delta: `-1.14 dB`.
- Low-mid band delta: `+1.53 dB`.
- Mid band delta: `+5.34 dB`.
- High band delta: `+5.83 dB`.
- Clipped sample delta: `+41207`.

## Conclusion

The source-built recovery probe is not source-parity with the known-good Current Best beta.

The previous full-file versus 6-second duration mismatch has been removed. The first windowed pass proved the older Live V1 probe gain staging is far too quiet. The A2-manifest gain override pass proved the missing high-level gain direction is real, but it also proved that directly applying those gains in the raw Live V1 probe is unsafe: it clips tens of thousands of samples and overstates mid/high energy relative to the known-good beta.

The remaining blocker is no longer "unknown level mismatch." It is now narrower:

- Recover the actual Current Best A2 chain shape.
- Recover the output safety/headroom behavior around the `+18 dB` final gain region.
- Recover the product polish/EQ behavior that prevents the A2-gain path from becoming clipped and too mid/high-forward.
- Preserve sample-rate expectations before making a strict parity claim.

The source probe remains useful only as NAM runtime/source plumbing evidence.

## What This Means

- Do not integrate this source probe into `PluginProcessor`.
- Do not install it over the known-good beta.
- Do not use it for owner listening as if it represented Current Best.
- Do not claim Current Best source recovery is complete.
- Do not use the current source-probe renders for listening as Current Best.
- Do not apply the A2-manifest gain values directly to a product path without recovering the missing safety/output chain.

## Next Safe Step

Recover or reconstruct the actual Current Best product chain/settings used by the known-good beta before attempting another source parity pass.

The next source task should focus on:

1. Reconstruct the A2 full-rig Current Best probe separately from the older Live V1 probe.
2. Add source-probe support for the known Current Best output safety/headroom stage before any listening or install attempt.
3. Re-run `npm run lab:source-parity` after the source path represents the actual Current Best chain, not only the Live V1 recovery probe.
4. Decide whether the source parity tool should support a separate "metrics only" mode for sample-rate-mismatched but duration-matched comparisons, while keeping strict parity claims blocked unless sample rates also match.
