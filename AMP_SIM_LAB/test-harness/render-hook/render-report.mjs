import fs from "node:fs/promises";
import path from "node:path";
import { renderReportPaths } from "./render-adapter.mjs";

function statusClass(status) {
  if (status === "rendered" || status === "dry_run") {
    return "ok";
  }

  if (status === "blocked") {
    return "warn";
  }

  return "bad";
}

export function summarizeRenderResults(results) {
  const attempted = results.length;
  const succeeded = results.filter((result) => result.status === "rendered").length;
  const dryRuns = results.filter((result) => result.status === "dry_run").length;
  const blocked = results.filter((result) => result.status === "blocked").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const clippingCount = results.filter((result) => (result.metrics?.clippedSamples ?? 0) > 0).length;

  return {
    attempted,
    succeeded,
    dryRuns,
    blocked,
    failed,
    clippingCount,
    renderHookStatus: succeeded > 0 ? "real-render" : blocked > 0 ? "blocked" : "dry-run"
  };
}

export function createRenderResultsReport({ results, mode, source = "manual" }) {
  const summary = summarizeRenderResults(results);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source,
    mode,
    summary,
    results
  };
}

function createHtmlReport(report) {
  const rows = report.results
    .map((result) => `<tr>
  <td>${result.jobId}</td>
  <td>${result.presetId}</td>
  <td class="${statusClass(result.status)}">${result.status}</td>
  <td>${result.renderHookStatus}</td>
  <td>${result.outputDirectory}</td>
  <td>${result.processedWavPath || "(none)"}</td>
  <td>${result.metrics ? `${result.metrics.peakDbfs.toFixed(2)} dBFS` : "(none)"}</td>
  <td>${result.metrics ? result.metrics.clippedSamples : "(none)"}</td>
  <td>${result.messages.join("<br>")}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Render Results</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    .ok { color: #86efac; }
    .warn { color: #fde68a; }
    .bad { color: #fca5a5; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Render Results</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Source: ${report.source} | Mode: ${report.mode} | Hook: ${report.summary.renderHookStatus}</p>
  <p>Attempted: ${report.summary.attempted} | Succeeded: ${report.summary.succeeded} | Dry-run: ${report.summary.dryRuns} | Blocked: ${report.summary.blocked} | Failed: ${report.summary.failed} | Clipping: ${report.summary.clippingCount}</p>
  <table>
    <thead>
      <tr>
        <th>Job</th>
        <th>Preset</th>
        <th>Status</th>
        <th>Hook</th>
        <th>Output Folder</th>
        <th>Processed WAV</th>
        <th>Peak</th>
        <th>Clipped Samples</th>
        <th>Messages</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="9">No render results.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

export async function writeRenderResultsReport(report) {
  const paths = renderReportPaths();
  await fs.mkdir(path.dirname(paths.json), { recursive: true });
  await fs.writeFile(paths.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(paths.html, createHtmlReport(report), "utf8");
  return paths;
}
