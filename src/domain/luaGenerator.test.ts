import { describe, expect, it } from "vitest";
import { createDefaultTemplate, createTemplateFromPreset } from "./template";
import { generateReaperLua } from "./luaGenerator";

describe("generateReaperLua", () => {
  it("generates a REAPER script with tracks, colors, record arming, and sends", () => {
    const template = createDefaultTemplate();
    template.name = "Tight Rhythm Setup";
    template.tuning = "Drop C";
    template.sourceNotes = "Use the printed no-guitar WAV from the local practice folder.";
    template.tracks[1].recordArm = true;

    const lua = generateReaperLua(template);

    expect(lua).toContain("-- Template: Tight Rhythm Setup");
    expect(lua).toContain("-- Tuning: Drop C");
    expect(lua).toContain("-- Source notes: Use the printed no-guitar WAV from the local practice folder.");
    expect(lua).toContain("Source notes: Use the printed no-guitar WAV from the local practice folder.");
    expect(lua).toContain('reaper.AddProjectMarker2(0, false, 0, 0, "Tuning: Drop C", -1, 0)');
    expect(lua).toContain("reaper.InsertTrackAtIndex(0, true)");
    expect(lua).toContain('setTrackName(track, "GUITAR BUS")');
    expect(lua).toContain("reaper.SetMediaTrackInfo_Value(track, \"I_RECARM\", 1)");
    expect(lua).toContain('local sendIndex = reaper.CreateTrackSend(trackMap["guitar-amp-l"], trackMap["guitar-bus"])');
    expect(lua).toContain("reaper.Undo_EndBlock(\"Create guitar workflow template: Tight Rhythm Setup\", -1)");
  });

  it("creates the required bus routing and disables source master sends", () => {
    const template = createDefaultTemplate();

    const lua = generateReaperLua(template);

    expectInOrder(lua, [
      'setTrackName(track, "GUITAR BUS")',
      'setTrackName(track, "GUITAR AMP L")',
      'setTrackName(track, "GUITAR AMP R")',
      'setTrackName(track, "LEAD GUITAR")',
      'setTrackName(track, "CLEAN / AMBIENT GUITAR")',
      'setTrackName(track, "BACKING BUS")',
      'setTrackName(track, "BACKING TRACK")'
    ]);

    expect(lua).toContain("-- Routing: GUITAR AMP L -> GUITAR BUS");
    expect(lua).toContain("-- Routing: GUITAR AMP R -> GUITAR BUS");
    expect(lua).toContain("-- Routing: LEAD GUITAR -> GUITAR BUS");
    expect(lua).toContain("-- Routing: CLEAN / AMBIENT GUITAR -> GUITAR BUS");
    expect(lua).toContain("-- Routing: BACKING TRACK -> BACKING BUS");

    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["guitar-amp-l"], "B_MAINSEND", 0)');
    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["guitar-amp-r"], "B_MAINSEND", 0)');
    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["lead-guitar"], "B_MAINSEND", 0)');
    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["clean-ambient-guitar"], "B_MAINSEND", 0)');
    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["backing-track"], "B_MAINSEND", 0)');

    expect(lua).toContain('reaper.CreateTrackSend(trackMap["guitar-amp-l"], trackMap["guitar-bus"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["guitar-amp-r"], trackMap["guitar-bus"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["lead-guitar"], trackMap["guitar-bus"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["clean-ambient-guitar"], trackMap["guitar-bus"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["backing-track"], trackMap["backing-bus"])');
  });

  it("escapes strings that are unsafe in Lua literals", () => {
    const template = createDefaultTemplate();
    template.name = 'Lead "Wide" \\ Scratch';
    template.tracks[0].name = 'DI "Input" \\ Left';

    const lua = generateReaperLua(template);

    expect(lua).toContain('-- Template: Lead "Wide" \\ Scratch');
    expect(lua).toContain('setTrackName(track, "DI \\"Input\\" \\\\ Left")');
    expect(lua).toContain('Create guitar workflow template: Lead \\"Wide\\" \\\\ Scratch');
  });

  it("throws when the template has invalid route references", () => {
    const template = createDefaultTemplate();
    template.routes[0].fromTrackId = "missing";

    expect(() => generateReaperLua(template)).toThrow(
      "Route guitar-amp-l-to-guitar-bus points to an unknown source track."
    );
  });

  it("explains when a source file cannot be imported because no target track is assigned", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.sourceAssets[0].fileName = "reference.wav";
    template.sourceAssets[0].filePath = "imports/reference.wav";
    template.sourceAssets[0].targetTrackId = "";

    const lua = generateReaperLua(template);

    expect(lua).toContain("-- Source file: reference.wav");
    expect(lua).toContain("-- Local file path is set, but no target track is assigned, so media import is skipped.");
    expect(lua).not.toContain('reaper.InsertMedia("imports/reference.wav", 0)');
  });

  it("generates one-take video cover Lua metadata, markers, and routing", () => {
    const template = createTemplateFromPreset("one-take-video-cover");
    template.songName = "Demo Song";
    template.artist = "Demo Artist";
    template.tempo = 145;
    template.tuning = "Drop E";

    const lua = generateReaperLua(template);

    expect(lua).toContain("-- Template: One-Take Video Cover");
    expect(lua).toContain("-- Song: Demo Song");
    expect(lua).toContain("-- Artist: Demo Artist");
    expect(lua).toContain("-- BPM: 145");
    expect(lua).toContain("-- Tuning: Drop E");
    expect(lua).toContain("-- Source format: one-take camera + stereo output");
    expect(lua).toContain("-- Output mode: REAPER import session");
    expect(lua).toContain("-- Reminder: mute camera audio after sync");
    expect(lua).toContain("-- Reminder: export 16:9 full video and 9:16 Shorts version");
    expect(lua).toContain(
      'local projectNotes = "Song: Demo Song\\nArtist: Demo Artist\\nBPM: 145\\nTuning: Drop E\\nSource workflow: cover-template\\nSource format: one-take camera + stereo output\\nOutput mode: REAPER import session\\nReminder: mute camera audio after sync'
    );
    expect(lua).toContain("reaper.GetSetProjectNotes(0, true, projectNotes)");

    expectInOrder(lua, [
      'setTrackName(track, "VIDEO REFERENCE")',
      'setTrackName(track, "CAMERA AUDIO SYNC")',
      'setTrackName(track, "STEREO OUTPUT / SONGSTERR PRINT")',
      'setTrackName(track, "GUITAR LIVE PRINT")',
      'setTrackName(track, "EXTRA GUITAR LAYER")',
      'setTrackName(track, "FX / IMPACTS")',
      'setTrackName(track, "FINAL MASTER PRINT")',
      'setTrackName(track, "SHORTS EXPORT PRINT")',
      'setTrackName(track, "FULL VIDEO EXPORT PRINT")'
    ]);

    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["camera-audio-sync"], "B_MAINSEND", 0)');
    expect(lua).toContain("-- Routing: STEREO OUTPUT / SONGSTERR PRINT -> FINAL MASTER PRINT");
    expect(lua).toContain("-- Routing: GUITAR LIVE PRINT -> FINAL MASTER PRINT");
    expect(lua).toContain("-- Routing: EXTRA GUITAR LAYER -> FINAL MASTER PRINT");
    expect(lua).toContain("-- Routing: FX / IMPACTS -> FINAL MASTER PRINT");
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["stereo-output-songsterr-print"], trackMap["final-master-print"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["guitar-live-print"], trackMap["final-master-print"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["extra-guitar-layer"], trackMap["final-master-print"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["fx-impacts"], trackMap["final-master-print"])');
    expect(lua).not.toContain('reaper.SetMediaTrackInfo_Value(trackMap["final-master-print"], "B_MAINSEND", 0)');

    expect(lua).toContain('reaper.AddProjectMarker2(0, false, 0, 0, "START", -1, 0)');
    expect(lua).toContain('"BEST RIFF", -1, 0)');
    expect(lua).toContain('"FULL VIDEO END", -1, 0)');
  });

  it("generates backing track creator Lua notes, protected references, routing, and markers", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.songName = "Nigh to Silence";
    template.artist = "Demo Band";
    template.tempo = 178;
    template.tuning = "Drop A#";
    template.sourceWorkflow = "separate-stems";
    template.sourceNotes = "Album jam-track folder plus exported no-guitar practice WAV.";
    template.sourceAssets[3].fileName = "nigh-to-silence-no-guitar.wav";
    template.sourceAssets[3].filePath = "imports/nigh-to-silence-no-guitar.wav";
    template.sourceAssets[3].sourceUrl = "https://www.songsterr.com/example";
    template.sourceAssets[3].notes = "Use this no-guitar print as the main practice source.";

    const lua = generateReaperLua(template);

    expect(lua).toContain("-- Template: Backing Track Creator");
    expect(lua).toContain("-- Song: Nigh to Silence");
    expect(lua).toContain("-- Artist: Demo Band");
    expect(lua).toContain("-- BPM: 178");
    expect(lua).toContain("-- Tuning: Drop A#");
    expect(lua).toContain("-- Source workflow: separate-stems");
    expect(lua).toContain("-- Source format: local backing/jam tracks, stems, or legal instrumental sources");
    expect(lua).toContain("-- Output mode: REAPER import session + final audio file");
    expect(lua).toContain("-- Source notes: Album jam-track folder plus exported no-guitar practice WAV.");
    expect(lua).toContain("-- Source asset: No-guitar backing track");
    expect(lua).toContain("-- Source file: nigh-to-silence-no-guitar.wav");
    expect(lua).toContain("-- Source link reference: https://www.songsterr.com/example");
    expect(lua).toContain("-- Import source media onto BACKING TRACK NO GUITAR at project start.");
    expect(lua).toContain('reaper.SetOnlyTrackSelected(trackMap["backing-track-no-guitar"])');
    expect(lua).toContain("reaper.SetEditCurPos(0, false, false)");
    expect(lua).toContain('reaper.InsertMedia("imports/nigh-to-silence-no-guitar.wav", 0)');
    expect(lua).toContain("-- Reminder: use audio you own or have permission to use");
    expect(lua).toContain("-- Reminder: export FINAL BACKING PRINT as the no-guitar practice track");

    expectInOrder(lua, [
      'setTrackName(track, "ORIGINAL REFERENCE")',
      'setTrackName(track, "CAMERA / PHONE SYNC AUDIO")',
      'setTrackName(track, "BACKING TRACK MAIN")',
      'setTrackName(track, "BACKING TRACK NO GUITAR")',
      'setTrackName(track, "DRUMS / PERCUSSION STEM")',
      'setTrackName(track, "BASS STEM")',
      'setTrackName(track, "VOCALS / LEAD STEM")',
      'setTrackName(track, "SYNTHS / EXTRA STEMS")',
      'setTrackName(track, "CLICK / COUNT-IN")',
      'setTrackName(track, "BACKING BUS")',
      'setTrackName(track, "GUITAR PRACTICE BUS")',
      'setTrackName(track, "FINAL BACKING PRINT")'
    ]);

    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["original-reference"], "B_MAINSEND", 0)');
    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["camera-phone-sync-audio"], "B_MAINSEND", 0)');
    expect(lua).toContain('reaper.SetMediaTrackInfo_Value(trackMap["guitar-practice-bus"], "B_MAINSEND", 0)');
    expect(lua).not.toContain('reaper.SetMediaTrackInfo_Value(trackMap["final-backing-print"], "B_MAINSEND", 0)');

    expect(lua).toContain("-- Routing: BACKING TRACK MAIN -> BACKING BUS");
    expect(lua).toContain("-- Routing: BACKING TRACK NO GUITAR -> BACKING BUS");
    expect(lua).toContain("-- Routing: DRUMS / PERCUSSION STEM -> BACKING BUS");
    expect(lua).toContain("-- Routing: BASS STEM -> BACKING BUS");
    expect(lua).toContain("-- Routing: VOCALS / LEAD STEM -> BACKING BUS");
    expect(lua).toContain("-- Routing: SYNTHS / EXTRA STEMS -> BACKING BUS");
    expect(lua).toContain("-- Routing: CLICK / COUNT-IN -> GUITAR PRACTICE BUS");
    expect(lua).toContain("-- Routing: BACKING BUS -> FINAL BACKING PRINT");
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["backing-track-no-guitar"], trackMap["backing-bus"])');
    expect(lua).toContain('reaper.CreateTrackSend(trackMap["backing-bus"], trackMap["final-backing-print"])');

    expect(lua).toContain('reaper.AddProjectMarker2(0, false, 0, 0, "START", -1, 0)');
    expect(lua).toContain('"SOLO SECTION", -1, 0)');
    expect(lua).toContain('"LOOP PRACTICE START", -1, 0)');
    expect(lua).toContain('"FINAL PRINT END", -1, 0)');
    expect(lua).toContain("-- Render setup: final backing track file");
    expect(lua).toContain('reaper.GetSetProjectInfo_String(0, "RENDER_FILE", renderDirectory, true)');
    expect(lua).toContain('reaper.GetSetProjectInfo_String(0, "RENDER_PATTERN", "Nigh to Silence-backing-track", true)');
    expect(lua).toContain('reaper.GetSetProjectInfo(0, "RENDER_BOUNDSFLAG", 1, true)');
    expect(lua).toContain('reaper.GetSetProjectInfo_String(0, "RENDER_FORMAT", "evaw", true)');
  });

  it("can generate a REAPER-import-only backing script without render setup", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.outputMode = "reaper-import";

    const lua = generateReaperLua(template);

    expect(lua).toContain("-- Output mode: REAPER import session");
    expect(lua).not.toContain("-- Render setup: final backing track file");
    expect(lua).not.toContain("RENDER_PATTERN");
  });
});

function expectInOrder(value: string, fragments: string[]) {
  let lastIndex = -1;

  for (const fragment of fragments) {
    const index = value.indexOf(fragment);
    expect(index).toBeGreaterThan(lastIndex);
    lastIndex = index;
  }
}
