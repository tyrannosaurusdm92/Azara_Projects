# Belavadós — Pronoun, identity, title, and endearment engine (V6)

## Scope

Merged the **data and algorithm** from the supplied `Belavados_Pronouns_Identity_Terms(2).zip` into the existing Belavadós living-world package. The attached **standalone HTML page, dice audit panel, category-configuration forms, language demo page, and dice controls were not imported**. The existing `index.html` remains the user-facing entrypoint.

Existing buildings (1,312), their addresses, pixel/geographic coordinates, SVG hit paths, PNG, and GeoJSON have not been changed. Existing 2,016 Elarvess NPC IDs/names, residence/workbuilding IDs, relationship edges, and all six-day schedules are unchanged. 2,909 base settlement NPCs retain IDs, locations, names, relationships, and routines. The 15 original Elarvess NPC records are synchronized between both datasets.

## Active modules

- `js/identity/dice.js` — internal unbiased integer dice (rejection-sampled `Uint32Array` RNG, or seeded deterministic generator).
- `js/identity/pronouns-data.js` — offline 232-record pronoun catalogue (all five inflections; two *ey/em* variants have different possessive forms; both retained).
- `js/identity/term-lexicon.js` — offline terms mirror from attached programme.
- `js/identity/terms.js` — matching policy for terms and d20 face-based pronoun selection.
- `js/identity/settings.js` — non-visible settings mirror (`prioritized`, `linked`, romantic `false`).
- `js/identity/identity-engine.js` — unified integrated API: `pickIdentity`, `assignOne`, `assignPopulation`, and `weightPool`.
- `json/identity/pronouns.json`, `json/identity/term-lexicon.json`, and `json/identity/default-settings.json` — editable source tables for future revisions. Keep JSON and its JS mirror synchronized.
- `docs/IDENTITY_TERMS_TESTS.js` — Node regression test (not required for browser use).

## Algorithm

1. **14 identities**: Agender, Apagender, Bigender, Cis-Female, Cis-Male, Demi-Female, Demi-Male, Gender-Flexible, Genderfluid, Genderless, Nonbinary, Poly-Gender, Trans-Female, and Trans-Male. Neutrois is not offered.
2. **Opening dice**: d4, d6, d8, d10, d12, and d20; 3 rolls of each for village, 6 for town, 10 for city, and 18 for capital. Assigned dice and a d20 tie-breaker create variable per-identity weights. New generated populations are apportioned from those weights.
3. **Pronouns**: Cis-Male always he/him, Cis-Female always she/her. For the four Demi/Trans male/female identities, exactly half of each population cohort (with unbiased rounding for odd sizes) are forced to their corresponding he/him or she/her forms; the remainder and all other identities draw a d20 face. Random pronouns are drawn from the entries matching that face, with default 80% neopronoun priority and 20% inclusive original probability. All 232 original five-form entries are available; 206 are classified Neopronoun.
4. **Terms**: After final pronoun assignment, suggest respectful address, formal honorific, everyday title, platonic endearment, and role-specific kinship terms. Neutral wording is preferred for neopronouns and mixed pronouns. Even he/him and she/her users may get neutral address language. Romantic endearments are off by default and require explicit configuration opt-in.
5. **Storage**: `genderIdentity`, `pronouns`, `pronounForms`, `formalHonorific`, `preferredHonorific`, `respectfulAddress`, `everydayTitle`, `platonicEndearment`, `romanticEndearment`, `kinshipTerms`, `familyLanguage`, and `languageProfile` (category, roll, assignment, policy and term-profile audit) are stored per NPC.
6. **No hidden status inference**: Formal professional, military, religious or noble ranks are not granted by pronouns, and kinship words do not create relationships. Terms are suggestions, not authoritative statements about any real person's preferences.

## Connected generator and exports

- Generating NPCs in the **original NPC Generator** invokes `assignPopulation` in batches by village/town/city/capital type. Dice and probability computation do not appear in any UI.
- Imported or legacy NPCs gain a language profile exactly once during normal NPC expansion. User edits to already-generated profiles are not silently rerolled.
- The existing `5% Randomizer` identity operation resynchronizes pronouns, forms and terms when that specific identity field changes.
- Elarvess's NPC dossier and the main settlement panel display the resulting title/endearment suggestions and expandable pronoun/kinship forms. Standard JSON exports retain all fields; the settlement CSV includes the new language fields.

## Reproducibility and limitations

The seed-backed dice implementation is for fictional reproducibility, not cryptographic secrecy. The existing life-simulator GUI intentionally uses a changing run nonce to generate fresh NPCs; the internal identity engine's direct API supports exact replay from identical seeds. User-specified imports with unrecognized identities fall back to one of the 14 allowed identities. Source identity/pronoun associations are fictional defaults and should not be used to infer the identities of real people.

The test environment blocked browser navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`), so no new end-to-end browser click test is claimed. Node regression tests and static integrity checks were run; please perform a visual smoke test after extraction.
