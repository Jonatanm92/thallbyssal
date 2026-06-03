# Reference Asset Inventory

Date: 2026-06-03
Status: shallow local inventory only

This inventory checked filenames, folder names, file extensions, and shallow counts only. No audio was played, opened, analyzed, copied, moved, renamed, deleted, rendered through Thallbyssal, or committed.

## Folders Checked

| Folder | Status | Shallow finding | Inventory classification |
| --- | --- | --- | --- |
| `D:\CodexBuilds\thallbyssal-lab\reference-renders` | Found | 5 top-level `.wav` files | Likely founder-owned same-DI reference renders, pending founder confirmation |
| `D:\CodexBuilds\thallbyssal-lab\references` | Missing | Not present | No external/private reference files found here |
| `D:\CodexBuilds\thallbyssal-lab\reference` | Missing | Not present | No external/private reference files found here |
| `D:\CodexBuilds\thallbyssal-lab\di-test-files` | Found | 4 top-level `.wav` files | Likely founder-owned DI files, pending founder confirmation |
| `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB\di-test-files` | Found | `.gitkeep` only | Repo placeholder, no local audio committed |
| `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB\reference-renders` | Missing | Not present | Repo reference folder absent |
| `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB\references` | Missing | Not present | Repo reference folder absent |
| `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB\reference` | Missing | Not present | Repo reference folder absent |
| `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB\renders` | Found | Existing generated-output placeholder folder | Not a reference asset folder for this policy |
| `C:\Users\grise\Documents\youtubekanal-gitarr covers\guitar-workflow-toolkit\AMP_SIM_LAB\test-harness\render-hook` | Found | Source/test harness folder | Not an asset folder |
| `D:\CodexBuilds\thallbyssal-lab\founder-assets\irs` | Found | 3 immediate subfolders and 33 top-level files: 31 `.wav`, 1 `.ir`, 1 `.syx` | Likely IR/cab assets; ignored for now |

## Likely Founder-Owned DI Files Found

Found in `D:\CodexBuilds\thallbyssal-lab\di-test-files`:

- `DI Boostalizer.wav`
- `LOW TUNED CHUGS.wav`
- `noise.wav`
- `PICK ATTACK.wav`

These are likely founder-owned DI test files based on location and existing lab manifest aliases, but the founder must confirm exact allowed status before tone-gap work.

## Likely Founder-Owned Reference Renders Found

Found in `D:\CodexBuilds\thallbyssal-lab\reference-renders`:

- 5 top-level `.wav` files.

These are likely founder-owned reference renders based on location. Exact filenames are intentionally not copied into this committed inventory because reference-render names can contain private product, artist, or tone-chain descriptors. The founder should record exact approved paths only in the ignored local manifest.

## Likely External Artist/Band Reference Files Found

No likely external artist or band source-audio references were found in the checked private listening reference folders because:

- `D:\CodexBuilds\thallbyssal-lab\references` was missing.
- `D:\CodexBuilds\thallbyssal-lab\reference` was missing.
- No repo `AMP_SIM_LAB\references` or `AMP_SIM_LAB\reference` folder was present.

If external artist or band references are added later, they must remain private listening direction only and must not be rendered through Thallbyssal or committed.

## Likely IR Files/Folders Found And Ignored

Likely IR/cab assets were found at `D:\CodexBuilds\thallbyssal-lab\founder-assets\irs`.

Shallow summary:

- Immediate subfolders: 3
- Top-level files: 31 `.wav`, 1 `.ir`, 1 `.syx`

These IR/cab assets were not opened, rendered, copied, committed, or approved for use. They are ignored for now until a later founder-approved IR/cab policy explicitly allows a workflow.

## No Audio Committed Confirmation

This branch is docs/config/template only. No `.wav`, `.aif`, `.aiff`, `.flac`, `.mp3`, `.ogg`, `.ir`, `.syx`, DI, reference render, external reference, or IR/cab asset should be staged or committed.

## Next Recommended Action

The founder should copy `AMP_SIM_LAB/REFERENCE_ASSETS_MANIFEST.local.example.json` to `AMP_SIM_LAB/REFERENCE_ASSETS_MANIFEST.local.json`, keep that local file ignored, and fill in only the exact founder-approved DI files and exact founder-approved same-DI reference renders allowed for the next tone-gap comparison.
