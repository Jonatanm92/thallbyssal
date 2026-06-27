import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createRuntimeEvidenceMarkdown,
  createRuntimeEvidenceReport,
  finalRuntimeMarker
} from "./current-best-runtime-evidence.mjs";

function writeProbeReport(root, fileName, { marker, peak = 0.93, rms = 0.47, clippedSamples = 0 } = {}) {
  const filePath = path.join(root, fileName);
  const results = [32, 64, 128, 256, 512, 1024, 2048].map((blockSize) => ({
    sampleRate: 48000,
    blockSize,
    latencySamples: 0,
    liveV1NamActive: true,
    status: marker,
    diagnostics: `${marker} / HOST 48.0K B${blockSize} / NAM 48.0K DIRECT`,
    peak: blockSize >= 256 ? peak : peak * 0.4,
    rms: blockSize >= 256 ? rms : rms * 0.4,
    clippedSamples
  }));
  fs.writeFileSync(filePath, `${JSON.stringify({
    probe: "ThallbyssalProductRuntimeProbe",
    generatedInputOnly: true,
    productionAudioProcessed: false,
    results
  }, null, 2)}\n`);
  return filePath;
}

function writeUtf16ProbeReport(root, fileName, options = {}) {
  const filePath = writeProbeReport(root, fileName, options);
  const text = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]));
  return filePath;
}

test("runtime evidence matrix blocks clearly when milestone reports are missing", () => {
  const report = createRuntimeEvidenceReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    reportEntries: [
      {
        id: "missing",
        label: "Missing checkpoint",
        path: path.join(os.tmpdir(), "missing-current-best-runtime-evidence.json"),
        expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG"]
      }
    ]
  });

  assert.equal(report.status, "blocked-or-partial");
  assert.equal(report.summary.missingMilestones, 1);
  assert.equal(report.summary.sourceParityClaimAllowed, false);
});

test("runtime evidence matrix extracts final marker and stable 48k target", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thallbyssal-runtime-evidence-"));
  const finalPath = writeProbeReport(root, "final.json", { marker: finalRuntimeMarker, peak: 0.9348, rms: 0.4688 });
  const earlierPath = writeProbeReport(root, "earlier.json", {
    marker: "INTERNAL BETA / DO NOT SHIP - CURRENT BEST A2 FULL-RIG / GATE V0.6",
    peak: 0.9011,
    rms: 0.4496
  });

  const report = createRuntimeEvidenceReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    reportEntries: [
      {
        id: "earlier",
        label: "Earlier checkpoint",
        path: earlierPath,
        expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG", "GATE V0.6"]
      },
      {
        id: "pset2-bst1-chf1",
        label: "Final checkpoint",
        path: finalPath,
        expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG", "GATE V0.7", "PSET2", "BST1", "CHF1"]
      }
    ]
  });

  assert.equal(report.status, "runtime-evidence-ready");
  assert.equal(report.summary.finalMarkerFound, true);
  assert.equal(report.summary.safeRuntimeEvidence, true);
  assert.equal(report.summary.sourceParityClaimAllowed, false);
  assert.equal(report.milestones[1].stable48k.resultCount, 4);
  assert.equal(report.milestones[1].stable48k.peak.mean, 0.9348);
  assert.equal(report.milestones[1].stable48k.rms.mean, 0.4688);
  assert.ok(report.deltasFromFinal.find((delta) => delta.id === "earlier").stable48kPeakDeltaFromFinal < 0);
});

test("runtime evidence markdown records that it is not parity approval", () => {
  const report = createRuntimeEvidenceReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    reportEntries: []
  });
  const markdown = createRuntimeEvidenceMarkdown(report);

  assert.match(markdown, /Current Best Runtime Evidence Matrix/);
  assert.match(markdown, /Source parity claim allowed: no/);
  assert.match(markdown, /Recovery Implications/);
});

test("runtime evidence matrix reads UTF-16LE historical probe reports", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thallbyssal-runtime-evidence-utf16-"));
  const finalPath = writeUtf16ProbeReport(root, "final-utf16.json", {
    marker: finalRuntimeMarker,
    peak: 0.9348,
    rms: 0.4688
  });

  const report = createRuntimeEvidenceReport({
    generatedAt: "2026-06-28T00:00:00.000Z",
    reportEntries: [
      {
        id: "pset2-bst1-chf1",
        label: "Final checkpoint",
        path: finalPath,
        expectedMarkerParts: ["CURRENT BEST A2 FULL-RIG", "GATE V0.7", "PSET2", "BST1", "CHF1"]
      }
    ]
  });

  assert.equal(report.status, "runtime-evidence-ready");
  assert.equal(report.summary.finalMarkerFound, true);
});
