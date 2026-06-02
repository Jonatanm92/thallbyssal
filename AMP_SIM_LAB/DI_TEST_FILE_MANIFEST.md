# DI Test File Manifest

Only founder-owned or explicitly licensed DI files are allowed here.

Do not generate copyrighted music. Do not download samples. Do not use copyrighted riffs, stems, commercial IRs, or audio from released songs.

Place WAV files in:

```text
D:\CodexBuilds\thallbyssal-lab\di-test-files
```

The repo still contains `AMP_SIM_LAB/di-test-files/` as a tiny placeholder for structure only. Keep real WAV files on D: by default, or override with `AMP_SIM_LAB_DI_DIR`.

Run:

```bash
npm run lab:metrics
npm run lab:di
```

The validator accepts obvious aliases, but canonical filenames are preferred for repeatable automation.

## Required Founder-Owned DI Files

| File | Status | Purpose | Notes |
| --- | --- | --- | --- |
| `clean_single_coils.wav` | Missing | Clean transient and lower-output pickup test | Founder-owned only |
| `humbucker_palm_mutes.wav` | Missing | Gate, grinder, low-end tightness | Founder-owned only |
| `low_tuned_chugs.wav` | Ready via `LOW TUNED CHUGS.wav` | Drop tuning clarity and palm mute weight | Peak -5.63 dBFS, 0 clipped samples |
| `lead_sustain.wav` | Missing | Sustain, noise, and lead response | Founder-owned only |
| `dynamic_pick_attack.wav` | Ready via `PICK ATTACK.wav` | DI Sculpt and pick transient test | Usable; canonical mono filename preferred later |
| `bass_di.wav` | Missing | Bass guide/future bass engine testing | Founder-owned only |
| `noise_floor_test.wav` | Ready via `noise.wav` | Gate threshold and hiss behavior | Very clean noise floor; canonical mono filename preferred later |
| `sine_sweep.wav` | Missing | Technical response measurement | Generated test tone is allowed if it contains no music |

## Acceptance Rules

- WAV format preferred.
- Name files exactly as listed above for automated tests.
- Record dry DI with no amp sim printed.
- Include tuning, pickup, guitar, interface, and gain notes in this manifest when files are added.
