import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportsDir } from "./lab-paths.mjs";

const __filename = fileURLToPath(import.meta.url);

const criteriaLabels = {
  overall_feel: "overall feel",
  tightness: "tightness",
  pick_attack: "pick attack",
  low_end_control: "low-end control",
  clarity: "clarity",
  gate_feel: "gate feel",
  cab_bite: "cab bite"
};

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function averageScore(scores) {
  const values = Object.values(scores ?? {}).filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return 0;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function lowScoreMoves(scores) {
  const moves = [];

  if ((scores.low_end_control ?? 10) <= 4) {
    moves.push("Preset-only move: tighten low-end control before considering any DSP change.");
  }

  if ((scores.clarity ?? 10) <= 4) {
    moves.push("Preset-only move: improve clarity with cab/EQ balance before touching core sound.");
  }

  if ((scores.pick_attack ?? 10) <= 4) {
    moves.push("Preset-only move: increase pick attack/presence feel using existing controls.");
  }

  if ((scores.gate_feel ?? 10) <= 4) {
    moves.push("Preset-only move: adjust gate feel using existing preset parameters only.");
  }

  if ((scores.cab_bite ?? 10) <= 4) {
    moves.push("Preset-only move: adjust cab bite/edge using existing cab or EQ controls.");
  }

  if ((scores.tightness ?? 10) <= 4) {
    moves.push("Preset-only move: increase tightness with existing input/boost/EQ controls.");
  }

  return moves;
}

function highScoreStrengths(scores) {
  return Object.entries(scores ?? {})
    .filter(([, value]) => Number.isFinite(value) && value >= 8)
    .map(([criterion]) => criteriaLabels[criterion] ?? criterion);
}

export function createFeedbackPlan(feedback) {
  const rankedCandidates = (feedback.candidates ?? [])
    .map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      averageScore: averageScore(candidate.scores),
      scores: candidate.scores ?? {},
      strengths: highScoreStrengths(candidate.scores),
      presetOnlyMoves: lowScoreMoves(candidate.scores),
      notes: candidate.notes ?? ""
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    purpose: "Founder-rated local feedback plan for preset-only iteration. No automatic tone judgement and no preset edits.",
    safety: {
      localOnly: true,
      dspChangesAllowed: false,
      presetAutoWriteAllowed: false,
      publicReleaseApproved: false
    },
    summary: {
      candidatesReviewed: rankedCandidates.length,
      topCandidateId: rankedCandidates[0]?.id ?? null,
      topCandidateLabel: rankedCandidates[0]?.label ?? null,
      nextAction: rankedCandidates.length > 0
        ? "Use founder notes to create a manual preset-only revision candidate."
        : "Export feedback from the local review page first."
    },
    rankedCandidates,
    nextFounderDecision: "Choose one candidate as the base for the next preset-only revision."
  };
}

export function parseFeedbackJson(text) {
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

function renderHtml(plan) {
  const rows = plan.rankedCandidates.map((candidate, index) => `<tr>
  <td>${index + 1}</td>
  <td>${candidate.label}</td>
  <td>${candidate.averageScore}</td>
  <td>${candidate.strengths.join(", ") || "(none marked 8+)"}</td>
  <td>${candidate.presetOnlyMoves.join("<br>") || "No low-score preset-only move flagged."}</td>
  <td>${candidate.notes || ""}</td>
</tr>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reference Feedback Plan</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; max-width: 1200px; }
    p { color: #aab7c4; }
    table { border-collapse: collapse; width: 100%; margin-top: 22px; }
    th, td { border: 1px solid #334155; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>Reference Feedback Plan</h1>
  <p>Generated: ${plan.generatedAt}</p>
  <p>${plan.purpose}</p>
  <p>Next founder decision: ${plan.nextFounderDecision}</p>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Candidate</th>
        <th>Average</th>
        <th>Strengths</th>
        <th>Preset-only moves</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6">No feedback candidates found.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

function renderMarkdown(plan) {
  const rows = plan.rankedCandidates.map((candidate, index) => (
    `| ${index + 1} | ${candidate.label} | ${candidate.averageScore} | ${candidate.strengths.join(", ") || "(none)"} | ${candidate.presetOnlyMoves.join(" / ") || "No low-score move flagged."} |`
  )).join("\n");

  return `# Reference Feedback Plan

Generated: ${plan.generatedAt}

${plan.purpose}

- DSP changes allowed: no
- Automatic preset writes allowed: no
- Public release approved: no
- Next founder decision: ${plan.nextFounderDecision}

| Rank | Candidate | Average | Strengths | Preset-only moves |
| ---: | --- | ---: | --- | --- |
${rows}
`;
}

function parseArgs(argv) {
  const options = { feedback: null };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--feedback" && argv[index + 1]) {
      options.feedback = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

export async function writeFeedbackPlan(feedbackPath) {
  if (!feedbackPath) {
    throw new Error("Missing --feedback path. Export JSON from review.html first.");
  }

  const feedback = parseFeedbackJson(await fs.readFile(feedbackPath, "utf8"));
  const plan = createFeedbackPlan(feedback);
  await fs.mkdir(reportsDir, { recursive: true });

  const paths = {
    json: path.join(reportsDir, "reference-feedback-plan.json"),
    html: path.join(reportsDir, "reference-feedback-plan.html"),
    markdown: path.join(reportsDir, "REFERENCE_FEEDBACK_PLAN.md")
  };

  await fs.writeFile(paths.json, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  await fs.writeFile(paths.html, renderHtml(plan), "utf8");
  await fs.writeFile(paths.markdown, renderMarkdown(plan), "utf8");

  return { plan, paths };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await writeFeedbackPlan(options.feedback);
    console.log(`Reference feedback plan written: ${result.paths.html}`);
    console.log(`Candidates reviewed: ${result.plan.summary.candidatesReviewed}`);
    console.log(`Top candidate: ${result.plan.summary.topCandidateLabel ?? "(none)"}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
