/* Aza'raan era rules UI and read-only historical reconstructions, data-driven and offline-compatible. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root='./json/azaraan-rules/';
const eraNames={proto:'Proto',ancient:'Ancient',archaic:'Archaic',classical:'Classical',traditional:'Traditional',modern:'Modern'};
const eraOrder=Object.keys(eraNames);
const wanted=['grammar-eras','alphabet-and-sounds','letter-construction','phonotactics','historical-sound-changes','examples-and-tests','diacritic-registry','historical-dictionary'];
let data=null,activeEra='modern',loading=null;
const el=(tag,cls,content)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);
 return n;
};
const row=(container,tag,cls,content)=>{const node=el(tag,cls,content);container.append(node);return node};
const list=(title,items)=>{
 const box=el('section','aws-rules-card');row(box,'h3','',title);
 const ul=el('ul','aws-rules-bullets');for(const i of items||[])row(ul,'li','',i);
 box.append(ul);return box;
};
const fetchJson=async name=>{
 const response=await fetch(root+name+'.json',{cache:'no-cache'});
 if(!response.ok)throw Error(name+': HTTP '+response.status);
 return response.json();
};
async function ensure(){
 if(data)return data;if(loading)return loading;
 loading=Promise.all(wanted.map(fetchJson)).then(arr=>{
  data=Object.fromEntries(wanted.map((name,i)=>[name,arr[i]]));
  const dict=data['historical-dictionary'];
  window.AWSHistoricalLexicon={entries:dict.entries||[],lineages:dict.lineages||[]};
  window.dispatchEvent(new Event('aws:dictionary-changed'));
  return data;
 }).catch(err=>{loading=null;throw err});
 return loading;
}
function showEra(era){
 if(!eraNames[era])return;
 activeEra=era;
 const input=$('aws-rules-era');if(input)input.value=era;
 const tabs=$('aws-rules-tabs');if(tabs)tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.era===era);b.setAttribute('aria-pressed',String(b.dataset.era===era))});
 render();
}
function tabs(){
 const host=$('aws-rules-tabs');if(!host)return;
 host.replaceChildren();
 for(const era of eraOrder){
  const b=el('button','aws-rules-era-tab',eraNames[era]);b.type='button';b.dataset.era=era;
  b.setAttribute('aria-pressed',String(era===activeEra));b.onclick=()=>showEra(era);host.append(b);
 }
}
function render(){
 const host=$('aws-rules-content');
 if(!host||!data||$('aws-rules-panel').hidden)return;
 host.replaceChildren();
 const g=data['grammar-eras'],current=g.eras.find(x=>x.id===activeEra);
 if(!current){row(host,'p','','Era unavailable');return}
 const intro=el('article','aws-rules-era-intro');
 row(intro,'span','aws-rules-kicker','HISTORICAL ERA');
 row(intro,'h2','',current.label);
 row(intro,'p','aws-rules-years',current.start+' to '+current.end);
 row(intro,'p','',current.profile);
 host.append(intro);
 const grid=el('div','aws-rules-grid');
 grid.append(list('Grammar and sentence order',[current.order,current.particle_profile,...current.syntax_features]));
 grid.append(list('Syllables and speech',[current.phonology,...(activeEra==='modern'?data.phonotactics.basic_rules.slice(0,6):[])]));
 grid.append(list('Letter construction and orthography',[current.orthography,...(eraOrder.indexOf(activeEra)>=3?data['letter-construction'].non_standard_notes.slice(0,5):[])]));
 const historic=data['historical-sound-changes'].steps.find(x=>x.transition.endsWith('_to_'+activeEra));
 grid.append(list('Evolution and sound change',historic?.changes||['This era preserves the sound inventory of its predecessor.','The historical letter table determines each phoneme family.']));
 host.append(grid);
 if(eraOrder.indexOf(activeEra)>=3){
  const markBox=el('section','aws-rules-card aws-rules-wide');
  row(markBox,'h3','','Independent letters, dependent subscripts and accents');
  row(markBox,'p','','20 bases: '+data['alphabet-and-sounds'].alphabet+' · Maximum two subscripts per host · One semantic accent per atomic letter. Historical W, F and V appear in the B family.');
  const letters=el('div','aws-rules-letters');
  for(const item of data['alphabet-and-sounds'].independent_letters){const b=el('details','aws-rules-letter');row(b,'summary','',item.letter);row(b,'p','',item.ipa.join(', '));row(b,'p','',item.notes);letters.append(b)}
  markBox.append(letters);host.append(markBox);
 }
 const ex=data['examples-and-tests'].examples.filter(x=>x.source||x.type), examples=el('section','aws-rules-card aws-rules-wide');
 row(examples,'h3','','Pronunciation examples and historical exceptions');
 for(const item of ex){const node=el('p','aws-rule-example');
  node.append(el('strong','',item.source||item.id),document.createTextNode(' · '+(item.expected_english||item.expected_initial_english||item.target||item.type||'')+' · '+(item.status||'example')));
  examples.append(node);
 }
 host.append(examples);
 const dictionary=data['historical-dictionary'];
 const proposal=el('section','aws-rules-card aws-rules-wide');
 row(proposal,'h3','','Dictionary evolution: '+eraNames[activeEra]);
 row(proposal,'p','','Historical particle forms below are constructed proposals. Existing saved dictionary entries remain yours and are not overwritten.');
 const short=el('div','aws-rules-lexemes');
 for(const family of dictionary.lineages){
  const r=el('div','aws-rules-lexeme');
  row(r,'strong','',family.forms[activeEra]);row(r,'span','',family.gloss);
  const detail=el('small','',eraOrder.map(e=>eraNames[e]+': '+family.forms[e]).join(' / '));r.append(detail);short.append(r);
 }
 proposal.append(short);host.append(proposal);
}
async function init(){
 const area=$('aws-rules-content');if(!area)return;
 tabs();$('aws-rules-era').addEventListener('change',e=>showEra(e.target.value));
 $('aws-rules-open-dictionary').onclick=()=>{
  if(!window.LiteraryFriendApp?.goToRole?.('dictionary'))return;
  const sel=$('aws-dictionary-era');sel.value=activeEra;sel.dispatchEvent(new Event('change',{bubbles:true}));
 };
 window.addEventListener('aws:view',e=>{if(e.detail?.role==='rules')render()});
 try{await ensure();showEra(activeEra)}catch(err){
  area.replaceChildren();row(area,'p','aws-rules-error','Could not load the JSON rule files: '+err.message);
  const b=row(area,'button','btn','Retry');b.onclick=async()=>{try{await ensure();render()}catch(e){row(area,'p','','Still unavailable: '+e.message)}};
 }
}
window.AWSLanguageRules={openEra:showEra};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();