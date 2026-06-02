# Preset Validation Plan

Purpose: keep factory and beta presets technically safe while the founder owns the sound.

## Validation Rules

- All presets load.
- No required fields are missing, blank, or the wrong primitive type.
- No broken IR references.
- No output clipping above the allowed peak target.
- Loudness is within target range.
- Preset names are unique after trimming whitespace.
- Preset ids are unique and kebab-case.
- Preset categories are valid.
- CPU estimate is recorded.
- Preset recall works.
- Preset names do not use competitor product names, artist names, amp model names, or trademarked brands.
- Notes do not claim to model specific real amps unless permission and evidence exist.
- Metadata is warned for suspicious brand, artist, song, album, signature, official, clone, emulation, or sound-alike language.

## Required Categories

- `rhythm`
- `lead`
- `clean`
- `ambient`
- `fx`
- `bass`
- `utility`

## Validation Outputs

Each validation run should write:

```text
D:\CodexBuilds\thallbyssal-lab\reports\preset-validation.json
D:\CodexBuilds\thallbyssal-lab\reports\preset-validation.html
```

The JSON summary should include duplicate counts, invalid categories, file parse errors, presets with errors, presets with warnings, and suspicious claim warning counts. The HTML summary should escape preset metadata and show the same review counts.

## Current Status

Preset validator is active. No presets have been approved for release.
