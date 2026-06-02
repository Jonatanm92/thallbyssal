import fs from "node:fs/promises";
import fsSync from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { analyzeWavFile } from "../audio-metrics.mjs";
import { rendersDir, reportsDir, repoRoot } from "../lab-paths.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const renderHookRoot = __dirname;

const dspCoreFiles = [
  path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"),
  path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"),
  path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.h"),
  path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp")
];

export function isInsideDirectory(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`);
}

function timestampId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const padMs = (value) => String(value).padStart(3, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + "_" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("") + "_" + padMs(date.getMilliseconds());
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unnamed";
}

function uniqueOutputDirectory(renderRoot, sessionId, jobId) {
  let resolvedSessionId = sessionId;
  let outputDirectory = path.join(renderRoot, resolvedSessionId, jobId);

  for (let index = 2; fsSync.existsSync(outputDirectory); index += 1) {
    resolvedSessionId = `${sessionId}-${String(index).padStart(2, "0")}`;
    outputDirectory = path.join(renderRoot, resolvedSessionId, jobId);
  }

  return { sessionId: resolvedSessionId, outputDirectory };
}

export function detectSafeRenderPath() {
  const candidate = path.join(repoRoot, "native", "juce-audio-engine", "scripts", "render-offline.ps1");

  if (fsSync.existsSync(candidate)) {
    return {
      available: true,
      kind: "local-headless-command",
      command: candidate,
      message: "Safe headless render command detected."
    };
  }

  return {
    available: false,
    kind: "missing",
    command: null,
    message: "No safe headless/offline render entrypoint exists yet. GUI automation is forbidden."
  };
}

export function createRenderPlan({
  mode = "dry-run",
  inputPath,
  presetPath,
  renderRoot = rendersDir,
  sessionId = timestampId(),
  presetId,
  jobId,
  renderPathOverride = null
}) {
  const safePresetId = slug(presetId || path.basename(presetPath, path.extname(presetPath)));
  const safeJobId = slug(jobId || safePresetId);
  const uniqueOutput = uniqueOutputDirectory(renderRoot, sessionId, safeJobId);
  const outputDirectory = uniqueOutput.outputDirectory;
  const processedWavPath = path.join(outputDirectory, "processed.wav");
  const inputMetadataPath = path.join(outputDirectory, "input-metadata.json");
  const metricsPath = path.join(outputDirectory, "metrics.json");
  const renderPath = renderPathOverride ?? detectSafeRenderPath();
  const realRenderAvailable = renderPath.available;
  const wantsRealRender = mode === "real";
  const status = wantsRealRender ? (realRenderAvailable ? "pending" : "blocked") : "dry_run";
  const messages = [];

  if (status === "dry_run") {
    messages.push("Dry-run only: input, preset, and output paths are validated but no processed WAV is written.");
    if (!realRenderAvailable) {
      messages.push(renderPath.message);
      messages.push("Next founder approval required: provide or approve a safe local headless/offline render command. GUI automation remains forbidden.");
    }
  }

  if (status === "blocked") {
    messages.push(renderPath.message);
    messages.push("Founder must approve a real local headless render entrypoint before processed WAV output can be created.");
  }

  if (!isInsideDirectory(renderRoot, outputDirectory) || !isInsideDirectory(renderRoot, processedWavPath)) {
    throw new Error(`Render output path escapes render root: ${outputDirectory}`);
  }

  return {
    mode,
    status,
    realRenderAvailable,
    renderPath,
    inputPath: path.resolve(inputPath),
    presetPath: path.resolve(presetPath),
    renderRoot: path.resolve(renderRoot),
    sessionId: uniqueOutput.sessionId,
    presetId: safePresetId,
    jobId: safeJobId,
    outputDirectory,
    inputMetadataPath,
    processedWavPath,
    metricsPath,
    messages
  };
}

async function fileHash(filePath) {
  const hash = crypto.createHash("sha256");
  const buffer = await fs.readFile(filePath);
  hash.update(buffer);
  return hash.digest("hex");
}

async function statSignature(filePath) {
  const stats = await fs.stat(filePath);
  return {
    sizeBytes: stats.size,
    modifiedMs: stats.mtimeMs,
    sha256: await fileHash(filePath)
  };
}

async function fileSignatureOrMissing(filePath) {
  try {
    return await statSignature(filePath);
  } catch {
    return null;
  }
}

async function dspCoreSignatures() {
  const entries = await Promise.all(dspCoreFiles.map(async (filePath) => [filePath, await fileSignatureOrMissing(filePath)]));
  return Object.fromEntries(entries);
}

function signaturesMatch(before, after) {
  return Object.keys(before).every((filePath) => {
    const beforeValue = before[filePath];
    const afterValue = after[filePath];

    if (beforeValue === null || afterValue === null) {
      return beforeValue === afterValue;
    }

    return beforeValue.sha256 === afterValue.sha256;
  });
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJsonNew(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

function runNativeRender(plan, { sampleRate = 48000, blockSize = 128 } = {}) {
  const powershell = process.platform === "win32" ? "powershell" : "pwsh";
  const result = spawnSync(
    powershell,
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      plan.renderPath.command,
      "-InputWav",
      plan.inputPath,
      "-PresetJson",
      plan.presetPath,
      "-PresetId",
      plan.presetId,
      "-OutputDir",
      plan.outputDirectory,
      "-SampleRate",
      String(sampleRate),
      "-BlockSize",
      String(blockSize)
    ],
    {
      encoding: "utf8",
      shell: false,
      windowsHide: true
    }
  );

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? result.error.message : null
  };
}

export async function renderWithAdapter(options) {
  const plan = createRenderPlan(options);
  const inputBefore = await statSignature(plan.inputPath);
  const dspBefore = await dspCoreSignatures();
  const preset = await readJson(plan.presetPath);
  const startedAt = new Date().toISOString();
  const result = {
    schemaVersion: 1,
    startedAt,
    completedAt: null,
    status: plan.status,
    mode: plan.mode,
    renderHookStatus: plan.status === "blocked" ? "blocked" : plan.status === "dry_run" ? "dry-run" : "real-render",
    inputPath: plan.inputPath,
    presetPath: plan.presetPath,
    presetId: plan.presetId,
    jobId: plan.jobId,
    renderPath: plan.renderPath,
    outputDirectory: plan.outputDirectory,
    processedWavPath: plan.status === "pending" ? plan.processedWavPath : null,
    metricsPath: plan.status === "pending" ? plan.metricsPath : null,
    messages: [...plan.messages],
    safety: {
      inputBefore,
      inputAfter: null,
      inputUnchanged: false,
      outputInsideRenderRoot: isInsideDirectory(plan.renderRoot, plan.outputDirectory),
      guiAutomationUsed: false,
      dspModifiedByAdapter: false,
      dspFilesBefore: dspBefore,
      dspFilesAfter: null,
      dspFilesUnchanged: false
    },
    metrics: null
  };

  await fs.mkdir(plan.outputDirectory, { recursive: true });
  await writeJsonNew(plan.inputMetadataPath, {
    schemaVersion: 1,
    inputPath: plan.inputPath,
    presetPath: plan.presetPath,
    presetId: plan.presetId,
    jobId: plan.jobId,
    mode: plan.mode,
    renderHookStatus: result.renderHookStatus,
    preset,
    note: "Internal AMP_SIM_LAB render metadata. No GUI automation. No DSP edits."
  });

  if (plan.status === "pending") {
    const nativeRender = runNativeRender(plan, options);
    result.nativeRender = nativeRender;

    if (nativeRender.error) {
      result.status = "failed";
      result.renderHookStatus = "blocked";
      result.processedWavPath = null;
      result.metricsPath = null;
      result.messages.push(`Native render command could not start: ${nativeRender.error}`);
    } else if (nativeRender.exitCode !== 0) {
      result.status = "failed";
      result.renderHookStatus = "real-render";
      result.processedWavPath = null;
      result.metricsPath = null;
      result.messages.push(`Native render command failed with exit code ${nativeRender.exitCode}.`);
      if (nativeRender.stderr.trim()) {
        result.messages.push(nativeRender.stderr.trim());
      }
      if (nativeRender.stdout.trim()) {
        result.messages.push(nativeRender.stdout.trim());
      }
    } else if (!fsSync.existsSync(plan.processedWavPath)) {
      result.status = "failed";
      result.renderHookStatus = "real-render";
      result.processedWavPath = null;
      result.metricsPath = null;
      result.messages.push("Native render command exited successfully but processed.wav was not created.");
      if (nativeRender.stdout.trim()) {
        result.messages.push(nativeRender.stdout.trim());
      }
    } else {
      result.status = "rendered";
      result.renderHookStatus = "real-render";
      result.processedWavPath = plan.processedWavPath;
      result.metricsPath = plan.metricsPath;
      result.messages.push("Real headless render completed through ThallbyssalOfflineRenderer.");
      if (nativeRender.stdout.trim()) {
        result.messages.push(nativeRender.stdout.trim());
      }
    }
  }

  if (result.processedWavPath && fsSync.existsSync(result.processedWavPath)) {
    result.metrics = analyzeWavFile(result.processedWavPath);
    await writeJsonNew(plan.metricsPath, result.metrics);
  }

  result.safety.inputAfter = await statSignature(plan.inputPath);
  result.safety.inputUnchanged = result.safety.inputBefore.sha256 === result.safety.inputAfter.sha256;
  result.safety.dspFilesAfter = await dspCoreSignatures();
  result.safety.dspFilesUnchanged = signaturesMatch(result.safety.dspFilesBefore, result.safety.dspFilesAfter);
  result.safety.dspModifiedByAdapter = !result.safety.dspFilesUnchanged;
  result.completedAt = new Date().toISOString();

  return result;
}

export function renderReportPaths() {
  return {
    json: path.join(reportsDir, "render-results.json"),
    html: path.join(reportsDir, "render-results.html")
  };
}
