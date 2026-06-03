import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [
  ["lab:validate", "validate-lab-structure.mjs"],
  ["lab:test", "run-lab-tests.mjs"],
  ["lab:metrics", "run-audio-regression.mjs"],
  ["lab:di", "validate-di-files.mjs"],
  ["lab:input-match", path.join("input-match", "run-input-match.mjs")],
  ["lab:founder-assets", "validate-founder-assets.mjs"],
  ["lab:audition", "generate-audition-matrix.mjs"],
  ["lab:audition:render", path.join("render-hook", "run-audition-render.mjs")],
  ["lab:render:safety", path.join("render-hook", "render-safety.mjs")],
  ["lab:validate-presets", "validate-presets.mjs"],
  ["lab:beta-pack", "create-beta-pack.mjs"],
  ["lab:release", "validate-release-artifacts.mjs"],
  ["lab:beta-readiness", "generate-beta-readiness.mjs"],
  ["lab:report-index", "generate-report-index.mjs"],
  ["lab:dashboard", "generate-dashboard.mjs"]
];

for (const [label, scriptName] of commands) {
  console.log(`\n=== ${label} ===`);
  const scriptArgs = Array.isArray(scriptName) ? scriptName : [path.join(__dirname, scriptName)];
  const result = spawnSync(process.execPath, scriptArgs, {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    console.error(`AMP_SIM_LAB all stopped at ${label}.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nAMP_SIM_LAB all checks completed.");
