# Image cleanup — Literary Friend

The previous package included **2,114 image files** (16,511,181 bytes).

This package retains exactly **3 required images** (68,681 bytes) and removes **2,111 images** (16,442,500 uncompressed bytes).

## Kept

- `assets/mark.svg`: logo rendered in `index.html` and precached by the service worker.
- `assets/literary-icon-192.png`: PWA manifest icon, 192 × 192.
- `assets/literary-icon-512.png`: PWA manifest icon, 512 × 512.

## Removed

The obsolete FontForge documentation images, imported Word-clone screenshot/icon collections, and unrelated mockup assets are not required by the current running editor. No live-shell HTML, CSS, or JavaScript file loads those images. Historical reference text is preserved under `json/`.

No editor functionality, writing Helper source, WebAssembly, account integration or keyboard script was removed during this cleanup. The service worker cache name was incremented so existing installations refresh shell resources.

See `json/image-manifest.json` for machine-readable asset inventory.
