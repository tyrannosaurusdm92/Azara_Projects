# Belavadós Settlement Editor • Template Pass 3

## Visual design
- Re-extracted all three inline CSS style blocks from the latest user-supplied `settlement_generator(1).html` as the visual basis for every dynamically selected province/settlement page.
- Reinstated the **exact, unmodified 707-character steampunk background-image URL** in the active CSS, added direct-body painting to avoid negative-z-index and opaque-background occlusion, and included an in-app link and `STEAMPUNK_BACKGROUND.md` with the original source.
- Retained the steampunk bronze-and-teal windows, map area, generator settings, settlement axes, NPC/location browsers, import/export and preview windows.

## Settlements and residents
- **No original world JSON, assets, approved race schema, provincial names, settlement names or NPC records were regenerated or overwritten.**
- Movable collapsible master nav lists provinces only. Each selected province has its own settlement dropdown and reused template dashboard.
- The province map continues to show the original named settlements by default.
- Re-added attached-template controls for importing an HTML or image settlement map and opening a PDF reference; the original NPC, work, relationship and schedule data remain under the preview and in the browser.
- Added a per-settlement optional UTC offset override, without altering source time-zone data.

## Scope and limitations
- The attached `settlement_generator(1).html` includes older race categories inconsistent with the approved race canon. Its legacy race-generation script was intentionally **not** executed or copied into the active program.
- Uploaded map previews are temporary until the browser session is closed. Browser-local settlement edits from the preexisting editor remain subject to browser storage.
- This archive retains only `index.html` as HTML. CSS/JS/JSON remain in folders.
- The browser successfully computed the steampunk background CSS and verified the master navigation stays fixed. Full JavaScript-driven interaction testing did not complete in this runtime; the final audit covers source/style preservation, active script syntax, file integrity, and data counts. Interactive browser success is not claimed.

See `PASS3_AUDIT.json` for machine-readable checks and `STEAMPUNK_BACKGROUND.md` for the original wallpaper link.
