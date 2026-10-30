the source world Fantasy Map Scanner + Settlement Generator Assets This package has been upgraded from a scanner into a lightweight offline settlement generator. Core files:
- index.html: scanner UI, GeoJSON highlight controls, NPC/name generator panel, immersive generator buttons, export buttons.
- styles.css: responsive dark fantasy/steampunk scanner styling.
- app.js: map image scanning, border drawing/import, GeoJSON highlighting, location inspection, NPC attachment, immersive location generation, current visitors, rumors, secrets, economy, deity pressure, weather behavior, unease markers, relationship links, and export logic.
- name_generator.js: race, gender identity, pronoun, creator deity, and name generation asset.
- name_generator.html: optional standalone/embed panel. New generator actions:
- Generate selected location: enriches the selected GeoJSON highlight with services, routine, current activity, sensory atmosphere, public knowledge, DM knowledge, rumors, secrets, economic flow, divine pressure, weather behavior, conflict web, unease markers, and event hooks.
- Generate all locations: performs that enrichment across every imported GeoJSON highlight.
- Refresh current visitors: recalculates current activity and visitors from the live browser clock and attached NPC/location data.
- Export full settlement generator JSON: exports scanner data, GeoJSON, NPCs, generated immersive locations, terrain results, image metadata, and runtime notes.
- Export interactive HTML: creates a self-contained interactive settlement HTML viewer with clickable GeoJSON polygons and generated panels for services, NPCs, visitors, rumors, secrets, deity pressure, economy, conflicts, and event hooks. Workflow:
1. Load a settlement map image.
2. Import highlightable GeoJSON, border JSON, or draw borders manually.
3. Generate NPCs from the embedded name generator.
4. Attach NPCs to a selected location or distribute them across all locations.
5. Generate immersive data for selected or all locations.
6. Refresh current visitors as time passes.
7. Export JSON, GeoJSON, overlay PNG, or interactive HTML. Notes: Overlay naming rule:
GeoJSON overlay markers are never named directly on the map image. The marker may be hovered or clicked, but the location name and all immersive details appear only in the immersive location inspector or exported settlement detail panel after selection. This keeps the image intact and prevents overlay text from replacing, cluttering, or becoming part of the map art. GeoJSON remains geometry-focused. The generated settlement data is stored in feature properties and exported as a full package. Building ids and GeoJSON ids should remain stable so NPCs, residents, workers, visitors, relationships, rumors, and location panels stay linked to the correct highlighted areas. the source world lore expansion added in this build
-------------------------------------------
This package preserves the existing scanner files and expands them with the source world canon data rather than removing or replacing prior functionality. New files:
- source_world_lore_data.js: browser-loaded lore corpus used by the scanner.
- source_world_lore_assets/source_world_lore_corpus.json: complete exported corpus as JSON.
- source_world_lore_assets/*.txt: full extracted text from the uploaded alignment guide, lore document, pantheon PDF, unified campaign summary PDF, time conversion guide, and night sky document. Expanded behavior:
- The scanner now loads the source worldLoreData before app.js.
- Generated locations receive loreExpansion, source_worldTime, pantheonHook, alignment axes, night-sky hooks, death-ledger/ichor pressure, and infrastructure hooks.
- NPCs attached to locations receive loreProfile data that connects race/creator-god information to the imported pantheon.
- Export JSON and full settlement package exports include loreCorpus and live the source world time data.
- Interactive settlement HTML exports now display the source world lore and the source world time sections for clicked locations.
- A new Canon Lore Expansion panel lets the DM apply lore to all locations, export the lore corpus JSON, and search the imported corpus directly in the scanner. Nothing from the previous scanner was intentionally removed. The old map loading, borders, GeoJSON highlighting, terrain scanning, NPC name generation, NPC attachment, immersive location generation, visitors, exports, and HTML export workflow remain present. 2026-06-03 JSON-driven settlement generator revision
- Added Settlement source JSON upload beside the existing map and border import tools.
- Added Auto-fill full settlement from JSON button.
- Settlement JSON is now normalized into a scanner profile and used as the source of truth for: - settlement name - province name - settlement type - target visitable location count - target named NPC count - racial demographics used by name generation - government type - danger and threat profile - intrigue, rumors, plot hooks, and secrets - citizen preferred alignment axes and visitor expectations - settlement tags, religions, economy, geography, climate, culture, wealth, and importance
- Built-in settlement type targets: - Capital City: about 1,312 visitable locations and 3,588 named NPCs - City: about 1,000 visitable locations and 2,700 named NPCs - Town: about 220 visitable locations and 600 named NPCs - Village: about 60 visitable locations and 160 named NPCs
- If imported GeoJSON locations are below the target count, the scanner auto-generates additional highlightable visitable location polygons inside the selected border when possible.
- Auto-generated locations inherit settlement JSON context and receive immersive services, operating hours, routines, sensory details, economic flow, divine pressure, lore hooks, danger, rumor hooks, secrets, visitor alignment expectations, and current activity.
- Named NPCs are generated from JSON racial demographics, assigned to locations, and enriched with gender identities, pronouns, schedules, public knowledge, private life pressure, relationships, intrigue links, workplace/residence context, race lore, and visitor logic.
- Exports now include the normalized settlementProfile and generationTargets alongside terrain results, GeoJSON features, immersive locations, NPC index, lore corpus, and the source world time data.