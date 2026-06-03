# Security Dependency Audit Fix Report

Date: 2026-06-03
Branch: `security/dependency-audit-fix`
Base branch: `factory/lab-foundation-checkpoint`

## Summary

- Affected package: `vitest`
- Old version: `3.2.4`
- New version: `4.1.0`
- Dependency type: direct dev dependency / test tooling
- Advisory: GHSA-5xrq-8626-4rwp
- Advisory title: When Vitest UI server is listening, arbitrary file can be read and executed
- Severity before fix: critical
- Vulnerable range from npm audit before fix: `<4.1.0`
- `fixAvailable` from npm audit before fix: `false`
- Fix strategy: manual targeted update to the minimum fixed major version identified from the audit vulnerable range and package metadata.

## Command Used

```powershell
npm.cmd install -D vitest@4.1.0 --cache "C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\.npm-temp-cache"
```

The temporary npm cache directory was removed after the targeted install.

Package metadata check:

```powershell
npm.cmd view vitest@4.1.0 version dist-tags --json --cache "C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\.npm-temp-cache"
```

Metadata confirmed `vitest@4.1.0` exists. The npm audit advisory range reported vulnerable versions as `<4.1.0`, so `4.1.0` was selected as the minimum fixed version.

## Package File Changes

- `package.json` changed: yes
- `package.json` exact diff summary: `devDependencies.vitest` changed from `^3.2.4` to `^4.1.0`
- `package-lock.json` changed: yes
- `package-lock.json` lockfile scope summary: root dependency changed only for `vitest`; lockfile updates were limited to `vitest@4.1.0` and its required Vitest/test-runner dependency graph.
- Unrelated dependencies changed: no

Observed lockfile package changes:

```text
added   node_modules/@standard-schema/spec  1.1.0
changed node_modules/@vitest/expect         3.2.4 -> 4.1.0
changed node_modules/@vitest/mocker         3.2.4 -> 4.1.0
changed node_modules/@vitest/pretty-format  3.2.4 -> 4.1.0
changed node_modules/@vitest/runner         3.2.4 -> 4.1.0
changed node_modules/@vitest/snapshot       3.2.4 -> 4.1.0
changed node_modules/@vitest/spy            3.2.4 -> 4.1.0
changed node_modules/@vitest/utils          3.2.4 -> 4.1.0
removed node_modules/cac                    6.7.14
changed node_modules/chai                   5.3.3 -> 6.2.2
removed node_modules/check-error            2.1.3
removed node_modules/deep-eql               5.0.2
changed node_modules/es-module-lexer        1.7.0 -> 2.1.0
removed node_modules/loupe                  3.2.1
added   node_modules/obug                   2.1.1
removed node_modules/pathval                2.0.1
changed node_modules/std-env                3.10.0 -> 4.1.0
removed node_modules/strip-literal          3.1.0
removed node_modules/strip-literal/node_modules/js-tokens  9.0.1
changed node_modules/tinyexec               0.3.2 -> 1.2.4
removed node_modules/tinypool               1.1.1
changed node_modules/tinyrainbow            2.0.0 -> 3.1.0
removed node_modules/tinyspy                4.0.4
removed node_modules/vite-node              3.2.4
changed node_modules/vitest                 3.2.4 -> 4.1.0
```

## npm Audit After Fix

- `npm audit --json`: pass
- Remaining findings: 0
- Remaining critical findings: 0

Audit summary after fix:

```text
info: 0
low: 0
moderate: 0
high: 0
critical: 0
total: 0
```

## Validation Results

- `npm audit --json`: passed, 0 vulnerabilities
- `npm run lab:report-index`: passed
- `npm run lab:all`: passed, 72 lab tests passed
- `npm run lab:render:safety`: passed, errors 0, warnings 0
- `npm run lab:validate-presets`: passed, errors 0, warnings 9
- `npm run lab:baseline:create`: passed, jobs stored 14
- `npm run lab:baseline:compare`: passed, compared jobs 14, render success changes 0
- `npm run lab:beta-readiness:strict`: passed, blockers 0, warnings 3
- `npm test -- --run`: passed, 13 test files passed, 64 tests passed, Vitest `v4.1.0`
- `npm run build`: passed

## Safety Confirmation

- DSP/core touched: no
- DI files touched: no
- Preset tone values touched: no
- Real render touched: no
- Public release, checkout, licensing, DRM, telemetry, analytics, auth, or cloud-sync code touched: no

## Rollback Plan

Rollback command:

```powershell
git revert <commit-hash-for-this-fix>
```

Manual rollback alternative:

```powershell
npm.cmd install -D vitest@3.2.4
```

After rollback, rerun:

```powershell
npm.cmd audit --json
npm.cmd test -- --run
npm.cmd run build
```

Note: reverting this fix will restore the known critical Vitest audit finding unless a different remediation is applied.

## Recommended Next Action

Keep `vitest@4.1.0` and merge this controlled dependency fix after review. No additional security dependency action is required for this advisory while `npm audit --json` reports zero vulnerabilities.
