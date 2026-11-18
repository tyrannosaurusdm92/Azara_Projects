/* One AWS bubble for all four eras. Modern art comes from the supplied package. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const canon = window.AZ_CANON, modern = window.AZ_MK;
 const alphabet = Object.keys(canon.ind), independent = new Set(alphabet);
 const historical = new Set([...alphabet, 'F', 'U', 'V']);
 const rows = [['A','B','D','E','F','G','H','I'],['J','K','L','M','N','O','P','R'],['S','T','U','V','W','Y','Z'],['SYMBOLS','AZA_GLOTTAL','AZA_CLICK','AZA_PREV','AZA_NEXT','SPACE','BACK','ENTER']];
 const marks = canon.marks.map(mark => ({...mark, display:mark.latin, khmer:mark.unicode, meaning:mark.name}));
 const historicMarks=(window.AZA_DOC_ERA_REFERENCE?.historicalMarks||[]).map(mark=>({...mark,unicode:mark.khmer,codepoint:(mark.codepoints||[]).join(' + '),special:false}));
 const byId = new Map([...marks,...historicMarks].map(mark => [mark.id, mark]));
 const specials = {AZA_GLOTTAL:'sOver',AZA_CLICK:'sUnder',AZA_PREV:'sLeft',AZA_NEXT:'sRight'};
 const preferenceKey = 'steampunk-azaaraan-keyboard-preferences-v1';
 function isLetter(key){return historical.has(key)}
 const independentIPAOrder=['A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','U','V','W','Y','Z'];
 const azaAVowels=['ɑː','æ','ʌ','eɪ','aw'];
 function historicalKeys(era){
  if(era==='Modern')return [];
  return (window.AZA_DOC_ERA_REFERENCE?.readings||[]).filter(r=>
   r.era===era&&r.independent&&r.family!=='extra'&&r.slot
  ).map(r=>{
   const base=r.slot===7?'F':r.slot===18?'V':r.family;
   const family=r.family==='U'?'A':r.slot===7?'F':r.slot===18?'V':r.family;
   const ipaMatch=String(r.ipa||'').match(/\/([^/]+)\//);
   const ipa=ipaMatch?ipaMatch[1]:r.ipa||r.sound||'';
   return {key:'AZA_IPA_'+r.slot,slot:r.slot,era,origin:r.origin,
     base,family,ipa,sound:r.sound,notes:r.notes};
  });
 }
 function historicalKey(key,era){
  if(!/^AZA_IPA_\d+$/.test(String(key)))return null;
  return historicalKeys(era).find(k=>k.key===key)||null;
 }
 function historicalGroups(era){
  const grouped=new Map();
  for(const key of historicalKeys(era)){
   if(!grouped.has(key.family))grouped.set(key.family,[]);
   grouped.get(key.family).push(key);
  }
  return [...grouped].sort(([a],[b])=>independentIPAOrder.indexOf(a)-independentIPAOrder.indexOf(b))
   .map(([family,keys])=>({family,keys:family==='A'?keys.sort((a,b)=>
     (azaAVowels.indexOf(a.ipa)<0?99:azaAVowels.indexOf(a.ipa))-
     (azaAVowels.indexOf(b.ipa)<0?99:azaAVowels.indexOf(b.ipa))):keys}));
 }

 function rowsForEra(era){return rows.map(row => row.filter(key => (era!=='Modern'||!['F','U','V'].includes(key)) && (era!=='Traditional'||key!=='F') && (era!=='Archaic'||!['AZA_PREV','AZA_NEXT'].includes(key))));}
 function loadChoice(){try{const saved=JSON.parse(localStorage.getItem(preferenceKey)||'{}');return {language:saved.language==='azaaraan'?'azaaraan':'qwerty',era:['Archaic','Classical','Traditional','Modern'].includes(saved.era)?saved.era:'Modern'}}catch{return {language:'qwerty',era:'Modern'}}}
 function saveChoice(language,era){try{localStorage.setItem(preferenceKey,JSON.stringify({language,era}))}catch{}}
 function draft(base,options={}){return {type:'letter',base,marks:options.marks||[],markOrder:options.marks||[],subs:options.subs||[],specials:options.specials||[]}}
 function hasVowelNucleus(host,ids){
  if(host==='U')return true; // Pre-merger independent U has its own vowel.
  return (window.AZ_MODERN_SOUNDS?.entries||[]).some(r=>
   r.host===host&&Array.isArray(r.marks)&&r.marks.length===ids.length&&
   r.marks.every((m,i)=>m===ids[i])&&/[aæɑɐɒɔɛɪiouʌəe]/u.test(r.ipa||''));
 }
 function historicalArtwork(base,era){
  if(base==='F'&&['Archaic','Classical'].includes(era))return 'assets/keyboard/svg/evolution/'+era.toLowerCase()+'/'+era.toLowerCase()+'_7.svg';
  if(base==='V'&&['Archaic','Classical','Traditional'].includes(era))return 'assets/keyboard/svg/evolution/'+era.toLowerCase()+'/'+era.toLowerCase()+'_18.svg';
  return null;
 }
 function tryEncode(base,markIds=[],era='Modern',subs=[],specialIds=[],origin=null){
  if(!isLetter(base)||(era==='Modern'&&!independent.has(base))||(era==='Traditional'&&base==='F'))return {value:null,error:'This is not an independent letter in '+era+'.'};
  const allowed=new Set(availableMarks(era).map(x=>x.id));
  // F and V were shortcut keys in the older keyboards. They still spell the
  // B family, while Modern exposes that family only through B's hold menu.
  const historicReading=origin&&era!=='Modern'?(window.AZA_DOC_ERA_REFERENCE?.readings||[]).find(x=>x.origin===origin&&x.era===era&&x.independent):null;
  if(origin&&era!=='Modern'&&!historicReading)return {value:null,error:'This ancestor is not an independent glyph in '+era+'.'};
  const historicArt=historicReading?'assets/keyboard/svg/evolution/'+era.toLowerCase()+'/'+era.toLowerCase()+'_'+historicReading.slot+'.svg':historicalArtwork(base,era);
  const aliasMarks=(era==='Modern'||historicArt)?[]:base==='F'?['soft','unvoiced']:base==='V'?['soft']:[];
  const mainMarks=[...aliasMarks,...markIds];
  const used=[...mainMarks,...specialIds,...subs.flatMap(s=>s.marks||[])];
  if(used.some(id=>!allowed.has(id)))return {value:null,error:'This mark is unavailable in '+era+'.'};
  if(mainMarks.length>2||subs.length>2||specialIds.length>4||subs.some(s=>(s.marks||[]).length>2))return {value:null,error:'Two phonetic marks per letter or subscript; two subscripts per host; four special controls.'};
  if(subs.some(s=>!availableSubscripts(era).includes(String(s.key).toLowerCase())))return {value:null,error:'This dependent letter is unavailable in '+era+'.'};
  if(specialIds.some(id=>!byId.get(id)?.special))return {value:null,error:'Special controls attach to the main letter only.'};
  const token=draft(aliasMarks.length?'B':base,{marks:mainMarks,subs,specials:specialIds});
  if(era!=='Modern')token.historicalEra=era;
  if(era==='Modern'){
   const normalized=modern.normalizeLetter(token),error=modern.validateLetterRules(normalized);
   if(error)return {value:null,error};
   return {value:modern.encode(normalized),token:normalized};
  }
  // Pre-Modern letter drawings stay in their original era fonts. Historical U
  // is independently writable and can also be written as a dependent letter.
  // Historical 24-accent rules: Base (K05) is exclusive and only one
  // short/long vowel selector C01–C07 is permitted on each atomic letter.
  function historicalMarkError(ids){
   if(ids.includes('K05')&&ids.length>1)return 'Historical Base accent K05 must remain uncombined.';
   if(ids.filter(id=>/^C0[1-7]$/.test(id)).length>1)return 'Choose only one historical vowel-length/quality accent per target.';
   return null;
  }
  const oldError=historicalMarkError(mainMarks)||subs.map(s=>historicalMarkError(s.marks||[])).find(Boolean);
  if(oldError)return {value:null,error:oldError};
  if(mainMarks.includes('voiced')&&mainMarks.includes('unvoiced'))return {value:null,error:'Voiced and Unvoiced cannot modify the same letter.'};
  if(subs.some(s=>(s.marks||[]).includes('voiced')&&(s.marks||[]).includes('unvoiced')))return {value:null,error:'Voiced and Unvoiced cannot modify the same subscript.'};
  if(subs.some(s=>(s.marks||[]).includes('separate')))return {value:null,error:'Separated Vowel attaches only to the independent letter.'};
  if(mainMarks.includes('separate')){
   const hostMarks=mainMarks.filter(id=>id!=='separate');
   if(!hasVowelNucleus(token.base,hostMarks))return {value:null,error:'Separated Vowel requires a vowel-bearing independent host.'};
   if(!subs.some(sub=>hasVowelNucleus(sub.key.toUpperCase(),sub.marks||[])))
     return {value:null,error:'Separated Vowel requires a true vowel-bearing subscript, not an invented subscript.'};
  }
  const ch=(base==='F'||base==='V')?canon.ind.B:(canon.ind[token.base]||window.AZA_HISTORICAL_U||'ឩ'),early=new Set(['soft','hard','held']);
  // F/V are independent historical glyph IDs; do not mistake their dependent
  // forms for historical U merely because Modern no longer encodes F or V.
  const historicalSub=key=>(key==='f'||key==='v')?canon.ind.B:(canon.ind[key.toUpperCase()]||window.AZA_HISTORICAL_U);
  const enc=ids=>ids.map(id=>byId.get(id).unicode).join('');
  if(historicArt)token.historicalArt=historicArt;
  if(historicReading){token.historicalOrigin=historicReading.origin;token.historicalIpa=historicReading.ipa;}
  return {value:ch+enc(mainMarks.filter(id=>early.has(id)))+subs.map(s=>canon.coeng+historicalSub(s.key)+enc(s.marks||[])).join('')+enc(mainMarks.filter(id=>!early.has(id)))+enc(specialIds),token};
 }
 function encode(base,marks=[],era='Modern',subs=[],specials=[]){return tryEncode(base,marks,era,subs,specials).value||''}
 function glyph(base,era){return encode(base,[],era)}
 function preview(base,markIds,era,subs=[],specialIds=[],origin=null){const result=tryEncode(base,markIds,era,subs,specialIds,origin);return result.value?(era==='Modern'?modern.createCluster(result.token):window.AZ_HISTORICAL_COMPOSER?.createCluster(result.token,era)||null):null}
 function soundOptions(base,era){
  const ref=window.AZA_DOC_ERA_REFERENCE?.readings||[];
  if(era!=='Modern'){
   const specific=base==='F'?7:base==='V'?18:null;
   return ref.filter(x=>x.era===era&&x.independent&&(specific?x.slot===specific:x.family===base))
     .map(x=>({base,marks:[],origin:x.origin,label:x.origin+' · '+(x.sound||'historical reading'),ipa:x.ipa,note:x.notes}));
  }
  const doc=ref.filter(x=>x.era==='Modern').flatMap(x=>(x.recipes||[]).map(r=>({...r,note:x.notes})))
    .filter(x=>x.base===base&&x.marks.length<=2);
  const legacy=(window.AZ_MODERN_SOUNDS?.entries||[]).filter(x=>x.host===base&&x.marks.length<=2)
    .map(x=>({base:x.host,marks:x.marks,label:x.display,ipa:x.ipa}));
  const seen=new Set();return [...doc,...legacy].filter(x=>{const k=x.base+':'+x.marks.join(',')+':'+x.ipa;if(seen.has(k))return false;seen.add(k);return true});
 }
 function availableMarks(era){return era==='Modern'?marks:[...historicMarks,...marks.filter(x=>x.special&&(era!=='Archaic'||!['sLeft','sRight'].includes(x.id)))]}
 function availableSubscripts(era){return era==='Modern'?Object.keys(canon.subs):rowsForEra(era).flat().filter(isLetter).map(ch=>ch.toLowerCase())}
 function markName(id){return byId.get(id)?.name||id}
 function art(base,era,origin=null){return era==='Modern'?(independent.has(base)?`assets/keyboard/modern/independent/${base}-font.png`:null):window.AZ_HISTORICAL_COMPOSER?.art(base,era,origin)||historicalArtwork(base,era)}
 function symbol(raw){return canon.nums[raw]||canon.punct[raw]||null}
 function handle(raw,era,notes){
  const sourceKey=historicalKey(raw,era);
  if(sourceKey){const result=tryEncode(sourceKey.base,[],era,[],[],sourceKey.origin);if(result.error)notes.toast(result.error);else notes.insert(result.value,result.token);return true;}
  if(isLetter(raw)){const result=tryEncode(raw,[],era);if(result.error)notes.toast(result.error);else notes.insert(result.value,result.token);return true}
  if(specials[raw]){if(era==='Archaic'&&['AZA_PREV','AZA_NEXT'].includes(raw))return true;notes.insert(byId.get(specials[raw]).unicode);return true}
  return false;
 }

 // Aza’raan is a distinct input mode. Khmer scalars here are internal glyph slots,
 // not a request for the browser to print the ordinary Khmer alphabet.
 const mergedPhysical={F:['B',['soft','unvoiced']],V:['B',['soft']],U:['A',['central']],Q:['K',['glide']],X:['K',['hard','unvoiced']]};
 const specialPhysical={"'":'sOver','’':'sOver','¡':'sUnder','<':'sLeft','>':'sRight'};
 function physicalValue(key,era='Modern'){
  if(typeof key!=='string'||!key)return null;
  if(key===' ')return {value:' '};
  if(key==='\n')return {value:'\n'};
  if(Object.prototype.hasOwnProperty.call(specialPhysical,key)){
   const id=specialPhysical[key];
   if(era==='Archaic'&&(id==='sLeft'||id==='sRight'))
    return {error:'Syllable emphasis is unavailable in Archaic.'};
   return {value:byId.get(id).unicode};
  }
  if(Object.prototype.hasOwnProperty.call(canon.nums,key)||Object.prototype.hasOwnProperty.call(canon.punct,key))
   return {value:symbol(key)};
  if(/^[a-z]$/i.test(key)){
   const latin=key.toUpperCase();
   if(era==='Modern'&&mergedPhysical[latin]){
    const [base,ids]=mergedPhysical[latin];
    return tryEncode(base,ids,era);
   }
   if(isLetter(latin))return tryEncode(latin,[],era);
   return {error:'No independent '+latin+' in '+era+'. Use an available letter or its hold-menu sound.'};
  }
  if(key.length===1&&/^[\x20-\x7e]$/.test(key))
   return {error:'This punctuation mark is not assigned in the Aza’raan encoding.'};
  return null;
 }
 function textToRead(){return window.Notes.getSelectedText()?.trim()||window.Notes.getText()?.trim()||''}
 function updateSelectionPreview(){const input=textToRead(),field=$('speechText');if(field)field.value=input;const engine=window.AzaaraanTTS;if(!engine)return;const result=engine.previewText(input);$('speechIpa').textContent=result.ipa;$('speechPreview').textContent=result.speech||'No pronunciation available';$('speechWarning').textContent=(result.warnings||[]).join(' · ')}
 async function speakSelection(){const value=textToRead();if(!value)return window.Notes.toast('Choose text to pronounce.');updateSelectionPreview();return window.AzaaraanTTS?.readText(value)}
 function openSettings(){updateSelectionPreview();$('voiceSettings').showModal()}
 function showPage(which){if(which==='evolution')window.LiteraryFriendApp?.goToRole('language-evolution')}
 window.AzaaraanBridge={rows,rowsForEra,isLetter,historicalKeys,historicalKey,historicalGroups,handle,physicalValue,encode,tryEncode,glyph,preview,art,symbol,soundOptions,availableMarks,availableSubscripts,markName,loadChoice,saveChoice,speakSelection,openSettings,textToRead,showPage};
})();
