import { describe, expect, it } from "vitest";
import { defaultForgePedals, normalizeForgePedals } from "./pedalboard";

describe("forge pedalboard", () => {
  it("contains the core pedal types for the songwriting rig", () => {
    expect(defaultForgePedals.map((pedal) => pedal.type)).toEqual([
      "gate",
      "boost",
      "pitch",
      "ringmod",
      "stutter",
      "reverse",
      "shimmer-delay"
    ]);
  });

  it("normalizes control ranges", () => {
    const [pedal] = normalizeForgePedals([{ ...defaultForgePedals[0], amount: 150, tone: -20, mix: 42.4 }]);

    expect(pedal.amount).toBe(100);
    expect(pedal.tone).toBe(0);
    expect(pedal.mix).toBe(42);
  });
});

