# Belavadós V7: Romantic relationships and family structures

This version extends V6 with reciprocal **consensual adult relationships** throughout all settlements. The 60% threshold counts current romantic attachments across all living NPCs, including children in the population denominator, but children are not assigned romantic attachments.

Current status is stored in `npc.romance` and `npc.relationships.romantic`. Prior ex-partners, ex-fiancés and ex-spouses live in `npc.relationshipHistory`, with reciprocal former-partner records. A widow/widower/widowed-person entry stores a deceased historical partner in a memorial record, **not** as a fabricated active NPC. Survivors can have new current partners.

Multiple current partners are modeled as mutually consensual; monogamy and many forms of consensual polyamory and plural marriage coexist without classifying polyamory as cheating. Family relationships include multiple parents, adoptive and step-parents, half-siblings, and blended households. Parent/child links require at least an 18-year age difference. Six-day Elarvess leisure blocks can include partner visits and child care; work and school remain unchanged. Other settlements preserve their original daily schedules.

The map PNG, Elarvess GeoJSON and 1,312 clickable footprint paths are left untouched. All new family arrangements are generated fiction for the simulation, not historical claims.

Older source records with inverted parent/child labels were normalized by actual age and reciprocal family roles. Consensual polygyny and consensual polyandry also occur in the generated plural-marriage network.
