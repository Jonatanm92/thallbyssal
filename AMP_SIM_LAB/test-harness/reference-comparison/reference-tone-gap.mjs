import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportsDir } from "../lab-paths.mjs";

const thisFilePath = fileURLToPath(import.meta.url);

const listeningChecklist = [
  ["heavier", "Heavier"],
  ["tighter_attack", "Tighter attack"],
  ["stronger_low_mid_body", "Stronger low-mid/body"],
  ["more_palm_mute_punch", "More palm-mute punch"],
  ["more_controlled_high_end", "More controlled high end"],
  ["less_weak_thin", "Less weak/thin"],
  ["more_density", "More density"]
].map(([id, label]) => ({ id, label, founderCheck: null, notes: "" }));

function readAscii(buffer, offset, length) {
  return buffer.toString("ascii", offset, offset + length);
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

function dbfs(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return -Infinity;
  }

  return 20 * Math.log10(value);
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return value;
  }

  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function onePoleAlpha(sampleRate, cutoffHz) {
  const limitedCutoff = Math.min(Math.max(cutoffHz, 10), sampleRate * 0.45);
  return 1 - Math.exp((-2 * Math.PI * limitedCutoff) / sampleRate);
}

function bandSnapshot(sumSquares, sampleCount, totalBandEnergy) {
  const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;

  return {
    rms: round(rms, 8),
    rmsDbfs: round(dbfs(rms), 2),
    energyShare: totalBandEnergy > 0 ? round(sumSquares / totalBandEnergy, 4) : 0
  };
}

function parseWav(buffer) {
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

export function analyzeComparisonWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const { format, dataOffset, dataSize } = parseWav(buffer);
  const bytesPerSample = format.bitsPerSample / 8;
  const frameCount = Math.floor(dataSize / format.blockAlign);
  const sampleCount = frameCount * format.channels;
  const alpha120 = onePoleAlpha(format.sampleRate, 120);
  const alpha500 = onePoleAlpha(format.sampleRate, 500);
  const alpha4000 = onePoleAlpha(format.sampleRate, 4000);
  const low120 = Array(format.channels).fill(0);
  const low500 = Array(format.channels).fill(0);
  const low4000 = Array(format.channels).fill(0);
  const bandSums = {
    low: 0,
    lowMid: 0,
    mid: 0,
    high: 0
  };
  let peak = 0;
  let sumSquares = 0;
  let clippedSamples = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const frameOffset = dataOffset + frame * format.blockAlign;

    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = frameOffset + channel * bytesPerSample;
      const sample = readSample(buffer, sampleOffset, bytesPerSample, format.audioFormat);
      const absolute = Math.abs(sample);

      peak = Math.max(peak, absolute);
      sumSquares += sample * sample;

      if (absolute >= 0.999) {
        clippedSamples += 1;
      }

      low120[channel] += alpha120 * (sample - low120[channel]);
      low500[channel] += alpha500 * (sample - low500[channel]);
      low4000[channel] += alpha4000 * (sample - low4000[channel]);

      const low = low120[channel];
      const lowMid = low500[channel] - low120[channel];
      const mid = low4000[channel] - low500[channel];
      const high = sample - low4000[channel];

      bandSums.low += low * low;
      bandSums.lowMid += lowMid * lowMid;
      bandSums.mid += mid * mid;
      bandSums.high += high * high;
    }
  }

  const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
  const peakDbfs = dbfs(peak);
  const rmsDbfs = dbfs(rms);
  const lufsEstimate = Number.isFinite(rmsDbfs) ? rmsDbfs - 0.691 : -Infinity;
  const totalBandEnergy = Object.values(bandSums).reduce((sum, value) => sum + value, 0);

  return {
    filePath,
    sampleRate: format.sampleRate,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
    audioFormat: format.audioFormat === 1 ? "PCM" : format.audioFormat === 3 ? "IEEE_FLOAT" : `UNKNOWN_${format.audioFormat}`,
    durationSeconds: round(frameCount / format.sampleRate, 3),
    peak: round(peak, 8),
    peakDbfs: round(peakDbfs, 2),
    rms: round(rms, 8),
    rmsDbfs: round(rmsDbfs, 2),
    lufsEstimate: round(lufsEstimate, 2),
    crestFactorDb: round(peakDbfs - rmsDbfs, 2),
    clippedSamples,
    clippedPercent: sampleCount > 0 ? round((clippedSamples / sampleCount) * 100, 6) : 0,
    bandEnergy: {
      low: bandSnapshot(bandSums.low, sampleCount, totalBandEnergy),
      lowMid: bandSnapshot(bandSums.lowMid, sampleCount, totalBandEnergy),
      mid: bandSnapshot(bandSums.mid, sampleCount, totalBandEnergy),
      high: bandSnapshot(bandSums.high, sampleCount, totalBandEnergy)
    },
    bandModel: {
      type: "one-pole split estimate",
      lowHz: "0-120",
      lowMidHz: "120-500",
      midHz: "500-4000",
      highHz: "4000+"
    }
  };
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
  if (field === "highEnergyShare") {
    return metrics.bandEnergy?.high?.energyShare;
  }
  if (field === "highToLowMidDb") {
    return metrics.bandEnergy?.high?.rmsDbfs - metrics.bandEnergy?.lowMid?.rmsDbfs;
  }

  return metrics[field];
}

function average(values) {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) {
    return null;
  }

  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
}

function averageReferenceMetrics(referenceRenders) {
  const fields = [
    "peakDbfs",
    "rmsDbfs",
    "lufsEstimate",
    "crestFactorDb",
    "clippedSamples",
    "lowRmsDbfs",
    "lowMidRmsDbfs",
    "midRmsDbfs",
    "highRmsDbfs",
    "highEnergyShare",
    "highToLowMidDb"
  ];
  const entries = fields.map((field) => [
    field,
    round(average(referenceRenders.map((render) => metricValue(render.metrics, field))))
  ]);

  return Object.fromEntries(entries);
}

function deltaAgainstReferences(thallbyssalMetrics, referenceAverages) {
  const fields = Object.keys(referenceAverages);
  const entries = fields.map((field) => {
    const thallbyssalValue = metricValue(thallbyssalMetrics, field);
    const referenceValue = referenceAverages[field];
    const delta = Number.isFinite(thallbyssalValue) && Number.isFinite(referenceValue)
      ? thallbyssalValue - referenceValue
      : null;

    return [field, round(delta)];
  });

  return Object.fromEntries(entries);
}

function phraseByDelta(delta, {
  lower,
  similar,
  higher,
  threshold = 1.5
}) {
  if (!Number.isFinite(delta)) {
    return "No reliable metric delta available.";
  }
  if (delta <= -threshold) {
    return lower;
  }
  if (delta >= threshold) {
    return higher;
  }
  return similar;
}

export function summarizeToneGaps(deltas) {
  return {
    loudnessOutputGap: phraseByDelta(deltas.lufsEstimate ?? deltas.rmsDbfs, {
      lower: "Thallbyssal measures quieter than the reference average, so founder A/B should check whether output level is contributing to the weaker feel.",
      similar: "Thallbyssal measured loudness is close enough to the reference average that loudness alone may not explain the perceived gap.",
      higher: "Thallbyssal measures louder than the reference average; founder A/B should check whether this is level rather than tone."
    }),
    lowMidBodyGap: phraseByDelta(deltas.lowMidRmsDbfs, {
      lower: "Low-mid/body energy measures below the reference average, matching the reported weaker/thinner feel.",
      similar: "Low-mid/body energy is near the reference average; listening should decide whether the perceived body gap is voicing rather than level.",
      higher: "Low-mid/body energy measures above the reference average; listening should check whether the extra body is masking attack."
    }),
    highEndFizzGap: phraseByDelta(deltas.highToLowMidDb, {
      lower: "High-end balance sits below the reference balance; listening should check for dullness rather than fizz.",
      similar: "High-end balance is near the reference average; fizz control may be more about texture than band level.",
      higher: "High-end balance is above the reference balance, so fizz or thin edge may be part of the gap."
    }),
    palmMutePunchGap: phraseByDelta(deltas.lowMidRmsDbfs, {
      lower: "The low-mid body deficit may reduce palm-mute punch even before any tone decision is made.",
      similar: "Palm-mute punch is not explained by low-mid level alone; founder listening should focus on attack shape and gate feel.",
      higher: "Low-mid level is not the likely palm-mute weakness; founder listening should check transient shape and tightness."
    }),
    saturationDensityGap: phraseByDelta(deltas.crestFactorDb, {
      lower: "Lower crest factor suggests more density or compression than the reference average.",
      similar: "Crest factor is close to the reference average; density may depend on saturation texture rather than gross dynamics.",
      higher: "Higher crest factor suggests Thallbyssal may feel less dense or less saturated at matched level."
    }),
    transientAttackGap: phraseByDelta(deltas.crestFactorDb, {
      lower: "Lower crest factor may mean attack is being flattened compared with the reference average.",
      similar: "Transient/attack delta is not obvious from crest factor alone; founder listening should decide.",
      higher: "higher crest factor means sharper transient contrast, but it can also read as less glued or less dense."
    }),
    cabVoicingGap: phraseByDelta(deltas.highToLowMidDb, {
      lower: "Cab/voicing balance leans darker than the reference average by the band balance estimate.",
      similar: "Cab/voicing balance is not a clear outlier in the band balance estimate.",
      higher: "Cab/voicing balance leans brighter/thinner than the reference average by the band balance estimate."
    })
  };
}

function createLevelMatch(thallbyssalRender, referenceRenders) {
  const thallbyssal = thallbyssalRender.metrics;
  return {
    method: "metadata_only_no_audio_written",
    referenceBasis: "per-reference LUFS-estimate and RMS deltas",
    thallbyssalRenderPath: thallbyssalRender.filePath,
    references: referenceRenders.map((reference) => {
      const gainDbToMatchReferenceLufs = round(reference.metrics.lufsEstimate - thallbyssal.lufsEstimate);
      const gainDbToMatchReferenceRms = round(reference.metrics.rmsDbfs - thallbyssal.rmsDbfs);

      return {
        label: reference.label,
        referencePath: reference.filePath,
        gainDbToMatchReferenceLufs,
        gainDbToMatchReferenceRms,
        thallbyssalPeakAfterLufsMatchDbfs: round(thallbyssal.peakDbfs + gainDbToMatchReferenceLufs),
        peakRiskAfterMatch: thallbyssal.peakDbfs + gainDbToMatchReferenceLufs >= -1
      };
    })
  };
}

export function buildComparisonReport({
  approvedPairId = "pair_001",
  approvedDiPath,
  thallbyssalRender,
  referenceRenders,
  generatedAt = new Date().toISOString()
}) {
  const referenceAverages = averageReferenceMetrics(referenceRenders);
  const aggregateDeltas = deltaAgainstReferences(thallbyssalRender.metrics, referenceAverages);
  const gapSummary = summarizeToneGaps(aggregateDeltas);

  return {
    schemaVersion: 1,
    generatedAt,
    approvedPairId,
    scope: {
      status: "private_internal_ab_only",
      publicUseApproved: false,
      finalToneDecision: "not_automatic",
      dspCoreTouchedByComparison: false,
      presetsTouchedByComparison: false,
      audioWrittenByComparison: false,
      privateBandReferencesUsedForTechnicalAb: false,
      irCabFoldersUsed: false
    },
    inputs: {
      approvedDiPath,
      approvedDiUsed: Boolean(approvedDiPath),
      thallbyssalRenderPath: thallbyssalRender.filePath,
      approvedReferencePaths: referenceRenders.map((reference) => reference.filePath)
    },
    thallbyssalRender,
    referenceRenders,
    referenceAverages,
    aggregateDeltas,
    levelMatch: createLevelMatch(thallbyssalRender, referenceRenders),
    listeningChecklist,
    gapSummary,
    summary: {
      approvedDiUsed: Boolean(approvedDiPath),
      referenceCount: referenceRenders.length,
      metricsGenerated: true,
      levelMatchedComparisonCreated: true,
      audioWrittenByComparison: false,
      dspCoreTouchedByComparison: false
    }
  };
}

function formatDb(value) {
  return Number.isFinite(value) ? `${round(value)} dB` : "n/a";
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function metricRows(report) {
  const rows = [
    [
      "Thallbyssal",
      path.basename(report.thallbyssalRender.filePath),
      formatDb(report.thallbyssalRender.metrics.peakDbfs),
      formatDb(report.thallbyssalRender.metrics.rmsDbfs),
      formatDb(report.thallbyssalRender.metrics.lufsEstimate),
      formatDb(report.thallbyssalRender.metrics.crestFactorDb),
      String(report.thallbyssalRender.metrics.clippedSamples),
      formatDb(report.thallbyssalRender.metrics.bandEnergy?.lowMid?.rmsDbfs),
      formatDb(report.thallbyssalRender.metrics.bandEnergy?.high?.rmsDbfs)
    ],
    ...report.referenceRenders.map((reference) => [
      "Reference",
      path.basename(reference.filePath),
      formatDb(reference.metrics.peakDbfs),
      formatDb(reference.metrics.rmsDbfs),
      formatDb(reference.metrics.lufsEstimate),
      formatDb(reference.metrics.crestFactorDb),
      String(reference.metrics.clippedSamples),
      formatDb(reference.metrics.bandEnergy?.lowMid?.rmsDbfs),
      formatDb(reference.metrics.bandEnergy?.high?.rmsDbfs)
    ])
  ];

  return markdownTable(
    ["Role", "File", "Peak", "RMS", "LUFS Est.", "Crest", "Clips", "Low-Mid", "High"],
    rows
  );
}

function levelMatchRows(report) {
  return markdownTable(
    ["Reference", "LUFS Gain", "RMS Gain", "Peak After LUFS Match", "Peak Risk"],
    report.levelMatch.references.map((reference) => [
      path.basename(reference.referencePath),
      formatDb(reference.gainDbToMatchReferenceLufs),
      formatDb(reference.gainDbToMatchReferenceRms),
      formatDb(reference.thallbyssalPeakAfterLufsMatchDbfs),
      reference.peakRiskAfterMatch ? "yes" : "no"
    ])
  );
}

function gapRows(report) {
  return markdownTable(
    ["Gap", "Report-only summary"],
    [
      ["Loudness/output", report.gapSummary.loudnessOutputGap],
      ["Low-mid/body", report.gapSummary.lowMidBodyGap],
      ["High-end/fizz", report.gapSummary.highEndFizzGap],
      ["Palm-mute punch", report.gapSummary.palmMutePunchGap],
      ["Saturation/density", report.gapSummary.saturationDensityGap],
      ["Transient/attack", report.gapSummary.transientAttackGap],
      ["Cab/voicing", report.gapSummary.cabVoicingGap]
    ]
  );
}

function createInterpretationNotes(report) {
  const deltas = report.aggregateDeltas;
  const notes = [];

  if (deltas.lufsEstimate >= 3) {
    notes.push("Raw Thallbyssal loudness is above the reference average, so the weaker/thinner report is not explained by a simple output-level deficit in this render. Use the negative level-match gain values before founder listening.");
  } else if (deltas.lufsEstimate <= -3) {
    notes.push("Raw Thallbyssal loudness is below the reference average, so output level may be part of the weaker/thinner report.");
  }

  if (deltas.lowMidRmsDbfs >= 3) {
    notes.push("Measured low-mid/body is above the reference average, so the body gap is more likely about masking, tightness, or attack shape than missing low-mid level.");
  } else if (deltas.lowMidRmsDbfs <= -3) {
    notes.push("Measured low-mid/body is below the reference average, which can directly support the weak/thin listening note.");
  }

  if (deltas.highToLowMidDb <= -1.5) {
    notes.push("High band relative to low-mid/body is below the reference balance, which points toward darker cab/voicing and less pick-edge definition after level matching.");
  } else if (deltas.highToLowMidDb >= 1.5) {
    notes.push("High band relative to low-mid/body is above the reference balance, which points toward fizz or thin edge as a listening target.");
  }

  if (deltas.crestFactorDb <= -1.5) {
    notes.push("Crest factor is lower than the reference average, suggesting a flatter or more compressed attack envelope that can read as less punch even when RMS is high.");
  } else if (deltas.crestFactorDb >= 1.5) {
    notes.push("Crest factor is higher than the reference average, suggesting sharper transient contrast but potentially less density.");
  }

  return notes;
}

export function createReferenceComparisonMarkdown(report) {
  const checklist = report.listeningChecklist
    .map((item) => `- [ ] ${item.label}`)
    .join("\n");
  const interpretationNotes = createInterpretationNotes(report)
    .map((note) => `- ${note}`)
    .join("\n");

  return `# Reference Tone Gap Comparison Report

Status: private internal A/B only.

## Founder approval

- Approved pair: \`${report.approvedPairId}\`
- Approved DI used: ${report.summary.approvedDiUsed ? "yes" : "no"}
- Approved same-DI references used: ${report.summary.referenceCount}
- Do not decide final tone automatically from this report.
- Do not treat any reference as something Thallbyssal should duplicate.

## Scope Guardrails

- Private internal analysis only.
- No DSP/core sound files were touched by this comparison.
- No presets were modified.
- No DI files were modified.
- No audio was written by the comparison harness.
- External/private-band references were not used for technical A/B.
- IR/cab folders were not used.
- Public-facing copy, presets, UI, marketing, demo pages, beta pages, and launch material must not use private reference names.

## Files

- Approved DI: \`${report.inputs.approvedDiPath}\`
- Thallbyssal render: \`${report.inputs.thallbyssalRenderPath}\`

Approved reference renders:

${report.inputs.approvedReferencePaths.map((filePath) => `- \`${filePath}\``).join("\n")}

## Metrics

${metricRows(report)}

Band energy uses an estimate from one-pole frequency splits. Treat it as directional founder listening support, not a mastering-grade spectrum analysis.

## Reference Average Delta

Negative values mean Thallbyssal measured below the reference average.

${markdownTable(
  ["Metric", "Delta"],
  Object.entries(report.aggregateDeltas).map(([field, value]) => [field, Number.isFinite(value) ? String(value) : "n/a"])
)}

## Level-Matched Metadata

No level-matched audio was created. These are gain values for controlled private listening setup only.

${levelMatchRows(report)}

## Listening Checklist

${checklist}

## Interpretation Notes

${interpretationNotes || "- No strong one-metric explanation. Founder listening should decide which gap matters."}

## Tone-Gap Summary

${gapRows(report)}

## Next Recommended Action

Founder should use the level-match metadata for manual private A/B, mark the listening checklist, and decide the next tone direction. Any DSP/core or preset tone change still needs explicit founder approval.
`;
}

export function createReferenceComparisonPlanMarkdown(report) {
  return `# Reference Tone Gap Comparison

Status: internal measurement plan and artifact map.

## Purpose

Compare the current Thallbyssal same-DI render against founder-owned same-DI reference renders to explain the reported weaker/thinner feel. This is report-only founder listening support, not automatic tone selection.

## Approved Inputs

- Approved pair: \`${report.approvedPairId}\`
- DI: \`${report.inputs.approvedDiPath}\`
- Approved reference count: ${report.summary.referenceCount}
- Thallbyssal render: \`${report.inputs.thallbyssalRenderPath}\`

## Method

1. Use only the approved DI source.
2. Use only founder-rendered same-DI reference renders.
3. Render Thallbyssal through the existing real headless render pipeline.
4. Measure peak, RMS, LUFS estimate, crest factor, clipping, and estimated low/low-mid/mid/high band energy.
5. Create metadata-only level-match gain values.
6. Preserve founder ownership of final listening and tone decisions.

## Boundaries

- No DSP/core sound changes.
- No preset edits.
- No DI edits.
- No generated audio committed.
- No reference audio committed.
- No external/private-band references used for technical A/B.
- No IR/cab folder use.
`;
}

function argValues(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }
  return values;
}

function argValue(name, fallback = "") {
  return argValues(name)[0] ?? fallback;
}

async function writeText(filePath, value) {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  await fsPromises.writeFile(filePath, value, "utf8");
}

async function main() {
  const approvedPairId = argValue("--pair", "pair_001");
  const approvedDiPath = path.resolve(argValue("--di"));
  const thallbyssalPath = path.resolve(argValue("--thallbyssal"));
  const referencePaths = argValues("--reference").map((value) => path.resolve(value));
  const jsonPath = path.resolve(argValue("--json", path.join(reportsDir, "reference-tone-gap-comparison.json")));
  const reportMarkdownPath = path.resolve(argValue("--report-md", path.join("AMP_SIM_LAB", "REFERENCE_TONE_GAP_COMPARISON_REPORT.md")));
  const planMarkdownPath = path.resolve(argValue("--plan-md", path.join("AMP_SIM_LAB", "REFERENCE_TONE_GAP_COMPARISON.md")));

  if (!approvedDiPath || !fs.existsSync(approvedDiPath)) {
    throw new Error(`Approved DI does not exist: ${approvedDiPath}`);
  }
  if (!thallbyssalPath || !fs.existsSync(thallbyssalPath)) {
    throw new Error(`Thallbyssal render does not exist: ${thallbyssalPath}`);
  }
  if (referencePaths.length === 0) {
    throw new Error("At least one --reference path is required.");
  }
  for (const referencePath of referencePaths) {
    if (!fs.existsSync(referencePath)) {
      throw new Error(`Reference render does not exist: ${referencePath}`);
    }
  }

  const report = buildComparisonReport({
    approvedPairId,
    approvedDiPath,
    thallbyssalRender: {
      label: "Thallbyssal",
      filePath: thallbyssalPath,
      metrics: analyzeComparisonWavFile(thallbyssalPath)
    },
    referenceRenders: referencePaths.map((referencePath) => ({
      label: path.basename(referencePath, path.extname(referencePath)),
      filePath: referencePath,
      metrics: analyzeComparisonWavFile(referencePath)
    }))
  });

  await writeText(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeText(reportMarkdownPath, createReferenceComparisonMarkdown(report));
  await writeText(planMarkdownPath, createReferenceComparisonPlanMarkdown(report));

  console.log(`Reference tone-gap JSON written: ${jsonPath}`);
  console.log(`Reference tone-gap report written: ${reportMarkdownPath}`);
  console.log(`Reference tone-gap plan written: ${planMarkdownPath}`);
  console.log(`Approved references used: ${report.summary.referenceCount}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFilePath)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
