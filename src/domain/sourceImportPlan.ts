import { GuitarWorkflowTemplate, SourceAssetTemplate } from "./template";

export interface BatchSourceImportPlanItem {
  inputFileName: string;
  sourceId: string;
  sourceLabel: string;
  targetTrackId: string;
  isNewSource: boolean;
}

const sourceMatchers: Array<{ sourceId: string; patterns: RegExp[] }> = [
  { sourceId: "no-guitar-backing-source", patterns: [/no[-_\s]?guitar/i, /guitarless/i, /instrumental/i] },
  { sourceId: "drums-percussion-source", patterns: [/drums?/i, /percussion/i] },
  { sourceId: "bass-stem-source", patterns: [/\bbass\b/i] },
  { sourceId: "vocals-lead-source", patterns: [/vocals?/i, /\bvox\b/i] },
  { sourceId: "synths-extra-source", patterns: [/synths?/i, /\bkeys?\b/i, /pads?/i, /\bfx\b/i, /ambien(?:t|ce)/i] },
  { sourceId: "click-count-in-source", patterns: [/click/i, /count[-_\s]?in/i, /metronome/i] },
  { sourceId: "camera-phone-sync-source", patterns: [/camera/i, /phone/i, /sync/i] },
  { sourceId: "original-reference-source", patterns: [/original/i, /reference/i, /full[-_\s]?mix/i] },
  { sourceId: "main-backing-source", patterns: [/backing/i, /\bjam\b/i, /songsterr/i, /print/i, /stereo/i] }
];

const backingFallbackSourceIds = [
  "main-backing-source",
  "no-guitar-backing-source",
  "drums-percussion-source",
  "bass-stem-source",
  "vocals-lead-source",
  "synths-extra-source",
  "click-count-in-source"
];

export function planBatchSourceImports(
  template: GuitarWorkflowTemplate,
  fileNames: string[]
): BatchSourceImportPlanItem[] {
  const existingSourceIds = template.sourceAssets.map((source) => source.id);
  const plannedSourceIds = new Set(existingSourceIds);
  const usedExistingSourceIds = new Set<string>();

  return fileNames.map((fileName) => {
    const matcher = findSourceMatcher(fileName);
    const matchedSource = matcher
      ? findAvailableSourceById(template.sourceAssets, matcher.sourceId, usedExistingSourceIds)
      : findAvailableFallbackSource(template.sourceAssets, usedExistingSourceIds);

    if (matchedSource) {
      usedExistingSourceIds.add(matchedSource.id);

      return {
        inputFileName: fileName,
        sourceId: matchedSource.id,
        sourceLabel: matchedSource.label,
        targetTrackId: matchedSource.targetTrackId,
        isNewSource: false
      };
    }

    const sourceLabel = labelFromFileName(fileName);
    const sourceId = uniqueId(`${cleanId(sourceLabel)}-source`, plannedSourceIds);
    plannedSourceIds.add(sourceId);

    return {
      inputFileName: fileName,
      sourceId,
      sourceLabel,
      targetTrackId: "",
      isNewSource: true
    };
  });
}

export function summarizeBatchSourceImportPlan(plan: BatchSourceImportPlanItem[]): string {
  const newSourceCount = plan.filter((item) => item.isNewSource).length;
  const matchedCount = plan.length - newSourceCount;

  return `${matchedCount} matched, ${newSourceCount} new source${newSourceCount === 1 ? "" : "s"}`;
}

function findSourceMatcher(fileName: string): { sourceId: string; patterns: RegExp[] } | undefined {
  return sourceMatchers.find((candidate) => candidate.patterns.some((pattern) => pattern.test(fileName)));
}

function findAvailableSourceById(
  sources: SourceAssetTemplate[],
  sourceId: string,
  usedExistingSourceIds: Set<string>
): SourceAssetTemplate | undefined {
  const source = sources.find((candidate) => candidate.id === sourceId);

  if (!source || usedExistingSourceIds.has(source.id) || source.filePath.trim() || source.sourceUrl.trim()) {
    return undefined;
  }

  return source;
}

function findAvailableFallbackSource(
  sources: SourceAssetTemplate[],
  usedExistingSourceIds: Set<string>
): SourceAssetTemplate | undefined {
  for (const sourceId of backingFallbackSourceIds) {
    const source = findAvailableSourceById(sources, sourceId, usedExistingSourceIds);

    if (source) {
      return source;
    }
  }

  return undefined;
}

function labelFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Imported Source";
}

function uniqueId(base: string, existing: Set<string>) {
  let candidate = base || "source";
  let suffix = 2;

  while (existing.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function cleanId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
