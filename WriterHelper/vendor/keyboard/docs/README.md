# Savanski Keyboard — floating on-screen keyboard / web PWA

**Savanski is a floating keyboard project, not a new operating-system language keyboard.**
The web ZIP contains one HTML file (`keyboard.html`), and its local-first UI, Unicode
editor, layouts, split keys, sound libraries, logo, and tested Apps Script URL.
No server-side `.gs` script is copied or edited.

## Upload and install

1. Extract `Savanski_Keyboard_unified.zip` and upload the contents to
   `https://github.com/tyrannosaurusdm92/PersonalProjects/tree/main/keyboard`.
2. Enable GitHub Pages and navigate to
   `https://tyrannosaurusdm92.github.io/PersonalProjects/keyboard/keyboard.html`.
3. Click **Download App** to install the PWA where supported. On iOS, use
   Safari's **Share → Add to Home Screen**.
4. Select **Run Keyboard** to show Savanski. Choose a typing task, split layout,
   sound pack and theme. In the PWA, keys type into Savanski's own writing field;
   use **Copy text** to paste elsewhere. A PWA cannot send text to other apps.

For typing into Notepad, Word, Chrome and Discord without changing your Windows
input language, install the **separate Windows floating host** (source supplied
as `Savanski_Windows_Floating_Host_Source.zip`). It uses .NET 8/WebView2 and native
SendInput, does not register an IME, and has not been compiled or device-tested here.
The Windows source ZIP includes build instructions and a Windows CI workflow.

## Structure and features

```
keyboard.html
service-worker.js
manifest.webmanifest
style/                # styles, one level
script/               # JavaScript modules, one level; WASM if needed
json/                 # layout, character, sound catalog data
assets/images/        # supplied icon / branding
assets/audio/<style>/ # seven separate collections, 719 clips plus originals
docs/                 # tests and attribution
```

`script/` holds JavaScript; no WASM binaries are currently required. There are no
additional HTML pages, Windows batch files, native code under the web folder,
or backend files. No nesting except the permitted `assets/audio/<style>/`.

- Tasks: full, large keys, code, numbers, navigation and shortcuts.
- Full desktop layout includes Escape, F1–F12, Print Screen, arrows, modifier
  keys, punctuation, navigation, and a toggled numeric keypad.
- Split / join, touch drag for left/right halves, independent half scale,
  adjustable separation, movable/resizable keyboard panel, S/M/L sizes.
- Long-press accents, 368 bundled Unicode characters, combining marks,
  custom keys, NFC/NFD, basic multilingual layouts, favorites and word suggestions.
- Seven original audio themes, 719 short WAV clips, **pre-established per-key**
  sound assignments within each theme, preview, volume, optional offline pack caching.
- High-contrast quick themes, individual color selection, readable controls,
  reduced-motion CSS, local-only settings and offline PWA cache.

## Platform limitations

- Windows: native host can attempt cross-app input without TSF, subject to
  focus/security/elevation restrictions. Native Print Screen saves a local PNG.
- macOS/Linux: floating native hosts are **future development**, not shipped here;
  accessibility permission and compositor restrictions apply.
- Android/iPhone/iPad: the PWA is an offline typing surface and character
  copy tool, not a system-wide keyboard. Native IME/extensions are postponed.
- Browsers: Print Screen may offer a user-mediated screen capture where
  supported; no browser can take an unrestricted desktop screenshot.

## Run checks

With Node.js 18+ installed, inside the extracted keyboard directory:

```sh
node docs/validate.mjs
node docs/keyboard-model.test.mjs
node docs/workflow-model.test.mjs
```

These are static/model checks, **not** substitute for physical Windows tests.
Native cross-app input, focus preservation, tray behavior, and installer removal
must be exercised on Windows before publishing a release as tested.

## Privacy and backend

The existing public Apps Script deployment URL is configured only for optional
supported profile preference synchronization. Raw keystrokes, draft contents,
passwords, screenshots and clipboard contents never form part of backend requests.
Typing, sounds, local storage and split keyboard operation do not need the backend.
The selected sound theme and volume are stored locally and may synchronize only
through already-supported existing backend preference fields.

`docs/third-party-notices.md` explains the local SplitKeys data attribution.
Before publishing the audio collection publicly, verify permission and licenses
for each of the user's supplied source recordings.
