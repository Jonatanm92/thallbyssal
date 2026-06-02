import fs from "node:fs/promises";
import path from "node:path";
import { reportsDir } from "./lab-paths.mjs";
import { validateDiMetricsReport } from "./di-validation.mjs";

const metricsReportPath = path.join(reportsDir, "audio-metrics.json");
const reportPath = path.join(reportsDir, "di-validation.json");
const htmlPath = path.join(reportsDir, "di-validation.html");

function statusClass(status) {
  if (status === "pass") {
    return "ok";
  }

  if (status === "missing" || status === "fail") {
    return "bad";
  }

  return "warn";
}

function createHtmlReport(report) {
  const slotRows = Object.values(report.requiredSlots)
    .map((slot) => `<tr>
  <td>${slot.label}</td>
  <td>${slot.canonicalFileName}</td>
  <td>${slot.matchedFileName || "(missing)"}</td>
  <td class="${statusClass(slot.status)}">${slot.status}</td>
  <td>${slot.errors.length}</td>
  <td>${slot.warnings.length}</td>
  <td>${[...slot.errors, ...slot.warnings, ...slot.messages].join("<br>") || "OK"}</td>
</tr>`)
    .join("\n");

  const extraRows = report.extraFiles
    .map((file) => `<tr>
  <td>${file.fileName}</td>
  <td>${file.status}</td>
  <td>${file.messages.join("<br>")}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB DI Validation</title>
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
  <h1>AMP_SIM_LAB DI Validation</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Input folder: ${report.inputDir || "(unknown)"}</p>
  <p class="${report.summary.starterReady ? "ok" : "bad"}">Starter DI ready: ${report.summary.starterReady ? "yes" : "no"}</p>
  <p>Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings}</p>
  <h2>Required Starter DI Files</h2>
  <table>
    <thead>
      <tr>
        <th>Slot</th>
        <th>Recommended Filename</th>
        <th>Matched File</th>
        <th>Status</th>
        <th>Errors</th>
        <th>Warnings</th>
        <th>Messages</th>
      </tr>
    </thead>
    <tbody>
      ${slotRows}
    </tbody>
  </table>
  <h2>Extra Files</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Status</th>
        <th>Messages</th>
      </tr>
    </thead>
    <tbody>
      ${extraRows || '<tr><td colspan="3">No extra files.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });

  let metricsReport;
  try {
    metricsReport = JSON.parse(await fs.readFile(metricsReportPath, "utf8"));
  } catch (error) {
    console.error(`Missing audio metrics report. Run npm run lab:metrics first. Expected: ${metricsReportPath}`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const report = validateDiMetricsReport(metricsReport);

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtmlReport(report), "utf8");

  console.log(`AMP_SIM_LAB DI validation report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB DI validation HTML written: ${htmlPath}`);
  console.log(`Starter DI ready: ${report.summary.starterReady ? "yes" : "no"}`);
  console.log(`Matched slots: ${report.summary.matchedSlots}/${report.summary.requiredSlots}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  if (process.argv.includes("--strict") && !report.summary.starterReady) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
