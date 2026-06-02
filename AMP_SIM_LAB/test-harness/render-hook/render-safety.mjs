import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderHookRoot, renderReportPaths } from "./render-adapter.mjs";
import { labRoot, rendersDir, reportsDir } from "../lab-paths.mjs";

const reportPath = path.join(reportsDir, "render-safety.json");
const htmlPath = path.join(reportsDir, "render-safety.html");
const thisFilePath = fileURLToPath(import.meta.url);

const approvedRenderRoots = [
  path.join(labRoot, "renders"),
  rendersDir
];

const requiredDspCoreBasenames = [
  "ThallLabDspEngine.h",
  "ThallLabDspEngine.cpp",
  "PluginProcessor.h",
  "PluginProcessor.cpp"
];

const forbiddenSourcePatterns = [
  /playwright/i,
  /puppeteer/i,
  /robotjs/i,
  /sendkeys/i,
  /autohotkey/i,
  /xdotool/i,
  /cliclick/i,
  /mouse_event/i,
  /setcursorpos/i,
  /user32\.dll/i,
  /mainwindowhandle/i,
  /findwindow/i,
  /postmessage/i,
  /sendmessage/i,
  /telemetry/i,
  /analytics/i,
  /\bauth\b/i,
  /checkout/i,
  /licensing\s+server/i,
  /cloud\s+sync/i,
  /\bdrm\b/i
];

const fakeRendererPatterns = [
  /\bCopy-Item\b/i,
  /\bcopy\s+/i,
  /\bxcopy\b/i,
  /\brobocopy\b/i,
  /\.copyFile/i,
  /copyFileTo/i,
  /createHardLink/i,
  /mklink/i
];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

function inside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`);
}

function insideAny(roots, candidate) {
  return roots.some((root) => inside(root, candidate));
}

function hasShaSignature(value) {
  return value && typeof value.sha256 === "string" && value.sha256.length > 0 && Number.isFinite(value.sizeBytes);
}

function signaturesMatch(before, after) {
  return hasShaSignature(before) && hasShaSignature(after) && before.sha256 === after.sha256 && before.sizeBytes === after.sizeBytes;
}

async function fileSignature(filePath) {
  const stats = await fs.stat(filePath);
  const hash = crypto.createHash("sha256");
  hash.update(await fs.readFile(filePath));

  return {
    sizeBytes: stats.size,
    sha256: hash.digest("hex")
  };
}

async function attachProcessedOutputSignatures(renderResults, warnings) {
  for (const result of renderResults?.results ?? []) {
    if (!result.processedWavPath) {
      continue;
    }

    try {
      result.safety = result.safety ?? {};
      result.safety.processedOutput = await fileSignature(result.processedWavPath);
    } catch {
      warnings.push(`Processed WAV could not be hashed for job ${result.jobId ?? "unknown-job"}: ${result.processedWavPath}`);
    }
  }
}

export function validateRenderResultsReport(renderResults, { approvedRoots = approvedRenderRoots } = {}) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(renderResults?.results)) {
    return {
      errors: ["Render results report is missing a results array."],
      warnings
    };
  }

  for (const result of renderResults.results) {
    const jobId = result.jobId ?? "unknown-job";
    const safety = result.safety ?? {};

    if (!result.outputDirectory) {
      errors.push(`Render result ${jobId} is missing outputDirectory.`);
    } else if (!insideAny(approvedRoots, result.outputDirectory)) {
      errors.push(`Render output directory escapes approved render roots for job ${jobId}: ${result.outputDirectory}`);
    }

    if (result.processedWavPath) {
      if (!insideAny(approvedRoots, result.processedWavPath)) {
        errors.push(`Processed WAV path escapes approved render roots for job ${jobId}: ${result.processedWavPath}`);
      }

      if (result.outputDirectory && !inside(result.outputDirectory, result.processedWavPath)) {
        errors.push(`Processed WAV path is not inside its job output directory for job ${jobId}: ${result.processedWavPath}`);
      }
    }

    if (result.inputPath && result.outputDirectory && inside(result.outputDirectory, result.inputPath)) {
      errors.push(`Input DI path is inside the render output directory for job ${jobId}: ${result.inputPath}`);
    }

    if (safety.outputInsideRenderRoot !== true) {
      errors.push(`Output-inside-render-root safety flag is not true for job ${jobId}.`);
    }

    if (safety.inputUnchanged !== true) {
      errors.push(`Input DI unchanged safety flag is not true for job ${jobId}.`);
    }

    if (!signaturesMatch(safety.inputBefore, safety.inputAfter)) {
      errors.push(`Input DI hash/size changed or is missing for job ${jobId}.`);
    }

    if (safety.guiAutomationUsed !== false) {
      errors.push(`GUI automation flag is not false for job ${jobId}.`);
    }

    if (safety.dspModifiedByAdapter !== false) {
      errors.push(`DSP modified flag is not false for job ${jobId}.`);
    }

    if (safety.dspFilesUnchanged !== true) {
      errors.push(`DSP/core unchanged safety flag is not true for job ${jobId}.`);
    }

    for (const requiredName of requiredDspCoreBasenames) {
      const beforeEntry = Object.entries(safety.dspFilesBefore ?? {}).find(([filePath]) => path.basename(filePath) === requiredName);
      const afterEntry = Object.entries(safety.dspFilesAfter ?? {}).find(([filePath]) => path.basename(filePath) === requiredName);

      if (!beforeEntry || !afterEntry) {
        errors.push(`DSP/core hash record for ${requiredName} is missing in job ${jobId}.`);
      } else if (!signaturesMatch(beforeEntry[1], afterEntry[1])) {
        errors.push(`DSP/core hash changed for ${requiredName} in job ${jobId}.`);
      }
    }

    if (result.processedWavPath && signaturesMatch(safety.inputBefore, safety.processedOutput)) {
      errors.push(`Processed WAV hash matches input DI hash for job ${jobId}; possible fake copy-render.`);
    }

    const nativeText = [
      result.nativeRender?.stdout,
      result.nativeRender?.stderr,
      ...(result.messages ?? [])
    ].filter(Boolean).join("\n");

    for (const pattern of fakeRendererPatterns) {
      if (nativeText && pattern.test(nativeText)) {
        errors.push(`Fake render/copy indicator ${pattern} found in render result text for job ${jobId}.`);
      }
    }
  }

  return { errors, warnings };
}

function createHtml(report) {
  const issueRows = [...report.errors.map((message) => ["Error", message]), ...report.warnings.map((message) => ["Warning", message])]
    .map(([type, message]) => `<tr><td>${type}</td><td>${message}</td></tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Render Safety</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0 32px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Render Safety</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings}</p>
  <table>
    <thead><tr><th>Type</th><th>Message</th></tr></thead>
    <tbody>${issueRows || '<tr><td colspan="2">No issues.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const errors = [];
  const warnings = [];
  const scannedFiles = await walk(renderHookRoot);

  for (const filePath of scannedFiles.filter((file) => file.endsWith(".mjs") && path.basename(file) !== "render-safety.mjs")) {
    const text = await readText(filePath);
    for (const pattern of [...forbiddenSourcePatterns, ...fakeRendererPatterns]) {
      if (pattern.test(text)) {
        errors.push(`Forbidden render-hook source pattern ${pattern} found in ${path.relative(renderHookRoot, filePath)}.`);
      }
    }
  }

  const renderOfflineScript = path.join(renderHookRoot, "..", "..", "..", "native", "juce-audio-engine", "scripts", "render-offline.ps1");
  const rendererSource = path.join(renderHookRoot, "..", "..", "..", "native", "juce-audio-engine", "Source", "OfflineRendererMain.cpp");

  for (const sourcePath of [renderOfflineScript, rendererSource]) {
    try {
      const text = await readText(path.resolve(sourcePath));
      for (const pattern of [...forbiddenSourcePatterns, ...fakeRendererPatterns]) {
        if (pattern.test(text)) {
          errors.push(`Forbidden renderer source pattern ${pattern} found in ${path.basename(sourcePath)}.`);
        }
      }
    } catch {
      warnings.push(`Renderer safety source could not be read: ${path.resolve(sourcePath)}`);
    }
  }

  const renderPaths = renderReportPaths();
  let renderResults = null;
  try {
    renderResults = JSON.parse(await fs.readFile(renderPaths.json, "utf8"));
  } catch {
    warnings.push("Render results report does not exist yet.");
  }

  if (renderResults) {
    await attachProcessedOutputSignatures(renderResults, warnings);
    const resultValidation = validateRenderResultsReport(renderResults);
    errors.push(...resultValidation.errors);
    warnings.push(...resultValidation.warnings);
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    renderHookRoot,
    rendersDir,
    approvedRenderRoots,
    safetyChecks: [
      "render-hook source has no GUI automation or fake copy-render indicators",
      "native renderer sources have no GUI automation or fake copy-render indicators",
      "render result output paths stay inside approved render roots and job directories",
      "input DI before/after hashes and sizes match",
      "processed WAV hash does not match the input DI hash",
      "GUI automation result flag is false",
      "protected DSP/core before/after hashes and sizes match"
    ],
    errors,
    warnings,
    summary: {
      scannedFiles: scannedFiles.length,
      errors: errors.length,
      warnings: warnings.length
    }
  };

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtml(report), "utf8");

  console.log(`AMP_SIM_LAB render safety report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB render safety HTML written: ${htmlPath}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFilePath)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
