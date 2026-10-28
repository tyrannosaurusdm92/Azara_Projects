# LiteraryFriend Frontend Repair — 2026-08-10

This pass repairs the supplied LiteraryFriend frontend and Studio packages against the supplied product blueprint and the user's already-deployed backend.

## Backend target

- Web app: `https://script.google.com/macros/s/AKfycbyLTAwu6-t7WST6QSnvuPbhqclOhG6eb1zXhWJhwpZl3d5Lg6JAcLP-Aqsa7eSe88AQ/exec`
- Apps Script library: `https://script.google.com/macros/library/d/1uq9wTJuIWNphZvGN_QGR3CGlBSWIRMhdD2i-PwcmHCJWTLOVoGKa_PyC/2`

The existing `.gs` backend source files in this package were intentionally **not edited or replaced**. They remain reference/source material already present in the supplied project. The active browser clients and configuration metadata were repaired to use the deployed backend above.

## Frontend repairs

- Updated every active browser/client/config reference from the prior deployment to the new deployment and library version 2.
- Unified same-tab account-session propagation across the login client, designed shell, outer Studio, Book Builder, and Art Studio without forcing persistent “remember me” storage.
- Added a parent → Studio → nested Book/Art context bridge so the active LiteraryFriend project and its backend project ID reach Book Builder and Art Studio.
- Preserved cloud project context when Studio creates, imports, or reopens a local Book Building project, preventing cloud saves from drifting into a duplicate project.
- Hardened the Studio backend client with authenticated envelopes, timeout handling, JSON/error validation, and health/client-config helpers.
- Repaired structured Story Intelligence synchronization so local project IDs are translated to backend project IDs and returned backend record IDs are retained for later updates.
- Repaired dependent Story Intelligence ID translation for character knowledge, scene/thread links, causal links, world-rule sources, and plot-issue actions.
- Corrected timeline cloud payload fields to the backend's `startValue`, `endValue`, `participantIds`, `locationIds`, and `sortKey` vocabulary.
- Aligned the designed-shell account dialog password minimum with the backend's 10-character minimum.

## Validation performed

- JavaScript syntax validation across application JS.
- JSON parse validation across project JSON/configuration files.
- Old-backend reference audit (active frontend/config files now use the supplied deployment; old links may remain only inside untouched `.gs` reference/backend source files).
- JavaScript integration-harness testing with the Apps Script API mocked at the network boundary, covering the functional API envelope, Studio API envelope, account-session transfer through both Studio frame bridges, and remote project-context propagation into Book/Art cloud state.
- Public deployment launcher verification against the supplied Apps Script Web App URL.
- ZIP integrity and full two-part reconstruction/hash testing after rebuilding both supplied package halves.
