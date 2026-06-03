function addBlocker(blockers, condition, message) {
  if (condition) {
    blockers.push(message);
  }
}

function addWarning(warnings, condition, message) {
  if (condition) {
    warnings.push(message);
  }
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function hasEvery(content, needles) {
  return needles.every((needle) => content.includes(needle));
}

export function createBetaDocsChecklist(betaDocs = {}) {
  const allContent = normalizeText(Object.values(betaDocs).join("\n\n"));
  const packetContent = normalizeText(betaDocs.betaTesterPacket);
  const readmeContent = normalizeText(betaDocs.readmeBeta);
  const knownIssuesContent = normalizeText(betaDocs.knownIssues);
  const feedbackContent = normalizeText(betaDocs.feedbackForm);

  const checks = [
    {
      name: "private beta disclaimer",
      passed: hasEvery(allContent, ["private beta", "beta software", "not a public release", "there is no public release yet"])
    },
    {
      name: "installation instructions placeholder",
      passed: hasEvery(packetContent, ["installation instructions placeholder", "founder-approved private link", "plugin rescan"])
    },
    {
      name: "uninstall instructions placeholder",
      passed: hasEvery(packetContent, ["uninstall instructions placeholder", "delete only the beta plugin file", "plugin rescan"])
    },
    {
      name: "supported OS/DAW placeholder",
      passed: hasEvery(allContent, ["supported os/daw placeholder", "windows 10/11", "reaper"])
    },
    {
      name: "known issues",
      passed: hasEvery(knownIssuesContent, ["known issues", "installer and uninstaller are placeholders", "daw coverage is not complete"])
    },
    {
      name: "DAW/OS feedback form",
      passed: hasEvery(feedbackContent, ["daw/os feedback form", "os name and version", "daw name and version"])
    },
    {
      name: "tone feedback form",
      passed: hasEvery(feedbackContent, ["tone feedback form", "preset tested", "most important tone fix"])
    },
    {
      name: "bug report template",
      passed: hasEvery(feedbackContent, ["bug report template", "steps to reproduce", "actual result"])
    },
    {
      name: "privacy and no private data guardrail",
      passed: hasEvery(allContent, ["do not include personal data", "private sessions", "no private data is collected beyond what the founder manually asks"])
    },
    {
      name: "manual-only feedback guardrail",
      passed: hasEvery(allContent, ["founder manually asks", "private channels", "testers can choose"])
    },
    {
      name: "no telemetry or analytics guardrail",
      passed: hasEvery(allContent, ["telemetry", "analytics", "automatic data collection", "no automatic or hidden data collection"])
    },
    {
      name: "no public release claims boundary",
      passed: hasEvery(allContent, ["no public release claims", "no exact modeled-amp claims"])
    },
    {
      name: "no purchase or pricing prompt",
      passed: !/\b(purchase signal|would you pay|fair intro price|fair full price|buy now)\b/i.test(allContent)
    },
    {
      name: "pack README mirrors beta boundary",
      passed: hasEvery(readmeContent, ["not a public release", "there is no public release yet", "installation instructions placeholder", "uninstall instructions placeholder"])
    }
  ];

  return {
    checked: checks.length,
    passed: checks.filter((check) => check.passed).length,
    missing: checks.filter((check) => !check.passed).map((check) => check.name),
    checks
  };
}

export function createBetaReadinessReport({
  generatedAt = new Date().toISOString(),
  diValidation,
  auditionMatrix,
  presetValidation,
  releaseArtifacts,
  betaManifest,
  betaDocs
}) {
  const blockers = [];
  const warnings = [];
  const betaDocsChecklist = createBetaDocsChecklist(betaDocs);

  addBlocker(blockers, !diValidation?.summary?.starterReady, "DI starter set is not ready.");
  addBlocker(blockers, (diValidation?.summary?.errors ?? 0) > 0, `DI validation has ${diValidation?.summary?.errors ?? 0} error(s).`);
  addBlocker(blockers, (auditionMatrix?.summary?.blockedJobs ?? 0) > 0, `Audition matrix has ${auditionMatrix?.summary?.blockedJobs ?? 0} blocked job(s).`);
  addBlocker(blockers, (presetValidation?.summary?.errors ?? 0) > 0, `Preset validation has ${presetValidation?.summary?.errors ?? 0} error(s).`);
  addBlocker(blockers, (releaseArtifacts?.summary?.errors ?? 0) > 0, `Release artifact validation has ${releaseArtifacts?.summary?.errors ?? 0} error(s).`);
  addBlocker(blockers, betaManifest?.containsTelemetry !== false, "Beta package must not include telemetry.");
  addBlocker(blockers, betaManifest?.containsCheckoutOrLicensing !== false, "Beta package must not include checkout, licensing, DRM, or auth systems.");
  addBlocker(blockers, betaManifest?.containsPluginBinary !== false, "Current beta package must remain docs-only until founder approves binary packaging.");
  addBlocker(
    blockers,
    betaDocsChecklist.missing.length > 0,
    `Beta tester docs are missing required private-beta sections: ${betaDocsChecklist.missing.join(", ")}.`
  );

  addWarning(warnings, (diValidation?.summary?.warnings ?? 0) > 0, `DI validation has ${diValidation?.summary?.warnings ?? 0} warning(s).`);
  addWarning(warnings, (releaseArtifacts?.summary?.warnings ?? 0) > 0, `Release artifact validation has ${releaseArtifacts?.summary?.warnings ?? 0} warning(s).`);
  addWarning(warnings, (presetValidation?.summary?.warnings ?? 0) > 0, `Preset validation has ${presetValidation?.summary?.warnings ?? 0} warning(s).`);
  addWarning(warnings, (auditionMatrix?.summary?.skippedPresets ?? 0) > 0, `Audition matrix skipped ${auditionMatrix?.summary?.skippedPresets ?? 0} preset(s).`);

  const automatedPrivateBetaReady = blockers.length === 0;

  return {
    schemaVersion: 1,
    generatedAt,
    stage: automatedPrivateBetaReady ? "docs-only-private-beta-validation-ready" : "blocked",
    summary: {
      automatedPrivateBetaReady,
      publicReleaseReady: false,
      blockers: blockers.length,
      warnings: warnings.length,
      starterDiReady: Boolean(diValidation?.summary?.starterReady),
      plannedAuditionJobs: auditionMatrix?.summary?.jobs ?? 0,
      blockedAuditionJobs: auditionMatrix?.summary?.blockedJobs ?? 0,
      presets: presetValidation?.summary?.presets ?? 0,
      releaseArtifacts: releaseArtifacts?.summary?.artifacts ?? 0,
      betaDocsChecks: betaDocsChecklist.checked,
      betaDocsChecksPassed: betaDocsChecklist.passed
    },
    betaDocsChecklist,
    blockers,
    warnings,
    nextActions: automatedPrivateBetaReady
      ? [
          "Run manual standalone smoke test with the founder's interface/input/output.",
          "Founder reviews tone and UI behavior before any binary beta package.",
          "Choose whether to wire offline plugin rendering for the audition matrix."
        ]
      : [
          "Resolve blockers listed in this report.",
          "Re-run npm run lab:all.",
          "Do not package binaries or create public launch material yet."
        ],
    boundaries: [
      "No public release approval is implied by this report.",
      "No checkout, licensing server, telemetry, cloud sync, or DRM has been added.",
      "The founder owns sound decisions; this report only checks internal lab readiness."
    ]
  };
}
