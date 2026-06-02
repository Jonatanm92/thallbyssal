import { describe, expect, it } from "vitest";
import { createTemplateFromPreset } from "./template";
import { planBatchSourceImports, summarizeBatchSourceImportPlan } from "./sourceImportPlan";

describe("planBatchSourceImports", () => {
  it("matches common stem filenames to backing creator source slots", () => {
    const template = createTemplateFromPreset("backing-track-creator");

    const plan = planBatchSourceImports(template, [
      "ERRA no guitar.wav",
      "ERRA drums.flac",
      "ERRA bass.wav",
      "phone sync.m4a",
      "wide ambience.wav"
    ]);

    expect(plan.map((item) => [item.inputFileName, item.sourceId, item.targetTrackId, item.isNewSource])).toEqual([
      ["ERRA no guitar.wav", "no-guitar-backing-source", "backing-track-no-guitar", false],
      ["ERRA drums.flac", "drums-percussion-source", "drums-percussion-stem", false],
      ["ERRA bass.wav", "bass-stem-source", "bass-stem", false],
      ["phone sync.m4a", "camera-phone-sync-source", "camera-phone-sync-audio", false],
      ["wide ambience.wav", "synths-extra-source", "synths-extra-stems", false]
    ]);
  });

  it("puts an unmatched song file into the main backing slot", () => {
    const template = createTemplateFromPreset("backing-track-creator");

    const plan = planBatchSourceImports(template, ["Snowblood.wav"]);

    expect(plan[0]).toMatchObject({
      inputFileName: "Snowblood.wav",
      sourceId: "main-backing-source",
      targetTrackId: "backing-track-main",
      isNewSource: false
    });
  });

  it("does not overwrite an already filled matched source", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.sourceAssets.find((source) => source.id === "bass-stem-source")!.filePath = "C:\\Audio\\old-bass.wav";

    const plan = planBatchSourceImports(template, ["new bass.wav"]);

    expect(plan[0]).toMatchObject({
      inputFileName: "new bass.wav",
      sourceId: "new-bass-source",
      targetTrackId: "",
      isNewSource: true
    });
  });

  it("summarizes matched and new source rows for UI status text", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    const plan = planBatchSourceImports(template, ["demo no guitar.wav", "demo drums.wav", "wide ambience.wav"]);

    expect(summarizeBatchSourceImportPlan(plan)).toBe("3 matched, 0 new sources");
  });
});
