import { ExportBundle, createPluginManifestJson } from "./exportBundle";

export type SongwriterMode = "rhythm-to-drums" | "continue-song" | "both";

export type SongwriterFeel = "metalcore" | "breakdown" | "ambient";

export type RiffRole = "main-riff" | "verse" | "chorus" | "breakdown" | "bridge" | "intro";

export type DrumPatternPreset = "follow-riff" | "half-time-breakdown" | "chorus-drive" | "ambient-build";

export type DrumVoice = "kick" | "snare" | "hat" | "crash";

export type DrumGrooveCategory = "djent" | "thall" | "metalcore" | "ambient" | "odd-feel";

export interface DrumGroove {
  id: string;
  name: string;
  category: DrumGrooveCategory;
  tempoMin: number;
  tempoMax: number;
  bars: number;
  description: string;
  steps: Record<DrumVoice, number[]>;
}

export type WhammyCurve = "linear" | "fast-rise" | "slow-fall";

export type AmbientEffectType =
  | "reverse-swell"
  | "granular-freeze"
  | "shimmer-cloud"
  | "wide-delay"
  | "dark-pad"
  | "ringmod-scream"
  | "mb-trick"
  | "stutter-gate"
  | "backwards-chug";

export interface GuitarOnset {
  timeSeconds: number;
  intensity: number;
}

export interface DrumHit {
  step: number;
  timeSeconds: number;
  voice: DrumVoice;
  intensity: number;
  label: string;
}

export interface SongSection {
  name: string;
  bars: number;
  guitarDirection: string;
  drumDirection: string;
}

export interface WhammyAutomationEvent {
  id: string;
  name: string;
  startSeconds: number;
  durationSeconds: number;
  startSemitones: number;
  endSemitones: number;
  curve: WhammyCurve;
}

export interface AmbientGuitarEffect {
  id: string;
  type: AmbientEffectType;
  enabled: boolean;
  mix: number;
  size: number;
  feedback: number;
  note: string;
}

export interface SongwriterSketchInput {
  songName: string;
  artist: string;
  tuning: string;
  tempo: number;
  mode: SongwriterMode;
  feel: SongwriterFeel;
  keyCenter?: string;
  riffRole?: RiffRole;
  riffNotes?: string;
  sourceFileName: string;
  sourceFilePath: string;
  cabIrFileName?: string;
  onsets: GuitarOnset[];
  quantizeStrength: number;
  humanizeMs: number;
  swingPercent: number;
  sections?: SongSection[];
  drumHits?: DrumHit[];
  whammyEvents?: WhammyAutomationEvent[];
  ambientEffects?: AmbientGuitarEffect[];
}

export interface SongwriterSketch {
  schemaVersion: 1;
  tool: "songwriter-lab";
  songName: string;
  artist: string;
  tuning: string;
  tempo: number;
  timeSignature: "4/4";
  mode: SongwriterMode;
  feel: SongwriterFeel;
  keyCenter: string;
  riffRole: RiffRole;
  riffNotes: string;
  sourceFileName: string;
  sourceFilePath: string;
  cabIrFileName: string;
  quantizeStrength: number;
  humanizeMs: number;
  swingPercent: number;
  detectedOnsets: GuitarOnset[];
  drumHits: DrumHit[];
  sections: SongSection[];
  whammyEvents: WhammyAutomationEvent[];
  ambientEffects: AmbientGuitarEffect[];
  notes: string[];
}

const voiceLabels: Record<DrumVoice, string> = {
  kick: "KICK",
  snare: "SNARE",
  hat: "HAT",
  crash: "CRASH"
};

function groove(
  id: string,
  name: string,
  category: DrumGrooveCategory,
  tempoMin: number,
  tempoMax: number,
  bars: number,
  description: string,
  steps: Record<DrumVoice, number[]>
): DrumGroove {
  return { id, name, category, tempoMin, tempoMax, bars, description, steps };
}

export const songwriterGrooveLibrary: DrumGroove[] = [
  groove("djent-pulse-160", "Djent Pulse 160", "djent", 135, 180, 2, "Tight chug pulse with backbeat snare.", {
    kick: [0, 3, 6, 8, 10, 14, 16, 19, 22, 24, 26, 30],
    snare: [4, 12, 20, 28],
    hat: Array.from({ length: 16 }, (_, index) => index * 2),
    crash: [0, 16]
  }),
  groove("thall-half-time", "Thall Half-Time", "thall", 110, 165, 2, "Sparse half-time with low chug accents.", {
    kick: [0, 2, 7, 10, 14, 16, 18, 23, 26, 30],
    snare: [12, 28],
    hat: [0, 4, 8, 12, 16, 20, 24, 28],
    crash: [0, 24]
  }),
  groove("thall-stop-start", "Stop-Start Drop", "thall", 95, 155, 2, "Stop-start accents for backwards chugs and pitch drops.", {
    kick: [0, 1, 6, 8, 15, 16, 17, 22, 24, 31],
    snare: [12, 28],
    hat: [0, 2, 6, 8, 12, 16, 18, 22, 24, 28],
    crash: [0, 16]
  }),
  groove("metalcore-drive", "Metalcore Drive", "metalcore", 150, 210, 2, "Fast hats and straight backbeat for chorus/verse starts.", {
    kick: [0, 4, 7, 8, 12, 16, 20, 23, 24, 28],
    snare: [4, 12, 20, 28],
    hat: Array.from({ length: 32 }, (_, step) => step),
    crash: [0, 16]
  }),
  groove("ambient-build-wide", "Ambient Build Wide", "ambient", 80, 145, 2, "Open build for clean sections and big transitions.", {
    kick: [0, 8, 16, 24, 28],
    snare: [12, 28],
    hat: [0, 4, 8, 12, 16, 18, 20, 22, 24, 26, 28, 30],
    crash: [0, 16, 24]
  }),
  groove("odd-lurch", "Odd Lurch", "odd-feel", 90, 150, 2, "Uneven-feeling 4/4 grouping for off-balance riffs.", {
    kick: [0, 5, 7, 11, 16, 21, 23, 27, 30],
    snare: [12, 28],
    hat: [0, 3, 6, 9, 12, 16, 19, 22, 25, 28],
    crash: [0, 16]
  })
];

export function createSongwriterSketch(input: SongwriterSketchInput): SongwriterSketch {
  const tempo = clampTempo(input.tempo);
  const quantizeStrength = clampRange(input.quantizeStrength, 0, 100);
  const humanizeMs = clampRange(input.humanizeMs, 0, 60);
  const swingPercent = clampRange(input.swingPercent, 50, 68);
  const drumHits =
    input.mode === "continue-song"
      ? []
      : input.drumHits?.length
        ? normalizeDrumHits(input.drumHits)
        : createDrumSketchFromOnsets(input.onsets, tempo, input.feel, 8, {
            quantizeStrength,
            humanizeMs,
            swingPercent
          });
  const baseSections = suggestSongSections(input.mode, input.feel);
  const sections = input.sections?.length ? normalizeSections(input.sections) : baseSections;
  const whammyEvents = normalizeWhammyEvents(input.whammyEvents ?? []);
  const ambientEffects = normalizeAmbientEffects(input.ambientEffects ?? []);

  return {
    schemaVersion: 1,
    tool: "songwriter-lab",
    songName: input.songName.trim() || "Untitled Guitar Idea",
    artist: input.artist.trim() || "Unknown Artist",
    tuning: input.tuning.trim() || "E Standard",
    tempo,
    timeSignature: "4/4",
    mode: input.mode,
    feel: input.feel,
    keyCenter: input.keyCenter?.trim() || "Unknown",
    riffRole: input.riffRole ?? "main-riff",
    riffNotes: input.riffNotes?.trim() || "",
    sourceFileName: input.sourceFileName,
    sourceFilePath: input.sourceFilePath,
    cabIrFileName: input.cabIrFileName?.trim() || "",
    quantizeStrength,
    humanizeMs,
    swingPercent,
    detectedOnsets: input.onsets,
    drumHits,
    sections,
    whammyEvents,
    ambientEffects,
    notes: createNotes(
      input.mode,
      input.feel,
      input.keyCenter?.trim() || "Unknown",
      input.riffRole ?? "main-riff",
      input.riffNotes?.trim() || "",
      input.onsets.length,
      drumHits.length,
      whammyEvents.length,
      ambientEffects.filter((effect) => effect.enabled).length,
      quantizeStrength,
      humanizeMs,
      swingPercent
    )
  };
}

export function suggestSongSections(mode: SongwriterMode, feel: SongwriterFeel): SongSection[] {
  return mode === "rhythm-to-drums" ? createRhythmOnlySections(feel) : createContinuationSections(feel);
}

export function createDrumSketchFromOnsets(
  onsets: GuitarOnset[],
  tempo: number,
  feel: SongwriterFeel,
  bars: number,
  options: { quantizeStrength: number; humanizeMs: number; swingPercent: number }
): DrumHit[] {
  if (onsets.length === 0) {
    return [];
  }

  const stepSeconds = 60 / clampTempo(tempo) / 4;
  const totalSteps = bars * 16;
  const strongestByStep = new Map<number, GuitarOnset>();

  for (const onset of onsets) {
    if (!Number.isFinite(onset.timeSeconds) || onset.timeSeconds < 0) {
      continue;
    }

    const rawStep = onset.timeSeconds / stepSeconds;
    const snappedStep = Math.round(rawStep);
    const blend = clampRange(options.quantizeStrength, 0, 100) / 100;
    const blendedStep = rawStep + (snappedStep - rawStep) * blend;
    const step = Math.round(blendedStep);

    if (step < 0 || step >= totalSteps) {
      continue;
    }

    const existing = strongestByStep.get(step);

    if (!existing || onset.intensity > existing.intensity) {
      strongestByStep.set(step, onset);
    }
  }

  const swingPushSeconds = ((clampRange(options.swingPercent, 50, 68) - 50) / 100) * stepSeconds * 0.85;
  const hits = Array.from(strongestByStep.entries())
    .sort(([left], [right]) => left - right)
    .map(([step, onset]) => {
      const voice = voiceForStep(step, onset.intensity, feel);
      const swingOffset = step % 2 === 1 ? swingPushSeconds : 0;
      const humanizeOffset = deterministicHumanize(step, voice, options.humanizeMs);

      return {
        step,
        timeSeconds: Number(Math.max(0, step * stepSeconds + swingOffset + humanizeOffset).toFixed(3)),
        voice,
        intensity: Number(clamp01(onset.intensity).toFixed(3)),
        label: `${voiceLabels[voice]} step ${step + 1}`
      };
    });

  return hits;
}

export function createPresetDrumHits(preset: DrumPatternPreset, tempo: number): DrumHit[] {
  const stepSeconds = 60 / clampTempo(tempo) / 4;
  const stepsByVoice = presetDrumSteps(preset);

  return Object.entries(stepsByVoice)
    .flatMap(([voice, steps]) =>
      steps.map((step) => {
        const drumVoice = voice as DrumVoice;

        return {
          step,
          timeSeconds: Number((step * stepSeconds).toFixed(3)),
          voice: drumVoice,
          intensity: drumVoice === "crash" ? 0.92 : drumVoice === "snare" ? 0.84 : 0.78,
          label: `${voiceLabels[drumVoice]} step ${step + 1}`
        };
      })
    )
    .sort((left, right) => left.step - right.step || left.voice.localeCompare(right.voice));
}

export function createGrooveDrumHits(grooveId: string, tempo: number): DrumHit[] {
  const groove = songwriterGrooveLibrary.find((item) => item.id === grooveId) ?? songwriterGrooveLibrary[0];
  const stepSeconds = 60 / clampTempo(tempo) / 4;

  return Object.entries(groove.steps)
    .flatMap(([voice, steps]) =>
      steps.map((step) => {
        const drumVoice = voice as DrumVoice;

        return {
          step,
          timeSeconds: Number((step * stepSeconds).toFixed(3)),
          voice: drumVoice,
          intensity: drumVoice === "crash" ? 0.94 : drumVoice === "snare" ? 0.86 : drumVoice === "kick" ? 0.84 : 0.68,
          label: `${voiceLabels[drumVoice]} ${groove.name} step ${step + 1}`
        };
      })
    )
    .sort((left, right) => left.step - right.step || left.voice.localeCompare(right.voice));
}

export function generateSongwriterLua(sketch: SongwriterSketch): string {
  const lines = [
    "-- Guitar Workflow Toolkit - Songwriter Lab",
    `-- Song: ${singleLine(sketch.songName)}`,
    `-- Artist: ${singleLine(sketch.artist)}`,
    `-- BPM: ${sketch.tempo}`,
    `-- Tuning: ${singleLine(sketch.tuning)}`,
    `-- Mode: ${singleLine(modeLabel(sketch.mode))}`,
    `-- Feel: ${singleLine(feelLabel(sketch.feel))}`,
    `-- Key / root: ${singleLine(sketch.keyCenter)}`,
    `-- Riff role: ${singleLine(riffRoleLabel(sketch.riffRole))}`,
    `-- Riff notes: ${singleLine(sketch.riffNotes || "none")}`,
    `-- Source guitar file: ${singleLine(sketch.sourceFileName || "not imported yet")}`,
    `-- Cab IR: ${singleLine(sketch.cabIrFileName || "built-in cab filter")}`,
    `-- Whammy / pitch events: ${sketch.whammyEvents.length}`,
    `-- Ambient effects enabled: ${sketch.ambientEffects.filter((effect) => effect.enabled).length}`,
    "-- Generated locally. This creates visual drum/rhythm guide items and exports drum-guide.mid.",
    "-- Browser mode cannot select ASIO directly; use this REAPER pack for low-latency/native routing.",
    "",
    "reaper.Undo_BeginBlock()",
    "reaper.PreventUIRefresh(1)",
    "",
    "local trackMap = {}",
    "",
    "local function createTrack(id, name, color)",
    "  local index = reaper.CountTracks(0)",
    "  reaper.InsertTrackAtIndex(index, true)",
    "  local track = reaper.GetTrack(0, index)",
    "  trackMap[id] = track",
    "  reaper.GetSetMediaTrackInfo_String(track, \"P_NAME\", name, true)",
    "  local value = color:gsub(\"#\", \"\")",
    "  local r = tonumber(value:sub(1, 2), 16) or 255",
    "  local g = tonumber(value:sub(3, 4), 16) or 255",
    "  local b = tonumber(value:sub(5, 6), 16) or 255",
    "  reaper.SetTrackColor(track, reaper.ColorToNative(r, g, b) | 0x1000000)",
    "  return track",
    "end",
    "",
    "local function addGuideItem(trackId, position, label, intensity)",
    "  local item = reaper.AddMediaItemToTrack(trackMap[trackId])",
    "  reaper.SetMediaItemInfo_Value(item, \"D_POSITION\", position)",
    "  reaper.SetMediaItemInfo_Value(item, \"D_LENGTH\", 0.08)",
    "  reaper.GetSetMediaItemInfo_String(item, \"P_NOTES\", label .. \" intensity \" .. intensity, true)",
    "  return item",
    "end",
    "",
    "local function addStructureItem(position, length, label, notes)",
    "  local item = reaper.AddMediaItemToTrack(trackMap[\"song-structure\"])",
    "  reaper.SetMediaItemInfo_Value(item, \"D_POSITION\", position)",
    "  reaper.SetMediaItemInfo_Value(item, \"D_LENGTH\", length)",
    "  reaper.GetSetMediaItemInfo_String(item, \"P_NOTES\", label .. \"\\n\" .. notes, true)",
    "  return item",
    "end",
    "",
    "local function addAutomationGuideItem(position, length, label, notes)",
    "  local item = reaper.AddMediaItemToTrack(trackMap[\"pitch-automation-guide\"])",
    "  reaper.SetMediaItemInfo_Value(item, \"D_POSITION\", position)",
    "  reaper.SetMediaItemInfo_Value(item, \"D_LENGTH\", length)",
    "  reaper.GetSetMediaItemInfo_String(item, \"P_NOTES\", label .. \"\\n\" .. notes, true)",
    "  return item",
    "end",
    "",
    "local function addAmbientGuideItem(position, length, label, notes)",
    "  local item = reaper.AddMediaItemToTrack(trackMap[\"ambient-guitar-fx\"])",
    "  reaper.SetMediaItemInfo_Value(item, \"D_POSITION\", position)",
    "  reaper.SetMediaItemInfo_Value(item, \"D_LENGTH\", length)",
    "  reaper.GetSetMediaItemInfo_String(item, \"P_NOTES\", label .. \"\\n\" .. notes, true)",
    "  return item",
    "end",
    "",
    `reaper.SetCurrentBPM(0, ${sketch.tempo}, false)`,
    `local projectNotes = "${escapeLua(projectNotes(sketch).join("\n"))}"`,
    "reaper.GetSetProjectNotes(0, true, projectNotes)",
    "",
    'createTrack("guitar-idea", "GUITAR IDEA", "#50c878")',
    'createTrack("drum-sketch-bus", "DRUM SKETCH BUS", "#f3b64b")',
    'createTrack("bass-midi-guide", "BASS MIDI GUIDE", "#60a5fa")',
    'createTrack("kick-guide", "KICK GUIDE", "#ef4444")',
    'createTrack("snare-guide", "SNARE GUIDE", "#f97316")',
    'createTrack("hat-guide", "HAT / RIDE GUIDE", "#38bdf8")',
    'createTrack("crash-guide", "CRASH / ACCENT GUIDE", "#c77dff")',
    'createTrack("pitch-automation-guide", "WHAMMY / PITCH AUTOMATION", "#f472b6")',
    'createTrack("ambient-guitar-fx", "AMBIENT GUITAR FX", "#a7f3d0")',
    'createTrack("song-structure", "SONG STRUCTURE NOTES", "#f8fafc")',
    "",
    'reaper.SetMediaTrackInfo_Value(trackMap["kick-guide"], "B_MAINSEND", 0)',
    'reaper.SetMediaTrackInfo_Value(trackMap["snare-guide"], "B_MAINSEND", 0)',
    'reaper.SetMediaTrackInfo_Value(trackMap["hat-guide"], "B_MAINSEND", 0)',
    'reaper.SetMediaTrackInfo_Value(trackMap["crash-guide"], "B_MAINSEND", 0)',
    'reaper.SetMediaTrackInfo_Value(trackMap["pitch-automation-guide"], "B_MAINSEND", 0)',
    ""
  ];

  if (sketch.sourceFilePath.trim()) {
    lines.push(
      "-- Import the guitar idea onto the reference track.",
      'reaper.SetOnlyTrackSelected(trackMap["guitar-idea"])',
      "reaper.SetEditCurPos(0, false, false)",
      `reaper.InsertMedia("${escapeLua(sketch.sourceFilePath)}", 0)`,
      ""
    );
  }

  const sectionSeconds = 4 * 60 / sketch.tempo;
  let sectionStart = 0;

  for (const section of sketch.sections) {
    const sectionLength = section.bars * sectionSeconds;
    const sectionNotes = `Guitar: ${section.guitarDirection}\nDrums: ${section.drumDirection}`;

    lines.push(
      `-- Song section: ${singleLine(section.name)}`,
      `reaper.AddProjectMarker2(0, false, ${numberLiteral(sectionStart)}, 0, "${escapeLua(section.name)}", -1, 0)`,
      `addStructureItem(${numberLiteral(sectionStart)}, ${numberLiteral(sectionLength)}, "${escapeLua(section.name)}", "${escapeLua(sectionNotes)}")`,
      ""
    );
    sectionStart += sectionLength;
  }

  for (const hit of sketch.drumHits.slice(0, 128)) {
    lines.push(
      `-- Drum guide: ${voiceLabels[hit.voice]} at ${hit.timeSeconds}s from guitar rhythm step ${hit.step + 1}.`,
      `addGuideItem("${trackIdForVoice(hit.voice)}", ${numberLiteral(hit.timeSeconds)}, "${voiceLabels[hit.voice]}", ${numberLiteral(hit.intensity)})`
    );
  }

  for (const hit of bassGuideHits(sketch).slice(0, 96)) {
    lines.push(
      `-- Bass MIDI guide: low root note at ${hit.timeSeconds}s from guitar/drum rhythm.`,
      `addGuideItem("bass-midi-guide", ${numberLiteral(hit.timeSeconds)}, "BASS ROOT", ${numberLiteral(hit.intensity)})`
    );
  }

  for (const event of sketch.whammyEvents.slice(0, 32)) {
    const notes = [
      `Start pitch: ${event.startSemitones > 0 ? "+" : ""}${event.startSemitones} semitones`,
      `End pitch: ${event.endSemitones > 0 ? "+" : ""}${event.endSemitones} semitones`,
      `Curve: ${event.curve}`,
      "Map this guide item to a ReaPitch, whammy, or pitch plugin parameter in the native REAPER session."
    ].join("\\n");

    lines.push(
      `-- Whammy automation guide: ${singleLine(event.name)} from ${event.startSemitones} to ${event.endSemitones} semitones.`,
      `reaper.AddProjectMarker2(0, false, ${numberLiteral(event.startSeconds)}, 0, "${escapeLua(event.name)}", -1, 0)`,
      `addAutomationGuideItem(${numberLiteral(event.startSeconds)}, ${numberLiteral(event.durationSeconds)}, "${escapeLua(event.name)}", "${escapeLua(notes)}")`
    );
  }

  for (const effect of sketch.ambientEffects.filter((item) => item.enabled)) {
    const notes = [
      `Type: ${ambientEffectLabel(effect.type)}`,
      `Mix: ${effect.mix}%`,
      `Size: ${effect.size}%`,
      `Feedback: ${effect.feedback}%`,
      effect.note ? `Note: ${effect.note}` : "Note: create a texture lane from this idea."
    ].join("\\n");

    lines.push(
      `-- Ambient guitar effect guide: ${singleLine(ambientEffectLabel(effect.type))}.`,
      `addAmbientGuideItem(0, ${numberLiteral(Math.max(2, sectionStart || 8))}, "${escapeLua(ambientEffectLabel(effect.type))}", "${escapeLua(notes)}")`
    );
  }

  lines.push(
    "",
    "reaper.TrackList_AdjustWindows(false)",
    "reaper.UpdateArrange()",
    "reaper.PreventUIRefresh(-1)",
    `reaper.Undo_EndBlock("Create songwriter sketch: ${escapeLua(sketch.songName)}", -1)`,
    ""
  );

  return lines.join("\n");
}

export function serializeSongwriterSketch(sketch: SongwriterSketch): string {
  return JSON.stringify(
    {
      app: "guitar-workflow-toolkit",
      sketch
    },
    null,
    2
  );
}

export function createSongwriterBundle(sketch: SongwriterSketch, lua: string, json: string, nativePresetJson?: string): ExportBundle {
  const baseName = cleanFileName(`${sketch.songName}-songwriter-lab`);
  const entryScriptFileName = "run-workflow.lua";
  const midiBase64 = createDrumGuideMidiBase64(sketch);
  const bassMidiBase64 = createBassGuideMidiBase64(sketch);
  const files: ExportBundle["files"] = [
    { fileName: entryScriptFileName, text: lua },
    { fileName: `${baseName}.lua`, text: lua },
    { fileName: `${baseName}.json`, text: json },
    { fileName: "songwriter-ideas.md", text: createSongwriterIdeas(sketch) },
    { fileName: "rhythm-sketch.json", text: createRhythmSketchJson(sketch) },
    { fileName: "drum-guide.mid", base64: midiBase64, encoding: "base64" },
    { fileName: "bass-guide.mid", base64: bassMidiBase64, encoding: "base64" },
    ...(nativePresetJson ? [{ fileName: "thall-lab-preset.json", text: nativePresetJson }] : []),
    { fileName: "README-REAPER-STEPS.md", text: createSongwriterReaperSteps(sketch) }
  ];

  return {
    directoryName: baseName,
    files: [
      ...files,
      {
        fileName: "plugin-manifest.json",
        text: createPluginManifestJson({
          workflow: "songwriter-lab",
          presetId: "songwriter-lab",
          name: "Songwriter Lab",
          songName: sketch.songName,
          artist: sketch.artist,
          tempo: sketch.tempo,
          tuning: sketch.tuning,
          entryScript: entryScriptFileName,
          files: [...files.map((file) => file.fileName), "plugin-manifest.json"],
          notes: [
            "Creates REAPER guide tracks, markers, project notes, and drum-guide MIDI.",
            nativePresetJson ? "Includes thall-lab-preset.json for the native JUCE audio engine." : "Native JUCE preset was not included in this export.",
            "Use the exported Lua script as the REAPER entry point.",
            "Open README-REAPER-STEPS.md for the intended REAPER workflow.",
            "No AI APIs or external downloads are used."
          ]
        })
      }
    ]
  };
}

function createContinuationSections(feel: SongwriterFeel): SongSection[] {
  if (feel === "breakdown") {
    return [
      section("RIFF SETUP", 4, "Repeat the main idea with tighter stops.", "Kick follows chugs, snare stays sparse."),
      section("HALF-TIME BREAKDOWN", 8, "Open space between chugs and add lower octave answers.", "Half-time snare, kick mirrors accents."),
      section("BREAKDOWN VARIATION", 8, "Move the last two beats into a new turnaround.", "Add crash accents on phrase starts."),
      section("FINAL HIT / RING", 2, "End with a held dissonant chord or octave.", "Stop with a final kick/crash.")
    ];
  }

  if (feel === "ambient") {
    return [
      section("CLEAN INTRO", 8, "Let the motif breathe with delay/reverb.", "Light hats, no heavy kick yet."),
      section("BUILD RIFF", 8, "Bring in muted rhythm under the melody.", "Kick follows the root movement."),
      section("BIG CHORUS", 8, "Open chords or octave melody over the same pulse.", "Full hats/ride, backbeat snare."),
      section("POST-CHORUS LIFT", 4, "Repeat the hook with a higher harmony.", "Crash on bar starts, busier kick.")
    ];
  }

  return [
    section("INTRO RIFF", 4, "Use the recorded rhythm as the identity of the song.", "Kick follows guitar attacks."),
    section("VERSE VARIATION", 8, "Thin out the riff, leave space for vocals or lead.", "Tight hats with backbeat snare."),
    section("PRE-CHORUS PUSH", 4, "Raise the last chord shape or add a climb.", "More kicks and open hats."),
    section("CHORUS / BIG PART", 8, "Open the riff into wider chords or octave melody.", "Full groove with crash starts."),
    section("BREAKDOWN", 8, "Cut to the strongest chug pattern and repeat with stops.", "Half-time snare and heavy kicks.")
  ];
}

function createRhythmOnlySections(feel: SongwriterFeel): SongSection[] {
  return [
    section("RHYTHM CAPTURE", 4, "Keep the imported guitar take as the source rhythm.", "Use the generated guide items as drum sketch."),
    section("GROOVE CHECK", 4, "Loop this area and adjust the guitar-to-drum mapping.", `Feel target: ${feelLabel(feel)}.`)
  ];
}

function section(name: string, bars: number, guitarDirection: string, drumDirection: string): SongSection {
  return { name, bars, guitarDirection, drumDirection };
}

function normalizeDrumHits(hits: DrumHit[]): DrumHit[] {
  const seen = new Set<string>();

  return hits
    .filter((hit) => Number.isFinite(hit.step) && hit.step >= 0 && hit.step < 128 && voiceLabels[hit.voice])
    .map((hit) => {
      const step = Math.floor(hit.step);

      return {
        step,
        timeSeconds: Math.max(0, Number(hit.timeSeconds.toFixed(3))),
        voice: hit.voice,
        intensity: Number(clamp01(hit.intensity).toFixed(3)),
        label: hit.label || `${voiceLabels[hit.voice]} step ${step + 1}`
      };
    })
    .sort((left, right) => left.step - right.step || left.voice.localeCompare(right.voice))
    .filter((hit) => {
      const key = `${hit.voice}-${hit.step}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function createNotes(
  mode: SongwriterMode,
  feel: SongwriterFeel,
  keyCenter: string,
  riffRole: RiffRole,
  riffNotes: string,
  onsetCount: number,
  hitCount: number,
  whammyEventCount: number,
  ambientEffectCount: number,
  quantizeStrength: number,
  humanizeMs: number,
  swingPercent: number
): string[] {
  const notes = [
    `${onsetCount} guitar attacks detected.`,
    `${hitCount} drum guide hits generated.`,
    `${whammyEventCount} pitch automation guide events.`,
    `${ambientEffectCount} ambient guitar effects enabled.`,
    `Feel target: ${feelLabel(feel)}.`,
    `Key/root idea: ${keyCenter || "Unknown"}.`,
    `Riff role: ${riffRoleLabel(riffRole)}.`,
    `Quantize strength: ${quantizeStrength}%.`,
    `Humanize: ${humanizeMs}ms.`,
    `Swing: ${swingPercent}%.`
  ];

  if (riffNotes) {
    notes.push(`Riff notes: ${riffNotes}`);
  }

  if (mode === "continue-song" || mode === "both") {
    notes.push("Use the section plan as a writing map, then replace weak sections after trying them on guitar.");
  }

  if (mode === "rhythm-to-drums" || mode === "both") {
    notes.push("Guide items are visual rhythm markers and can be paired with drum-guide.mid.");
  }

  return notes;
}

function normalizeSections(sections: SongSection[]): SongSection[] {
  return sections.map((section, index) => ({
    name: section.name.trim() || `SECTION ${index + 1}`,
    bars: clampRange(Math.round(section.bars), 1, 32),
    guitarDirection: section.guitarDirection.trim() || "Refine guitar idea here.",
    drumDirection: section.drumDirection.trim() || "Refine drum direction here."
  }));
}

function normalizeWhammyEvents(events: WhammyAutomationEvent[]): WhammyAutomationEvent[] {
  return events
    .filter((event) => event.durationSeconds > 0)
    .map((event, index) => ({
      id: event.id.trim() || `whammy-${index + 1}`,
      name: event.name.trim() || `WHAMMY EVENT ${index + 1}`,
      startSeconds: Math.max(0, Number(event.startSeconds.toFixed(3))),
      durationSeconds: clampRange(Number(event.durationSeconds.toFixed(3)), 0.05, 16),
      startSemitones: clampRange(Math.round(event.startSemitones), -24, 24),
      endSemitones: clampRange(Math.round(event.endSemitones), -24, 24),
      curve: normalizeWhammyCurve(event.curve)
    }))
    .sort((left, right) => left.startSeconds - right.startSeconds);
}

function normalizeWhammyCurve(curve: WhammyCurve): WhammyCurve {
  return curve === "fast-rise" || curve === "slow-fall" ? curve : "linear";
}

function normalizeAmbientEffects(effects: AmbientGuitarEffect[]): AmbientGuitarEffect[] {
  return effects.map((effect, index) => ({
    id: effect.id.trim() || `ambient-${index + 1}`,
    type: effect.type,
    enabled: effect.enabled,
    mix: clampRange(Math.round(effect.mix), 0, 100),
    size: clampRange(Math.round(effect.size), 0, 100),
    feedback: clampRange(Math.round(effect.feedback), 0, 100),
    note: effect.note.trim()
  }));
}

function deterministicHumanize(step: number, voice: DrumVoice, humanizeMs: number): number {
  if (humanizeMs <= 0) {
    return 0;
  }

  const voiceBias = voice === "kick" || voice === "snare" ? 0.65 : 1;
  const jitterWindow = (humanizeMs / 1000) * voiceBias;
  const pseudo = Math.sin((step + 1) * 12.9898 + voice.charCodeAt(0) * 78.233) * 43758.5453;
  const normalized = pseudo - Math.floor(pseudo);
  return (normalized - 0.5) * jitterWindow;
}

function createDrumGuideMidiBase64(sketch: SongwriterSketch): string {
  const ppq = 480;
  const tempoMicroseconds = Math.round(60000000 / Math.max(sketch.tempo, 1));
  const events: Array<{ tick: number; bytes: number[] }> = [];

  events.push({
    tick: 0,
    bytes: [0xff, 0x51, 0x03, (tempoMicroseconds >> 16) & 0xff, (tempoMicroseconds >> 8) & 0xff, tempoMicroseconds & 0xff]
  });
  events.push({
    tick: 0,
    bytes: [0xff, 0x03, ...encodeVariableLength(10), ...asciiBytes("DRUM GUIDE")]
  });

  for (const hit of sketch.drumHits) {
    const tick = Math.max(0, Math.round(hit.timeSeconds * (ppq * sketch.tempo) / 60));
    const velocity = clampRange(Math.round(40 + hit.intensity * 87), 1, 127);
    const note = midiNoteForVoice(hit.voice);
    const durationTicks = 90;

    events.push({ tick, bytes: [0x99, note, velocity] });
    events.push({ tick: tick + durationTicks, bytes: [0x89, note, 0] });
  }

  events.sort((left, right) => (left.tick === right.tick ? left.bytes.length - right.bytes.length : left.tick - right.tick));

  const trackData: number[] = [];
  let previousTick = 0;

  for (const event of events) {
    trackData.push(...encodeVariableLength(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  }

  trackData.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    ...asciiBytes("MThd"),
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x01,
    (ppq >> 8) & 0xff,
    ppq & 0xff
  ];
  const trackHeader = [...asciiBytes("MTrk"), (trackData.length >> 24) & 0xff, (trackData.length >> 16) & 0xff, (trackData.length >> 8) & 0xff, trackData.length & 0xff];
  const bytes = new Uint8Array([...header, ...trackHeader, ...trackData]);
  return bytesToBase64(bytes);
}

function createBassGuideMidiBase64(sketch: SongwriterSketch): string {
  const ppq = 480;
  const tempoMicroseconds = Math.round(60000000 / Math.max(sketch.tempo, 1));
  const events: Array<{ tick: number; bytes: number[] }> = [];

  events.push({
    tick: 0,
    bytes: [0xff, 0x51, 0x03, (tempoMicroseconds >> 16) & 0xff, (tempoMicroseconds >> 8) & 0xff, tempoMicroseconds & 0xff]
  });
  events.push({
    tick: 0,
    bytes: [0xff, 0x03, ...encodeVariableLength(10), ...asciiBytes("BASS GUIDE")]
  });

  for (const hit of bassGuideHits(sketch)) {
    const tick = Math.max(0, Math.round(hit.timeSeconds * (ppq * sketch.tempo) / 60));
    const velocity = clampRange(Math.round(52 + hit.intensity * 72), 1, 127);
    const durationTicks = hit.durationTicks;

    events.push({ tick, bytes: [0x90, hit.note, velocity] });
    events.push({ tick: tick + durationTicks, bytes: [0x80, hit.note, 0] });
  }

  events.sort((left, right) => (left.tick === right.tick ? left.bytes.length - right.bytes.length : left.tick - right.tick));

  const trackData: number[] = [];
  let previousTick = 0;

  for (const event of events) {
    trackData.push(...encodeVariableLength(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  }

  trackData.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    ...asciiBytes("MThd"),
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x01,
    (ppq >> 8) & 0xff,
    ppq & 0xff
  ];
  const trackHeader = [...asciiBytes("MTrk"), (trackData.length >> 24) & 0xff, (trackData.length >> 16) & 0xff, (trackData.length >> 8) & 0xff, trackData.length & 0xff];
  const bytes = new Uint8Array([...header, ...trackHeader, ...trackData]);
  return bytesToBase64(bytes);
}

function bassGuideHits(sketch: SongwriterSketch): Array<{ timeSeconds: number; intensity: number; note: number; durationTicks: number }> {
  const sourceHits = sketch.drumHits.length
    ? sketch.drumHits.filter((hit) => hit.voice === "kick" || hit.voice === "crash")
    : sketch.detectedOnsets.map((onset, index) => ({
        step: index,
        timeSeconds: onset.timeSeconds,
        voice: "kick" as DrumVoice,
        intensity: onset.intensity,
        label: "BASS ROOT"
      }));
  const rootNote = bassMidiRootForTuning(sketch.tuning);

  return sourceHits.slice(0, 128).map((hit) => ({
    timeSeconds: hit.timeSeconds,
    intensity: hit.intensity,
    note: rootNote,
    durationTicks: hit.intensity > 0.82 ? 180 : 105
  }));
}

function bassMidiRootForTuning(tuning: string): number {
  const normalized = tuning.toLowerCase();

  if (normalized.includes("drop e")) {
    return 28;
  }

  if (normalized.includes("drop f")) {
    return 29;
  }

  if (normalized.includes("drop g")) {
    return 31;
  }

  if (normalized.includes("drop a#") || normalized.includes("drop bb")) {
    return 34;
  }

  if (normalized.includes("drop a")) {
    return 33;
  }

  if (normalized.includes("drop c")) {
    return 36;
  }

  return 40;
}

function midiNoteForVoice(voice: DrumVoice): number {
  if (voice === "snare") {
    return 38;
  }

  if (voice === "hat") {
    return 42;
  }

  if (voice === "crash") {
    return 49;
  }

  return 36;
}

function encodeVariableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [buffer];

  while ((value >>= 7) > 0) {
    buffer = (value & 0x7f) | 0x80;
    bytes.unshift(buffer);
  }

  return bytes;
}

function asciiBytes(value: string): number[] {
  return Array.from(value).map((character) => character.charCodeAt(0) & 0x7f);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

function voiceForStep(step: number, intensity: number, feel: SongwriterFeel): DrumVoice {
  const localStep = step % 16;

  if (localStep === 0 && intensity > 0.72) {
    return "crash";
  }

  if (localStep === 4 || localStep === 12) {
    return "snare";
  }

  if (feel === "breakdown" && intensity > 0.52) {
    return "kick";
  }

  if (localStep % 4 === 0 || intensity > 0.7) {
    return "kick";
  }

  return "hat";
}

function projectNotes(sketch: SongwriterSketch): string[] {
  return [
    `Song: ${singleLine(sketch.songName)}`,
    `Artist: ${singleLine(sketch.artist)}`,
    `BPM: ${sketch.tempo}`,
    `Tuning: ${singleLine(sketch.tuning)}`,
    `Mode: ${modeLabel(sketch.mode)}`,
    `Feel: ${feelLabel(sketch.feel)}`,
    `Key/root idea: ${singleLine(sketch.keyCenter)}`,
    `Riff role: ${riffRoleLabel(sketch.riffRole)}`,
    `Riff notes: ${sketch.riffNotes || "none"}`,
    `Source guitar file: ${sketch.sourceFileName || "not imported yet"}`,
    `Cab IR: ${sketch.cabIrFileName || "built-in cab filter"}`,
    "",
    "Song sections:",
    ...sketch.sections.map((section) => `- ${section.name}: ${section.bars} bars. ${section.guitarDirection} Drums: ${section.drumDirection}`),
    "",
    "Notes:",
    ...sketch.notes.map((note) => `- ${note}`)
  ];
}

function createSongwriterIdeas(sketch: SongwriterSketch): string {
  return [
    `# ${sketch.songName} Songwriter Ideas`,
    "",
    `Artist: ${sketch.artist}`,
    `BPM: ${sketch.tempo}`,
    `Tuning: ${sketch.tuning}`,
    `Mode: ${modeLabel(sketch.mode)}`,
    `Feel: ${feelLabel(sketch.feel)}`,
    `Key/root idea: ${sketch.keyCenter}`,
    `Riff role: ${riffRoleLabel(sketch.riffRole)}`,
    `Riff notes: ${sketch.riffNotes || "none"}`,
    `Source guitar file: ${sketch.sourceFileName || "not imported yet"}`,
    `Cab IR: ${sketch.cabIrFileName || "built-in cab filter"}`,
    "",
    "## Sections",
    "",
    ...sketch.sections.flatMap((section) => [
      `- ${section.name} (${section.bars} bars)`,
      `  Guitar: ${section.guitarDirection}`,
      `  Drums: ${section.drumDirection}`
    ]),
    "",
    "## Drum Guide",
    "",
    ...sketch.drumHits.slice(0, 64).map((hit) => `- ${voiceLabels[hit.voice]} at ${hit.timeSeconds}s, step ${hit.step + 1}, intensity ${hit.intensity}`),
    "",
    "## Pitch Automation",
    "",
    ...(sketch.whammyEvents.length
      ? sketch.whammyEvents.map(
          (event) =>
            `- ${event.name}: ${event.startSeconds}s for ${event.durationSeconds}s, ${event.startSemitones} -> ${event.endSemitones} st, ${event.curve}`
        )
      : ["- No pitch automation guides yet."]),
    "",
    "## Ambient Guitar FX",
    "",
    ...(sketch.ambientEffects.filter((effect) => effect.enabled).length
      ? sketch.ambientEffects
          .filter((effect) => effect.enabled)
          .map(
            (effect) =>
              `- ${ambientEffectLabel(effect.type)}: mix ${effect.mix}%, size ${effect.size}%, feedback ${effect.feedback}%. ${effect.note || "Texture guide."}`
          )
      : ["- No ambient FX guides enabled yet."]),
    "",
    "## Notes",
    "",
    ...sketch.notes.map((note) => `- ${note}`)
  ].join("\n");
}

function createSongwriterReaperSteps(sketch: SongwriterSketch): string {
  return [
    `# ${sketch.songName} - REAPER Songwriter Steps`,
    "",
    "## Files",
    "",
    "- `run-workflow.lua` - main REAPER script to load and run",
    "- `drum-guide.mid` - simple MIDI drum guide generated from the drum map",
    "- `bass-guide.mid` - root-following bass MIDI guide for bass plugins",
    "- `songwriter-ideas.md` - human-readable writing notes",
    "- `rhythm-sketch.json` - structured rhythm and drum map",
    "",
    "## In REAPER",
    "",
    "1. Open REAPER.",
    "2. Go to `Actions` > `Show action list`.",
    "3. Choose `New action` > `Load ReaScript`.",
    "4. Select `run-workflow.lua` from this folder.",
    "5. Run the action.",
    "6. Review `SONG STRUCTURE NOTES` for the arrangement map.",
    "7. Import `drum-guide.mid` if you want MIDI notes in addition to visual guide items.",
    "8. Import `bass-guide.mid` onto `BASS MIDI GUIDE`, then load your bass instrument plugin.",
    "9. Use `WHAMMY / PITCH AUTOMATION` and `AMBIENT GUITAR FX` as guide lanes for plugin automation in REAPER.",
    "",
    "## Writing Target",
    "",
    `- Song: ${sketch.songName}`,
    `- Artist: ${sketch.artist}`,
    `- BPM: ${sketch.tempo}`,
    `- Tuning: ${sketch.tuning}`,
    `- Key/root idea: ${sketch.keyCenter}`,
    `- Riff role: ${riffRoleLabel(sketch.riffRole)}`,
    `- Feel: ${feelLabel(sketch.feel)}`,
    `- Riff notes: ${sketch.riffNotes || "none"}`,
    "",
    "## Next Pass",
    "",
    "- Record one clean guitar take against the guide.",
    "- Replace weak sections before polishing tones.",
    "- Use the pitch and ambient guide lanes for whammy screams, dive bombs, ringmod screams, reverse swells, and MB-style rhythmic effect tricks.",
    "- Commit to a simple intro, verse, big part, and breakdown before adding layers."
  ].join("\n");
}

function createRhythmSketchJson(sketch: SongwriterSketch): string {
  return JSON.stringify(
    {
      songName: sketch.songName,
      tempo: sketch.tempo,
      tuning: sketch.tuning,
      mode: sketch.mode,
      feel: sketch.feel,
      keyCenter: sketch.keyCenter,
      riffRole: sketch.riffRole,
      riffNotes: sketch.riffNotes,
      sourceFileName: sketch.sourceFileName,
      cabIrFileName: sketch.cabIrFileName,
      drumHits: sketch.drumHits,
      whammyEvents: sketch.whammyEvents,
      ambientEffects: sketch.ambientEffects
    },
    null,
    2
  );
}

function modeLabel(mode: SongwriterMode): string {
  if (mode === "rhythm-to-drums") {
    return "Guitar rhythm to drums";
  }

  if (mode === "continue-song") {
    return "Continue song idea";
  }

  return "Rhythm to drums + continue song";
}

function feelLabel(feel: SongwriterFeel): string {
  if (feel === "breakdown") {
    return "Heavy breakdown";
  }

  if (feel === "ambient") {
    return "Ambient big chorus";
  }

  return "Tight metalcore";
}

function riffRoleLabel(role: RiffRole): string {
  if (role === "verse") {
    return "Verse riff";
  }

  if (role === "chorus") {
    return "Chorus / big part";
  }

  if (role === "breakdown") {
    return "Breakdown";
  }

  if (role === "bridge") {
    return "Bridge";
  }

  if (role === "intro") {
    return "Intro";
  }

  return "Main riff";
}

function ambientEffectLabel(type: AmbientEffectType): string {
  if (type === "reverse-swell") {
    return "Reverse Swell";
  }

  if (type === "granular-freeze") {
    return "Granular Freeze";
  }

  if (type === "shimmer-cloud") {
    return "Shimmer Cloud";
  }

  if (type === "wide-delay") {
    return "Wide Delay";
  }

  if (type === "dark-pad") {
    return "Dark Pad";
  }

  if (type === "ringmod-scream") {
    return "Ringmod Scream";
  }

  if (type === "stutter-gate") {
    return "Stutter Gate";
  }

  if (type === "backwards-chug") {
    return "Backwards Chug";
  }

  return "MB Trick";
}

function presetDrumSteps(preset: DrumPatternPreset): Record<DrumVoice, number[]> {
  if (preset === "half-time-breakdown") {
    return {
      kick: [0, 3, 6, 8, 10, 14, 16, 19, 22, 24, 27, 30],
      snare: [12, 28],
      hat: [0, 4, 8, 12, 16, 20, 24, 28],
      crash: [0, 16]
    };
  }

  if (preset === "chorus-drive") {
    return {
      kick: [0, 4, 7, 8, 12, 16, 20, 23, 24, 28],
      snare: [4, 12, 20, 28],
      hat: Array.from({ length: 32 }, (_, step) => step),
      crash: [0, 16]
    };
  }

  if (preset === "ambient-build") {
    return {
      kick: [0, 8, 16, 24, 28],
      snare: [12, 28],
      hat: [0, 4, 8, 12, 16, 18, 20, 22, 24, 26, 28, 30],
      crash: [0, 16, 24]
    };
  }

  return {
    kick: [0, 4, 8, 10, 14, 16, 20, 24, 26, 30],
    snare: [4, 12, 20, 28],
    hat: Array.from({ length: 16 }, (_, index) => index * 2),
    crash: [0, 16]
  };
}

function trackIdForVoice(voice: DrumVoice): string {
  if (voice === "snare") {
    return "snare-guide";
  }

  if (voice === "hat") {
    return "hat-guide";
  }

  if (voice === "crash") {
    return "crash-guide";
  }

  return "kick-guide";
}

function cleanFileName(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "songwriter-lab";
}

function clampTempo(value: number): number {
  if (!Number.isFinite(value)) {
    return 120;
  }

  return Math.min(Math.max(Math.round(value), 20), 300);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function clampRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function numberLiteral(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeLua(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}
