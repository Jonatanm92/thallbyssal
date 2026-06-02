import fs from "node:fs/promises";
import path from "node:path";
import { safeAnalyzeWavFile } from "./audio-metrics.mjs";
import { diInputDir, labRoot, reportsDir } from "./lab-paths.mjs";
import { renderThroughAmpPlaceholder } from "./render-hook-placeholder.mjs";

const defaultInputDir = diInputDir;
const defaultReportPath = path.join(reportsDir, "audio-metrics.json");
const defaultHtmlPath = path.join(reportsDir, "audio-metrics.html");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function formatDb(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} dB` : "-inf dB";
}

async function listWavFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".wav"))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

function createHtmlReport(report) {
  const rows = report.files
    .map((file) => {
      if (!file.ok) {
        return `<tr><td>${file.fileName}</td><td colspan="8">ERROR: ${file.error}</td></tr>`;
      }

      const metrics = file.metrics;
      return `<tr>
  <td>${file.fileName}</td>
  <td>${metrics.sampleRate}</td>
  <td>${metrics.channels}</td>
  <td>${metrics.bitsPerSample}</td>
  <td>${metrics.durationSeconds.toFixed(2)}</td>
  <td>${formatDb(metrics.peakDbfs)}</td>
  <td>${formatDb(metrics.rmsDbfs)}</td>
  <td>${formatDb(metrics.lufsEstimate)}</td>
  <td>${metrics.clippedSamples}</td>
</tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Audio Metrics</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; }
    th { background: #1f2937; }
    .note { color: #93c5fd; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Audio Metrics</h1>
  <p class="note">Local-only report. Files are measured directly; plugin render hook is not wired yet.</p>
  <p>Generated: ${report.generatedAt}</p>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Sample Rate</th>
        <th>Channels</th>
        <th>Bits</th>
        <th>Duration</th>
        <th>Peak</th>
        <th>RMS</th>
        <th>LUFS Est.</th>
        <th>Clipped Samples</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="9">No WAV files found.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const inputDir = path.resolve(argValue("--input", defaultInputDir));
  const reportPath = path.resolve(argValue("--output", defaultReportPath));
  const htmlPath = path.resolve(argValue("--html", defaultHtmlPath));

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  await fs.mkdir(inputDir, { recursive: true });

  const wavFiles = await listWavFiles(inputDir);
  const files = wavFiles.map((filePath) => {
    const result = safeAnalyzeWavFile(filePath);
    return {
      fileName: path.basename(filePath),
      render: renderThroughAmpPlaceholder(filePath),
      ...result
    };
  });

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    labRoot,
    inputDir,
    renderHook: "placeholder_only",
    files
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtmlReport(report), "utf8");

  console.log(`AMP_SIM_LAB metrics report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB HTML report written: ${htmlPath}`);
  console.log(`WAV files scanned: ${files.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
