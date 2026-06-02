import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { labRoot, reportsDir } from "./lab-paths.mjs";

const presetDir = path.join(labRoot, "presets");
const reportPath = path.join(reportsDir, "preset-validation.json");
const htmlPath = path.join(reportsDir, "preset-validation.html");

const requiredFields = [
  "preset_id",
  "name",
  "category",
  "gain_level",
  "genre_tags",
  "pickup_recommendation",
  "input_gain",
  "output_gain",
  "amp_section_settings",
  "cab_or_ir_reference",
  "effects_settings",
  "cpu_cost_estimate",
  "loudness_target",
  "author",
  "version",
  "notes"
];

const validCategories = new Set(["rhythm", "lead", "clean", "ambient", "fx", "bass", "utility"]);
const validGainLevels = new Set(["clean", "crunch", "mid", "high", "extreme"]);
const validCpuCosts = new Set(["low", "medium", "high", "unknown"]);
const forbiddenTerms = [
  "5150",
  "6505",
  "axe-fx",
  "buster odeholm",
  "diezel",
  "engl",
  "fortin",
  "gojira",
  "graphene",
  "helix",
  "kemper",
  "mesa",
  "nameless",
  "neural",
  "omega",
  "peavey",
  "polychrome",
  "soldano",
  "thall amp",
  "vildhjarta"
];
const suspiciousClaimTerms = [
  "album",
  "artist",
  "brand",
  "clone",
  "cover",
  "emulation",
  "inspired by",
  "modelled",
  "modeled",
  "official",
  "signature",
  "song",
  "sounds like",
  "trademark"
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function includesForbiddenTerm(value) {
  const normalized = String(value).toLowerCase();
  return forbiddenTerms.find((term) => normalized.includes(term));
}

function includesSuspiciousClaimTerm(value) {
  const normalized = String(value).toLowerCase();
  return suspiciousClaimTerms.find((term) => normalized.includes(term));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeName(value) {
  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
}

function sourceRef(context) {
  return `${context.sourceFile}#${context.sourceIndex}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validatePreset(preset, context) {
  const errors = [];
  const warnings = [];

  if (!isObject(preset)) {
    return {
      errors: ["Preset entry is not an object."],
      warnings
    };
  }

  for (const field of requiredFields) {
    if (!(field in preset)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (!isNonEmptyString(preset.preset_id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(preset.preset_id)) {
    errors.push("preset_id must be a non-empty kebab-case string.");
  }

  if (!isNonEmptyString(preset.name)) {
    errors.push("name must be a non-empty string.");
  }

  if (!validCategories.has(preset.category)) {
    errors.push(`category must be one of: ${Array.from(validCategories).join(", ")}`);
    if (isNonEmptyString(preset.category)) {
      context.invalidCategories.add(preset.category);
    }
  }

  if (!validGainLevels.has(preset.gain_level)) {
    errors.push(`gain_level must be one of: ${Array.from(validGainLevels).join(", ")}`);
  }

  if (
    !Array.isArray(preset.genre_tags) ||
    preset.genre_tags.length === 0 ||
    preset.genre_tags.some((tag) => !isNonEmptyString(tag))
  ) {
    errors.push("genre_tags must include at least one non-empty string.");
  }

  if (!isNonEmptyString(preset.pickup_recommendation)) {
    errors.push("pickup_recommendation must be a non-empty string.");
  }

  if (typeof preset.input_gain !== "number" || !Number.isFinite(preset.input_gain)) {
    errors.push("input_gain must be a finite number.");
  }

  if (typeof preset.output_gain !== "number" || !Number.isFinite(preset.output_gain)) {
    errors.push("output_gain must be a finite number.");
  }

  if (!isObject(preset.amp_section_settings)) {
    errors.push("amp_section_settings must be an object.");
  }

  if (!isObject(preset.effects_settings)) {
    errors.push("effects_settings must be an object.");
  }

  if (!isNonEmptyString(preset.cab_or_ir_reference)) {
    errors.push("cab_or_ir_reference must be a non-empty string.");
  }

  if (!validCpuCosts.has(preset.cpu_cost_estimate)) {
    errors.push(`cpu_cost_estimate must be one of: ${Array.from(validCpuCosts).join(", ")}`);
  }

  if (!isObject(preset.loudness_target)) {
    errors.push("loudness_target must be an object.");
  } else {
    if (typeof preset.loudness_target.peak_dbfs_max !== "number" || !Number.isFinite(preset.loudness_target.peak_dbfs_max)) {
      errors.push("loudness_target.peak_dbfs_max must be a finite number.");
    }

    const range = preset.loudness_target.rms_dbfs_range;
    if (!Array.isArray(range) || range.length !== 2 || range.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
      errors.push("loudness_target.rms_dbfs_range must be a two-finite-number array.");
    } else if (range[0] >= range[1]) {
      errors.push("loudness_target.rms_dbfs_range must be ordered from quieter to louder.");
    }
  }

  if (!isNonEmptyString(preset.author)) {
    errors.push("author must be a non-empty string.");
  }

  if (!isNonEmptyString(preset.version)) {
    errors.push("version must be a non-empty string.");
  }

  if (!isNonEmptyString(preset.notes)) {
    errors.push("notes must be a non-empty string.");
  }

  const termFields = [
    preset.preset_id,
    preset.name,
    preset.category,
    preset.pickup_recommendation,
    preset.cab_or_ir_reference,
    preset.author,
    preset.notes,
    ...(Array.isArray(preset.genre_tags) ? preset.genre_tags : [])
  ];

  for (const fieldValue of termFields) {
    const term = includesForbiddenTerm(fieldValue);
    if (term) {
      errors.push(`Forbidden brand/artist/model reference "${term}" found in preset metadata.`);
      break;
    }
  }

  const claimFields = [
    ["preset_id", preset.preset_id],
    ["name", preset.name],
    ["genre_tags", Array.isArray(preset.genre_tags) ? preset.genre_tags.join(" ") : ""],
    ["cab_or_ir_reference", preset.cab_or_ir_reference],
    ["notes", preset.notes]
  ];

  for (const [fieldName, fieldValue] of claimFields) {
    const term = includesSuspiciousClaimTerm(fieldValue);
    if (term) {
      warnings.push(`Suspicious claim language "${term}" found in ${fieldName}; review for brand, artist, song, album, or trademark-like claims.`);
      break;
    }
  }

  if (isNonEmptyString(preset.preset_id) && context.ids.has(preset.preset_id)) {
    context.duplicatePresetIds.add(preset.preset_id);
    errors.push(`Duplicate preset_id "${preset.preset_id}" also used by ${context.ids.get(preset.preset_id)}.`);
  }

  const normalizedName = normalizeName(preset.name);
  if (isNonEmptyString(preset.name) && context.names.has(normalizedName)) {
    context.duplicatePresetNames.add(normalizedName);
    errors.push(`Duplicate preset name "${preset.name}" also used by ${context.names.get(normalizedName)}.`);
  }

  if (preset.cab_or_ir_reference && typeof preset.cab_or_ir_reference === "string") {
    const reference = preset.cab_or_ir_reference.toLowerCase();
    const isFactory = reference.startsWith("factory-");
    const isEmpty = reference.trim().length === 0;
    if (!isFactory && !isEmpty) {
      warnings.push("Non-factory cab/IR reference must be founder-owned or explicitly licensed.");
    }
  }

  if (preset.notes && !String(preset.notes).toLowerCase().includes("not approved for public release")) {
    warnings.push("Placeholder presets should explicitly say they are not approved for public release.");
  }

  return { errors, warnings };
}

async function readPresetFiles() {
  const entries = await fs.readdir(presetDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(presetDir, entry.name))
    .sort();

  const presets = [];
  const fileErrors = [];

  for (const filePath of files) {
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
      const entriesInFile = Array.isArray(parsed) ? parsed : [parsed];
      entriesInFile.forEach((preset, index) => {
        presets.push({
          sourceFile: path.basename(filePath),
          sourceIndex: index,
          preset
        });
      });
    } catch (error) {
      fileErrors.push({
        sourceFile: path.basename(filePath),
        error: error instanceof Error ? error.message : "Unknown parse error"
      });
    }
  }

  return { files, presets, fileErrors };
}

export function createHtmlReport(report) {
  const invalidCategories = report.summary.invalidCategories.length > 0 ? report.summary.invalidCategories.join(", ") : "none";
  const rows = report.presets
    .map((entry) => `<tr>
  <td>${escapeHtml(entry.preset_id || "(missing)")}</td>
  <td>${escapeHtml(entry.name || "(missing)")}</td>
  <td>${escapeHtml(entry.category || "(missing)")}</td>
  <td>${escapeHtml(entry.sourceFile)}#${entry.sourceIndex}</td>
  <td>${entry.errors.length}</td>
  <td>${entry.warnings.length}</td>
  <td>${[...entry.errors, ...entry.warnings].map(escapeHtml).join("<br>") || "OK"}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Preset Validation</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    .ok { color: #86efac; }
    .bad { color: #fca5a5; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Preset Validation</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p class="${report.summary.errors === 0 ? "ok" : "bad"}">Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings}</p>
  <ul>
    <li>Files scanned: ${report.summary.files}</li>
    <li>Presets scanned: ${report.summary.presets}</li>
    <li>File parse errors: ${report.summary.fileErrors}</li>
    <li>Duplicate preset IDs: ${report.summary.duplicatePresetIds}</li>
    <li>Duplicate preset names: ${report.summary.duplicatePresetNames}</li>
    <li>Invalid categories: ${escapeHtml(invalidCategories)}</li>
    <li>Suspicious claim warnings: ${report.summary.suspiciousClaimWarnings}</li>
  </ul>
  <table>
    <thead>
      <tr>
        <th>Preset ID</th>
        <th>Name</th>
        <th>Category</th>
        <th>Source</th>
        <th>Errors</th>
        <th>Warnings</th>
        <th>Messages</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7">No presets found.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

export function buildPresetValidationReport({ files, presets, fileErrors, generatedAt = new Date().toISOString(), presetDir: scannedPresetDir = presetDir }) {
  const context = {
    ids: new Map(),
    names: new Map(),
    duplicatePresetIds: new Set(),
    duplicatePresetNames: new Set(),
    invalidCategories: new Set(),
    sourceFile: "",
    sourceIndex: 0
  };

  const validatedPresets = presets.map((entry) => {
    context.sourceFile = entry.sourceFile;
    context.sourceIndex = entry.sourceIndex;
    const validation = validatePreset(entry.preset, context);

    if (isObject(entry.preset)) {
      if (isNonEmptyString(entry.preset.preset_id) && !context.ids.has(entry.preset.preset_id)) {
        context.ids.set(entry.preset.preset_id, sourceRef(entry));
      }

      const normalizedName = normalizeName(entry.preset.name);
      if (isNonEmptyString(entry.preset.name) && !context.names.has(normalizedName)) {
        context.names.set(normalizedName, sourceRef(entry));
      }
    }

    return {
      sourceFile: entry.sourceFile,
      sourceIndex: entry.sourceIndex,
      preset_id: isObject(entry.preset) ? entry.preset.preset_id : null,
      name: isObject(entry.preset) ? entry.preset.name : null,
      category: isObject(entry.preset) ? entry.preset.category : null,
      errors: validation.errors,
      warnings: validation.warnings
    };
  });

  const suspiciousClaimWarnings = validatedPresets.reduce(
    (total, preset) => total + preset.warnings.filter((warning) => warning.includes("Suspicious claim language")).length,
    0
  );

  return {
    schemaVersion: 1,
    generatedAt,
    presetDir: scannedPresetDir,
    files: files.map((file) => path.basename(file)),
    fileErrors,
    presets: validatedPresets,
    summary: {
      files: files.length,
      presets: validatedPresets.length,
      fileErrors: fileErrors.length,
      errors:
        fileErrors.length +
        validatedPresets.reduce((total, preset) => total + preset.errors.length, 0),
      warnings: validatedPresets.reduce((total, preset) => total + preset.warnings.length, 0),
      presetsWithErrors: validatedPresets.filter((preset) => preset.errors.length > 0).length,
      presetsWithWarnings: validatedPresets.filter((preset) => preset.warnings.length > 0).length,
      duplicatePresetIds: context.duplicatePresetIds.size,
      duplicatePresetNames: context.duplicatePresetNames.size,
      invalidCategories: Array.from(context.invalidCategories).sort(),
      suspiciousClaimWarnings
    }
  };
}

async function main() {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  const { files, presets, fileErrors } = await readPresetFiles();
  const report = buildPresetValidationReport({ files, presets, fileErrors });

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, createHtmlReport(report), "utf8");

  console.log(`AMP_SIM_LAB preset validation report written: ${reportPath}`);
  console.log(`AMP_SIM_LAB preset validation HTML written: ${htmlPath}`);
  console.log(`Presets scanned: ${report.summary.presets}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  if (report.summary.errors > 0) {
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
