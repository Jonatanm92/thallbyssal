import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createSourceParityHtml,
  createSourceParityMarkdown,
  createSourceParityReport
} from "./current-best-source-parity.mjs";

function writePcm16Wav(filePath, samples, sampleRate = 48000) {
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * bytesPerSample);
  });

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

test("source parity report blocks clearly when local manifest is missing", () => {
  const missingManifest = path.join(os.tmpdir(), `missing-source-parity-${Date.now()}.json`);
  const report = createSourceParityReport({ manifestPath: missingManifest, generatedAt: "2026-06-27T00:00:00.000Z" });

  assert.equal(report.status, "blocked-missing-manifest");
  assert.equal(report.summary.comparablePairs, 0);
  assert.equal(report.summary.parityClaimAllowed, undefined);
  assert.match(report.nextAction, /Create the local manifest/);
  assert.match(createSourceParityMarkdown(report), /Parity claim allowed: no/);
  assert.match(createSourceParityHtml(report), /internal measurement gate only/i);
});

test("source parity report marks missing beta render as blocked evidence", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-parity-missing-beta-"));
  const sourcePath = path.join(tempDir, "source-probe.wav");
  writePcm16Wav(sourcePath, [0, 0.1, -0.1, 0.2, -0.2]);

  const report = createSourceParityReport({
    generatedAt: "2026-06-27T00:00:00.000Z",
    manifestPath: path.join(tempDir, "manifest.json"),
    manifest: {
      pairs: [
        {
          id: "pick",
          sourceProbeRenderPath: sourcePath,
          knownGoodBetaRenderPath: path.join(tempDir, "missing-beta.wav")
        }
      ]
    }
  });

  assert.equal(report.status, "blocked-or-partial");
  assert.equal(report.summary.comparablePairs, 0);
  assert.equal(report.pairs[0].status, "blocked-missing-known-good-beta-render");
  assert.equal(report.pairs[0].files.sourceProbeRenderExists, true);
  assert.equal(report.pairs[0].files.knownGoodBetaRenderExists, false);
});

test("source parity report compares source probe and known-good beta WAV metrics", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-parity-ready-"));
  const sourcePath = path.join(tempDir, "source-probe.wav");
  const betaPath = path.join(tempDir, "known-good-beta.wav");
  writePcm16Wav(sourcePath, [0, 0.1, -0.1, 0.2, -0.2]);
  writePcm16Wav(betaPath, [0, 0.05, -0.05, 0.1, -0.1]);

  const report = createSourceParityReport({
    generatedAt: "2026-06-27T00:00:00.000Z",
    manifestPath: path.join(tempDir, "manifest.json"),
    manifest: {
      pairs: [
        {
          id: "level-check",
          sourceProbeRenderPath: sourcePath,
          knownGoodBetaRenderPath: betaPath
        }
      ]
    }
  });

  assert.equal(report.status, "measurement-ready");
  assert.equal(report.summary.comparablePairs, 1);
  assert.equal(report.summary.parityClaimAllowed, false);
  assert.equal(report.pairs[0].evidenceLevel, "measurement-evidence-only");
  assert.ok(report.pairs[0].comparison.fields.rmsDbfs.deltaSourceMinusBeta > 5);
  assert.equal(report.pairs[0].comparison.sampleRateMatch, true);
  assert.match(createSourceParityMarkdown(report), /level-check/);
  assert.match(createSourceParityHtml(report), /Known-good beta/);
});
