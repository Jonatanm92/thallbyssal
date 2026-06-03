# Reference Tone Gap Comparison Report

Status: private internal A/B only.

## Founder approval

- Approved pair: `pair_001`
- Approved DI used: yes
- Approved same-DI references used: 5
- Do not decide final tone automatically from this report.
- Do not treat any reference as something Thallbyssal should duplicate.

## Scope Guardrails

- Private internal analysis only.
- No DSP/core sound files were touched by this comparison.
- No presets were modified.
- No DI files were modified.
- No audio was written by the comparison harness.
- External/private-band references were not used for technical A/B.
- IR/cab folders were not used.
- Public-facing copy, presets, UI, marketing, demo pages, beta pages, and launch material must not use private reference names.

## Files

- Approved DI: `D:\CodexBuilds\thallbyssal-lab\di-test-files\DI Boostalizer.wav`
- Thallbyssal render: `D:\CodexBuilds\thallbyssal-lab\renders\reference-tone-gap-comparison\pair-001-thallbyssal-high-gain-foundation\2026-06-04_002922_306\high-gain-foundation-01\processed.wav`

Approved reference renders:

- `D:\CodexBuilds\thallbyssal-lab\reference-renders\Archetype Gojira + boostalizer Modern thall 2.wav`
- `D:\CodexBuilds\thallbyssal-lab\reference-renders\Archetype Gojira + boostalizer Modern thall thickener.wav`
- `D:\CodexBuilds\thallbyssal-lab\reference-renders\Archetype Gojira + boostalizer Modern thall.wav`
- `D:\CodexBuilds\thallbyssal-lab\reference-renders\DI on the verge preset + boostalizer innan amp.wav`
- `D:\CodexBuilds\thallbyssal-lab\reference-renders\DI Thall preset + boostalizer innan amp.wav`

## Metrics

| Role | File | Peak | RMS | LUFS Est. | Crest | Clips | Low-Mid | High |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Thallbyssal | processed.wav | -5.35 dB | -11.48 dB | -12.17 dB | 6.13 dB | 0 | -16.94 dB | -30.44 dB |
| Reference | Archetype Gojira + boostalizer Modern thall 2.wav | -7.17 dB | -21.24 dB | -21.93 dB | 14.07 dB | 0 | -27.45 dB | -36.44 dB |
| Reference | Archetype Gojira + boostalizer Modern thall thickener.wav | -9.03 dB | -23.28 dB | -23.97 dB | 14.25 dB | 0 | -29.49 dB | -38.94 dB |
| Reference | Archetype Gojira + boostalizer Modern thall.wav | -7.37 dB | -20.53 dB | -21.22 dB | 13.16 dB | 0 | -27.5 dB | -33.95 dB |
| Reference | DI on the verge preset + boostalizer innan amp.wav | -11.9 dB | -26.17 dB | -26.86 dB | 14.27 dB | 0 | -33.82 dB | -38.15 dB |
| Reference | DI Thall preset + boostalizer innan amp.wav | -13.54 dB | -27.83 dB | -28.52 dB | 14.29 dB | 0 | -35.43 dB | -39.73 dB |

Band energy uses an estimate from one-pole frequency splits. Treat it as directional founder listening support, not a mastering-grade spectrum analysis.

## Reference Average Delta

Negative values mean Thallbyssal measured below the reference average.

| Metric | Delta |
| --- | --- |
| peakDbfs | 4.45 |
| rmsDbfs | 12.33 |
| lufsEstimate | 12.33 |
| crestFactorDb | -7.88 |
| clippedSamples | 0 |
| lowRmsDbfs | 10.62 |
| lowMidRmsDbfs | 13.8 |
| midRmsDbfs | 12.35 |
| highRmsDbfs | 7 |
| highEnergyShare | -0.04 |
| highToLowMidDb | -6.8 |

## Level-Matched Metadata

No level-matched audio was created. These are gain values for controlled private listening setup only.

| Reference | LUFS Gain | RMS Gain | Peak After LUFS Match | Peak Risk |
| --- | --- | --- | --- | --- |
| Archetype Gojira + boostalizer Modern thall 2.wav | -9.76 dB | -9.76 dB | -15.11 dB | no |
| Archetype Gojira + boostalizer Modern thall thickener.wav | -11.8 dB | -11.8 dB | -17.15 dB | no |
| Archetype Gojira + boostalizer Modern thall.wav | -9.05 dB | -9.05 dB | -14.4 dB | no |
| DI on the verge preset + boostalizer innan amp.wav | -14.69 dB | -14.69 dB | -20.04 dB | no |
| DI Thall preset + boostalizer innan amp.wav | -16.35 dB | -16.35 dB | -21.7 dB | no |

## Listening Checklist

- [ ] Heavier
- [ ] Tighter attack
- [ ] Stronger low-mid/body
- [ ] More palm-mute punch
- [ ] More controlled high end
- [ ] Less weak/thin
- [ ] More density

## Interpretation Notes

- Raw Thallbyssal loudness is above the reference average, so the weaker/thinner report is not explained by a simple output-level deficit in this render. Use the negative level-match gain values before founder listening.
- Measured low-mid/body is above the reference average, so the body gap is more likely about masking, tightness, or attack shape than missing low-mid level.
- High band relative to low-mid/body is below the reference balance, which points toward darker cab/voicing and less pick-edge definition after level matching.
- Crest factor is lower than the reference average, suggesting a flatter or more compressed attack envelope that can read as less punch even when RMS is high.

## Tone-Gap Summary

| Gap | Report-only summary |
| --- | --- |
| Loudness/output | Thallbyssal measures louder than the reference average; founder A/B should check whether this is level rather than tone. |
| Low-mid/body | Low-mid/body energy measures above the reference average; listening should check whether the extra body is masking attack. |
| High-end/fizz | High-end balance sits below the reference balance; listening should check for dullness rather than fizz. |
| Palm-mute punch | Low-mid level is not the likely palm-mute weakness; founder listening should check transient shape and tightness. |
| Saturation/density | Lower crest factor suggests more density or compression than the reference average. |
| Transient/attack | Lower crest factor may mean attack is being flattened compared with the reference average. |
| Cab/voicing | Cab/voicing balance leans darker than the reference average by the band balance estimate. |

## Next Recommended Action

Founder should use the level-match metadata for manual private A/B, mark the listening checklist, and decide the next tone direction. Any DSP/core or preset tone change still needs explicit founder approval.
