# Belavadós V8 — Individually generated living settlements

## Base and preservation

The starting application is **Belavados_V7.zip**. It is NOT the earlier 58,287-building "living streets" package. **Elarvess (Aelvanyr)** remains the reference implementation: its original 1920 × 1920 PNG, 1,312 clickable aligned GeoJSON-derived footprints, 1,312 canonical location names, and 2,016 authored six-day NPC profiles are preserved. The original V7 bundled NPC roster (2,909 across 163 named settlements) and settlement catalogs are not overwritten. The original steampunk background URL remains in `css/steampunk-background.css` and `index.html`.

## TownGeneratorOS reference

The user-provided `TownGeneratorOS-master(1).zip` is Haxe source for the open-source Watabou Medieval Fantasy City Generator. Its ward/patch/Voronoi structure informed the procedural *design* of the other maps, but **its Haxe program is not compiled or executed in this build**. Our reproducible Python generator produces original cartographic layouts using Shapely Voronoi districts/blocks, inset building footprint partitions and connected streets. Source archive is retained, unmodified, under `docs/vendor/towngenerator/TownGeneratorOS-master/`, with original GPL license and README. This is not a claim that the generated streets equal exports from the linked Fantasy Town Generator site. Elarvess geometry is never run through this procedural generator.

## What each generated settlement contains

- Unique deterministic urban boundary, districts/wards, connected road space and terrain variations informed by source biome, city size and settlement ID.
- Individually named click-target footprints with persistent numeric IDs, address, ward, building material, function, interior room descriptions, business details and source-location aliases.
- Full mapping of *every* location name referenced by the original NPC homes, workplaces and schedules; names from the V7 biome location library and actual priced goods/services vendors are also mapped into buildings. The user's original text is kept as `sourceAliases` and `sourceLocation` rather than rewritten.
- Every original V7 NPC is represented in its own generated settlement map with home, workplace and six-day route reference IDs. The original JSON and JS are unchanged.
- Additional generated residents, with approved species only, identities/pronouns, households, professions, aspirations, person-to-person reciprocal relationships, six-day schedules, addresses, community contacts and new NPC biographies. Original V7 romantic and familial relationships remain untouched; supplementary friendships and professional contacts are added **only to the generated map overlay**.
- Click or search the map by building or person. Inspect interior features, current occupants, workers, residents, visitors and priced merchandise. Select a person to see work, home, relationships and day-by-day schedule. The Aza'raan campaign clock drives positions and transitions, with animated progress between sequential destinations.

**Important distinction:** Elarvess's 2,016 richly authored NPCs and 1,312 hand-aligned footprints are not reproduced identically in every city. Other settlements have their own procedural footprints, additional generated casts, preserved V7 characters and individually grounded businesses; their supplementary biographies and relationships are generated from templates. The map shows travel between linked destinations, not a complete physics/pathfinding simulation or hand-drawn interiors. Do not treat generated supplementary details as preexisting author canon.

## Runtime

`index.html` is the **only HTML entry point**. `js/living_world_maps.js` lazily loads `js/living_maps/<settlement-id>.js` on settlement selection and adds a map + inspection UI above the existing V7 province/settlement tools. This also works on file:// because no fetch is required. The equivalent editable JSON source is in `json/living_maps/`. Elarvess still loads from `js/elarvess_buildings.js` and `js/elarvess_population_data.js`, with its old inspector and original raster map. The province navigation is movable/collapsible and lists provinces only; settlement selection stays on the province page.

The existing V7 location selector, resident selector, main Residents tab and the NPC detail window now use the current generated map data when that map is loaded, including supplementary residents. Preserved original NPCs remain editable in existing simulator tools. Building and NPC detail panel exports the full current living map JSON.

## Build and checks

- `docs/build_living_maps.py`: re-generates 162 maps and source aliases, 6-day NPC schedules, wall and building geometry; **do not run casually** because new map assignments would be regenerated.
- `docs/augment_living_cast.py`: supplements identities, biographies and reciprocal cross-cast ties in those generated maps.
- `docs/validate_living_maps.py`: confirms unique map geometry, named settlement coverage, all original per-settlement NPC IDs, all goods/catalog entries, zero orphan schedule/building/NPC references, approved race compatibility and exactly one HTML entry point.
- `docs/V8_AUDIT.json`: actual generated data counts and test results. A Chromium browser interactive test was attempted but browser navigation was blocked by an administrator policy even on local HTTP, so a successful end-to-end browser run is **not claimed**.

### Source integrity

Original sources are kept in place; only `index.html`, `js/world_app.js`, `js/template_dashboard.js` were edited to integrate new map data, plus new files under `js/living_maps/`, `js/living_world_maps.js`, `css/living-world-maps.css`, `json/living_maps/` and `docs/`. The species registry still has 16 approved species and six mixed heritage options.
