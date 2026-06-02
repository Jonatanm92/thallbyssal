import test from "node:test";
import assert from "node:assert/strict";
import { validateDiMetricsReport } from "./di-validation.mjs";

const baseMetric = {
  sampleRate: 48000,
  channels: 1,
  bitsPerSample: 32,
  audioFormat: "PCM",
  durationSeconds: 15,
  peak: 0.5,
  peakDbfs: -6,
  rms: 0.04,
  rmsDbfs: -28,
  clippedSamples: 0,
  lufsEstimate: -28.7
};

function metricsReport(files) {
  return {
    schemaVersion: 1,
    generatedAt: "2026-06-01T00:00:00.000Z",
    inputDir: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files",
    files
  };
}

test("marks the three starter DI files ready when levels are safe", () => {
  const report = validateDiMetricsReport(
    metricsReport([
      {
        fileName: "LOW TUNED CHUGS.wav",
        ok: true,
        metrics: {
          ...baseMetric,
          peakDbfs: -5.63,
          rmsDbfs: -24.09,
          lufsEstimate: -24.78,
          durationSeconds: 35.3
        }
      },
      {
        fileName: "PICK ATTACK.wav",
        ok: true,
        metrics: {
          ...baseMetric,
          sampleRate: 96000,
          channels: 2,
          peakDbfs: -7.02,
          rmsDbfs: -29.24,
          lufsEstimate: -29.93,
          durationSeconds: 34.9
        }
      },
      {
        fileName: "noise.wav",
        ok: true,
        metrics: {
          ...baseMetric,
          sampleRate: 96000,
          channels: 2,
          peak: 0.0004,
          peakDbfs: -67.8,
          rms: 0.00005,
          rmsDbfs: -86.4,
          lufsEstimate: -87.1,
          durationSeconds: 17.4
        }
      }
    ])
  );

  assert.equal(report.summary.starterReady, true);
  assert.equal(report.summary.errors, 0);
  assert.equal(report.requiredSlots.low_tuned_chugs.status, "pass");
  assert.equal(report.requiredSlots.dynamic_pick_attack.status, "pass");
  assert.equal(report.requiredSlots.noise_floor_test.status, "pass");
});

test("blocks starter readiness when chugs are clipped", () => {
  const report = validateDiMetricsReport(
    metricsReport([
      {
        fileName: "LOW TUNED CHUGS.wav",
        ok: true,
        metrics: {
          ...baseMetric,
          peakDbfs: 0,
          clippedSamples: 53
        }
      },
      {
        fileName: "PICK ATTACK.wav",
        ok: true,
        metrics: baseMetric
      },
      {
        fileName: "noise.wav",
        ok: true,
        metrics: {
          ...baseMetric,
          peakDbfs: -67,
          rmsDbfs: -86
        }
      }
    ])
  );

  assert.equal(report.summary.starterReady, false);
  assert.match(report.requiredSlots.low_tuned_chugs.errors.join("\n"), /clipped/i);
});

test("reports missing required starter files", () => {
  const report = validateDiMetricsReport(metricsReport([]));

  assert.equal(report.summary.starterReady, false);
  assert.equal(report.requiredSlots.low_tuned_chugs.status, "missing");
  assert.equal(report.requiredSlots.dynamic_pick_attack.status, "missing");
  assert.equal(report.requiredSlots.noise_floor_test.status, "missing");
  assert.equal(report.summary.errors, 3);
});
