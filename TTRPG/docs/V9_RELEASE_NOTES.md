# Belavadós V9 — TownGeneratorOS depth pass

## Open the world
Open `index.html` in a modern desktop browser, or serve this folder with a local static HTTP server. The movable master navigation contains **only provinces**, with settlement dropdowns inside each province.

## Data and provenance
- Elarvess's original map, 1,312 clickable locations, and 2,016 authored NPCs are **unchanged**.
- All 162 other named settlements have distinct, clickable building polygons and TownGeneratorOS-inspired Voronoi district patches, city gates, streets, and a ward/citadel/plaza topology.
- Each generated building includes accessible indoor rooms, activities and owner/worker/visitor links. NPCs have homes, workplaces, biographies, recurring 6-day schedules, relationships, and an on-map travel simulation.
- Six-day Aza’raan calendar: **21 hours per day**, no invented weekday names. Old V8 24-hour schedule strings retain their source compatibility and are proportionally interpreted.
- Every V8 world file is retained; in particular `json/living_maps/` retains byte-identical original V8 JSON files. The enhanced V9 records are `js/living_maps/*.js`, encoded with GZIP and loaded on demand in browsers using DecompressionStream (no network fetch required).
- To export enhanced JSON: `python docs/export_v9_json.py` (requires Python 3). This exports 162 complete V9 settlement JSON files without mutating original V8 data.
- The attached TownGeneratorOS Haxe source is preserved at `assets/TownGeneratorOS-master-reference.zip`. Its GPL license and source remain in that archive. The V9 Python generator is an independent implementation of its city/ward/gate concepts, **not a compiled Haxe engine**.
- `docs/V9_FULL_INTEGRITY_AUDIT.json` contains the counts and 0 failures after a full cross-reference audit; `docs/source/` contains our generator and test scripts.

## Credits and limits
Source build based on the user-provided V8 package. Generated NPC biographies and social routines are synthetic worldbuilding records; they do not claim to be independently authored Elarvess-level narratives. The original steampunk wallpaper remains linked via the complete URL in active CSS. A signed third-party URL may expire independently of this code.

## Expected top-level structure
Only `index.html`, `js/`, `json/`, `css/`, `assets/`, and `docs/`.

## GitHub deployment
The assembled 200 MB-class ZIP is not automatically committed by the connected GitHub API, which lacks local bulk-file transfer. See `docs/GITHUB_DEPLOYMENT.md` for a safe, TTRPG-only deployment with GitHub Desktop or Git.
