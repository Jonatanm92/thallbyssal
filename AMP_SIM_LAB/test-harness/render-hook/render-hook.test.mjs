import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as baselineReports from "./baseline.mjs";
import { createRenderPlan, detectSafeRenderPath, isInsideDirectory } from "./render-adapter.mjs";
import { validateBranchSafety, validateRenderResultsReport } from "./render-safety.mjs";

const renderRoot = "D:\\CodexBuilds\\thallbyssal-lab\\renders";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");

function signature(sha256, sizeBytes = 1024, modifiedMs = 1) {
  return { sha256, sizeBytes, modifiedMs };
}

function dspSignatures(sha256 = "dsp-a") {
  return {
    "C:\\repo\\native\\juce-audio-engine\\Source\\ThallLabDspEngine.h": signature(`${sha256}-engine-h`),
    "C:\\repo\\native\\juce-audio-engine\\Source\\ThallLabDspEngine.cpp": signature(`${sha256}-engine-cpp`),
    "C:\\repo\\native\\juce-audio-engine\\Source\\PluginProcessor.h": signature(`${sha256}-processor-h`),
    "C:\\repo\\native\\juce-audio-engine\\Source\\PluginProcessor.cpp": signature(`${sha256}-processor-cpp`)
  };
}

function safeRenderResult(overrides = {}) {
  const outputDirectory = path.join(renderRoot, "session", "job");
  const dspFiles = dspSignatures();

  return {
    jobId: "job",
    inputPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\input.wav",
    status: "rendered",
    renderHookStatus: "real-render",
    renderPath: {
      available: true,
      kind: "local-headless-command",
      command: "C:\\repo\\native\\juce-audio-engine\\scripts\\render-offline.ps1"
    },
    outputDirectory,
    processedWavPath: path.join(outputDirectory, "processed.wav"),
    messages: [],
    nativeRender: {
      exitCode: 0,
      stdout: "",
      stderr: "",
      error: null
    },
    safety: {
      inputBefore: signature("input-a"),
      inputAfter: signature("input-a"),
      inputUnchanged: true,
      outputInsideRenderRoot: true,
      guiAutomationUsed: false,
      dspModifiedByAdapter: false,
      dspFilesBefore: dspFiles,
      dspFilesAfter: dspFiles,
      dspFilesUnchanged: true
    },
    ...overrides
  };
}

test("creates a dry-run render plan inside the render root", () => {
  const plan = createRenderPlan({
    mode: "dry-run",
    inputPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\LOW TUNED CHUGS.wav",
    presetPath: "C:\\repo\\AMP_SIM_LAB\\presets\\examples\\high_gain_foundation_01.json",
    renderRoot,
    sessionId: "2026-06-01_120000",
    presetId: "high-gain-foundation-01",
    jobId: "high-gain-foundation-01"
  });

  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.status, "dry_run");
  assert.equal(isInsideDirectory(renderRoot, plan.outputDirectory), true);
  assert.equal(path.basename(plan.processedWavPath), "processed.wav");
});

test("baseline comparison reports only render status and technical metric snapshots", () => {
  const baseline = {
    generatedAt: "2026-06-01T10:00:00.000Z",
    results: [
      {
        jobId: "high-gain-foundation-01",
        status: "rendered",
        mode: "real",
        renderHookStatus: "real-render",
        processedWavPath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\baseline\\processed.wav",
        metrics: {
          peakDbfs: -1.5,
          rmsDbfs: -18.25,
          lufsEstimate: -16.75,
          clippedSamples: 0
        }
      }
    ]
  };
  const current = {
    generatedAt: "2026-06-01T11:00:00.000Z",
    results: [
      {
        jobId: "high-gain-foundation-01",
        status: "failed",
        mode: "real",
        renderHookStatus: "real-render",
        processedWavPath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\current\\processed.wav",
        metrics: {
          peakDbfs: -1,
          rmsDbfs: -18,
          lufsEstimate: -16,
          clippedSamples: 2
        }
      }
    ]
  };

  const report = baselineReports.createBaselineCompareReport(current, baseline);

  assert.equal(report.summary.comparedJobs, 1);
  assert.equal(Object.hasOwn(report.summary, "toneJudgement"), false);
  assert.deepEqual(report.metricFields, ["peakDbfs", "rmsDbfs", "lufsEstimate", "clippedSamples"]);
  assert.deepEqual(report.statusFields, ["renderStatus", "renderSuccess", "renderHookStatus", "renderMode", "processedWavPresent", "missingRenderOutput"]);
  assert.equal(report.summary.renderSuccessChanges, 1);
  assert.equal(report.summary.dryRunRealRenderChanges, 0);
  assert.equal(report.summary.missingRenderOutputChanges, 0);
  assert.equal(report.comparisons[0].current.renderHookStatus, "real-render");
  assert.equal(report.comparisons[0].current.renderMode, "real");
  assert.equal(report.comparisons[0].current.processedWavPresent, true);
  assert.equal(report.comparisons[0].current.missingRenderOutput, false);
  assert.deepEqual(report.comparisons[0].baseline.metrics, {
    peakDbfs: -1.5,
    rmsDbfs: -18.25,
    lufsEstimate: -16.75,
    clippedSamples: 0
  });
  assert.deepEqual(report.comparisons[0].current.metrics, {
    peakDbfs: -1,
    rmsDbfs: -18,
    lufsEstimate: -16,
    clippedSamples: 2
  });
  assert.deepEqual(report.comparisons[0].deltas, {
    peakDbfs: 0.5,
    rmsDbfs: 0.25,
    lufsEstimate: 0.75,
    clippedSamples: 2
  });
  assert.equal(report.comparisons[0].renderSuccess.changed, true);
});

test("baseline create report lists render status, file references, and metrics only", () => {
  const renderReport = {
    generatedAt: "2026-06-01T10:00:00.000Z",
    results: [
      {
        jobId: "high-gain-foundation-01",
        status: "rendered",
        mode: "real",
        renderHookStatus: "real-render",
        inputPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\LOW TUNED CHUGS.wav",
        presetPath: "C:\\repo\\AMP_SIM_LAB\\presets\\examples\\high_gain_foundation_01.json",
        processedWavPath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\baseline\\processed.wav",
        metrics: {
          peakDbfs: -1.5,
          rmsDbfs: -18.25,
          lufsEstimate: -16.75,
          clippedSamples: 0
        }
      }
    ]
  };

  assert.equal(typeof baselineReports.createBaselineSnapshotReport, "function");
  const report = baselineReports.createBaselineSnapshotReport(
    renderReport,
    "D:\\CodexBuilds\\thallbyssal-lab\\baselines\\baseline.json"
  );

  assert.deepEqual(report.metricFields, ["peakDbfs", "rmsDbfs", "lufsEstimate", "clippedSamples"]);
  assert.equal(Object.hasOwn(report.summary, "toneJudgement"), false);
  assert.equal(report.summary.jobs, 1);
  assert.equal(report.summary.realRenderJobs, 1);
  assert.equal(report.summary.dryRuns, 0);
  assert.equal(report.summary.missingRenderOutputs, 0);
  assert.equal(report.jobs[0].renderSuccess, true);
  assert.equal(report.jobs[0].renderHookStatus, "real-render");
  assert.equal(report.jobs[0].renderMode, "real");
  assert.equal(report.jobs[0].processedWavPresent, true);
  assert.equal(report.jobs[0].missingRenderOutput, false);
  assert.deepEqual(report.jobs[0].metrics, {
    peakDbfs: -1.5,
    rmsDbfs: -18.25,
    lufsEstimate: -16.75,
    clippedSamples: 0
  });
  assert.deepEqual(report.jobs[0].fileReferences, {
    inputPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\LOW TUNED CHUGS.wav",
    presetPath: "C:\\repo\\AMP_SIM_LAB\\presets\\examples\\high_gain_foundation_01.json",
    processedWavPath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\baseline\\processed.wav",
    outputDirectory: null
  });
});

test("baseline reports dry-run status and missing real-render outputs objectively", () => {
  const current = {
    generatedAt: "2026-06-01T11:00:00.000Z",
    results: [
      {
        jobId: "real-render-missing-output",
        status: "failed",
        mode: "real",
        renderHookStatus: "real-render",
        processedWavPath: "D:\\CodexBuilds\\thallbyssal-lab\\renders\\missing\\processed.wav",
        metrics: null
      },
      {
        jobId: "dry-run",
        status: "dry_run",
        mode: "dry-run",
        renderHookStatus: "dry-run",
        processedWavPath: null,
        metrics: null
      }
    ]
  };
  const outputExistsByPath = new Map([
    ["D:\\CodexBuilds\\thallbyssal-lab\\renders\\missing\\processed.wav", false]
  ]);

  const report = baselineReports.createBaselineSnapshotReport(
    current,
    "D:\\CodexBuilds\\thallbyssal-lab\\baselines\\baseline.json",
    { outputExistsByPath }
  );

  assert.equal(report.summary.failed, 1);
  assert.equal(report.summary.dryRuns, 1);
  assert.equal(report.summary.realRenderJobs, 1);
  assert.equal(report.summary.missingRenderOutputs, 1);
  assert.deepEqual(report.jobs[0].metrics, {
    peakDbfs: null,
    rmsDbfs: null,
    lufsEstimate: null,
    clippedSamples: null
  });
  assert.equal(report.jobs[0].processedWavPresent, false);
  assert.equal(report.jobs[0].missingRenderOutput, true);
  assert.equal(report.jobs[1].renderHookStatus, "dry-run");
  assert.equal(report.jobs[1].missingRenderOutput, false);
});

test("blocks real render when no safe headless entrypoint exists", () => {
  const plan = createRenderPlan({
    mode: "real",
    inputPath: "D:\\CodexBuilds\\thallbyssal-lab\\di-test-files\\LOW TUNED CHUGS.wav",
    presetPath: "C:\\repo\\AMP_SIM_LAB\\presets\\examples\\high_gain_foundation_01.json",
    renderRoot,
    sessionId: "2026-06-01_120000",
    presetId: "high-gain-foundation-01",
    jobId: "high-gain-foundation-01",
    renderPathOverride: {
      available: false,
      kind: "missing",
      command: null,
      message: "No safe headless/offline render entrypoint exists yet. GUI automation is forbidden."
    }
  });

  assert.equal(plan.status, "blocked");
  assert.match(plan.messages.join("\n"), /No safe headless/i);
});

test("rejects render output outside the render root", () => {
  assert.equal(isInsideDirectory(renderRoot, "D:\\CodexBuilds\\thallbyssal-lab\\renders\\ok"), true);
  assert.equal(isInsideDirectory(renderRoot, "D:\\CodexBuilds\\thallbyssal-lab\\not-renders\\bad"), false);
});

test("detects the approved local headless render wrapper", () => {
  const renderPath = detectSafeRenderPath();

  assert.equal(renderPath.available, true);
  assert.match(renderPath.command, /render-offline\.ps1$/);
  assert.equal(renderPath.kind, "local-headless-command");
});

test("render safety report validator accepts complete unchanged hash records", () => {
  const validation = validateRenderResultsReport(
    { results: [safeRenderResult()] },
    { approvedRoots: [renderRoot] }
  );

  assert.deepEqual(validation.errors, []);
});

test("render safety report validator rejects missing or changed DI and DSP safety records", () => {
  const changedDspFiles = dspSignatures("dsp-b");
  const validation = validateRenderResultsReport(
    {
      results: [
        safeRenderResult({
          outputDirectory: "D:\\CodexBuilds\\thallbyssal-lab\\not-renders\\job",
          safety: {
            ...safeRenderResult().safety,
            inputAfter: signature("input-b"),
            inputUnchanged: true,
            guiAutomationUsed: true,
            dspFilesAfter: changedDspFiles,
            dspFilesUnchanged: true
          }
        })
      ]
    },
    { approvedRoots: [renderRoot] }
  );

  assert.match(validation.errors.join("\n"), /escapes approved render roots/);
  assert.match(validation.errors.join("\n"), /Input DI hash\/size\/mtime changed/);
  assert.match(validation.errors.join("\n"), /GUI automation flag is not false/);
  assert.match(validation.errors.join("\n"), /DSP\/core hash\/size\/mtime changed/);
});

test("render safety report validator rejects touched DI mtimes even when bytes match", () => {
  const validation = validateRenderResultsReport(
    {
      results: [
        safeRenderResult({
          safety: {
            ...safeRenderResult().safety,
            inputAfter: signature("input-a", 1024, 2)
          }
        })
      ]
    },
    { approvedRoots: [renderRoot] }
  );

  assert.match(validation.errors.join("\n"), /Input DI hash\/size\/mtime changed/);
});

test("render safety report validator rejects byte-identical processed output", () => {
  const validation = validateRenderResultsReport(
    {
      results: [
        safeRenderResult({
          safety: {
            ...safeRenderResult().safety,
            processedOutput: signature("input-a")
          }
        })
      ]
    },
    { approvedRoots: [renderRoot] }
  );

  assert.match(validation.errors.join("\n"), /possible fake/);
});

test("render safety report validator rejects processed output without approved renderer provenance", () => {
  const validation = validateRenderResultsReport(
    {
      results: [
        safeRenderResult({
          renderPath: {
            available: false,
            kind: "missing",
            command: null
          },
          nativeRender: {
            exitCode: 1,
            stdout: "",
            stderr: "",
            error: null
          }
        })
      ]
    },
    { approvedRoots: [renderRoot] }
  );

  assert.match(validation.errors.join("\n"), /approved local headless renderer provenance/);
  assert.match(validation.errors.join("\n"), /successful native renderer exit code/);
});

test("branch safety validator rejects DSP, DI asset, GUI automation, fake render, and public systems", () => {
  const validation = validateBranchSafety({
    changes: [
      { status: "M", path: "native/juce-audio-engine/Source/PluginProcessor.cpp", source: "branch" },
      { status: "M", path: "AMP_SIM_LAB/di-test-files/LOW TUNED CHUGS.wav", source: "branch" },
      { status: "A", path: "AMP_SIM_LAB/test-harness/render-hook/new-render.mjs", source: "branch" }
    ],
    fileTexts: new Map([
      [
        "AMP_SIM_LAB/test-harness/render-hook/new-render.mjs",
        "import playwright from 'playwright'; fs.copyFileSync(input, output); const telemetry = true;"
      ]
    ])
  });

  const messages = validation.errors.join("\n");
  assert.match(messages, /Protected DSP\/core file/);
  assert.match(messages, /Original DI\/audio\/user asset/);
  assert.match(messages, /GUI automation indicator/);
  assert.match(messages, /Fake render\/copy indicator/);
  assert.match(messages, /Public release\/checkout\/licensing\/auth\/telemetry indicator/);
});

test("branch safety validator allows validator self-check source terms", () => {
  const validation = validateBranchSafety({
    changes: [
      { status: "M", path: "AMP_SIM_LAB/test-harness/render-hook/render-safety.mjs", source: "branch" }
    ],
    fileTexts: new Map()
  });

  assert.deepEqual(validation.errors, []);
});

test("offline renderer records and validates the actual heavy signal chain", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "OfflineRendererMain.cpp"), "utf8");

  assert.match(source, /cabIrARequested/);
  assert.match(source, /Requested IR A does not exist/);
  assert.match(source, /gateEnabled/);
  assert.match(source, /grinderEnabled/);
  assert.match(source, /ampEnabled/);
  assert.match(source, /ampPeakLinear/);
  assert.match(source, /diPeakLinear/);
  assert.match(source, /activeInputChannel/);
  assert.match(source, /monoBuffer\.copyFrom\(0, 0, inputBuffer, activeInputChannel/);
});

test("DSP engine activates loaded cabinet IRs before the first rendered block", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");

  assert.match(source, /loadImpulseResponse[\s\S]*prepareCabConvolution/);
});

test("standalone uses guitar-style active input and centered cab A/B mix", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");

  assert.match(source, /activeInputChannel/);
  assert.match(source, /inputScratch\.copyFrom\(0, 0, \*buffer, activeInputChannel/);
  assert.match(source, /addSlider\("A\/B mix", -100\.0, 100\.0, 0\.0/);
  assert.match(source, /params\.cabBlend = static_cast<float>\(\(cabBlend->getValue\(\) \+ 100\.0\) \* 0\.5\)/);
});

test("standalone exposes manual guitar input source selection", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");

  assert.match(header, /juce::ComboBox inputChannelBox/);
  assert.match(source, /inputChannelBox\.addItem\("Auto"/);
  assert.match(source, /inputChannelBox\.addItem\("Input 2"/);
  assert.match(source, /getRequestedInputChannel/);
  assert.match(source, /requestedInputChannel/);
  assert.match(source, /activeInputChannel = requestedInputChannel/);
});

test("standalone can return to factory cab and clear individual IR slots", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const engineHeader = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");

  assert.match(header, /factoryCabButton/);
  assert.match(header, /clearIrAButton/);
  assert.match(header, /clearIrBButton/);
  assert.match(engineHeader, /clearCabIr\(int slot\)/);
  assert.match(source, /resetToFactoryCab/);
  assert.match(source, /clearCabSlot\(0\)/);
  assert.match(source, /clearCabSlot\(1\)/);
});

test("DSP keeps transpose-down from losing level as pitch drops", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");

  assert.match(source, /transposeLevelCompensationDb/);
  assert.match(source, /semitones < 0\.0f/);
  assert.match(source, /output \*= juce::Decibels::decibelsToGain\(transposeLevelCompensationDb\)/);
  assert.match(source, /transposeTransientBlend/);
  assert.match(source, /fastSweepSamples/);
  assert.doesNotMatch(source, /sampleRate\) \* 0\.046f/);
});

test("DSP amp tone knobs have audible post-gain authority", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");

  assert.match(source, /ampToneAuthority/);
  assert.match(source, /ampPreSaturationLevel/);
  assert.match(source, /juce::jmap\(bass, 0\.0f, 1\.0f, -0\.42f, 0\.34f\)/);
  assert.match(source, /juce::jmap\(master, 0\.0f, 1\.0f, 0\.12f, 1\.72f\)/);
});

test("DI sculpt is dry passthrough at zero and smooth is gentle", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");

  assert.match(header, /float diAmount = 0\.0f;/);
  assert.match(plugin, /"diAmount", "DI Amount", 0\.0f, 100\.0f, 0\.1f, 0\.0f/);
  assert.match(ui, /diAmount = &addSlider\("Amount", 0\.0, 100\.0, 0\.0/);
  assert.match(ui, /"vild-standard-rhythm", "Vild Standard Rhythm", 0, -62, 42, 74, 74, 72, 0, 48, 8\.4, 26, 62, 72, 68, 70, 0, 95, 13500, 28/);
  assert.match(source, /if \(amount <= 0\.001f\)\s+return sample;/);
  assert.match(source, /diSculptToneMatch/);
  assert.match(source, /dryBlend/);
  assert.match(source, /smoothGentle/);
  assert.match(source, /bodyTighten = body \* amount \* \(0\.035f/);
  assert.doesNotMatch(source, /curveLift = smoothedTarget \* \(1\.0f - smooth \* 0\.72f\)/);
});

test("DSP gain staging starts strong without collapsing into hard output clipping", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");

  assert.match(source, /rigDriveMakeup/);
  assert.match(source, /ampCalibratedOutput/);
  assert.match(source, /softLimitOutput/);
  assert.match(source, /outputCeiling/);
  assert.doesNotMatch(source, /juce::jlimit\(-0\.99f, 0\.99f, \(cabbed \+ clean \+ ambient\) \* outputGain\)/);
  assert.match(header, /cabLevel = 0\.0f/);
  assert.match(ui, /addSlider\("Cab level", -18\.0, 18\.0, 0\.0/);
  assert.match(plugin, /"Cab Level", -18\.0f, 18\.0f, 0\.1f, 0\.0f/);
});

test("native tone presets use their own cab cuts and controlled gain staging", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");

  assert.match(source, /cabLowCut->setValue\(preset\.cabLow/);
  assert.match(source, /cabHighCut->setValue\(preset\.cabHigh/);
  assert.match(source, /"vild-standard-rhythm", "Vild Standard Rhythm", 0, -62, 42, 74, 74, 72, 0, 48, 8\.4, 26, 62, 72, 68, 70, 0, 95, 13500, 28/);
  assert.doesNotMatch(source, /"vild-standard-rhythm", "Vild Standard Rhythm", 6, -62, 38, 92/);
});

test("grinder pedal exposes one musical boost knob", () => {
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.h"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");

  assert.match(ui, /grinderAmount = &addSlider\("Grind"/);
  assert.match(ui, /placeKnobs\(grinderModule\.reduced\(0, 10\), \{ grinderAmount \}\)/);
  assert.doesNotMatch(header, /grinderTone/);
  assert.doesNotMatch(header, /grinderLevel/);
  assert.doesNotMatch(plugin, /grinderLevel/);
  assert.match(source, /grinderOutputCompensation/);
});

test("palm mute catcher exposes a 30 Hz to 2.5 kHz focus frequency", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");
  const uiHeader = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.h"), "utf8");
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");
  const offline = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "OfflineRendererMain.cpp"), "utf8");

  assert.match(header, /palmMuteFocusHz/);
  assert.match(uiHeader, /palmMuteFocus/);
  assert.match(ui, /addSlider\("Focus", 30\.0, 2500\.0/);
  assert.match(source, /juce::jlimit\(30\.0f, 2500\.0f, parameters\.palmMuteFocusHz\)/);
  assert.match(plugin, /palmCatchFocusHz/);
  assert.match(offline, /focusHz/);
});

test("cab filters are neutral by default while cab output starts at unity level", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");

  assert.match(header, /cabLowCutHz = 20\.0f/);
  assert.match(header, /cabHighCutHz = 20000\.0f/);
  assert.match(header, /cabLevel = 0\.0f/);
  assert.match(ui, /addSlider\("Low cut", 20\.0, 300\.0, 20\.0/);
  assert.match(ui, /addSlider\("High cut", 2000\.0, 20000\.0, 20000\.0/);
  assert.match(ui, /addSlider\("Cab level", -18\.0, 18\.0, 0\.0/);
  assert.match(source, /if \(lowCut > 22\.0f\)/);
  assert.match(source, /if \(highCut < 19500\.0f\)/);
  assert.match(plugin, /"Cab High Cut", 2000\.0f, 20000\.0f, 1\.0f, 20000\.0f/);
  assert.match(plugin, /"Cab Level", -18\.0f, 18\.0f, 0\.1f, 0\.0f/);
});

test("cab section and IR processing can be bypassed independently", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");
  const uiHeader = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.h"), "utf8");
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");

  assert.match(header, /cabSectionEnabled/);
  assert.match(header, /cabIrEnabled/);
  assert.match(source, /parameters\.cabSectionEnabled/);
  assert.match(source, /parameters\.cabIrEnabled/);
  assert.match(uiHeader, /cabSectionButton/);
  assert.match(uiHeader, /cabIrButton/);
  assert.match(ui, /cabSectionButton\.setClickingTogglesState\(true\)/);
  assert.match(ui, /cabIrButton\.setClickingTogglesState\(true\)/);
  assert.match(plugin, /"cabSectionEnabled"/);
  assert.match(plugin, /"cabIrEnabled"/);
});

test("standalone has polished visual rig surfaces for signal chain and clean page", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");

  assert.match(header, /drawSignalChain/);
  assert.match(header, /drawCleanRigGraphic/);
  assert.match(header, /drawStatusLed/);
  assert.match(source, /THALLBYSSAL/);
  assert.match(source, /CLEAN VOID AMP/);
  assert.match(source, /DELAY ENGINE/);
  assert.match(source, /VOID REVERB/);
  assert.match(source, /RIFT/);
});

test("clean channel has dedicated delay and reverb controls", () => {
  const header = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.h"), "utf8");
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");
  const ui = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "MainComponent.cpp"), "utf8");
  const plugin = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");

  assert.match(header, /cleanDelayMix/);
  assert.match(header, /cleanReverbMix/);
  assert.match(source, /cleanEchoBuffer/);
  assert.match(source, /cleanReverbBuffer/);
  assert.match(source, /cleanDelayFeedback/);
  assert.match(ui, /addSlider\("Delay"/);
  assert.match(ui, /addSlider\("Reverb"/);
  assert.match(plugin, /cleanDelayMix/);
  assert.match(plugin, /cleanReverbMix/);
});

test("custom cabinet IR loading uses conservative local gain staging", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "ThallLabDspEngine.cpp"), "utf8");

  assert.match(source, /normaliseCabIrBuffer/);
  assert.match(source, /juce::dsp::Convolution::Normalise::no/);
});

test("plugin processor keeps mono guitar input from the strongest active channel", () => {
  const source = fs.readFileSync(path.join(repoRoot, "native", "juce-audio-engine", "Source", "PluginProcessor.cpp"), "utf8");

  assert.match(source, /activeInputChannel/);
  assert.match(source, /monoInput\.copyFrom\(0, 0, buffer, activeInputChannel/);
});
