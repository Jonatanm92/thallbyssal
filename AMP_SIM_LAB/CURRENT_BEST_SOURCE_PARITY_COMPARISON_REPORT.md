# Current Best Source Parity Comparison Report

Generated: 2026-06-27

## Scope

This report records the first local measurement comparison between the source-built NAM recovery probe and the known-good Current Best internal beta render set.

This is not a tone approval, not a parity approval, and not a product integration approval.

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
- Source probe metadata target: `Live V1 source recovery probe - not Current Best parity`.
- Input resampled: yes, 44100 Hz to 48000 Hz.
- RMS delta, source minus known-good beta: `-30.43 dB`.
- Crest delta, source minus known-good beta: `+5.78 dB`.
- Low band delta: `-36.08 dB`.
- Low-mid band delta: `-33.05 dB`.
- Mid band delta: `-26.10 dB`.
- High band delta: `-23.31 dB`.
- Clipped sample delta: `0`.

Pick Attack:

- Comparable pair: yes.
- Source probe metadata target: `Live V1 source recovery probe - not Current Best parity`.
- Input resampled: yes, 96000 Hz to 48000 Hz.
- RMS delta, source minus known-good beta: `-28.49 dB`.
- Crest delta, source minus known-good beta: `+4.30 dB`.
- Low band delta: `-33.83 dB`.
- Low-mid band delta: `-30.99 dB`.
- Mid band delta: `-25.93 dB`.
- High band delta: `-25.10 dB`.
- Clipped sample delta: `0`.

## Conclusion

The source-built recovery probe is not source-parity with the known-good Current Best beta.

The measured level and band deltas are far too large to treat the probe as equivalent. The source probe remains useful only as NAM runtime/source plumbing evidence.

## What This Means

- Do not integrate this source probe into `PluginProcessor`.
- Do not install it over the known-good beta.
- Do not use it for owner listening as if it represented Current Best.
- Do not claim Current Best source recovery is complete.

## Next Safe Step

Recover or reconstruct the actual Current Best product chain/settings used by the known-good beta before attempting another source parity pass.

The next source task should focus on identifying the missing gain staging, branch settings, cab/IR routing, Current Best controls, and output calibration that separate the source probe from the known-good beta render set.
