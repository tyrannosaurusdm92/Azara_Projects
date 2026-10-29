# Merge audit — 28 October 2026

## Inputs

- `Azaaraan_Sound_First_Keyboard_Glyph_Assignment_2026-10-28(2).zip`
- `Steampunk_Keyboard_Mockup_Keys_JSON_Emoji_Update(2).zip`

## Preserved from QWERTY

Steampunk theme, offline fonts, notes/local autosave, cursor-sensitive insert/delete, Latin long-press and symbols, native emoji picker and Emojipedia reference, clipboard, screenshot/PNG renderer, single 150 px bubble, click/move/responsive edges/corners, close/collapse, full numbers/symbols pages.

## Preserved from Aza’raan

Four genuine TTF era fonts; source Khmer Unicode mappings; sound-first inventory and per-letter pronunciation choices; 24 canonical accents with source validation and three-mark stacking; four special structural marks and Archaic standalone signs; supplied speech/IPA planner and click/glottal cues; original six-stage interactive evolution chart and underlying large historical data JSON; source images/SVGs including ancestral root artwork and accent glyphs; source docs, glyph tables and lineage registers.

## Integration changes

1. Language dropdown is part of the QWERTY floating toolbar, to the **left** of the emoji button; selecting Aza’raan reveals a second era dropdown.
2. The original Aza’raan stand-alone keyboard view is **not** instantiated: the Aza’raan keys render inside the QWERTY bubble's `#keyRows` container.
3. The keyboard writes encoded text into the one notes editor. The sound button reads its selected Unicode text, the adjacent settings button opens speech controls.
4. The second page embeds the **original evolution markup, data, and renderer**, not a screenshot or approximate image.
5. QWERTY key removal, Restore, `keys.json` import/export and JSON auto-fetch code were eliminated.
6. Existing files stay in the requested project tree; no second HTML page or new backend was created.

## Tested

Local headless Chromium DOM interaction with JS/CSS inlined (test harness only, **not** part of deliverable). Tested desktop 1200 × 800, mobile 390 × 844 and 320 × 568 with no uncaught JavaScript exceptions; switching language/eras; four-era key inventory; Khmer-encoded F; 24 accents and the three-mark rule; selected text vs full note; verified /tæz/ reading for T + Short A + Z; voice-setting panel; native emoji; no removable-key controls; 123 numbers; collapse/reopen; page-two chart and 252 interactive glyph nodes. Browser speech voices and device audio vary, and actual audible playback was not evaluated in the headless test.

## Not integrated as a second UI

The original source app's independent phonetics laboratory, separate manuscript workbench, glyph-upload manager, recording exercises and standalone speech layout were **not** separately rendered. The requested keyboard+evolution+speech features instead reuse their underlying data and phonetic engine in the bubble. The full original Aza’raan source can be recovered from the input ZIP, and its data/art/lineage documentation remains bundled.
