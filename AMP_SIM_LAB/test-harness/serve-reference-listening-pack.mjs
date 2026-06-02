import fs from "node:fs/promises";
import fsSync from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatedRoot } from "./lab-paths.mjs";
import { isInsideDirectory } from "./render-hook/render-adapter.mjs";

const __filename = fileURLToPath(import.meta.url);
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".md", "text/plain; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".wav", "audio/wav"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"]
]);

async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function findLatestPackRoot() {
  const packSources = [
    path.join(generatedRoot, "listening-packs", "ir-reference-auditions"),
    path.join(generatedRoot, "listening-packs", "reference-candidates")
  ];

  const candidates = [];
  for (const root of packSources) {
    let entries = [];

    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packRoot = path.join(root, entry.name);
      const landingPath = (await fileExists(path.join(packRoot, "index.html")))
        ? path.join(packRoot, "index.html")
        : path.join(packRoot, "audition.html");
      if (await fileExists(landingPath)) {
        const stats = await fs.stat(landingPath);
        candidates.push({ packRoot, modifiedMs: stats.mtimeMs });
      }
    }
  }

  candidates.sort((a, b) => b.modifiedMs - a.modifiedMs);
  return candidates[0]?.packRoot ?? null;
}

function parseArgs(argv) {
  const options = {
    port: 5187,
    host: "127.0.0.1",
    packRoot: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--port" && next) {
      options.port = Number(next);
      index += 1;
    } else if (arg === "--host" && next) {
      options.host = next;
      index += 1;
    } else if (arg === "--pack-root" && next) {
      options.packRoot = next;
      index += 1;
    }
  }

  return options;
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(text);
}

function parseRangeHeader(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader ?? "");
  if (!match) {
    return null;
  }

  const startText = match[1];
  const endText = match[2];
  if (startText === "" && endText === "") {
    return null;
  }

  if (startText === "") {
    const suffixLength = Number(endText);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }
    return {
      start: Math.max(0, size - suffixLength),
      end: size - 1
    };
  }

  const start = Number(startText);
  const end = endText === "" ? size - 1 : Number(endText);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1)
  };
}

async function serveFile({ request, response, packRoot, requestUrl }) {
  const url = new URL(requestUrl, "http://localhost");
  const requestedPath = decodeURIComponent(url.pathname);
  const landingPath = fsSync.existsSync(path.join(packRoot, "index.html")) ? "index.html" : "audition.html";
  const relativePath = requestedPath === "/" ? landingPath : requestedPath.replace(/^\/+/, "");
  const filePath = path.resolve(packRoot, relativePath);

  if (!isInsideDirectory(packRoot, filePath)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  if (!fsSync.existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    sendText(response, 404, "Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes.get(extension) ?? "application/octet-stream";
  const range = parseRangeHeader(request.headers.range, stats.size);

  if (request.headers.range && !range) {
    response.writeHead(416, {
      "content-range": `bytes */${stats.size}`,
      "accept-ranges": "bytes"
    });
    response.end();
    return;
  }

  if (range) {
    response.writeHead(206, {
      "content-type": contentType,
      "content-length": String(range.end - range.start + 1),
      "content-range": `bytes ${range.start}-${range.end}/${stats.size}`,
      "accept-ranges": "bytes",
      "cache-control": "no-store"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    fsSync.createReadStream(filePath, { start: range.start, end: range.end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    "content-type": contentType,
    "content-length": String(stats.size),
    "accept-ranges": "bytes",
    "cache-control": "no-store"
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  fsSync.createReadStream(filePath).pipe(response);
}

export async function serveReferenceListeningPack(options = {}) {
  const packRoot = path.resolve(options.packRoot ?? await findLatestPackRoot() ?? "");
  const hasLandingPage = fsSync.existsSync(path.join(packRoot, "index.html")) || fsSync.existsSync(path.join(packRoot, "audition.html"));
  if (!packRoot || !hasLandingPage) {
    throw new Error("No reference listening pack found. Run npm run lab:reference:pack or npm run lab:ir:audition first.");
  }

  const host = options.host ?? "127.0.0.1";
  const port = Number.isFinite(options.port) ? options.port : 5187;

  const server = http.createServer((request, response) => {
    serveFile({ request, response, packRoot, requestUrl: request.url ?? "/" }).catch((error) => {
      sendText(response, 500, error instanceof Error ? error.message : String(error));
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  return {
    server,
    packRoot,
    url: `http://${host}:${port}/`
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await serveReferenceListeningPack(options);
    console.log(`Serving reference listening pack: ${result.packRoot}`);
    console.log(`Open: ${result.url}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
