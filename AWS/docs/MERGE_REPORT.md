# Source-by-source merge report

## Input editions

1. `Azaaraan_Language_Studio_Canonical_24_Accents(1).zip`
2. `Azaaraan_Language_Studio_Merged_Complete(1).zip`

## Chosen foundation

The **Merged Complete** edition supplied the visible tab architecture, original evolution diagram (including its six historical stages and 52 roots), working era-font typing desk, Khmer-aware custom glyph renderer, 21-key B/W keyboard families, 3-mark composition palette, Unicode export/import, the 24-row accent reference, and original white-ink glyph artwork in the historical chart. This was used as the foundation because it has the richer interactive evolution experience and original artwork for each visible accent.

The **Canonical 24 Accents** edition supplied the current *semantics* and its spelling-to-phoneme converter, exact recipes, proper-name pronunciation examples, saved per-name pronunciation overrides, phonetic aliases, additional archived source maps, and comparison documentation.

## Integration changes

- Integrated the canonical sound converter with the unified writing desk's internal token structure. The sound preview, Insert, Replace, and Copy now use the writing desk's exact Unicode serialization and glyph artwork.
- The historical five-stage SVG and image content remains available in the complete edition's six-row Proto-to-Modern diagram.
- The common numbered C01-C12 / K01-K12 accent IDs remain unchanged, so the keyboard and sound converter agree on all 24 meanings and Khmer codepoints.
- Allowed three marks total on a base letter (including any attached structural signs). Archaic glottal/click display independently; the original font-based accent layout still manages physical positions.
- Replaced superseded two-accent validation and made the manual palette's vowel selection replace an old vowel accent rather than stacking two vowel nuclei. Base remains exclusive among ordinary accents.
- Preserved 15 differing **black-ink** contrasting SVG drawings from the Canonical build in `assets/svg/refined-contrast` and retained **white-ink** originals for the dark historical chart. All four original TTF font files are still present.
- Included the canonical source JSON/JS and modern complete evolution metadata with a fresh file manifest.

## Checks performed

- JavaScript parses successfully with Node (`node --check`) for every shipped `.js` file.
- Independent Node tests: **23 checks passed, zero failures**, for positive/negative accent recipes, pronunciation examples and mapping integrity (rerun with `node docs/verify-phonetics.js`).
- Filesystem audit: exactly one HTML file, two tabs, 21 keyboard letters, 24 accents, 4 structural signs, 4 era TTF fonts, and present accent SVG artwork in all four eras.
- All statically identified relative JavaScript, stylesheet and local art paths exist in the ZIP.

## Open limitations

- Source-based and phonetic unit tests passed; **interactive browser screenshot/GUI validation was not possible in the runtime because local `file://` and localhost navigation were blocked by the available browser's policy**. Browser layout and every click target should still be checked after extracting the ZIP.
- Automatic transcription of unlisted names is spelling-rule-based and can be imperfect; exact recipes and Save My Pronunciation are provided.
- The provided four custom fonts are unchanged. Three stacked marks display as independent SVG overlays inside the studio; pasted Khmer Unicode may render differently in other programs. No audio/TTS module was present in the two uploaded builds; this merge makes no claim to add TTS.
