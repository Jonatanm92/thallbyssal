import fs from "node:fs";

function readAscii(buffer, offset, length) {
  return buffer.toString("ascii", offset, offset + length);
}

function readSample(buffer, offset, bytesPerSample, audioFormat) {
  if (audioFormat === 3 && bytesPerSample === 4) {
    return buffer.readFloatLE(offset);
  }

  if (audioFormat !== 1) {
    throw new Error(`Unsupported WAV audio format: ${audioFormat}`);
  }

  if (bytesPerSample === 1) {
    return (buffer.readUInt8(offset) - 128) / 128;
  }

  if (bytesPerSample === 2) {
    return buffer.readInt16LE(offset) / 32768;
  }

  if (bytesPerSample === 3) {
    const unsigned = buffer.readUIntLE(offset, 3);
    const signed = unsigned & 0x800000 ? unsigned - 0x1000000 : unsigned;
    return signed / 8388608;
  }

  if (bytesPerSample === 4) {
    return buffer.readInt32LE(offset) / 2147483648;
  }

  throw new Error(`Unsupported PCM sample width: ${bytesPerSample} bytes`);
}

function dbfs(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return -Infinity;
  }

  return 20 * Math.log10(value);
}

export function analyzeWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE") {
    throw new Error("Not a RIFF/WAVE file");
  }

  let cursor = 12;
  let format = null;
  let dataOffset = -1;
  let dataSize = 0;

  while (cursor + 8 <= buffer.length) {
    const chunkId = readAscii(buffer, cursor, 4);
    const chunkSize = buffer.readUInt32LE(cursor + 4);
    const chunkDataOffset = cursor + 8;

    if (chunkId === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(chunkDataOffset),
        channels: buffer.readUInt16LE(chunkDataOffset + 2),
        sampleRate: buffer.readUInt32LE(chunkDataOffset + 4),
        byteRate: buffer.readUInt32LE(chunkDataOffset + 8),
        blockAlign: buffer.readUInt16LE(chunkDataOffset + 12),
        bitsPerSample: buffer.readUInt16LE(chunkDataOffset + 14)
      };
    }

    if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
    }

    cursor = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (format === null) {
    throw new Error("Missing WAV fmt chunk");
  }

  if (dataOffset < 0 || dataSize <= 0) {
    throw new Error("Missing WAV data chunk");
  }

  const bytesPerSample = format.bitsPerSample / 8;
  const frameCount = Math.floor(dataSize / format.blockAlign);
  const sampleCount = frameCount * format.channels;
  let peak = 0;
  let sumSquares = 0;
  let clippedSamples = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const frameOffset = dataOffset + frame * format.blockAlign;

    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = frameOffset + channel * bytesPerSample;
      const sample = readSample(buffer, sampleOffset, bytesPerSample, format.audioFormat);
      const absolute = Math.abs(sample);

      peak = Math.max(peak, absolute);
      sumSquares += sample * sample;

      if (absolute >= 0.999) {
        clippedSamples += 1;
      }
    }
  }

  const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;

  return {
    filePath,
    sampleRate: format.sampleRate,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
    audioFormat: format.audioFormat === 1 ? "PCM" : format.audioFormat === 3 ? "IEEE_FLOAT" : `UNKNOWN_${format.audioFormat}`,
    durationSeconds: frameCount / format.sampleRate,
    peak,
    peakDbfs: dbfs(peak),
    rms,
    rmsDbfs: dbfs(rms),
    clippedSamples,
    lufsEstimate: Number.isFinite(dbfs(rms)) ? dbfs(rms) - 0.691 : -Infinity
  };
}

export function safeAnalyzeWavFile(filePath) {
  try {
    return {
      ok: true,
      metrics: analyzeWavFile(filePath)
    };
  } catch (error) {
    return {
      ok: false,
      filePath,
      error: error instanceof Error ? error.message : "Unknown WAV analysis error"
    };
  }
}

