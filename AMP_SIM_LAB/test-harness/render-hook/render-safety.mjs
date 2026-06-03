import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { renderHookRoot, renderReportPaths } from "./render-adapter.mjs";
import { labRoot, rendersDir, reportsDir, repoRoot } from "../lab-paths.mjs";

const reportPath = path.join(reportsDir, "render-safety.json");
const htmlPath = path.join(reportsDir, "render-safety.html");
const thisFilePath = fileURLToPath(import.meta.url);
const branchBaseRef = process.env.AMP_SIM_LAB_RENDER_SAFETY_BASE || "factory/lab-foundation-checkpoint";

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

const protectedDspCorePaths = [
  "native/juce-audio-engine/Source/ThallLabDspEngine.h",
  "native/juce-audio-engine/Source/ThallLabDspEngine.cpp",
  "native/juce-audio-engine/Source/PluginProcessor.h",
  "native/juce-audio-engine/Source/PluginProcessor.cpp"
];

const validatorSelfPaths = new Set([
  "AMP_SIM_LAB/test-harness/render-hook/render-safety.mjs",
  "AMP_SIM_LAB/test-harness/render-hook/render-hook.test.mjs"
]);

const publicSystemGuardrailSourcePaths = new Set([
  "AMP_SIM_LAB/test-harness/beta-readiness.mjs",
  "AMP_SIM_LAB/test-harness/beta-readiness.test.mjs",
  "AMP_SIM_LAB/test-harness/generate-report-index.mjs",
  "AMP_SIM_LAB/test-harness/preset-validation.test.mjs",
  "AMP_SIM_LAB/test-harness/validate-presets.mjs"
]);

const executableSourceExtension = /\.(mjs|cjs|js|jsx|ts|tsx|json|ps1|sh|bash|bat|cmd|cpp|c|h|hpp|cmake|yml|yaml)$/i;
const originalAudioOrAssetExtension = /\.(wav|wave|aif|aiff|flac|mp3|ogg|nam|ir)$/i;

const guiAutomationPatterns = [
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
  /sendmessage/i
];

const publicSystemPatterns = [
  /public\s+(launch|release)/i,
  /telemetry/i,
  /analytics/i,
  /posthog/i,
  /segment\.com/i,
  /mixpanel/i,
  /sentry/i,
  /\bauth\b/i,
  /auth0/i,
  /oauth/i,
  /\blogin\b/i,
  /\bsign-?up\b/i,
  /checkout/i,
  /payment/i,
  /stripe/i,
  /paddle/i,
  /gumroad/i,
  /lemonsqueezy/i,
  /licensing\s+server/i,
  /license\s+server/i,
  /license\s+key/i,
  /licenseKey/i,
  /activation\s+server/i,
  /cloud\s+sync/i,
  /\bdrm\b/i
];

const publicSystemImplementationPatterns = [
  /import\s+.*\b(stripe|posthog|mixpanel|sentry|auth0|oauth|paddle|gumroad|lemonsqueezy)\b/i,
  /from\s+["'][^"']*\b(stripe|posthog|mixpanel|sentry|auth0|oauth|paddle|gumroad|lemonsqueezy)\b[^"']*["']/i,
  /new\s+Stripe\b/i,
  /\b(posthog|mixpanel|sentry)\.(init|capture|track|configure)\b/i,
  /\banalytics\.(track|identify|page)\b/i,
  /\btelemetry\s*[:=]\s*true\b/i,
  /\bauth\s*[:=]\s*["'`]/i,
  /\blicenseKey\s*[:=]/i,
  /\blicense\s+key\s*[:=]/i,
  /\bcheckout\s*[:=]\s*["'`]/i,
  /\bstartCheckout\b/i,
  /process\.env\.[A-Z0-9_]*(STRIPE|POSTHOG|MIXPANEL|SENTRY|AUTH|OAUTH|LICENSE|TELEMETRY|PADDLE|GUMROAD|DRM)[A-Z0-9_]*/i,
  /\b(app|router)\.(get|post|use)\(\s*["']\/(checkout|login|auth|signup|license|telemetry|analytics)\b/i,
  /\bfetch\(\s*["'][^"']*\b(checkout|login|auth|signup|license|telemetry|analytics)\b/i
];

const forbiddenSourcePatterns = [
  ...guiAutomationPatterns,
  ...publicSystemPatterns
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

function signaturesMatch(before, after, { requireModifiedMs = false } = {}) {
  if (!hasShaSignature(before) || !hasShaSignature(after)) {
    return false;
  }

  if (before.sha256 !== after.sha256 || before.sizeBytes !== after.sizeBytes) {
    return false;
  }

  if (!requireModifiedMs) {
    return true;
  }

  return Number.isFinite(before.modifiedMs) && Number.isFinite(after.modifiedMs) && before.modifiedMs === after.modifiedMs;
}

function hasApprovedRendererProvenance(result) {
  if (
    result.renderPath?.available === true &&
    result.renderPath?.kind === "local-headless-command" &&
    /render-offline\.ps1$/i.test(result.renderPath?.command ?? "")
  ) {
    return true;
  }

  const text = [
    ...(result.messages ?? []),
    result.nativeRender?.stdout,
    result.nativeRender?.stderr
  ].filter(Boolean).join("\n");

  return result.nativeRender?.exitCode === 0 && /ThallbyssalOfflineRenderer/.test(text);
}

async function fileSignature(filePath) {
  const stats = await fs.stat(filePath);
  const hash = crypto.createHash("sha256");
  hash.update(await fs.readFile(filePath));

  return {
    sizeBytes: stats.size,
    modifiedMs: stats.mtimeMs,
    sha256: hash.digest("hex")
  };
}

function normalizeRepoPath(value) {
  return String(value ?? "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function parseNameStatus(stdout, source) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const status = parts[0] ?? "";
      if (status.startsWith("R") || status.startsWith("C")) {
        return { status, oldPath: normalizeRepoPath(parts[1]), path: normalizeRepoPath(parts[2]), source };
      }
      return { status, path: normalizeRepoPath(parts[1] ?? parts[0]), source };
    });
}

function git(args) {
  return spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false
  });
}

function uniqueChanges(changes) {
  const seen = new Set();
  return changes.filter((change) => {
    const key = `${change.status}:${change.path}:${change.oldPath ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectGitChanges(baseRef, warnings) {
  const changes = [];
  const diffCommands = [
    { source: "branch", args: ["diff", "--name-status", "-M", `${baseRef}...HEAD`] },
    { source: "staged", args: ["diff", "--name-status", "-M", "--cached"] }
  ];

  for (const command of diffCommands) {
    const result = git(command.args);
    if (result.status !== 0) {
      warnings.push(`Git ${command.source} diff could not be read: ${(result.stderr || result.stdout || "").trim()}`);
      continue;
    }
    changes.push(...parseNameStatus(result.stdout, command.source));
  }

  if (process.env.AMP_SIM_LAB_RENDER_SAFETY_INCLUDE_WORKTREE === "1") {
    const worktree = git(["diff", "--name-status", "-M"]);
    if (worktree.status !== 0) {
      warnings.push(`Git worktree diff could not be read: ${(worktree.stderr || worktree.stdout || "").trim()}`);
    } else {
      changes.push(...parseNameStatus(worktree.stdout, "worktree"));
    }

    const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"]);
    if (untracked.status !== 0) {
      warnings.push(`Git untracked files could not be read: ${(untracked.stderr || untracked.stdout || "").trim()}`);
    } else {
      for (const filePath of untracked.stdout.split("\0").filter(Boolean)) {
        changes.push({ status: "??", path: normalizeRepoPath(filePath), source: "untracked" });
      }
    }
  }

  return uniqueChanges(changes);
}

function changedPaths(change) {
  return [change.path, change.oldPath].filter(Boolean).map(normalizeRepoPath);
}

function isProtectedDspCorePath(repoPath) {
  return protectedDspCorePaths.some((protectedPath) => repoPath.toLowerCase() === protectedPath.toLowerCase());
}

function isOriginalDiOrUserAssetPath(repoPath) {
  return /^AMP_SIM_LAB\/di-test-files\//i.test(repoPath) || originalAudioOrAssetExtension.test(repoPath);
}

function shouldScanChangedSource(repoPath) {
  return executableSourceExtension.test(repoPath) && !validatorSelfPaths.has(repoPath);
}

function shouldScanPublicSystemPatterns(repoPath) {
  return !publicSystemGuardrailSourcePaths.has(repoPath);
}

function publicSystemPatternsForPath(repoPath) {
  return shouldScanPublicSystemPatterns(repoPath) ? publicSystemPatterns : publicSystemImplementationPatterns;
}

function publicSystemPatternLabel(repoPath) {
  return shouldScanPublicSystemPatterns(repoPath)
    ? "Public release/checkout/licensing/auth/telemetry indicator"
    : "Public-system implementation indicator";
}

async function changedFileTexts(changes, warnings) {
  const entries = [];
  const paths = [...new Set(changes.flatMap(changedPaths))].filter(shouldScanChangedSource);

  for (const repoPath of paths) {
    try {
      entries.push([repoPath, await readText(path.join(repoRoot, repoPath))]);
    } catch {
      warnings.push(`Changed source file could not be read for safety scan: ${repoPath}`);
    }
  }

  return new Map(entries);
}

export function validateBranchSafety({ changes = [], fileTexts = new Map(), baseRef = branchBaseRef } = {}) {
  const errors = [];
  const warnings = [];
  const changedFiles = [...new Set(changes.flatMap(changedPaths))].sort();

  for (const change of changes) {
    for (const repoPath of changedPaths(change)) {
      if (isProtectedDspCorePath(repoPath)) {
        errors.push(`Protected DSP/core file was changed in ${change.source ?? "git"} diff: ${repoPath}`);
      }

      if (isOriginalDiOrUserAssetPath(repoPath)) {
        errors.push(`Original DI/audio/user asset was changed in ${change.source ?? "git"} diff: ${repoPath}`);
      }
    }
  }

  for (const [repoPath, text] of fileTexts.entries()) {
    for (const pattern of guiAutomationPatterns) {
      if (pattern.test(text)) {
        errors.push(`GUI automation indicator ${pattern} found in changed source: ${repoPath}`);
      }
    }

    for (const pattern of fakeRendererPatterns) {
      if (pattern.test(text)) {
        errors.push(`Fake render/copy indicator ${pattern} found in changed source: ${repoPath}`);
      }
    }

    for (const pattern of publicSystemPatternsForPath(repoPath)) {
      if (pattern.test(text)) {
        errors.push(`${publicSystemPatternLabel(repoPath)} ${pattern} found in changed source: ${repoPath}`);
      }
    }
  }

  return {
    errors,
    warnings,
    baseRef,
    changedFiles,
    summary: {
      changedFiles: changedFiles.length,
      scannedChangedSourceFiles: fileTexts.size,
      protectedDspCoreChanges: errors.filter((message) => message.includes("Protected DSP/core")).length,
      originalDiOrAssetChanges: errors.filter((message) => message.includes("Original DI/audio/user asset")).length
    }
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

    if (!signaturesMatch(safety.inputBefore, safety.inputAfter, { requireModifiedMs: true })) {
      errors.push(`Input DI hash/size/mtime changed or is missing for job ${jobId}.`);
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
      } else if (!signaturesMatch(beforeEntry[1], afterEntry[1], { requireModifiedMs: true })) {
        errors.push(`DSP/core hash/size/mtime changed for ${requiredName} in job ${jobId}.`);
      }
    }

    if (result.processedWavPath) {
      if (result.status !== "rendered" || result.renderHookStatus !== "real-render") {
        errors.push(`Processed WAV path is present without a rendered real-render status for job ${jobId}.`);
      }

      if (!hasApprovedRendererProvenance(result)) {
        errors.push(`Processed WAV path is present without approved local headless renderer provenance for job ${jobId}.`);
      }

      if (result.nativeRender?.exitCode !== 0) {
        errors.push(`Processed WAV path is present without a successful native renderer exit code for job ${jobId}.`);
      }

      if (signaturesMatch(safety.inputBefore, safety.processedOutput)) {
        errors.push(`Processed WAV hash matches input DI hash for job ${jobId}; possible fake copy-render.`);
      }
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
  const branchChanges = collectGitChanges(branchBaseRef, warnings);
  const branchFileTexts = await changedFileTexts(branchChanges, warnings);
  const branchValidation = validateBranchSafety({
    changes: branchChanges,
    fileTexts: branchFileTexts,
    baseRef: branchBaseRef
  });
  errors.push(...branchValidation.errors);
  warnings.push(...branchValidation.warnings);

  for (const filePath of scannedFiles.filter((file) => file.endsWith(".mjs") && path.basename(file) !== "render-safety.mjs" && !file.endsWith(".test.mjs"))) {
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
      "input DI before/after hashes, sizes, and mtimes match",
      "processed WAV hash does not match the input DI hash",
      "processed WAVs require rendered status, successful native exit, and local headless renderer provenance",
      "GUI automation result flag is false",
      "protected DSP/core before/after hashes, sizes, and mtimes match",
      "git branch/staged diff has no DSP/core, DI/audio asset, GUI automation, fake render, or public release system additions"
    ],
    branchSafety: branchValidation,
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
