import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
entries=[]
def add(letter,slug,label,ipa,base=None,marks=(),ex='',note=''):
 entries.append(dict(id=letter.lower()+'.'+slug,letter=letter,label=label,ipa=ipa,base=base or letter,marks=list(marks),example=ex,note=note))
# Sounds documented in Letter Evolution Table, mapped to the existing immutable Khmer slots.
for slug,label,ipa,marks in [('apple','A (apple)','æ',[]),('father','A (father)','ɑː',['C05']),('awe','A (awe)','aw',['C09']),('ay','A (ay)','eɪ',['C10']),('uh','A (uh)','ʌ',['C04'])]:add('A',slug,label,ipa,marks=marks)
for a in [('b','B (b)','b',[]),('soft','B (soft b)','β',[])]:add('B',a[0],a[1],a[2],marks=a[3],note='Historical alternative; shares a Khmer glyph until individually reassigned.' if a[0]=='soft' else '')
for l,id,ipa,base,marks in [('d','d','d','D',[]),('tap','tapped d','ɾ','D',[])]:add('D',l,'D ('+id+')',ipa,base,marks,note='Shares a historical code slot.' if l=='tap' else '')
add('E','eh','E (eh)','ɛ');add('E','ee','E (ee)','iː',marks=['C06'])
add('F','f','F (f)','f','B',['C11']);add('F','voiced','F (voiced f)','v','B',['C11'],note='Historical alternate of /f/; same encoded slot.')
add('G','g','G (g)','g');add('G','gh','G (soft gh)','ɣ',marks=['K04'])
add('H','h','H (h)','h');add('H','voiced','H (voiced h)','ɦ',note='Shares encoding until a distinct marker is assigned.')
add('I','eye','I (eye)','aɪ',marks=['C10']);add('I','ih','I (ih)','ɪ')
add('J','j','J (j)','dʒ');add('J','zh','J (zh)','ʒ',note='Historical variant; current Khmer encoding is shared.')
for slug,label,ipa,marks in [('k','k','k',[]),('kh','kh / aspirated k','kʰ',['K04']),('kw','kw','kw',['C09']),('ks','ks (X sound)','ks',['K02'])]:add('K',slug,'K ('+label+')',ipa,marks=marks)
add('L','l','L (l)','l');add('L','dark','L (dark l)','ɫ',note='Shared encoding; edit its mapping to distinguish it.')
add('M','m','M (m)','m');add('M','syllabic','M (syllabic m)','m̩',note='Shared encoding; edit mapping to distinguish.')
add('N','n','N (n)','n');add('N','ng','N (ng)','ŋ',marks=['C08']);add('N','ny','N (ny)','ɲ',marks=['C10']);add('N','syllabic','N (syllabic n)','n̩',note='Shared encoding.')
for slug,label,ipa,marks in [('oh','oh','oʊ',['K04']),('ow','ow','ow',['C09']),('oy','oy','ɔɪ',['C10']),('oo','oo','uː',['C07'])]:add('O',slug,'O ('+label+')',ipa,marks=marks)
add('P','p','P (p)','p');add('P','aspirated','P (ph)','pʰ',marks=['K04'])
add('R','rolled','R (rolled r)','r͡r',marks=['K11']);add('R','tap','R (tapped r)','ɾ');add('R','r','R (r)','r')
add('S','s','S (s)','s');add('S','sh','S (sh)','ʃ',marks=['K04']);add('S','softsh','S (soft sh)','ɕ',marks=['K04'],note='Same Khmer marker as sh.')
for slug,label,ipa,marks in [('t','t','t',[]),('th','th','θ',['K04']),('tch','tch','tʃ',['K03']),('taz','tæz','tæz',['C01','K01']),('aspirated','aspirated t','tʰ',['K04'])]:add('T',slug,'T ('+label+')',ipa,marks=marks)
add('U','oo','U (oo)','uː',marks=['C07']);add('U','uh','U (uh)','ʌ',marks=['C04'])
add('V','v','V (v)','v','B',['C09']);add('V','glide','V (soft glide)','ʋ','B',['C09'],note='Same Khmer mapping as V.')
for slug,label,ipa,marks in [('wah','wah','wɑ',['C05']),('weh','weh','wɛ',['C02']),('wih','wih','wɪ',['C03']),('woo','woo','wuː',['C07']),('woe','woe','woʊ',['K04']),('wee','wee','wiː',['C06'])]:add('W',slug,'W ('+label+')',ipa,marks=marks)
for slug,label,ipa,marks in [('yah','yah','ja',['C05']),('yeh','yeh','jɛ',['C02']),('yu','yu','juː',['C07']),('yih','yih','jɪ',['C03']),('yee','yee','jiː',['C06']),('yoh','yoh','joʊ',['K04'])]:add('Y',slug,'Y ('+label+')',ipa,marks=marks)
add('Z','z','Z (z)','z');add('Z','zn','Z (zn)','zn',marks=['K10'])
# Distinct historical pronunciations from the same tables, where old glyph forms merged.
add('T','voiced-th','T (voiced th)','ð',marks=['K04'],note='Shares TH slot until separately assigned.')
add('T','aspirated-tch','T (aspirated tch)','tʃʰ',marks=['K03'],note='Shares TCH slot until separately assigned.')
add('T','taahzi','T (taahzi)','taːhzi',marks=['C01','K01'],note='Historical TAZ alternative; shared marks.')
add('K','aspirated-kw','K (aspirated kw)','kʷʰ',marks=['C09','K04'])
add('K','x-fricative','K (x fricative)','x',marks=['K02'],note='Historical variant of KS; shared marks.')
add('N','ngg','N (ngg)','ŋg',marks=['C08'],note='Historical variant of NG; shared marks.')
add('N','nj','N (n+y cluster)','nj',marks=['C10'],note='Historical variant of NY; shared marks.')
add('S','z','S (z)','z',base='Z',note='S-family voiced counterpart uses existing Z letter slot.')
add('D','j','D (j)','dʒ',marks=['K03'])

json_obj={'source':'Letter Evolution Table.docx, sections A through H and consonant families; ambiguous historical alternatives share their existing code slots unless reassigned','version':'2026-10-28-sound-first','order':'ABDEFGHIJKLMNOPRSTUVWYZ','sounds':entries}
(root/'json/sound-catalog.json').write_text(json.dumps(json_obj,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'js/sound-data.js').write_text('/* Offline sound inventory mirrored from json/sound-catalog.json */\nwindow.AZA_SOUND_DATA='+json.dumps(json_obj,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(len(entries),'sound choices')
