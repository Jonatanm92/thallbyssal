import test from "node:test";
import assert from "node:assert/strict";
import { createFeedbackPlan, parseFeedbackJson } from "./create-reference-feedback-plan.mjs";

test("ranks founder-rated candidates and creates preset-only next moves", () => {
  const plan = createFeedbackPlan({
    schemaVersion: 1,
    candidates: [
      {
        id: "candidate-a",
        label: "Candidate A",
        scores: {
          overall_feel: 8,
          tightness: 7,
          pick_attack: 8,
          low_end_control: 4,
          clarity: 5,
          gate_feel: 6,
          cab_bite: 7
        },
        notes: "closest but low end needs control"
      },
      {
        id: "candidate-b",
        label: "Candidate B",
        scores: {
          overall_feel: 5,
          tightness: 4,
          pick_attack: 5,
          low_end_control: 5,
          clarity: 4,
          gate_feel: 5,
          cab_bite: 4
        },
        notes: ""
      }
    ]
  });

  assert.equal(plan.summary.candidatesReviewed, 2);
  assert.equal(plan.summary.topCandidateId, "candidate-a");
  assert.equal(plan.rankedCandidates[0].averageScore, 6.43);
  assert.match(plan.rankedCandidates[0].presetOnlyMoves.join("\n"), /low-end/i);
  assert.equal(plan.safety.dspChangesAllowed, false);
});

test("parses feedback JSON with a UTF-8 BOM", () => {
  const feedback = parseFeedbackJson('\uFEFF{"schemaVersion":1,"candidates":[]}');

  assert.equal(feedback.schemaVersion, 1);
  assert.deepEqual(feedback.candidates, []);
});
