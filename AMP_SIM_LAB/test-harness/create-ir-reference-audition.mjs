import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeWavFile } from "./audio-metrics.mjs";
import { generatedRoot } from "./lab-paths.mjs";
import { findLatestReferenceCandidateReport, writeBrowserPreviewWav } from "./create-reference-listening-pack.mjs";
import { renderWithAdapter } from "./render-hook/render-adapter.mjs";

const __filename = fileURLToPath(import.meta.url);
const founderIrRoot = path.join(generatedRoot, "founder-assets", "irs");
const irExtensions = new Set([".wav", ".aif", ".aiff", ".flac"]);

export function isRenderableIrFileName(fileName) {
  return irExtensions.has(path.extname(fileName).toLowerCase());
}

function isHeavyRhythmIrCandidate(file) {
  const searchable = [file.name, file.relativePath, file.fullPath].filter(Boolean).join(" ");
  return !/(^|[\\/])clean([\\/]|$)|(^|[\\/])bd_cl_/i.test(searchable);
}

function timestampId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const padMs = (value) => String(value).padStart(3, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}_${padMs(date.getMilliseconds())}`;
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unnamed";
}

async function listFounderIrFiles() {
  const files = [];

  async function walk(directory) {
    let entries = [];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile() || !isRenderableIrFileName(entry.name)) {
        continue;
      }

      try {
        const stats = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          relativePath: path.relative(founderIrRoot, fullPath),
          fullPath,
          sizeBytes: stats.size
        });
      } catch {
        // Skip files that disappear while the user is moving folders around.
      }
    }
  }

  try {
    await fs.mkdir(founderIrRoot, { recursive: true });
  } catch {
    return [];
  }

  await walk(founderIrRoot);
  return files;
}

export function selectIrAuditionFiles(files, limit = 5) {
  const priorities = [
    "palmer",
    "mellow",
    "v1ldhjarta",
    "vildhjarta",
    "muv-blend",
    "muv-1",
    "humanitylastbreath",
    "humanity last breath",
    "extra intressanta",
    "extra interesting",
    "barong",
    "ml sound lab",
    "gonnojira",
    "lowspawner",
    "gravelfinder",
    "bomber",
    "coroner",
    "vd4"
  ];
  const scored = files
    .filter((file) => file.sizeBytes === undefined || file.sizeBytes > 0)
    .filter((file) => isHeavyRhythmIrCandidate(file))
    .map((file) => {
    const searchable = [file.name, file.relativePath, file.fullPath].filter(Boolean).join(" ").toLowerCase();
    const priorityIndex = priorities.findIndex((priority) => searchable.includes(priority));
    return {
      ...file,
      score: priorityIndex === -1 ? 1000 : priorityIndex
    };
  });

  const sorted = scored
    .sort((a, b) => a.score - b.score || (a.relativePath ?? a.name).localeCompare(b.relativePath ?? b.name));
  const selected = [];
  const selectedKeys = new Set();
  const selectedFolders = new Set();

  for (const file of sorted) {
    const key = file.fullPath ?? file.relativePath ?? file.name;
    const folder = path.dirname(file.relativePath ?? file.name);
    if (selectedFolders.has(folder)) {
      continue;
    }

    selected.push(file);
    selectedKeys.add(key);
    selectedFolders.add(folder);

    if (selected.length >= limit) {
      break;
    }
  }

  for (const file of sorted) {
    if (selected.length >= limit) {
      break;
    }

    const key = file.fullPath ?? file.relativePath ?? file.name;
    if (selectedKeys.has(key)) {
      continue;
    }

    selected.push(file);
    selectedKeys.add(key);
  }

  return selected.map(({ score, ...file }) => file);
}

export function createNativeIrAuditionPreset({ presetId, irFileName }) {
  return {
    schemaVersion: 1,
    app: "guitar-workflow-toolkit",
    target: "thall-lab-native-juce",
    song: {
      name: "Private IR Audition",
      artist: "Founder",
      tuning: "Unknown",
      tempo: 120,
      sourceFileName: ""
    },
    audio: {
      cabIrFileName: irFileName,
      inputGainDb: 0,
      outputGainDb: -6,
      transposeSemitones: 0,
      outputMode: "stereo"
    },
    transpose: {
      semitones: 0
    },
    octaveLayer: {
      semitones: -12,
      blend: 0
    },
    palmMute: {
      amount: 48,
      focusHz: 720
    },
    gate: {
      enabled: true,
      thresholdDb: -62,
      releaseMs: 52
    },
    grinder: {
      enabled: true,
      drive: 72
    },
    di: {
      amount: 0,
      smooth: 48,
      curve: 72
    },
    amp: {
      presetId,
      enabled: true,
      drive: 8.4,
      bass: 26,
      mid: 62,
      treble: 72,
      presence: 68,
      master: 70,
      outputDb: 0
    },
    cab: {
      enabled: true,
      irEnabled: true,
      blend: 0,
      lowCutHz: 95,
      highCutHz: 13500,
      resonance: 28,
      level: 0
    },
    clean: {
      enabled: false,
      mix: 0,
      space: 58,
      bass: 48,
      mid: 44,
      treble: 62,
      presence: 58,
      tone: 58,
      level: 0
    },
    fx: {
      enabled: false,
      mix: 0,
      size: 58,
      feedback: 34,
      grain: 0,
      pitch: 0,
      tone: 62,
      shimmer: 0,
      reverse: 0,
      stutter: 0,
      ring: 0,
      shimmerEnabled: false,
      reverseEnabled: false,
      stutterEnabled: false,
      ringEnabled: false
    },
    bass: {
      enabled: false,
      rootMidi: 28,
      octaveOffset: -1,
      drive: 0,
      click: 0,
      level: 0,
      humanizeMs: 0
    },
    pedalboard: [],
    groove: {
      id: "private-ir-audition"
    },
    pitchAutomation: [],
    ambientEffects: [],
    note: "Private IR audition preset. Uses existing DSP only. No public release approval."
  };
}

async function readReferenceInput() {
  const reportPath = await findLatestReferenceCandidateReport();
  if (!reportPath || !fsSync.existsSync(reportPath)) {
    throw new Error("No reference candidate report found. Cannot locate the founder DI input.");
  }

  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const inputPath = report.inputPath || report.rows?.find((row) => row.type === "dry-input")?.path;
  if (!inputPath || !fsSync.existsSync(inputPath)) {
    throw new Error("Reference report did not point to an existing DI input file.");
  }

  return {
    reportPath,
    inputPath,
    metrics: analyzeWavFile(inputPath)
  };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function summarizeRenderChainMetadata(metadata) {
  return {
    ampEnabled: metadata?.ampEnabled === true,
    grinderEnabled: metadata?.grinderEnabled === true,
    gateEnabled: metadata?.gateEnabled === true,
    cabIrARequested: metadata?.cabIrARequested === true,
    cabIrALoaded: metadata?.cabIrALoaded === true,
    rawInputPeakLinear: Number(metadata?.rawInputPeakLinear ?? metadata?.inputPeakLinear ?? 0),
    inputPeakLinear: Number(metadata?.inputPeakLinear ?? 0),
    diPeakLinear: Number(metadata?.diPeakLinear ?? 0),
    ampPeakLinear: Number(metadata?.ampPeakLinear ?? 0),
    outputPeakLinear: Number(metadata?.outputPeakLinear ?? 0)
  };
}

function renderHtml(report) {
  const rows = report.results.map((result) => `<section class="card">
  <h2>${result.irName}</h2>
  <p>Status: ${result.status} | Peak: ${result.metrics ? result.metrics.peakDbfs.toFixed(2) : "n/a"} dBFS | RMS: ${result.metrics ? result.metrics.rmsDbfs.toFixed(2) : "n/a"} dBFS</p>
  ${result.chain ? `<p>Chain: amp ${result.chain.ampEnabled ? "on" : "off"} | tightener ${result.chain.grinderEnabled ? "on" : "off"} | gate ${result.chain.gateEnabled ? "on" : "off"} | IR ${result.chain.cabIrALoaded ? "loaded" : "missing"}</p>
  <p>Peaks: raw ${result.chain.rawInputPeakLinear.toFixed(3)} | input ${result.chain.inputPeakLinear.toFixed(3)} | DI ${result.chain.diPeakLinear.toFixed(3)} | amp ${result.chain.ampPeakLinear.toFixed(3)} | out ${result.chain.outputPeakLinear.toFixed(3)}</p>` : ""}
  ${result.previewRelativePath ? `<audio controls preload="metadata" src="${result.previewRelativePath.replaceAll("\\", "/")}"></audio>` : "<p>No preview generated.</p>"}
  <p>Source folder: ${result.irRelativePath}</p>
  <p class="path">${result.irPath}</p>
</section>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Private IR Reference Audition</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 32px; background: #0e1117; color: #e5edf5; font-family: Arial, sans-serif; max-width: 1120px; }
    p { color: #aab7c4; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card { border: 1px solid #2c3441; border-radius: 8px; padding: 16px; background: #151a22; }
    audio { width: 100%; margin: 10px 0; }
    .path { word-break: break-all; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Private IR Reference Audition</h1>
  <p>This is a tone-reset audition. These renders actually load founder IR files through the native preset IR path. NAM files are reference-only for now.</p>
  <p>Selection priority: Palmer / Mellow, Extra intressanta, V1LD/Vild-like names, then the older known candidate names.</p>
  <p>Generated: ${report.generatedAt}</p>
  <div class="grid">${rows || "<p>No IR audition renders were created.</p>"}</div>
</body>
</html>`;
}

function renderMarkdown(report) {
  const rows = report.results.map((result) =>
    `| ${result.irRelativePath ?? result.irName} | ${result.status} | ${result.chain ? `${result.chain.ampEnabled ? "amp" : "no amp"} / ${result.chain.grinderEnabled ? "tightener" : "no tightener"} / ${result.chain.gateEnabled ? "gate" : "no gate"} / ${result.chain.cabIrALoaded ? "IR loaded" : "IR missing"}` : "n/a"} | ${result.metrics ? result.metrics.peakDbfs.toFixed(2) : "n/a"} | ${result.metrics ? result.metrics.rmsDbfs.toFixed(2) : "n/a"} | ${result.previewPath || ""} |`
  ).join("\n");

  return `# Private IR Reference Audition

Generated: ${report.generatedAt}

This is a tone-reset audition after the first guessed candidates were rejected as dead/incorrect. These renders actually load founder IR files through the native preset IR path.

- DSP/core sound changed: no
- NAM files loaded: no
- IR files used as public product assets: no
- Public release approved: no

| IR | Status | Chain | Peak dBFS | RMS dBFS | Preview |
| --- | --- | --- | ---: | ---: | --- |
${rows}
`;
}

export async function createIrReferenceAudition(options = {}) {
  const sessionId = options.sessionId ?? timestampId();
  const outputRoot = path.join(generatedRoot, "listening-packs", "ir-reference-auditions", sessionId);
  const presetRoot = path.join(outputRoot, "presets");
  const previewRoot = path.join(outputRoot, "browser-preview");
  const renderRoot = path.join(generatedRoot, "renders", "ir-reference-auditions");
  const referenceInput = await readReferenceInput();
  const selectedIrs = selectIrAuditionFiles(await listFounderIrFiles(), options.limit ?? 8);
  const results = [];

  await fs.mkdir(presetRoot, { recursive: true });
  await fs.mkdir(previewRoot, { recursive: true });

  for (const [index, ir] of selectedIrs.entries()) {
    const safeIrName = `${String(index + 1).padStart(2, "0")}-${slug(ir.name)}${path.extname(ir.name).toLowerCase() || ".wav"}`;
    const copiedIrPath = path.join(presetRoot, safeIrName);
    const presetId = `ir-reference-${String(index + 1).padStart(2, "0")}-${slug(ir.name)}`;
    const presetPath = path.join(presetRoot, `${presetId}.json`);
    const preset = createNativeIrAuditionPreset({ presetId, irFileName: safeIrName });

    await fs.copyFile(ir.fullPath, copiedIrPath);
    await fs.writeFile(presetPath, `${JSON.stringify(preset, null, 2)}\n`, "utf8");

    const render = await renderWithAdapter({
      mode: "real",
      inputPath: referenceInput.inputPath,
      presetPath,
      renderRoot,
      sessionId,
      presetId,
      jobId: presetId,
      sampleRate: referenceInput.metrics.sampleRate,
      blockSize: 128
    });
    const previewPath = render.processedWavPath ? path.join(previewRoot, `${presetId}.wav`) : null;

    if (previewPath) {
      await writeBrowserPreviewWav({
        sourcePath: render.processedWavPath,
        outputPath: previewPath
      });
    }

    const renderMetadataPath = render.outputDirectory ? path.join(render.outputDirectory, "render-metadata.json") : null;
    const renderMetadata = renderMetadataPath ? await readJsonIfExists(renderMetadataPath) : null;
    const chain = renderMetadata ? summarizeRenderChainMetadata(renderMetadata) : null;

    results.push({
      irName: ir.name,
      irRelativePath: ir.relativePath ?? ir.name,
      irPath: ir.fullPath,
      copiedIrPath,
      presetPath,
      status: render.status,
      renderOutput: render.processedWavPath,
      renderMetadataPath,
      chain,
      previewPath,
      previewRelativePath: previewPath ? path.relative(outputRoot, previewPath) : null,
      metrics: render.metrics,
      messages: render.messages
    });
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    purpose: "Private IR reference audition using existing DSP and founder-owned/private IR files.",
    outputRoot,
    sourceReportPath: referenceInput.reportPath,
    inputPath: referenceInput.inputPath,
    safety: {
      dspChanged: false,
      namLoaded: false,
      publicReleaseApproved: false,
      productBundlingApproved: false
    },
    summary: {
      attempted: results.length,
      rendered: results.filter((result) => result.status === "rendered").length,
      failed: results.filter((result) => result.status !== "rendered").length
    },
    results
  };

  await fs.writeFile(path.join(outputRoot, "ir-reference-audition.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(outputRoot, "IR_REFERENCE_AUDITION.md"), renderMarkdown(report), "utf8");
  await fs.writeFile(path.join(outputRoot, "audition.html"), renderHtml(report), "utf8");

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const report = await createIrReferenceAudition();
    console.log(`IR reference audition written: ${path.join(report.outputRoot, "audition.html")}`);
    console.log(`Attempted: ${report.summary.attempted}`);
    console.log(`Rendered: ${report.summary.rendered}`);
    console.log(`Failed: ${report.summary.failed}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
