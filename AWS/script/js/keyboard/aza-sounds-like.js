/* Context-aware, read-only pronunciation previews for all four AWS keyboards.
   The exact modern family recipes come from the language reference; historical
   combinations fall back to the inherited 24-mark meanings when not documented.
   No text is inserted and no glyph artwork is modified by this module. */
(() => {
 'use strict';
 const RECIPE = {
  A:{'open':'æ','open,long':'ɑː','open,short':'aw','long,glide':'eɪ','central':'ʌ'},
  B:{'':'b','soft':'v','soft,unvoiced':'f','soft,hard':'β','soft,glide':'ʋ'},
  D:{'':'d','soft':'ɾ','soft,hard':'dʒ'},
  E:{'open':'ɛ','long':'iː'},
  G:{'':'g','soft':'ɣ'},
  H:{'':'h','voiced':'ɦ'},
  I:{'short':'ɪ','open,glide':'aɪ','long':'iː'},
  J:{'':'dʒ','soft':'ʒ'},
  K:{'':'k','hard':'kʰ','glide':'kw','hard,unvoiced':'ks','glide,hard':'kʷʰ','soft,unvoiced':'x'},
  L:{'':'l','hard':'ɫ'},
  M:{'':'m','central':'m̩'},
  N:{'':'n','nasal':'ŋ','soft':'ɲ','central':'n̩','nasal,hard':'ŋg','soft,hard':'nj'},
  O:{'long,glide':'oʊ','short,glide':'ow','open,glide':'ɔɪ','central,long':'uː'},
  P:{'':'p','hard':'pʰ'},
  R:{'':'r','held':'r͡r','soft':'ɾ'},
  S:{'':'s','soft':'ʃ','soft,hard':'ɕ'},
  T:{'':'t','soft,unvoiced':'θ','soft,hard':'tʃ','open,hard':'tæz','hard':'tʰ','soft,voiced':'ð','hard,unvoiced':'tʃʰ','long,hard':'taːhzi'},
  W:{'open':'wɑ','open,short':'wɛ','short':'wɪ','long':'wuː','long,glide':'woʊ','long,central':'wiː'},
  Y:{'open':'ja','open,short':'jɛ','long':'juː','short':'jɪ','long,central':'jiː','long,glide':'joʊ'},
  Z:{'':'z','nasal':'zn'}
 };
 const BASE = {A:'æ',B:'b',D:'d',E:'ɛ',F:'f',G:'g',H:'h',I:'ɪ',J:'dʒ',
  K:'k',L:'l',M:'m',N:'n',O:'oʊ',P:'p',R:'r',S:'s',T:'t',U:'ʌ',V:'v',W:'w',Y:'j',Z:'z'};
 const HIST_VOWELS={C01:'æ',C02:'ɛ',C03:'ɪ',C04:'ʌ',C05:'ɑː',C06:'iː',C07:'uː'};
 const HIST_CODAS={K01:'z',K02:'s',K06:'d',K07:'k',K08:'l',K09:'m',K10:'n',K11:'r',K12:'t'};
 const WORDS = {
  'ʌ':'uh (as in cup)','ʌs':'us','ʌz':'uzz (as in buzz)','ʌm':'um',
  'ʌn':'un (as in undo)','ʌp':'up','ʌt':'ut (as in cut)','ʌd':'ud (as in mud)',
  'ʌk':'uck (as in luck)','ʌg':'ug (as in bug)','ʌf':'uff (as in puff)',
  'ʌb':'ub (as in tub)','ʌl':'ull (as in dull)',
  'æ':'a (as in cat)','æs':'ass','æz':'az (as in jazz)','æn':'an','æm':'am',
  'æd':'ad (as in add)','æp':'ap (as in apple)',
  'ɛ':'eh (as in bed)','ɛs':'ess (as in less)','ɛn':'en (as in hen)',
  'ɛt':'et (as in met)','ɛd':'ed (as in bed)',
  'ɪ':'ih (as in sit)','ɪs':'iss (as in hiss)','ɪn':'in','ɪt':'it','ɪm':'im (as in him)',
  'ɑː':'ah (as in father)','aw':'aw (as in awesome)','aɪ':'eye',
  'eɪ':'ay (as in day)','iː':'ee (as in see)','uː':'oo (as in moon)',
  'oʊ':'oh (as in go)','ow':'ow (archival notation; exact pronunciation unconfirmed)',
  'ɔɪ':'oy (as in boy)','wɑ':'wah','wɛ':'weh','wɪ':'wih',
  'wuː':'woo','woʊ':'woe','wiː':'wee',
  'ja':'yah','jɛ':'yeh','jɪ':'yih','juː':'you','jiː':'yee','joʊ':'yoh',
  'r͡r':'a rolled rr','ɾ':'a quick tapped r','ɫ':'a dark l',
  'θ':'th (as in thin)','ð':'th (as in this)','ŋ':'ng (as in sing)',
  'ɲ':'ny (as in canyon)','ɣ':'a soft gh','ʃ':'sh (as in ship)',
  'ʒ':'zh (as in measure)','dʒ':'j (as in jam)','tʃ':'ch (as in chair)',
  'tʃʰ':'a strongly breathed ch','tʰ':'a breathy t','kʰ':'a breathy k',
  'pʰ':'a breathy p','kʷʰ':'a breathy kw','kw':'kw (as in quick)',
  'ks':'x (as in box)','tæz':'taz (rhymes with jazz)',
  'β':'a soft, two-lipped v','ʋ':'a soft, gliding v','ɕ':'a very soft sh',
  'x':'kh (as in Scottish loch)','m̩':'a syllabic m','n̩':'a syllabic n',
  'ɦ':'a voiced, breathy h','ŋg':'ng-g','nj':'n-y','zn':'z-n',
  's':'s (as in sun)','z':'z (as in zoo)','r':'r (as in red)',
  'l':'l (as in leaf)','n':'n (as in no)','m':'m (as in me)',
  'b':'b (as in boy)','d':'d (as in day)','f':'f (as in fun)',
  'g':'g (as in go)','h':'h (as in hat)','j':'y (as in yes)',
  'k':'k (as in kite)','p':'p (as in pen)','t':'t (as in top)',
  'v':'v (as in van)','w':'w (as in wet)',
  'taːhzi':'taahzi (historical pronunciation)'
 };
 const PARTS = [
  ['tʃʰ','chh'],['kʷʰ','kwh'],['r͡r','rr'],['ŋg','ngg'],['dʒ','j'],['tʃ','ch'],
  ['oʊ','oh'],['ɔɪ','oy'],['aɪ','eye'],['eɪ','ay'],['ɑː','ah'],
  ['iː','ee'],['uː','oo'],['ow','ow'],['aw','aw'],['wuː','woo'],
  ['wiː','wee'],['woʊ','woe'],['wɪ','wih'],['wɛ','weh'],['wɑ','wah'],
  ['juː','you'],['jɛ','yeh'],['jɪ','yih'],['jiː','yee'],['joʊ','yoh'],
  ['ja','yah'],['ɾ','r'],['ɫ','l'],['ɣ','gh'],['ɦ','h'],['ŋ','ng'],
  ['ɲ','ny'],['ʃ','sh'],['ʒ','zh'],['ɕ','sh'],['θ','th'],['ð','th'],
  ['ʌ','uh'],['æ','a'],['ɛ','eh'],['ɪ','ih'],['ʋ','v'],['β','v'],
  ['ʔ',"'"],['ǃ','click-'],['ʰ','h'],['ʷ','w'],['ː',''],['̩','']
 ];
 function clean(ipa) {
  const m=String(ipa||'').match(/\/([^/]+)\//);
  return (m?m[1]:String(ipa||'')).trim().replace(/^\/|\/$/g,'');
 }
 function markLabel(id) {
  const refs=window.AZA_DOC_ERA_REFERENCE?.historicalMarks||[];
  const m=refs.find(x=>x.id===id)||(window.AZ_CANON?.marks||[]).find(x=>x.id===id);
  return m?.name||id;
 }
 function modern(base,marks) {
  const family=RECIPE[base]||{};
  const key=marks.join(',');
  const candidates=window.AZA_DOC_ERA_REFERENCE?.readings||[];
  const doc=candidates.filter(x=>x.era==='Modern').flatMap(x=>x.recipes||[])
   .find(r=>r.base===base&&Array.isArray(r.marks)&&r.marks.join(',')===key&&clean(r.ipa));
  if(doc)return {ipa:clean(doc.ipa),certain:true};
  if(Object.prototype.hasOwnProperty.call(family,key))return {ipa:family[key],certain:true};
  const sorted=marks.slice().sort().join(',');
  const pair=Object.entries(family).find(([ids])=>ids.split(',').filter(Boolean).sort().join(',')===sorted);
  if(pair)return {ipa:pair[1],certain:true};
  return {ipa:BASE[base]||'',certain:false,unknown:marks.map(markLabel)};
 }
 function historical(base,marks,origin,era) {
  const reading=(window.AZA_DOC_ERA_REFERENCE?.readings||[])
   .find(r=>r.era===era&&r.origin===origin&&r.independent&&r.family!=='extra');
  let ipa=reading?clean(reading.ipa):(BASE[base]||'');
  let certain=!marks.length;
  const unknown=[];
  for(const id of marks) {
   if(HIST_VOWELS[id]){
    if(id==='C01'&&ipa==='æ')continue;
    if(id==='C02'&&ipa==='ɛ')continue;
    if(id==='C03'&&ipa==='ɪ')continue;
    if(id==='C04'&&ipa==='ʌ')continue;
    if(id==='C05'&&ipa==='ɑː')continue;
    if(id==='C06'&&ipa==='iː')continue;
    if(id==='C07'&&ipa==='uː')continue;
    if(/^[bcdfghjklmnpqrstvwxyzɣɦʃʒŋɲθðɾɫ]+$/u.test(ipa))ipa+=HIST_VOWELS[id];
    else {ipa+=HIST_VOWELS[id];unknown.push(markLabel(id));}
    continue;
   }
   if(id==='K05')continue;
   if(id==='C08'){ipa=ipa==='n'?'ŋ':ipa+'g';continue;}
   if(id==='C09'){ipa=ipa==='b'?'v':ipa+'w';continue;}
   if(id==='C10'){ipa=ipa==='n'?'ɲ':ipa==='o'?'ɔɪ':ipa+'j';continue;}
   if(id==='C11'){ipa=ipa==='b'?'f':ipa+'f';continue;}
   if(id==='C12'){ipa=ipa==='w'?'b':ipa+'b';continue;}
   if(id==='K03'){ipa=ipa==='t'?'tʃ':ipa==='d'?'dʒ':ipa+'tʃ';continue;}
   if(id==='K04'){
    ipa=({t:'θ',s:'ʃ',o:'oʊ',g:'ɣ'})[ipa]||ipa+'h';continue;
   }
   if(id==='K11'&&ipa==='r'){ipa='r͡r';continue;}
   if(HIST_CODAS[id]){ipa+=HIST_CODAS[id];continue;}
   unknown.push(markLabel(id));
  }
  return {ipa,certain,unknown};
 }
 function atom(era,base,marks,origin) {
  return era==='Modern'?modern(base,marks):historical(base,marks,origin,era);
 }
 function say(ipa) {
  if(WORDS[ipa])return WORDS[ipa];
  // Concatenate familiar phonetic fragments, without treating letter names as sounds.
  let remaining=ipa,output='';
  while(remaining){
   const found=PARTS.find(([part])=>remaining.startsWith(part));
   if(found){output+=found[1];remaining=remaining.slice(found[0].length)}
   else {output+=remaining[0];remaining=remaining.slice(1)}
  }
  return output||'an undefined sound';
 }
 function describe({era='Modern',base,marks=[],subs=[],specials=[],origin=null}) {
  const first=atom(era,String(base||'').toUpperCase(),marks,origin);
  const units=[first,...subs.map(s=>atom(era,String(s.key||'').toUpperCase(),s.marks||[],s.origin||null))];
  let ipa=units.map(u=>u.ipa).join('');
  const uncertain=units.some(u=>!u.certain);
  const missing=units.flatMap(u=>u.unknown||[]).filter(Boolean);
  if(specials.includes('sOver'))ipa='ʔ'+ipa;
  if(specials.includes('sUnder'))ipa='ǃ'+ipa;
  const emphasis=specials.includes('sLeft')||specials.includes('sRight');
  const word=WORDS[ipa]||say(ipa);
  const approximate=uncertain||!!missing.length;
  const qualification=missing.length?' (exact combination not defined; includes '+[...new Set(missing)].join(', ')+')':
   approximate?(era==='Modern'?' (approximate; no exact modern reading documented)':' (approximate historical composition)'):'';
  const suffix=emphasis?' · syllable emphasis changes stress, not the letters’ sounds':'';
  return {text:'Sounds like '+word+qualification+suffix,ipa:ipa?'/'+ipa+'/':null,approximate};
 }
 window.AZA_SOUNDS_LIKE={describe};
})();
