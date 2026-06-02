import fs from "node:fs/promises";
import path from "node:path";
import { createAuditionMatrix } from "./audition-matrix.mjs";
import { writeDemoAuditionPage } from "./demo-audition-page.mjs";
import { labRoot, rendersDir, reportsDir } from "./lab-paths.mjs";

const presetsDir = path.join(labRoot, "presets");
const diValidationPath = path.join(reportsDir, "di-validation.json");
const reportPath = path.join(reportsDir, "audition-matrix.json");
const htmlPath = path.join(reportsDir, "audition-matrix.html");
const outputRoot = path.join(rendersDir, "auditions");

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readPresetFiles() {
  const entries = await fs.readdir(presetsDir, { withFileTypes: true });
  const presetFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(presetsDir, entry.name))
    .sort();
  const presets = [];

  for (const filePath of presetFiles) {
    const parsed = await readJson(filePath);
    presets.push(...(Array.isArray(parsed) ? parsed : [parsed]));
  }

  return presets;
}

function createHtmlReport(matrix) {
  const jobRows = matrix.jobs
    .map((job) => `<tr>
  <td>${job.job_id}</td>
  <td>${job.preset_name}</td>
  <td>${job.preset_category}</td>
  <td>${job.di_slot}</td>
  <td>${job.di_file_name || "(missing)"}</td>
  <td>${job.status}</td>
  <td>${job.plannedOutputFile}</td>
  <td>${job.messages.join("<br>")}</td>
</tr>`)
    .join("\n");

  const skippedRows = matrix.skippedPresets
    .map((preset) => `<tr>
  <td>${preset.preset_id}</td>
  <td>${preset.name}</td>
  <td>${preset.category}</td>
  <td>${preset.reason}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Audition Matrix</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Audition Matrix</h1>
  <p>Generated: ${matrix.generatedAt}</p>
  <p>Output root: ${matrix.outputRoot}</p>
  <p>Planned jobs: ${matrix.summary.jobs} | Blocked jobs: ${matrix.summary.blockedJobs} | Skipped presets: ${matrix.summary.skippedPresets}</p>
  <h2>Planned / Blocked Jobs</h2>
  <table>
    <thead>
      <tr>
        <th>Job ID</th>
        <th>Preset</th>
        <th>Category</th>
        <th>DI Slot</th>
        <th>DI File</th>
        <th>Status</th>
        <th>Planned Output</th>
        <th>Messages</th>
      </tr>
    </thead>
    <tbody>${jobRows || '<tr><td colspan="8">No audition jobs.</td></tr>'}</tbody>
  </table>
  <h2>Skipped Presets</h2>
  <table>
    <thead><tr><th>Preset ID</th><th>Name</th><th>Category</th><th>Reason</th></tr></thead>
    <tbody>${skippedRows || '<tr><td colspan="4">No skipped presets.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(outputRoot, { recursive: true });

  let diValidationReport;
  try {
    diValidationReport = await readJson(diValidationPath);
  } catch (error) {
    console.error(`Missing DI validation report. Run npm run lab:metrics and npm run lab:di first. Expected: ${diValidationPath}`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const presets = await readPresetFiles();
  const matrix = createAuditionMatrix({
    outputRoot,
    diValidationReport,
    presets
  });

  await fs.writeFile(reportPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtmlReport(matrix), "utf8");
  const demoPage = await writeDemoAuditionPage();

  console.log(`AMP_SIM_LAB audition matrix written: ${reportPath}`);
  console.log(`AMP_SIM_LAB audition matrix HTML written: ${htmlPath}`);
  console.log(`AMP_SIM_LAB demo audition page written: ${demoPage.reportPath}`);
  console.log(`Planned jobs: ${matrix.summary.jobs}`);
  console.log(`Blocked jobs: ${matrix.summary.blockedJobs}`);
  console.log(`Skipped presets: ${matrix.summary.skippedPresets}`);

  if (process.argv.includes("--strict") && matrix.summary.blockedJobs > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
