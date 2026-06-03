# Private Beta Ship Checklist

Purpose: final founder-facing gate for a Windows-only private beta candidate.

This checklist is docs/readiness only. It does not build installers, publish releases, add licensing or DRM, add telemetry or analytics, add auth, checkout, cloud sync, change dependencies, modify DSP/core sound, modify DI files, modify package-lock, or change preset tone values.

## Candidate Identity

- [ ] Branch:
- [ ] Commit hash:
- [ ] Candidate date:
- [ ] Windows VST3 artifact path:
- [ ] Windows standalone artifact path, if supplied:
- [ ] Private distribution channel:
- [ ] Approved tester list:
- [ ] Founder approval note:

## Required Files

- [ ] `WINDOWS_PRIVATE_BETA_READINESS.md` reviewed.
- [ ] `INSTALL_UNINSTALL_TEST_PLAN.md` reviewed.
- [ ] `DAW_COMPATIBILITY_TEST_PLAN.md` reviewed.
- [ ] `KNOWN_BETA_RISKS.md` reviewed.
- [ ] Private beta packet/readme included.
- [ ] Known issues included.
- [ ] Feedback form included.
- [ ] Changelog or build notes included.
- [ ] Uninstall instructions included before install instructions.

## Verification Commands

Run from the repo root:

```bash
npm run lab:all
npm test -- --run
npm run build
```

- [ ] `npm run lab:all` passes.
- [ ] `npm test -- --run` passes.
- [ ] `npm run build` passes.
- [ ] Command outputs are saved or summarized in private build notes.

## Install And Uninstall Gate

- [ ] VST3 manual install path is documented.
- [ ] VST3 scans after manual install.
- [ ] Standalone launches if supplied.
- [ ] Manual uninstall removes the beta VST3 after DAW rescan.
- [ ] Reinstall after uninstall works.
- [ ] No unrelated plugins, DAW folders, sessions, presets, IRs, DI files, or system files are modified.

## DAW Compatibility Gate

- [ ] Primary DAW scans VST3.
- [ ] Primary DAW inserts plugin.
- [ ] Primary DAW plays copied DI audio.
- [ ] Primary DAW bypass works.
- [ ] Primary DAW loads bundled presets.
- [ ] Primary DAW saves and reopens a test session.
- [ ] Primary DAW renders or bounces a short copied DI clip.
- [ ] Primary DAW removes plugin without crash.
- [ ] Secondary DAW results, if any, are documented as risks.

## Crash And Smoke Gate

- [ ] Standalone launches repeatedly if supplied.
- [ ] VST3 scans repeatedly in the primary DAW.
- [ ] Plugin UI opens and closes.
- [ ] Playback runs for at least 60 seconds on a copied DI clip.
- [ ] Bypass toggles repeatedly.
- [ ] Preset switching during playback does not crash.
- [ ] Session save/reopen does not crash.
- [ ] Render/bounce does not crash.
- [ ] Remove plugin does not crash.
- [ ] Output never reaches unsafe level during normal smoke testing.

## Preset Load Gate

- [ ] Every bundled beta preset loads in VST3.
- [ ] Every bundled beta preset loads in standalone if supplied.
- [ ] Preset names and categories match beta notes.
- [ ] Preset switching does not require missing external files.
- [ ] Founder accepts beta preset tone for private feedback.
- [ ] No preset tone values are changed as part of this readiness task.

## Real Render Demo Gate

- [ ] Lab render/audition reports are generated.
- [ ] At least one real render demo is made from approved DI and preset data.
- [ ] Rendered demo is audible and uses the intended preset.
- [ ] Founder listens to and approves any demo shared with testers.
- [ ] Demo does not include copyrighted riffs, private sessions, proprietary IRs, client files, tester files, or personal data.

## Private Beta Only Gate

- [ ] Tester list is private and founder-approved.
- [ ] Distribution channel is private and founder-approved.
- [ ] Docs state beta software, private beta only, no public release yet.
- [ ] Docs make no public compatibility, pricing, checkout, licensing, modeled-amp, artist, or song claims.
- [ ] Docs state no telemetry, analytics, automatic crash upload, hidden data collection, auth, checkout, licensing, DRM, or cloud sync.
- [ ] Testers are warned to use copied sessions and copied DI files only.

## Rollback Gate

- [ ] Stop-distribution owner is named.
- [ ] Tester notification message is prepared.
- [ ] Uninstall instructions are ready.
- [ ] Failing build notes and feedback capture location are ready.
- [ ] New candidate process requires a new commit/build note, not an untracked file swap.

## What Blocks Beta

- [ ] Any required command fails.
- [ ] Any primary DAW scan/insert/playback/preset/save/reopen/render/remove blocker remains open.
- [ ] Install or uninstall is unclear or unsafe.
- [ ] Real render demo verification is incomplete.
- [ ] Known risks are not documented or founder has not accepted them.
- [ ] Candidate requires forbidden scope changes: installer build, publish step, licensing, DRM, telemetry, analytics, auth, checkout, cloud sync, dependency change, DSP/core change, DI change, lockfile change, or preset tone-value change.

## What Allows Beta

- [ ] Required commands pass.
- [ ] Install/uninstall gate passes.
- [ ] Primary DAW compatibility gate passes.
- [ ] Crash/smoke gate passes.
- [ ] Preset load gate passes.
- [ ] Real render demo gate passes.
- [ ] Known risks are documented and accepted by founder.
- [ ] Rollback path is ready.
- [ ] Founder approves Windows-only private beta shipment.
