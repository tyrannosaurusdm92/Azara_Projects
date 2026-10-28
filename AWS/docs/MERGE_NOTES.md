> Historical record of the original merge, before the canonical 24-accent reassignment. For the current phonology use `README.md` and `ACCENT_SYSTEM_2026.md` instead.

# Merge provenance and precedence

## Source packages

1. `Azaaraan_Khmer_Keyboard_and_28_Marks_Updated(3).zip` — sound meanings, 21 main Khmer bases, marked-vowel carriers, full authoritative 28 marks, seven sample sound units. Old standalone F/V bases superseded.
2. `Azaaraan_Era_Fonts_TTF_Package(2)(2).zip` and `(2)(3).zip` — all four fonts and glyph metadata. TTFs are byte-for-byte identical across these two archives, so only one copy of each was used.
3. `Azaaraan_Evolution_With_Directional_Marks (fairly outdated)(1).zip` — historical 52-root register, stage counts, merger schedules, 268 old SVGs, and 57 PNGs. Older Latin Unicode spellings and punctuation representations are superseded.

## Rules

- Khmer Unicode storage beats legacy Latin serialization.
- New TTF styling beats old live-letter SVGs. Old SVGs are not deleted from the archive and remain visible where no new TTF glyph is applicable.
- Archaic structural actions are stand-alone, Classical glottal/click are attached, Traditional/Modern enable directionality.
- Logical units are parsed as Khmer base + modifiers/coeng sequences.
- Known gap: B-family W modifier was not explicitly encoded in the supplied 28 marks. Runtime provisional C07, documented openly.
- **No new glyph shapes were generated** from the older SVG set; newer TTF glyphs are the visible authority.
