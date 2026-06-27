# Current Best Source Rehydration Probe Report

Generated: 2026-06-27

## Scope

This pass adds a narrow NAM-runtime source recovery probe. It does not claim Current Best tone parity and does not install or replace the known-good beta.

## Source Changes

- Added guarded NAM runtime adapter source:
  - `native/juce-audio-engine/Source/NamRuntimeAdapter.h`
  - `native/juce-audio-engine/Source/NamRuntimeAdapter.cpp`
- Added guarded Live V1 NAM probe chain source:
  - `native/juce-audio-engine/Source/ThallbyssalLiveV1NamChain.h`
  - `native/juce-audio-engine/Source/ThallbyssalLiveV1NamChain.cpp`
- Added probe entrypoints:
  - `native/juce-audio-engine/Source/NamRuntimeProbeMain.cpp`
  - `native/juce-audio-engine/Source/ThallbyssalLiveV1ProbeMain.cpp`
- Updated `native/juce-audio-engine/CMakeLists.txt` with `THALLBYSSAL_ENABLE_NAM_RUNTIME`, default `OFF`.
- Added probe-only input resampling in `ThallbyssalLiveV1ProbeMain.cpp` so historical DI files at 44.1 kHz, 48 kHz, or 96 kHz can be rendered into the fixed 48 kHz probe chain.
- Added local-only numeric gain overrides for the source recovery probe through the private properties file:
  - `bldogGainDb`
  - `gojiraGainDb`
  - `edgeGainDb`
  - `finalGainDb`
  These are probe-only recovery controls and do not change plugin DSP, product defaults, or the known-good beta.
- Added probe-only output safety modes in `ThallbyssalLiveV1ProbeMain.cpp`:
  - `--safety-mode none`
  - `--safety-mode peak-normalize`
  - `--safety-mode hard-ceiling`
  - `--safety-mode soft-ceiling`
  These modes are diagnostic render/export variants only. They do not change product DSP, plugin defaults, the known-good beta, or any realtime audio callback path.

## Safety Boundaries

- Product default changed: no.
- Golden Reference A changed: no.
- Plugin processor routed to NAM path: no.
- Known-good beta overwritten or installed: no.
- NAM/IR/audio/model assets committed: no.
- Private assets remain local `doNotShip=true`.

## Build Evidence

Default source configure:

- Command: `cmake -S native/juce-audio-engine -B D:\CodexBuilds\thallbyssal-source-rehydration-default -G "Visual Studio 17 2022" -A x64 -DTHALLBYSSAL_ENABLE_NAM_RUNTIME=OFF`
- Result: pass.

NAM-enabled source configure:

- Command: `cmake -S native/juce-audio-engine -B D:\CodexBuilds\thallbyssal-source-rehydration-nam -G "Visual Studio 17 2022" -A x64 -DTHALLBYSSAL_ENABLE_NAM_RUNTIME=ON -DTHALLBYSSAL_NAM_CORE_DIR=D:\CodexBuilds\thallbyssal-nam-runtime-probe\NeuralAmpModelerCore`
- Result: pass.

NAM runtime probe build:

- Target: `ThallbyssalNamRuntimeProbe`
- Output: `D:\CodexBuilds\thallbyssal-source-rehydration-nam\Release\ThallbyssalNamRuntimeProbe.exe`
- Result: pass.

Live V1 probe build:

- Target: `ThallbyssalLiveV1Probe`
- Output: `D:\CodexBuilds\thallbyssal-source-rehydration-nam\ThallbyssalLiveV1Probe_artefacts\Release\ThallbyssalLiveV1Probe.exe`
- Result: pass.
- Warning: JUCE deprecated `AudioFormat::createWriterFor` overload in probe-only code.

## Runtime Evidence

NAM parser/load sanity:

- Command: `ThallbyssalNamRuntimeProbe.exe <local-private-a2-nam>`
- Result: pass.
- Expected sample rate: 48000.
- Input channels: 1.
- Output channels: 1.
- Generated-buffer sanity check: pass.

Live V1 probe render sanity:

- Input: `D:\REAPER\DI CLENA!.wav`
- Output: `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration\livev1-probe-di-clena\processed.wav`
- Metadata: `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration\livev1-probe-di-clena\render-metadata.json`
- Result: pass, chain reported ready and all NAM/IR branches loaded.
- Caveat: metadata reported `rawInputPeakLinear` as `0`, so this render is only a runtime plumbing check, not a meaningful tone or parity render.

Resampling sanity after probe update:

- `D:\REAPER\PICK ATTACK.wav`: pass, input sample rate 96000 Hz, rendered at 48000 Hz, `resampled=true`, `rawInputPeakLinear=0.445430815219879`, `outputPeakLinear=0.058105066418648`.
- `D:\REAPER\DI Boostalizer.wav`: pass, input sample rate 44100 Hz, rendered at 48000 Hz, `resampled=true`, `rawInputPeakLinear=0.25079882144928`, `outputPeakLinear=0.05517029389739`.
- `D:\REAPER\DI CLENA!.wav`: pass, input sample rate 48000 Hz, rendered at 48000 Hz, `resampled=false`, `rawInputPeakLinear=0`.
- The generated metadata under `D:\CodexBuilds\thallbyssal-lab` can include local private asset paths and must not be committed or shared as release material.

Diagnostic A2 output safety pass:

- Config: local-only A2 gain hypothesis, with branch gains near `-3 dB` and final gain near `+18 dB`.
- DI windows: first 6 seconds of `DI Boostalizer.wav` and `PICK ATTACK.wav`.
- Rendered modes: `peak-normalize`, `hard-ceiling`, and `soft-ceiling`.
- Output root: `D:\CodexBuilds\thallbyssal-lab\current-best-source-rehydration`.
- Result: all six renders completed, all chains reported ready, and all safety-mode comparison renders measured `0` clipped samples.
- Raw probe peak before safety:
  - DI Boostalizer: `2.31928539276123` linear.
  - Pick Attack: `2.0332691669464111` linear.
- Safety-mode output peaks:
  - `peak-normalize`: `0.891250908374786` linear.
  - `hard-ceiling`: `0.891250908374786` linear.
  - `soft-ceiling`: about `0.99` linear.
- Caveat: clipping was removed, but parity was not achieved. Peak-normalize became too quiet in RMS/lows, while hard/soft ceiling remained too high in mid/high energy compared with the known-good beta.

## What This Proves

- The local NeuralAmpModelerCore checkout can be found by CMake.
- The NAM runtime adapter compiles from source.
- The A2/Slimmable/WaveNet NAM parser can load the local private A2 NAM test file.
- The generated-buffer sanity path can process finite audio through NAM.
- The recovered Live V1 probe chain compiles and can load local-only NAM/IR dependencies when pointed at them through a private config file.
- The recovered Live V1 probe can now ingest common historical DI sample rates by resampling probe input only.
- The recovered Live V1 probe can test local-only gain hypotheses from private config without changing product behavior.
- The recovered Live V1 probe can now test diagnostic output safety hypotheses around the high-gain A2 region without changing product behavior.

## What This Does Not Prove

- It does not prove Current Best PSET2/BST1/CHF1/CHUG-UI2 parity.
- It does not reproduce the active known-good beta marker:
  - `CURRENT BEST A2 FULL-RIG / GATE V0.7 / OUT+0.3 / PG8 / TW-OFF / CF2 / GS1 / PSET2 / BST1 / CHF1 / CHUG-UI2`
- It does not approve any local NAM/IR file for shipping.
- It does not make the NAM path playable in the product.
- It does not change public product defaults.
- It does not make directly applied A2-manifest gain values safe; the local A2-gain pass clipped heavily, which indicates missing Current Best output safety/headroom behavior.
- It does not prove that a simple limiter, peak normalizer, or ceiling stage is enough to recover the known-good Current Best product chain.

## Next Safe Step

Continue reconstructing the actual Current Best A2 full-rig chain before integrating any NAM source into `PluginProcessor`. The diagnostic safety pass narrowed the blocker: the missing behavior is not only level safety, but also the product polish/EQ/headroom calibration that keeps the known-good beta loud without becoming clipped, overly bright, or mid-forward.
