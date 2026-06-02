import { describe, expect, it } from "vitest";
import { defaultForgePedals } from "./pedalboard";
import { createThallLabNativePreset, serializeThallLabNativePreset } from "./thallLabPreset";

describe("thall lab native preset", () => {
  it("creates a clamped preset for the JUCE audio engine", () => {
    const preset = createThallLabNativePreset({
      songName: "Drop Engine",
      artist: "Demo Artist",
      tuning: "Drop E",
      tempo: 500,
      sourceFileName: "riff.wav",
      cabIrFileName: "mesa-ir.wav",
      outputMode: "mono",
      grooveId: "thall-half-time",
      guitarTonePresetId: "glass-chug-click",
      transposeSemitones: 40,
      ampEnabled: true,
      ampDrive: 99,
      ampTone: 101,
      bassEnabled: true,
      bassRootMidi: 8,
      bassOctaveOffset: -9,
      bassDrive: 120,
      bassClick: 88,
      bassLevel: 70,
      bassHumanizeMs: 90,
      pedals: defaultForgePedals,
      whammyEvents: [],
      ambientEffects: [
        {
          id: "reverse-swell",
          type: "reverse-swell",
          enabled: true,
          mix: 42,
          size: 78,
          feedback: 38,
          note: "Reverse into the next hit."
        },
        {
          id: "ringmod-scream",
          type: "ringmod-scream",
          enabled: true,
          mix: 32,
          size: 46,
          feedback: 70,
          note: "Metallic scream layer."
        }
      ]
    });

    expect(preset.target).toBe("thall-lab-native-juce");
    expect(preset.song.tempo).toBe(300);
    expect(preset.audio.transposeSemitones).toBe(24);
    expect(preset.audio.outputMode).toBe("mono");
    expect(preset.transpose).toEqual({
      semitones: 24
    });
    expect(preset.octaveLayer).toEqual({
      semitones: -12,
      blend: 0
    });
    expect(preset.palmMute).toEqual({
      amount: 62,
      focusHz: 720
    });
    expect(preset.cab).toEqual({
      enabled: true,
      irEnabled: true,
      blend: 0,
      lowCutHz: 20,
      highCutHz: 20000,
      resonance: 28,
      level: 0
    });
    expect(preset.amp.presetId).toBe("glass-chug-click");
    expect(preset.amp.drive).toBe(12);
    expect(preset.bass.rootMidi).toBe(16);
    expect(preset.bass.octaveOffset).toBe(-2);
    expect(preset.bass.humanizeMs).toBe(35);
    expect(preset.clean.enabled).toBe(false);
    expect(preset.fx.enabled).toBe(true);
    expect(preset.fx.reverseEnabled).toBe(true);
    expect(preset.fx.ringEnabled).toBe(true);
    expect(preset.fx.mix).toBe(42);
    expect(preset.pedalboard.map((pedal) => pedal.id)).toContain("glass-boost");
    expect(serializeThallLabNativePreset(preset)).toContain('"cabIrFileName": "mesa-ir.wav"');
    expect(serializeThallLabNativePreset(preset)).toContain('"outputMode": "mono"');
  });
});
