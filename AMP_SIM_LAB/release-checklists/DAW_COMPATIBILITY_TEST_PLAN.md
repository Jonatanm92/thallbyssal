# DAW Compatibility Test Plan

Purpose: capture Windows DAW smoke coverage for a private beta candidate without making public compatibility promises.

This is not a support matrix, not a release claim, and not public launch material. Private beta compatibility means the candidate is usable enough for founder-approved testing on copied sessions.

## DAW Matrix Placeholder

| Priority | DAW | Windows version | Result | Notes |
| --- | --- | --- | --- | --- |
| Primary | REAPER | TBD | Not run | First private beta gate |
| Secondary | Ableton Live | TBD | Not run | Optional private coverage |
| Secondary | Cubase | TBD | Not run | Optional private coverage |
| Secondary | FL Studio | TBD | Not run | Optional private coverage |
| Secondary | Studio One | TBD | Not run | Optional private coverage |

Only the primary DAW is required to allow a tiny private beta. Secondary DAWs expand confidence but do not create public compatibility claims.

## Per-DAW Setup

- [ ] Record DAW name and version.
- [ ] Record Windows version.
- [ ] Record beta candidate commit hash and artifact name.
- [ ] Confirm test uses a copied session and copied DI files.
- [ ] Confirm monitoring level is low before first playback.
- [ ] Confirm VST3 scan/cache steps are recorded.

## Scan And Insert

- [ ] DAW scans the VST3 without crash.
- [ ] Plugin appears under the expected name.
- [ ] Plugin inserts on an empty audio track.
- [ ] Plugin inserts on a copied dry DI guitar track.
- [ ] Plugin UI opens.
- [ ] Plugin UI closes and reopens.
- [ ] Plugin can be removed from the track.

## Audio Smoke

- [ ] Dry copied DI plays before plugin insert.
- [ ] Processed audio passes after plugin insert.
- [ ] Bypass returns expected dry or bypassed signal.
- [ ] Output stays within safe monitoring levels.
- [ ] No stuck silence after bypass, preset switch, stop/start, or session reopen.
- [ ] No runaway output, noise burst, denormal freeze, or CPU spike that makes testing unsafe.

## Preset And State

- [ ] All bundled beta presets load.
- [ ] Preset switching during stopped playback works.
- [ ] Preset switching during playback does not crash.
- [ ] Session saves with the plugin inserted.
- [ ] Session reopens with plugin state restored.
- [ ] Automation lanes, if exposed by the DAW, do not crash when viewed.
- [ ] Removing automation or plugin instance does not crash.

## Render/Bounce

- [ ] Offline render or bounce completes for a short copied DI clip.
- [ ] Rendered file is audible.
- [ ] Rendered file uses the selected preset.
- [ ] Render does not overwrite original DI files.
- [ ] Rendered result is stored in a private internal folder.
- [ ] Any render mismatch is documented as a beta risk.

## Crash Notes

For every crash or scan failure, record:

- DAW name and version.
- Windows version.
- Plugin format.
- Exact action before failure.
- Whether restarting the DAW changed the result.
- Whether clearing/rescanning plugin cache changed the result.
- Whether the same candidate works in standalone or another DAW.
- Screenshot or log path if manually provided by the tester.

Do not request private sessions, client files, unreleased music, proprietary IRs, personal data, account IDs, license keys, telemetry dumps, analytics events, or automatic crash uploads.

## Pass Criteria

- [ ] Primary DAW scans the VST3.
- [ ] Primary DAW can insert, play, bypass, preset-switch, save, reopen, render, and remove the plugin.
- [ ] No crash, unsafe output, or destructive file behavior occurs in the primary DAW.
- [ ] Secondary DAW failures, if any, are documented as private beta risks.

## Blockers

- [ ] Primary DAW cannot scan the VST3.
- [ ] Primary DAW crashes on insert, UI open, playback, bypass, preset switch, save, reopen, render, or remove.
- [ ] Plugin creates unsafe output during normal smoke testing.
- [ ] Plugin modifies or overwrites original DI files or user sessions.
- [ ] DAW compatibility requires code, dependency, installer, licensing, telemetry, analytics, auth, checkout, cloud sync, DSP/core, DI, lockfile, or preset tone changes during this readiness pass.
