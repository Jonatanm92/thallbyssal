# Known Beta Risks

Purpose: list risks that can be accepted only for founder-approved Windows private beta testing.

This document does not approve public release. It does not add installer work, publishing, licensing, DRM, telemetry, analytics, auth, checkout, cloud sync, dependencies, DSP/core sound changes, DI changes, lockfile changes, or preset tone changes.

## Current Known Risks

- UI is temporary and not final commercial design.
- Factory presets are internal beta candidates and are not public-release approved.
- Installer and uninstaller are placeholders; private beta uses manual copy/remove steps only.
- Supported OS/DAW list is a private beta placeholder, not a compatibility promise.
- Windows VST3 and standalone readiness are placeholders until manually verified for the exact candidate.
- VST3 manifest handling may require intentional release packaging later.
- Some DAWs may require manual plugin rescans or cache clearing.
- DAW coverage is incomplete until each DAW is tested on Windows.
- Offline render and DAW render behavior may differ and must be checked before sharing demos.
- CPU use, scan behavior, gain staging, and preset output levels may change between private beta builds.
- Preset names and categories may change before any public-facing release.
- Beta builds may crash, fail to scan, fail to load presets, fail to restore state, or render differently between hosts.
- Testers must use copied sessions and copied DI files only.
- Feedback is manual only through founder-approved private channels.
- No automatic crash, usage, system, audio, session, or personal data collection is included.

## Risks Acceptable For Private Beta Only

- [ ] UI polish gaps that do not block basic testing.
- [ ] Secondary DAW scan failures when the primary DAW passes and the failure is documented.
- [ ] Manual install/uninstall steps when they are clear and reversible.
- [ ] Non-critical standalone limitations when VST3 testing is the candidate focus.
- [ ] Known render differences that do not create unsafe output and are documented.
- [ ] Tone concerns explicitly accepted by the founder for private feedback.

## Risks That Block Beta

- [ ] Required verification command fails.
- [ ] Primary Windows DAW cannot scan the VST3.
- [ ] Standalone cannot launch when standalone is included and required for the candidate.
- [ ] Plugin crashes during basic insert, playback, bypass, preset switch, render, save, reopen, or remove.
- [ ] Plugin produces unsafe output during normal smoke testing.
- [ ] Presets fail to load in VST3 and standalone checks.
- [ ] Real render demo cannot be verified from approved DI and preset data.
- [ ] Manual uninstall cannot remove the beta from the DAW plugin list after rescan.
- [ ] The candidate requires public publishing, installer creation, licensing, DRM, telemetry, analytics, auth, checkout, cloud sync, dependency changes, DSP/core changes, DI changes, lockfile changes, or preset tone changes to be considered ready.

## Risk Log Template

| Date | Candidate | Area | Risk | Severity | Accepted for private beta | Owner note |
| --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | No | TBD |

Severity guide:

- `Blocker`: must be fixed before private beta.
- `High`: founder must explicitly accept before private beta.
- `Medium`: include in tester notes.
- `Low`: track internally.

## Tester Communication Notes

- [ ] Tell testers this is beta software and may crash or fail to scan.
- [ ] Tell testers to use copied sessions and copied DI files only.
- [ ] Tell testers not to use the beta on critical production sessions without backups.
- [ ] Tell testers private feedback is manual and optional.
- [ ] Tell testers not to send private sessions, client files, unreleased music, proprietary IRs, personal data, account IDs, or license keys unless they intentionally choose to share them.
- [ ] Tell testers how to uninstall before they install.
