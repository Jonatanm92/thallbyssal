import fs from "node:fs/promises";
import path from "node:path";
import { betaPackPackageRoot, repoRoot, reportsDir } from "./lab-paths.mjs";

const packageRoot = betaPackPackageRoot;

const filesToCopy = [
  [path.join(repoRoot, "AMP_SIM_LAB", "BETA_TESTER_PACKET.md"), "BETA_TESTER_PACKET.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "README_BETA_TEMPLATE.md"), "README_BETA.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "KNOWN_ISSUES.md"), "KNOWN_ISSUES.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "CHANGELOG_BETA.md"), "CHANGELOG_BETA.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "FEEDBACK_FORM.md"), "FEEDBACK_FORM.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "PLAYABLE_BETA_SMOKE_TEST.md"), "PLAYABLE_BETA_SMOKE_TEST.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "BETA_LISTENING_INSTRUCTIONS.md"), "BETA_LISTENING_INSTRUCTIONS.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "BETA_FEEDBACK_QUESTIONS.md"), "BETA_FEEDBACK_QUESTIONS.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "beta-pack", "PRIVATE_BETA_LISTENING_PAGE.md"), "PRIVATE_BETA_LISTENING_PAGE.md"],
  [path.join(repoRoot, "AMP_SIM_LAB", "RELEASE_SAFETY_CHECKLIST.md"), "RELEASE_SAFETY_CHECKLIST.md"],
  [path.join(reportsDir, "preset-validation.json"), "reports/preset-validation.json"],
  [path.join(reportsDir, "audio-metrics.json"), "reports/audio-metrics.json"],
  [path.join(reportsDir, "di-validation.json"), "reports/di-validation.json"],
  [path.join(reportsDir, "audition-matrix.json"), "reports/audition-matrix.json"]
];

async function copyIfExists(source, targetRelative, copied, missing) {
  const target = path.join(packageRoot, targetRelative);

  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
    copied.push(targetRelative);
  } catch {
    missing.push(source);
  }
}

async function main() {
  await fs.rm(packageRoot, { recursive: true, force: true });
  await fs.mkdir(packageRoot, { recursive: true });

  const copied = [];
  const missing = [];

  for (const [source, target] of filesToCopy) {
    await copyIfExists(source, target, copied, missing);
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    packageType: "private-beta-placeholder",
    product: "Thallbyssal",
    containsPluginBinary: false,
    containsTelemetry: false,
    containsCheckoutOrLicensing: false,
    copied,
    missing,
    note:
      "This placeholder beta pack contains docs/reports only. Add binaries manually only after founder approval and release safety checks."
  };

  await fs.writeFile(path.join(packageRoot, "BETA_PACK_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Beta pack placeholder written: ${packageRoot}`);
  console.log(`Copied files: ${copied.length}`);
  console.log(`Missing optional files: ${missing.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
