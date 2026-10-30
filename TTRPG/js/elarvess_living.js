/* Elarvess v3: six-day living population, every existing building remains geometrically untouched. */
(()=>{
'use strict';
const population=window.ELARVESS_POPULATION,source=window.ELARVESS_ENRICHMENT,map=window.BelavadosElarvessMap,cal=window.AzaCalendar;
const $=id=>document.getElementById(id);
if(!population||!map||!$('bvs-elarvessMapInspector'))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase();
const byBuilding=new Map(population.buildings.map(s=>[s.id,s]));
const byNpc=new Map(population.npcs.map(n=>[n.id,n]));
let selectedBuilding=0, selectedNpc=population.npcs[0]?.id,searchTerm='',tab='people',page=0,day=cal?.getState()?.day||1;
const SIZE=48;
const roleMap=source?.roleLinks?.referencedLocationBuildingIds||{};
function weekDay(){return Math.max(1,Math.min(6,Number(cal?.getState()?.day||1)));}
function currentMinutes(){const s=cal?.getState();return ((s?.hour||0)*60)+(s?.minute||0);}
function daySlots(n,d=weekDay()){return n.weeklySchedule?.[d-1]||[];}
function currentPlace(n){const t=currentMinutes();return daySlots(n).find(s=>parseInt(s.start)*60+Number(s.start.slice(3))<=t && t<parseInt(s.end)*60+Number(s.end.slice(3)))||daySlots(n)[0];}
function bbtn(id,label,role){const b=byBuilding.get(Number(id));if(!b)return '';return `<button type="button" data-ep-building="${b.id}" title="${esc(b.address)}"><b>${esc(label||b.name)}</b><small>${esc(role||b.purpose)} · ${esc(b.address)}</small></button>`;}
function nbtn(id,role){const n=byNpc.get(id);if(!n)return '';return `<button type="button" data-ep-npc="${esc(id)}"><b>${esc(n.name)}</b><small>${esc(role||n.job?.title||'Resident')}</small></button>`;}
function sliceList(ids,role,max=32){const uniq=[...new Set(ids)],html=uniq.slice(0,max).map(id=>nbtn(id,role)).join('');return `<div class="elf-actions">${html||'<span class="elf-muted">None recorded</span>'}</div>${uniq.length>max?`<p class="elf-muted">Showing ${max} of ${uniq.length}. Search by NPC name to find everyone.</p>`:''}`;}
function onShiftAt(n,id){const t=currentMinutes();return daySlots(n).some(s=>s.buildingId===id && parseInt(s.start)*60+Number(s.start.slice(3))<=t && t<parseInt(s.end)*60+Number(s.end.slice(3)));}
function renderBuilding(b){if(!b)return '<p>Select any footprint on the original aligned map, or search a building name or address.</p>';
const people=[...new Set([...b.residentNpcIds,...b.employeeNpcIds,...b.visitorNpcIds])];const here=people.filter(id=>onShiftAt(byNpc.get(id),b.id));
return `<h4>${esc(b.name)} <small>· Map #${b.id}</small></h4>
<p><b>${esc(b.address)}</b></p><p>${esc(b.description)}</p>
<p><b>Type:</b> ${esc(b.type.toLowerCase())} · <b>Construction:</b> ${esc(b.material.toLowerCase().replaceAll('_',' '))}</p>
<p><b>Access:</b> ${esc(b.hours)}</p><p><b>Features:</b> ${esc(b.features.join(' · '))}</p>
<div class="elf-statline"><span>${b.residentNpcIds.length} residents</span><span>${b.employeeNpcIds.length} employees / students</span><span>${b.visitorNpcIds.length} weekly visitors</span><span>${here.length} present Day ${weekDay()} at ${esc(cal?.getState()?.time||'00:00')}</span></div>
<details open><summary>People here now (${here.length})</summary>${sliceList(here,'Currently present',30)}</details>
<details><summary>Residents (${b.residentNpcIds.length})</summary>${sliceList(b.residentNpcIds,'Lives here',45)}</details>
<details><summary>Workers and students (${b.employeeNpcIds.length})</summary>${sliceList(b.employeeNpcIds,'Works or attends here',45)}</details>
<details><summary>Unique weekly visitors (${b.visitorNpcIds.length})</summary>${sliceList(b.visitorNpcIds,'Visits during week',45)}</details>
<details><summary>Goods and services (${b.goodsAndServices.length})</summary>${b.goodsAndServices.length?b.goodsAndServices.map(g=>`<div class="elf-good"><span>${esc(g.item)}<small>${esc(g.category)}</small></span><b>${esc(g.price||'Price unspecified')}</b></div>`).join(''):'<p>This residence has no public goods catalogue.</p>'}</details>
<p class="elf-muted">Building address, occupants, and business details are generated scenario information. The original GeoJSON image position and hit polygon have not changed.</p>`;}
function renderSchedule(n){return `<div class="elf-day-select">${[1,2,3,4,5,6].map(d=>`<button type="button" data-ep-day="${d}" aria-pressed="${day===d}">Day ${d}</button>`).join('')}</div>`+
(daySlots(n,day)).map(slot=>`<div class="elf-schedule"><b>${esc(slot.start)}–${esc(slot.end)}</b><span>${esc(slot.activity)}</span>${bbtn(slot.buildingId,null,'Go to scheduled location')}</div>`).join('');}
function renderNpc(n){if(!n)return '<p>Select an NPC to view their life and schedule.</p>';
const cat=['familial','romantic','personal','professional'], allSites=[...new Set([n.homeBuildingId,n.workBuildingId,...n.regularVisits])];const current=currentPlace(n);
return `<h4>${esc(n.name)} <small>· ${esc(n.race?.name)} · Age ${n.age} · ${esc(n.genderIdentity||'Identity not recorded')} · ${esc(n.pronouns)} · ${esc(n.preferredHonorific==='none'?'No honorific':n.preferredHonorific||'')}</small></h4>
<p class="elf-muted"><b>Address and endearment suggestions:</b> ${esc(n.formalHonorific||n.preferredHonorific||'None')} · ${esc(n.respectfulAddress||'')} · ${esc(n.everydayTitle||'')} · ${esc(n.platonicEndearment||'')}${n.romanticEndearment?' · '+esc(n.romanticEndearment):''}</p><details><summary>Pronoun forms and family-language options</summary><p>${esc(Object.values(n.pronounForms||{}).join(' / '))}</p><p>${esc(Object.entries(n.kinshipTerms||{}).map(([k,v])=>k+': '+v).join(' · '))}</p><p class="elf-muted">Suggested terms; each NPC's chosen forms may be edited independently. Romantic endearments are off by default.</p></details>
<p><b>Deity affiliation:</b> ${esc((n.deityAffiliations||[]).join(', ')||'None recorded')}</p><p><b>${esc(n.job.title)}</b> · ${esc(n.aspiration||'')}</p><p>${esc((n.traits||[]).join(' · '))}</p>
<p><b>Residence:</b> ${esc(n.homeAddress)} · <b>Work/school:</b> ${esc(n.workAddress)}</p>
<div class="elf-actions">${bbtn(n.homeBuildingId,null,'Residence')}${bbtn(n.workBuildingId,null,n.job.title)}${current?bbtn(current.buildingId,null,'Current scheduled location'):''}</div>
<p><b>Work or school days:</b> ${n.workDays.map(x=>'Day '+x).join(' · ')}</p>
<details><summary>Regular destinations (${allSites.length} buildings)</summary><div class="elf-actions">${allSites.map(id=>bbtn(id)).join('')}</div></details>
<details open><summary>Relationships, agreements, and family history</summary><p><b>Current romantic status:</b> ${esc(n.romance?.currentStatus||'single')} · <b>Current partners:</b> ${(n.romance?.currentPartnerIds||[]).length} · <b>Agreements:</b> ${esc((n.romance?.styles||[]).join(', ')||'None')}</p><p class="elf-muted">Current relationships are modeled as consensual. Former partners and deceased spouses are recorded separately; none count as a current attachment.</p><div class="elf-actions">${(n.romance?.currentPartnerIds||[]).map(id=>nbtn(id,'Current partner')).join('')}</div><h5>Former partners and bereavement</h5><div class="elf-actions">${(n.relationshipHistory||[]).map(h=>h.npcId?nbtn(h.npcId,h.type):`<span class="elf-muted">${esc(h.name)} · ${esc(h.type)} (memorial)</span>`).join('')||'<p>No history recorded</p>'}</div><h5>Parent and co-parent network</h5><div class="elf-actions">${(n.familyConnections?.parentIds||[]).map(id=>nbtn(id,'Parent')).concat((n.familyConnections?.childIds||[]).map(id=>nbtn(id,'Child')),(n.familyConnections?.halfSiblingIds||[]).map(id=>nbtn(id,'Half sibling')),(n.familyConnections?.stepParentIds||[]).map(id=>nbtn(id,'Step-parent'))).join('')||'<p>No parent/child links recorded</p>'}</div></details>
<h5>Six-day schedule · 21 hours per day</h5>${renderSchedule(n)}
<h5>Relationships (${n.relationshipCount})</h5>${cat.map(k=>`<details><summary>${k[0].toUpperCase()+k.slice(1)} (${(n.relationships?.[k]||[]).length})</summary><div class="elf-actions">${(n.relationships?.[k]||[]).slice(0,80).map(r=>nbtn(r.npcId,r.type)).join('')||'None recorded'}</div></details>`).join('')}
${n.sourceSchedule?`<details><summary>Original attached NPC schedule (${n.sourceSchedule.length} blocks)</summary><p class="elf-muted">Historical timetable values kept for reference under canonical building names; the six-day timetable above is a new simulation routine.</p>${n.sourceSchedule.map(s=>`<p>${esc(s.start)}–${esc(s.end)} · ${esc(s.activity)} · ${esc(s.location)}</p>`).join('')}</details>`:''}`;}
function results(){const q=norm(searchTerm);let items=[];
if(tab==='people')items=population.npcs.filter(n=>norm(n.name+' '+n.job.title+' '+n.race.name+' '+n.homeAddress+' '+n.workAddress).includes(q));
else if(tab==='buildings')items=population.buildings.filter(b=>norm(b.name+' '+b.address+' '+b.type+' '+b.purpose).includes(q));
else if(tab==='visits')items=population.npcs.filter(n=>norm(n.name+' '+n.regularVisits.map(id=>byBuilding.get(id)?.name||'').join(' ')).includes(q));
else items=population.buildings.filter(b=>b.goodsAndServices.some(g=>norm(g.item+' '+g.category).includes(q)) || norm(b.name).includes(q));
const count=items.length,max=Math.ceil(count/SIZE);page=Math.min(page,Math.max(0,max-1));const chunk=items.slice(page*SIZE,(page+1)*SIZE);
const rows=(tab==='people'||tab==='visits')?chunk.map(n=>nbtn(n.id,`${n.job.title} · ${byBuilding.get(n.homeBuildingId).ward}`)).join(''):chunk.map(b=>bbtn(b.id,b.name,`${b.purpose} · ${b.address}`)).join('');
return `<div class="elf-search-meta">${count.toLocaleString()} result${count===1?'':'s'} · Page ${page+1} of ${Math.max(1,max)}</div><div class="elf-actions">${rows||'<span class="elf-muted">No matching records</span>'}</div><div class="elf-line"><button type="button" data-ep-page="prev" ${page<=0?'disabled':''}>Previous</button><button type="button" data-ep-page="next" ${page+1>=max?'disabled':''}>Next</button></div>`;
}
const panel=document.createElement('section');panel.id='bvs-elarvessLivingPanel';panel.className='elarvess-living';$('bvs-elarvessMapInspector').append(panel);
function render(){const b=byBuilding.get(selectedBuilding),n=byNpc.get(selectedNpc);panel.innerHTML=`
<h3>Elarvess · Living settlement directory</h3>
<p><b>${population.npcCount.toLocaleString()} unique NPCs</b> · <b>${population.buildingCount.toLocaleString()} addressed clickable buildings</b> · 6 Aza’raan days · 21 hours per day. Every NPC has a residence, work/school, and weekly visit destinations. At least 60% have current consensual romantic attachments, including plural unions and co-parent families.</p>
<p class="elf-muted">${esc(cal?.display()||'Year 1 · Month 1 · Week 1 · Day 1')} · generated place assignments are scenario lore, not historical map survey data.</p>
<div class="elf-living-grid"><section class="elf-living-card"><h4>Selected building</h4>${renderBuilding(b)}</section><section class="elf-living-card"><h4>Selected NPC</h4>${renderNpc(n)}</section></div>
<h4>Search town population, addresses, and venues</h4><input id="bvs-ev-search" type="search" value="${esc(searchTerm)}" placeholder="Name, street, business, profession, species, service…">
<div class="elf-actions elf-tabs">${[['people','NPC directory'],['buildings','All 1,312 buildings'],['visits','Visitor network'],['goods','Goods & services']].map(([t,l])=>`<button type="button" data-ep-tab="${t}" aria-pressed="${t===tab}">${l}</button>`).join('')}</div>
<div id="bvs-ev-search-results">${results()}</div>
<details><summary>15 founding NPC profiles and mapped source sites</summary><p>Founding NPC profiles, relationships, and historical timetable values are included with destinations fully renamed to the canonical buildings. The six-day schedules are active for simulation.</p><div class="elf-actions">${source?.npcs?.map(n=>nbtn(n.id,'Founding roster')).join('')||''}</div><div class="elf-actions">${Object.entries(roleMap).map(([name,id])=>bbtn(id,null,'Canonical site')).join('')}</div></details>
<div class="elf-actions"><button type="button" data-ep-export="npcs">Export all NPCs JSON</button><button type="button" data-ep-export="buildings">Export building address book JSON</button></div>`;}
function focusNpc(id){if(!byNpc.has(id))return;selectedNpc=id;const sel=$('bvs-worldNpcSelect');if(sel&&[...sel.options].some(o=>o.value===id)&&sel.value!==id){sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}));}render();}
function focusBuilding(id){const bid=Number(id);if(!byBuilding.has(bid))return;selectedBuilding=bid;map.selectBuilding(bid,true);/* selected event renders */}
function download(filename,object){const u=URL.createObjectURL(new Blob([JSON.stringify(object,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);}
panel.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;
if(el.dataset.epBuilding){focusBuilding(el.dataset.epBuilding);return;}
if(el.dataset.epNpc){focusNpc(el.dataset.epNpc);return;}
if(el.dataset.epDay){day=Number(el.dataset.epDay);render();return;}
if(el.dataset.epTab){tab=el.dataset.epTab;page=0;render();$('bvs-ev-search')?.focus();return;}
if(el.dataset.epPage){page+=el.dataset.epPage==='next'?1:-1;render();return;}
if(el.dataset.epExport){download(el.dataset.epExport==='npcs'?'elarvess_2016_npcs.json':'elarvess_1312_buildings.json',el.dataset.epExport==='npcs'?population.npcs:population.buildings);}
});
panel.addEventListener('input',e=>{if(e.target.id==='bvs-ev-search'){searchTerm=e.target.value;page=0;$('bvs-ev-search-results').innerHTML=results();}});
document.addEventListener('elarvess:building-selected',e=>{selectedBuilding=Number(e.detail?.id||0);render();});
let lastClock='';document.addEventListener('aza-calendar:change',()=>{const s=cal?.getState();const t=s?.day+'-'+s?.hour;if(t===lastClock)return;lastClock=t;day=weekDay();if(document.activeElement?.id!=='bvs-ev-search')render();});
$('bvs-worldNpcSelect')?.addEventListener('change',e=>{if(byNpc.has(e.target.value) && selectedNpc!==e.target.value){selectedNpc=e.target.value;render();}});
window.ElarvessLiving={focusBuilding,focusNpc,linkedLocationId:name=>roleMap[name],roster:population.npcs,sourcePlaceNames:Object.keys(roleMap),getBuilding:id=>byBuilding.get(Number(id)),getNpc:id=>byNpc.get(id),getPresent:(id,d=weekDay(),hour=cal?.getState()?.hour||0)=>{const b=byBuilding.get(Number(id));return b?[...new Set([...b.residentNpcIds,...b.employeeNpcIds,...b.visitorNpcIds])].filter(pid=>byNpc.get(pid)?.weeklySchedule[d-1].some(s=>s.buildingId===b.id && Number(s.start.slice(0,2))<=hour&&hour<Number(s.end.slice(0,2)))):[];}};
render();
})();
