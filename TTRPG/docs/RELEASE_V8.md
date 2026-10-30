# Belavadós V8 release notes

This build replaces the **incorrect earlier generic building assignment approach** and starts afresh from the user-provided **Belavados_V7.zip**, using the author's Elarvess implementation as the required reference.

- 163 named settlements: 1 untouched original Elarvess + 162 distinct procedural living maps.
- One `index.html`. Top-level structure remains `index.html`, `js/`, `json/`, `css/`, `assets/`, `docs/`.
- Unique district/ward layouts, streets and individual clickable building polygons per settlement.
- Connected home, work, schedules, on-map NPC positions, visitable catalogues and buildings, plus supplemental people that use only the approved species.
- Source aliases and original V7 records persist. Source wallpaper URL unchanged.
- Generator source files are included under docs/vendor for transparency and license preservation. Original Haxe was not executed.
- Browser end-to-end QA was blocked by container browser policy; static syntax, link and geometry QA is documented in V8_AUDIT.json.
