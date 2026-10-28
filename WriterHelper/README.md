# Aza’ra WriterHelper

WriterHelper combines the LiteraryFriend writing rooms and helper, the complete Aza’raan Language Studio, and Savanski’s on-screen QWERTY keyboard under one `index.html`. Serve the directory over HTTPS (or a local HTTP server). Opening `index.html` from `file://` cannot load the module scripts, JSON, fonts, or service worker reliably.

## Workspaces

- **01 Language:** Proto, Ancient, Archaic, Classical, Traditional, Modern. Each is a writing channel. The language overlay provides the canonical Aza’raan keyboard, audio/pronunciation lab, and interactive evolution chart. Proto and Ancient open the historical chart because the supplied project has no TTFs for those eras.
- **02–09 Books:** The Door In The Tree; The Drowned Queen; The Unwilling Spy; The Hollow Throne; Never-Ending Loss; Threats Of Space; Collision Of Worlds; Unraveled. Each book starts with Manuscript, Outline, Character Notes, Continuity Notes, and Drafting Table. New pages can be added.

On any book page, select **Aza’raan** for the language keyboard or **QWERTY** for the integrated touch keyboard. Its original hold-for-accent, Unicode library, split layout, design controls and sound packs remain available. Choose a QWERTY sound pack directly in the shared keyboard bar; Classic is the initial default. The key-sounds checkbox mutes either on-screen keyboard. Input follows the selected editor, including either side of a drafting table and newly created pages. **Speak** reads selected text or the active draft; **Cloud MP3** explicitly asks the configured private backend to synthesize the selected text. The latter requires sign-in and a configured Cloud TTS key on the server.

## Font Workshop

Open **01 Language → Font workshop**. The four bundled TTF eras load with their real Khmer glyphs. Proto and Ancient start as blank font projects because their source editions provide historical images, rather than fonts. You can edit family/style names, version, designer, manufacturer, copyright, description, license and website metadata; import TTF/OTF; add or remap a Unicode glyph; upload SVG outlines or trace PNGs; position and scale individual glyphs; set advance widths, global spacing and pair spacing; shift the baseline; adjust ascender/descender; preview; save drafts; import/export portable projects; and export a standard TrueType `.ttf`. PNG import supports dark ink, light ink and transparent silhouettes, with an adjustable threshold.

**Use in books** saves a font version to the writing library and selects it for newly typed passages of that era. The applied font survives reloads, appears in the editor font selector and is included in complete backups. HTML manuscript exports embed the fonts used by the document so Aza’raan passages remain readable away from WriterHelper. Existing passages keep the font version used when they were written.

The bundled TTFs contain contextual Khmer shaping. TTF export keeps original glyph indices and glyph names and copies the original GDEF/GSUB/GPOS layout tables so existing stacked marks keep their rules. Edited outlines are exported without obsolete point hinting. New Unicode glyphs do not automatically gain contextual substitutions or mark anchors. Pair spacing writes a standard `kern` table; an imported font's advanced GPOS kerning may take precedence. Inspect major changes to combining-mark geometry in the proof and a dedicated font editor. Imported OTF fonts can be converted to TTF, but their advanced shaping cannot be promised by that conversion.

Font drafts use IndexedDB in this browser; export a project JSON or TTF for backup. Font edits and glyph uploads remain local unless you separately choose another save/export route.

## Files and backend

- `index.html`: the sole HTML file, with the source Language and Savanski documents embedded as `srcdoc` data in `script/js/`.
- `script/js/`, `style/css/`, `json/`, `docs/`, `assets/`: integrated code, theme, language data, documentation, era TTFs, logo/icon exports, and audio.
- `vendor/LiteraryFriend/` and `vendor/keyboard/`: retained source features and assets; the root has the sole active web manifest and service worker.

The frontend holds only the public Apps Script URL and `AWS_RPC_*` browser message adapter. No backend source, API key, or credential is bundled. The retained legacy clients use the same authenticated bridge and no longer point to the former Apps Script library. Sign-in, keyboard preference sync, cloud manuscript snapshots, and generated audio require an authorized deployment/origin. Local writing and backup export work independently of that connection. Cloud manuscript snapshots contain document state; use the complete backup to transfer custom fonts too.

The service worker installs about 16 MiB of required frontend resources, including both keyboards, the four era fonts, historical chart artwork and the default Classic sound pack. Other sound packs and large optional source modules are cached when requested. It only caches exact paths from the generated static allowlist, never query requests, authenticated replies or manuscripts. Updated caches activate after existing app tabs close. Rebuild the allowlist after runtime changes with `python docs/build-offline-manifest.py` from this directory. Supported browsers show **Install app** in the top bar; other browsers can use their own installation controls.

Only the attached player-map package's steampunk wallpaper URL and palette values are used for the theme. Its map code and features are excluded. The wallpaper has a dark fallback. The attached celestial tree logo appears in the shell, language studio, keyboard and all app icon assets.

See `docs/WRITERHELPER_INTEGRATION.md` for validation and `docs/SOURCE_COVERAGE.json` for the complete source comparison.
