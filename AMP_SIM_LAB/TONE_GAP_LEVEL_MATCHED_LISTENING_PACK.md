# Tone Gap Level-Matched Listening Pack

Status: internal founder listening support only.

## Purpose

Use this pack to make a same-DI private A/B decision between the current Thallbyssal render and the five founder-approved reference renders. This pack does not change tone, approve tone, create audio, or decide the next sprint automatically.

## Guardrails

- Do not modify DSP/core sound.
- Do not modify presets.
- Do not modify DI files.
- Do not tune sound from this document alone.
- Do not create or commit fake renders.
- Do not commit audio files, level-matched audio files, or reference audio.
- Do not use external/private-band references for technical A/B.
- Do not create public-facing competitor or plugin claims from this pack.

## Landed Comparison

- Comparison landed: yes
- Merge commit: `bbf4e6e683d8ee15bb9a5d66d1ec5cd9fee6ae7a`
- Report commit: `eeaf2a2ef02f0149304fbb15f7ded05b5191f47e`
- Approved pair: `pair_001`
- Approved DI used: yes
- Approved references used count: 5
- Thallbyssal render created: yes
- Metrics generated: yes
- Level-matched comparison metadata created: yes
- Audio committed: no
- DSP/core touched: no
- DI files touched: no

## Source Assets

Approved DI:

```text
D:\CodexBuilds\thallbyssal-lab\di-test-files\DI Boostalizer.wav
```

Thallbyssal render:

```text
D:\CodexBuilds\thallbyssal-lab\renders\reference-tone-gap-comparison\pair-001-thallbyssal-high-gain-foundation\2026-06-04_002922_306\high-gain-foundation-01\processed.wav
```

Founder-approved reference renders:

```text
D:\CodexBuilds\thallbyssal-lab\reference-renders\Archetype Gojira + boostalizer Modern thall 2.wav
D:\CodexBuilds\thallbyssal-lab\reference-renders\Archetype Gojira + boostalizer Modern thall thickener.wav
D:\CodexBuilds\thallbyssal-lab\reference-renders\Archetype Gojira + boostalizer Modern thall.wav
D:\CodexBuilds\thallbyssal-lab\reference-renders\DI on the verge preset + boostalizer innan amp.wav
D:\CodexBuilds\thallbyssal-lab\reference-renders\DI Thall preset + boostalizer innan amp.wav
```

Generated metadata reference, not committed:

```text
D:\CodexBuilds\thallbyssal-lab\reports\reference-tone-gap-comparison.json
```

## Metrics Summary

| Role | File | Peak | RMS | LUFS Est. | Crest | Clips | Low-Mid | High |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Thallbyssal | processed.wav | -5.35 dB | -11.48 dB | -12.17 dB | 6.13 dB | 0 | -16.94 dB | -30.44 dB |
| Reference | Archetype Gojira + boostalizer Modern thall 2.wav | -7.17 dB | -21.24 dB | -21.93 dB | 14.07 dB | 0 | -27.45 dB | -36.44 dB |
| Reference | Archetype Gojira + boostalizer Modern thall thickener.wav | -9.03 dB | -23.28 dB | -23.97 dB | 14.25 dB | 0 | -29.49 dB | -38.94 dB |
| Reference | Archetype Gojira + boostalizer Modern thall.wav | -7.37 dB | -20.53 dB | -21.22 dB | 13.16 dB | 0 | -27.5 dB | -33.95 dB |
| Reference | DI on the verge preset + boostalizer innan amp.wav | -11.9 dB | -26.17 dB | -26.86 dB | 14.27 dB | 0 | -33.82 dB | -38.15 dB |
| Reference | DI Thall preset + boostalizer innan amp.wav | -13.54 dB | -27.83 dB | -28.52 dB | 14.29 dB | 0 | -35.43 dB | -39.73 dB |

Band energy uses the landed one-pole split estimate. Treat it as directional founder listening support, not mastering-grade spectrum analysis.

## Reference Average Delta

Positive values mean Thallbyssal measured above the reference average. Negative values mean Thallbyssal measured below the reference average.

| Metric | Delta |
| --- | --- |
| peakDbfs | +4.45 dB |
| rmsDbfs | +12.33 dB |
| lufsEstimate | +12.33 dB |
| crestFactorDb | -7.88 dB |
| clippedSamples | 0 |
| lowRmsDbfs | +10.62 dB |
| lowMidRmsDbfs | +13.8 dB |
| midRmsDbfs | +12.35 dB |
| highRmsDbfs | +7 dB |
| highEnergyShare | -0.04 |
| highToLowMidDb | -6.8 dB |

## Level-Match Metadata

No level-matched audio was created. Apply the listed gain to the Thallbyssal render for a private manual comparison against each reference.

| Compare against reference | Thallbyssal LUFS gain | Thallbyssal RMS gain | Thallbyssal peak after LUFS match | Peak risk |
| --- | --- | --- | --- | --- |
| Archetype Gojira + boostalizer Modern thall 2.wav | -9.76 dB | -9.76 dB | -15.11 dB | no |
| Archetype Gojira + boostalizer Modern thall thickener.wav | -11.8 dB | -11.8 dB | -17.15 dB | no |
| Archetype Gojira + boostalizer Modern thall.wav | -9.05 dB | -9.05 dB | -14.4 dB | no |
| DI on the verge preset + boostalizer innan amp.wav | -14.69 dB | -14.69 dB | -20.04 dB | no |
| DI Thall preset + boostalizer innan amp.wav | -16.35 dB | -16.35 dB | -21.7 dB | no |

## Listening Checklist

- [ ] Confirm the DI and all references are the same approved `pair_001` comparison set.
- [ ] Listen at matched monitoring volume before making tone notes.
- [ ] A/B Thallbyssal against each reference with the relevant Thallbyssal gain applied.
- [ ] Focus on perceived weakness/thinness after matching level.
- [ ] Check whether low-mid weight helps or masks attack.
- [ ] Check whether palm-mute transients feel flat, late, or compressed.
- [ ] Check whether high-end bite is missing before deciding fizz is controlled.
- [ ] Separate saturation density from output volume.
- [ ] Do not request a volume boost or low-mid boost unless the founder sheet says those are still the true gaps after level matching.

## Rating Fields

Use `1` for clearly weak, `3` for acceptable/unclear, and `5` for clearly strong.

| Field | Rating 1-5 | Notes |
| --- | --- | --- |
| Perceived heaviness |  |  |
| Attack/punch |  |  |
| High-end bite |  |  |
| Fizz control |  |  |
| Low-mid weight |  |  |
| Chug impact |  |  |
| Density/saturation |  |  |
| Overall: would post this? yes/no |  |  |

## Decision Options

- [ ] Attack/punch sprint
- [ ] High-balance/presence/bite sprint
- [ ] Saturation/density sprint
- [ ] Cab/IR voicing sprint
- [ ] Reject current voicing
- [ ] Needs more reference renders

## Founder Note

Raw Thallbyssal is louder than the reference average by `+12.33 dB` RMS/LUFS estimate and higher in low-mid by `+13.8 dB`, yet it is heard as weaker/thinner. That points away from simple output volume or low-mid boosts and toward transient/palm-mute punch, high-balance/presence/bite, and saturation density shape.
