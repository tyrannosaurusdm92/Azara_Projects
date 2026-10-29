# Reference materials and dependency notices

## Supplied reference archives

The supplied Aza'raan template sheets contributed the starter codepoint sequence and the hand-fill workflow. The app draws its own clean print sheets and prints its own QR mapping data. It does not reuse Calligraphr-branded pages or depend on a Calligraphr service.

The supplied Handwrite project informed the idea of exporting character sheets and setting glyph spacing. The supplied HandFonted project informed the separation between image cleanup, glyph shape, and font metrics. Neither archive's Python runtime, backend, or model weights are part of this browser project. The Latin-character classifier weights in HandFonted are not a language-specific Aza'raan character recognizer, so the package does not bundle those weights.

## Local browser libraries

The required vendor files are checked into `vendor/` so GitHub Pages use does not depend on a CDN:

- **OpenCV.js** — local raster thresholding, morphology, and contour extraction for the trace and neaten tools. See `vendor/OPENCV-LICENSE.txt`.
- **opentype.js** — browser-side TrueType/OpenType font serialization. See `vendor/OPENTYPE-LICENSE.txt`.
- **jsQR** — QR decoding fallback for browsers without `BarcodeDetector`. See `vendor/JSQR-LICENSE.txt`.
- **QR Code Generator for JavaScript** by Kazuhiko Arase — print sheet QR creation. The license header is retained in `vendor/qrcode-generator.js`.

The app loads the libraries from local files only. OpenCV.js is lazy-loaded when a glyph cleanup or trace action is requested. The project does not download or execute Python packages, model weights, remote fonts, or external scripts.

## Upstream project references

- Handwrite: <https://github.com/yashlamba/handwrite>
- HandFonted: <https://github.com/reshamgaire/HandFonted>
- OpenCV.js: <https://github.com/opencv/opencv>
- opentype.js: <https://github.com/opentypejs/opentype.js>
- jsQR: <https://github.com/cozmo/jsQR>
