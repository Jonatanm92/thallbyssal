# Reference Asset Policy

Date: 2026-06-03
Status: internal lab policy before tone-gap comparison

This policy governs local reference assets used around `AMP_SIM_LAB`. It does not approve DSP/core sound changes, preset tone changes, DI edits, dependency changes, lockfile changes, public claims, or any use of external artist or band material outside private listening direction.

No audio, DI, IR, cab, or external reference asset belongs in Git.

## A. Founder-Owned DI Files

Founder-owned DI files are dry guitar or bass recordings that the founder owns outright or has explicit rights to use for Thallbyssal lab work.

Allowed uses:

- Local lab validation and metrics.
- Local Thallbyssal renders after the founder confirms the exact file is allowed.
- Private beta or demo material only when the DI itself is founder-owned and the rendered result is also founder-approved.

Required handling:

- Keep real DI files local, preferably outside the repo under `D:\CodexBuilds\thallbyssal-lab\di-test-files`.
- Do not modify, normalize, trim, move, rename, overwrite, or delete original DI files.
- Do not commit DI audio files.
- Record exact allowed DI paths in `AMP_SIM_LAB/REFERENCE_ASSETS_MANIFEST.local.json`, which must remain local and ignored.

## B. Founder-Owned Same-DI Reference Renders

Founder-owned same-DI reference renders are local audio renders made from the same founder-owned DI material through a founder-approved external chain or prior Thallbyssal chain.

Allowed uses:

- Primary technical comparison for tone-gap work, because the input performance is controlled.
- Private listening checks against Thallbyssal renders made from the same approved DI.
- Internal notes about broad behavior such as attack, low-mid weight, fizz control, gate feel, chug response, and note separation.

Required handling:

- Keep renders local, preferably outside the repo under `D:\CodexBuilds\thallbyssal-lab\reference-renders`.
- Do not commit rendered audio.
- Do not treat a filename as proof of ownership or permission. The founder must confirm the exact allowed files before comparison.
- Do not turn reference render names into preset names, UI labels, demo names, marketing copy, or public claims.

## C. External Artist/Band Private Listening References

External artist or band material may be used only as private listening direction for the founder's ears.

Allowed uses:

- Private, manual listening by the founder to describe desired tone qualities in Thallbyssal-owned language.
- Internal, non-public notes that avoid copying riffs, songs, tones, marketing claims, presets, names, or branding.

Forbidden uses:

- Do not render external artist or band material through Thallbyssal.
- Do not analyze it as a direct target for automated tone matching.
- Do not place it in listening packs, demos, beta assets, presets, UI, public files, screenshots, marketing, release notes, or reports intended for external sharing.
- Do not commit it, copy it into repo folders, or derive public filenames from it.

## D. IR/Cab Files Ignored For Now

IR and cab files include audio-format impulse responses such as `.wav`, `.aif`, `.aiff`, and `.flac`, device or vendor formats such as `.ir` and `.syx`, and folders that appear to contain cabinet captures or IR packs.

Current status:

- IR/cab files are inventory-only for this branch.
- Do not load, audition, render, copy, bundle, normalize, convert, commit, or publish IR/cab files.
- Do not use `lab:ir:audition` or any IR-based comparison for the next tone-gap pass unless a later founder-approved policy explicitly allows it.
- Do not add IR/cab names to presets, UI, marketing, demos, beta assets, or public docs.

## E. Forbidden For Git/Public

The following are forbidden in Git and in public-facing material unless a later founder-approved policy explicitly changes the rule:

- DI audio files.
- Reference render audio files.
- External artist or band audio.
- IR/cab files and IR/cab folders.
- Audio files with `.wav`, `.aif`, `.aiff`, `.flac`, `.mp3`, or `.ogg` extensions.
- Device/vendor IR files such as `.ir`.
- Local manifests containing private paths or asset decisions.
- Listening packs or rendered comparison assets.
- Preset, UI, demo, beta, or marketing content that names or implies external artists, bands, songs, albums, products, amps, cabs, IR packs, or competitors as targets.

Before any tone-gap comparison, the founder must identify the exact allowed local DI files and exact allowed same-DI reference renders in the ignored local manifest.
