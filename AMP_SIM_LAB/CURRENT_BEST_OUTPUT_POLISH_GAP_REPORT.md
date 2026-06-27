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

## Boundaries

- Product DSP touched by this report: no.
- Golden Reference A touched: no.
- Product defaults touched: no.
- Original DI files touched: no.
- NAM/IR/audio/model/render/binary assets committed: no.
- Parity claim allowed: no.
- Ready for owner listening: no.

## Next Safe Task

Before any playable install, implement only a diagnostic probe hypothesis for the missing A2 output polish/headroom stage and compare it with `npm run lab:source-parity` plus `npm run lab:source-polish-gap`.

Do not route that hypothesis into `PluginProcessor`, do not install it over the known-good beta, and do not ask for owner listening until the mid/high excess is materially reduced by measurement without clipping or non-finite samples.
