# Aza’raan audio assets

`azaaraan-click-synthetic-cue.wav` and `azaaraan-glottal-release-synthetic-cue.wav` are newly generated, brief sound effects corresponding to the **synthetic cues** in the speech engine. They are NOT recorded human speech, are not authentic consonant articulation samples, and do not replace actual text-to-speech synthesis.

The live voice program uses built-in browser Web Speech (`speechSynthesis`) for sentence reading, and Web Audio to generate its own click and glottal cue transients at runtime. These offline `.wav` files are optional reference/export assets. The package includes NO native recorded or trained Aza’raan speech voice. Voice timbre varies by installed browser/OS speech engine.
