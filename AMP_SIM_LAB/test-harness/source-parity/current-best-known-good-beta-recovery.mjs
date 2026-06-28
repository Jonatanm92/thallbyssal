import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportsDir } from "../lab-paths.mjs";

const thisFilePath = fileURLToPath(import.meta.url);

export const defaultAudioLockRoot = path.join(reportsDir, "current-best-audio-lock");
export const defaultJsonPath = path.join(reportsDir, "current-best-known-good-beta-recovery.json");
export const defaultMarkdownPath = path.join(reportsDir, "current-best-known-good-beta-recovery.md");

const requiredBaselineFiles = new Set([
  "p01-current-best-baseline__di-boostalizer.wav",
  "p01-current-best-baseline__low-tuned-chugs.wav",
  "p01-current-best-baseline__noise.wav",
  "p01-current-best-baseline__pick-attack.wav"
]);

function exists(filePath) {
  return Boolean(filePath && fs.existsSync(filePath));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function hashFileIfExists(filePath) {
  if (!exists(filePath)) {
    return null;
  }

  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function sortByModifiedDesc(paths) {
  return paths
    .map((filePath) => ({ filePath, modifiedMs: fs.statSync(filePath).mtimeMs }))
    .sort((a, b) => b.modifiedMs - a.modifiedMs)
    .map((entry) => entry.filePath);
}

function findAudioLockReports(root) {
  if (!exists(root)) {
    return [];
  }

  const found = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && entry.name === "current-best-audio-lock-compare.json") {
        found.push(entryPath);
      }
    }
  }

  return sortByModifiedDesc(found);
}

export function findLatestAudioLockReport({ audioLockRoot = defaultAudioLockRoot } = {}) {
  const reports = findAudioLockReports(audioLockRoot);
  return reports.find((reportPath) => {
    try {
      const report = readJson(reportPath);
      return typeof report.baselineDir === "string"
        && Array.isArray(report.comparisons)
        && report.comparisons.length > 0;
    } catch {
      return false;
    }
  }) ?? null;
}

function fileStatus({ exists: fileExists, sha256, expectedSha256, sizeBytes, expectedSizeBytes }) {
  if (!fileExists) {
    return "missing";
  }

  if (sha256 !== expectedSha256) {
    return "hash-mismatch";
  }

  if (Number.isFinite(expectedSizeBytes) && sizeBytes !== expectedSizeBytes) {
    return "size-mismatch";
  }

  return "hash-match";
}

function expectedEntry(comparison, dir, side) {
  const filePath = dir ? path.join(dir, comparison.name) : null;
  const fileExists = exists(filePath);
  const sizeBytes = fileExists ? fs.statSync(filePath).size : null;
  const expectedSizeBytes = side === "baseline" ? comparison.baselineSizeBytes : comparison.candidateSizeBytes;
  const expectedSha256 = side === "baseline" ? comparison.baselineSha256 : comparison.candidateSha256;
  const sha256 = hashFileIfExists(filePath);

  return {
    path: filePath,
    exists: fileExists,
    sizeBytes,
    expectedSizeBytes,
    sha256,
    expectedSha256,
    status: fileStatus({ exists: fileExists, sha256, expectedSha256, sizeBytes, expectedSizeBytes })
  };
}

function isRequiredBaselineName(name) {
  return requiredBaselineFiles.has(name);
}

export function createKnownGoodBetaRecoveryReport({
  audioLockReportPath = null,
  audioLockReport = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const resolvedReportPath = audioLockReportPath ?? findLatestAudioLockReport();
  const loadedReport = audioLockReport ?? (resolvedReportPath ? readJson(resolvedReportPath) : null);

  if (!loadedReport) {
    return {
      schemaVersion: 1,
      generatedAt,
      status: "blocked-missing-audio-lock-report",
      purpose: "Recover exact known-good Current Best beta render evidence from historical audio-lock reports.",
      audioLockReportPath: resolvedReportPath,
      summary: {
        expectedRequiredFiles: requiredBaselineFiles.size,
        requiredBaselineFilesPresent: 0,
        requiredBaselineFilesMissing: requiredBaselineFiles.size,
        requiredBaselineFilesHashMatched: 0,
        readyForDirectSourceParity: false
      },
      entries: [],
      nextAction: "Locate a historical current-best-audio-lock compare report or regenerate the exact known-good beta render set."
    };
  }

  const comparisons = loadedReport.comparisons ?? [];
  const requiredEntries = comparisons
    .filter((comparison) => isRequiredBaselineName(comparison.name))
    .map((comparison) => ({
      name: comparison.name,
      historicalStatus: comparison.status ?? null,
      baseline: expectedEntry(comparison, loadedReport.baselineDir, "baseline"),
      candidate: expectedEntry(comparison, loadedReport.candidateDir, "candidate")
    }));

  const requiredMissing = requiredEntries.filter((entry) => entry.baseline.status === "missing");
  const requiredHashMatched = requiredEntries.filter((entry) => entry.baseline.status === "hash-match");
  const requiredHashMismatched = requiredEntries.filter((entry) => entry.baseline.status === "hash-mismatch" || entry.baseline.status === "size-mismatch");

  return {
    schemaVersion: 1,
    generatedAt,
    status: requiredHashMatched.length === requiredBaselineFiles.size
      ? "ready-direct-source-parity"
      : "blocked-missing-known-good-beta-renders",
    purpose: "Recover exact known-good Current Best beta render evidence from historical audio-lock reports.",
    scope: {
      reportOnly: true,
      productDspTouched: false,
      productDefaultsTouched: false,
      goldenReferenceTouched: false,
      audioWritten: false,
      assetsCommitted: false
    },
    audioLockReportPath: resolvedReportPath,
    baselineDir: loadedReport.baselineDir ?? null,
    candidateDir: loadedReport.candidateDir ?? null,
    historicalSummary: loadedReport.summary ?? null,
    summary: {
      expectedRequiredFiles: requiredBaselineFiles.size,
      requiredBaselineFilesPresent: requiredEntries.filter((entry) => entry.baseline.exists).length,
      requiredBaselineFilesMissing: requiredMissing.length,
      requiredBaselineFilesHashMatched: requiredHashMatched.length,
      requiredBaselineFilesHashMismatched: requiredHashMismatched.length,
      readyForDirectSourceParity: requiredHashMatched.length === requiredBaselineFiles.size
    },
    entries: requiredEntries,
    expectedRequiredFileNames: [...requiredBaselineFiles],
    nextAction: requiredHashMatched.length === requiredBaselineFiles.size
      ? "Use these verified known-good beta renders in the source parity local manifest."
      : "Restore these exact WAVs by filename, byte size, and SHA256, or regenerate them from the exact approved known-good beta before claiming direct source parity."
  };
}

export function createKnownGoodBetaRecoveryMarkdown(report) {
  const rows = report.entries
    .map((entry) => `| ${entry.name} | ${entry.baseline.status} | ${entry.baseline.exists ? "yes" : "no"} | ${entry.baseline.expectedSizeBytes ?? "n/a"} | ${entry.baseline.expectedSha256 ?? "n/a"} | ${entry.baseline.path ?? "(missing)"} |`)
    .join("\n");

  return `# Current Best Known-Good Beta Render Recovery

Generated: ${report.generatedAt}

Status: **${report.status}**

## Scope

- Report only: yes
- Product DSP/defaults/GRA touched: no
- Audio written: no
- Assets committed: no

## Historical Source

- Audio-lock report: \`${report.audioLockReportPath ?? "(missing)"}\`
- Historical baseline dir: \`${report.baselineDir ?? "(missing)"}\`
- Historical candidate dir: \`${report.candidateDir ?? "(missing)"}\`

## Required Current Best Baseline Files

| File | Status | Exists | Expected bytes | Expected SHA256 | Expected path |
| --- | --- | --- | ---: | --- | --- |
${rows || "| (none) | missing | no | n/a | n/a | (missing) |"}

## Summary

- Expected required files: ${report.summary.expectedRequiredFiles}
- Present: ${report.summary.requiredBaselineFilesPresent}
- Missing: ${report.summary.requiredBaselineFilesMissing}
- Hash matched: ${report.summary.requiredBaselineFilesHashMatched}
- Hash/size mismatched: ${report.summary.requiredBaselineFilesHashMismatched ?? 0}
- Ready for direct source parity: ${report.summary.readyForDirectSourceParity ? "yes" : "no"}

## Next Action

${report.nextAction}
`;
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }

  return process.argv[index + 1];
}

if (process.argv[1] && path.resolve(process.argv[1]) === thisFilePath) {
  const audioLockReportPath = argValue("--audio-lock-report", null);
  const jsonPath = path.resolve(argValue("--json", defaultJsonPath));
  const markdownPath = path.resolve(argValue("--md", defaultMarkdownPath));
  const report = createKnownGoodBetaRecoveryReport({ audioLockReportPath });

  await fsPromises.mkdir(path.dirname(jsonPath), { recursive: true });
  await fsPromises.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fsPromises.writeFile(markdownPath, createKnownGoodBetaRecoveryMarkdown(report));

  console.log(`Current Best known-good beta recovery JSON written: ${jsonPath}`);
  console.log(`Current Best known-good beta recovery markdown written: ${markdownPath}`);
  console.log(`Status: ${report.status}`);
}
