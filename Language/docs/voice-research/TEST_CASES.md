# Accent and voice regression checklist

All 29 explicit examples from the authoritative 24-accent table (including several multi-mark and contextual examples) are tested in `docs/test-accents.js`; they must all pass.

## Automated checks

1. All 24 mapping rows have the exact creator names, visual forms, Khmer code points, and examples.
2. `js/data.js` and `js/tts-data.js` are direct serialization mirrors of the current JSON rule files.
3. `transcribe` reads the 29 examples and both canonical names with correct IPA.
4. The Latin combining-accents `T́`, `B̀`, `Ḃ` are all normalized and mapped correctly.
5. `voiceBase=100` reports Feminine (right); `voiceBase=50` reports Androgynous; `voiceBase=0` reports Masculine; all three retain identical IPA.
6. `speak()` sends the same deterministic browser-readable text with any pitch setting. No voice names appear in the UI.
7. `node docs/test-ipa.js` checks all 51 distinct creator IPA entries, 335 entries grouped from the attached references, slash-delimited IPA, Khmer click/glottal marks, unknown-symbol warnings and generated sound events.
8. `node docs/test-practice.js` checks the 51 sound cards, four comparison filters, regional and worldwide voice routing, and microphone record/replay lifecycle with browser mocks.

## Manual/browser checks

- Open `index.html` and verify the single voice-base slider is fully right by default.
- Type/paste a vowel-marked Khmer letter; add a final consonant; verify the IPA includes both components, not the old Khmer vowel meaning.
- Test click and glottal markers on a machine with Web Audio; an isolated click/glottal cue should be audible and an embedded click should split speech on both sides.
- Verify B-hold outcomes use B+W for V, B+F for F, and W+Base for W.
- Verify the 52-root atlas and historical images still load.
- Test actual audible speech in the intended browser with a compatible installed system voice; static tests cannot prove real voice gender or accurate glottal/trill articulation.
- In the workshop, try each filter, slow playback, repeats, and contrast; grant microphone access, record a short attempt, play it back, and verify the browser releases the microphone after stopping.
- Test a device with a Māori, Romance, African or Arabic voice; the comparison button should activate only for an installed matching voice. The worldwide selector should list all browser-reported locales without changing the Aza’raan model.
