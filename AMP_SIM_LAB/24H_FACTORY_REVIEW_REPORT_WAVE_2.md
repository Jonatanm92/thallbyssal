# AMP_SIM_LAB Wave 2 Factory Review Report

Generated: 2026-06-03

Review-only task: `REVIEW_AGENT_WAVE_2`

Canonical repo root verified:

```text
C:/Users/grise/Documents/youtubekanal-gitarr covers/guitar-workflow-toolkit
```

Base branch verified: `factory/lab-foundation-checkpoint` at `47a673a87d501e61a77861e5579731b20d5e4edd`

All six review branches exist. Known commits were found:

- `001`: `30cabb9a98fff65062fbffad77d3ceeff20112bc`
- `002`: `a6f21a3b3af7b78e640b3a89e825887dc8037f1d`
- `003`: `7541d7ec7699b50e86d212d2c50b8d117ced8572`
- `004 latest`: `497b1db0956c69fecff501880535d5cd9ebab737`
- `004 implementation`: `c91c0e4` found on `agent/wave2-004-preset-validation-hardening`
- `005`: `1ecc216b6ccc33877d810bc8df030dbc49ad1f62`
- `006`: `d8cc9b1eb2dad5659755cc3e251bb49ee6e5d9a3`

No merges were performed. No DSP/core sound files, tone values, original DI files, dependency versions, or lockfiles were modified by this review. `lab:dashboard` rewrote dashboard markdown as a test side effect in worktrees where `lab:all` completed; those review side effects were restored before this report was written.

## Shared Review Findings

- DSP/core touched by Wave 2 diffs: no.
- Preset tone values changed: no preset JSON tone values changed.
- Original DI/audio files changed: no.
- GUI automation added: no.
- Fake render/copy-input-to-output path added: no.
- Public release, checkout, licensing, DRM, telemetry, analytics, cloud sync, or auth system added: no.
- Generated heavy/audio files tracked unexpectedly: no. Branch 006 tracks only `AMP_SIM_LAB/renders/.gitkeep`.
- Package lock changed: no branch changed `package-lock.json`.
- Dependencies added/removed/upgraded: no.
- `npm audit fix` evidence: no package-lock/package dependency churn; no evidence it was run.
- Critical npm audit note: Task 004 and Task 006 are known to have reported one critical audit finding. Treat as `SECURITY_DEPENDENCY_AUDIT_REVIEW`, not an automatic merge blocker because no branch introduced or changed dependencies.
- Merge-tree conflict spot checks: virtual merges for 002+003, 005+006, and 004+006 produced trees without conflict output.

## Branch 001 - Headless Render Discovery

Branch: `agent/wave2-001-headless-render-discovery`

Status:

- Exists: yes.
- Commit found: yes, `30cabb9a98fff65062fbffad77d3ceeff20112bc`.
- Changed files: `AMP_SIM_LAB/HEADLESS_RENDER_DISCOVERY.md`.
- Changes inside approved paths: yes.
- Diff stat: 1 file, 125 insertions, 87 deletions.

Safety:

- DSP/core touched: no.
- Preset tone values changed: no.
- Original DI files changed: no.
- GUI automation added: no.
- Fake render/copy-input-to-output risk: no new implementation; docs describe existing native WAV writer path and explicitly reject copy/fake behavior.
- Public release/checkout/licensing/auth/telemetry added: no.
- Generated heavy/audio files tracked: no.
- Suspicious trademark/copyright/artist/brand claims added: no blocking claim language found.

Dependency/package changes:

- `package.json` changed: no.
- `package-lock.json` changed: no.
- npm audit critical warning mentioned: no branch-specific evidence found.
- npm audit fix run: no evidence.

Tests:

- Claimed tests: unknown from commit text.
- Rerun by review:
  - `npm run lab:all`: pass.
  - `npm test -- --run`: pass, 13 files / 64 tests.
  - `npm run build`: pass.

Merge recommendation: safe to merge.

Notes: This is docs-only and identifies a local headless render path without changing native/audio behavior. It supports `REAL_RENDER_CONNECTION_PLAN` only as a future plan after safe merge decisions.

## Branch 002 - Render Safety Validators

Branch: `agent/wave2-002-render-safety-validators`

Status:

- Exists: yes.
- Commit found: yes, `a6f21a3b3af7b78e640b3a89e825887dc8037f1d`.
- Changed files:
  - `AMP_SIM_LAB/test-harness/render-hook/render-adapter.mjs`
  - `AMP_SIM_LAB/test-harness/render-hook/render-hook.test.mjs`
  - `AMP_SIM_LAB/test-harness/render-hook/render-safety.mjs`
- Changes inside approved paths: yes.
- Diff stat: 3 files, 369 insertions, 19 deletions.

Safety:

- DSP/core touched: no.
- Preset tone values changed: no.
- Original DI files changed: no.
- GUI automation added: no. Validator detects GUI automation indicators.
- Fake render/copy-input-to-output risk: no. Validator strengthens fake-copy checks and renderer provenance requirements.
- Public release/checkout/licensing/auth/telemetry added: no systems added. Terms appear only as forbidden-pattern checks/test fixture strings.
- Generated heavy/audio files tracked: no.
- Suspicious trademark/copyright/artist/brand claims added: no.

Dependency/package changes:

- `package.json` changed: no.
- `package-lock.json` changed: no.
- npm audit critical warning mentioned: no branch-specific evidence found.
- npm audit fix run: no evidence.

Tests:

- Claimed tests: unknown from commit text.
- Rerun by review:
  - `npm run lab:all`: pass; lab unit tests 66 passed.
  - `npm test -- --run`: pass, 13 files / 64 tests.
  - `npm run build`: pass.
  - `npm run lab:render:safety`: pass, errors 0, warnings 0.

Merge recommendation: safe to merge.

Notes: Good safety hardening. It adds branch/staged diff scanning, DI mtime checks, DSP mtime checks, renderer provenance checks, and fake-output checks without touching audio processing.

## Branch 003 - Baseline Regression Reports

Branch: `agent/wave2-003-baseline-regression-reports`

Status:

- Exists: yes.
- Commit found: yes, `7541d7ec7699b50e86d212d2c50b8d117ced8572`.
- Changed files:
  - `AMP_SIM_LAB/test-harness/render-hook/baseline.mjs`
  - `AMP_SIM_LAB/test-harness/render-hook/render-hook.test.mjs`
- Changes inside approved paths: yes.
- Diff stat: 2 files, 207 insertions, 8 deletions.

Safety:

- DSP/core touched: no.
- Preset tone values changed: no.
- Original DI files changed: no.
- GUI automation added: no.
- Fake render/copy-input-to-output risk: no. Reports distinguish real render, dry-run, and missing output instead of fabricating output.
- Public release/checkout/licensing/auth/telemetry added: no.
- Generated heavy/audio files tracked: no.
- Suspicious trademark/copyright/artist/brand claims added: no.

Dependency/package changes:

- `package.json` changed: no.
- `package-lock.json` changed: no.
- npm audit critical warning mentioned: no branch-specific evidence found.
- npm audit fix run: no evidence.

Tests:

- Claimed tests: unknown from commit text.
- Rerun by review:
  - `npm run lab:all`: pass; lab unit tests 63 passed.
  - `npm test -- --run`: pass, 13 files / 64 tests.
  - `npm run build`: pass.
  - `npm run lab:baseline:create`: pass, 14 jobs stored.
  - `npm run lab:baseline:compare`: pass, 14 jobs compared, 0 render-success changes.

Merge recommendation: safe to merge.

Notes: This is objective report hardening. It does not judge tone and does not alter render behavior.

## Branch 004 - Preset Validation Hardening

Branch: `agent/wave2-004-preset-validation-hardening`

Status:

- Exists: yes.
- Commit found: yes, latest `497b1db0956c69fecff501880535d5cd9ebab737`; implementation `c91c0e4` is contained.
- Changed files:
  - `AMP_SIM_LAB/AMP_SIM_LAB_DASHBOARD.md`
  - `AMP_SIM_LAB/PRESET_SCHEMA.md`
  - `AMP_SIM_LAB/PRESET_VALIDATION_PLAN.md`
  - `AMP_SIM_LAB/test-harness/preset-validation.test.mjs`
  - `AMP_SIM_LAB/test-harness/run-lab-all.mjs`
  - `AMP_SIM_LAB/test-harness/validate-presets.mjs`
  - `package.json`
- Changes inside approved paths: yes.
- Diff stat: 7 files, 264 insertions, 57 deletions.

Safety:

- DSP/core touched: no.
- Preset tone values changed: no preset JSON edited.
- Original DI files changed: no.
- GUI automation added: no.
- Fake render/copy-input-to-output risk: no.
- Public release/checkout/licensing/auth/telemetry added: no. Public-release text is safety/disclaimer validation.
- Generated heavy/audio files tracked: no.
- Suspicious trademark/copyright/artist/brand claims added: no user-facing claim. Test fixtures intentionally include brand/artist/song words to verify rejection/warning behavior.

Dependency/package changes:

- `package.json` changed: yes.
- Exact reason: adds `lab:validate-presets` script and keeps `lab:presets` as an alias to it. `run-lab-all.mjs` uses the new explicit label.
- `package-lock.json` changed: no.
- npm audit critical warning mentioned: yes, known task report item says one critical npm audit finding existed.
- npm audit fix run: no evidence; no dependency or lockfile changes.

Tests:

- Claimed tests: unknown from commit text.
- Rerun by review:
  - `npm run lab:all`: pass; lab unit tests 66 passed.
  - `npm test -- --run`: pass, 13 files / 64 tests.
  - `npm run build`: pass.
  - `npm run lab:validate-presets`: pass; 9 presets scanned, 0 errors, 9 release-readiness warnings.

Merge recommendation: safe to merge.

Notes: The 9 preset warnings are expected release-readiness warnings from hardened validation, not test failures. The npm audit critical warning remains a P1 follow-up for separate security review.

## Branch 005 - Demo Audition Page

Branch: `agent/wave2-005-demo-audition-page`

Status:

- Exists: yes.
- Commit found: yes, `1ecc216b6ccc33877d810bc8df030dbc49ad1f62`.
- Changed files:
  - `AMP_SIM_LAB/test-harness/demo-audition-page.mjs`
  - `AMP_SIM_LAB/test-harness/demo-audition-page.test.mjs`
- Changes inside approved paths: yes.
- Diff stat: 2 files, 57 insertions, 5 deletions.

Safety:

- DSP/core touched: no.
- Preset tone values changed: no.
- Original DI files changed: no.
- GUI automation added: no.
- Fake render/copy-input-to-output risk: no. The page only links a processed WAV when an existing local file is present; it does not create fake renders.
- Public release/checkout/licensing/auth/telemetry added: no. The page reinforces internal/private boundaries.
- Generated heavy/audio files tracked: no.
- Suspicious trademark/copyright/artist/brand claims added: no; tests assert those words are absent from generated page copy.

Dependency/package changes:

- `package.json` changed: no.
- `package-lock.json` changed: no.
- npm audit critical warning mentioned: no branch-specific evidence found.
- npm audit fix run: no evidence.

Tests:

- Claimed tests: unknown from commit text.
- Rerun by review:
  - `npm run lab:all`: fail at `lab:validate` with `Missing directories: renders`.
  - `npm test -- --run`: pass, 13 files / 64 tests.
  - `npm run build`: pass.
  - `npm run lab:report-index`: pass.

Merge recommendation: merge after fix.

P1 issue:

- `npm run lab:all` fails in this branch's clean linked worktree because `AMP_SIM_LAB/renders` is absent. This is not caused by the demo page code, but failed test evidence blocks independent merge. Branch 006 adds `AMP_SIM_LAB/renders/.gitkeep`, so safest path is to merge 006 before 005, then rerun `npm run lab:all` on the combined tree. Alternatively add the tracked render-directory placeholder before merging 005.

## Branch 006 - Beta Packet Hardening

Branch: `agent/wave2-006-beta-packet-hardening`

Status:

- Exists: yes.
- Commit found: yes, `d8cc9b1eb2dad5659755cc3e251bb49ee6e5d9a3`.
- Changed files:
  - `.gitignore`
  - `AMP_SIM_LAB/BETA_TESTER_PACKET.md`
  - `AMP_SIM_LAB/beta-pack/FEEDBACK_FORM.md`
  - `AMP_SIM_LAB/beta-pack/KNOWN_ISSUES.md`
  - `AMP_SIM_LAB/beta-pack/README_BETA_TEMPLATE.md`
  - `AMP_SIM_LAB/renders/.gitkeep`
  - `AMP_SIM_LAB/test-harness/beta-readiness.mjs`
  - `AMP_SIM_LAB/test-harness/beta-readiness.test.mjs`
- Changes inside approved paths: yes.
- Diff stat: 8 files, 71 insertions, 34 deletions.

Safety:

- DSP/core touched: no.
- Preset tone values changed: no.
- Original DI files changed: no.
- GUI automation added: no.
- Fake render/copy-input-to-output risk: no.
- Public release/checkout/licensing/auth/telemetry added: no systems added. Docs explicitly state no public release, no checkout/licensing/auth/telemetry/analytics/cloud sync, and manual-only feedback.
- Generated heavy/audio files tracked: no. `.gitignore` keeps render contents ignored while allowing `.gitkeep`.
- Suspicious trademark/copyright/artist/brand claims added: no.

Dependency/package changes:

- `package.json` changed: no.
- `package-lock.json` changed: no.
- npm audit critical warning mentioned: yes, known task report item says one critical npm audit finding existed.
- npm audit fix run: no evidence; no dependency or lockfile changes.

Tests:

- Claimed tests: unknown from commit text.
- Rerun by review:
  - `npm run lab:all`: pass; lab unit tests 62 passed.
  - `npm test -- --run`: pass, 13 files / 64 tests.
  - `npm run build`: pass.
  - `npm run lab:beta-readiness:strict`: pass; docs-only private beta validation ready yes, blockers 0, warnings 2.

Merge recommendation: safe to merge.

Notes: This branch fixes the missing tracked render-directory placeholder that blocked branch 005's independent `lab:all` run.

## Issues

P0:

- None found.

P1:

- Branch 005: `npm run lab:all` fails at lab structure validation due missing `AMP_SIM_LAB/renders` directory in that branch's clean worktree. Merge 006 first or otherwise add the tracked placeholder, then rerun `lab:all`.
- Security follow-up: Tasks 004 and 006 are known to have reported one critical npm audit finding. No dependency changes introduced it, and `npm audit fix` was not run, but it requires `SECURITY_DEPENDENCY_AUDIT_REVIEW`.

P2:

- Branch 004: preset validation now reports 9 release-readiness warnings. Non-blocking, but the dashboard/docs should make clear these are intentional private/internal preset warnings.
- Branch 005: merge readiness depends on the render-directory placeholder supplied by branch 006, so its independent test evidence is weaker until combined rerun passes.

## Wave 2 Merge Plan

Merge first:

- `agent/wave2-001-headless-render-discovery`
- `agent/wave2-002-render-safety-validators`
- `agent/wave2-003-baseline-regression-reports`
- `agent/wave2-004-preset-validation-hardening`
- `agent/wave2-006-beta-packet-hardening`

Merge after fixes:

- `agent/wave2-005-demo-audition-page`, after branch 006's `AMP_SIM_LAB/renders/.gitkeep` is present in the target integration tree and `npm run lab:all` is rerun successfully on the combined tree.

Reject:

- None.

Needs founder decision:

- None for DSP/core safety. No unknown DSP/core status remains.

Suggested merge order:

1. `agent/wave2-001-headless-render-discovery`
2. `agent/wave2-002-render-safety-validators`
3. `agent/wave2-003-baseline-regression-reports`
4. `agent/wave2-004-preset-validation-hardening`
5. `agent/wave2-006-beta-packet-hardening`
6. Rerun `npm run lab:all`, `npm test -- --run`, `npm run build`
7. `agent/wave2-005-demo-audition-page`
8. Rerun `npm run lab:all`, `npm test -- --run`, `npm run build`, `npm run lab:report-index`

Suggested follow-up tasks:

- `SECURITY_DEPENDENCY_AUDIT_REVIEW`
- `REAL_RENDER_CONNECTION_PLAN`, only after safe merge decisions and using founder-owned DI/presets
- `WAVE_3_PLAN`, only after Wave 2 merges and reruns are complete

Overall wave status: mostly merge-ready with one branch sequencing/fix requirement.

Safe-to-merge branches: 001, 002, 003, 004, 006.

Branches needing fixes: 005, because `npm run lab:all` fails independently until the render directory placeholder is present.

Branches to reject: none.

P0/P1 issues: no P0; P1 for branch 005 missing render directory and separate critical npm audit review.

Safest merge order: 001, 002, 003, 004, 006, then 005 after combined rerun.

Next founder action: approve merging the five safe branches in order, require the combined rerun after 006, then decide whether to land 005 after its `lab:all` evidence is clean on the integrated tree.
