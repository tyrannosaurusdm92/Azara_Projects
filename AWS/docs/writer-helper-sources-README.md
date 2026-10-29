# Writer Helper Ready

`writer_helper_ready.zip` is the consolidated static Writer Helper / Onyx creative fallback brain. It reconciles the strongest prior Writer Tools build with the later conlang second-pass modules, merges the requested JavaScript filenames, deepens historical-linguistics/script/font and writing-craft support, and makes the William voice contract shared by both primary and fallback generation.

## Main capabilities

- story/fiction/nonfiction/scene/dialogue planning and drafting
- plot-hole, continuity, setup/payoff, cliffhanger and story-graph checks
- poetry/haiku/form, rhyme/syllable/stress support
- lyrics-only songwriting craft (no AI music/audio generation algorithms)
- audience/register/readability analysis
- 1,500+ year constructed-language evolution with sound change, contact, borrowing, slang, dialects, grammar change, language vitality/death/revival and orthographic history
- procedural digital glyph synthesis from meanings/sounds/history; user drawing is optional, not required
- real TrueType output plus language TXT/PDF/JSON/CSV reference artifacts through the existing export system
- William Saville voice governor that preserves author identity while repairing over-explanation, rushed thoughts, crowded/flat lyrics and same-voice dialogue
- authenticated OurSpace `onyx.chat` AI-Brain primary route with static JavaScript fallback when unavailable

## Consolidation

The original 49 strongest Writer Helper JS modules plus five later conlang modules were concatenated into 14 requested static JS files. Every source section is marked with its original filename and SHA-256. See `docs/MERGE_MAP.md`, `docs/SOURCE_HASHES.json` and `docs/AUDIT.md`.

## High-level API

After the stack loads, use `WriterHelperReady`:

- `WriterHelperReady.generate(request)` — remote Onyx/AI-Brain first, local fallback on failure
- `WriterHelperReady.analyze(text, options)` — craft/voice diagnostics
- `WriterHelperReady.evolveLanguage(input)` — deep conlang evolution
- `WriterHelperReady.createConlang(input, options)` — model + export artifacts
- `WriterHelperReady.createFont(result, options)` — generated TTF
- `WriterHelperReady.health()` — subsystem registration check

## Final reconciliation notes

- All 49 unique JavaScript filenames found across the newly supplied archives are represented in the consolidated build. Five later conlang modules recovered from the preceding strengthened pass were also carried forward, for 54 preserved source modules total.
- The public backend bridge now targets the supplied OurSpace endpoint through `onyx.chat`; the local William-voice brain is the offline/backend-failure fallback.
- There is no `script/` directory because no shipped capability requires Python/WASM at runtime.
- `Take Flight` was not found as a standalone lyric document in the linked Drive folder or as an exact title in the compiled-song document, so this build does not fabricate a song sample for it.
