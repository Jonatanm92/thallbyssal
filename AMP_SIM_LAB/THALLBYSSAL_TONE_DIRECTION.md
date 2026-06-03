# Thallbyssal Tone Direction

Date: 2026-06-03
Status: founder-approved product direction, planning only

This document is internal planning guidance for Thallbyssal. It does not approve DSP/core changes, preset tone changes, DI edits, or public marketing claims.

## Founder-Approved Tone Words

- Heavy modern high-gain.
- Powerful high-end without harsh fizz.
- Thick low-mid weight.
- Tight low-tuned attack.
- Fast and controllable gate feel.
- Mix-ready rhythm presets.
- Strong chug response.
- Clear note separation for low tunings.
- Not thin.
- Not weak.
- Not overly fizzy.
- Immediate and fun to play.

## What Heavy And Powerful Means Technically

For future approved implementation and listening tests, heavy and powerful should be judged by measurable behavior and founder listening notes, not by copying another product.

- Low-tuned palm mutes should keep attack definition without becoming loose or cloudy.
- Low-mid energy should feel thick enough to support rhythm guitars in a mix without masking pick attack.
- High-frequency bite should reveal articulation while avoiding harsh fizz buildup.
- Gain should feel saturated and sustaining without collapsing note separation.
- Gate behavior should clamp noise quickly while preserving intentional pick transients and chug starts.
- Presets should sit close to mix-ready levels, EQ balance, and dynamics before extra post-processing.
- The amp response should feel immediate under the fingers, especially for tight rhythmic playing and stop-start riffing.

These are direction words for evaluation. They are not approval to change gain staging, tone stack, saturation, oversampling, cab/IR behavior, preset tone values, or DSP/core sound in this planning task.

## What To Avoid

- Thin rhythm tones that disappear against bass and drums.
- Weak palm mutes with poor low-tuned impact.
- Excessive fizz that makes the top end harsh or fatiguing.
- Muddy low mids that blur fast picking.
- Loose low end that makes chugs feel late or uncontrolled.
- Gates that chatter, pump unnaturally, or cut off intentional note tails too aggressively.
- Presets that require major corrective EQ before a basic demo can be judged.
- Any workflow that hides dry DI level problems instead of reporting them clearly.

## Public-Safe Positioning Language

Public-facing positioning may use language like:

- Thallbyssal is a modern low-tuned metal amp sim.
- Built for tight attack, fast gate control, and mix-ready rhythm tones.
- Designed around render-based QA and private beta listening workflows.
- Focused on strong chug response and clear note separation for heavy guitars.
- Includes an internal demo pipeline for founder-owned DI files and approved presets.

Public-facing positioning must avoid:

- Claims that Thallbyssal sounds like, models, clones, recreates, replaces, or improves on any named product, amp, artist, brand, album, song, cabinet, IR pack, or plugin.
- Preset names that reference artists, brands, albums, songs, product names, amp models, or trademark-like claims.
- UI labels, marketing copy, release notes, or demo names that borrow competitor language or imply endorsement.

## Forbidden Competitor-Copying Rules

- Do not copy competitor UI layout, control names, preset names, product names, artist branding, sound claims, algorithms, assets, or marketing phrasing.
- Do not use artist, brand, product, amp, model, cabinet, album, or song names in public-facing copy, UI labels, preset names, demo names, or release material.
- Internal competitor references, if ever needed, must stay inside private planning notes and must not become user-facing text.
- Tone goals must be expressed as Thallbyssal-owned behavior: tight, heavy, powerful, controlled, mix-ready, immediate, and low-tuned.
- Listening comparisons must be documented as internal evaluation notes only and must not become public claims.

## How Real Render Demos Judge Progress

Real render demos should become the main evidence loop for tone direction after the real render connection is approved and implemented.

- Use founder-owned DI WAV files only.
- Render the same DI files through approved local presets to produce real `processed.wav` outputs.
- Compare dry DI and processed output for attack, low-mid weight, fizz control, gate feel, chug response, and note separation.
- Generate metrics for peak level, RMS/loudness, clipping, and other render QA signals.
- Use baseline create/compare to catch technical regressions without claiming a target competitor sound.
- Record founder listening notes in private reports before promoting any preset toward private beta.
- Keep all tone judgment grounded in Thallbyssal direction, not in named-product matching.

## Current Restrictions

- Do not implement real render in this planning task.
- Do not implement Input Match or DI Calibration in this planning task.
- Do not modify DSP/core sound.
- Do not modify tone behavior, gain staging, oversampling, saturation, tone stack, cab/IR behavior, preset tone values, or cab/IR behavior.
- Do not modify DI files.
- Do not create checkout, licensing, DRM, telemetry, analytics, auth, cloud-sync, public release code, or paid/cloud API features.
