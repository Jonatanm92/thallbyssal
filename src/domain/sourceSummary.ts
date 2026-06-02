import { GuitarWorkflowTemplate } from "./template";

export interface SourceSummary {
  total: number;
  ready: number;
  missing: number;
  targeted: number;
  unassigned: number;
  label: string;
  detail: string;
}

export function getSourceSummary(template: GuitarWorkflowTemplate): SourceSummary {
  const total = template.sourceAssets.length;

  if (total === 0) {
    return {
      total,
      ready: 0,
      missing: 0,
      targeted: 0,
      unassigned: 0,
      label: "No source slots",
      detail: "Add sources when this template needs local files or reference links."
    };
  }

  const ready = template.sourceAssets.filter((source) => source.filePath.trim() || source.sourceUrl.trim()).length;
  const targeted = template.sourceAssets.filter((source) => source.targetTrackId.trim()).length;
  const missing = total - ready;
  const unassigned = total - targeted;

  return {
    total,
    ready,
    missing,
    targeted,
    unassigned,
    label: `${ready}/${total} sources ready`,
    detail: `${missing} missing file/link, ${unassigned} missing target`
  };
}
