import assert from "node:assert/strict";
import test from "node:test";
import {
  createOutputPolishGapMarkdown,
  createOutputPolishGapReport
} from "./current-best-output-polish-gap.mjs";

function field(deltaSourceMinusBeta) {
  return { deltaSourceMinusBeta };
}

test("output polish gap summarizes excessive mid and high deltas", () => {
  const report = createOutputPolishGapReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    parityReport: {
      manifestPath: "D:/local/source-parity-manifest.local.json",
      pairs: [
        {
          id: "chugs",
          status: "review-render-format-or-duration-mismatch",
          sourceMetrics: { clippedSamples: 0 },
          betaMetrics: { clippedSamples: 0 },
          sourceProbeMetadata: { probeVariant: "a2-full-rig-v0" },
          comparison: {
            fields: {
              rmsDbfs: field(3),
              lowRmsDbfs: field(0.2),
              lowMidRmsDbfs: field(2.1),
              midRmsDbfs: field(5.8),
              highRmsDbfs: field(6.5)
            }
          }
        },
        {
          id: "pick",
          status: "review-render-format-or-duration-mismatch",
          sourceMetrics: { clippedSamples: 0 },
          betaMetrics: { clippedSamples: 0 },
          sourceProbeMetadata: { probeVariant: "a2-full-rig-v0" },
          comparison: {
            fields: {
              rmsDbfs: field(4),
              lowRmsDbfs: field(1.0),
              lowMidRmsDbfs: field(3.3),
              midRmsDbfs: field(6.4),
              highRmsDbfs: field(6.4)
            }
          }
        }
      ]
    }
  });

  assert.equal(report.status, "measurement-ready-not-parity");
  assert.equal(report.summary.comparablePairs, 2);
  assert.equal(report.summary.fieldSummaries.highRmsDbfs.averageDeltaDb, 6.45);
  assert.equal(report.summary.fieldSummaries.lowRmsDbfs.averageDeltaDb, 0.6);
  assert.deepEqual(report.summary.riskFlags, [
    "excess-high-energy",
    "excess-mid-energy",
    "excess-low-mid-energy",
    "low-band-close-but-top-too-forward",
    "source-rms-too-hot"
  ]);
  assert.match(report.summary.nextMeasurement, /output polish\/headroom/i);

  const markdown = createOutputPolishGapMarkdown(report);
  assert.match(markdown, /Current Best Output Polish Gap/);
  assert.match(markdown, /excess-high-energy/);
  assert.match(markdown, /chugs/);
});

test("output polish gap blocks clearly with no comparable pairs", () => {
  const report = createOutputPolishGapReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    parityReport: {
      manifestPath: "D:/local/source-parity-manifest.local.json",
      pairs: [
        {
          id: "missing",
          status: "blocked-missing-source-probe-render"
        }
      ]
    }
  });

  assert.equal(report.status, "blocked-missing-comparable-pairs");
  assert.equal(report.summary.comparablePairs, 0);
  assert.equal(report.summary.parityClaimAllowed, false);
  assert.match(createOutputPolishGapMarkdown(report), /No DSP/);
});
