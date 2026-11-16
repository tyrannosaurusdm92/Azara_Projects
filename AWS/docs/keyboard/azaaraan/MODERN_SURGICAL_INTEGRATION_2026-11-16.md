# Modern Aza'raan surgical integration — 16 November 2026

This branch replaces **Modern** Aza'raan language data and glyph source mapping with the supplied 20-host / 12-diacritic specification while preserving the current AWS keyboard and Glyph Studio layout. It preserves every previous-era TTF file and the previous-era font assets.

## Modern rules implemented
- Independent hosts: `ABDEGHIJKLMNOPRSTWYZ` (20); **no independent U**. W remains a Modern working key because the supplied revised file retains it, but its glyph-host status was not proven by the earlier Google Doc.
- Modern's 12 marks are Held Consonant, Central Vowel, Open Vowel, Short Vowel, Long Vowel, Unvoiced Sound, Voiced Sound, Separated Vowel, Nasalization, Soft Sound, Hard Sound, Glide Sound.
- Retired pitch marks Falling Inflection and Rising Inflection are absent from Modern.
- A host or subscript accepts at most **two phonetic marks**; Voiced + Unvoiced on one letter is rejected.
- Up to **two dependent letters** attach below the host. The supplied font contains their small glyphs. Separated Vowel is host-only and requires a vowel-bearing independent host and a real second vowel subscript.
- Glottal, click, and previous/next emphasis are punctuation outside the two phonetic slots.
- Modern /p/ uses independent P. /v/ = B + Soft; /f/ = B + Soft + Unvoiced. /tæz/ = T + Open + Hard with no subscripts; it is a **normal family reading** rather than a special-case parser.
- All **77 original AWS source sound IDs** are retained with Modern phonetic assignments. Historical U and F/V entries remain searchable source aliases.
- The Modern font file `assets/keyboard/ttf/Azaaraan-Modern-2026.woff2` is a source-outline-preserving WOFF2 subset from the provided compiled Modern TTF. The GitHub blob SHA was independently checked against the locally built source.
- The Modern evolution row and table display the Modern Khmer glyphs, using the existing table and chart layout.

## Historical-era preservation and compatibility caveat
Older fonts do not encode all of the same Khmer Unicode slots as the supplied Modern TTF. For instance, the original earlier-era A slot used a different Khmer codepoint from Modern A. **Forcing the same literal codepoints into those older fonts without modifying their cmap tables would display the wrong historical glyphs**.

Therefore this patch:
- Preserves historical font binaries and the historical pronunciation/typing engine.
- Adds `canonicalLatinKey`, `modernCanonicalUnicode`, and `preserveHistoricalFontEncoding` fields to existing historical Unicode map entries.
- Preserves pre-merged historical F, V, and U entries where present and labels their Modern merge targets.
- Adds normalized Modern diacritic attachment metadata, but does **not** pretend that historical fonts automatically support those new marks.
- Does **not** silently replace earlier-era rendered codepoints or move their actual font-internal diacritic attachment points. Fully unifying *literal* Unicode codepoints and historical visual diacritic placements would require new compatibility font files or a richer rendering layer; that is not part of this safe change.

## Visual and file scope
- No historical-era TTF, PNG, or SVG file has been edited.
- Existing AWS menus, keyboard layout, Glyph Studio panel structure, colors, and general CSS are preserved.
- Only Modern font registration and tightly scoped Modern glyph-display font selectors were changed.
- Saved Modern-only records retired from the current alphabet are preserved in `project.retiredModernGlyphs`; earlier-era project data remain unchanged.
- The service-worker cache version is bumped to load the updated Modern runtime/font offline.

## Test and review
Run `node AWS/docs/keyboard/azaaraan/test-modern-canon.js` from the repository root. Tests exercise 20 modern letters, 77 entries, 12 marks, critical mergers, conditional Separated Vowel, and preserved historical chart roots. JavaScript syntax and these Modern invariants have also been checked directly against the branch contents.

**No browser-based full UI/regression suite has been run in the hosted environment.** Visually check the Modern font and punctuation in the keyboard, Glyph Studio and chart before merging the draft PR.

Sources: user's revised Modern Aza'raan phonetic reference and punctuation-aligned ZIP (15–16 November 2026); Google Doc Letter Evolution Table; historical AWS repository data.
