# Thallbyssal Project

Internal project brief for turning the current amp sim, REAPER workflow tool, and AMP_SIM_LAB into one coordinated development project.

## Project Name

Thallbyssal

## Mission

Build a serious standalone + VST3 guitar creation system for modern low-tuned metal writing, recording, auditioning, and validation.

The first commercial direction is an amp sim product with a strong local/offline workflow. The surrounding factory tools should help the founder test tone safely, create internal demos, collect beta feedback, and avoid wasting time.

## Product Pillars

- Standalone amp sim for real playing and tone design.
- VST3 plugin target for DAW use.
- AMP_SIM_LAB for internal renders, reports, preset validation, beta packaging, and market validation.
- Guitar Workflow Toolkit for REAPER Lua templates, routing, songwriting workflow, and export support.
- Future songwriting tools for riff capture, drum/bass support, groove packs, and backing track workflows.

## Founder-Owned Sound Rule

The founder owns the sound.

Agents may help build tooling, tests, UI, reports, project structure, and safe render infrastructure. Agents must not modify DSP, core tone behavior, gain staging, cab/IR behavior, preset values, or plugin audio behavior without explicit founder approval for that exact task.

## Agent Autonomy

Safe assigned tasks are pre-approved.

Agents should implement and validate without asking the founder when they stay inside the task's allowed paths and do not touch protected sound/DSP, destructive file operations, public/commercial systems, external APIs, copyrighted/trademarked assets, GUI automation, fake renders, or original user files.

Agents must ask only for DSP/core sound changes, destructive writes, public launch/commercial/legal systems, work outside allowed paths, or conflicts with another agent.

## Current Status

- Local React/Vite app exists and builds.
- Native JUCE-style standalone/VST3 work exists under `native/juce-audio-engine`.
- AMP_SIM_LAB exists for internal lab/test/report workflows.
- Real local headless/offline render path exists and can generate audition renders.
- Root `AGENTS.md` defines safety rules for future Codex agents.
- `THALLBYSSAL_FACTORY_QUEUE.md` defines a safe 24h multi-agent queue.
- `TASK_PACKETS/` contains task packets for parallel agents.

## Protected Areas

These areas require founder approval before edits that could change sound:

- `native/juce-audio-engine/Source/ThallLabDspEngine.*`
- `native/juce-audio-engine/Source/PluginProcessor.*`
- native audio processing and preset loading that changes tone
- cab/IR behavior, amp behavior, gate, transpose, saturation, gain staging, tone stack, limiting
- approved tone preset values

## Safe Agent Areas

Agents can usually work safely in:

- `AMP_SIM_LAB/test-harness`
- `AMP_SIM_LAB/reports`
- `AMP_SIM_LAB/demo-site`
- `AMP_SIM_LAB/beta-pack`
- `AMP_SIM_LAB/market-validation`
- `AMP_SIM_LAB/release-checklists`
- `TASK_PACKETS`
- docs and internal planning files
- validators and reports that do not change sound

## Output Rules

Generated outputs should go to D: where possible:

- `D:\CodexBuilds\thallbyssal-lab`
- `D:\CodexBuilds\thallbyssal-native`
- `D:\CodexBuilds\guitar-workflow-toolkit-web-dist`

Do not overwrite original DI files, reference files, IRs, or user-provided assets.

## Development Lanes

### Lane 1: Core Amp Sim

Goal: Make standalone/VST3 stable and playable.

Allowed only with explicit approval if sound changes are involved.

Focus areas:

- input/output selection
- ASIO/native audio UX
- meter accuracy
- mono/stereo behavior
- UI realism
- preset loading
- safe audition renders

### Lane 2: AMP_SIM_LAB

Goal: Build the internal factory around the amp sim.

Focus areas:

- render safety
- baseline metrics
- audition pages
- preset validation
- beta readiness
- report index
- release checklists

### Lane 3: Guitar Workflow Toolkit

Goal: Keep the REAPER workflow app useful.

Focus areas:

- templates
- routing
- Lua generation
- JSON save/load
- songwriting/export structures

### Lane 4: Songwriting Product Discovery

Goal: Explore the future songwriter lab without disrupting the amp sim.

Focus areas:

- riff capture concept
- drum/bass MIDI planning
- groove library planning
- backing track creator UX
- local-only workflows

## Recommended Model Use

- Main architect: GPT-5 / high reasoning.
- DSP/native review: GPT-5 / high or xhigh reasoning.
- Review-only safety agent: GPT-5 / high reasoning.
- UI/design polish: GPT-5 / medium or high reasoning.
- Docs/task packets/reports: medium reasoning is enough.
- Build/test validation agents: low or medium reasoning is enough.

## Milestones

### Milestone 1: Internal Playable Alpha

- Standalone opens reliably.
- User can choose input/output and play with usable latency.
- Default tone is strong enough to audition.
- DI Sculpt stays bypassed until redesigned.
- Factory cab/default IR behavior is stable.
- Basic presets are meaningfully different.

### Milestone 2: Internal Lab Confidence

- Headless renders work.
- Reports are easy to open and listen through.
- Baselines track peak/RMS/clipping/render success.
- Render safety validators pass.
- No fake render or GUI automation exists.

### Milestone 3: Private Beta Prep

- Install/uninstall docs exist.
- Known issues are documented.
- Tone feedback form exists.
- Bug template exists.
- No public launch, checkout, telemetry, DRM, licensing, or analytics.

### Milestone 4: First Paid Validation Readiness

- Founder-approved sound direction.
- Founder-approved product name and claims.
- Private beta feedback indicates strong signal.
- Release safety checklist passes.
- Licensing/checkout still remains a separate founder-approved project.

## Current Next Best Tasks

1. Use `TASK_002_RENDER_SAFETY_VALIDATORS` to harden safety validators.
2. Use `TASK_009_REPORT_INDEX_POLISH` to make reports easier to use.
3. Use a founder-approved tone task to audition DI Sculpt bypass and decide the next tone move.
4. Use `TASK_005_DEMO_AUDITION_PAGE` to make internal listening easier.
5. Use `TASK_010_USAGE_SAVING_FACTORY_PLAN` to keep 24h agent work efficient.

## Commands

```bash
npm run lab:all
npm run lab:render:safety
npm test -- --run
npm run build
npm run native:build
npm run native:open
```
