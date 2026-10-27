# Preserved prior documentation

## README_WRITER_TOOLS.md

```text
# Writer Helper

Current build: William Saville voice + research-driven craft governor, using Onyx AI-brain as the primary writer and the same voice/craft system as a static local fallback. The package remains browser/static-host compatible. Historical pass notes follow.

# Writer Tools Studio

This package is a general-purpose fiction-writing toolkit for planning, drafting, branching stories, character work, dialogue, continuity, worldbuilding, relationship arcs, timelines, source/reference material, and project memory.

## Content boundary

Romance and affectionate material may remain on-page. If a scene would move into sexual content, the system transitions to `[Fade to black.]` and resumes afterward with emotional, practical, character, or plot consequences. The package contains no explicit-scene generator or explicit-generation route.

## Generation

The toolkit can use its local story composer without a backend. An optional external writer provider can be configured through `window.WRITER_TOOLS_BACKEND_URL` or `window.WRITER_TOOLS_BACKEND_PROVIDER` before `writer-backend-provider.js` initializes.

## Core modules

- `writer-tools-app.js` — Writer Tools Studio UI/application shell.
- `writer-branching-engine.js` — branching and short-story engine.
- `writer-generation.js` — general story generation helpers.
- `writer-project-data.js` — neutral starter project data.
- `writer-character-*` — character context, prompts, dialogue, reactions, and library tools.
- `writer-continuity*.js`, `writer-memory.js`, `writer-timeline.js` — continuity and project-memory tools.
- `writer-lore-library.js`, `writer-setting-generator.js`, `writer-people-places.js` — worldbuilding/reference tools.
- `writer-relationship-engine.js` — relationship arc support.
- `writer-romance-boundary.js`, `writer-content-boundary.js`, `writer-fade-to-black.js`, `writer-fade-controller.js` — romance boundary and fade-to-black handling.
- `writer-backend-provider.js` — optional configurable provider integration.
- `writer-integration-diagnostics.js` — integration checks.

## Validation performed

- All JavaScript files pass `node --check` syntax validation.
- All 38 non-DOM modules load together in the integration smoke test.
- A normal romance branch generates through the local writer without accidentally invoking the fade route.
- A fade-to-black branch produces the fade transition and does not generate sexual details.
- Legacy person-specific/fanfiction routes and old explicit-generation filenames are absent from the refactored JavaScript.


## 2026 Research Strengthening Pass

The existing 39-module runtime has been strengthened in place with offline prose/readability diagnostics, audience targets, poetry and lyric analysis, music-theory/prosody helpers, dialogue diagnostics, causality/continuity checks, cliffhanger tracking, trope handling, interactive-story graph analysis, and large lazy compressed craft/lexical reference packs.

No new runtime JavaScript files were added. The only new files are compliance/project documentation under `docs/`. Python was used only as a build-time data transformer; there is no Python runtime dependency, so no WASM `script/` folder is needed.

Large dictionaries and craft atlases remain gzip-compressed inside the existing JavaScript modules and inflate only when their APIs are called. Romance remains supported with the existing fade-to-black sexual-content boundary.


## Language evolution / conlang pass
The suite can now evolve a user-defined ancestral language and pictographic/hieroglyphic sign set through historical stages; model sound, grammar, lexicon, slang, contact, regional variation and language vitality; derive a descendant writing system; generate a real TrueType font from contours/SVG/bitmap/browser-rendered glyph input; and export the resulting reference as TXT/CSV/PDF. See `docs/README.md (Language Evolution Research & Implementation Sources)`.


### Example: 1,500-year descendant language

The language runtime accepts an ancestral phoneme inventory, grammar/lexicon, user-defined signs or hieroglyphs (meaning + spoken word + sound value + optional SVG/contours/bitmap), and a dated history. `WriterToolsRuntime.evolveLanguage(...)` can then simulate descendant stages; `WriterToolsRuntime.languageArtifacts(...)` can package the result into rules/reference text, JSON, a letter-evolution CSV, a TrueType alphabet font, and (in a browser) a PDF guide. Script events can specify writing medium, direction changes, standardization/replacement, explicit added signs, and retired signs.

## 2026-09-21 Expansion Pass II

The current runtime remains **44 JavaScript modules**; this continuation pass adds **zero new non-document runtime files**. Existing language and writing modules were expanded in place.

Highlights:

- +80,000 lazy-compressed language-evolution research records.
- +40,000 lazy-compressed creative-writing/craft research records.
- Expanded sound change, phonotactics, borrowing, dialect/register, slang, vitality, grammar, orthography, script evolution, and letter addition/loss handling.
- Fully digital procedural descendant-glyph generation when no hand-drawn glyph source exists; supplied SVG/contour/bitmap/character sources remain supported.
- `WriterToolsFontTTF.buildFromLanguage(...)` creates a real TrueType font from the evolved writing system.
- `WriterToolsLanguageExport.buildArtifacts(...)` returns an expanded rules/reference text plus language JSON/CSV/TTF artifacts; the existing browser PDF path remains available.
- Expanded scene/tension/cliffhanger/trope/dialogue planning, long-form blueprinting, continuity/plot-hole checks, prose diagnostics, audience lenses, poetry/haiku planning, and song/prosody planning.
- Static browser/GitHub-host compatibility preserved; no Python runtime and no WASM requirement were added.

See `docs/README.md`, `docs/AUDIT.md`, `docs/LICENSES.md`, and `docs/MANIFEST.json` for research sources, validation, license notes, hashes, and size information.


```

## WRITER_TOOLS_REFACTOR_AUDIT.txt

```text
WRITER TOOLS REFACTOR AUDIT

Result: PASS

- 39 JavaScript modules renamed/reframed as writer tools.
- Person-specific Jasper/fanfiction specialization removed from active code.
- Legacy explicit/private generation routes removed.
- Explicit-scene bridge replaced with a fade-to-black transition module.
- Romance remains available without being treated as explicit content.
- Sexual escalation is bounded to [Fade to black.] and resumes afterward without sexual detail.
- Hard-coded personal backend identity removed; provider configuration is generic and optional.
- Neutral project/style/character/worldbuilding data replaces personal fanfiction corpus data.
- Standalone local story generation remains available when no provider is configured.

Validation:
- JavaScript syntax: PASS (39/39)
- Legacy specialization scan: PASS
- Stale source filename scan: PASS
- Explicit-generation route scan: PASS
- Core story + fade smoke test: PASS
- Non-DOM module load test: PASS (38 modules)


RESEARCH STRENGTHENING PASS — 2026-09-21
- Existing runtime file count preserved: 39 JS modules.
- Embedded lexical packs: 24 lazy gzip indexes.
- Narrative Craft Atlas: 28 shards / 114,688 craft cards.
- Python used only at build time; no Python runtime is shipped.
- No `script/` WASM folder was added because the shipped runtime has no Python-only dependency.
- Added `docs/` for README, audit, manifest, and license/source notices.

FINAL TESTS
- 39/39 JavaScript syntax checks passed.
- Integrated runtime smoke test passed.
- Lexical gzip pack decompression and rhyme/syllable/spelling lookups passed.
- Narrative Craft Atlas gzip shard decompression and filtered sampling passed.
- Readability, poetry, music, graph, plot-audit, and fade-to-black boundary tests passed.
- Forbidden Jasper/fanfiction/legacy explicit-route scan returned no JavaScript matches.


LANGUAGE EVOLUTION PASS
- Added 5 new JS modules (authorized maximum): phonology, language evolution, script evolution, TrueType builder, and language export.
- Added original offline atlases totaling 530,000 research-derived scenario cards.
- Added a real dependency-free TTF writer and browser PDF/TXT/CSV exporters.
- No Python runtime dependency; no WASM required.


LANGUAGE EVOLUTION PASS FINAL VALIDATION
- Runtime JavaScript total: 44 modules (39 existing + exactly 5 authorized additions).
- All 44 pass JavaScript syntax validation.
- 43 non-UI modules load together in one runtime with zero load failures.
- 1,500-year end-to-end simulation passed.
- TrueType output passed independent FontTools parsing and exposes valid Private Use cmap entries.
- TXT/JSON/CSV/TTF output integration passed; PDF byte construction passed pdfinfo validation.
- Language/phonology/script lazy atlases decompress and sample successfully.
- No Python runtime was introduced, so no WASM script folder is necessary.
- Fade-to-black content boundary remains intact.

EXPANSION PASS II — 2026-09-21
- Continuation expansion; 44 runtime JS modules preserved, 0 new non-doc runtime files.
- Added 80,000 lazy-compressed language-evolution research records in existing writer-language-evolution.js.
- Added 40,000 lazy-compressed craft/writing records in existing writer-scene-beats.js.
- Strengthened phonology, sound change, loan adaptation, grammar, dialect/register, slang, vitality, orthography and script-evolution APIs.
- Strengthened long-form writing, tension/release, dialogue, cliffhanger, trope, continuity/plot-hole, poetry/haiku, song/prosody and audience tooling.
- Added deterministic fully digital glyph synthesis for evolved alphabets where no drawn contours are supplied.
- End-to-end 1,500-year simulation + TTF generation passed; generated font independently parsed with FontTools.
- 44/44 JavaScript syntax PASS; 43/43 non-UI integration-load PASS.
- Static-host/browser compatibility preserved; no Python runtime; no WASM required.


2026-09-22 WILLIAM VOICE + ONYX DUAL-PATH PASS
- Project output name: writer_helper.zip
- Current runtime modules: 49 JavaScript files.
- Added user-authored corpus modules: stories, poetry, lyrics.
- Added writer-william-voice.js and writer-fallback-brain.js.
- Onyx AI-brain remains the primary generation path at the configured Apps Script endpoint.
- Local fallback uses the same William voice/craft contract when the backend fails.
- Primary and fallback output both receive postflight William-specific audit/repair behavior.
- Voice is applied to prose/content planning/generation routes, including language/history explanatory prose.
- Binary font writing, persistence, parsers, graphs, and other mechanical infrastructure remain intentionally voice-neutral.
- No Python runtime and no WASM required.

```

## Previous docs/AUDIT.md

# Writer Tools Studio — Research Strengthening Audit

> The opening sections below record the prior writing-craft strengthening pass. The current language-evolution pass is recorded under **Language Evolution / Script / Font Pass**.

Date: 2026-09-21

## Scope

- Preserved the existing **39 JavaScript runtime files**; no new runtime JS files were introduced.
- Added documentation only under `docs/`.
- Added no Python runtime and therefore no WASM `script/` directory.
- Strengthened fiction, nonfiction, poetry, haiku, lyrics/songwriting, music-writing support, audience targeting, prose, scenes, dialogue, tension/release, causal plot movement, plot-hole detection, cliffhangers, tropes, and interactive branching.

## Embedded offline resources

- Lexical packs: **24** independent lazy gzip indexes.
- Narrative Craft Atlas: **28** lazy gzip shards / **114,688** original craft cards.
- Lexical gzip payload before base64: **10,552,821 bytes**.
- Craft-atlas gzip payload before base64: **23,744,976 bytes**.

## Research implementation policy

- Third-party repositories were researched for concepts/API patterns and licensing.
- Their source code was not bulk-copied into this package.
- Redistributable CMUdict and SCOWL/Hunspell data were transformed into project-specific compressed indexes; full installed notices are preserved in `LICENSES.md`.
- The Narrative Craft Atlas is newly generated original project data.

## Project/content boundary

- No Jasper-specific or fanfiction-specific system was reintroduced.
- No legacy explicit-generation route was added.
- Romance remains supported; sexual escalation remains fade-to-black only.

## Release validation

Syntax checks, module-load smoke tests, lexical/craft-pack decompression tests, feature tests, forbidden-route scans, ZIP-size verification, and ZIP-integrity verification are performed after this document is generated. Final results are recorded in the root audit and package manifest.


## Final validation results

- JavaScript syntax: **39/39 runtime modules passed `node --check`**.
- Integrated module-load smoke test: **passed** for the non-UI runtime set.
- Offline lexical decompression: **passed** (24 packs discovered; pronunciation-backed rhyme, syllable, and spelling-candidate lookups exercised).
- Narrative Craft Atlas decompression: **passed** (28 shards / 114,688 cards; form/audience-filtered sampling exercised).
- Readability/prose diagnostics: **passed**.
- Poetry/haiku analysis: **passed**.
- Music-theory helpers: **passed**.
- Story graph causality/tension/cliffhanger helpers: **passed**.
- Extended plot-hole audit: **passed**.
- Fade-to-black chapter-boundary smoke test: **passed**.
- JavaScript scan for `Jasper`, `fanfic`, `fanfiction`, `generate-explicit`, `explicit-detailed`, legacy private-interlude routes, and adult-mode routes: **no matches**.
- Runtime JavaScript file count: **39**, unchanged.


## Language Evolution / Script / Font Pass

Added 5 runtime JavaScript files (exactly the user-authorized maximum of 5):

- `writer-phonology.js`
- `writer-language-evolution.js`
- `writer-script-evolution.js`
- `writer-font-ttf.js`
- `writer-language-export.js`

No WASM file was added because there is no Python runtime dependency.

Embedded original offline atlases:
- language evolution: 320,000 records
- phonology/inventory design: 120,000 records
- script evolution: 90,000 records

Existing files strengthened in place: `writer-runtime.js`, `writer-material-hub.js`, `writer-source-context.js`, `writer-reference.js`, manifests, README/license/audit documentation.


### Current-pass validation

- JavaScript syntax: **44/44 runtime modules passed `node --check`**.
- Existing + new non-UI runtime load test: **43 modules loaded together with 0 errors** (`writer-tools-app.js` excluded because it is DOM/UI entrypoint code).
- 1,500-year language simulation: **passed**, including phonology, grammar, borrowing/slang stages, script evolution, active/retired letters, and letter-name/word tracking.
- Script innovation coverage: **passed**; phonographic stages can differentiate new signs for newly unrepresented phonemes and can retire signs during explicit reforms.
- TrueType output: **passed independent FontTools parsing** for `cmap`, `glyf`, `loca`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `OS/2`, and `post`; generated glyphs mapped to Unicode Private Use code points.
- Language export integration: **passed** for TXT, JSON, CSV, and TTF artifact generation.
- Low-level PDF writer: **passed `pdfinfo` validation** with a one-page test PDF. Browser Canvas remains responsible for rendering the full Unicode/IPA/custom-font guide before PDF assembly.
- Lazy atlas decompression/sampling: **passed** for language, phonology, and script shards.
- New-file cap: **exactly 5 new files**, with no original package files removed.
- No Python runtime dependency; **no WASM/script folder required**.
- Active JavaScript scan: no Jasper/fanfiction or legacy explicit-generation routes reintroduced; existing fade-to-black boundary remains unchanged.

## Expansion Pass II validation — 2026-09-21

Result: **PASS**

- Continuation pass: existing architecture retained; no new non-document runtime files created.
- Runtime modules: 44 JavaScript files (unchanged from the supplied package for this pass).
- JavaScript syntax: 44/44 pass `node --check`.
- Non-UI integration load: 43/43 non-UI modules load together; `writer-tools-app.js` is intentionally omitted from the Node DOM-less load test.
- Language research expansion: 8 lazy gzip shards / 80,000 original records.
- Writing craft expansion: 8 lazy gzip shards / 40,000 original records.
- Language research shard decompression/sampling: PASS.
- Craft research shard decompression/sampling: PASS.
- 1,500-year end-to-end language simulation from user-defined pictographic signs: PASS.
- Dialect-network generation, detailed vitality model, grammar guide, register/slang/lexical innovation, orthography profile, and script evolution: PASS.
- Digital no-drawing font path: PASS. Missing visual glyphs receive deterministic procedural outlines; supplied contours/SVG/bitmap/characters remain supported.
- TrueType generation: PASS. Generated test font is recognized as TrueType, contains `OS/2`, `cmap`, `glyf`, `head`, `hhea`, `hmtx`, `loca`, `maxp`, `name`, and `post`, and parses successfully with FontTools.
- Language-reference text export: PASS; includes phonology, grammar, registers/regional varieties, vitality, orthography, writing system, letter evolution, historical stages, lexicon, and caveats.
- Existing content-boundary architecture was not replaced or loosened by this pass.
- Runtime remains static-browser JavaScript. Python was build/test tooling only; no Python runtime or WASM requirement was introduced.

### Size target

The supplied ZIP is 74,305,079 bytes. A pre-documentation size check of the expanded package is 95,049,256 bytes, an increase of 20,744,177 bytes (~20,258 KiB / 20.74 MB), within the requested +10,000–30,000 KB post-compressed range. Final ZIP size is recorded after documentation/hashing in the final handoff.


## 2026-09-22 — William Voice / Onyx Primary + Local Fallback Audit

This pass changes the current runtime from the historical 44-module Expansion Pass II state to **49 JavaScript modules**. The five additions are `william-saville_stories.js`, `william-saville_poetry.js`, `william-saville_lyrics.js`, `writer-william-voice.js`, and `writer-fallback-brain.js`.

### Authorial contract

The supplied William corpus is the authorial evidence source. Research-driven craft rules are a correction/amplification layer, not a replacement voice. The combined contract is used by both the Onyx AI-brain path and the local fallback path.

The contract explicitly preserves emotional transparency, sensory/concrete anchoring, accessible metaphor, earnest stakes, meaningful repetition, consequence, and earned hope. It explicitly improves redundant explanation, rushed transitions, incomplete articulation, dialogue naturalism/distinctness, lyric density/hook focus, poetic compression, and readable/qualified language-history exposition.

### Creative-route coverage

Voice-critical integrations include:

- primary provider prompts + postflight audit/repair (`writer-backend-provider.js`);
- offline/static fallback (`writer-fallback-brain.js`, plus the existing branching engine local composer);
- story/branch/revision request construction and validation;
- character prompt, character context, character-library prompt, and dialogue generation;
- scene-beat, setting, source-context, audience, reference/style, material-hub, and people/place descriptive routes;
- branch-choice wording and fade-to-black bridge prose;
- poetry, haiku, lyric/song, and nonfiction planning;
- phonology explanations, language-rule guides, historical narrative, script-history narrative, and language-reference export.

Character speech is protected from authorial homogenization: William's voice controls authorial framing, while character profiles control quoted speech and social behavior.

### Intentionally voice-neutral infrastructure

No authorial rewrite logic is injected into TTF binary serialization, stream parsing, dialogue parsing, localStorage/session persistence, continuity ledgers, story graphs, project-data storage, timeline state, relationship-state arithmetic, or content-boundary enforcement. Applying prose style inside those layers would corrupt data or create unnecessary coupling. They remain compatible with and transport the voice-aware objects produced elsewhere.

### Dual-path behavior

Primary: Onyx AI-brain endpoint configured in `writer-backend-provider.js`.

Fallback: if the provider or generic generation action fails, the same request is routed to `WriterFallbackBrain`, which uses the same William voice packet and performs audit → heuristic repair → polish before returning content.

The generic backend action defaults to `writer.generate` and can be changed with `window.WRITER_TOOLS_GENERIC_ACTION` without changing the bundled endpoint or the story create/branch/continue actions.

### Final validation

See `docs/MANIFEST.json` for final syntax/load/generation/font/export validation values after packaging.


## Previous docs/README.md

# Writer Tools Studio — Research Strengthening Pass

This package preserves the same 39 JavaScript runtime modules and strengthens them in place. New files are documentation only, under this `docs/` directory.

## What was strengthened

- **General prose:** sentence/paragraph statistics, passive-voice and repeated-word heuristics, wordiness/weasel checks, dialogue ratio, and Flesch Reading Ease, Flesch-Kincaid, ARI, Coleman-Liau, Gunning Fog, and SMOG estimates.
- **Audience:** presets/targets for early reader, middle grade, YA, general adult, literary, commercial, plain-language, web, professional, and academic writing.
- **Fiction/storytelling:** scene goal/conflict/stakes, cause-and-effect movement, setup/payoff, tension waves, reversals, aftermath, pacing, trope handling, cliffhanger debt, and interactive choice consequences.
- **Nonfiction:** truth-state reminders that separate verified fact, remembered fact, reconstruction, inference, and uncertainty.
- **Dialogue:** speaker fingerprints, subtext prompts, exposition-warning heuristics, turn length, questions, hedges, contractions, and voice-similarity checks.
- **Poetry:** line/syllable analysis, form targets, rhyme-scheme approximation, and asynchronous pronunciation-backed syllable analysis. Haiku treats 5/7/5 as an optional English-language target rather than the only valid form.
- **Song/music writing:** verse/chorus/bridge parsing, hook repetition, lyric syllable/rhyme analysis, prosody guidance, note/MIDI/frequency conversion, transposition, scales, triads, and common progression templates.
- **Plot integrity:** chronology, character state, location, relationship, setup/payoff, canon, POV, knowledge-state, object continuity, motivation shift, causal-reference, and open-cliffhanger checks.
- **Offline wordcraft:** pronunciation, rhyme, near-rhyme, syllable, stress, meter, cadence, alliteration, assonance, consonance/coda, spelling candidates, prefix/suffix, length, and word-shape indexes.

## Large offline packs

`writer-reference.js` contains lazily inflated lexical indexes derived from CMUdict and the installed SCOWL/Hunspell English word list. `writer-scene-beats.js` contains a lazily inflated Narrative Craft Atlas of 114,688 original craft cards spanning fiction, creative nonfiction, memoir, essays, features, poetry, haiku, song lyrics, stage scenes, interactive fiction, middle grade, YA, literary/commercial work, romance, mystery, thriller, fantasy, science fiction, horror, comedy, and historical writing.

The packs use `DecompressionStream('gzip')` in modern browsers. A host may provide `globalThis.pako` as a fallback. Ordinary writer functions do not inflate every pack automatically.

## Runtime boundary

Romance can stay on-page, but sexual escalation remains fade-to-black only. This pass does not add an explicit generator or hidden explicit route.

## Python / WASM

Python was used only in the build environment to transform redistributable dictionaries into browser-ready gzip indexes. Nothing in the shipped runtime depends on Python, so a WASM `script/` directory was not added.

## Research basis

The pass was informed by: write-good (lightweight prose lint categories), retext-readability (multi-formula readability), compromise and wink-nlp (browser-side NLP architecture), ink/inkjs (branching narrative/state design), Tonal (music-theory API surface), abcjs (browser music notation architecture), CMUdict (pronunciation data), Poetry Foundation materials on haiku/form/rhythm, Berklee songwriting materials on prosody and lyric/melody/harmony alignment, Purdue OWL on creative-nonfiction truthfulness, and Reedsy craft materials on scenes, dialogue, tension, plot holes, cliffhangers, conflict, and tropes.

Third-party project code was not bulk-vendored in this pass. Techniques were independently implemented; embedded third-party data is limited to redistributable language data covered in `LICENSES.md`.


## Language Evolution & Conlang Tools (2026-09-21 pass)

New modules add historical linguistics, phonology/phonotactics, dialect/contact/slang/vitality simulation, script and glyph evolution, real TrueType font construction, and TXT/CSV/PDF export. A language can begin from user-defined hieroglyphs/pictographs with meanings and sound values, receive a historical-event timeline, evolve for a requested time depth (for example 1,500 years), and produce a modern phonology, grammar, lexicon, letter-evolution table, writing system, and `.ttf` font. See `README.md` (Language Evolution Research & Implementation Sources).


# Language Evolution Research & Implementation Sources
# Language Evolution, Writing Systems, and Font Generation Research Pass

## Scope

This pass adds a diachronic linguistics and constructed-language subsystem to Writer Tools Studio. It is designed for prompts such as:

> “These ancestral pictographs mean X/Y/Z and had these sound values. These historical events happened. Fast-forward 1,500 years and give me the descendant language, its grammar, its letter/sound evolution, and a TrueType font.”

The runtime separates spoken-language evolution, social history, orthographic change, and glyph design. This avoids the false assumption that spelling automatically tracks pronunciation or that every writing system develops toward an alphabet.

## Research principles encoded

- Regular sound change can be conditioned by phonetic environment, but lexical diffusion, analogy, borrowing, style, and dialect can create exceptions. The engine covers assimilation, dissimilation, lenition/fortition, palatalization, voicing/devoicing, vowel shifts, reduction, syncope/apocope/aphaeresis, epenthesis/prothesis/paragoge, metathesis, haplology, mergers, splits, chain shifts, and tonogenesis-style pathways.
- Grammaticalization is modeled as category/function change plus semantic bleaching and often phonological erosion: e.g. demonstrative → article; relational noun → adposition/case marker; verb → auxiliary/TAM marker; pronoun → clitic/agreement.
- Contact can introduce loanwords, calques, loan phonology, structural convergence, prestige effects, code-switching contexts, and new-dialect/koine formation. Loanwords are adapted through the receiving inventory and phonotactics rather than blindly copied.
- Slang and neologisms can arise through clipping, blending, compounding, acronyms/initialisms, reduplication, respelling, semantic shift, conversion, borrowing, backformation, and affixation. Diffusion depends on community and register.
- Regional varieties may converge, diverge, level, or reallocate variants across social meanings. The engine permits dialect branches rather than collapsing every change into one standard.
- Language vitality uses a multi-factor heuristic. Intergenerational transmission is heavily weighted, but the code explicitly warns that no single factor determines real-world vitality.
- Writing systems can remain mixed, conservative, or be deliberately replaced/reformed. Script type and language type are not equated.
- Alphabet history is represented as a historically specific lineage: early alphabetic signs in Egypt/Sinai used acrophonic principles; Phoenician signs were adopted/adapted by Greek; Etruscan/Old Italic adaptations fed into Latin. Greek adaptation included repurposing some inherited consonantal signs for vowels. Latin later differentiated or added forms such as G, J, U, W, Y, and reintroduced Z in different historical contexts. Deep pictorial identifications are marked cautiously where scholarly reconstructions are less certain.
- Modern Latin-script orthographies frequently extend the inherited core through diacritics, digraphs, reversed/modified forms, and new letters.

## GitHub / software research

### opentypejs/opentype.js — MIT
https://github.com/opentypejs/opentype.js
Research use: browser/Node font architecture, TrueType/OpenType table expectations, glyph outline concepts, Unicode mapping, and proof that browser-side font creation is practical. The package states support for OTF/TTF/WOFF, TrueType `glyf` outlines, kerning, ligatures, and font creation from Bézier paths. This project does **not** vendor opentype.js; `writer-font-ttf.js` is an independent minimal TTF writer following the OpenType specification.

### alray2569/SoundChange (Yasgheld) — MIT
https://github.com/alray2569/SoundChange
Research use: sound-change-applier UX and formal rule notation of the general `input > output / environment` family. No Haskell code is copied.

### def-gthill/lexurgy — GPL-3.0 (research only, no code copied)
https://github.com/def-gthill/lexurgy
Research use: confirms the value of explicit, ordered sound-change rules and a dedicated historical-conlang workflow. GPL source is not embedded or adapted.

### dmort27/panphon — MIT-Modern-Variant
https://github.com/dmort27/panphon
Research use: articulatory-feature representations, natural-class matching, segment similarity, and feature-distance concepts. This pass contains an independent compact JavaScript feature inventory rather than PanPhon Python code/data.

### cldf-clts/clts — CLDF linguistic data project
https://github.com/cldf-clts/clts
Research use: cross-linguistic sound/transcription architecture and explicit separation of graphemes, sounds, features, transcription systems, and source data. No CLTS dataset is copied into this package.

### cldf-datasets/phoible — CLDF PHOIBLE; CC BY 4.0 metadata/data release
https://github.com/cldf-datasets/phoible
Research use: typological inventory design and the distinction between phoneme inventories and segment features. The packaged “commonness” tiers are heuristic authoring aids, not reproduced PHOIBLE frequency statistics.

## Historical / linguistic sources

- The Metropolitan Museum of Art, “Alphabet Origins: From Kipling to Sinai” — early second-millennium BCE alphabetic invention, Serabit el-Khadim/Wadi el-Hol, acrophony, Semitic letter names, and transmission through Phoenician → Greek/Etruscan → Roman traditions.
  https://www.metmuseum.org/exhibitions/listings/2014/assyria-to-iberia/blog/posts/alphabet
- British Museum, “How Egyptian hieroglyphs were decoded” and Hieroglyphs resources — hieroglyphic, hieratic, demotic, Greek/Coptic transition; Coptic used Greek letters plus additional demotic-derived signs for sounds Greek did not cover.
  https://www.britishmuseum.org/exhibitions/hieroglyphs-unlocking-ancient-egypt/egyptian-hieroglyphs-decipherment-timeline
  https://www.britishmuseum.org/hieroglyphs-resources
- Unicode Standard chapters 7 and 8 and UAX #24 — historical relationship among Greek, Old Italic/Etruscan, Latin; modern Latin extension via diacritics/digraphs/new letters; distinction between script and language/writing system.
  https://unicode.org/versions/Unicode18.0.0/core-spec/chapter-7/
  https://unicode.org/versions/Unicode18.0.0/core-spec/chapter-8/
  https://unicode.org/reports/tr24/
- Essentials of Linguistics, 2nd ed., Historical Linguistics — phonological change including metathesis and grammaticalization/syntactic change.
  https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/14-3-phonological-change/
  https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/14-5-syntactic-change/
- UNESCO, *Language Vitality and Endangerment* — multi-factor vitality analysis and intergenerational transmission.
  https://ich.unesco.org/doc/src/00120-EN.pdf
- Linguistic Society of America proceedings on language loss/shift and sociolinguistic variation.
  https://journals.linguisticsociety.org/proceedings/index.php/PLSA/article/view/4532
- Oxford Handbook, “Loanword Adaptation” — adaptation involves phonological/phonetic and sociolinguistic pressures and can conventionalize differently by community/contact situation.
  https://academic.oup.com/edited-volume/34562/chapter-abstract/293280149
- ACL Anthology, Kulkarni & Wang 2018, “Simple Models for Word Formation in Slang” — computational treatment of blends, clippings, and reduplicatives.
  https://aclanthology.org/N18-1129/
- Lexis / LINGUIST List call on youth slang and digital word formation — clipping, blending, compounding, acronyms, conversion, semantic shift, respelling, platform effects.
  https://linguistlist.org/issues/37/1499/

## TrueType implementation

`writer-font-ttf.js` writes a minimal but real sfnt TrueType font using simple quadratic glyphs. It builds/pads/checksums the required tables: `cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `OS/2`, `post`, plus TrueType outline tables `glyf` and `loca`. This follows Microsoft/OpenType documentation:

- https://learn.microsoft.com/en-us/typography/opentype/spec/otff
- https://learn.microsoft.com/en-us/typography/opentype/spec/glyf
- https://learn.microsoft.com/en-us/typography/opentype/spec/cmap
- https://learn.microsoft.com/en-us/typography/opentype/spec/os2

Input glyphs can be provided as contour points, SVG path data, bitmaps, or (in a browser) rendered characters that are raster-traced into contours. If a source sign starts as SVG/bitmap/rendered Unicode rather than prebuilt contours, its accumulated historical graphic operations are deferred and applied when the font outlines are constructed, so the TTF represents the descendant form rather than simply re-embedding the ancestral character. Descendant symbols are normally assigned Unicode Private Use Area code points, avoiding false claims that invented letters have official Unicode assignments. Browser PDF export temporarily loads the generated TTF through `FontFace` and places the Private-Use characters in the alphabet reference, allowing the guide to render the invented glyphs alongside ordinary text/IPA.

## Atlas payload

The large embedded research atlases are **original generated scenario cards**, not copied prose from sources. They exist to give offline retrieval a wide range of combinations of phonological change, grammar change, contact, dialect, slang, writing medium, script policy, orthographic lag, rare/common sound design, and historical-event pressure. They are compressed and loaded lazily by shard.

- Language-evolution scenario cards: 320,000
- Phonology/inventory design cards: 120,000
- Script-evolution scenario cards: 90,000

## Python / WASM note

Python was used only as an offline build-time helper to generate compressed original data tables and run tests. **No Python code is required at runtime**, so no `script/` WASM folder is added for this pass. The shipped runtime is JavaScript.


### Historical-event fields accepted by the language/script pass

In addition to `year`, `type`, `intensity`, `region`, prestige/contact information, and descriptive history, events may carry script-specific pressures such as `writingMedium`/`medium`, `direction`/`newDirection`, `scriptPolicy`, `replacementScript`, `addLetters`, and `dropLetters`. This lets a worldbuilder explicitly model events such as conquest-era loan signs, a chancery spelling reform, transition from carving to cursive ink, a direction change, printing-driven standardization, or the retirement/restoration of letters.

## Expansion Pass II — language evolution + writing craft research (2026-09-21)

This continuation pass strengthens the existing 44-module static runtime **in place**. It adds no new runtime JavaScript or WASM files; the existing modules remain the integration surface.

### Language evolution expansion

`writer-language-evolution.js`, `writer-phonology.js`, `writer-script-evolution.js`, `writer-font-ttf.js`, and `writer-language-export.js` now cover a deeper diachronic pipeline:

- ordered/context-sensitive sound-change pipelines, phonotactic repair, inventory balance, prosodic profiles, and loanword adaptation;
- multi-factor language-vitality scenarios, regional/diasporic dialect networks, register formation, slang/neologism processes, borrowing and lexical innovation;
- grammar-rule compilation and typologically varied grammar guidance rather than a single English-like template;
- writing-system pathways that keep pictographic/logographic, syllabic, abjad, abugida, alphabetic, and mixed systems distinct instead of assuming a universal pictures-to-alphabet ladder;
- orthographic depth, reforms, digraphs/diacritics, letter mergers/splits, additions, losses, conservative spellings, and script replacement/standardization scenarios;
- deterministic digital glyph synthesis for signs that have meanings/sounds but no supplied drawing, while still preferring supplied contours, SVG paths, bitmaps, or browser-renderable source characters/hieroglyphs when available;
- richer language-reference TXT plus grammar CSV, sound-change CSV, letter-evolution data, and dependency-free TrueType generation.

A future UI can therefore accept instructions such as “these ancestral signs mean X/Y/Z, these are their spoken words/sound values, these events happened, evolve the system for 1,500 years,” and pass that object to `WriterToolsLanguageEvolution.simulate(...)`. `WriterToolsFontTTF.buildFromLanguage(...)` can create the descendant `.ttf`, and `WriterToolsLanguageExport.buildArtifacts(...)` can return the full reference text and related artifacts. No hand-drawing step is required when the user has not supplied artwork; deterministic geometric descendant glyphs are synthesized instead.

This pass adds **80,000 lazy-compressed language-evolution research cards** on top of the pre-existing language atlas. They cover sound change, grammar change, contact/borrowing, lexical innovation, dialect/register variation, vitality, orthography, script change, and historical pressures. They are original generated authoring/scenario records rather than copies of external linguistic datasets.

### Writing / storytelling / poetry / song expansion

Existing writing modules were strengthened instead of adding parallel files. The pass adds **40,000 lazy-compressed craft research cards** plus new planning/diagnostic APIs for:

- fiction and creative-nonfiction planning;
- scene purpose, scene turns, dialogue pressure, subtext, escalation and release;
- tension curves and decompression/recovery beats;
- cliffhangers that preserve fair setup and useful unresolved questions;
- trope use, inversion, combination, signaling, and payoff tracking;
- long-form act/scene blueprints, promises/questions, causal threads, continuity ledgers, and revision priorities;
- plot-hole checks for chronology, character knowledge, object continuity, causal linkage, and unresolved setup;
- prose rhythm, lexical diversity, audience/context lenses, readability-oriented diagnostics;
- poetry/haiku planning and song planning with prosody, rhyme, repetition, section function, tension/release, and music/lyric alignment.

### Research sources used in this pass

These were used as **research and architecture references**; their source code is not bulk-vendored into Writer Tools Studio.

Language / script / fonts:

- opentypejs/opentype.js — browser/Node font construction, glyph outlines, cmap and font export concepts — https://github.com/opentypejs/opentype.js
- alray2569/SoundChange (Yasgheld) — ordered sound-change workflow — https://github.com/alray2569/SoundChange
- def-gthill/lexurgy — formal sound-change workflow (GPL-3.0; research only, no code copied) — https://github.com/def-gthill/lexurgy
- dmort27/panphon — articulatory feature/distance concepts — https://github.com/dmort27/panphon
- cldf-clts/clts — sound/transcription-system architecture — https://github.com/cldf-clts/clts
- cldf-datasets/phoible — phoneme-inventory typology reference — https://github.com/cldf-datasets/phoible
- cldf-datasets/wals — typological feature reference — https://github.com/cldf-datasets/wals
- grambank/grambank — structural typology reference — https://github.com/grambank/grambank
- Metropolitan Museum of Art, “Alphabet Origins: From Kipling to Sinai” — early alphabet/acrophony and Egypt/Sinai → Semitic/Phoenician transmission context — https://www.metmuseum.org/exhibitions/listings/2014/assyria-to-iberia/blog/posts/alphabet
- Unicode Standard, Chapter 7 — Greek/Old Italic/Latin history and modern Latin extensions — https://unicode.org/versions/Unicode18.0.0/core-spec/chapter-7/
- UNESCO, *Language Vitality and Endangerment* — multi-factor vitality framework — https://ich.unesco.org/doc/src/00120-EN.pdf
- Oxford Handbook, “Loanword Adaptation” — phonological/phonetic and sociolinguistic adaptation pressures — https://academic.oup.com/edited-volume/34562/chapter-abstract/293280149

Writing / interactive narrative / continuity / music:

- y-lohse/inkjs — browser/Node interactive narrative state architecture — https://github.com/y-lohse/inkjs
- smith-and-web/kindling — outline/scene-context and local-first authoring architecture — https://github.com/smith-and-web/kindling
- sadasdfsaf/canonkit — story-bible and continuity-checking concepts (research only; no license-dependent source reused) — https://github.com/sadasdfsaf/canonkit
- mattdaly/Fountain.js — screenplay/Fountain structural parsing reference — https://github.com/mattdaly/Fountain.js
- tonaljs/tonal — JavaScript music-theory API concepts — https://github.com/tonaljs/tonal
- scribbletune/scribbletune — browser/JS rhythm, melody, chord-progression, and MIDI-oriented authoring concepts — https://github.com/scribbletune/scribbletune
- magenta/magenta-js — browser-side generative-music architecture reference — https://github.com/magenta/magenta-js
- btford/write-good — lightweight prose-lint categories — https://github.com/btford/write-good
- retextjs/retext-readability — readability diagnostics/formula architecture — https://github.com/retextjs/retext-readability
- get-alex/alex — considerate-language linting architecture — https://github.com/get-alex/alex

### Static-host/runtime rule

The shipped runtime remains browser JavaScript. Python was used only to build/pack original lazy gzip research atlases and to run offline validation; no Python runtime is required. No Python-only capability was introduced, so no WASM `script/` folder is necessary for this pass. GitHub Pages/static hosting compatibility is preserved.


## William Saville Voice + Onyx Dual-Path Integration (2026-09-22)

The current project is **Writer Helper**. This pass integrates the user-authored William Saville story, poetry, and lyric corpora as a shared authorial system instead of a cosmetic style preset. The corpus modules contain 15 story samples, 18 poem samples, and 15 lyric source records. `writer-william-voice.js` turns those materials into task-specific evidence, voice principles, craft constraints, audits, and revision instructions.

The system deliberately separates **voice** from **weakness imitation**. It preserves the recurring characteristics evidenced by the supplied writing—emotional directness, concrete/sensory imagery, earnestness, clear stakes, accessible metaphor, consequence, deliberate repetition, and dark-to-earned-hope movement—while a craft governor actively corrects the areas identified for support:

- redundant explanation and repeated emotional paraphrase;
- rushed causal/emotional transitions;
- incomplete or overloaded explanatory thoughts;
- dialogue that sounds expositional, uniformly articulate, or insufficiently character-specific;
- lyric lines carrying too much prose, hooks carrying too many ideas, and emotionally generic/flat lines;
- poetry that drifts into prose instead of using compression and intentional line breaks;
- language/history exposition that is technically dense, chronologically unclear, or too certain about modeled inference.

### Primary and fallback architecture

`writer-backend-provider.js` uses the existing Onyx AI-brain endpoint as the primary generative route:

`https://script.google.com/macros/s/AKfycbwxviV1hERFKIivY5we5W1gVMqfsH6DNY0mNZkEs2SXcoa4gDM88c14tIyraytnSAyKvQ/exec`

Before a request is sent, the frontend compiles a task-specific William voice/craft contract. After generated text returns, the frontend performs a William-specific audit and safe local cleanup. Story-project calls retain the existing create/branch/continue actions. Standalone story, dialogue, poetry, lyric, nonfiction, and language-history calls can use the configurable generic action (`writer.generate` by default; override with `window.WRITER_TOOLS_GENERIC_ACTION`).

If the endpoint is unavailable or a compatible remote action fails, `writer-fallback-brain.js` generates locally and applies the **same** voice contract, audit, heuristic repair, and polish. The fallback path therefore does not drop into a generic unrelated voice merely because Onyx is offline.

### Character dialogue is intentionally not author-cloned

William's voice governs narration, scene selection, emotional framing, pacing, and the craft standard. Individual characters are still required to preserve their own vocabulary, syntax, directness, humor, politeness, knowledge, omissions, interruption habits, and willingness to name feelings. This prevents “deeply programmed author voice” from turning every speaker into the same person.

### Voice-critical versus voice-neutral modules

Voice hooks are present in every content-producing or content-planning route where authorial style can affect output: story generation/fallback, branching, character prompts/context/dialogue, style/reference systems, scene beats, settings, audience adaptation, source context, generated supporting people/place description, poetry/song planning, output validation, language rules/history, script-history narration, and exports.

Mechanical infrastructure is intentionally voice-neutral: binary TrueType table writing, parsers, event-stream decoding, persistence/memory stores, continuity ledgers, graph storage, timeline/session state, content-boundary enforcement, and UI plumbing. Those modules can carry or preserve voice-aware data but do not rewrite bytes/state “in William's voice.” This separation is a reliability feature, not an incomplete integration.

### Runtime footprint

The final runtime has **49 JavaScript modules**. Five runtime files were introduced by this voice-integration pass: the three user-authored corpus modules, `writer-william-voice.js`, and `writer-fallback-brain.js`. No Python runtime is shipped, no WASM is required, and the package remains compatible with static hosting such as GitHub Pages.

