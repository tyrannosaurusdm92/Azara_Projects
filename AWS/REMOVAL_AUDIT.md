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

## Independent follow-up verification

Checked against the last full pre-removal AWS snapshot (`528f1acaa248b7c49045bed02bc18458c9c13b83`):
- Current AWS has 481 tracked files, including 467 historical/brand/font assets. All 467 retained assets have exactly the same Git blob hashes as before the cleanup.
- 1,270 former AWS files were removed, including 223 code or style files. The active frontend consists of a read-only HTML viewer, its CSS/JS and a service worker. No on-screen keyboard, writable editor, speech synthesis, recorder or TTS module is shipped.
- Saved manuscripts in existing browsers are accessed read-only; the cleanup does not delete browser data or the backed-up files in Git history.
- Only `AWS/` differs within `Azara_Projects`. The entire separate `Language/` folder matches its pre-removal Git tree.

### Other repositories checked

Two unrelated repositories had earlier deletion commits, followed by exact restorations:
- `LiteraryFriend`: restored commit `501ecef93319ff5661ebcd72df0e9361121d1b7e`; both the restored tree and original tree are `e07959e3171965f30bf26c6d847d73569dee68c4`.
- `PersonalProjects`: restored commit `1a75b440e23d9445091af7d97661b7a639932c84`; both the restored tree and original tree are `b3fae6bb3a2ffdd57165a943af86f69d21cc762e`.
- Other connected repositories checked for commits since 2026-10-28 00:00 UTC: `An_Admins_Place`, `LifeHelpers`, `TableGate`, `KillerInTheKeep`, `FerretFrenzy`, `SignatureSpaces`, `LifelinesAndLies` and `RealmsAndRolls`. No commits in this window were found in these repositories.

Git commit history remains intact. No other repository or project was modified as part of this verification.
