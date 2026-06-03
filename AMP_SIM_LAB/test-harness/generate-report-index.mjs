import fs from "node:fs/promises";
import path from "node:path";
import { generatedRoot, reportsDir } from "./lab-paths.mjs";
import { writeDemoClipPackReports } from "./demo-clip-pack.mjs";

const reportIndexPath = path.join(reportsDir, "index.html");

const reportLinks = [
  ["Audio Metrics", "audio-metrics.html", "Peak, RMS, clipping, sample rate, and file format checks for founder-owned DI files."],
  ["DI Validation", "di-validation.html", "Starter DI readiness, missing files, clipping, noise floor, and naming recommendations."],
  ["Audition Matrix", "audition-matrix.html", "Planned DI/preset render jobs for future offline audition rendering."],
  ["Demo Clip Pack", "demo-clips-index.html", "Internal founder review index for existing real-render clips, metrics, use cases, and rating placeholders."],
  ["Demo Audition", "demo-audition.html", "Internal-only dry-run and local render clip viewer for audition jobs."],
  ["Render Results", "render-results.html", "Dry-run or real-render hook output, processed WAV locations, and render metrics."],
  ["Render Safety", "render-safety.html", "Local safety validation for output paths, input immutability, GUI automation, and DSP edit flags."],
  ["Baseline Compare", "baseline-compare.html", "Internal regression baseline comparison for render status and report-only technical metrics."],
  ["Preset Validation", "preset-validation.html", "Preset schema, category, naming, and safety checks."],
  ["Founder Assets", "founder-assets.html", "Private NAM, IR, screenshot, and note intake manifest for reference use only."],
  ["Reference Feedback Plan", "reference-feedback-plan.html", "Founder-rated preset-only iteration plan generated from local review-sheet JSON."],
  ["Release Artifacts", "release-artifacts.html", "Standalone, plugin shell, VST3 bundle, installed VST3, and beta pack safety checks."],
  ["Beta Readiness", "beta-readiness.html", "Single-page docs-only private beta readiness summary."]
];

async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function findLatestListeningPack() {
  const packSources = [
    path.join(generatedRoot, "listening-packs", "ir-reference-auditions"),
    path.join(generatedRoot, "listening-packs", "reference-candidates")
  ];

  const candidates = [];
  for (const root of packSources) {
    let entries = [];

    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packRoot = path.join(root, entry.name);
      const htmlPath = (await fileExists(path.join(packRoot, "index.html")))
        ? path.join(packRoot, "index.html")
        : path.join(packRoot, "audition.html");
      if (await fileExists(htmlPath)) {
        const stats = await fs.stat(htmlPath);
        candidates.push({ htmlPath, modifiedMs: stats.mtimeMs });
      }
    }
  }

  candidates.sort((a, b) => b.modifiedMs - a.modifiedMs);
  return candidates[0]?.htmlPath ?? null;
}

function createHtml(rows, generatedAt) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Reports</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; max-width: 1120px; }
    h1 { margin-bottom: 4px; }
    p { color: #aab7c4; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border: 1px solid #334155; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    a { color: #93c5fd; }
    .ok { color: #86efac; }
    .missing { color: #fca5a5; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Reports</h1>
  <p>Generated: ${generatedAt}</p>
  <p>Local-only report index for Thallbyssal validation. External sharing is not approved by this page.</p>
  <table>
    <thead>
      <tr>
        <th>Report</th>
        <th>Status</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

async function main() {
  await writeDemoClipPackReports();
  await fs.mkdir(reportsDir, { recursive: true });
  const rows = [];

  for (const [label, fileName, description] of reportLinks) {
    const exists = await fileExists(path.join(reportsDir, fileName));
    rows.push(`<tr>
  <td>${exists ? `<a href="./${fileName}">${label}</a>` : label}</td>
  <td class="${exists ? "ok" : "missing"}">${exists ? "ready" : "missing"}</td>
  <td>${description}</td>
</tr>`);
  }

  const latestListeningPack = await findLatestListeningPack();
  rows.push(`<tr>
  <td>${latestListeningPack ? `<a href="${latestListeningPack.replaceAll("\\", "/")}">Reference Listening Pack</a>` : "Reference Listening Pack"}</td>
  <td class="${latestListeningPack ? "ok" : "missing"}">${latestListeningPack ? "ready" : "missing"}</td>
  <td>Latest private level-matched A/B listening page with audio players for founder-owned references and Thallbyssal candidates.</td>
</tr>`);

  await fs.writeFile(reportIndexPath, createHtml(rows.join("\n"), new Date().toISOString()), "utf8");
  console.log(`AMP_SIM_LAB report index written: ${reportIndexPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
