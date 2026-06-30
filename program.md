# program.md

Karpathy-style operating program for Thallbyssal AI agents.

## Objective

Build Thallbyssal into a commercially credible amp-sim project while preserving founder control over sound decisions.

Current highest-value track:

1. Keep the known-good Current Best beta playable and protected.
2. Recover source parity evidence without changing product tone.
3. Improve lab automation so owner listening and Claude/Codex review become faster.
4. Block all release/legal/default decisions until explicit owner approval.

## Success Metrics

Use objective metrics where possible:

- `npm run lab:test` passes.
- `npm run lab:render:safety` has `0` errors and `0` warnings.
- Real render jobs succeed when a safe offline renderer exists.
- Source parity reports identify exact missing evidence instead of guessing.
- No DSP/core files are touched without approval.
- No audio/NAM/IR/model/render/binary files are committed.
- Owner gates are explicit and documented.

Subjective tone quality is not auto-optimized. Founder listening remains required.

## Boundaries - Can Do

Agents may safely work on:

- `AMP_SIM_LAB/test-harness`
- internal reports and docs
- validation scripts
- beta-readiness docs
- render safety tooling
- source parity evidence tooling
- GitHub branch/report preparation
- docs that point back to `AGENTS.md`

Agents may build native tools when the task is tooling/build validation and no source DSP behavior changes.

## Boundaries - Cannot Do

Do not do these without explicit founder approval:

- change product DSP or tone
- change presets or product defaults
- change Golden Reference A
- bundle or commit private NAM/IR/audio/model assets
- add public release, licensing, checkout, telemetry, cloud sync, or DRM
- merge to main
- declare a sound winner without owner listening
- fake renders or copy input WAVs to output WAVs

## Agent Lanes

Use separate branches/worktrees for separate lanes.

### Lane A - Implementation

Builds narrow safe tooling or docs.

Validation:

- relevant unit tests
- `git diff --check`
- forbidden asset check

### Lane B - Research / Evidence

Reads code, reports, manifests, and generated artifacts. Produces evidence reports only.

Validation:

- no product source changes unless explicitly approved
- clear `[CODE EVIDENCE]`, `[MEASUREMENT EVIDENCE]`, `[LISTENING EVIDENCE]`, `[SPECULATION]` where useful

### Lane C - Test / Review

Reviews another agent's branch for:

- fake render paths
- unsafe DSP changes
- missing validation
- asset leakage
- stale status docs

### Lane D - Owner Gate Prep

Prepares short owner-facing summaries and exact reply formats.

Use only when a real gate exists:

- listening approval
- UI visual approval
- license/asset decision
- merge-to-main approval
- beta-send approval
- release/default approval

## Current Stop Conditions

Stop and ask the owner if:

- a task requires DSP/core sound changes
- source parity requires missing known-good beta WAVs
- a release-safe asset/license decision is needed
- owner listening is required
- a merge or public release is requested
- validation fails and cannot be fixed safely

## Current Known Blocker

Strict Current Best source parity is blocked because exact known-good beta baseline WAVs are missing.

Recovery verifier:

```powershell
npm run lab:known-good-beta:recovery
```

Latest known status:

- status: `blocked-missing-known-good-beta-renders`
- required files listed in `AMP_SIM_LAB/CURRENT_BEST_KNOWN_GOOD_BETA_RECOVERY_REPORT.md`

Do not claim source parity until the exact files are restored or a new baseline is explicitly approved.

## Experiment Loop Template

Use this only for objective tooling or measurements, not tone-by-guessing.

1. Define one measurable objective.
2. Make one change.
3. Run validation.
4. Write result.
5. Keep if better by metric and safe by policy.
6. Revert or document blocker if worse.

## Daily Startup

```powershell
git status --short --branch
Get-Content AGENTS.md -TotalCount 220
Get-Content program.md -TotalCount 220
```

Then choose one narrow task from `THALLBYSSAL_FACTORY_QUEUE.md` or the latest owner prompt.
