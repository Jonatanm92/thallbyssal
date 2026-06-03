# Install And Uninstall Test Plan

Purpose: verify the Windows private beta can be placed, found, removed, and rescanned without building an installer or touching unrelated user files.

This is a manual checklist for founder-approved private beta candidates only. It does not create an installer, uninstaller, updater, licensing system, telemetry, analytics, auth, checkout, cloud sync, dependency change, DSP/core change, DI change, lockfile change, or preset tone change.

## Test Matrix Placeholder

| Area | Minimum private beta check |
| --- | --- |
| OS | Windows 10/11 |
| VST3 | Manual copy to private build note path |
| Standalone | Manual launch from private build note path, only if supplied |
| DAW | Primary DAW first, additional DAWs later |
| User data | Copied test sessions and copied DI files only |

## Pre-Install Capture

- [ ] Record Windows version.
- [ ] Record DAW name and version.
- [ ] Record beta candidate commit hash.
- [ ] Record exact file names and hashes if available.
- [ ] Record intended VST3 destination path.
- [ ] Record intended standalone folder path if supplied.
- [ ] Confirm the DAW is closed.
- [ ] Confirm original DI files, sessions, presets, and IRs are backed up or copied before testing.
- [ ] Confirm the tester received uninstall instructions before installation.

## VST3 Install Checklist

- [ ] Copy only the beta VST3 bundle/file named in private build notes.
- [ ] Place it only in the build-note VST3 path.
- [ ] Do not delete, move, rename, or overwrite unrelated plugins.
- [ ] Reopen the DAW.
- [ ] Run a plugin rescan.
- [ ] Confirm Thallbyssal appears in the plugin list.
- [ ] Insert Thallbyssal on an empty track.
- [ ] Insert Thallbyssal on a copied dry DI track.
- [ ] Confirm audio passes at safe monitoring levels.
- [ ] Save a non-critical test session.
- [ ] Close and reopen the DAW.
- [ ] Confirm the plugin instance reloads.

## Standalone Install Checklist

- [ ] Use only the standalone folder supplied in private build notes.
- [ ] Launch the app without moving files into system folders.
- [ ] Confirm the app opens without missing-runtime errors.
- [ ] Select input and output devices.
- [ ] Confirm audio passes at safe monitoring levels.
- [ ] Load bundled beta presets.
- [ ] Close and reopen the standalone app.

## Uninstall Checklist

- [ ] Close every DAW and standalone host using Thallbyssal.
- [ ] Delete only the beta VST3 bundle/file from the path used during install.
- [ ] Delete only the standalone beta folder if one was supplied.
- [ ] Do not delete shared DAW folders, unrelated plugins, system folders, original DI files, IRs, presets, sessions, or user projects.
- [ ] Reopen the DAW.
- [ ] Run a plugin rescan.
- [ ] Confirm Thallbyssal beta no longer appears in the plugin list.
- [ ] Open the saved test session and confirm the missing plugin state is understandable and non-destructive.
- [ ] Record any leftover files or folders.

## Reinstall Checklist

- [ ] Repeat the VST3 install steps after uninstall.
- [ ] Confirm the plugin scans again.
- [ ] Confirm the plugin can be inserted and removed again.
- [ ] Confirm reinstall does not require deleting DAW cache unless documented as a known risk.

## Pass Criteria

- [ ] Install can be completed manually from private build notes.
- [ ] DAW scan finds the VST3.
- [ ] Standalone launches if supplied.
- [ ] Uninstall removes the beta from DAW plugin lists after rescan.
- [ ] No unrelated user files are modified or removed.
- [ ] Any DAW cache or rescan caveat is documented in `KNOWN_BETA_RISKS.md`.

## Blockers

- [ ] Manual copy requires overwriting unrelated plugins or system files.
- [ ] DAW cannot find the VST3 after rescan.
- [ ] Standalone cannot launch when standalone is included.
- [ ] Uninstall cannot remove the beta from DAW plugin lists.
- [ ] Uninstall risks deleting unrelated user files.
- [ ] Install/uninstall requires new installer, updater, licensing, DRM, telemetry, analytics, auth, checkout, cloud sync, dependency, DSP/core, DI, lockfile, or preset tone changes.
