# Update and provenance notes

The 2026-10-27 revision replaces the earlier provisional diacritic interpretations **for all 24 sound marks** with the explicitly supplied Aza’raan accent table. The 4 original structural markers are preserved without alteration. Internal mark IDs and actual Khmer sequences remain stable to protect existing script/asset bindings.

Original Khmer-only keyboard and historical atlas source mappings remain under `json/source-*.json`, updated where the old accent names and meanings occurred. Historical root sound names in the lineage atlas are archival lineage metadata rather than rules for Modern Aza’raan accents.

Previously used B-family provisional W interpretation was removed. B+W now produces V (/v/); B+F produces F (/f/); ordinary W is represented by its W-family base with the explicit Base accent, consistent with the W keyboard being accented-only.

The IPA voice upgrade adds an internal phoneme catalogue and generated click/glottal cues. It introduces no prerecorded audio files or visible supplemental-language controls. The depth slider never mutates the Aza’raan phonemic mapping.

The GitHub-informed pronunciation pass adds lesson profiles, slow/loop/contrast playback, local record and replay, language-tagged regional voice samples and a worldwide installed-voice sampler. It retains a single main Aza’raan voice and the original Khmer accent mappings. The third-party research and applicable MIT notice are in `GITHUB_SOURCES.md` and `THIRD_PARTY_NOTICES.md`.
