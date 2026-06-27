import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatedRoot, reportsDir } from "../lab-paths.mjs";
import { analyzeComparisonWavFile } from "../reference-comparison/reference-tone-gap.mjs";

const thisFilePath = fileURLToPath(import.meta.url);

export const defaultManifestPath = path.join(
  generatedRoot,
  "current-best-source-rehydration",
  "source-parity-manifest.local.json"
);

const metricFields = [
  ["peakDbfs", "Peak dBFS"],
  ["rmsDbfs", "RMS dBFS"],
  ["lufsEstimate", "LUFS est."],
  ["crestFactorDb", "Crest dB"],
  ["lowRmsDbfs", "Low 0-120 dBFS"],
  ["lowMidRmsDbfs", "Low-mid 120-500 dBFS"],
  ["midRmsDbfs", "Mid 500-4000 dBFS"],
  ["highRmsDbfs", "High 4000+ dBFS"]
];

function round(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function metricValue(metrics, field) {
  if (field === "lowRmsDbfs") {
    return metrics.bandEnergy?.low?.rmsDbfs;
  }
  if (field === "lowMidRmsDbfs") {
    return metrics.bandEnergy?.lowMid?.rmsDbfs;
  }
  if (field === "midRmsDbfs") {
    return metrics.bandEnergy?.mid?.rmsDbfs;
  }
  if (field === "highRmsDbfs") {
    return metrics.bandEnergy?.high?.rmsDbfs;
  }

  return metrics[field];
}

function formatNumber(value, suffix = "") {
  if (!Number.isFinite(value)) {
    return "(n/a)";
  }

  return `${round(value, 2).toFixed(2)}${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exists(filePath) {
  return Boolean(filePath && fs.existsSync(filePath));
}

function absoluteIfPresent(filePath) {
  return filePath ? path.resolve(filePath) : null;
}

function loadJsonIfExists(filePath) {
  if (!exists(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function analyzeIfExists(filePath) {
  if (!exists(filePath)) {
    return null;
  }

  return analyzeComparisonWavFile(filePath);
}

function createTemplateManifest(manifestPath = defaultManifestPath) {
  return {
    schemaVersion: 1,
    purpose: "Local-only source parity comparison. Do not commit this file if it contains private asset or render paths.",
    doNotShip: true,
    pairs: [
      {
        id: "pick-attack",
        label: "PICK ATTACK parity check",
        diPath: "D:/REAPER/PICK ATTACK.wav",
        sourceProbeRenderPath: "D:/CodexBuilds/thallbyssal-lab/current-best-source-rehydration/<source-probe-session>/processed.wav",
        sourceProbeMetadataPath: "D:/CodexBuilds/thallbyssal-lab/current-best-source-rehydration/<source-probe-session>/render-metadata.json",
        knownGoodBetaRenderPath: "D:/CodexBuilds/thallbyssal-lab/current-best-known-good-beta/<matching-beta-session>/processed.wav"
      }
    ],
    writeTo: manifestPath
  };
}

function normalisePair(pair, index) {
  return {
    id: pair.id ?? `pair_${index + 1}`,
    label: pair.label ?? pair.id ?? `Pair ${index + 1}`,
    diPath: absoluteIfPresent(pair.diPath),
    sourceProbeRenderPath: absoluteIfPresent(pair.sourceProbeRenderPath),
    sourceProbeMetadataPath: absoluteIfPresent(pair.sourceProbeMetadataPath),
    knownGoodBetaRenderPath: absoluteIfPresent(pair.knownGoodBetaRenderPath)
  };
}

function compareMetrics(sourceMetrics, betaMetrics) {
  const deltas = {};

  for (const [field] of metricFields) {
    const sourceValue = metricValue(sourceMetrics, field);
    const betaValue = metricValue(betaMetrics, field);
    deltas[field] = Number.isFinite(sourceValue) && Number.isFinite(betaValue)
      ? round(sourceValue - betaValue, 3)
      : null;
  }

  return {
    fields: Object.fromEntries(metricFields.map(([field, label]) => [field, {
      label,
      source: metricValue(sourceMetrics, field),
      beta: metricValue(betaMetrics, field),
      deltaSourceMinusBeta: deltas[field]
    }])),
    sampleRateMatch: sourceMetrics.sampleRate === betaMetrics.sampleRate,
    channelMatch: sourceMetrics.channels === betaMetrics.channels,
    durationDeltaSeconds: round(sourceMetrics.durationSeconds - betaMetrics.durationSeconds, 4),
    clippedSamplesDelta: sourceMetrics.clippedSamples - betaMetrics.clippedSamples
  };
}

function pairStatus(pair, sourceExists, betaExists, diExists) {
  if (!sourceExists && !betaExists) {
    return "blocked-missing-source-and-beta";
  }
  if (!sourceExists) {
    return "blocked-missing-source-probe-render";
  }
  if (!betaExists) {
    return "blocked-missing-known-good-beta-render";
  }
  if (pair.diPath && !diExists) {
    return "review-missing-di-reference";
  }

  return "measurement-ready";
}

export function createSourceParityReport({ manifestPath = defaultManifestPath, manifest = null, generatedAt = new Date().toISOString() } = {}) {
  const manifestExists = manifest !== null || exists(manifestPath);
  const loadedManifest = manifest ?? loadJsonIfExists(manifestPath);

  if (!loadedManifest) {
    return {
      schemaVersion: 1,
      generatedAt,
      manifestPath,
      status: "blocked-missing-manifest",
      purpose: "Current Best source parity evidence gate.",
      boundaries: [
        "Report-only; no DSP, preset, plugin default, NAM, IR, or audio asset changes.",
        "No parity or sonic equivalence can be claimed from missing evidence.",
        "Founder listening remains required after measurement comparison."
      ],
      templateManifest: createTemplateManifest(manifestPath),
      pairs: [],
      summary: {
        totalPairs: 0,
        comparablePairs: 0,
        blockedPairs: 0,
        readyForListening: false
      },
      nextAction: "Create the local manifest with matching source-probe and known-good beta renders, then rerun this tool."
    };
  }

  const pairs = (loadedManifest.pairs ?? []).map((rawPair, index) => {
    const pair = normalisePair(rawPair, index);
    const sourceExists = exists(pair.sourceProbeRenderPath);
    const betaExists = exists(pair.knownGoodBetaRenderPath);
    const diExists = pair.diPath ? exists(pair.diPath) : false;
    const status = pairStatus(pair, sourceExists, betaExists, diExists);
    const sourceMetrics = analyzeIfExists(pair.sourceProbeRenderPath);
    const betaMetrics = analyzeIfExists(pair.knownGoodBetaRenderPath);
    const sourceMetadata = loadJsonIfExists(pair.sourceProbeMetadataPath);

    return {
      ...pair,
      status,
      files: {
        diExists: pair.diPath ? diExists : null,
        sourceProbeRenderExists: sourceExists,
        sourceProbeMetadataExists: pair.sourceProbeMetadataPath ? exists(pair.sourceProbeMetadataPath) : null,
        knownGoodBetaRenderExists: betaExists
      },
      sourceProbeMetadata: sourceMetadata
        ? {
            renderer: sourceMetadata.renderer ?? null,
            activeSoundTarget: sourceMetadata.activeSoundTarget ?? null,
            resampled: sourceMetadata.resampled ?? null,
            inputSampleRate: sourceMetadata.inputSampleRate ?? null,
            outputPeakLinear: sourceMetadata.outputPeakLinear ?? null
          }
        : null,
      sourceMetrics,
      betaMetrics,
      comparison: sourceMetrics && betaMetrics ? compareMetrics(sourceMetrics, betaMetrics) : null,
      evidenceLevel: sourceMetrics && betaMetrics
        ? "measurement-evidence-only"
        : "missing-evidence"
    };
  });

  const comparablePairs = pairs.filter((pair) => pair.comparison).length;
  const blockedPairs = pairs.filter((pair) => pair.status.startsWith("blocked")).length;

  return {
    schemaVersion: 1,
    generatedAt,
    manifestPath,
    status: comparablePairs > 0 && blockedPairs === 0 ? "measurement-ready" : "blocked-or-partial",
    purpose: "Compare source-built Current Best recovery probes against known-good playable beta renders without changing product behavior.",
    boundaries: [
      "Report-only; no DSP, preset, plugin default, NAM, IR, or audio asset changes.",
      "This is not a tone decision and not a release approval.",
      "Do not commit local manifests, audio renders, NAM files, IR files, or generated comparison outputs."
    ],
    pairs,
    summary: {
      totalPairs: pairs.length,
      comparablePairs,
      blockedPairs,
      readyForListening: comparablePairs > 0 && blockedPairs === 0,
      parityClaimAllowed: false
    },
    nextAction: comparablePairs > 0
      ? "Review measurement deltas, then run founder listening only if the source and beta renders are confirmed to use the same DI and intended settings."
      : "Add missing source-probe and known-good beta render paths to the local manifest."
  };
}

export function createSourceParityMarkdown(report) {
  const rows = report.pairs.map((pair) => {
    const rmsDelta = pair.comparison?.fields?.rmsDbfs?.deltaSourceMinusBeta;
    const lowMidDelta = pair.comparison?.fields?.lowMidRmsDbfs?.deltaSourceMinusBeta;
    const highDelta = pair.comparison?.fields?.highRmsDbfs?.deltaSourceMinusBeta;

    return `| ${pair.id} | ${pair.status} | ${pair.files?.sourceProbeRenderExists ?? false} | ${pair.files?.knownGoodBetaRenderExists ?? false} | ${formatNumber(rmsDelta, " dB")} | ${formatNumber(lowMidDelta, " dB")} | ${formatNumber(highDelta, " dB")} |`;
  }).join("\n");

  return `# Current Best Source Parity Comparison

Generated: ${report.generatedAt}

Status: ${report.status}

Manifest: \`${report.manifestPath}\`

## Boundaries

${report.boundaries.map((boundary) => `- ${boundary}`).join("\n")}

## Summary

- Total pairs: ${report.summary.totalPairs}
- Comparable pairs: ${report.summary.comparablePairs}
- Blocked pairs: ${report.summary.blockedPairs}
- Ready for listening: ${report.summary.readyForListening ? "yes" : "no"}
- Parity claim allowed: no

## Pairs

| Pair | Status | Source render | Beta render | RMS delta | Low-mid delta | High delta |
| --- | --- | --- | --- | --- | --- | --- |
${rows || "| (none) | blocked | false | false | (n/a) | (n/a) | (n/a) |"}

## Next Action

${report.nextAction}
`;
}

export function createSourceParityHtml(report) {
  const rows = report.pairs.map((pair) => {
    const comparisonRows = pair.comparison
      ? Object.values(pair.comparison.fields).map((field) => `
        <tr>
          <td>${escapeHtml(field.label)}</td>
          <td>${escapeHtml(formatNumber(field.source))}</td>
          <td>${escapeHtml(formatNumber(field.beta))}</td>
          <td>${escapeHtml(formatNumber(field.deltaSourceMinusBeta))}</td>
        </tr>`).join("")
      : `<tr><td colspan="4">Missing matching source/beta render evidence.</td></tr>`;

    return `
      <section class="pair">
        <h2>${escapeHtml(pair.label)}</h2>
        <p><strong>Status:</strong> ${escapeHtml(pair.status)}</p>
        <p><strong>Source:</strong> ${escapeHtml(pair.sourceProbeRenderPath ?? "(missing)")}</p>
        <p><strong>Known-good beta:</strong> ${escapeHtml(pair.knownGoodBetaRenderPath ?? "(missing)")}</p>
        <table>
          <thead><tr><th>Metric</th><th>Source probe</th><th>Known-good beta</th><th>Delta source-beta</th></tr></thead>
          <tbody>${comparisonRows}</tbody>
        </table>
      </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Current Best Source Parity Comparison</title>
  <style>
    body { margin: 0; padding: 32px; font-family: Arial, sans-serif; background: #111319; color: #f1ede6; }
    .notice, .pair { border: 1px solid #342a25; background: #171a21; padding: 16px; margin: 0 0 16px; border-radius: 8px; }
    h1, h2 { color: #ff8b4a; }
    code { color: #ffd5ad; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #2a2f3a; padding: 8px; text-align: left; vertical-align: top; }
    th { color: #f8c08d; }
  </style>
</head>
<body>
  <h1>Current Best Source Parity Comparison</h1>
  <div class="notice">
    <p><strong>Status:</strong> ${escapeHtml(report.status)}</p>
    <p><strong>Manifest:</strong> <code>${escapeHtml(report.manifestPath)}</code></p>
    <p>This is an internal measurement gate only. It does not approve source parity, tone, release, or asset shipping.</p>
  </div>
  ${rows || '<section class="pair"><h2>No pairs</h2><p>Create a local manifest with source-probe and known-good beta renders.</p></section>'}
</body>
</html>
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
  const jsonPath = path.resolve(argValue("--json", path.join(reportsDir, "current-best-source-parity-comparison.json")));
  const htmlPath = path.resolve(argValue("--html", path.join(reportsDir, "current-best-source-parity-comparison.html")));
  const markdownPath = path.resolve(argValue("--md", path.join(reportsDir, "current-best-source-parity-comparison.md")));

  if (process.argv.includes("--init-manifest")) {
    const template = createTemplateManifest(manifestPath);
    await writeText(manifestPath, `${JSON.stringify(template, null, 2)}\n`);
    console.log(`Source parity local manifest template written: ${manifestPath}`);
  }

  const report = createSourceParityReport({ manifestPath });
  await writeText(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeText(htmlPath, createSourceParityHtml(report));
  await writeText(markdownPath, createSourceParityMarkdown(report));

  console.log(`Current Best source parity JSON written: ${jsonPath}`);
  console.log(`Current Best source parity HTML written: ${htmlPath}`);
  console.log(`Current Best source parity markdown written: ${markdownPath}`);
  console.log(`Comparable pairs: ${report.summary.comparablePairs}/${report.summary.totalPairs}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFilePath)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
