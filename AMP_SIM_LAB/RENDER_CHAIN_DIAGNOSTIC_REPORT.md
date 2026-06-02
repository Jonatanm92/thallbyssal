# Render Chain Diagnostic Report

Date: 2026-06-01

## Symptom

Founder feedback: the audition render starts extremely loud, then seems to clip and become weak.

## Evidence

The input DI level was stable, but the processed output was not. Before the fix, the first 0.5 seconds of the rendered audition was roughly 11 dB RMS hotter than the following audio. That matched the listening report: the render started too loud and then dropped.

After the fix, the first Palmer IR audition render measured:

| Segment | Peak | RMS | Clips |
| --- | ---: | ---: | ---: |
| 0.00-0.05s | -17.8 dBFS | -25.7 dBFS | 0 |
| 0.05-0.10s | -17.5 dBFS | -25.5 dBFS | 0 |
| 0.10-0.20s | -17.8 dBFS | -25.7 dBFS | 0 |
| 0.20-0.50s | -17.2 dBFS | -26.4 dBFS | 0 |
| 0.50-1.00s | -16.8 dBFS | -26.2 dBFS | 0 |
| 1.00-2.00s | -17.0 dBFS | -26.2 dBFS | 0 |

## Root Cause

The cabinet convolution was prepared before loading the IR, then the IR was loaded after preparation. JUCE convolution can load impulse responses asynchronously, so the first offline render blocks could start without the intended cabinet IR fully active.

That caused a dry/hot start before the cabinet path settled.

## Fix

The DSP engine now prepares the cabinet convolution again immediately after a cabinet IR is loaded, before the offline renderer processes the first block.

Changed files:

- `native/juce-audio-engine/Source/ThallLabDspEngine.h`
- `native/juce-audio-engine/Source/ThallLabDspEngine.cpp`

## Guardrail

The lab tests now include a source-level regression check that the DSP engine activates loaded cabinet IRs before the first rendered block.

Validation after the fix:

- `npm run lab:test`: 32 passed
- `npm run lab:render:safety`: 0 errors, 0 warnings
- `npm run lab:all`: completed
- `npm test -- --run`: 64 passed
- `npm run build`: passed
- `npm run native:build`: passed

## Remaining Tone Work

The startup drop is fixed. The remaining "still too weak / not enough input push" feedback was handled as controlled gain-staging and preset audition work, not as another hidden render-chain bug.

## Gain Staging Follow-Up

Founder feedback after the IR-start fix: the amp still felt like input gain was lower than the UI suggested, and the standalone needed the input raised very high before it behaved like an amp sim.

Findings:

- The offline renderer metadata reported `inputPeakLinear` from the raw mono input before input gain, which made input-gain diagnostics misleading.
- The standalone meter already used the DSP engine input peak after input gain, but the UI label said `Raw`, which was misleading.
- The high-gain audition preset had no explicit `inputGainDb` or `outputGainDb`, so the renderer used conservative defaults.
- The first Palmer audition baseline measured about `-25.90 dBFS RMS`.
- A controlled test with `inputGainDb: 6`, `outputGainDb: 0`, and `amp.outputDb: 3` measured about `-15.75 dBFS RMS`, with 0 clipped samples.

Follow-up changes:

- Offline metadata now writes both `rawInputPeakLinear` and post-gain `inputPeakLinear`.
- The standalone meter label now says `Input` instead of `Raw`.
- High-gain standalone presets now start with more usable input/output gain staging.
- Private IR audition presets now render with explicit input/output gain staging.
