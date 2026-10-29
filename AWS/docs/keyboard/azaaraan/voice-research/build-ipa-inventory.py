#!/usr/bin/env python3
"""Build the offline IPA catalogue and its file:// JavaScript mirror.

This catalogue is internal to the voice engine. The reference groups record
the phonetic symbols useful in the supplied language/script PDFs. The base
inventory covers the IPA chart's vowel and consonant symbols, so additional
combinations can be parsed without adding buttons to the studio.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

# Explicit creator list: /juː/ appeared twice in the supplied table.
requested = """ʔ tæz tʃ ŋ b d f g dʒ k m p n r s θ t v z ɲ ʃ h l kw ɣ
ɑː eɪ au uː ɛ eɪ-ɛ juː ɔɪ æ aɪ iː ʌ ɪ oʊ ow wɑ wɛ wɪ wuː woʊ
ja jɛ jɪ jiː joʊ ǃ""".split()

# The spoken text is an approximation for the fixed browser voice, never a
# redefinition of the IPA. Non-English sounds remain explicitly represented.
consonants = {
    "p":"p", "b":"b", "t":"t", "d":"d", "ʈ":"t", "ɖ":"d", "c":"ky", "ɟ":"gy",
    "k":"k", "g":"g", "ɡ":"g", "q":"k", "ɢ":"g", "ʔ":"",
    "m":"m", "ɱ":"m", "n":"n", "ɳ":"n", "ɲ":"ny", "ŋ":"ng", "ɴ":"ng",
    "ʙ":"brr", "r":"r", "ʀ":"rr", "ɾ":"r", "ɽ":"r", "ɹ":"r", "ɻ":"r",
    "ɺ":"l", "ɭ":"l", "ʎ":"ly", "ʟ":"l", "l":"l", "ɫ":"l",
    "ɸ":"f", "β":"v", "f":"f", "v":"v", "θ":"th", "ð":"th",
    "s":"s", "z":"z", "ʃ":"sh", "ʒ":"zh", "ʂ":"sh", "ʐ":"zh",
    "ɕ":"sh", "ʑ":"zh", "ç":"hy", "ʝ":"y", "x":"kh", "ɣ":"gh",
    "χ":"kh", "ʁ":"rh", "ħ":"h", "ʕ":"ah", "h":"h", "ɦ":"h",
    "ʜ":"h", "ʢ":"ah", "ʡ":"", "ɧ":"sh", "ɬ":"hl", "ɮ":"zl",
    "ʋ":"v", "ɥ":"w", "w":"w", "ʍ":"wh", "j":"y", "ɰ":"w",
    "ɓ":"b", "ɗ":"d", "ʄ":"j", "ɠ":"g", "ʛ":"g",
    "ʘ":"", "ǀ":"", "ǃ":"", "ǂ":"", "ǁ":"",
    "ɿ":"ih", "ʅ":"ih", "ȵ":"ny", "ȶ":"t", "ȡ":"d",
}
vowels = {
    "i":"ee", "y":"ew", "ɨ":"ih", "ʉ":"oo", "ɯ":"oo", "u":"oo",
    "ɪ":"ih", "ʏ":"uh", "ʊ":"oo", "e":"ay", "ø":"er", "ɘ":"uh",
    "ɵ":"uh", "ɤ":"uh", "o":"oh", "ə":"uh", "ɛ":"eh", "œ":"er",
    "ɜ":"er", "ɞ":"er", "ʌ":"uh", "ɔ":"aw", "æ":"a", "ɐ":"uh",
    "a":"ah", "ɶ":"a", "ɑ":"ah", "ɒ":"ah", "ɚ":"er", "ɝ":"er",
    "ä":"ah", "ɷ":"oo",
}
sequences = {
    "tæz":"tazz", "tʃ":"ch", "dʒ":"j", "kw":"qu", "r͡r":"rr",
    "ɑː":"ah", "eɪ":"ay", "au":"ow", "uː":"oo", "eɪ-ɛ":"ay, eh",
    "juː":"yoo", "ɔɪ":"oy", "aɪ":"eye", "iː":"ee", "oʊ":"oh",
    "ow":"ow", "wɑ":"wah", "wɛ":"weh", "wɪ":"wih", "wuː":"woo",
    "woʊ":"woh", "ja":"yah", "jɛ":"yeh", "jɪ":"yih", "jiː":"yee",
    "joʊ":"yoh", "ŋɡ":"ngg", "ɲɟ":"nyg", "kʷ":"qu",
    "t͡s":"ts", "d͡z":"dz", "t͡ʃ":"ch", "d͡ʒ":"j",
    "ts":"ts", "dz":"dz", "pf":"pf", "ɑ̃":"ahn", "ɛ̃":"ehn",
    "ɔ̃":"awn", "œ̃":"ern", "ɐ̃":"uhn", "ŋg":"ngg",
}
clicks = ["ʘ", "ǀ", "ǃ", "ǂ", "ǁ"]
# Modifier tokens may attach to any base; they are parsed and kept in the IPA.
modifiers = {
    "ː":"", "ˑ":"", "̆":"", "ˈ":"", "ˌ":"", "͡":"", "͜":"",
    "ʰ":"h", "ʱ":"h", "ʷ":"w", "ʲ":"y", "ˠ":"", "ˤ":"",
    "˞":"r", "ⁿ":"n", "ᵐ":"m", "ˀ":"", "ʼ":"", "’":"",
    "̥":"", "̊":"", "̬":"", "̹":"", "̜":"", "̟":"", "̠":"",
    "̈":"", "̽":"", "̩":"", "̯":"", "̤":"h", "̰":"",
    "̼":"", "̪":"", "̺":"", "̻":"", "̃":"n", "̝":"", "̞":"",
    "̘":"", "̙":"", "̚":"", "̴":"", "̢":"", "˥":"", "˦":"",
    "˧":"", "˨":"", "˩":"", "˩˥":"", "˥˩":"", "↗":"", "↘":"",
    "ꜛ":"", "ꜜ":"", "‿":"", "ǂ":"", "‖":"", "|":"",
}
references = {
    "French language": "a ɑ e ɛ ə i o ɔ y u œ ø ɑ̃ ɛ̃ ɔ̃ œ̃ b d ɡ p t k ŋ ɲ f v s z ʃ ʒ ʁ l w ɥ j",
    "Italian language": "a e ɛ i o ɔ u p b t d k ɡ t͡s d͡z t͡ʃ d͡ʒ f v s z ʃ ɲ ʎ m n ŋ l r ɾ j w",
    "German language": "a aː ə e ɛ ɛː i ɪ o ɔ u ʊ y ʏ ø œ ɐ ʁ x ç ʃ ʒ pf ts tʃ ʔ p b t d k ɡ f v s z h j l m n ŋ r",
    "Māori language": "a aː e eː i iː o oː u uː ɐ ɛ ɔ ʉ p t k m n ŋ f ɸ ɾ r h w ʔ",
    "Khoisan languages / click chart": "ʘ ǀ ǃ ǂ ǁ ʔ",
    "Malayalam script": "ɐ ə a aː i iː u uː e eː o oː ɨ ai au k kʰ ɡ ɡʱ ŋ c cʰ ɲ t̪ d̪ ʈ ɖ ɳ p pʰ b bʱ m ʋ ɾ r l ɭ ɻ ʂ ʃ s h",
    "Georgian scripts": "a æ ə ɛ e eɪ i o ɔ u ɣ χ ʁ ʕ ɦ ʔ ʒ ʃ ts tʃ dz dʒ pʼ tʼ kʼ qʼ tsʼ tʃʼ q ɢ",
    "Aramaic alphabet": "ʔ aː eː b β v ɡ ɣ d ð h w oː uː z tˤ j iː k x l m n s ʕ p ɸ f sˤ q r ʃ t θ",
    "Romanization of Greek": "a e̞ o̞ i u b v ɣ ʝ ŋɡ ɲɟ ɡ ɟ ð d z θ k c l m n p r s t f x ç",
    "Khmer script": "ɑː ɔː ʔ ŋ ɲ ɗ ɓ ʋ ɕ ʂ c cʰ k kʰ tʰ pʰ a iə ɨə uə",
    "Tengwar": "a e i o u w j t p k kʷ b f v m r l s h tʃ",
    "History of English": "θ ð r ʃ ʒ tʃ dʒ æ ɛ ɪ ʌ ə ɔ ɑ i u",
}

catalogue = {
    "version": "3.0-ipa-catalogue",
    "description": "Internal phoneme inventory; Aza’raan keyboard and accent rules are separate.",
    "requested": requested,
    "units": {**{k: {"kind": "consonant", "speech": v} for k,v in consonants.items()},
              **{k: {"kind": "vowel", "speech": v} for k,v in vowels.items()}},
    "sequences": sequences,
    "clicks": clicks,
    "modifiers": modifiers,
    "references": {k: v.split() for k,v in references.items()},
}
dest = ROOT / 'json' / 'ipa-inventory.json'
dest.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
(ROOT / 'js' / 'ipa-data.js').write_text(
    '/* Offline mirror of json/ipa-inventory.json. */\nwindow.AZA_IPA_DATA=' +
    json.dumps(catalogue, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8')
print(f"{len(requested)} creator entries, {len(catalogue['units'])} base symbols, "
      f"{len(sequences)} sequences, {len(modifiers)} modifiers, "
      f"{len(references)} reference groups")
