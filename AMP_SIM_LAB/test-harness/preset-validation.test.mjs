import test from "node:test";
import assert from "node:assert/strict";
import { buildPresetValidationReport, createHtmlReport } from "./validate-presets.mjs";

function validPreset(overrides = {}) {
  return {
    preset_id: "internal-validation-preset",
    name: "Internal Validation Preset",
    category: "rhythm",
    gain_level: "high",
    genre_tags: ["internal", "validation"],
    pickup_recommendation: "bridge humbucker",
    input_gain: 0,
    output_gain: -5,
    amp_section_settings: {},
    cab_or_ir_reference: "factory-cab",
    effects_settings: {},
    cpu_cost_estimate: "unknown",
    loudness_target: {
      peak_dbfs_max: -1,
      rms_dbfs_range: [-24, -10]
    },
    author: "Founder",
    version: "0.1.0",
    notes: "Internal validation preset. Not approved for public release.",
    ...overrides
  };
}

function reportFor(presets) {
  return buildPresetValidationReport({
    files: ["synthetic-presets.json"],
    fileErrors: [],
    presets: presets.map((preset, sourceIndex) => ({
      sourceFile: "synthetic-presets.json",
      sourceIndex,
      preset
    })),
    generatedAt: "2026-06-02T00:00:00.000Z",
    presetDir: "AMP_SIM_LAB/presets"
  });
}

test("preset validation rejects missing, empty, and wrongly typed required fields", () => {
  const report = reportFor([
    validPreset({
      preset_id: "",
      name: " ",
      genre_tags: [],
      pickup_recommendation: "",
      cab_or_ir_reference: "",
      author: "",
      version: "",
      notes: "",
      loudness_target: {
        peak_dbfs_max: Number.NaN,
        rms_dbfs_range: [-10, -24]
      }
    })
  ]);

  const messages = report.presets[0].errors.join("\n");

  assert.match(messages, /preset_id must be a non-empty kebab-case string/);
  assert.match(messages, /name must be a non-empty string/);
  assert.match(messages, /genre_tags must include at least one non-empty string/);
  assert.match(messages, /pickup_recommendation must be a non-empty string/);
  assert.match(messages, /cab_or_ir_reference must be a non-empty string/);
  assert.match(messages, /author must be a non-empty string/);
  assert.match(messages, /version must be a non-empty string/);
  assert.match(messages, /notes must be a non-empty string/);
  assert.match(messages, /loudness_target.peak_dbfs_max must be a finite number/);
  assert.match(messages, /loudness_target.rms_dbfs_range must be ordered from quieter to louder/);
});

test("preset validation reports duplicate IDs and names with source locations", () => {
  const report = reportFor([
    validPreset({ preset_id: "duplicate-id", name: "Duplicate Name" }),
    validPreset({ preset_id: "duplicate-id", name: " duplicate name " })
  ]);

  const duplicateErrors = report.presets.flatMap((preset) => preset.errors).join("\n");

  assert.match(duplicateErrors, /Duplicate preset_id "duplicate-id" also used by synthetic-presets.json#0/);
  assert.match(duplicateErrors, /Duplicate preset name " duplicate name " also used by synthetic-presets.json#0/);
  assert.equal(report.summary.duplicatePresetIds, 1);
  assert.equal(report.summary.duplicatePresetNames, 1);
});

test("preset validation records invalid categories in the JSON summary", () => {
  const report = reportFor([
    validPreset({
      preset_id: "invalid-category-preset",
      category: "cover-tone"
    })
  ]);

  assert.match(report.presets[0].errors.join("\n"), /category must be one of/);
  assert.deepEqual(report.summary.invalidCategories, ["cover-tone"]);
});

test("preset validation warns on suspicious brand, artist, song, album, and trademark-like claims", () => {
  const report = reportFor([
    validPreset({
      preset_id: "signature-artist-song-preset",
      name: "Official Brand Signature",
      notes: "Artist-style setting for a song and album reference. Not approved for public release."
    })
  ]);

  const warnings = report.presets[0].warnings.join("\n");

  assert.match(warnings, /Suspicious claim language/);
  assert.equal(report.summary.suspiciousClaimWarnings, 1);
});

test("HTML report escapes preset metadata and includes validation summary details", () => {
  const report = reportFor([
    validPreset({
      preset_id: "html-escape-preset",
      name: "<script>",
      category: "cover-tone"
    })
  ]);

  const html = createHtmlReport(report);

  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Invalid categories/);
  assert.match(html, /cover-tone/);
  assert.match(html, /Suspicious claim warnings/);
});
