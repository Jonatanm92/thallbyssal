# Thallbyssal Commercial Foundation Design

## Goal

Turn the native amp-sim prototype into a commercial product track named **Thallbyssal**, starting with Windows standalone and VST3 builds.

## Scope

This foundation step does not attempt to finish the full amp sim. It creates the product direction, release checklist, sound targets, and a first JUCE plugin target that shares the existing DSP engine.

## Architecture

The native project will keep the existing rich standalone prototype target for fast development, and add a separate `Thallbyssal` JUCE plugin target with `Standalone` and `VST3` formats. Both targets use `ThallLabDspEngine` so the DSP can mature in one place.

The initial plugin UI can be generic/minimal because the first milestone is buildability and DAW loading. The professional amp-sim UI remains a later product task.

## Product Rules

- Use **Thallbyssal** as working product name.
- Keep all sound design original.
- Do not use competitor product names in preset names.
- Do not use artist names in preset names unless permission exists.
- Treat browser Songwriter Lab as a companion tool, not the commercial amp-sim runtime.

## Build Requirements

- `npm run native:build` must build the existing standalone target and the new plugin target.
- The new target must produce VST3 and standalone plugin artifacts through JUCE.
- Existing React tests and build must still pass.

## Release Requirements

Release documentation must cover:

- JUCE licensing decision
- VST3 license review
- Windows signing
- macOS notarization later
- audio QA
- DAW QA
- packaging
- sales/support assets

