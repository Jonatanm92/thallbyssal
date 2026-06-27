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
- Parity status: `review-render-format-or-duration-mismatch`.
- Source probe metadata target: `Live V1 source recovery probe - not Current Best parity`.
- Input resampled: yes, 44100 Hz to 48000 Hz.
- Source render: 48000 Hz, stereo, `50.308 s`.
- Known-good beta render: 44100 Hz, stereo, `6.000 s`.
- Duration delta: `+44.308 s`.
- RMS delta, source minus known-good beta: `-30.43 dB`.
- Crest delta, source minus known-good beta: `+5.78 dB`.
- Low band delta: `-36.08 dB`.
- Low-mid band delta: `-33.05 dB`.
- Mid band delta: `-26.10 dB`.
- High band delta: `-23.31 dB`.
- Clipped sample delta: `0`.

Pick Attack:

- Comparable pair: yes.
- Parity status: `review-render-format-or-duration-mismatch`.
- Source probe metadata target: `Live V1 source recovery probe - not Current Best parity`.
- Input resampled: yes, 96000 Hz to 48000 Hz.
- Source render: 48000 Hz, stereo, `34.911 s`.
- Known-good beta render: 96000 Hz, stereo, `6.000 s`.
- Duration delta: `+28.911 s`.
- RMS delta, source minus known-good beta: `-28.49 dB`.
- Crest delta, source minus known-good beta: `+4.30 dB`.
- Low band delta: `-33.83 dB`.
- Low-mid band delta: `-30.99 dB`.
- Mid band delta: `-25.93 dB`.
- High band delta: `-25.10 dB`.
- Clipped sample delta: `0`.

## Conclusion

The source-built recovery probe is not source-parity with the known-good Current Best beta.

The current measurement pairs are also not fair parity pairs because the source probe rendered full DI files while the known-good beta audio-lock set uses shorter baseline clips. The measured level and band deltas are useful as warning evidence, but they must not be treated as final tone/parity deltas until source and beta render the exact same DI segment at the same intended settings.

The source probe remains useful only as NAM runtime/source plumbing evidence.

## What This Means

- Do not integrate this source probe into `PluginProcessor`.
- Do not install it over the known-good beta.
- Do not use it for owner listening as if it represented Current Best.
- Do not claim Current Best source recovery is complete.
- Do not use the current parity report for listening until source and beta render windows match.

## Next Safe Step

Recover or reconstruct the actual Current Best product chain/settings used by the known-good beta before attempting another source parity pass.

The next source task should focus on:

1. Rendering the exact same 6-second historical DI windows through the source probe.
2. Identifying the missing gain staging, branch settings, cab/IR routing, Current Best controls, and output calibration that separate the source probe from the known-good beta render set.
3. Re-running `npm run lab:source-parity` only after the source and beta render duration/sample-rate expectations are explicitly aligned.
