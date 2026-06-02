import { describe, expect, it } from "vitest";
import { createTemplateFromPreset } from "./template";
import { getSourceSummary } from "./sourceSummary";

describe("getSourceSummary", () => {
  it("counts ready, missing, targeted, and unassigned source assets", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.sourceAssets[0].filePath = "C:\\Audio\\reference.wav";
    template.sourceAssets[1].sourceUrl = "https://www.songsterr.com/example";
    template.sourceAssets[2].targetTrackId = "";

    const summary = getSourceSummary(template);

    expect(summary).toEqual({
      total: 9,
      ready: 2,
      missing: 7,
      targeted: 8,
      unassigned: 1,
      label: "2/9 sources ready",
      detail: "7 missing file/link, 1 missing target"
    });
  });

  it("returns a quiet summary when there are no source slots", () => {
    const template = createTemplateFromPreset("guitar-routing-cover");

    expect(getSourceSummary(template)).toMatchObject({
      total: 0,
      label: "No source slots",
      detail: "Add sources when this template needs local files or reference links."
    });
  });
});
