# Belavadós V10 settlement and Onyx Work knowledge audit

## Scope

- Only `Azara_Projects/TTRPG` updated on `main`. No additional root directories, HTML entry pages, backend or new Onyx panels.
- The existing `ttrpg.html` + embedded `assets/code/index.html` arrangement remains in place.
- The V9 source has **162 independently stored non-Elarvess settlement maps**, **162 distinct Git blobs**, and no missing map file references at audit time.
- V9 source totals: 187,220 buildings, 267,480 NPCs and 949,113 interiors/rooms. Existing six-day schedule, relationship and location records remain the data source.
- Elarvess's PNG/GeoJSON pixel alignment, original buildings and original source NPC identities are unchanged by this pass.

## New interactive features

`js/cartography-v10.js` augments the existing town SVG overlay with deterministic settlement-seeded ecology marks, regional colors, named map cartouche and clickable district pins derived from the actual wards and building locations. Clicking a district opens the existing inspector with its linked building addresses; selecting a building opens its existing NPCs, room maps and goods/services. Districts are linked, not regenerated. Map data loads on demand after entering a province.

## TownGeneratorOS provenance and licensing

The provided `TownGeneratorOS-master(1).zip` is the Watabou **Medieval Fantasy City Generator** source, GPL-3.0. It was reviewed as an architectural reference for urban blocks, wards, plazas, street topology and map presentation. The V10 cartography enhancer is original JavaScript and does not incorporate or translate Haxe code. An earlier archival reference ZIP already exists at `assets/TownGeneratorOS-master-reference.zip`; if you redistribute or incorporate original TownGeneratorOS code, retain its GPL-3.0 license and notices.

Source: https://github.com/watabou/TownGeneratorOS

## Onyx's knowledge only

Onyx source repository: https://github.com/tyrannosaurusdm92/LifeHelpers/tree/main/Onyx

- 225 Onyx worldbuilding source paths indexed with their original Git SHAs in `json/onyx/worldbuilding-source-index.json`.
- 60 reference entries covering 57 distinct Onyx source files are archived as inert JSON across five knowledge packs under `json/onyx/`, with source provenance and a canon-overrides-reference rule. The source index contains additional paths that were NOT copied in full.
- `js/onyx/onyx-core/onyx-knowledge-bridge.js` lazily retrieves those packs in the existing local Work chat, without new panels or backend hooks. The model/dialogue layer is local and source-excerpt based, not a full generative LLM.

## Verification limitations

Static file presence, unique Git hashes and JavaScript path wiring were checked. A full interactive visual regression across all 163 settlements and mobile browsers has not been performed. Seed-derived differences and per-settlement V9 records do not constitute a pixel-by-pixel visual-difference proof.
