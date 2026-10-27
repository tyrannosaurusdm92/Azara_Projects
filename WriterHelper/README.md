# Aza’raan WriterHelper

Single-entrypoint frontend merging all LiteraryFriend book-writing tools, the complete Aza’raan Language Studio, and Savanski QWERTY keyboard. **Open `index.html` via an HTTP(S) static host**; the language studio's JavaScript, JSON files and fonts must load from the same origin.

## Included project sections

01 Language: Proto, Ancient, Archaic, Classical, Traditional, Modern. Language channels open the complete original language atelier (keyboard, voiced pronunciation, and interactive evolution chart).

02 Book One: The Door In The Tree  
03 Book Two: The Drowned Queen  
04 Book Three: The Unwilling Spy  
05 Book Four: The Hollow Throne  
06 Book Five: Never-Ending Loss  
07 Book Six: Threats Of Space  
08 Book Seven: Collision Of Worlds  
09 Book Eight: Unraveled

Every book has Manuscript, Outline, Character Notes, Continuity Notes, and Drafting Table starter pages; create more channels using **+ New page**. The fixed keyboard panel supports **Aza’raan / QWERTY** toggle, the four font eras, optional key sounds, and Speak/Stop.

## Architecture

- `index.html`: **only .html file** in WriterHelper.
- `script/js/aza-language-document.js`: original Language Studio's HTML embedded as JS string (not a second HTML file).
- `script/js/savanski-document.js`: full original Savanski HTML embedded as JS string.
- `js/aza/`, `css/`, `json/`, `docs/`, `assets/`: complete version-matched language sources, 4 TTF fonts, original sound files/graphics.
- `script/js/aza-integration.js`: language workspace, editor input, keyboard switching, audio and era integration.
- `vendor/LiteraryFriend/`, `vendor/keyboard/`: other upstream source scripts, assets and authoring helpers.
- `manifest.webmanifest`, `service-worker.js`: PWA entrypoint and **static-only** offline caching.
- `script/js/backend-bridge.js`: frontend browser bridge pointing at the public current Apps Script deployment.

## Backend and storage

Backend source code was **not copied, published, modified or bundled**. The frontend uses only the user-supplied public Google Apps Script `/exec` deployment URL; the newer `AWS_RPC_*` message names are configured in the bridge. The backend's existing allowed-origin configuration must include the hosting origin for cloud sign-in and storage to work. Browser-local drafts continue working independently of cloud connectivity; export manuscript backups regularly.

## Operational notes

The original `Language/` Git subtrees and their glyph/sound/font content were reused byte-for-byte. Upstream projects are retained; the entire expanded frontend is committed directly to WriterHelper. Loading the original studio and keyboard through same-origin `iframe srcdoc` allows one HTML file without stripping their independent frontend functionality.

Manual checks recommended: Language era switching, QWERTY/Aza switching on every book page, long-press accents and Unicode stacks, pronunciations, saving across project switches, keyboard audio, offline reloading, cloud connection and export/restore. Full interactive browser and live cloud-endpoint tests were not completed here.
