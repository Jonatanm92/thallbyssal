function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderLookup(renderResults) {
  const results = Array.isArray(renderResults?.results) ? renderResults.results : [];
  const lookup = new Map();

  for (const result of results) {
    lookup.set(result.jobId, result);
    lookup.set(normalizeKey(result.jobId), result);
  }

  return lookup;
}

function metricValue(metrics, key) {
  const value = metrics?.[key];
  return Number.isFinite(value) ? value : null;
}

function renderMode(result) {
  if (result?.status === "rendered") {
    return "real-render";
  }

  if (result?.status === "dry_run") {
    return "dry-run";
  }

  return "not-rendered";
}

function renderSuccess(result) {
  return result?.status === "rendered" || result?.status === "dry_run" ? "yes" : "no";
}

function clipping(metrics) {
  return (metrics?.clippedSamples ?? 0) > 0 ? "yes" : "no";
}

export function createPresetAuditionSelection({ generatedAt = new Date().toISOString(), matrix, renderResults = null }) {
  const byJobId = renderLookup(renderResults);
  const jobs = Array.isArray(matrix?.jobs) ? matrix.jobs : [];
  const entries = jobs.map((job) => {
    const result = byJobId.get(job.job_id) ?? byJobId.get(normalizeKey(job.job_id)) ?? null;
    const metrics = result?.metrics ?? job.source_metrics ?? null;

    return {
      presetId: job.preset_id,
      presetName: job.preset_name,
      category: job.preset_category,
      diFile: job.di_file_name ?? "",
      renderSuccess: renderSuccess(result),
      renderMode: renderMode(result),
      peakDbfsEstimate: metricValue(metrics, "peakDbfs"),
      rmsDbfsEstimate: metricValue(metrics, "rmsDbfs"),
      lufsEstimate: metricValue(metrics, "lufsEstimate"),
      clipping: clipping(metrics),
      founderRating: "",
      founderNotes: "",
      decision: "",
      suggestedBetaDemoCandidate: ""
    };
  });

  const realRenders = entries.filter((entry) => entry.renderMode === "real-render").length;
  const dryRuns = entries.filter((entry) => entry.renderMode === "dry-run").length;
  const renderFailures = entries.filter((entry) => entry.renderSuccess === "no").length;
  const clippingCount = entries.filter((entry) => entry.clipping === "yes").length;

  return {
    schemaVersion: 1,
    generatedAt,
    source: {
      auditionMatrixGeneratedAt: matrix?.generatedAt ?? null,
      renderResultsGeneratedAt: renderResults?.generatedAt ?? null
    },
    instructions: {
      founderRating: "Founder-only placeholder. Enter 1-5 after listening.",
      founderNotes: "Founder-only placeholder for subjective listening notes.",
      decision: "Founder-only placeholder. Use keep, improve, reject, or retest.",
      suggestedBetaDemoCandidate: "Founder-only placeholder. Enter yes or no after rating."
    },
    summary: {
      entries: entries.length,
      realRenders,
      dryRuns,
      renderFailures,
      clippingCount,
      autoRanked: false
    },
    entries
  };
}

function display(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function formatMetric(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}

function escapeHtml(value) {
  return display(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownCell(value) {
  return display(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function createPresetAuditionSelectionMarkdown(selection) {
  const rows = selection.entries
    .map((entry) => [
      entry.presetId,
      entry.presetName,
      entry.category,
      entry.diFile,
      entry.renderSuccess,
      entry.renderMode,
      formatMetric(entry.peakDbfsEstimate),
      formatMetric(entry.rmsDbfsEstimate),
      formatMetric(entry.lufsEstimate),
      entry.clipping,
      entry.founderRating || "1-5",
      entry.founderNotes || "founder notes",
      entry.decision || "keep / improve / reject / retest",
      entry.suggestedBetaDemoCandidate || "yes / no"
    ].map(markdownCell).join(" | "))
    .join("\n");

  return `# Preset Audition Selection

Internal founder-only worksheet for deciding which preset/render combinations are strong enough for beta demos.

Generated: ${selection.generatedAt}

This report organizes objective render data only. It does not rank tone, choose winners, tune presets, create final presets, or change the audio engine.

## Founder Fields

- Founder rating: enter 1-5 after listening.
- Founder notes: subjective listening notes.
- Decision: keep / improve / reject / retest.
- Suggested beta-demo candidate: yes / no.

## Summary

- Entries: ${selection.summary.entries}
- Real renders: ${selection.summary.realRenders}
- Dry-runs: ${selection.summary.dryRuns}
- Render failures / not rendered: ${selection.summary.renderFailures}
- Clipping flagged: ${selection.summary.clippingCount}
- Auto-ranked tone: ${selection.summary.autoRanked ? "yes" : "no"}

## Selection Worksheet

| Preset ID | Preset name | Category | DI file | Render success | Render mode | Peak dBFS estimate | RMS dBFS estimate | LUFS estimate | Clipping | Founder rating 1-5 | Founder notes | Decision keep/improve/reject/retest | Suggested beta-demo candidate yes/no |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows || "|  |  |  |  |  |  |  |  |  |  |  |  |  |"}
`;
}

export function createPresetAuditionSelectionHtml(selection) {
  const rows = selection.entries
    .map((entry) => `<tr>
  <td>${escapeHtml(entry.presetId)}</td>
  <td>${escapeHtml(entry.presetName)}</td>
  <td>${escapeHtml(entry.category)}</td>
  <td>${escapeHtml(entry.diFile)}</td>
  <td>${escapeHtml(entry.renderSuccess)}</td>
  <td>${escapeHtml(entry.renderMode)}</td>
  <td>${escapeHtml(formatMetric(entry.peakDbfsEstimate))}</td>
  <td>${escapeHtml(formatMetric(entry.rmsDbfsEstimate))}</td>
  <td>${escapeHtml(formatMetric(entry.lufsEstimate))}</td>
  <td>${escapeHtml(entry.clipping)}</td>
  <td></td>
  <td></td>
  <td>keep / improve / reject / retest</td>
  <td>yes / no</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Preset Audition Selection</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    p { color: #aab7c4; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    .note { color: #fde68a; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Preset Audition Selection</h1>
  <p>Generated: ${escapeHtml(selection.generatedAt)}</p>
  <p class="note">Internal founder-only worksheet. Objective render data only; tone is not auto-ranked.</p>
  <p>Entries: ${selection.summary.entries} | Real renders: ${selection.summary.realRenders} | Dry-runs: ${selection.summary.dryRuns} | Render failures / not rendered: ${selection.summary.renderFailures} | Clipping flagged: ${selection.summary.clippingCount}</p>
  <table>
    <thead>
      <tr>
        <th>Preset ID</th>
        <th>Preset name</th>
        <th>Category</th>
        <th>DI file</th>
        <th>Render success</th>
        <th>Render mode</th>
        <th>Peak dBFS estimate</th>
        <th>RMS dBFS estimate</th>
        <th>LUFS estimate</th>
        <th>Clipping</th>
        <th>Founder rating 1-5</th>
        <th>Founder notes</th>
        <th>Decision</th>
        <th>Suggested beta-demo candidate</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="14">No audition entries.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}
