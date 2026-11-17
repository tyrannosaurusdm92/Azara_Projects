/* One AWS bubble for all four eras. Modern art comes from the supplied package. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const canon = window.AZ_CANON, modern = window.AZ_MK;
 const alphabet = Object.keys(canon.ind), independent = new Set(alphabet);
 const historical = new Set([...alphabet, 'U']);
 const rows = [['A','B','D','E','G','H','I'],['J','K','L','M','N','O','P'],['R','S','T','U','W','Y','Z'],['SYMBOLS','AZA_GLOTTAL','AZA_CLICK','AZA_PREV','AZA_NEXT','SPACE','BACK','ENTER']];
 const marks = canon.marks.map(mark => ({...mark, display:mark.latin, khmer:mark.unicode, meaning:mark.name}));
 const byId = new Map(marks.map(mark => [mark.id, mark]));
 const specials = {AZA_GLOTTAL:'sOver',AZA_CLICK:'sUnder',AZA_PREV:'sLeft',AZA_NEXT:'sRight'};
 const preferenceKey = 'steampunk-azaaraan-keyboard-preferences-v1';
 function isLetter(key){return historical.has(key)}
 function rowsForEra(era){return rows.map(row => row.filter(key => (era!=='Modern'||key!=='U') && (era!=='Archaic'||!['AZA_PREV','AZA_NEXT'].includes(key))));}
 function loadChoice(){try{const saved=JSON.parse(localStorage.getItem(preferenceKey)||'{}');return {language:saved.language==='azaaraan'?'azaaraan':'qwerty',era:['Archaic','Classical','Traditional','Modern'].includes(saved.era)?saved.era:'Modern'}}catch{return {language:'qwerty',era:'Modern'}}}
 function saveChoice(language,era){try{localStorage.setItem(preferenceKey,JSON.stringify({language,era}))}catch{}}
 function draft(base,options={}){return {type:'letter',base,marks:options.marks||[],markOrder:options.marks||[],subs:options.subs||[],specials:options.specials||[]}}
 function tryEncode(base,markIds=[],era='Modern',subs=[],specialIds=[]){
  if(!isLetter(base)||(era==='Modern'&&!independent.has(base)))return {value:null,error:'This is not an independent letter in '+era+'.'};
  const allowed=new Set(availableMarks(era).map(x=>x.id));
  const used=[...markIds,...specialIds,...subs.flatMap(s=>s.marks||[])];
  if(used.some(id=>!allowed.has(id)))return {value:null,error:'This mark is unavailable in '+era+'.'};
  if(markIds.length>2||subs.length>2||subs.some(s=>(s.marks||[]).length>2))return {value:null,error:'Two phonetic marks per letter or subscript; two subscripts per host.'};
  if(subs.some(s=>!canon.subs[s.key]&&!(era!=='Modern'&&s.key==='u')))return {value:null,error:'Unknown subscript.'};
  if(specialIds.some(id=>!byId.get(id)?.special))return {value:null,error:'Special controls attach to the main letter only.'};
  const token=draft(base,{marks:markIds,subs,specials:specialIds});
  if(era==='Modern'){
   const normalized=modern.normalizeLetter(token),error=modern.validateLetterRules(normalized);
   if(error)return {value:null,error};
   return {value:modern.encode(normalized),token:normalized};
  }
  // Pre-Modern letter drawings stay in their original era fonts. Historical U
  // is independently writable and can also be written as a dependent letter.
  if(markIds.includes('voiced')&&markIds.includes('unvoiced'))return {value:null,error:'Voiced and Unvoiced cannot modify the same letter.'};
  if(subs.some(s=>(s.marks||[]).includes('voiced')&&(s.marks||[]).includes('unvoiced')))return {value:null,error:'Voiced and Unvoiced cannot modify the same subscript.'};
  if(subs.some(s=>(s.marks||[]).includes('separate')))return {value:null,error:'Separated Vowel attaches only to the independent letter.'};
  const ch=canon.ind[base]||window.AZA_HISTORICAL_U||'ឩ',early=new Set(['soft','hard','held']);
  const enc=ids=>ids.map(id=>byId.get(id).unicode).join('');
  return {value:ch+enc(markIds.filter(id=>early.has(id)))+subs.map(s=>canon.coeng+(canon.ind[s.key.toUpperCase()]||window.AZA_HISTORICAL_U)+enc(s.marks||[])).join('')+enc(markIds.filter(id=>!early.has(id)))+enc(specialIds),token};
 }
 function encode(base,marks=[],era='Modern',subs=[],specials=[]){return tryEncode(base,marks,era,subs,specials).value||''}
 function glyph(base,era){return encode(base,[],era)}
 function preview(base,markIds,era,subs=[],specialIds=[]){const result=tryEncode(base,markIds,era,subs,specialIds);return result.value&&era==='Modern'?modern.createCluster(result.token):null}
 function soundOptions(base,era){return era==='Modern'?(window.AZ_MODERN_SOUNDS?.entries||[]).filter(x=>x.host===base && x.marks.length<=2).map(x=>({base:x.host,marks:x.marks,label:x.display,ipa:x.ipa})):[]}
 function availableMarks(era){return era==='Archaic'?marks.filter(x=>!['sLeft','sRight'].includes(x.id)):marks}
 function availableSubscripts(era){return era==='Modern'?Object.keys(canon.subs):[...Object.keys(canon.subs),'u']}
 function markName(id){return byId.get(id)?.name||id}
 function art(base,era){return era==='Modern'&&independent.has(base)?`assets/keyboard/modern/independent/${base}-font.png`:null}
 function symbol(raw){return canon.nums[raw]||canon.punct[raw]||null}
 function handle(raw,era,notes){
  if(isLetter(raw)){const result=tryEncode(raw,[],era);if(result.error)notes.toast(result.error);else notes.insert(result.value);return true}
  if(specials[raw]){if(era==='Archaic'&&['AZA_PREV','AZA_NEXT'].includes(raw))return true;notes.insert(byId.get(specials[raw]).unicode);return true}
  return false;
 }
 function textToRead(){return window.Notes.getSelectedText()?.trim()||window.Notes.getText()?.trim()||''}
 function updateSelectionPreview(){const input=textToRead(),field=$('speechText');if(field)field.value=input;const engine=window.AzaaraanTTS;if(!engine)return;const result=engine.previewText(input);$('speechIpa').textContent=result.ipa;$('speechPreview').textContent=result.speech||'No pronunciation available';$('speechWarning').textContent=(result.warnings||[]).join(' · ')}
 async function speakSelection(){const value=textToRead();if(!value)return window.Notes.toast('Choose text to pronounce.');updateSelectionPreview();return window.AzaaraanTTS?.readText(value)}
 function openSettings(){updateSelectionPreview();$('voiceSettings').showModal()}
 function showPage(which){if(which==='evolution')window.LiteraryFriendApp?.goToRole('language-evolution')}
 window.AzaaraanBridge={rows,rowsForEra,isLetter,handle,encode,tryEncode,glyph,preview,art,symbol,soundOptions,availableMarks,availableSubscripts,markName,loadChoice,saveChoice,speakSelection,openSettings,textToRead,showPage};
})();
