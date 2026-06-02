import { describe, expect, it } from "vitest";
import {
  createDrumSketchFromOnsets,
  createPresetDrumHits,
  createSongwriterBundle,
  createSongwriterSketch,
  generateSongwriterLua,
  serializeSongwriterSketch
} from "./songwriter";

describe("songwriter lab", () => {
  it("does not create a drum map before a rhythm source exists", () => {
    const hits = createDrumSketchFromOnsets([], 120, "metalcore", 2, {
      quantizeStrength: 100,
      humanizeMs: 0,
      swingPercent: 50
    });

    expect(hits).toEqual([]);
  });

  it("turns guitar onsets into a quantized drum sketch", () => {
    const hits = createDrumSketchFromOnsets(
      [
        { timeSeconds: 0, intensity: 0.9 },
        { timeSeconds: 0.31, intensity: 0.45 },
        { timeSeconds: 0.62, intensity: 0.8 },
        { timeSeconds: 1.25, intensity: 0.7 }
      ],
      120,
      "metalcore",
      2,
      { quantizeStrength: 100, humanizeMs: 0, swingPercent: 50 }
    );

    expect(hits.map((hit) => [hit.step, hit.voice])).toEqual([
      [0, "crash"],
      [2, "hat"],
      [5, "kick"],
      [10, "hat"]
    ]);
  });

  it("creates a complete songwriting sketch with continuation sections", () => {
    const sketch = createSongwriterSketch({
      songName: "Riff Test",
      artist: "Demo Artist",
      tuning: "Drop E",
      tempo: 156,
      mode: "both",
      feel: "breakdown",
      keyCenter: "Drop E root",
      riffRole: "breakdown",
      riffNotes: "Needs a lower answer riff after bar 4.",
      sourceFileName: "riff.wav",
      sourceFilePath: "imports/riff.wav",
      quantizeStrength: 80,
      humanizeMs: 9,
      swingPercent: 55,
      onsets: [
        { timeSeconds: 0, intensity: 0.9 },
        { timeSeconds: 0.4, intensity: 0.8 }
      ]
    });

    expect(sketch.tool).toBe("songwriter-lab");
    expect(sketch.drumHits.length).toBeGreaterThan(0);
    expect(sketch.sections.map((section) => section.name)).toContain("HALF-TIME BREAKDOWN");
    expect(sketch.notes).toContain("Guide items are visual rhythm markers and can be paired with drum-guide.mid.");
    expect(sketch.keyCenter).toBe("Drop E root");
    expect(sketch.riffRole).toBe("breakdown");
    expect(sketch.riffNotes).toBe("Needs a lower answer riff after bar 4.");
    expect(sketch.quantizeStrength).toBe(80);
    expect(sketch.swingPercent).toBe(55);
  });

  it("creates preset drum maps for quick songwriting starts", () => {
    const hits = createPresetDrumHits("half-time-breakdown", 120);

    expect(hits.length).toBeGreaterThan(8);
    expect(hits.map((hit) => [hit.step, hit.voice])).toContainEqual([12, "snare"]);
    expect(hits.map((hit) => [hit.step, hit.voice])).toContainEqual([0, "crash"]);
    expect(hits.every((hit) => hit.timeSeconds >= 0)).toBe(true);
  });

  it("uses edited drum hits when provided", () => {
    const sketch = createSongwriterSketch({
      songName: "Edited Map",
      artist: "Demo Artist",
      tuning: "Drop C",
      tempo: 120,
      mode: "both",
      feel: "metalcore",
      sourceFileName: "manual-drum-map",
      sourceFilePath: "",
      quantizeStrength: 100,
      humanizeMs: 0,
      swingPercent: 50,
      onsets: [{ timeSeconds: 0, intensity: 0.9 }],
      drumHits: [
        { step: 3, timeSeconds: 0.375, voice: "snare", intensity: 0.8, label: "SNARE step 4" },
        { step: 0, timeSeconds: 0, voice: "kick", intensity: 0.9, label: "KICK step 1" }
      ]
    });

    expect(sketch.drumHits.map((hit) => [hit.step, hit.voice])).toEqual([
      [0, "kick"],
      [3, "snare"]
    ]);
  });

  it("generates REAPER Lua with imported guitar, guide tracks, sections, and drum guide items", () => {
    const sketch = createSongwriterSketch({
      songName: "Riff Test",
      artist: "Demo Artist",
      tuning: "Drop A#",
      tempo: 160,
      mode: "both",
      feel: "metalcore",
      keyCenter: "F#",
      riffRole: "main-riff",
      riffNotes: "Open the next section into a wider chorus.",
      sourceFileName: "riff.wav",
      sourceFilePath: "imports/riff.wav",
      quantizeStrength: 90,
      humanizeMs: 8,
      swingPercent: 56,
      onsets: [
        { timeSeconds: 0, intensity: 0.9 },
        { timeSeconds: 0.375, intensity: 0.65 },
        { timeSeconds: 0.75, intensity: 0.7 }
      ]
    });

    const lua = generateSongwriterLua(sketch);

    expect(lua).toContain("-- Guitar Workflow Toolkit - Songwriter Lab");
    expect(lua).toContain("-- Mode: Rhythm to drums + continue song");
    expect(lua).toContain("-- Key / root: F#");
    expect(lua).toContain("-- Riff role: Main riff");
    expect(lua).toContain("-- Riff notes: Open the next section into a wider chorus.");
    expect(lua).toContain('createTrack("guitar-idea", "GUITAR IDEA", "#50c878")');
    expect(lua).toContain('createTrack("kick-guide", "KICK GUIDE", "#ef4444")');
    expect(lua).toContain("local function addStructureItem");
    expect(lua).toContain('reaper.InsertMedia("imports/riff.wav", 0)');
    expect(lua).toContain('reaper.AddProjectMarker2(0, false, 0, 0, "INTRO RIFF", -1, 0)');
    expect(lua).toContain('addStructureItem(0, 6, "INTRO RIFF"');
    expect(lua).toContain("Guitar: Use the recorded rhythm as the identity of the song.");
    expect(lua).toContain("addGuideItem");
    expect(lua).toContain("-- Drum guide:");
    expect(lua).toContain("Quantize strength: 90%");
    expect(lua).toContain("Riff role: Main riff");
    expect(lua).toContain("exports drum-guide.mid");
  });

  it("serializes and bundles songwriter exports", () => {
    const sketch = createSongwriterSketch({
      songName: "Riff Test",
      artist: "",
      tuning: "",
      tempo: 120,
      mode: "rhythm-to-drums",
      feel: "metalcore",
      sourceFileName: "",
      sourceFilePath: "",
      quantizeStrength: 100,
      humanizeMs: 0,
      swingPercent: 50,
      onsets: []
    });

    const json = serializeSongwriterSketch(sketch);
    const bundle = createSongwriterBundle(sketch, "-- lua", json);

    expect(JSON.parse(json).sketch.tool).toBe("songwriter-lab");
    expect(bundle.directoryName).toBe("riff-test-songwriter-lab");
    expect(bundle.files.map((file) => file.fileName)).toEqual([
      "run-workflow.lua",
      "riff-test-songwriter-lab.lua",
      "riff-test-songwriter-lab.json",
      "songwriter-ideas.md",
      "rhythm-sketch.json",
      "drum-guide.mid",
      "bass-guide.mid",
      "README-REAPER-STEPS.md",
      "plugin-manifest.json"
    ]);
    expect(bundle.files[0].text).toBe("-- lua");
    expect(bundle.files[1].text).toBe("-- lua");
    expect(bundle.files[3].text!).toContain("# Riff Test Songwriter Ideas");
    expect(bundle.files[4].text!).toContain('"keyCenter": "Unknown"');
    expect(bundle.files[5].encoding).toBe("base64");
    expect(bundle.files[5].base64?.length).toBeGreaterThan(40);
    const midiBytes = Buffer.from(bundle.files[5].base64 ?? "", "base64");
    expect(midiBytes.subarray(0, 4).toString("ascii")).toBe("MThd");
    expect(bundle.files[6].encoding).toBe("base64");
    const bassMidiBytes = Buffer.from(bundle.files[6].base64 ?? "", "base64");
    expect(bassMidiBytes.subarray(0, 4).toString("ascii")).toBe("MThd");
    expect(bundle.files[7].text!).toContain("# Riff Test - REAPER Songwriter Steps");
    expect(bundle.files[7].text!).toContain("run-workflow.lua");
    expect(bundle.files[7].text!).toContain("bass-guide.mid");
    const manifest = JSON.parse(bundle.files[8].text!);
    expect(manifest).toMatchObject({
      workflow: "songwriter-lab",
      entryScript: "run-workflow.lua",
      tuning: "E Standard"
    });
    expect(manifest.files).toContain("README-REAPER-STEPS.md");
  });
});
