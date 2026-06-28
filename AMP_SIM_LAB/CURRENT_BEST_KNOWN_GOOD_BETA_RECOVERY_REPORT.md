# Current Best Known-Good Beta Recovery Report

Generated: 2026-06-28

## Scope

This report records the current blocker for direct Current Best source parity comparison.

It does not change DSP, product defaults, Golden Reference A, NAM/IR assets, audio files, renders, or beta installation.

## Tooling Added

Added a local-only recovery verifier:

- `npm run lab:known-good-beta:recovery`

The verifier reads historical `current-best-audio-lock-compare.json` reports, extracts the required Current Best baseline WAV filenames, expected byte sizes, and expected SHA256 hashes, then checks whether those WAVs still exist locally.

## Current Result

Generated local reports:

- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-known-good-beta-recovery.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-known-good-beta-recovery.md`

Status: `blocked-missing-known-good-beta-renders`

Latest usable historical audio-lock report:

- `D:\CodexBuilds\thallbyssal-lab\reports\current-best-audio-lock\20260624T125209Z\current-best-audio-lock-compare.json`

Historical baseline directory:

- `D:\CodexBuilds\thallbyssal-lab\renders\current-best-preset-bank\20260624T120444Z\wav`

Required baseline files currently missing:

| File | Expected bytes | Expected SHA256 |
| --- | ---: | --- |
| `p01-current-best-baseline__di-boostalizer.wav` | `1587704` | `65b719131e5c4f70aaf4d090163605adc4025f49e6725c97f92ca5bdfa260a62` |
| `p01-current-best-baseline__low-tuned-chugs.wav` | `3456104` | `ad5e8d711852aff1c36f21e8952bb546f61ea696b9d4a4131434fa5dba9bd4fb` |
| `p01-current-best-baseline__noise.wav` | `3456104` | `8000fc0d46304de8cb0a029de449675b0139c8e76171478c987d1b457fca3b0d` |
| `p01-current-best-baseline__pick-attack.wav` | `3456104` | `487ce39670be3f98058825aa875b690e24d637e38626222852a8a694a3479312` |

## Interpretation

- The exact known-good beta render evidence is not currently available as WAV files.
- The historical audio-lock report preserves enough filename, byte-size, and SHA256 evidence to verify the correct files if they are restored.
- Direct source parity is still blocked until those WAVs are restored or regenerated from the exact approved known-good beta.
- The A2 v1 polish probe may be closer by estimate, but it cannot be approved as parity from estimated deltas.

## Next Safe Task

Restore these exact WAVs if they exist in an old cache, backup, or artifact folder. If they cannot be restored, regenerate them from the exact approved known-good beta build and verify that all four files match the expected hashes or record a new approved baseline with explicit owner approval.
