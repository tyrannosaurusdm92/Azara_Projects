# Asset sources

## Styling reference

Only the palette and steampunk wallpaper reference were taken from the supplied `player map (2)(2).zip`. No map, generator, lore, game data, navigation, or other map-program features are included.

The source palette is dark navy/charcoal, warm cream, teal #3d9fa0, light teal #8de0dc, cyan #00ffff, bronze #b07a3a / #d7aa63, and gold #e8c76e.

The wallpaper is the exact 1024 × 640 JPEG referenced by `css/site.css` in the supplied map. It is embedded once in `css/keyboard.css` as a data URL so local-file screenshots can include it without cross-origin canvas restrictions. Its original watermark has been preserved. This package does not claim ownership of the wallpaper. Existing creator rights remain with its creator. The supplied source identifies it as *Steampunk Wallpaper* by SpaceTurtleStudios.

Original source URL:

https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/f16e2ef7-0b7b-419b-b057-1bd19a2289f5/d1io0wc-c5165550-8c01-487f-8651-146e1e14e111.jpg/v1/fill/w_1024%2Ch_640%2Cq_75%2Cstrp/steampunk_wallpaper_by_spaceturtlestudios_d1io0wc-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjQwIiwicGF0aCI6Ii9mL2YxNmUyZWY3LTBiN2ItNDE5Yi1iMDU3LTFiZDE5YTIyODlmNS9kMWlvMHdjLWM1MTY1NTUwLThjMDEtNDg3Zi04NjUxLTE0NmUxZTE0ZTExMS5qcGciLCJ3aWR0aCI6Ijw9MTAyNCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.3SzTUeHWwjxvKxwZmrrWKMa3oiY0fxLBQ_yo0Zr-V-g

## Keyboard data

The 694 uppercase and lowercase letter variants and 41 symbol groups come from the supplied `Hold_to_Accent_Latin_Keyboard_Phone_Desktop(6)(1).zip`. This mockup retains that catalog and augments its combining-mark chooser with all 256 assigned marks in Unicode 14.0.0 blocks U+0300–036F, U+1AB0–1AFF, U+1DC0–1DFF, U+20D0–20FF, and U+FE20–FE2F. This is a defined Unicode catalog, not a claim to enumerate every possible mark sequence. The builder permits repeated/stacked combinations.

## Included dependencies

- html2canvas 1.4.1: local DOM-to-canvas capture, MIT. Full license: `html2canvas-LICENSE.txt`. Source: https://github.com/niklasvh/html2canvas . Bundle: https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js . Documentation: https://html2canvas.hertzen.com/documentation .
- DejaVu Sans: keyboard and notes glyph coverage.
- DejaVu Serif: notebook headings and the case key.
- DejaVu Sans Mono: machine labels and note statistics.

The three full fonts are unmodified and included for reliable offline rendering, rather than relying on a device to have extended Latin glyphs installed. Full font notices: `DejaVu-LICENSE.txt`. Upstream: https://dejavu-fonts.github.io/ . Some newer combining marks and emoji can still use the device’s fallback fonts.

## Emoji reference

Emojipedia, https://emojipedia.org/ , is linked as the reference for emoji names, discovery, and meanings. The picker follows the site's broad groupings and searches locally by Unicode-derived character names. Each emoji is inserted as a Unicode character or sequence, rendered by the device's fallback emoji font. **No Emojipedia page text, platform artwork, or remotely loaded emoji images are bundled.** Platform image copyrights remain with the relevant owners. See Emojipedia licensing: https://emojipedia.org/licensing .
