/* Elarvess living-settlement integration. Does not modify original map alignment.
   All map navigation calls the existing BelavadosElarvessMap.selectBuilding. */
(()=>{
'use strict';
const data=window.ELARVESS_ENRICHMENT, map=window.BelavadosElarvessMap, cal=window.AzaCalendar;
const $=id=>document.getElementById(id);
if(!data||!map||!$('elarvessMapInspector'))return;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLowerCase();
const byNpc=new Map(data.npcs.map(n=>[n.id,n]));
const geo=new Map((window.ELARVESS_MAP_BUILDINGS||[]).map(b=>[Number(b.id),b]));
const byLoc=new Map(data.npcReferencedPlaces.map(l=>[l.name,l]));
const base=data.roleLinks.referencedLocationBuildingIds;
const KEY='belavados.elarvess.locationAssignments.v2';
let overrides={};try{const stored=JSON.parse(localStorage.getItem(KEY)||'{}');if(stored&&typeof stored==='object')overrides=stored;}catch{}
const chosen=name=>Number(overrides[name]||base[name]||0);
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(overrides));return true;}catch{return false;}};
const convert=t=>cal?.source24(t)||String(t);
const now=()=>cal?.getState()||{day:1,hour:13,minute:30,time:'13:30'};
const mins=s=>{const parts=String(s||'00:00').split(':').map(Number);return parts[0]*60+(parts[1]||0)};
const humanRole=name=>name.replace(/^aelvanyr-elarvess-/,'').replace(/house-(\d+) residence/,'Household $1 home');
const placeButton=(name,label)=>{const id=chosen(name);if(!id)return `<span class="elf-muted">${escape(name)} — no mapped site</span>`;const b=geo.get(id);return `<button type="button" data-ev-building="${id}" title="Zoom to registered footprint #${id}">${escape(label||humanRole(name))} ↗ <small>• ${escape(b?.name||'#'+id)}</small></button>`;};
const npcButton=(n,extra='')=>`<button type="button" data-ev-npc="${escape(n.id)}">${escape(n.name)}${extra?` <small>· ${escape(extra)}</small>`:''}</button>`;
const mapPanel=document.createElement('section');mapPanel.id='elarvessLivingPanel';mapPanel.className='elarvess-living';
$('elarvessMapInspector').append(mapPanel);
let selectedBuilding=null,selectedNpc=data.npcs[0]?.id, query='',tab='npcs';
function visitingPlaces(n){
 const names=new Set([n.home,n.job?.location]);for(const slot of n.schedule||[]){const raw=String(slot.location||'');if(byLoc.has(raw))names.add(raw);else if(raw.includes(' / social venues')){names.add(raw.slice(0,raw.indexOf(' / social venues')));names.add('Tavern');}}
 return [...names].filter(Boolean);
}
function npcHere(n,id){return visitingPlaces(n).some(name=>chosen(name)===id);}
function present(n,id){const time=mins(now().time);return (n.schedule||[]).some(s=>{
  const name=String(s.location||'');const places=byLoc.has(name)?[name]:(name.includes(' / social venues')?[name.slice(0,name.indexOf(' / social venues')),'Tavern']:[]);
  if(!places.some(l=>chosen(l)===id))return false;
  const a=mins(convert(s.start)),b=mins(convert(s.end));return a<=time&&time<b;
});}
function sourceSchedule(n){return (n.schedule||[]).map(s=>{
 const loc=String(s.location||''),isCombined=loc.includes(' / social venues');
 const options=isCombined?[loc.slice(0,loc.indexOf(' / social venues')),'Tavern']:byLoc.has(loc)?[loc]:[];
 const ts=`${convert(s.start)}–${convert(s.end)}`;
 return `<div class="elf-schedule"><b>${escape(ts)} <small>(${escape(s.start)}–${escape(s.end)} source)</small></b><span>${escape(s.activity)} · ${escape(s.days==='Nebday–Valkhaday'?'every Aza day (source 7-day range)':s.days)}</span><div class="elf-actions">${options.map(p=>placeButton(p,isCombined?humanRole(p):undefined)).join('')}</div></div>`;
 }).join('');}
function renderNpc(n){
 if(!n)return '<p>No character selected.</p>';
 const names=visitingPlaces(n),type='Aza’raan campaign time',home=n.home,work=n.job?.location;
 const categories=['familial','romantic','personal','professional'];
 return `<h4>${escape(n.name)} <small>• ${escape(n.race?.name)} • ${escape(n.age)} • ${escape(n.pronouns)}</small></h4>
 <p><b>${escape(n.job?.title)}</b> · ${escape(n.aspiration||'')}</p>
 <p>${(n.traits||[]).map(escape).join(' · ')}</p>
 <h5>Clickable home, work, school and visits</h5><div class="elf-actions">${names.map(p=>placeButton(p,(p===home?'Home: ':p===work?(n.job?.title?.toLowerCase().includes('student')?'School: ':'Work: '):'Visit: ')+humanRole(p))).join('')}</div>
 <h5>Daily whereabouts · ${type} · ${escape(now().time)}</h5><div class="elf-schedule-list">${sourceSchedule(n)}</div>
 <h5>Relationships · 90 directed ties in attached roster</h5>${categories.map(kind=>`<details ${kind==='familial'?'open':''}><summary>${kind[0].toUpperCase()+kind.slice(1)} (${(n.relationships?.[kind]||[]).length})</summary><div class="elf-actions">${(n.relationships?.[kind]||[]).map(r=>npcButton(byNpc.get(r.npcId)||{id:r.npcId,name:r.name},r.type)).join('')||'<small>No recorded ties</small>'}</div></details>`).join('')}`;
}
function renderBuilding(b){
 if(!b)return '<p>Select any footprint on the aligned image to inspect its name, occupants and services.</p>';
 const id=Number(b.id),roleNames=Object.keys(base).filter(l=>chosen(l)===id);
 const residents=data.npcs.filter(n=>n.home&&chosen(n.home)===id);
 const workers=data.npcs.filter(n=>chosen(n.job?.location)===id);
 const all=data.npcs.filter(n=>npcHere(n,id));
 const presentNpcs=all.filter(n=>present(n,id));
 const vendor=data.goodsAndServices.filter(g=>data.roleLinks.vendorBuildingCandidates[g.designatedLocation]?.buildingId===id);
 return `<h4>${escape(b.name)} <small>• #${b.id} · ${escape(b.type)}</small></h4>
 <p class="elf-muted">Original map building. Source NPC location names below use editable simulation anchors, not asserted historical ownership. The map artwork and footprints have not been moved.</p>
 <p><b>Referenced locations here:</b> ${roleNames.map(escape).join(' · ')||'None assigned'}</p>
 <h5>People connected to this building</h5><div class="elf-actions">${all.map(n=>npcButton(n,[(residents.includes(n)?'resident':null),(workers.includes(n)?'work or study':null),(presentNpcs.includes(n)?'here at selected time':null)].filter(Boolean).join(' · '))).join('')||'<span class="elf-muted">No supplied NPC assigned here.</span>'}</div>
 <h5>Goods / services · illustrative catalogue candidates (${vendor.length})</h5>
 <p class="elf-muted">The attached vendor labels are categories, not independently verified stock for this named building.</p>
 ${vendor.slice(0,45).map(g=>`<div class="elf-good"><span>${escape(g.item)} <small>· ${escape(g.designatedLocation)}</small></span><b>${escape(g.price||'Price not supplied')}</b></div>`).join('')||'<p class="elf-muted">No category-matched goods supplied for this building.</p>'}
 ${vendor.length>45?`<p>Showing 45 of ${vendor.length}. Use Goods &amp; Services search for all entries.</p>`:''}`;
}
function locEditor(){return `<details><summary>Adjust a location’s mapped building (keeps original alignment)</summary><p class="elf-muted">Placements are scenario assignments, not verified source ownership. Saved locally; export to keep them.</p><div class="elf-line"><select id="ev-location-choose">${Object.keys(base).map(x=>`<option value="${escape(x)}">${escape(x)}</option>`).join('')}</select><input id="ev-building-choose" type="number" min="1" max="1312" step="1" title="Original GeoJSON building ID" value="${chosen(Object.keys(base)[0])}" style="max-width:110px"><button data-ev-save="yes" type="button">Assign</button></div><p id="ev-mapping-status" class="elf-muted">All 23 referenced locations have a clickable default mapped anchor.</p><button data-ev-export type="button">Export Assignments JSON</button> <button data-ev-import type="button">Import Assignments JSON</button><input type="file" id="ev-assignments-file" accept="application/json,.json" hidden></details>`;}
function searchPanel(){
 const q=norm(query);
 const npcs=data.npcs.filter(n=>norm(n.name+' '+(n.job?.title||'')+' '+n.home+' '+n.job?.location).includes(q));
 const locs=data.npcReferencedPlaces.filter(l=>norm(l.name).includes(q));
 const entries=data.goodsAndServices.filter(g=>norm(g.item+' '+g.category+' '+g.price+' '+g.designatedLocation).includes(q));
 const potential=data.templateLocationTypes.filter(s=>norm(s).includes(q));
 if(tab==='npcs')return `<div class="elf-actions">${npcs.map(n=>npcButton(n,n.job?.title)).join('')||'No matches'}</div>`;
 if(tab==='locations')return `<p class="elf-muted">23 source places: all are connected to actual clickable building polygons. The assignments are scenario positions.</p><div class="elf-actions">${locs.map(l=>placeButton(l.name)).join('')||'No matches'}</div>`;
 if(tab==='goods')return `<p class="elf-muted">259 inventory/price examples, mapped to existing category-compatible building candidates. Not verified building inventory.</p><div class="elf-goods">${entries.map(g=>`<div class="elf-good"><span>${escape(g.item)} <small>· ${escape(g.category)} · ${escape(g.designatedLocation)}</small></span><b>${escape(g.price||'Unpriced')}</b><button type="button" data-ev-building="${data.roleLinks.vendorBuildingCandidates[g.designatedLocation]?.buildingId||1312}">Map candidate</button></div>`).join('')||'No matches'}</div>`;
 return `<p class="elf-muted">141 possible template location types, not 141 confirmed separate named businesses. Each type opens a location/category-compatible clickable map candidate.</p><div class="elf-actions">${potential.map(x=>`<button data-ev-building="${data.roleLinks.possibleTemplateLocationCandidates[x]?.buildingId||1312}" type="button">${escape(x)} ↗</button>`).join('')||'No matches'}</div>`;
}
function render(){
 const b=geo.get(Number(selectedBuilding)),n=byNpc.get(selectedNpc);
 mapPanel.innerHTML=`<h3>Living Elarvess · mapped NPCs and locations</h3>
 <p>15 named NPCs · 23 clickable source location references · 105 schedule entries · 90 relationship edges · 259 goods/services · 141 possible template categories.</p>
 <p class="elf-muted">${escape(cal?.display()||'Campaign clock unavailable')} · source 24-hour schedules displayed as proportional 21-hour simulation times.</p>
 <div class="elf-living-grid"><section class="elf-living-card"><h4>Building details</h4>${renderBuilding(b)}</section><section class="elf-living-card"><h4>NPC dossier</h4>${renderNpc(n)}</section></div>
 <h4>Search Elarvess data</h4><input type="search" id="ev-search" placeholder="Search residents, places, goods…" aria-label="Search Elarvess data" value="${escape(query)}">
 <div class="elf-actions elf-tabs">${[['npcs','NPCs'],['locations','Referenced Places'],['goods','Goods & Services'],['types','Possible Location Types']].map(([key,label])=>`<button type="button" data-ev-tab="${key}" aria-pressed="${tab===key}">${label}</button>`).join('')}</div>
 <div id="ev-search-results">${searchPanel()}</div>${locEditor()}`;
 const locationChoose=$('ev-location-choose');locationChoose.value=Object.keys(base)[0];
}
function focusBuilding(id){if(!geo.has(Number(id)))return;selectedBuilding=Number(id);map.selectBuilding(Number(id),true);render();}
function focusNpc(id){if(!byNpc.has(id))return;selectedNpc=id;const sel=$('worldNpcSelect');if(sel&&[...sel.options].some(o=>o.value===id)){sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}));}render();}
mapPanel.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.evBuilding){focusBuilding(Number(btn.dataset.evBuilding));return;}
 if(btn.dataset.evNpc){focusNpc(btn.dataset.evNpc);return;}
 if(btn.dataset.evTab){tab=btn.dataset.evTab;render();$('ev-search')?.focus();return;}
 if(btn.hasAttribute('data-ev-save')){
  const key=$('ev-location-choose').value,id=Number($('ev-building-choose').value),status=$('ev-mapping-status');
  if(!Object.hasOwn(base,key)||!geo.has(id)){status.textContent='Choose an existing location and original building ID (1–1312).';return;}
  overrides[key]=id;const saved=persist();render();$('ev-location-choose').value=key;$('ev-building-choose').value=id;
  $('ev-mapping-status').textContent=`Assigned ${key} to #${id}.${saved?' Saved in this browser.':' Export to keep this assignment.'}`;
  return;
 }
 if(btn.hasAttribute('data-ev-export')){
  const json={schema:'belavados.elarvess.locationAssignments.v2',settlementId:'aelvanyr-elarvess',overrides};
  const url=URL.createObjectURL(new Blob([JSON.stringify(json,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='elarvess_location_assignments.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
 }
 if(btn.hasAttribute('data-ev-import')){$('ev-assignments-file').click();}
});
mapPanel.addEventListener('input',e=>{if(e.target.id==='ev-search'){query=e.target.value;$('ev-search-results').innerHTML=searchPanel();}});
mapPanel.addEventListener('change',async e=>{
 if(e.target.id==='ev-location-choose'){$('ev-building-choose').value=chosen(e.target.value);return;}
 if(e.target.id!=='ev-assignments-file')return;
 try{
  const j=JSON.parse(await e.target.files[0].text());if(j.schema!=='belavados.elarvess.locationAssignments.v2'||j.settlementId!=='aelvanyr-elarvess'||!j.overrides||Array.isArray(j.overrides))throw Error('Wrong file format');
  const next={};for(const [k,v] of Object.entries(j.overrides)){if(!Object.hasOwn(base,k)||!geo.has(Number(v)))throw Error('Unknown location or building: '+k);next[k]=Number(v)}
  overrides={...overrides,...next};persist();render();$('ev-mapping-status').textContent=`Imported ${Object.keys(next).length} valid assignments.`;
 }catch(err){$('ev-mapping-status').textContent='Import failed: '+err.message;}
});
document.addEventListener('elarvess:building-selected',e=>{selectedBuilding=Number(e.detail?.id||0);render();});
document.addEventListener('aza-calendar:change',()=>{
  const field=$('ev-search');const focused=document.activeElement===field;
  // Preserve search focus during calendar updates; only refresh the time state and current-person annotations.
  if(!focused)render();
});
$('worldNpcSelect')?.addEventListener('change',e=>{if(byNpc.has(e.target.value)&&selectedNpc!==e.target.value){selectedNpc=e.target.value;render();}});
$('worldLocationSelect')?.addEventListener('change',e=>{
 if(window.BelavadosLivingWorld?.ui?.settlement?.id!=='aelvanyr-elarvess')return;
 const name=e.target.selectedOptions?.[0]?.textContent, id=chosen(name);if(id&&id!==selectedBuilding)focusBuilding(id);
});
window.ElarvessLiving={focusBuilding,focusNpc,linkedLocationId:chosen,roster:data.npcs,sourcePlaceNames:Object.keys(base)};
render();
})();
