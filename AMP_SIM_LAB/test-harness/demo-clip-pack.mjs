import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { labRoot, reportsDir, rendersDir } from "./lab-paths.mjs";

const defaultJsonPath = path.join(reportsDir, "demo-clip-pack.json");
const defaultHtmlPath = path.join(reportsDir, "demo-clips-index.html");
const defaultDemoSitePath = path.join(labRoot, "demo-site", "demo-clips-index.html");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizedFileName(value) {
  return path.basename(String(value ?? "")).toLowerCase();
}

function formatDb(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} dBFS` : "(none)";
}

function formatLufs(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} LUFS est.` : "(none)";
}

function referenceFor(baseDir, candidatePath) {
  if (!candidatePath) {
    return null;
  }

  const relativePath = path.relative(baseDir, candidatePath);
  if (path.isAbsolute(relativePath)) {
    return pathToFileURL(candidatePath).href;
  }

  return relativePath.replaceAll(path.sep, "/");
}

function renderSessionFor({ outputDirectory, rendersDir: baseRendersDir }) {
  if (!outputDirectory) {
    return "(none)";
  }

  const relativePath = path.relative(baseRendersDir, outputDirectory);
  if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    return relativePath.split(path.sep)[0] || "(none)";
  }

  return path.basename(path.dirname(outputDirectory)) || "(none)";
}

function matrixKey({ presetId, diFileName }) {
  return `${presetId ?? ""}|${normalizedFileName(diFileName)}`;
}

function matrixJobsByPresetAndDi(auditionMatrix) {
  const entries = (auditionMatrix?.jobs ?? []).map((job) => [
    matrixKey({
      presetId: job.preset_id ?? job.presetId,
      diFileName: job.di_file_name ?? job.diFileName ?? job.source_metrics?.filePath
    }),
    job
  ]);

  return new Map(entries);
}

function matchingMatrixJob(result, jobsByPresetAndDi) {
  const exact = jobsByPresetAndDi.get(matrixKey({
    presetId: result?.presetId,
    diFileName: result?.inputPath
  }));
  if (exact) {
    return exact;
  }

  const jobId = slug(result?.jobId);
  for (const job of jobsByPresetAndDi.values()) {
    const presetId = slug(job.preset_id ?? job.presetId);
    const slot = slug(job.di_slot ?? job.diSlot);
    if (presetId && slot && jobId.includes(presetId) && jobId.includes(slot)) {
      return job;
    }
  }

  return null;
}

function renderLabelFor(result) {
  if (result?.status === "rendered" && result?.renderHookStatus === "real-render") {
    return "real-render";
  }

  if (result?.status === "dry_run" || result?.status === "dry-run" || result?.renderHookStatus === "dry-run") {
    return "dry-run";
  }

  return result?.renderHookStatus || result?.status || "unknown";
}

function clippingStatusFor(metrics) {
  if (!metrics) {
    return "unknown";
  }

  return (metrics.clippedSamples ?? 0) > 0 ? "clipped" : "clean";
}

function suggestedUseCaseFor({ jobId, presetName, presetCategory, diSlot, diFileName }) {
  const haystack = [jobId, presetName, presetCategory, diSlot, diFileName].map((value) => String(value ?? "").toLowerCase()).join(" ");

  if (haystack.includes("noise")) {
    return "noise test";
  }

  if (haystack.includes("lead")) {
    return "lead";
  }

  if (haystack.includes("chug")) {
    return "chug";
  }

  if (haystack.includes("dynamic") || haystack.includes("pick")) {
    return "dynamic picking";
  }

  return "rhythm";
}

function rowFromRenderResult({ result, matrixJob, reportsDir: baseReportsDir, rendersDir: baseRendersDir, clipExists }) {
  const metrics = result?.metrics ?? null;
  const processedClipPath = result?.processedWavPath ?? null;
  const metricsPath = result?.metricsPath ?? null;
  const processedClipExists = Boolean(processedClipPath && clipExists(processedClipPath));
  const metricsExists = Boolean(metricsPath && clipExists(metricsPath));
  const presetName = matrixJob?.preset_name ?? matrixJob?.presetName ?? result?.presetId ?? "(unnamed)";
  const diFileName = matrixJob?.di_file_name ?? matrixJob?.diFileName ?? path.basename(result?.inputPath ?? "") ?? "(unknown)";
  const presetCategory = matrixJob?.preset_category ?? matrixJob?.presetCategory ?? "(from render report)";
  const diSlot = matrixJob?.di_slot ?? matrixJob?.diSlot ?? "(from render report)";
  const clippedSamples = Number.isFinite(metrics?.clippedSamples) ? metrics.clippedSamples : null;

  return {
    renderBatch: result?.startedAt ?? result?.completedAt ?? "(unknown)",
    renderSession: renderSessionFor({ outputDirectory: result?.outputDirectory, rendersDir: baseRendersDir }),
    jobId: result?.jobId ?? "(unknown)",
    diFileName,
    presetId: result?.presetId ?? matrixJob?.preset_id ?? "(unknown)",
    presetName,
    presetCategory,
    processedClipPath,
    processedClipReference: referenceFor(baseReportsDir, processedClipPath),
    processedClipExists,
    metricsPath,
    metricsReference: referenceFor(baseReportsDir, metricsPath),
    metricsExists,
    peakLabel: formatDb(metrics?.peakDbfs),
    rmsLabel: formatDb(metrics?.rmsDbfs),
    lufsEstimateLabel: formatLufs(metrics?.lufsEstimate),
    clippedSamples,
    clippingStatus: clippingStatusFor(metrics),
    renderLabel: renderLabelFor(result),
    suggestedUseCase: suggestedUseCaseFor({
      jobId: result?.jobId,
      presetName,
      presetCategory,
      diSlot,
      diFileName
    }),
    founderRating: "",
    founderNotes: "",
    founderDecision: "",
    messages: result?.messages ?? []
  };
}

export function createDemoClipPackReport({
  generatedAt = new Date().toISOString(),
  reportsDir: baseReportsDir = reportsDir,
  rendersDir: baseRendersDir = rendersDir,
  renderResults = null,
  auditionMatrix = null,
  clipExists = fsSync.existsSync
} = {}) {
  const jobsByPresetAndDi = matrixJobsByPresetAndDi(auditionMatrix);
  const rows = (renderResults?.results ?? []).map((result) => rowFromRenderResult({
    result,
    matrixJob: matchingMatrixJob(result, jobsByPresetAndDi),
    reportsDir: baseReportsDir,
    rendersDir: baseRendersDir,
    clipExists
  }));
  const realRenderClips = rows.filter((row) => row.renderLabel === "real-render" && row.processedClipExists).length;
  const dryRunRows = rows.filter((row) => row.renderLabel === "dry-run").length;
  const clippingCount = rows.filter((row) => row.clippedSamples > 0).length;

  return {
    schemaVersion: 1,
    generatedAt,
    sourceRenderReportGeneratedAt: renderResults?.generatedAt ?? null,
    renderBatch: renderResults?.generatedAt ?? "(missing render-results.json)",
    renderMode: renderResults?.mode ?? "unknown",
    source: renderResults?.source ?? "render-results",
    summary: {
      rows: rows.length,
      realRenderClips,
      dryRunRows,
      playableClips: rows.filter((row) => row.processedClipExists).length,
      metricsRows: rows.filter((row) => row.metricsPath || row.peakLabel !== "(none)").length,
      clippingCount
    },
    rows
  };
}

export function createDemoClipPackHtml(report) {
  const rows = report.rows.map((row) => {
    const clipCell = row.processedClipReference
      ? `<a href="${escapeHtml(row.processedClipReference)}">${escapeHtml(path.basename(row.processedClipPath))}</a>${row.processedClipExists ? `<br><audio controls preload="none" src="${escapeHtml(row.processedClipReference)}"></audio>` : "<br>(missing local clip)"}`
      : "(none)";
    const metricsCell = row.metricsReference
      ? `<a href="${escapeHtml(row.metricsReference)}">${escapeHtml(path.basename(row.metricsPath))}</a>${row.metricsExists ? "" : "<br>(missing local metrics)"}`
      : "(none)";

    return `<tr>
  <td>${escapeHtml(row.renderSession)}</td>
  <td>${escapeHtml(row.diFileName)}</td>
  <td>${escapeHtml(row.presetName)}</td>
  <td>${clipCell}</td>
  <td>${metricsCell}</td>
  <td>${escapeHtml(row.peakLabel)}</td>
  <td>${escapeHtml(row.rmsLabel)}</td>
  <td>${escapeHtml(row.lufsEstimateLabel)}</td>
  <td>${escapeHtml(row.clippingStatus)}</td>
  <td>${escapeHtml(row.renderLabel)}</td>
  <td>${escapeHtml(row.suggestedUseCase)}</td>
  <td class="placeholder">${escapeHtml(row.founderRating)}</td>
  <td class="placeholder">${escapeHtml(row.founderNotes)}</td>
  <td class="placeholder">${escapeHtml(row.founderDecision)}</td>
</tr>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Internal Real Render Demo Clip Pack</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    h1 { margin-bottom: 4px; }
    p { color: #aab7c4; max-width: 980px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    audio { width: 240px; margin-top: 6px; }
    a { color: #93c5fd; }
    .notice { border: 1px solid #475569; background: #17202c; padding: 12px; }
    .placeholder { color: #cbd5e1; min-width: 120px; }
  </style>
</head>
<body>
  <h1>Internal Real Render Demo Clip Pack</h1>
  <p>Generated: ${escapeHtml(report.generatedAt)}</p>
  <p class="notice">Internal/private founder review only. This page indexes existing local render reports and audio references; it does not create, copy, tune, or approve audio for external use.</p>
  <p>Render batch: ${escapeHtml(report.renderBatch)} | Mode: ${escapeHtml(report.renderMode)} | Rows: ${report.summary.rows} | Real render clips: ${report.summary.realRenderClips} | Dry-run rows: ${report.summary.dryRunRows} | Clipping: ${report.summary.clippingCount}</p>
  <table>
    <thead>
      <tr>
        <th>Render Session</th>
        <th>DI File</th>
        <th>Preset</th>
        <th>Processed Clip</th>
        <th>Metrics</th>
        <th>Peak</th>
        <th>RMS</th>
        <th>LUFS Estimate</th>
        <th>Clipping</th>
        <th>Dry-run / Real-render</th>
        <th>Suggested Use Case</th>
        <th>Founder Rating</th>
        <th>Founder Notes</th>
        <th>Keep / Improve / Reject</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="14">No render rows found.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export async function writeDemoClipPackReports({
  renderResultsPath = path.join(reportsDir, "render-results.json"),
  auditionMatrixPath = path.join(reportsDir, "audition-matrix.json"),
  jsonPath = defaultJsonPath,
  htmlPath = defaultHtmlPath,
  demoSitePath = defaultDemoSitePath
} = {}) {
  const renderResults = await readJsonIfExists(renderResultsPath);
  const auditionMatrix = await readJsonIfExists(auditionMatrixPath);
  const report = createDemoClipPackReport({
    reportsDir: path.dirname(htmlPath),
    renderResults,
    auditionMatrix
  });

  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  await fs.writeFile(htmlPath, createDemoClipPackHtml(report), "utf8");

  if (demoSitePath) {
    const demoSiteReport = createDemoClipPackReport({
      reportsDir: path.dirname(demoSitePath),
      renderResults,
      auditionMatrix
    });
    await fs.mkdir(path.dirname(demoSitePath), { recursive: true });
    await fs.writeFile(demoSitePath, createDemoClipPackHtml(demoSiteReport), "utf8");
  }

  return { report, paths: { json: jsonPath, html: htmlPath, demoSite: demoSitePath } };
}
