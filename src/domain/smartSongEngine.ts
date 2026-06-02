import { RiffRole, SongwriterFeel } from "./songwriter";

export interface SmartSongEngineInput {
  tempo: number;
  tuning: string;
  feel: SongwriterFeel;
  riffRole: RiffRole;
  onsetCount: number;
}

export interface SmartSongEnginePlan {
  grooveId: string;
  guitarTonePresetId: string;
  bassRootMidi: number;
  bassDrive: number;
  bassClick: number;
  ambientEffectIds: string[];
  whammyPresetIds: string[];
  notes: string[];
}

export function createSmartSongEnginePlan(input: SmartSongEngineInput): SmartSongEnginePlan {
  const tempo = Number.isFinite(input.tempo) ? input.tempo : 120;
  const heavyTuning = isLowTuning(input.tuning);
  const breakdown = input.feel === "breakdown" || input.riffRole === "breakdown";
  const sparseRiff = input.onsetCount > 0 && input.onsetCount < 8;

  const grooveId = selectGrooveId(tempo, input.feel, input.riffRole, sparseRiff);
  const guitarTonePresetId = selectGuitarTonePresetId(input.feel, input.riffRole, tempo, heavyTuning);
  const ambientEffectIds = selectAmbientEffectIds(input.feel, input.riffRole, breakdown);
  const whammyPresetIds = selectWhammyPresetIds(input.riffRole, breakdown);

  return {
    grooveId,
    guitarTonePresetId,
    bassRootMidi: bassMidiRootForTuning(input.tuning),
    bassDrive: heavyTuning || breakdown ? 72 : 58,
    bassClick: heavyTuning ? 86 : 68,
    ambientEffectIds,
    whammyPresetIds,
    notes: [
      `Groove target: ${grooveId}.`,
      `Tone target: ${guitarTonePresetId}.`,
      heavyTuning ? "Low tuning detected: use more bass click and tighter low-end." : "Standard-ish tuning detected: keep bass click controlled.",
      breakdown ? "Breakdown context: add stops, pitch movement, and reverse/stutter effects." : "Non-breakdown context: keep the groove playable and build contrast later.",
      sparseRiff ? "Sparse riff: leave space around hits and let kick/bass accents speak." : "Dense riff: prioritize a stable groove before adding fills."
    ]
  };
}

function selectGuitarTonePresetId(feel: SongwriterFeel, riffRole: RiffRole, tempo: number, heavyTuning: boolean): string {
  if (feel === "ambient") {
    return "void-ambient-edge";
  }

  if (riffRole === "breakdown") {
    return heavyTuning ? "black-hole-breakdown" : "glass-chug-click";
  }

  if (riffRole === "chorus") {
    return "liquid-lead-scream";
  }

  if (tempo >= 170) {
    return "surgical-djent";
  }

  return heavyTuning ? "obsidian-thall-rhythm" : "graphite-modern-polish";
}

function selectGrooveId(tempo: number, feel: SongwriterFeel, riffRole: RiffRole, sparseRiff: boolean): string {
  if (feel === "ambient") {
    return "ambient-build-wide";
  }

  if (riffRole === "breakdown" || feel === "breakdown") {
    return sparseRiff || tempo < 130 ? "thall-stop-start" : "thall-half-time";
  }

  if (tempo >= 170) {
    return "metalcore-drive";
  }

  if (riffRole === "bridge") {
    return "odd-lurch";
  }

  return "djent-pulse-160";
}

function selectAmbientEffectIds(feel: SongwriterFeel, riffRole: RiffRole, breakdown: boolean): string[] {
  if (feel === "ambient") {
    return ["reverse-swell", "shimmer-cloud", "wide-delay"];
  }

  if (breakdown) {
    return ["backwards-chug", "stutter-gate", "ringmod-scream"];
  }

  if (riffRole === "bridge") {
    return ["granular-freeze", "dark-pad"];
  }

  return ["reverse-swell"];
}

function selectWhammyPresetIds(riffRole: RiffRole, breakdown: boolean): string[] {
  if (breakdown) {
    return ["dive-bomb", "whammy-scream"];
  }

  if (riffRole === "chorus") {
    return ["pitch-scoop"];
  }

  return [];
}

function isLowTuning(tuning: string): boolean {
  const normalized = tuning.toLowerCase();
  return normalized.includes("drop e") || normalized.includes("drop f") || normalized.includes("drop g") || normalized.includes("drop a");
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
