# Thallbyssal Commercial Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a commercial product foundation for Thallbyssal and create the first JUCE standalone/VST3 product target.

**Architecture:** Keep the existing `ThallLabAudioEngine` standalone development target and add a new `Thallbyssal` plugin target using `juce_add_plugin`. Share `ThallLabDspEngine` between both targets.

**Tech Stack:** JUCE 8, CMake, C++20, React/Vite documentation companion.

---

### Task 1: Product Documentation

**Files:**
- Create: `docs/COMMERCIAL_PRODUCT_PLAN.md`
- Create: `docs/RELEASE_CHECKLIST.md`
- Create: `docs/SOUND_DESIGN_TARGETS.md`
- Create: `docs/superpowers/specs/2026-06-01-thallbyssal-commercial-design.md`

- [ ] **Step 1: Add product plan**

Create a plan that defines Thallbyssal as an original standalone + VST3 amp sim, lists core modules, and links licensing/signing references.

- [ ] **Step 2: Add release checklist**

Create a checklist for legal, build output, audio QA, DAW QA, packaging, and sales assets.

- [ ] **Step 3: Add sound targets**

Create a sound design target document covering rhythm, low tuning, clean/ambient, presets, and test DI files.

### Task 2: JUCE Plugin Target

**Files:**
- Modify: `native/juce-audio-engine/CMakeLists.txt`
- Create: `native/juce-audio-engine/Source/PluginProcessor.h`
- Create: `native/juce-audio-engine/Source/PluginProcessor.cpp`

- [ ] **Step 1: Add plugin processor**

Create a minimal `ThallbyssalAudioProcessor` that exposes input gain, output gain, and mono output parameters. It must use `ThallLabDspEngine` inside `processBlock`.

- [ ] **Step 2: Add plugin target**

Add `juce_add_plugin(Thallbyssal FORMATS Standalone VST3 ...)` and link the JUCE modules needed for plugin builds.

- [ ] **Step 3: Verify native build**

Run `npm run native:build`. Expected: build exits 0 and creates standalone/VST3 plugin artifacts.

### Task 3: Documentation And Scripts

**Files:**
- Modify: `README.md`
- Modify: `native/juce-audio-engine/README.md`
- Modify: `package.json`
- Create: `native/juce-audio-engine/scripts/open-thallbyssal.ps1`

- [ ] **Step 1: Add product build notes**

Document that `npm run native:build` builds the development standalone and the Thallbyssal VST3/standalone product target.

- [ ] **Step 2: Add open script**

Add a script that opens the Thallbyssal standalone artifact when it exists.

- [ ] **Step 3: Verify all checks**

Run `npm test -- --run`, `npm run build`, and `npm run native:build`.
