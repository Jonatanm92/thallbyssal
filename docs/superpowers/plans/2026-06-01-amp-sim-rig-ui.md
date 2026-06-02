# Amp Sim Rig UI Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Songwriter Lab tone controls from form-like sliders into a plugin-inspired amp rig surface.

**Architecture:** Keep the current React state and domain/export logic intact. Replace the visible Songwriter Lab tone/pedal controls with reusable knob and pedal UI components inside `src/App.tsx`, then add focused CSS in `src/styles.css`.

**Tech Stack:** React, TypeScript, Vite, CSS, existing domain models.

---

### Task 1: Add Reusable Visual Controls

**Files:**
- Modify: `src/App.tsx`

- [x] Add a `KnobControl` component that renders an accessible range input as a visual amp knob.
- [x] Add a `formatSignedValue` helper for transpose-style values.
- [x] Keep all values controlled by existing state setters.

### Task 2: Build The Amp Rig Surface

**Files:**
- Modify: `src/App.tsx`

- [x] Replace the old `songwriter-advanced` slider grid with a visible `amp-rig` section.
- [x] Include preset buttons, tuner display, pedal chain, amp head, bass module, and timing module.
- [x] Reuse existing handlers: `applyGuitarTonePreset`, `updateForgePedal`, and existing state setters.

### Task 3: Style Like A Plugin Surface

**Files:**
- Modify: `src/styles.css`

- [x] Add styles for `amp-rig`, `amp-rig-header`, `pedal-chain`, `stompbox`, `amp-head`, `knob-control`, `bass-module`, and mobile layout.
- [x] Make controls feel like tactile gear: LED dots, footswitch circles, panels, knobs, and clear labels.
- [x] Avoid copying any commercial UI exactly.

### Task 4: Verify

**Files:**
- Run only commands.

- [x] Run `npm.cmd test -- --run` and expect all tests to pass.
- [x] Run `npm.cmd run build` and expect TypeScript/Vite build success.
- [x] Restart/confirm dev server at `http://127.0.0.1:5173/`.
- [x] Smoke-test the Songwriter Lab tab in browser for visible amp rig text.
