# Draft 1 changes

- Rebranded frontend and PWA: Aza'raan Writing Studio, new AZ app icon, new manifest and service worker cache name.
- One index.html entry and reorganized style/ and script/ assets.
- Removed original on-screen keyboard and integrated glyph studio virtual keyboard; native text entry preserved.
- Updated frontend Apps Script URL and `AWS_RPC_*` action bridge; original backend left untouched.
- Introduced draggable/collapsible hamburger master navigation and series/book subpage hierarchy.
- Retained existing LiteraryFriend editor, formatting, helper, document operations, tasks/deadlines and local backup features.
- Added local/library files, drag-drop, copies, trash/restore, catalog, sorting, Important excerpt collection, AWS file sync.
- Integrated supplied glyph studio (glyph drawing, inventory, 24 mark controls, sheet exports, lineage/evolution and fonts).
- Added searchable Aza'raan dictionary with forms and CSV export; backend-backed TTS client.
- Added offline app cache shell and install guidance.

## Important notes

Cloud operations were reviewed against the supplied `.gs` signatures and must be tested on your deployed origin. Automatic realtime cross-device merging was not implemented: use explicit upload/restore actions. The supplied backend was not copied into the application.
