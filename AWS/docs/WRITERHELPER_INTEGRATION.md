# Aza’raan Writing Studio integration and validation

The frontend combines the complete current Language, LiteraryFriend and Keyboard source editions in `AWS/` under `index.html`. The six historical language sections and the eight requested book titles remain intact. The original projects outside AWS were not edited.

| Source | Files accounted for | Treatment |
| --- | ---: | --- |
| Azara_Projects/Language | 549 | 540 identical files, 8 adaptations and the studio HTML embedded in JavaScript. |
| LiteraryFriend | 384 | 369 identical files, 11 adaptations and 4 replacements for the unified entry, PWA and backend transport. |
| PersonalProjects/keyboard | 764 | 752 identical files, 7 adaptations and 5 replacements for the embedded entry, PWA and cloud transport. |

The full per-file comparison, source revisions and hashes are in `SOURCE_COVERAGE.json`. Reproduce it with `audit-source-coverage.py --literaryfriend <checkout> --keyboard <keyboard-folder>`. Historical documentation stays with its source; the current configuration and runtime use the supplied deployment.

## AWS rename and master navigation

- The project directory is `AWS/` and the app/manifest name is **Aza’raan Writing Studio**, with **AWS** as the installed short name. There is one HTML entry and only `script`, `style`, `json`, `docs`, and `assets` directories at the project root. Retained dependencies live in `script/vendor/`.
- The package’s master navigation was adapted for sections, era subsections, page selection/creation and studio tools. Both its expanded bar and collapsed emblem bubble support dragging, bounded positions, keyboard movement, restoration and saved preferences. Dropdowns open above or below the bar as space permits.
- The keyboard has its own movable 150×150 bubble on every page. Opening it shows Standard QWERTY or one of the Archaic, Classical, Traditional or Modern Aza’raan layouts; the panel can be resized from every side and corner and scales its controls. The upper-right ❌ collapses it to the bubble.
- The master navigation has the only app-install control. It calls the browser’s PWA install prompt and uses the manifest’s celestial tree icons. The Sync devices / restore action opens the existing account bridge: upload a new local snapshot on one device, then restore it on another signed into the same account. Local autosave and full backups remain available; cloud snapshots are append-only.
- Read selection uses exactly the selected Aza’raan words or sentences in all eight books, including in QWERTY mode, without reading surrounding English. The old range is ignored after its editor is disconnected. Stop cancels speech in both embedded language engines.
- Browser storage identities were preserved so the folder rename does not discard manuscripts, font drafts or settings on the same hosting origin. Old service-worker registrations are retired narrowly. The old copying workflow was replaced by `.github/workflows/validate-aws.yml` with read-only repository permissions. It cannot overwrite the integrated program.

## Integration fixes

- The Language studio sits inside the main column. Its overlay leaves the six era channels and section rail accessible, including on mobile.
- Every book, new page and either drafting pane accepts input from the shared Aza’raan/QWERTY keyboard. Caret restoration preserves the selected writing surface. The keyboard bar provides a sound-pack selector, shared mute, voice depth and Speak/Stop controls.
- Standard QWERTY and the four supported book eras share the persistent keyboard bubble. Resizing scales its control strip and key rows while the embedded keyboard reflows to the available frame.
- The celestial tree emblem is used in the shell, Language studio, keyboard, favicon, Apple touch icon, installed-app icons and maskable icon. The master image exactly matches the attachment. The theme copies only the reference package's palette and exact steampunk wallpaper URL.
- The font workshop supports names and metadata, Unicode mapping, SVG/PNG import, glyph positioning and scaling, baseline, advance widths, global spacing, pair spacing, preview, portable projects and real TTF export. White PNG backgrounds are excluded from traced outlines; counters/holes remain intact.
- Font exports preserve existing glyph IDs and names and the original Khmer GDEF/GSUB/GPOS tables. Applying a font saves it in the writing library, restores it after reload and includes it in complete backups. HTML document export embeds the used fonts.
- The root service worker installs the full startup dependency set and the default sound pack. Its generated allowlist excludes private responses and query requests. Optional audio and large modules are cached on demand. The single root manifest and worker own the app scope.
- Both the active adapter and retained clients use the confirmed `AWS_RPC_REQUEST`, `AWS_RPC_RESPONSE` and `AWS_RPC_READY` contract. Obsolete runtime Apps Script library URLs were removed. The attached backend was not edited, copied into WriterHelper or committed.

## Verification

`test-writerhelper.cjs` passed the browser checks below in Chromium 153. The additional rename/navigation pass brings the suite to 21 checks:

1. Nine sections and 46 starter pages.
2. All six era channels remain clickable beside the studio.
3. Actual B-key long press exposes B/F/V/W and permits three marks.
4. Font metadata, baseline, global/pair spacing, PNG import and TTF download.
5. Proto glyph creation, SVG import and font project export/import.
6. Aza’raan insertion into each of the eight books.
7. QWERTY insertion, decoded audio clips and the shared mute control.
8. Input reaches the selected right-hand drafting pane.
9. New pages use the applied font and HTML export embeds it.
10. Book Speak/Stop reaches the canonical language voice engine.
11. AWS_RPC contract and sign-in/sign-out session lifecycle against a local fixture.
12. Drafts and fonts survive a reload.
13. Offline reload initializes both keyboards, Language and saved font projects.
14. Mobile era navigation works at 390 × 844.
15. No uncaught page errors or missing local resources.

`test-font-core.cjs` passed raster-background detection, transparent glyphs, holes, kerning and glyph transformations. `verify-font-exports.py` passed TrueType checksum, original glyph ID/name order, Khmer layout, metadata, kerning, PNG counter, new Proto font and embedded-font inspections. The four existing language checks also passed: merge, IPA, pronunciation practice and phonetic rules. JavaScript syntax, JSON, source coverage and file structure checks passed.

For the browser suite, install Playwright locally and run `node docs/test-writerhelper.cjs` from AWS. An existing browser can be supplied with `CHROME_BINARY`; `PLAYWRIGHT_MODULE` can select an existing Playwright installation. `TEST_ARTIFACT_DIR` controls temporary screenshots and exported test files. Inspect those outputs with `python docs/verify-font-exports.py <artifact-directory>` using fontTools.

Additional browser cases verify bar and bubble dragging, menu bounds at viewport edges, persistence and keyboard movement, section/page/era menus, selected-text speech in all eight books under QWERTY mode, and mobile master navigation. `validate-frontend.py` checks branding, directory structure, embedded resource paths, app icon dimensions and the static-only offline allowlist.

## Practical limits

Live Google account authentication and Cloud MP3 synthesis were not exercised. The contract test uses a fixture, not the deployed backend. The existing backend must authorize the final HTTPS origin and have its server-side TTS configuration. Device voice quality depends on installed voices; the language mappings and click/glottal cues remain canonical.

Proto and Ancient retain the supplied historical chart images and start as editable blank font projects because no source TTFs exist for those eras. New Unicode glyphs do not automatically receive contextual substitution or combining-mark anchors. Original TTF shaping is retained; advanced OTF shaping and GPOS kerning require inspection after conversion or geometry changes.
