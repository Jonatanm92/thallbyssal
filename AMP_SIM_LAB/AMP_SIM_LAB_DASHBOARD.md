# AMP SIM LAB Dashboard

AMP_SIM_LAB is the internal factory around Thallbyssal. It accelerates testing, demos, beta feedback, reports, and market validation without replacing the founder-led tone/design process.

Core rule: **the founder owns the sound. The factory owns test automation, reports, preset validation, demo generation, beta packaging, and validation assets.**

Generated: 2026-06-03T10:29:59.225Z

Generated output root: `D:\CodexBuilds\thallbyssal-lab`

DI input folder: `D:\CodexBuilds\thallbyssal-lab\di-test-files`

## Current Snapshot

| Area | Status |
| --- | --- |
| Current build status | Pass with 2 warning(s). Artifacts: Visual standalone app, Plugin standalone shell, VST3 bundle, VST3 Windows binary, Installed VST3 bundle. |
| Current audio engine version | package.json 0.1.0 / native 0.1.0 |
| Plugin format targets | Windows Standalone, Windows VST3. AU/macOS later. AAX later. |
| Test coverage status | Lab structure, harness unit tests, WAV metrics, DI validation, audition matrix, preset validation, beta-pack placeholder, and release artifact validation are automated. React/domain tests remain separate. |
| Preset count | 9 internal placeholder preset(s). Preset validation: Pass with 9 warning(s). |
| DI validation status | Starter ready: yes. Matched 3/3. Errors: 0. Warnings: 4. |
| Audition matrix status | Planned jobs: 14. Blocked jobs: 0. Skipped presets: 0. |
| Render hook status | real-render. Attempted: 14. Succeeded: 14. Failed: 0. Blocked: 0. Dry-run: 0. Clipping count: 0. |
| Regression baseline status | Compared 14 job(s); render success changes: 0. |
| Render demo status | 3 founder-owned WAV file(s) found. Headless render: real-render. |
| Beta readiness status | Docs-only beta pack placeholder: yes. Contains plugin binary: no. Telemetry: no. Checkout/licensing: no. |
| Automated private beta validation | Ready: yes. Blockers: 0. Warnings: 3. Public release ready: no. |
| Market validation status | Not started. 20-tester plan and copy drafts are in `MARKET_VALIDATION_PLAN.md`. |
| Next decision required | Founder auditions processed WAV files and approves whether the current internal preset mappings are useful for continued lab/demo work. |

## Latest Reports

- `D:\CodexBuilds\thallbyssal-lab\reports\audio-metrics.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\di-validation.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\audition-matrix.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\render-results.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\render-safety.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\baseline-compare.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\preset-validation.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\release-artifacts.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\beta-readiness.json`
- `D:\CodexBuilds\thallbyssal-lab\reports\index.html`
- `D:\CodexBuilds\thallbyssal-lab\beta-pack\dist\thallbyssal-private-beta-placeholder\BETA_PACK_MANIFEST.json`

## Lab Commands

```bash
npm run lab:all
npm run lab:validate
npm run lab:metrics
npm run lab:di
npm run lab:founder-assets
npm run lab:audition
npm run lab:audition:render
npm run lab:reference:pack
npm run lab:reference:serve
npm run lab:reference:feedback:plan -- --feedback path\to\thallbyssal-founder-tone-feedback.json
npm run lab:ir:audition
npm run lab:render:dry-run
npm run lab:render:strict
npm run lab:baseline:create
npm run lab:baseline:compare
npm run lab:presets
npm run lab:beta-pack
npm run lab:release
npm run lab:beta-readiness
npm run lab:report-index
npm run lab:dashboard
```

## Lab Boundaries

- Do not redesign the core sound/DSP without explicit approval.
- Do not use copyrighted riffs, samples, IRs, brand names, logos, or amp trademarks.
- Do not claim to model specific real amps unless permission and evidence exist.
- Do not build checkout, licensing server, auth, telemetry, analytics, cloud sync, or DRM yet.
- Do not collect private user data.
- Do not use paid APIs.
- Do not create public launch material without founder approval.
- Do not make "sounds exactly like [brand/model]" claims.
