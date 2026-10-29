# Research and implementation sources

This build uses these sources as research/design references. Except where prior package data licensing explicitly says otherwise, third-party source code is **not copied into the runtime**; techniques are independently implemented so the static writer helper remains self-contained.

## Language, phonology, scripts, language vitality

- Unicode Standard, Chapter 11 / Egyptian Hieroglyphs — https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-11/
- Unicode UAX #57 (Unikemet) — https://unicode.org/reports/tr57/
- Unicode Writing Systems and Punctuation — https://www.unicode.org/versions/latest/ch06.pdf
- Metropolitan Museum, alphabet origins / acrophony — https://www.metmuseum.org/exhibitions/listings/2014/assyria-to-iberia/blog/posts/alphabet
- PHOIBLE 2.0 — https://phoible.org/
- CLTS — https://github.com/cldf-clts/clts
- WALS Online — https://wals.info/
- UNESCO Language Vitality and Endangerment — https://ich.unesco.org/doc/src/00120-EN.pdf
- Lexurgy — https://github.com/def-gthill/lexurgy
- Yasgheld / SoundChange — https://github.com/alray2569/SoundChange
- The Conlanger's Suite — https://github.com/Neonnaut/the-conlangers-suite

Implementation consequences: spoken and written change are modeled independently; sound change can be context-sensitive, probabilistic, lexical-diffusing and region/register-limited; borrowing includes phonotactic adaptation and social pressure; grammar supports typological variation and grammaticalization; vitality is multi-factor; script evolution can borrow, split, merge, retire, revive or reassign signs. The Egyptian→Proto-Sinaitic/Phoenician→Greek→Old Italic/Etruscan→Latin path is treated as a specific historical lineage, not a universal evolutionary ladder. Egyptian itself is modeled as a mixed writing system, not 'pictures that simply turned into letters.'

## Font and digital glyph generation

- opentype.js — https://github.com/opentypejs/opentype.js (MIT; research reference)
- fonteditor-core — https://github.com/kekee000/fonteditor-core (MIT; research reference)
- Microsoft/OpenType specification — https://learn.microsoft.com/en-us/typography/opentype/spec/
- Calligraphr — https://www.calligraphr.com/ (workflow reference only; this build intentionally removes the draw/scan/upload step by procedurally synthesizing vector contours)

The delivered TTF writer is dependency-free JavaScript from the existing Writer Tools project. It creates sfnt/TrueType tables and can synthesize digital glyph geometry when no drawing is supplied.

## Writing, prose, narrative, poetry and lyrics

- write-good — https://github.com/btford/write-good (MIT; configurable prose-lint categories)
- retext — https://github.com/retextjs/retext (natural-language syntax-tree/plugin architecture)
- retext-readability — https://github.com/retextjs/retext-readability (readability formulas)
- wink-nlp — https://github.com/winkjs/wink-nlp (MIT; browser NLP architecture)
- RiTa — https://github.com/dhowe/ritajs (GPL-3.0; research only, no RiTa source bundled)
- inkjs — https://github.com/y-lohse/inkjs (static-browser interactive narrative architecture)
- Ink — https://github.com/inkle/ink (branching narrative design reference)

The runtime implements its own analyzers for scene causality, tension/release, plot/setup-payoff ledgers, cliffhangers, trope specificity, dialogue speaker distinction/subtext, poetry form/rhythm, lyric breath/prosody/hook clarity and William-voice craft correction. No AI music/audio generation algorithms are included.
