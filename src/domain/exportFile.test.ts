import { describe, expect, it } from "vitest";
import {
  createExportFileName,
  isSupportedBundleDirectoryName,
  isSupportedBundleFileName,
  isSupportedExportFileName
} from "./exportFile";

describe("export file helpers", () => {
  it("creates safe Lua and JSON export names from template names", () => {
    expect(createExportFileName("Guitar Cover Session", "lua")).toBe("guitar-cover-session.lua");
    expect(createExportFileName("Drop A# / Scratch", "json")).toBe("drop-a-scratch.json");
  });

  it("falls back to a stable name when the template name has no usable characters", () => {
    expect(createExportFileName("###", "lua")).toBe("guitar-workflow-template.lua");
  });

  it("rejects filenames outside the supported export shape", () => {
    expect(isSupportedExportFileName("guitar-cover-session.lua")).toBe(true);
    expect(isSupportedExportFileName("../session.lua")).toBe(false);
    expect(isSupportedExportFileName("session.txt")).toBe(false);
  });

  it("allows safe bundle folders and bundle filenames", () => {
    expect(isSupportedBundleDirectoryName("backing-track-creator")).toBe(true);
    expect(isSupportedBundleDirectoryName("../exports")).toBe(false);
    expect(isSupportedBundleFileName("source-manifest.md")).toBe(true);
    expect(isSupportedBundleFileName("songwriter-ideas.md")).toBe(true);
    expect(isSupportedBundleFileName("README-REAPER-STEPS.md")).toBe(true);
    expect(isSupportedBundleFileName("plugin-manifest.json")).toBe(true);
    expect(isSupportedBundleFileName("sources.json")).toBe(true);
    expect(isSupportedBundleFileName("rhythm-sketch.json")).toBe(true);
    expect(isSupportedBundleFileName("drum-guide.mid")).toBe(true);
    expect(isSupportedBundleFileName("bass-guide.mid")).toBe(true);
    expect(isSupportedBundleFileName("direct-backing.wav")).toBe(true);
    expect(isSupportedBundleFileName("run-workflow.lua")).toBe(true);
    expect(isSupportedBundleFileName("backing-track-creator.lua")).toBe(true);
    expect(isSupportedBundleFileName("notes.txt")).toBe(false);
    expect(isSupportedBundleFileName("../source-manifest.md")).toBe(false);
  });
});
