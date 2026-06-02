# Technical Build Options

This file compares possible plugin/product paths. It does not make final architecture decisions.

## JUCE C++ Plugin Path

Pros:

- Already in the project.
- Supports VST3 and standalone.
- Good path toward AU/macOS later.
- Strong fit for low-latency audio.
- Shared DSP can power plugin and standalone builds.

Cons:

- Requires C++ audio/plugin discipline.
- Commercial JUCE licensing must be handled.
- UI work takes more effort than web UI.
- Cross-platform release requires signing/notarization knowledge.

Decision questions:

- Are we committing to JUCE as the commercial product runtime?
- When do we buy/confirm the correct JUCE license?
- Which DAWs are required for v1 validation?

## Standalone App First

Pros:

- Easier to test input/output and latency.
- No DAW plugin scan issues during early sound design.
- Good for founder tone work.

Cons:

- Many buyers expect VST3/AU.
- Standalone-only is less useful in real productions.
- More pressure to build recording/export workflow.

Decision questions:

- Is standalone enough for private alpha?
- Which audio interfaces must work first?

## VST3-Only MVP

Pros:

- Fastest path to real DAW use.
- Works directly on DI tracks.
- Validates commercial plugin workflow.

Cons:

- Harder to debug user audio device problems.
- Requires DAW scan/install support.
- No standalone jamming experience.

Decision questions:

- Is REAPER the first official test DAW?
- Do we need Ableton/Cubase/Studio One before paid beta?

## AU/macOS Later

Pros:

- Opens Logic/macOS market.
- More professional product expectation.

Cons:

- Requires Mac build machine.
- Requires Apple Developer Program, Developer ID signing, and notarization.
- More QA matrix complexity.

Decision questions:

- When do we get access to a Mac build machine?
- Is Logic support required for v1 or v1.5?

## AAX Later

Pros:

- Pro Tools support.
- Professional studio credibility.

Cons:

- More licensing and ecosystem friction.
- Not needed for first validation.

Decision questions:

- Are any early beta users asking for Pro Tools?
- Is AAX worth delaying other work?

## Neural Model Loader Path

Pros:

- Could support captured/model-like behavior later.
- Potentially good for advanced tone matching.

Cons:

- Much more research and QA.
- Dataset/legal complexity.
- Higher CPU risk.
- Easy to drift into false modeling claims.
- Not needed for first paid validation.

Decision questions:

- Do we have founder-owned training/capture material?
- What legal claims can we safely make?

## Traditional DSP Path

Pros:

- Fully original and controllable.
- Lower legal risk.
- Easier to optimize and automate.
- Better fit for current codebase.

Cons:

- More manual tone design.
- May take longer to reach specific nonlinear feel.

Decision questions:

- Which sound gaps remain after current DSP iteration?
- Which controls should be exposed first in the product UI?

