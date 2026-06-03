# Thallbyssal Private Beta Listening Page Template

Use this as an internal/private beta review page for founder-approved Thallbyssal clips only. This is not a public launch page, not release copy, not a release candidate, and not a claim of commercial availability. There is no public release yet.

Do not redistribute this page, its links, notes, clips, screenshots, or rendered audio. Share it only with founder-approved private beta listeners through private channels.

This page must not include analytics, telemetry, external forms, checkout, auth, licensing, DRM, cloud sync, or automatic data collection. Feedback is manual only, and testers choose what to send.

## Clip Metadata

```text
Clip title:
DI type:
Preset:
Build/version:
Render date:
Render status: founder-approved / needs founder review
```

## Real Render Clip

Add one founder-approved private/local render link here. Do not commit audio files to the repository.

```text
Real render clip placeholder:
Example local/private path or URL:
```

If using HTML later, keep the audio player local/private:

```html
<audio controls preload="none" src="./PRIVATE_LOCAL_RENDER_CLIP_PLACEHOLDER.wav"></audio>
```

## Private Beta Disclaimer

This clip is for private listening review only. It may change, be replaced, or be removed before any future public decision. Do not describe it as launched, release-ready, commercially available, or final.

Do not include competitor names, artist names, song names, album names, trademarked amp model names, proprietary IR names, unreleased music, private sessions, client files, account IDs, license keys, or personal data in feedback intended for this page.

## Tone Feedback

Use `BETA_FEEDBACK_QUESTIONS.md` for the full private listening question set. Minimum tone notes:

- Does it feel heavy enough?
- Is the attack tight or sluggish?
- Is the high end powerful or too fizzy?
- Is the low end controlled or muddy?
- Which clip/preset is strongest?
- Which clip/preset is weakest?
- Would you use this in a real riff/mix?

## OS/DAW Feedback

Use `BETA_LISTENING_INSTRUCTIONS.md` before listening, then record only manually chosen notes:

```text
OS name and version:
DAW name and version:
Plugin format or render source:
Audio interface/headphones/monitors, optional:
Sample rate, optional:
Buffer size, optional:
Playback issues:
Any crash, hang, missing audio, or obvious artifact:
```

Do not collect this automatically. Do not ask testers to send serial numbers, account IDs, private project names, client/session data, or personal contact details.

## Bug Report Link

Use the private text-only template in `FEEDBACK_FORM.md#bug-report-template` or paste this short version into a private channel:

```text
Clip title:
DI type:
Preset:
Build/version:
OS/DAW:
What happened:
Steps to reproduce:
Expected result:
Actual result:
How often it happens:
Any error text:
Screenshot/video attached, only if it contains no private data:
```

## Boundary Check Before Sharing

- [ ] Founder approved this clip for private beta listening.
- [ ] The render link is private/local and not committed audio.
- [ ] The page says private beta and do not redistribute.
- [ ] No public release claims were added.
- [ ] No analytics, telemetry, external forms, auth, checkout, licensing, DRM, or cloud sync were added.
- [ ] No DSP/core sound, DI files, or preset tone values were changed for this page.
