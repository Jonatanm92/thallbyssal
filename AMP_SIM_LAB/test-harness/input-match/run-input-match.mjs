import fs from "node:fs/promises";
import path from "node:path";
import { reportsDir } from "../lab-paths.mjs";
import { createInputMatchHtml, createInputMatchReport } from "./input-match.mjs";

const metricsReportPath = path.join(reportsDir, "audio-metrics.json");
const reportPath = path.join(reportsDir, "input-match.json");
const htmlPath = path.join(reportsDir, "input-match.html");

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

  const report = createInputMatchReport(metricsReport);

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createInputMatchHtml(report), "utf8");

  console.log(`AMP_SIM_LAB Input Match report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB Input Match HTML written: ${htmlPath}`);
  console.log(`DI files analyzed: ${report.summary.filesAnalyzed}/${report.summary.filesFound}`);
  console.log(`Problematic classifications: ${report.summary.problematicFiles}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
