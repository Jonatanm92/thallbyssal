import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { cwd, env, platform } from "node:process";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  isSupportedBundleDirectoryName,
  isSupportedBundleFileName,
  isSupportedExportFileName
} from "./src/domain/exportFile";
import { createImportFileName, isSupportedImportFileName } from "./src/domain/importFile";

export default defineConfig({
  plugins: [react(), localFilePlugin()],
  build: {
    outDir:
      env.GUITAR_TOOLKIT_WEB_DIST_DIR ||
      (platform === "win32" ? "D:\\CodexBuilds\\guitar-workflow-toolkit-web-dist" : "dist"),
    emptyOutDir: true
  },
  test: {
    include: ["src/**/*.test.ts"],
    globals: true,
    environment: "node"
  }
});

function localFilePlugin(): Plugin {
  return {
    name: "guitar-workflow-local-files",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/import-file", async (request, response, next) => {
        if (request.method !== "POST") {
          next();
          return;
        }

        try {
          const sourceFileName = decodeURIComponent(String(request.headers["x-file-name"] ?? ""));

          if (!isSupportedImportFileName(sourceFileName)) {
            sendJson(response, 400, { error: "Unsupported import file." });
            return;
          }

          const importDirectory = localDataDirectory("imports");
          const body = await readBinaryBody(request);
          const { importFileName, importPath } = await writeUniqueImportFile(importDirectory, sourceFileName, body);

          sendJson(response, 200, { path: importPath, fileName: importFileName });
        } catch (error) {
          sendJson(response, 500, {
            error: error instanceof Error ? error.message : "Could not import file."
          });
        }
      });

      server.middlewares.use("/api/imported-file", async (request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") {
          next();
          return;
        }

        try {
          const importFileName = decodeImportedFileName(request.url ?? "");

          if (!isSupportedImportFileName(importFileName)) {
            sendJson(response, 404, { error: "Imported file not found." });
            return;
          }

          const importDirectory = localDataDirectory("imports");
          const importPath = resolve(importDirectory, importFileName);

          if (!importPath.startsWith(`${importDirectory}${sep}`)) {
            sendJson(response, 400, { error: "Unsupported imported file path." });
            return;
          }

          await sendImportedFile(request, response, importPath, importFileName);
        } catch (error) {
          sendJson(response, isNotFoundError(error) ? 404 : 500, {
            error: error instanceof Error ? error.message : "Could not read imported file."
          });
        }
      });

      server.middlewares.use("/api/export-file", async (request, response, next) => {
        if (request.method !== "POST") {
          next();
          return;
        }

        try {
          const body = await readJsonBody(request);

          if (!isExportRequest(body) || !isSupportedExportFileName(body.fileName)) {
            sendJson(response, 400, { error: "Unsupported export payload." });
            return;
          }

          const exportDirectory = localDataDirectory("exports");
          const exportPath = resolve(exportDirectory, body.fileName);

          if (!exportPath.startsWith(`${exportDirectory}${sep}`)) {
            sendJson(response, 400, { error: "Unsupported export path." });
            return;
          }

          await mkdir(exportDirectory, { recursive: true });
          await writeFile(exportPath, body.text, "utf8");
          sendJson(response, 200, { path: exportPath });
        } catch (error) {
          sendJson(response, 500, {
            error: error instanceof Error ? error.message : "Could not save export."
          });
        }
      });

      server.middlewares.use("/api/export-bundle", async (request, response, next) => {
        if (request.method !== "POST") {
          next();
          return;
        }

        try {
          const body = await readJsonBody(request);

          if (!isBundleExportRequest(body)) {
            sendJson(response, 400, { error: "Unsupported bundle export payload." });
            return;
          }

          const exportDirectory = localDataDirectory("exports");
          const bundleDirectory = resolve(exportDirectory, body.directoryName);

          if (!bundleDirectory.startsWith(`${exportDirectory}${sep}`)) {
            sendJson(response, 400, { error: "Unsupported bundle export path." });
            return;
          }

          await mkdir(bundleDirectory, { recursive: true });

          for (const file of body.files) {
            const filePath = resolve(bundleDirectory, file.fileName);

            if (!filePath.startsWith(`${bundleDirectory}${sep}`)) {
              sendJson(response, 400, { error: "Unsupported bundle file path." });
              return;
            }

            if (file.encoding === "base64") {
              await writeFile(filePath, Buffer.from(file.base64 ?? "", "base64"));
            } else {
              await writeFile(filePath, file.text ?? "", "utf8");
            }
          }

          sendJson(response, 200, {
            path: bundleDirectory,
            files: body.files.map((file) => file.fileName)
          });
        } catch (error) {
          sendJson(response, 500, {
            error: error instanceof Error ? error.message : "Could not save export bundle."
          });
        }
      });
    }
  };
}

function localDataRoot(): string {
  return (
    env.GUITAR_TOOLKIT_DATA_DIR ||
    (platform === "win32" ? "D:\\CodexBuilds\\guitar-workflow-toolkit-data" : resolve(cwd(), ".local-data"))
  );
}

function localDataDirectory(directoryName: "imports" | "exports"): string {
  return resolve(localDataRoot(), directoryName);
}

interface ExportRequest {
  fileName: string;
  text: string;
}

interface BundleExportRequest {
  directoryName: string;
  files: Array<{
    fileName: string;
    text?: string;
    base64?: string;
    encoding?: "utf8" | "base64";
  }>;
}

function isExportRequest(value: unknown): value is ExportRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ExportRequest).fileName === "string" &&
    typeof (value as ExportRequest).text === "string"
  );
}

function isBundleExportRequest(value: unknown): value is BundleExportRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as BundleExportRequest).directoryName === "string" &&
    isSupportedBundleDirectoryName((value as BundleExportRequest).directoryName) &&
    Array.isArray((value as BundleExportRequest).files) &&
    (value as BundleExportRequest).files.length > 0 &&
    (value as BundleExportRequest).files.length <= 10 &&
    (value as BundleExportRequest).files.every(
      (file) =>
        typeof file === "object" &&
        file !== null &&
        typeof file.fileName === "string" &&
        isSupportedBundleFileName(file.fileName) &&
        ((typeof file.text === "string" && (file.encoding === undefined || file.encoding === "utf8")) ||
          (typeof file.base64 === "string" && file.encoding === "base64"))
    )
  );
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return JSON.parse((await readBinaryBody(request)).toString("utf8"));
}

async function readBinaryBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

async function writeUniqueImportFile(
  importDirectory: string,
  sourceFileName: string,
  body: Buffer
): Promise<{ importFileName: string; importPath: string }> {
  const timestamp = Date.now();

  await mkdir(importDirectory, { recursive: true });

  for (let copyIndex = 0; copyIndex < 100; copyIndex += 1) {
    const importFileName = createImportFileName(sourceFileName, timestamp, copyIndex);
    const importPath = resolve(importDirectory, importFileName);

    if (!importPath.startsWith(`${importDirectory}${sep}`)) {
      throw new Error("Unsupported import path.");
    }

    try {
      await writeFile(importPath, body, { flag: "wx" });
      return { importFileName, importPath };
    } catch (error) {
      if (isFileExistsError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not create a unique import filename.");
}

function isFileExistsError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "EEXIST";
}

async function sendImportedFile(
  request: IncomingMessage,
  response: ServerResponse,
  importPath: string,
  importFileName: string
) {
  const fileStat = await stat(importPath);

  if (!fileStat.isFile()) {
    sendJson(response, 404, { error: "Imported file not found." });
    return;
  }

  const range = parseRangeHeader(String(request.headers.range ?? ""), fileStat.size);

  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Type", contentTypeForImportFile(importFileName));
  response.setHeader("Content-Disposition", `inline; filename="${headerSafeFileName(importFileName)}"`);

  if (range) {
    response.statusCode = 206;
    response.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${fileStat.size}`);
    response.setHeader("Content-Length", range.end - range.start + 1);

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(importPath, { start: range.start, end: range.end }).pipe(response);
    return;
  }

  if (request.headers.range) {
    response.statusCode = 416;
    response.setHeader("Content-Range", `bytes */${fileStat.size}`);
    response.end();
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Length", fileStat.size);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(importPath).pipe(response);
}

function decodeImportedFileName(url: string): string {
  const path = url.split("?")[0] ?? "";
  const mountedPrefix = "/api/imported-file/";
  const encodedFileName = path.startsWith(mountedPrefix) ? path.slice(mountedPrefix.length) : path.replace(/^\/+/, "");

  return decodeURIComponent(encodedFileName);
}

function parseRangeHeader(rangeHeader: string, fileSize: number): { start: number; end: number } | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);

  if (!match) {
    return undefined;
  }

  const [, rawStart, rawEnd] = match;

  if (!rawStart && !rawEnd) {
    return undefined;
  }

  const start =
    rawStart === "" && rawEnd
      ? Math.max(fileSize - Number(rawEnd), 0)
      : Number(rawStart);
  const end = rawStart === "" ? fileSize - 1 : rawEnd ? Math.min(Number(rawEnd), fileSize - 1) : fileSize - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileSize) {
    return undefined;
  }

  return { start, end };
}

function contentTypeForImportFile(fileName: string): string {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".flac": "audio/flac",
    ".aif": "audio/aiff",
    ".aiff": "audio/aiff",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm"
  };

  return contentTypes[extension] ?? "application/octet-stream";
}

function headerSafeFileName(fileName: string): string {
  return fileName.replace(/["\r\n]/g, "_");
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT";
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
