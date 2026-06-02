# Thallbyssal Release Checklist

Use this checklist before any public beta, paid beta, or paid release.

## Legal And Brand

- [ ] Confirm final product name.
- [ ] Run human trademark/name clearance for the final name.
- [ ] Remove all competitor product names from customer-facing preset names.
- [ ] Remove all artist names from customer-facing preset names unless permission exists.
- [ ] Write EULA.
- [ ] Write privacy policy.
- [ ] Confirm JUCE license path for closed-source distribution.
- [ ] Confirm VST3 license obligations.

## Build Outputs

- [ ] Windows standalone app builds.
- [ ] Windows VST3 builds.
- [ ] Release build uses a short build path such as `D:\CodexBuilds\thallbyssal-native`.
- [ ] VST3 manifest generation is re-enabled or handled manually for release builds.
- [ ] VST3 installs into the expected VST3 folder.
- [ ] Standalone app launches without development tools.
- [ ] Product version is visible in the app and file metadata.
- [ ] Release artifact includes README/install instructions.

## Audio QA

- [ ] Test 44.1 kHz, 48 kHz, and 96 kHz where supported.
- [ ] Test 64, 128, 256, and 512 sample buffers.
- [ ] Test ASIO interface.
- [ ] Test WASAPI fallback.
- [ ] Test mono input.
- [ ] Test stereo output.
- [ ] Test mono output.
- [ ] Test user IR loading.
- [ ] Test factory cab when no IR is loaded.
- [ ] Test preset switching while audio is running.
- [ ] Test gate behavior on palm mutes and dead stops.
- [ ] Test input gain and auto input gain with quiet and hot DI files.

## DAW QA

- [ ] REAPER: plugin scans and opens.
- [ ] REAPER: audio passes through.
- [ ] REAPER: parameters automate.
- [ ] REAPER: preset load/save works.
- [ ] Ableton Live or another DAW: plugin scans and opens.
- [ ] Standalone: input/output selection works.
- [ ] Standalone: low-latency monitoring is usable.

## Packaging

- [ ] Decide zip vs installer for beta.
- [ ] Decide installer system for paid release.
- [ ] Sign Windows executable/installer or document beta unsigned status.
- [ ] Verify install/uninstall flow.
- [ ] Verify no build-only paths are required on customer machines.

## Store/Sales

- [ ] Pick sales platform.
- [ ] Create product page copy.
- [ ] Create screenshots.
- [ ] Create audio demos from original riffs.
- [ ] Prepare refund/support email.
- [ ] Prepare versioned changelog.
