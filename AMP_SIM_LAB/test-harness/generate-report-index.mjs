import fs from "node:fs/promises";
import path from "node:path";
import { generatedRoot, reportsDir } from "./lab-paths.mjs";
import { writeDemoClipPackReports } from "./demo-clip-pack.mjs";

const reportIndexPath = path.join(reportsDir, "index.html");

const reportLinks = [
  ["Beta Readiness", "beta-readiness.html", "beta-readiness.json", "Single-page docs-only private beta readiness summary."],
  ["Release Artifacts", "release-artifacts.html", "release-artifacts.json", "Standalone, plugin shell, VST3 bundle, installed VST3, and beta pack safety checks."],
  ["Known-Good Beta Recovery", "current-best-known-good-beta-recovery.md", "current-best-known-good-beta-recovery.json", "Exact missing known-good beta WAV evidence required for strict Current Best source parity."],
  ["Current Best A2 v1 Polish Gap", "current-best-a2-v1-polish-gap.md", "current-best-a2-v1-polish-gap.json", "Source-recovery probe comparison against available Current Best evidence. Not parity approval."],
  ["Render Safety", "render-safety.html", "render-safety.json", "Local safety validation for output paths, input immutability, GUI automation, and DSP edit flags."],
  ["Preset Validation", "preset-validation.html", "preset-validation.json", "Preset schema, category, naming, and safety checks."],
  ["Audio Metrics", "audio-metrics.html", "audio-metrics.json", "Peak, RMS, clipping, sample rate, and file format checks for founder-owned DI files."],
  ["DI Validation", "di-validation.html", "di-validation.json", "Starter DI readiness, missing files, clipping, noise floor, and naming recommendations."],
  ["Input Match", "input-match.html", "input-match.json", "Report-only DI calibration guidance for input level, clipping, noise, gain range, and gate starting point."],
  ["Audition Matrix", "audition-matrix.html", "audition-matrix.json", "Planned DI/preset render jobs for future offline audition rendering."],
  ["Demo Clip Pack", "demo-clips-index.html", "demo-clip-pack.json", "Internal founder review index for existing real-render clips, metrics, use cases, and rating placeholders."],
  ["Demo Audition", "demo-audition.html", null, "Internal-only dry-run and local render clip viewer for audition jobs."],
  ["Render Results", "render-results.html", "render-results.json", "Dry-run or real-render hook output, processed WAV locations, and render metrics."],
  ["Preset Audition Selection", "preset-audition-selection.html", "preset-audition-selection.json", "Founder-only worksheet for rating audition renders and marking beta-demo candidates without auto-ranking tone."],
  ["Baseline Compare", "baseline-compare.html", "baseline-compare.json", "Internal regression baseline comparison for render status and report-only technical metrics."],
  ["Founder Assets", "founder-assets.html", "founder-assets.json", "Private NAM, IR, screenshot, and note intake manifest for reference use only."],
  ["Reference Feedback Plan", "reference-feedback-plan.html", "reference-feedback-plan.json", "Founder-rated preset-only iteration plan generated from local review-sheet JSON."]
];

async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function summarizeReportStatus(json) {
  if (!json) {
    return { label: "ready", className: "ok", detail: "" };
  }

  const status = json.status ?? json.stage;
  const errors = json.summary?.errors ?? json.errors?.length ?? json.errors ?? 0;
  const blockers = json.summary?.blockers ?? json.blockers?.length ?? json.blockers ?? 0;
  const warnings = json.summary?.warnings ?? json.warnings?.length ?? json.warnings ?? 0;

  if (status && String(status).includes("blocked")) {
    return { label: "blocked", className: "bad", detail: status };
  }

  if (Number(errors) > 0 || Number(blockers) > 0) {
    return { label: "blocked", className: "bad", detail: `${errors} error(s), ${blockers} blocker(s)` };
  }

  if (Number(warnings) > 0) {
    return { label: "warning", className: "warn", detail: `${warnings} warning(s)${status ? `, ${status}` : ""}` };
  }

  if (status) {
    return { label: "ready", className: "ok", detail: status };
  }

  return { label: "ready", className: "ok", detail: "" };
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
    .warn { color: #fde68a; }
    .bad, .missing { color: #fca5a5; }
    .badge { display: inline-block; border: 1px solid currentColor; border-radius: 999px; padding: 2px 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    .detail { display: block; margin-top: 4px; color: #94a3b8; font-size: 12px; }
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

  for (const [label, fileName, jsonName, description] of reportLinks) {
    const exists = await fileExists(path.join(reportsDir, fileName));
    const json = jsonName ? await readJsonIfExists(path.join(reportsDir, jsonName)) : null;
    const status = exists ? summarizeReportStatus(json) : { label: "missing", className: "missing", detail: "" };
    rows.push(`<tr>
  <td>${exists ? `<a href="./${fileName}">${escapeHtml(label)}</a>` : escapeHtml(label)}</td>
  <td class="${status.className}"><span class="badge">${escapeHtml(status.label)}</span>${status.detail ? `<span class="detail">${escapeHtml(status.detail)}</span>` : ""}</td>
  <td>${escapeHtml(description)}</td>
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
