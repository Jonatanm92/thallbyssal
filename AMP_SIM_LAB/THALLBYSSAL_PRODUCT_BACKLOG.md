# Thallbyssal Product Backlog

Internal roadmap for turning Thallbyssal into a usable standalone/VST3 guitar amp sim and practical writing lab.

## Now

Goal: prove the core product is worth testing by making the default experience sound strong without extra setup.

- Strong default high-gain tone for low-tuned modern metal: tight lows, clear pick attack, aggressive midrange, controlled fizz, and usable sustain.
- Standalone app and VST3 build targets as the primary delivery formats.
- ASIO/native audio support for low-latency tracking in the standalone app.
- Input/output controls with practical metering, clipping visibility, and level matching.
- Mono/stereo handling that works for DI input, stereo FX returns, and DAW plugin use.
- Noise gate, boost, drive, and DI-EQ pedal blocks focused on shaping the signal before the amp.
- Cab/IR mixer basics: load/select IRs, blend mics/cabs, control phase/level, and save working defaults.
- Beta validation plan: test with real DI guitarists, standalone users, VST3 users, and low-tuned metal workflows.

## Next

Goal: expand the product from a good amp tone into a fast creative tool.

- Tuner with clear tracking, mute option, and stable behavior for low tunings.
- Transpose and low-octave tools for riff writing, demoing alternate tunings, and heavy layered parts.
- Clean and ambient FX path for intros, breaks, transitions, and contrast sections.
- Preset organization for core use cases: tight rhythm, lead, clean, ambient, DI utility, and bass-friendly experiments.
- Songwriting lab workspace for capturing riffs, comparing tones, storing notes, and building quick song sections.
- Backing track creator for simple practice/demo contexts without leaving the tool.

## Later

Goal: support fuller demo production once the core guitar product is validated.

- MIDI bass groove generation or import workflow for quick low-end arrangement sketches.
- MIDI drum groove generation or import workflow for writing against realistic rhythmic contexts.
- Expanded cab/IR library management with tagging, favorites, and session-safe recall.
- More advanced routing for parallel clean/dirty paths and stereo widening after the amp.
- Export helpers for demo clips, beta feedback renders, and preset comparison files.

## Explicitly Not Yet

These are intentionally out of scope until the core tone, tracking feel, and VST3/standalone reliability are validated.

- Public launch, paid checkout, licensing, DRM, telemetry, or cloud accounts.
- Claims that Thallbyssal copies, models, clones, profiles, or recreates any named commercial amp, cab, pedal, artist, song, album, or producer sound.
- Use of third-party trademarks in presets, marketing, UI labels, file names, or public comparison copy without legal review.
- Copyrighted riffs, backing tracks, IRs, samples, MIDI grooves, or artist-identifying demo material unless rights are clearly owned or licensed.
- DAW-specific promises beyond tested hosts and versions.
- Large feature expansion that delays validating the default high-gain tone and reliable standalone/VST3 audio path.

## Beta Validation Questions

- Does the default preset make a tester want to keep playing before touching controls?
- Can testers track with acceptable latency using ASIO/native audio?
- Does the VST3 scan, load, automate, and recall settings reliably in common DAWs?
- Are input/output, mono/stereo, and gain staging obvious enough for non-technical players?
- Do gate/boost/drive/DI-EQ/cab controls solve real tone problems without overwhelming the user?
- Do testers ask for more tones and workflow depth after approving the core sound?
