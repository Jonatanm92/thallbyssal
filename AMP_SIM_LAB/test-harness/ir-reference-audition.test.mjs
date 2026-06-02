import test from "node:test";
import assert from "node:assert/strict";
import { createNativeIrAuditionPreset, isRenderableIrFileName, selectIrAuditionFiles, summarizeRenderChainMetadata } from "./create-ir-reference-audition.mjs";

test("selects a small internal IR audition set from founder assets", () => {
  const files = [
    { name: "BD_DT_01.wav", fullPath: "D:\\irs\\BD_DT_01.wav" },
    { name: "BD_DT_10Gonnojira.wav", fullPath: "D:\\irs\\BD_DT_10Gonnojira.wav" },
    { name: "BD_DT_22Lowspawner.wav", fullPath: "D:\\irs\\BD_DT_22Lowspawner.wav" },
    { name: "ML Sound Lab.wav", fullPath: "D:\\irs\\ML Sound Lab.wav" }
  ];

  const selected = selectIrAuditionFiles(files, 3);

  assert.deepEqual(selected.map((file) => file.name), [
    "ML Sound Lab.wav",
    "BD_DT_10Gonnojira.wav",
    "BD_DT_22Lowspawner.wav"
  ]);
});

test("allows only audio IR files that the native renderer can load", () => {
  assert.equal(isRenderableIrFileName("Palmer.wav"), true);
  assert.equal(isRenderableIrFileName("Cab.aif"), true);
  assert.equal(isRenderableIrFileName("Cab.aiff"), true);
  assert.equal(isRenderableIrFileName("Cab.flac"), true);
  assert.equal(isRenderableIrFileName("Device.ir"), false);
  assert.equal(isRenderableIrFileName("Manual.pdf"), false);
});

test("summarizes render chain metadata for audition pages", () => {
  const chain = summarizeRenderChainMetadata({
    ampEnabled: true,
    grinderEnabled: true,
    gateEnabled: true,
    cabIrARequested: true,
    cabIrALoaded: true,
    rawInputPeakLinear: 0.125,
    inputPeakLinear: 0.25,
    diPeakLinear: 1.25,
    ampPeakLinear: 0.6,
    outputPeakLinear: 0.37
  });

  assert.deepEqual(chain, {
    ampEnabled: true,
    grinderEnabled: true,
    gateEnabled: true,
    cabIrARequested: true,
    cabIrALoaded: true,
    rawInputPeakLinear: 0.125,
    inputPeakLinear: 0.25,
    diPeakLinear: 1.25,
    ampPeakLinear: 0.6,
    outputPeakLinear: 0.37
  });
});

test("prioritizes Palmer and extra-interesting recursive IR folders and ignores empty files", () => {
  const files = [
    {
      name: "Generic.wav",
      relativePath: "Generic.wav",
      fullPath: "D:\\irs\\Generic.wav",
      sizeBytes: 60000
    },
    {
      name: "Should Skip.wav",
      relativePath: "Extra intressanta IR\\Should Skip.wav",
      fullPath: "D:\\irs\\Extra intressanta IR\\Should Skip.wav",
      sizeBytes: 0
    },
    {
      name: "V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
      relativePath: "Extra intressanta IR\\V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
      fullPath: "D:\\irs\\Extra intressanta IR\\V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
      sizeBytes: 43330
    },
    {
      name: "Palmer Mellow 57.wav",
      relativePath: "Palmer Mellow\\Palmer Mellow 57.wav",
      fullPath: "D:\\irs\\Palmer Mellow\\Palmer Mellow 57.wav",
      sizeBytes: 43330
    }
  ];

  const selected = selectIrAuditionFiles(files, 3);

  assert.deepEqual(selected.map((file) => file.relativePath), [
    "Palmer Mellow\\Palmer Mellow 57.wav",
    "Extra intressanta IR\\V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
    "Generic.wav"
  ]);
});

test("prioritizes specific brutal reference names over generic extra-folder matches", () => {
  const files = [
    {
      name: "Barong tone 01.wav",
      relativePath: "Extra intressanta IR\\Barong tone 01.wav",
      fullPath: "D:\\irs\\Extra intressanta IR\\Barong tone 01.wav",
      sizeBytes: 105920
    },
    {
      name: "V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
      relativePath: "Extra intressanta IR\\V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
      fullPath: "D:\\irs\\Extra intressanta IR\\V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
      sizeBytes: 43330
    },
    {
      name: "HumanityLastBreath-SelfTitled.wav",
      relativePath: "Extra intressanta IR\\HumanityLastBreath-SelfTitled.wav",
      fullPath: "D:\\irs\\Extra intressanta IR\\HumanityLastBreath-SelfTitled.wav",
      sizeBytes: 11140
    }
  ];

  const selected = selectIrAuditionFiles(files, 2);

  assert.deepEqual(selected.map((file) => file.name), [
    "V1LDHJARTA-MUV-BLEND - TH-DVTS2.wav",
    "HumanityLastBreath-SelfTitled.wav"
  ]);
});

test("skips clean cabinet folders for the heavy rhythm IR audition", () => {
  const files = [
    {
      name: "BD_CL_AlmostAcc.wav",
      relativePath: "Clean\\BD_CL_AlmostAcc.wav",
      fullPath: "D:\\irs\\Clean\\BD_CL_AlmostAcc.wav",
      sizeBytes: 130604
    },
    {
      name: "BD_DT_10Gonnojira.wav",
      relativePath: "BD_DT_10Gonnojira.wav",
      fullPath: "D:\\irs\\BD_DT_10Gonnojira.wav",
      sizeBytes: 61578
    }
  ];

  const selected = selectIrAuditionFiles(files, 2);

  assert.deepEqual(selected.map((file) => file.name), ["BD_DT_10Gonnojira.wav"]);
});

test("samples high-priority IRs from multiple folders before filling similar files", () => {
  const files = [
    {
      name: "Palmer 1 A.wav",
      relativePath: "Palmer candidates\\Palmer 1x12 V30\\Palmer 1 A.wav",
      fullPath: "D:\\irs\\Palmer candidates\\Palmer 1x12 V30\\Palmer 1 A.wav",
      sizeBytes: 72000
    },
    {
      name: "Palmer 1 B.wav",
      relativePath: "Palmer candidates\\Palmer 1x12 V30\\Palmer 1 B.wav",
      fullPath: "D:\\irs\\Palmer candidates\\Palmer 1x12 V30\\Palmer 1 B.wav",
      sizeBytes: 72000
    },
    {
      name: "Palmer Cab A.wav",
      relativePath: "Palmer candidates\\Palmer Cab 212 - Shure Beta 57\\Palmer Cab A.wav",
      fullPath: "D:\\irs\\Palmer candidates\\Palmer Cab 212 - Shure Beta 57\\Palmer Cab A.wav",
      sizeBytes: 22000
    },
    {
      name: "PGA Brown.wav",
      relativePath: "Palmer candidates\\Per's Palmer PGA-04 MiniPack\\PGA Brown.wav",
      fullPath: "D:\\irs\\Palmer candidates\\Per's Palmer PGA-04 MiniPack\\PGA Brown.wav",
      sizeBytes: 33000
    }
  ];

  const selected = selectIrAuditionFiles(files, 3);

  assert.deepEqual(selected.map((file) => file.relativePath), [
    "Palmer candidates\\Palmer 1x12 V30\\Palmer 1 A.wav",
    "Palmer candidates\\Palmer Cab 212 - Shure Beta 57\\Palmer Cab A.wav",
    "Palmer candidates\\Per's Palmer PGA-04 MiniPack\\PGA Brown.wav"
  ]);
});

test("creates a native preset that actually references a sibling IR file", () => {
  const preset = createNativeIrAuditionPreset({
    presetId: "ir-audition-test",
    irFileName: "test-cab.wav"
  });

  assert.equal(preset.target, "thall-lab-native-juce");
  assert.equal(preset.audio.cabIrFileName, "test-cab.wav");
  assert.equal(preset.audio.inputGainDb, 0);
  assert.equal(preset.audio.outputGainDb, -6);
  assert.equal(preset.audio.outputMode, "stereo");
  assert.equal(preset.gate.thresholdDb, -62);
  assert.equal(preset.grinder.drive, 72);
  assert.equal(preset.di.amount, 0);
  assert.equal(preset.di.smooth, 48);
  assert.equal(preset.amp.outputDb, 0);
  assert.equal(preset.cab.lowCutHz, 95);
  assert.equal(preset.cab.highCutHz, 13500);
  assert.equal(preset.cab.level, 0);
  assert.equal(preset.amp.enabled, true);
  assert.equal(preset.fx.enabled, false);
});
