export type TemplatePresetId = "guitar-routing-cover" | "one-take-video-cover" | "backing-track-creator" | "songwriter-lab";

export type TrackRole = "input" | "amp" | "bus" | "fx" | "reference" | "print";

export type ReaperInputMode = "mono" | "stereo" | "none";

export type SendMode = "post-fader" | "pre-fader" | "post-fx";

export type SourceAssetKind = "local-file" | "reference-link";

export type SourceWorkflow = "cover-template" | "full-mix-reference" | "no-guitar-track" | "separate-stems";

export type TemplateOutputMode = "reaper-import" | "audio-file" | "both";

export interface TrackTemplate {
  id: string;
  name: string;
  role: TrackRole;
  color: string;
  recordArm: boolean;
  inputMode: ReaperInputMode;
  inputChannel: number;
  folderDepth: number;
  notes: string;
  masterSendEnabled: boolean;
}

export interface RouteTemplate {
  id: string;
  fromTrackId: string;
  toTrackId: string;
  sendMode: SendMode;
  volumeDb: number;
  pan: number;
}

export interface ProjectMarkerTemplate {
  id: string;
  name: string;
  positionSeconds: number;
}

export interface SourceAssetTemplate {
  id: string;
  label: string;
  kind: SourceAssetKind;
  targetTrackId: string;
  fileName: string;
  filePath: string;
  sourceUrl: string;
  notes: string;
}

export interface GuitarWorkflowTemplate {
  schemaVersion: 1;
  presetId: TemplatePresetId;
  name: string;
  description: string;
  songName: string;
  artist: string;
  sourceFormat: string;
  sourceWorkflow: SourceWorkflow;
  sourceNotes: string;
  outputMode: TemplateOutputMode;
  sourceAssets: SourceAssetTemplate[];
  reminders: string[];
  tuning: string;
  tempo: number;
  tracks: TrackTemplate[];
  routes: RouteTemplate[];
  markers: ProjectMarkerTemplate[];
}

interface JsonEnvelope {
  app: "guitar-workflow-toolkit";
  template: GuitarWorkflowTemplate;
}

export function createDefaultTemplate(): GuitarWorkflowTemplate {
  return createTemplateFromPreset("guitar-routing-cover");
}

export const templatePresets: Array<{ id: TemplatePresetId; label: string }> = [
  { id: "guitar-routing-cover", label: "Guitar Routing Cover" },
  { id: "one-take-video-cover", label: "One-Take Video Cover" },
  { id: "backing-track-creator", label: "Backing Track Creator" },
  { id: "songwriter-lab", label: "Songwriter Lab" }
];

export function createTemplateFromPreset(presetId: TemplatePresetId): GuitarWorkflowTemplate {
  if (presetId === "songwriter-lab") {
    return createSongwriterLabTemplate();
  }

  if (presetId === "one-take-video-cover") {
    return createOneTakeVideoCoverTemplate();
  }

  if (presetId === "backing-track-creator") {
    return createBackingTrackCreatorTemplate();
  }

  return createGuitarRoutingCoverTemplate();
}

export function createTemplateFromPresetWithMetadata(
  presetId: TemplatePresetId,
  current: GuitarWorkflowTemplate
): GuitarWorkflowTemplate {
  const next = createTemplateFromPreset(presetId);
  const currentSourceWorkflow = normalizeSourceWorkflow(current.sourceWorkflow);

  return {
    ...next,
    songName: current.songName.trim() ? current.songName : next.songName,
    artist: current.artist.trim() ? current.artist : next.artist,
    sourceWorkflow:
      presetId === "backing-track-creator" && currentSourceWorkflow !== "cover-template"
        ? currentSourceWorkflow
        : next.sourceWorkflow,
    sourceNotes: current.sourceNotes.trim() ? current.sourceNotes : next.sourceNotes,
    outputMode:
      presetId === "backing-track-creator" && current.presetId === "backing-track-creator"
        ? normalizeOutputMode(current.outputMode, presetId)
        : next.outputMode,
    tuning: current.tuning.trim() ? current.tuning : next.tuning,
    tempo: Number.isFinite(current.tempo) ? current.tempo : next.tempo
  };
}

function createGuitarRoutingCoverTemplate(): GuitarWorkflowTemplate {
  return {
    schemaVersion: 1,
    presetId: "guitar-routing-cover",
    name: "Guitar Cover Session",
    description: "A compact REAPER setup for recording guitar covers.",
    songName: "",
    artist: "",
    sourceFormat: "guitar plugin prints + backing track",
    sourceWorkflow: "cover-template",
    sourceNotes: "",
    outputMode: "reaper-import",
    sourceAssets: [],
    reminders: [],
    tuning: "E Standard",
    tempo: 120,
    tracks: [
      createTrack("guitar-bus", "GUITAR BUS", "bus", "#5aa9e6", false, "none", 1, 1, "Main bus for all guitar layers."),
      createTrack("guitar-amp-l", "GUITAR AMP L", "amp", "#50c878", true, "mono", 1, 0, "Left rhythm amp track."),
      createTrack("guitar-amp-r", "GUITAR AMP R", "amp", "#50c878", true, "mono", 2, 0, "Right rhythm amp track."),
      createTrack("lead-guitar", "LEAD GUITAR", "input", "#c77dff", false, "mono", 3, 0, "Lead guitar overdubs."),
      createTrack("clean-ambient-guitar", "CLEAN / AMBIENT GUITAR", "fx", "#ff6f91", false, "mono", 4, -1, "Clean, delay, and ambient guitar layers."),
      createTrack("backing-bus", "BACKING BUS", "bus", "#f3b64b", false, "none", 1, 1, "Bus for backing track material."),
      createTrack("backing-track", "BACKING TRACK", "reference", "#8bd3dd", false, "stereo", 1, -1, "Imported backing track.")
    ],
    routes: [
      createRoute("guitar-amp-l-to-guitar-bus", "guitar-amp-l", "guitar-bus", "post-fader", 0, -1),
      createRoute("guitar-amp-r-to-guitar-bus", "guitar-amp-r", "guitar-bus", "post-fader", 0, 1),
      createRoute("lead-guitar-to-guitar-bus", "lead-guitar", "guitar-bus", "post-fader", -3, 0),
      createRoute("clean-ambient-guitar-to-guitar-bus", "clean-ambient-guitar", "guitar-bus", "post-fader", -6, 0),
      createRoute("backing-track-to-backing-bus", "backing-track", "backing-bus", "post-fader", 0, 0)
    ],
    markers: []
  };
}

function createOneTakeVideoCoverTemplate(): GuitarWorkflowTemplate {
  return {
    schemaVersion: 1,
    presetId: "one-take-video-cover",
    name: "One-Take Video Cover",
    description: "A REAPER setup for one-take guitar cover videos with camera sync audio and stereo backing/plugin output.",
    songName: "Song Name",
    artist: "Artist",
    sourceFormat: "one-take camera + stereo output",
    sourceWorkflow: "cover-template",
    sourceNotes: "",
    outputMode: "reaper-import",
    sourceAssets: [],
    reminders: ["mute camera audio after sync", "export 16:9 full video and 9:16 Shorts version"],
    tuning: "E Standard",
    tempo: 120,
    tracks: [
      createTrack("video-reference", "VIDEO REFERENCE", "reference", "#94a3b8", false, "none", 1, 0, "Camera footage reference."),
      createTrack("camera-audio-sync", "CAMERA AUDIO SYNC", "reference", "#f97316", false, "stereo", 1, 0, "Camera audio for sync only.", false),
      createTrack("stereo-output-songsterr-print", "STEREO OUTPUT / SONGSTERR PRINT", "print", "#5aa9e6", false, "stereo", 1, 0, "Stereo output from plugins, Songsterr, or backing."),
      createTrack("guitar-live-print", "GUITAR LIVE PRINT", "print", "#50c878", false, "mono", 1, 0, "Main one-take guitar print."),
      createTrack("extra-guitar-layer", "EXTRA GUITAR LAYER", "print", "#c77dff", false, "mono", 2, 0, "Optional extra guitar layer."),
      createTrack("fx-impacts", "FX / IMPACTS", "fx", "#ff6f91", false, "stereo", 1, 0, "Impacts, risers, transitions, or extra FX."),
      createTrack("final-master-print", "FINAL MASTER PRINT", "bus", "#f3b64b", false, "none", 1, 0, "Final full mix print that remains routed to master."),
      createTrack("shorts-export-print", "SHORTS EXPORT PRINT", "print", "#22c55e", false, "none", 1, 0, "9:16 Shorts export print target."),
      createTrack("full-video-export-print", "FULL VIDEO EXPORT PRINT", "print", "#38bdf8", false, "none", 1, 0, "16:9 full video export print target.")
    ],
    routes: [
      createRoute("stereo-output-to-final-master", "stereo-output-songsterr-print", "final-master-print", "post-fader", 0, 0),
      createRoute("guitar-live-to-final-master", "guitar-live-print", "final-master-print", "post-fader", 0, 0),
      createRoute("extra-guitar-to-final-master", "extra-guitar-layer", "final-master-print", "post-fader", -6, 0),
      createRoute("fx-impacts-to-final-master", "fx-impacts", "final-master-print", "post-fader", -9, 0)
    ],
    markers: [
      createMarker("start", "START", 0),
      createMarker("best-riff", "BEST RIFF", 30),
      createMarker("breakdown", "BREAKDOWN", 60),
      createMarker("chorus-big-part", "CHORUS / BIG PART", 90),
      createMarker("shorts-clip-1-start", "SHORTS CLIP 1 START", 120),
      createMarker("shorts-clip-1-end", "SHORTS CLIP 1 END", 150),
      createMarker("full-video-start", "FULL VIDEO START", 0),
      createMarker("full-video-end", "FULL VIDEO END", 210)
    ]
  };
}

function createSongwriterLabTemplate(): GuitarWorkflowTemplate {
  return {
    schemaVersion: 1,
    presetId: "songwriter-lab",
    name: "Songwriter Lab",
    description: "A local guitar idea sketcher for turning riff rhythm into drum guides and song sections.",
    songName: "New Guitar Idea",
    artist: "Artist",
    sourceFormat: "local guitar riff recording",
    sourceWorkflow: "cover-template",
    sourceNotes: "Import a guitar riff, analyze the attacks, and create a drum/structure sketch.",
    outputMode: "reaper-import",
    sourceAssets: [],
    reminders: [
      "use the drum guide as a sketch, not final drums",
      "tighten sections after playing them on guitar",
      "replace generated guide items with real drums or MIDI later"
    ],
    tuning: "E Standard",
    tempo: 120,
    tracks: [
      createTrack("guitar-idea", "GUITAR IDEA", "reference", "#50c878", false, "stereo", 1, 0, "Imported guitar riff source."),
      createTrack("drum-sketch-bus", "DRUM SKETCH BUS", "bus", "#f3b64b", false, "none", 1, 0, "Bus for visual drum guide tracks."),
      createTrack("kick-guide", "KICK GUIDE", "reference", "#ef4444", false, "none", 1, 0, "Visual kick guide from guitar rhythm.", false),
      createTrack("snare-guide", "SNARE GUIDE", "reference", "#f97316", false, "none", 1, 0, "Visual snare guide from guitar accents.", false),
      createTrack("hat-guide", "HAT / RIDE GUIDE", "reference", "#38bdf8", false, "none", 1, 0, "Visual hat/ride guide from smaller guitar attacks.", false),
      createTrack("crash-guide", "CRASH / ACCENT GUIDE", "reference", "#c77dff", false, "none", 1, 0, "Visual crash and section accent guide.", false),
      createTrack("song-structure", "SONG STRUCTURE NOTES", "print", "#f8fafc", false, "none", 1, 0, "Markers and notes for arranging the idea.")
    ],
    routes: [],
    markers: [
      createMarker("riff-start", "RIFF START", 0),
      createMarker("idea-variation", "IDEA VARIATION", 30),
      createMarker("big-part", "BIG PART", 60),
      createMarker("breakdown-option", "BREAKDOWN OPTION", 90)
    ]
  };
}

function createBackingTrackCreatorTemplate(): GuitarWorkflowTemplate {
  return {
    schemaVersion: 1,
    presetId: "backing-track-creator",
    name: "Backing Track Creator",
    description: "A REAPER setup for preparing no-guitar backing tracks from local jam tracks, stems, and legal sources.",
    songName: "Song Name",
    artist: "Artist",
    sourceFormat: "local backing/jam tracks, stems, or legal instrumental sources",
    sourceWorkflow: "no-guitar-track",
    sourceNotes: "Drop in local jam tracks, no-guitar exports, or stems you have permission to use.",
    outputMode: "both",
    sourceAssets: [
      createSourceAsset("original-reference-source", "Original reference", "local-file", "original-reference"),
      createSourceAsset("camera-phone-sync-source", "Camera/phone sync audio", "local-file", "camera-phone-sync-audio"),
      createSourceAsset("main-backing-source", "Main backing track", "local-file", "backing-track-main"),
      createSourceAsset("no-guitar-backing-source", "No-guitar backing track", "local-file", "backing-track-no-guitar"),
      createSourceAsset("drums-percussion-source", "Drums/percussion stem", "local-file", "drums-percussion-stem"),
      createSourceAsset("bass-stem-source", "Bass stem", "local-file", "bass-stem"),
      createSourceAsset("vocals-lead-source", "Vocals/lead stem", "local-file", "vocals-lead-stem"),
      createSourceAsset("synths-extra-source", "Synths/extra stems", "local-file", "synths-extra-stems"),
      createSourceAsset("click-count-in-source", "Click/count-in", "local-file", "click-count-in")
    ],
    reminders: [
      "use audio you own or have permission to use",
      "mute original reference and camera sync after alignment",
      "keep guitar guide/practice bus out of final backing print",
      "export FINAL BACKING PRINT as the no-guitar practice track",
      "mark loop sections before exporting practice clips"
    ],
    tuning: "E Standard",
    tempo: 120,
    tracks: [
      createTrack("original-reference", "ORIGINAL REFERENCE", "reference", "#94a3b8", false, "stereo", 1, 0, "Full song reference for alignment only.", false),
      createTrack(
        "camera-phone-sync-audio",
        "CAMERA / PHONE SYNC AUDIO",
        "reference",
        "#f97316",
        false,
        "stereo",
        1,
        0,
        "Optional phone or camera audio for timing checks only.",
        false
      ),
      createTrack("backing-track-main", "BACKING TRACK MAIN", "print", "#5aa9e6", false, "stereo", 1, 0, "Main jam track, Songsterr print, or plugin output source."),
      createTrack("backing-track-no-guitar", "BACKING TRACK NO GUITAR", "print", "#22c55e", false, "stereo", 1, 0, "Preferred no-guitar backing track source."),
      createTrack("drums-percussion-stem", "DRUMS / PERCUSSION STEM", "print", "#ef4444", false, "stereo", 1, 0, "Drums, percussion, or rhythm stem."),
      createTrack("bass-stem", "BASS STEM", "print", "#a3e635", false, "stereo", 1, 0, "Bass stem for the backing mix."),
      createTrack("vocals-lead-stem", "VOCALS / LEAD STEM", "print", "#c77dff", false, "stereo", 1, 0, "Vocals or lead non-guitar stem."),
      createTrack("synths-extra-stems", "SYNTHS / EXTRA STEMS", "print", "#38bdf8", false, "stereo", 1, 0, "Synths, pads, FX, and extra non-guitar stems."),
      createTrack("click-count-in", "CLICK / COUNT-IN", "reference", "#facc15", false, "stereo", 1, 0, "Practice count-in or click source."),
      createTrack("backing-bus", "BACKING BUS", "bus", "#f3b64b", false, "none", 1, 0, "Main bus for all backing-track sources.", false),
      createTrack("guitar-practice-bus", "GUITAR PRACTICE BUS", "bus", "#50c878", false, "none", 1, 0, "Practice-only guide bus. Keep out of the final backing print.", false),
      createTrack("final-backing-print", "FINAL BACKING PRINT", "print", "#f8fafc", false, "none", 1, 0, "Record or render the final no-guitar backing track from this print target.")
    ],
    routes: [
      createRoute("backing-track-main-to-backing-bus", "backing-track-main", "backing-bus", "post-fader", -6, 0),
      createRoute("backing-track-no-guitar-to-backing-bus", "backing-track-no-guitar", "backing-bus", "post-fader", 0, 0),
      createRoute("drums-percussion-stem-to-backing-bus", "drums-percussion-stem", "backing-bus", "post-fader", 0, 0),
      createRoute("bass-stem-to-backing-bus", "bass-stem", "backing-bus", "post-fader", 0, 0),
      createRoute("vocals-lead-stem-to-backing-bus", "vocals-lead-stem", "backing-bus", "post-fader", -3, 0),
      createRoute("synths-extra-stems-to-backing-bus", "synths-extra-stems", "backing-bus", "post-fader", -3, 0),
      createRoute("click-count-in-to-guitar-practice-bus", "click-count-in", "guitar-practice-bus", "post-fader", -9, 0),
      createRoute("backing-bus-to-final-backing-print", "backing-bus", "final-backing-print", "post-fader", 0, 0)
    ],
    markers: [
      createMarker("start", "START", 0),
      createMarker("intro", "INTRO", 0),
      createMarker("verse", "VERSE", 30),
      createMarker("chorus", "CHORUS", 60),
      createMarker("breakdown", "BREAKDOWN", 90),
      createMarker("solo-section", "SOLO SECTION", 120),
      createMarker("loop-practice-start", "LOOP PRACTICE START", 120),
      createMarker("loop-practice-end", "LOOP PRACTICE END", 150),
      createMarker("final-print-start", "FINAL PRINT START", 0),
      createMarker("final-print-end", "FINAL PRINT END", 210)
    ]
  };
}

export function createTrack(
  id: string,
  name: string,
  role: TrackRole,
  color: string,
  recordArm = false,
  inputMode: ReaperInputMode = "none",
  inputChannel = 1,
  folderDepth = 0,
  notes = "",
  masterSendEnabled = true
): TrackTemplate {
  return {
    id,
    name,
    role,
    color,
    recordArm,
    inputMode,
    inputChannel,
    folderDepth,
    notes,
    masterSendEnabled
  };
}

export function createRoute(
  id: string,
  fromTrackId: string,
  toTrackId: string,
  sendMode: SendMode = "post-fader",
  volumeDb = 0,
  pan = 0
): RouteTemplate {
  return {
    id,
    fromTrackId,
    toTrackId,
    sendMode,
    volumeDb,
    pan
  };
}

export function createMarker(id: string, name: string, positionSeconds: number): ProjectMarkerTemplate {
  return {
    id,
    name,
    positionSeconds
  };
}

export function createSourceAsset(
  id: string,
  label: string,
  kind: SourceAssetKind = "local-file",
  targetTrackId = "",
  fileName = "",
  filePath = "",
  sourceUrl = "",
  notes = ""
): SourceAssetTemplate {
  return {
    id,
    label,
    kind,
    targetTrackId,
    fileName,
    filePath,
    sourceUrl,
    notes
  };
}

export function cloneTemplate(template: GuitarWorkflowTemplate): GuitarWorkflowTemplate {
  return JSON.parse(JSON.stringify(template)) as GuitarWorkflowTemplate;
}

export function serializeTemplate(template: GuitarWorkflowTemplate): string {
  const envelope: JsonEnvelope = {
    app: "guitar-workflow-toolkit",
    template
  };

  return JSON.stringify(envelope, null, 2);
}

export function loadTemplateFromJson(json: string): GuitarWorkflowTemplate {
  const parsed = JSON.parse(json) as unknown;
  const candidate = isTemplateEnvelope(parsed) ? parsed.template : parsed;

  if (!isTemplate(candidate)) {
    throw new Error("Unsupported or missing guitar workflow template schema version.");
  }

  const template = normalizeTemplate(candidate);

  return template;
}

function isTemplateEnvelope(value: unknown): value is JsonEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "app" in value &&
    "template" in value &&
    (value as JsonEnvelope).app === "guitar-workflow-toolkit"
  );
}

function isTemplate(value: unknown): value is GuitarWorkflowTemplate {
  return typeof value === "object" && value !== null && (value as GuitarWorkflowTemplate).schemaVersion === 1;
}

function normalizeTemplate(template: GuitarWorkflowTemplate): GuitarWorkflowTemplate {
  const copy = cloneTemplate(template);

  return {
    ...copy,
    presetId: copy.presetId ?? "guitar-routing-cover",
    songName: typeof copy.songName === "string" ? copy.songName : "",
    artist: typeof copy.artist === "string" ? copy.artist : "",
    sourceFormat: typeof copy.sourceFormat === "string" ? copy.sourceFormat : "",
    sourceWorkflow: normalizeSourceWorkflow(copy.sourceWorkflow),
    sourceNotes: typeof copy.sourceNotes === "string" ? copy.sourceNotes : "",
    outputMode: normalizeOutputMode(copy.outputMode, copy.presetId),
    sourceAssets: Array.isArray(copy.sourceAssets)
      ? copy.sourceAssets.map((source) => ({
          ...source,
          kind: source.kind === "reference-link" ? "reference-link" : "local-file",
          targetTrackId: typeof source.targetTrackId === "string" ? source.targetTrackId : "",
          fileName: typeof source.fileName === "string" ? source.fileName : "",
          filePath: typeof source.filePath === "string" ? source.filePath : "",
          sourceUrl: typeof source.sourceUrl === "string" ? source.sourceUrl : "",
          notes: typeof source.notes === "string" ? source.notes : ""
        }))
      : [],
    reminders: Array.isArray(copy.reminders) ? copy.reminders : [],
    tuning: typeof copy.tuning === "string" ? copy.tuning : "E Standard",
    markers: Array.isArray(copy.markers) ? copy.markers : [],
    tracks: copy.tracks.map((track) => ({
      ...track,
      masterSendEnabled: typeof track.masterSendEnabled === "boolean" ? track.masterSendEnabled : true
    }))
  };
}

function normalizeSourceWorkflow(value: unknown): SourceWorkflow {
  if (value === "full-mix-reference" || value === "no-guitar-track" || value === "separate-stems") {
    return value;
  }

  return "cover-template";
}

function normalizeOutputMode(value: unknown, presetId?: TemplatePresetId): TemplateOutputMode {
  if (value === "audio-file" || value === "both") {
    return value;
  }

  if (presetId === "backing-track-creator") {
    return "both";
  }

  return "reaper-import";
}

export function validateTemplate(template: GuitarWorkflowTemplate): string[] {
  const errors: string[] = [];
  const trackIds = new Set<string>();

  if (!template.name.trim()) {
    errors.push("Template name is required.");
  }

  if (!Number.isFinite(template.tempo) || template.tempo < 20 || template.tempo > 300) {
    errors.push("Tempo must be between 20 and 300 BPM.");
  }

  for (const track of template.tracks) {
    if (!track.id.trim()) {
      errors.push("Every track needs an id.");
    }

    if (trackIds.has(track.id)) {
      errors.push(`Track id ${track.id} is duplicated.`);
    }

    trackIds.add(track.id);

    if (!track.name.trim()) {
      errors.push(`Track ${track.id} needs a name.`);
    }

    if (!/^#[0-9a-f]{6}$/i.test(track.color)) {
      errors.push(`Track ${track.id} needs a hex color like #50c878.`);
    }

    if (track.inputChannel < 1 || track.inputChannel > 64) {
      errors.push(`Track ${track.id} input channel must be between 1 and 64.`);
    }

    if (track.folderDepth < -1 || track.folderDepth > 1) {
      errors.push(`Track ${track.id} folder depth must be -1, 0, or 1.`);
    }
  }

  const routeIds = new Set<string>();

  for (const route of template.routes) {
    if (!route.id.trim()) {
      errors.push("Every route needs an id.");
    }

    if (routeIds.has(route.id)) {
      errors.push(`Route id ${route.id} is duplicated.`);
    }

    routeIds.add(route.id);

    if (!trackIds.has(route.fromTrackId)) {
      errors.push(`Route ${route.id} points to an unknown source track.`);
    }

    if (!trackIds.has(route.toTrackId)) {
      errors.push(`Route ${route.id} points to an unknown destination track.`);
    }

    if (route.fromTrackId === route.toTrackId) {
      errors.push(`Route ${route.id} cannot send a track to itself.`);
    }

    if (route.pan < -1 || route.pan > 1) {
      errors.push(`Route ${route.id} pan must be between -1 and 1.`);
    }
  }

  for (const marker of template.markers) {
    if (!marker.name.trim()) {
      errors.push("Every marker needs a name.");
    }

    if (!Number.isFinite(marker.positionSeconds) || marker.positionSeconds < 0) {
      const markerName = marker.name.trim() || marker.id;
      errors.push(`Marker ${markerName} position must be 0 seconds or later.`);
    }
  }

  const sourceAssetIds = new Set<string>();

  for (const source of template.sourceAssets) {
    if (!source.id.trim()) {
      errors.push("Every source asset needs an id.");
    }

    if (sourceAssetIds.has(source.id)) {
      errors.push(`Source asset id ${source.id} is duplicated.`);
    }

    sourceAssetIds.add(source.id);

    if (!source.label.trim()) {
      errors.push(`Source asset ${source.id} needs a label.`);
    }

    if (source.targetTrackId && !trackIds.has(source.targetTrackId)) {
      const sourceName = source.label.trim() || source.id;
      errors.push(`Source asset ${sourceName} points to an unknown target track.`);
    }
  }

  return errors;
}
