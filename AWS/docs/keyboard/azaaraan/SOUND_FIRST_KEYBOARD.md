# Aza’raan sound-first keyboard | October 28, 2026

This update builds on the uploaded `Azaaraan_Language_Studio_Fully_Merged_Keyboard_Voice_Evolution(5).zip`. It retains the original single `index.html`, Khmer mappings, four historic TTFs, evolution chart, existing 24-mark inventory, pronunciation atelier, synthetic click/glottal audio cues, and voice module.

## Keyboard

Keys are **ABDEFGHIJKLMNOPRSTUVWYZ**. Tap for the key's first phoneme; hold for ~400 ms on touch or mouse, or right-click on a desktop, to see all known sounds for that key. F and V are individual sound keys but retain their original B-family Khmer composition. There are **77** sound options across 23 keys, based on the attached *Letter Evolution Table*. Ancient variants that lacked a distinct modern accent have been marked “shared slot”; their sound/IPA remains editable but two historical phonemes sharing the same Unicode sequence will not become visually distinguishable until assigned separate **existing** slots.

The sound popup lets you choose the initial phoneme, second and third sounds (optional), either a click or a glottal stop, and one emphasis direction. It prevents choosing click and glottal simultaneously, and prevents both directions of emphasis simultaneously. There is an explicit **three marks per letter** limit inherited from this program; if the chosen marks cannot fit, the popup explains the conflict and does not silently truncate. In Archaic, click and glottal insert as their original standalone glyphs, and the historical absence of directional emphasis is respected. The other three keyboard eras use attached Khmer-mapped special marks.

The selected three sounds may become fewer than three script glyphs because the composer joins legal phonetic sequences into one encoded glyph. For example, consonant + vowel + coda can become one glyph with two marks; when this is impossible, phonemes remain separate. Click “Insert these sounds” to add them to the writing desk, or check “Replace currently selected glyph” to update an existing selection.

## Built-in examples

* `Aza>` = A (apple) + Z (z) + A (uh), plus emphasis on the next syllable. Khmer: `ឯាឯ័៑`; sound: `/æzʌ/`.
* `ʼra` = glottal stop + rolled R + A (uh). Khmer: `រ៉ះ័`; sound: `/ʔr͡rʌ/`.
* `Lokhana` = L + O (oh) + K (ah) + N coda + A (uh). Khmer: `ឡឧុគ៍ំឯ័`; sound: `/loʊkɑːnʌ/`.

These examples are presets for building words, not replacements for individual family-level assignments. Existing English-name transcription examples stay available in the phonetic atelier below the keyboard.

## Sound and glyph assignment atelier

Select **Sounds, families & glyphs** above the keyboard. The first panel allows you to edit descriptions and IPA, choose which keyboard **family** owns a sound, and select its existing Khmer **base slot** and up to three **accent/special** IDs. You can also create a new sound. Assigning an IPA value to a code slot is a pronunciation rule; it never changes the Unicode codepoint.

The second panel accepts a glyph image in SVG, PNG, JPEG, or WebP format (max 2 MB). Enter its description, IPA, family, and whether it replaces a letter or a diacritic. To remove an assignment, use the **Remove glyph** button in the inventory. Its Khmer codepoint is reserved in a matching letter/diacritic pool rather than deleted. On the next upload, the first freed slot of the chosen category is automatically selected; without a free slot, explicitly select an existing slot to replace. **Approve** saves it, **Cancel** discards the pending upload. Uploaded imagery is visible in composed glyphs and added as a new hold-menu sound option.

Saved sound mappings live in browser `localStorage` and uploaded artwork in `IndexedDB`. These are **local**, not written to AWS or Apps Script, since the existing backend was not changed. **Export all assignments + images** produces a portable JSON backup; **Import assignments** restores it. Do this before clearing browser storage or changing devices.

### Important font distinction

This interface applies uploaded glyph imagery in the **web renderer**, and its text is still the exact original Khmer Unicode assigned to each letter/mark. **It does not rewrite the binary TTF outlines, Unicode cmap, OpenType features, or generate a new installable font.** Other programs will show the new artwork only after those font files have been regenerated from the assignments. This prevents claiming a binary font edit that has not happened.

## Technical files

* `js/sound-data.js` is the offline sound inventory; the editable source mirror is `json/sound-catalog.json`.
* `js/sound-keyboard.js` contains the sound composer, assignment manager, slot inventory and local persistence.
* `css/sound-first.css` skins both popups and the writing-desk shortcuts.
* `js/studio.js` reuses the original Khmer encoder, preserving the original character+mark stack ordering and retroactive manuscript editing.
* `js/tts.js` accepts per-token IPA overrides for newly composed sound tokens and otherwise uses the original accent-aware phonetics.

## Known constraints

* TTF glyphs are not regenerated, as described above.
* If two sounds map to the same Khmer sequence, copying plain Unicode cannot preserve the distinction between them; the in-browser manuscript can preserve the chosen IPA until it is copied/reimported as plain encoded text.
* Browser speech still approximates many IPA sounds through installed voices and synthetic click/glottal cues, not a trained Aza’raan speech model.
* Custom artwork must remain available in the active browser profile or be imported from the exported JSON backup.
* In browsers that disallow IndexedDB (for example private/locked-down sessions), artwork persistence is unavailable and the upload will report that clearly.
