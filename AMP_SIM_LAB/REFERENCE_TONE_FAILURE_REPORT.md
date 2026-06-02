# Reference Tone Failure Report

Status: internal lab note only.

## What Failed

The first generated reference candidates were rejected by the founder as dead, weak, and not close to the desired brutal tone.

Rejected candidates:

- `reference-tight-dark`
- `reference-precision-response`
- `reference-heavy-weight`

These candidates should not be used as tone direction.

## Current Target

The best target references are the founder-provided clips, screenshots, DI references, and private preset/reference material. These are reference-only until the founder explicitly approves any specific asset for product use.

## Root Cause Found

The earlier candidates used lab preset JSON fields such as `cab_or_ir_reference`, but the current native offline renderer only loads an actual IR through the native preset shape at `audio.cabIrFileName`.

That means the rejected candidates could miss the intended IR path and fall back to the simple internal cab filter. This likely contributed to the dead/incorrect tone.

## Safe Next Direction

Use `npm run lab:ir:audition` to create a private audition pack that:

- recursively scans `D:\CodexBuilds\thallbyssal-lab\founder-assets\irs`
- prioritizes `Palmer`, `Mellow`, `Extra intressanta`, and Vildhjarta-like IR names
- renders only audio-format IR files for now (`.wav`, `.aif`, `.aiff`, `.flac`); device `.ir` files remain reference-only until a safe loader path exists
- creates native audition presets using `audio.cabIrFileName`
- renders browser-safe private listening files
- does not edit DSP, presets, original IR files, or original DI files

## Boundaries

- No DSP/core sound changes were approved by this report.
- No trademark or exact-model claims are made.
- No copied commercial presets, riffs, samples, or IRs are approved for public product bundling.
- Tone decisions remain founder-owned.
