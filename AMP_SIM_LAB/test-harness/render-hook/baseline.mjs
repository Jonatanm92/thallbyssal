import fs from "node:fs/promises";
import path from "node:path";
import { generatedRoot, reportsDir } from "../lab-paths.mjs";

const baselinesDir = path.join(generatedRoot, "baselines");
const renderResultsPath = path.join(reportsDir, "render-results.json");
const baselineLatestPath = path.join(reportsDir, "baseline-latest.json");
const createJsonPath = path.join(reportsDir, "baseline-create.json");
const createHtmlPath = path.join(reportsDir, "baseline-create.html");
const compareJsonPath = path.join(reportsDir, "baseline-compare.json");
const compareHtmlPath = path.join(reportsDir, "baseline-compare.html");
const metricFields = ["peakDbfs", "rmsDbfs", "lufsEstimate", "clippedSamples"];
const metricLabels = {
  peakDbfs: "Peak (dBFS)",
  rmsDbfs: "RMS (dBFS)",
  lufsEstimate: "LUFS-estimate",
  clippedSamples: "Clipping (samples)"
};

function timestampId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function metricDelta(current, baseline, field) {
  const currentValue = current?.metrics?.[field];
  const baselineValue = baseline?.metrics?.[field];

  if (typeof currentValue !== "number" || typeof baselineValue !== "number") {
    return null;
  }

  return currentValue - baselineValue;
}

function renderSuccess(status) {
  return status === "rendered";
}

function pickMetrics(result) {
  return Object.fromEntries(metricFields.map((field) => [field, result?.metrics?.[field] ?? null]));
}

function fileReferences(result) {
  return {
    inputPath: result?.inputPath ?? null,
    presetPath: result?.presetPath ?? null,
    processedWavPath: result?.processedWavPath ?? null,
    outputDirectory: result?.outputDirectory ?? null
  };
}

function html(value) {
  return String(value ?? "(none)")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function metricValue(value) {
  return typeof value === "number" ? Number(value.toFixed(3)) : null;
}

function metricDisplay(value) {
  return typeof value === "number" ? html(value.toFixed(3)) : "(n/a)";
}

export function createBaselineSnapshotReport(current, baselinePath) {
  const jobs = (current?.results ?? []).map((result) => ({
    jobId: result.jobId,
    renderStatus: result.status,
    renderSuccess: renderSuccess(result.status),
    fileReferences: fileReferences(result),
    metrics: pickMetrics(result)
  }));

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    baselinePath,
    currentGeneratedAt: current?.generatedAt ?? null,
    metricFields,
    jobs,
    summary: {
      jobs: jobs.length,
      rendered: jobs.filter((job) => job.renderSuccess).length,
      failed: jobs.filter((job) => job.renderStatus === "failed").length,
      clipping: jobs.filter((job) => (job.metrics.clippedSamples ?? 0) > 0).length
    }
  };
}

export function createBaselineCompareReport(current, baseline) {
  const baselineByJob = new Map((baseline?.results ?? []).map((result) => [result.jobId, result]));
  const comparisons = (current?.results ?? []).map((result) => {
    const baselineResult = baselineByJob.get(result.jobId);
    const currentStatus = result.status;
    const baselineStatus = baselineResult?.status ?? "missing";
    return {
      jobId: result.jobId,
      current: {
        renderStatus: currentStatus,
        renderSuccess: renderSuccess(currentStatus),
        fileReferences: fileReferences(result),
        metrics: pickMetrics(result)
      },
      baseline: {
        renderStatus: baselineStatus,
        renderSuccess: Boolean(baselineResult) && renderSuccess(baselineStatus),
        fileReferences: fileReferences(baselineResult),
        metrics: pickMetrics(baselineResult)
      },
      deltas: Object.fromEntries(metricFields.map((field) => [field, metricValue(metricDelta(result, baselineResult, field))])),
      renderSuccess: {
        current: renderSuccess(currentStatus),
        baseline: Boolean(baselineResult) && renderSuccess(baselineStatus),
        changed: Boolean(baselineResult) && renderSuccess(currentStatus) !== renderSuccess(baselineStatus)
      }
    };
  });

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    baselineGeneratedAt: baseline?.generatedAt ?? null,
    currentGeneratedAt: current?.generatedAt ?? null,
    metricFields,
    comparisons,
    summary: {
      comparedJobs: comparisons.length,
      missingBaselineJobs: comparisons.filter((comparison) => comparison.baseline.renderStatus === "missing").length,
      renderSuccessChanges: comparisons.filter((comparison) => comparison.renderSuccess.changed).length,
      clippingChanges: comparisons.filter((comparison) => (comparison.deltas.clippedSamples ?? 0) !== 0).length
    }
  };
}

function createSnapshotHtml(report) {
  const metricHeaders = metricFields.map((field) => `<th>${html(metricLabels[field])}</th>`).join("");
  const rows = report.jobs
    .map((job) => `<tr>
  <td>${html(job.jobId)}</td>
  <td>${html(job.renderStatus)}</td>
  <td>${job.renderSuccess ? "yes" : "no"}</td>
  ${metricFields.map((field) => `<td>${metricDisplay(job.metrics[field])}</td>`).join("")}
  <td>${html(job.fileReferences.inputPath)}</td>
  <td>${html(job.fileReferences.presetPath)}</td>
  <td>${html(job.fileReferences.processedWavPath)}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Baseline Create</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Baseline Create</h1>
  <p>Generated: ${html(report.generatedAt)}</p>
  <p>Baseline file: ${html(report.baselinePath)}</p>
  <p>Jobs: ${report.summary.jobs} | Rendered: ${report.summary.rendered} | Failed: ${report.summary.failed} | Clipping: ${report.summary.clipping}</p>
  <table>
    <thead>
      <tr>
        <th>Job</th>
        <th>Render Status</th>
        <th>Render Success</th>
        ${metricHeaders}
        <th>Input File</th>
        <th>Preset File</th>
        <th>Processed WAV</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="${7 + metricFields.length}">No baseline jobs.</td></tr>`}</tbody>
  </table>
</body>
</html>`;
}

function createCompareHtml(report) {
  const rows = report.comparisons
    .map((comparison) => `<tr>
  <td>${html(comparison.jobId)}</td>
  <td>${html(comparison.current.renderStatus)}</td>
  <td>${comparison.current.renderSuccess ? "yes" : "no"}</td>
  <td>${html(comparison.baseline.renderStatus)}</td>
  <td>${comparison.baseline.renderSuccess ? "yes" : "no"}</td>
  <td>${comparison.renderSuccess.changed ? "yes" : "no"}</td>
  <td>${metricDisplay(comparison.current.metrics.peakDbfs)}</td>
  <td>${metricDisplay(comparison.baseline.metrics.peakDbfs)}</td>
  <td>${metricDisplay(comparison.deltas.peakDbfs)}</td>
  <td>${metricDisplay(comparison.current.metrics.rmsDbfs)}</td>
  <td>${metricDisplay(comparison.baseline.metrics.rmsDbfs)}</td>
  <td>${metricDisplay(comparison.deltas.rmsDbfs)}</td>
  <td>${metricDisplay(comparison.current.metrics.lufsEstimate)}</td>
  <td>${metricDisplay(comparison.baseline.metrics.lufsEstimate)}</td>
  <td>${metricDisplay(comparison.deltas.lufsEstimate)}</td>
  <td>${metricDisplay(comparison.current.metrics.clippedSamples)}</td>
  <td>${metricDisplay(comparison.baseline.metrics.clippedSamples)}</td>
  <td>${metricDisplay(comparison.deltas.clippedSamples)}</td>
  <td>${html(comparison.current.fileReferences.processedWavPath)}</td>
  <td>${html(comparison.baseline.fileReferences.processedWavPath)}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Baseline Compare</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Baseline Compare</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Compared jobs: ${report.summary.comparedJobs} | Missing baseline jobs: ${report.summary.missingBaselineJobs} | Render success changes: ${report.summary.renderSuccessChanges}</p>
  <table>
    <thead>
      <tr>
        <th>Job</th>
        <th>Current Render Status</th>
        <th>Current Render Success</th>
        <th>Baseline Render Status</th>
        <th>Baseline Render Success</th>
        <th>Render Success Changed</th>
        <th>Current Peak</th>
        <th>Baseline Peak</th>
        <th>Peak Delta</th>
        <th>Current RMS</th>
        <th>Baseline RMS</th>
        <th>RMS Delta</th>
        <th>Current LUFS-estimate</th>
        <th>Baseline LUFS-estimate</th>
        <th>LUFS-estimate Delta</th>
        <th>Current Clipping</th>
        <th>Baseline Clipping</th>
        <th>Clipping Delta</th>
        <th>Current Processed WAV</th>
        <th>Baseline Processed WAV</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="20">No comparisons.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

export async function createBaseline() {
  const current = JSON.parse(await fs.readFile(renderResultsPath, "utf8"));
  const baselineDirectory = path.join(baselinesDir, timestampId());
  const baselinePath = path.join(baselineDirectory, "baseline.json");

  await fs.mkdir(baselineDirectory, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(baselinePath, `${JSON.stringify(current, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  const report = createBaselineSnapshotReport(current, baselinePath);
  await fs.writeFile(baselineLatestPath, `${JSON.stringify({ baselinePath, generatedAt: report.generatedAt }, null, 2)}\n`, "utf8");
  await fs.writeFile(createJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(createHtmlPath, createSnapshotHtml(report), "utf8");

  return { baselinePath, jobs: current.results?.length ?? 0, report, paths: { json: createJsonPath, html: createHtmlPath } };
}

export async function compareBaseline() {
  const current = JSON.parse(await fs.readFile(renderResultsPath, "utf8"));
  const latest = JSON.parse(await fs.readFile(baselineLatestPath, "utf8"));
  const baseline = JSON.parse(await fs.readFile(latest.baselinePath, "utf8"));
  const report = createBaselineCompareReport(current, baseline);

  await fs.writeFile(compareJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(compareHtmlPath, createCompareHtml(report), "utf8");

  return { report, paths: { json: compareJsonPath, html: compareHtmlPath } };
}
