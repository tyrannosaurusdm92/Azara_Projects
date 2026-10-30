# Elarvess canonical place-name replacement — v4

## Name policy (NO ALIASES)

Each of the **1,312** map building IDs has **one distinct canonical name**, deliberately different from every former map label and from the preceding population display name. No former-name, alternate-name, or `originalMapName` fields survive in the active settlement data. Searches and building inspectors use only canonical names, IDs, streets and addresses. **All 1,312 building names were fully renamed.**

The original building ID is not a name. IDs must remain fixed because they connect a clickable footprint, address, NPC residence, job or school, schedule block, goods/services, and searchable place record. Changing a name must not change its ID or geometry.

## Data updates

- `json/elarvess_living_population.json` and `js/elarvess_population_data.js`: 2,016 unique full names and 1,312 canonically renamed buildings. Every 6-day timetable block contains its target `buildingId` and the *same* canonical building name, with mutually consistent resident/employee/visitor arrays.
- `assets/maps/elarvess.geojson`: only the `properties.name` of each of the 1,312 building features was changed. All 5,561 features, geometries, other properties, and coordinates are preserved. The building illustration is unchanged.
- `js/elarvess_buildings.js`: only names changed; 1,312 original SVG `d` path strings, pixel `x`/`y` positions, `type`, `material` and building IDs are unchanged.
- `js/elarvess_map.js`: map UI selects places directly by the original building ID. No former-label fallback, alias search, browser-saved old-name mapping, or manual location-alias picker.
- `js/elarvess_living.js`: building and NPC inspectors, six-day schedules, directory searches and navigation show only canonical destinations.
- `json/elarvess_location_buildings.json` and `js/elarvess_enrichment_data.js`: legacy generic role headings were converted into deduplicated canonical place-name -> building ID references.
- `json/elarvess_complete.json`, `json/elarvess_npcs_schedules_relationships.json`, `json/elarvess_goods_services.json`, `json/settlement_npcs.json`, and `js/world_bundle.js`: founding NPC homes, work/school and historical timetable destinations were rebound to the canonical building names. Non-Elarvess records remain unchanged.

## Reconciled quantities

- **2,016 distinct NPC names**, including all 15 original NPCs.
- **1,312 unique names and street addresses** for **1,312 clickable buildings**.
- **12,096 six-day NPC timetables** with **94,613 activity blocks**.
- **19,050** directed relationship records; each target ID and referenced character name is checked against the roster.
- **18 distinct canonical building anchors** for the historical 23 role/place references (multiple generic source roles legitimately refer to the same physical building, so they now share a *single canonical name* rather than creating aliases).
- **1008 occupied residences, 304 staffed nonresidential sites**.

## Alignment integrity

The PNG file remains byte-for-byte identical. The original GeoJSON **geometry** remains exactly identical, though its file checksum necessarily changes because its building name properties were renamed. Likewise the original per-building hit path data remains identical even though its JavaScript source checksum changes due to renamed display strings.

See `docs/ELARVESS_CANONICAL_CROSSCHECK_V4.json` for the cross-reference audit, before/after checksums and any violations.

## Usage

Open the root `index.html` and select **Aelvanyr → Elarvess**. Click a map building to see its canonical display name and details. Use the NPC browser and living directory to navigate homes, jobs, schools, weekly destinations, residents, coworkers, visitors and relationships. All navigation resolves a building ID, not a previous label.
