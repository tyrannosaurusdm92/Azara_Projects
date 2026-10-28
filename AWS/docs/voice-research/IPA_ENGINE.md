# IPA coverage and audio behavior

The voice studio recognizes **51 distinct entries** in the creator's list (the supplied `/juː/` appeared twice). Compound entries such as `/tæz/`, `/kw/`, `/wɑ/`, `/ja/`, `/eɪ-ɛ/` and `/ow/` are explicitly preserved. `/eɪ-ɛ/` is treated as `/eɪ/` followed by a brief hiatus and `/ɛ/`; `/ow/` is literally `/o/` plus `/w/`, distinct from `/oʊ/`. These are creator-specified phonemic spellings, not changes to the 24 accent rules or Khmer Unicode assignments.

The internal `json/ipa-inventory.json` contains 117 IPA base symbols, 42 explicit sequences and 59 modifiers/notation signs. Its 12 reference groups record 335 sound examples drawn from the attached language and script PDFs, including French nasal vowels, Italian palatals, German fricatives, Māori vowels, click consonants, Malayalam retroflex sounds, Georgian ejectives, Aramaic emphatics, Greek palatals and Khmer aspirates. The extra reference groups are never rendered as visible buttons or menus.

Type a whole IPA sequence between slashes or brackets in the existing speech box: `/fʁɑ̃sɛ/`, `/qʼ/`, `/ǃ/`, `/tæzǃɑː/`. A bare IPA symbol such as `ɣ` also works. Khmer Aza’raan script and Latin accent input still use their original transcription rules. Unknown IPA symbols produce a warning instead of being silently discarded. The accent and IPA JSON have independent offline JavaScript mirrors for `file://` use.

On playback, the source IPA becomes an ordered pronunciation plan. Normal sound segments are sent to the installed browser speech voice as readable approximations. Click and glottal events trigger generated, short Web Audio transients in their actual positions. `/ǃ/` can sound on its own even without a browser speech voice. The cue is an audible approximation of a tongue pop; no synthetic transient guarantees the exact articulatory character of an isiXhosa click. The glottal cue represents a closure/release and is intentionally audible even in isolation.

There is no standard portable API for sending IPA phonemes directly to a `SpeechSynthesisUtterance`. Full phonetic fidelity for every included sound would require an appropriate phoneme-capable voice or recorded speech bank. The display preserves IPA exactly while labeling the voice text as an approximation. Voice pitch, speed and volume do not rewrite the IPA.

For maintainers: edit `docs/build-ipa-inventory.py`, run it to regenerate both `json/ipa-inventory.json` and `js/ipa-data.js`, then run `node docs/test-accents.js` and `node docs/test-ipa.js`.

References: the 12 PDFs supplied with this revision; [International Phonetic Association chart](https://www.internationalphoneticassociation.org/node/1061); [Web Speech utterance text](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/text).
