# Merged package QA summary

- Exactly **one HTML entry point** (`index.html`), with 2 accessible tabs.
- **23 visible letter keys**, exact order `ABDEFGHIJKLMNOPRSTUVWYZ`, and no X.
- **24 corrected accents**, 4 special marks, **3 per-letter maximum** (shared accent/special count).
- 4 original TTF fonts included byte-identical; no unsupported Ancient TTF fabricated.
- **323** original evolution artwork images/SVGs included byte-identical (all present).
- **52** ancestral roots across **6** chronological chart stages (252 interactive stage glyphs).
- **112** new SVG mark icons derived mechanically from the glyph outlines of the four TTFs (4 × 28); they are rendering assets, not hand-altered font shapes.
- Archaic standalone glyph files: `archaic_1.svg` and `archaic_52.svg`, preserved.
- Browser smoke tests: 21 keys, 24 accent options, 3-mark disabling, B/F/V/W family, W accent-only entry, Archaic two standalone keys, Classical+ four special options, tab switching, interactive chart initialization; no uncaught script exceptions.
- **Unicode limitation:** ordinary Khmer fonts/text editors may not shape arbitrary 3-mark Aza’raan custom combinations exactly like the studio compositor. This is described openly in `UNICODE_STACKING.md`.
