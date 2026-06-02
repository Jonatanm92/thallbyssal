import { AmbientGuitarEffect, WhammyAutomationEvent } from "./songwriter";
import { ForgePedal, normalizeForgePedals } from "./pedalboard";

export type ThallLabOutputMode = "mono" | "stereo";

export interface ThallLabPresetInput {
  songName: string;
  artist: string;
  tuning: string;
  tempo: number;
  sourceFileName: string;
  cabIrFileName: string;
  outputMode?: ThallLabOutputMode;
  grooveId: string;
  guitarTonePresetId: string;
  transposeSemitones: number;
  ampEnabled: boolean;
  ampDrive: number;
  ampTone: number;
  bassEnabled: boolean;
  bassRootMidi: number;
  bassOctaveOffset: number;
  bassDrive: number;
  bassClick: number;
  bassLevel: number;
  bassHumanizeMs: number;
  pedals: ForgePedal[];
  whammyEvents: WhammyAutomationEvent[];
  ambientEffects: AmbientGuitarEffect[];
}

export interface ThallLabNativePreset {
  schemaVersion: 1;
  app: "guitar-workflow-toolkit";
  target: "thall-lab-native-juce";
  song: {
    name: string;
    artist: string;
    tuning: string;
    tempo: number;
    sourceFileName: string;
  };
  audio: {
    cabIrFileName: string;
    transposeSemitones: number;
    outputMode: ThallLabOutputMode;
  };
  transpose: {
    semitones: number;
  };
  octaveLayer: {
    semitones: -12;
    blend: number;
  };
  palmMute: {
    amount: number;
    focusHz: number;
  };
  cab: {
    enabled: boolean;
    irEnabled: boolean;
    blend: number;
    lowCutHz: number;
    highCutHz: number;
    resonance: number;
    level: number;
  };
  amp: {
    presetId: string;
    enabled: boolean;
    drive: number;
    tone: number;
    outputDb: number;
  };
  clean: {
    enabled: boolean;
    mix: number;
    space: number;
    bass: number;
    mid: number;
    treble: number;
    presence: number;
    tone: number;
    level: number;
  };
  fx: {
    enabled: boolean;
    mix: number;
    size: number;
    feedback: number;
    grain: number;
    pitch: number;
    tone: number;
    shimmer: number;
    reverse: number;
    stutter: number;
    ring: number;
    shimmerEnabled: boolean;
    reverseEnabled: boolean;
    stutterEnabled: boolean;
    ringEnabled: boolean;
  };
  bass: {
    enabled: boolean;
    rootMidi: number;
    octaveOffset: number;
    drive: number;
    click: number;
    level: number;
    humanizeMs: number;
  };
  pedalboard: ForgePedal[];
  groove: {
    id: string;
  };
  pitchAutomation: WhammyAutomationEvent[];
  ambientEffects: AmbientGuitarEffect[];
}

export function createThallLabNativePreset(input: ThallLabPresetInput): ThallLabNativePreset {
  const fx = createNativeFxSettings(input.ambientEffects);
  const transposeSemitones = clampRange(Math.round(input.transposeSemitones), -24, 24);
  const outputMode = input.outputMode === "mono" ? "mono" : "stereo";

  return {
    schemaVersion: 1,
    app: "guitar-workflow-toolkit",
    target: "thall-lab-native-juce",
    song: {
      name: input.songName.trim() || "Untitled Guitar Idea",
      artist: input.artist.trim() || "Unknown Artist",
      tuning: input.tuning.trim() || "E Standard",
      tempo: clampRange(Math.round(input.tempo), 20, 300),
      sourceFileName: input.sourceFileName.trim()
    },
    audio: {
      cabIrFileName: input.cabIrFileName.trim(),
      transposeSemitones,
      outputMode
    },
    transpose: {
      semitones: transposeSemitones
    },
    octaveLayer: {
      semitones: -12,
      blend: 0
    },
    palmMute: {
      amount: 62,
      focusHz: 720
    },
    cab: {
      enabled: true,
      irEnabled: true,
      blend: 0,
      lowCutHz: 20,
      highCutHz: 20000,
      resonance: 28,
      level: 0
    },
    amp: {
      presetId: input.guitarTonePresetId.trim() || "obsidian-thall-rhythm",
      enabled: input.ampEnabled,
      drive: clampRange(Math.round(input.ampDrive), 1, 12),
      tone: clampRange(Math.round(input.ampTone), 0, 100),
      outputDb: 0
    },
    clean: {
      enabled: false,
      mix: 0,
      space: 58,
      bass: 48,
      mid: 44,
      treble: 62,
      presence: 58,
      tone: 58,
      level: 0
    },
    fx,
    bass: {
      enabled: input.bassEnabled,
      rootMidi: clampRange(Math.round(input.bassRootMidi), 16, 52),
      octaveOffset: clampRange(Math.round(input.bassOctaveOffset), -2, 1),
      drive: clampRange(Math.round(input.bassDrive), 0, 100),
      click: clampRange(Math.round(input.bassClick), 0, 100),
      level: clampRange(Math.round(input.bassLevel), 0, 100),
      humanizeMs: clampRange(Math.round(input.bassHumanizeMs), 0, 35)
    },
    pedalboard: normalizeForgePedals(input.pedals),
    groove: {
      id: input.grooveId.trim() || "thall-half-time"
    },
    pitchAutomation: input.whammyEvents,
    ambientEffects: input.ambientEffects
  };
}

export function serializeThallLabNativePreset(preset: ThallLabNativePreset): string {
  return JSON.stringify(preset, null, 2);
}

function clampRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function createNativeFxSettings(effects: AmbientGuitarEffect[]): ThallLabNativePreset["fx"] {
  const enabledEffects = effects.filter((effect) => effect.enabled);
  const has = (type: AmbientGuitarEffect["type"]) => enabledEffects.some((effect) => effect.type === type);
  const maxByType = (types: AmbientGuitarEffect["type"][], key: "mix" | "size" | "feedback") =>
    clampRange(
      Math.round(
        enabledEffects
          .filter((effect) => types.includes(effect.type))
          .reduce((max, effect) => Math.max(max, effect[key]), 0)
      ),
      0,
      100
    );
  const maxAll = (key: "mix" | "size" | "feedback", fallback: number) =>
    enabledEffects.length === 0
      ? fallback
      : clampRange(Math.round(enabledEffects.reduce((max, effect) => Math.max(max, effect[key]), 0)), 0, 100);

  const shimmer = maxByType(["shimmer-cloud", "granular-freeze"], "mix");
  const reverse = maxByType(["reverse-swell", "backwards-chug"], "mix");
  const stutter = maxByType(["stutter-gate", "mb-trick", "backwards-chug"], "mix");
  const ring = maxByType(["ringmod-scream"], "feedback");
  const grain = Math.max(maxByType(["granular-freeze", "mb-trick"], "feedback"), maxAll("feedback", 38) - 18);
  const darkPad = has("dark-pad");

  return {
    enabled: enabledEffects.length > 0,
    mix: maxAll("mix", 0),
    size: maxAll("size", 58),
    feedback: maxAll("feedback", 34),
    grain: clampRange(grain, 0, 100),
    pitch: has("shimmer-cloud") ? 7 : darkPad ? -5 : 0,
    tone: darkPad ? 34 : 64,
    shimmer,
    reverse,
    stutter,
    ring,
    shimmerEnabled: shimmer > 0,
    reverseEnabled: reverse > 0,
    stutterEnabled: stutter > 0,
    ringEnabled: ring > 0
  };
}
