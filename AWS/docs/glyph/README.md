# Studio guide

## Typical workflow

1. Pick an era from the selector at the top of the glyph editor.
2. Add, remove, rename, or describe characters. Use the inventory table when editing several IPA values, substitutes, categories, or research notes.
3. Select a glyph and draw directly on the canvas, upload an image, or drop one or more files on the inventory. Use the image editor controls to refine the artwork.
4. Set the character's baseline and size independently. Adjust left and right spacing and advance width for font metrics; use the spacing preview to compare the whole line.
5. Print a sheet for the active era. The top right QR code associates every printed cell with a character, page, era, and local project identifier.
6. Upload a flatbed scan or use a camera on a secure browser origin. The image is mapped to its era from the QR and saved as artwork. Recheck imported glyphs and set baselines before using them.
7. Trace artwork to vector outlines when preparing fonts. Export each era as TTF or OTF when it has at least one traced character.
8. Export the whole project as a `.azglyph.json` file to move the draft to another browser or retain an external backup.

## Adding characters

Use **Add character** to enter a single Unicode character or symbol. The studio blocks duplicate character strings within the active era. The inventory view can create empty rows when the glyph's Unicode assignment is not decided yet. A blank row has no codepoint and is excluded from font export until assigned.

Each era has a target count from the seed data. The target is a guide, not a hard limit. Modern starts with 21 physical base-key glyphs plus the two auxiliary family glyphs F and V. **Restore target row count** fills missing rows with blank placeholders and never deletes added rows.

## Artwork editing

The editor stores artwork as a 512 × 512 PNG per layer plus a flattened preview. Layer visibility, opacity, name, and blend mode travel in the project JSON. A scan or upload replaces the selected glyph's layer stack. Drawings are local to the selected character; a separate glyph's drawing is not overwritten unless you deliberately use **Swap artwork**.

Brush, paint, eraser, smudge, blend, and pinch are available in the canvas toolbar. The transform controls support horizontal/vertical flips, rotation, skew, scale, and one-step nudging. Undo and redo cover canvas strokes; project editing itself is saved as it changes. Export the project before clearing browser storage.

## Scanning printed sheets

Print at 100% scale with page margins disabled if the print dialog permits. Do not crop off the QR code or page border. Image upload scanning works in modern browsers with Canvas and bundled jsQR. Camera capture additionally requires HTTPS or localhost and a camera permission grant.

The automatic mapper uses page proportions, QR location, and the known sheet grid. A straight, full-page scan gives the best mapping. Heavy perspective, a folded page, shadows, or a missing border can prevent automatic cell placement. The studio reports unmapped glyphs and lets you assign separate images afterward.

## Font preparation

The font view builds Unicode fonts from vector contours. A glyph needs an assigned Unicode character, an artwork image, and a saved contour trace. For each era:

1. Select a glyph with artwork.
2. Choose **Trace to outline**. The local OpenCV engine thresholds the image, joins tiny gaps, and simplifies contours.
3. Inspect the contour-bearing preview in the glyph tile and adjust the image if needed, then trace again.
4. Export that era as TTF or OTF.

`Neaten artwork` changes the raster artwork; it clears the saved vector contours so they cannot silently go stale. Trace it again after cleaning. The font exporter uses the selected glyph's baseline, size, advance width, and side spacing as a starting point. It generates simple outlines and character mapping. It does not construct advanced mark positioning, contextual shaping, or a keyboard package.

## Draft data

The active project is stored in browser IndexedDB, with localStorage as a fallback. Project export includes artwork data URLs and contours, so an archive can grow as you add large drawings. Portable files may contain personal research notes; keep them in a location appropriate for that content.

## Browser support notes

- A current Chromium, Firefox, or Safari browser is suitable for the canvas, inventory, IndexedDB, local export, and upload scanner.
- `BarcodeDetector` is used when available; the bundled `jsQR` library provides QR reading otherwise.
- Camera access and service workers require a secure origin (HTTPS or localhost).
- OpenCV.js and OpenType.js are local assets. No CDN request is needed after the static package has been loaded.
- `file://` launch is not supported because browsers restrict fetch, service worker, and camera behavior there.
