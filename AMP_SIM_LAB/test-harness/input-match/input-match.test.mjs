import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyInputMatchMetrics,
  createInputMatchReport,
  formatGainRange
} from "./input-match.mjs";

const healthyMetrics = {
  sampleRate: 48000,
  channels: 1,
  bitsPerSample: 24,
  audioFormat: "PCM",
  durationSeconds: 24,
  peakDbfs: -6.2,
  rmsDbfs: -25.5,
  lufsEstimate: -26.2,
  clippedSamples: 0,
  clippingPercent: 0,
  nearClippingSamples: 0,
  noiseFloorDbfs: -82,
  transientPeakToRmsDb: 18
};

function file(fileName, metrics = healthyMetrics) {
  return {
    fileName,
    ok: true,
    metrics
  };
}

test("classifies healthy DI and suggests conservative gain and gate guidance", () => {
  const result = classifyInputMatchMetrics(healthyMetrics);

  assert.equal(result.classification, "healthy");
  assert.equal(result.clipping, "no");
  assert.deepEqual(result.suggestedInputGainDbRange, [-1, 1]);
  assert.equal(formatGainRange(result.suggestedInputGainDbRange), "-1.0 to +1.0 dB");
  assert.match(result.suggestedGateStartingPoint, /-70 dBFS/);
  assert.equal(result.warningText, "No input-level warning.");
});

test("prioritizes clipped classification over hot and noisy signals", () => {
  const result = classifyInputMatchMetrics({
    ...healthyMetrics,
    peakDbfs: -0.1,
    rmsDbfs: -13,
    clippedSamples: 24,
    clippingPercent: 0.02,
    noiseFloorDbfs: -55
  });

  assert.equal(result.classification, "clipped");
  assert.equal(result.clipping, "yes");
  assert.deepEqual(result.suggestedInputGainDbRange, [-12, -6]);
  assert.match(result.warningText, /Clipping detected/);
});

test("classifies weak, hot, and noisy inputs from DI metrics", () => {
  assert.equal(
    classifyInputMatchMetrics({ ...healthyMetrics, peakDbfs: -24, rmsDbfs: -38 }).classification,
    "too weak"
  );
  assert.equal(
    classifyInputMatchMetrics({ ...healthyMetrics, peakDbfs: -1.8, rmsDbfs: -14.5 }).classification,
    "too hot"
  );
  assert.equal(
    classifyInputMatchMetrics({ ...healthyMetrics, noiseFloorDbfs: -58 }).classification,
    "noisy"
  );
});

test("treats a clean dedicated noise-floor file as healthy instead of too weak", () => {
  const result = classifyInputMatchMetrics(
    {
      ...healthyMetrics,
      peakDbfs: -67.8,
      rmsDbfs: -86.4,
      lufsEstimate: -87.1
    },
    { fileName: "noise.wav" }
  );

  assert.equal(result.classification, "healthy");
  assert.equal(result.noiseFloorDbfs, -86.4);
  assert.deepEqual(result.suggestedInputGainDbRange, [-1, 1]);
});

test("builds a report with founder listening note placeholders and summary counts", () => {
  const report = createInputMatchReport({
    inputDir: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files",
    files: [
      file("LOW TUNED CHUGS.wav"),
      file("PICK ATTACK.wav", { ...healthyMetrics, peakDbfs: -0.2, clippedSamples: 2 }),
      {
        fileName: "broken.wav",
        ok: false,
        error: "Unsupported WAV audio format: 6"
      }
    ],
    generatedAt: "2026-06-03T00:00:00.000Z"
  });

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.summary.filesAnalyzed, 2);
  assert.equal(report.summary.classifications.healthy, 1);
  assert.equal(report.summary.classifications.clipped, 1);
  assert.equal(report.summary.classifications.unknown, 1);
  assert.equal(report.files[0].founderListeningNotes, "(founder listening notes placeholder)");
  assert.match(report.files[1].warningText, /Clipping detected/);
});
