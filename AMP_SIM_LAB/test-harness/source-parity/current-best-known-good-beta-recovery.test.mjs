import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createKnownGoodBetaRecoveryMarkdown,
  createKnownGoodBetaRecoveryReport
} from "./current-best-known-good-beta-recovery.mjs";

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

function comparison(name, contents) {
  return {
    name,
    status: "same",
    baselineSizeBytes: Buffer.byteLength(contents),
    candidateSizeBytes: Buffer.byteLength(contents),
    baselineSha256: sha256(contents),
    candidateSha256: sha256(contents)
  };
}

test("known-good beta recovery reports exact missing baseline files from audio-lock evidence", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "known-good-beta-recovery-missing-"));
  const baselineDir = path.join(tempDir, "baseline");
  const report = createKnownGoodBetaRecoveryReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    audioLockReportPath: path.join(tempDir, "current-best-audio-lock-compare.json"),
    audioLockReport: {
      baselineDir,
      candidateDir: path.join(tempDir, "candidate"),
      summary: { same: 4 },
      comparisons: [
        comparison("p01-current-best-baseline__di-boostalizer.wav", "di"),
        comparison("p01-current-best-baseline__low-tuned-chugs.wav", "chug"),
        comparison("p01-current-best-baseline__noise.wav", "noise"),
        comparison("p01-current-best-baseline__pick-attack.wav", "pick")
      ]
    }
  });

  assert.equal(report.status, "blocked-missing-known-good-beta-renders");
  assert.equal(report.summary.requiredBaselineFilesMissing, 4);
  assert.equal(report.summary.readyForDirectSourceParity, false);
  assert.match(createKnownGoodBetaRecoveryMarkdown(report), /Restore these exact WAVs/);
});

test("known-good beta recovery requires hash matches, not filenames only", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "known-good-beta-recovery-hash-"));
  const baselineDir = path.join(tempDir, "baseline");
  writeFile(path.join(baselineDir, "p01-current-best-baseline__di-boostalizer.wav"), "wrong");

  const report = createKnownGoodBetaRecoveryReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    audioLockReportPath: path.join(tempDir, "current-best-audio-lock-compare.json"),
    audioLockReport: {
      baselineDir,
      candidateDir: path.join(tempDir, "candidate"),
      comparisons: [
        comparison("p01-current-best-baseline__di-boostalizer.wav", "right"),
        comparison("p01-current-best-baseline__low-tuned-chugs.wav", "chug"),
        comparison("p01-current-best-baseline__noise.wav", "noise"),
        comparison("p01-current-best-baseline__pick-attack.wav", "pick")
      ]
    }
  });

  assert.equal(report.status, "blocked-missing-known-good-beta-renders");
  assert.equal(report.entries[0].baseline.status, "hash-mismatch");
  assert.equal(report.summary.requiredBaselineFilesHashMatched, 0);
});

test("known-good beta recovery is ready when all required baseline files match historical hashes", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "known-good-beta-recovery-ready-"));
  const baselineDir = path.join(tempDir, "baseline");
  const entries = [
    ["p01-current-best-baseline__di-boostalizer.wav", "di"],
    ["p01-current-best-baseline__low-tuned-chugs.wav", "chug"],
    ["p01-current-best-baseline__noise.wav", "noise"],
    ["p01-current-best-baseline__pick-attack.wav", "pick"]
  ];

  for (const [name, contents] of entries) {
    writeFile(path.join(baselineDir, name), contents);
  }

  const report = createKnownGoodBetaRecoveryReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    audioLockReportPath: path.join(tempDir, "current-best-audio-lock-compare.json"),
    audioLockReport: {
      baselineDir,
      candidateDir: path.join(tempDir, "candidate"),
      comparisons: entries.map(([name, contents]) => comparison(name, contents))
    }
  });

  assert.equal(report.status, "ready-direct-source-parity");
  assert.equal(report.summary.requiredBaselineFilesHashMatched, 4);
  assert.equal(report.summary.readyForDirectSourceParity, true);
});
