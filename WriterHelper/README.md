# Aza’ra WriterHelper

A frontend-only merge of LiteraryFriend and the **complete Savanski Keyboard** from
`PersonalProjects/keyboard`. Source histories and all binary/audio/reference files
are preserved as pinned Git submodules.

## Clone and run

**Do not use GitHub's Download ZIP:** that omits submodule contents.

```sh
git clone --recurse-submodules https://github.com/tyrannosaurusdm92/Azara_Projects.git
cd Azara_Projects/WriterHelper
python -m http.server 8000
```

Open http://localhost:8000/. Static HTTP hosting is necessary for keyboard ES
modules and JSON. The requested backend is not part of this pass.

## Workspace layout

**01 Language** — Proto, Ancient, Archaic, Classical, Traditional and Modern.

**02–09** — The Door In The Tree; The Drowned Queen; The Unwilling Spy;
The Hollow Throne; Never-Ending Loss; Threats Of Space; Collision Of Worlds;
Unraveled. Each book has Manuscript, Outline, Character Notes,
Continuity Notes and Drafting Table pages. Create additional book pages using
the **+ New page** button. All pages support the complete Savanski on-screen keyboard.

LiteraryFriend's writing features, page formatting, helper, planner, tasks, local
save, and data export remain. The original LiteraryFriend Unicode keyboard also
remains accessible. The Savanski Unicode studio is opened with its **Unicode library**
button; its standalone character-editor selections do not automatically mirror
back into manuscripts, while on-screen Savanski key events are bridged.

## Important

- The frontend uses browser-local storage. Export backups regularly.
- This is a same-origin iframe integration; use localhost or an HTTP(S) static host.
- The keyboard does not type into operating-system applications from a browser.
- Both upstream source trees are pinned rather than copied; you must fetch submodules.
- `sources/PersonalProjects` contains the full upstream repository, because Git
  cannot mount only its `keyboard` subfolder as a submodule.
- The merged frontend has not been GUI-tested in a browser here.

## Sources

- https://github.com/tyrannosaurusdm92/LiteraryFriend
- https://github.com/tyrannosaurusdm92/PersonalProjects/tree/main/keyboard
