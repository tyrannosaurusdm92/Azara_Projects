/* Canonical peoples and five-era pantheon profiles, with separately authored cultural and divine Covenants. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ppl=(window.LIFE_SIMULATOR_DEFAULT_DATA?.raceData?.categories||[]).flatMap(c=>c.racesDetailed||[]);
const pantheon=window.AZARA_PANTHEON_CANON, covenant=window.AzaraCovenant;
function editor(kind,id,source,label){
 if(!covenant)return '';
 const state=covenant.get(kind,id,source);
 const inputs=covenant.reference.axes.map(axis=>{
  const name=axis.id[0].toUpperCase()+axis.id.slice(1);
  return '<label><span>'+esc(name)+'</span><input type="number" min="0" max="3000" step="1" data-aza-axis="'+esc(axis.id)+'" value="'+state.scores[axis.id]+'"><small>'+esc(axis.low)+' ↔ '+esc(axis.high)+'</small></label>';
 }).join('');
 return '<details class="aza-canon-editor" data-aza-edit-kind="'+esc(kind)+'" data-aza-edit-id="'+esc(id)+'"><summary>Edit '+esc(label)+' Covenant</summary><p>Author-specified values or recorded decisions. Unscored profiles begin at the neutral pivot; ancestry and divine standing do not dictate alignment.</p><div class="aza-canon-editor-grid">'+inputs+'</div><button type="button" data-aza-save="yes">Save '+esc(label)+' Covenant</button><p class="file-note" data-aza-status aria-live="polite"></p></details>';
}
function currentCultureKey(name){
 const province=window.BelavadosLivingWorld?.ui?.province;
 return String(province?.id||'world')+':'+String(name);
}
function updateRace(){
 const select=$('bvs-worldApprovedRace'),out=$('bvs-azaraRaceProfile');if(!select||!out)return;
 const r=ppl.find(x=>x.name===select.value);
 if(!r){out.textContent='Choose an approved species or mixed heritage.';return;}
 const province=window.BelavadosLivingWorld?.ui?.province;
 const cultureId=currentCultureKey(r.name),institutionLabel='local cultural institutions';
 out.innerHTML='<b>'+esc(r.name)+'</b> · '+esc(r.category)+'<p>'+esc(r.description)+'</p>'+
 (r.parentalAncestry?'<p><b>Parent ancestries:</b> '+esc(r.parentalAncestry.join(' + '))+'</p>':'')+
 '<p class="file-note">This species has no innate alignment. Individual people and locally organized communities make their own decisions.</p>'+
 (covenant?'<details class="aza-culture-ethos"><summary>Local community Covenant'+(province?' · '+esc(province.name):'')+'</summary><p>This record describes institutions associated with '+esc(r.name)+' in '+esc(province?.name||'the current region')+', not all members of the species.</p>'+
 covenant.render('culture',cultureId)+editor('culture',cultureId,null,institutionLabel)+'</details>':'');
}
function updateGodList(){
 const era=$('bvs-azaraPantheonEra'),sel=$('bvs-azaraPantheonDeity');if(!era||!sel||!pantheon)return;
 const previous=sel.value,entries=pantheon.eras[era.value]?.deities||[];
 sel.innerHTML=entries.map(d=>'<option value="'+esc(d.name)+'">'+esc(d.name)+' · '+esc(d.standing)+'</option>').join('');
 if(entries.some(d=>d.name===previous))sel.value=previous;
 updateGod();
}
function updateGod(){
 const era=$('bvs-azaraPantheonEra')?.value,name=$('bvs-azaraPantheonDeity')?.value,out=$('bvs-azaraPantheonProfile');if(!out||!pantheon)return;
 const deity=pantheon.deities.find(d=>d.name===name),standing=pantheon.eras[era]?.deities.find(d=>d.name===name);
 if(!deity||!standing){out.textContent='Select a deity.';return;}
 out.innerHTML='<b>'+esc(deity.name)+'</b> · '+esc(standing.standing)+' · '+esc(era)+
 '<p><b>Pronouns:</b> '+esc(deity.pronouns||'Not specified')+'</p><p><b>Domains:</b> '+esc(deity.domains)+'</p>'+
 '<p>'+esc(deity.characterDescription)+'</p><p><b>Sacred symbol:</b> '+esc(deity.sacredSymbol)+'</p>'+
 '<p>'+esc((standing.notes||[]).filter(n=>n.startsWith('Era-specific development:')).join(' '))+'</p>'+
 (covenant?covenant.render('deity',deity.name,deity)+editor('deity',deity.name,deity,'deity'):'');
}
function saveClick(event){
 const button=event.target.closest('[data-aza-save]');if(!button||!covenant)return;
 const section=button.closest('[data-aza-edit-kind]');if(!section)return;
 const values={};let invalid=false;
 section.querySelectorAll('[data-aza-axis]').forEach(field=>{
  const n=Number(field.value);if(!field.value||!Number.isInteger(n)||n<0||n>3000){invalid=true;return;}values[field.dataset.azaAxis]=n;
 });
 const status=section.querySelector('[data-aza-status]');
 if(invalid||Object.keys(values).length!==8){if(status)status.textContent='All eight scores must be whole numbers between 0 and 3000.';return;}
 covenant.save(section.dataset.azaEditKind,section.dataset.azaEditId,values,'Worldbuilding author approved');
 if(section.dataset.azaEditKind==='deity')updateGod();else updateRace();
}
function init(){
 const r=$('bvs-worldApprovedRace');if(r){r.addEventListener('change',updateRace);r.addEventListener('input',updateRace);updateRace();}
 $('bvs-azaraPantheonEra')?.addEventListener('change',updateGodList);
 $('bvs-azaraPantheonDeity')?.addEventListener('change',updateGod);
 $('bvs-azaraRaceProfile')?.addEventListener('click',saveClick);
 $('bvs-azaraPantheonProfile')?.addEventListener('click',saveClick);
 document.addEventListener('belavados:viewchange',()=>setTimeout(updateRace,0));
 updateGodList();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();