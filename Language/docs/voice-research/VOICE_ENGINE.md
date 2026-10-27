# Aza’raan voice engine — technical design

- A single browser `SpeechSynthesisVoice` is picked for the session from an installed English voice, prioritizing Microsoft Zira, Jenny, Aria, Ava, and Samantha. If none of those are installed, another English voice is used. Its name or source is **not displayed**; there is no voice picker. The slider operates on the same voice at all positions.
- `voiceBase` ranges from 0 (Masculine) to 50 (Androgynous) to 100 (Feminine; default), mapped to `SpeechSynthesisUtterance.pitch` values 0.60 to 1.10 to 1.60. Rate and volume remain separate. These controls do not modify the transcription or the `SpeechSynthesisUtterance.text` argument.
- `transcribe` parses Khmer letters and the 24 accent rules, handles 4 special markers, supports Latin combining accents, and accepts `/IPA/` or `[IPA]` text. The hidden `AZA_IPA` inventory builds an event plan from IPA; unknown symbols and undefined Hard H alterations remain visible warnings.
- The event plan sends browser-readable approximations to one speech voice. It inserts short Web Audio cues for glottal `/ʔ/` and clicks `/ʘ ǀ ǃ ǂ ǁ/` between speech segments. The click cue is a sharp high frequency transient; it is a synthetic cue, not a sampled tongue articulation. Glottal closure is represented by a brief closure/release transient. Volume adjusts cue level; the voice pitch slider leaves cue identity fixed.
- Browser Web Speech has no portable direct IPA input. The other inventory sounds are recognized in source code and converted to approximate speech text, so a natural or exact realization of every phoneme is not guaranteed. The browser/OS voice may rely on a cloud service. Speech playback does not require a microphone; only the separate, user-initiated recording exercise requests it.

## Pronunciation workshop

- `js/pronunciation-lab.js` calls the same IPA playback engine with a slower rate or three repeats. It never rewrites the 24 accents or switches the main Aza’raan voice.
- Regional voice samples route through `SpeechSynthesis.getVoices()`, matching BCP 47 locale prefixes in priority order and preferring `localService` within a match. Missing voices disable that regional sample. The worldwide sampler enumerates only voices actually exposed by the browser; it does not ship eSpeak NG or neural models.
- MediaRecorder captures a user-initiated microphone stream, AnalyserNode draws the input waveform, and the resulting Blob is played locally through an audio element. Tracks stop after capture. There is no automatic IPA recognition or correctness score.
