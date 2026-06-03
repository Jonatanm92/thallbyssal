# Wave 2 Render Safety Blocker Report

Date: 2026-06-03

## Branch

- Branch: `fix/wave2-render-safety-blocker`
- Started from: `integration/wave2-safe-merge`
- Integration commit inspected: `7060b528953a351f370977d94db3d0a57c640185`
- Branch `005` merged: no

## Original failure

Command:

```sh
npm run lab:render:safety
```

Result before fix:

- Errors: 14
- Warnings: 0
- JSON report: `D:\CodexBuilds\thallbyssal-lab\reports\render-safety.json`
- HTML report: `D:\CodexBuilds\thallbyssal-lab\reports\render-safety.html`

Exact original 14 errors:

1. `Public release/checkout/licensing/auth/telemetry indicator /public\s+(launch|release)/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
2. `Public release/checkout/licensing/auth/telemetry indicator /telemetry/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
3. `Public release/checkout/licensing/auth/telemetry indicator /analytics/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
4. `Public release/checkout/licensing/auth/telemetry indicator /\bauth\b/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
5. `Public release/checkout/licensing/auth/telemetry indicator /checkout/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
6. `Public release/checkout/licensing/auth/telemetry indicator /licensing\s+server/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
7. `Public release/checkout/licensing/auth/telemetry indicator /cloud\s+sync/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
8. `Public release/checkout/licensing/auth/telemetry indicator /\bdrm\b/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.mjs`
9. `Public release/checkout/licensing/auth/telemetry indicator /public\s+(launch|release)/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.test.mjs`
10. `Public release/checkout/licensing/auth/telemetry indicator /telemetry/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.test.mjs`
11. `Public release/checkout/licensing/auth/telemetry indicator /analytics/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.test.mjs`
12. `Public release/checkout/licensing/auth/telemetry indicator /checkout/i found in changed source: AMP_SIM_LAB/test-harness/beta-readiness.test.mjs`
13. `Public release/checkout/licensing/auth/telemetry indicator /public\s+(launch|release)/i found in changed source: AMP_SIM_LAB/test-harness/preset-validation.test.mjs`
14. `Public release/checkout/licensing/auth/telemetry indicator /public\s+(launch|release)/i found in changed source: AMP_SIM_LAB/test-harness/validate-presets.mjs`

## Root cause

The render-safety branch validator added in Wave 2 scans changed executable lab sources for public release, checkout, licensing, auth, telemetry, analytics, cloud-sync, and DRM indicators.

Wave 2 beta and preset hardening also added lab validators and tests that intentionally mention those same terms as negative guardrails. The safety scanner treated those guardrail strings as implementation indicators.

This is a validator false positive caused by the Wave 2 render-safety validator interacting with Wave 2 beta/preset safety hardening. It was not caused by `AMP_SIM_LAB/renders/.gitkeep`, generated render metadata, output path policy, dry-run baseline artifacts, tracked audio files, DSP/core files, DI files, or real render behavior.

## Classification

All 14 original errors are classified as:

- B. validator false positive

No original error was classified as:

- A. real safety issue
- C. allowed placeholder issue
- D. generated artifact tracking issue
- E. output path policy mismatch
- F. unknown / needs founder decision

## Fix

Changed render-safety branch scanning so exact lab guardrail validator sources may contain public-system policy terms without failing the public-system source-pattern check.

Exact files treated as lab guardrail policy sources:

- `AMP_SIM_LAB/test-harness/beta-readiness.mjs`
- `AMP_SIM_LAB/test-harness/beta-readiness.test.mjs`
- `AMP_SIM_LAB/test-harness/preset-validation.test.mjs`
- `AMP_SIM_LAB/test-harness/validate-presets.mjs`

The fix does not exempt those files from GUI automation or fake render/copy checks. A regression test verifies that public-system policy wording is ignored only for those guardrail files while `playwright` and copy-render indicators still fail.

## Files changed

- `AMP_SIM_LAB/test-harness/render-hook/render-safety.mjs`
- `AMP_SIM_LAB/test-harness/render-hook/render-hook.test.mjs`
- `AMP_SIM_LAB/WAVE_2_RENDER_SAFETY_BLOCKER_REPORT.md`

## Why the fix is safe

- Keeps DSP/core protection unchanged.
- Keeps DI/audio/user asset protection unchanged.
- Keeps render output path validation unchanged.
- Keeps processed WAV provenance and fake copy-render validation unchanged.
- Keeps GUI automation validation unchanged.
- Keeps public-system scanning active for ordinary changed executable source.
- Does not allow `AMP_SIM_LAB/renders/*`; only the already tracked `.gitkeep` remains allowed by `.gitignore`.
- Does not allow `processed.wav` or DI WAV/AIF/FLAC files to be tracked.
- Does not connect or change real render behavior.

## Remaining blocked

- Branch `005` remains unmerged in this task.
- Wave 3 remains unstarted.
- Public release, checkout, licensing, DRM, telemetry, analytics, auth, and cloud sync remain out of scope and blocked.
- Real render connection behavior was not changed.

## Can 005 now be merged?

Yes, recommendation is that `005` can be retried after this fix is merged into `integration/wave2-safe-merge` and the pre-005 checks are rerun on that integration branch.

## Tests run

- `npm run lab:render:safety` - pass, 0 errors, 0 warnings
- `npm run lab:all` - pass
- `npm run lab:validate-presets` - pass, 0 errors, 9 warnings
- `npm run lab:baseline:create` - pass
- `npm run lab:baseline:compare` - pass, render success changes 0
- `npm run lab:beta-readiness:strict` - pass, blockers 0, warnings 3
- `npm test -- --run` - pass, 13 files, 64 tests
- `npm run build` - pass

## Safety checklist

- `package.json` changed: no
- `package-lock.json` changed: no
- DSP/core touched: no
- DI files touched: no
- Preset tone values touched: no
- Generated heavy/audio files tracked: no

## Final recommendation

Merge `fix/wave2-render-safety-blocker` into `integration/wave2-safe-merge`, then retry the pre-005 validation and only then consider merging `005`.
