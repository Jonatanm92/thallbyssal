# Guitar Workflow Toolkit

A local React/Vite app for building guitar workflow templates and generating REAPER Lua scripts.

Version 1 focuses on local editing only:

- Template presets for common guitar-cover workflows
- Workflow tabs for cover templates and backing-track creation
- Songwriter Lab for turning guitar riff rhythm into drum guides and section ideas
- Live browser tuner, original modern guitar tone presets, pedalboard notes, and native preset export
- Native JUCE standalone app for the real low-latency guitar monitor path
- Source asset list for local files and reference links
- Multi-file upload for matching local source files to backing-track/stem slots
- Source readiness summary for imported files, reference links, and target tracks
- Editable REAPER-oriented track templates
- Editable track master-send defaults
- Editable track-to-track routing
- Editable project markers
- JSON save/load format
- Basic Lua script generation
- Dark, clean local UI

Not included in Version 1:

- AI APIs
- Video editing
- Full MIDI composition/generation pipelines
- Copyrighted-song downloading
- Automatic audio separation/source extraction
- Cloud sync or accounts

## Setup

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

When running with `npm run dev`, the app saves exported `.lua`, `.json`, `.wav`, and bundle files into `D:\CodexBuilds\guitar-workflow-toolkit-data\exports` by default. Override with `GUITAR_TOOLKIT_DATA_DIR` if needed. Static browser downloads are still used as a fallback outside the local dev server.

Local source imports are copied into `D:\CodexBuilds\guitar-workflow-toolkit-data\imports` when the app is running through the dev server. The app stores the absolute local path in JSON so REAPER can import the file when the generated Lua script runs.

Imported audio and video files can be previewed directly in the Sources panel. The preview player reads only files inside the configured local imports folder, so manually typed paths outside that folder are kept for Lua/REAPER but are not played by the browser.

Use `Import one song file` in the Backing Track Creator panel for the simple flow. Choose `Remove instruments` to mark what should be removed from the backing track, or choose `All stems` to create a full stem-layout session. The advanced editor can still map multiple existing stems manually when you already have them.

Generated Lua imports local source files onto their assigned target tracks at project start. Sources with a file path but no target track are left as comments so they do not land on the wrong REAPER track.

In the Backing Track Creator panel, choose an output mode before creating files:

- `Both` - creates a REAPER import session and render-ready final backing-track file setup.
- `Final audio file` - focuses the generated Lua/README on creating a rendered WAV from REAPER.
- `REAPER import` - focuses on importing and routing sources in REAPER without render setup.

By default, Backing Track Creator stays in a simple one-file flow. Use `Show advanced editor` to open detailed source mapping, track editing, routing edits, and marker edits.

Use the `Create Backing Track` or `Create Files` button after importing sources to create a small local export package under the configured D: exports folder:

- `run-workflow.lua` - the stable REAPER entrypoint to load as a ReaScript action
- `<template-name>.lua` - a named copy of the generated REAPER script
- `<template-name>.json` - the saved template
- `source-manifest.md` - a readable list of imported files, reference links, and target tracks
- `README-REAPER-STEPS.md` - short instructions for loading the script and checking the session in REAPER
- `sources.json` - machine-readable source metadata for future tooling
- `plugin-manifest.json` - plugin-style package metadata with `run-workflow.lua` as the REAPER entry script and a file list

After a package is created, the app shows an `Export ready` panel with the exact local folder and every generated file.
For REAPER, load `run-workflow.lua` from the export folder. The named Lua file is kept as a readable backup.

Production web builds also default to D: at `D:\CodexBuilds\guitar-workflow-toolkit-web-dist`. Override with `GUITAR_TOOLKIT_WEB_DIST_DIR`.

## Template Presets

The app has two top-level workflow tabs:

- `Cover Templates` - regular guitar cover and one-take cover sessions.
- `Backing Track Creator` - backing-track preparation sessions.

The app currently includes four local presets:

- `Guitar Routing Cover` - guitar bus, backing bus, amp tracks, lead, clean/ambient, and backing track routing.
- `One-Take Video Cover` - one-take camera reference, camera sync audio, stereo output/Songsterr print, guitar prints, FX, final master print, Shorts print, and full video print.
- `Backing Track Creator` - local creator session for organizing legal backing tracks, no-guitar tracks, stems, click/count-in material, practice loops, and a final no-guitar print.
- `Songwriter Lab` - local guitar idea sketcher that detects guitar attacks, creates visual drum-guide items, and suggests song sections.

The One-Take Video Cover preset is for sessions where the video editing happens elsewhere, but REAPER is used to organize sync audio, printed audio, markers, and export-ready audio stems. It does not add video editing automation.

The Backing Track Creator preset is for files you already have permission to use, such as jam tracks, official instrumentals, bought/downloaded stems, Songsterr/plugin prints, or your own exports. It does not download copyrighted songs or perform automatic source separation in the browser yet. It prepares the REAPER/session package and records the requested removal/stem target.

The Songwriter Lab preset is for guitar riffs and rough phone/interface recordings. It can record directly from microphone, or import local audio, then analyze attack energy locally in the browser, quantize the rhythm against the current BPM, create visual drum/bass guides plus writing sections, and export simple `drum-guide.mid` and `bass-guide.mid` files. It does not use AI APIs.
Songwriter Lab also stores writing context such as key/root idea, riff role, riff notes, cab IR name, live tuner state, original guitar tone preset choice, pedalboard settings, pitch automation guides, and ambient guitar FX notes so the exported REAPER/JUCE pack contains enough information to continue the song later.

Backing-track sessions can be marked with one of three source workflows:

- `no-guitar-track` - you already have a usable no-guitar/jam track.
- `separate-stems` - you already have separate local stems to import.
- `full-mix-reference` - you only have a full-mix reference and are preparing the REAPER session around it.

You can store YouTube, Songsterr, or other URLs as reference links in the Sources panel. The app does not fetch audio from those links.

## Scripts

```bash
npm run dev      # Start the local Vite dev server
npm run build    # Type-check and build the app
npm run preview  # Preview the production build
npm test         # Run unit tests for model and Lua generation
```

## Project Structure

```text
src/
  App.tsx                  Main editor shell and app state
  main.tsx                 React entry point
  styles.css               Dark UI styles
  domain/
    exportFile.ts           Export filename helpers
    exportBundle.ts         Lua/JSON/source manifest/REAPER steps/sources bundle helpers
    exportBundle.test.ts    Bundle helper tests
    sourceSummary.ts        Source readiness summary helper
    sourceSummary.test.ts   Source summary tests
    sourceImportPlan.ts     Batch source import filename matching
    sourceImportPlan.test.ts Upload matching tests
    template.ts            Template data model, validation, JSON load/save
    template.test.ts       Template model tests
    luaGenerator.ts        REAPER Lua generator
    luaGenerator.test.ts   Lua generator tests
    sessionCheck.ts        App-side REAPER session readiness checks
    sessionCheck.test.ts   Session check tests
    songwriter.ts          Songwriter Lab rhythm-to-drums and section-sketch helpers
    songwriter.test.ts     Songwriter Lab tests
    guitarTonePresets.ts   Original modern guitar tone preset data
    pedalboard.ts          Original Forge pedalboard preset data
    thallLabPreset.ts      Native JUCE preset export model
native/
  juce-audio-engine/       Native JUCE standalone audio engine prototype
MVP_TESTS.md               Manual smoke tests for the MVP presets
```

## JSON Format

Saved templates use an envelope with an app marker and schema version:

```json
{
  "app": "guitar-workflow-toolkit",
  "template": {
    "schemaVersion": 1,
    "presetId": "one-take-video-cover",
    "name": "Guitar Cover Session",
    "description": "A compact REAPER setup for recording guitar covers.",
    "songName": "Song Name",
    "artist": "Artist",
    "sourceFormat": "one-take camera + stereo output",
    "sourceWorkflow": "cover-template",
    "sourceNotes": "",
    "outputMode": "reaper-import",
    "sourceAssets": [],
    "reminders": [
      "mute camera audio after sync",
      "export 16:9 full video and 9:16 Shorts version"
    ],
    "tuning": "E Standard",
    "tempo": 120,
    "tracks": [],
    "routes": [],
    "markers": []
  }
}
```

The app also accepts a raw `template` object with `schemaVersion: 1`.

## REAPER Lua Output

The generated script creates tracks, sets names/colors, configures record/input flags, applies folder depth, creates sends, disables master send for routed child tracks or manually disabled tracks, writes project notes, and adds project markers. Review any generated Lua before running it in REAPER.

For the One-Take Video Cover preset, the Lua output includes:

- Comments and project notes for song name, artist, BPM, tuning, source workflow, source format, and reminders
- Camera audio sync track with master send disabled by default
- Sends from stereo output, live guitar, extra guitar, and FX into `FINAL MASTER PRINT`
- Markers for `START`, `BEST RIFF`, `BREAKDOWN`, `CHORUS / BIG PART`, Shorts clip start/end, and full video start/end

For the Backing Track Creator preset, the Lua output includes:

- Comments and project notes for song name, artist, BPM, tuning, source workflow, source format, output mode, and usage reminders
- Editable source notes stored in JSON and written into Lua/project notes
- Source asset comments for local files and reference links
- Optional `reaper.InsertMedia(...)` calls for source assets with local file paths
- `sources.json` in export packages for structured source/target-track metadata
- `plugin-manifest.json` in export packages for plugin-style package metadata and the REAPER entry script
- Reference and sync tracks with master send disabled by default
- Sends from backing/no-guitar/stem tracks into `BACKING BUS`
- A practice-only `GUITAR PRACTICE BUS` fed by `CLICK / COUNT-IN`, kept out of the final print
- A send from `BACKING BUS` to `FINAL BACKING PRINT`
- Markers for song sections, loop practice start/end, and final print boundaries
- Render-ready REAPER project settings when output mode is `Final audio file` or `Both`

For the Songwriter Lab preset, the Lua output includes:

- Imported guitar idea on a `GUITAR IDEA` track when a local file is available
- Guide tracks for kick, snare, hat/ride, crash/accent, bass MIDI, pitch automation, and ambient guitar FX ideas
- Empty REAPER guide items placed at detected/quantized rhythm positions
- Project notes with BPM, tuning, mode, feel, key/root idea, riff role, riff notes, cab IR, and writing notes
- Markers for suggested song sections
- Long section note items on `SONG STRUCTURE NOTES`, with guitar and drum direction saved into REAPER item notes

Songwriter pack exports also include:

- `drum-guide.mid` - a simple MIDI drum guide generated from detected guitar rhythm hits
- `bass-guide.mid` - a root-following bass MIDI guide intended for bass instrument plugins
- `rhythm-sketch.json` - quantized rhythm map and drum-hit list
- `thall-lab-preset.json` - native JUCE preset with tone, transpose, bass, pedalboard, IR, and guide settings
- `plugin-manifest.json` - plugin-style package metadata for the Songwriter Lab export
- `README-REAPER-STEPS.md` - short REAPER workflow instructions for the exported pack

Songwriter Lab recording workflow:

1. Set `Take name` (optional).
2. Enable `Input monitor` to check guitar level and tuner readout before recording.
3. Pick a guitar tone preset or tweak ChugForge/Forge Bass manually.
4. Click `Record guitar`, play the riff, then click `Stop recording`.
5. Watch the mic-level meter for clipping/weak input.
6. Add optional key/root, riff role, and riff notes before exporting.
7. Use a drum-map preset such as `Half-time breakdown` or click grid cells manually.
8. Add, duplicate, or delete song sections until the rough structure matches the song idea.
9. Move sections up/down and watch total bars plus arrangement time update.
10. Load a custom cab IR if you want ChugForge monitoring or the JUCE preset to use it.
11. Use Forge Bass preview to check a clicky low-tuned bass guide before exporting.
12. Enable Forge Pedalboard/Ambient Forge effects such as reverse swells, stutters, backwards chugs, ringmod screams, and MB-style rhythmic tricks as REAPER/JUCE guide lanes.
13. Optionally keep `Auto-create pack after record` enabled to export immediately after each take.

Browser audio note: Chrome/WebAudio can select normal browser input/output devices and request sample-rate/latency preferences, but it cannot select ASIO drivers directly. For low-latency live guitar monitoring, use REAPER/native audio or a future desktop build.

## Native JUCE Audio Engine

The project includes a native JUCE app/plugin project at `native/juce-audio-engine/`. This is the path for real live guitar playing: ASIO-capable low-latency monitoring, auto input gain, mono/stereo output switching, fixed-wet real-time transpose, an automatic low-octave layer blend, one-knob palm-mute catch/tightening, native high-gain guitar DSP, DI match-style sculpting, dual IR cab mixing with a Factory Mellow Cab default, a cab-room style IR page, clean-space amp EQ, separate pedal-style FX modules, and the new Thallbyssal standalone/VST3 product target. The browser app remains useful for planning, presets, REAPER Lua, JSON, and exports, but it is not the final live amp-sim surface.

Check local native prerequisites:

```bash
npm run native:check
```

After installing CMake and Visual Studio C++ Build Tools:

```bash
npm run native:configure
npm run native:build
npm run native:open
npm run native:open:visual
npm run native:shortcut
npm run native:open:plugin-standalone
npm run native:open:thallbyssal
```

Native builds default to `D:\CodexBuilds\thallbyssal-native` on this machine to avoid C: drive space and Windows path-length issues. Override with `THALLBYSSAL_NATIVE_BUILD_DIR` if needed.

The development standalone app is created at:

```text
D:\CodexBuilds\thallbyssal-native\ThallLabAudioEngine_artefacts\Release\Thall Lab Audio Engine.exe
```

Use `npm run native:open` or `npm run native:open:visual` for the app you play through. Use `npm run native:shortcut` to create a desktop shortcut to that same visual app.

The commercial product target is created under:

```text
D:\CodexBuilds\thallbyssal-native\Thallbyssal_artefacts\
```

`npm run native:open:plugin-standalone` opens the product target's generic standalone shell. That is useful for plugin-format testing, but the visual playing surface is still `Thall Lab Audio Engine.exe`.

The React app can export `thall-lab-preset.json`. In the JUCE app, use `Load preset JSON` to load that file and apply the selected tone preset, mono/stereo output mode, fixed-wet transpose setting, low-octave layer defaults, palm-catch defaults, amp/bass settings, and optional cab IR reference.

See `native/juce-audio-engine/README.md` for Windows install commands and the native roadmap.

Commercial planning docs:

- `docs/COMMERCIAL_PRODUCT_PLAN.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/SOUND_DESIGN_TARGETS.md`

To use a script in REAPER:

1. Save the Lua output as a `.lua` file.
2. Open REAPER.
3. Go to `Actions` > `Show action list`.
4. Choose `New action` > `Load ReaScript`.
5. Select the generated `.lua` file and run it.

## Development Notes

Keep the domain layer local and deterministic. The app should remain useful without internet access after dependencies are installed.

Run the automated checks before handing off changes:

```bash
npm test
npm run build
npm run lab:all
```

AMP_SIM_LAB generated outputs, DI reports, and beta-pack placeholders are written to `D:\CodexBuilds\thallbyssal-lab` by default. The current starter DI validator can be run with `npm run lab:metrics` followed by `npm run lab:di`.
