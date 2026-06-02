import {
  GuitarWorkflowTemplate,
  RouteTemplate,
  SendMode,
  SourceAssetTemplate,
  TemplateOutputMode,
  TrackTemplate,
  validateTemplate
} from "./template";

const sendModeFlags: Record<SendMode, number> = {
  "post-fader": 0,
  "pre-fader": 3,
  "post-fx": 1
};

const outputModeLabels: Record<TemplateOutputMode, string> = {
  "reaper-import": "REAPER import session",
  "audio-file": "Final audio file via REAPER render",
  both: "REAPER import session + final audio file"
};

export function generateReaperLua(template: GuitarWorkflowTemplate): string {
  const errors = validateTemplate(template);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const projectNotes = projectNoteLines(template).join("\n");
  const lines = [
    "-- Guitar Workflow Toolkit",
    `-- Template: ${singleLineComment(template.name)}`,
    `-- Song: ${singleLineComment(template.songName || "Untitled")}`,
    `-- Artist: ${singleLineComment(template.artist || "Unknown artist")}`,
    `-- BPM: ${numberLiteral(template.tempo)}`,
    `-- Tuning: ${singleLineComment(template.tuning)}`,
    `-- Source workflow: ${singleLineComment(template.sourceWorkflow)}`,
    `-- Source format: ${singleLineComment(template.sourceFormat || "not specified")}`,
    `-- Output mode: ${singleLineComment(outputModeLabels[template.outputMode])}`,
    ...(template.sourceNotes.trim() ? [`-- Source notes: ${singleLineComment(template.sourceNotes)}`] : []),
    ...template.reminders.map((reminder) => `-- Reminder: ${singleLineComment(reminder)}`),
    "-- Generated locally. Review before running in REAPER.",
    "",
    "reaper.Undo_BeginBlock()",
    "reaper.PreventUIRefresh(1)",
    "",
    "local trackMap = {}",
    "",
    "local function setTrackName(track, name)",
    "  reaper.GetSetMediaTrackInfo_String(track, \"P_NAME\", name, true)",
    "end",
    "",
    "local function hexToNativeColor(hex)",
    "  local value = hex:gsub(\"#\", \"\")",
    "  local r = tonumber(value:sub(1, 2), 16) or 255",
    "  local g = tonumber(value:sub(3, 4), 16) or 255",
    "  local b = tonumber(value:sub(5, 6), 16) or 255",
    "  return reaper.ColorToNative(r, g, b) | 0x1000000",
    "end",
    "",
    `reaper.SetCurrentBPM(0, ${numberLiteral(template.tempo)}, false)`,
    `local projectNotes = "${escapeLuaString(projectNotes)}"`,
    "reaper.GetSetProjectNotes(0, true, projectNotes)",
    `reaper.AddProjectMarker2(0, false, 0, 0, "Tuning: ${escapeLuaString(template.tuning)}", -1, 0)`,
    ""
  ];

  template.markers.forEach((marker) => {
    lines.push(
      `-- Marker: ${singleLineComment(marker.name)}`,
      `reaper.AddProjectMarker2(0, false, ${numberLiteral(marker.positionSeconds)}, 0, "${escapeLuaString(marker.name)}", -1, 0)`,
      ""
    );
  });

  const trackById = new Map(template.tracks.map((track) => [track.id, track]));

  template.tracks.forEach((track, index) => {
    lines.push(...trackLines(track, index));
  });

  template.sourceAssets.forEach((source) => {
    lines.push(...sourceAssetLines(source, trackById));
  });

  lines.push(...masterSendLines(template, trackById));

  template.routes.forEach((route) => {
    lines.push(...routeLines(route, trackById));
  });

  if (template.outputMode === "audio-file" || template.outputMode === "both") {
    lines.push(...renderSetupLines(template));
  }

  lines.push(
    "reaper.TrackList_AdjustWindows(false)",
    "reaper.UpdateArrange()",
    "reaper.PreventUIRefresh(-1)",
    `reaper.Undo_EndBlock("Create guitar workflow template: ${escapeLuaString(template.name)}", -1)`,
    ""
  );

  return lines.join("\n");
}

function sourceAssetLines(source: SourceAssetTemplate, trackById: Map<string, TrackTemplate>): string[] {
  const target = trackById.get(source.targetTrackId);
  const lines = [
    `-- Source asset: ${singleLineComment(source.label)}`,
    `-- Source kind: ${source.kind}`,
    `-- Target track: ${singleLineComment(target?.name ?? (source.targetTrackId || "not assigned"))}`
  ];

  if (source.fileName.trim()) {
    lines.push(`-- Source file: ${singleLineComment(source.fileName)}`);
  }

  if (source.sourceUrl.trim()) {
    lines.push(`-- Source link reference: ${singleLineComment(source.sourceUrl)}`);
  }

  if (source.notes.trim()) {
    lines.push(`-- Source notes: ${singleLineComment(source.notes)}`);
  }

  if (source.filePath.trim() && source.targetTrackId.trim()) {
    lines.push(
      `-- Import source media onto ${singleLineComment(target?.name ?? source.targetTrackId)} at project start.`,
      `reaper.SetOnlyTrackSelected(trackMap["${escapeLuaString(source.targetTrackId)}"])`,
      "reaper.SetEditCurPos(0, false, false)",
      `reaper.InsertMedia("${escapeLuaString(source.filePath)}", 0)`
    );
  } else if (source.filePath.trim()) {
    lines.push("-- Local file path is set, but no target track is assigned, so media import is skipped.");
  } else {
    lines.push("-- No local file path stored for this source yet.");
  }

  lines.push("");

  return lines;
}

function trackLines(track: TrackTemplate, index: number): string[] {
  const recordArm = track.recordArm ? 1 : 0;
  const monitor = track.recordArm ? 1 : 0;
  const input = inputValue(track);

  return [
    `-- Track: ${singleLineComment(track.name)}`,
    `reaper.InsertTrackAtIndex(${index}, true)`,
    `local track = reaper.GetTrack(0, ${index})`,
    `trackMap["${escapeLuaString(track.id)}"] = track`,
    `setTrackName(track, "${escapeLuaString(track.name)}")`,
    `reaper.SetTrackColor(track, hexToNativeColor("${escapeLuaString(track.color)}"))`,
    `reaper.SetMediaTrackInfo_Value(track, "I_RECARM", ${recordArm})`,
    `reaper.SetMediaTrackInfo_Value(track, "I_RECMON", ${monitor})`,
    `reaper.SetMediaTrackInfo_Value(track, "I_RECINPUT", ${input})`,
    `reaper.SetMediaTrackInfo_Value(track, "I_FOLDERDEPTH", ${track.folderDepth})`,
    ""
  ];
}

function masterSendLines(template: GuitarWorkflowTemplate, trackById: Map<string, TrackTemplate>): string[] {
  const disabledSourceIds = new Set<string>();
  const lines: string[] = [];

  for (const route of template.routes) {
    const source = trackById.get(route.fromTrackId);
    const destination = trackById.get(route.toTrackId);

    if (!source || !destination || destination.role !== "bus" || disabledSourceIds.has(source.id)) {
      continue;
    }

    disabledSourceIds.add(source.id);
    lines.push(
      `-- Disable master send on ${singleLineComment(source.name)} because it is routed to ${singleLineComment(destination.name)}.`,
      `reaper.SetMediaTrackInfo_Value(trackMap["${escapeLuaString(source.id)}"], "B_MAINSEND", 0)`,
      ""
    );
  }

  for (const track of template.tracks) {
    if (track.masterSendEnabled || disabledSourceIds.has(track.id)) {
      continue;
    }

    disabledSourceIds.add(track.id);
    lines.push(
      `-- Disable master send on ${singleLineComment(track.name)} by template default.`,
      `reaper.SetMediaTrackInfo_Value(trackMap["${escapeLuaString(track.id)}"], "B_MAINSEND", 0)`,
      ""
    );
  }

  return lines;
}

function routeLines(route: RouteTemplate, trackById: Map<string, TrackTemplate>): string[] {
  const source = trackById.get(route.fromTrackId);
  const destination = trackById.get(route.toTrackId);
  const sourceName = singleLineComment(source?.name ?? route.fromTrackId);
  const destinationName = singleLineComment(destination?.name ?? route.toTrackId);

  return [
    `-- Routing: ${sourceName} -> ${destinationName}`,
    `-- Creates an explicit send and keeps the routed child out of the master mix.`,
    `local sendIndex = reaper.CreateTrackSend(trackMap["${escapeLuaString(route.fromTrackId)}"], trackMap["${escapeLuaString(route.toTrackId)}"])`,
    `reaper.SetTrackSendInfo_Value(trackMap["${escapeLuaString(route.fromTrackId)}"], 0, sendIndex, "I_SENDMODE", ${sendModeFlags[route.sendMode]})`,
    `reaper.SetTrackSendInfo_Value(trackMap["${escapeLuaString(route.fromTrackId)}"], 0, sendIndex, "D_VOL", ${dbToAmplitude(route.volumeDb)})`,
    `reaper.SetTrackSendInfo_Value(trackMap["${escapeLuaString(route.fromTrackId)}"], 0, sendIndex, "D_PAN", ${numberLiteral(route.pan)})`,
    ""
  ];
}

function renderSetupLines(template: GuitarWorkflowTemplate): string[] {
  const renderPattern = renderPatternName(template);

  return [
    "-- Render setup: final backing track file",
    "-- REAPER will render the master mix fed by FINAL BACKING PRINT.",
    'local renderDirectory = reaper.GetResourcePath() .. "/Guitar Workflow Toolkit Renders"',
    "if reaper.RecursiveCreateDirectory then",
    "  reaper.RecursiveCreateDirectory(renderDirectory, 0)",
    "end",
    'reaper.GetSetProjectInfo_String(0, "RENDER_FILE", renderDirectory, true)',
    `reaper.GetSetProjectInfo_String(0, "RENDER_PATTERN", "${escapeLuaString(renderPattern)}", true)`,
    'reaper.GetSetProjectInfo(0, "RENDER_SETTINGS", 0, true)',
    'reaper.GetSetProjectInfo(0, "RENDER_BOUNDSFLAG", 1, true)',
    'reaper.GetSetProjectInfo(0, "RENDER_CHANNELS", 2, true)',
    'reaper.GetSetProjectInfo(0, "RENDER_SRATE", 48000, true)',
    'reaper.GetSetProjectInfo_String(0, "RENDER_FORMAT", "evaw", true)',
    'reaper.GetSetProjectInfo(0, "RENDER_ADDTOPROJ", 0, true)',
    `reaper.ShowConsoleMsg("Backing track render setup ready: " .. renderDirectory .. "/${escapeLuaString(renderPattern)}.wav\\nOpen File > Render to create the audio file.\\n")`,
    ""
  ];
}

function inputValue(track: TrackTemplate): number {
  if (track.inputMode === "none") {
    return -1;
  }

  const channel = Math.max(1, Math.floor(track.inputChannel));

  if (track.inputMode === "mono") {
    return channel - 1;
  }

  return 1024 + channel - 1;
}

function dbToAmplitude(db: number): string {
  return numberLiteral(Math.pow(10, db / 20));
}

function projectNoteLines(template: GuitarWorkflowTemplate): string[] {
  return [
    `Song: ${singleLineComment(template.songName || "Untitled")}`,
    `Artist: ${singleLineComment(template.artist || "Unknown artist")}`,
    `BPM: ${numberLiteral(template.tempo)}`,
    `Tuning: ${singleLineComment(template.tuning)}`,
    `Source workflow: ${singleLineComment(template.sourceWorkflow)}`,
    `Source format: ${singleLineComment(template.sourceFormat || "not specified")}`,
    `Output mode: ${singleLineComment(outputModeLabels[template.outputMode])}`,
    ...(template.sourceNotes.trim() ? [`Source notes: ${singleLineComment(template.sourceNotes)}`] : []),
    ...template.reminders.map((reminder) => `Reminder: ${singleLineComment(reminder)}`)
  ];
}

function renderPatternName(template: GuitarWorkflowTemplate): string {
  return cleanFileName(`${template.songName || template.name || "backing-track"}-backing-track`);
}

function cleanFileName(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "backing-track";
}

function numberLiteral(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function escapeLuaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}

function singleLineComment(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
