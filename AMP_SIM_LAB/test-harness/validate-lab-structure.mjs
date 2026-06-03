import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(__dirname, "..");

const requiredDirectories = [
  "test-harness",
  "di-test-files",
  "presets",
  "renders",
  "reports",
  "demo-site",
  "beta-pack",
  "market-validation",
  "release-checklists"
];

const requiredFiles = [
  "AMP_SIM_LAB_DASHBOARD.md",
  "AUDIO_REGRESSION_TEST_PLAN.md",
  "DI_TEST_FILE_MANIFEST.md",
  "HEADLESS_RENDER_DISCOVERY.md",
  "PRESET_SCHEMA.md",
  "PRESET_VALIDATION_PLAN.md",
  "DEMO_RENDER_PLAN.md",
  "BETA_TESTER_PACKET.md",
  "MARKET_VALIDATION_PLAN.md",
  "RENDER_HOOK_CONTRACT.md",
  "RELEASE_SAFETY_CHECKLIST.md",
  "TECHNICAL_BUILD_OPTIONS.md",
  "test-harness/audio-metrics.mjs",
  "test-harness/audition-matrix.mjs",
  "test-harness/audition-matrix.test.mjs",
  "test-harness/beta-readiness.mjs",
  "test-harness/beta-readiness.test.mjs",
  "test-harness/di-validation.mjs",
  "test-harness/di-validation.test.mjs",
  "test-harness/input-match/input-match.mjs",
  "test-harness/input-match/input-match.test.mjs",
  "test-harness/input-match/run-input-match.mjs",
  "test-harness/generate-audition-matrix.mjs",
  "test-harness/generate-beta-readiness.mjs",
  "test-harness/generate-report-index.mjs",
  "test-harness/reference-comparison/reference-tone-gap.mjs",
  "test-harness/reference-comparison/reference-tone-gap.test.mjs",
  "test-harness/lab-paths.mjs",
  "test-harness/render-hook-placeholder.mjs",
  "test-harness/render-hook/baseline.mjs",
  "test-harness/render-hook/baseline-compare.mjs",
  "test-harness/render-hook/baseline-create.mjs",
  "test-harness/render-hook/render-adapter.mjs",
  "test-harness/render-hook/render-hook.test.mjs",
  "test-harness/render-hook/render-report.mjs",
  "test-harness/render-hook/render-safety.mjs",
  "test-harness/render-hook/run-audition-render.mjs",
  "test-harness/render-hook/run-render.mjs",
  "test-harness/run-audio-regression.mjs",
  "test-harness/run-lab-tests.mjs",
  "test-harness/validate-di-files.mjs",
  "test-harness/validate-presets.mjs",
  "test-harness/create-beta-pack.mjs",
  "test-harness/validate-release-artifacts.mjs",
  "test-harness/generate-dashboard.mjs",
  "test-harness/run-lab-all.mjs",
  "../native/juce-audio-engine/scripts/create-shortcut.ps1",
  "../native/juce-audio-engine/scripts/render-offline.ps1",
  "../native/juce-audio-engine/Source/OfflineRendererMain.cpp",
  "presets/examples/high_gain_foundation_01.json",
  "presets/factory-placeholder-presets.json",
  "beta-pack/README_BETA_TEMPLATE.md",
  "beta-pack/KNOWN_ISSUES.md",
  "beta-pack/CHANGELOG_BETA.md",
  "beta-pack/FEEDBACK_FORM.md"
];

async function existsAsDirectory(relativePath) {
  try {
    const stats = await fs.stat(path.join(labRoot, relativePath));
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function existsAsFile(relativePath) {
  try {
    const stats = await fs.stat(path.join(labRoot, relativePath));
    return stats.isFile();
  } catch {
    return false;
  }
}

const missingDirectories = [];
for (const directory of requiredDirectories) {
  if (!(await existsAsDirectory(directory))) {
    missingDirectories.push(directory);
  }
}

const missingFiles = [];
for (const file of requiredFiles) {
  if (!(await existsAsFile(file))) {
    missingFiles.push(file);
  }
}

if (missingDirectories.length > 0 || missingFiles.length > 0) {
  console.error("AMP_SIM_LAB validation failed.");
  if (missingDirectories.length > 0) {
    console.error(`Missing directories: ${missingDirectories.join(", ")}`);
  }
  if (missingFiles.length > 0) {
    console.error(`Missing files: ${missingFiles.join(", ")}`);
  }
  process.exit(1);
}

console.log("AMP_SIM_LAB structure validation passed.");
