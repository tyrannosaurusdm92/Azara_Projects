# AWS research-led interface pass — 2026-10-29

Scope: `Azara_Projects/AWS/` only. Preserve Aza'raan Writing Studio identity, steampunk teal/brass/dark-metal design, white writing paper and glyph canvases, data, existing backend, draggable navigation, resize handles, keyboard features and language inventories. No external product's code or content was imported.

## Reviewed references

- [Dominic de Souza, "I tested 22 writing tools so you don't have to"](https://legendfiction.substack.com/p/i-tested-23-writing-toolsyeah-almost) (2025). Key workflows: low-friction drafting, side-by-side references, offline access, portable exports, and a workspace that gets out of the way.
- [Novelcrafter: The Write Interface](https://www.novelcrafter.com/help/docs/write/the-write-interface). Its focus mode hides distracting interface details while keeping the manuscript central. This informed a **new local-only Focus layout** in AWS rather than a manuscript-editor replacement.
- [Novelcrafter: Codex types](https://www.novelcrafter.com/help/docs/codex/codex-types). Character, location, object and lore organization informed keeping the existing AWS series/characters/worldbuilding tree and its linked reference archive close to the writer.
- [Calligraphr: Font creation](https://www.calligraphr.com/en/docs/tutorial1/) and [features](https://www.calligraphr.com/en/features/). Template, editing, baseline, size, spacing, previews, and standard font export are already represented by separate AWS glyph features; the goal here was tighter grouping and fewer nested scroll/viewport conflicts, **not** a font-engine rewrite.
- [Calligraphr: variants](https://www.calligraphr.com/en/docs/tutorial2/) and [ligatures](https://www.calligraphr.com/en/docs/tutorial3/). Future enhancement inspiration only; no untested glyph-variation feature is claimed.
- [Vulgarlang: Conlang editor](https://www.vulgarlang.com/app/) and [ordered historical sound changes](https://www.vulgarlang.com/sound-changes/). Its clear phonology/spelling/vocabulary/grammar divisions reinforce retaining AWS's six-era Language, Rules, Dictionary, Alphabet Evolution and Glyph Studio in one parent without creating redundant sections.
- [Worldbuilding writing tools comparison](https://deckle.studio/wiki/workflow/software/best-worldbuilding-software/). Manuscript/reference adjacency, nested worlds, and offline/export considerations are applicable; the site's self-comparisons are not treated as an independent ranking.

## Implemented

1. An accessible **Focus** button in the document toolbar: hide planner chrome and secondary topbar controls while keeping navigation, keyboard, exports, manuscript or selected special tool visible. Escape exits when not editing a modal or interacting with the floating keyboard. This changes presentation only.
2. Optional **Roomier layout** setting in Settings. The existing compact spacing stays default. Focus and roomy choices are stored locally, independently of manuscript and glyph-project records.
3. Replaced conflicting glyph viewport-size assumptions with parent-contained scrolling, a less oversized editor inspector at desktop widths, wrapping tool headings, and wider-space responsive stacking without changing the glyph editor's canvas and resize behavior.
4. Reduced forced blank-paper heights while retaining an ample white writing surface and resizable rich-text edit area. Compressed redundant heading/card margins and dense language reference grids.
5. Kept existing navigation consolidation, editable language notes, keyboard bubble, screenshot function, context references, PWA, backend and existing assets.
6. Extended structural checks in `docs/verify-navigation.cjs` and refreshed the offline service-worker cache key.

## Validation and limits

- Script syntax checked for changed application files. HTML ID uniqueness and all local script/style references checked against the repository tree.
- Existing navigation normalization retains distinct language notes and manuscripts; no additional migration or content deletion was introduced.
- Live testing is necessary after GitHub Pages and the new service worker publish to confirm specific device, keyboard, full-screen glyph editor, screenshot, cloud sync, and install workflows. Published static HTML alone cannot verify cloud account operations.
