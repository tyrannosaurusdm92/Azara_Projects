# TTRPG entry points and completed Onyx worldbuilding knowledge import

## Required HTML structure

- `TTRPG/ttrpg.html`: only root-level HTML document. Hosts the unchanged Onyx widget and loads `assets/code/index.html` in `belavadosProfileFrame`.
- `TTRPG/assets/code/index.html`: only other HTML document. Includes the Generator starting page plus direct embedded province and settlement navigation.
- The former `assets/code/settlements.html` and `assets/code/settlements-embed-fragment.html` were removed from the active tree and archived **verbatim** as JSON strings at `json/archive/merged-settlement-html-originals.json`.

## Runtime entry and dependency audit

- Root iframe: `assets/code/index.html`.
- Main document has 227 unique static HTML IDs (no duplicates in checked GitHub revision).
- All 35 local script/stylesheet dependencies referenced by `assets/code/index.html` were found in the same TTRPG tree.
- All root `ttrpg.html` local script, stylesheet, image, and embedded document references were found.
- Onyx Work knowledge bridge loads under `ttrpg.html`, so `fetch('json/onyx/...')` resolves relative to the TTRPG root.
- The `BelavadosTTRPG` JavaScript bridge continues to use the same-origin `belavadosProfileFrame`.
- Root `manifest.webmanifest` and `belavados-service-worker.js` are retained because the installable PWA uses them. Neither is an HTML file or an extra directory.
- No UI panels, HTML entry points, external backend, or authentication mechanisms were added in the Onyx knowledge import.

## Onyx Worldbuilding knowledge

Source: `tyrannosaurusdm92/LifeHelpers/tree/main/Onyx`. Source Git commit for the existing indexed worldbuilding files: `fea7d5ee5d5f7e02a6ad6439594911f95fc64aa7`.

- The original 225 worldbuilding JS source paths are fully represented as inert source text in 16 packs (five prior archives plus 11 new completion packs).
- Another 165 adjacent source texts are in 10 targeted packs, including 93 language-history reference documents, 15 VTT map sources, 16 simulation sources, 9 language sources, 18 writing sources, 10 game-design sources, and 4 3D-modeling sources.
- Total: **26 JSON packs**, **411 entries**, **408 unique source paths** including previously archived related-domain references.
- The 186 worldbuilding completion entries and 165 adjacent entries were fetched from the pinned LifeHelpers source Git revisions and compared to source file Git blob SHA values. No mismatches were found.
- Files stay as strings in JSON; they are never evaluated, injected as scripts, or used to replace local canonical settlement, NPC, map, or province records.
- The existing Onyx Work mode retrieves cited source fragments with the `BelavadosOnyxKnowledge` API. It does not become a separate UI or a remote AI backend.

## Preserving authored world data

- No V9 living settlement data blobs, 163-map structure, Elarvess image/GeoJSON alignment, authored NPCs, relationships, schedule records, or province list were edited in this cleanup.
- The current map/depth integration remains as it was before this audit.
- Static file path and SHA verification do **not** constitute a live automated browser test of every map or PWA install state.

## Folder policy

The root keeps only the existing `assets/`, `css/`, `docs/`, `js/`, and `json/` folders. Existing PWA support files `manifest.webmanifest` and `belavados-service-worker.js` remain at the root with `ttrpg.html`. No new root directories were created.
