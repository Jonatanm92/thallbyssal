# Reference Tone Gap Comparison

Status: internal measurement plan and artifact map.

## Purpose

Compare the current Thallbyssal same-DI render against founder-owned same-DI reference renders to explain the reported weaker/thinner feel. This is report-only founder listening support, not automatic tone selection.

## Approved Inputs

- Approved pair: `pair_001`
- DI: `D:\CodexBuilds\thallbyssal-lab\di-test-files\DI Boostalizer.wav`
- Approved reference count: 5
- Thallbyssal render: `D:\CodexBuilds\thallbyssal-lab\renders\reference-tone-gap-comparison\pair-001-thallbyssal-high-gain-foundation\2026-06-04_002922_306\high-gain-foundation-01\processed.wav`

## Method

1. Use only the approved DI source.
2. Use only founder-rendered same-DI reference renders.
3. Render Thallbyssal through the existing real headless render pipeline.
4. Measure peak, RMS, LUFS estimate, crest factor, clipping, and estimated low/low-mid/mid/high band energy.
5. Create metadata-only level-match gain values.
6. Preserve founder ownership of final listening and tone decisions.

## Boundaries

- No DSP/core sound changes.
- No preset edits.
- No DI edits.
- No generated audio committed.
- No reference audio committed.
- No external/private-band references used for technical A/B.
- No IR/cab folder use.
