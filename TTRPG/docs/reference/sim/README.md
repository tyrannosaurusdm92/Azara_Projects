# Life Simulator

This is the merged, generic Life Simulator package.

## Main entry point
Open `index.html`.

## What was merged
- Main NPC/living-world generator with settlement, province, and world scopes.
- Race cache and biome cache systems.
- Four-axis 0–3000 alignment engine, with a visible alignment-mode dropdown.
- Traditional D&D alignment dropdown with the nine classic alignment choices.
- Coordinate-preserving province/settlement data with source-world names replaced by generic Province/Settlement labels.
- Biome-aware location generator and editor.
- Imported NPC/location scanner for JSON, HTML, PDF, and DOCX workflows.
- Relationship/family-tree tracking.
- Map scanner/editor utilities, SVG tools, settlement/city/capital map builders, immersive location modules, and asset packager references.

## Source-world cleanup
Final-facing UI is named **Life Simulator**. The source-world/campaign branding was removed from titles, labels, seed defaults, visible helper text, and the main data packet. Reusable mechanics were preserved: races, bloodlines, biomes, coordinates, danger profiles, travel/transit rules, activity schedules, relationship categories, and alignment scoring.

The alignment dropdown intentionally includes **__REQUESTED_LIFE_SIMULATOR_AXIS_LABEL__ (0–3000)** as a mode name because you specifically requested that choice beside traditional D&D alignment.

## Not included
- Map Asset Helper/personality chatbot content was not merged into the main simulator UI.
- Font files from the family-tree project were intentionally excluded.
- Source-world lore/pantheon containers were neutralized or removed when they were not needed by the simulator mechanics.

## Output files
- `index.html` — final app.
- `data/` — cleaned reusable data.
- `life-simulator/` — main app CSS/JS.
- `tools/` — merged auxiliary builders, scanners, editors, and modules.
