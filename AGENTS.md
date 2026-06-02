# AGENTS.md

Rules for Codex agents working in the Thallbyssal / Guitar Workflow Toolkit repository.

This repo may have many agents working in parallel. Keep changes small, isolated, and reviewable.

## Prime Directive

The founder owns the sound.

Agents may build tooling around the amp sim, but must not alter core tone without explicit founder approval in the current task.

If a task requires touching DSP or core sound files, stop and write a founder approval request instead of making the change.

## Agent Autonomy Policy

Safe assigned tasks are pre-approved.

Agents should not ask the founder for permission when all of these are true:

- the work stays inside the task's allowed paths
- no protected DSP/core sound files are touched
- no tone behavior, gain staging, cab/IR behavior, or preset values change
- no original DI/reference/IR/user files are modified
- no public launch, checkout, licensing, DRM, telemetry, analytics, cloud sync, auth, or external/paid API work is added
- no copyrighted/trademarked/brand/artist/song claims or assets are introduced
- no GUI automation or fake render behavior is introduced

For safe tasks, implement, run validation, and report. Do not pause for routine implementation choices, docs wording, report layout, validator details, or small test-harness decisions.

Ask the founder only when a task hits a stop condition, needs protected files, risks destructive writes, creates legal/commercial risk, or conflicts with another agent's work.

## Hard Rules

- Never modify core DSP, tone behavior, gain staging, oversampling, saturation, tone stack, cab/IR behavior, or preset values without explicit founder approval.
- Never automate the GUI.
- Never fake audio rendering by copying input to output.
- Never use copyrighted riffs, samples, IRs, brand names, artist names, song names, or trademarked amp model names.
- Never add checkout, licensing, DRM, telemetry, analytics, cloud sync, auth, or public launch code.
- Never modify original DI files.
- Never write outputs outside approved lab folders.
- Always preserve `AMP_SIM_LAB` separation from core sound/DSP.
- Prefer small PR-sized changes.
- One agent = one branch = one task.
- If a task requires touching DSP/core sound files, stop and write a founder approval request instead.

## Core Sound Protected Areas

Treat these as protected unless founder approval explicitly allows the task:

- `native/juce-audio-engine/Source/ThallLabDspEngine.*`
- `native/juce-audio-engine/Source/PluginProcessor.*`
- native audio processing, render engine, preset loading that changes sound
- saturation, amp, cab, IR, gate, transpose, tone stack, gain staging, oversampling, output limiting
- factory preset values or tone preset values

Allowed exceptions:

- Read-only inspection.
- Tests that assert current behavior.
- Build or export wiring that does not change sound.
- A founder-approved DSP task that names the allowed files/behavior.

## Approved Safe Areas

Agents can usually work in these areas without touching core sound:

- `AMP_SIM_LAB/test-harness`
- `AMP_SIM_LAB/reports`
- `AMP_SIM_LAB/presets` schema/examples, only when not changing approved tone values
- `AMP_SIM_LAB/demo-site`
- `AMP_SIM_LAB/beta-pack`
- `AMP_SIM_LAB/market-validation`
- `AMP_SIM_LAB/release-checklists`
- scripts that only validate, report, or call existing safe render commands
- docs and internal planning files

## Approved Output Locations

Generated lab outputs must stay under approved local lab folders, for example:

- `D:\CodexBuilds\thallbyssal-lab\renders`
- `D:\CodexBuilds\thallbyssal-lab\reports`
- `D:\CodexBuilds\thallbyssal-lab\chat-snippets`
- `D:\CodexBuilds\thallbyssal-lab\listening-packs`

Do not overwrite original DI, reference, IR, or user-provided files.

## AMP_SIM_LAB Boundary

`AMP_SIM_LAB` is for acceleration, testing, demos, beta feedback, reporting, and validation.

It must not silently change the product sound. Lab tools may:

- read founder-owned DI files
- call existing safe headless render commands
- calculate metrics
- write JSON/HTML reports
- create internal audition files
- validate packages and release readiness

Lab tools must not:

- tune DSP automatically
- normalize or "fix" tone automatically unless report-only
- alter presets without approval
- use public launch, checkout, licensing, telemetry, or cloud flows
- fake render success

## Parallel Work Rules

- One agent = one branch = one task.
- Own a narrow file set. Do not edit files outside your task scope.
- Work autonomously inside assigned safe paths; do not wait for founder approval for safe tasks.
- Do not revert or overwrite other agents' changes.
- Prefer additive docs, validators, reports, and tests over broad rewrites.
- Keep changes PR-sized and easy to review.
- If two agents need the same protected file, pause and coordinate instead of racing.

## Render Safety

Real renders must use the approved local headless/offline renderer path.

- Do not copy input WAV to output WAV as fake success.
- Do not automate the standalone app or DAW UI.
- Do not render outside approved render roots.
- Do not overwrite existing DI files.
- Preserve render metadata and metrics.
- If no safe render path exists, create a dry-run/blocker report instead.

## Copyright, Trademark, and Claims

- Do not include copyrighted riffs, samples, songs, artist names, album names, logos, or proprietary IRs in public assets.
- Do not use brand names or trademarked amp model names in product-facing presets or claims.
- Do not claim the product models or sounds exactly like a specific real amp, plugin, artist, or brand unless there is written permission and evidence.
- Use original names and neutral descriptions.

## React / REAPER App Rules

This repository also contains the local React/Vite guitar workflow app.

- Keep core app behavior in `src/domain`.
- Keep domain functions pure where practical.
- Validate template data before generating Lua.
- Preserve backward compatibility for existing `schemaVersion: 1` JSON unless a migration is added.
- Generated Lua should be readable and escape user-editable strings.
- Do not add AI APIs, video editing, MIDI generation, copyrighted-song downloading, YouTube ripping, or automatic stem separation unless explicitly requested.

## Required Validation Before Finishing

Run the relevant checks before declaring work complete:

- `npm run lab:all`
- `npm run lab:render:safety` if render-related
- `npm run lab:beta-readiness:strict` if beta-related
- `npm test -- --run`
- `npm run build`

If a command is not applicable or cannot run, state why in the final response.

## Review Guidelines

Flag these as review findings:

- P0: any DSP/core sound modification without explicit founder approval
- P0: fake render paths or copied input-as-output renders
- P0: GUI automation
- P0: destructive writes or overwriting DI files
- P1: trademark/copyright/artist/brand claims
- P1: missing validators for lab, render, beta, or release changes
- P1: outputs written outside approved lab folders

## Founder Approval Request Template

If a task needs protected DSP/core sound changes, stop and write:

```markdown
Founder approval required

Task:
Files that would be touched:
Sound behavior that may change:
Risk:
Validation plan:
Rollback plan:
```

Do not proceed until the founder approves.

## Required Final Response

End every task with:

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
