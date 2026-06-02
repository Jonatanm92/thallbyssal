import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatedRoot, reportsDir } from "./lab-paths.mjs";

const __filename = fileURLToPath(import.meta.url);
const assetRoot = path.join(generatedRoot, "founder-assets");

const assetTypes = new Map([
  [".wav", "ir"],
  [".aif", "ir"],
  [".aiff", "ir"],
  [".flac", "ir"],
  [".ir", "ir"],
  [".nam", "nam_model"],
  [".png", "screenshot"],
  [".jpg", "screenshot"],
  [".jpeg", "screenshot"],
  [".webp", "screenshot"],
  [".pxe", "preset_reference"],
  [".syx", "preset_reference"],
  [".txt", "note"],
  [".md", "note"]
]);

export function classifyFounderAsset(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  const assetType = assetTypes.get(extension) ?? "unsupported";

  return {
    fileName,
    extension,
    assetType,
    supportedForLabIntake: assetType !== "unsupported",
    publicReleaseAllowed: false,
    licenseStatus: "unknown"
  };
}

async function walkFiles(root) {
  const files = [];

  async function walk(directory) {
    let entries = [];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        files.push({
          relativePath: path.relative(root, fullPath),
          sizeBytes: stats.size
        });
      }
    }
  }

  await walk(root);
  return files;
}

export function createFounderAssetReport({ generatedAt = new Date().toISOString(), assetRoot: root = assetRoot, files = [] } = {}) {
  const assets = files.map((file) => {
    const classification = classifyFounderAsset(path.basename(file.relativePath));
    return {
      ...classification,
      relativePath: file.relativePath,
      sizeBytes: file.sizeBytes,
      note: classification.assetType === "nam_model"
        ? "Private reference/model asset only. Do not ship or load in product without explicit approval and license review."
        : classification.assetType === "ir"
          ? "Private IR/reference asset only until origin/license is approved."
          : "Private lab asset."
    };
  });

  return {
    schemaVersion: 1,
    generatedAt,
    assetRoot: root,
    purpose: "Founder-owned/private NAM, IR, screenshot, and note intake manifest for lab/reference use only.",
    safety: {
      localOnly: true,
      publicReleaseApproved: false,
      dspAutoLoadAllowed: false,
      productBundlingAllowed: false
    },
    summary: {
      totalFiles: assets.length,
      irFiles: assets.filter((asset) => asset.assetType === "ir").length,
      namFiles: assets.filter((asset) => asset.assetType === "nam_model").length,
      screenshotFiles: assets.filter((asset) => asset.assetType === "screenshot").length,
      noteFiles: assets.filter((asset) => asset.assetType === "note").length,
      presetReferenceFiles: assets.filter((asset) => asset.assetType === "preset_reference").length,
      unsupportedFiles: assets.filter((asset) => asset.assetType === "unsupported").length,
      publicReleaseAllowedFiles: assets.filter((asset) => asset.publicReleaseAllowed).length
    },
    assets
  };
}

function renderHtml(report) {
  const rows = report.assets.map((asset) => `<tr>
  <td>${asset.relativePath}</td>
  <td>${asset.assetType}</td>
  <td>${asset.sizeBytes}</td>
  <td>${asset.supportedForLabIntake ? "yes" : "no"}</td>
  <td>${asset.publicReleaseAllowed ? "yes" : "no"}</td>
  <td>${asset.note}</td>
</tr>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Founder Asset Intake</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; max-width: 1200px; }
    p { color: #aab7c4; }
    table { border-collapse: collapse; width: 100%; margin-top: 22px; }
    th, td { border: 1px solid #334155; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
  </style>
</head>
<body>
  <h1>Founder Asset Intake</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Private reference assets only. This report never approves public release, bundling, or automatic DSP loading.</p>
  <p>IR files: ${report.summary.irFiles} | NAM files: ${report.summary.namFiles} | Unsupported: ${report.summary.unsupportedFiles}</p>
  <table>
    <thead>
      <tr><th>File</th><th>Type</th><th>Bytes</th><th>Lab Intake</th><th>Public Release</th><th>Note</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6">No founder assets found yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

export async function writeFounderAssetReport(root = assetRoot) {
  await fs.mkdir(path.join(root, "irs"), { recursive: true });
  await fs.mkdir(path.join(root, "nam-models"), { recursive: true });
  await fs.mkdir(path.join(root, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(root, "notes"), { recursive: true });

  const report = createFounderAssetReport({
    assetRoot: root,
    files: await walkFiles(root)
  });
  const paths = {
    json: path.join(reportsDir, "founder-assets.json"),
    html: path.join(reportsDir, "founder-assets.html")
  };

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(paths.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(paths.html, renderHtml(report), "utf8");

  return { report, paths };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const result = await writeFounderAssetReport();
    console.log(`Founder asset report written: ${result.paths.html}`);
    console.log(`IR files: ${result.report.summary.irFiles}`);
    console.log(`NAM files: ${result.report.summary.namFiles}`);
    console.log(`Unsupported files: ${result.report.summary.unsupportedFiles}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
