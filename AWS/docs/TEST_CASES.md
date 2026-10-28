# Aza’raan merged studio — verification scenarios

## Tab 1 / Canonical accent meanings

1. Exactly 23 visible keys: `ABDEFGHIJKLMNOPRSTUVWYZ`, with no standalone X key; F and V use their B-family Khmer glyph-plus-accent mappings.
2. Accent table contains exactly 24 main accents and four distinct structural markers.
3. Hold B offers B, F, V and plain W. The W key offers **only accented W**.
4. All Modern base letters may receive all 24 accent choices, subject to sound compatibility rules.
5. `T+SHORT_A+Z` produces a single logical letter /tæz/.
6. `T+SHORT_A+Z+S` produces **three attached marks** and is valid.
7. `T+SHORT_A+Z+S+CH` is rejected for exceeding the three-mark capacity.
8. `T+SHORT_A+SHORT_E` is rejected in exact sound recipe mode; choosing Short E on an existing Short A letter in manual composition **replaces** the earlier vowel.
9. `B+BASE+F` is rejected: Base cannot share a letter with other ordinary accents.
10. `K+S` = /ks/, `B+W` = /v/, `N+G` = /ŋ/, `N+Y` = /ɲ/, `T+CH` = /tʃ/, `D+CH` = /dʒ/, `S+HARD_H` = /ʃ/.
11. Exact `N+GLOTTAL+SHORT_I+Z` uses three attached marks and is valid in Classical+.
12. Pronunciation examples Pix, Lohkahna, N'zra, Vahkohr and Aza'raan appear; clicking a sample fills its exact recipe.
13. Inserting phonetic output changes the *same* manuscript used by the manual keyboard. Copy produces only Khmer Unicode for its letters and marks (plus user-added whitespace).
14. Replace manuscript asks for confirmation if it would replace existing text. Saved personal pronunciation can be restored to default.
15. Archaic standalone ¡ and ʔ show entire ancestral glyph SVG artwork, not a detached accent.
16. Classical, Traditional and Modern permit four structural attachments, subject to three-mark cap.
17. Copy, paste/import, and local save/reload should retain the manuscript.

## Tab 2 / Evolution history

1. Evolution displays Proto, Ancient, Archaic, Classical, Traditional and Modern stages.
2. Historical archive contains 52 ancestral roots and independent modern families.
3. Selecting a modern letter traces the branch through older rows and updates the historical inspector.
4. Original white-ink SVG drawings remain visible on the dark chart; the black-ink alternate art is archived in `assets/svg/refined-contrast/`.
5. There is only **one** HTML entry: `index.html`, using local relative scripts, CSS, fonts and images.

### Automated source validation

The JavaScript phonetic engine has also been run against positive and invalid recipes using Node's VM, without requiring a browser. The source package validates the required local art and script paths, but full cross-browser visual/font testing is still recommended.
