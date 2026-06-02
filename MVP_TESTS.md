# MVP Tests

Use these checks after running the app locally with:

```bash
npm install
npm run dev
```

## Automated Checks

Run:

```bash
npm test
npm run build
```

Both commands should finish without failures.

## Guitar Routing Cover Smoke Test

1. Open the local Vite URL, usually `http://127.0.0.1:5173/`.
2. Select the `Cover Templates` workflow tab.
3. Select `Guitar Routing Cover` from the Preset field.
4. Confirm the track order is:
   - `GUITAR BUS`
   - `GUITAR AMP L`
   - `GUITAR AMP R`
   - `LEAD GUITAR`
   - `CLEAN / AMBIENT GUITAR`
   - `BACKING BUS`
   - `BACKING TRACK`
5. Confirm REAPER Session Check shows passing routing and Lua readiness.
6. Confirm the Lua output contains sends from the guitar tracks to `GUITAR BUS` and from `BACKING TRACK` to `BACKING BUS`.

## One-Take Video Cover Smoke Test

1. Select the `Cover Templates` workflow tab.
2. Select `One-Take Video Cover` from the Preset field.
3. Confirm the track order is:
   - `VIDEO REFERENCE`
   - `CAMERA AUDIO SYNC`
   - `STEREO OUTPUT / SONGSTERR PRINT`
   - `GUITAR LIVE PRINT`
   - `EXTRA GUITAR LAYER`
   - `FX / IMPACTS`
   - `FINAL MASTER PRINT`
   - `SHORTS EXPORT PRINT`
   - `FULL VIDEO EXPORT PRINT`
4. Enter real project metadata in the form, for example:
   - Song: `Demo Song`
   - Artist: `Demo Artist`
   - Tuning: `Drop E`
   - Tempo: `145`
5. Confirm the JSON panel includes `presetId`, `songName`, `artist`, `tuning`, `sourceWorkflow`, `sourceFormat`, `sourceNotes`, `reminders`, and `markers`.
6. In the Tracks section, confirm `CAMERA AUDIO SYNC` has `Master` unchecked and `FINAL MASTER PRINT` has `Master` checked.
7. In the Markers section, rename `BEST RIFF` and confirm the JSON and Lua panels update with the new marker name.
8. Add a marker, set its time in seconds, then remove it again.
9. Confirm the Lua panel includes:
   - `-- Source format: one-take camera + stereo output`
   - `-- Source workflow: cover-template`
   - `-- Reminder: mute camera audio after sync`
   - `-- Reminder: export 16:9 full video and 9:16 Shorts version`
   - `reaper.GetSetProjectNotes(0, true, projectNotes)`
   - `reaper.SetMediaTrackInfo_Value(trackMap["camera-audio-sync"], "B_MAINSEND", 0)`
10. Confirm the Lua creates sends to `FINAL MASTER PRINT` from:
   - `STEREO OUTPUT / SONGSTERR PRINT`
   - `GUITAR LIVE PRINT`
   - `EXTRA GUITAR LAYER`
   - `FX / IMPACTS`
11. Confirm the Lua includes markers for:
   - `START`
   - `BEST RIFF`
   - `BREAKDOWN`
   - `CHORUS / BIG PART`
   - `SHORTS CLIP 1 START`
   - `SHORTS CLIP 1 END`
   - `FULL VIDEO START`
   - `FULL VIDEO END`
12. Save Lua and confirm a `.lua` file appears in the local `exports/` folder.

## Backing Track Creator Smoke Test

1. Select the `Backing Track Creator` workflow tab.
2. Confirm the track order is:
   - `ORIGINAL REFERENCE`
   - `CAMERA / PHONE SYNC AUDIO`
   - `BACKING TRACK MAIN`
   - `BACKING TRACK NO GUITAR`
   - `DRUMS / PERCUSSION STEM`
   - `BASS STEM`
   - `VOCALS / LEAD STEM`
   - `SYNTHS / EXTRA STEMS`
   - `CLICK / COUNT-IN`
   - `BACKING BUS`
   - `GUITAR PRACTICE BUS`
   - `FINAL BACKING PRINT`
3. Enter real project metadata, for example:
   - Song: `Demo Backing Song`
   - Artist: `Demo Artist`
   - Tuning: `Drop A#`
   - Tempo: `178`
4. Set Source Workflow to `No-guitar track`, `Separate stems`, or `Full-mix reference` depending on the material you already have.
5. Enter Source Notes, for example `Local no-guitar WAV plus album jam-track folder`.
6. In the Sources section, confirm there is one clear `Import one song file` control.
7. Confirm the simple flow shows `Remove instruments` and `All stems`.
8. In `Remove instruments`, check/uncheck instruments to remove and confirm the JSON/Lua notes update.
9. Select `All stems` and confirm the app shows a stem-layout message.
10. Open `Show advanced editor` only when needed and confirm detailed source-slot checkboxes appear there.
11. Confirm the output mode choices are visible: `Both`, `Final audio file`, and `REAPER import`.
12. Select `Final audio file`, then select `Both`, and confirm the JSON panel updates `outputMode`.
13. Import a small supported media file, or type a local path such as `C:\Audio\test-no-guitar.wav` in Advanced source mapping.
14. Confirm the uploaded file appears under `imports/` and displays an audio/video preview control when the file is inside the local `imports/` folder.
15. Upload multiple supported files named like `demo no guitar.wav`, `demo drums.wav`, and `demo bass.wav` in advanced mode.
16. Confirm upload fills the matching source slots and checks matching include boxes.
17. Add a reference URL such as `https://www.songsterr.com/example` in Advanced source mapping.
18. Confirm REAPER Session Check shows passing track order, bus names, source imports, routing, master send, Lua readiness, and export package readiness.
19. Confirm the JSON panel includes:
   - `presetId: "backing-track-creator"`
   - `sourceWorkflow`
   - `sourceFormat: "local backing/jam tracks, stems, or legal instrumental sources"`
   - `sourceNotes`
   - `outputMode`
   - `sourceAssets`
   - reminders about using permitted audio and exporting `FINAL BACKING PRINT`
   - section and practice-loop markers
20. Confirm `ORIGINAL REFERENCE`, `CAMERA / PHONE SYNC AUDIO`, and `GUITAR PRACTICE BUS` have `Master` unchecked.
21. Confirm `FINAL BACKING PRINT` has `Master` checked.
22. Confirm the Lua panel includes:
   - `-- Template: Backing Track Creator`
   - `-- Source workflow:`
   - `-- Output mode:`
   - `-- Source notes: Local no-guitar WAV plus album jam-track folder`
   - `-- Source asset:`
   - `-- Source link reference:`
   - `-- Import source media onto BACKING TRACK NO GUITAR at project start.`
   - `reaper.SetEditCurPos(0, false, false)`
   - `reaper.InsertMedia`
   - `-- Reminder: use audio you own or have permission to use`
   - `-- Reminder: export FINAL BACKING PRINT as the no-guitar practice track`
   - `reaper.GetSetProjectNotes(0, true, projectNotes)`
23. With output mode `Both` or `Final audio file`, confirm the Lua includes:
    - `-- Render setup: final backing track file`
    - `RENDER_FILE`
    - `RENDER_PATTERN`
    - `RENDER_BOUNDSFLAG`
24. With output mode `REAPER import`, confirm the render setup lines are not included.
25. Confirm the Lua creates sends to `BACKING BUS` from:
   - `BACKING TRACK MAIN`
   - `BACKING TRACK NO GUITAR`
   - `DRUMS / PERCUSSION STEM`
   - `BASS STEM`
   - `VOCALS / LEAD STEM`
   - `SYNTHS / EXTRA STEMS`
26. Confirm the Lua creates:
    - `CLICK / COUNT-IN` to `GUITAR PRACTICE BUS`
    - `BACKING BUS` to `FINAL BACKING PRINT`
27. Confirm the Lua includes markers for:
    - `START`
    - `INTRO`
    - `VERSE`
    - `CHORUS`
    - `BREAKDOWN`
    - `SOLO SECTION`
    - `LOOP PRACTICE START`
    - `LOOP PRACTICE END`
    - `FINAL PRINT START`
    - `FINAL PRINT END`
28. Click `Create Backing Track`.
29. Confirm a folder appears under `exports/` for the template.
30. Confirm that folder contains:
    - `.lua` REAPER script
    - `run-workflow.lua`
    - `.json` template
    - `source-manifest.md`
    - `README-REAPER-STEPS.md`
    - `sources.json`
    - `plugin-manifest.json`
31. Confirm the app shows an `Export ready` panel with the export folder and generated files.
32. Open `source-manifest.md` and confirm it lists imported local files, reference links, target tracks, and output mode.
33. Open `README-REAPER-STEPS.md` and confirm it explains how to load the Lua script in REAPER and render a file when output mode uses audio file output.
34. Open `sources.json` and confirm it contains source labels, file paths, reference links, target track names, and output mode.
35. Open `plugin-manifest.json` and confirm it lists `run-workflow.lua` as the entry Lua script, package kind, workflow, and files.
36. Save Lua and confirm a standalone `.lua` file can still appear in the local `exports/` folder.

## Songwriter Lab Smoke Test

1. Select the `Songwriter Lab` workflow tab.
2. Confirm the main panel shows:
   - `Upload guitar audio`
   - `Record guitar`
   - `Take name`
   - `Input monitor`
   - `Tuner`
   - `Output device`
   - audio engine controls for sample rate, buffer, and export depth
   - cab IR loader
   - `ChugForge Amp`
   - `Forge Bass`
   - guitar tone preset buttons
   - Forge Pedalboard cards
   - `Auto-create pack after record`
   - mode choices for `Do both`, `Rhythm to drums`, and `Continue idea`
   - a `Feel` selector
   - editable `Key / root`, `Riff role`, and `Riff notes`
   - drum-map preset buttons
   - add-section buttons plus duplicate/delete/move controls on section cards
   - total bars and arrangement time stats
   - a rhythm grid
   - section cards
   - Ambient Forge effect cards
   - Whammy/pitch automation preset buttons
   - `Create Songwriter Pack`
3. Enter real project metadata, for example:
   - Song: `New Riff`
   - Artist: `Demo Artist`
   - Tuning: `Drop E`
   - Tempo: `160`
4. Enable `Input monitor` and confirm mic-level meter responds when playing guitar.
5. Confirm the tuner panel changes from `Play a single note` to a note/frequency readout when a steady guitar note is played.
6. Set `Take name` to `verse-riff`.
7. Click `Record guitar`, play a short riff, then click `Stop recording`.
8. Confirm the status reports detected guitar attacks.
9. Confirm the audio preview appears under the upload button.
10. Confirm the Songwriter Check panel updates guitar idea, drum sketch, and song sections.
11. Select each mode and confirm JSON/Lua update:
   - `both`
   - `rhythm-to-drums`
   - `continue-song`
12. Change Feel between `Tight metalcore`, `Heavy breakdown`, and `Ambient big chorus`; confirm the section cards change.
13. Pick at least two guitar tone presets and confirm Amp Gain, Amp Tone, Forge Bass Drive, Click, and Level update.
14. Toggle a Forge Pedalboard card such as `Glass Boost` or `Backpull Reverse`; confirm `thall-lab-preset.json` output changes after export.
15. Enter `F#` in `Key / root`, choose `Breakdown` as riff role, and add a short riff note.
16. Click `Half-time breakdown` and confirm the drum map changes without showing four duplicate rows per drum.
17. Click `Add chorus`, duplicate the new section, move it up/down, then delete one duplicate.
18. Confirm the section count updates and the JSON/Lua section markers follow the edited song map.
19. Confirm the Lua panel includes:
    - `-- Guitar Workflow Toolkit - Songwriter Lab`
    - `-- Key / root: F#`
    - `-- Riff role: Breakdown`
    - `createTrack("guitar-idea", "GUITAR IDEA"`
    - `createTrack("kick-guide", "KICK GUIDE"`
    - `createTrack("bass-midi-guide", "BASS MIDI GUIDE"`
    - `createTrack("pitch-automation-guide", "WHAMMY / PITCH AUTOMATION"`
    - `createTrack("ambient-guitar-fx", "AMBIENT GUITAR FX"`
    - `createTrack("song-structure", "SONG STRUCTURE NOTES"`
    - `addStructureItem`
    - `addGuideItem`
    - `exports drum-guide.mid`
20. Confirm the JSON panel includes `keyCenter`, `riffRole`, `riffNotes`, `whammyEvents`, and `ambientEffects`.
21. Add `Whammy scream`, enable `Backwards Chug`, and confirm Lua/JSON update.
22. Click `Play bass guide` and confirm the built-in Forge Bass preview is audible.
23. Keep `Auto-create pack after record` enabled and confirm a songwriter export appears automatically after recording.
24. Click `Save JUCE preset` and confirm `exports/thall-lab-preset.json` is written or downloaded.
25. Click `Create Songwriter Pack`.
26. Confirm a folder appears under `exports/` for the sketch.
27. Confirm that folder contains:
    - `.lua` REAPER script
    - `.json` songwriter sketch
    - `songwriter-ideas.md`
    - `rhythm-sketch.json`
    - `drum-guide.mid`
    - `bass-guide.mid`
    - `thall-lab-preset.json`
    - `README-REAPER-STEPS.md`
    - `plugin-manifest.json`

## Native JUCE Smoke Test

1. Run `npm run native:check`.
2. Run `npm run native:configure` if the native project has not been configured yet.
3. Run `npm run native:build`.
4. Run `npm run native:open`.
5. Confirm the standalone app opens with the title `Thall Lab Standalone`.
6. Confirm the native audio device selector appears.
7. Choose your interface driver. Prefer ASIO if it is available; otherwise use WASAPI while developing.
8. Choose the guitar input and headphone/output channels.
9. Use a low stable buffer such as 64 or 128 samples in the native device settings.
10. Click `Load preset JSON`, choose a Songwriter Lab `thall-lab-preset.json`, and confirm the tone/bass controls update.
11. Toggle the native `MONO`/`STEREO` output switch and confirm the status line changes.
12. Export a Songwriter Lab JUCE preset with `JUCE output` set to `Mono`, load it in the native app, and confirm the switch shows `MONO`.
13. Click `Load IR`, choose a cab IR WAV/AIFF, and confirm the IR status label updates.
14. Confirm input/output meters move when playing guitar.

## Scope Guard

The MVP should remain local and should not include:

- AI API calls
- copyrighted-song downloading
- automatic audio separation/source extraction
- Video editing automation
- Full MIDI composition/generation pipelines
