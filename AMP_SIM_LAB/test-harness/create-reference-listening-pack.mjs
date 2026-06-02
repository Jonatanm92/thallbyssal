import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeWavFile } from "./audio-metrics.mjs";
import { generatedRoot } from "./lab-paths.mjs";
import { isInsideDirectory } from "./render-hook/render-adapter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function dbfs(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return -Infinity;
  }

  return 20 * Math.log10(value);
}

export function dbToLinear(db) {
  return Math.pow(10, db / 20);
}

export function calculateLevelMatchGain({ rmsDbfs, peakDbfs, targetRmsDbfs = -23, maxPeakDbfs = -1 }) {
  if (!Number.isFinite(rmsDbfs) || !Number.isFinite(peakDbfs)) {
    return {
      desiredGainDb: 0,
      appliedGainDb: 0,
      predictedPeakDbfs: peakDbfs,
      gainLimitedByHeadroom: false,
      warning: "Source metrics were not finite; no gain was applied."
    };
  }

  const desiredGainDb = targetRmsDbfs - rmsDbfs;
  const maxSafeGainDb = maxPeakDbfs - peakDbfs;
  const appliedGainDb = Math.min(desiredGainDb, maxSafeGainDb);

  return {
    desiredGainDb,
    appliedGainDb,
    predictedPeakDbfs: peakDbfs + appliedGainDb,
    gainLimitedByHeadroom: appliedGainDb < desiredGainDb - 0.01,
    warning: appliedGainDb < desiredGainDb - 0.01
      ? `Gain was limited by headroom to keep peak below ${maxPeakDbfs} dBFS.`
      : null
  };
}

export function resolveCandidateStatus(candidateId) {
  const rejectedCandidateReasons = {
    "reference-tight-dark": "Founder feedback: rejected as a base tone. Keep only for comparison; do not continue from this preset.",
    "reference-precision-response": "Founder feedback: rejected as dead/incorrect tone. Do not continue from this preset.",
    "reference-heavy-weight": "Founder feedback: rejected as dead/incorrect tone. Do not continue from this preset."
  };

  if (rejectedCandidateReasons[candidateId]) {
    return {
      status: "rejected",
      reason: rejectedCandidateReasons[candidateId]
    };
  }

  return {
    status: "active",
    reason: "Still available for audition."
  };
}

function readAscii(buffer, offset, length) {
  return buffer.toString("ascii", offset, offset + length);
}

function findWavChunks(buffer) {
  if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE") {
    throw new Error("Not a RIFF/WAVE file");
  }

  let cursor = 12;
  let format = null;
  let dataOffset = -1;
  let dataSize = 0;

  while (cursor + 8 <= buffer.length) {
    const chunkId = readAscii(buffer, cursor, 4);
    const chunkSize = buffer.readUInt32LE(cursor + 4);
    const chunkDataOffset = cursor + 8;

    if (chunkId === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(chunkDataOffset),
        channels: buffer.readUInt16LE(chunkDataOffset + 2),
        sampleRate: buffer.readUInt32LE(chunkDataOffset + 4),
        byteRate: buffer.readUInt32LE(chunkDataOffset + 8),
        blockAlign: buffer.readUInt16LE(chunkDataOffset + 12),
        bitsPerSample: buffer.readUInt16LE(chunkDataOffset + 14)
      };
    }

    if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
    }

    cursor = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (format === null) {
    throw new Error("Missing WAV fmt chunk");
  }

  if (dataOffset < 0 || dataSize <= 0) {
    throw new Error("Missing WAV data chunk");
  }

  return { format, dataOffset, dataSize };
}

function readSample(buffer, offset, bytesPerSample, audioFormat) {
  if (audioFormat === 3 && bytesPerSample === 4) {
    return buffer.readFloatLE(offset);
  }

  if (audioFormat !== 1) {
    throw new Error(`Unsupported WAV audio format: ${audioFormat}`);
  }

  if (bytesPerSample === 1) {
    return (buffer.readUInt8(offset) - 128) / 128;
  }

  if (bytesPerSample === 2) {
    return buffer.readInt16LE(offset) / 32768;
  }

  if (bytesPerSample === 3) {
    const unsigned = buffer.readUIntLE(offset, 3);
    const signed = unsigned & 0x800000 ? unsigned - 0x1000000 : unsigned;
    return signed / 8388608;
  }

  if (bytesPerSample === 4) {
    return buffer.readInt32LE(offset) / 2147483648;
  }

  throw new Error(`Unsupported PCM sample width: ${bytesPerSample} bytes`);
}

function writeSample(buffer, offset, bytesPerSample, audioFormat, sample) {
  const clipped = Math.max(-1, Math.min(0.999999, sample));

  if (audioFormat === 3 && bytesPerSample === 4) {
    buffer.writeFloatLE(clipped, offset);
    return;
  }

  if (audioFormat !== 1) {
    throw new Error(`Unsupported WAV audio format: ${audioFormat}`);
  }

  if (bytesPerSample === 1) {
    buffer.writeUInt8(Math.max(0, Math.min(255, Math.round(clipped * 128 + 128))), offset);
    return;
  }

  if (bytesPerSample === 2) {
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(clipped * 32768))), offset);
    return;
  }

  if (bytesPerSample === 3) {
    buffer.writeIntLE(Math.max(-8388608, Math.min(8388607, Math.round(clipped * 8388608))), offset, 3);
    return;
  }

  if (bytesPerSample === 4) {
    buffer.writeInt32LE(Math.max(-2147483648, Math.min(2147483647, Math.round(clipped * 2147483648))), offset);
    return;
  }

  throw new Error(`Unsupported PCM sample width: ${bytesPerSample} bytes`);
}

export async function writeGainMatchedWav({ sourcePath, outputPath, gainDb }) {
  const sourceBuffer = await fs.readFile(sourcePath);
  const outputBuffer = Buffer.from(sourceBuffer);
  const { format, dataOffset, dataSize } = findWavChunks(outputBuffer);
  const bytesPerSample = format.bitsPerSample / 8;
  const frameCount = Math.floor(dataSize / format.blockAlign);
  const gain = dbToLinear(gainDb);
  let peak = 0;
  let clippedSamples = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const frameOffset = dataOffset + frame * format.blockAlign;

    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = frameOffset + channel * bytesPerSample;
      const inputSample = readSample(outputBuffer, sampleOffset, bytesPerSample, format.audioFormat);
      const outputSample = inputSample * gain;
      const absolute = Math.abs(outputSample);

      peak = Math.max(peak, absolute);
      if (absolute >= 0.999) {
        clippedSamples += 1;
      }

      writeSample(outputBuffer, sampleOffset, bytesPerSample, format.audioFormat, outputSample);
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, outputBuffer, { flag: "wx" });

  return {
    outputPeakDbfs: dbfs(peak),
    clippedSamplesBeforeWriteClamp: clippedSamples
  };
}

export async function writeBrowserPreviewWav({ sourcePath, outputPath }) {
  const sourceBuffer = await fs.readFile(sourcePath);
  const { format, dataOffset, dataSize } = findWavChunks(sourceBuffer);
  const inputBytesPerSample = format.bitsPerSample / 8;
  const outputBytesPerSample = 2;
  const frameCount = Math.floor(dataSize / format.blockAlign);
  const outputBlockAlign = format.channels * outputBytesPerSample;
  const outputDataSize = frameCount * outputBlockAlign;
  const outputBuffer = Buffer.alloc(44 + outputDataSize);
  let peak = 0;
  let clippedSamples = 0;

  outputBuffer.write("RIFF", 0, "ascii");
  outputBuffer.writeUInt32LE(36 + outputDataSize, 4);
  outputBuffer.write("WAVE", 8, "ascii");
  outputBuffer.write("fmt ", 12, "ascii");
  outputBuffer.writeUInt32LE(16, 16);
  outputBuffer.writeUInt16LE(1, 20);
  outputBuffer.writeUInt16LE(format.channels, 22);
  outputBuffer.writeUInt32LE(format.sampleRate, 24);
  outputBuffer.writeUInt32LE(format.sampleRate * outputBlockAlign, 28);
  outputBuffer.writeUInt16LE(outputBlockAlign, 32);
  outputBuffer.writeUInt16LE(16, 34);
  outputBuffer.write("data", 36, "ascii");
  outputBuffer.writeUInt32LE(outputDataSize, 40);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const inputFrameOffset = dataOffset + frame * format.blockAlign;
    const outputFrameOffset = 44 + frame * outputBlockAlign;

    for (let channel = 0; channel < format.channels; channel += 1) {
      const inputSampleOffset = inputFrameOffset + channel * inputBytesPerSample;
      const outputSampleOffset = outputFrameOffset + channel * outputBytesPerSample;
      const sample = readSample(sourceBuffer, inputSampleOffset, inputBytesPerSample, format.audioFormat);
      const clipped = Math.max(-1, Math.min(0.999969, sample));
      const absolute = Math.abs(sample);

      peak = Math.max(peak, absolute);
      if (absolute >= 0.999) {
        clippedSamples += 1;
      }

      outputBuffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(clipped * 32768))), outputSampleOffset);
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, outputBuffer, { flag: "wx" });

  return {
    outputPeakDbfs: dbfs(peak),
    clippedSamplesBeforeWriteClamp: clippedSamples
  };
}

async function collectReportFiles(root) {
  const matches = [];

  async function walk(directory) {
    let entries = [];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        return;
      }

      if (entry.isFile() && entry.name === "reference-candidate-render-report.json") {
        const stats = await fs.stat(fullPath);
        matches.push({ filePath: fullPath, modifiedMs: stats.mtimeMs });
      }
    }));
  }

  await walk(root);
  return matches.sort((a, b) => b.modifiedMs - a.modifiedMs).map((match) => match.filePath);
}

export async function findLatestReferenceCandidateReport() {
  const referenceRoot = path.join(generatedRoot, "reference-tones");
  const matches = await collectReportFiles(referenceRoot);
  return matches[0] ?? null;
}

function parseArgs(argv) {
  const options = {
    report: null,
    targetRmsDbfs: -23,
    maxPeakDbfs: -1,
    sessionId: timestampId()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--report" && next) {
      options.report = next;
      index += 1;
    } else if (arg === "--target-rms" && next) {
      options.targetRmsDbfs = Number(next);
      index += 1;
    } else if (arg === "--max-peak" && next) {
      options.maxPeakDbfs = Number(next);
      index += 1;
    } else if (arg === "--session-id" && next) {
      options.sessionId = next;
      index += 1;
    }
  }

  return options;
}

function renderHtml(packReport) {
  const rows = packReport.entries.map((entry) => {
    const source = entry.sourceMetrics;
    const matched = entry.matchedMetrics;
    const audioPath = entry.relativePreviewPath ?? entry.relativeMatchedPath;

    return `<section class="clip ${entry.type}">
      <div>
        <h2>${entry.order}. ${entry.label}${entry.candidateStatus?.status === "rejected" ? " (rejected)" : ""}</h2>
        <p class="meta">${entry.type} | ${entry.candidateStatus?.status ?? "reference"} | gain ${entry.appliedGainDb.toFixed(2)} dB | source RMS ${source.rmsDbfs.toFixed(2)} dBFS | matched RMS ${matched.rmsDbfs.toFixed(2)} dBFS | peak ${matched.peakDbfs.toFixed(2)} dBFS</p>
        ${entry.candidateStatus?.status === "rejected" ? `<p class="warn">${entry.candidateStatus.reason}</p>` : ""}
        ${entry.warning ? `<p class="warn">${entry.warning}</p>` : ""}
      </div>
      <audio controls preload="metadata" src="${audioPath.replaceAll("\\", "/")}"></audio>
      <p class="source">${entry.sourcePath}</p>
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Thallbyssal Reference Listening Pack</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 32px; background: #0e1117; color: #e5edf5; font-family: Arial, sans-serif; }
    h1 { margin-bottom: 6px; }
    .summary { color: #b8c3cf; line-height: 1.55; }
    .clip { border: 1px solid #2c3441; border-radius: 8px; padding: 16px; margin: 14px 0; background: #151a22; }
    .clip h2 { margin: 0 0 6px; font-size: 18px; }
    .meta, .source { color: #9ca8b7; font-size: 13px; }
    .source { word-break: break-all; }
    .warn { color: #facc15; }
    audio { width: 100%; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Thallbyssal Reference Listening Pack</h1>
  <p class="summary">Generated: ${packReport.generatedAt}<br>
  Target RMS: ${packReport.targetRmsDbfs} dBFS | Max peak: ${packReport.maxPeakDbfs} dBFS<br>
  Private founder-only audition pack. These are gain-matched copies only; originals, presets, and DSP are unchanged.</p>
  <p><a href="./audition.html">Open simple audition page</a> | <a href="./review.html">Open founder review sheet</a></p>
  ${rows}
</body>
</html>`;
}

export function createReviewModel(packReport) {
  const entries = packReport.entries ?? [];

  return {
    schemaVersion: 1,
    localOnly: true,
    criteria: [
      "overall_feel",
      "tightness",
      "pick_attack",
      "low_end_control",
      "clarity",
      "gate_feel",
      "cab_bite"
    ],
    references: entries
      .filter((entry) => entry.type === "private-reference")
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        audioPath: entry.relativePreviewPath ?? entry.relativeMatchedPath
      })),
    candidates: entries
      .filter((entry) => entry.type === "thallbyssal-candidate" && entry.candidateStatus?.status !== "rejected")
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        status: entry.candidateStatus?.status ?? "active",
        audioPath: entry.relativePreviewPath ?? entry.relativeMatchedPath
      })),
    rejectedCandidates: entries
      .filter((entry) => entry.type === "thallbyssal-candidate" && entry.candidateStatus?.status === "rejected")
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        status: "rejected",
        reason: entry.candidateStatus.reason,
        audioPath: entry.relativePreviewPath ?? entry.relativeMatchedPath
      }))
  };
}

function humanizeCriterion(value) {
  return value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function renderReviewHtml(packReport) {
  const reviewModel = createReviewModel(packReport);
  const candidateSections = reviewModel.candidates.map((candidate) => {
    const sliders = reviewModel.criteria.map((criterion) => `<label>
        <span>${humanizeCriterion(criterion)}</span>
        <input data-candidate="${candidate.id}" data-field="${criterion}" type="range" min="1" max="10" value="5">
      </label>`).join("\n");

    return `<section class="candidate">
      <h2>${candidate.label}</h2>
      <audio controls src="${candidate.audioPath.replaceAll("\\", "/")}"></audio>
      <div class="sliders">${sliders}</div>
      <label class="notes">
        <span>Notes</span>
        <textarea data-candidate="${candidate.id}" data-field="notes" rows="4" placeholder="Write what feels close, wrong, too bassy, too sharp, too soft, etc."></textarea>
      </label>
    </section>`;
  }).join("\n");
  const referenceRows = reviewModel.references.map((reference) => `<li>${reference.label}<audio controls src="${reference.audioPath.replaceAll("\\", "/")}"></audio></li>`).join("\n");
  const rejectedRows = reviewModel.rejectedCandidates.map((candidate) => `<li><strong>${candidate.label}</strong>: ${candidate.reason}<audio controls src="${candidate.audioPath.replaceAll("\\", "/")}"></audio></li>`).join("\n");
  const modelJson = JSON.stringify(reviewModel).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Founder Tone Review</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 32px; background: #0e1117; color: #e5edf5; font-family: Arial, sans-serif; max-width: 1180px; }
    h1 { margin-bottom: 6px; }
    a { color: #93c5fd; }
    .summary, .hint { color: #aab7c4; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .candidate, .references { border: 1px solid #2c3441; border-radius: 8px; padding: 16px; background: #151a22; }
    .candidate h2 { margin-top: 0; }
    audio { width: 100%; margin: 8px 0 14px; }
    label { display: grid; grid-template-columns: 145px 1fr; align-items: center; gap: 12px; margin: 9px 0; color: #d8e0eb; }
    input[type="range"] { width: 100%; }
    textarea { width: 100%; box-sizing: border-box; resize: vertical; background: #0f141c; color: #e5edf5; border: 1px solid #374151; border-radius: 6px; padding: 10px; }
    .notes { display: block; }
    .notes span { display: block; margin-bottom: 6px; }
    button { background: #e5edf5; color: #0e1117; border: 0; border-radius: 6px; padding: 10px 14px; font-weight: 700; cursor: pointer; margin-right: 10px; }
    pre { white-space: pre-wrap; background: #05070a; border: 1px solid #2c3441; border-radius: 8px; padding: 12px; }
    li { margin: 12px 0; }
  </style>
</head>
<body>
  <h1>Founder Tone Review</h1>
  <p class="summary">Local-only feedback sheet. Nothing is uploaded. Use this after listening to the level-matched files, then export JSON for the next preset-only iteration.</p>
  <p><a href="./index.html">Back to listening pack</a></p>
  <section class="references">
    <h2>References</h2>
    <ul>${referenceRows}</ul>
  </section>
  ${rejectedRows ? `<section class="references"><h2>Rejected Candidates</h2><ul>${rejectedRows}</ul></section>` : ""}
  <div class="grid">${candidateSections}</div>
  <p class="hint">Scores are 1-10. Use 5 as neutral. The notes matter more than the numbers.</p>
  <button id="export-json">Export Feedback JSON</button>
  <button id="copy-json">Copy JSON</button>
  <pre id="feedback-output"></pre>
  <script>
    const reviewModel = ${modelJson};
    const storageKey = "thallbyssal-founder-review-" + reviewModel.candidates.map((candidate) => candidate.id).join("-");
    const output = document.querySelector("#feedback-output");

    function collectFeedback() {
      const feedback = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        localOnly: true,
        candidates: reviewModel.candidates.map((candidate) => {
          const result = { id: candidate.id, label: candidate.label, scores: {}, notes: "" };
          for (const criterion of reviewModel.criteria) {
            const input = document.querySelector('[data-candidate="' + candidate.id + '"][data-field="' + criterion + '"]');
            result.scores[criterion] = Number(input.value);
          }
          const notes = document.querySelector('[data-candidate="' + candidate.id + '"][data-field="notes"]');
          result.notes = notes.value;
          return result;
        })
      };
      localStorage.setItem(storageKey, JSON.stringify(feedback));
      output.textContent = JSON.stringify(feedback, null, 2);
      return feedback;
    }

    function restoreFeedback() {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        collectFeedback();
        return;
      }

      const feedback = JSON.parse(saved);
      for (const candidate of feedback.candidates || []) {
        for (const [field, value] of Object.entries(candidate.scores || {})) {
          const input = document.querySelector('[data-candidate="' + candidate.id + '"][data-field="' + field + '"]');
          if (input) input.value = value;
        }
        const notes = document.querySelector('[data-candidate="' + candidate.id + '"][data-field="notes"]');
        if (notes) notes.value = candidate.notes || "";
      }
      collectFeedback();
    }

    document.querySelectorAll("input, textarea").forEach((input) => input.addEventListener("input", collectFeedback));
    document.querySelector("#copy-json").addEventListener("click", async () => {
      const feedback = collectFeedback();
      await navigator.clipboard.writeText(JSON.stringify(feedback, null, 2));
    });
    document.querySelector("#export-json").addEventListener("click", () => {
      const feedback = collectFeedback();
      const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "thallbyssal-founder-tone-feedback.json";
      link.click();
      URL.revokeObjectURL(url);
    });
    restoreFeedback();
  </script>
</body>
</html>`;
}

function renderAuditionHtml(packReport) {
  const activeCandidates = packReport.entries.filter((entry) => entry.type === "thallbyssal-candidate" && entry.candidateStatus?.status !== "rejected");
  const rejectedCandidates = packReport.entries.filter((entry) => entry.type === "thallbyssal-candidate" && entry.candidateStatus?.status === "rejected");
  const references = packReport.entries.filter((entry) => entry.type === "private-reference");
  const candidateCards = activeCandidates.map((entry) => {
    const audioPath = entry.relativePreviewPath ?? entry.relativeMatchedPath;
    return `<section class="card candidate">
      <h2>${entry.label}</h2>
      <p>Active candidate. Browser preview: 16-bit WAV.</p>
      <audio controls preload="metadata" src="${audioPath.replaceAll("\\", "/")}"></audio>
    </section>`;
  }).join("\n");
  const referenceCards = references.map((entry) => {
    const audioPath = entry.relativePreviewPath ?? entry.relativeMatchedPath;
    return `<section class="card">
      <h3>${entry.label}</h3>
      <audio controls preload="metadata" src="${audioPath.replaceAll("\\", "/")}"></audio>
    </section>`;
  }).join("\n");
  const rejectedCards = rejectedCandidates.map((entry) => {
    const audioPath = entry.relativePreviewPath ?? entry.relativeMatchedPath;
    return `<section class="card rejected">
      <h3>${entry.label}</h3>
      <p>${entry.candidateStatus.reason}</p>
      <audio controls preload="metadata" src="${audioPath.replaceAll("\\", "/")}"></audio>
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Thallbyssal Simple Audition</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 32px; background: #0e1117; color: #e5edf5; font-family: Arial, sans-serif; max-width: 1120px; }
    h1 { margin-bottom: 6px; }
    a { color: #93c5fd; }
    p { color: #aab7c4; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin: 16px 0 28px; }
    .card { border: 1px solid #2c3441; border-radius: 8px; padding: 16px; background: #151a22; }
    .candidate { border-color: #8fb3ff; }
    .rejected { opacity: 0.72; border-color: #7f1d1d; }
    audio { width: 100%; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Thallbyssal Simple Audition</h1>
  <p>Use this page first. It hides the lab clutter and uses browser-friendly 16-bit WAV previews.</p>
  <p><a href="./review.html">Open review sheet</a> | <a href="./index.html">Full report</a></p>
  <h2>Active Candidates</h2>
  <div class="grid">${candidateCards || "<p>No active candidates found.</p>"}</div>
  <h2>Private References</h2>
  <div class="grid">${referenceCards || "<p>No references found.</p>"}</div>
  ${rejectedCards ? `<h2>Rejected / Do Not Continue</h2><div class="grid">${rejectedCards}</div>` : ""}
</body>
</html>`;
}

function renderMarkdown(packReport) {
  const rows = packReport.entries.map((entry) => (
    `| ${entry.order} | ${entry.label} | ${entry.type} | ${entry.candidateStatus?.status ?? "reference"} | ${entry.appliedGainDb.toFixed(2)} | ${entry.matchedMetrics.rmsDbfs.toFixed(2)} | ${entry.matchedMetrics.peakDbfs.toFixed(2)} | ${entry.previewPath ?? entry.matchedPath} |`
  )).join("\n");

  return `# Thallbyssal Reference Listening Pack

Generated: ${packReport.generatedAt}

Private founder-only audition pack. These are gain-matched copies for listening only.

- Target RMS: ${packReport.targetRmsDbfs} dBFS
- Max peak: ${packReport.maxPeakDbfs} dBFS
- Source report: \`${packReport.sourceReportPath}\`
- DSP/core sound changed: no
- Preset values changed: no
- Original files modified: no

## Files

| # | Label | Type | Status | Gain dB | Matched RMS | Matched Peak | Browser File |
| ---: | --- | --- | --- | ---: | ---: | ---: | --- |
${rows}

## Listening Notes

- Closest candidate:
- Too dark/bright:
- Too bassy/thin:
- Pick attack too soft/sharp:
- Gate too hard/soft:
- Low-end too loose/tight:
- Cab bite too harsh/dull:
- Next preset-only move:
`;
}

function renderFounderNotes() {
  return `# Founder Listening Notes

Use this pack to compare feel, response, low-end, pick attack, clarity, and gate behavior without volume bias.

Do not judge by loudness. All files are gain-matched copies.

## Pick One Starting Point

- Closest candidate:
- Why:

## Quick Tone Notes

- More/less input push:
- More/less low-end:
- More/less bite:
- More/less smoothness:
- Faster/slower gate:
- More/less palm-mute grab:
- More/less octave/layer weight:

## Next Safe Move

- Preset-only tweak:
- Needs founder approval before DSP change:
`;
}

export async function createReferenceListeningPack(options = {}) {
  const reportPath = path.resolve(options.report ?? await findLatestReferenceCandidateReport() ?? "");
  if (!reportPath || !fsSync.existsSync(reportPath)) {
    throw new Error("No reference-candidate-render-report.json found. Run the reference candidate render first.");
  }

  const targetRmsDbfs = Number.isFinite(options.targetRmsDbfs) ? options.targetRmsDbfs : -23;
  const maxPeakDbfs = Number.isFinite(options.maxPeakDbfs) ? options.maxPeakDbfs : -1;
  const sessionId = options.sessionId ?? timestampId();
  const packRoot = path.join(generatedRoot, "listening-packs", "reference-candidates", sessionId);
  const matchedDir = path.join(packRoot, "matched");
  const previewDir = path.join(packRoot, "browser-preview");

  if (!isInsideDirectory(generatedRoot, packRoot)) {
    throw new Error(`Listening pack output escapes generated root: ${packRoot}`);
  }

  const sourceReport = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const usableRows = sourceReport.rows.filter((row) => row.analysis?.ok && row.path && fsSync.existsSync(row.path));
  const entries = [];

  for (const [index, row] of usableRows.entries()) {
    const sourceMetrics = row.analysis.metrics;
    const levelMatch = calculateLevelMatchGain({
      rmsDbfs: sourceMetrics.rmsDbfs,
      peakDbfs: sourceMetrics.peakDbfs,
      targetRmsDbfs,
      maxPeakDbfs
    });
    const order = String(index + 1).padStart(2, "0");
    const matchedFileName = `${order}-${slug(row.type)}-${slug(row.id || row.label)}.wav`;
    const matchedPath = path.join(matchedDir, matchedFileName);
    const previewPath = path.join(previewDir, matchedFileName);
    const writeResult = await writeGainMatchedWav({
      sourcePath: row.path,
      outputPath: matchedPath,
      gainDb: levelMatch.appliedGainDb
    });
    const previewResult = await writeBrowserPreviewWav({
      sourcePath: matchedPath,
      outputPath: previewPath
    });
    const matchedMetrics = analyzeWavFile(matchedPath);
    const previewMetrics = analyzeWavFile(previewPath);
    const candidateStatus = row.type === "thallbyssal-candidate" ? resolveCandidateStatus(row.id) : null;

    entries.push({
      order: index + 1,
      id: row.id,
      label: row.label,
      type: row.type,
      candidateStatus,
      sourcePath: row.path,
      matchedPath,
      previewPath,
      relativeMatchedPath: path.relative(packRoot, matchedPath),
      relativePreviewPath: path.relative(packRoot, previewPath),
      sourceMetrics,
      desiredGainDb: levelMatch.desiredGainDb,
      appliedGainDb: levelMatch.appliedGainDb,
      predictedPeakDbfs: levelMatch.predictedPeakDbfs,
      gainLimitedByHeadroom: levelMatch.gainLimitedByHeadroom,
      warning: levelMatch.warning,
      writeResult,
      previewResult,
      matchedMetrics,
      previewMetrics
    });
  }

  const packReport = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    purpose: "Private level-matched reference listening pack. No automatic tone judgement.",
    sourceReportPath: reportPath,
    outputRoot: packRoot,
    targetRmsDbfs,
    maxPeakDbfs,
    summary: {
      entries: entries.length,
      clippingCount: entries.filter((entry) => entry.matchedMetrics.clippedSamples > 0).length,
      gainLimitedCount: entries.filter((entry) => entry.gainLimitedByHeadroom).length,
      activeCandidateCount: entries.filter((entry) => entry.type === "thallbyssal-candidate" && entry.candidateStatus?.status !== "rejected").length,
      rejectedCandidateCount: entries.filter((entry) => entry.type === "thallbyssal-candidate" && entry.candidateStatus?.status === "rejected").length,
      browserPreviewFormat: "16-bit PCM WAV",
      originalFilesModified: false,
      dspCoreChanged: false,
      presetValuesChanged: false
    },
    entries
  };

  await fs.mkdir(packRoot, { recursive: true });
  await fs.writeFile(path.join(packRoot, "reference-listening-pack.json"), `${JSON.stringify(packReport, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(packRoot, "REFERENCE_LISTENING_PACK.md"), renderMarkdown(packReport), "utf8");
  await fs.writeFile(path.join(packRoot, "FOUNDERS_LISTENING_NOTES.md"), renderFounderNotes(), "utf8");
  await fs.writeFile(path.join(packRoot, "index.html"), renderHtml(packReport), "utf8");
  await fs.writeFile(path.join(packRoot, "audition.html"), renderAuditionHtml(packReport), "utf8");
  await fs.writeFile(path.join(packRoot, "review.html"), renderReviewHtml(packReport), "utf8");

  return packReport;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await createReferenceListeningPack(options);
    console.log(`Listening pack created: ${report.outputRoot}`);
    console.log(`Entries: ${report.summary.entries}`);
    console.log(`Clipping count: ${report.summary.clippingCount}`);
    console.log(`Open: ${path.join(report.outputRoot, "index.html")}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
