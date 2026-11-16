# Modern Aza'raan surgical migration — 16 November 2026

## Scope
This is a deliberately **Modern-focused** migration of AWS, based on the attached user-approved 12-diacritic reference and standalone keyboard/TTF. The AWS UI structure, keyboard layout styling, Glyph Studio styling, and earlier-era TTF binaries are preserved. Applied to the AWS default branch following the author's request. This audit records implemented changes and limitations; it is not a claim that the unresolved historical remapping has been completed.

## Applied
- Modern uses 20 independent host letters: `ABDEGHIJKLMNOPRSTWYZ`; U is retired and P remains independent.
- Modern F/V => B; Q/X => K; Tz (/tæz/) => T + Open Vowel + Hard Sound, with zero subscripts.
- Modern has 12 named marks: Held Consonant, Central Vowel, Open Vowel, Short Vowel, Long Vowel, Unvoiced Sound, Voiced Sound, Separated Vowel, Nasalization, Soft Sound, Hard Sound, Glide Sound.
- All 77 source sound identifiers remain in `json/keyboard/modern-orthography.json`, including historical aliases. Mark counts are at most 2 and opposed Voiced/Unvoiced on one letter is invalid.
- Separated Vowel is valid only on an independent vowel-bearing host with a real additional vowel subscript. No Modern standalone host-only separated-vowel sequences are authorized.
- Only the Modern TTF was replaced, from the user-supplied compiled 20-letter proof font. Its independent-letter and diacritic codepoints match the supplied standalone canonical mapping.
- Existing keyboard shell, Glyph Studio shell, CSS and pre-Modern TTFs have not been replaced. Their older-era glyph art is preserved. The Modern evolution chart uses its current font rather than the previous Modern SVG glyphs.
- Modern Glyph Studio seed and saved-project normalization align Latin keys and Khmer codepoints while retaining user artwork. Historic non-modern key artwork remains available as historical-family entries.
- Offline cache version incremented so the new font/data can be reloaded.

## Verified static checks
- Modern inventory: 20 hosts, 12 diacritics, 77 documented source entries.
- JS syntax parsing: all changed JS files passed.
- The Modern evolution JSON and the inline chart JSON match.
- Historical evolution nodes for Proto, Ancient, Archaic, Classical and Traditional match their pre-change records.
- Historical era Unicode maps in `font-unicode-map.json` are unchanged.
- Diff contains no CSS changes, no files outside `AWS/`, and no pre-Modern font changes.

## Not complete / requires user-approved compatibility strategy
**A uniform physical Khmer Unicode across all historical TTFs is not safely achievable while keeping all of those TTF files byte-for-byte unchanged.** Their original font cmaps select a different outline (or none) at the Modern canonical codepoint for **E, G, J, K, L, O, W, Z**. Blindly reassigning those eight codepoints would display wrong historical shapes. See `json/keyboard/era-unicode-compatibility.json` for the original and desired codes. The existing historical key/font rendering was deliberately left intact.

This branch does not claim all historical diacritic placements have been re-anchored. Existing historical fonts still carry their original mark composition behavior. Completing cross-era visual mark positioning without changing historical fonts would require an explicit per-era display/shaping adapter (or permission to create alternate font cmap aliases that preserve the old outlines).

The Modern TTF has matching codepoints but no GPOS/GSUB mark-attachment tables; the repo's existing browser text renderer may not reproduce the standalone Glyph Studio's precise primary/secondary/subscript positioning. The full standalone editor/compositor was **not** copied over the AWS UI because that would violate the requested appearance-preserving scope. A browser visual QA pass is required for stem/tail clearance and contextual punctuation.

Pronunciation TTS was not rewritten; its older 24-mark internal phonetic engine remains for historical compatibility. The Modern sound choices and new Unicode encoding are routed through `AzaaraanBridge`.

## Preservation policy
Do not overwrite historical TTF glyph outlines, erase saved user artwork, change CSS layouts, or replace the existing AWS keyboard/Glyph Studio HTML. Preserve the documented font compatibility conflicts until a verified solution is available.
