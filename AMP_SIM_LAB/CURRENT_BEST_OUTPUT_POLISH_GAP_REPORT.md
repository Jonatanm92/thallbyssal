# Current Best Output Polish Gap Report

Generated: 2026-06-28

## Scope

This report records the measurement-only output-polish gap after the A2 full-rig recovery probe v0 pass.

It does not approve product DSP changes, preset changes, beta installation, owner listening, source parity, asset shipping, or release use.

## Inputs

- Source probe variant: `a2-full-rig-v0`
- Source probe safety: `soft-ceiling`
- Source render root:
  - `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration\a2-full-rig-v0-soft-ceiling-20260628T005235`
- Known-good beta render root:
  - `D:\CodexBuilds\thallbyssal-lab\renders\current-best-preset-bank\20260624T120444Z\wav`
- Local manifest:
  - `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration\source-parity-manifest.local.json`
- Generated reports:
  - `D:\CodexBuilds\thallbyssal-lab\reports\current-best-output-polish-gap.json`
  - `D:\CodexBuilds\thallbyssal-lab\reports\current-best-output-polish-gap.md`

## Measurement Summary

The A2 v0 soft-ceiling probe is measurement-ready but not source-parity.

Average source-minus-known-good-beta deltas across musical comparable pairs:

| Band | Average delta |
| --- | ---: |
| RMS | `+3.45 dB` |
| Low 0-120 Hz | `+0.35 dB` |
| Low-mid 120-500 Hz | `+2.70 dB` |
| Mid 500-4000 Hz | `+6.08 dB` |
| High 4000+ Hz | `+6.94 dB` |

Risk flags from the measurement-only report:

- `excess-high-energy`
- `excess-mid-energy`
- `excess-low-mid-energy`
- `low-band-close-but-top-too-forward`
- `source-rms-too-hot`

## Interpretation

- The low band is already close to the known-good beta.
- The source probe is still much too forward in low-mid, mid, and high bands.
- The source probe is still too hot in RMS even after clipping is removed.
- This confirms that the missing source behavior is not another standalone limiter.
- The next recovery step should isolate product output polish/headroom filtering around the A2 full-rig path.

## Diagnostic A2 v1 Polish Probe

The follow-up diagnostic probe added a separate `a2-full-rig-v1-polish` variant to `ThallbyssalLiveV1Probe`.

This is still source-recovery tooling only. It is not routed into `PluginProcessor`, not installed over the known-good beta, and not approved for owner listening.

Probe-only polish hypothesis:

- Headroom trim: `-1.9 dB`.
- Low-mid cut: `-2.2 dB @ 340 Hz Q 0.7`.
- Mid cut: `-4.6 dB @ 1700 Hz Q 0.68`.
- High shelf: `-5.8 dB @ 4200 Hz Q 0.707`.

Generated local-only reports:

- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-a2-v1-polish-gap.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-a2-v1-polish-gap.md`

Average v1-minus-v0 deltas across rendered pairs:

| Band | Average v1 - v0 |
| --- | ---: |
| RMS | `-4.50 dB` |
| Low 0-120 Hz | `-3.29 dB` |
| Low-mid 120-500 Hz | `-4.00 dB` |
| Mid 500-4000 Hz | `-5.17 dB` |
| High 4000+ Hz | `-5.72 dB` |

Estimated v1-minus-known-good-beta deltas, derived from the previous v0 gap report plus fresh v1-minus-v0 measurements:

| Band | Estimated v1 - known-good beta |
| --- | ---: |
| RMS | `-0.48 dB` |
| Low 0-120 Hz | `-2.35 dB` |
| Low-mid 120-500 Hz | `-0.67 dB` |
| Mid 500-4000 Hz | `+1.27 dB` |
| High 4000+ Hz | `+1.39 dB` |

Per-file estimated v1-minus-known-good-beta gaps:

| File | RMS | Low | Low-mid | Mid | High | V1 clips |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| DI Boostalizer | `-0.75 dB` | `-2.57 dB` | `-0.92 dB` | `+1.22 dB` | `+2.36 dB` | `0` |
| Pick Attack | `+0.25 dB` | `-1.91 dB` | `+0.02 dB` | `+1.43 dB` | `+0.82 dB` | `0` |
| Low Tuned Chugs | `-0.95 dB` | `-2.56 dB` | `-1.11 dB` | `+1.17 dB` | `+0.98 dB` | `0` |

Important caveat: the previous known-good beta WAV cache is currently missing from `D:\CodexBuilds`, so the v1-to-beta values above are estimates, not direct render comparisons. Strict source parity still requires restored or regenerated known-good beta renders from the exact approved beta build.

## Boundaries

- Product DSP touched by this report: no.
- Golden Reference A touched: no.
- Product defaults touched: no.
- Original DI files touched: no.
- NAM/IR/audio/model/render/binary assets committed: no.
- Parity claim allowed: no.
- Ready for owner listening: no.

## Next Safe Task

Before any playable install, restore or regenerate the exact known-good beta render set and run a direct v1-polish versus beta comparison.

Do not route the v1-polish hypothesis into `PluginProcessor`, do not install it over the known-good beta, and do not ask for owner listening until direct measurement confirms the source path is close enough without clipping or non-finite samples.
