import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { diInputDir, labRoot, rendersDir, repoRoot } from "../lab-paths.mjs";
import { renderWithAdapter } from "./render-adapter.mjs";
import { createRenderResultsReport, writeRenderResultsReport } from "./render-report.mjs";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function resolveInputPath(value) {
  if (!value) {
    return path.join(diInputDir, "LOW TUNED CHUGS.wav");
  }

  const requestedPath = path.resolve(value);
  if (fsSync.existsSync(requestedPath)) {
    return requestedPath;
  }

  const labDiRoot = path.join(labRoot, "di-test-files");
  const relativeToLabDi = path.relative(labDiRoot, requestedPath);
  const pointsAtLabDi = relativeToLabDi !== "" && !relativeToLabDi.startsWith("..") && !path.isAbsolute(relativeToLabDi);

  if (pointsAtLabDi) {
    const candidates = [
      path.join(diInputDir, path.basename(requestedPath)),
      path.join(diInputDir, path.basename(requestedPath).replaceAll("_", " ")),
      path.join(diInputDir, path.basename(requestedPath).replaceAll("_", " ").toUpperCase())
    ];
    const mappedPath = candidates.find((candidate) => fsSync.existsSync(candidate));

    if (mappedPath) {
      return mappedPath;
    }
  }

  return requestedPath;
}

function resolvePresetPath(value) {
  if (!value) {
    return path.join(repoRoot, "AMP_SIM_LAB", "presets", "examples", "high_gain_foundation_01.json");
  }

  return path.resolve(value);
}

function resolveOutputRoot(value) {
  if (!value) {
    return rendersDir;
  }

  const requestedPath = path.resolve(value);
  const labRendersRoot = path.join(labRoot, "renders");
  const relativeToLabRenders = path.relative(labRendersRoot, requestedPath);
  const pointsAtLabRenders = relativeToLabRenders === "" || (!relativeToLabRenders.startsWith("..") && !path.isAbsolute(relativeToLabRenders));

  if (pointsAtLabRenders) {
    return path.join(rendersDir, relativeToLabRenders);
  }

  return requestedPath;
}

async function readPresetId(presetPath) {
  const parsed = JSON.parse(await fs.readFile(presetPath, "utf8"));
  return parsed.preset_id || path.basename(presetPath, path.extname(presetPath));
}

async function main() {
  const mode = hasFlag("--dry-run") ? "dry-run" : "real";
  const inputPath = resolveInputPath(argValue("--input"));
  const presetPath = resolvePresetPath(argValue("--preset"));
  const outputRoot = resolveOutputRoot(argValue("--out"));
  const sampleRate = Number(argValue("--sample-rate", "48000"));
  const blockSize = Number(argValue("--block-size", "128"));
  const presetId = await readPresetId(presetPath);

  const result = await renderWithAdapter({
    mode,
    inputPath,
    presetPath,
    renderRoot: outputRoot,
    presetId,
    jobId: presetId,
    sampleRate,
    blockSize
  });

  const report = createRenderResultsReport({
    results: [result],
    mode,
    source: "manual"
  });
  const paths = await writeRenderResultsReport(report);

  console.log(`AMP_SIM_LAB render report written: ${paths.json}`);
  console.log(`AMP_SIM_LAB render HTML written: ${paths.html}`);
  console.log(`Render hook status: ${report.summary.renderHookStatus}`);
  console.log(`Attempted: ${report.summary.attempted}`);
  console.log(`Succeeded: ${report.summary.succeeded}`);
  console.log(`Dry-run: ${report.summary.dryRuns}`);
  console.log(`Blocked: ${report.summary.blocked}`);

  if (hasFlag("--strict-safety") && !result.safety.inputUnchanged) {
    console.error("Strict safety failed: input DI changed during render attempt.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
