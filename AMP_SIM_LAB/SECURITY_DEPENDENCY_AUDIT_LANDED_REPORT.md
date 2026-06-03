# Security Dependency Audit Landed Report

Date: 2026-06-03

## Landing Summary

- Fix branch merged: yes
- Fix branch: `security/dependency-audit-fix`
- Stable base branch: `factory/lab-foundation-checkpoint`
- Fix commit landed: `a05e9a29139ae14f821694c06f71c2fb40523f17`
- Merge commit hash: `e718a58eefcde6f3c70a7f87453150389b740e27`
- Merge command: `git merge --no-ff security/dependency-audit-fix -m "merge: land Vitest security audit fix"`

## Dependency Scope

- Old Vitest version: `^3.2.4` in `package.json`, `3.2.4` in `package-lock.json`
- New Vitest version: `^4.1.0` in `package.json`, `4.1.0` in `package-lock.json`
- Package.json changed: yes, Vitest only
- Package-lock.json changed: yes, Vitest/test-runner scope only
- Unrelated dependencies changed: no
- `npm audit fix` run: no
- `npm audit fix --force` run: no

## Security Result

- NPM audit after landing: pass
- Remaining audit findings: none
- Audit vulnerability counts after landing: info 0, low 0, moderate 0, high 0, critical 0, total 0

## Post-Merge Checks

- Post-merge checks pass: yes
- `npm audit --json`: pass
- `npm run lab:report-index`: pass
- `npm run lab:all`: pass
- `npm run lab:render:safety`: pass
- `npm run lab:validate-presets`: pass
- `npm run lab:baseline:create`: pass
- `npm run lab:baseline:compare`: pass
- `npm run lab:beta-readiness:strict`: pass
- `npm test -- --run`: pass
- `npm run build`: pass

## Product Safety Guardrails

- DSP/core touched by this landing task: no
- DI files touched by this landing task: no
- Preset tone values changed: no
- Tone behavior changed: no
- Gain staging changed: no
- Oversampling changed: no
- Saturation changed: no
- Tone stack changed: no
- Cab/IR behavior changed: no
- Checkout, licensing, DRM, telemetry, analytics, auth, cloud-sync, or public release code added: no

## Evidence

- Merge diff from first parent contained only:
  - `AMP_SIM_LAB/SECURITY_DEPENDENCY_AUDIT_FIX_REPORT.md`
  - `package.json`
  - `package-lock.json`
- `git merge-base --is-ancestor a05e9a29139ae14f821694c06f71c2fb40523f17 HEAD` returned success after the merge.
