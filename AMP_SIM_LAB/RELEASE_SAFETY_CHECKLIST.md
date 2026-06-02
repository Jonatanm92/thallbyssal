# Release Safety Checklist

Use before any public beta, paid beta, or first paid validation.

## Technical Safety

- [ ] `npm run lab:release` passes.
- [ ] `npm run lab:beta-readiness:strict` passes for docs-only private beta validation.
- [ ] `npm run lab:di:strict` passes with founder-owned DI files.
- [ ] Crash-free smoke test completed.
- [ ] Preset load test completed.
- [ ] Audio regression report generated.
- [ ] DI validation report generated.
- [ ] Audition matrix generated with no blocked starter jobs.
- [ ] Installer or package check completed.
- [ ] Plugin scan in REAPER completed.
- [ ] Plugin scan in at least one other DAW completed.
- [ ] Standalone launch test completed.
- [ ] Mono/stereo test completed.
- [ ] Bypass test completed.
- [ ] Automation stability test completed.
- [ ] Versioned changelog written.

## Asset And Claim Safety

- [ ] No copyrighted assets.
- [ ] No copyrighted riffs.
- [ ] No downloaded samples without license.
- [ ] No unlicensed IRs.
- [ ] No trademark-infringing names.
- [ ] No competitor logos or product names.
- [ ] No false modeling claims.
- [ ] No "sounds exactly like [brand/model]" claims.
- [ ] Public copy approved by founder.

## Beta Safety

- [ ] Beta disclaimer included.
- [ ] Known issues included.
- [ ] Uninstall instructions included.
- [ ] Feedback form included.
- [ ] No telemetry or private data collection added.
- [ ] No checkout/licensing/DRM added.
