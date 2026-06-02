# Tone Design Notes

Internal founder notes for future tone work. These notes do not approve DSP changes by themselves.

## Gate

- Product-facing name direction: `Abyss Gate` or `Gate of the Abyss`.
- Goal: tight modern metal gate workflow with one primary control in the pedal view.
- Avoid using third-party pedal names in product UI.
- Advanced threshold/release values may exist internally or behind an advanced panel.

## Booster / Overdrive

- Reserve `Drive` wording for a dedicated booster/overdrive pedal.
- This should be the green-style boost workflow used widely in modern metal/djent contexts.
- Placement is not finalized. Default test candidate is before the amp, but we should A/B test pre-amp vs post-amp placement before making it product behavior.
- It can have a familiar simple control layout later, but avoid third-party brand or model names.
- Reference direction from founder screenshot: a simple green-style boost pedal with three visible controls:
  - Drive
  - Level
  - Tone
- Product-facing name should be original, for example `Abyss Boost`, `Rift Boost`, or `Lowforge Boost`.

## Tight Drive Pedal

- Add a separate heavier/tighter drive pedal in addition to the boost pedal.
- Reference direction from founder screenshot: a blue-style drive pedal with four visible controls:
  - Drive
  - Level
  - Tight
  - Tone
- This pedal is for shaping tightness, attack, and saturation. Placement is not finalized; test before amp and after amp before deciding.
- Product-facing name should be original, for example `Abyss Drive`, `Rift Drive`, or `Tidebreaker Drive`.
- This is distinct from DI Sculpt and distinct from the cabinet/IR page.

## Tightener / Grinder

- Do not use `Drive` as the main product-facing name for this stage.
- Product-facing name direction: `Rift Tightener`, `Abyss Tight`, or `Edge Forge`.
- UI direction: one main knob in the pedal view.
- Internal mapping can control drive and level together so the pedal stays usable without separate drive/level controls.
- Placement is not finalized; test before amp, after boost/drive, and post-amp diagnostic variants before deciding.

## Boostalizer-Style DI EQ

- Add later as a pre-amp DI-shaping pedal inspired by the founder-provided Boostalizer reference image.
- It should behave like a DI EQ / input sculpt stage, not a post-cab EQ and not an ambient effect.
- This is separate from the cabinet/IR page.
- Placement decision: before the amp.
- It is meaningfully different from the boost/drive pedals in the founder screenshot.

## DI Sculpt

- Current DI Sculpt is not accepted as the final concept.
- Founder intent: DI Sculpt should become a reference/tone-match style DI transformation based on founder-provided DI references.
- It should not merely be a generic flavor EQ.
- Product-facing name direction: `Rift Sculptor`.
- Do not redesign this DSP without explicit founder approval and a dedicated test plan.
