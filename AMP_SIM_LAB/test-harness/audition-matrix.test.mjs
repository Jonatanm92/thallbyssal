import test from "node:test";
import assert from "node:assert/strict";
import { createAuditionMatrix } from "./audition-matrix.mjs";

const readyDi = {
  summary: {
    starterReady: true,
    matchedSlots: 3,
    errors: 0,
    warnings: 0
  },
  requiredSlots: {
    low_tuned_chugs: {
      status: "pass",
      matchedFileName: "low_tuned_chugs.wav",
      metrics: { peakDbfs: -6, rmsDbfs: -24, clippedSamples: 0 }
    },
    dynamic_pick_attack: {
      status: "pass",
      matchedFileName: "dynamic_pick_attack.wav",
      metrics: { peakDbfs: -7, rmsDbfs: -29, clippedSamples: 0 }
    },
    noise_floor_test: {
      status: "pass",
      matchedFileName: "noise_floor_test.wav",
      metrics: { peakDbfs: -68, rmsDbfs: -86, clippedSamples: 0 }
    }
  }
};

const presets = [
  {
    preset_id: "abyssal-tight-rhythm",
    name: "Abyssal Tight Rhythm",
    category: "rhythm",
    gain_level: "high",
    loudness_target: { peak_dbfs_max: -1, rms_dbfs_range: [-24, -10] }
  },
  {
    preset_id: "glass-attack-lead",
    name: "Glass Attack Lead",
    category: "lead",
    gain_level: "high",
    loudness_target: { peak_dbfs_max: -1, rms_dbfs_range: [-26, -12] }
  },
  {
    preset_id: "noise-floor-utility",
    name: "Noise Floor Utility",
    category: "utility",
    gain_level: "clean",
    loudness_target: { peak_dbfs_max: -1, rms_dbfs_range: [-96, -24] }
  }
];

test("creates planned audition jobs from ready DI slots and presets", () => {
  const matrix = createAuditionMatrix({
    generatedAt: "2026-06-01T00:00:00.000Z",
    outputRoot: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\auditions",
    diValidationReport: readyDi,
    presets
  });

  assert.equal(matrix.summary.presets, 3);
  assert.equal(matrix.summary.jobs, 4);
  assert.equal(matrix.summary.blockedJobs, 0);
  assert.equal(matrix.summary.renderHook, "placeholder_only");
  assert.deepEqual(
    matrix.jobs.map((job) => `${job.preset_id}:${job.di_slot}`),
    [
      "abyssal-tight-rhythm:low_tuned_chugs",
      "abyssal-tight-rhythm:dynamic_pick_attack",
      "glass-attack-lead:dynamic_pick_attack",
      "noise-floor-utility:noise_floor_test"
    ]
  );
  assert.match(matrix.jobs[0].plannedOutputFile, /abyssal-tight-rhythm/);
});

test("blocks jobs when the required DI slot is not ready", () => {
  const diValidationReport = structuredClone(readyDi);
  diValidationReport.requiredSlots.low_tuned_chugs.status = "fail";
  diValidationReport.requiredSlots.low_tuned_chugs.errors = ["File is clipped."];

  const matrix = createAuditionMatrix({
    generatedAt: "2026-06-01T00:00:00.000Z",
    outputRoot: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\auditions",
    diValidationReport,
    presets: [presets[0]]
  });

  assert.equal(matrix.summary.jobs, 1);
  assert.equal(matrix.summary.blockedJobs, 1);
  assert.equal(matrix.jobs[0].status, "blocked");
  assert.match(matrix.jobs[0].messages.join("\n"), /not ready/i);
});

test("records presets with no starter DI mapping as skipped", () => {
  const matrix = createAuditionMatrix({
    generatedAt: "2026-06-01T00:00:00.000Z",
    outputRoot: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\auditions",
    diValidationReport: readyDi,
    presets: [
      {
        preset_id: "future-bass-test",
        name: "Future Bass Test",
        category: "bass",
        gain_level: "clean",
        loudness_target: { peak_dbfs_max: -1, rms_dbfs_range: [-24, -10] }
      }
    ]
  });

  assert.equal(matrix.summary.jobs, 0);
  assert.equal(matrix.summary.skippedPresets, 1);
  assert.equal(matrix.skippedPresets[0].reason, "No ready starter DI mapping for category: bass");
});
