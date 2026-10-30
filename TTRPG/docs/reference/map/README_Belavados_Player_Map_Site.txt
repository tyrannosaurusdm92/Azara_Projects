Belavadós Player Map + SVG-Only Hidden DM Settlement Editor

Main file:
  belavados_map_PLAYER.html

Player URL:
  https://tyrannosaurusdm92.github.io/BelavadosAlignmentQuiz/belavados_map_PLAYER.html

DM back-door URL:
  https://tyrannosaurusdm92.github.io/BelavadosAlignmentQuiz/belavados_map_PLAYER.html#dm-editor

How to publish on GitHub Pages:
  1. Upload every file and folder in this package to the BelavadosAlignmentQuiz repository root.
  2. Keep belavados_map_PLAYER.html at the root, not in a subfolder.
  3. Keep css/, js/, data/, docs/, and legacy/ beside it.
  4. Use the normal URL for players and the #dm-editor URL for your DM controls.
  5. When DM mode exports player_settlements.json or a player data bundle, place data/player_settlements.json beside the site files so GitHub players see those saved settlements.

Important current rules:
  - DM manual pin creation has been removed from the interface and from the active map script.
  - The DM map window accepts SVG files only.
  - HTML, JSON, ZIP, PNG, JPG/JPEG, WEBP, and other file imports are rejected for map upload.
  - SVGs must already contain blank clickable location targets, such as <a> elements, data-location/data-blank-location markers, or location/building/poi groups.
  - The parser reads those blank clickable SVG targets, autofills them with the location generator, keeps their SVG positions, and assigns NPCs as residents, workers, and visitors.

What is included:
  - Player page 1: province/settlement selector, live player/DM/Belavadós time, clickable SVG map/location drawer, and moving NPC dots.
  - Player page 2: button-free item search. Results only show locations that sell or provide the searched item.
  - Player page 3: full NPC list with gender identity, pronouns, relationships, family tree, household, residence, employment, schedule, movement profile, alignment, race, traits, and rumors.
  - DM page 1: SVG-only controls and preview. Upload clickable SVGs with blank locations; the generator autofills locations and assigns NPCs.
  - DM page 2: locations, 5% reroll, DM location name and inventory tweaking while retaining SVG positions.
  - DM page 3: NPC generation by race category/specific race, 5% reroll, family/social network rebuilding, and DM name/trait/rumor tweaking.
  - DM page 4: bulk SVG-only settlement importer that saves SVG-autofilled settlements to the player map.
  - Original uploaded versions are preserved in legacy/originals/ for reference.

NPC behavior model:
  - NPCs use gender-neutral relationship records and supported gender identity states.
  - Gender identity is stored as the authoritative identity field used by NPC descriptions and lists.
  - Each generated NPC can have familial, romantic, professional, and personal relationship layers at the same time.
  - Polyamorous, monogamous, separated, divorced, widowed, dating, engaged, and married structures are supported.
  - NPCs receive households, family trees, friends, rivals, work hierarchies, guild/community ties, traits, alignment axes, schedules, and autonomous movement profiles.
