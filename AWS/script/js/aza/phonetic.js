/* Aza'raan canonical 24-accent sound-to-Khmer engine; works without a server. */
(function(root){
'use strict';
const D=root.AZA_DATA, P=root.AZA_PHONETIC_DATA;
if(!D||!P)return;
const markById=Object.fromEntries(D.marks.map(m=>[m.id,m]));
const dictionary=Object.fromEntries(P.examples.map(e=>[normalize(e.spelling),e]));
const vowels=P.vowelSpellings.slice().sort((a,b)=>b[0].length-a[0].length);
const vowelIDs=new Set(D.accentPolicy.vowelMarkIDs);
const specials=new Set(D.accentPolicy.specialMarkIDs);
const BASE_IPA={A:'æ',B:'b',D:'d',E:'ɛ',G:'g',H:'h',I:'ɪ',J:'dʒ',K:'k',L:'l',M:'m',N:'n',O:'o',P:'p',R:'r',S:'s',T:'t',U:'ʌ',W:'w',Y:'j',Z:'z'};
const VOWEL_IPA={C01:'æ',C02:'ɛ',C03:'ɪ',C04:'ʌ',C05:'ɑː',C06:'iː',C07:'uː'};
const CODA_IPA={C08:'g',C09:'w',C10:'j',C11:'f',C12:'b',K01:'z',K02:'s',K03:'tʃ',K04:'h',K06:'d',K07:'k',K08:'l',K09:'m',K10:'n',K11:'r',K12:'t'};
const codaMap={d:'D',k:'K',l:'L',m:'M',n:'N',r:'R',t:'T',z:'Z',s:'S',g:'G',f:'F',b:'B'};
const consonants={sh:['S','HARD_H'],ch:['T','CH'],th:['T','HARD_H'],ng:['N','G'],rr:['R','R'],ph:['B','F'],qu:['K','W'],ks:['K','S']};
function normalize(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’ʻʽ`]/g,"'").trim();}
function rank(id){return id==='S01'?0:id==='S02'?1:id.startsWith('C')?10+Number(id.slice(1)):id.startsWith('K')?40+Number(id.slice(1)):60+Number(id.slice(1));}
function ipa(base,ids){
 const normal=ids.filter(id=>!specials.has(id));
 const vowel=normal.find(id=>vowelIDs.has(id));
 const mods=normal.filter(id=>!vowelIDs.has(id)&&id!=='K05');
 const only=mods.length===1?mods[0]:null;
 const contextual={
  'B+C09':'v','B+C11':'f','W+C12':'b','N+C08':'ŋ','N+C10':'ɲ',
  'T+K03':'tʃ','D+K03':'dʒ','K+K02':'ks','S+K04':'ʃ',
  'T+K04':'θ','G+K04':'ɣ','R+K11':'r͡r','O+K04':'oʊ',
  'O+C10':'ɔɪ','O+C09':'ow','A+C10':'eɪ','I+C10':'aɪ','A+C09':'au'
 };
 const special=only&&contextual[base+'+'+only];
 if(special){
  const prefix=ids.includes('S01')&&!(base==='N'&&normal.includes('C03')&&normal.includes('K01'))?'ʔ':'';
  return '/'+prefix+special+(vowel?VOWEL_IPA[vowel]:'')+'/';
 }
 const isVowel=['A','E','I','O','U'].includes(base);
 let sound=(isVowel&&vowel)?VOWEL_IPA[vowel]:(BASE_IPA[base]||base.toLowerCase())+(vowel?VOWEL_IPA[vowel]:'');
 for(const id of mods)sound+=(CODA_IPA[id]||'');
 if(ids.includes('S01')&&!(base==='N'&&normal.includes('C03')&&normal.includes('K01')))sound='ʔ'+sound;
 if(ids.includes('S02'))sound='ǃ'+sound;
 return '/'+sound+'/';
}
function compile(tokens,era='modern'){
 const names=tokens.map(x=>String(x).trim().toUpperCase().replace(/[\s-]+/g,'_')).filter(Boolean);
 if(!names.length)throw Error('A sound unit cannot be empty.');
 let base=names.shift();let extra=[];
 if(base==='V'){base='B';extra=['W'];}
 else if(base==='F'){base='B';extra=['F'];}
 else if(base==='X'){base='K';extra=['S'];}
 if(!D.keys[base])throw Error('Unknown Aza’raan base: '+base+'. Use the 21 letter families; F/V/X are aliases.');
 const labels=[...extra,...names];
 const ids=[];
 for(const label of labels){
  const values=P.markAliases[label]||(markById[label]?[label]:null);
  if(!values){
   if(label==='OH'||label==='OW')throw Error('OH is now O+HARD_H; write it as a separate sound unit (example: L O+HARD_H).');
   throw Error('Unknown accent '+label+'. Use SHORT_A, LONG_A, W, S, HARD_H, and the other canonical names.');
  }
  for(const id of values){if(!markById[id])throw Error('Unmapped accent '+id);if(!ids.includes(id))ids.push(id);}
 }
 const normal=ids.filter(id=>!specials.has(id));
 if(ids.length>3 && era!=='archaic')throw Error('Maximum three stacked marks per letter (including attached structural signs).');
 if(normal.length>3)throw Error('Maximum three ordinary accents per letter.');
 if(normal.filter(id=>vowelIDs.has(id)).length>1)throw Error('Only one Short/Long vowel accent may appear on a letter.');
 if(normal.includes('K05')&&normal.length>1)throw Error('Base must be the only ordinary accent on its letter.');
 if(ids.some(id=>(id==='S03'||id==='S04')&&!['classical','traditional','modern'].includes(era)))throw Error('Previous/next syllable emphasis is only available in Traditional and Modern.');
 const archaicStructure=era==='archaic'?ids.filter(id=>id==='S01'||id==='S02'):[];
 const otherIds=ids.filter(id=>!archaicStructure.includes(id)).sort((a,b)=>rank(a)-rank(b));
 let glyph=Object.hasOwn(D.vowelCarriers,base)&&otherIds.length?D.vowelCarriers[base]:D.keys[base];
 glyph+=otherIds.map(id=>markById[id].output).join('');
 const signs=archaicStructure.map(id=>'អ'+markById[id].output).join('');
 return {glyph:signs+glyph,mainGlyph:glyph,signs,labels:[base,...ids.map(id=>markById[id].name.toUpperCase().replace(/[\s-]+/g,'_'))].join('+'),base,
  modifiers:ids.slice(),ipa:ipa(base,ids),codepoints:Array.from(signs+glyph).length,count:1+archaicStructure.length};
}
function fromRecipe(recipe,era='modern'){
 const words=String(recipe||'').trim().split(/\s*\/\s*|\s*\|\|\s*/).filter(Boolean);
 const units=[],out=[];
 for(let wi=0;wi<words.length;wi++){
  if(wi)out.push(' ');
  for(const token of words[wi].split(/\s+/).filter(Boolean)){
   const item=compile(token.replace(/^\[|\]$/g,'').split('+'),era);
   units.push(item);out.push(item.glyph);
  }
 }
 return {script:out.join(''),units,warnings:[],source:'manual recipe'};
}
function autoWord(word,era){
 const lower=normalize(word);let i=0;const units=[];
 const add=arr=>units.push(compile(arr,era));
 const isVowel=ch=>/[aeiou]/.test(ch||'');
 while(i<lower.length){
  if(lower.startsWith("n'z",i)){add(['N','GLOTTAL','SHORT_I','Z']);i+=3;continue;}
  let glottal=false;
  if(lower[i]==="'"){
   glottal=true;i++;
   if(i>=lower.length){
    const last=units.pop();if(last)add([last.base,...last.labels.split('+').slice(1),'GLOTTAL']);
    break;
   }
  }
  const pair=lower.slice(i,i+2);
  if(consonants[pair]){
   const [base,...mods]=consonants[pair];add([base,...(glottal?['GLOTTAL']:[]),...mods]);i+=2;continue;
  }
  const ch=lower[i];
  if(!ch)break;
  let base,mods=[];
  if(ch==='v'){base='B';mods=['W'];}
  else if(ch==='f'){base='B';mods=['F'];}
  else if(ch==='x'){base='K';mods=['S'];}
  else if(ch==='c'||ch==='q'){base='K';}
  else if(D.keys[ch.toUpperCase()])base=ch.toUpperCase();
  else throw Error('Unsupported sound spelling '+ch);
  let found=null,consumed=0;
  for(const [spelling,alias] of vowels){
   const start=isVowel(ch)?i:i+1;
   if(lower.startsWith(spelling,start)){
    found=alias;consumed=spelling.length;break;
   }
  }
  if(isVowel(ch)){
   // A leading vowel (e.g. "oh") maps to its actual vowel base; OH is O+Hard H.
   if(found){
    const soundBase=found==='OH'?'O':found==='OO'?'U':found==='WAH'?'W':base;
    const sndMark=found==='OH'?'HARD_H':found==='OO'?'LONG_U':found==='WAH'?'LONG_A':found;
    const newBase=(found==='AY'?'A':found==='AW'?'A':soundBase);
    const marks=found==='AY'?['Y']:found==='AW'?['W']:[sndMark];
    add([newBase,...(glottal?['GLOTTAL']:[]),...marks]);i+=consumed;continue;
   }
   add([base,...(glottal?['GLOTTAL']:[])]);i++;continue;
  }
  if(found){
   if(found==='OH'){
    // OH cannot be an accent on L/K/etc in the new canon: preserve the O+H logical unit.
    add([base,...(glottal?['GLOTTAL']:[]),...mods]);add(['O','HARD_H']);
   }else if(found==='AY'||found==='AW'){
    add([base,...(glottal?['GLOTTAL']:[]),...mods]);add(['A',found==='AY'?'Y':'W']);
   }else{
    const value=found==='WAH'?'LONG_A':found;
    const next=i+1+consumed;
    let coda=null,advance=0;
    // Simple consonant-vowel-coda syllables become one logical letter (cat, bed, pin).
    // Never force a third ordinary accent or swallow a consonant beginning the next syllable.
    if(!mods.length&&P.markAliases[value]?.length===1&&D.accentPolicy.vowelMarkIDs.includes(P.markAliases[value][0])){
     let end=next+1;
     const letter=lower[next];
     if(letter==='c'&&lower[next+1]==='k')end=next+2;
     else if(letter==='l'&&lower[next+1]==='l')end=next+2;
     if(letter==='c'&&lower[next+1]==='k')coda='K';
     else if(letter==='c'&&end===lower.length)coda='K';
     else if(codaMap[letter])coda=codaMap[letter];
     if(coda&&(end===lower.length || (end<lower.length&&!isVowel(lower[end])&&lower[end]!=="'"))){
      advance=end-next;
     }else coda=null;
    }
    add([base,...(glottal?['GLOTTAL']:[]),...mods,value,...(coda?[coda]:[])]);
    i+=advance;
   }
   i+=1+consumed;
  }else{add([base,...(glottal?['GLOTTAL']:[]),...mods]);i++;}
 }
 return units;
}
function convert(input,opts={}){
 const era=opts.era||'modern',overrides=opts.overrides||{},text=String(input||'');
 const result={script:'',units:[],warnings:[],origin:[],pronunciation:''};
 const chunks=text.match(/[A-Za-z\u00C0-\u024F]+(?:['’ʻʽ][A-Za-z\u00C0-\u024F]+)*|\s+|[^A-Za-z\u00C0-\u024F\s]+/g)||[];
 for(const chunk of chunks){
  if(/^\s+$/.test(chunk)){result.script+=chunk;continue;}
  if(!/^[A-Za-z\u00C0-\u024F]/.test(chunk)){
   result.warnings.push('Omitted punctuation '+JSON.stringify(chunk)+' from Khmer manuscript.');continue;
  }
  const key=normalize(chunk),def=dictionary[key],custom=overrides[key];let units,origin;
  if(custom){units=fromRecipe(custom,era).units;origin='saved pronunciation';}
  else if(def){units=fromRecipe(def.recipe,era).units;origin='character pronunciation: '+def.pronunciation;}
  else{units=autoWord(chunk,era);origin='automatic accent rules';}
  result.script+=units.map(u=>u.glyph).join('');result.units.push(...units);result.origin.push(origin);
  if(def&&!result.pronunciation)result.pronunciation=def.pronunciation;
 }
 return result;
}
function known(spelling){return dictionary[normalize(spelling)]||null;}
root.AzaaraanPhonetics={convert,fromRecipe,compile,known,normalize,examples:P.examples,aliases:P.markAliases};
})(typeof window!=='undefined'?window:globalThis);
