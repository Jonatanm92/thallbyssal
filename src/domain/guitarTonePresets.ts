export interface GuitarTonePreset {
  id: string;
  name: string;
  category: "rhythm" | "lead" | "ambient" | "bass-locked";
  description: string;
  ampDrive: number;
  ampTone: number;
  bassDrive: number;
  bassClick: number;
  bassLevel: number;
}

export const guitarTonePresets: GuitarTonePreset[] = [
  {
    id: "obsidian-thall-rhythm",
    name: "Obsidian Thall Rhythm",
    category: "rhythm",
    description: "Tight low-tuned rhythm with hard pick definition and controlled fizz.",
    ampDrive: 8,
    ampTone: 58,
    bassDrive: 74,
    bassClick: 88,
    bassLevel: 72
  },
  {
    id: "graphite-modern-polish",
    name: "Graphite Modern Polish",
    category: "rhythm",
    description: "Smooth modern amp polish with a sharper front edge for mix-ready covers.",
    ampDrive: 7,
    ampTone: 66,
    bassDrive: 68,
    bassClick: 76,
    bassLevel: 66
  },
  {
    id: "glass-chug-click",
    name: "Glass Chug Click",
    category: "bass-locked",
    description: "Very clicky low-string attack for staccato chugs and backwards-pick effects.",
    ampDrive: 9,
    ampTone: 72,
    bassDrive: 82,
    bassClick: 96,
    bassLevel: 76
  },
  {
    id: "black-hole-breakdown",
    name: "Black Hole Breakdown",
    category: "rhythm",
    description: "Darker breakdown tone with thick low-mid body and less top-end glare.",
    ampDrive: 10,
    ampTone: 43,
    bassDrive: 86,
    bassClick: 72,
    bassLevel: 82
  },
  {
    id: "surgical-djent",
    name: "Surgical Djent",
    category: "rhythm",
    description: "Dry, surgical, palm-mute-forward tone for precise syncopated riffs.",
    ampDrive: 6,
    ampTone: 62,
    bassDrive: 70,
    bassClick: 84,
    bassLevel: 68
  },
  {
    id: "liquid-lead-scream",
    name: "Liquid Lead Scream",
    category: "lead",
    description: "More singing upper range for whammy screams, pitch scoops, and harmonics.",
    ampDrive: 8,
    ampTone: 80,
    bassDrive: 52,
    bassClick: 50,
    bassLevel: 42
  },
  {
    id: "void-ambient-edge",
    name: "Void Ambient Edge",
    category: "ambient",
    description: "Cleaner edge for reverse swells, shimmer clouds, and wide texture layers.",
    ampDrive: 4,
    ampTone: 70,
    bassDrive: 38,
    bassClick: 36,
    bassLevel: 36
  }
];

export function getGuitarTonePreset(id: string): GuitarTonePreset {
  return guitarTonePresets.find((preset) => preset.id === id) ?? guitarTonePresets[0];
}

