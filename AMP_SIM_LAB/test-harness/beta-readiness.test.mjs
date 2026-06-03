import test from "node:test";
import assert from "node:assert/strict";
import { createBetaDocsChecklist, createBetaReadinessReport } from "./beta-readiness.mjs";

const cleanBetaDocs = {
  betaTesterPacket: `
    Private beta disclaimer. This is beta software, not a public release, and there is no public release yet.
    Installation Instructions Placeholder from founder-approved private link with plugin rescan.
    Uninstall Instructions Placeholder says delete only the beta plugin file and plugin rescan.
    Supported OS/DAW Placeholder lists Windows 10/11 and REAPER.
    Privacy says do not include personal data or private sessions.
    No private data is collected beyond what the founder manually asks for later through private channels, and testers can choose not to send it.
    This beta has no telemetry, no analytics, no automatic or hidden data collection, and no automatic data collection.
    Public Claims Boundary: no public release claims and no exact modeled-amp claims.
  `,
  readmeBeta: `
    Private beta, not a public release. There is no public release yet.
    Installation Instructions Placeholder.
    Uninstall Instructions Placeholder.
    Supported OS/DAW Placeholder lists Windows 10/11 and REAPER.
    No public release claims and no exact modeled-amp claims.
    Do not include personal data, private sessions, telemetry, analytics, automatic data collection, or hidden data collection.
    No private data is collected beyond what the founder manually asks for later through private channels, and testers can choose not to send it.
  `,
  knownIssues: `
    Known Issues.
    Installer and uninstaller are placeholders.
    DAW coverage is not complete.
  `,
  feedbackForm: `
    DAW/OS Feedback Form with OS name and version plus DAW name and version.
    Tone Feedback Form with preset tested and most important tone fix.
    Bug Report Template with steps to reproduce and actual result.
  `
};

const cleanInputs = {
  diValidation: { summary: { starterReady: true, errors: 0, warnings: 4 } },
  auditionMatrix: { summary: { jobs: 8, blockedJobs: 0, skippedPresets: 0 } },
  presetValidation: { summary: { presets: 6, errors: 0, warnings: 0 } },
  releaseArtifacts: { summary: { artifacts: 5, errors: 0, warnings: 2 } },
  betaManifest: {
    containsPluginBinary: false,
    containsTelemetry: false,
    containsCheckoutOrLicensing: false,
    copied: ["BETA_TESTER_PACKET.md", "reports/di-validation.json"]
  },
  betaDocs: cleanBetaDocs
};

test("marks docs-only private beta validation ready when all automated gates pass", () => {
  const report = createBetaReadinessReport(cleanInputs);

  assert.equal(report.summary.automatedPrivateBetaReady, true);
  assert.equal(report.summary.publicReleaseReady, false);
  assert.equal(report.blockers.length, 0);
  assert.match(report.nextActions[0], /manual/i);
});

test("blocks private beta validation when DI starter files are not ready", () => {
  const inputs = structuredClone(cleanInputs);
  inputs.diValidation.summary.starterReady = false;
  inputs.diValidation.summary.errors = 1;

  const report = createBetaReadinessReport(inputs);

  assert.equal(report.summary.automatedPrivateBetaReady, false);
  assert.match(report.blockers.join("\n"), /DI starter/i);
});

test("blocks when beta package claims telemetry or checkout systems", () => {
  const inputs = structuredClone(cleanInputs);
  inputs.betaManifest.containsTelemetry = true;
  inputs.betaManifest.containsCheckoutOrLicensing = true;

  const report = createBetaReadinessReport(inputs);

  assert.equal(report.summary.automatedPrivateBetaReady, false);
  assert.match(report.blockers.join("\n"), /telemetry/i);
  assert.match(report.blockers.join("\n"), /checkout/i);
});

test("beta docs checklist requires hardening sections and blocks purchase prompts", () => {
  const checklist = createBetaDocsChecklist({
    ...cleanBetaDocs,
    feedbackForm: `${cleanBetaDocs.feedbackForm}\nWould you pay for this if issues were fixed:`
  });

  assert.equal(checklist.passed, checklist.checked - 1);
  assert.deepEqual(checklist.missing, ["no purchase or pricing prompt"]);
});

test("blocks private beta validation when beta docs are incomplete", () => {
  const inputs = structuredClone(cleanInputs);
  inputs.betaDocs = {
    betaTesterPacket: "This is beta software.",
    readmeBeta: "",
    knownIssues: "",
    feedbackForm: ""
  };

  const report = createBetaReadinessReport(inputs);

  assert.equal(report.summary.automatedPrivateBetaReady, false);
  assert.match(report.blockers.join("\n"), /Beta tester docs/i);
});
