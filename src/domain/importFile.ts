const supportedImportExtensions = new Set([
  ".wav",
  ".mp3",
  ".flac",
  ".aif",
  ".aiff",
  ".ogg",
  ".m4a",
  ".mp4",
  ".mov",
  ".webm"
]);

const audioImportExtensions = new Set([".wav", ".mp3", ".flac", ".aif", ".aiff", ".ogg", ".m4a"]);
const videoImportExtensions = new Set([".mp4", ".mov", ".webm"]);

export type ImportMediaKind = "audio" | "video" | "unknown";

export function isSupportedImportFileName(fileName: string): boolean {
  if (!fileName.trim() || fileName.includes("/") || fileName.includes("\\")) {
    return false;
  }

  return supportedImportExtensions.has(extensionOf(fileName).toLowerCase());
}

export function getImportMediaKind(fileName: string): ImportMediaKind {
  const extension = extensionOf(fileName).toLowerCase();

  if (audioImportExtensions.has(extension)) {
    return "audio";
  }

  if (videoImportExtensions.has(extension)) {
    return "video";
  }

  return "unknown";
}

export function createImportedFileUrl(fileName: string): string {
  if (!isSupportedImportFileName(fileName)) {
    return "";
  }

  return `/api/imported-file/${encodeURIComponent(fileName)}`;
}

export function getImportedFileNameFromPath(filePath: string): string {
  const segments = filePath.split(/[\\/]+/).filter(Boolean);
  const importsIndex = segments.lastIndexOf("imports");
  const fileName = segments[segments.length - 1] ?? "";

  if (importsIndex === -1 || importsIndex === segments.length - 1 || !isSupportedImportFileName(fileName)) {
    return "";
  }

  return fileName;
}

export function createImportFileName(fileName: string, timestamp = Date.now(), copyIndex = 0): string {
  const extension = extensionOf(fileName).toLowerCase();
  const nameWithoutExtension = fileName.slice(0, fileName.length - extension.length);
  const safeName = nameWithoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = copyIndex > 0 ? `-${Math.floor(copyIndex) + 1}` : "";

  return `${timestamp}-${safeName || "source"}${suffix}${extension}`;
}

function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf(".");

  return index === -1 ? "" : fileName.slice(index);
}
