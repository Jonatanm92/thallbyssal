import fs from "node:fs/promises";
import path from "node:path";
import { reportsDir, rendersDir, repoRoot } from "../lab-paths.mjs";
import { renderWithAdapter } from "./render-adapter.mjs";
import { createRenderResultsReport, writeRenderResultsReport } from "./render-report.mjs";

const matrixPath = path.join(reportsDir, "audition-matrix.json");
const presetExampleFallback = path.join(repoRoot, "AMP_SIM_LAB", "presets", "examples", "high_gain_foundation_01.json");

function hasFlag(name) {
  return process.argv.includes(name);
}

async function findPresetFile(presetId) {
  const presetDir = path.join(repoRoot, "AMP_SIM_LAB", "presets");
  const entries = await fs.readdir(presetDir, { withFileTypes: true });

  for (const entry of entries.filter((item) => item.isFile() && item.name.toLowerCase().endsWith(".json"))) {
    const filePath = path.join(presetDir, entry.name);
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    const presets = Array.isArray(parsed) ? parsed : [parsed];

    if (presets.some((preset) => preset.preset_id === presetId)) {
      return filePath;
    }
  }

  return presetExampleFallback;
}

async function main() {
  const mode = hasFlag("--dry-run") ? "dry-run" : "real";
  const matrix = JSON.parse(await fs.readFile(matrixPath, "utf8"));
  const plannedJobs = matrix.jobs.filter((job) => job.status === "planned");
  const results = [];

  for (const job of plannedJobs) {
    const presetPath = await findPresetFile(job.preset_id);
    const inputPath = job.source_metrics?.filePath;

    if (!inputPath) {
      results.push({
        schemaVersion: 1,
        status: "failed",
        mode,
        renderHookStatus: "blocked",
        presetId: job.preset_id,
        jobId: job.job_id,
        outputDirectory: null,
        processedWavPath: null,
        metricsPath: null,
        messages: ["Audition job has no source_metrics.filePath."],
        safety: {
          inputUnchanged: false,
          outputInsideRenderRoot: false,
          guiAutomationUsed: false,
          dspModifiedByAdapter: false
        },
        metrics: null
      });
      continue;
    }

    results.push(await renderWithAdapter({
      mode,
      inputPath,
      presetPath,
      renderRoot: rendersDir,
      presetId: job.preset_id,
      jobId: job.job_id,
      sampleRate: job.source_metrics?.sampleRate ?? 48000,
      blockSize: 128
    }));
  }

  const report = createRenderResultsReport({
    results,
    mode,
    source: "audition-matrix"
  });
  const paths = await writeRenderResultsReport(report);

  console.log(`AMP_SIM_LAB audition render report written: ${paths.json}`);
  console.log(`AMP_SIM_LAB audition render HTML written: ${paths.html}`);
  console.log(`Attempted: ${report.summary.attempted}`);
  console.log(`Succeeded: ${report.summary.succeeded}`);
  console.log(`Dry-run: ${report.summary.dryRuns}`);
  console.log(`Blocked: ${report.summary.blocked}`);
  console.log(`Failed: ${report.summary.failed}`);

  if (hasFlag("--strict-safety") && results.some((result) => result.safety?.inputUnchanged === false)) {
    console.error("Strict safety failed: one or more input DI files changed during render attempt.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
