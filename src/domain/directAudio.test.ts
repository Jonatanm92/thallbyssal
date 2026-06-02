import { describe, expect, it } from "vitest";
import { encodeWavPcm16, processDirectBackingAudio, transposeAudioBuffer } from "./directAudio";

describe("direct audio rendering", () => {
  it("reduces center material by rendering the stereo side signal", () => {
    const rendered = processDirectBackingAudio(
      {
        sampleRate: 44100,
        channels: [new Float32Array([0.5, 0.25]), new Float32Array([0.5, -0.25])]
      },
      { reduceCenter: true }
    );

    expect(Array.from(rendered.channels[0])).toEqual([0, 0.25]);
    expect(Array.from(rendered.channels[1])).toEqual([0, 0.25]);
  });

  it("encodes a valid wav file", () => {
    const wav = encodeWavPcm16({
      sampleRate: 44100,
      channels: [new Float32Array([0, 0.5]), new Float32Array([0, -0.5])]
    });

    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe("RIFF");
    expect(new TextDecoder().decode(wav.slice(8, 12))).toBe("WAVE");
    expect(new TextDecoder().decode(wav.slice(36, 40))).toBe("data");
    expect(wav.length).toBe(52);
  });

  it("transposes audio by resampling", () => {
    const upOctave = transposeAudioBuffer(
      {
        sampleRate: 44100,
        channels: [new Float32Array([0, 0.25, 0.5, 0.75])]
      },
      12
    );
    const downOctave = transposeAudioBuffer(
      {
        sampleRate: 44100,
        channels: [new Float32Array([0, 0.25, 0.5, 0.75])]
      },
      -12
    );

    expect(upOctave.channels[0].length).toBe(2);
    expect(downOctave.channels[0].length).toBe(8);
  });
});
