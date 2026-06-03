# Input Match Feature Plan

Date: 2026-06-03
Status: future feature concept, planning only

Input Match may also be called DI Calibration. This document defines the future concept only. It does not approve implementation.

## Feature Goal

Input Match should help Thallbyssal respond consistently across different guitars, pickups, interfaces, and DI levels by analyzing founder-owned DI WAV files and producing clear calibration guidance before tone evaluation or private beta demos.

The feature should eventually:

- Analyze founder-owned DI WAV files.
- Detect peak level.
- Detect RMS/loudness level.
- Detect clipping.
- Estimate noise floor.
- Estimate pick attack/transient strength.
- Warn if input is too weak or too hot.
- Suggest an input gain range.
- Suggest a gate starting point.
- Create an input calibration report.
- Help presets react more consistently.

## User Problem

Modern metal amp sims can feel inconsistent when the source DI changes. A guitar with hot pickups, a quiet interface input, clipped conversion, or a noisy DI can make the same preset feel loose, harsh, gated too hard, or underpowered.

Input Match should make that problem visible. It should help the founder and future users understand whether the input is ready for preset audition before they judge the amp tone.

## Technical Measurements To Collect

The first approved implementation should collect objective measurements only:

- File path and DI slot name.
- Sample rate.
- Bit depth when available.
- Channel count.
- Duration.
- Peak level in dBFS.
- RMS level in dBFS.
- Loudness estimate if a local implementation is available without new external services.
- Clipping count and clipping percentage.
- Near-clipping count above a conservative threshold.
- Noise floor estimate from quiet windows.
- Pick attack/transient strength estimate from short-window peak-to-RMS movement.
- Silence or near-silence detection.
- DC offset estimate if practical.
- Suggested input gain range based on peak headroom and RMS target range.
- Suggested gate starting point based on noise floor and transient strength.

The measurements must describe the DI. They must not rewrite the DI, normalize it, tune presets, or alter the amp response.

## First Offline/Lab Version

The first version should live in AMP_SIM_LAB as an internal offline report generator after founder approval.

Expected behavior:

- Read founder-owned WAV files from approved DI locations.
- Produce `AMP_SIM_LAB` report JSON and HTML.
- Mark each DI as ready, warning, or blocked.
- Explain whether the DI is too weak, too hot, clipped, noisy, or unusually transient-heavy.
- Suggest an input gain range and gate starting point as guidance only.
- Feed render planning so real demo clips can be interpreted against known DI quality.
- Refuse unsupported or unapproved files with clear errors.

The first lab version must be non-destructive and must not modify DI files, presets, DSP/core files, or render output.

## Later Plugin UI Version

A later approved plugin UI version could expose a simple calibration workflow:

- User plays or loads a short DI passage.
- The plugin displays input health: too low, good range, too hot, clipped, or noisy.
- The UI suggests input trim and gate starting point.
- The UI explains that suggestions are starting points, not automatic tone matching.
- The user chooses whether to apply input trim or gate settings.
- Calibration results can be saved locally with a preset/session if that feature is approved later.

The plugin UI version must avoid telemetry, analytics, cloud sync, auth, DRM, checkout, licensing systems, or private data collection unless separately approved in a future task.

## Validation Tests

Future implementation should include tests for:

- Peak detection on known WAV fixtures.
- RMS/loudness calculation on known WAV fixtures.
- Clipping detection.
- Near-clipping warning thresholds.
- Noise floor estimate on quiet sections.
- Transient strength classification on pick-attack fixtures.
- Too-weak and too-hot input warnings.
- Suggested input gain range bounds.
- Suggested gate starting point bounds.
- Unsupported channel count or sample format handling.
- Non-destructive behavior: DI files remain byte-identical before and after analysis.
- Safety reports proving DSP/core files, preset tone values, and DI files are untouched.

## Safety Restrictions

- Do not implement Input Match or DI Calibration until explicitly approved later.
- Do not modify DSP/core sound.
- Do not modify tone behavior, gain staging, oversampling, saturation, tone stack, cab/IR behavior, preset tone values, or cab/IR behavior.
- Do not modify DI files.
- Do not normalize, rewrite, trim, denoise, or otherwise process source DI files in place.
- Do not tune presets automatically.
- Do not use competitor, artist, amp, plugin, model, product, or brand names in public-facing assets.
- Do not claim the feature makes Thallbyssal sound like any named product, amp, artist, or brand.
- Do not create checkout, licensing, DRM, telemetry, analytics, auth, cloud-sync, public release code, paid APIs, or external API integrations.

## Founder Approval Required Before Implementation

Before implementation, the founder must approve:

- The feature name: Input Match, DI Calibration, or another Thallbyssal-owned name.
- The first founder-owned DI WAV files to analyze.
- Measurement thresholds for too weak, too hot, clipped, noisy, and ready.
- Suggested target input gain range.
- Suggested gate starting-point behavior.
- Whether the first implementation is lab-only or also exposes any UI.
- Report wording that is clear, public-safe if reused later, and free of competitor-copying claims.
- Confirmation that no DI files, presets, DSP/core files, or tone behavior should be modified by the first version.
