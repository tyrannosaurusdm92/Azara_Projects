# AWS removal audit · October 28, 2026

**Scope:** `Azara_Projects/AWS/` only. All unrelated repositories and project directories remain untouched.

Removed from the current AWS branch:
- Standalone and embedded QWERTY and Aza’raan keyboards, their buttons, layouts and floating bubbles.
- The former writing editor and language-composition runtimes, editable fields and type-to-script controls.
- All frontend voice and speech code, practice/recording UI, audio cue assets and associated voice metadata.
- Legacy vendor scripts, sheets and code-backed modules, old cached asset manifests and old frontend documentation.

Retained for the future:
- Read-only access to the eight book workspaces and previously saved browser manuscripts (no data deletion).
- Historical glyph images and SVGs, TTF font files, six-era evolution chart and reference JSON.
- Branding and PWA manifest, with a new minimal read-only page and replacement service worker.
- Existing public backend configuration, unchanged and unused by the read-only page.

**No replacement keyboard or voice implementation has been added.** GitHub's ordinary commit history continues to preserve older revisions unless separately rewritten.
