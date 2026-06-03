import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tests = [
  "audition-matrix.test.mjs",
  "beta-readiness.test.mjs",
  "demo-audition-page.test.mjs",
  "di-validation.test.mjs",
  "founder-assets.test.mjs",
  path.join("input-match", "input-match.test.mjs"),
  "ir-reference-audition.test.mjs",
  "preset-validation.test.mjs",
  "reference-feedback-plan.test.mjs",
  "reference-listening-pack.test.mjs",
  path.join("render-hook", "render-hook.test.mjs")
];

const result = spawnSync(process.execPath, ["--test", ...tests.map((testFile) => path.join(__dirname, testFile))], {
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);
