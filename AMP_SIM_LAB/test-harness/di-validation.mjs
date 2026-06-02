export const requiredDiSlots = {
  low_tuned_chugs: {
    label: "Low-tuned chugs",
    canonicalFileName: "low_tuned_chugs.wav",
    aliases: [/low.*tuned/i, /chugs/i],
    role: "performance"
  },
  dynamic_pick_attack: {
    label: "Dynamic pick attack",
    canonicalFileName: "dynamic_pick_attack.wav",
    aliases: [/pick.*attack/i, /dynamic.*attack/i],
    role: "performance"
  },
  noise_floor_test: {
    label: "Noise floor test",
    canonicalFileName: "noise_floor_test.wav",
    aliases: [/noise/i, /floor/i],
    role: "noise"
  }
};

function basenameWithoutExtension(fileName) {
  return String(fileName).replace(/\.[^.]+$/, "");
}

function canonicalize(fileName) {
  return basenameWithoutExtension(fileName).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function formatDb(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} dBFS` : "-inf dBFS";
}

function slotForFile(fileName) {
  const canonical = canonicalize(fileName);

  for (const [slotId, slot] of Object.entries(requiredDiSlots)) {
    if (canonical === basenameWithoutExtension(slot.canonicalFileName)) {
      return slotId;
    }

    if (slot.aliases.some((alias) => alias.test(fileName))) {
      return slotId;
    }
  }

  return null;
}

function validateCommonMetrics(file, messages) {
  const errors = [];
  const warnings = [];
  const metrics = file.metrics;

  if (!file.ok || !metrics) {
    errors.push(file.error || "WAV analysis failed.");
    return { errors, warnings };
  }

  if (metrics.durationSeconds < 5) {
    errors.push("DI file is too short. Use at least 5 seconds for repeatable testing.");
  }

  if (metrics.sampleRate < 44100) {
    errors.push("Sample rate must be at least 44.1 kHz.");
  }

  if (metrics.bitsPerSample < 24) {
    warnings.push("24-bit or 32-bit WAV is preferred for DI reference files.");
  }

  if (metrics.channels > 2) {
    warnings.push("Mono or stereo DI is preferred; more than two channels will not add value here.");
  }

  if (metrics.audioFormat !== "PCM" && metrics.audioFormat !== "IEEE_FLOAT") {
    warnings.push(`Unexpected WAV format: ${metrics.audioFormat}. PCM or IEEE float is preferred.`);
  }

  if (metrics.channels === 2) {
    warnings.push("Stereo DI is accepted, but mono dry DI is easier to compare across tests.");
  }

  messages.push(
    `Peak ${formatDb(metrics.peakDbfs)}, RMS ${formatDb(metrics.rmsDbfs)}, ${metrics.sampleRate} Hz, ${metrics.channels} channel(s).`
  );

  return { errors, warnings };
}

function validatePerformanceFile(file, messages) {
  const errors = [];
  const warnings = [];
  const metrics = file.metrics;

  if (!metrics) {
    return { errors, warnings };
  }

  if (metrics.clippedSamples > 0 || metrics.peakDbfs >= -0.5) {
    errors.push(`File is clipped or too close to 0 dBFS (${metrics.clippedSamples} clipped sample(s)).`);
  } else if (metrics.peakDbfs > -3) {
    warnings.push("Peak is hotter than preferred. Aim for roughly -12 to -6 dBFS on hard hits.");
  } else if (metrics.peakDbfs < -18) {
    warnings.push("Peak is quiet. More input gain may improve signal-to-noise if it still avoids clipping.");
  }

  if (metrics.rmsDbfs > -16) {
    warnings.push("RMS is unusually hot for a dry DI. Check that no processing or normalization was printed.");
  }

  messages.push("Performance DI target: no clipping, hard hits usually peaking around -12 to -6 dBFS.");

  return { errors, warnings };
}

function validateNoiseFile(file, messages) {
  const errors = [];
  const warnings = [];
  const metrics = file.metrics;

  if (!metrics) {
    return { errors, warnings };
  }

  if (metrics.clippedSamples > 0) {
    errors.push(`Noise file should never clip (${metrics.clippedSamples} clipped sample(s)).`);
  }

  if (metrics.peakDbfs > -50) {
    errors.push(`Noise peak is high at ${formatDb(metrics.peakDbfs)}. Check cable, input gain, and grounding.`);
  } else if (metrics.peakDbfs > -60) {
    warnings.push("Noise peak is usable but could be cleaner.");
  }

  if (metrics.rmsDbfs > -70) {
    errors.push(`Noise RMS is high at ${formatDb(metrics.rmsDbfs)}. Gate testing will be less reliable.`);
  }

  messages.push("Noise target: guitar plugged in and silent, volume up, no amp sim or gate printed.");

  return { errors, warnings };
}

export function validateDiMetricsReport(metricsReport) {
  const files = Array.isArray(metricsReport?.files) ? metricsReport.files : [];
  const slots = Object.fromEntries(
    Object.entries(requiredDiSlots).map(([slotId, slot]) => [
      slotId,
      {
        slotId,
        label: slot.label,
        canonicalFileName: slot.canonicalFileName,
        matchedFileName: null,
        status: "missing",
        errors: [`Missing required starter DI file: ${slot.canonicalFileName}`],
        warnings: [],
        messages: []
      }
    ])
  );
  const extraFiles = [];

  for (const file of files) {
    const slotId = slotForFile(file.fileName);

    if (!slotId) {
      extraFiles.push({
        fileName: file.fileName,
        status: file.ok ? "ignored" : "error",
        messages: file.ok ? ["File does not match a starter DI slot."] : [file.error || "WAV analysis failed."]
      });
      continue;
    }

    const slot = requiredDiSlots[slotId];
    const current = slots[slotId];

    if (current.matchedFileName !== null) {
      extraFiles.push({
        fileName: file.fileName,
        status: "ignored",
        messages: [`Duplicate match for ${slot.label}; using ${current.matchedFileName}.`]
      });
      continue;
    }

    const messages = [];
    const common = validateCommonMetrics(file, messages);
    const role = slot.role === "noise" ? validateNoiseFile(file, messages) : validatePerformanceFile(file, messages);
    const errors = [...common.errors, ...role.errors];
    const warnings = [...common.warnings, ...role.warnings];
    const canonicalName = canonicalize(file.fileName) === basenameWithoutExtension(slot.canonicalFileName);

    if (!canonicalName) {
      warnings.push(`Recommended filename: ${slot.canonicalFileName}`);
    }

    slots[slotId] = {
      slotId,
      label: slot.label,
      canonicalFileName: slot.canonicalFileName,
      matchedFileName: file.fileName,
      status: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings,
      messages,
      metrics: file.metrics ?? null
    };
  }

  const slotEntries = Object.values(slots);
  const errors = slotEntries.reduce((total, slot) => total + slot.errors.length, 0);
  const warnings =
    slotEntries.reduce((total, slot) => total + slot.warnings.length, 0) +
    extraFiles.filter((file) => file.status !== "ignored").length;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    inputDir: metricsReport?.inputDir ?? null,
    requiredSlots: slots,
    extraFiles,
    summary: {
      requiredSlots: slotEntries.length,
      matchedSlots: slotEntries.filter((slot) => slot.matchedFileName).length,
      passedSlots: slotEntries.filter((slot) => slot.status === "pass").length,
      errors,
      warnings,
      starterReady: errors === 0 && slotEntries.every((slot) => slot.status === "pass")
    }
  };
}
