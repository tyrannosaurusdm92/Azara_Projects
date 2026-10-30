# the source world Living Map Player + Hidden DM Generator Main file: `source_world_map_PLAYER.html` Extensionless helper: `source_world_map_PLAYER` DM route: `source_world_map_PLAYER.html#dm-editor` This README merges the project README files, OpenTS2 adaptation notes, source-file list, and test reports into one GitHub-ready reference for the the source world player map and hidden DM generator package. ## What this package is This package is a static GitHub Pages site for the the source world living settlement system. The default URL opens a player-facing map/landing page, while the full DM editor and generator tools are hidden behind the `#dm-editor` hash. The project combines: - a player-facing living map entry page;
- a hidden DM editor route;
- settlement generation;
- NPC generation with identities, schedules, homes, jobs, relationships, and family trees;
- location generation with inventories, services, employees, residents, and visitors;
- OpenTS2-style browser-safe NPC life-simulatorulation behavior;
- import/export tools;
- settlement ZIP export;
- state and diagnostic tools. ## GitHub Pages entry paths Use these paths after uploading the files to GitHub Pages: - `source_world_map_PLAYER.html` opens the player-facing landing page.
- `source_world_map_PLAYER.html#dm-editor` opens the hidden DM editor.
- `source_world_map_PLAYER#dm-editor` uses the extensionless helper and redirects to `source_world_map_PLAYER.html#dm-editor`.
- `source_world_map_PLAYER` without the DM hash redirects to the player landing page. ## Folder layout The current GitHub asset layout uses a `generator/` folder directly under the project root. Do not use a separate `assets/` folder for these files. ```text
source_world_map_PLAYER.html
source_world_map_PLAYER
README.md
generator/ site.css core.js data-bundle.js dm-page.js family-page.js location-page.js main-page.js npc-page.js opents2-life-simulator.js render.js simulation.js structured-npc-location-system.js
licenses/ OpenTS2-MPL-2.0.txt
``` If you keep modular JSON data outside `data-bundle.js`, place it in a `data/` folder and make sure the JavaScript references match your final repository layout. ## Player side The default player page is the public-facing map and settlement browser. Normal players should not see generator controls, uploaders, import/export buttons, ZIP tools, raw JSON tools, diagnostics, or DM-only builders. The player side is intended for: - viewing the clickable map;
- selecting a province and settlement;
- reading public settlement information;
- viewing location details that the DM has saved to the player map;
- searching player-visible locations/items when enabled by the saved player data. ## DM side behind `#dm-editor` Opening `source_world_map_PLAYER.html#dm-editor` unlocks the DM tools. The DM editor includes: - SVG upload for the clickable map;
- JSON import and export;
- HTML, DOCX, TXT, and JSON artifact/lore import;
- NPC generator with race/bloodline, gender identity, pronouns, alignment, traits, personality, hobbies, family trees, relationships, schedules, homes, jobs, work trips, vacations, public transit, motives, and autonomy;
- location generator with categories, inventories, services, employees, residents, visitors, and item search;
- family tree and household directory;
- racial behavior compendium browser;
- DM screen tools;
- **Save to Player Map** for committing DM-created public data to the player landing page;
- settlement ZIP export containing HTML, DOCX, JSON, GeoJSON, and manifest files;
- raw JSON editor;
- diagnostics;
- state loader HTML export;
- regenerate-from-saved-settings controls;
- browser-state clearing tools. The hash gate is a user-interface gate, not a security boundary. Anyone who can inspect the file source can see embedded JavaScript/data, but normal player navigation does not show the DM tools. ## Three-page generator workflow ### Page 1: Map + settlement The first generator page is the settlement/map hub. It includes: - clickable living SVG map;
- settlement information and editing controls;
- province selector;
- settlement selector;
- settlement type and biome controls;
- government and tags;
- target location count;
- target NPC count;
- seed field;
- SVG upload restricted to SVG files;
- generated JSON import/export;
- live stats;
- live time/clock display;
- selected location panel;
- selected NPC panel;
- active NPC movement board. ### Page 2: NPC generation The second generator page focuses on generated people. NPCs can include: - name;
- race/bloodline;
- gender identity and pronouns;
- alignment data;
- traits;
- personality;
- hobbies;
- household;
- family tree fields;
- familial, romantic, professional, and personal relationship records;
- home assignment;
- job/workplace assignment;
- coded daily schedule;
- meals, sleep, work, home, transit, social, community, date, library, errand, temple, personal, and professional blocks;
- work-trip plans;
- vacation plans;
- current map movement status. Page 2 reads existing state from Page 1, so generated settlements, locations, and NPCs can stay connected while switching pages. ### Page 3: Location generation The third generator page focuses on visitable places. Locations can include: - category;
- role metadata;
- inventory and services;
- residents;
- employees;
- scheduled visitors;
- staffing roles;
- visit-purpose hooks;
- item search support;
- the source world structural metadata;
- reassignment support for already-created NPCs. Existing NPCs can be reassigned to newly generated locations without losing their identities, homes, jobs, relationships, or family-tree links. ## Extra support pages/tools Additional support tools may remain available behind the DM route, including: - family tree directory;
- raw state editor;
- lore/import tools;
- race behavior browser;
- export tools;
- diagnostics. These are support pages for the generator workflow. The first three generator pages remain the main workflow: map/settlement, NPC generation, and location generation. ## OpenTS2 life-simulator adapter The package includes `generator/opents2-life-simulator.js`, a browser-safe JavaScript adaptation of compatible OpenTS2 simulation concepts. OpenTS2 is a Unity/C# reimplementation project, so this site uses adapted static-site JavaScript behavior rather than a direct Unity port. Mapped concepts include: - simulator tick behavior as a browser update loop and throttled autosave;
- SimAntics-style entity state containers;
- deterministic seeded decisions using the generator seed and NPC id;
- motive-driven autonomous actions;
- relationship tables with short-term, long-term, chemistry, and daily status;
- motive/person data for hunger, energy, social, fun, comfort, hygiene, bladder, ambition, aspiration, skills, interests, wants, fears, and memories. Implemented behavior includes: - motive bars;
- aspiration score;
- wants and fears;
- memories;
- skills and interests;
- personality points;
- autonomous NPC choices that can interrupt normal schedules when motives drop;
- VM-style entity IDs, object data, thread state, and interaction queues;
- short-term and long-term relationship scores;
- advertised interactions on locations;
- smoother map movement and transit interpolation. The adapter does not require Unity, DBPF resources, Life Simulator 2 assets, or server-side code. It works locally and on GitHub Pages as part of the static site. The OpenTS2 MPL 2.0 license text should remain in `licenses/OpenTS2-MPL-2.0.txt`. ## Structured the source world compendium layer The package includes structured the source world data hooks through `generator/structured-npc-location-system.js` and bundled data. Structured features include: - race/bloodline dropdown data;
- race profile details attached to generated NPCs;
- creator god and pantheon influence hooks;
- typical alignment tendencies;
- habitat and biome context;
- table ability and DM hook metadata;
- four-axis the source world alignment phases for Altruism, Lawfulness, Cooperation, and Honor;
- visible family-tree metadata;
- household links;
- relationship buckets;
- schedule coverage flags;
- location roles;
- staffing roles;
- visit purposes;
- province UTC labels;
- civic hooks;
- Earth-first and the source world-second time conversion;
- work trips, vacations, dates, libraries, meals, temple/community rites, public transit, errands, and local movement scenarios. ## Export naming rules Settlement ZIP export follows the requested filename normalization: - accents are swapped for regular letters;
- apostrophes are removed;
- dashes are removed;
- the second space-separated settlement/province name is omitted for file naming;
- special handling is included for `El'dravire Riverrealm -> Eldravir`. Examples: - `El'dravire Riverrealm` becomes `Eldravir`.
- `Lun’tharavé` becomes `Luntharave`.
- `Thyravéa-Morn` becomes `ThyraveaMorn`. ## Testing summary Two test reports were merged into this README. ### Full merge static checks The full merge test confirmed: - main HTML exists;
- extensionless helper exists;
- player landing default view is present;
- DM editor is hidden on load;
- hash-gate routing is present;
- DM navigation pages are present;
- upload tools are behind the DM route;
- ZIP export is present;
- Save to Player Map is present;
- raw JSON tools were restored;
- player landing template decodes successfully;
- player landing has no file inputs;
- player landing has no DM hash link;
- OpenTS2 license is included. ### In-depth generator checks The in-depth generator test reported: - total checks: **69**;
- passed: **69**;
- failed: **0**. Static validation confirmed that JSON data parsed correctly, HTML asset references pointed to existing files, and JavaScript passed syntax validation. Browser workflow testing confirmed: - Page 1 loads as map/settlement;
- Page 1 includes settlement controls, SVG upload, JSON import/export, live clock, selected panels, and movement board;
- full settlement generation created 45 locations and 80 NPCs in the test run;
- NPC generation created 28 households in the test run;
- the map rendered 80 NPC movement tokens;
- all generated NPCs had valid homes and work locations;
- NPC schedules included sleep, home, work, meal, and transit blocks;
- personal/professional scenarios were generated for all tested NPCs;
- family-tree fields existed on generated NPCs;
- the relationship network generated 858 relationship records in the test run;
- work trips and vacations were generated;
- locations received resident, employee, and visitor links;
- SVG upload scanned clickable regions;
- SVG sanitizer stripped scripts and inline event handlers;
- SVG upload auto-filled locations;
- Page 2 loaded generated NPC cards from shared state;
- Page 3 loaded generated location cards from shared state;
- Page 3 reassignment preserved valid homes, jobs, and visitor schedule links;
- no important browser page exceptions, console errors, or warnings were observed in the in-browser test. ## Fixes included from testing Testing notes confirmed these improvements: - navigation/page purposes were renamed so the three-page workflow is clear;
- NPC generation controls were added directly to Page 2;
- location generation and existing-NPC assignment controls were added directly to Page 3;
- `B.assignExistingNpcsToLocations()` was added so NPCs can be reassigned without losing identity or family relationships;
- transit interpolation was fixed so movement uses correct start-to-end math;
- personal schedule blocks were fixed so stored location IDs and names match;
- date-location matching recognizes both `theatre` and `theater`. ## Source files used The merged project was built from these source inputs: - `source_world_npc_generator_OpenTS2_life_sim_site.zip`
- `source_world_living_location_npc_generator_site.zip`
- `source_world_race_category_dropdown_complete_package.zip`
- `source_world_structured_living_npc_location_site.zip`
- `source_world_player_landing_dm_hash_merged_site.zip`
- `the source world_DnD_Races_Alignment_Pantheon_Compendium (1).docx`
- `the source world Alignment Full Guide.docx`
- `the source world Lore.docx`
- `the source world_Night_Sky_Time_Conversion.docx`
- `the source world_Simplified_Time_Conversion_Guide (1).docx`
- `OpenTS2-master.zip` ## Local use 1. Download or clone the repository.
2. Keep `source_world_map_PLAYER.html`, `source_world_map_PLAYER`, and the `generator/` folder together.
3. Open `source_world_map_PLAYER.html` for the player page.
4. Open `source_world_map_PLAYER.html#dm-editor` for DM tools.
5. Generate or import settlement data.
6. Use Save to Player Map when public-facing data should be committed.
7. Export JSON or settlement ZIPs when you want backups or portable settlement packages. ## GitHub Pages use 1. Upload `source_world_map_PLAYER.html` to the repository root.
2. Upload the extensionless `source_world_map_PLAYER` helper to the repository root.
3. Upload the `generator/` folder to the repository root.
4. Upload `licenses/OpenTS2-MPL-2.0.txt`.
5. Enable GitHub Pages for the repository.
6. Use the player URL normally.
7. Add `#dm-editor` to the URL when you need the DM tools. ## Important notes - The project intentionally avoids a separate legacy folder.
- The current asset folder is `generator/`, not `assets/`.
- The hidden DM editor is not a security boundary.
- Keep the OpenTS2 MPL 2.0 license file with the project.
- The final site keeps the main file named `source_world_map_PLAYER.html`.