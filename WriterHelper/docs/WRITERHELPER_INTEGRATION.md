# WriterHelper integration map — 27 October 2026

| Area | Source | Integration |
| --- | --- | --- |
| Writing rooms, helper, tasks, local drafts, export | LiteraryFriend | Existing application runtime retained in `vendor/LiteraryFriend/`; WriterHelper seeds nine named workspaces and their pages. |
| Language keyboard, phonetics, speech, evolution | `Azara_Projects/Language` | Original studio document embedded in `script/js/aza-language-document.js`; active scripts and CSS live in `script/js/aza/` and `style/css/aza/`. Four supplied era TTFs, Khmer mappings, WAV cues, and image/SVG assets remain present. |
| QWERTY, long-press Unicode, split keys and sound packs | `PersonalProjects/keyboard` | Embedded Savanski document and `vendor/keyboard/` scripts/assets. Its former anonymous cloud adapter and nested PWA registration are removed; authenticated keyboard settings use WriterHelper's account bridge. |
| Font editing | `fonteditor-core` 2.6.3 (MIT) | Bundled browser library and WriterHelper workshop. The original Khmer GDEF/GSUB/GPOS tables are retained when exporting edits of supplied TTFs. License is in `FONTEDITOR_CORE_LICENSE.txt`. |
| App identity | Attached Aza’ra Universe emblem | 32/64/180/192/512 PNG exports, maskable 512 icon, full-size logo, and embedded SVG mark. Root manifest supplies installed-app icons. |
| Theme | Prior supplied Aza’raan Language Program theme | Palette and steampunk background image URL only, in `style/css/writerhelper-theme.css`. |
| Backend | Existing user deployment | Root `script/js/backend-bridge.js` uses the user-confirmed `AWS_RPC_*` protocol and only the public `/exec` URL. No `.gs` or private backend material is included. |

## Functional checks

- Only one `.html`, one `.webmanifest`, and one `service-worker.js` remain within `WriterHelper`.
- The service worker's core static paths and the embedded documents' script, stylesheet, and image paths resolve within the project.
- JavaScript syntax and JSON parsing pass; the bundled four era TTFs parse with their Khmer cmap. A font workshop round-trip of the Modern font with a new glyph produced a valid TrueType file, preserved all original glyph indices, kept GDEF/GSUB/GPOS, and passed fontTools checksum/table inspection.
- Keyboard model tests, the language merge/IPA/practice/phonetics suites, and a DOM smoke check for nine workspaces, book drafting, and Modern/Proto font export pass.
- Live browser UI and deployed account/TTS calls could not be executed in this environment. Verify those flows on the final HTTPS origin, including repeated book/page switches and keyboard insertion at a moved caret.

## Deployment notes

The backend must authorize the exact frontend origin and support the confirmed `AWS_RPC_*` iframe messages. Server-side owner registration, Drive privacy, and Google Cloud TTS configuration remain backend deployment responsibilities. Keyboard settings use authenticated `keyboard.get` and `keyboard.save`; manuscript snapshots use authenticated `notes.*`; Cloud MP3 uses `aza.tts.generate` and `aza.tts.audio.chunk`. The client never calls old anonymous Savanski endpoints.

The theme image is an external URL supplied in the reference and may expire. Its CSS has a dark fallback. Browser voice output is an approximation for phonemes that the device voice cannot pronounce; click/glottal cues are supplied by the language studio.
