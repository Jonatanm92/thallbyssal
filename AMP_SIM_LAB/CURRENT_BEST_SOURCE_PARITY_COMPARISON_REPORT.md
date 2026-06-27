# Current Best Source Parity Comparison Report

Generated: 2026-06-27

## Scope

This report records the first local measurement comparison between the source-built NAM recovery probe and the known-good Current Best internal beta render set.

This is not a tone approval, not a parity approval, and not a product integration approval.

## Latest Pass

The 2026-06-27 windowed pass added `--start-seconds` and `--duration-seconds` support to the local-only `ThallbyssalLiveV1Probe` so the source probe can render the same 6-second DI windows used by the known-good beta audio-lock renders.

The duration mismatch is now removed for the compared files. The source probe is still not parity with the known-good beta because the probe remains a Live V1 source recovery path, renders at 48000 Hz, and measures roughly 29-30 dB lower RMS than the known-good Current Best baseline.

## Inputs

- Source probe renders: local-only `ThallbyssalLiveV1Probe` outputs under `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration`.
- Known-good beta renders: local-only Current Best baseline renders from the audio-lock set under `D:\CodexBuilds\thallbyssal-lab\renders\current-best-preset-bank`.
- Compared pairs:
  - DI Boostalizer baseline.
  - Pick Attack baseline.

The local manifest and generated JSON/HTML/Markdown comparison reports live under `D:\CodexBuilds\thallbyssal-lab` and must not be committed if they contain private paths.

## Measurement Evidence

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

## Conclusion

The source-built recovery probe is not source-parity with the known-good Current Best beta.

The previous full-file versus 6-second duration mismatch has been removed for this local pass. The remaining mismatch is more meaningful: the source probe still renders at a different sample rate and is far below the known-good beta level. This points to missing Current Best product-chain behavior, gain staging, exact asset routing, or preset/control calibration rather than a simple render-window bug.

The source probe remains useful only as NAM runtime/source plumbing evidence.

## What This Means

- Do not integrate this source probe into `PluginProcessor`.
- Do not install it over the known-good beta.
- Do not use it for owner listening as if it represented Current Best.
- Do not claim Current Best source recovery is complete.
- Do not use the current source-probe renders for listening as Current Best.

## Next Safe Step

Recover or reconstruct the actual Current Best product chain/settings used by the known-good beta before attempting another source parity pass.

The next source task should focus on:

1. Identifying the missing gain staging, branch settings, cab/IR routing, Current Best controls, and output calibration that separate the source probe from the known-good beta render set.
2. Re-running `npm run lab:source-parity` after the source path represents the actual Current Best chain, not only the Live V1 recovery probe.
3. Deciding whether the source parity tool should support a separate "metrics only" mode for sample-rate-mismatched but duration-matched comparisons, while keeping strict parity claims blocked unless sample rates also match.
