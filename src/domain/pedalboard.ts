export type ForgePedalType = "gate" | "boost" | "pitch" | "ringmod" | "stutter" | "reverse" | "shimmer-delay";

export interface ForgePedal {
  id: string;
  type: ForgePedalType;
  name: string;
  enabled: boolean;
  amount: number;
  tone: number;
  mix: number;
  note: string;
}

export const defaultForgePedals: ForgePedal[] = [
  {
    id: "precision-gate",
    type: "gate",
    name: "Precision Gate",
    enabled: true,
    amount: 62,
    tone: 50,
    mix: 100,
    note: "Tightens stops and keeps low-tuned chugs clean."
  },
  {
    id: "glass-boost",
    type: "boost",
    name: "Glass Boost",
    enabled: true,
    amount: 58,
    tone: 72,
    mix: 100,
    note: "Pushes pick attack into the amp without getting too fuzzy."
  },
  {
    id: "drop-shifter",
    type: "pitch",
    name: "Drop Shifter",
    enabled: false,
    amount: 0,
    tone: 50,
    mix: 100,
    note: "Pitch pedal lane for transpose, whammy screams, and dive automation."
  },
  {
    id: "metal-scream",
    type: "ringmod",
    name: "Metal Scream",
    enabled: false,
    amount: 42,
    tone: 78,
    mix: 35,
    note: "Ringmod-style metallic accent for pre-drop screams."
  },
  {
    id: "fracture-stutter",
    type: "stutter",
    name: "Fracture Stutter",
    enabled: false,
    amount: 50,
    tone: 60,
    mix: 45,
    note: "Rhythmic chop for digital stops and syncopated glitches."
  },
  {
    id: "backpull-reverse",
    type: "reverse",
    name: "Backpull Reverse",
    enabled: false,
    amount: 64,
    tone: 58,
    mix: 40,
    note: "Reverse-pick swell into chugs and section hits."
  },
  {
    id: "halo-delay",
    type: "shimmer-delay",
    name: "Halo Delay",
    enabled: false,
    amount: 55,
    tone: 82,
    mix: 32,
    note: "Wide delay/shimmer layer for ambient transitions."
  }
];

export function normalizeForgePedals(pedals: ForgePedal[]): ForgePedal[] {
  return pedals.map((pedal) => ({
    ...pedal,
    amount: clampPercent(pedal.amount),
    tone: clampPercent(pedal.tone),
    mix: clampPercent(pedal.mix),
    name: pedal.name.trim() || pedal.id,
    note: pedal.note.trim()
  }));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 100);
}

