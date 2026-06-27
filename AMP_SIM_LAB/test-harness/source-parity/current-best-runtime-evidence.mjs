import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportsDir } from "../lab-paths.mjs";

const thisFilePath = fileURLToPath(import.meta.url);

export const finalRuntimeMarker =
  "CURRENT BEST A2 FULL-RIG / GATE V0.7 / OUT+0.3 / PG8 / TW-OFF / CF2 / GS1 / PSET2 / BST1 / CHF1";

export const defaultRuntimeEvidenceReports = [
  {
    id: "auto-level-v03",
    label: "Auto Level v0.3 checkpoint",
    fileName: "current-best-auto-level-v03-runtime-probe.json",
    expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG", "GATE V0.6"]
  },
  {
    id: "peak-guard-v02",
    label: "Peak Guard v0.2 checkpoint",
    fileName: "current-best-peak-guard-v02-runtime-probe.json",
    expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG", "GATE V0.6"]
  },
  {
    id: "ui-runtime-latest",
    label: "UI runtime checkpoint",
    fileName: "current-best-ui-runtime-probe-latest.json",
    expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG", "OUT+0.3", "PG8", "TW-OFF", "CF2"]
  },
  {
    id: "pset2-bst1-chf1",
    label: "Known-good PSET2/BST1/CHF1 checkpoint",
    fileName: "current-best-product-runtime-probe-pset2-bst1-chf1.json",
    expectedMarkerParts: [
      "CURRENT BEST A2 FULL-RIG",
      "GATE V0.7",
      "OUT+0.3",
      "PG8",
      "TW-OFF",
      "CF2",
      "GS1",
      "PSET2",
      "BST1",
      "CHF1"
    ]
  }
].map((entry) => ({
  ...entry,
  path: path.join(reportsDir, entry.fileName)
}));

function round(value, digits = 6) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return null;
  }

  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function minMax(values) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...finite),
    max: Math.max(...finite)
  };
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined))];
}

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const looksUtf16Le = buffer.length >= 2
    && (buffer[0] === 0xff && buffer[1] === 0xfe
      || buffer.slice(0, Math.min(buffer.length, 128)).some((byte, index) => index % 2 === 1 && byte === 0));
  const text = buffer.toString(looksUtf16Le ? "utf16le" : "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

function hasAllMarkerParts(results, markerParts) {
  return markerParts.every((part) =>
    results.some((result) => String(result.status ?? "").includes(part) || String(result.diagnostics ?? "").includes(part))
  );
}

function summarizeResultSet(results) {
  const stable48k = results.filter((result) =>
    Number(result.sampleRate) === 48000
    && Number(result.blockSize) >= 256
  );
  const allPeaks = results.map((result) => Number(result.peak));
  const allRms = results.map((result) => Number(result.rms));
  const stablePeaks = stable48k.map((result) => Number(result.peak));
  const stableRms = stable48k.map((result) => Number(result.rms));
  const clippedSamples = results.map((result) => Number(result.clippedSamples) || 0);

  return {
    resultCount: results.length,
    sampleRates: unique(results.map((result) => Number(result.sampleRate))).sort((a, b) => a - b),
    blockSizes: unique(results.map((result) => Number(result.blockSize))).sort((a, b) => a - b),
    latencySamples: unique(results.map((result) => Number(result.latencySamples))).sort((a, b) => a - b),
    liveV1NamActiveAll: results.length > 0 && results.every((result) => result.liveV1NamActive === true),
    totalClippedSamples: clippedSamples.reduce((sum, value) => sum + value, 0),
    maxClippedSamples: clippedSamples.length > 0 ? Math.max(...clippedSamples) : 0,
    allPeak: {
      ...minMax(allPeaks),
      mean: mean(allPeaks)
    },
    allRms: {
      ...minMax(allRms),
      mean: mean(allRms)
    },
    stable48k: {
      resultCount: stable48k.length,
      peak: {
        ...minMax(stablePeaks),
        mean: mean(stablePeaks)
      },
      rms: {
        ...minMax(stableRms),
        mean: mean(stableRms)
      }
    },
    statuses: unique(results.map((result) => result.status)),
    diagnostics: unique(results.map((result) => result.diagnostics))
  };
}

function summarizeMilestone(entry) {
  const absolutePath = path.resolve(entry.path);
  const loaded = readJsonIfExists(absolutePath);
  const results = Array.isArray(loaded?.results) ? loaded.results : [];
  const summary = summarizeResultSet(results);

  return {
    id: entry.id,
    label: entry.label,
    path: absolutePath,
    exists: Boolean(loaded),
    expectedMarkerParts: entry.expectedMarkerParts ?? [],
    expectedMarkerPresent: loaded ? hasAllMarkerParts(results, entry.expectedMarkerParts ?? []) : false,
    generatedInputOnly: loaded?.generatedInputOnly ?? null,
    productionAudioProcessed: loaded?.productionAudioProcessed ?? null,
    ...summary
  };
}

function calculateDeltas(milestones, finalMilestoneId = "pset2-bst1-chf1") {
  const final = milestones.find((milestone) => milestone.id === finalMilestoneId);
  const finalPeak = final?.stable48k?.peak?.mean;
  const finalRms = final?.stable48k?.rms?.mean;

  return milestones.map((milestone) => {
    const peak = milestone.stable48k?.peak?.mean;
    const rms = milestone.stable48k?.rms?.mean;
    return {
      id: milestone.id,
      stable48kPeakDeltaFromFinal: Number.isFinite(peak) && Number.isFinite(finalPeak)
        ? round(peak - finalPeak)
        : null,
      stable48kRmsDeltaFromFinal: Number.isFinite(rms) && Number.isFinite(finalRms)
        ? round(rms - finalRms)
        : null
    };
  });
}

export function createRuntimeEvidenceReport({
  reportEntries = defaultRuntimeEvidenceReports,
  generatedAt = new Date().toISOString()
} = {}) {
  const milestones = reportEntries.map(summarizeMilestone);
  const finalMilestone = milestones.find((milestone) => milestone.id === "pset2-bst1-chf1");
  const blocked = milestones.some((milestone) => !milestone.exists);
  const finalMarkerFound = Boolean(finalMilestone?.expectedMarkerPresent);
  const safeRuntimeEvidence = milestones.every((milestone) =>
    milestone.exists
    && milestone.liveV1NamActiveAll
    && milestone.totalClippedSamples === 0
  );

  return {
    schemaVersion: 1,
    generatedAt,
    purpose: "Internal source-recovery evidence matrix for the known-good Current Best beta runtime path.",
    boundaries: [
      "Report-only. No DSP, product default, preset, NAM, IR, or audio asset changes.",
      "Runtime reports use generated probe input only and do not prove founder listening approval.",
      "This report is source-recovery evidence, not a release or parity approval."
    ],
    finalRuntimeMarker,
    status: !blocked && finalMarkerFound && safeRuntimeEvidence
      ? "runtime-evidence-ready"
      : "blocked-or-partial",
    summary: {
      milestones: milestones.length,
      missingMilestones: milestones.filter((milestone) => !milestone.exists).length,
      finalMarkerFound,
      safeRuntimeEvidence,
      sourceParityClaimAllowed: false
    },
    milestones,
    deltasFromFinal: calculateDeltas(milestones),
    recoveryImplications: [
      "The known-good beta is an A2 full-rig path with a 48 kHz NAM adapter at non-48 kHz host rates.",
      "The stable generated-input probe peak target is roughly 0.93 linear with zero clipped samples.",
      "Peak safety alone is insufficient for source parity; the recovered source probe also needs the final output polish/headroom and PSET2/BST1/CHF1/CHUG-UI2 settings.",
      "Do not overwrite or replace the known-good playable beta until a source-built candidate matches marker, load state, clipping checks, and source parity evidence."
    ],
    nextAction: "Use this evidence matrix to implement the next source-recovery probe variant, then compare against known-good beta renders with npm run lab:source-parity."
  };
}

function formatNumber(value, digits = 6) {
  return Number.isFinite(value) ? round(value, digits).toFixed(digits) : "(n/a)";
}

export function createRuntimeEvidenceMarkdown(report) {
  const rows = report.milestones.map((milestone) => {
    const delta = report.deltasFromFinal.find((item) => item.id === milestone.id) ?? {};
    return [
      milestone.id,
      milestone.exists ? "yes" : "no",
      milestone.expectedMarkerPresent ? "yes" : "no",
      milestone.liveV1NamActiveAll ? "yes" : "no",
      milestone.totalClippedSamples,
      formatNumber(milestone.stable48k?.peak?.mean),
      formatNumber(milestone.stable48k?.rms?.mean),
      formatNumber(delta.stable48kPeakDeltaFromFinal),
      formatNumber(delta.stable48kRmsDeltaFromFinal)
    ].join(" | ");
  }).map((row) => `| ${row} |`).join("\n");

  return `# Current Best Runtime Evidence Matrix

Generated: ${report.generatedAt}

Status: ${report.status}

## Boundaries

${report.boundaries.map((boundary) => `- ${boundary}`).join("\n")}

## Final Runtime Marker

\`${report.finalRuntimeMarker}\`

## Summary

- Milestones: ${report.summary.milestones}
- Missing milestones: ${report.summary.missingMilestones}
- Final marker found: ${report.summary.finalMarkerFound ? "yes" : "no"}
- Safe runtime evidence: ${report.summary.safeRuntimeEvidence ? "yes" : "no"}
- Source parity claim allowed: no

## Milestones

| Milestone | Exists | Marker present | NAM active | Clips | 48k stable peak mean | 48k stable RMS mean | Peak delta from final | RMS delta from final |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
${rows}

## Recovery Implications

${report.recoveryImplications.map((item) => `- ${item}`).join("\n")}

## Next Action

${report.nextAction}
`;
}

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function writeText(filePath, value) {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  await fsPromises.writeFile(filePath, value, "utf8");
}

async function main() {
  const jsonPath = path.resolve(argValue("--json", path.join(reportsDir, "current-best-runtime-evidence-matrix.json")));
  const markdownPath = path.resolve(argValue("--md", path.join(reportsDir, "current-best-runtime-evidence-matrix.md")));
  const report = createRuntimeEvidenceReport();

  await writeText(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeText(markdownPath, createRuntimeEvidenceMarkdown(report));

  console.log(`Current Best runtime evidence JSON written: ${jsonPath}`);
  console.log(`Current Best runtime evidence markdown written: ${markdownPath}`);
  console.log(`Status: ${report.status}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFilePath)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
