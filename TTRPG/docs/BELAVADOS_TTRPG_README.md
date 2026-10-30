# Belavadós · TTRPG World Forge and Onyx

## Entry points (exactly two HTML source files)

- `ttrpg.html` is the main entry point. Onyx remains a draggable, resizable floating widget above a fullscreen iframe. The widget has **one combined World Forge + Work chat** with local channels, prompt controls, and the included 800-response library. Its unsupported cloud tools are visibly disabled.
- `assets/code/index.html` hosts the original Belavadós World Forge editing/generation application inside that iframe.

The main entry is `ttrpg.html`, **not** `onyx.html`. Serve the directory over HTTP(S), such as GitHub Pages, rather than opening it with a local `file://` URL.

## Changes in this package

- Rebranded the app, install icons, manifest, notification worker, filenames, and user-visible titles to **Belavadós**. The attached tree-and-portal emblem is used for the app logo and both PWA install icons.
- Removed the Leisure conversation tab and Design tab; consolidated the World Forge and Work prompts into the one Work conversation while retaining channel management, the original Onyx runtime, chat, five static moods, and Work tools.
- Both **World Forge fullscreen** and **Work fullscreen** have dedicated exit buttons. World Forge uses the existing iframe, so data is not lost by opening a second copy. Work uses its existing fullscreen shell and workspace.
- Removed the previous `service-worker.js` and replaced it with `belavados-service-worker.js`, as a local PWA worker with no push notification backend. The entry page attempts to unregister the previous worker if installed.
- Kept the attached Forge engine, original static moods, Onyx conversation library, and browser-local dialogue. No separate profile identities, health pages, storefronts, or login pages were added.

## Notes

No backend exists for this TTRPG app. Chat uses the supplied 800-entry Onyx response library in the browser, and workspace state persists in browser storage; it is **not a generative AI** and cannot perform live web research or cloud file operations. Widget transcript save downloads a `.txt` file. Image generation, online research, and remote file uploads are unavailable. The package was not deployed to GitHub.

## Runtime

Open `ttrpg.html` over an HTTP(S) static host. The only HTML files are `ttrpg.html` and `assets/code/index.html`. No login, user profiles, external backend endpoints, API keys, or server scripts are required. The Work fullscreen shell is also local-only.

## Files and branding

Belavadós owns the manifest, install icons, PWA worker, titles, widget labels, and theme. The package contains the five static mood PNG files (thinking, listening, snuggly, hungry, judgmental). Legacy pixel-image formats are not used by the active portrait renderer.
