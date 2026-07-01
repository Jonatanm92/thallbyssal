import fs from "node:fs/promises";
import path from "node:path";
import { betaPackPackageRoot, nativeBuildDir, repoRoot, reportsDir } from "./lab-paths.mjs";

const reportPath = path.join(reportsDir, "release-artifacts.json");
const htmlPath = path.join(reportsDir, "release-artifacts.html");

const defaultBuildDir = nativeBuildDir;

const betaPackRoot = betaPackPackageRoot;
const forbiddenBetaExtensions = new Set([".exe", ".dll", ".vst3", ".msi", ".pkg", ".dmg"]);
const forbiddenClaimPatterns = [
  /sounds\s+exactly\s+like/i,
  /modeled\s+after/i,
  /officially\s+licensed/i,
  /artist\s+approved/i,
  /checkout/i,
  /licensing\s+server/i,
  /telemetry/i,
  /analytics/i,
  /cloud\s+sync/i,
  /drm/i
];

async function pathInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      sizeBytes: stats.size
    };
  } catch {
    return {
      exists: false,
      isFile: false,
      isDirectory: false,
      sizeBytes: 0
    };
  }
}

async function walk(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(fullPath)));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  } catch {
    return [];
  }
}

async function readTextIfPossible(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (![".md", ".txt", ".json", ".html"].includes(extension)) {
    return "";
  }

  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function parsePackageVersion() {
  const packageJson = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
  return packageJson.version || "unknown";
}

async function parseCmakeVersion() {
  const cmakeText = await fs.readFile(path.join(repoRoot, "native", "juce-audio-engine", "CMakeLists.txt"), "utf8");
  const match = cmakeText.match(/project\([^)]*VERSION\s+([0-9]+\.[0-9]+\.[0-9]+)/i);
  return {
    version: match ? match[1] : "unknown",
    vst3AutoManifestDisabled: /VST3_AUTO_MANIFEST\s+FALSE/i.test(cmakeText)
  };
}

function createHtmlReport(report) {
  const artifactRows = report.artifacts
    .map((artifact) => `<tr>
  <td>${artifact.name}</td>
  <td>${artifact.path}</td>
  <td>${artifact.required ? "yes" : "no"}</td>
  <td>${artifact.exists ? "yes" : "no"}</td>
  <td>${artifact.kind}</td>
  <td>${artifact.sizeBytes}</td>
</tr>`)
    .join("\n");

  const issueRows = [...report.errors.map((message) => ["Error", message]), ...report.warnings.map((message) => ["Warning", message])]
    .map(([kind, message]) => `<tr><td>${kind}</td><td>${message}</td></tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Release Artifact Validation</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 28px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    .ok { color: #86efac; }
    .bad { color: #fca5a5; }
    .warn { color: #fde68a; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Release Artifact Validation</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Build dir: ${report.buildDir}</p>
  <p class="${report.summary.errors === 0 ? "ok" : "bad"}">Errors: ${report.summary.errors}</p>
  <p class="${report.summary.warnings === 0 ? "ok" : "warn"}">Warnings: ${report.summary.warnings}</p>
  <h2>Artifacts</h2>
  <table>
    <thead><tr><th>Name</th><th>Path</th><th>Required</th><th>Exists</th><th>Kind</th><th>Size</th></tr></thead>
    <tbody>${artifactRows}</tbody>
  </table>
  <h2>Issues</h2>
  <table>
    <thead><tr><th>Type</th><th>Message</th></tr></thead>
    <tbody>${issueRows || '<tr><td colspan="2">No issues.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const errors = [];
  const warnings = [];
  const packageVersion = await parsePackageVersion();
  const cmake = await parseCmakeVersion();

  if (packageVersion !== cmake.version) {
    warnings.push(`package.json version (${packageVersion}) differs from native CMake version (${cmake.version}).`);
  }

  if (cmake.vst3AutoManifestDisabled) {
    warnings.push("VST3_AUTO_MANIFEST is disabled for development stability; release packaging must handle VST3 manifest intentionally.");
  }

  const visualStandalonePath = path.join(defaultBuildDir, "ThallLabAudioEngine_artefacts", "Release", "Thall Lab Audio Engine.exe");
  const productStandalonePath = path.join(defaultBuildDir, "Thallbyssal_artefacts", "Release", "Standalone", "Thallbyssal.exe");
  const vst3BundlePath = path.join(defaultBuildDir, "Thallbyssal_artefacts", "Release", "VST3", "Thallbyssal.vst3");
  const vst3BinaryPath = path.join(vst3BundlePath, "Contents", "x86_64-win", "Thallbyssal.vst3");
  const installedVst3Path = process.platform === "win32" ? "C:\\Program Files\\Common Files\\VST3\\Thallbyssal.vst3" : "";

  const artifacts = [
    {
      name: "Visual standalone app",
      path: visualStandalonePath,
      kind: "file",
      required: false,
      ...(await pathInfo(visualStandalonePath))
    },
    {
      name: "Plugin standalone shell",
      path: productStandalonePath,
      kind: "file",
      required: true,
      ...(await pathInfo(productStandalonePath))
    },
    {
      name: "VST3 bundle",
      path: vst3BundlePath,
      kind: "directory",
      required: true,
      ...(await pathInfo(vst3BundlePath))
    },
    {
      name: "VST3 Windows binary",
      path: vst3BinaryPath,
      kind: "file",
      required: true,
      ...(await pathInfo(vst3BinaryPath))
    }
  ];

  if (installedVst3Path) {
    artifacts.push({
      name: "Installed VST3 bundle",
      path: installedVst3Path,
      kind: "directory",
      required: true,
      ...(await pathInfo(installedVst3Path))
    });
  }

  for (const artifact of artifacts) {
    if (!artifact.exists) {
      const message = `Missing ${artifact.required ? "required" : "optional"} ${artifact.name}: ${artifact.path}`;
      if (artifact.required) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
      continue;
    }

    if (artifact.kind === "file" && !artifact.isFile) {
      errors.push(`${artifact.name} exists but is not a file: ${artifact.path}`);
    }

    if (artifact.kind === "directory" && !artifact.isDirectory) {
      errors.push(`${artifact.name} exists but is not a directory: ${artifact.path}`);
    }
  }

  const betaManifestPath = path.join(betaPackRoot, "BETA_PACK_MANIFEST.json");
  const betaManifestInfo = await pathInfo(betaManifestPath);

  if (!betaManifestInfo.exists) {
    warnings.push("Beta pack manifest does not exist yet. Run npm run lab:beta-pack before private beta packaging checks.");
  } else {
    const manifest = JSON.parse(await fs.readFile(betaManifestPath, "utf8"));
    if (manifest.containsPluginBinary !== false) {
      errors.push("Beta pack placeholder must not claim it contains plugin binaries before founder approval.");
    }
    if (manifest.containsTelemetry !== false) {
      errors.push("Beta pack placeholder must not contain telemetry.");
    }
    if (manifest.containsCheckoutOrLicensing !== false) {
      errors.push("Beta pack placeholder must not contain checkout or licensing.");
    }
  }

  const betaFiles = await walk(betaPackRoot);
  const forbiddenBetaFiles = betaFiles.filter((filePath) => forbiddenBetaExtensions.has(path.extname(filePath).toLowerCase()));
  if (forbiddenBetaFiles.length > 0) {
    errors.push(`Beta pack placeholder contains binary/release files: ${forbiddenBetaFiles.map((file) => path.relative(betaPackRoot, file)).join(", ")}`);
  }

  const claimHits = [];
  for (const filePath of betaFiles) {
    const text = await readTextIfPossible(filePath);
    if (!text) {
      continue;
    }

    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) {
        claimHits.push(`${path.relative(betaPackRoot, filePath)} matched ${pattern}`);
      }
    }
  }

  const allowedDisclosureMatches = claimHits.filter((hit) =>
    /BETA_PACK_MANIFEST\.json|KNOWN_ISSUES\.md|README_BETA\.md|BETA_TESTER_PACKET\.md|RELEASE_SAFETY_CHECKLIST\.md|BETA_FEEDBACK_QUESTIONS\.md|BETA_LISTENING_INSTRUCTIONS\.md|PRIVATE_BETA_LISTENING_PAGE\.md|PLAYABLE_BETA_SMOKE_TEST\.md/i.test(hit)
  );
  const riskyClaimHits = claimHits.filter((hit) => !allowedDisclosureMatches.includes(hit));
  if (riskyClaimHits.length > 0) {
    errors.push(`Potential forbidden public claim in beta pack: ${riskyClaimHits.join("; ")}`);
  }

  if (allowedDisclosureMatches.length > 0) {
    warnings.push(`Beta pack includes safety disclosures mentioning restricted systems: ${allowedDisclosureMatches.length} allowed disclosure match(es).`);
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    buildDir: defaultBuildDir,
    versions: {
      packageJson: packageVersion,
      nativeCmake: cmake.version
    },
    betaPackRoot,
    artifacts,
    errors,
    warnings,
    summary: {
      artifacts: artifacts.length,
      errors: errors.length,
      warnings: warnings.length
    }
  };

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtmlReport(report), "utf8");

  console.log(`AMP_SIM_LAB release artifact report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB release artifact HTML written: ${htmlPath}`);
  console.log(`Artifacts checked: ${report.summary.artifacts}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
