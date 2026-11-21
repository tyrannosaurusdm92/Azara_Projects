# Rise of Ruqorakai — authoritative source synchronization

**Province/settlement source:** `Rise_of_Ruqorakai_Character_Sheet_Rebalanced_Settlements(1).html` (embedded `rorWorldData`).

Its **28 provinces and 163 pre-existing settlement names** determine provincial membership, settlement types, capitals, and provincial governance. The distribution is **31 villages; 16 towns; 44 townships; 44 cities; 28 capitals**. Each province has five or six existing settlements and exactly one capital. The limitation of 16 towns means a town cannot appear in all 28 provinces without contradicting the supplied distribution. These are player-game redistributions, not newly established historical coordinates.

**Legacy ID aliases** (old → canonical):
- `province-jor-maelis` → `province-jormaelis`
- `province-lun-tharav` → `province-luntharave`
- `province-sylvav-ryn` → `province-sylvaveryn`
- `province-zal-tharuun` → `province-zaltharuun`

Old IDs are accepted for previous deep links and local saves; canonical IDs appear in all live and derived location indexes. Original province IDs, settlement IDs and map coordinates are retained as provenance where relevant. No settlement was created or deleted.

**Magic/class source:** `🔁 School-Based Magic Disciplines(3).txt`, particularly its School Overview and Section 8.

The **14 deity-linked game archetypes** replace the character sheet's 64 older *provisional class suggestions* as active class definitions. Each offers **Steelborn, Wildshot, Spellsword, Psionist and Etherist**, all independently ranked 0–20; **70 total class paths**. The eleven magic schools are likewise trained independently to 20, permit mixing, and use the document's strong/weak/neutral matchup chart. No class forces deity worship or moral alignment.

**Rise is single-player, PvE-only, and has absolutely no magic books or book-gated skills.** Spoken instruction, trials, experience, practice and rituals replace MMORPG-specific skill books. School strength modifiers are tunable, not divine-power assertions.

**Era protections:** The playable living Belavadós setting precedes its destruction in **276 CE**. Deities are not diminished before the Traditional Era. Anubriosh's early-classical trial uses *The Hourglass Before Thorns*; his post-fall necromantic signature abilities require the story-confirmed fall flag.

**Implementation:** The canonical data files live under `json/canon/`; the page loads their JavaScript counterparts under `js/belavados-core/`. Existing map data and references are preserved, with legacy ID compatibility. `ttrpg.html` and `assets/code/index.html` remain the only HTML entrypoints.