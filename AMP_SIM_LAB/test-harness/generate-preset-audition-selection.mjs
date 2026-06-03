import fs from "node:fs/promises";
import path from "node:path";
import { labRoot, reportsDir } from "./lab-paths.mjs";
import {
  createPresetAuditionSelection,
  createPresetAuditionSelectionHtml,
  createPresetAuditionSelectionMarkdown
} from "./preset-audition-selection.mjs";

const matrixPath = path.join(reportsDir, "audition-matrix.json");
const renderResultsPath = path.join(reportsDir, "render-results.json");
const selectionJsonPath = path.join(reportsDir, "preset-audition-selection.json");
const selectionHtmlPath = path.join(reportsDir, "preset-audition-selection.html");
const committedReportsDir = path.join(labRoot, "reports");
const committedHtmlPath = path.join(committedReportsDir, "preset-audition-selection.html");
const committedIndexPath = path.join(committedReportsDir, "index.html");
const markdownPath = path.join(labRoot, "PRESET_AUDITION_SELECTION.md");

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function createCommittedIndex(generatedAt) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Internal Reports</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; max-width: 960px; }
    p { color: #aab7c4; }
    a { color: #93c5fd; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border: 1px solid #334155; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Internal Reports</h1>
  <p>Generated: ${generatedAt}</p>
  <p>Committed internal report entry points only. Full generated lab outputs remain in the configured local report folder.</p>
  <table>
    <thead><tr><th>Report</th><th>Description</th></tr></thead>
    <tbody>
      <tr>
        <td><a href="./preset-audition-selection.html">Preset Audition Selection</a></td>
        <td>Founder-only worksheet for rating audition renders and marking beta-demo candidates without auto-ranking tone.</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const matrix = await readJsonIfExists(matrixPath);

  if (!matrix) {
    console.error(`Missing audition matrix report. Run npm run lab:audition first. Expected: ${matrixPath}`);
    process.exit(1);
  }

  const renderResults = await readJsonIfExists(renderResultsPath);
  const selection = createPresetAuditionSelection({
    matrix,
    renderResults
  });
  const html = createPresetAuditionSelectionHtml(selection);

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(committedReportsDir, { recursive: true });
  await fs.writeFile(selectionJsonPath, `${JSON.stringify(selection, null, 2)}\n`, "utf8");
  await fs.writeFile(selectionHtmlPath, html, "utf8");
  await fs.writeFile(committedHtmlPath, html, "utf8");
  await fs.writeFile(committedIndexPath, createCommittedIndex(selection.generatedAt), "utf8");
  await fs.writeFile(markdownPath, createPresetAuditionSelectionMarkdown(selection), "utf8");

  console.log(`AMP_SIM_LAB preset audition selection JSON written: ${selectionJsonPath}`);
  console.log(`AMP_SIM_LAB preset audition selection HTML written: ${selectionHtmlPath}`);
  console.log(`AMP_SIM_LAB committed preset audition selection HTML written: ${committedHtmlPath}`);
  console.log(`AMP_SIM_LAB committed report index written: ${committedIndexPath}`);
  console.log(`AMP_SIM_LAB preset audition selection worksheet written: ${markdownPath}`);
  console.log(`Entries: ${selection.summary.entries}`);
  console.log(`Real renders: ${selection.summary.realRenders}`);
  console.log(`Dry-runs: ${selection.summary.dryRuns}`);
  console.log(`Render failures / not rendered: ${selection.summary.renderFailures}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
