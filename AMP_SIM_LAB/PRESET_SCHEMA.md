# Preset Schema

AMP_SIM_LAB presets are validation metadata for the product. They do not replace founder-approved tone design.

## Required Fields

```json
{
  "preset_id": "unique-kebab-case-id",
  "name": "Display Name",
  "category": "rhythm",
  "gain_level": "high",
  "genre_tags": ["thall", "djent", "modern-metal"],
  "pickup_recommendation": "humbucker",
  "input_gain": 0,
  "output_gain": -5,
  "amp_section_settings": {},
  "cab_or_ir_reference": "factory-cab",
  "effects_settings": {},
  "cpu_cost_estimate": "unknown",
  "loudness_target": {
    "peak_dbfs_max": -1,
    "rms_dbfs_range": [-24, -10]
  },
  "author": "Founder",
  "version": "0.1.0",
  "notes": "Internal validation preset."
}
```

## Field Definitions

- `preset_id`: stable non-empty kebab-case id used by automation. Must be unique across all preset files.
- `name`: non-empty user-visible preset name. Must be original and unique after trimming whitespace.
- `category`: one of `rhythm`, `lead`, `clean`, `ambient`, `fx`, `bass`, `utility`.
- `gain_level`: one of `clean`, `crunch`, `mid`, `high`, `extreme`.
- `genre_tags`: at least one non-empty descriptive tag. Do not use brand, artist, song, album, or trademark-like claims.
- `pickup_recommendation`: non-empty suggested pickup/input type.
- `input_gain`: finite dB input trim.
- `output_gain`: finite dB output trim.
- `amp_section_settings`: amp controls and values.
- `cab_or_ir_reference`: non-empty factory cab id or allowed IR reference. No unlicensed IRs.
- `effects_settings`: pedal/FX controls and values.
- `cpu_cost_estimate`: `low`, `medium`, `high`, or `unknown`.
- `loudness_target`: technical target range for validation.
- `author`: non-empty preset author.
- `version`: non-empty preset version.
- `notes`: non-empty internal notes.

## Validation Reporting

The preset validator writes JSON and HTML summaries with:

- file parse error count
- preset error and warning counts
- duplicate preset id and duplicate preset name counts
- invalid category list
- suspicious claim warning count

Suspicious claim warnings are generic metadata warnings for wording such as brand, artist, song, album, signature, official, clone, emulation, or sound-alike claims. They are report-only warnings so the founder can review language without agents tuning or renaming approved presets.
