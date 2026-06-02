import test from "node:test";
import assert from "node:assert/strict";
import { calculateLevelMatchGain, createReviewModel, dbToLinear, resolveCandidateStatus } from "./create-reference-listening-pack.mjs";

test("calculates level-match gain to target RMS", () => {
  const gain = calculateLevelMatchGain({
    rmsDbfs: -16,
    peakDbfs: -8,
    targetRmsDbfs: -23,
    maxPeakDbfs: -1
  });

  assert.equal(gain.appliedGainDb, -7);
  assert.equal(gain.gainLimitedByHeadroom, false);
  assert.equal(gain.predictedPeakDbfs, -15);
});

test("limits positive gain when peak headroom would be exceeded", () => {
  const gain = calculateLevelMatchGain({
    rmsDbfs: -30,
    peakDbfs: -3,
    targetRmsDbfs: -23,
    maxPeakDbfs: -1
  });

  assert.equal(gain.desiredGainDb, 7);
  assert.equal(gain.appliedGainDb, 2);
  assert.equal(gain.gainLimitedByHeadroom, true);
});

test("converts dB gain to linear gain", () => {
  assert.equal(dbToLinear(0), 1);
  assert.ok(Math.abs(dbToLinear(-6) - 0.501187) < 0.00001);
});

test("creates a local-only review model from candidate and reference entries", () => {
  const review = createReviewModel({
    entries: [
      {
        id: "ref-one",
        label: "Reference One",
        type: "private-reference",
        relativeMatchedPath: "matched/ref-one.wav"
      },
      {
        id: "candidate-one",
        label: "Candidate One",
        type: "thallbyssal-candidate",
        relativeMatchedPath: "matched/candidate-one.wav"
      }
    ]
  });

  assert.equal(review.candidates.length, 1);
  assert.equal(review.references.length, 1);
  assert.equal(review.criteria.length, 7);
  assert.equal(review.candidates[0].id, "candidate-one");
  assert.equal(review.localOnly, true);
});

test("marks the first failed reference candidates as rejected after founder feedback", () => {
  assert.equal(resolveCandidateStatus("reference-tight-dark").status, "rejected");
  assert.equal(resolveCandidateStatus("reference-precision-response").status, "rejected");
  assert.equal(resolveCandidateStatus("reference-heavy-weight").status, "rejected");
});
