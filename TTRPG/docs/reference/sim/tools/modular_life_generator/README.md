# Life Simulator Generator Package

Open `life_generator.html` in a browser. It uses separate CSS, JavaScript, vendor, and data files.

## Included

- `life_generator.html` — main HTML file; no index-named HTML.
- `css/life_generator.css` — visual styling.
- `js/life_generator_app.js` — UI wiring and persistence.
- `js/generator_core.js` — location, NPC, relationship, schedule, travel, alignment, and GeoJSON generation.
- `js/importers.js` — JSON, GeoJSON, HTML, DOCX, PDF, and image import scanning.
- `js/exporters.js` — JSON, GeoJSON, HTML, DOCX, and ZIP export.
- `js/data/*` — race dropdown data, settlement assignments, time model, location catalog, and generation rules.
- `js/vendor/jszip.min.js` — ZIP and DOCX support.

## Notes

DOCX import and DOCX/ZIP export use the bundled JSZip library. PDF import includes a lightweight text extraction fallback; scanned PDFs or heavily compressed PDFs may import as source files but produce limited scanned text. For best generator scanning, use JSON, DOCX, or HTML.

Generated data persists in browser storage until cleared. Export `data/full_restore_state.json` from a ZIP package and import it later to restore all NPCs, locations, schedules, relationships, travel records, and GeoJSON without regeneration.
