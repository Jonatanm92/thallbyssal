import { describe, expect, it } from "vitest";
import {
  cloneTemplate,
  createDefaultTemplate,
  createTemplateFromPreset,
  createTemplateFromPresetWithMetadata,
  loadTemplateFromJson,
  serializeTemplate,
  templatePresets,
  validateTemplate
} from "./template";

describe("template model", () => {
  it("creates a default guitar workflow template with stable track ids", () => {
    const template = createDefaultTemplate();

    expect(template.schemaVersion).toBe(1);
    expect(template.tuning).toBe("E Standard");
    expect(template.tracks.map((track) => track.id)).toEqual([
      "guitar-bus",
      "guitar-amp-l",
      "guitar-amp-r",
      "lead-guitar",
      "clean-ambient-guitar",
      "backing-bus",
      "backing-track"
    ]);
    expect(template.tracks.filter((track) => track.role === "bus").map((track) => track.name)).toEqual([
      "GUITAR BUS",
      "BACKING BUS"
    ]);
    expect(template.routes).toContainEqual({
      id: "guitar-amp-l-to-guitar-bus",
      fromTrackId: "guitar-amp-l",
      toTrackId: "guitar-bus",
      sendMode: "post-fader",
      volumeDb: 0,
      pan: -1
    });
  });

  it("serializes with a top-level app marker and restores the same model", () => {
    const template = createDefaultTemplate();
    template.name = "Session A";
    template.tuning = "Drop A#";
    template.outputMode = "audio-file";
    template.sourceNotes = "Using local ERRA-style no-guitar jam track and a Songsterr stereo print.";
    template.tracks[0].recordArm = true;

    const json = serializeTemplate(template);
    const parsed = loadTemplateFromJson(json);

    expect(JSON.parse(json).app).toBe("guitar-workflow-toolkit");
    expect(JSON.parse(json).template.tuning).toBe("Drop A#");
    expect(JSON.parse(json).template.outputMode).toBe("audio-file");
    expect(JSON.parse(json).template.sourceWorkflow).toBe("cover-template");
    expect(JSON.parse(json).template.sourceNotes).toBe(
      "Using local ERRA-style no-guitar jam track and a Songsterr stereo print."
    );
    expect(JSON.parse(json).template.sourceAssets).toEqual([]);
    expect(parsed.name).toBe("Session A");
    expect(parsed.tuning).toBe("Drop A#");
    expect(parsed.outputMode).toBe("audio-file");
    expect(parsed.sourceNotes).toBe("Using local ERRA-style no-guitar jam track and a Songsterr stereo print.");
    expect(parsed.sourceAssets).toEqual([]);
    expect(parsed.tracks[0].recordArm).toBe(true);
  });

  it("lists and creates the One-Take Video Cover preset", () => {
    expect(templatePresets).toContainEqual({
      id: "one-take-video-cover",
      label: "One-Take Video Cover"
    });

    const template = createTemplateFromPreset("one-take-video-cover");

    expect(template.presetId).toBe("one-take-video-cover");
    expect(template.name).toBe("One-Take Video Cover");
    expect(template.sourceFormat).toBe("one-take camera + stereo output");
    expect(template.tracks.map((track) => track.name)).toEqual([
      "VIDEO REFERENCE",
      "CAMERA AUDIO SYNC",
      "STEREO OUTPUT / SONGSTERR PRINT",
      "GUITAR LIVE PRINT",
      "EXTRA GUITAR LAYER",
      "FX / IMPACTS",
      "FINAL MASTER PRINT",
      "SHORTS EXPORT PRINT",
      "FULL VIDEO EXPORT PRINT"
    ]);
    expect(template.tracks.find((track) => track.id === "camera-audio-sync")?.masterSendEnabled).toBe(false);
    expect(template.routes.map((route) => `${route.fromTrackId}->${route.toTrackId}`)).toEqual([
      "stereo-output-songsterr-print->final-master-print",
      "guitar-live-print->final-master-print",
      "extra-guitar-layer->final-master-print",
      "fx-impacts->final-master-print"
    ]);
    expect(template.markers.map((marker) => marker.name)).toEqual([
      "START",
      "BEST RIFF",
      "BREAKDOWN",
      "CHORUS / BIG PART",
      "SHORTS CLIP 1 START",
      "SHORTS CLIP 1 END",
      "FULL VIDEO START",
      "FULL VIDEO END"
    ]);
  });

  it("lists and creates the Backing Track Creator preset", () => {
    expect(templatePresets).toContainEqual({
      id: "backing-track-creator",
      label: "Backing Track Creator"
    });

    const template = createTemplateFromPreset("backing-track-creator");

    expect(template.presetId).toBe("backing-track-creator");
    expect(template.name).toBe("Backing Track Creator");
    expect(template.sourceWorkflow).toBe("no-guitar-track");
    expect(template.sourceFormat).toBe("local backing/jam tracks, stems, or legal instrumental sources");
    expect(template.outputMode).toBe("both");
    expect(template.sourceNotes).toBe("Drop in local jam tracks, no-guitar exports, or stems you have permission to use.");
    expect(template.sourceAssets.map((source) => `${source.label}->${source.targetTrackId}`)).toEqual([
      "Original reference->original-reference",
      "Camera/phone sync audio->camera-phone-sync-audio",
      "Main backing track->backing-track-main",
      "No-guitar backing track->backing-track-no-guitar",
      "Drums/percussion stem->drums-percussion-stem",
      "Bass stem->bass-stem",
      "Vocals/lead stem->vocals-lead-stem",
      "Synths/extra stems->synths-extra-stems",
      "Click/count-in->click-count-in"
    ]);
    expect(template.reminders).toContain("use audio you own or have permission to use");
    expect(template.reminders).toContain("export FINAL BACKING PRINT as the no-guitar practice track");
    expect(template.tracks.map((track) => track.name)).toEqual([
      "ORIGINAL REFERENCE",
      "CAMERA / PHONE SYNC AUDIO",
      "BACKING TRACK MAIN",
      "BACKING TRACK NO GUITAR",
      "DRUMS / PERCUSSION STEM",
      "BASS STEM",
      "VOCALS / LEAD STEM",
      "SYNTHS / EXTRA STEMS",
      "CLICK / COUNT-IN",
      "BACKING BUS",
      "GUITAR PRACTICE BUS",
      "FINAL BACKING PRINT"
    ]);
    expect(template.tracks.find((track) => track.id === "original-reference")?.masterSendEnabled).toBe(false);
    expect(template.tracks.find((track) => track.id === "camera-phone-sync-audio")?.masterSendEnabled).toBe(false);
    expect(template.tracks.find((track) => track.id === "guitar-practice-bus")?.masterSendEnabled).toBe(false);
    expect(template.tracks.find((track) => track.id === "final-backing-print")?.masterSendEnabled).toBe(true);
    expect(template.routes.map((route) => `${route.fromTrackId}->${route.toTrackId}`)).toEqual([
      "backing-track-main->backing-bus",
      "backing-track-no-guitar->backing-bus",
      "drums-percussion-stem->backing-bus",
      "bass-stem->backing-bus",
      "vocals-lead-stem->backing-bus",
      "synths-extra-stems->backing-bus",
      "click-count-in->guitar-practice-bus",
      "backing-bus->final-backing-print"
    ]);
    expect(template.markers.map((marker) => marker.name)).toEqual([
      "START",
      "INTRO",
      "VERSE",
      "CHORUS",
      "BREAKDOWN",
      "SOLO SECTION",
      "LOOP PRACTICE START",
      "LOOP PRACTICE END",
      "FINAL PRINT START",
      "FINAL PRINT END"
    ]);
  });

  it("lists and creates the Songwriter Lab preset", () => {
    expect(templatePresets).toContainEqual({
      id: "songwriter-lab",
      label: "Songwriter Lab"
    });

    const template = createTemplateFromPreset("songwriter-lab");

    expect(template.presetId).toBe("songwriter-lab");
    expect(template.name).toBe("Songwriter Lab");
    expect(template.sourceFormat).toBe("local guitar riff recording");
    expect(template.reminders).toContain("use the drum guide as a sketch, not final drums");
    expect(template.tracks.map((track) => track.name)).toEqual([
      "GUITAR IDEA",
      "DRUM SKETCH BUS",
      "KICK GUIDE",
      "SNARE GUIDE",
      "HAT / RIDE GUIDE",
      "CRASH / ACCENT GUIDE",
      "SONG STRUCTURE NOTES"
    ]);
    expect(template.tracks.find((track) => track.id === "kick-guide")?.masterSendEnabled).toBe(false);
    expect(template.markers.map((marker) => marker.name)).toEqual([
      "RIFF START",
      "IDEA VARIATION",
      "BIG PART",
      "BREAKDOWN OPTION"
    ]);
  });

  it("can switch presets while keeping song metadata", () => {
    const current = createDefaultTemplate();
    current.songName = "Actual Song";
    current.artist = "Actual Artist";
    current.tempo = 156;
    current.tuning = "Drop E";

    const next = createTemplateFromPresetWithMetadata("one-take-video-cover", current);

    expect(next.name).toBe("One-Take Video Cover");
    expect(next.songName).toBe("Actual Song");
    expect(next.artist).toBe("Actual Artist");
    expect(next.tempo).toBe(156);
    expect(next.tuning).toBe("Drop E");
    expect(next.sourceFormat).toBe("one-take camera + stereo output");
  });

  it("keeps song metadata when switching to Backing Track Creator", () => {
    const current = createDefaultTemplate();
    current.songName = "Jam Song";
    current.artist = "Jam Artist";
    current.tempo = 178;
    current.tuning = "Drop A#";
    current.sourceNotes = "Keep the album jam-track WAVs as the source of truth.";
    current.sourceWorkflow = "separate-stems";

    const next = createTemplateFromPresetWithMetadata("backing-track-creator", current);

    expect(next.name).toBe("Backing Track Creator");
    expect(next.songName).toBe("Jam Song");
    expect(next.artist).toBe("Jam Artist");
    expect(next.tempo).toBe(178);
    expect(next.tuning).toBe("Drop A#");
    expect(next.sourceWorkflow).toBe("separate-stems");
    expect(next.sourceNotes).toBe("Keep the album jam-track WAVs as the source of truth.");
    expect(next.outputMode).toBe("both");
    expect(next.sourceFormat).toBe("local backing/jam tracks, stems, or legal instrumental sources");
  });

  it("normalizes old templates without an output mode", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    const json = serializeTemplate(template);
    const parsedEnvelope = JSON.parse(json);
    delete parsedEnvelope.template.outputMode;

    const parsed = loadTemplateFromJson(JSON.stringify(parsedEnvelope));

    expect(parsed.outputMode).toBe("both");
  });

  it("uses the cover workflow when switching back to a cover template", () => {
    const current = createTemplateFromPreset("backing-track-creator");
    current.sourceWorkflow = "separate-stems";

    const next = createTemplateFromPresetWithMetadata("guitar-routing-cover", current);

    expect(next.sourceWorkflow).toBe("cover-template");
  });

  it("keeps preset metadata placeholders when the current fields are empty", () => {
    const current = createDefaultTemplate();

    const next = createTemplateFromPresetWithMetadata("one-take-video-cover", current);

    expect(next.songName).toBe("Song Name");
    expect(next.artist).toBe("Artist");
    expect(next.tuning).toBe("E Standard");
  });

  it("validates missing route targets before Lua generation", () => {
    const template = createDefaultTemplate();
    template.routes[0].toTrackId = "missing";

    expect(validateTemplate(template)).toContain(
      "Route guitar-amp-l-to-guitar-bus points to an unknown destination track."
    );
  });

  it("validates source asset target tracks when present", () => {
    const template = createTemplateFromPreset("backing-track-creator");
    template.sourceAssets[0].targetTrackId = "missing-track";

    expect(validateTemplate(template)).toContain(
      "Source asset Original reference points to an unknown target track."
    );
  });

  it("validates marker names and positions", () => {
    const template = createTemplateFromPreset("one-take-video-cover");
    template.markers[0].name = "";
    template.markers[1].positionSeconds = -1;

    expect(validateTemplate(template)).toContain("Every marker needs a name.");
    expect(validateTemplate(template)).toContain("Marker BEST RIFF position must be 0 seconds or later.");
  });

  it("loads templates with route warnings so the app can display them", () => {
    const template = createDefaultTemplate();
    template.routes[0].fromTrackId = "missing-track";

    const parsed = loadTemplateFromJson(serializeTemplate(template));

    expect(parsed.routes[0].fromTrackId).toBe("missing-track");
    expect(validateTemplate(parsed)).toContain(
      "Route guitar-amp-l-to-guitar-bus points to an unknown source track."
    );
  });

  it("clones templates without sharing nested arrays", () => {
    const template = createDefaultTemplate();
    const copy = cloneTemplate(template);

    copy.tracks[0].name = "Changed";

    expect(template.tracks[0].name).toBe("GUITAR BUS");
    expect(copy.tracks[0].name).toBe("Changed");
  });
});
