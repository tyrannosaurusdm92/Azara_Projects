# Full merge — validation and source audit

## Source editions
- Azaaraan_Language_Studio_Voice_Evolution_Complete(1).zip
- Azaaraan_Language_Studio_Best_of_Both_Merged(1).zip

Both original sets of SVG alternatives and source research notes are retained; overlapping interfaces were resolved into a single index and single current writing/voice dependency chain.

## Combined functionality
1. The first tab opens with the manual writing desk, keyboard and Speak writing desk button, followed by the English sound converter, 24-accent reference and full voice workshop.
2. The second tab is exclusively the original evolution atlas, with glyph images and interactive lineage.
3. Voice reads the keyboard's logical tokens via `AzaaraanPhonetics.compile`; the Unicode export and phoneme output therefore draw on the same canonical 24-mark map.
4. The voice text field supports Latin phonetic spellings, saved character recipes, direct Khmer-encoded text and /IPA/ literals; it can also link to the writing desk.
5. Structural clicks/glottals generate procedural percussive cues. Voice pitch/rate/volume controls affect delivery, not pronunciation assignments.
6. Original alternate assets and developer research are retained. Obsolete `js/voice-adapter.js` is archived but intentionally not loaded.

## Automated checks
- **verify-phonetics.js**: 23 checks completed, 0 failures.
- **test-merge.js**: 29 accent examples, three-mark stack, archaic signs, phrase audio, live edits, names: PASSED
- **test-ipa.js**: 51 creator entries + 335 reference symbols + sound-event checks: PASSED
- **test-practice.js**: 51 sound cards, four filters, regional/world voices, local recording: PASSED

JavaScript syntax was checked with Node; headless Chromium tested the inlined combined interface including keyboard input, conversion, tab switching, canonical IPA mapping, and a Speak/Stop click sequence, with no uncaught page errors. Headless speech output is not a guarantee of audible sound on all devices. Direct local-file navigation in the test browser was blocked by administrator settings, so the headless functional check loaded equivalent HTML/JS inline; extracted `file://` operation should be checked on the user's system.
