import { describe, expect, it } from "vitest";
import { createTemplateFromPreset, serializeTemplate } from "./template";
import { createExportBundle } from "./exportBundle";

describe("export bundle helpers", () => {
  it("creates Lua, JSON, and source manifest files for a template", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.songName = "Demo Song";
    template.sourceWorkflow = "separate-stems";
    template.sourceAssets[3].fileName = "demo-no-guitar.wav";
    template.sourceAssets[3].filePath = "C:\\Audio\\demo-no-guitar.wav";
    template.sourceAssets[3].sourceUrl = "https://www.songsterr.com/example";

    const bundle = createExportBundle(template, "-- lua", serializeTemplate(template));

    expect(bundle.directoryName).toBe("backing-track-creator");
    expect(bundle.files.map((file) => file.fileName)).toEqual([
      "run-workflow.lua",
      "backing-track-creator.lua",
      "backing-track-creator.json",
      "source-manifest.md",
      "README-REAPER-STEPS.md",
      "sources.json",
      "plugin-manifest.json"
    ]);
    expect(bundle.files[0].text).toBe("-- lua");
    expect(bundle.files[1].text).toBe("-- lua");
    expect(bundle.files[3].text!).toContain("# Backing Track Creator Source Manifest");
    expect(bundle.files[3].text!).toContain("Song: Demo Song");
    expect(bundle.files[3].text!).toContain("Source workflow: separate-stems");
    expect(bundle.files[3].text!).toContain("Output mode: REAPER import session + final audio file");
    expect(bundle.files[3].text!).toContain("No-guitar backing track -> BACKING TRACK NO GUITAR");
    expect(bundle.files[3].text!).toContain("Local file: C:\\Audio\\demo-no-guitar.wav");
    expect(bundle.files[3].text!).toContain("Reference link: https://www.songsterr.com/example");
    expect(bundle.files[4].text!).toContain("# REAPER Setup Steps");
    expect(bundle.files[4].text!).toContain("Load `run-workflow.lua` in REAPER");
    expect(bundle.files[4].text!).toContain("`sources.json` - structured source metadata for future tooling.");
    expect(bundle.files[4].text!).toContain("Imported media should land on the target tracks listed in `source-manifest.md`.");
    expect(bundle.files[4].text!).toContain("open File > Render to create the final backing-track WAV");
    const sourcesJson = JSON.parse(bundle.files[5].text!);
    expect(sourcesJson).toMatchObject({
      templateName: "Backing Track Creator",
      songName: "Demo Song",
      sourceWorkflow: "separate-stems",
      outputMode: "both",
      outputModeLabel: "REAPER import session + final audio file"
    });
    expect(sourcesJson.sources).toContainEqual(
      expect.objectContaining({
        label: "Original reference",
        targetTrackName: "ORIGINAL REFERENCE"
      })
    );
    expect(sourcesJson.sources).toContainEqual(
      expect.objectContaining({
        label: "No-guitar backing track",
        filePath: "C:\\Audio\\demo-no-guitar.wav",
        targetTrackName: "BACKING TRACK NO GUITAR"
      })
    );
    const pluginManifest = JSON.parse(bundle.files[6].text!);
    expect(pluginManifest).toMatchObject({
      app: "guitar-workflow-toolkit",
      manifestVersion: 1,
      packageKind: "local-reaper-workflow-plugin-pack",
      workflow: "backing-track-creator",
      entryScript: "run-workflow.lua"
    });
    expect(pluginManifest.files).toContain("run-workflow.lua");
    expect(pluginManifest.files).toContain("plugin-manifest.json");
  });
});
