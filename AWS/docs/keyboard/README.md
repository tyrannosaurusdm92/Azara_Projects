# Steampunk QWERTY + Aza’raan Keyboard Studio

## Open the application

Extract the complete ZIP, preserving its file paths. Open the **single root `index.html`** in a modern desktop or mobile browser, or upload the folder to a static HTTPS web host. There is **no backend** in this package; your browser stores notes locally. No additional page or separate Aza’raan keyboard HTML exists.

## One keyboard bubble, two languages

The 150 × 150 px **⌨️ bubble** floats on both pages. Drag it to move it, tap to expand, drag the frame or corners to resize, and use ❌ to collapse it. The expanded toolbar places the **keyboard-language dropdown immediately before the emoji button**:

* **QWERTY**: standard Latin letters, long-press Latin accents, Shift symbols, uppercase/lowercase, emoji, clipboard, numbers/symbols (`123`), text editing, and Print Screen. The digit row is absent from the Letters layout, as in the previous revision.
* **AZA’RAAN**: a second era dropdown appears for **Archaic, Classical, Traditional, Modern**. The **same bubble** switches its key grid to the 23-key Aza’raan sound-first inventory (including separate F and V sound keys and no X). The four bundled era fonts alter the appearance of the Khmer Unicode glyphs, not their encoded identities.

The languages share the same notes editor, clipboard, emoji picker, screenshot feature, bubble positioning and resizing. Choosing a different language does **not** open another keyboard instance.

### Aza’raan sound selection and the 24 accents

A normal tap types the source project's Khmer-encoded letter. Holding or right-clicking an Aza’raan letter opens a **Pronunciation choices** panel populated by the supplied Aza’raan sound catalog. The **Build 24 accents** panel supports the source 24 accents, up to three stacked marks per glyph, source validation, and additional structural specials in Classical and later eras. Archaic has dedicated glottal `ʔ` and click `¡` characters; later eras provide four structural special controls on the keyboard.

The source `AzaaraanPhonetics.compile()` routine provides encoding and validates the accent combinations. F is the B-family /f/ form and V is the B-family /v/ form. Aza’raan has no X key; the corresponding sound is **K + S** (via K long-press or the accent builder). All the era TTFs, chart glyph SVGs, origin images and source data are retained in `assets/` and `json/`.

### Speak selected text

Write a Khmer-encoded Aza’raan letter, word or phrase in Notes. **Select the exact range**, then tap **🔊** on the bubble. The selected range is passed through the source phonetic-to-IPA planner and speech engine. When nothing is highlighted, the non-whitespace sequence at the caret is read, with a fallback to the note text.

The new **⚙️ Settings** button is grouped beside **PrtSc**. It opens voice base (masculine ↔ androgynous ↔ feminine), reading speed, volume, any speech voices installed in the browser, and an IPA preview. Changing these adjustments does not rewrite the source phonemes. Browser speech voices approximate phonemes that they do not directly support; the original synthesised click and glottal release cues are preserved. **This is not a pre-recorded native Aza’raan speaker.** Availability of voices and sound output depends on the browser and OS.

### Language Evolution page

**Page 2: ✧ Language evolution** is the original interactive six-stage chart from the Aza’raan ZIP (Proto, Ancient, Archaic, Classical, Traditional, Modern), including glyph artwork, arrows, lineages, tracing, historical sound descriptions and Khmer-copy controls. The same floating keyboard can remain open over it; a small preview displays the active note so typed text is not hidden behind the chart page.

### Removed key-editor tools

The older right-click-to-remove feature, removal/edit mode, Restore Keys, Import JSON, Export JSON and `json/keys.json` **have all been removed**. Right-click is now an alternate way to open accent/phoneme choices, not a way to remove keys. Regular QWERTY keys cannot be hidden or deleted from this build.

## Files

Only one HTML file (`index.html`) is present, alongside `css/`, `js/`, `json/`, `assets/`, and `docs/`:

| Location | Contents |
| --- | --- |
| `index.html` | One two-page application and one floating keyboard |
| `css/keyboard.css`, `css/aza-merge.css`, `css/evolution.css` | Steampunk UI, merged Aza’raan/voice controls, full historical chart |
| `js/keyboard.js`, `js/azaaraan-bridge.js` | One bubble engine, language and era selection, source phonetic integration |
| `js/aza-*.js` | Preserved Aza’raan Unicode, accents, phonetic source, TTS planner and evolution engine |
| `js/notes.js`, `js/capture.js`, `js/keyboard-data.js` | Notes, screenshots, Latin accents, emoji and symbols |
| `js/html2canvas.min.js` | Bundled screenshot renderer (see licence) |
| `json/azaaraan/`, `json/*.json` | Source language and historical datasets; not key-editor configs |
| `assets/ttf/`, `assets/svg/`, `assets/images/`, `assets/audio/` | Aza’raan source fonts, historic glyphs and sound cues |
| `docs/azaaraan/` | The source archive documentation and lineage audits |
| `docs/` | This README, merge audit, attribution, bundled third-party licenses |

No app scripts call the Google Apps Script backend or alter existing remote storage. The original downloaded Aza’raan programming was read locally and the core *phonetic and speech computation modules* were reused rather than duplicating its large independent keyboard UI.

## Notes and limitations

* Notes autosave to browser `localStorage`, which can be wiped by private browsing or clearing website data. Save `.txt` to make an independent copy.
* The single plain-text notes editor uses whichever **current** Aza’raan era font is selected for all glyphs shown. Era is visual only; plain Unicode text does not retain a separate era designation per letter. Switching to QWERTY uses the standard fonts again.
* The source Aza’raan historical sound catalog contains alternate sound entries that share one Khmer code sequence. Shared glyphs cannot inherently distinguish those IPA alternates after text export; the long-press choice panel explains this where relevant.
* Browser limitations can affect Khmer mark stacking, emoji appearance, screenshot appearance, voices, and playback of rare IPA sounds.
* The Emojipedia link is a searchable external reference. The Unicode emoji themselves use the device's own font; no copyrighted Emojipedia image artwork is bundled.
* Screen capture saves a PNG of the visible **web app**, not other desktop windows or the whole operating system screen.
