import fs from "node:fs/promises";
import path from "node:path";
import { betaPackPackageRoot, diInputDir, generatedRoot, labRoot, reportsDir } from "./lab-paths.mjs";

const dashboardPath = path.join(labRoot, "AMP_SIM_LAB_DASHBOARD.md");

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(relativePath, "utf8"));
  } catch {
    return fallback;
  }
}

function statusLabel(errors = 0, warnings = 0) {
  if (errors > 0) {
    return `Blocked: ${errors} error(s)`;
  }

  if (warnings > 0) {
    return `Pass with ${warnings} warning(s)`;
  }

  return "Pass";
}

function yesNo(value) {
  return value ? "yes" : "no";
}

async function main() {
  const audioMetrics = await readJson(path.join(reportsDir, "audio-metrics.json"), { files: [], renderHook: "missing" });
  const diValidation = await readJson(path.join(reportsDir, "di-validation.json"), {
    summary: { starterReady: false, matchedSlots: 0, requiredSlots: 3, errors: 0, warnings: 0 }
  });
  const auditionMatrix = await readJson(path.join(reportsDir, "audition-matrix.json"), {
    summary: { jobs: 0, blockedJobs: 0, skippedPresets: 0, renderHook: "missing" }
  });
  const presetValidation = await readJson(path.join(reportsDir, "preset-validation.json"), { summary: { presets: 0, errors: 0, warnings: 0 } });
  const releaseArtifacts = await readJson(path.join(reportsDir, "release-artifacts.json"), {
    versions: { packageJson: "unknown", nativeCmake: "unknown" },
    artifacts: [],
    summary: { errors: 0, warnings: 0 }
  });
  const betaReadiness = await readJson(path.join(reportsDir, "beta-readiness.json"), {
    summary: { automatedPrivateBetaReady: false, publicReleaseReady: false, blockers: 0, warnings: 0 }
  });
  const renderResults = await readJson(path.join(reportsDir, "render-results.json"), {
    summary: {
      renderHookStatus: "not-run",
      attempted: 0,
      succeeded: 0,
      failed: 0,
      blocked: 0,
      dryRuns: 0,
      clippingCount: 0
    },
    results: []
  });
  const baselineCompare = await readJson(path.join(reportsDir, "baseline-compare.json"), {
    summary: { comparedJobs: 0, renderSuccessChanges: 0 },
    generatedAt: null
  });
  const betaManifest = await readJson(path.join(betaPackPackageRoot, "BETA_PACK_MANIFEST.json"), {
    containsPluginBinary: false,
    containsTelemetry: false,
    containsCheckoutOrLicensing: false,
    copied: []
  });

  const artifactNames = releaseArtifacts.artifacts
    .filter((artifact) => artifact.exists)
    .map((artifact) => artifact.name)
    .join(", ") || "No native artifacts found";

  const wavCount = audioMetrics.files?.length ?? 0;
  const presetCount = presetValidation.summary?.presets ?? 0;
  const releaseStatus = statusLabel(releaseArtifacts.summary?.errors ?? 0, releaseArtifacts.summary?.warnings ?? 0);
  const presetStatus = statusLabel(presetValidation.summary?.errors ?? 0, presetValidation.summary?.warnings ?? 0);
  const betaDocsReady = (betaManifest.copied?.length ?? 0) > 0 && betaManifest.containsPluginBinary === false;
  const renderHookStatus = renderResults.summary?.renderHookStatus ?? "not-run";
  const safeHeadlessMissing = (renderResults.results ?? []).some((result) =>
    (result.messages ?? []).some((message) => /no safe headless\/offline render entrypoint/i.test(message))
  );
  const baselineStatus = baselineCompare.generatedAt
    ? `Compared ${baselineCompare.summary?.comparedJobs ?? 0} job(s); render success changes: ${baselineCompare.summary?.renderSuccessChanges ?? 0}.`
    : "No baseline comparison created yet.";
  const generatedAt = new Date().toISOString();
  const nextDecision =
    renderHookStatus === "real-render"
      ? "Founder auditions processed WAV files and approves whether the current internal preset mappings are useful for continued lab/demo work."
      : renderHookStatus === "blocked" || safeHeadlessMissing
      ? "Founder approves or provides a safe headless/offline render entrypoint. GUI automation remains forbidden."
      : wavCount === 0
      ? "Founder adds owned DI files when ready."
      : diValidation.summary?.starterReady
        ? "Founder approves whether to connect offline plugin render hook or add the next DI category."
        : "Founder fixes DI validation issues before strict audio regression.";

  const markdown = `# AMP SIM LAB Dashboard

AMP_SIM_LAB is the internal factory around Thallbyssal. It accelerates testing, demos, beta feedback, reports, and market validation without replacing the founder-led tone/design process.

Core rule: **the founder owns the sound. The factory owns test automation, reports, preset validation, demo generation, beta packaging, and validation assets.**

Generated: ${generatedAt}

Generated output root: \`${generatedRoot}\`

DI input folder: \`${diInputDir}\`

## Current Snapshot

| Area | Status |
| --- | --- |
| Current build status | ${releaseStatus}. Artifacts: ${artifactNames}. |
| Current audio engine version | package.json ${releaseArtifacts.versions?.packageJson ?? "unknown"} / native ${releaseArtifacts.versions?.nativeCmake ?? "unknown"} |
| Plugin format targets | Windows Standalone, Windows VST3. AU/macOS later. AAX later. |
| Test coverage status | Lab structure, harness unit tests, WAV metrics, DI validation, audition matrix, preset validation, beta-pack placeholder, and release artifact validation are automated. React/domain tests remain separate. |
| Preset count | ${presetCount} internal placeholder preset(s). Preset validation: ${presetStatus}. |
| DI validation status | Starter ready: ${yesNo(diValidation.summary?.starterReady)}. Matched ${diValidation.summary?.matchedSlots ?? 0}/${diValidation.summary?.requiredSlots ?? 3}. Errors: ${diValidation.summary?.errors ?? 0}. Warnings: ${diValidation.summary?.warnings ?? 0}. |
| Audition matrix status | Planned jobs: ${auditionMatrix.summary?.jobs ?? 0}. Blocked jobs: ${auditionMatrix.summary?.blockedJobs ?? 0}. Skipped presets: ${auditionMatrix.summary?.skippedPresets ?? 0}. |
| Render hook status | ${renderHookStatus}. Attempted: ${renderResults.summary?.attempted ?? 0}. Succeeded: ${renderResults.summary?.succeeded ?? 0}. Failed: ${renderResults.summary?.failed ?? 0}. Blocked: ${renderResults.summary?.blocked ?? 0}. Dry-run: ${renderResults.summary?.dryRuns ?? 0}. Clipping count: ${renderResults.summary?.clippingCount ?? 0}. |
| Regression baseline status | ${baselineStatus} |
| Render demo status | ${wavCount} founder-owned WAV file(s) found. Headless render: ${renderHookStatus}. |
| Beta readiness status | Docs-only beta pack placeholder: ${yesNo(betaDocsReady)}. Contains plugin binary: ${yesNo(betaManifest.containsPluginBinary)}. Telemetry: ${yesNo(betaManifest.containsTelemetry)}. Checkout/licensing: ${yesNo(betaManifest.containsCheckoutOrLicensing)}. |
| Automated private beta validation | Ready: ${yesNo(betaReadiness.summary?.automatedPrivateBetaReady)}. Blockers: ${betaReadiness.summary?.blockers ?? 0}. Warnings: ${betaReadiness.summary?.warnings ?? 0}. Public release ready: ${yesNo(betaReadiness.summary?.publicReleaseReady)}. |
| Market validation status | Not started. 20-tester plan and copy drafts are in \`MARKET_VALIDATION_PLAN.md\`. |
| Next decision required | ${nextDecision} |

## Latest Reports

- \`${path.join(reportsDir, "audio-metrics.json")}\`
- \`${path.join(reportsDir, "di-validation.json")}\`
- \`${path.join(reportsDir, "audition-matrix.json")}\`
- \`${path.join(reportsDir, "render-results.json")}\`
- \`${path.join(reportsDir, "render-safety.json")}\`
- \`${path.join(reportsDir, "baseline-compare.json")}\`
- \`${path.join(reportsDir, "preset-validation.json")}\`
- \`${path.join(reportsDir, "release-artifacts.json")}\`
- \`${path.join(reportsDir, "beta-readiness.json")}\`
- \`${path.join(reportsDir, "index.html")}\`
- \`${path.join(betaPackPackageRoot, "BETA_PACK_MANIFEST.json")}\`

## Lab Commands

\`\`\`bash
npm run lab:all
npm run lab:validate
npm run lab:metrics
npm run lab:di
npm run lab:founder-assets
npm run lab:audition
npm run lab:audition:render
npm run lab:reference:pack
npm run lab:reference:serve
npm run lab:reference:feedback:plan -- --feedback path\\to\\thallbyssal-founder-tone-feedback.json
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
\`\`\`

## Lab Boundaries

- Do not redesign the core sound/DSP without explicit approval.
- Do not use copyrighted riffs, samples, IRs, brand names, logos, or amp trademarks.
- Do not claim to model specific real amps unless permission and evidence exist.
- Do not build checkout, licensing server, auth, telemetry, analytics, cloud sync, or DRM yet.
- Do not collect private user data.
- Do not use paid APIs.
- Do not create public launch material without founder approval.
- Do not make "sounds exactly like [brand/model]" claims.
`;

  await fs.writeFile(dashboardPath, markdown, "utf8");
  console.log(`AMP_SIM_LAB dashboard updated: ${dashboardPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
