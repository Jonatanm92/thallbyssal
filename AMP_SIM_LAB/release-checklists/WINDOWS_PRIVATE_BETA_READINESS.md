# Windows Private Beta Readiness

Purpose: decide whether a founder-approved Windows-only private beta of Thallbyssal can be shared with a small tester group.

This checklist is planning and readiness only. It does not build an installer, publish a package, add licensing or DRM, add telemetry or analytics, add auth, checkout, cloud sync, or change DSP/core sound, DI files, dependency versions, lockfiles, or preset tone values.

## Scope

- [ ] Target OS is Windows 10/11 only.
- [ ] Target formats are Windows VST3 and Windows standalone placeholders until build notes prove otherwise.
- [ ] Tester access is founder-approved and private only.
- [ ] Feedback is manual through founder-approved private channels.
- [ ] Build notes say this is beta software, not public release material, not a release candidate, and not a commercial availability claim.
- [ ] No public links, public changelog, public pricing, checkout, licensing, DRM, auth, telemetry, analytics, or cloud sync are included.
- [ ] No installer or uninstaller is built as part of this readiness pass.

## Required Inputs

- [ ] Exact commit hash and branch are recorded in private build notes.
- [ ] Artifact names and paths are recorded before any tester receives files.
- [ ] Windows VST3 path placeholder is recorded: `C:\Program Files\Common Files\VST3\Thallbyssal.vst3`.
- [ ] Standalone app path placeholder is recorded if a standalone build is supplied.
- [ ] Included docs list is recorded.
- [ ] Known risks are attached from `KNOWN_BETA_RISKS.md`.
- [ ] Install/uninstall test notes are attached from `INSTALL_UNINSTALL_TEST_PLAN.md`.
- [ ] DAW compatibility notes are attached from `DAW_COMPATIBILITY_TEST_PLAN.md`.

## Automated Readiness Commands

Run from the repo root before considering beta distribution:

```bash
npm run lab:all
npm test -- --run
npm run build
```

- [ ] `npm run lab:all` passes.
- [ ] `npm test -- --run` passes.
- [ ] `npm run build` passes.
- [ ] Generated lab reports are reviewed for blockers and warnings.
- [ ] Any warning accepted for private beta is listed in `KNOWN_BETA_RISKS.md`.

## Windows VST3 Readiness Placeholder

- [ ] VST3 bundle exists at the expected private build output path.
- [ ] VST3 scans in at least one primary DAW on Windows.
- [ ] VST3 can be inserted on a mono DI guitar track.
- [ ] VST3 passes audio after insert.
- [ ] VST3 bypass toggles without crash, runaway output, or stuck silence.
- [ ] VST3 can load each bundled beta preset.
- [ ] VST3 state survives save, close, reopen for a non-critical test session.
- [ ] VST3 can be removed from a track without crashing the DAW.
- [ ] Known VST3 manifest or scan-cache caveats are documented.

## Windows Standalone Readiness Placeholder

- [ ] Standalone app launches on Windows.
- [ ] Standalone app opens without missing-runtime errors.
- [ ] Audio device selection opens without crash.
- [ ] Input and output can be selected.
- [ ] Input monitoring works at conservative levels.
- [ ] Presets load in standalone mode.
- [ ] Standalone app exits cleanly and can be reopened.
- [ ] Any standalone limitations are listed in `KNOWN_BETA_RISKS.md`.

## Crash And Smoke Checklist

- [ ] Launch standalone five times in a row.
- [ ] Scan VST3 in the primary DAW twice, including after a DAW restart.
- [ ] Insert VST3 on an empty track.
- [ ] Insert VST3 on a copied dry DI track.
- [ ] Toggle bypass 20 times.
- [ ] Switch through all bundled beta presets.
- [ ] Adjust main input/output controls through safe ranges.
- [ ] Play 60 seconds of copied DI audio without crash, stuck silence, or runaway output.
- [ ] Render/bounce a short test clip inside the DAW.
- [ ] Close and reopen the DAW session.
- [ ] Remove the plugin from the session.

## Preset Load Checklist

- [ ] Every bundled beta preset loads in standalone mode.
- [ ] Every bundled beta preset loads in VST3 mode.
- [ ] Preset names and categories match the beta notes.
- [ ] Presets do not overwrite user files.
- [ ] Presets do not require missing external assets unless the beta notes explicitly include them.
- [ ] Switching presets during playback does not crash.
- [ ] Output stays within safe monitoring levels during preset changes.
- [ ] Any preset judged tone-unsafe by the founder is removed from the beta notes, not edited here.

## Real Render Demo Verification

- [ ] Use founder-owned or lab-owned DI material only.
- [ ] Do not overwrite original DI files.
- [ ] Run the current lab render/audition flow before beta shipment.
- [ ] Confirm generated render reports exist.
- [ ] Listen to at least one real rendered demo made from the beta candidate chain.
- [ ] Confirm rendered demo uses the intended preset and DI file.
- [ ] Confirm demo does not include copyrighted riffs, private sessions, proprietary IRs, client material, or tester data.
- [ ] Founder approves any demo clip shared with testers.

## Private Beta Only Criteria

- [ ] Tester list is small and founder-approved.
- [ ] Files are shared only through private founder-approved channels.
- [ ] All docs say private beta only.
- [ ] No public compatibility promises are made.
- [ ] No purchase, pricing, licensing, activation, account, telemetry, analytics, or cloud claims are made.
- [ ] Testers are told to use copied sessions and copied DI files only.
- [ ] Testers are told not to use the beta on critical production sessions without backups.
- [ ] Testers receive uninstall instructions before installing.

## What Blocks Beta

- [ ] Required automated command fails.
- [ ] VST3 cannot scan in the primary Windows DAW.
- [ ] Standalone cannot launch when standalone is included.
- [ ] Plugin crashes on insert, bypass, preset switch, render, save, reopen, or remove.
- [ ] Output produces unsafe noise bursts or runaway level during smoke testing.
- [ ] Presets fail to load or require missing files.
- [ ] Real render demo cannot be verified with approved DI and preset data.
- [ ] Known risks are not documented.
- [ ] Rollback/uninstall path is not documented.
- [ ] Any installer, public publishing, licensing, DRM, telemetry, analytics, auth, checkout, cloud sync, dependency, DSP/core, DI, lockfile, or preset tone change is required to make this pass.

## What Allows Beta

- [ ] All required automated commands pass.
- [ ] Install and uninstall test plan has at least one completed Windows pass.
- [ ] DAW compatibility test plan has at least one completed primary DAW pass.
- [ ] Crash/smoke checklist has no open blocker.
- [ ] Preset load checklist has no open blocker.
- [ ] Real render demo verification is complete.
- [ ] Known beta risks are accepted by the founder for private beta only.
- [ ] Rollback plan is ready and included with build notes.
- [ ] Founder explicitly approves the candidate for Windows-only private beta distribution.

## Rollback Plan

- [ ] Stop sharing the private beta link or remove tester access.
- [ ] Notify testers through the same private channel used for distribution.
- [ ] Ask testers to close all DAWs and standalone hosts.
- [ ] Ask testers to follow `INSTALL_UNINSTALL_TEST_PLAN.md` uninstall steps.
- [ ] Ask testers to rescan DAW plugins and confirm Thallbyssal beta is absent.
- [ ] Preserve the failing build notes, logs, screenshots, and manual feedback.
- [ ] Reproduce the blocker internally before another beta candidate is shared.
- [ ] Do not patch beta distribution with untracked binary swaps; create a new candidate with a new commit/build note.
