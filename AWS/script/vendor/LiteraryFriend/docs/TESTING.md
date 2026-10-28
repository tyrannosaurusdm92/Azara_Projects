# Verification checklist

1. Host the extracted project over HTTPS and open `index.html` on desktop, tablet and mobile.
2. Create workspace and a writing channel; type, reload and confirm contents save locally.
3. Open a two-pane writing studio; edit each pane, reload and confirm contents persist.
4. Open Helper, run Draft Scan, then Detailed Craft Checks. The WebAssembly engine should report when its resource loads successfully; a JS fallback is provided.
5. Use Find & Replace and inspect text formatting before and after the change.
6. Use Outline and export an `.md` outline; run Continuity across all channels.
7. Open Glyph Studio; draw, undo, export SVG/JSON. Open Book layout, export HTML.
8. Drag the eight edge/corner handles around floating windows, resize Planner/Channels and the keyboard; repeat with touch, pen and keyboard arrows. Controls must remain legible and tappable.
9. Open the settings dialog, export/import a local backup and upload a font.
10. With a verified account and authorized production HTTPS origin, sign in through the existing backend, manually push a snapshot and restore it on another device. Test conflicts with a local backup before applying a restore.
11. Confirm no AI generation controls or provider requests are made. Confirm the delivered ZIP has no `.gs`, `.py`, `.pyc`, or `.ipynb` files.
12. Check in a current Chromium, Firefox and Safari build; note browser-specific differences in drag behavior, PWA installation and print support.
