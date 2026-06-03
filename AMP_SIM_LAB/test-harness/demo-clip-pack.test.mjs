import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createDemoClipPackHtml, createDemoClipPackReport } from "./demo-clip-pack.mjs";

test("creates founder review rows from real render results without creating audio", () => {
  const reportsDir = "D:\\CodexBuilds\\thallbyssal-lab\\reports";
  const rendersDir = "D:\\CodexBuilds\\thallbyssal-lab\\renders";
  const processedWavPath = path.join(
    rendersDir,
    "2026-06-03_151349_555",
    "abyssal-tight-rhythm-low-tuned-chugs",
    "processed.wav"
  );
  const metricsPath = path.join(
    rendersDir,
    "2026-06-03_151349_555",
    "abyssal-tight-rhythm-low-tuned-chugs",
    "metrics.json"
  );

  const report = createDemoClipPackReport({
    generatedAt: "2026-06-03T13:14:09.147Z",
    reportsDir,
    rendersDir,
    clipExists: (candidate) => candidate === processedWavPath || candidate === metricsPath,
    renderResults: {
      generatedAt: "2026-06-03T13:14:09.147Z",
      source: "audition-matrix",
      mode: "real",
      summary: {
        attempted: 1,
        succeeded: 1,
        dryRuns: 0,
        clippingCount: 0,
        renderHookStatus: "real-render"
      },
      results: [
        {
          startedAt: "2026-06-03T13:13:49.572Z",
          completedAt: "2026-06-03T13:13:50.552Z",
          status: "rendered",
          mode: "real",
          renderHookStatus: "real-render",
          inputPath: path.join("D:\\CodexBuilds\\thallbyssal-lab\\di-test-files", "LOW TUNED CHUGS.wav"),
          presetId: "abyssal-tight-rhythm",
          jobId: "abyssal-tight-rhythm-low-tuned-chugs",
          outputDirectory: path.join(rendersDir, "2026-06-03_151349_555", "abyssal-tight-rhythm-low-tuned-chugs"),
          processedWavPath,
          metricsPath,
          metrics: {
            peakDbfs: -4.2359,
            rmsDbfs: -9.155,
            lufsEstimate: -9.846,
            clippedSamples: 0
          },
          messages: ["Real headless render completed."]
        }
      ]
    },
    auditionMatrix: {
      jobs: [
        {
          preset_id: "abyssal-tight-rhythm",
          preset_name: "Abyssal Tight Rhythm",
          preset_category: "rhythm",
          di_slot: "low_tuned_chugs",
          di_file_name: "LOW TUNED CHUGS.wav"
        }
      ]
    }
  });

  assert.equal(report.summary.realRenderClips, 1);
  assert.equal(report.summary.dryRunRows, 0);
  assert.equal(report.summary.clippingCount, 0);
  assert.equal(report.rows[0].renderSession, "2026-06-03_151349_555");
  assert.equal(report.rows[0].diFileName, "LOW TUNED CHUGS.wav");
  assert.equal(report.rows[0].presetName, "Abyssal Tight Rhythm");
  assert.equal(report.rows[0].processedClipReference, "../renders/2026-06-03_151349_555/abyssal-tight-rhythm-low-tuned-chugs/processed.wav");
  assert.equal(report.rows[0].metricsReference, "../renders/2026-06-03_151349_555/abyssal-tight-rhythm-low-tuned-chugs/metrics.json");
  assert.equal(report.rows[0].peakLabel, "-4.24 dBFS");
  assert.equal(report.rows[0].rmsLabel, "-9.15 dBFS");
  assert.equal(report.rows[0].lufsEstimateLabel, "-9.85 LUFS est.");
  assert.equal(report.rows[0].clippingStatus, "clean");
  assert.equal(report.rows[0].renderLabel, "real-render");
  assert.equal(report.rows[0].suggestedUseCase, "chug");
  assert.equal(report.rows[0].founderRating, "");
  assert.equal(report.rows[0].founderNotes, "");
  assert.equal(report.rows[0].founderDecision, "");

  const html = createDemoClipPackHtml(report);
  assert.match(html, /Internal Real Render Demo Clip Pack/);
  assert.match(html, /Founder Rating/);
  assert.match(html, /Keep \/ Improve \/ Reject/);
  assert.match(html, /<audio controls preload="none"/);
  assert.match(html, /Abyssal Tight Rhythm/);
  assert.doesNotMatch(html, /release ready/i);
});
