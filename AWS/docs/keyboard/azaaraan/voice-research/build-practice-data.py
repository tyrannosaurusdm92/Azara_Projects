#!/usr/bin/env python3
"""Generate the offline Aza’raan pronunciation lesson data and JS mirror."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
profiles={
 "oceanic":{"name":"Oceanic","locales":["mi-NZ","mi","haw-US","haw","sm","to","fj"],
            "sounds":"ŋ au uː ʔ ɲ ɑː ja juː wuː".split(),
            "note":"Compare vowel length, nasals and glides. A regional voice sample is a language example, not an Aza’raan pronunciation."},
 "romance":{"name":"Romance · Latin-derived","locales":["fr-FR","fr","it-IT","it","es-ES","es","pt-PT","pt","ro"],
            "sounds":"ɲ ʃ tʃ dʒ ɛ æ ɑː iː ɔɪ ɣ r".split(),
            "note":"Compare palatal consonants, fricatives and vowel qualities across installed Romance voices."},
 "african":{"name":"African voices","locales":["xh-ZA","xh","sw-KE","sw","zu-ZA","zu","af-ZA","af","am-ET","am"],
            "sounds":"ǃ ŋ ɲ ʔ ɣ tʃ ɑː ɛ".split(),
            "note":"This is a geographic comparison group. The Aza’raan click cue is synthetic, not a recorded isiXhosa click."},
 "arabic":{"name":"Arabic voices","locales":["ar-SA","ar-EG","ar-AE","ar-MA","ar"],
            "sounds":"ʔ ɣ θ h ɑː uː ɛ ja kw".split(),
            "note":"Compare glottal closure, velar friction and dental articulation. Browser voices vary by dialect."},
}
voice_samples={
 "mi":"Māori","haw":"aloha","sm":"talofa","to":"mālō","fj":"bula",
 "fr":"bonjour","it":"buongiorno","es":"hola","pt":"olá","ro":"bună ziua",
 "xh":"molo","sw":"jambo","zu":"sawubona","af":"hallo","am":"ሰላም",
 "ar":"مَرْحَبًا",
}
tips={
 "ʔ":{"name":"Glottal stop","how":"Briefly close the airflow in your throat, then release it. Listen for the interruption, not a vowel.","contrast":"h"},
 "ǃ":{"name":"Alveolar click","how":"Place the tongue on the roof near the front teeth, make suction and release a sharp high pop with the mouth slightly open.","contrast":"t"},
 "ŋ":{"name":"Velar nasal","how":"Keep the back of your tongue raised as in the end of sing. Let air pass through the nose.","contrast":"n"},
 "ɲ":{"name":"Palatal nasal","how":"Raise the middle of your tongue toward the hard palate while allowing air through the nose.","contrast":"n"},
 "ɣ":{"name":"Voiced velar fricative","how":"Vibrate your voice while narrowing airflow at the back of the tongue, without fully closing it.","contrast":"g"},
 "θ":{"name":"Voiceless dental fricative","how":"Let air pass between tongue and teeth without voicing, as in English thin.","contrast":"t"},
 "ʃ":{"name":"Post-alveolar fricative","how":"Let a steady unvoiced stream pass farther back than /s/, as in English sh.","contrast":"s"},
 "tʃ":{"name":"Voiceless affricate","how":"Close for /t/ and release directly into /ʃ/ as one consonant.","contrast":"t"},
 "dʒ":{"name":"Voiced affricate","how":"Close for /d/ and release into a voiced /ʒ/ as one consonant.","contrast":"d"},
 "kw":{"name":"Labialized K","how":"Begin with a /k/ closure; round the lips into /w/ during release.","contrast":"k"},
 "tæz":{"name":"T + Short A + Z","how":"Start with /t/, open into /æ/, and finish with a voiced /z/ without inserting another vowel.","contrast":"t"},
 "æ":{"name":"Short A","how":"Use the open front vowel in many English pronunciations of cat.","contrast":"ɑː"},
 "ɛ":{"name":"Short E","how":"Use a mid-open front vowel, like the vowel in many English pronunciations of bed.","contrast":"æ"},
 "ɪ":{"name":"Short I","how":"Keep it short and relaxed; contrast it with the tenser, longer /iː/.","contrast":"iː"},
 "ʌ":{"name":"Short U","how":"Use a short, central open-mid vowel; avoid automatically lengthening it.","contrast":"uː"},
 "ɑː":{"name":"Long A","how":"Keep an open back vowel steady over a longer beat.","contrast":"æ"},
 "iː":{"name":"Long E","how":"Keep a high front vowel steady and noticeably longer than /ɪ/.","contrast":"ɪ"},
 "uː":{"name":"Long U","how":"Round the lips for a high back vowel and hold it over a longer beat.","contrast":"ʌ"},
 "eɪ-ɛ":{"name":"AY then EH","how":"Say /eɪ/, pause slightly, then make a separate /ɛ/. The hyphen marks two parts, not one vowel.","contrast":"eɪ"},
 "ow":{"name":"O + W","how":"Move from /o/ into a /w/ glide. Compare the two-symbol sequence to Aza’raan /oʊ/.","contrast":"oʊ"},
}
data={"version":"1.0","profiles":profiles,"voiceSamples":voice_samples,"tips":tips}
source=root/'json/pronunciation-practice.json'
source.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(root/'js/practice-data.js').write_text('/* Offline mirror of json/pronunciation-practice.json. */\nwindow.AZA_PRACTICE_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('Practice groups:',', '.join(profiles))
