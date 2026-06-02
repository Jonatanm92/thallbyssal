import { CSSProperties, ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  FileCode2,
  MapPin,
  Mic,
  Music2,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Square,
  Timer,
  Trash2,
  Upload
} from "lucide-react";
import {
  GuitarWorkflowTemplate,
  ProjectMarkerTemplate,
  ReaperInputMode,
  TemplatePresetId,
  TemplateOutputMode,
  RouteTemplate,
  SendMode,
  SourceAssetKind,
  SourceAssetTemplate,
  SourceWorkflow,
  TrackRole,
  TrackTemplate,
  createDefaultTemplate,
  createMarker,
  createSourceAsset,
  createTemplateFromPreset,
  createTemplateFromPresetWithMetadata,
  createRoute,
  createTrack,
  loadTemplateFromJson,
  serializeTemplate,
  templatePresets,
  validateTemplate
} from "./domain/template";
import { generateReaperLua } from "./domain/luaGenerator";
import { encodeWavPcm16, processDirectBackingAudio, transposeAudioBuffer } from "./domain/directAudio";
import { createExportFileName } from "./domain/exportFile";
import { createExportBundle } from "./domain/exportBundle";
import { getSessionChecks } from "./domain/sessionCheck";
import {
  createImportedFileUrl,
  getImportedFileNameFromPath,
  getImportMediaKind,
  isSupportedImportFileName
} from "./domain/importFile";
import { getSourceSummary } from "./domain/sourceSummary";
import { planBatchSourceImports } from "./domain/sourceImportPlan";
import { createSmartSongEnginePlan } from "./domain/smartSongEngine";
import { createThallLabNativePreset, serializeThallLabNativePreset, ThallLabOutputMode } from "./domain/thallLabPreset";
import { getGuitarTonePreset, guitarTonePresets } from "./domain/guitarTonePresets";
import { defaultForgePedals, ForgePedal } from "./domain/pedalboard";
import {
  GuitarOnset,
  DrumHit,
  DrumPatternPreset,
  SongwriterFeel,
  SongSection,
  SongwriterMode,
  createSongwriterBundle,
  createPresetDrumHits,
  createGrooveDrumHits,
  createSongwriterSketch,
  DrumGrooveCategory,
  DrumVoice,
  AmbientEffectType,
  AmbientGuitarEffect,
  RiffRole,
  generateSongwriterLua,
  serializeSongwriterSketch,
  songwriterGrooveLibrary,
  suggestSongSections,
  WhammyAutomationEvent,
  WhammyCurve
} from "./domain/songwriter";

const roleOptions: TrackRole[] = ["input", "amp", "bus", "fx", "reference", "print"];
const inputModeOptions: ReaperInputMode[] = ["none", "mono", "stereo"];
const sendModeOptions: SendMode[] = ["post-fader", "pre-fader", "post-fx"];
const sourceKindOptions: SourceAssetKind[] = ["local-file", "reference-link"];
const sourceWorkflowOptions: Array<{ id: SourceWorkflow; label: string }> = [
  { id: "no-guitar-track", label: "No-guitar track" },
  { id: "separate-stems", label: "Separate stems" },
  { id: "full-mix-reference", label: "Full-mix reference" },
  { id: "cover-template", label: "Cover template" }
];
const backingOutputModeOptions: Array<{ id: TemplateOutputMode; label: string; description: string }> = [
  {
    id: "both",
    label: "Both",
    description: "Create the REAPER import session and make it ready to render a final audio file."
  },
  {
    id: "audio-file",
    label: "Final audio file",
    description: "Set up REAPER render settings for one finished backing track file."
  },
  {
    id: "reaper-import",
    label: "REAPER import",
    description: "Only create the REAPER import/routing session."
  }
];
const thallLabOutputModeOptions: Array<{ id: ThallLabOutputMode; label: string }> = [
  { id: "stereo", label: "Stereo" },
  { id: "mono", label: "Mono" }
];
const songwriterModeOptions: Array<{ id: SongwriterMode; label: string; description: string }> = [
  {
    id: "both",
    label: "Do both",
    description: "Write a drum guide from the riff and suggest the next song sections."
  },
  {
    id: "rhythm-to-drums",
    label: "Rhythm to drums",
    description: "Use guitar attacks to create kick, snare, hat, and crash guide items."
  },
  {
    id: "continue-song",
    label: "Continue idea",
    description: "Create a section map for turning the riff into a song."
  }
];
const songwriterFeelOptions: Array<{ id: SongwriterFeel; label: string }> = [
  { id: "metalcore", label: "Tight metalcore" },
  { id: "breakdown", label: "Heavy breakdown" },
  { id: "ambient", label: "Ambient big chorus" }
];
const riffRoleOptions: Array<{ id: RiffRole; label: string }> = [
  { id: "main-riff", label: "Main riff" },
  { id: "verse", label: "Verse" },
  { id: "chorus", label: "Chorus / big part" },
  { id: "breakdown", label: "Breakdown" },
  { id: "bridge", label: "Bridge" },
  { id: "intro", label: "Intro" }
];
const drumPatternPresetOptions: Array<{ id: DrumPatternPreset; label: string }> = [
  { id: "follow-riff", label: "Follow riff" },
  { id: "half-time-breakdown", label: "Half-time breakdown" },
  { id: "chorus-drive", label: "Chorus drive" },
  { id: "ambient-build", label: "Ambient build" }
];
const grooveCategoryOptions: Array<{ id: DrumGrooveCategory | "all"; label: string }> = [
  { id: "all", label: "All grooves" },
  { id: "thall", label: "Thall" },
  { id: "djent", label: "Djent" },
  { id: "metalcore", label: "Metalcore" },
  { id: "ambient", label: "Ambient" },
  { id: "odd-feel", label: "Odd feel" }
];
const songSectionPresetOptions: Array<{ id: string; label: string; section: SongSection }> = [
  {
    id: "verse",
    label: "Add verse",
    section: {
      name: "VERSE",
      bars: 8,
      guitarDirection: "Simplify the main riff and leave space for vocal rhythm or lead melody.",
      drumDirection: "Tight hats, backbeat snare, kick follows the strongest palm mutes."
    }
  },
  {
    id: "chorus",
    label: "Add chorus",
    section: {
      name: "CHORUS / BIG PART",
      bars: 8,
      guitarDirection: "Open the riff into wider chords, octaves, or a higher answer melody.",
      drumDirection: "Full groove with crash starts and a stronger backbeat."
    }
  },
  {
    id: "breakdown",
    label: "Add breakdown",
    section: {
      name: "BREAKDOWN",
      bars: 8,
      guitarDirection: "Use the heaviest rhythm cell, repeat it, then add stops or a lower answer.",
      drumDirection: "Half-time snare, kick mirrors chugs, crashes on phrase starts."
    }
  },
  {
    id: "bridge",
    label: "Add bridge",
    section: {
      name: "BRIDGE / RESET",
      bars: 4,
      guitarDirection: "Change texture with clean notes, a lead hook, or a stripped version of the riff.",
      drumDirection: "Reduce density first, then build back into the next heavy part."
    }
  }
];
const whammyPresetOptions: Array<{ id: string; label: string; event: Omit<WhammyAutomationEvent, "id"> }> = [
  {
    id: "whammy-scream",
    label: "Whammy scream",
    event: { name: "WHAMMY SCREAM", startSeconds: 0, durationSeconds: 1.25, startSemitones: 0, endSemitones: 24, curve: "fast-rise" }
  },
  {
    id: "dive-bomb",
    label: "Dive bomb",
    event: { name: "DIVE BOMB", startSeconds: 0, durationSeconds: 1.6, startSemitones: 0, endSemitones: -24, curve: "slow-fall" }
  },
  {
    id: "pitch-scoop",
    label: "Pitch scoop",
    event: { name: "PITCH SCOOP", startSeconds: 0, durationSeconds: 0.65, startSemitones: -12, endSemitones: 0, curve: "linear" }
  }
];
const ambientEffectPresets: AmbientGuitarEffect[] = [
  {
    id: "reverse-swell",
    type: "reverse-swell",
    enabled: true,
    mix: 42,
    size: 78,
    feedback: 38,
    note: "Print a reversed chord swell into the next heavy hit."
  },
  {
    id: "granular-freeze",
    type: "granular-freeze",
    enabled: false,
    mix: 35,
    size: 86,
    feedback: 62,
    note: "Freeze a harmonic or scrape into a wide texture bed."
  },
  {
    id: "shimmer-cloud",
    type: "shimmer-cloud",
    enabled: false,
    mix: 30,
    size: 92,
    feedback: 55,
    note: "High octave wash for clean or lead transition layers."
  },
  {
    id: "wide-delay",
    type: "wide-delay",
    enabled: false,
    mix: 28,
    size: 64,
    feedback: 48,
    note: "Tempo wide delay throw at the end of a phrase."
  },
  {
    id: "dark-pad",
    type: "dark-pad",
    enabled: false,
    mix: 50,
    size: 72,
    feedback: 44,
    note: "Low dark pad from a guitar chord, tucked under a breakdown."
  },
  {
    id: "ringmod-scream",
    type: "ringmod-scream",
    enabled: false,
    mix: 32,
    size: 46,
    feedback: 70,
    note: "Metallic scream layer for a pre-drop or stop-start accent."
  },
  {
    id: "mb-trick",
    type: "mb-trick",
    enabled: false,
    mix: 38,
    size: 58,
    feedback: 52,
    note: "Rhythmic stutter/filter trick that follows the chug pattern."
  },
  {
    id: "stutter-gate",
    type: "stutter-gate",
    enabled: false,
    mix: 44,
    size: 48,
    feedback: 40,
    note: "Tight rhythmic chop for stops, pickups, and digital-style repeats."
  },
  {
    id: "backwards-chug",
    type: "backwards-chug",
    enabled: false,
    mix: 36,
    size: 66,
    feedback: 34,
    note: "Reverse-pick swell into the chug so the attack feels pulled backwards."
  }
];
const backingPartOptions = [
  { sourceId: "main-backing-source", targetTrackId: "backing-track-main", label: "Main backing/source print" },
  { sourceId: "no-guitar-backing-source", targetTrackId: "backing-track-no-guitar", label: "No-guitar/jam track" },
  { sourceId: "drums-percussion-source", targetTrackId: "drums-percussion-stem", label: "Drums/percussion" },
  { sourceId: "bass-stem-source", targetTrackId: "bass-stem", label: "Bass" },
  { sourceId: "vocals-lead-source", targetTrackId: "vocals-lead-stem", label: "Vocals/lead" },
  { sourceId: "synths-extra-source", targetTrackId: "synths-extra-stems", label: "Synths/extras" },
  { sourceId: "click-count-in-source", targetTrackId: "click-count-in", label: "Click/count-in" }
];
const defaultBackingPartSourceIds = [
  "no-guitar-backing-source",
  "drums-percussion-source",
  "bass-stem-source",
  "vocals-lead-source",
  "synths-extra-source"
];
const allBackingStemSourceIds = [
  "main-backing-source",
  "no-guitar-backing-source",
  "drums-percussion-source",
  "bass-stem-source",
  "vocals-lead-source",
  "synths-extra-source"
];
const backingRemovalOptions = [
  { id: "guitars", label: "Guitars" },
  { id: "vocals", label: "Vocals" },
  { id: "drums", label: "Drums" },
  { id: "bass", label: "Bass" },
  { id: "synths", label: "Synths / extras" }
];
type WorkflowMode = "cover" | "backing" | "songwriter";
type BackingCreationMode = "remove-instruments" | "all-stems";
type SongwriterAudioDevice = { id: string; label: string };
type SongwriterSampleRate = 44100 | 48000 | 96000;
type SongwriterBufferSize = 128 | 256 | 512 | 1024;
type SongwriterBitDepth = 16 | 24;
type SongwriterIrState = { fileName: string; buffer: AudioBuffer | null };
type TunerReadout = { note: string; cents: number; frequency: number; confidence: number };
type SongwriterAmpMonitorNodes = {
  context: AudioContext;
  inputGain: GainNode;
  driveA: WaveShaperNode;
  driveB: WaveShaperNode;
  lowShelf: BiquadFilterNode;
  lowMidPunch: BiquadFilterNode;
  midCut: BiquadFilterNode;
  presence: BiquadFilterNode;
  cabLowpass: BiquadFilterNode;
  outputCompressor: DynamicsCompressorNode;
  outputGain: GainNode;
};
type MicPermissionState = "unknown" | "granted" | "denied" | "prompt" | "unsupported";
type ExportNotice = { path: string; files: string[]; mode: "local" | "download" };
type RenderedPreview = { fileName: string; filePath: string };
type DirectAudioNotice = { fileName: string; path: string; previewUrl: string; warnings: string[]; mode: "local" | "download" };

const coverPresetIds: TemplatePresetId[] = ["guitar-routing-cover", "one-take-video-cover"];

function workflowForPreset(presetId: TemplatePresetId): WorkflowMode {
  if (presetId === "songwriter-lab") {
    return "songwriter";
  }

  return presetId === "backing-track-creator" ? "backing" : "cover";
}

function App() {
  const [template, setTemplate] = useState<GuitarWorkflowTemplate>(() => createDefaultTemplate());
  const [jsonDraft, setJsonDraft] = useState(() => serializeTemplate(createDefaultTemplate()));
  const [status, setStatus] = useState("Ready");
  const [backingCreationMode, setBackingCreationMode] = useState<BackingCreationMode>("remove-instruments");
  const [backingRemovedInstrumentIds, setBackingRemovedInstrumentIds] = useState<string[]>(["guitars"]);
  const [selectedBackingPartSourceIds, setSelectedBackingPartSourceIds] = useState<string[]>(["main-backing-source"]);
  const [songwriterMode, setSongwriterMode] = useState<SongwriterMode>("both");
  const [songwriterFeel, setSongwriterFeel] = useState<SongwriterFeel>("metalcore");
  const [songwriterQuantizeStrength, setSongwriterQuantizeStrength] = useState(92);
  const [songwriterHumanizeMs, setSongwriterHumanizeMs] = useState(8);
  const [songwriterSwingPercent, setSongwriterSwingPercent] = useState(55);
  const [songwriterKeyCenter, setSongwriterKeyCenter] = useState("");
  const [songwriterRiffRole, setSongwriterRiffRole] = useState<RiffRole>("main-riff");
  const [songwriterRiffNotes, setSongwriterRiffNotes] = useState("");
  const [songwriterSource, setSongwriterSource] = useState({ fileName: "", filePath: "" });
  const [songwriterOnsets, setSongwriterOnsets] = useState<GuitarOnset[]>([]);
  const [songwriterManualDrumHits, setSongwriterManualDrumHits] = useState<DrumHit[] | null>(null);
  const [songwriterSections, setSongwriterSections] = useState<SongSection[]>(() => suggestSongSections("both", "metalcore"));
  const [songwriterWhammyEvents, setSongwriterWhammyEvents] = useState<WhammyAutomationEvent[]>([]);
  const [songwriterAmbientEffects, setSongwriterAmbientEffects] = useState<AmbientGuitarEffect[]>(ambientEffectPresets);
  const [songwriterPedals, setSongwriterPedals] = useState<ForgePedal[]>(defaultForgePedals);
  const [isSongwriterRecording, setIsSongwriterRecording] = useState(false);
  const [songwriterRecordingSeconds, setSongwriterRecordingSeconds] = useState(0);
  const [songwriterInputLevel, setSongwriterInputLevel] = useState(0);
  const [songwriterTunerEnabled, setSongwriterTunerEnabled] = useState(true);
  const [songwriterTunerReadout, setSongwriterTunerReadout] = useState<TunerReadout>({
    note: "--",
    cents: 0,
    frequency: 0,
    confidence: 0
  });
  const [songwriterAudioInputDevices, setSongwriterAudioInputDevices] = useState<SongwriterAudioDevice[]>([]);
  const [songwriterAudioOutputDevices, setSongwriterAudioOutputDevices] = useState<SongwriterAudioDevice[]>([]);
  const [songwriterAudioInputDeviceId, setSongwriterAudioInputDeviceId] = useState("default");
  const [songwriterAudioOutputDeviceId, setSongwriterAudioOutputDeviceId] = useState("default");
  const [songwriterMicPermission, setSongwriterMicPermission] = useState<MicPermissionState>("unknown");
  const [songwriterSampleRate, setSongwriterSampleRate] = useState<SongwriterSampleRate>(48000);
  const [songwriterBufferSize, setSongwriterBufferSize] = useState<SongwriterBufferSize>(128);
  const [songwriterRenderBitDepth, setSongwriterRenderBitDepth] = useState<SongwriterBitDepth>(16);
  const [songwriterThallLabOutputMode, setSongwriterThallLabOutputMode] = useState<ThallLabOutputMode>("stereo");
  const [songwriterIr, setSongwriterIr] = useState<SongwriterIrState>({ fileName: "", buffer: null });
  const [songwriterMonitorEnabled, setSongwriterMonitorEnabled] = useState(false);
  const [songwriterAutoExportEnabled, setSongwriterAutoExportEnabled] = useState(true);
  const [songwriterMetronomeEnabled, setSongwriterMetronomeEnabled] = useState(false);
  const [songwriterMetronomeOnRecord, setSongwriterMetronomeOnRecord] = useState(true);
  const [songwriterCountInBars, setSongwriterCountInBars] = useState(1);
  const [songwriterPreRollBars, setSongwriterPreRollBars] = useState(0);
  const [songwriterGrooveOnRecord, setSongwriterGrooveOnRecord] = useState(true);
  const [songwriterGrooveCategory, setSongwriterGrooveCategory] = useState<DrumGrooveCategory | "all">("all");
  const [songwriterSelectedGrooveId, setSongwriterSelectedGrooveId] = useState("thall-half-time");
  const [songwriterSmartNotes, setSongwriterSmartNotes] = useState<string[]>([]);
  const [songwriterLiveDrumsEnabled, setSongwriterLiveDrumsEnabled] = useState(true);
  const [songwriterAmpSimEnabled, setSongwriterAmpSimEnabled] = useState(true);
  const [songwriterGuitarTonePresetId, setSongwriterGuitarTonePresetId] = useState("obsidian-thall-rhythm");
  const [songwriterAmpGain, setSongwriterAmpGain] = useState(7);
  const [songwriterAmpTone, setSongwriterAmpTone] = useState(55);
  const [songwriterTransposeSemitones, setSongwriterTransposeSemitones] = useState(0);
  const [songwriterBassEnabled, setSongwriterBassEnabled] = useState(true);
  const [songwriterBassDrive, setSongwriterBassDrive] = useState(58);
  const [songwriterBassLevel, setSongwriterBassLevel] = useState(70);
  const [songwriterBassRootMidi, setSongwriterBassRootMidi] = useState(28);
  const [songwriterBassOctaveOffset, setSongwriterBassOctaveOffset] = useState(0);
  const [songwriterBassHumanizeMs, setSongwriterBassHumanizeMs] = useState(8);
  const [songwriterBassClick, setSongwriterBassClick] = useState(72);
  const [isSongwriterBassPlaying, setIsSongwriterBassPlaying] = useState(false);
  const [songwriterAudioCheck, setSongwriterAudioCheck] = useState<string[]>([]);
  const [isCreatingSongwriterPack, setIsCreatingSongwriterPack] = useState(false);
  const [isCreatingExportPack, setIsCreatingExportPack] = useState(false);
  const [songwriterExportNotice, setSongwriterExportNotice] = useState<ExportNotice | null>(null);
  const [exportNotice, setExportNotice] = useState<ExportNotice | null>(null);
  const [renderedPreview, setRenderedPreview] = useState<RenderedPreview | null>(null);
  const [directAudioNotice, setDirectAudioNotice] = useState<DirectAudioNotice | null>(null);
  const [isRenderingDirectAudio, setIsRenderingDirectAudio] = useState(false);
  const [songwriterTakeName, setSongwriterTakeName] = useState("riff-idea");
  const [showBackingAdvancedEditor, setShowBackingAdvancedEditor] = useState(false);
  const songwriterRecorderRef = useRef<MediaRecorder | null>(null);
  const songwriterStreamRef = useRef<MediaStream | null>(null);
  const songwriterTimerRef = useRef<number | null>(null);
  const songwriterMeterContextRef = useRef<AudioContext | null>(null);
  const songwriterMeterAnalyserRef = useRef<AnalyserNode | null>(null);
  const songwriterMeterFrameRef = useRef<number | null>(null);
  const songwriterAudioInputDeviceIdRef = useRef("default");
  const songwriterAudioOutputDeviceIdRef = useRef("default");
  const songwriterSampleRateRef = useRef<SongwriterSampleRate>(48000);
  const songwriterBufferSizeRef = useRef<SongwriterBufferSize>(128);
  const songwriterIrRef = useRef<SongwriterIrState>({ fileName: "", buffer: null });
  const songwriterTunerEnabledRef = useRef(true);
  const songwriterLiveDrumsEnabledRef = useRef(true);
  const songwriterAmpSimEnabledRef = useRef(true);
  const songwriterAmpGainRef = useRef(7);
  const songwriterAmpToneRef = useRef(55);
  const songwriterTransposeSemitonesRef = useRef(0);
  const songwriterIsRecordingRef = useRef(false);
  const songwriterRecordingStartRef = useRef<number | null>(null);
  const songwriterLastLiveOnsetRef = useRef(-1000);
  const songwriterLastRmsRef = useRef(0);
  const songwriterLastTunerUpdateRef = useRef(0);
  const songwriterMetronomeContextRef = useRef<AudioContext | null>(null);
  const songwriterMetronomeIntervalRef = useRef<number | null>(null);
  const songwriterMetronomeBeatRef = useRef(0);
  const songwriterMetronomeStartedByRecordingRef = useRef(false);
  const songwriterPendingRecordTimerRef = useRef<number | null>(null);
  const songwriterAmpMonitorNodesRef = useRef<SongwriterAmpMonitorNodes | null>(null);
  const songwriterBassContextRef = useRef<AudioContext | null>(null);
  const songwriterBassStopTimerRef = useRef<number | null>(null);
  const songwriterTapStartRef = useRef<number | null>(null);
  const songwriterLastTapRef = useRef<number | null>(null);

  const activeWorkflow = workflowForPreset(template.presetId);
  const showAdvancedReaperEditor = activeWorkflow === "cover" || (activeWorkflow === "backing" && showBackingAdvancedEditor);
  const visiblePresets = useMemo(
    () =>
      templatePresets.filter((preset) => {
        if (activeWorkflow === "songwriter") {
          return preset.id === "songwriter-lab";
        }

        return activeWorkflow === "backing" ? preset.id === "backing-track-creator" : coverPresetIds.includes(preset.id);
      }),
    [activeWorkflow]
  );
  const visibleSourceWorkflows = useMemo(
    () =>
      sourceWorkflowOptions.filter((workflow) =>
        activeWorkflow === "backing" ? workflow.id !== "cover-template" : workflow.id === "cover-template"
      ),
    [activeWorkflow]
  );
  const validationErrors = useMemo(() => validateTemplate(template), [template]);
  const trackIds = useMemo(() => new Set(template.tracks.map((track) => track.id)), [template.tracks]);
  const routeReferenceWarnings = useMemo(
    () => validationErrors.filter((error) => error.startsWith("Route ") && error.includes("points to an unknown")),
    [validationErrors]
  );
  const sourceReferenceWarnings = useMemo(
    () => validationErrors.filter((error) => error.startsWith("Source asset ") && error.includes("unknown target track")),
    [validationErrors]
  );
  const sessionChecks = useMemo(() => getSessionChecks(template), [template]);
  const sourceSummary = useMemo(() => getSourceSummary(template), [template]);
  const importedSources = useMemo(
    () => template.sourceAssets.filter((source) => sourcePreviewFileName(source) || source.filePath.trim() || source.sourceUrl.trim()),
    [template.sourceAssets]
  );
  const backingPreviewTemplate = useMemo(
    () =>
      activeWorkflow === "backing"
        ? createBackingTemplateFromSelection(
            withBackingRequestNotes(template, backingCreationMode, backingRemovedInstrumentIds),
            selectedBackingPartSourceIds
          )
        : template,
    [activeWorkflow, backingCreationMode, backingRemovedInstrumentIds, selectedBackingPartSourceIds, template]
  );
  const songwriterSketch = useMemo(
    () =>
      createSongwriterSketch({
        songName: template.songName,
        artist: template.artist,
        tuning: template.tuning,
        tempo: template.tempo,
        mode: songwriterMode,
        feel: songwriterFeel,
        keyCenter: songwriterKeyCenter,
        riffRole: songwriterRiffRole,
        riffNotes: songwriterRiffNotes,
        sourceFileName: songwriterSource.fileName,
        sourceFilePath: songwriterSource.filePath,
        cabIrFileName: songwriterIr.fileName,
        onsets: songwriterOnsets,
        quantizeStrength: songwriterQuantizeStrength,
        humanizeMs: songwriterHumanizeMs,
        swingPercent: songwriterSwingPercent,
        sections: songwriterSections,
        drumHits: songwriterManualDrumHits ?? undefined,
        whammyEvents: songwriterWhammyEvents,
        ambientEffects: songwriterAmbientEffects
      }),
    [
      songwriterAmbientEffects,
      songwriterFeel,
      songwriterMode,
      songwriterOnsets,
      songwriterQuantizeStrength,
      songwriterHumanizeMs,
      songwriterIr.fileName,
      songwriterKeyCenter,
      songwriterManualDrumHits,
      songwriterSections,
      songwriterSource.fileName,
      songwriterSource.filePath,
      songwriterRiffNotes,
      songwriterRiffRole,
      songwriterWhammyEvents,
      songwriterSwingPercent,
      template.artist,
      template.songName,
      template.tempo,
      template.tuning
    ]
  );
  const songwriterJsonOutput = useMemo(() => serializeSongwriterSketch(songwriterSketch), [songwriterSketch]);
  const songwriterLuaOutput = useMemo(() => generateSongwriterLua(songwriterSketch), [songwriterSketch]);
  const thallLabNativePreset = useMemo(
    () =>
      createThallLabNativePreset({
        songName: template.songName,
        artist: template.artist,
        tuning: template.tuning,
        tempo: template.tempo,
        sourceFileName: songwriterSource.fileName,
        cabIrFileName: songwriterIr.fileName,
        outputMode: songwriterThallLabOutputMode,
        grooveId: songwriterSelectedGrooveId,
        guitarTonePresetId: songwriterGuitarTonePresetId,
        transposeSemitones: songwriterTransposeSemitones,
        ampEnabled: songwriterAmpSimEnabled,
        ampDrive: songwriterAmpGain,
        ampTone: songwriterAmpTone,
        bassEnabled: songwriterBassEnabled,
        bassRootMidi: songwriterBassRootMidi,
        bassOctaveOffset: songwriterBassOctaveOffset,
        bassDrive: songwriterBassDrive,
        bassClick: songwriterBassClick,
        bassLevel: songwriterBassLevel,
        bassHumanizeMs: songwriterBassHumanizeMs,
        pedals: songwriterPedals,
        whammyEvents: songwriterWhammyEvents,
        ambientEffects: songwriterAmbientEffects
      }),
    [
      songwriterAmbientEffects,
      songwriterAmpGain,
      songwriterAmpSimEnabled,
      songwriterAmpTone,
      songwriterBassClick,
      songwriterBassDrive,
      songwriterBassEnabled,
      songwriterBassHumanizeMs,
      songwriterBassLevel,
      songwriterBassOctaveOffset,
      songwriterBassRootMidi,
      songwriterGuitarTonePresetId,
      songwriterIr.fileName,
      songwriterPedals,
      songwriterSelectedGrooveId,
      songwriterSource.fileName,
      songwriterThallLabOutputMode,
      songwriterTransposeSemitones,
      songwriterWhammyEvents,
      template.artist,
      template.songName,
      template.tempo,
      template.tuning
    ]
  );
  const thallLabNativePresetJson = useMemo(() => serializeThallLabNativePreset(thallLabNativePreset), [thallLabNativePreset]);
  const songwriterArrangementSummary = useMemo(() => getSongwriterArrangementSummary(songwriterSections, template.tempo), [songwriterSections, template.tempo]);
  const filteredSongwriterGrooves = useMemo(
    () =>
      songwriterGrooveLibrary.filter((groove) => {
        const categoryMatches = songwriterGrooveCategory === "all" || groove.category === songwriterGrooveCategory;
        const tempoMatches = template.tempo >= groove.tempoMin - 20 && template.tempo <= groove.tempoMax + 20;
        return categoryMatches && tempoMatches;
      }),
    [songwriterGrooveCategory, template.tempo]
  );
  const selectedSongwriterGroove = useMemo(
    () => songwriterGrooveLibrary.find((groove) => groove.id === songwriterSelectedGrooveId) ?? songwriterGrooveLibrary[0],
    [songwriterSelectedGrooveId]
  );
  const luaOutput = useMemo(() => {
    try {
      return generateReaperLua(backingPreviewTemplate);
    } catch (error) {
      return error instanceof Error ? error.message : "Could not generate Lua.";
    }
  }, [backingPreviewTemplate]);
  const templateJsonOutput = useMemo(
    () => (activeWorkflow === "backing" ? serializeTemplate(backingPreviewTemplate) : jsonDraft),
    [activeWorkflow, backingPreviewTemplate, jsonDraft]
  );
  const activeLuaOutput = activeWorkflow === "songwriter" ? songwriterLuaOutput : luaOutput;
  const activeJsonOutput = activeWorkflow === "songwriter" ? songwriterJsonOutput : templateJsonOutput;

  useEffect(() => {
    setJsonDraft(serializeTemplate(template));
  }, [template]);

  useEffect(() => {
    setSongwriterSections(suggestSongSections(songwriterMode, songwriterFeel));
  }, [songwriterMode, songwriterFeel]);

  useEffect(() => {
    songwriterAudioInputDeviceIdRef.current = songwriterAudioInputDeviceId;
  }, [songwriterAudioInputDeviceId]);

  useEffect(() => {
    songwriterAudioOutputDeviceIdRef.current = songwriterAudioOutputDeviceId;
  }, [songwriterAudioOutputDeviceId]);

  useEffect(() => {
    songwriterSampleRateRef.current = songwriterSampleRate;
    songwriterBufferSizeRef.current = songwriterBufferSize;
    if (songwriterMonitorEnabled && songwriterStreamRef.current) {
      startSongwriterLevelMeter(songwriterStreamRef.current);
    }
  }, [songwriterBufferSize, songwriterSampleRate]);

  useEffect(() => {
    songwriterIrRef.current = songwriterIr;
  }, [songwriterIr]);

  useEffect(() => {
    songwriterTunerEnabledRef.current = songwriterTunerEnabled;
  }, [songwriterTunerEnabled]);

  useEffect(() => {
    songwriterLiveDrumsEnabledRef.current = songwriterLiveDrumsEnabled;
  }, [songwriterLiveDrumsEnabled]);

  useEffect(() => {
    songwriterAmpSimEnabledRef.current = songwriterAmpSimEnabled;
    songwriterAmpGainRef.current = songwriterAmpGain;
    songwriterAmpToneRef.current = songwriterAmpTone;
    songwriterTransposeSemitonesRef.current = songwriterTransposeSemitones;
    updateSongwriterAmpMonitorTone();
  }, [songwriterAmpGain, songwriterAmpSimEnabled, songwriterAmpTone, songwriterTransposeSemitones]);

  useEffect(() => {
    if (songwriterMonitorEnabled && songwriterStreamRef.current) {
      startSongwriterLevelMeter(songwriterStreamRef.current);
    }
  }, [songwriterAmpSimEnabled, songwriterIr.buffer]);

  useEffect(() => {
    songwriterIsRecordingRef.current = isSongwriterRecording;
  }, [isSongwriterRecording]);

  useEffect(() => {
    if (activeWorkflow === "songwriter") {
      void refreshSongwriterMicPermission();
      void refreshSongwriterAudioInputs(false);
    }
  }, [activeWorkflow]);

  useEffect(() => {
    if (activeWorkflow !== "songwriter") {
      stopSongwriterMetronome();
      if (isSongwriterRecording) {
        void stopSongwriterRecording().finally(() => {
          void setSongwriterMonitoring(false, false);
        });
      } else {
        void setSongwriterMonitoring(false, false);
      }
    }
  }, [activeWorkflow, isSongwriterRecording]);

  useEffect(
    () => () => {
      clearSongwriterRecordingTimer();
      stopSongwriterLevelMeter();
      stopSongwriterMetronome();
      stopSongwriterBassPreview();
      if (songwriterPendingRecordTimerRef.current !== null) {
        window.clearTimeout(songwriterPendingRecordTimerRef.current);
        songwriterPendingRecordTimerRef.current = null;
      }

      if (songwriterRecorderRef.current && songwriterRecorderRef.current.state !== "inactive") {
        songwriterRecorderRef.current.stop();
      }

      stopSongwriterInputStream();
    },
    []
  );

  function updateTemplateField<K extends keyof GuitarWorkflowTemplate>(key: K, value: GuitarWorkflowTemplate[K]) {
    setTemplate((current) => ({ ...current, [key]: value }));
  }

  function updateTrack(trackId: string, patch: Partial<TrackTemplate>) {
    setTemplate((current) => ({
      ...current,
      tracks: current.tracks.map((track) => (track.id === trackId ? { ...track, ...patch } : track))
    }));
  }

  function updateTrackId(trackId: string, nextTrackId: string) {
    setTemplate((current) => ({
      ...current,
      tracks: current.tracks.map((track) => (track.id === trackId ? { ...track, id: nextTrackId } : track)),
      routes: current.routes.map((route) => ({
        ...route,
        fromTrackId: route.fromTrackId === trackId ? nextTrackId : route.fromTrackId,
        toTrackId: route.toTrackId === trackId ? nextTrackId : route.toTrackId
      })),
      sourceAssets: current.sourceAssets.map((source) => ({
        ...source,
        targetTrackId: source.targetTrackId === trackId ? nextTrackId : source.targetTrackId
      }))
    }));
  }

  function addTrack() {
    setTemplate((current) => {
      const nextNumber = current.tracks.length + 1;
      const id = uniqueId(`track-${nextNumber}`, current.tracks.map((track) => track.id));
      return {
        ...current,
        tracks: [
          ...current.tracks,
          createTrack(id, `Guitar Track ${nextNumber}`, "input", "#8bd3dd", false, "mono", 1, 0, "")
        ]
      };
    });
  }

  function removeTrack(trackId: string) {
    setTemplate((current) => ({
      ...current,
      tracks: current.tracks.filter((track) => track.id !== trackId),
      routes: current.routes.filter((route) => route.fromTrackId !== trackId && route.toTrackId !== trackId)
    }));
  }

  function updateRoute(routeId: string, patch: Partial<RouteTemplate>) {
    setTemplate((current) => ({
      ...current,
      routes: current.routes.map((route) => (route.id === routeId ? { ...route, ...patch } : route))
    }));
  }

  function addRoute() {
    if (template.tracks.length < 2) {
      setStatus("Add at least two tracks before adding a route.");
      return;
    }

    setTemplate((current) => {
      const id = uniqueId(`route-${current.routes.length + 1}`, current.routes.map((route) => route.id));
      const route = createRoute(id, current.tracks[0].id, current.tracks[1].id, "post-fader", 0, 0);
      return { ...current, routes: [...current.routes, route] };
    });
  }

  function removeRoute(routeId: string) {
    setTemplate((current) => ({
      ...current,
      routes: current.routes.filter((route) => route.id !== routeId)
    }));
  }

  function updateMarker(markerId: string, patch: Partial<ProjectMarkerTemplate>) {
    setTemplate((current) => ({
      ...current,
      markers: current.markers.map((marker) => (marker.id === markerId ? { ...marker, ...patch } : marker))
    }));
  }

  function addMarker() {
    setTemplate((current) => {
      const nextNumber = current.markers.length + 1;
      const id = uniqueId(`marker-${nextNumber}`, current.markers.map((marker) => marker.id));

      return {
        ...current,
        markers: [...current.markers, createMarker(id, `MARKER ${nextNumber}`, 0)]
      };
    });
  }

  function removeMarker(markerId: string) {
    setTemplate((current) => ({
      ...current,
      markers: current.markers.filter((marker) => marker.id !== markerId)
    }));
  }

  function updateSourceAsset(sourceId: string, patch: Partial<SourceAssetTemplate>) {
    setTemplate((current) => ({
      ...current,
      sourceAssets: current.sourceAssets.map((source) => (source.id === sourceId ? { ...source, ...patch } : source))
    }));
  }

  function updateSourceAssetId(sourceId: string, nextSourceId: string) {
    setTemplate((current) => ({
      ...current,
      sourceAssets: current.sourceAssets.map((source) => (source.id === sourceId ? { ...source, id: nextSourceId } : source))
    }));
  }

  function addSourceAsset() {
    setTemplate((current) => {
      const nextNumber = current.sourceAssets.length + 1;
      const id = uniqueId(`source-${nextNumber}`, current.sourceAssets.map((source) => source.id));

      return {
        ...current,
        sourceAssets: [...current.sourceAssets, createSourceAsset(id, `Source ${nextNumber}`, "local-file")]
      };
    });
  }

  function removeSourceAsset(sourceId: string) {
    setTemplate((current) => ({
      ...current,
      sourceAssets: current.sourceAssets.filter((source) => source.id !== sourceId)
    }));
  }

  function resetTemplate() {
    const nextTemplate = createTemplateFromPreset(template.presetId);
    setTemplate(nextTemplate);
    if (nextTemplate.presetId === "backing-track-creator") {
      setBackingCreationMode("remove-instruments");
      setBackingRemovedInstrumentIds(["guitars"]);
      setSelectedBackingPartSourceIds(["main-backing-source"]);
    }
    setExportNotice(null);
    setSongwriterExportNotice(null);
    setRenderedPreview(null);
    clearDirectAudioNotice();
    if (nextTemplate.presetId === "songwriter-lab") {
      setSongwriterMode("both");
      setSongwriterFeel("metalcore");
      setSongwriterQuantizeStrength(92);
      setSongwriterHumanizeMs(8);
      setSongwriterSwingPercent(55);
      setSongwriterKeyCenter("");
      setSongwriterRiffRole("main-riff");
      setSongwriterRiffNotes("");
      setSongwriterSections(suggestSongSections("both", "metalcore"));
      setSongwriterSource({ fileName: "", filePath: "" });
      setSongwriterOnsets([]);
      setSongwriterManualDrumHits(null);
      setSongwriterTakeName("riff-idea");
      setSongwriterAutoExportEnabled(true);
      setSongwriterMetronomeOnRecord(true);
      setSongwriterThallLabOutputMode("stereo");
      stopSongwriterMetronome();
      void setSongwriterMonitoring(false, false);
      setShowBackingAdvancedEditor(false);
    }
    setStatus("Template preset restored.");
  }

  function applyPreset(presetId: TemplatePresetId) {
    setTemplate((current) => createTemplateFromPresetWithMetadata(presetId, current));
    if (presetId === "backing-track-creator") {
      setBackingCreationMode("remove-instruments");
      setBackingRemovedInstrumentIds(["guitars"]);
      setSelectedBackingPartSourceIds(["main-backing-source"]);
    }
    setExportNotice(null);
    setSongwriterExportNotice(null);
    setRenderedPreview(null);
    clearDirectAudioNotice();
    if (presetId === "songwriter-lab") {
      setSongwriterMode("both");
      setSongwriterFeel("metalcore");
      setSongwriterQuantizeStrength(92);
      setSongwriterHumanizeMs(8);
      setSongwriterSwingPercent(55);
      setSongwriterKeyCenter("");
      setSongwriterRiffRole("main-riff");
      setSongwriterRiffNotes("");
      setSongwriterSections(suggestSongSections("both", "metalcore"));
      setSongwriterManualDrumHits(null);
      setSongwriterTakeName("riff-idea");
      setSongwriterAutoExportEnabled(true);
      setSongwriterMetronomeOnRecord(true);
      setSongwriterThallLabOutputMode("stereo");
      setShowBackingAdvancedEditor(false);
    } else if (presetId === "backing-track-creator") {
      stopSongwriterMetronome();
      void setSongwriterMonitoring(false, false);
      setShowBackingAdvancedEditor(false);
    }
    setStatus(`${templatePresets.find((preset) => preset.id === presetId)?.label ?? "Template"} loaded.`);
  }

  function applyWorkflow(workflow: WorkflowMode) {
    if (workflow === activeWorkflow) {
      return;
    }

    if (workflow === "songwriter") {
      applyPreset("songwriter-lab");
      return;
    }

    applyPreset(workflow === "backing" ? "backing-track-creator" : "guitar-routing-cover");
  }

  function loadJsonDraft() {
    try {
      const parsed = loadTemplateFromJson(jsonDraft);
      setTemplate(parsed);
      if (parsed.presetId === "backing-track-creator") {
        setSelectedBackingPartSourceIds(getBackingSelectionFromTemplate(parsed));
      }
      setStatus("JSON loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load JSON.");
    }
  }

  function importJsonFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = loadTemplateFromJson(String(reader.result));
        setTemplate(parsed);
        if (parsed.presetId === "backing-track-creator") {
          setSelectedBackingPartSourceIds(getBackingSelectionFromTemplate(parsed));
        }
        setStatus(`${file.name} loaded.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not load JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setStatus(`${label} copied.`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local REAPER script builder</p>
          <h1>Guitar Workflow Toolkit</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost-button" onClick={resetTemplate} title="Reset template">
            <RotateCcw aria-hidden="true" size={18} />
            Reset
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              void (activeWorkflow === "songwriter"
                ? saveSongwriterBundle()
                : activeWorkflow === "backing"
                  ? saveBackingTrackBundle()
                  : saveExportBundle())
            }
            title="Create run-workflow.lua, JSON, manifests, and REAPER helper files"
            disabled={validationErrors.length > 0 || isCreatingExportPack || isCreatingSongwriterPack}
          >
            <Save aria-hidden="true" size={18} />
            {activeWorkflow === "songwriter"
              ? isCreatingSongwriterPack
                ? "Creating..."
                : "Create Songwriter Pack"
              : isCreatingExportPack
                ? "Creating..."
                : activeWorkflow === "backing"
                  ? "Create Backing Track"
                  : "Create Files"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => void saveTextFile(createExportFileName(template.name, "lua"), activeLuaOutput, "text/plain")}
            title="Download Lua script"
            disabled={validationErrors.length > 0}
          >
            <Download aria-hidden="true" size={18} />
            Lua
          </button>
        </div>
      </header>

      <nav className="workflow-tabs" aria-label="Workflow modes">
        <button
          type="button"
          className={activeWorkflow === "cover" ? "workflow-tab active" : "workflow-tab"}
          onClick={() => applyWorkflow("cover")}
          aria-pressed={activeWorkflow === "cover"}
        >
          <FileCode2 aria-hidden="true" size={17} />
          Cover Templates
        </button>
        <button
          type="button"
          className={activeWorkflow === "backing" ? "workflow-tab active" : "workflow-tab"}
          onClick={() => applyWorkflow("backing")}
          aria-pressed={activeWorkflow === "backing"}
        >
          <Save aria-hidden="true" size={17} />
          Backing Track Creator
        </button>
        <button
          type="button"
          className={activeWorkflow === "songwriter" ? "workflow-tab active" : "workflow-tab"}
          onClick={() => applyWorkflow("songwriter")}
          aria-pressed={activeWorkflow === "songwriter"}
        >
          <Music2 aria-hidden="true" size={17} />
          Songwriter Lab
        </button>
      </nav>

      <section className="workspace-grid">
        <section className="panel settings-panel" aria-labelledby="settings-heading">
          <div className="section-heading">
            <Settings aria-hidden="true" size={18} />
            <h2 id="settings-heading">Template</h2>
          </div>

          <label>
            Preset
            <select value={template.presetId} onChange={(event) => applyPreset(event.target.value as TemplatePresetId)}>
              {visiblePresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Name
            <input value={template.name} onChange={(event) => updateTemplateField("name", event.target.value)} />
          </label>

          <label>
            Song
            <input value={template.songName} onChange={(event) => updateTemplateField("songName", event.target.value)} />
          </label>

          <label>
            Artist
            <input value={template.artist} onChange={(event) => updateTemplateField("artist", event.target.value)} />
          </label>

          <label>
            Tuning
            <input value={template.tuning} onChange={(event) => updateTemplateField("tuning", event.target.value)} />
          </label>

          <label>
            Tempo
            <input
              type="number"
              min="20"
              max="300"
              value={template.tempo}
              onChange={(event) => updateTemplateField("tempo", Number(event.target.value))}
            />
          </label>

          {activeWorkflow !== "songwriter" ? (
            <>
              <label className="full-span">
                Source Format
                <input value={template.sourceFormat} onChange={(event) => updateTemplateField("sourceFormat", event.target.value)} />
              </label>

              <label className="full-span">
                Source Workflow
                <select
                  value={template.sourceWorkflow}
                  onChange={(event) => updateTemplateField("sourceWorkflow", event.target.value as SourceWorkflow)}
                >
                  {visibleSourceWorkflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-span">
                Source Notes
                <textarea
                  rows={3}
                  value={template.sourceNotes}
                  onChange={(event) => updateTemplateField("sourceNotes", event.target.value)}
                />
              </label>
            </>
          ) : null}

          <label className="full-span">
            Description
            <textarea
              rows={3}
              value={template.description}
              onChange={(event) => updateTemplateField("description", event.target.value)}
            />
          </label>

          <div className="status-line" role="status">
            {validationErrors.length > 0 ? validationErrors[0] : status}
          </div>
        </section>

        <section className="panel session-panel" aria-labelledby="session-heading">
          <div className="section-heading">
            {activeWorkflow === "songwriter" ? <Music2 aria-hidden="true" size={18} /> : <FileCode2 aria-hidden="true" size={18} />}
            <h2 id="session-heading">{activeWorkflow === "songwriter" ? "Songwriter Check" : "REAPER Session Check"}</h2>
          </div>

          {activeWorkflow === "songwriter" ? (
            <div className="session-check-list">
              <div className={`session-check ${songwriterSource.filePath ? "pass" : "warning"}`}>
                <span className="check-dot" aria-hidden="true" />
                <div>
                  <strong>Guitar idea</strong>
                  <p>{songwriterSource.filePath ? `${songwriterSource.fileName} is imported.` : "Upload a guitar riff to analyze rhythm."}</p>
                </div>
              </div>
              <div className={`session-check ${songwriterSketch.drumHits.length > 0 ? "pass" : "warning"}`}>
                <span className="check-dot" aria-hidden="true" />
                <div>
                  <strong>Drum sketch</strong>
                  <p>{songwriterSketch.drumHits.length} guide hits generated from guitar attacks.</p>
                </div>
              </div>
              <div className="session-check pass">
                <span className="check-dot" aria-hidden="true" />
                <div>
                  <strong>Song sections</strong>
                  <p>{songwriterSketch.sections.length} writing sections ready for REAPER markers and notes.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="session-check-list">
              {sessionChecks.map((check) => (
                <div className={`session-check ${check.status}`} key={check.id}>
                  <span className="check-dot" aria-hidden="true" />
                  <div>
                    <strong>{check.label}</strong>
                    <p>{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {activeWorkflow !== "songwriter" && exportNotice ? (
          <section className="panel export-panel" aria-labelledby="export-heading">
            <div className="section-heading">
              <Save aria-hidden="true" size={18} />
              <h2 id="export-heading">Plugin Pack Export</h2>
            </div>
            <div className="export-ready-panel" role="status" aria-label="Export package ready">
              <strong>{exportNotice.mode === "local" ? "Export ready" : "Downloads started"}</strong>
              <span>{exportNotice.path}</span>
              <ul>
                {exportNotice.files.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
              <RenderPreviewPanel renderedPreview={renderedPreview} onImport={importRenderedPreviewFile} />
            </div>
          </section>
        ) : null}

        {activeWorkflow === "songwriter" ? (
          <section className="panel songwriter-panel" aria-labelledby="songwriter-heading">
            <div className="section-heading with-action">
              <div>
                <Music2 aria-hidden="true" size={18} />
                <h2 id="songwriter-heading">Songwriter Lab</h2>
              </div>
            </div>

            <div className="source-workflow-card">
              <div className="simple-step">
                <span>1</span>
                <div>
                  <h3>Record or upload guitar idea</h3>
                  <p>Capture a take from mic, or import a riff file. The app detects attacks and builds a drum-guide sketch.</p>
                </div>
              </div>

              <div className="songwriter-capture-settings">
                <label>
                  Take name
                  <input
                    value={songwriterTakeName}
                    onChange={(event) => setSongwriterTakeName(event.target.value)}
                    placeholder="riff-idea"
                    aria-label="Take name"
                  />
                </label>

                <label>
                  Input device
                  <select
                    value={songwriterAudioInputDeviceId}
                    onChange={(event) => void changeSongwriterAudioInputDevice(event.target.value)}
                    disabled={isSongwriterRecording}
                    aria-label="Input device"
                  >
                    <option value="default">System default input</option>
                    {songwriterAudioInputDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Output device
                  <select
                    value={songwriterAudioOutputDeviceId}
                    onChange={(event) => void changeSongwriterAudioOutputDevice(event.target.value)}
                    aria-label="Output device"
                  >
                    <option value="default">System default output</option>
                    {songwriterAudioOutputDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button type="button" className="ghost-button compact" onClick={() => void requestSongwriterMicAccess()} disabled={isSongwriterRecording}>
                  Allow mic
                </button>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterMonitorEnabled}
                    onChange={(event) => void setSongwriterMonitoring(event.target.checked)}
                    disabled={isSongwriterRecording}
                  />
                  Input monitor
                </label>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterTunerEnabled}
                    onChange={(event) => setSongwriterTunerEnabled(event.target.checked)}
                  />
                  Tuner
                </label>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterAmpSimEnabled}
                    onChange={(event) => setSongwriterAmpSimEnabled(event.target.checked)}
                  />
                  ChugForge Amp
                </label>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterAutoExportEnabled}
                    onChange={(event) => setSongwriterAutoExportEnabled(event.target.checked)}
                  />
                  Auto-create pack after record
                </label>

                <button type="button" className="ghost-button compact" onClick={() => void refreshSongwriterAudioInputs(true)}>
                  Refresh audio
                </button>

                <button
                  type="button"
                  className={songwriterMetronomeEnabled ? "ghost-button compact active" : "ghost-button compact"}
                  onClick={() => void toggleSongwriterMetronome()}
                >
                  <Timer aria-hidden="true" size={15} />
                  {songwriterMetronomeEnabled ? "Metronome on" : "Metronome off"}
                </button>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterMetronomeOnRecord}
                    onChange={(event) => setSongwriterMetronomeOnRecord(event.target.checked)}
                  />
                  Start metronome on record
                </label>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterGrooveOnRecord}
                    onChange={(event) => setSongwriterGrooveOnRecord(event.target.checked)}
                  />
                  Groove on record
                </label>

                <label className="switch-label songwriter-switch">
                  <input
                    type="checkbox"
                    checked={songwriterLiveDrumsEnabled}
                    onChange={(event) => setSongwriterLiveDrumsEnabled(event.target.checked)}
                  />
                  Live drum follow
                </label>

                <button type="button" className="ghost-button compact" onClick={() => void runSongwriterAudioCheck()}>
                  Audio check
                </button>
              </div>

              <div className="audio-engine-panel">
                <div>
                  <strong>Audio engine</strong>
                  <span>
                    Browser WebAudio low-latency monitor. Use 48 kHz / 128 samples and turn off interface direct monitoring if you hear an echo.
                    ASIO-level feel needs the JUCE/REAPER native path.
                  </span>
                </div>
                <label>
                  Sample rate
                  <select value={songwriterSampleRate} onChange={(event) => setSongwriterSampleRate(Number(event.target.value) as SongwriterSampleRate)}>
                    <option value={44100}>44.1 kHz</option>
                    <option value={48000}>48 kHz</option>
                    <option value={96000}>96 kHz</option>
                  </select>
                </label>
                <label>
                  Buffer
                  <select value={songwriterBufferSize} onChange={(event) => setSongwriterBufferSize(Number(event.target.value) as SongwriterBufferSize)}>
                    <option value={128}>128 samples - lowest browser latency</option>
                    <option value={256}>256 samples</option>
                    <option value={512}>512 samples</option>
                    <option value={1024}>1024 samples</option>
                  </select>
                </label>
                <label>
                  Export depth
                  <select value={songwriterRenderBitDepth} onChange={(event) => setSongwriterRenderBitDepth(Number(event.target.value) as SongwriterBitDepth)}>
                    <option value={16}>16-bit WAV</option>
                    <option value={24}>24-bit target</option>
                  </select>
                </label>
                <label>
                  JUCE output
                  <select
                    value={songwriterThallLabOutputMode}
                    onChange={(event) => setSongwriterThallLabOutputMode(event.target.value as ThallLabOutputMode)}
                  >
                    {thallLabOutputModeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="groove-library-panel">
                <div className="simple-step">
                  <span>GL</span>
                  <div>
                    <h3>MIDI Groove Library</h3>
                    <p>Pick a starting drum groove, apply it to the grid, and use count-in/pre-roll before recording takes.</p>
                  </div>
                </div>
                <div className="groove-library-controls">
                  <label>
                    Category
                    <select value={songwriterGrooveCategory} onChange={(event) => setSongwriterGrooveCategory(event.target.value as DrumGrooveCategory | "all")}>
                      {grooveCategoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Groove
                    <select value={songwriterSelectedGrooveId} onChange={(event) => setSongwriterSelectedGrooveId(event.target.value)}>
                      {(filteredSongwriterGrooves.length ? filteredSongwriterGrooves : songwriterGrooveLibrary).map((groove) => (
                        <option key={groove.id} value={groove.id}>
                          {groove.name} ({groove.tempoMin}-{groove.tempoMax} BPM)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Count-in
                    <select value={songwriterCountInBars} onChange={(event) => setSongwriterCountInBars(Number(event.target.value))}>
                      <option value={0}>Off</option>
                      <option value={1}>1 bar</option>
                      <option value={2}>2 bars</option>
                    </select>
                  </label>
                  <label>
                    Pre-roll
                    <select value={songwriterPreRollBars} onChange={(event) => setSongwriterPreRollBars(Number(event.target.value))}>
                      <option value={0}>Off</option>
                      <option value={1}>1 bar</option>
                      <option value={2}>2 bars</option>
                    </select>
                  </label>
                </div>
                <div className="groove-library-actions">
                  <button type="button" className="primary-button compact" onClick={applySmartSongEnginePlan}>
                    Smart suggest
                  </button>
                  <button type="button" className="primary-button compact" onClick={() => applySongwriterGroove(songwriterSelectedGrooveId)}>
                    Apply groove
                  </button>
                  <button type="button" className="ghost-button compact" onClick={applyNextSongwriterGroove}>
                    Next groove
                  </button>
                  <button type="button" className="ghost-button compact" onClick={() => playSongwriterGroovePreview(songwriterSelectedGrooveId)}>
                    Preview groove
                  </button>
                </div>
                <p className="source-storage-hint">
                  {selectedSongwriterGroove.name}: {selectedSongwriterGroove.description}
                </p>
                {songwriterSmartNotes.length > 0 ? (
                  <div className="smart-song-notes" role="status" aria-label="Smart song engine suggestions">
                    {songwriterSmartNotes.map((note) => (
                      <p key={note}>{note}</p>
                    ))}
                  </div>
                ) : null}
              </div>

              <p className="recording-hint">
                Mic permission:{" "}
                {songwriterMicPermission === "granted"
                  ? "granted"
                  : songwriterMicPermission === "denied"
                    ? "denied"
                    : songwriterMicPermission === "prompt"
                      ? "ask"
                      : songwriterMicPermission === "unsupported"
                        ? "not supported"
                        : "unknown"}
              </p>

              <div className="songwriter-ingest-actions">
                <label className="quick-upload primary large-upload">
                  <Upload aria-hidden="true" size={20} />
                  <span>Upload guitar audio</span>
                  <input type="file" accept=".wav,.mp3,.flac,.aif,.aiff,.ogg,.m4a,.webm" onChange={importSongwriterGuitarFile} />
                </label>

                <button
                  type="button"
                  className={isSongwriterRecording ? "ghost-button large-upload recording-button" : "ghost-button large-upload"}
                  onClick={() => void (isSongwriterRecording ? stopSongwriterRecording() : startSongwriterRecording())}
                >
                  {isSongwriterRecording ? <Square aria-hidden="true" size={20} /> : <Mic aria-hidden="true" size={20} />}
                  {isSongwriterRecording ? `Stop recording (${songwriterRecordingSeconds}s)` : "Record guitar"}
                </button>
              </div>

              {isSongwriterRecording ? <p className="recording-hint">Recording from microphone...</p> : null}
              {songwriterMonitorEnabled ? <p className="recording-hint">Input monitor is active.</p> : null}
              {isSongwriterRecording || songwriterMonitorEnabled ? (
                <div className="recording-meter" aria-label="Microphone level meter">
                  <span>Mic level</span>
                  <div className="recording-meter-track" aria-hidden="true">
                    <div className="recording-meter-fill" style={{ width: `${Math.max(3, Math.round(songwriterInputLevel))}%` }} />
                  </div>
                </div>
              ) : null}

              {songwriterTunerEnabled ? (
                <div className="tuner-panel" role="status" aria-label="Live guitar tuner">
                  <strong>{songwriterTunerReadout.note}</strong>
                  <span>{songwriterTunerReadout.frequency > 0 ? `${songwriterTunerReadout.frequency.toFixed(1)} Hz` : "Play a single note"}</span>
                  <div className="tuner-strip" aria-hidden="true">
                    <div className="tuner-center" />
                    <div className="tuner-needle" style={{ left: `${Math.min(100, Math.max(0, 50 + songwriterTunerReadout.cents))}%` }} />
                  </div>
                  <small>
                    {songwriterTunerReadout.frequency > 0
                      ? `${songwriterTunerReadout.cents > 0 ? "+" : ""}${songwriterTunerReadout.cents} cents`
                      : "Enable input monitor or recording for live pitch."}
                  </small>
                </div>
              ) : null}

              {songwriterAudioCheck.length > 0 ? (
                <div className="audio-check-list" role="status" aria-label="Audio check results">
                  {songwriterAudioCheck.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : null}

              <div className="ir-loader-panel">
                <div>
                  <strong>Cab IR</strong>
                  <span>{songwriterIr.fileName ? songwriterIr.fileName : "No custom IR loaded. ChugForge uses the built-in cab filter."}</span>
                </div>
                <label className="quick-upload compact-upload">
                  <Upload aria-hidden="true" size={16} />
                  <span>Load IR</span>
                  <input type="file" accept=".wav,.aif,.aiff,.flac,.mp3,.ogg,.m4a" onChange={(event) => void importSongwriterIr(event)} />
                </label>
                <button type="button" className="ghost-button compact" onClick={clearSongwriterIr} disabled={!songwriterIr.fileName}>
                  Clear IR
                </button>
              </div>


              {songwriterSource.fileName ? (
                <div className="songwriter-preview">
                  <strong>{songwriterSource.fileName}</strong>
                  <audio controls preload="metadata" src={createImportedFileUrl(songwriterSource.fileName)} />
                </div>
              ) : (
                <p className="empty-state">No guitar idea imported yet.</p>
              )}

              <div className="simple-step">
                <span>2</span>
                <div>
                  <h3>Choose what to create</h3>
                  <p>Use the rhythm for drums, continue the song idea, or do both in one REAPER pack.</p>
                </div>
              </div>

              <div className="output-mode-options songwriter-options">
                {songwriterModeOptions.map((option) => (
                  <label className={songwriterMode === option.id ? "output-option active" : "output-option"} key={option.id}>
                    <input
                      type="radio"
                      name="songwriter-mode"
                      value={option.id}
                      checked={songwriterMode === option.id}
                      onChange={() => {
                        setSongwriterManualDrumHits(null);
                        setSongwriterMode(option.id);
                      }}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>

              <label className="songwriter-feel">
                Feel
                <select
                  value={songwriterFeel}
                  onChange={(event) => {
                    setSongwriterManualDrumHits(null);
                    setSongwriterFeel(event.target.value as SongwriterFeel);
                  }}
                >
                  {songwriterFeelOptions.map((feel) => (
                    <option key={feel.id} value={feel.id}>
                      {feel.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="songwriter-riff-grid">
                <label>
                  Key / root
                  <input
                    value={songwriterKeyCenter}
                    onChange={(event) => setSongwriterKeyCenter(event.target.value)}
                    placeholder="Drop E root, F#, C minor..."
                    aria-label="Songwriter key or root note"
                  />
                </label>
                <label>
                  Riff role
                  <select
                    value={songwriterRiffRole}
                    onChange={(event) => setSongwriterRiffRole(event.target.value as RiffRole)}
                    aria-label="Riff role"
                  >
                    {riffRoleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-span">
                  Riff notes
                  <textarea
                    rows={2}
                    value={songwriterRiffNotes}
                    onChange={(event) => setSongwriterRiffNotes(event.target.value)}
                    placeholder="What should the next part do? More open chorus, lower breakdown answer, ambient lead..."
                    aria-label="Riff notes"
                  />
                </label>
              </div>

              <section className="amp-rig" aria-label="Thall Lab amp rig">
                <div className="amp-rig-header">
                  <div>
                    <span className="rig-eyebrow">Live Rig</span>
                    <h3>Thall Lab Console</h3>
                    <p>{getGuitarTonePreset(songwriterGuitarTonePresetId).description}</p>
                  </div>
                  <div className="rig-tuner-mini" aria-label="Compact tuner display">
                    <strong>{songwriterTunerReadout.note}</strong>
                    <span>{songwriterTunerReadout.frequency > 0 ? `${songwriterTunerReadout.frequency.toFixed(1)} Hz` : "Tuner idle"}</span>
                  </div>
                </div>

                <div className="rig-preset-strip" aria-label="Guitar tone presets">
                  {guitarTonePresets.map((preset) => (
                    <button
                      type="button"
                      className={songwriterGuitarTonePresetId === preset.id ? "rig-preset active" : "rig-preset"}
                      key={preset.id}
                      onClick={() => applyGuitarTonePreset(preset.id)}
                    >
                      <span>{preset.category}</span>
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="pedal-chain" aria-label="Forge pedalboard">
                  {songwriterPedals.map((pedal) => (
                    <article className={pedal.enabled ? `stompbox active ${pedal.type}` : `stompbox ${pedal.type}`} key={pedal.id}>
                      <div className="stompbox-top">
                        <span className="led" aria-hidden="true" />
                        <small>{pedal.type.replace(/-/g, " ")}</small>
                      </div>
                      <strong>{pedal.name}</strong>
                      <div className="stompbox-knobs">
                        <KnobControl
                          label="Amount"
                          min={0}
                          max={100}
                          value={pedal.amount}
                          unit="%"
                          size="small"
                          onChange={(value) => updateForgePedal(pedal.id, { amount: value })}
                        />
                        <KnobControl
                          label="Tone"
                          min={0}
                          max={100}
                          value={pedal.tone}
                          unit="%"
                          size="small"
                          onChange={(value) => updateForgePedal(pedal.id, { tone: value })}
                        />
                        <KnobControl
                          label="Mix"
                          min={0}
                          max={100}
                          value={pedal.mix}
                          unit="%"
                          size="small"
                          onChange={(value) => updateForgePedal(pedal.id, { mix: value })}
                        />
                      </div>
                      <button
                        type="button"
                        className="footswitch"
                        onClick={() => updateForgePedal(pedal.id, { enabled: !pedal.enabled })}
                        aria-pressed={pedal.enabled}
                        aria-label={`${pedal.enabled ? "Disable" : "Enable"} ${pedal.name}`}
                      >
                        <span />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="rack-modules">
                  <section className={songwriterAmpSimEnabled ? "amp-head active" : "amp-head"} aria-label="ChugForge amp head">
                    <div className="module-topline">
                      <div>
                        <span className="rig-eyebrow">Amp</span>
                        <h4>ChugForge</h4>
                      </div>
                      <button
                        type="button"
                        className={songwriterAmpSimEnabled ? "power-button active" : "power-button"}
                        onClick={() => setSongwriterAmpSimEnabled((current) => !current)}
                        aria-pressed={songwriterAmpSimEnabled}
                      >
                        {songwriterAmpSimEnabled ? "On" : "Bypass"}
                      </button>
                    </div>
                    <div className="knob-row">
                      <KnobControl label="Gain" min={1} max={12} value={songwriterAmpGain} onChange={setSongwriterAmpGain} />
                      <KnobControl label="Tone" min={20} max={90} value={songwriterAmpTone} unit="%" onChange={setSongwriterAmpTone} />
                      <KnobControl
                        label="Transpose"
                        min={-24}
                        max={24}
                        value={songwriterTransposeSemitones}
                        unit=" st"
                        displayValue={`${formatSignedValue(songwriterTransposeSemitones)} st`}
                        onChange={setSongwriterTransposeSemitones}
                      />
                    </div>
                  </section>

                  <section className={songwriterBassEnabled ? "bass-module active" : "bass-module"} aria-label="Forge Bass module">
                    <div className="module-topline">
                      <div>
                        <span className="rig-eyebrow">Bass</span>
                        <h4>Forge Bass</h4>
                      </div>
                      <button
                        type="button"
                        className={songwriterBassEnabled ? "power-button active" : "power-button"}
                        onClick={() => setSongwriterBassEnabled((current) => !current)}
                        aria-pressed={songwriterBassEnabled}
                      >
                        {songwriterBassEnabled ? "On" : "Mute"}
                      </button>
                    </div>
                    <div className="knob-row dense">
                      <KnobControl label="Drive" min={0} max={100} value={songwriterBassDrive} unit="%" onChange={setSongwriterBassDrive} />
                      <KnobControl label="Click" min={0} max={100} value={songwriterBassClick} unit="%" onChange={setSongwriterBassClick} />
                      <KnobControl label="Level" min={0} max={100} value={songwriterBassLevel} unit="%" onChange={setSongwriterBassLevel} />
                      <KnobControl label="Root" min={16} max={52} value={songwriterBassRootMidi} onChange={setSongwriterBassRootMidi} />
                      <KnobControl
                        label="Octave"
                        min={-2}
                        max={1}
                        value={songwriterBassOctaveOffset}
                        displayValue={formatSignedValue(songwriterBassOctaveOffset)}
                        onChange={setSongwriterBassOctaveOffset}
                      />
                      <KnobControl label="Humanize" min={0} max={35} value={songwriterBassHumanizeMs} unit=" ms" onChange={setSongwriterBassHumanizeMs} />
                    </div>
                  </section>

                  <section className="timing-module" aria-label="Rhythm timing module">
                    <div className="module-topline">
                      <div>
                        <span className="rig-eyebrow">Groove</span>
                        <h4>Timing</h4>
                      </div>
                    </div>
                    <div className="knob-row dense">
                      <KnobControl
                        label="Quantize"
                        min={0}
                        max={100}
                        value={songwriterQuantizeStrength}
                        unit="%"
                        onChange={(value) => {
                          setSongwriterManualDrumHits(null);
                          setSongwriterQuantizeStrength(value);
                        }}
                      />
                      <KnobControl
                        label="Feel"
                        min={0}
                        max={30}
                        value={songwriterHumanizeMs}
                        unit=" ms"
                        onChange={(value) => {
                          setSongwriterManualDrumHits(null);
                          setSongwriterHumanizeMs(value);
                        }}
                      />
                      <KnobControl
                        label="Swing"
                        min={50}
                        max={68}
                        value={songwriterSwingPercent}
                        unit="%"
                        onChange={(value) => {
                          setSongwriterManualDrumHits(null);
                          setSongwriterSwingPercent(value);
                        }}
                      />
                    </div>
                  </section>
                </div>
              </section>

              <div className="forge-bass-panel">
                <div>
                  <strong>Forge Bass</strong>
                  <span>
                    In-app virtual bass preview follows the guitar/drum rhythm. Export also includes bass-guide.mid and thall-lab-preset.json for JUCE.
                  </span>
                </div>
                <button
                  type="button"
                  className={isSongwriterBassPlaying ? "ghost-button compact active" : "primary-button compact"}
                  onClick={isSongwriterBassPlaying ? stopSongwriterBassPreview : playSongwriterBassPreview}
                  disabled={!songwriterBassEnabled || songwriterSketch.drumHits.length === 0}
                >
                  {isSongwriterBassPlaying ? "Stop bass" : "Play bass guide"}
                </button>
                <button type="button" className="ghost-button compact" onClick={() => void saveThallLabNativePreset()}>
                  Save JUCE preset
                </button>
              </div>

              <div className="fx-lab-panel">
                <div className="simple-step">
                  <span>FX</span>
                  <div>
                    <h3>Ambient Forge</h3>
                    <p>Build an original pedalboard and texture guide for gates, boosts, reverse swells, stutters, backwards chugs, ringmod screams, and whammy moves.</p>
                  </div>
                </div>

                <div className="ambient-effect-grid">
                  {songwriterAmbientEffects.map((effect) => (
                    <article className={effect.enabled ? "ambient-effect-card active" : "ambient-effect-card"} key={effect.id}>
                      <label className="switch-label songwriter-switch">
                        <input
                          type="checkbox"
                          checked={effect.enabled}
                          onChange={(event) => updateSongwriterAmbientEffect(effect.id, { enabled: event.target.checked })}
                        />
                        {ambientEffectUiLabel(effect.type)}
                      </label>
                      <label>
                        Mix ({effect.mix}%)
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effect.mix}
                          onChange={(event) => updateSongwriterAmbientEffect(effect.id, { mix: Number(event.target.value) })}
                        />
                      </label>
                      <label>
                        Size ({effect.size}%)
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effect.size}
                          onChange={(event) => updateSongwriterAmbientEffect(effect.id, { size: Number(event.target.value) })}
                        />
                      </label>
                      <label>
                        Feedback ({effect.feedback}%)
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effect.feedback}
                          onChange={(event) => updateSongwriterAmbientEffect(effect.id, { feedback: Number(event.target.value) })}
                        />
                      </label>
                      <textarea
                        rows={2}
                        value={effect.note}
                        onChange={(event) => updateSongwriterAmbientEffect(effect.id, { note: event.target.value })}
                        aria-label={`${ambientEffectUiLabel(effect.type)} note`}
                      />
                    </article>
                  ))}
                </div>

                <div className="whammy-preset-actions">
                  {whammyPresetOptions.map((preset) => (
                    <button type="button" className="ghost-button compact" key={preset.id} onClick={() => addSongwriterWhammyPreset(preset.id)}>
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="whammy-event-list">
                  {songwriterWhammyEvents.length === 0 ? (
                    <p className="empty-state">No pitch automation guide yet.</p>
                  ) : (
                    songwriterWhammyEvents.map((event) => (
                      <article className="whammy-event-card" key={event.id}>
                        <input
                          value={event.name}
                          onChange={(changeEvent) => updateSongwriterWhammyEvent(event.id, { name: changeEvent.target.value })}
                          aria-label={`${event.name} name`}
                        />
                        <label>
                          Start s
                          <input
                            type="number"
                            min="0"
                            step="0.05"
                            value={event.startSeconds}
                            onChange={(changeEvent) => updateSongwriterWhammyEvent(event.id, { startSeconds: Number(changeEvent.target.value) })}
                          />
                        </label>
                        <label>
                          Length s
                          <input
                            type="number"
                            min="0.05"
                            step="0.05"
                            value={event.durationSeconds}
                            onChange={(changeEvent) => updateSongwriterWhammyEvent(event.id, { durationSeconds: Number(changeEvent.target.value) })}
                          />
                        </label>
                        <label>
                          From
                          <input
                            type="number"
                            min="-24"
                            max="24"
                            value={event.startSemitones}
                            onChange={(changeEvent) => updateSongwriterWhammyEvent(event.id, { startSemitones: Number(changeEvent.target.value) })}
                          />
                        </label>
                        <label>
                          To
                          <input
                            type="number"
                            min="-24"
                            max="24"
                            value={event.endSemitones}
                            onChange={(changeEvent) => updateSongwriterWhammyEvent(event.id, { endSemitones: Number(changeEvent.target.value) })}
                          />
                        </label>
                        <label>
                          Curve
                          <select
                            value={event.curve}
                            onChange={(changeEvent) => updateSongwriterWhammyEvent(event.id, { curve: changeEvent.target.value as WhammyCurve })}
                          >
                            <option value="linear">Linear</option>
                            <option value="fast-rise">Fast rise</option>
                            <option value="slow-fall">Slow fall</option>
                          </select>
                        </label>
                        <button type="button" className="icon-button danger" onClick={() => removeSongwriterWhammyEvent(event.id)} title="Remove pitch event">
                          <Trash2 aria-hidden="true" size={15} />
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="simple-step thall-lab-step">
                <span>3</span>
                <div>
                  <h3>Build the Thall Lab groove</h3>
                  <p>Record with ChugForge Amp, let Live drum follow catch the chugs, then edit kick, snare, hat, and crash hits.</p>
                </div>
              </div>

              <div className="songwriter-stats">
                <span>{songwriterOnsets.length} guitar attacks</span>
                <span>{songwriterSketch.drumHits.length} drum guide hits</span>
                <span>{songwriterManualDrumHits ? "manual drum map" : "auto drum map"}</span>
                <span>{songwriterSketch.sections.length} song sections</span>
                <span>{songwriterArrangementSummary.totalBars} bars</span>
                <span>{formatSeconds(songwriterArrangementSummary.totalSeconds)} arrangement</span>
              </div>

              <div className="songwriter-rhythm-actions">
                <button type="button" className="primary-button compact" onClick={tapSongwriterRhythm}>
                  Tap rhythm
                </button>
                <button type="button" className="ghost-button compact" onClick={clearSongwriterRhythm}>
                  Clear rhythm
                </button>
              </div>

              <div className="drum-preset-actions" aria-label="Drum map presets">
                {drumPatternPresetOptions.map((preset) => (
                  <button
                    type="button"
                    className="ghost-button compact"
                    key={preset.id}
                    onClick={() => applySongwriterDrumPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <DrumMapEditor hits={songwriterSketch.drumHits} onToggle={toggleSongwriterDrumHit} />

              <div className="song-section-actions">
                {songSectionPresetOptions.map((preset) => (
                  <button
                    type="button"
                    className="ghost-button compact"
                    key={preset.id}
                    onClick={() => addSongwriterSectionPreset(preset.id)}
                  >
                    <Plus aria-hidden="true" size={15} />
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="ghost-button compact"
                  onClick={() => setSongwriterSections(suggestSongSections(songwriterMode, songwriterFeel))}
                >
                  <RotateCcw aria-hidden="true" size={15} />
                  Reset sections
                </button>
              </div>

              <div className="song-section-list">
                {songwriterSections.map((section, index) => (
                  <article className="song-section-card" key={`${section.name}-${index}`}>
                    <div className="song-section-meta">
                      Bar {songwriterArrangementSummary.starts[index].bar} - {formatSeconds(songwriterArrangementSummary.starts[index].timeSeconds)}
                    </div>
                    <div className="song-section-card-header">
                      <input
                        value={section.name}
                        onChange={(event) =>
                          setSongwriterSections((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        aria-label={`Section ${index + 1} name`}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => duplicateSongwriterSection(index)}
                        aria-label={`Duplicate ${section.name}`}
                        title="Duplicate section"
                      >
                        <Copy aria-hidden="true" size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => removeSongwriterSection(index)}
                        aria-label={`Delete ${section.name}`}
                        title="Delete section"
                        disabled={songwriterSections.length <= 1}
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </div>
                    <div className="song-section-move-row">
                      <button
                        type="button"
                        className="ghost-button compact"
                        onClick={() => moveSongwriterSection(index, -1)}
                        disabled={index === 0}
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        className="ghost-button compact"
                        onClick={() => moveSongwriterSection(index, 1)}
                        disabled={index === songwriterSections.length - 1}
                      >
                        Move down
                      </button>
                    </div>
                    <label>
                      Bars
                      <input
                        type="number"
                        min="1"
                        max="32"
                        value={section.bars}
                        onChange={(event) =>
                          setSongwriterSections((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, bars: Number(event.target.value) } : item
                            )
                          )
                        }
                        aria-label={`${section.name} bars`}
                      />
                    </label>
                    <textarea
                      rows={2}
                      value={section.guitarDirection}
                      onChange={(event) =>
                        setSongwriterSections((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, guitarDirection: event.target.value } : item
                          )
                        )
                      }
                      aria-label={`${section.name} guitar direction`}
                    />
                    <textarea
                      rows={2}
                      value={section.drumDirection}
                      onChange={(event) =>
                        setSongwriterSections((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, drumDirection: event.target.value } : item
                          )
                        )
                      }
                      aria-label={`${section.name} drum direction`}
                    />
                  </article>
                ))}
              </div>

              <div className="simple-generate-row">
                <p className="source-storage-hint">Creates Lua, JSON, rhythm sketch, and songwriting notes in the local D: app data folder.</p>
                <button
                  type="button"
                  className="primary-button create-files-button"
                  onClick={() => void saveSongwriterBundle()}
                  disabled={isCreatingSongwriterPack}
                >
                  <Save aria-hidden="true" size={18} />
                  {isCreatingSongwriterPack ? "Creating..." : "Create Songwriter Pack"}
                </button>
              </div>

              {songwriterExportNotice ? (
                <div className="export-ready-panel" role="status" aria-label="Songwriter export ready">
                  <strong>
                    {songwriterExportNotice.mode === "local" ? "Export ready" : "Downloads started"}
                  </strong>
                  <span>{songwriterExportNotice.path}</span>
                  <ul>
                    {songwriterExportNotice.files.map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                  <RenderPreviewPanel renderedPreview={renderedPreview} onImport={importRenderedPreviewFile} />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeWorkflow !== "songwriter" ? (
        <section className="panel sources-panel" aria-labelledby="sources-heading">
          <div className="section-heading with-action">
            <div>
              <Upload aria-hidden="true" size={18} />
              <h2 id="sources-heading">{activeWorkflow === "backing" ? "Create Backing Track" : "Sources"}</h2>
            </div>
            {activeWorkflow === "backing" ? (
              <button
                type="button"
                className={showBackingAdvancedEditor ? "ghost-button compact active" : "ghost-button compact"}
                onClick={() => setShowBackingAdvancedEditor((current) => !current)}
                aria-pressed={showBackingAdvancedEditor}
              >
                <Settings aria-hidden="true" size={16} />
                {showBackingAdvancedEditor ? "Hide advanced editor" : "Show advanced editor"}
              </button>
            ) : null}
          </div>

          {activeWorkflow === "backing" ? (
          <div className="source-workflow-card">
            <div className="simple-step">
              <span>1</span>
              <div>
                <h3>Create backing track</h3>
                <p>Drop in one full song file, choose what should be removed, or ask for a full stem layout.</p>
              </div>
            </div>

            <label className="quick-upload primary large-upload">
              <Upload aria-hidden="true" size={20} />
              <span>Import one song file</span>
              <input
                type="file"
                accept=".wav,.mp3,.flac,.aif,.aiff,.ogg,.m4a,.mp4,.mov,.webm"
                onChange={importBackingMasterFile}
              />
            </label>

            <div className="simple-step">
              <span>2</span>
              <div>
                <h3>Choose result</h3>
                <p>Select the backing track you want. Advanced source slots are hidden unless you open the editor.</p>
              </div>
            </div>

            <div className="output-mode-options">
              <label className={backingCreationMode === "remove-instruments" ? "output-option active" : "output-option"}>
                <input
                  type="radio"
                  name="backing-creation-mode"
                  checked={backingCreationMode === "remove-instruments"}
                  onChange={() => applyBackingCreationMode("remove-instruments")}
                />
                <span>
                  <strong>Remove instruments</strong>
                  <small>Use one full song as the source and mark what should be removed for the backing track.</small>
                </span>
              </label>
              <label className={backingCreationMode === "all-stems" ? "output-option active" : "output-option"}>
                <input
                  type="radio"
                  name="backing-creation-mode"
                  checked={backingCreationMode === "all-stems"}
                  onChange={() => applyBackingCreationMode("all-stems")}
                />
                <span>
                  <strong>All stems</strong>
                  <small>Create a REAPER layout for drums, bass, vocals, synths, no-guitar, and source print.</small>
                </span>
              </label>
            </div>

            {backingCreationMode === "remove-instruments" ? (
              <div className="backing-part-checklist">
                {backingRemovalOptions.map((part) => (
                  <label className="part-checkbox" key={part.id}>
                    <input
                      type="checkbox"
                      checked={backingRemovedInstrumentIds.includes(part.id)}
                      onChange={(event) => toggleBackingRemovedInstrument(part.id, event.target.checked)}
                    />
                    <span>{part.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="simple-info-box">
                <strong>Stem layout selected</strong>
                <span>The export will prepare REAPER tracks and instructions for all stem outputs.</span>
              </div>
            )}

            {showBackingAdvancedEditor ? (
              <div className="backing-part-checklist">
                {backingPartOptions.map((part) => (
                  <label className="part-checkbox" key={part.sourceId}>
                  <input
                    type="checkbox"
                    checked={selectedBackingPartSourceIds.includes(part.sourceId)}
                    onChange={(event) => toggleBackingPart(part.sourceId, event.target.checked)}
                  />
                  <span>{part.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            <div className="simple-step">
              <span>3</span>
              <div>
                <h3>Choose output</h3>
                <p>Pick whether this should become a REAPER import session, a final render-ready file, or both.</p>
              </div>
            </div>

            <div className="output-mode-options">
              {backingOutputModeOptions.map((option) => (
                <label
                  className={template.outputMode === option.id ? "output-option active" : "output-option"}
                  key={option.id}
                >
                  <input
                    type="radio"
                    name="backing-output-mode"
                    value={option.id}
                    checked={template.outputMode === option.id}
                    onChange={() => updateTemplateField("outputMode", option.id)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>

            <div className="simple-step">
              <span>4</span>
              <div>
                <h3>Preview uploaded files</h3>
                <p>Imported audio/video appears below with a player.</p>
              </div>
            </div>

            <div className="simple-preview-list">
              {importedSources.length === 0 ? (
                <p className="empty-state">No track uploaded yet.</p>
              ) : (
                importedSources.map((source) => (
                  <div className="simple-preview-item" key={source.id}>
                    <div>
                      <strong>{source.label}</strong>
                      <span>{source.filePath || source.sourceUrl || sourcePreviewFileName(source) || "Local import"}</span>
                    </div>
                    <SourcePreview source={source} />
                  </div>
                ))
              )}
            </div>

            <div className="simple-generate-row">
              <p className="source-storage-hint">
                {selectedBackingPartSourceIds.length === 0
                  ? "Select at least one part to include before creating the backing track."
                  : "The app creates REAPER files and instructions. It does not render separated audio in the browser yet."}
              </p>
              <button
                type="button"
                className="primary-button create-files-button"
                onClick={() => void saveBackingTrackBundle()}
                disabled={validationErrors.length > 0 || isCreatingExportPack}
              >
                <Save aria-hidden="true" size={18} />
                {isCreatingExportPack ? "Creating..." : "Create Backing Track"}
              </button>
            </div>

            <div className="direct-audio-panel">
              <div>
                <strong>Create audio file in tool</strong>
                <p>Creates a WAV you can preview here and import anywhere. Guitar/vocal removal uses quick center-reduction, not full AI stem separation yet.</p>
              </div>
              <button
                type="button"
                className="primary-button create-files-button"
                onClick={() => void createDirectBackingAudio()}
                disabled={isRenderingDirectAudio || backingCreationMode === "all-stems"}
              >
                <Download aria-hidden="true" size={18} />
                {isRenderingDirectAudio ? "Rendering..." : backingCreationMode === "all-stems" ? "Stem render coming next" : "Create WAV"}
              </button>
              {directAudioNotice ? (
                <div className="direct-audio-result" role="status" aria-label="Direct audio ready">
                  <strong>{directAudioNotice.fileName}</strong>
                  <span>{directAudioNotice.path}</span>
                  <audio controls preload="metadata" src={directAudioNotice.previewUrl} />
                  <a className="ghost-button compact" href={directAudioNotice.previewUrl} download={directAudioNotice.fileName}>
                    Download WAV
                  </a>
                  {directAudioNotice.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          ) : null}

          {activeWorkflow !== "backing" ? (
            <div className="source-summary" aria-label={`Source summary: ${sourceSummary.label}. ${sourceSummary.detail}`}>
              <span>{sourceSummary.label}</span>
              <span>{sourceSummary.detail}</span>
              <span>Imports save to the local D: app data folder</span>
            </div>
          ) : null}

          {showAdvancedReaperEditor ? (
          <details className="advanced-sources" open={activeWorkflow !== "backing"}>
            <summary>{activeWorkflow === "backing" ? "Advanced source mapping" : "Source mapping"}</summary>

            <div className="advanced-source-actions">
              <button type="button" className="ghost-button compact" onClick={addSourceAsset}>
                <Plus aria-hidden="true" size={16} />
                Add source
              </button>
            </div>

          <div className="source-list">
            {sourceReferenceWarnings.length > 0 ? (
              <div className="warning-list" role="alert">
                {sourceReferenceWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}

            {template.sourceAssets.length === 0 ? <p className="empty-state">No sources in this template.</p> : null}

            {template.sourceAssets.map((source) => (
              <article className="source-row" key={source.id}>
                <div className="track-name-fields">
                  <input value={source.label} onChange={(event) => updateSourceAsset(source.id, { label: event.target.value })} />
                  <input
                    value={source.id}
                    onChange={(event) => updateSourceAssetId(source.id, cleanId(event.target.value))}
                    aria-label={`${source.label} source id`}
                  />
                </div>

                <select
                  value={source.kind}
                  onChange={(event) => updateSourceAsset(source.id, { kind: event.target.value as SourceAssetKind })}
                  aria-label={`${source.label} source kind`}
                >
                  {sourceKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>

                <select
                  value={source.targetTrackId}
                  onChange={(event) => updateSourceAsset(source.id, { targetTrackId: event.target.value })}
                  aria-label={`${source.label} target track`}
                >
                  <option value="">No target</option>
                  {template.tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>

                <label className="file-input source-file-input">
                  <Upload aria-hidden="true" size={16} />
                  <span>Import</span>
                  <input type="file" accept=".wav,.mp3,.flac,.aif,.aiff,.ogg,.m4a,.mp4,.mov,.webm" onChange={(event) => importSourceFile(source.id, event)} />
                </label>

                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => removeSourceAsset(source.id)}
                  title={`Remove ${source.label}`}
                >
                  <Trash2 aria-hidden="true" size={17} />
                </button>

                <div className="source-row-details">
                  <SourcePreview source={source} />

                  <div className="source-path-field">
                    <span className={sourcePreviewFileName(source) ? "source-file-meta ready" : "source-file-meta"}>
                      {sourcePreviewFileName(source) ? `Saved locally: ${sourcePreviewFileName(source)}` : "No imported file yet"}
                    </span>
                    <input
                      value={source.filePath}
                      onChange={(event) => updateSourceAsset(source.id, { filePath: event.target.value })}
                      aria-label={`${source.label} local file path`}
                      placeholder="Local path"
                      title={source.filePath || "No local file imported"}
                    />
                  </div>

                  <input
                    value={source.sourceUrl}
                    onChange={(event) => updateSourceAsset(source.id, { sourceUrl: event.target.value })}
                    aria-label={`${source.label} source URL`}
                    placeholder="Reference URL"
                  />

                  <input
                    value={source.notes}
                    onChange={(event) => updateSourceAsset(source.id, { notes: event.target.value })}
                    aria-label={`${source.label} source notes`}
                    placeholder="Notes"
                  />
                </div>
              </article>
            ))}
          </div>
          </details>
          ) : null}
        </section>
        ) : null}

        {showAdvancedReaperEditor ? (
        <section className="panel tracks-panel" aria-labelledby="tracks-heading">
          <div className="section-heading with-action">
            <div>
              <FileCode2 aria-hidden="true" size={18} />
              <h2 id="tracks-heading">Tracks</h2>
            </div>
            <button type="button" className="icon-button" onClick={addTrack} title="Add track">
              <Plus aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="track-list">
            {template.tracks.map((track) => (
              <article className="track-row" key={track.id}>
                <div className="track-name-fields">
                  <input value={track.name} onChange={(event) => updateTrack(track.id, { name: event.target.value })} />
                  <input
                    value={track.id}
                    onChange={(event) => updateTrackId(track.id, cleanId(event.target.value))}
                    aria-label={`${track.name} id`}
                  />
                </div>

                <select value={track.role} onChange={(event) => updateTrack(track.id, { role: event.target.value as TrackRole })}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <div className="color-cell">
                  <input
                    type="color"
                    value={track.color}
                    onChange={(event) => updateTrack(track.id, { color: event.target.value })}
                    aria-label={`${track.name} color`}
                  />
                </div>

                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={track.recordArm}
                    onChange={(event) => updateTrack(track.id, { recordArm: event.target.checked })}
                  />
                  Arm
                </label>

                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={track.masterSendEnabled}
                    onChange={(event) => updateTrack(track.id, { masterSendEnabled: event.target.checked })}
                    aria-label={`${track.name} master send`}
                  />
                  Master
                </label>

                <select
                  value={track.inputMode}
                  onChange={(event) => updateTrack(track.id, { inputMode: event.target.value as ReaperInputMode })}
                >
                  {inputModeOptions.map((inputMode) => (
                    <option key={inputMode} value={inputMode}>
                      {inputMode}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  max="64"
                  value={track.inputChannel}
                  onChange={(event) => updateTrack(track.id, { inputChannel: Number(event.target.value) })}
                  aria-label={`${track.name} input channel`}
                />

                <select
                  value={track.folderDepth}
                  onChange={(event) => updateTrack(track.id, { folderDepth: Number(event.target.value) })}
                  aria-label={`${track.name} folder depth`}
                >
                  <option value={0}>flat</option>
                  <option value={1}>open</option>
                  <option value={-1}>close</option>
                </select>

                <input
                  value={track.notes}
                  onChange={(event) => updateTrack(track.id, { notes: event.target.value })}
                  aria-label={`${track.name} notes`}
                  placeholder="Notes"
                />

                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => removeTrack(track.id)}
                  title={`Remove ${track.name}`}
                >
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
        ) : null}

        {showAdvancedReaperEditor ? (
        <section className="panel routes-panel" aria-labelledby="routes-heading">
          <div className="section-heading with-action">
            <div>
              <Save aria-hidden="true" size={18} />
              <h2 id="routes-heading">Routing</h2>
            </div>
            <button type="button" className="icon-button" onClick={addRoute} title="Add route">
              <Plus aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="route-list">
            {routeReferenceWarnings.length > 0 ? (
              <div className="warning-list" role="alert">
                {routeReferenceWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}

            {template.routes.map((route) => (
              <article className="route-row" key={route.id}>
                <input value={route.id} onChange={(event) => updateRoute(route.id, { id: cleanId(event.target.value) })} />

                <select
                  value={route.fromTrackId}
                  onChange={(event) => updateRoute(route.id, { fromTrackId: event.target.value })}
                >
                  {!trackIds.has(route.fromTrackId) ? <option value={route.fromTrackId}>Missing: {route.fromTrackId}</option> : null}
                  {template.tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>

                <select value={route.toTrackId} onChange={(event) => updateRoute(route.id, { toTrackId: event.target.value })}>
                  {!trackIds.has(route.toTrackId) ? <option value={route.toTrackId}>Missing: {route.toTrackId}</option> : null}
                  {template.tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>

                <select value={route.sendMode} onChange={(event) => updateRoute(route.id, { sendMode: event.target.value as SendMode })}>
                  {sendModeOptions.map((sendMode) => (
                    <option key={sendMode} value={sendMode}>
                      {sendMode}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.5"
                  value={route.volumeDb}
                  onChange={(event) => updateRoute(route.id, { volumeDb: Number(event.target.value) })}
                  aria-label={`${route.id} volume in decibels`}
                />

                <input
                  type="number"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={route.pan}
                  onChange={(event) => updateRoute(route.id, { pan: Number(event.target.value) })}
                  aria-label={`${route.id} pan`}
                />

                <button type="button" className="icon-button danger" onClick={() => removeRoute(route.id)} title={`Remove ${route.id}`}>
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
        ) : null}

        {showAdvancedReaperEditor ? (
        <section className="panel markers-panel" aria-labelledby="markers-heading">
          <div className="section-heading with-action">
            <div>
              <MapPin aria-hidden="true" size={18} />
              <h2 id="markers-heading">Markers</h2>
            </div>
            <button type="button" className="icon-button" onClick={addMarker} title="Add marker">
              <Plus aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="marker-list">
            {template.markers.length === 0 ? <p className="empty-state">No markers in this template.</p> : null}

            {template.markers.map((marker) => (
              <article className="marker-row" key={marker.id}>
                <input
                  value={marker.name}
                  onChange={(event) => updateMarker(marker.id, { name: event.target.value })}
                  aria-label={`${marker.name || marker.id} marker name`}
                />

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={marker.positionSeconds}
                  onChange={(event) => updateMarker(marker.id, { positionSeconds: Number(event.target.value) })}
                  aria-label={`${marker.name || marker.id} position in seconds`}
                />

                <button type="button" className="icon-button danger" onClick={() => removeMarker(marker.id)} title={`Remove ${marker.name}`}>
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
        ) : null}

        <section className="panel json-panel" aria-labelledby="json-heading">
          <div className="section-heading with-action">
            <div>
              <Upload aria-hidden="true" size={18} />
              <h2 id="json-heading">{activeWorkflow === "songwriter" ? "Songwriter JSON" : "JSON"}</h2>
            </div>
            <div className="button-group">
              {activeWorkflow === "cover" ? (
                <button type="button" className="ghost-button compact" onClick={loadJsonDraft} title="Load JSON">
                  <Upload aria-hidden="true" size={16} />
                  Load
                </button>
              ) : null}
              <button
                type="button"
                className="ghost-button compact"
                onClick={() =>
                  void saveTextFile(
                    createExportFileName(template.name, "json"),
                    activeJsonOutput,
                    "application/json"
                  )
                }
                title="Save JSON"
              >
                <Download aria-hidden="true" size={16} />
                Save
              </button>
            </div>
          </div>

          {activeWorkflow !== "songwriter" ? (
            <label className="file-input">
              <Upload aria-hidden="true" size={16} />
              <span>Open file</span>
              <input type="file" accept="application/json,.json" onChange={importJsonFile} />
            </label>
          ) : null}

          <textarea
            className="code-area"
            value={activeJsonOutput}
            onChange={(event) => {
              if (activeWorkflow === "cover") {
                setJsonDraft(event.target.value);
              }
            }}
            readOnly={activeWorkflow !== "cover"}
            spellCheck={false}
            aria-label={activeWorkflow === "songwriter" ? "Songwriter JSON" : "Template JSON"}
          />
        </section>

        <section className="panel lua-panel" aria-labelledby="lua-heading">
          <div className="section-heading with-action">
            <div>
              <FileCode2 aria-hidden="true" size={18} />
              <h2 id="lua-heading">Lua</h2>
            </div>
            <div className="button-group">
              <button type="button" className="ghost-button compact" onClick={() => copyText(activeLuaOutput, "Lua")} title="Copy Lua">
                <Copy aria-hidden="true" size={16} />
                Copy
              </button>
              <button
                type="button"
                className="ghost-button compact"
                onClick={() => void saveTextFile(createExportFileName(template.name, "lua"), activeLuaOutput, "text/plain")}
                title="Download Lua"
                disabled={validationErrors.length > 0}
              >
                <Download aria-hidden="true" size={16} />
                Save
              </button>
            </div>
          </div>

          <textarea className="code-area" value={activeLuaOutput} readOnly spellCheck={false} aria-label="Generated Lua" />
        </section>
      </section>
    </main>
  );

  function showExportPanelSoon() {
    window.setTimeout(() => {
      document
        .querySelector('[aria-label="Export package ready"], [aria-label="Songwriter export ready"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  async function readExportError(response: Response) {
    try {
      const body = (await response.json()) as { error?: string };
      return body.error ?? `HTTP ${response.status}`;
    } catch {
      return `HTTP ${response.status}`;
    }
  }

  function clearDirectAudioNotice() {
    setDirectAudioNotice((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });
  }

  async function saveTextFile(fileName: string, text: string, type: string) {
    try {
      const response = await fetch("/api/export-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, text })
      });

      if (response.ok) {
        const result = (await response.json()) as { path?: string };
        setStatus(`Saved to ${result.path ?? fileName}.`);
        return;
      }
    } catch {
      // Fall through to browser download for static builds or non-local hosting.
    }

    startBrowserDownload(fileName, text, type);
    setStatus(`Download requested: ${fileName}.`);
  }

  async function saveThallLabNativePreset() {
    await saveTextFile("thall-lab-preset.json", thallLabNativePresetJson, "application/json");
  }

  function toggleBackingPart(sourceId: string, checked: boolean) {
    setSelectedBackingPartSourceIds((current) => {
      if (checked) {
        return current.includes(sourceId) ? current : [...current, sourceId];
      }

      return current.filter((id) => id !== sourceId);
    });
  }

  function applyBackingCreationMode(mode: BackingCreationMode) {
    setBackingCreationMode(mode);
    setSelectedBackingPartSourceIds(mode === "all-stems" ? allBackingStemSourceIds : ["main-backing-source"]);
    setStatus(mode === "all-stems" ? "Stem layout selected." : "Choose which instruments to remove from the backing track.");
  }

  function toggleBackingRemovedInstrument(instrumentId: string, checked: boolean) {
    setBackingRemovedInstrumentIds((current) => {
      if (checked) {
        return current.includes(instrumentId) ? current : [...current, instrumentId];
      }

      return current.filter((id) => id !== instrumentId);
    });
  }

  async function saveBackingTrackBundle() {
    if (isCreatingExportPack) {
      return;
    }

    if (selectedBackingPartSourceIds.length === 0) {
      setStatus("Select at least one part before creating the backing track.");
      return;
    }

    const exportTemplate = createBackingTemplateFromSelection(
      withBackingRequestNotes(template, backingCreationMode, backingRemovedInstrumentIds),
      selectedBackingPartSourceIds
    );
    await saveExportBundle(exportTemplate, "Created backing track files");
  }

  async function createDirectBackingAudio() {
    if (isRenderingDirectAudio) {
      return;
    }

    const source = template.sourceAssets.find((candidate) => candidate.id === "main-backing-source");
    const fileName = source ? sourcePreviewFileName(source) : "";

    if (!fileName) {
      setStatus("Import one song file before creating a WAV.");
      return;
    }

    if (getImportMediaKind(fileName) !== "audio") {
      setStatus("Direct WAV render needs an audio file. Video files can still be used in the REAPER pack.");
      return;
    }

    if (backingCreationMode === "all-stems") {
      setStatus("All stems needs a real separation engine. Use Remove instruments for direct WAV render right now.");
      return;
    }

    setIsRenderingDirectAudio(true);
    clearDirectAudioNotice();
    setStatus("Rendering WAV in the browser...");

    try {
      const response = await fetch(createImportedFileUrl(fileName));

      if (!response.ok) {
        throw new Error(`Could not read imported file (${response.status}).`);
      }

      const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("This browser cannot decode audio.");
      }

      const context = new AudioContextClass();
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      await context.close();
      const reduceCenter = backingRemovedInstrumentIds.some((id) => id === "guitars" || id === "vocals");
      const warnings = createDirectAudioWarnings(backingRemovedInstrumentIds, reduceCenter);
      const processed = processDirectBackingAudio(
        {
          sampleRate: decoded.sampleRate,
          channels: Array.from({ length: Math.min(decoded.numberOfChannels, 2) }, (_, index) => new Float32Array(decoded.getChannelData(index)))
        },
        { reduceCenter, gain: reduceCenter ? 1.25 : 1 }
      );
      const transposed = transposeAudioBuffer(processed, songwriterTransposeSemitonesRef.current);
      const wavBytes = encodeWavPcm16(transposed);
      const baseName = cleanId(`${template.songName || template.name || "direct-backing"}-direct-backing`) || "direct-backing";
      const outputFileName = `${baseName}.wav`;
      const directoryName = `${baseName}-audio`;
      let exportPath = `downloads / ${directoryName}`;
      let mode: DirectAudioNotice["mode"] = "download";

      try {
        const saveResponse = await fetch("/api/export-bundle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directoryName,
            files: [
              { fileName: outputFileName, base64: bytesToBase64(wavBytes), encoding: "base64" },
              {
                fileName: "README-REAPER-STEPS.md",
                text: createDirectAudioReadme(outputFileName, backingRemovedInstrumentIds, reduceCenter, songwriterTransposeSemitonesRef.current)
              }
            ]
          })
        });

        if (saveResponse.ok) {
          const result = (await saveResponse.json()) as { path?: string };
          exportPath = result.path ?? `local export / ${directoryName}`;
          mode = "local";
        } else if (saveResponse.status !== 404) {
          throw new Error(await readExportError(saveResponse));
        }
      } catch {
        startBrowserDownloadBinary(outputFileName, wavBytes, "audio/wav");
      }

      const previewUrl = URL.createObjectURL(new Blob([blobPartFromBytes(wavBytes)], { type: "audio/wav" }));
      setDirectAudioNotice({ fileName: outputFileName, path: exportPath, previewUrl, warnings, mode });
      setStatus(`Created WAV: ${outputFileName}. Preview is ready in the app.`);
    } catch (error) {
      setStatus(error instanceof Error ? `Could not create WAV: ${error.message}` : "Could not create WAV.");
    } finally {
      setIsRenderingDirectAudio(false);
    }
  }

  async function saveSongwriterBundle() {
    if (isCreatingSongwriterPack) {
      return;
    }

    const bundle = createSongwriterBundle(songwriterSketch, songwriterLuaOutput, songwriterJsonOutput, thallLabNativePresetJson);
    setIsCreatingSongwriterPack(true);
    setSongwriterExportNotice(null);
    setStatus("Creating songwriter pack...");

    try {
      const response = await fetch("/api/export-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundle)
      });

      if (response.ok) {
        const result = (await response.json()) as { path?: string; files?: string[] };
        const fileCount = result.files?.length ?? bundle.files.length;
        const exportPath = result.path ?? `local export / ${bundle.directoryName}`;
        const files = result.files ?? bundle.files.map((file) => file.fileName);
        setSongwriterExportNotice({ path: exportPath, files, mode: "local" });
        setStatus(`Created songwriter pack (${fileCount} files) in ${exportPath}.`);
        showExportPanelSoon();
        setIsCreatingSongwriterPack(false);
        return;
      }

      if (response.status !== 404) {
        setStatus(`Could not create songwriter pack: ${await readExportError(response)}`);
        setIsCreatingSongwriterPack(false);
        return;
      }
    } catch {
      // Fall through to browser downloads for static builds or non-local hosting.
    }

    try {
      for (const file of bundle.files) {
        if (file.encoding === "base64" && file.base64) {
          const fileType = file.fileName.endsWith(".mid") ? "audio/midi" : "application/octet-stream";
          startBrowserDownloadBinary(file.fileName, decodeBase64Bytes(file.base64), fileType);
        } else {
          const fileType = file.fileName.endsWith(".md")
            ? "text/markdown"
            : file.fileName.endsWith(".json")
              ? "application/json"
              : "text/plain";
          startBrowserDownload(file.fileName, file.text ?? "", fileType);
        }
      }

      const files = bundle.files.map((file) => file.fileName);
      setSongwriterExportNotice({ path: `downloads / ${bundle.directoryName}`, files, mode: "download" });
      setStatus(`Created songwriter pack: download requested for ${bundle.files.length} files.`);
      showExportPanelSoon();
    } catch (error) {
      setStatus(error instanceof Error ? `Could not create songwriter pack: ${error.message}` : "Could not create songwriter pack.");
    } finally {
      setIsCreatingSongwriterPack(false);
    }
  }

  async function saveExportBundle(exportTemplate = template, successLabel = "Created") {
    if (isCreatingExportPack) {
      return;
    }

    const exportLua = exportTemplate === template ? luaOutput : generateReaperLua(exportTemplate);
    const exportJson = exportTemplate === template ? serializeTemplate(template) : serializeTemplate(exportTemplate);
    const bundle = createExportBundle(exportTemplate, exportLua, exportJson);
    setIsCreatingExportPack(true);
    setExportNotice(null);
    setStatus("Creating export package...");

    try {
      const response = await fetch("/api/export-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundle)
      });

      if (response.ok) {
        const result = (await response.json()) as { path?: string; files?: string[] };
        const fileCount = result.files?.length ?? bundle.files.length;
        const path = result.path ?? `local export / ${bundle.directoryName}`;
        const files = result.files ?? bundle.files.map((file) => file.fileName);
        setExportNotice({ path, files, mode: "local" });
        setStatus(`${successLabel} (${fileCount} files) in ${path}.`);
        showExportPanelSoon();
        setIsCreatingExportPack(false);
        return;
      }

      if (response.status !== 404) {
        setStatus(`Could not create export package: ${await readExportError(response)}`);
        setIsCreatingExportPack(false);
        return;
      }
    } catch {
      // Fall through to individual browser downloads for static builds or non-local hosting.
    }

    try {
      for (const file of bundle.files) {
        if (file.encoding === "base64" && file.base64) {
          const fileType = file.fileName.endsWith(".mid") ? "audio/midi" : "application/octet-stream";
          startBrowserDownloadBinary(file.fileName, decodeBase64Bytes(file.base64), fileType);
        } else {
          const fileType = file.fileName.endsWith(".md")
            ? "text/markdown"
            : file.fileName.endsWith(".json")
              ? "application/json"
              : "text/plain";
          startBrowserDownload(file.fileName, file.text ?? "", fileType);
        }
      }

      setExportNotice({ path: `downloads / ${bundle.directoryName}`, files: bundle.files.map((file) => file.fileName), mode: "download" });
      setStatus(`${successLabel}: download requested for ${bundle.files.length} files.`);
      showExportPanelSoon();
    } catch (error) {
      setStatus(error instanceof Error ? `Could not create export package: ${error.message}` : "Could not create export package.");
    } finally {
      setIsCreatingExportPack(false);
    }
  }

  async function importSourceFile(sourceId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isSupportedImportFileName(file.name)) {
      setStatus("Unsupported source file type.");
      return;
    }

    const result = await uploadSourceFile(file);

    updateSourceAsset(sourceId, {
      kind: "local-file",
      fileName: result.fileName,
      filePath: result.path
    });
    if (backingPartOptions.some((part) => part.sourceId === sourceId)) {
      setSelectedBackingPartSourceIds((current) => (current.includes(sourceId) ? current : [...current, sourceId]));
    }
    setStatus(
      result.imported
        ? `${result.fileName} imported to ${result.path}. Preview is ready.`
        : `${file.name} selected. Add a local path before running Lua import.`
    );
  }

  async function importBackingMasterFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isSupportedImportFileName(file.name)) {
      setStatus("Unsupported song file type.");
      return;
    }

    const result = await uploadSourceFile(file);
    updateSourceAsset("main-backing-source", {
      kind: "local-file",
      label: "Imported full song",
      fileName: result.fileName,
      filePath: result.path
    });
    setSelectedBackingPartSourceIds((current) => (current.includes("main-backing-source") ? current : ["main-backing-source", ...current]));
    setStatus(
      result.imported
        ? `${result.fileName} imported. Choose what to remove, then create the REAPER pack.`
        : `${file.name} selected. Choose what to remove, then create the REAPER pack.`
    );
  }

  async function importSongwriterGuitarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await handleSongwriterAudioFile(file, "Uploaded guitar idea");
  }

  async function importRenderedPreviewFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isSupportedImportFileName(file.name)) {
      setStatus("Unsupported render preview file type.");
      return;
    }

    setStatus(`Importing rendered preview ${file.name}...`);
    const result = await uploadSourceFile(file);
    setRenderedPreview({ fileName: result.fileName, filePath: result.path });
    setStatus(
      result.imported
        ? `Rendered preview imported as ${result.fileName}. You can listen in the export panel.`
        : `${file.name} selected, but local preview storage is not available.`
    );
    showExportPanelSoon();
  }

  async function handleSongwriterAudioFile(file: File, sourceLabel = "Guitar idea") {
    if (!isSupportedImportFileName(file.name)) {
      setStatus("Unsupported guitar audio file type.");
      return;
    }

    setStatus(`${sourceLabel}: analyzing ${file.name}...`);

    let onsets: GuitarOnset[] = [];

    try {
      onsets = await detectGuitarOnsets(file);
    } catch {
      setStatus("Could not decode that audio file, but it can still be imported into the REAPER songwriter pack.");
    }

    const result = await uploadSourceFile(file);
    setSongwriterSource({
      fileName: result.fileName,
      filePath: result.path
    });
    setSongwriterOnsets(onsets);
    setSongwriterManualDrumHits(null);
    setStatus(
      result.imported
        ? `${sourceLabel} imported as ${result.fileName}. Detected ${onsets.length} guitar attacks for the songwriter sketch.`
        : `${file.name} selected. Detected ${onsets.length} guitar attacks, but preview/import path is not available.`
    );
  }

  function tapSongwriterRhythm() {
    const now = performance.now();
    const previousTap = songwriterLastTapRef.current;

    if (songwriterTapStartRef.current === null || previousTap === null || now - previousTap > 5000) {
      songwriterTapStartRef.current = now;
      setSongwriterOnsets([{ timeSeconds: 0, intensity: 0.9 }]);
    } else {
      const start = songwriterTapStartRef.current;
      const timeSeconds = Math.max(0, (now - start) / 1000);
      setSongwriterOnsets((current) => [
        ...current,
        {
          timeSeconds: Number(timeSeconds.toFixed(3)),
          intensity: 0.82
        }
      ]);
    }

    songwriterLastTapRef.current = now;
    setSongwriterSource({ fileName: "manual-rhythm-taps", filePath: "" });
    setSongwriterManualDrumHits(null);
    setSongwriterExportNotice(null);
    setStatus("Rhythm tap added. Drum map updated from manual taps.");
  }

  function clearSongwriterRhythm() {
    songwriterTapStartRef.current = null;
    songwriterLastTapRef.current = null;
    setSongwriterOnsets([]);
    setSongwriterManualDrumHits(null);
    setSongwriterSource({ fileName: "", filePath: "" });
    setSongwriterExportNotice(null);
    setStatus("Rhythm cleared. Upload, record, or tap a rhythm to create a drum map.");
  }

  function toggleSongwriterDrumHit(voice: DrumVoice, step: number) {
    const stepSeconds = 60 / safeMetronomeTempo(template.tempo) / 4;
    const currentHits = songwriterManualDrumHits ?? songwriterSketch.drumHits;
    const exists = currentHits.some((hit) => hit.voice === voice && hit.step === step);
    const nextHits = exists
      ? currentHits.filter((hit) => !(hit.voice === voice && hit.step === step))
      : [
          ...currentHits,
          {
            step,
            timeSeconds: Number((step * stepSeconds).toFixed(3)),
            voice,
            intensity: voice === "crash" ? 0.9 : 0.78,
            label: `${drumVoiceLabel(voice)} step ${step + 1}`
          }
        ];

    setSongwriterManualDrumHits(nextHits.sort(sortDrumHits));
    setSongwriterSource((current) => (current.fileName ? current : { fileName: "manual-drum-map", filePath: "" }));
    setSongwriterExportNotice(null);
    setStatus(exists ? `${drumVoiceLabel(voice)} removed from step ${step + 1}.` : `${drumVoiceLabel(voice)} added to step ${step + 1}.`);
  }

  function applySongwriterDrumPreset(preset: DrumPatternPreset) {
    const hits = createPresetDrumHits(preset, template.tempo);
    setSongwriterManualDrumHits(hits);
    setSongwriterSource((current) => (current.fileName ? current : { fileName: "manual-drum-map", filePath: "" }));
    setSongwriterExportNotice(null);
    setStatus(`Applied drum preset: ${drumPatternPresetOptions.find((option) => option.id === preset)?.label ?? preset}.`);
  }

  function applySongwriterGroove(grooveId: string, announce = true) {
    const groove = songwriterGrooveLibrary.find((item) => item.id === grooveId) ?? songwriterGrooveLibrary[0];
    const hits = createGrooveDrumHits(groove.id, template.tempo);
    setSongwriterSelectedGrooveId(groove.id);
    setSongwriterManualDrumHits(hits);
    setSongwriterSource((current) => (current.fileName ? current : { fileName: groove.name, filePath: "" }));
    setSongwriterExportNotice(null);

    if (announce) {
      setStatus(`Applied groove: ${groove.name}.`);
    }
  }

  function applyNextSongwriterGroove() {
    const groovePool = filteredSongwriterGrooves.length ? filteredSongwriterGrooves : songwriterGrooveLibrary;
    const currentIndex = groovePool.findIndex((groove) => groove.id === songwriterSelectedGrooveId);
    const nextGroove = groovePool[(currentIndex + 1 + groovePool.length) % groovePool.length];
    applySongwriterGroove(nextGroove.id);
  }

  function playSongwriterGroovePreview(grooveId: string) {
    applySongwriterGroove(grooveId, false);
    window.setTimeout(playSongwriterBassPreview, 40);
    setStatus("Groove loaded. Forge Bass preview follows the groove.");
  }

  function applyGuitarTonePreset(presetId: string) {
    const preset = getGuitarTonePreset(presetId);
    setSongwriterGuitarTonePresetId(preset.id);
    setSongwriterAmpSimEnabled(true);
    setSongwriterAmpGain(preset.ampDrive);
    setSongwriterAmpTone(preset.ampTone);
    setSongwriterBassEnabled(true);
    setSongwriterBassDrive(preset.bassDrive);
    setSongwriterBassClick(preset.bassClick);
    setSongwriterBassLevel(preset.bassLevel);
    setSongwriterExportNotice(null);
    setStatus(`Tone preset loaded: ${preset.name}.`);
  }

  function applySmartSongEnginePlan() {
    const plan = createSmartSongEnginePlan({
      tempo: template.tempo,
      tuning: template.tuning,
      feel: songwriterFeel,
      riffRole: songwriterRiffRole,
      onsetCount: songwriterOnsets.length
    });
    const selectedAmbientIds = new Set(plan.ambientEffectIds);
    const existingWhammyNames = new Set(songwriterWhammyEvents.map((event) => event.name.toLowerCase()));
    const newWhammyEvents = plan.whammyPresetIds
      .map((presetId) => whammyPresetOptions.find((preset) => preset.id === presetId))
      .filter((preset): preset is (typeof whammyPresetOptions)[number] => Boolean(preset))
      .filter((preset) => !existingWhammyNames.has(preset.event.name.toLowerCase()))
      .map((preset) => ({
        id: `${preset.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...preset.event
      }));

    applySongwriterGroove(plan.grooveId, false);
    applyGuitarTonePreset(plan.guitarTonePresetId);
    setSongwriterBassRootMidi(plan.bassRootMidi);
    setSongwriterBassDrive(plan.bassDrive);
    setSongwriterBassClick(plan.bassClick);
    setSongwriterAmbientEffects((current) =>
      current.map((effect) => ({
        ...effect,
        enabled: selectedAmbientIds.has(effect.id) || effect.enabled
      }))
    );
    if (newWhammyEvents.length > 0) {
      setSongwriterWhammyEvents((current) => [...current, ...newWhammyEvents]);
    }
    setSongwriterSmartNotes(plan.notes);
    setSongwriterExportNotice(null);
    setStatus("Smart Song Engine applied groove, bass, pitch, and ambient suggestions.");
  }

  function addSongwriterSectionPreset(presetId: string) {
    const preset = songSectionPresetOptions.find((option) => option.id === presetId);

    if (!preset) {
      return;
    }

    setSongwriterSections((current) => [...current, { ...preset.section }]);
    setSongwriterExportNotice(null);
    setStatus(`${preset.section.name} added to the song map.`);
  }

  function duplicateSongwriterSection(index: number) {
    setSongwriterSections((current) => {
      const section = current[index];

      if (!section) {
        return current;
      }

      const next = [...current];
      next.splice(index + 1, 0, { ...section, name: `${section.name} VARIATION` });
      return next;
    });
    setSongwriterExportNotice(null);
    setStatus("Section duplicated.");
  }

  function moveSongwriterSection(index: number, direction: -1 | 1) {
    setSongwriterSections((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [section] = next.splice(index, 1);
      next.splice(targetIndex, 0, section);
      return next;
    });
    setSongwriterExportNotice(null);
    setStatus("Song section moved.");
  }

  function removeSongwriterSection(index: number) {
    setSongwriterSections((current) => (current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
    setSongwriterExportNotice(null);
    setStatus("Section removed from the song map.");
  }

  function updateSongwriterAmbientEffect(effectId: string, patch: Partial<AmbientGuitarEffect>) {
    setSongwriterAmbientEffects((current) => current.map((effect) => (effect.id === effectId ? { ...effect, ...patch } : effect)));
    setSongwriterExportNotice(null);
  }

  function updateForgePedal(pedalId: string, patch: Partial<ForgePedal>) {
    setSongwriterPedals((current) => current.map((pedal) => (pedal.id === pedalId ? { ...pedal, ...patch } : pedal)));
    setSongwriterExportNotice(null);
  }

  function addSongwriterWhammyPreset(presetId: string) {
    const preset = whammyPresetOptions.find((option) => option.id === presetId);

    if (!preset) {
      return;
    }

    const startSeconds = songwriterArrangementSummary.starts[0]?.timeSeconds ?? 0;
    setSongwriterWhammyEvents((current) => [
      ...current,
      {
        id: `${preset.id}-${Date.now()}`,
        ...preset.event,
        startSeconds
      }
    ]);
    setSongwriterExportNotice(null);
    setStatus(`${preset.label} added to the pitch automation guide.`);
  }

  function updateSongwriterWhammyEvent(eventId: string, patch: Partial<WhammyAutomationEvent>) {
    setSongwriterWhammyEvents((current) => current.map((event) => (event.id === eventId ? { ...event, ...patch } : event)));
    setSongwriterExportNotice(null);
  }

  function removeSongwriterWhammyEvent(eventId: string) {
    setSongwriterWhammyEvents((current) => current.filter((event) => event.id !== eventId));
    setSongwriterExportNotice(null);
    setStatus("Pitch automation event removed.");
  }

  async function refreshSongwriterAudioInputs(requestPermission: boolean) {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    let permissionStream: MediaStream | null = null;

    try {
      if (requestPermission && navigator.mediaDevices.getUserMedia) {
        permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Input ${index + 1}`
        }));
      const outputs = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Output ${index + 1}`
        }));

      setSongwriterAudioInputDevices(inputs);
      setSongwriterAudioOutputDevices(outputs);

      const knownInputIds = new Set(inputs.map((device) => device.id));
      const knownOutputIds = new Set(outputs.map((device) => device.id));
      const currentInputId = songwriterAudioInputDeviceIdRef.current;
      const currentOutputId = songwriterAudioOutputDeviceIdRef.current;

      if (currentInputId !== "default" && !knownInputIds.has(currentInputId)) {
        setSongwriterAudioInputDeviceId("default");
      }

      if (currentOutputId !== "default" && !knownOutputIds.has(currentOutputId)) {
        setSongwriterAudioOutputDeviceId("default");
      }

      if (requestPermission) {
        setStatus(inputs.length > 0 ? "Audio device list refreshed." : "No input devices found.");
      }
    } catch {
      if (requestPermission) {
        setStatus("Could not read audio devices. Allow microphone access and try again.");
      }
    } finally {
      if (permissionStream) {
        permissionStream.getTracks().forEach((track) => track.stop());
      }
    }
  }

  async function refreshSongwriterMicPermission() {
    if (!navigator.permissions?.query) {
      setSongwriterMicPermission("unknown");
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      const updateState = () => {
        const state = result.state;
        if (state === "granted" || state === "denied" || state === "prompt") {
          setSongwriterMicPermission(state);
        } else {
          setSongwriterMicPermission("unknown");
        }
      };
      updateState();
      result.onchange = updateState;
    } catch {
      setSongwriterMicPermission("unknown");
    }
  }

  async function requestSongwriterMicAccess() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSongwriterMicPermission("unsupported");
      setStatus("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setSongwriterMicPermission("granted");
      await refreshSongwriterAudioInputs(false);
      await refreshSongwriterMicPermission();
      setStatus("Microphone access granted. Select input device and start recording.");
    } catch (error) {
      const message = getMicAccessErrorMessage(error);
      setSongwriterMicPermission(
        message.includes("blocked") || message.includes("denied")
          ? "denied"
          : "prompt"
      );
      setStatus(message);
    }
  }

  async function changeSongwriterAudioInputDevice(deviceId: string) {
    setSongwriterAudioInputDeviceId(deviceId);

    if (isSongwriterRecording) {
      return;
    }

    if (songwriterMonitorEnabled) {
      await setSongwriterMonitoring(false, false);
      await setSongwriterMonitoring(true, false, deviceId);
    }

    const label =
      deviceId === "default"
        ? "System default input"
        : songwriterAudioInputDevices.find((device) => device.id === deviceId)?.label ?? "Selected input";
    setStatus(`Input device: ${label}.`);
  }

  async function changeSongwriterAudioOutputDevice(deviceId: string) {
    setSongwriterAudioOutputDeviceId(deviceId);

    if (songwriterMonitorEnabled && songwriterStreamRef.current) {
      await applySongwriterOutputDevice(songwriterMeterContextRef.current);
    }

    const label =
      deviceId === "default"
        ? "System default output"
        : songwriterAudioOutputDevices.find((device) => device.id === deviceId)?.label ?? "Selected output";
    setStatus(`Output device: ${label}. Chrome can route output only when WebAudio setSinkId is supported.`);
  }

  async function importSongwriterIr(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      setStatus("IR import needs WebAudio support.");
      return;
    }

    const context = createSongwriterAudioContext(AudioContextClass);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
      setSongwriterIr({ fileName: file.name, buffer: decoded });
      setStatus(`IR loaded: ${file.name}. It will be used when ChugForge Amp monitoring is on.`);
    } catch {
      setStatus("Could not load that IR. Use a short WAV, AIFF, MP3, FLAC, OGG, or M4A impulse file.");
    } finally {
      await context.close();
    }
  }

  function clearSongwriterIr() {
    setSongwriterIr({ fileName: "", buffer: null });
    setStatus("IR cleared. ChugForge Amp will use its built-in cab filter.");
  }

  async function runSongwriterAudioCheck() {
    const results: string[] = [];
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    results.push(window.isSecureContext ? "OK: secure browser context" : "Problem: browser context is not secure");
    results.push(navigator.mediaDevices ? "OK: media devices API available" : "Problem: media devices API missing");
    results.push(
      typeof navigator.mediaDevices?.getUserMedia === "function" ? "OK: getUserMedia available" : "Problem: getUserMedia missing"
    );
    results.push(typeof MediaRecorder !== "undefined" ? "OK: MediaRecorder available" : "Problem: MediaRecorder missing");
    results.push(AudioContextClass ? "OK: WebAudio available for metronome" : "Problem: WebAudio missing");

    try {
      const permission = await navigator.permissions?.query({ name: "microphone" as PermissionName });
      if (permission) {
        results.push(`Mic permission: ${permission.state}`);
        setSongwriterMicPermission(permission.state as MicPermissionState);
      } else {
        results.push("Mic permission: browser does not report it");
      }
    } catch {
      results.push("Mic permission: browser does not expose permission status");
    }

    try {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const inputs = devices?.filter((device) => device.kind === "audioinput") ?? [];
      const outputs = devices?.filter((device) => device.kind === "audiooutput") ?? [];
      results.push(`Audio inputs found: ${inputs.length}`);
      results.push(`Audio outputs found: ${outputs.length}`);
      if (inputs.length > 0) {
        results.push(`Selected input: ${selectedSongwriterInputLabel()}`);
      }
      if (outputs.length > 0) {
        results.push(`Selected output: ${selectedSongwriterOutputLabel()}`);
      }
    } catch {
      results.push("Problem: could not list audio devices");
    }

    if (AudioContextClass) {
      try {
        const context = createSongwriterAudioContext(AudioContextClass);
        const latencyMs = "baseLatency" in context ? Math.round(context.baseLatency * 1000) : null;
        results.push(`Audio engine: WebAudio at ${context.sampleRate} Hz`);
        results.push(latencyMs === null ? "Latency: browser did not report base latency" : `Base latency: about ${latencyMs} ms before device/driver latency`);
        results.push(hasAudioContextSinkId(context) ? "Output routing: browser supports WebAudio output selection" : "Output routing: browser does not support WebAudio output selection here");
        await context.close();
      } catch {
        results.push("Problem: could not start a WebAudio engine for the selected settings");
      }
    }

      results.push("ASIO: not available from Chrome/WebAudio. Use REAPER/native desktop engine for lowest live guitar latency.");
      results.push(`Requested browser settings: ${songwriterSampleRate} Hz, ${songwriterBufferSize} sample buffer, ${songwriterRenderBitDepth}-bit WAV exports.`);
      results.push(songwriterBufferSize <= 128 ? "Latency setting: lowest browser buffer selected." : "Latency setting: lower the buffer to 128 samples for the tightest browser feel.");
      results.push(songwriterIr.fileName ? `Loaded IR: ${songwriterIr.fileName}` : "Loaded IR: none");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia unavailable");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: songwriterAudioConstraints() });
      stream.getTracks().forEach((track) => track.stop());
      results.push("OK: microphone stream can start");
      setSongwriterMicPermission("granted");
      setStatus("Audio check passed. You can use Input monitor or Record guitar.");
    } catch (error) {
      const message = getMicAccessErrorMessage(error);
      results.push(`Problem: ${message}`);
      if (message.includes("denied") || message.includes("blocked")) {
        results.push("Fix: remove localhost:5173 from Chrome's blocked microphone sites, reload, then click Allow mic.");
      }
      setSongwriterMicPermission(message.includes("denied") || message.includes("blocked") ? "denied" : "prompt");
      setStatus(message);
    }

    setSongwriterAudioCheck(results);
  }

  function selectedSongwriterInputLabel() {
    if (songwriterAudioInputDeviceId === "default") {
      return "System default input";
    }

    return songwriterAudioInputDevices.find((device) => device.id === songwriterAudioInputDeviceId)?.label ?? "Selected input";
  }

  function selectedSongwriterOutputLabel() {
    if (songwriterAudioOutputDeviceId === "default") {
      return "System default output";
    }

    return songwriterAudioOutputDevices.find((device) => device.id === songwriterAudioOutputDeviceId)?.label ?? "Selected output";
  }

  function songwriterAudioConstraints(deviceIdOverride?: string): MediaTrackConstraints {
    const selectedId = deviceIdOverride ?? songwriterAudioInputDeviceIdRef.current;
    const commonConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: { ideal: songwriterSampleRateRef.current },
      latency: { ideal: Math.max(0.001, songwriterBufferSizeRef.current / songwriterSampleRateRef.current) },
      channelCount: { ideal: 1 }
    };

    if (!selectedId || selectedId === "default") {
      return commonConstraints;
    }

    return {
      deviceId: { exact: selectedId },
      ...commonConstraints
    };
  }

  async function setSongwriterMonitoring(enabled: boolean, announce = true, deviceIdOverride?: string) {
    if (enabled) {
      if (songwriterMonitorEnabled) {
        return;
      }

      if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (announce) {
          setStatus("Input monitoring is not supported in this browser.");
        }
        setSongwriterMicPermission("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: songwriterAudioConstraints(deviceIdOverride) });
        songwriterStreamRef.current = stream;
        startSongwriterLevelMeter(stream);
        setSongwriterMonitorEnabled(true);
        setSongwriterMicPermission("granted");
        if (announce) {
          setStatus(`Input monitor on with ${songwriterAmpSimEnabledRef.current ? "ChugForge heavy chain" : "clean bypass"}. ${browserLatencyHintLine()}`);
        }
      } catch {
        setSongwriterMicPermission("denied");
        if (announce) {
          setStatus("Could not enable input monitor. Mic access is blocked. Click Allow mic and allow access in browser settings.");
        }
      }
      return;
    }

    setSongwriterMonitorEnabled(false);
    stopSongwriterLevelMeter();
    stopSongwriterInputStream();
    if (announce) {
      setStatus("Input monitor off.");
    }
  }

  async function startSongwriterRecording() {
    if (isSongwriterRecording) {
      return;
    }

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("Recording is not supported in this browser.");
      setSongwriterMicPermission("unsupported");
      return;
    }

    try {
      let stream = songwriterStreamRef.current;

      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: songwriterAudioConstraints() });
        songwriterStreamRef.current = stream;
      }

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = preferredMimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      const shouldTrackLiveDrums = songwriterLiveDrumsEnabledRef.current;

      if (!songwriterMonitorEnabled) {
        startSongwriterLevelMeter(stream);
      }

      if (songwriterGrooveOnRecord) {
        applySongwriterGroove(songwriterSelectedGrooveId, false);
      }

      if (shouldTrackLiveDrums) {
        setSongwriterOnsets([]);
        if (!songwriterGrooveOnRecord) {
          setSongwriterManualDrumHits(null);
        }
        setSongwriterSource({ fileName: "live-guitar-rhythm", filePath: "" });
      }

      if (songwriterMetronomeOnRecord && !songwriterMetronomeEnabled) {
        startSongwriterMetronome();
        songwriterMetronomeStartedByRecordingRef.current = true;
      } else {
        songwriterMetronomeStartedByRecordingRef.current = false;
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (!songwriterMonitorEnabled) {
          stopSongwriterLevelMeter();
          stopSongwriterInputStream();
        }
        setStatus("Recording failed. Check microphone access and try again.");
      };

      recorder.onstop = async () => {
        clearSongwriterRecordingTimer();
        setIsSongwriterRecording(false);
        songwriterRecorderRef.current = null;
        if (!songwriterMonitorEnabled) {
          stopSongwriterLevelMeter();
          stopSongwriterInputStream();
        }

        if (chunks.length === 0) {
          if (songwriterMetronomeStartedByRecordingRef.current) {
            stopSongwriterMetronome();
            songwriterMetronomeStartedByRecordingRef.current = false;
          }
          setStatus("No audio was captured. Try recording again.");
          return;
        }

        const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
        const outputType = recorder.mimeType || (extension === "m4a" ? "audio/mp4" : "audio/webm");
        const cleanedTake = cleanSongwriterTakeName(songwriterTakeName);
        const fileName = `${cleanedTake}-${Date.now()}.${extension}`;
        const file = new File([new Blob(chunks, { type: outputType })], fileName, { type: outputType });
        await handleSongwriterAudioFile(file, "Recorded guitar idea");
        if (songwriterMetronomeStartedByRecordingRef.current) {
          stopSongwriterMetronome();
          songwriterMetronomeStartedByRecordingRef.current = false;
        }
        if (songwriterAutoExportEnabled) {
          await saveSongwriterBundle();
        }
      };

      songwriterRecorderRef.current = recorder;
      setSongwriterRecordingSeconds(0);
      setIsSongwriterRecording(true);
      clearSongwriterRecordingTimer();
      setSongwriterMicPermission("granted");
      const waitMs = recordingPreRollMs(template.tempo, songwriterCountInBars, songwriterPreRollBars);
      const startRecorder = () => {
        if (recorder.state !== "inactive") {
          return;
        }

        if (shouldTrackLiveDrums) {
          songwriterRecordingStartRef.current = performance.now();
          songwriterLastLiveOnsetRef.current = -1000;
          songwriterLastRmsRef.current = 0;
        }

        songwriterTimerRef.current = window.setInterval(() => {
          setSongwriterRecordingSeconds((current) => current + 1);
        }, 1000);
        recorder.start(250);
        setStatus("Recording guitar... click Stop recording when you're done.");
      };

      if (waitMs > 0) {
        songwriterPendingRecordTimerRef.current = window.setTimeout(() => {
          songwriterPendingRecordTimerRef.current = null;
          startRecorder();
        }, waitMs);
        setStatus(`Count-in/pre-roll running for ${Math.round(waitMs / 1000)}s. Recording starts after that.`);
      } else {
        startRecorder();
      }
    } catch (error) {
      if (songwriterMetronomeStartedByRecordingRef.current) {
        stopSongwriterMetronome();
        songwriterMetronomeStartedByRecordingRef.current = false;
      }
      setSongwriterMicPermission("denied");
      setStatus(getMicAccessErrorMessage(error));
    }
  }

  async function stopSongwriterRecording() {
    const recorder = songwriterRecorderRef.current;

    if (songwriterPendingRecordTimerRef.current !== null) {
      window.clearTimeout(songwriterPendingRecordTimerRef.current);
      songwriterPendingRecordTimerRef.current = null;
    }

    if (!recorder || recorder.state === "inactive") {
      setIsSongwriterRecording(false);
      clearSongwriterRecordingTimer();
      songwriterRecordingStartRef.current = null;
      if (!songwriterMonitorEnabled) {
        stopSongwriterLevelMeter();
        stopSongwriterInputStream();
      }
      if (songwriterMetronomeStartedByRecordingRef.current) {
        stopSongwriterMetronome();
        songwriterMetronomeStartedByRecordingRef.current = false;
      }
      return;
    }

    setStatus("Finishing recording...");
    recorder.stop();
  }

  async function importSourceFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const supportedFiles = files.filter((file) => isSupportedImportFileName(file.name));
    const skippedCount = files.length - supportedFiles.length;

    if (supportedFiles.length === 0) {
      setStatus("No supported source files selected.");
      return;
    }

    const plan = planBatchSourceImports(template, supportedFiles.map((file) => file.name));
    const importedFiles = await Promise.all(supportedFiles.map((file) => uploadSourceFile(file)));
    const selectableSourceIds = new Set(backingPartOptions.map((part) => part.sourceId));
    const importedBackingSourceIds = plan
      .map((item) => item.sourceId)
      .filter((sourceId) => selectableSourceIds.has(sourceId));

    setTemplate((current) => {
      const nextSources = [...current.sourceAssets];

      plan.forEach((item, index) => {
        const imported = importedFiles[index];
        const patch: Partial<SourceAssetTemplate> = {
          kind: "local-file",
          fileName: imported.fileName,
          filePath: imported.path
        };
        const existingIndex = nextSources.findIndex((source) => source.id === item.sourceId);

        if (existingIndex === -1 || item.isNewSource) {
          nextSources.push(
            createSourceAsset(item.sourceId, item.sourceLabel, "local-file", item.targetTrackId, imported.fileName, imported.path)
          );
          return;
        }

        nextSources[existingIndex] = { ...nextSources[existingIndex], ...patch };
      });

      return { ...current, sourceAssets: nextSources };
    });

    if (importedBackingSourceIds.length > 0) {
      setSelectedBackingPartSourceIds((current) => Array.from(new Set([...current, ...importedBackingSourceIds])));
    }

    const matchedCount = plan.filter((item) => !item.isNewSource).length;
    const newCount = plan.length - matchedCount;
    const skippedMessage = skippedCount > 0 ? ` ${skippedCount} unsupported file${skippedCount === 1 ? "" : "s"} skipped.` : "";
    setStatus(
      `Imported ${supportedFiles.length} file${supportedFiles.length === 1 ? "" : "s"}. ${matchedCount} placed in ready slots, ${newCount} added as new source${newCount === 1 ? "" : "s"}.${skippedMessage}`
    );
  }

  async function uploadSourceFile(file: File): Promise<{ fileName: string; path: string; imported: boolean }> {
    try {
      const response = await fetch("/api/import-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name)
        },
        body: file
      });

      if (response.ok) {
        const result = (await response.json()) as { fileName?: string; path?: string };
        return {
          fileName: result.fileName ?? file.name,
          path: result.path ?? file.name,
          imported: true
        };
      }
    } catch {
      // Fall back to storing the visible filename when the local dev endpoint is unavailable.
    }

    return { fileName: file.name, path: "", imported: false };
  }

  function clearSongwriterRecordingTimer() {
    if (songwriterTimerRef.current !== null) {
      window.clearInterval(songwriterTimerRef.current);
      songwriterTimerRef.current = null;
    }
  }

  function stopSongwriterInputStream() {
    const stream = songwriterStreamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      songwriterStreamRef.current = null;
    }
  }

  function createSongwriterAudioContext(AudioContextClass: typeof AudioContext): AudioContext {
    const latencyHint = Math.max(0.001, Math.min(0.004, songwriterBufferSizeRef.current / songwriterSampleRateRef.current));

    try {
      return new AudioContextClass({
        sampleRate: songwriterSampleRateRef.current,
        latencyHint
      });
    } catch {
      return new AudioContextClass({ latencyHint: "interactive" });
    }
  }

  function browserLatencyHintLine(): string {
    const context = songwriterMeterContextRef.current;
    const baseLatencyMs = context && "baseLatency" in context ? Math.round(context.baseLatency * 1000) : null;
    const baseText = baseLatencyMs ? `Browser base latency reports about ${baseLatencyMs} ms before driver/output latency.` : "Browser latency still depends on Chrome and the audio driver.";

    return `${baseText} For real ASIO feel, use the JUCE/REAPER native path.`;
  }

  function hasAudioContextSinkId(context: AudioContext): boolean {
    return typeof (context as AudioContext & { setSinkId?: (sinkId: string) => Promise<void> }).setSinkId === "function";
  }

  async function applySongwriterOutputDevice(context: AudioContext | null) {
    const outputId = songwriterAudioOutputDeviceIdRef.current;

    if (!context || outputId === "default") {
      return;
    }

    const sinkContext = context as AudioContext & { setSinkId?: (sinkId: string) => Promise<void> };

    if (!sinkContext.setSinkId) {
      setStatus("This browser cannot route WebAudio to a selected output. Use system output or REAPER/native engine.");
      return;
    }

    try {
      await sinkContext.setSinkId(outputId);
    } catch {
      setStatus("Could not switch browser output device. Check Chrome audio permissions or use system default output.");
    }
  }

  function startSongwriterLevelMeter(stream: MediaStream) {
    stopSongwriterLevelMeter(false);
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = createSongwriterAudioContext(AudioContextClass);
    void applySongwriterOutputDevice(context);
    const analyser = context.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.82;

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    if (songwriterAmpSimEnabledRef.current) {
      const preHighpass = context.createBiquadFilter();
      const inputGain = context.createGain();
      const driveA = context.createWaveShaper();
      const postDriveTrim = context.createGain();
      const driveB = context.createWaveShaper();
      const lowShelf = context.createBiquadFilter();
      const lowMidPunch = context.createBiquadFilter();
      const midCut = context.createBiquadFilter();
      const presence = context.createBiquadFilter();
      const cabLowpass = context.createBiquadFilter();
      const cabinetIr = songwriterIrRef.current.buffer;
      const outputCompressor = context.createDynamicsCompressor();
      const outputGain = context.createGain();

      preHighpass.type = "highpass";
      preHighpass.frequency.value = 52;
      preHighpass.Q.value = 0.7;
      postDriveTrim.gain.value = 0.42;
      lowShelf.type = "lowshelf";
      lowMidPunch.type = "peaking";
      lowMidPunch.frequency.value = 155;
      lowMidPunch.Q.value = 0.9;
      midCut.type = "peaking";
      midCut.frequency.value = 620;
      midCut.Q.value = 0.95;
      presence.type = "peaking";
      presence.frequency.value = 2850;
      presence.Q.value = 0.75;
      cabLowpass.type = "lowpass";
      cabLowpass.Q.value = 0.72;
      outputCompressor.threshold.value = -18;
      outputCompressor.knee.value = 9;
      outputCompressor.ratio.value = 3.2;
      outputCompressor.attack.value = 0.004;
      outputCompressor.release.value = 0.09;

      source.connect(preHighpass);
      preHighpass.connect(inputGain);
      inputGain.connect(driveA);
      driveA.connect(postDriveTrim);
      postDriveTrim.connect(driveB);
      driveB.connect(lowShelf);
      lowShelf.connect(lowMidPunch);
      lowMidPunch.connect(midCut);
      midCut.connect(presence);
      if (cabinetIr) {
        const convolver = context.createConvolver();
        convolver.buffer = cabinetIr;
        presence.connect(convolver);
        convolver.connect(cabLowpass);
      } else {
        presence.connect(cabLowpass);
      }
      cabLowpass.connect(outputCompressor);
      outputCompressor.connect(outputGain);
      outputGain.connect(context.destination);
      songwriterAmpMonitorNodesRef.current = {
        context,
        inputGain,
        driveA,
        driveB,
        lowShelf,
        lowMidPunch,
        midCut,
        presence,
        cabLowpass,
        outputCompressor,
        outputGain
      };
      updateSongwriterAmpMonitorTone();
    } else {
      const cleanHighpass = context.createBiquadFilter();
      const cleanGain = context.createGain();

      cleanHighpass.type = "highpass";
      cleanHighpass.frequency.value = 45;
      cleanGain.gain.value = 0.52;
      source.connect(cleanHighpass);
      cleanHighpass.connect(cleanGain);
      cleanGain.connect(context.destination);
      songwriterAmpMonitorNodesRef.current = null;
    }

    songwriterMeterContextRef.current = context;
    songwriterMeterAnalyserRef.current = analyser;

    const samples = new Uint8Array(analyser.fftSize);
    const tunerSamples = new Float32Array(analyser.fftSize);
    const tick = () => {
      const liveAnalyser = songwriterMeterAnalyserRef.current;

      if (!liveAnalyser) {
        return;
      }

      liveAnalyser.getByteTimeDomainData(samples);
      if (songwriterTunerEnabledRef.current) {
        liveAnalyser.getFloatTimeDomainData(tunerSamples);
        updateTunerFromSamples(tunerSamples, context.sampleRate);
      }

      let sum = 0;

      for (let index = 0; index < samples.length; index += 1) {
        const centered = (samples[index] - 128) / 128;
        sum += centered * centered;
      }

      const rms = Math.sqrt(sum / samples.length);
      setSongwriterInputLevel(Math.min(100, rms * 280));
      maybeAddLiveDrumOnset(rms);
      songwriterMeterFrameRef.current = window.requestAnimationFrame(tick);
    };

    tick();
  }

  function updateSongwriterAmpMonitorTone() {
    const nodes = songwriterAmpMonitorNodesRef.current;

    if (!nodes) {
      return;
    }

    const now = nodes.context.currentTime;
    const gain = Math.max(1, songwriterAmpGainRef.current);
    const tone = Math.min(100, Math.max(0, songwriterAmpToneRef.current));
    const toneNormalized = tone / 100;

    nodes.inputGain.gain.setTargetAtTime(0.72 + gain * 0.18, now, 0.012);
    nodes.driveA.curve = createThallDriveCurve(840 + gain * 210) as Float32Array<ArrayBuffer>;
    nodes.driveA.oversample = "4x";
    nodes.driveB.curve = createThallDriveCurve(520 + gain * 120) as Float32Array<ArrayBuffer>;
    nodes.driveB.oversample = "4x";
    nodes.lowShelf.frequency.setTargetAtTime(92, now, 0.018);
    nodes.lowShelf.gain.setTargetAtTime(3.5 + gain * 0.18, now, 0.018);
    nodes.lowMidPunch.gain.setTargetAtTime(2.4 + gain * 0.12, now, 0.018);
    nodes.midCut.gain.setTargetAtTime(-5.8 + toneNormalized * 1.6, now, 0.018);
    nodes.presence.gain.setTargetAtTime(1.5 + toneNormalized * 6.5, now, 0.018);
    nodes.cabLowpass.frequency.setTargetAtTime(2800 + toneNormalized * 3600, now, 0.018);
    nodes.outputGain.gain.setTargetAtTime(0.34, now, 0.018);
  }

  function maybeAddLiveDrumOnset(rms: number) {
    const start = songwriterRecordingStartRef.current;

    if (!songwriterLiveDrumsEnabledRef.current || !songwriterIsRecordingRef.current || start === null) {
      songwriterLastRmsRef.current = rms;
      return;
    }

    const now = performance.now();
    const previousRms = songwriterLastRmsRef.current;
    const enoughTimePassed = now - songwriterLastLiveOnsetRef.current > 105;
    const isTransient = rms > 0.042 && rms > previousRms * 1.32;

    if (enoughTimePassed && isTransient) {
      const timeSeconds = Math.max(0, (now - start) / 1000);
      const intensity = Math.min(1, Math.max(0.35, rms * 5.8));

      songwriterLastLiveOnsetRef.current = now;
      setSongwriterOnsets((current) => [
        ...current,
        {
          timeSeconds: Number(timeSeconds.toFixed(3)),
          intensity: Number(intensity.toFixed(3))
        }
      ]);
      setSongwriterManualDrumHits(null);
    }

    songwriterLastRmsRef.current = rms;
  }

  function updateTunerFromSamples(samples: Float32Array, sampleRate: number) {
    const now = performance.now();

    if (now - songwriterLastTunerUpdateRef.current < 90) {
      return;
    }

    songwriterLastTunerUpdateRef.current = now;
    const pitch = detectGuitarPitch(samples, sampleRate);

    if (!pitch) {
      setSongwriterTunerReadout((current) =>
        current.frequency > 0 ? { ...current, frequency: 0, confidence: 0 } : current
      );
      return;
    }

    setSongwriterTunerReadout(frequencyToTunerReadout(pitch.frequency, pitch.confidence));
  }

  function stopSongwriterLevelMeter(resetLevel = true) {
    if (songwriterMeterFrameRef.current !== null) {
      window.cancelAnimationFrame(songwriterMeterFrameRef.current);
      songwriterMeterFrameRef.current = null;
    }

    songwriterMeterAnalyserRef.current = null;
    songwriterAmpMonitorNodesRef.current = null;
    const meterContext = songwriterMeterContextRef.current;

    if (meterContext) {
      void meterContext.close();
      songwriterMeterContextRef.current = null;
    }

    if (resetLevel) {
      setSongwriterInputLevel(0);
      setSongwriterTunerReadout({ note: "--", cents: 0, frequency: 0, confidence: 0 });
    }
  }

  async function toggleSongwriterMetronome() {
    if (songwriterMetronomeEnabled) {
      stopSongwriterMetronome();
      setStatus("Metronome off.");
      return;
    }

    startSongwriterMetronome();
    setStatus(`Metronome on at ${safeMetronomeTempo(template.tempo)} BPM.`);
  }

  function startSongwriterMetronome() {
    stopSongwriterMetronome();
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = createSongwriterAudioContext(AudioContextClass);
    void applySongwriterOutputDevice(context);
    const bpm = safeMetronomeTempo(template.tempo);
    const intervalMs = (60_000 / bpm) | 0;
    songwriterMetronomeContextRef.current = context;
    songwriterMetronomeBeatRef.current = 0;
    setSongwriterMetronomeEnabled(true);

    playSongwriterMetronomeTick(true);
    songwriterMetronomeBeatRef.current = 1;
    songwriterMetronomeIntervalRef.current = window.setInterval(() => {
      const beat = songwriterMetronomeBeatRef.current;
      playSongwriterMetronomeTick(beat % 4 === 0);
      songwriterMetronomeBeatRef.current += 1;
    }, Math.max(40, intervalMs));
  }

  function playSongwriterBassPreview() {
    if (!songwriterBassEnabled || songwriterSketch.drumHits.length === 0) {
      setStatus("Forge Bass needs drum guide hits first. Record, tap, or choose a drum preset.");
      return;
    }

    stopSongwriterBassPreview();
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      setStatus("Forge Bass needs WebAudio support.");
      return;
    }

    const context = createSongwriterAudioContext(AudioContextClass);
    void applySongwriterOutputDevice(context);
    songwriterBassContextRef.current = context;
    setIsSongwriterBassPlaying(true);

    const hits = songwriterSketch.drumHits
      .filter((hit) => hit.voice === "kick" || hit.voice === "crash")
      .slice(0, 96);
    const now = context.currentTime + 0.08;
    const rootMidi = Math.min(72, Math.max(12, songwriterBassRootMidi + songwriterBassOctaveOffset * 12));
    const rootFrequency = midiToFrequency(rootMidi);
    const output = context.createGain();
    output.gain.value = songwriterBassLevel / 100 * 0.35;
    output.connect(context.destination);

    for (const hit of hits) {
      const humanizeSeconds = deterministicBassHumanize(hit.step, songwriterBassHumanizeMs);
      const start = now + Math.max(0, hit.timeSeconds + humanizeSeconds);
      const duration = hit.intensity > 0.82 ? 0.22 : 0.13;
      playForgeBassNote(context, output, start, duration, rootFrequency, hit.intensity);
    }

    const lastHit = hits[hits.length - 1];
    const stopAfterMs = Math.max(500, ((lastHit?.timeSeconds ?? 0) + 1) * 1000);
    songwriterBassStopTimerRef.current = window.setTimeout(stopSongwriterBassPreview, stopAfterMs);
    setStatus("Forge Bass preview playing.");
  }

  function playForgeBassNote(context: AudioContext, output: GainNode, start: number, duration: number, rootFrequency: number, intensity: number) {
    const oscillator = context.createOscillator();
    const sub = context.createOscillator();
    const drive = context.createWaveShaper();
    const lowpass = context.createBiquadFilter();
    const noteGain = context.createGain();
    const clickOscillator = context.createOscillator();
    const clickGain = context.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(rootFrequency, start);
    sub.type = "square";
    sub.frequency.setValueAtTime(rootFrequency / 2, start);
    drive.curve = createThallDriveCurve(160 + songwriterBassDrive * 9) as Float32Array<ArrayBuffer>;
    drive.oversample = "4x";
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(850 + songwriterBassClick * 22, start);
    lowpass.Q.value = 1.2;
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.02, intensity * 0.45), start + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(drive);
    sub.connect(drive);
    drive.connect(lowpass);
    lowpass.connect(noteGain);
    noteGain.connect(output);

    clickOscillator.type = "square";
    clickOscillator.frequency.setValueAtTime(2200 + songwriterBassClick * 30, start);
    clickGain.gain.setValueAtTime(Math.max(0.0001, songwriterBassClick / 100 * 0.12), start);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.025);
    clickOscillator.connect(clickGain);
    clickGain.connect(output);

    oscillator.start(start);
    sub.start(start);
    clickOscillator.start(start);
    oscillator.stop(start + duration + 0.05);
    sub.stop(start + duration + 0.05);
    clickOscillator.stop(start + 0.035);
  }

  function stopSongwriterBassPreview() {
    if (songwriterBassStopTimerRef.current !== null) {
      window.clearTimeout(songwriterBassStopTimerRef.current);
      songwriterBassStopTimerRef.current = null;
    }

    const context = songwriterBassContextRef.current;

    if (context) {
      void context.close();
      songwriterBassContextRef.current = null;
    }

    setIsSongwriterBassPlaying(false);
  }

  function playSongwriterMetronomeTick(accent: boolean) {
    const context = songwriterMetronomeContextRef.current;

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = accent ? 1420 : 980;
    gain.gain.value = 0.0001;
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.24 : 0.14, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.07);
  }

  function stopSongwriterMetronome() {
    if (songwriterMetronomeIntervalRef.current !== null) {
      window.clearInterval(songwriterMetronomeIntervalRef.current);
      songwriterMetronomeIntervalRef.current = null;
    }

    const context = songwriterMetronomeContextRef.current;

    if (context) {
      void context.close();
      songwriterMetronomeContextRef.current = null;
    }

    setSongwriterMetronomeEnabled(false);
  }
}

function detectGuitarPitch(samples: Float32Array, sampleRate: number): { frequency: number; confidence: number } | null {
  let rmsSum = 0;

  for (let index = 0; index < samples.length; index += 1) {
    rmsSum += samples[index] * samples[index];
  }

  const rms = Math.sqrt(rmsSum / samples.length);

  if (rms < 0.01) {
    return null;
  }

  const minFrequency = 35;
  const maxFrequency = 1400;
  const minLag = Math.floor(sampleRate / maxFrequency);
  const maxLag = Math.min(samples.length - 2, Math.floor(sampleRate / minFrequency));
  let bestLag = 0;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    let sumA = 0;
    let sumB = 0;

    for (let index = 0; index < samples.length - lag; index += 1) {
      const current = samples[index];
      const delayed = samples[index + lag];
      sum += current * delayed;
      sumA += current * current;
      sumB += delayed * delayed;
    }

    const denominator = Math.sqrt(sumA * sumB);
    const correlation = denominator > 0 ? sum / denominator : 0;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag === 0 || bestCorrelation < 0.35) {
    return null;
  }

  return {
    frequency: sampleRate / bestLag,
    confidence: Math.min(1, Math.max(0, bestCorrelation))
  };
}

function frequencyToTunerReadout(frequency: number, confidence: number): TunerReadout {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = 69 + 12 * Math.log2(frequency / 440);
  const nearestMidi = Math.round(midi);
  const noteIndex = ((nearestMidi % 12) + 12) % 12;
  const octave = Math.floor(nearestMidi / 12) - 1;
  const cents = Math.round((midi - nearestMidi) * 100);

  return {
    note: `${noteNames[noteIndex]}${octave}`,
    cents: Math.min(50, Math.max(-50, cents)),
    frequency,
    confidence
  };
}

function formatSignedValue(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function KnobControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  displayValue,
  size = "medium",
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  displayValue?: string;
  size?: "small" | "medium";
  onChange: (value: number) => void;
}) {
  const normalized = max === min ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -135 + normalized * 270;
  const style = { "--knob-angle": `${angle}deg` } as CSSProperties;

  return (
    <label className={`knob-control ${size}`}>
      <span className="knob-label">{label}</span>
      <span className="knob-shell">
        <span className="knob-dial" style={style}>
          <span />
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
        />
      </span>
      <span className="knob-value">{displayValue ?? `${value}${unit}`}</span>
    </label>
  );
}

function DrumMapEditor({ hits, onToggle }: { hits: DrumHit[]; onToggle: (voice: DrumVoice, step: number) => void }) {
  const voices: DrumVoice[] = ["kick", "snare", "hat", "crash"];
  const activeHits = new Set(hits.map((hit) => `${hit.voice}-${hit.step}`));
  const visibleSteps = 32;

  return (
    <div className="drum-map-editor" aria-label="Editable drum map">
      {hits.length === 0 ? <div className="drum-map-empty">No drum hits yet. Tap rhythm, upload audio, or click cells below.</div> : null}
      <div className="drum-map-scroll">
        <div className="drum-map-header" aria-hidden="true">
          <span />
          {Array.from({ length: visibleSteps }, (_, step) => (
            <span className={step % 4 === 0 ? "drum-map-step beat-step" : "drum-map-step"} key={step}>
              {step % 4 === 0 ? Math.floor(step / 4) + 1 : ""}
            </span>
          ))}
        </div>
        {voices.map((voice) => (
          <div className="drum-map-row" key={voice}>
            <strong>{drumVoiceLabel(voice)}</strong>
            {Array.from({ length: visibleSteps }, (_, step) => {
              const isActive = activeHits.has(`${voice}-${step}`);

              return (
                <button
                  type="button"
                  className={isActive ? `drum-map-cell active ${voice}` : "drum-map-cell"}
                  key={step}
                  onClick={() => onToggle(voice, step)}
                  aria-pressed={isActive}
                  aria-label={`${isActive ? "Remove" : "Add"} ${drumVoiceLabel(voice)} step ${step + 1}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcePreview({ source }: { source: SourceAssetTemplate }) {
  const previewFileName = sourcePreviewFileName(source);
  const previewUrl = previewFileName ? createImportedFileUrl(previewFileName) : "";
  const mediaKind = getImportMediaKind(previewFileName);

  if (!previewUrl || mediaKind === "unknown") {
    return <div className="source-preview-placeholder">No preview</div>;
  }

  if (mediaKind === "video") {
    return (
      <video
        className="source-preview-media"
        controls
        preload="metadata"
        src={previewUrl}
        aria-label={`${source.label} video preview`}
      />
    );
  }

  return (
    <audio
      className="source-preview-media"
      controls
      preload="metadata"
      src={previewUrl}
      aria-label={`${source.label} audio preview`}
    />
  );
}

function RenderPreviewPanel({
  renderedPreview,
  onImport
}: {
  renderedPreview: RenderedPreview | null;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const previewUrl = renderedPreview?.fileName ? createImportedFileUrl(renderedPreview.fileName) : "";
  const mediaKind = getImportMediaKind(renderedPreview?.fileName ?? "");

  return (
    <div className="render-preview-panel">
      <div>
        <strong>Listen to final render</strong>
        <p>The app creates REAPER files. Import the rendered audio/video here after REAPER export to preview it.</p>
      </div>
      <label className="quick-upload render-upload">
        <Upload aria-hidden="true" size={16} />
        <span>Import final render</span>
        <input type="file" accept=".wav,.mp3,.flac,.aif,.aiff,.ogg,.m4a,.mp4,.mov,.webm" onChange={onImport} />
      </label>
      {renderedPreview ? (
        <div className="render-preview-player">
          <span>{renderedPreview.filePath || renderedPreview.fileName}</span>
          {mediaKind === "video" ? (
            <video controls preload="metadata" src={previewUrl} />
          ) : mediaKind === "audio" ? (
            <audio controls preload="metadata" src={previewUrl} />
          ) : (
            <p className="empty-state">Preview is not available for this file type.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function sourcePreviewFileName(source: SourceAssetTemplate): string {
  return source.fileName || getImportedFileNameFromPath(source.filePath);
}

function getBackingSelectionFromTemplate(template: GuitarWorkflowTemplate): string[] {
  const loadedSourceIds = backingPartOptions
    .filter((part) => {
      const source = template.sourceAssets.find((candidate) => candidate.id === part.sourceId);
      return Boolean(source?.fileName.trim() || source?.filePath.trim() || source?.sourceUrl.trim());
    })
    .map((part) => part.sourceId);

  return loadedSourceIds.length > 0 ? loadedSourceIds : defaultBackingPartSourceIds;
}

function createBackingTemplateFromSelection(
  template: GuitarWorkflowTemplate,
  selectedSourceIds: string[]
): GuitarWorkflowTemplate {
  if (template.presetId !== "backing-track-creator") {
    return template;
  }

  const selectedSet = new Set(selectedSourceIds);
  const knownSourceIds = new Set(backingPartOptions.map((part) => part.sourceId));
  const knownTargetTrackIds = new Set(backingPartOptions.map((part) => part.targetTrackId));
  const selectedTargetTrackIds = new Set(
    backingPartOptions.filter((part) => selectedSet.has(part.sourceId)).map((part) => part.targetTrackId)
  );
  const includedLabels = backingPartOptions
    .filter((part) => selectedSet.has(part.sourceId))
    .map((part) => part.label)
    .join(", ");
  const baseNotes = template.sourceNotes.replace(/\s*Included backing parts:.*$/i, "").trim();

  return {
    ...template,
    sourceNotes: `${baseNotes}${baseNotes ? " " : ""}Included backing parts: ${includedLabels}.`,
    tracks: template.tracks.filter((track) => !knownTargetTrackIds.has(track.id) || selectedTargetTrackIds.has(track.id)),
    sourceAssets: template.sourceAssets.filter((source) => !knownSourceIds.has(source.id) || selectedSet.has(source.id)),
    routes: template.routes.filter(
      (route) => !knownTargetTrackIds.has(route.fromTrackId) || selectedTargetTrackIds.has(route.fromTrackId)
    )
  };
}

function withBackingRequestNotes(
  template: GuitarWorkflowTemplate,
  mode: BackingCreationMode,
  removedInstrumentIds: string[]
): GuitarWorkflowTemplate {
  if (template.presetId !== "backing-track-creator") {
    return template;
  }

  const request =
    mode === "all-stems"
      ? "Backing request: create all stems layout."
      : `Backing request: remove ${formatBackingRemovedInstruments(removedInstrumentIds)} from the imported full song.`;
  const scope =
    "This app prepares the REAPER/session package. Actual instrument removal or stem separation still requires a source-separation/render step outside this browser app.";
  const baseNotes = template.sourceNotes.replace(/\s*Backing request:.*$/i, "").trim();

  return {
    ...template,
    sourceNotes: `${baseNotes}${baseNotes ? " " : ""}${request} ${scope}`
  };
}

function formatBackingRemovedInstruments(removedInstrumentIds: string[]) {
  if (removedInstrumentIds.length === 0) {
    return "no instruments";
  }

  const labels = removedInstrumentIds.map((id) => backingRemovalOptions.find((option) => option.id === id)?.label.toLowerCase() ?? id);
  return labels.join(", ");
}

function createDirectAudioWarnings(removedInstrumentIds: string[], reduceCenter: boolean): string[] {
  const warnings: string[] = [];
  const unsupported = removedInstrumentIds.filter((id) => id !== "guitars" && id !== "vocals");

  if (reduceCenter) {
    warnings.push("Quick render used center-reduction. It can reduce centered guitars/vocals, but it is not full AI stem separation.");
  }

  if (unsupported.length > 0) {
    warnings.push(`These choices need a real stem-separation engine for accurate removal: ${formatBackingRemovedInstruments(unsupported)}.`);
  }

  if (removedInstrumentIds.length === 0) {
    warnings.push("No instruments were selected for removal, so this WAV is a clean decoded copy of the imported song.");
  }

  return warnings;
}

function createDirectAudioReadme(outputFileName: string, removedInstrumentIds: string[], reduceCenter: boolean, transposeSemitones: number) {
  return [
    "# Direct Audio Export",
    "",
    `Created file: ${outputFileName}`,
    `Requested removal: ${formatBackingRemovedInstruments(removedInstrumentIds)}`,
    `Transpose: ${transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones} semitones`,
    "",
    reduceCenter
      ? "This quick render used stereo center-reduction. It is useful for rough practice previews, but it is not full AI stem separation."
      : "This render keeps the imported audio content without center-reduction.",
    "",
    "You can import the WAV into any DAW, video editor, phone app, or REAPER session."
  ].join("\n");
}

function uniqueId(base: string, existing: string[]) {
  const taken = new Set(existing);
  let candidate = cleanId(base);
  let suffix = 2;

  while (taken.has(candidate)) {
    candidate = `${cleanId(base)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function cleanId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanSongwriterTakeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "riff-idea";
}

function getSongwriterArrangementSummary(sections: SongSection[], tempo: number) {
  const secondsPerBar = 4 * 60 / safeMetronomeTempo(tempo);
  let totalBars = 0;
  let totalSeconds = 0;

  const starts = sections.map((section) => {
    const start = {
      bar: totalBars + 1,
      timeSeconds: totalSeconds
    };
    const bars = Math.max(1, Math.round(section.bars));
    totalBars += bars;
    totalSeconds += bars * secondsPerBar;
    return start;
  });

  return { starts, totalBars, totalSeconds };
}

function formatSeconds(value: number) {
  const safeValue = Math.max(0, Math.round(value));
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function safeMetronomeTempo(value: number) {
  if (!Number.isFinite(value)) {
    return 120;
  }

  return Math.min(260, Math.max(40, Math.round(value)));
}

function recordingPreRollMs(tempo: number, countInBars: number, preRollBars: number) {
  const bars = Math.max(0, Math.round(countInBars)) + Math.max(0, Math.round(preRollBars));
  return bars * 4 * (60000 / safeMetronomeTempo(tempo));
}

function drumVoiceLabel(voice: DrumVoice) {
  if (voice === "snare") {
    return "SNARE";
  }

  if (voice === "hat") {
    return "HAT";
  }

  if (voice === "crash") {
    return "CRASH";
  }

  return "KICK";
}

function ambientEffectUiLabel(type: AmbientEffectType) {
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

function midiToFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function deterministicBassHumanize(step: number, humanizeMs: number) {
  if (humanizeMs <= 0) {
    return 0;
  }

  const pseudo = Math.sin((step + 1) * 18.219 + 9.31) * 24634.6345;
  const normalized = pseudo - Math.floor(pseudo);
  return ((normalized - 0.5) * humanizeMs) / 1000;
}

function sortDrumHits(left: DrumHit, right: DrumHit) {
  return left.step - right.step || drumVoiceLabel(left.voice).localeCompare(drumVoiceLabel(right.voice));
}

function getMicAccessErrorMessage(error: unknown) {
  const err = error as { name?: string };
  const name = err?.name ?? "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Mic access denied/blocked. Remove localhost:5173 from blocked microphone sites, reload, then click Allow mic.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone input found. Connect/select your interface and click Refresh inputs.";
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Microphone is busy in another app. Close other audio apps and try again.";
  }

  if (name === "OverconstrainedError") {
    return "Selected input device is unavailable. Choose another input device.";
  }

  return "Could not start microphone input. Click Allow mic and check browser permission settings for localhost:5173.";
}

async function detectGuitarOnsets(file: File): Promise<GuitarOnset[]> {
  const AudioContextClass =
    window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return [];
  }

  const audioContext = new AudioContextClass();

  try {
    const buffer = await audioContext.decodeAudioData(await file.arrayBuffer());
    const mono = mixToMono(buffer);
    const frameSize = 2048;
    const hopSize = 512;
    const energies: number[] = [];

    for (let index = 0; index + frameSize < mono.length; index += hopSize) {
      let sum = 0;

      for (let sampleIndex = 0; sampleIndex < frameSize; sampleIndex += 1) {
        const sample = mono[index + sampleIndex];
        sum += sample * sample;
      }

      energies.push(Math.sqrt(sum / frameSize));
    }

    const fluxes = energies.map((energy, index) => Math.max(0, energy - (energies[index - 1] ?? 0)));
    const averageFlux = fluxes.reduce((sum, value) => sum + value, 0) / Math.max(fluxes.length, 1);
    const maxFlux = Math.max(...fluxes, 0.000001);
    const threshold = Math.max(averageFlux * 2.2, maxFlux * 0.08);
    const minGapSeconds = 0.075;
    const onsets: GuitarOnset[] = [];
    let lastOnsetTime = -Infinity;

    for (let index = 1; index < fluxes.length - 1; index += 1) {
      const flux = fluxes[index];

      if (flux < threshold || flux < fluxes[index - 1] || flux < fluxes[index + 1]) {
        continue;
      }

      const timeSeconds = (index * hopSize) / buffer.sampleRate;

      if (timeSeconds - lastOnsetTime < minGapSeconds) {
        continue;
      }

      onsets.push({
        timeSeconds: Number(timeSeconds.toFixed(3)),
        intensity: Number(Math.min(flux / maxFlux, 1).toFixed(3))
      });
      lastOnsetTime = timeSeconds;

      if (onsets.length >= 160) {
        break;
      }
    }

    return onsets;
  } finally {
    await audioContext.close();
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const mono = new Float32Array(buffer.length);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const channelData = buffer.getChannelData(channel);

    for (let index = 0; index < channelData.length; index += 1) {
      mono[index] += channelData[index] / buffer.numberOfChannels;
    }
  }

  return mono;
}

function createThallDriveCurve(amount: number): Float32Array {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const drive = Math.max(1, amount);

  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    const gated = Math.abs(x) < 0.012 ? 0 : x;
    const hard = Math.tanh(gated * drive * 0.024);
    const bite = Math.tanh(gated * drive * 0.006) * 0.18;
    curve[index] = Math.max(-0.96, Math.min(0.96, (hard + bite) * 0.9));
  }

  return curve;
}

function startBrowserDownload(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function startBrowserDownloadBinary(filename: string, bytes: Uint8Array, type: string) {
  const payload = blobPartFromBytes(bytes);
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function blobPartFromBytes(bytes: Uint8Array): BlobPart {
  const byteArray = new Uint8Array(bytes);

  return byteArray.buffer instanceof ArrayBuffer
    ? byteArray.buffer.slice(byteArray.byteOffset, byteArray.byteOffset + byteArray.byteLength)
    : byteArray.slice();
}

function decodeBase64Bytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s+/g, "");
  const decoded = atob(normalized);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

export default App;
