import fs from "node:fs/promises";
import fsSync from "node:fs";
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
const localIrExtensions = new Set([".wav", ".aif", ".aiff", ".flac"]);
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
  "as heard on",
  "as used by",
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
  "style of",
  "tone of",
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

function normalizePresetId(value) {
  return String(value).trim().toLowerCase();
}

function sourceRef(context) {
  return `${context.sourceFile}#${context.sourceIndex}`;
}

function collectStringFields(value, pathName = "preset", fields = []) {
  if (typeof value === "string") {
    fields.push([pathName, value]);
    return fields;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectStringFields(entry, `${pathName}[${index}]`, fields);
    });
    return fields;
  }

  if (isObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      collectStringFields(entry, `${pathName}.${key}`, fields);
    }
  }

  return fields;
}

function looksLikeUrl(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value) && !value.toLowerCase().startsWith("local:");
}

function isLikelyLocalReference(value) {
  const trimmed = value.trim();

  return (
    trimmed.toLowerCase().startsWith("local:") ||
    trimmed.startsWith(".") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("\\") ||
    /^[a-z]:[\\/]/i.test(trimmed) ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    localIrExtensions.has(path.extname(trimmed).toLowerCase())
  );
}

function resolveLocalReference(value, context) {
  const rawReference = value.trim().replace(/^local:/i, "").trim();
  const sourceDir = context.sourcePath ? path.dirname(context.sourcePath) : context.presetDir;

  return path.isAbsolute(rawReference)
    ? path.normalize(rawReference)
    : path.resolve(sourceDir, rawReference);
}

function validateCabOrIrReference(reference, context, errors, warnings) {
  if (!isNonEmptyString(reference)) {
    errors.push("cab_or_ir_reference must be a non-empty string.");
    return;
  }

  const trimmed = reference.trim();
  const lowerReference = trimmed.toLowerCase();

  if (looksLikeUrl(trimmed)) {
    errors.push("cab_or_ir_reference must not be a URL; use a factory id or an existing local founder-owned IR/cab file.");
    return;
  }

  if (lowerReference.startsWith("factory-")) {
    return;
  }

  if (!isLikelyLocalReference(trimmed)) {
    warnings.push("Non-factory cab/IR reference must be founder-owned, explicitly licensed, and manually reviewed before release.");
    return;
  }

  const resolvedPath = resolveLocalReference(trimmed, context);
  const extension = path.extname(resolvedPath).toLowerCase();

  if (!localIrExtensions.has(extension)) {
    errors.push(`Local cab/IR reference "${trimmed}" must use one of: ${Array.from(localIrExtensions).join(", ")}`);
    context.brokenCabOrIrReferences.add(trimmed);
    return;
  }

  let stats;
  try {
    stats = fsSync.statSync(resolvedPath);
  } catch {
    errors.push(`Local cab/IR reference "${trimmed}" does not exist at ${resolvedPath}.`);
    context.brokenCabOrIrReferences.add(trimmed);
    return;
  }

  if (!stats.isFile()) {
    errors.push(`Local cab/IR reference "${trimmed}" is not a file.`);
    context.brokenCabOrIrReferences.add(trimmed);
    return;
  }

  if (stats.size === 0) {
    errors.push(`Local cab/IR reference "${trimmed}" is empty.`);
    context.brokenCabOrIrReferences.add(trimmed);
    return;
  }

  warnings.push("Local cab/IR reference exists but must be founder-owned, explicitly licensed, and manually reviewed before release.");
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
    if (isNonEmptyString(preset.gain_level)) {
      context.invalidGainLevels.add(preset.gain_level);
    }
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

  validateCabOrIrReference(preset.cab_or_ir_reference, context, errors, warnings);

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
    context.missingAuthorOrVersion.add(sourceRef(context));
  }

  if (!isNonEmptyString(preset.version)) {
    errors.push("version must be a non-empty string.");
    context.missingAuthorOrVersion.add(sourceRef(context));
  } else if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(preset.version.trim())) {
    warnings.push("Release-readiness: version should use semver-like MAJOR.MINOR.PATCH notation.");
    context.releaseReadinessWarnings.add(`${sourceRef(context)}:version-format`);
  }

  if (!isNonEmptyString(preset.notes)) {
    errors.push("notes must be a non-empty string.");
  }

  const stringFields = collectStringFields(preset);

  for (const [, fieldValue] of stringFields) {
    const term = includesForbiddenTerm(fieldValue);
    if (term) {
      errors.push(`Forbidden brand/artist/model reference "${term}" found in preset metadata.`);
      break;
    }
  }

  for (const [fieldName, fieldValue] of stringFields) {
    const term = includesSuspiciousClaimTerm(fieldValue);
    if (term) {
      warnings.push(`Suspicious claim language "${term}" found in ${fieldName}; review for brand, artist, song, album, or trademark-like claims.`);
      context.suspiciousClaimWarnings.add(sourceRef(context));
      break;
    }
  }

  const normalizedPresetId = normalizePresetId(preset.preset_id);
  if (isNonEmptyString(preset.preset_id) && context.ids.has(normalizedPresetId)) {
    context.duplicatePresetIds.add(normalizedPresetId);
    errors.push(`Duplicate preset_id "${preset.preset_id}" also used by ${context.ids.get(normalizedPresetId)}.`);
  }

  const normalizedName = normalizeName(preset.name);
  if (isNonEmptyString(preset.name) && context.names.has(normalizedName)) {
    context.duplicatePresetNames.add(normalizedName);
    errors.push(`Duplicate preset name "${preset.name}" also used by ${context.names.get(normalizedName)}.`);
  }

  if (preset.notes && !String(preset.notes).toLowerCase().includes("not approved for public release")) {
    warnings.push("Release-readiness: preset notes should explicitly say the preset is not approved for public release.");
    context.releaseReadinessWarnings.add(`${sourceRef(context)}:missing-public-release-disclaimer`);
  } else if (preset.notes) {
    warnings.push("Release-readiness: preset is marked not approved for public release and must not ship as a final tone preset.");
    context.releaseReadinessWarnings.add(`${sourceRef(context)}:not-public-release-approved`);
  }

  if (isNonEmptyString(preset.author) && preset.author.trim().toLowerCase() !== "founder") {
    warnings.push("Release-readiness: non-Founder author should be reviewed for approval and attribution before release.");
    context.releaseReadinessWarnings.add(`${sourceRef(context)}:author-review`);
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
          sourcePath: filePath,
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
  const invalidGainLevels = report.summary.invalidGainLevels.length > 0 ? report.summary.invalidGainLevels.join(", ") : "none";
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
    <li>Broken local cab/IR references: ${report.summary.brokenCabOrIrReferences}</li>
    <li>Invalid categories: ${escapeHtml(invalidCategories)}</li>
    <li>Invalid gain levels: ${escapeHtml(invalidGainLevels)}</li>
    <li>Missing author/version: ${report.summary.missingAuthorOrVersion}</li>
    <li>Release-readiness warnings: ${report.summary.releaseReadinessWarnings}</li>
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
    brokenCabOrIrReferences: new Set(),
    invalidCategories: new Set(),
    invalidGainLevels: new Set(),
    missingAuthorOrVersion: new Set(),
    releaseReadinessWarnings: new Set(),
    suspiciousClaimWarnings: new Set(),
    sourceFile: "",
    sourcePath: "",
    presetDir: scannedPresetDir,
    sourceIndex: 0
  };

  const validatedPresets = presets.map((entry) => {
    context.sourceFile = entry.sourceFile;
    context.sourcePath = entry.sourcePath ?? path.join(scannedPresetDir, entry.sourceFile);
    context.sourceIndex = entry.sourceIndex;
    const validation = validatePreset(entry.preset, context);

    if (isObject(entry.preset)) {
      const normalizedPresetId = normalizePresetId(entry.preset.preset_id);
      if (isNonEmptyString(entry.preset.preset_id) && !context.ids.has(normalizedPresetId)) {
        context.ids.set(normalizedPresetId, sourceRef(entry));
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

  const suspiciousClaimWarnings = context.suspiciousClaimWarnings.size;

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
      brokenCabOrIrReferences: context.brokenCabOrIrReferences.size,
      invalidCategories: Array.from(context.invalidCategories).sort(),
      invalidGainLevels: Array.from(context.invalidGainLevels).sort(),
      missingAuthorOrVersion: context.missingAuthorOrVersion.size,
      releaseReadinessWarnings: context.releaseReadinessWarnings.size,
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
