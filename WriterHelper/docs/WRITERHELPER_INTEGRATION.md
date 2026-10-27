# WriterHelper frontend integration — October 27, 2026

The complete `Language/` studio is copied into WriterHelper using the original, byte-identical Git trees. Its HTML is incorporated into `script/js/aza-language-document.js` as source data. Likewise the complete Savanski HTML is included in `script/js/savanski-document.js`. **The only HTML file inside WriterHelper is `index.html`.**

The original Language code runs in isolated same-origin frames using the exact original CSS, JavaScript, Khmer Unicode keyboard mapping, three-mark constraints, TTF era fonts, SVG image assets, local phonetics/TTS, and WAV cues. The full studio opens on Language channels; an Aza keyboard is available in every book editor, with QWERTY via the retained Savanski keyboard. Keyboard audio is opt-in/out.

The new backend is not published, edited or replaced. The public Apps Script `/exec` URL is the only public endpoint used. Bridge events are `AWS_RPC_REQUEST`, `AWS_RPC_READY`, `AWS_RPC_RESPONSE`. For cloud sign-in, the Apps Script deployment must allow the site's exact HTTPS `FRONTEND_ORIGIN`.

Service worker caches static same-origin scripts and fonts, not cloud requests, auth responses, user manuscripts, or sensitive backend source. Browser-local manuscript autosave works independently of backend availability.

Unverified: Actual voice quality depends on browser voices; some special Aza’raan phonemes need the internal sound cue path. Browser/CI interaction tests should verify typing after repeated project switches and cloud authentication on the final deployed origin.
