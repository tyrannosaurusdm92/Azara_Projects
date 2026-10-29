# Aza’raan Writing Studio

The AWS app provides eight book workspaces, a language writing desk, IPA and sound-to-script tools, a glyph/font workshop, interactive language evolution, audio playback, local backups, PWA installation, and authenticated cloud sync.

All on-screen keyboard implementations, floating bubbles, buttons, keyboard preference sync, and keyboard vendor packages have been removed from this deployment. Native operating-system typing remains available in editable fields.

Open index.html over HTTP or HTTPS. The frontend retains the existing public AWS backend endpoint; credentials remain server-side.

The single HTML app entry uses script/js and script/vendor/LiteraryFriend (without its on-screen keyboard), json, assets, and the offline service worker.

The removal does not delete language charts, fonts, pronunciation data, or manuscripts. It does not rewrite remote backend records or Git history. Older local PWA caches are discarded when the updated worker activates.
