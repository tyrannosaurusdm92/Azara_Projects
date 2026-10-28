# Literary Friend

A responsive, offline-capable browser-based writing workspace built from the Luxury Editor shell.

## Start

Serve this directory over HTTPS or a local web server, then open `index.html`. For example, on a machine with Node installed, `npx serve .` can serve it locally. `file://` prevents browser fetch and service worker features.

## Folder policy

- `index.html` is the **only** HTML file in the package.
- `service-worker.js` and `manifest.webmanifest` sit beside it.
- Only `script/js/` and `script/wasm/` nest beneath `script/`. Neither has children.
- `css/`, `json/`, `assets/`, and `docs/` contain files directly and have no subfolders.
- `assets/` contains **only the three images used by the live shell**: `mark.svg`, `literary-icon-192.png`, and `literary-icon-512.png`. Old reference screenshots and unused FontForge/Word-clone art were removed.
- Every delivered file is smaller than 15,000 KB.

## Feature and compatibility notes

- Writer Helper rules, local writing analysis, references, world library, on-screen keyboard, and glyph tools are preserved. Generative AI is disabled; no AI-generation backend is included.
- Text-analysis WebAssembly is the compiled module in `script/wasm/`. No Python program or runtime is shipped.
- The account integration continues to refer to the existing user-provided Apps Script endpoint. No `.gs` file or replacement backend has been added. Live sign-in must be checked from the backend's authorized website origin.
- Large optional Helper JavaScript is split into `.pt1`, `.pt2`, etc. files and loaded only on demand by `script/js/helper-chunks.js`. Their original hashes and split metadata are recorded in `json/split-files.json`. They are **not** loaded at startup.
- Older standalone HTML reference pages are retained as structured JSON in `json/reference-pages-*.page.json`. The catalog lives at `json/reference-pages-index.json`. Those documents are data, not independently executable pages.
- Original desktop-only Pandoc executables, C/C++/Rust/desktop build files, and Python examples were excluded because they cannot execute in this browser-first layout. The glyph studio supports browser-based SVG and JSON contour exports; it is not a full compiled FontForge port.
- Large source asset libraries were not inflated with filler to meet a size target.

## Launch checklist

1. Keep all included folders and files together; do not rename individual `.ptN` files.
2. Open the site over HTTP(S) and check editing, local save, Helper, keyboard, and resize handles.
3. Use HTTPS for installation/service worker and authorize your deployed website origin with your existing backend.
