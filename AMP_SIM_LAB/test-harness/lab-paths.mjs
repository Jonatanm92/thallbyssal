import fs from "node:fs";
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

function resolveNativeBuildDir() {
  if (process.env.THALLBYSSAL_NATIVE_BUILD_DIR) {
    return process.env.THALLBYSSAL_NATIVE_BUILD_DIR;
  }

  if (process.platform !== "win32") {
    return path.join(repoRoot, "native", "juce-audio-engine", "build");
  }

  const defaultBuildDir = "D:\\CodexBuilds\\thallbyssal-native";
  const cachePath = path.join(defaultBuildDir, "CMakeCache.txt");

  if (fs.existsSync(cachePath)) {
    const cacheText = fs.readFileSync(cachePath, "utf8");
    const match = cacheText.match(/^CMAKE_HOME_DIRECTORY:INTERNAL=(.+)$/m);
    const cachedSource = match?.[1]?.replaceAll("\\", "/");
    const currentSource = path.join(repoRoot, "native", "juce-audio-engine").replaceAll("\\", "/");

    if (cachedSource && cachedSource !== currentSource) {
      const safeRepoName = path.basename(repoRoot).replaceAll(/[^A-Za-z0-9._-]/g, "-");
      return `D:\\CodexBuilds\\${safeRepoName}-native`;
    }
  }

  return defaultBuildDir;
}

export const nativeBuildDir = resolveNativeBuildDir();
