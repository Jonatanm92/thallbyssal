# Tone Gap Next Experiment Recommendation

Status: internal recommendation summary only.

## Recommendation

Because Thallbyssal is already louder and has more low-mid than the reference average, the first tone experiments should prioritize:

1. Transient/palm-mute punch.
2. High-balance / presence / bite.
3. Saturation density shape.

Do not start with simple output volume boosts or low-mid boosts.

## Why

The landed comparison shows:

- Thallbyssal loudness is above the reference average by `+12.33 dB` RMS/LUFS estimate.
- Thallbyssal low-mid energy is above the reference average by `+13.8 dB`.
- Thallbyssal crest factor is below the reference average by `-7.88 dB`.
- Thallbyssal high-to-low-mid balance is below the reference average by `-6.8 dB`.

The founder-heard weaker/thinner impression therefore is not explained by raw output level or missing low-mid level. The likely gap is more about how the sound moves and reads at matched level: flatter transient/punch, darker high-to-low-mid balance, lower crest factor, less perceived attack/bite, and saturation density shape.

## Experiment Order

| Priority | Sprint | Listening hypothesis | Avoid |
| --- | --- | --- | --- |
| 1 | Attack/punch sprint | Palm mutes need sharper transient contour, tighter impact, or less flattened front edge. | Broad output gain or low-mid gain. |
| 2 | High-balance/presence/bite sprint | Matched-level aggression may need more pick edge, presence, or bite without uncontrolled fizz. | Brightness changes that only add fizz. |
| 3 | Saturation/density sprint | Density may need reshaping so saturation feels heavy and alive instead of compressed or smeared. | More gain without checking punch and articulation. |

## Conditional Fourth Sprint

Run a cab/IR voicing sprint only if founder listening says the main issue is darker voicing or missing pick-edge definition after level matching. Do not treat cab/IR work as already approved by this recommendation.

## Required Founder Decision

Before changing tone, the founder should complete `AMP_SIM_LAB/TONE_GAP_FOUNDER_DECISION_SHEET.md` and select one primary option:

- Attack/punch sprint
- High-balance/presence/bite sprint
- Saturation/density sprint
- Cab/IR voicing sprint
- Reject current voicing
- Needs more reference renders

## Non-Goals

- No DSP/core changes in this recommendation.
- No preset changes in this recommendation.
- No DI edits.
- No audio commits.
- No level-matched audio commits.
- No public claims or competitor/plugin claims.
