function db(value) {
  return Number.isFinite(value) ? value : null;
}

function round(value, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function isNoiseFileName(fileName) {
  return /noise|floor/i.test(String(fileName));
}

function estimateNoiseFloorDbfs(metrics, fileName = "") {
  if (isNoiseFileName(fileName) && Number.isFinite(metrics?.rmsDbfs)) {
    return metrics.rmsDbfs;
  }

  if (Number.isFinite(metrics?.noiseFloorDbfs)) {
    return metrics.noiseFloorDbfs;
  }

  return null;
}

function estimateTransientDb(metrics) {
  if (Number.isFinite(metrics?.transientPeakToRmsDb)) {
    return metrics.transientPeakToRmsDb;
  }

  if (Number.isFinite(metrics?.peakDbfs) && Number.isFinite(metrics?.rmsDbfs)) {
    return metrics.peakDbfs - metrics.rmsDbfs;
  }

  return null;
}

function clippingStatus(metrics) {
  return (metrics?.clippedSamples ?? 0) > 0 || (metrics?.clippingPercent ?? 0) > 0 ? "yes" : "no";
}

function classify(metrics, noiseFloorDbfs, isDedicatedNoiseFile = false) {
  if (!metrics || !Number.isFinite(metrics.peakDbfs) || !Number.isFinite(metrics.rmsDbfs)) {
    return "unknown";
  }

  if (clippingStatus(metrics) === "yes" || metrics.peakDbfs >= -0.5) {
    return "clipped";
  }

  if (noiseFloorDbfs !== null && noiseFloorDbfs > -60) {
    return "noisy";
  }

  if (isDedicatedNoiseFile) {
    return "healthy";
  }

  if (metrics.peakDbfs > -3 || metrics.rmsDbfs > -16) {
    return "too hot";
  }

  if (metrics.peakDbfs < -18 || metrics.rmsDbfs < -36) {
    return "too weak";
  }

  return "healthy";
}

function suggestedGainRange(classification) {
  if (classification === "clipped") {
    return [-12, -6];
  }

  if (classification === "too hot") {
    return [-6, -3];
  }

  if (classification === "too weak") {
    return [6, 12];
  }

  if (classification === "noisy") {
    return [-2, 2];
  }

  if (classification === "healthy") {
    return [-1, 1];
  }

  return null;
}

function suggestedGate(noiseFloorDbfs, transientDb, classification) {
  if (noiseFloorDbfs !== null) {
    const threshold = Math.min(-45, Math.max(-80, noiseFloorDbfs + 12));
    return `${threshold.toFixed(0)} dBFS threshold, fast attack, medium release; adjust by ear.`;
  }

  if (classification === "too weak") {
    return "-74 dBFS threshold starting point; raise only after input gain is corrected.";
  }

  if (classification === "too hot" || classification === "clipped") {
    return "-64 dBFS threshold starting point after lowering interface/input gain.";
  }

  if (Number.isFinite(transientDb) && transientDb > 24) {
    return "-68 dBFS threshold starting point; verify pick attacks are not chopped.";
  }

  return "-70 dBFS threshold starting point; adjust by founder listening notes.";
}

function warningFor(classification) {
  if (classification === "clipped") {
    return "Clipping detected or peak is too close to 0 dBFS. Re-record or lower the interface input before judging tone.";
  }

  if (classification === "too hot") {
    return "Input is hot. Lower input gain before judging harshness, gate feel, or low-end tightness.";
  }

  if (classification === "too weak") {
    return "Input is weak. Raise source/interface gain if possible while keeping hard hits safely below clipping.";
  }

  if (classification === "noisy") {
    return "Noise floor is high. Check cable, grounding, pickup noise, and interface gain before tuning gate behavior.";
  }

  if (classification === "unknown") {
    return "Input could not be classified from available metrics.";
  }

  return "No input-level warning.";
}

export function formatDb(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} dBFS` : "unknown";
}

export function formatGainRange(range) {
  if (!Array.isArray(range)) {
    return "unknown";
  }

  const [min, max] = range;
  const signed = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
  return `${signed(min)} to ${signed(max)} dB`;
}

export function classifyInputMatchMetrics(metrics, options = {}) {
  const dedicatedNoiseFile = isNoiseFileName(options.fileName);
  const noiseFloorDbfs = estimateNoiseFloorDbfs(metrics, options.fileName);
  const transientPeakToRmsDb = estimateTransientDb(metrics);
  const classification = classify(metrics, noiseFloorDbfs, dedicatedNoiseFile);
  const gainRange = suggestedGainRange(classification);

  return {
    peakDbfs: db(metrics?.peakDbfs),
    rmsDbfs: db(metrics?.rmsDbfs),
    lufsEstimate: db(metrics?.lufsEstimate),
    clipping: clippingStatus(metrics),
    clippedSamples: metrics?.clippedSamples ?? 0,
    clippingPercent: round(metrics?.clippingPercent ?? 0, 4),
    nearClippingSamples: metrics?.nearClippingSamples ?? null,
    noiseFloorDbfs: db(noiseFloorDbfs),
    transientPickAttackDb: db(transientPeakToRmsDb),
    classification,
    suggestedInputGainDbRange: gainRange,
    suggestedGateStartingPoint: suggestedGate(noiseFloorDbfs, transientPeakToRmsDb, classification),
    warningText: warningFor(classification)
  };
}

function inputMatchFile(file) {
  if (!file.ok || !file.metrics) {
    return {
      fileName: file.fileName,
      filePath: file.metrics?.filePath ?? file.filePath ?? null,
      ok: false,
      classification: "unknown",
      error: file.error || "WAV analysis failed.",
      founderListeningNotes: "(founder listening notes placeholder)",
      warningText: "Input could not be classified from available metrics."
    };
  }

  const match = classifyInputMatchMetrics(file.metrics, { fileName: file.fileName });

  return {
    fileName: file.fileName,
    filePath: file.metrics.filePath ?? null,
    ok: true,
    sampleRate: file.metrics.sampleRate,
    channels: file.metrics.channels,
    bitsPerSample: file.metrics.bitsPerSample,
    durationSeconds: round(file.metrics.durationSeconds),
    ...match,
    founderListeningNotes: "(founder listening notes placeholder)"
  };
}

export function createInputMatchReport(metricsReport) {
  const files = (Array.isArray(metricsReport?.files) ? metricsReport.files : []).map(inputMatchFile);
  const classifications = {
    "too weak": 0,
    healthy: 0,
    "too hot": 0,
    clipped: 0,
    noisy: 0,
    unknown: 0
  };

  for (const file of files) {
    classifications[file.classification] = (classifications[file.classification] ?? 0) + 1;
  }

  return {
    schemaVersion: 1,
    generatedAt: metricsReport?.generatedAt ?? new Date().toISOString(),
    inputDir: metricsReport?.inputDir ?? null,
    reportOnly: true,
    safety: {
      pluginUiImplemented: false,
      dspCoreTouched: false,
      toneBehaviorTouched: false,
      diFilesModified: false,
      presetToneValuesChanged: false,
      automaticInputGainApplied: false,
      automaticGateBehaviorChanged: false
    },
    summary: {
      filesFound: files.length,
      filesAnalyzed: files.filter((file) => file.ok).length,
      classifications,
      problematicFiles: files.filter((file) => file.classification !== "healthy").length
    },
    files
  };
}

function className(classification) {
  if (classification === "healthy") {
    return "ok";
  }

  if (classification === "unknown") {
    return "warn";
  }

  return "bad";
}

export function createInputMatchHtml(report) {
  const rows = report.files
    .map((file) => `<tr>
  <td>${file.fileName}</td>
  <td>${file.ok ? "yes" : "no"}</td>
  <td class="${className(file.classification)}">${file.classification}</td>
  <td>${formatDb(file.peakDbfs)}</td>
  <td>${formatDb(file.rmsDbfs)}</td>
  <td>${formatDb(file.lufsEstimate)}</td>
  <td>${file.clipping ?? "unknown"}</td>
  <td>${formatDb(file.noiseFloorDbfs)}</td>
  <td>${Number.isFinite(file.transientPickAttackDb) ? `${file.transientPickAttackDb.toFixed(2)} dB` : "unknown"}</td>
  <td>${formatGainRange(file.suggestedInputGainDbRange)}</td>
  <td>${file.suggestedGateStartingPoint ?? "unknown"}</td>
  <td>${file.warningText ?? ""}</td>
  <td>${file.founderListeningNotes}</td>
</tr>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP_SIM_LAB Input Match</title>
  <style>
    body { background: #101216; color: #e5edf5; font-family: Arial, sans-serif; margin: 32px; max-width: 1280px; }
    p { color: #aab7c4; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #1f2937; }
    .ok { color: #86efac; }
    .warn { color: #fde68a; }
    .bad { color: #fca5a5; }
  </style>
</head>
<body>
  <h1>AMP_SIM_LAB Input Match / DI Calibration</h1>
  <p>Generated: ${report.generatedAt}</p>
  <p>Report-only offline lab prototype. It does not modify DI files, presets, DSP/core sound, input gain, or gate behavior.</p>
  <p>Input folder: ${report.inputDir ?? "(unknown)"}</p>
  <table>
    <thead>
      <tr>
        <th>DI File</th>
        <th>Analyzed</th>
        <th>Classification</th>
        <th>Peak</th>
        <th>RMS</th>
        <th>LUFS Est.</th>
        <th>Clipping</th>
        <th>Noise Floor</th>
        <th>Pick Attack</th>
        <th>Input Gain Range</th>
        <th>Gate Start</th>
        <th>Warning</th>
        <th>Founder Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="13">No DI WAV files found.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}
