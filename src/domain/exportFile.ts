export type ExportFileExtension = "lua" | "json";

export function createExportFileName(templateName: string, extension: ExportFileExtension): string {
  const baseName = templateName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "guitar-workflow-template"}.${extension}`;
}

export function isSupportedExportFileName(fileName: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.(lua|json)$/.test(fileName);
}

export function isSupportedBundleDirectoryName(directoryName: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(directoryName);
}

export function isSupportedBundleFileName(fileName: string): boolean {
  return /^(source-manifest\.md|songwriter-ideas\.md|README-REAPER-STEPS\.md|plugin-manifest\.json|sources\.json|rhythm-sketch\.json|drum-guide\.mid|bass-guide\.mid|[a-z0-9][a-z0-9-]*\.(lua|json|wav))$/.test(
    fileName
  );
}
