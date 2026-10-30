# Unified studio cleanup

The AWS studio uses one movable navigation tree and one shared visual theme. Language tools are grouped once per workspace; the planner shares the desktop row with the editor instead of squeezing it into the bottom of the screen.

## Changes

- Consolidate duplicate Language sections and the six language tools. Preserve written content as editable notes pages, keep both panes of parallel studios, remap references from empty duplicate pages, and archive original merged records in exported snapshots.
- Keep collapsed descendants out of the menu, expose imported orphaned pages once, add page search, clamp the movable menu to the viewport, and initialize its handlers after the application is ready.
- Apply the same teal, brass and dark-metal controls to writing, Library, Source Archive, rules, dictionary, pronunciation, Glyph Studio, evolution views and dialogs. Preserve white writing, drawing and preview surfaces.
- Replace three conflicting theme imports with `style/aws-unified.css`. Reduce oversized padding and minimum heights, make tools fill available space, keep the glyph side panels collapsible, and collapse the large Unicode vault by default.
- Protect page content during navigation and snapshot restoration. A previous page's mounted editor must never be captured into the newly selected page.
- Refresh the offline shell cache and derive the displayed alphabet count from the existing language data.

## Verification

Run `node AWS/docs/verify-navigation.cjs` from the repository root. The regression checks cover multiple workspaces, unique tool roles, preserved manuscripts and notes, parallel panes, archived originals, linked references, idempotent migration, restore, page-switch capture isolation, synchronous view events, folded descendants, orphaned/cyclic imports and search.

Syntax checks passed for each changed JavaScript file. The HTML asset references and patch whitespace were checked.

Browser checks on the local preview covered desktop navigation, section folds, planner expansion/collapse, Language Rules, dictionary, pronunciation, Library, Source Archive, both evolution views, Glyph Studio and its collapsible side panels. Switching between two notes pages retained their separate content. A 390-pixel iframe check confirmed that the main writing view and Glyph Studio fit the viewport and that the top-bar Export action remains accessible.

The final keyboard interaction test was blocked by the browser session's usage limit. Opening the keyboard and its screenshot-close sequence were not verified in this pass. Cloud authentication/sync, speech generation, installation and drag positioning were not exercised end to end. The existing keyboard scripts, glyph project implementation, language datasets and backend were preserved.

The preview uses isolated browser storage. No preview draft text or responsive-test page is included in the published source.
