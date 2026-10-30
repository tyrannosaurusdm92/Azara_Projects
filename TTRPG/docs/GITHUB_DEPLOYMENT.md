# Deploy Belavadós V9 into Azara_Projects/TTRPG

The prepared archive contains only six allowed top-level entries: `index.html`, `js/`, `json/`, `css/`, `assets/`, `docs/`. No other project or repository must be modified.

This deployment requires a Git client with authenticated **write access** to `tyrannosaurusdm92/Azara_Projects`. The ChatGPT-connected GitHub API in this execution did not expose a bulk upload of local binary/container files, so completing the upload by API was not possible. The repository was **not** changed as part of this release.

1. Extract the V9 ZIP into a local folder called `Belavados_V9`.
2. Clone `https://github.com/tyrannosaurusdm92/Azara_Projects.git` in GitHub Desktop or another Git client.
3. Open the clone and copy the six extracted items into **only** its `TTRPG/` folder. Leave every other folder at repository root untouched.
4. If `TTRPG/placeholder` still exists, delete just that file after placing `TTRPG/index.html`.
5. Stage **only** files under `TTRPG/`, review changed-file paths, then commit and push to `main`. Example:

```sh
git add -- TTRPG/index.html TTRPG/js TTRPG/json TTRPG/css TTRPG/assets TTRPG/docs
git add -u -- TTRPG/placeholder
git diff --cached --name-only
git commit -m "Add Belavados V9 interactive living settlements"
git push origin main
```

6. Verify `https://tyrannosaurusdm92.github.io/Azara_Projects/TTRPG/index.html` after GitHub Pages finishes publishing (if Pages is enabled for the repository).

## Integrity
ZIP SHA-256 (before any further rebuilding): record separately in release notes. All 162 V9 living maps are packed in GZIP-encoded JS files. They use standard browser `DecompressionStream('gzip')` (supported in modern browsers), so they can open via a `file://` local path without fetching uncompressed JSON.

Data on disk in `json/living_maps/` is **V8 source-preservation data**. Full V9 JSON may be reconstructed with `python docs/export_v9_json.py`. Keep the JS payloads while serving the site; they are its full living world maps.
