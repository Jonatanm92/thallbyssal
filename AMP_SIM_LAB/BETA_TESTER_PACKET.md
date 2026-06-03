# Private Beta Tester Packet

## Private Beta Disclaimer

This packet is for founder-approved private beta testing only. This is beta software, not a public release, not a release candidate, and not a claim of commercial availability. There is no public release yet.

The plugin may crash, fail to scan in some DAWs, use more CPU than expected, lose settings between builds, or sound different between builds. Do not use it on important sessions without backups, and do not overwrite original DI files, sessions, IRs, presets, or user files during testing.

This beta does not include checkout, licensing, DRM, auth, telemetry, analytics, cloud sync, or automatic data collection. There is no automatic or hidden data collection. Feedback should be sent only through founder-approved private channels, and the founder will manually ask for any extra information later if it is needed. Do not include personal data, private sessions, unreleased music, client files, proprietary IRs, or other private assets in feedback unless you intentionally choose to share them.

Before a binary is shared with any tester, run:

```bash
npm run lab:all
npm run lab:beta-readiness:strict
```

The readiness report is written to:

```text
D:\CodexBuilds\thallbyssal-lab\reports\beta-readiness.html
```

## Installation Instructions Placeholder

Use these placeholder instructions only after the founder provides a private beta build, founder-approved private link, build-specific install path, and build notes. If the private build notes disagree with this packet, stop and ask the founder before installing.

1. Download the private beta package from the founder-approved private link.
2. Confirm the package includes this packet, the beta changelog, known issues, and feedback form.
3. Close your DAW before copying plugin files.
4. Copy the beta plugin file to the VST3 location specified in the build notes.
5. Keep a note of the exact folder used so the beta can be removed later.
6. Open your DAW and run a plugin rescan.
7. Insert the plugin on a copied dry DI guitar track in a non-critical test session.
8. Start with DAW/plugin output low, then raise level gradually.
9. If the plugin fails to scan or pass audio, stop and fill out the bug report template below.

Do not install this beta into a production-only machine or important active session without backups. Do not move, rename, normalize, render over, or delete original DI files while testing.

## Uninstall Instructions Placeholder

Use these placeholder instructions only for the beta build you installed. If a build-specific uninstall note is provided, follow that note and keep this packet as the safety checklist.

1. Close every DAW or standalone host using the plugin.
2. Delete only the beta plugin file from the VST3 folder used during installation.
3. Delete the standalone beta folder only if one was supplied with the beta package.
4. Reopen the DAW and run a plugin rescan.
5. Confirm the beta no longer appears in the DAW plugin list.
6. Keep your feedback notes, but remove any private audio/session files you do not want to retain.

Do not delete shared DAW folders, system folders, unrelated plugins, original DI files, IRs, presets, or user projects. If uninstall fails, send only the bug report details the founder manually asks for later.

## Supported OS/DAW Placeholder

Current private beta target matrix:

- OS: Windows 10/11 placeholder until tested build notes say otherwise.
- DAW: REAPER placeholder until tested build notes say otherwise.
- Plugin format: VST3 placeholder until tested build notes say otherwise.
- Additional OS/DAW/format coverage will be added only after private test results.

This packet does not claim support for any public release platform or DAW. There is no public release yet, and this matrix is not a compatibility promise.

## Known Issues

- UI is not final.
- Preset library is not final.
- Installer and uninstaller are placeholders until packaging is finalized.
- Supported OS/DAW list is a private beta placeholder, not a public compatibility claim.
- VST3 manifest handling is development-only until release packaging is finalized.
- No checkout, licensing, auth, telemetry, analytics, cloud sync, or DRM exists yet.
- Offline render automation is not connected for beta tester use.
- Some DAWs may require manual plugin rescans or cache clearing.
- CPU use, gain staging, and preset levels may change between private beta builds.
- Private beta feedback is manual only; the packet does not collect usage, crash, system, audio, session, or personal data automatically.

## DAW/OS Feedback Form

```text
Build version:
Test date:
OS name and version:
CPU:
RAM:
DAW name and version:
Plugin format tested:
Plugin path used:
Plugin scan result:
Standalone launch result, if provided:
Audio interface:
Sample rate:
Buffer size:
Project sample rate:
Mono/stereo track tested:
Did audio pass immediately:
Any crash, hang, scan error, or missing UI:
CPU behavior during normal playing:
Notes:
```

Do not include serial numbers, account IDs, license keys, personal contact details, private project names, or client/session data. Share only the details you choose to send, or details the founder manually asks for later.

## Tone Feedback Form

```text
Build version:
Preset tested:
Guitar type, pickups, and tuning:
DI level or input gain setting:
Playing style/riff type, using original material only:
What felt good:
What felt wrong:
Too much/too little low end:
Too much/too little high end/fizz:
Pick attack:
Gate behavior:
Sustain/chugs/palm mutes:
Output level/predictability:
Mono/stereo behavior:
Cab/IR comments, without naming proprietary IRs:
Would you use this in another private beta test:
Most important tone fix:
```

Do not compare the tone to specific brands, artists, albums, songs, or trademarked amp models in feedback intended for the packet.

## Bug Report Template

```text
Build version:
OS name and version:
DAW name and version:
Plugin format:
Audio interface:
Sample rate:
Buffer size:
Track type:
Preset, if relevant:
What happened:
Steps to reproduce:
Expected result:
Actual result:
How often it happens:
Did restarting DAW change it:
Any error text:
Screenshot/video attached, only if it contains no private data:
Workaround, if any:
```

Do not attach private sessions, client files, unreleased music, proprietary IRs, or personal data unless you intentionally choose to share them. The default bug report should be text-only.

## Quick Feedback Questions

- Did the plugin scan successfully?
- Did it pass audio immediately?
- What OS/DAW/version did you test?
- Which preset felt closest to usable?
- What was too bassy, too fizzy, too gated, or too quiet?
- Did input/output gain feel predictable?
- Did mono/stereo behavior make sense?
- Did CPU usage feel acceptable?
- Would you use this on a real riff today?

## Privacy

This beta should not collect telemetry, analytics, private audio, private sessions, usage data, crash data, system data, or personal data. No private data is collected beyond what the founder manually asks for later through private channels, and testers can choose not to send it.

## Public Claims Boundary

This packet must not be used as public launch material. There is no public release yet. It makes no public release claims, no compatibility guarantees, no exact modeled-amp claims, no artist/song claims, and no pricing, checkout, or licensing claims.
