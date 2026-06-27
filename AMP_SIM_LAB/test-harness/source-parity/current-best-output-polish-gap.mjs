import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportsDir } from "../lab-paths.mjs";
import {
  createSourceParityReport,
  defaultManifestPath
} from "./current-best-source-parity.mjs";

const thisFilePath = fileURLToPath(import.meta.url);

const fields = [
  ["rmsDbfs", "RMS"],
  ["lowRmsDbfs", "Low 0-120 Hz"],
  ["lowMidRmsDbfs", "Low-mid 120-500 Hz"],
  ["midRmsDbfs", "Mid 500-4000 Hz"],
  ["highRmsDbfs", "High 4000+ Hz"]
];

function round(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function average(values) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return null;
  }

  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function fieldDelta(pair, field) {
  return pair.comparison?.fields?.[field]?.deltaSourceMinusBeta ?? null;
}

function summarizeField(pairs, field, label) {
  const deltas = pairs.map((pair) => fieldDelta(pair, field)).filter(Number.isFinite);
  return {
    field,
    label,
    averageDeltaDb: average(deltas),
    maxDeltaDb: deltas.length > 0 ? round(Math.max(...deltas)) : null,
    minDeltaDb: deltas.length > 0 ? round(Math.min(...deltas)) : null,
    pairsMeasured: deltas.length
  };
}

function classifyGap(summary) {
  const high = summary.fieldSummaries.highRmsDbfs?.averageDeltaDb;
  const mid = summary.fieldSummaries.midRmsDbfs?.averageDeltaDb;
  const lowMid = summary.fieldSummaries.lowMidRmsDbfs?.averageDeltaDb;
  const low = summary.fieldSummaries.lowRmsDbfs?.averageDeltaDb;
  const rms = summary.fieldSummaries.rmsDbfs?.averageDeltaDb;
  const flags = [];

  if (Number.isFinite(high) && high >= 3) {
    flags.push("excess-high-energy");
  }
  if (Number.isFinite(mid) && mid >= 3) {
    flags.push("excess-mid-energy");
  }
  if (Number.isFinite(lowMid) && lowMid >= 2) {
    flags.push("excess-low-mid-energy");
  }
  if (Number.isFinite(low) && Math.abs(low) <= 1.5 && Number.isFinite(high) && high >= 3) {
    flags.push("low-band-close-but-top-too-forward");
  }
  if (Number.isFinite(rms) && rms >= 2) {
    flags.push("source-rms-too-hot");
  }

  if (flags.length === 0) {
    flags.push("no-large-average-band-gap");
  }

  return flags;
}

function createNextMeasurement(summary) {
  const flags = new Set(summary.riskFlags);
  if (flags.has("excess-high-energy") && flags.has("excess-mid-energy")) {
    return "Next diagnostic pass should isolate product output polish/headroom filtering around the A2 full-rig path. Do not add another standalone limiter first; clipping safety alone already passed while mid/high remained too forward.";
  }

  if (flags.has("source-rms-too-hot")) {
    return "Next diagnostic pass should separate loudness calibration from spectral balance before any owner listening.";
  }

  return "Next diagnostic pass should add more exact Current Best runtime evidence before changing the probe formula.";
}

export function createOutputPolishGapReport({
  manifestPath = defaultManifestPath,
  parityReport = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const report = parityReport ?? createSourceParityReport({ manifestPath, generatedAt });
  const comparablePairs = report.pairs.filter((pair) => pair.comparison);
  const fieldSummaries = Object.fromEntries(
    fields.map(([field, label]) => [field, summarizeField(comparablePairs, field, label)])
  );
  const clippedSourcePairs = comparablePairs.filter((pair) => (pair.sourceMetrics?.clippedSamples ?? 0) > 0);
  const summary = {
    totalPairs: report.pairs.length,
    comparablePairs: comparablePairs.length,
    sourcePairsWithClipping: clippedSourcePairs.length,
    readyForListening: false,
    parityClaimAllowed: false,
    fieldSummaries
  };
  const riskFlags = classifyGap(summary);

  return {
    schemaVersion: 1,
    generatedAt,
    manifestPath: report.manifestPath,
    status: comparablePairs.length > 0 ? "measurement-ready-not-parity" : "blocked-missing-comparable-pairs",
    scope: {
      reportOnly: true,
      audioWritten: false,
      dspTouched: false,
      productDefaultsTouched: false,
      parityClaimAllowed: false
    },
    summary: {
      ...summary,
      riskFlags,
      nextMeasurement: createNextMeasurement({ ...summary, riskFlags })
    },
    pairs: comparablePairs.map((pair) => ({
      id: pair.id,
      status: pair.status,
      sourceProbeVariant: pair.sourceProbeMetadata?.probeVariant ?? null,
      rmsDeltaDb: fieldDelta(pair, "rmsDbfs"),
      lowDeltaDb: fieldDelta(pair, "lowRmsDbfs"),
      lowMidDeltaDb: fieldDelta(pair, "lowMidRmsDbfs"),
      midDeltaDb: fieldDelta(pair, "midRmsDbfs"),
      highDeltaDb: fieldDelta(pair, "highRmsDbfs"),
      sourceClippedSamples: pair.sourceMetrics?.clippedSamples ?? null,
      betaClippedSamples: pair.betaMetrics?.clippedSamples ?? null
    }))
  };
}

function formatDb(value) {
  return Number.isFinite(value) ? `${round(value).toFixed(2)} dB` : "(n/a)";
}

export function createOutputPolishGapMarkdown(report) {
  const fieldRows = fields.map(([field]) => {
    const summary = report.summary.fieldSummaries[field];
    return `| ${summary.label} | ${formatDb(summary.averageDeltaDb)} | ${formatDb(summary.minDeltaDb)} | ${formatDb(summary.maxDeltaDb)} | ${summary.pairsMeasured} |`;
  }).join("\n");

  const pairRows = report.pairs.map((pair) => (
    `| ${pair.id} | ${pair.status} | ${formatDb(pair.rmsDeltaDb)} | ${formatDb(pair.lowDeltaDb)} | ${formatDb(pair.lowMidDeltaDb)} | ${formatDb(pair.midDeltaDb)} | ${formatDb(pair.highDeltaDb)} | ${pair.sourceClippedSamples ?? "(n/a)"} |`
  )).join("\n");

  return `# Current Best Output Polish Gap

Generated: ${report.generatedAt}

Status: ${report.status}

Manifest: \`${report.manifestPath}\`

## Boundaries

- Measurement-only report.
- No audio written.
- No DSP, preset, product default, NAM, IR, or asset changes.
- No source parity claim.
- No owner listening approval.

## Summary

- Total pairs: ${report.summary.totalPairs}
- Comparable pairs: ${report.summary.comparablePairs}
- Source pairs with clipping: ${report.summary.sourcePairsWithClipping}
- Ready for listening: no
- Parity claim allowed: no
- Risk flags: ${report.summary.riskFlags.join(", ")}

## Average Source Minus Known-Good Beta Gap

| Band | Average delta | Min delta | Max delta | Pairs |
| --- | ---: | ---: | ---: | ---: |
${fieldRows || "| (none) | (n/a) | (n/a) | (n/a) | 0 |"}

## Pair Deltas

| Pair | Status | RMS | Low | Low-mid | Mid | High | Source clips |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
${pairRows || "| (none) | blocked | (n/a) | (n/a) | (n/a) | (n/a) | (n/a) | (n/a) |"}

## Next Measurement

${report.summary.nextMeasurement}
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
  const manifestPath = path.resolve(argValue("--manifest", defaultManifestPath));
  const jsonPath = path.resolve(argValue("--json", path.join(reportsDir, "current-best-output-polish-gap.json")));
  const markdownPath = path.resolve(argValue("--md", path.join(reportsDir, "current-best-output-polish-gap.md")));
  const report = createOutputPolishGapReport({ manifestPath });

  await writeText(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeText(markdownPath, createOutputPolishGapMarkdown(report));

  console.log(`Current Best output polish gap JSON written: ${jsonPath}`);
  console.log(`Current Best output polish gap markdown written: ${markdownPath}`);
  console.log(`Comparable pairs: ${report.summary.comparablePairs}/${report.summary.totalPairs}`);
  console.log(`Risk flags: ${report.summary.riskFlags.join(", ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFilePath)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
