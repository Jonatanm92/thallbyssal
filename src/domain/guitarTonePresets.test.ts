import { describe, expect, it } from "vitest";
import { getGuitarTonePreset, guitarTonePresets } from "./guitarTonePresets";

describe("guitar tone presets", () => {
  it("provides a useful original preset library", () => {
    expect(guitarTonePresets.length).toBeGreaterThanOrEqual(6);
    expect(guitarTonePresets.map((preset) => preset.id)).toContain("obsidian-thall-rhythm");
    expect(guitarTonePresets.every((preset) => preset.ampDrive >= 1 && preset.ampDrive <= 12)).toBe(true);
    expect(guitarTonePresets.every((preset) => preset.ampTone >= 0 && preset.ampTone <= 100)).toBe(true);
  });

  it("falls back to the first preset", () => {
    expect(getGuitarTonePreset("missing").id).toBe(guitarTonePresets[0].id);
  });
});

