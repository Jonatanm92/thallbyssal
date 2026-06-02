import { describe, expect, it } from "vitest";
import { createDefaultTemplate, createTemplateFromPreset } from "./template";
import { getSessionChecks } from "./sessionCheck";

describe("getSessionChecks", () => {
  it("marks the default REAPER session as export-ready", () => {
    const checks = getSessionChecks(createDefaultTemplate());

    expect(checks.map((check) => [check.id, check.status])).toEqual([
      ["track-order", "pass"],
      ["bus-names", "pass"],
      ["source-imports", "pass"],
      ["route-references", "pass"],
      ["required-routes", "pass"],
      ["master-send", "pass"],
      ["lua-export", "pass"],
      ["export-package", "pass"]
    ]);
  });

  it("reports missing route references and blocks Lua readiness", () => {
    const template = createDefaultTemplate();
    template.routes[0].toTrackId = "missing-bus";

    const checks = getSessionChecks(template);

    expect(checks.find((check) => check.id === "route-references")).toMatchObject({
      status: "fail",
      detail: "Route guitar-amp-l-to-guitar-bus points to an unknown destination track."
    });
    expect(checks.find((check) => check.id === "lua-export")).toMatchObject({
      status: "fail"
    });
  });

  it("reports required routing when a required send is missing", () => {
    const template = createDefaultTemplate();
    template.routes = template.routes.filter((route) => route.id !== "lead-guitar-to-guitar-bus");

    const checks = getSessionChecks(template);

    expect(checks.find((check) => check.id === "required-routes")).toMatchObject({
      status: "fail",
      detail: "Missing route: LEAD GUITAR -> GUITAR BUS."
    });
    expect(checks.find((check) => check.id === "master-send")).toMatchObject({
      status: "fail",
      detail: "Master send cannot be disabled until every required bus route exists."
    });
  });

  it("reports unclear bus naming", () => {
    const template = createDefaultTemplate();
    template.tracks[0].name = "Main Gtrs";

    const checks = getSessionChecks(template);

    expect(checks.find((check) => check.id === "bus-names")).toMatchObject({
      status: "warning",
      detail: "Expected bus names: GUITAR BUS and BACKING BUS."
    });
  });

  it("marks the One-Take Video Cover preset as export-ready", () => {
    const checks = getSessionChecks(createTemplateFromPreset("one-take-video-cover"));

    expect(checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("marks the Backing Track Creator preset as export-ready", () => {
    const checks = getSessionChecks(createTemplateFromPreset("backing-track-creator"));

    expect(checks.map((check) => [check.id, check.status])).toEqual([
      ["track-order", "pass"],
      ["bus-names", "pass"],
      ["source-imports", "warning"],
      ["route-references", "pass"],
      ["required-routes", "pass"],
      ["master-send", "pass"],
      ["lua-export", "pass"],
      ["export-package", "pass"]
    ]);
  });

  it("marks backing creator sources as ready when an imported source exists", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.sourceAssets[3].filePath = "C:\\Audio\\no-guitar.wav";

    const checks = getSessionChecks(template);

    expect(checks.find((check) => check.id === "source-imports")).toMatchObject({
      status: "pass",
      detail: "1 source has a local file path or reference link."
    });
    expect(checks.find((check) => check.id === "export-package")).toMatchObject({
      status: "pass",
      detail: "Create Files will write run-workflow.lua, JSON, source manifest, REAPER steps, sources.json, and plugin-manifest.json."
    });
  });

  it("reports missing backing creator routes", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.routes = template.routes.filter((route) => route.id !== "backing-track-no-guitar-to-backing-bus");

    const checks = getSessionChecks(template);

    expect(checks.find((check) => check.id === "required-routes")).toMatchObject({
      status: "fail",
      detail: "Missing route: BACKING TRACK NO GUITAR -> BACKING BUS."
    });
  });
});
