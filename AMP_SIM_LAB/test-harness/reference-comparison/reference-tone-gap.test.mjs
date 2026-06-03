import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  analyzeComparisonWavFile,
  buildComparisonReport,
  createReferenceComparisonMarkdown,
  summarizeToneGaps
} from "./reference-tone-gap.mjs";

function metricSnapshot(overrides = {}) {
  return {
    peakDbfs: -1,
    rmsDbfs: -18,
    lufsEstimate: -18.7,
    clippedSamples: 0,
    crestFactorDb: 17,
    bandEnergy: {
      low: { rmsDbfs: -28, energyShare: 0.1 },
      lowMid: { rmsDbfs: -18, energyShare: 0.32 },
      mid: { rmsDbfs: -19, energyShare: 0.28 },
      high: { rmsDbfs: -25, energyShare: 0.08 }
    },
    ...overrides
  };
}

function writeMono16Wav(filePath, samples, sampleRate = 8000) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    const scaled = Math.max(-1, Math.min(1, sample)) * 32767;
    buffer.writeInt16LE(Math.round(scaled), 44 + index * 2);
  });

  fs.writeFileSync(filePath, buffer);
}

test("analyzes comparison WAV crest factor and estimated band energy", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thallbyssal-reference-comparison-"));
  const filePath = path.join(tempDir, "test.wav");
  writeMono16Wav(filePath, [0, 0.5, -0.5, 1, -1, 0.25, -0.25, 0]);

  const metrics = analyzeComparisonWavFile(filePath);

  assert.equal(metrics.sampleRate, 8000);
  assert.equal(metrics.channels, 1);
  assert.equal(metrics.clippedSamples, 2);
  assert.equal(Number.isFinite(metrics.crestFactorDb), true);
  assert.equal(Number.isFinite(metrics.bandEnergy.low.rmsDbfs), true);
  assert.equal(Number.isFinite(metrics.bandEnergy.lowMid.rmsDbfs), true);
  assert.equal(Number.isFinite(metrics.bandEnergy.mid.rmsDbfs), true);
  assert.equal(Number.isFinite(metrics.bandEnergy.high.rmsDbfs), true);
  assert.equal(metrics.bandEnergy.high.energyShare > 0, true);
});

test("builds same-DI reference comparison metadata without audio writes", () => {
  const report = buildComparisonReport({
    approvedPairId: "pair_001",
    approvedDiPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\DI Boostalizer.wav",
    thallbyssalRender: {
      label: "Thallbyssal high-gain foundation",
      filePath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\reference-tone-gap\\processed.wav",
      metrics: metricSnapshot({
        peakDbfs: -4,
        rmsDbfs: -24,
        lufsEstimate: -24.69,
        crestFactorDb: 20,
        bandEnergy: {
          low: { rmsDbfs: -36, energyShare: 0.05 },
          lowMid: { rmsDbfs: -29, energyShare: 0.18 },
          mid: { rmsDbfs: -26, energyShare: 0.35 },
          high: { rmsDbfs: -24, energyShare: 0.24 }
        }
      })
    },
    referenceRenders: [
      {
        label: "Reference A",
        filePath: "D:\\CodexBuilds\\thallbyssal-lab\\reference-renders\\reference-a.wav",
        metrics: metricSnapshot()
      },
      {
        label: "Reference B",
        filePath: "D:\\CodexBuilds\\thallbyssal-lab\\reference-renders\\reference-b.wav",
        metrics: metricSnapshot({
          peakDbfs: -0.8,
          rmsDbfs: -17,
          lufsEstimate: -17.69,
          bandEnergy: {
            low: { rmsDbfs: -27, energyShare: 0.12 },
            lowMid: { rmsDbfs: -17, energyShare: 0.34 },
            mid: { rmsDbfs: -18, energyShare: 0.27 },
            high: { rmsDbfs: -26, energyShare: 0.07 }
          }
        })
      }
    ]
  });

  assert.equal(report.approvedPairId, "pair_001");
  assert.equal(report.inputs.approvedDiUsed, true);
  assert.equal(report.summary.referenceCount, 2);
  assert.equal(report.summary.audioWrittenByComparison, false);
  assert.equal(report.summary.levelMatchedComparisonCreated, true);
  assert.equal(report.levelMatch.references[0].gainDbToMatchReferenceLufs, 5.99);
  assert.equal(report.aggregateDeltas.rmsDbfs, -6.5);
  assert.equal(report.aggregateDeltas.lowMidRmsDbfs, -11.5);
  assert.equal(report.aggregateDeltas.highToLowMidDb, 13);
  assert.deepEqual(report.listeningChecklist.map((item) => item.id), [
    "heavier",
    "tighter_attack",
    "stronger_low_mid_body",
    "more_palm_mute_punch",
    "more_controlled_high_end",
    "less_weak_thin",
    "more_density"
  ]);
});

test("summarizes tone gaps as founder listening support, not automatic tuning", () => {
  const summary = summarizeToneGaps({
    rmsDbfs: -6.5,
    lufsEstimate: -6.5,
    lowMidRmsDbfs: -11.5,
    highToLowMidDb: 12.5,
    crestFactorDb: 3
  });

  assert.match(summary.loudnessOutputGap, /quieter/);
  assert.match(summary.lowMidBodyGap, /below/);
  assert.match(summary.highEndFizzGap, /above the reference balance/);
  assert.match(summary.palmMutePunchGap, /body deficit/);
  assert.match(summary.saturationDensityGap, /less dense/);
  assert.match(summary.transientAttackGap, /higher crest factor/);
  assert.match(summary.cabVoicingGap, /band balance/);
  assert.doesNotMatch(Object.values(summary).join("\n"), /copy/i);
});

test("renders internal markdown with guardrails and no final tone decision", () => {
  const report = buildComparisonReport({
    approvedPairId: "pair_001",
    approvedDiPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\DI Boostalizer.wav",
    thallbyssalRender: {
      label: "Thallbyssal high-gain foundation",
      filePath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\reference-tone-gap\\processed.wav",
      metrics: metricSnapshot({ rmsDbfs: -24, lufsEstimate: -24.69 })
    },
    referenceRenders: [
      {
        label: "Reference A",
        filePath: "D:\\CodexBuilds\\thallbyssal-lab\\reference-renders\\reference-a.wav",
        metrics: metricSnapshot()
      }
    ]
  });

  const markdown = createReferenceComparisonMarkdown(report);

  assert.match(markdown, /Founder approval/);
  assert.match(markdown, /private internal A\/B only/);
  assert.match(markdown, /Do not decide final tone automatically/);
  assert.match(markdown, /Level-Matched Metadata/);
  assert.match(markdown, /Listening Checklist/);
  assert.match(markdown, /No DSP\/core sound files were touched by this comparison/);
});
