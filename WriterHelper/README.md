# Aza’ra WriterHelper

WriterHelper combines the LiteraryFriend writing rooms and helper, the complete Aza’raan Language Studio, and Savanski’s on-screen QWERTY keyboard under one `index.html`. Serve the directory over HTTPS (or a local HTTP server). Opening `index.html` from `file://` cannot load the module scripts, JSON, fonts, or service worker reliably.

## Workspaces

- **01 Language:** Proto, Ancient, Archaic, Classical, Traditional, Modern. Each is a writing channel. The language overlay provides the canonical Aza’raan keyboard, audio/pronunciation lab, and interactive evolution chart. Proto and Ancient open the historical chart because the supplied project has no TTFs for those eras.
- **02–09 Books:** The Door In The Tree; The Drowned Queen; The Unwilling Spy; The Hollow Throne; Never-Ending Loss; Threats Of Space; Collision Of Worlds; Unraveled. Each book starts with Manuscript, Outline, Character Notes, Continuity Notes, and Drafting Table. New pages can be added.

On any book page, select **Aza’raan** for the language keyboard or **QWERTY** for Savanski’s touch keyboard. The QWERTY keyboard has its original hold-for-accent, Unicode library, split layout, and sound-pack controls. The key-sounds checkbox mutes either on-screen keyboard. **Speak** reads selected text or the active draft; **Cloud MP3** explicitly asks the configured private backend to synthesize the selected text. The latter requires sign-in and a configured Cloud TTS key on the server.

## Font Workshop

Open **01 Language → Font workshop**. The four bundled TTF eras load with their real Khmer glyphs. Proto and Ancient start as blank font projects. You can edit family/style names and metadata, import a TTF/OTF, select or add a Unicode glyph, replace its outline with SVG or traced high-contrast PNG, set advance widths and global spacing, shift the baseline, adjust ascender/descender, preview, save browser-local drafts, import/export portable font projects, and export a TrueType `.ttf`. **Use in books** applies that draft to newly typed Aza’raan spans in the current session.

The bundled TTFs contain contextual Khmer shaping. TTF export keeps original glyph indices and copies the original GDEF/GSUB/GPOS layout tables so existing stacked marks keep their rules. Newly added Unicode glyphs do not automatically gain contextual substitutions or mark anchors. For major changes to combining-mark geometry, inspect the exported font in a dedicated font editor. Imported OTF fonts can be converted to TTF, but their advanced shaping cannot be promised by that conversion.

Font drafts use IndexedDB in this browser; export a project JSON or TTF for backup. Font edits and glyph uploads remain local unless you separately choose another save/export route.

## Files and backend

- `index.html`: the sole HTML file, with the source Language and Savanski documents embedded as `srcdoc` data in `script/js/`.
- `script/js/`, `style/css/`, `json/`, `docs/`, `assets/`: integrated code, theme, language data, documentation, era TTFs, logo/icon exports, and audio.
- `vendor/LiteraryFriend/` and `vendor/keyboard/`: retained source features and assets; the root has the sole active web manifest and service worker.

The frontend holds only the public Apps Script URL and `AWS_RPC_*` browser message adapter. No backend source, API key, or credential is bundled. Sign-in, keyboard preference sync, cloud manuscript snapshots, and generated audio require an authorized deployment/origin. Local writing and backup export work independently of that connection. The service worker only caches same-origin static resources; it does not cache authenticated replies or manuscripts.

The supplied steampunk wallpaper URL and its palette color values are used in `style/css/writerhelper-theme.css`. If the source image link expires, the dark gradient remains legible. The attached celestial tree logo appears in the shell and all app icon assets.

See `docs/WRITERHELPER_INTEGRATION.md` for the integration map and verification notes.
