# Aza'raan Writing Studio — Draft 1

This is a **static, single-HTML-entry** redesign of the supplied LiteraryFriend project with the supplied Aza'raan glyph studio integrated. The sole HTML file is `index.html`. The original source content and static project assets remain in the package. The supplied Google Apps Script backend was **not changed, included or redeployed**.

## Start / publish

Deploy the **contents of this ZIP** in your GitHub Pages site root or the selected repository path. The root `index.html` loads the project. GitHub Pages is HTTPS, so supported desktop and mobile browsers may offer **Download App** in the movable hamburger menu or their own Install/Add to Home Screen action. When installed, each device opens the same application icon but **content is not automatically synchronized just by installing the app**. Use Settings -> Account -> Sync local -> cloud on the source device and Restore cloud -> local on the destination device. The latter replaces local state after confirmation, so back up before restoring.

The browser saves editor state, dictionary entries, tasks and metadata in IndexedDB. Glyph design has its own persisted IndexedDB store and is also included in full JSON backups/cloud snapshots. Attachments are stored locally in IndexedDB; small attachments may also be included inline in synced snapshots, and larger attachments are copied to the existing AWS attachment endpoints when you initiate cloud sync. Offline assets can be cached by the service worker when deployed via HTTPS.

## Master navigation and books

The menu can be collapsed to a hamburger and dragged by its handle. It includes Language, Library, Full Series and eight individually named book sections. Each book starts with Synopsis, Book Outline, Manuscript, Chapters, Characters, Plot Threads, Research and Notes & Continuity. Full Series starts with series synopsis, outline, characters, plots, worldbuilding, timeline and notes. You can create nested pages or sections, rename, duplicate, move and trash them. Existing LiteraryFriend writing, tasks and files are retained when migrating an existing local browser database. Each page and its notes is represented in Library. Select text on an editable page and choose Important to collect an excerpt in the Library.

Library imports `.txt`, `.md`, `.markdown` and `.html` as editable pages and other supported files as attachments (20 MiB maximum per file for compatibility with the supplied AWS backend). You can search, sort, download, catalog, copy, trash and restore. Permanent purge cannot be undone. Browser notifications for deadlines require notification permission and an open tab or installed app; this is not a server-side reminder system.

## Language section

- Glyph Studio includes the original integrated glyph drawing, editing, import, inventory, lineage, mark, sheet, preview and export tools from the supplied Aza'raan Glyph Studio. Era Evolution Charts opens directly to the lineage/evolution interface. Language Overview, Grammar & Syntax and Language Rules & Orthography are editable pages.
- Dictionary & Lexicon provides searchable local word records with era, IPA, part of speech, meaning, notes, edit/delete and CSV export. Dictionary records are included in studio snapshots; the frontend does not write these as separate `lexicon.save` backend records.
- Pronunciation & TTS uses the existing `aza.tts.plan`, `aza.tts.generate` and `aza.tts.audio.chunk` actions. Speech generation requires the pre-existing backend's Cloud TTS API configuration and authenticated access. Phonetic accuracy depends on backend provider support.
- All built-in **on-screen/virtual keyboards** from the integrated application are removed, as requested. Native typing and ordinary browser/physical keyboard interactions remain usable. No new keyboard was introduced.

## Existing backend

Frontend bridge endpoint:

`https://script.google.com/macros/s/AKfycbyvpUn2_fADmOAOMqh1pHatTlegwZKYloWRPSSrM1kBkSwP2l5LzADQ7jKMr7TCJJP2/exec`

The frontend uses the backend's existing `AWS_RPC_*` iframe request protocol, its current authentication and 2FA, notes and file upload/download routes. Cloud functionality requires an **authorized frontend origin**, valid sign-in and backend availability. This ZIP contains no new backend `.gs` file, no modifications to the uploaded `.gs`, no Windows batch files and only one HTML file. The backend cannot be verified against the live deployment by static source and local tests alone.

## Directory structure

`index.html`, `manifest.webmanifest`, `service-worker.js`, `script/` (JS including glyph engine and static vendor libraries), `style/` (CSS), `docs/`, `json/`, `assets/` (icons, glyph templates, graphic assets). Third-party utilities and original assets remain for tool compatibility. No server runtime, Python, PHP or node process is necessary on GitHub Pages.

## Draft limitations / safety

This is a functional first draft, **not a claim of end-to-end live deployment verification**. Local smoke tests checked writing, all named sections, library rendering, glyph rendering, dictionary creation and opening the lineage view in Chromium. They do not substitute for a live owner-authenticated backend test or testing PWA installation on your desktop and phone. Cloud snapshot replacement is user-confirmed rather than a collaborative live-editing sync protocol. Cloud push makes new note chunks, and long-running users may need to prune old cloud snapshots using their account tools.
