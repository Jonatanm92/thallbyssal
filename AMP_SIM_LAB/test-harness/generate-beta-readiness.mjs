import fs from "node:fs/promises";
import path from "node:path";
import { createBetaReadinessReport } from "./beta-readiness.mjs";
import { betaPackPackageRoot, reportsDir } from "./lab-paths.mjs";

const reportPath = path.join(reportsDir, "beta-readiness.json");
const htmlPath = path.join(reportsDir, "beta-readiness.html");

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function readText(filePath, fallback = "") {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function listItems(items) {
  return items.map((item) => `<li>${item}</li>`).join("\n") || "<li>None.</li>";
}

function createHtmlReport(report) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Beta Readiness</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    .ok { color: #86efac; }
    .bad { color: #fca5a5; }
    .warn { color: #fde68a; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Beta Readiness</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p class="${report.summary.automatedPrivateBetaReady ? "ok" : "bad"}">Docs-only private beta validation ready: ${report.summary.automatedPrivateBetaReady ? "yes" : "no"}</p>
  <p class="bad">Public release ready: no</p>
  <table>
    <tbody>
      <tr><th>Starter DI ready</th><td>${report.summary.starterDiReady ? "yes" : "no"}</td></tr>
      <tr><th>Planned audition jobs</th><td>${report.summary.plannedAuditionJobs}</td></tr>
      <tr><th>Blocked audition jobs</th><td>${report.summary.blockedAuditionJobs}</td></tr>
      <tr><th>Presets</th><td>${report.summary.presets}</td></tr>
      <tr><th>Release artifacts</th><td>${report.summary.releaseArtifacts}</td></tr>
      <tr><th>Beta docs checks</th><td>${report.summary.betaDocsChecksPassed}/${report.summary.betaDocsChecks}</td></tr>
      <tr><th>Blockers</th><td>${report.summary.blockers}</td></tr>
      <tr><th>Warnings</th><td>${report.summary.warnings}</td></tr>
    </tbody>
  </table>
  <h2>Blockers</h2>
  <ul>${listItems(report.blockers)}</ul>
  <h2>Warnings</h2>
  <ul>${listItems(report.warnings)}</ul>
  <h2>Next Actions</h2>
  <ul>${listItems(report.nextActions)}</ul>
  <h2>Boundaries</h2>
  <ul>${listItems(report.boundaries)}</ul>
</body>
</html>`;
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });

  const report = createBetaReadinessReport({
    diValidation: await readJson(path.join(reportsDir, "di-validation.json")),
    auditionMatrix: await readJson(path.join(reportsDir, "audition-matrix.json")),
    presetValidation: await readJson(path.join(reportsDir, "preset-validation.json")),
    releaseArtifacts: await readJson(path.join(reportsDir, "release-artifacts.json")),
    betaManifest: await readJson(path.join(betaPackPackageRoot, "BETA_PACK_MANIFEST.json")),
    betaDocs: {
      betaTesterPacket: await readText(path.join(process.cwd(), "AMP_SIM_LAB", "BETA_TESTER_PACKET.md")),
      readmeBeta: await readText(path.join(process.cwd(), "AMP_SIM_LAB", "beta-pack", "README_BETA_TEMPLATE.md")),
      knownIssues: await readText(path.join(process.cwd(), "AMP_SIM_LAB", "beta-pack", "KNOWN_ISSUES.md")),
      feedbackForm: await readText(path.join(process.cwd(), "AMP_SIM_LAB", "beta-pack", "FEEDBACK_FORM.md"))
    }
  });

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtmlReport(report), "utf8");

  console.log(`AMP_SIM_LAB beta readiness report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB beta readiness HTML written: ${htmlPath}`);
  console.log(`Docs-only private beta validation ready: ${report.summary.automatedPrivateBetaReady ? "yes" : "no"}`);
  console.log(`Blockers: ${report.summary.blockers}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  if (process.argv.includes("--strict") && !report.summary.automatedPrivateBetaReady) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
