# Audio Regression Test Plan

Purpose: catch audio regressions without taking creative control away from the founder.

The lab should test repeatable technical behavior. Tone choices remain founder-approved.

## Test Matrix

### Sample Rates

- 44.1 kHz
- 48 kHz
- 88.2 kHz
- 96 kHz

### Buffer Sizes

- 32 samples
- 64 samples
- 128 samples
- 256 samples
- 512 samples
- 1024 samples

## Metrics

For each DI file, preset, sample rate, and buffer size:

- CPU usage average
- CPU usage peak
- Reported latency
- Output peak dBFS
- Output RMS dBFS
- LUFS estimate or measured integrated LUFS when a proper meter is added
- Clipped sample count
- Denormal/near-silence stability
- Offline render hash or metric signature

## Required Behavior Tests

### Preset Recall

- Load every preset.
- Save current state.
- Reload saved state.
- Confirm all parameter values match.

### Bypass Behavior

- Enable bypass.
- Confirm audio passes or mutes according to the chosen product behavior.
- Disable bypass.
- Confirm processed output returns without clicks or unstable peaks.

### Mono/Stereo Behavior

- Mono input to mono output.
- Mono input to stereo output.
- Stereo input to stereo output.
- Confirm mono mode writes matched left/right or a single mono bus.
- Confirm stereo mode does not clip compared to mono.

### Offline Render Consistency

- Render the same DI/preset twice.
- Compare peak, RMS, duration, sample rate, and hash/signature.
- Allow tiny floating-point tolerance.

### Denormal Handling

- Feed silence.
- Feed very low-level noise.
- Confirm CPU does not spike and output remains stable.

### Crash Handling

- Load empty files.
- Load unsupported files.
- Load missing preset references.
- Switch presets while audio is active.
- Toggle bypass while audio is active.

### Automation Stability

- Automate gain, output, gate threshold, transpose, and cab controls.
- Confirm no crash, no NaN samples, and no uncontrolled clipping.

## Current Harness Status

The harness can scan founder-owned WAV files and report peak/RMS/clipping. It also validates the starter DI set for clipping, noise floor, duration, sample rate, and basic naming hygiene. The audition matrix pairs ready DI files with internal presets so renders have a repeatable test queue. The render hook can dry-run manual jobs, run real local headless renders through `ThallbyssalOfflineRenderer`, generate render reports, and compare baselines. Tone quality is not judged automatically.

Run:

```bash
npm run lab:metrics
npm run lab:di
npm run lab:di:strict
npm run lab:audition
npm run lab:audition:strict
npm run lab:render -- --input AMP_SIM_LAB/di-test-files/low_tuned_chugs.wav --preset AMP_SIM_LAB/presets/examples/high_gain_foundation_01.json --out AMP_SIM_LAB/renders/manual-test
npm run lab:audition:render
npm run lab:render:dry-run
npm run lab:render:strict
npm run lab:baseline:create
npm run lab:baseline:compare
```
