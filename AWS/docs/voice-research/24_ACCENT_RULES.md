# Aza’raan — all 24 phonetic accents (authoritative)

This is the **current** Aza’raan phonetic accent map supplied by the language creator, not the older historical meanings inherited from the source files. Every mark uses Khmer Unicode for saved writing, while the display symbol is a visual aid only. The internal C01–C12 and K01–K12 IDs are preserved to keep existing glyph and keyboard bindings stable.

| # | Display | Khmer storage | Accent | Rule | Creator’s examples |
|---:|---|---|---|---|---|
| 1 | ◌́ | `៊` | Short A | Adds /æ/. | T + Short A → /tæ/ |
| 2 | ◌̀ | `៎` | Short E | Adds /ɛ/. | B + Short E → /bɛ/ |
| 3 | ◌̂ | `៏` | Short I | Adds /ɪ/. | P + Short I → /pɪ/ |
| 4 | ◌̌ | `័` | Short U | Adds /ʌ/. | R + Short U → /rʌ/ |
| 5 | ◌̄ | `៍` | Long A | Adds /ɑː/. | K + Long A → /kɑː/ |
| 6 | ◌̆ | `៝` | Long E | Adds /iː/. | S + Long E → /siː/ |
| 7 | ◌̈ | `ៈ` | Long U | Adds /uː/. | N + Long U → /nuː/ |
| 8 | ◌̃ | `ឹ` | G | Adds /g/; with N makes /ŋ/. | N + G → /ŋ/ |
| 9 | ◌̨ | `ឺ` | W | Adds /w/ or a glide; K + W gives /kw/, B + W gives /v/. | K + W → /kw/; B + W → /v/ |
| 10 | ◌̧ | `ើ` | Y | Adds /j/ or a vowel glide; N + Y gives /ɲ/, O + Y gives /ɔɪ/. | N + Y → /ɲ/; O + Y → /ɔɪ/ |
| 11 | ◌̇ | `ៃ` | F | Adds /f/; B + F gives /f/. | B + F → /f/ |
| 12 | ◌̵ | `្ក` | B | Adds /b/; W + B gives /b/. | W + B → /b/ |
| 13 | ◌ា | `ា` | Z | Adds /z/ as a final consonant. | T + Short A + Z → /tæz/ |
| 14 | ◌ិ | `ិ` | S | Adds /s/ as a final consonant. | K + S → /ks/ |
| 15 | ◌ី | `ី` | CH | Adds /tʃ/; changes D to /dʒ/ and T to /tʃ/. | T + CH → /tʃ/; D + CH → /dʒ/ |
| 16 | ◌ុ | `ុ` | Hard H | Changes T to /θ/, S to /ʃ/, O to /oʊ/. Other contexts require a defined rule. | T + Hard H → /θ/; S + Hard H → /ʃ/; O + Hard H → /oʊ/ |
| 17 | ◌ូ | `ូ` | Base | Explicitly preserves the unmodified base sound; conflicts with sound-changing accents. | T + Base → /t/ |
| 18 | ◌ួ | `ួ` | D | Adds /d/ as a final consonant. | B + Short E + D → /bɛd/ |
| 19 | ◌េ | `េ` | K | Adds /k/ as a final consonant. | B + Short A + K → /bæk/ |
| 20 | ◌ែ | `ែ` | L | Adds /l/ as a final consonant. | B + Short E + L → /bɛl/ |
| 21 | ◌ោ | `ោ` | M | Adds /m/ as a final consonant. | S + Short A + M → /sæm/ |
| 22 | ◌ំ | `ំ` | N | Adds /n/ as a final consonant. | P + Short I + N → /pɪn/ |
| 23 | ◌ះ | `ះ` | R | Adds rolled /r/ (Aza’raan trill). | K + Short A + R → /kær/ (rolled R) |
| 24 | ◌់ | `់` | T | Adds /t/ as a final consonant. | K + Short A + T → /kæt/ |

## Combination and precedence rules

1. **C01–C07 are the only vowel accents**: Short A `/æ/`, Short E `/ɛ/`, Short I `/ɪ/`, Short U `/ʌ/`, Long A `/ɑː/`, Long E `/iː/`, Long U `/uː/`. A consonant base receives the specified vowel; an underlying A/E/I/O/U base has its vowel replaced. The keyboard replaces another vowel accent when a different vowel is selected on the same logical letter.
2. **Context-sensitive transformations**: N+G `/ŋ/`, B+W `/v/`, N+Y `/ɲ/`, O+Y `/ɔɪ/`, B+F `/f/`, W+B `/b/`, T+CH `/tʃ/`, D+CH `/dʒ/`, T+Hard H `/θ/`, S+Hard H `/ʃ/`, O+Hard H `/oʊ/`. K+W creates `/kw/` by inserting `/w/` after `/k/`. In all other contexts G, W, Y, F, B and CH use the general addition rule documented in the table.
3. **Consonant endings**: Z, S, D, K, L, M, N, R, T append their named sounds after the vowel nucleus, when present. The R accent is a rolled `/r/` in articulation. Adding multiple consonant endings reads them in stable accent-ID order, not application order.
4. **Base**: K05 is the *Base* accent, NOT a `/uː/` vowel. It preserves only the underlying base letter's pronunciation. The keyboard automatically removes incompatible phonetic accents when Base is selected and removes Base when another phonetic accent is selected. If imported input contains both, the engine preserves Base and reports a conflict.
5. **Hard H**: Where the creator has not specified a contextual sound (for example, K+Hard H), the engine retains the base pronunciation and reports that the additional change is undefined, rather than inventing a sound.
6. **4 separate special markers**: S01 glottal `/ʔ/`, S02 click `/ǃ/`, S03 previous-syllable emphasis, and S04 next-syllable emphasis. These retain their existing Khmer encodings and are **not counted among the 24**. Web Audio supplies audible closure/click cues during voice playback.
7. **One written letter can contain multiple Unicode code points.** For example, T+Short A+Z uses Khmer `ត៊ា` and represents `/tæz/` as one letter. The coeng-subscript B accent C12 is the two-code-point sequence `្ក` and must be decoded as one mark.
8. **Romanized entry**: A Latin base plus its combining visual accents (for example `T́` or `Ḃ`) is understood by the speech box. Writing in the manuscript still serializes using Khmer Unicode. The fixed canonical names Aza’raan and Aza’ra preserve the pronunciations given by the creator.

## Voice independence

The pitch/depth slider, speed, and volume affect **only the audio delivery** after deterministic transcription. They never alter phoneme assignments, which accent is selected, Unicode storage, or the IPA preview. Browser speech approximates most sounds; click and glottal cues are generated separately and remain approximations of physical articulation.
