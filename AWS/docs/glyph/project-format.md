# Portable project format

The `.azglyph.json` file is a self-contained browser draft. Its top-level `schemaVersion` is `2`. This file is meant for local backup and review; the standalone app does not upload it to any service.

## Shape

```json
{
  "schemaVersion": 2,
  "projectId": "aza-local-id",
  "name": "Aza'raan Glyph Studio",
  "language": "Aza'raan",
  "activeEra": "proto",
  "eraOrder": ["proto", "ancient", "preclassical", "classical", "traditional", "modern"],
  "eras": {
    "proto": {
      "id": "proto",
      "label": "Proto",
      "backendEra": "archaic",
      "targetCount": 52,
      "glyphs": []
    }
  },
  "settings": {
    "letterSpacing": 0,
    "lineSpacing": 1.45,
    "glyphSize": 100,
    "cellsPerPage": 16,
    "paperSize": "letter"
  }
}
```

The example omits the remaining five eras and detailed glyph records to keep the shape readable. A full export contains all era inventories, marks, keyboard mappings, notes, art, and metrics.

## Glyph record

Each glyph record has a stable local `id`, an era id, an ordering value, a Unicode `character` and `codepoint` when assigned, and these editable fields:

- Identity: `name`, `meaning`, `category`, `key`.
- Reading: `ipa`, `sound`, `pronunciation`, `transliteration`, `latinSubstitute`.
- Research: `notes`, `parents`, `confidence`, `lineageNote`.
- Raster art: flattened `artwork` and `layers[]` entries with visibility, opacity, blend mode, name, and image data URL.
- Font metrics: `size`, `baseline`, `leftSpacing`, `rightSpacing`, `advanceWidth`, `ascender`, and `descender`.
- Vector data: `vectorContours[]`, traced from raster art and used by the local font builder.

`artwork` and layer images are PNG data URLs. Removing artwork from a glyph does not erase its identity fields. Editing the raster art clears the vector trace so the font exporter cannot silently use a stale outline.

## QR sheet payload

Version 2 sheet QR data is JSON. It includes the project id, era id, page number, paper size, cell grid, and the ordered glyph ids and codepoints for the printed cells. The scanner uses ids for the same project and Unicode values as a fallback for a different project. Blank rows can be recovered by id when the scan belongs to the originating project.

## Migration

The model accepts the original one-era project format using a top-level `characters` array and normalizes it into the six-era format. The old character list becomes the Proto era. Other eras are created as blank target inventories, and existing glyph art and metrics are retained where they match the older record fields.
