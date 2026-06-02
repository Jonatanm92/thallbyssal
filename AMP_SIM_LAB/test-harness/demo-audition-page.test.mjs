import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createDemoAuditionHtml, createDemoAuditionViewModel } from "./demo-audition-page.mjs";

test("creates internal placeholder rows when no render data exists", () => {
  const model = createDemoAuditionViewModel({
    generatedAt: "2026-06-02T00:00:00.000Z",
    reportsDir: "D:\\CodexBuilds\\thallbyssal-lab\\reports",
    auditionMatrix: null,
    renderResults: null,
    clipExists: () => false
  });

  assert.equal(model.summary.mode, "placeholder");
  assert.equal(model.summary.renderedClips, 0);
  assert.ok(model.rows.length >= 2);
  assert.equal(model.rows.every((row) => row.clipHref === null), true);
  assert.match(model.rows[0].statusLabel, /placeholder/i);

  const html = createDemoAuditionHtml(model);
  assert.match(html, /Internal demo\/audition only/);
  assert.match(html, /does not approve public release/);
  assert.doesNotMatch(html, /release ready/i);
  assert.doesNotMatch(html, /artist|song|brand/i);
});

test("links rendered clips from real render results when clip files exist", () => {
  const reportsDir = "D:\\CodexBuilds\\thallbyssal-lab\\reports";
  const processedWavPath = path.join(
    "D:\\CodexBuilds\\thallbyssal-lab",
    "renders",
    "auditions",
    "session-001",
    "tight-rhythm-low-tuned",
    "processed.wav"
  );

  const model = createDemoAuditionViewModel({
    generatedAt: "2026-06-02T00:00:00.000Z",
    reportsDir,
    auditionMatrix: {
      jobs: [
        {
          job_id: "tight-rhythm-low-tuned",
          preset_name: "Tight Rhythm",
          preset_category: "rhythm",
          di_slot: "low_tuned_chugs",
          status: "planned",
          messages: ["Ready for local audition render."]
        }
      ]
    },
    renderResults: {
      results: [
        {
          jobId: "tight-rhythm-low-tuned",
          presetId: "tight-rhythm",
          status: "rendered",
          renderHookStatus: "real-render",
          processedWavPath,
          metrics: { peakDbfs: -3.25, rmsDbfs: -18.5, clippedSamples: 0 },
          messages: ["Local headless render completed."]
        }
      ]
    },
    clipExists: (candidate) => candidate === processedWavPath
  });

  assert.equal(model.summary.mode, "render-results");
  assert.equal(model.summary.renderedClips, 1);
  assert.equal(model.rows[0].statusLabel, "rendered");
  assert.equal(model.rows[0].clipHref, "../renders/auditions/session-001/tight-rhythm-low-tuned/processed.wav");
  assert.equal(model.rows[0].clipLabel, "processed.wav");
  assert.equal(model.rows[0].peakLabel, "-3.25 dBFS");
  assert.equal(model.rows[0].clippingLabel, "0");

  const html = createDemoAuditionHtml(model);
  assert.match(html, /<audio controls preload="none"/);
  assert.match(html, /processed\.wav/);
  assert.doesNotMatch(html, /release ready/i);
});
