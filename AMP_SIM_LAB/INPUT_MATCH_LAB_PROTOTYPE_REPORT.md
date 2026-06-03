# Input Match Lab Prototype Report

Date: 2026-06-03
Branch: `agent/wave3-002-input-match-lab-prototype`
Status: offline lab prototype added

## Summary

- Prototype type: report-only Input Match / DI Calibration lab harness
- DI source: `D:\CodexBuilds\thallbyssal-lab\di-test-files`
- Generated JSON report: `D:\CodexBuilds\thallbyssal-lab\reports\input-match.json`
- Generated HTML report: `D:\CodexBuilds\thallbyssal-lab\reports\input-match.html`
- DI files analyzed: yes, 3 of 3 local WAV files
- Input classifications generated: yes
- Problematic classifications: 0
- Plugin UI implemented: no
- DSP/core touched: no
- Tone behavior touched: no
- DI files touched: no
- Preset tone values changed: no
- Input gain applied automatically: no
- Gate behavior changed automatically: no

## Prototype Scope

The prototype reads the existing `audio-metrics.json` output from the lab harness and creates Input Match guidance for founder-owned DI files. It reports peak level, RMS/loudness estimate, clipping status, a coarse transient/pick-attack estimate from peak-to-RMS distance, noise-floor estimate for dedicated noise captures, classification, suggested input gain range, suggested gate starting point, warning text, and a founder listening notes placeholder.

Noise-floor estimates for performance DI files are currently marked unknown because the existing metrics pass does not yet expose quiet-window sample analysis. The dedicated `noise.wav` capture uses RMS as the noise-floor estimate.

## Files Analyzed

| DI file | Peak | RMS | LUFS est. | Clipping | Noise floor | Pick attack est. | Classification | Suggested input gain | Suggested gate start | Warning |
| --- | ---: | ---: | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| `LOW TUNED CHUGS.wav` | -5.63 dBFS | -24.09 dBFS | -24.78 | no | unknown | 18.45 dB | healthy | -1.0 to +1.0 dB | -70 dBFS threshold starting point | No input-level warning |
| `PICK ATTACK.wav` | -7.02 dBFS | -29.24 dBFS | -29.93 | no | unknown | 22.22 dB | healthy | -1.0 to +1.0 dB | -70 dBFS threshold starting point | No input-level warning |
| `noise.wav` | -67.81 dBFS | -86.44 dBFS | -87.13 | no | -86.44 dBFS | 18.63 dB | healthy | -1.0 to +1.0 dB | -74 dBFS threshold starting point | No input-level warning |

Founder listening notes placeholder:

- `LOW TUNED CHUGS.wav`: `(founder listening notes placeholder)`
- `PICK ATTACK.wav`: `(founder listening notes placeholder)`
- `noise.wav`: `(founder listening notes placeholder)`

## Classification Rules

- `clipped`: clipped samples exist or peak is at/above -0.5 dBFS.
- `noisy`: estimated noise floor is above -60 dBFS.
- `too hot`: peak is above -3 dBFS or RMS is above -16 dBFS.
- `too weak`: peak is below -18 dBFS or RMS is below -36 dBFS for performance DI files.
- `healthy`: no clipping/noise/hot/weak warnings.
- `unknown`: metrics were missing or unreadable.

These thresholds are conservative lab defaults only. They do not tune presets, alter input gain, alter gate behavior, or approve product UI behavior.

## Outputs Added

- `AMP_SIM_LAB/test-harness/input-match/input-match.mjs`
- `AMP_SIM_LAB/test-harness/input-match/input-match.test.mjs`
- `AMP_SIM_LAB/test-harness/input-match/run-input-match.mjs`
- Report index entry for `input-match.html`
- `lab:all` step for the Input Match report

## Safety Verification

- No DSP/core files were edited.
- No native audio processing files were edited.
- No DI files were modified or committed.
- No preset tone values were changed.
- No package dependencies were changed.
- No `package-lock.json` changes were made.
- No telemetry, analytics, auth, checkout, licensing, DRM, cloud sync, or public launch code was added.

## Next Recommended Task

Add quiet-window noise-floor and short-window transient metrics directly to the existing WAV metrics pass, with byte-identity safety checks proving original DI files remain unchanged before and after analysis.
