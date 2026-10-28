# Aza’raan Unicode and three-mark stacking

## Base letters

| Latin key | Khmer stored character | Unicode |
|---|---|---|
| A | ឯ | U+17AF |
| B | ប | U+1794 |
| D | ដ | U+178A |
| E | ឥ | U+17A5 |
| G | ខ | U+1781 |
| H | ហ | U+17A0 |
| I | ឰ | U+17B0 |
| J | ច | U+1785 |
| K | គ | U+1782 |
| L | ឡ | U+17A1 |
| M | ម | U+1798 |
| N | ន | U+1793 |
| O | ឧ | U+17A7 |
| P | ព | U+1796 |
| R | រ | U+179A |
| S | ស | U+179F |
| T | ត | U+178F |
| U | ឩ | U+17A9 |
| W | ឆ | U+1786 |
| Y | យ | U+1799 |
| Z | ជ | U+1787 |

The B-family legacy helper codepoints in the font are **not** used as separate modern alphabet keys. F is encoded as `បៃ` (B + mark 11, F) and V as `បឺ` (B + mark 9, W). Plain W is `ឆ` and is obtained only through the B-family menu; an accented W begins with `ឆ` and is composed through W's own menu. The X sound can be written through **K + S**, not a dedicated X key.

## Khmer codepoint stacking model

A word is stored as the sequence of Khmer base characters and their chosen marks. The studio's logical output groups (1) Khmer COENG consonant sequences, (2) Khmer dependent vowels, then (3) other Khmer signs, retaining the relative selected order inside each group. This echoes Khmer Unicode *ordering*, but the three-mark combination system represents **Aza’raan**, not conventional Khmer phonotactics. An original Aza’raan-specific visual compositor places each mark above, below, left, or right of its base using the supplied font art, with distinct vertical tiers as needed to avoid collisions.

At most **three attached marks** (core or special) exist per letter. For example:

- `T + Short A + Z` uses Khmer base T plus the Short A and Z Khmer codepoints, read /tæz/ under Aza’raan rules.
- `K + S` produces the /ks/ combination without the letter X.
- `N + G` gives /ŋ/ and `N + Y` gives /ɲ/.
- `S + Hard H` gives /ʃ/.
- `W + B` has a B sound; `B + W` has a V sound.

The first mark may be below or beside the base; three marks do not have to be the same type or in the same physical lane. The saved glyph model retains the author's selected accent IDs separately from the sorted Unicode output. Reimported text can be reconstructed from the codepoints, but different ordering of semantically equivalent marks may not always be distinguishable outside this studio.

## Four special symbols

| Special | Font mark | Stored Khmer | Introduced as combining |
|---|---|---|---|
| Glottal `ʔ` | S01 | ៉ (U+17C9) | Classical |
| Click `¡` | S02 | ្ឃ (U+17D2 U+1783) | Classical |
| Previous syllable `‹` | S03 | ៌ (U+17CC) | Classical |
| Next syllable `›` | S04 | ៑ (U+17D1) | Classical |

Archaic's **standalone** glottal and click use the same all-Khmer encodings, but the app displays the full ancient-lineage artwork from `archaic_1.svg` and `archaic_52.svg`. A standalone Khmer combining sign (especially COENG sequences) may render with a dotted circle or improperly in general-purpose text editors; the dedicated studio rendering prevents that problem within the app.

## Font scope

Four original TTFs are included unmodified. The new three-mark layout is handled at the application level rather than silently claiming that every external font or browser implements arbitrary triple dependent-vowel positioning. This separation is essential for predictable rendering and avoiding glyph intersections.
