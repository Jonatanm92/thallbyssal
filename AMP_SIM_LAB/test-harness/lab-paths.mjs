import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const labRoot = path.resolve(__dirname, "..");
export const repoRoot = path.resolve(labRoot, "..");

export const generatedRoot =
  process.env.AMP_SIM_LAB_OUTPUT_DIR ||
  (process.platform === "win32" ? "D:\\CodexBuilds\\thallbyssal-lab" : path.join(labRoot, ".generated"));

export const reportsDir = path.join(generatedRoot, "reports");
export const rendersDir = path.join(generatedRoot, "renders");
export const diInputDir =
  process.env.AMP_SIM_LAB_DI_DIR || path.join(generatedRoot, "di-test-files");
export const betaPackDistRoot = path.join(generatedRoot, "beta-pack", "dist");
export const betaPackPackageRoot = path.join(betaPackDistRoot, "thallbyssal-private-beta-placeholder");

export const nativeBuildDir =
  process.env.THALLBYSSAL_NATIVE_BUILD_DIR ||
  (process.platform === "win32"
    ? "D:\\CodexBuilds\\thallbyssal-native"
    : path.join(repoRoot, "native", "juce-audio-engine", "build"));
