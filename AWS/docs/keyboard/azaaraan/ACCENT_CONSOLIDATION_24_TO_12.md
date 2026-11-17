# Aza’raan accent consolidation — Archaic/Classical/Traditional 24 → Modern 12

The **24 historical accent meanings are preserved**, but Modern has **12 physical ordinary diacritics**. Each Modern mark keeps its present primary function and gains a documented **secondary inherited meaning**, conditioned by the host letter, any subscript, and other modifiers. This is phonological inheritance, not permission to write an old single-symbol coda with an arbitrary Modern diacritic.

Canonical machine-readable crosswalk: `json/keyboard/accent-consolidation.json`. The same 12-row table appears in **Language Evolution Breakdown**. The original 24 names/definitions remain unchanged in `json/keyboard/active-accent-meanings.json`.

| Modern mark | Modern Khmer | Secondary inherited role | Historic functions preserved |
| --- | --- | --- | --- |
| Held Consonant | ៌ | Inherited liquid and stop-coda retention: historical /l/, rolled /r/, /d/, and /t/ can be held or recovered from the host/subscript consonant family. | D (K06), L (K08), R (K11), T (K12) |
| Central Vowel | ឹ | Retains the historical Short U /ʌ/ ('uh') reading, now housed in Modern A rather than an independent U. | Short U (C04) |
| Open Vowel | ា | Unifies the historical open-A contrast: Short A /æ/ and Long A /ɑː/, distinguished by host vowel and Short/Long Vowel as applicable. | Short A (C01), Long A (C05) |
| Short Vowel | ់ | Retains the historical short lax front-vowel readings, E /ɛ/ and I /ɪ/, when applied to the corresponding vowel families. | Short E (C02), Short I (C03) |
| Long Vowel | ី | Consolidates the historical Long E /iː/ and Long U /uː/ readings under one duration mark; vowel identity comes from the host and other marks. | Long E (C06), Long U (C07) |
| Unvoiced Sound | ៍ | Preserves the old voiceless F /f/, S /s/, and K /k/ consonant-class contrasts through Modern base/subscript and voicing recipes. | F (C11), S (K02), K (K07) |
| Voiced Sound | ័ | Retains historical voiced G /g/, B /b/, and Z /z/ readings as contextual consonant-family values, without adding independent Modern letters. | G (C08), B (C12), Z (K01) |
| Separated Vowel | ៈ | Carries forward the historical Base mark's explicit preservation of an unmodified, individually articulated vowel unit rather than fusing it into a glide. | Base (K05) |
| Nasalization | ំ | Retains the historical M /m/ and N /n/ nasal-coda families as place-dependent nasal readings; /ŋ/ remains possible via contextual nasal assimilation. | M (K09), N (K10) |
| Soft Sound | ៉ | Retains the historical CH affricate family /tʃ/ and /dʒ/ as a contextual palatal/soft-articulation heritage reading. | CH (K03) |
| Hard Sound | ៊ | Retains the historical Hard H family of contextual frication and aspiration (/h/, /θ/, /ʃ/, /ɣ/) where the host consonant calls for it. | Hard H (K04) |
| Glide Sound | ៎ | Consolidates the historical W /w/ and Y /j/ semivowel and vowel-glide readings, including inherited diphthong transitions. | W (C09), Y (C10) |

**Coverage:** 24 historical semantic slots are assigned exactly once across 12 Modern marks.

**Compatibility rules:** Independent P remains distinct from B. B + Soft Sound = /v/, B + Soft Sound + Unvoiced Sound = /f/. Former U /ʌ/ is A + Central Vowel; /uː/ is O + Central Vowel + Long Vowel. Separated Vowel is host-only and requires a genuine second vowel subscript. This mapping does **not** change glyph artwork, keyboard layout, historical 24-sign inventory, Unicode assignments, pronunciation engine, or existing saved text. A documented secondary reading is not automatically a new sound-engine recipe.
