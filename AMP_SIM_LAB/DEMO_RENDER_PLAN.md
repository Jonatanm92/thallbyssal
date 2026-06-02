# Demo Render Plan

Goal: create fast internal demos and founder-approved public demo assets without copyrighted material.

Do not create public launch material without founder approval.

## Demo Types

### Before/After Audio Demos

- Dry DI before processing.
- Processed output after a selected preset.
- Same loudness target where practical.
- No copyrighted riffs.

### Preset Preview Snippets

- 5 to 10 seconds each.
- One founder-owned riff per category.
- Render filenames include preset id and date.

### Clean/Crunch/High-Gain Comparisons

- Same DI file across three gain levels.
- Show tonal range without referencing competitor products.

### Genre-Specific Demos

- Internal labels only:
  - low-tuned modern metal
  - tight djent rhythm
  - ambient clean transition
  - lead sustain
  - FX/stutter transition

### 15-Second Social Snippets

- Founder-approved only.
- Original riffs only.
- Export square, 16:9, and 9:16 notes later.

### Web Preview Audio Files

- Short MP3/WAV previews for future demo site.
- Loudness-normalized.
- Include no private user data.

## Output Folders

```text
D:\CodexBuilds\thallbyssal-lab\renders\internal\
D:\CodexBuilds\thallbyssal-lab\renders\founder-review\
D:\CodexBuilds\thallbyssal-lab\renders\public-approved\
D:\CodexBuilds\thallbyssal-lab\reports\demo-render-report.json
```

## Current Status

Demo render automation is connected to the internal local headless renderer. The local test harness measures WAV files, validates starter DI readiness, generates an audition matrix of planned DI/preset render jobs, renders through `ThallbyssalOfflineRenderer`, and writes metrics. Tone quality still requires founder listening approval.

Run:

```bash
npm run lab:metrics
npm run lab:di
npm run lab:audition
npm run lab:render -- --input AMP_SIM_LAB/di-test-files/low_tuned_chugs.wav --preset AMP_SIM_LAB/presets/examples/high_gain_foundation_01.json --out AMP_SIM_LAB/renders/manual-test
npm run lab:render:dry-run
npm run lab:audition:render
npm run lab:baseline:create
npm run lab:baseline:compare
```

The current audition matrix is written to:

```text
D:\CodexBuilds\thallbyssal-lab\reports\audition-matrix.json
D:\CodexBuilds\thallbyssal-lab\reports\audition-matrix.html
D:\CodexBuilds\thallbyssal-lab\reports\render-results.json
D:\CodexBuilds\thallbyssal-lab\reports\render-results.html
D:\CodexBuilds\thallbyssal-lab\reports\baseline-compare.json
D:\CodexBuilds\thallbyssal-lab\reports\baseline-compare.html
```
