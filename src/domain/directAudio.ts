export interface DirectAudioBuffer {
  sampleRate: number;
  channels: Float32Array[];
}

export function processDirectBackingAudio(
  input: DirectAudioBuffer,
  options: { reduceCenter: boolean; gain?: number }
): DirectAudioBuffer {
  const gain = Number.isFinite(options.gain) ? options.gain ?? 1 : 1;

  if (!options.reduceCenter || input.channels.length < 2) {
    return {
      sampleRate: input.sampleRate,
      channels: input.channels.map((channel) => applyGain(channel, gain))
    };
  }

  const left = input.channels[0];
  const right = input.channels[1];
  const length = Math.min(left.length, right.length);
  const side = new Float32Array(length);

  for (let index = 0; index < length; index += 1) {
    side[index] = ((left[index] - right[index]) / 2) * gain;
  }

  return {
    sampleRate: input.sampleRate,
    channels: [side, new Float32Array(side)]
  };
}

export function transposeAudioBuffer(input: DirectAudioBuffer, semitones: number): DirectAudioBuffer {
  const clampedSemitones = Math.max(-24, Math.min(24, Math.round(semitones)));

  if (clampedSemitones === 0) {
    return {
      sampleRate: input.sampleRate,
      channels: input.channels.map((channel) => new Float32Array(channel))
    };
  }

  const factor = 2 ** (clampedSemitones / 12);

  return {
    sampleRate: input.sampleRate,
    channels: input.channels.map((channel) => resampleChannel(channel, factor))
  };
}

export function encodeWavPcm16(buffer: DirectAudioBuffer): Uint8Array {
  const channelCount = Math.max(1, Math.min(buffer.channels.length, 2));
  const frameCount = Math.max(...buffer.channels.slice(0, channelCount).map((channel) => channel.length));
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);

  writeAscii(bytes, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(bytes, 8, "WAVE");
  writeAscii(bytes, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, Math.max(1, Math.round(buffer.sampleRate)), true);
  view.setUint32(28, Math.max(1, Math.round(buffer.sampleRate)) * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(bytes, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;

  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const channel = buffer.channels[channelIndex] ?? buffer.channels[0];
      const sample = clampSample(channel[frame] ?? 0);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return bytes;
}

function applyGain(channel: Float32Array, gain: number): Float32Array {
  const output = new Float32Array(channel.length);

  for (let index = 0; index < channel.length; index += 1) {
    output[index] = clampSample(channel[index] * gain);
  }

  return output;
}

function resampleChannel(channel: Float32Array, factor: number): Float32Array {
  const outputLength = Math.max(1, Math.floor(channel.length / factor));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * factor;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(leftIndex + 1, channel.length - 1);
    const blend = sourceIndex - leftIndex;
    output[index] = channel[leftIndex] * (1 - blend) + channel[rightIndex] * blend;
  }

  return output;
}

function clampSample(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-1, Math.min(1, value));
}

function writeAscii(bytes: Uint8Array, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index) & 0x7f;
  }
}
