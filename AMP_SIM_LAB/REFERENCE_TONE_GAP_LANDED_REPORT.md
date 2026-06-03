# Reference Tone Gap Landed Report

Status: landed on `factory/lab-foundation-checkpoint`.

## Landing Result

- Comparison landed: yes
- Merge commit hash: `bbf4e6e683d8ee15bb9a5d66d1ec5cd9fee6ae7a`
- Comparison branch: `tone/reference-tone-gap-comparison`
- Comparison commit: `580b0a36e408dd3d809bd1754c161b8ba64bb8b7`
- Stable base branch: `factory/lab-foundation-checkpoint`

## Approved Inputs

- Approved DI used: yes
- Approved references used count: 5
- Thallbyssal render created: yes
- Metrics generated: yes
- Level-matched comparison metadata created: yes

## Main Gaps Found

- Raw Thallbyssal is louder than the reference average by `+12.33 dB` RMS/LUFS estimate.
- Raw Thallbyssal low-mid energy is higher than the reference average by `+13.8 dB`.
- The weak/thin feel is not explained by a simple output or body deficit.
- Main measurable suspects: level-match offset, darker high-to-low-mid balance (`-6.8 dB`), much lower crest factor (`-7.88 dB`), and flatter attack/punch.

## Guardrails

- Audio committed: no
- DSP/core touched: no
- DI files touched: no
- Package-lock changed: no
- Presets touched: no
- Tone tuning started: no

## Verification

- `npm run lab:all`: passed
- `npm test -- --run`: passed
- `npm run build`: passed

## Next Recommended Action

`TONE_GAP_LEVEL_MATCHED_LISTENING_PACK`
