# Sound-first keyboard verification

Executed in Chromium headless with the original HTML/CSS/JS assembled locally (no network needed).

| Check | Result |
| --- | --- |
| Keys have exactly the requested order | PASS, 23 rendered |
| A hold menu | PASS, apple, father, awe, ay, uh |
| Right-click letter | PASS, sound modal opens |
| Touch-pointer hold (550 ms) | PASS, sound modal opens |
| Desktop modal open/close | PASS |
| A + Z + A (uh) + next emphasis | PASS, `ឯាឯ័៑`, `/æzʌ/` |
| glottal + rolled R + A (uh) | PASS, `រ៉ះ័`, `/ʔr͡rʌ/` |
| Lokhana example | PASS, `ឡឧុគ៍ំឯ័`, `/loʊkɑːnʌ/` |
| Glyph assignment manager | PASS, 49 original slots (21 base + 24 accents + 4 specials) |
| Duplicate HTML IDs | PASS, none |
| Mobile popup responsive height | PASS, fits 393 × 851 viewport with interior scrolling |
| JavaScript startup/runtime errors in tests | PASS, none observed |
| Existing TTF outlines modified | NO, intentionally unchanged |
| Uploaded artwork persistence across actual browser restarts | NOT VERIFIED; requires host browser origin and IndexedDB permissions |

The test harness used inline CSS/JS to work around this environment's browser network-navigation restrictions; original ZIP keeps its external project files unchanged. Actual installed-font rendering, IndexedDB persistence after browser restart, and speech audio output on specific devices should be verified by the user on the target browser after hosting.
