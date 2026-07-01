# Playable Beta Smoke Test

Use this checklist before asking a tester to judge tone. It is for private/internal beta builds only.

Do not attach private sessions, client files, unreleased music, proprietary IRs, or personal data to smoke-test feedback unless you intentionally choose to share them.

## Build Identity

```text
Build version:
Branch/commit:
Standalone path:
VST3 path:
Test date:
Tester:
Audio interface:
Sample rate:
Buffer size:
DAW, if used:
```

## Launch And Scan

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| Standalone launches without crash |  |  |
| VST3 scans in the DAW |  |  |
| UI opens at normal plugin size |  |  |
| No missing asset/fallback warning is shown |  |  |
| Output is quiet before the first playing test |  |  |

If a fallback or missing asset warning appears, stop tone testing and report the exact warning text.

## Routing

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| Correct guitar input is selected |  |  |
| Mic/other interface inputs are not feeding the amp |  |  |
| Output channels are correct |  |  |
| Input meter reacts to guitar only |  |  |
| Output meter follows plugin output |  |  |

## First Sound

Start with the plugin and DAW output low, then raise level gradually.

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| Audio passes immediately |  |  |
| No constant clipping/splatter on hard hits |  |  |
| No constant squeal/noise with guitar muted |  |  |
| Gate opens on the first chug |  |  |
| Gate closes naturally after mute stops |  |  |

## Control Sanity

Do not judge final tone until these basics pass.

| Control | Expected behavior | Pass/Fail | Notes |
| --- | --- | --- | --- |
| Input | Changes input level predictably |  |  |
| Gate | 0 is open/off, middle is usable, high is tighter |  |  |
| Gain | More gain increases drive/saturation, not just volume |  |  |
| Low/Mid/High/Presence | Moves tone in the expected direction |  |  |
| Chug | Adds palm-mute focus/impact without breaking pick attack |  |  |
| Master | Changes amp feel/level predictably |  |  |
| Output | Final loudness only |  |  |
| Presets | Change the active controls and stay selected |  |  |
| Reset Tone | Restores the intended baseline/default |  |  |

## Short Playtest

Use original riffs only.

1. Muted noise floor: stop playing for 5 seconds.
2. Hard single chugs.
3. Fast palm-muted rhythm.
4. Open power chords.
5. Sustained single notes.
6. Preset switching at low output level.

Record only text notes by default:

```text
Best preset:
Worst preset:
Too quiet / too loud:
Too bright / too dark:
Too much / too little low end:
Gate too weak / too tight:
Hard-hit clipping:
UI/routing confusion:
Would you keep testing this build:
One blocker before sending to another tester:
```

## Stop Conditions

Stop and report before tone judging if:

- The plugin shows a fallback or missing asset warning.
- The wrong input or microphone input feeds the amp.
- Hard hits clip or splatter constantly at normal output.
- The gate does not open on normal playing.
- Presets silently reset or do not stay selected.
- The UI is unreadable or controls are off-screen.
