import test from "node:test";
import assert from "node:assert/strict";
import { createPresetAuditionSelection } from "./preset-audition-selection.mjs";

const matrix = {
  generatedAt: "2026-06-01T00:00:00.000Z",
  jobs: [
    {
      job_id: "abyssal-tight-rhythm__low-tuned-chugs",
      preset_id: "abyssal-tight-rhythm",
      preset_name: "Abyssal Tight Rhythm",
      preset_category: "rhythm",
      di_file_name: "low_tuned_chugs.wav",
      status: "planned",
      render_status: "not_wired",
      source_metrics: {
        peakDbfs: -6,
        rmsDbfs: -24,
        lufsEstimate: -24.691,
        clippedSamples: 0
      }
    },
    {
      job_id: "glass-attack-lead__dynamic-pick-attack",
      preset_id: "glass-attack-lead",
      preset_name: "Glass Attack Lead",
      preset_category: "lead",
      di_file_name: "dynamic_pick_attack.wav",
      status: "blocked",
      render_status: "not_wired",
      source_metrics: null
    }
  ]
};

const renderResults = {
  mode: "dry-run",
  results: [
    {
      jobId: "abyssal-tight-rhythm-low-tuned-chugs",
      presetId: "abyssal-tight-rhythm",
      status: "dry_run",
      renderHookStatus: "dry-run",
      metrics: null
    }
  ]
};

test("creates founder audition selection entries with objective render data and placeholders", () => {
  const selection = createPresetAuditionSelection({
    generatedAt: "2026-06-02T00:00:00.000Z",
    matrix,
    renderResults
  });

  assert.equal(selection.summary.entries, 2);
  assert.equal(selection.summary.realRenders, 0);
  assert.equal(selection.summary.dryRuns, 1);
  assert.equal(selection.summary.renderFailures, 1);
  assert.equal(selection.summary.autoRanked, false);

  assert.deepEqual(selection.entries[0], {
    presetId: "abyssal-tight-rhythm",
    presetName: "Abyssal Tight Rhythm",
    category: "rhythm",
    diFile: "low_tuned_chugs.wav",
    renderSuccess: "yes",
    renderMode: "dry-run",
    peakDbfsEstimate: -6,
    rmsDbfsEstimate: -24,
    lufsEstimate: -24.691,
    clipping: "no",
    founderRating: "",
    founderNotes: "",
    decision: "",
    suggestedBetaDemoCandidate: ""
  });

  assert.equal(selection.entries[1].renderSuccess, "no");
  assert.equal(selection.entries[1].renderMode, "not-rendered");
  assert.equal(selection.entries[1].founderRating, "");
  assert.equal(selection.entries[1].decision, "");
  assert.equal(selection.entries[1].suggestedBetaDemoCandidate, "");
});
