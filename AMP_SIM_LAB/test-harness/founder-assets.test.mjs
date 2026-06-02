import test from "node:test";
import assert from "node:assert/strict";
import { classifyFounderAsset, createFounderAssetReport } from "./validate-founder-assets.mjs";

test("classifies IR and NAM assets without approving public release", () => {
  assert.deepEqual(classifyFounderAsset("Tight Cab.wav"), {
    fileName: "Tight Cab.wav",
    extension: ".wav",
    assetType: "ir",
    supportedForLabIntake: true,
    publicReleaseAllowed: false,
    licenseStatus: "unknown"
  });

  assert.deepEqual(classifyFounderAsset("Heavy Model.nam"), {
    fileName: "Heavy Model.nam",
    extension: ".nam",
    assetType: "nam_model",
    supportedForLabIntake: true,
    publicReleaseAllowed: false,
    licenseStatus: "unknown"
  });
});

test("reports founder assets by type and keeps release blocked", () => {
  const report = createFounderAssetReport({
    generatedAt: "2026-06-01T00:00:00.000Z",
    assetRoot: "D:\\CodexBuilds\\thallbyssal-lab\\founder-assets",
    files: [
      { relativePath: "irs\\tight.wav", sizeBytes: 10 },
      { relativePath: "nam-models\\model.nam", sizeBytes: 20 },
      { relativePath: "unknown.bin", sizeBytes: 30 }
    ]
  });

  assert.equal(report.summary.totalFiles, 3);
  assert.equal(report.summary.irFiles, 1);
  assert.equal(report.summary.namFiles, 1);
  assert.equal(report.summary.unsupportedFiles, 1);
  assert.equal(report.summary.publicReleaseAllowedFiles, 0);
  assert.equal(report.safety.publicReleaseApproved, false);
});
