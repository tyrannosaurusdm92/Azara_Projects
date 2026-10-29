# October 28, 2026 sound-first release

See [SOUND_FIRST_KEYBOARD.md](SOUND_FIRST_KEYBOARD.md) for the 23-key sound composer, Khmer-preserving glyph/IPA manager and exported backups. See [SOUND_FIRST_QA.md](SOUND_FIRST_QA.md) for tested behavior and known constraints.

# Aza’raan Language Studio — Best-of-Both Merge

**Start here:** Extract the ZIP, keep its folders together, and open `index.html` in a modern browser. This is the **only HTML file**. It operates locally, without a web service or installation. The full writing desk and six-stage Evolution Atlas share two tabs.

## What was combined

This package combines the **Complete** edition's interactive six-row evolution chart, 52 pictorial roots, historic glyphs, era-specific custom letter fonts, physical 21-key keyboard, B/W hold selector, overlay-based visual accent composer, Khmer copy/paste, and saved manuscript, with the **Canonical 24 Accents** edition's sound-to-script transcriber, exact phonetic recipes, character-name dictionary, pronunciation teaching, sound previews, and pronunciation rules. Both originals' artwork and source records are retained.

* **Typing:** `ABDEGHIJKLMNOPRSTUWYZ` (21 visible keys, no X). Hold or right-click a key to select visual accent variants. B offers B/F/V/plain W, while the W key only produces accented W. Enter/Space on a focused letter also opens the composer.
* **Four input fonts:** Archaic, Classical, Traditional, Modern. All standard era font files are at `assets/ttf`.
* **24 canonical accents:** Same Khmer codepoints, new sound meanings. The 24-row chart in the Typing tab uses `json/azaaraan-config.json`; `json/active-accent-meanings.json` and `json/phonetics.json` document the same definitions. The core descriptions are in `docs/ACCENTS.md`.
* **Up to three stacked marks** per letter, including attached structural marks. There is at most **one Short/Long vowel accent** per letter: choosing a different one replaces the previous vowel. **Base** excludes other ordinary accents. The three-mark visual composer uses authentic custom accent outline SVGs, not the native Khmer appearance.
* **Structural marks (separate from the 24):** glottal, click, previous-syllable emphasis, next-syllable emphasis. In **Archaic**, click `¡` and glottal `ʔ` have standalone complete original glyph images; Classical/Traditional/Modern allow four structural marks to attach. In this merged build the ordinary accents and attached structural marks share the three-mark capacity; stand-alone Archaic signs do not count against another letter.
* **Sound-to-script:** Enter a written name; the converter recognizes seven included character names, derives heuristic pronunciations for other spellings, and accepts an exact unit recipe for predictable results. The Preview and Copy use the **same visible glyph model and Khmer Unicode serializer** as the writing desk. Insert appends at the cursor and Replace overwrites the desk after confirmation. Pronunciation edits for individual names are stored locally in that browser.
* **Interactive evolution:** Preserves Proto, Ancient, Archaic, Classical, Traditional, Modern rows and their lineage connections and inspection panel, including original full-color ancient pictographs, historical SVGs, 21 current families, and 52 root records.

## Canonical sound recipes

Separate letters with spaces and add accents to a letter with `+`. Some examples:

| Recipe | Reading |
|---|---|
| `T+SHORT_A+Z` | /tæz/ |
| `B+W+LONG_A` | /vɑː/ |
| `N+GLOTTAL+SHORT_I+Z` | /nɪz/ with glottal structure |
| `K+S` | /ks/ (X sound, but no X keyboard key) |
| `N+G` | /ŋ/ |
| `N+Y` | /ɲ/ |
| `T+CH` | /tʃ/ |
| `D+CH` | /dʒ/ |
| `O+HARD_H` | /oʊ/ |
| `S+HARD_H` | /ʃ/ |

All 24 accent names in the configuration map to their assigned sound function. Spellings such as `V`, `F`, or `X` are recognized as phonetic input aliases, **not** additional keyboard keys.

### Notes on automatic English spelling

This is a rule-based transcriber, not a trained general-purpose phoneme recognizer: spelling is ambiguous, especially proper names. Use the exact sound recipe to correct a result, then Save My Pronunciation for that name. Pronunciation overrides from older builds have **not** been imported automatically because the sounds attached to old marks may differ. Historical manuscripts likewise retain their Unicode values rather than being automatically respelled.

### Encoding and visual limitations

The output is Khmer Unicode with *Aza’raan-specific semantics*, not regular written Khmer. Khmer Unicode combines/vowels/coeng sequences can display differently in other fonts, and three stacked marks cannot be guaranteed to remain visually separated when pasted outside the app. **The studio displays custom mark artwork as independent overlays** to keep the intended distinctions visible. Text-to-speech/audio is **not included** in either merged source and is not claimed here. The evolution chart's original historical phonetic labels are archival rather than instructions for the modern sound system.

## Offline file layout

```
index.html                 the only HTML entry file
assets/
  ttf/                     4 font eras
  svg/evolution/           white-ink glyphs used by the dark Evolution Atlas
  svg/marks/               original visible accent artwork for each supported era
  svg/refined-contrast/    canonical contrasting (black) revisions, preserved
  images/evolution/        52 root images and historical contact sheets
js/
  config.js                keyboard, era and 24 mark metadata (offline mirror)
  studio.js                unicode/keyboard/palette/manuscript runtime
  data.js                  canonical phonetics input metadata
  phonetic-data.js         sound recipe tables and examples
  phonetic.js              pronunciation conversion engine
  phonetic-ui.js           bridges phonetics to the interactive writing desk
  evolution.js             six-era historical graph runtime
css/
  studio.css, phonetic.css, evolution.css
json/                     editable configuration and original source registers
docs/                     examples, reference chart, merge history and test notes
```

## Verification checklist

- Open the HTML, ensure the 21 keys and the table of 24 accents appear.
- Choose a letter and apply Short A then Z; test a third ordinary mark and try a fourth (fourth is blocked).
- Choose Short E after Short A; the new vowel replaces the old one, and no second vowel is stacked.
- Preview `T+SHORT_A+Z`, insert it, and confirm the Unicode output contains `ត` plus the two assigned Khmer marks (order controlled by Khmer serialization rules).
- Preview `Pix`, use Insert, and confirm two logical letters (P+Short I and K+S).
- Switch to the Evolution tab and trace a modern family back to its 52 roots.

## Source priority

The Complete edition provides the typing/evolution interface and all dark-contrast SVG artwork; Canonical provides the authoritative pronunciation engine and rule-based vowel/consonant meanings. The saved white-ink SVGs are still displayed on the dark evolution chart. The Canonical edition's 15 alternate black-ink SVG refinements are preserved in `assets/svg/refined-contrast/` (see `docs/ARCHIVE_ASSET_COMPARISON.md`). This is a *merged* program, not two unrelated programs packed together.
