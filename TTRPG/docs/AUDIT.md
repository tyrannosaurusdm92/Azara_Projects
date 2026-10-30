# Integration audit — 2026-10-29

- Source inputs: three attached ZIPs; approved race canonical roster from the linked Google Drive folder.
- Consolidated entry: `index.html` only (one `.html` file in the entire final extracted output, including archives).
- Top-level roots: `index.html`, `js/`, `json/`, `css/`, `assets/`, `docs/`.
- Named provinces: 28. Named settlements: 163 (Valerune has none in map source).
- All 52 immersive HTML modules are represented by independent templates with service/inventory tables in `json/immersive_settlement_templates.json` and loaded on the matching settlement page.
- Seed NPCs: 2,909; ID uniqueness, settlement binding, reciprocal graph edges and daily schedules verified.
- Species: 16; mixed heritages: 6; no legacy selectable races.
- Old world spelling corrected in text source and referenced OOXML documents.
- Original sim tools still integrated in the province's internal Tools page; old standalone utility layouts archived as JSON reference markup, not claimed fully wired.
- Offline local file support from `js/default_data.js` and `js/world_bundle.js`.
- Browser smoke test: Chromium via inline HTML/script loading (direct URL blocked in testing environment), 28 province buttons, 10 Aelvanyr settlement dropdown entries, 16 species options in species category, resident cards, 4 relationship categories, 7 schedule rows, interactive source tables, original generator tools visible, zero JavaScript exceptions.
- All edits confined to the generated output directory; attachments and Google Drive folder unchanged.
