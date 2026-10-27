# Aza’raan Language Studio — Fully unified voice + keyboard + evolution

## Open
Extract the ZIP fully, retaining all folders together. Open the **single `index.html`** in a supported browser. Desktop Chromium / Edge is recommended for local fonts, TTS and clipboard. No account or server is needed for keyboard/evolution and the built-in Web Speech interface. Voice synthesis depends on speech engines provided by your browser/operating system; some voices may require a network connection. The ZIP **does not contain a trained Aza’raan voice model or pre-recorded speech**.

## Page 1 — Keyboard & voice
- The Aza’raan glyph keyboard shows the 21 keys ABDEGHIJKLMNOPRSTUWYZ. **B** press-and-hold exposes B/F/V/plain W; the standalone W key requires an accent. Press-and-hold a key or choose “Edit last letter’s marks” to compose a glyph with up to three attached marks. Archaic ¡ and ʔ are independent signs; Classical, Traditional and Modern can attach the four structural markers.
- The writing desk, its Khmer Unicode output and the voice's live IPA preview share the **same logical letter tokens**, preventing double re-interpretation of Unicode order. The **Speak writing desk** button voices the current composition; Stop halts the reading. The voice laboratory can also read a typed Aza’raan/romanized sentence, an exact /IPA/ transcription, or use the manuscript via “Use writing desk.”
- “English sounds → Aza’raan script” converts common romanized names and supports custom exact recipes. Insert or Replace brings the pronunciation into the writing desk, and voice output uses the resulting tokens. Custom pronunciations are stored in your browser's localStorage.
- The 24 accent rules are defined by `js/config.js` and canonical phonetic recipes use `js/phonetic-data.js`, `js/phonetic.js` and `json/phonetics.json`. Voice rendering calls **those canonical compiled rules** rather than a conflicting replacement mapping.
- The voice pitch/depth slider adjusts delivery and does not modify glyphs or phonemes. Rate and volume also control delivery. Glottal /ʔ/ and click /ǃ/ use procedural sound cues. Speech synthesis approximates IPA using the device's voices; it cannot guarantee authentic phonetic rendering of every Aza’raan sound.
- Pronunciation workshop: hear available model approximations, explore installed Oceanic/Romance/African/Arabic speech voices, and optionally record/replay your own voice using browser microphone permission.

## Page 2 — Evolution
Interactive Proto/Egyptian roots, Ancient, Archaic, Classical, Traditional and Modern lineage diagram from the richer original build. Select glyphs to inspect transitions, artworks and family lines. This is on the **second tab only**.

## File layout
- `index.html` — only HTML entry point.
- `js` — studio, conversion, pronunciation, IPA, synthesized speech, practice and evolution scripts.
- `css` — original studio, evolution, phonetics, voice and integration styles.
- `json` — current accent mappings, sound recipes, evolution data, voice inventory, source maps.
- `docs` — documentation, verification scripts, version history and source notices.
- `assets/images`, `assets/svg`, `assets/audio`, `assets/ttf` — original images, SVG glyph art, sound notes and four historical font files. `assets/audio` contains no pre-recorded native voice samples: speech playback uses Web Speech.

### Integration notes
`js/voice-adapter.js` and `json/source-voice/` are retained from the voice-source package for auditability, but `js/voice-adapter.js` is intentionally NOT loaded because it would replace the canonical `AZA_DATA` object used by the English-to-Aza’raan engine. The merged voice player reads the canonical `AZA_DATA` directly. `assets/svg/voice-source` and `assets/svg/refined-contrast` are preserved as original alternate artworks; the live font/glyph files are unchanged.

### Limitations
- Accent combos follow up-to-three total marks, with at most one short/long vowel nucleus, and Base cannot coexist with another ordinary accent. Some actual Khmer shaping engines render combined signs differently when pasted outside the studio.
- Web Speech does not accept IPA as a native specification; printed IPA is more exact than the synthesized approximation. The browser may require enabling system voices before voice output works.
- Saved text and pronunciation recipes are stored locally in the browser, not uploaded anywhere. Cross-browser synchronization is not included.
