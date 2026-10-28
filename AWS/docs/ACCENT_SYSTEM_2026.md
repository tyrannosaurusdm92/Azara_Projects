> **2026 merged studio update:** This document originally described the two-accent canonical build. The merged studio now uses **three attached marks maximum including structural markers**. Use `docs/README.md`, `docs/UNICODE_STACKING.md` and the interactive 24-row table as current behavioral references. Historical recipe tables below are retained for phonetic mappings only.

# Aza’raan Language Studio — canonical 24-accent revision

Open **index.html** (the only HTML entry) with the `css`, `js`, `json`, `docs`, and `assets` folders alongside it. It works from disk with no network connection. This release replaces the meanings of the 24 ordinary accents in every active runtime source, picker, and phonetic converter. The four structural signs are unchanged.

## Canonical accent map

The **numbered Khmer encodings and visible accent cues are unchanged**. Their *names and functions* below replace the former Acute/Grave/etc. meanings. Native Khmer linguistic meanings do not apply to these custom fictional-language sign assignments.

| # | Latin-style display | Actual Khmer output | Accent | New function | Example |
|---:|:---:|:---:|---|---|---|
| 1 | ◌́ | ៊ | Short A | Adds /æ/ (cat vowel). | T + Short A → /tæ/ |
| 2 | ◌̀ | ៎ | Short E | Adds /ɛ/ (eh). | B + Short E → /bɛ/ |
| 3 | ◌̂ | ៏ | Short I | Adds /ɪ/ (ih). | P + Short I → /pɪ/ |
| 4 | ◌̌ | ័ | Short U | Adds /ʌ/ (uh). | R + Short U → /rʌ/ |
| 5 | ◌̄ | ៍ | Long A | Adds /ɑː/ (ah). | K + Long A → /kɑː/ |
| 6 | ◌̆ | ៝ | Long E | Adds /iː/ (ee). | S + Long E → /siː/ |
| 7 | ◌̈ | ៈ | Long U | Adds /uː/ (oo). | N + Long U → /nuː/ |
| 8 | ◌̃ | ឹ | G | Adds /g/; N + G is /ŋ/ (ng). | N + G → /ŋ/ |
| 9 | ◌̨ | ឺ | W | Adds /w/; K + W is /kw/, B + W is /v/. | K + W → /kw/; B + W → /v/ |
| 10 | ◌̧ | ើ | Y | Adds /j/ (y) or a vowel glide; N + Y is /ɲ/. | N + Y → /ɲ/; O + Y → /ɔɪ/ |
| 11 | ◌̇ | ៃ | F | Adds /f/, including B + F → /f/. | B + F → /f/ |
| 12 | ◌̵ | ្ក | B | Adds /b/, including W + B → /b/. | W + B → /b/ |
| 13 | ◌ា | ា | Z | Adds /z/ as an attached consonant. | T + Short A + Z → /tæz/ |
| 14 | ◌ិ | ិ | S | Adds /s/; K + S creates /ks/ (X sound). | K + S → /ks/ |
| 15 | ◌ី | ី | CH | Creates /tʃ/ with T and /dʒ/ with D. | T + CH → /tʃ/; D + CH → /dʒ/ |
| 16 | ◌ុ | ុ | Hard H | Contextual /h/: T→/θ/, S→/ʃ/, O→/oʊ/, G→/ɣ/. | T + H → /θ/; S + H → /ʃ/; O + H → /oʊ/ |
| 17 | ◌ូ | ូ | Base | Explicitly marks the unmodified base pronunciation. | T + Base → /t/ |
| 18 | ◌ួ | ួ | D | Adds /d/ as an attached consonant. | B + Short E + D → /bɛd/ |
| 19 | ◌េ | េ | K | Adds /k/ as an attached consonant. | B + Short A + K → /bæk/ |
| 20 | ◌ែ | ែ | L | Adds /l/ as an attached consonant. | B + Short E + L → /bɛl/ |
| 21 | ◌ោ | ោ | M | Adds /m/ as an attached consonant. | S + Short A + M → /sæm/ |
| 22 | ◌ំ | ំ | N | Adds /n/ as an attached consonant. | P + Short I + N → /pɪn/ |
| 23 | ◌ះ | ះ | R | Adds rolled /r/ as an attached consonant; R + R is rolled R. | K + Short A + R → /kær/ |
| 24 | ◌់ | ់ | T | Adds /t/ as an attached consonant. | K + Short A + T → /kæt/ |

## Separate structural markers (not part of the 24)

| ID | Display | Khmer | Function |
|---|---|---|---|
| S01 | ◌̓ | ៉ | Add /ʔ/ within the current logical letter, typically before its vowel. |
| S02 | ◌̩ | ្ឃ | Add click articulation /ǃ/ to the current logical letter. |
| S03 | ◌͔ | ៌ | Emphasize the preceding syllable; no independent phoneme. |
| S04 | ◌͕ | ៑ | Emphasize the following syllable; no independent phoneme. |

## Combination and encoding rules

- **One Aza’raan logical letter = one Khmer base plus up to three attached accents/marks in total**; special markers are tracked separately by type, but attached markers count toward the three-mark total.
- The seven vowel accents (#1–#7) are mutually exclusive on one letter. Selecting a different vowel in the keyboard replaces the preceding one. An invalid recipe with multiple vowel accents is rejected.
- The **Base** accent (#17) is exclusive among ordinary accents; it preserves the underlying base reading.
- Two consonant-building accents can combine where meaningful; for example `K+S` = /ks/, while `T+SHORT_A+Z` = /tæz/. An attempted third ordinary accent is rejected.
- Input recipes are space-separated logical letters, with `+` joining a base and its accents; for example `B+W+LONG_A`, `N+GLOTTAL+SHORT_I+Z`, `B+SHORT_E+D`, or `T+SHORT_A+Z`.
- Exact recipe names use ASCII/underscores: `SHORT_A`, `SHORT_E`, `SHORT_I`, `SHORT_U`, `LONG_A`, `LONG_E`, `LONG_U`, `G`, `W`, `Y`, `F`, `B`, `Z`, `S`, `CH`, `HARD_H`, `BASE`, `D`, `K`, `L`, `M`, `N`, `R`, `T`, plus `GLOTTAL`, `CLICK`, `PREVIOUS`, `NEXT`.
- B base is /b/. B + W is /v/ (voiced variant), B + F is /f/. An ordinary /w/ uses unaccented W base, accessible on B-hold's W option. W + B is /b/. F, V and X remain sounds in the input composer, not new physical keys; X → K + S.
- Contextual pairs: N+G /ŋ/, N+Y /ɲ/, T+CH /tʃ/, D+CH /dʒ/, S+H /ʃ/, T+H /θ/, G+H /ɣ/, R+R a rolled /r/, O+Y /ɔɪ/, O+H /oʊ/, O+W /ow/, A+Y /eɪ/, I+Y /aɪ/, A+W /au/.
- There is **no longer an OH accent on arbitrary consonants**: write /loʊ/ as `L O+HARD_H`. Under this canon `Lohkahna` takes four rather than three logical letters. The old `ZCODA` synonym now produces the new Z accent, not a coeng-Z subscript.
- The manual keyboard remains 21 keys, with four typing eras Archaic, Classical, Traditional and Modern. In Archaic the glottal and click use carrier-based signs; Classical onward they attach. Previous/next emphasis starts in Traditional.
- The Unicode manuscript is saved as Khmer only, plus whitespace. The historical evolution atlas retains 52 lineages and the original font assets.

## Known character examples (updated)

The studio dictionary supplies exact sound-unit recipes; for names not in the dictionary, automatic English spelling conversion is heuristic. The user can edit exact units and save a browser-local pronunciation. Existing overrides from version 2 are not loaded under the new version-3 storage key, to avoid silently changing how an old recipe sounds.

| Name | New canonical sound recipe |
|---|---|
| Lohkahna | `L O+H K+LONG_A N+LONG_A` |
| Pix | `P+SHORT_I K+S` |
| N'zra | `N+GLOTTAL+SHORT_I+Z R+SHORT_U` |
| Vahkohr | `B+W+LONG_A K O+H R` |
| Aza'raan | `A+SHORT_A Z A+SHORT_U R+GLOTTAL+R A+SHORT_A N+BASE` |
| Aza'ra | `A+SHORT_A Z A+SHORT_U R+GLOTTAL+R A+SHORT_U` |
| Kaʻaheʻanua | `K+LONG_A A+GLOTTAL+LONG_A E+SHORT_E A+GLOTTAL+W N+BASE W+LONG_A` |
