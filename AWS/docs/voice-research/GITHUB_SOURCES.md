# GitHub pronunciation and TTS research

The studio remains one `index.html` with local JS, CSS and JSON. The following projects informed this revision; none of their whole runtime, language models or remote services are bundled.

| Project | License | What was implemented |
| --- | --- | --- |
| [EchoTalk](https://github.com/alisolphp/EchoTalk) | MIT | An adapted browser shadowing cycle: model playback, user-initiated `getUserMedia` + `MediaRecorder`, live `AnalyserNode` waveform, stop tracks, and local replay. See `js/pronunciation-lab.js`. Its license notice is retained in `THIRD_PARTY_NOTICES.md`. |
| [phonemize](https://github.com/hans00/phonemize) | MIT | Its separation of language-tagged processors and a pronunciation lexicon informed the separate Aza’raan IPA inventory, practice profiles and BCP 47 voice routing. No package code or language dictionary was copied. |
| [eSpeak NG](https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md) | GPL-3.0 | Its documented voice roster guided the priority locales for Māori, French, Italian, Spanish, Portuguese, Swahili and Arabic. No eSpeak executable, voice data or GPL code is bundled; browser-reported voices determine what works on the user's device. The eSpeak documentation notes that its Arabic voice requires fully diacritized input. |
| [OpenPronounce](https://github.com/Halleck45/OpenPronounce) | MIT | Reviewed for phoneme scoring. Its acoustic model and server requirements are outside this standalone ZIP, so the workshop presents a recording for self-comparison and makes no automated accuracy claim. |
| [eiktub](https://github.com/maherharb/eiktub) | MIT | Reviewed Arabic contextual spelling and vowel handling. Its transliteration code was not imported; Aza’raan's existing Khmer encoding stays authoritative. |

The regional button speaks a short sample **in the voice's own language**, while the Aza’raan sound model continues to use the studio's fixed voice and generated click/glottal cues. A comparable sound in another language is a learning reference, not an assertion that its phonetics exactly equal Aza’raan. The worldwide sampler uses whatever `SpeechSynthesis.getVoices()` reports and never substitutes a language voice for the main model.

Browser API references: [SpeechSynthesis voices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), and [microphone permission](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
