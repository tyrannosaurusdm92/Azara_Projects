/* Unified sound-to-script panel: canonical pronunciation rules + merged visual writing desk.
   No server or external libraries required. */
(()=>{'use strict';
const PH=window.AzaaraanPhonetics,ST=window.AZA_STUDIO,CFG=window.AZA_CONFIG;
if(!PH||!ST||!CFG){console.error('Aza’raan missing phonetic integration');return}
const $=id=>document.getElementById(id);
const input=$('phon-input'),recipe=$('phon-recipe'),live=$('phon-live'),unitsEl=$('phon-units'),status=$('phon-status');
const unitCount=$('phon-unit-count'),ruleSource=$('phon-rule-source');
const actions=['phon-insert','phon-replace','phon-copy','phon-teach'];
const STORAGE='azaaraan-pronunciations-merged-v4';
let overrides={},preview=[],origin='',explicit=false,valid=false;
try{const data=JSON.parse(localStorage.getItem(STORAGE)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))for(const [key,val] of Object.entries(data)){if(/^[a-z']{1,70}$/.test(key)&&typeof val==='string'&&val.length<400)overrides[key]=val}}
catch{}
function key(){return PH.normalize(input.value)}
function singleName(){return /^[a-z']+$/.test(key())&&key().length<=70}
function knownRecipe(){return overrides[key()]||PH.known(key())?.recipe||''}
function syncRecipe(){recipe.value=singleName()?knownRecipe():'';explicit=false}
function convertUnitsToTokens(units){
 const list=[];
 for(const item of units){
  if(ST.era==='archaic')for(const id of item.modifiers||[]){if(id==='S01')list.push({type:'sign',sign:'ʔ'});if(id==='S02')list.push({type:'sign',sign:'¡'})}
  const marks=item.modifiers.filter(id=>!(ST.era==='archaic'&&(id==='S01'||id==='S02')));
  if(marks.length>3)throw Error('A syllable has more than three attached marks.');
  if(marks.filter(id=>/^C0[1-7]$/.test(id)).length>1)throw Error('Only one short/long vowel may be attached to one letter.');
  if(marks.includes('K05')&&marks.some(id=>id!=='K05'&&!id.startsWith('S')))throw Error('Base cannot be combined with another ordinary accent.');
  list.push({type:'glyph',base:item.base,marks:marks.slice()});
 }
 return list;
}
function getTranslation(){
 const text=input.value;
 const manual=recipe.value.trim();
 if(manual){
  const groups=manual.split(/\s*\/\s*|\s*\|\|\s*/).filter(Boolean);
  const result=[];let units=[];let originList=[];
  for(const segment of groups){if(result.length)result.push({type:'space'});const trans=PH.fromRecipe(segment,ST.era);result.push(...convertUnitsToTokens(trans.units));units.push(...trans.units)}
  return {tokens:result,units,origin:'Exact sound-unit recipe',warnings:[]};
 }
 const chunks=text.match(/\s+|\S+/g)||[],out=[],units=[],warnings=[],sources=[];
 for(const ch of chunks){
  if(/^\s+$/.test(ch)){for(const cp of ch){out.push({type:cp==='\n'?'break':'space'})}continue}
  const trans=PH.convert(ch,{era:ST.era,overrides});out.push(...convertUnitsToTokens(trans.units));units.push(...trans.units);sources.push(...trans.origin);warnings.push(...trans.warnings);
 }
 return {tokens:out,units,origin:[...new Set(sources)].join(' / ')||'Automatic accent rules',warnings};
}
function refresh(){
 live.replaceChildren();unitsEl.replaceChildren();valid=false;preview=[];status.classList.remove('error');
 $('phon-forget').disabled=!singleName()||!Boolean(overrides[key()]);
 try{
  if(!input.value.trim()&&!recipe.value.trim()){
   status.textContent='Enter English spelling or a sound-unit recipe to preview Aza’raan Khmer Unicode.';
   unitCount.textContent='0 letters';ruleSource.textContent='';
  }else{
   const t=getTranslation();preview=t.tokens;
   valid=t.tokens.some(x=>x.type==='glyph');
   ST.preview(t.tokens,live);
   unitCount.textContent=t.tokens.filter(x=>x.type==='glyph'||x.type==='sign').length+' logical letters';
   for(const u of t.units){const tile=document.createElement('span');tile.className='sound-unit';const id=document.createElement('strong');id.textContent=u.labels;const ipa=document.createElement('span');ipa.textContent=u.ipa;tile.append(id,ipa);unitsEl.append(tile)}
   ruleSource.textContent=recipe.value.trim()?(explicit?'Edited recipe — not saved':overrides[key()]?'Saved personal pronunciation':PH.known(key())?'Known character pronunciation':'Exact sound-unit recipe'):t.origin;
   status.textContent='Generated '+ST.serialize(t.tokens).length+' Khmer code units · '+unitCount.textContent+(t.warnings.length?' · '+t.warnings.join(' '):'');
   if(t.warnings.length)status.classList.add('error');
  }
 }catch(e){preview=[];unitCount.textContent='0 letters';status.textContent=e.message||String(e);status.classList.add('error');ruleSource.textContent='Invalid recipe'}
 for(const id of actions)$(id).disabled=!valid;
}
function insert(){if(!valid)return;ST.append(preview.map(t=>({...t,marks:t.marks?[...t.marks]:undefined})));refresh()}
input.addEventListener('input',()=>{syncRecipe();refresh()});recipe.addEventListener('input',()=>{explicit=true;refresh()});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();insert()}});
$('phon-insert').addEventListener('click',insert);
$('phon-replace').addEventListener('click',()=>{if(!valid)return;if(ST.text&&!window.confirm('Replace the entire existing Aza’raan manuscript?'))return;ST.replace(preview.map(t=>({...t,marks:t.marks?[...t.marks]:undefined})));refresh()});
$('phon-copy').addEventListener('click',async()=>{if(!valid)return;const txt=ST.serialize(preview);
 try{await navigator.clipboard.writeText(txt);status.textContent='Copied Khmer-encoded phonetic transcription.'}
 catch{const box=document.createElement('textarea');box.value=txt;document.body.append(box);box.select();try{document.execCommand('copy');status.textContent='Copied Khmer text.'}catch{status.textContent='Clipboard permission denied. Use Insert then the Unicode output panel.'}box.remove()}
});
$('phon-teach').addEventListener('click',()=>{
 if(!singleName()||!recipe.value.trim()){status.classList.add('error');status.textContent='To save a pronunciation, enter one name and an exact sound-unit recipe.';return}
 try{PH.fromRecipe(recipe.value,ST.era)}catch(err){status.classList.add('error');status.textContent=err.message;return}
 overrides[key()]=recipe.value.trim();try{localStorage.setItem(STORAGE,JSON.stringify(overrides))}catch{status.textContent='Saved for this session; browser storage is not available.';return}
 explicit=false;refresh();status.textContent='Saved your pronunciation for '+input.value.trim()+'.'
});
$('phon-forget').addEventListener('click',()=>{delete overrides[key()];try{localStorage.setItem(STORAGE,JSON.stringify(overrides))}catch{}syncRecipe();refresh();status.textContent='Restored default pronunciation.'});
for(const item of PH.examples){const btn=document.createElement('button');btn.type='button';btn.textContent=item.spelling;btn.title=item.pronunciation+' · '+item.recipe;btn.addEventListener('click',()=>{input.value=item.spelling;syncRecipe();refresh();input.focus()});$('phon-examples').append(btn)}
// Studio can change era independently; observe change and rerender the phonetic preview.
$('era').addEventListener('change',()=>{refresh()});
syncRecipe();refresh();
})();
