# Aza'raan Writing Studio — Draft 2

This package is a static, GitHub Pages–compatible single-page progressive web app. The source entry point is **index.html**, supported by **script**, **style**, **assets**, **json**, **docs**, **manifest.webmanifest** and **service-worker.js**.

## Included and integrated

- Draft 1 book series, editable outline/manuscript/note pages, Library and Trash, planning and deadlines, Important excerpts, and manual backend snapshot sync.
- The supplied Steampunk QWERTY + Aza'raan keyboard, with floating/resizable launcher, Standard/QWERTY and era-specific Aza'raan layouts, key/press-and-hold accents, screenshot and export controls, pronunciation and speech features. Its input now goes into the **existing** manuscript or notes editor, not a separate test notepad.
- Language Evolution Breakdown is a separate entry under Language; the floating keyboard is disabled on that page only.
- Existing Glyph Studio plus editable sound, IPA, origin/hieroglyph and mutually exclusive letter/accent checkboxes. New glyphs automatically get an eligible, unassigned Khmer Unicode code point from their chosen category. Switching a selected glyph between letter/accent also reassigns to a matching eligible free code point.
- Unicode vault includes all **160 positions** in U+1780–U+17FF and U+19E0–U+19FF, as identified in the provided 20-page Khmer-script PDF. Code points that Unicode leaves unassigned or that are punctuation/symbols remain preserved, not auto-assigned to glyphs. Deleted glyphs release their code points back into the vault; removing a glyph never removes the Unicode inventory entry. Use Export Unicode Vault in Glyph Studio for a JSON copy.
- Steampunk copper, teal and dark panel styling from the supplied keyboard.

## Notes on glyph mappings and Unicode

The glyph designer separates editable glyph artwork from the Unicode code point used to represent it. Khmer combining signs and consonant subscript behaviors depend on font shaping and character sequences (e.g., COENG plus consonant), not simply an isolated code point; stored visual glyph artwork and generated TTF may differ by platform. Auto-assignment reserves a free code point in the requested category and does not alter the Unicode standard's formal meaning. Saved glyph mappings are application data and are not an official custom Unicode allocation. Press-and-hold behavior is driven by the current keyboard data and modern glyph mapping where available.

## Data protection / sync

The supplied existing backend is **not included, replaced or edited**. This build continues to point at the AWS backend URL provided in Draft 1. Project data is first saved in the browser; use the application's cloud snapshot controls to transfer between devices. Browser local state is not guaranteed to sync automatically, and there is no promise of real-time cloud merge or an independently tested authenticated backend.

## Deploy

Upload the **contents** of this ZIP into only `AWS/` in your GitHub repository. Keep one `AWS/index.html`; do not move scripts, JSON, CSS or assets from their relative directories. Host via HTTPS GitHub Pages to allow installation, service worker and secure browser APIs. Validate routes and cloud operations on the deployed site before relying on them for sole storage. Do not try to open the ZIP itself as a hosted website.

## Source boundaries

Built from the user-provided `Writer_Studio_Draft1(1).zip`, `Steampunk_QWERTY_Azaaraan_Unified_Keyboard(6).zip`, and `Khmer script - Wikipedia(20261029-022122).pdf`. No Windows batch files, Python runtime or additional HTML pages required.
