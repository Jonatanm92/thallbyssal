# AMP_SIM_LAB Test Harness

Local-only test harness for Thallbyssal.

It does not touch the core sound/DSP. It can scan founder-owned WAV files, calculate technical metrics, run the internal headless renderer, write JSON reports, and generate simple HTML reports.

Run from repository root:

```bash
npm run lab:validate
npm run lab:test
npm run lab:metrics
npm run lab:di
npm run lab:di:strict
node AMP_SIM_LAB/test-harness/input-match/run-input-match.mjs
npm run lab:founder-assets
npm run lab:audition
npm run lab:audition:strict
npm run lab:audition:render
npm run lab:reference:feedback:plan -- --feedback path\to\thallbyssal-founder-tone-feedback.json
npm run lab:reference:pack
npm run lab:reference:serve
npm run lab:reference:tone-gap -- --di path\to\approved-di.wav --thallbyssal path\to\processed.wav --reference path\to\reference-a.wav --reference path\to\reference-b.wav
npm run lab:ir:audition
npm run lab:render
npm run lab:render:dry-run
npm run lab:render:strict
npm run lab:baseline:create
npm run lab:baseline:compare
npm run lab:beta-readiness
npm run lab:beta-readiness:strict
npm run lab:report-index
npm run lab:all
```

Input folder:

```text
D:\CodexBuilds\thallbyssal-lab\di-test-files
```

Override with `AMP_SIM_LAB_DI_DIR` if you want to point at another local folder.

Founder reference asset folders:

```text
D:\CodexBuilds\thallbyssal-lab\founder-assets\irs
D:\CodexBuilds\thallbyssal-lab\founder-assets\nam-models
D:\CodexBuilds\thallbyssal-lab\founder-assets\screenshots
D:\CodexBuilds\thallbyssal-lab\founder-assets\notes
```

Output files:

```text
D:\CodexBuilds\thallbyssal-lab\reports\audio-metrics.json
D:\CodexBuilds\thallbyssal-lab\reports\audio-metrics.html
D:\CodexBuilds\thallbyssal-lab\reports\di-validation.json
D:\CodexBuilds\thallbyssal-lab\reports\di-validation.html
D:\CodexBuilds\thallbyssal-lab\reports\input-match.json
D:\CodexBuilds\thallbyssal-lab\reports\input-match.html
D:\CodexBuilds\thallbyssal-lab\reports\founder-assets.json
D:\CodexBuilds\thallbyssal-lab\reports\founder-assets.html
D:\CodexBuilds\thallbyssal-lab\reports\audition-matrix.json
D:\CodexBuilds\thallbyssal-lab\reports\audition-matrix.html
D:\CodexBuilds\thallbyssal-lab\reports\render-results.json
D:\CodexBuilds\thallbyssal-lab\reports\render-results.html
D:\CodexBuilds\thallbyssal-lab\reports\render-safety.json
D:\CodexBuilds\thallbyssal-lab\reports\render-safety.html
D:\CodexBuilds\thallbyssal-lab\reports\baseline-compare.json
D:\CodexBuilds\thallbyssal-lab\reports\baseline-compare.html
D:\CodexBuilds\thallbyssal-lab\reports\reference-tone-gap-comparison.json
D:\CodexBuilds\thallbyssal-lab\reports\beta-readiness.json
D:\CodexBuilds\thallbyssal-lab\reports\beta-readiness.html
D:\CodexBuilds\thallbyssal-lab\reports\reference-feedback-plan.html
D:\CodexBuilds\thallbyssal-lab\reports\index.html
D:\CodexBuilds\thallbyssal-lab\listening-packs\reference-candidates\...\index.html
D:\CodexBuilds\thallbyssal-lab\listening-packs\ir-reference-auditions\...\audition.html
```

Override the generated output root with `AMP_SIM_LAB_OUTPUT_DIR`.

`lab:di` validates the current starter DI set without failing the full lab run. `lab:di:strict` exits non-zero when the starter DI set is not ready.

`input-match/run-input-match.mjs` creates a report-only Input Match / DI Calibration prototype from the current audio metrics report. It suggests input gain and gate starting points for founder review only; it does not modify DI files, presets, DSP/core sound, gain, or gate behavior.

`lab:founder-assets` scans private IR, NAM, preset-reference, screenshot, and note folders. It never approves shipping, bundling, or automatically loading those files in product code.

`lab:audition` creates planned DI/preset audition jobs without rendering audio. It is a safe placeholder for future offline plugin rendering. `lab:audition:strict` exits non-zero when a planned job is blocked.

`lab:render` renders one DI/preset job through the local headless renderer. `lab:render:dry-run` validates one DI/preset render plan and writes metadata under the generated render root without creating `processed.wav`. `lab:audition:render` renders the full audition matrix when the native renderer has been built. If the headless renderer is missing, real rendering fails clearly and GUI automation remains forbidden.

`lab:baseline:create` stores the latest render report as an internal baseline. `lab:baseline:compare` compares the current render report against that baseline using report-only metrics and status changes; it never judges tone quality or edits presets.

`lab:reference:pack` reads the latest private reference candidate report and writes gain-matched audition WAV copies plus an `index.html` with audio players. It only creates listening copies under the generated D: output folder; it does not change originals, presets, or DSP.

`lab:reference:serve` serves the latest reference listening pack at `http://127.0.0.1:5187/` so the audio players can be opened from a normal localhost browser URL.

`lab:reference:tone-gap` compares one local Thallbyssal render against founder-approved same-DI reference renders. It writes internal markdown and JSON metrics only; it does not write level-matched audio, modify DSP, edit presets, alter DI files, or use external/private-band references for technical A/B.

`lab:reference:feedback:plan` reads the local JSON exported from the founder review sheet and writes a ranked preset-only iteration plan. It never edits presets or approves DSP changes.

`lab:ir:audition` creates a private IR listening pack by recursively scanning `founder-assets\irs`, prioritizing `Palmer`, `Mellow`, `Extra intressanta`, and Vildhjarta-like naming first. It currently renders audio-format IRs only (`.wav`, `.aif`, `.aiff`, `.flac`) because device `.ir` files are listed for reference but are not safely loadable by the current native renderer. It copies selected IRs into a private preset folder, renders through the native IR preset path, and writes browser-safe audition WAV files under the generated D: output folder. It does not modify original IR files, presets, or DSP.

The wrapper expected by the lab is:

```text
native\juce-audio-engine\scripts\render-offline.ps1
```

It calls the local renderer built at:

```text
D:\CodexBuilds\thallbyssal-native\ThallbyssalOfflineRenderer_artefacts\Release\ThallbyssalOfflineRenderer.exe
```

Build it with:

```bash
npm run native:configure
npm run native:build
```

`lab:beta-readiness` summarizes DI validation, audition jobs, preset validation, beta-pack safety, and release artifacts into one docs-only private beta readiness report. It never approves public release by itself.
