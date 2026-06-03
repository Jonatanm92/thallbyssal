# Tone Reference Strategy

Date: 2026-06-03
Status: internal strategy before tone-gap comparison

This strategy defines how reference assets may be used for the next Thallbyssal tone-gap pass. It does not approve DSP/core sound changes, preset tone changes, DI edits, dependency changes, lockfile changes, IR/cab use, public claims, or any render of external artist or band material.

## Primary Technical Comparison

The primary technical comparison should use:

- Founder-owned dry DI files.
- Founder-owned reference renders made from the same DI performance.
- Thallbyssal renders made from that same founder-owned DI after the exact DI and reference render files are approved.

Same-DI comparison is the safest technical loop because pick attack, timing, muting, tuning, and performance dynamics are controlled. Comparison notes should describe Thallbyssal-owned behavior such as tightness, low-mid weight, high-end control, gate feel, chug response, sustain, clarity, and mix readiness.

## External Artist/Band Material

External artist or band material is private tonal inspiration only.

It must not be:

- Rendered through Thallbyssal.
- Used as an automated tone-match target.
- Copied into repo folders.
- Added to listening packs, demos, beta assets, presets, UI, marketing, screenshots, release notes, or public files.
- Used to create public claims that Thallbyssal sounds like, models, clones, recreates, replaces, or improves on any artist, band, song, album, product, amp, cab, IR pack, plugin, or competitor.

## Marketing And Beta Demos

Marketing and beta demos must use founder-owned DI and founder-owned or founder-approved renders only.

Before any demo or beta asset is prepared:

- Confirm the DI file is founder-owned or explicitly licensed.
- Confirm the render was made from an allowed DI.
- Confirm the output contains no external artist or band material, no copyrighted riffs, no private client/session material, and no proprietary IR/cab asset.
- Confirm public names and copy use Thallbyssal-owned language rather than artist, band, product, amp, cab, IR, plugin, or competitor names.

## IR/Cab Status

IR/cab files are ignored until a later founder-approved policy explicitly allows them.

The next tone-gap comparison must not use IR/cab folders, IR audio files, `.ir` files, `.syx` files, IR audition packs, or IR-derived preset changes. Existing IR/cab folders may be inventoried at folder-summary level only.

## Gate For Next Tone-Gap Comparison

The next tone-gap comparison requires exact allowed reference files before any listening pack, render, report, or comparison work begins.

Required local setup:

1. Copy `AMP_SIM_LAB/REFERENCE_ASSETS_MANIFEST.local.example.json` to `AMP_SIM_LAB/REFERENCE_ASSETS_MANIFEST.local.json`.
2. Keep `AMP_SIM_LAB/REFERENCE_ASSETS_MANIFEST.local.json` local and ignored.
3. Fill `founderOwnedDiFiles` with exact founder-approved DI paths.
4. Fill `founderOwnedReferenceRenders` with exact founder-approved same-DI render paths.
5. Keep `privateListeningReferences` as private listening direction only, never as render inputs.
6. List IR/cab folders under `ignoredIrFolders` only if they are present, with no approval to use them.

No tone-gap comparison should start until the founder confirms the exact allowed DI and same-DI reference render pairings.
