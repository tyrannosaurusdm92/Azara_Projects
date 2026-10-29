# Existing AWS integration boundary

This standalone prototype does not include an API, Lambda function, Apps Script source, AWS credentials, or data synchronization. Its job is to refine the glyph workflow before the interface is merged into the current program. The tested backend supplied with the source materials remains the only backend.

## Existing actions to use when merged

The supplied backend defines the relevant language and attachment actions:

- `languages.get` and `languages.list` to load existing language records.
- `languages.save` to persist the selected language record.
- `attachments.upload` or the supplied chunked upload actions to store artwork files.
- `languages.links.save` and `languages.links.list` for an existing project/language relationship.
- `keyboard.save` for the keyboard profile.

The existing bridge should own authentication, revision checking, and request transport. The merged frontend should call the same bridge already used by the current app. It should pass the signed-in user's existing project and language identifiers. It should not send direct requests to the Apps Script deployment URL.

## Suggested mapping from this draft

Map the local project into the existing language record's `orthography` settings. Keep the era identifier as frontend metadata and map each era to its existing backend era value. Upload raster artwork through the current attachment workflow, then keep the returned attachment id in the orthography record. Keep base64 artwork data only in local IndexedDB and the portable `.azglyph.json` export.

The local draft glyph fields are:

| Local field | Use when mapping |
| --- | --- |
| `character`, `codepoint` | Unicode glyph and codepoint |
| `name`, `meaning`, `notes` | Existing language metadata or orthography notes |
| `ipa`, `sound`, `transliteration`, `latinSubstitute` | Phonetic and keyboard-facing fields |
| `size`, `baseline`, `leftSpacing`, `rightSpacing`, `advanceWidth` | Per-glyph metrics |
| `parents`, `confidence`, `lineageNote` | Optional glyph lineage metadata |
| `artwork` / `layers[].artwork` | Upload to the current attachment store; persist returned ids |
| `vectorContours` | Optional local font-export data; do not send unless the existing record schema supports it |

The local font exporter creates files in the browser. The font file can be handled by an already-supported attachment upload flow after merge if the product needs to persist it. This prototype leaves that connection out until the UI and field mapping are accepted.

## Review points before integration

1. Confirm the existing language id and project id are available in the authenticated app state.
2. Confirm the current keyboard profile's serialization and revision expectations in the bridge client.
3. Map the editor's six era selectors to backend era ids using the supplied constants; do not add new backend eras in this frontend.
4. Upload artwork with the backend's existing attachment action and associate ids in the language record.
5. Preserve conflict and revision handling from the tested backend bridge.

The standalone package can be hosted from GitHub Pages for review. It makes no network requests except for the static files from its own host.
