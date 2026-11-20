/* Province/settlement template dashboard.
 * All populated names, locations, services, NPCs, schedules and ties come from
 * the previously integrated BELAVADOS_WORLD records; no canon is regenerated.
 */
(() => {
'use strict';
const world=window.BELAVADOS_WORLD;
if(!world || !window.BelavadosLivingWorld) {console.error('Template dashboard requires integrated world_app.js');return;}
const app=window.BelavadosLivingWorld, ui=app.ui;
const $=id=>document.getElementById(id);
const enc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase();
const covenant=window.AzaraCovenant;const axes=(covenant?.axes||['altruism','lawfulness','cooperation','honor']).map(x=>x[0].toUpperCase()+x.slice(1));
const bySettlement=new Map(), byId=new Map();
for(const n of world.npcs){byId.set(n.id,n);if(!bySettlement.has(n.settlementId))bySettlement.set(n.settlementId,[]);bySettlement.get(n.settlementId).push(n);}
const localKey='belavados.settlementTemplate.preferences.v2';
let local={};try{local=JSON.parse(localStorage.getItem(localKey)||'{}')||{};}catch{local={};}
let currentSettlement=null,selectedNpc=null,selectedLocation=null,listMode='npcs';
function prefs(){return local[ui.settlement?.id]||{};}
let livingCacheDay=0,livingCacheRecords=null,livingCachePlaces=null;
function livingRecords(){
 const data=window.ELARVESS_POPULATION;if(!data)return [];
 const day=Math.max(1,Math.min(6,window.AzaCalendar?.getState()?.day||1));
 if(livingCacheDay!==day||!livingCacheRecords){
  livingCacheDay=day;livingCachePlaces=null;
  const names=new Map(data.buildings.map(b=>[b.id,b.name]));
  livingCacheRecords=data.npcs.map(n=>({...n,home:names.get(n.homeBuildingId),job:{...n.job,location:names.get(n.workBuildingId)},schedule:n.weeklySchedule[day-1]}));
 }
 return livingCacheRecords;
}
function getGeneratedMap(){const m=window.BelavadosLivingMaps?.getCurrent?.();return m?.settlementId===ui.settlement?.id?m:null;}
let livePlacesKey=null,livePlacesCache=null;
function records(){if(!ui.settlement)return [];const live=getGeneratedMap();if(live){const original=bySettlement.get(ui.settlement.id)||[],canon=new Map(original.map(n=>[n.id,n]));return live.npcs.map(n=>{const base=canon.get(n.id)||{};return {...base,...n, schedule:base.schedule||n.weeklySchedule?.[0]?.map(b=>({...b,location:b.location,days:'six-day cycle'}))||[]};});}if(ui.settlement.id==='aelvanyr-elarvess'&&window.ELARVESS_POPULATION)return livingRecords();const original=bySettlement.get(ui.settlement.id)||[], extra=(window.LifeSimulator?.state?.npcs||[]).filter(n=>(n.settlementId||n.assignment?.settlementId)===ui.settlement.id);const ids=new Set(original.map(n=>n.id));return [...original,...extra.filter(n=>!ids.has(n.id))];}
function template(){return world.templates[ui.settlement?.immersiveTemplateId]||null;}
function services(){return template()?.inventory||[];}
function getPlaces(){
 const live=getGeneratedMap();if(live){
  if(livePlacesKey===live&&livePlacesCache)return livePlacesCache;
  const people=new Map(records().map(n=>[n.id,n]));
  livePlacesCache=live.buildings.map(b=>({name:b.name,address:b.address,buildingId:b.id,description:b.description,sources:new Set([b.purpose,'clickable physical footprint',...(b.originalLocationSources||[])]),residents:(b.residentNpcIds||[]).map(id=>people.get(id)).filter(Boolean),employees:(b.employeeNpcIds||[]).map(id=>people.get(id)).filter(Boolean),visitors:(b.visitorNpcIds||[]).map(id=>people.get(id)).filter(Boolean),catalog:(b.goodsAndServices||[]).map(x=>({...x,location:b.name}))}));
  livePlacesKey=live;return livePlacesCache;
 }
 if(ui.settlement?.id==='aelvanyr-elarvess'&&window.ELARVESS_POPULATION){
  const n=livingRecords();if(livingCachePlaces)return livingCachePlaces;
  const db=new Map(n.map(n=>[n.id,n]));
  livingCachePlaces=window.ELARVESS_POPULATION.buildings.map(b=>({name:b.name,address:b.address,buildingId:b.id,description:b.description,sources:new Set([b.purpose,'clickable map footprint']),residents:b.residentNpcIds.map(id=>db.get(id)).filter(Boolean),employees:b.employeeNpcIds.map(id=>db.get(id)).filter(Boolean),visitors:b.visitorNpcIds.map(id=>db.get(id)).filter(Boolean),catalog:b.goodsAndServices.map(row=>({...row,location:b.name}))}));
  return livingCachePlaces;
 }
 const n=records(),t=template();const byLabel=new Map();
 const add=(name,source)=>{name=String(name??'').trim();if(!name || /^undefined|null$/i.test(name) || /^\d[\d,.]*(?:\s*(?:cp|sp|gp|pp|platinum|copper|silver|gold))\b/i.test(name) || /^[-+]?\d+(?:\.\d+)?$/.test(name))return;const key=norm(name);if(!byLabel.has(key))byLabel.set(key,{name,sources:new Set(),residents:[],employees:[],visitors:[],catalog:[]});byLabel.get(key).sources.add(source);};
 for(const p of services()){add(p.location,'service catalogue');}
 for(const person of n){add(person.home||person.assignedLocations?.home?.name,'home');add(person.job?.location||person.workLocationName,'work');for(const x of (person.schedule||person.schedules||[]))add(x.location?.name||x.location||x.locationName,'schedule');}
 for(const person of n){const locs=[['residents',person.home||person.assignedLocations?.home?.name],['employees',person.job?.location||person.workLocationName]];for(const x of person.schedule||person.schedules||[])locs.push(['visitors',x.location?.name||x.location||x.locationName]);for(const [kind,name] of locs){const obj=byLabel.get(norm(name));if(obj&&!obj[kind].some(v=>v.id===person.id))obj[kind].push(person);}}
 for(const row of services()){const obj=byLabel.get(norm(row.location));if(obj)obj.catalog.push(row);}
 return [...byLabel.values()].sort((a,b)=>{const priority=x=>(x.employees.length*4+x.visitors.length*2+x.residents.length);return priority(b)-priority(a)||a.name.localeCompare(b.name)});}
function ensurePrefs(){if(!ui.settlement)return {};return local[ui.settlement.id]||(local[ui.settlement.id]={});}
function persist(){try{localStorage.setItem(localKey,JSON.stringify(local));return true;}catch(e){$('bvs-worldSaveStatus').textContent='Browser storage unavailable. Export JSON to keep your changes.';return false;}}
function updateInput(id,val){const e=$(id);if(e)e.value=val==null?'':String(val);}
function dangerValue(s){return prefs().dangerLevel||s?.dangerLevel||s?.dangerProfile||'Moderate';}
function renderAxes(containerId,values,onChange){const container=$(containerId);if(!container)return;
 const scores=covenant?covenant.normalizeScores(values):Object.fromEntries(axes.map(a=>[a.toLowerCase(),Number(values?.[a.toLowerCase()]??1500)]));
 const profile=covenant?.resolve(scores);
 container.innerHTML=(profile?'<div class="aza-axis-profile"><strong>'+enc(profile.profileName)+'</strong><small>'+enc(profile.profileId)+' · 8 axes · 5 phases</small></div>':'')+
 axes.map(axis=>{const key=axis.toLowerCase(),v=scores[key],meta=covenant?.reference.axes.find(a=>a.id===key),phase=covenant?covenant.band(v).toLowerCase().replaceAll('_',' '):(v===1500?'Pivot':v<1500?'Low':'High');
 return '<label class="aza-axis-slider"><span>'+enc(axis)+'</span><input type="range" data-axis="'+key+'" min="0" max="3000" step="1" value="'+v+'"><div class="axis-readout"><em class="axis-phase">'+enc(phase)+'</em><b class="axis-value">'+v+'</b></div>'+(meta?'<small class="aza-axis-ends">'+enc(meta.low)+' ↔ '+enc(meta.high)+'</small>':'')+'</label>';}).join('');
 container.querySelectorAll('[data-axis]').forEach(input=>input.addEventListener('input',()=>{const row=input.closest('label'),value=Number(input.value);row.querySelector('.axis-value').textContent=value;row.querySelector('.axis-phase').textContent=covenant?covenant.band(value).toLowerCase().replaceAll('_',' '):(value===1500?'Pivot':value<1500?'Low':'High');const title=container.querySelector('.aza-axis-profile');if(title&&covenant){const resolved=covenant.resolve(getAxisValues(containerId));title.querySelector('strong').textContent=resolved.profileName;title.querySelector('small').textContent=resolved.profileId+' · 8 axes · 5 phases';}onChange?.();}));
}
function getAxisValues(id){return Object.fromEntries([...$(id).querySelectorAll('[data-axis]')].map(x=>[x.dataset.axis,Number(x.value)]));}
function updatePreferenceJson(){if(!ui.settlement)return;const data={schema:'belavados-template-alignment.v3',provinceId:ui.province?.id,provinceAxes:ui.province?getAxisValues('bvs-worldProvinceAxes'):null,settlementId:ui.settlement.id,settlementName:ui.settlement.name,settlementAxes:getAxisValues('bvs-worldSettlementAxes'),npcId:selectedNpc,npcAxes:selectedNpc?getAxisValues('bvs-worldNpcAxes'):null};$('bvs-worldAlignmentJson').value=JSON.stringify(data,null,2);}
function updateNpcAxis(){const npc=records().find(n=>n.id===selectedNpc),v=prefs().npcAxes?.[npc?.id]||(npc&&covenant?.get('npc',npc.id,npc).scores);renderAxes('bvs-worldNpcAxes',v,updatePreferenceJson);$('bvs-worldSaveNpcAlignment').disabled=!npc;$('bvs-worldNpcAlignmentNote').textContent=v?`Locally saved scores for ${npc.name}.`:'No source NPC alignment was specified. Sliders begin neutral; click Save NPC Alignment to create local values.';updatePreferenceJson();}
function synced(){const s=ui.settlement,p=ui.province;if(!p)return;const changed=currentSettlement!==s?.id;currentSettlement=s?.id||null;
 updateInput('bvs-worldProvinceName',p.name);updateInput('bvs-worldSettlementName',s?.name||'No settlements in source');
 updateInput('bvs-worldGovernment',prefs().governmentType??s?.governmentType??p.governmentType??'');
 updateInput('bvs-worldTags',prefs().tags??(s?.tags||[]).join(', '));updateInput('bvs-worldDeities',prefs().deities??'');updateInput('bvs-worldNotes',prefs().notes??'');
 updateInput('bvs-worldSettlementSize',s?.size||s?.type||'');updateInput('bvs-worldSettlementBiome',s?.biome||'');updateInput('bvs-worldResidentCount',records().length);
 updateInput('bvs-worldLocationCount',services().length);
 updateInput('bvs-worldPopulation',prefs().population??'');updateInput('bvs-worldSquareMiles',prefs().squareMiles??'');updateInput('bvs-worldSquareKm',prefs().squareKm??'');
 $('bvs-worldDanger').value=dangerValue(s);$('bvs-worldApprovedRace').disabled=!s;$('bvs-worldSaveFields').disabled=!s;
 if(changed){selectedNpc=records()[0]?.id||null;selectedLocation=null;$('bvs-worldSaveStatus').textContent='';}
 renderAxes('bvs-worldSettlementAxes',prefs().settlementAxes||(s&&covenant?.get('settlement',s.id,s).scores),updatePreferenceJson);renderAxes('bvs-worldProvinceAxes',p&&covenant?.get('province',p.id,p).scores,updatePreferenceJson);renderMap();renderLocationSelector();renderNpcSelector();renderList();updatePreview();refreshClock();updateNpcAxis();
 $('bvs-mapStatus').textContent=s?`${p.settlements.length} named settlement${p.settlements.length===1?'':'s'} • ${p.name}`:`${p.name} • Province only`;
 $('bvs-worldMapHint').textContent=s?`Click any marker to open its settlement. Selected: ${s.name}.`:'This province has no source-named settlements.';
 $('bvs-generatorStatus').textContent=`${records().length} existing named NPCs and ${services().length} original catalog entries. Generation is optional; no initial reroll.`;
}
function renderMap(){const out=$('bvs-worldMapCanvas'),p=ui.province;if(!p)return;const settlements=p.settlements||[];if(!settlements.length){out.innerHTML=`<div class="world-map-empty"><h3>${enc(p.name)}</h3><p>Named province, but no named settlements in the supplied map data. Nothing invented.</p></div>`;return;}
 const pts=settlements.map((s,i)=>({s,i,lon:Number(s.coordinates?.longitude??s.centerLongitude??p.center?.longitude??0),lat:Number(s.coordinates?.latitude??s.centerLatitude??p.center?.latitude??0)}));let minx=Math.min(...pts.map(v=>v.lon)),maxx=Math.max(...pts.map(v=>v.lon)),miny=Math.min(...pts.map(v=>v.lat)),maxy=Math.max(...pts.map(v=>v.lat));const same=maxx-minx<.0001&&maxy-miny<.0001;
 out.innerHTML=pts.map(v=>{const x=same?50+37*Math.cos(v.i*2*Math.PI/pts.length):10+80*(v.lon-minx)/(maxx-minx||1);const y=same?49+34*Math.sin(v.i*2*Math.PI/pts.length):11+75*(maxy-v.lat)/(maxy-miny||1);return `<button type="button" class="world-pin ${v.s.id===ui.settlement?.id?'active':''}" data-world-settlement="${enc(v.s.id)}" title="Open ${enc(v.s.name)}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"><span class="pin-dot"></span><span class="pin-label">${enc(v.s.name)}</span></button>`;}).join('');}
function placeKey(p){return p?.buildingId!=null?'id:'+String(p.buildingId):'name:'+String(p?.name||'');}
function renderLocationSelector(){const places=getPlaces(),sel=$('bvs-worldLocationSelect');
 sel.innerHTML=places.map((x,i)=>'<option value="'+i+'">'+enc(x.name)+(x.address?' — '+enc(x.address):'')+'</option>').join('');sel.disabled=!places.length;
 const index=places.findIndex(x=>placeKey(x)===selectedLocation);sel.value=String(index<0?0:index);selectedLocation=places[Number(sel.value)]?placeKey(places[Number(sel.value)]):null;renderLocationDetail();
}
function renderLocationDetail(){
 const place=getPlaces().find(x=>placeKey(x)===selectedLocation);
 if(!place){$('bvs-worldLocationInfo').innerHTML='<p class="muted">No mapped location selected.</p>';$('bvs-worldLocationNpcs').innerHTML='';return;}
 const clock=window.AzaCalendar?.getState(),day=Math.max(1,Math.min(6,Number(clock?.day||1))),now=(Number(clock?.hour||0)*60)+Number(clock?.minute||0);
 const minutes=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d\d)/);return m?Number(m[1])*60+Number(m[2]):NaN;};
 const associated=[...new Map([...place.residents,...place.employees,...place.visitors].filter(Boolean).map(n=>[String(n.id),n])).values()];
 const presence=n=>{
  const schedule=n.weeklySchedule?.[day-1];
  if(Array.isArray(schedule)&&schedule.length&&place.buildingId!=null)return schedule.some(slot=>String(slot.buildingId)===String(place.buildingId)&&minutes(slot.start)<=now&&now<minutes(slot.end));
  const events=n.schedule||n.schedules||[];
  return events.some(slot=>{const location=slot.location?.name||slot.location||slot.locationName||'',rawStart=slot.start||slot.startTime,rawEnd=slot.end||slot.endTime;
    const convert=t=>window.AzaCalendar?.source24?.(t)||t;const start=minutes(convert(rawStart)),end=minutes(convert(rawEnd));
    return norm(location)===norm(place.name)&&Number.isFinite(start)&&Number.isFinite(end)&&now>=start&&now<end;
  });
 };
 const here=associated.filter(presence),good=place.catalog||[];
 const price=row=>{let p=row.price??row.priceLabel??row.cost;if(p==null)return 'Price not recorded';if(typeof p==='object')return Object.entries(p).map(([unit,amount])=>amount+' '+unit).join(' · ');return String(p);};
 const catalogue='<details open class="aza-location-catalog"><summary>Goods and services ('+good.length+')</summary>'+
  (good.length?'<div class="aza-price-list">'+good.map(row=>'<div><strong>'+enc(row.item||row.name||row.service||'Service')+'</strong><span>'+enc(price(row))+'</span><small>'+enc(row.category||row.type||'')+(row.notes?' · '+enc(row.notes):'')+'</small></div>').join('')+'</div>':'<p>No publicly priced goods or services recorded.</p>')+'</details>';
 $('bvs-worldLocationInfo').innerHTML='<h3>'+enc(place.name)+'</h3>'+(place.address?'<p><b>Address:</b> '+enc(place.address)+'</p>':'')+(place.description?'<p>'+enc(place.description)+'</p>':'')+
 '<p>'+enc([...place.sources].join(' · '))+'</p><div class="pill-row"><span class="pill">'+here.length+' here now · Day '+day+' '+enc(clock?.time||'')+'</span><span class="pill">'+place.residents.length+' residents</span><span class="pill">'+place.employees.length+' workers</span><span class="pill">'+place.visitors.length+' scheduled visitors</span></div>'+
 '<h4>People currently inside</h4><div class="aza-location-people">'+(here.map(n=>'<button type="button" data-world-npc="'+enc(n.id)+'">'+enc(n.name)+' <small>· '+enc(n.job?.title||'Resident')+'</small></button>').join('')||'<p>No known NPC is scheduled inside at this time.</p>')+'</div>'+
 catalogue+(covenant?'<details class="aza-location-ethos"><summary>Institutional Covenant</summary>'+covenant.render('location',(ui.settlement?.id||'')+':'+placeKey(place),place)+'</details>':'');
 const linked=new Map();
 for(const [role,people] of [['Resident',place.residents],['Employee',place.employees],['Weekly visitor',place.visitors]])for(const n of people){if(!n?.id)continue;if(!linked.has(n.id))linked.set(n.id,{n,roles:[]});linked.get(n.id).roles.push(role);}
 $('bvs-worldLocationNpcs').innerHTML=[...linked.values()].map(({n,roles})=>'<button class="ghost" type="button" data-world-npc="'+enc(n.id)+'">'+enc(n.name)+' <small>· '+enc(roles.join(', '))+'</small></button>').join('')||'<p class="muted">No named occupants are linked to this building.</p>';
}
function renderNpcSelector(){const list=records(),sel=$('bvs-worldNpcSelect');sel.innerHTML=list.map(x=>`<option value="${enc(x.id)}">${enc(x.name)} • ${enc(x.job?.title||'Resident')}</option>`).join('');sel.disabled=!list.length;if(!list.find(n=>n.id===selectedNpc))selectedNpc=list[0]?.id||null;sel.value=selectedNpc||'';renderNpcDetail();}
function renderNpcDetail(){const n=records().find(x=>x.id===selectedNpc);if(!n){$('bvs-worldNpcInfo').innerHTML='<p class="muted">No named residents in this province.</p>';return;}
 const rel=n.relationships||{}, counts=Object.entries(rel).map(([key,val])=>`${val.length} ${key}`),sch=(n.schedule||n.schedules||[]);
 $('bvs-worldNpcInfo').innerHTML=`<h3>${enc(n.name)}</h3><p class="subtle">${enc(n.formalHonorific||n.preferredHonorific||'')} · ${enc(n.respectfulAddress||'')} · ${enc(n.everydayTitle||'')} · ${enc(n.platonicEndearment||'')}</p><p>${enc(n.race?.name||n.race)} · ${enc(n.age||'Age unknown')} years · ${enc(n.genderIdentity||'Identity not recorded')} · ${enc(n.pronouns||'')} · ${enc(n.preferredHonorific==='none'?'No honorific':n.preferredHonorific||'')} · ${enc(n.everydayTitle||'')}</p><details><summary>Complete pronoun forms, kinship and terms</summary><p>${enc(Object.values(n.pronounForms||{}).join(' / '))}</p><p>${enc(Object.entries(n.kinshipTerms||{}).map(([k,v])=>k+': '+v).join(' · '))}</p><p class="subtle">All terms are NPC language suggestions; romantic endearments require explicit setting.</p></details><p><b>Profession:</b> ${enc(n.job?.title||n.workplaceRole||'Unspecified')} • ${enc(n.job?.location||n.workLocationName||'')}</p><p><b>Home:</b> ${enc(n.home||n.homeLocationName||'')}</p><p><b>Deity affiliation:</b> ${enc((n.deityAffiliations||[]).join(', ')||'None recorded')}</p><p><b>Personal goal:</b> ${enc(n.aspiration||'Not recorded')}</p><div class="pill-row">${counts.map(x=>`<span class="pill">${enc(x)}</span>`).join('')}</div><p><b>Daily schedule:</b> ${sch.length} blocks</p><div class="button-row"><button type="button" data-world-open="relationships">View Relationships</button><button class="ghost" type="button" data-world-open="schedules">View Schedule</button></div>`;
 $('bvs-worldNpcInfo').insertAdjacentHTML('beforeend',covenant?covenant.render('npc',n.id,n):'');updateNpcAxis();}
function renderList(){const out=$('bvs-worldGeneratedList'),n=records(),p=getPlaces();let html='';if(listMode==='locations'){html=p.slice(0,90).map(x=>`<article class="generated-card"><h4>${enc(x.name)}</h4><p>${x.residents.length} residents · ${x.employees.length} employees · ${x.visitors.length} visitors · ${x.catalog.length} items</p><button type="button" class="ghost" data-world-location="${enc(x.name)}">Inspect Location</button></article>`).join('');if(p.length>90)html+=`<p class="muted">First 90 of ${p.length} locations. All locations remain available in the location selector.</p>`;}
 else if(listMode==='relationships'){html=n.flatMap(v=>Object.entries(v.relationships||{}).flatMap(([kind,ties])=>(ties||[]).map(r=>({v,kind,r})))).slice(0,130).map(x=>`<article class="generated-card"><h4>${enc(x.v.name)} → ${enc(x.r.name)}</h4><p>${enc(x.kind)} · ${enc(x.r.type)}</p><button type="button" class="ghost" data-world-npc="${enc(x.v.id)}">View Person</button></article>`).join('');}
 else {html=n.slice(0,90).map(x=>`<article class="generated-card"><h4>${enc(x.name)}</h4><p>${enc(x.race?.name||x.race)} · ${enc(x.job?.title||'Resident')}</p><p>${enc(x.home||'No home listed')}</p><button type="button" class="ghost" data-world-npc="${enc(x.id)}">Inspect Resident</button></article>`).join('');if(n.length>90)html+=`<p class="muted">First 90 of ${n.length} residents. All are available in the NPC Browser and Residents tab.</p>`;}
 out.innerHTML=html||'<p class="muted">No matching records in this province.</p>';}
function updatePreview(){const p=ui.province,s=ui.settlement,pref=prefs();$('bvs-previewProvince').textContent=p?.name||'—';$('bvs-previewSettlement').textContent=s?.name||'No named settlements';$('bvs-previewGovernment').textContent=pref.governmentType??s?.governmentType??p?.governmentType??'—';$('bvs-previewPopulation').textContent=String(records().length)+' named residents';$('bvs-previewDanger').textContent=s?dangerValue(s):'—';$('bvs-previewGenerated').textContent=`${getPlaces().length} places / ${services().length} catalog entries`;}
function formatTime(d,tz){try{return new Intl.DateTimeFormat('en-US',{timeZone:tz,dateStyle:'medium',timeStyle:'short'}).format(d);}catch{return d.toLocaleString();}}
function refreshClock(){const now=new Date(),off=(ui.settlement?.timeZone||ui.province?.primaryUtc||'UTC+0').match(/UTC\s*([+-])(\d{1,2})(?::(\d\d))?/i);const minutes=off?(off[1]==='-'?-1:1)*(Number(off[2])*60+Number(off[3]||0)):0;
 const there=new Date(now.getTime()+minutes*60000);$('bvs-worldPlayerClock').textContent=formatTime(now,undefined);$('bvs-worldDmClock').textContent=formatTime(now,'America/New_York');$('bvs-worldBelavadosClock').textContent=there.getUTCFullYear()+'-'+String(there.getUTCMonth()+1).padStart(2,'0')+'-'+String(there.getUTCDate()).padStart(2,'0')+' '+String(there.getUTCHours()).padStart(2,'0')+':'+String(there.getUTCMinutes()).padStart(2,'0');$('bvs-worldClockSource').textContent=(ui.settlement?.timeZone||ui.province?.primaryUtc||'UTC+0')+' • Legacy Earth timezone reference';if(window.AzaCalendar){const state=window.AzaCalendar.getState();$('bvs-worldBelavadosClock').textContent=state.period+' '+state.time;$('bvs-worldClockSource').textContent=`Aza’raan campaign calendar · Year ${state.year} · Month ${state.month}/8 · Week ${state.week}/5 · Day ${state.day}/6`; }}
function saveFields(){if(!ui.settlement)return;const p=ensurePrefs();Object.assign(p,{governmentType:$('bvs-worldGovernment').value.trim(),tags:$('bvs-worldTags').value,deities:$('bvs-worldDeities').value,notes:$('bvs-worldNotes').value,population:$('bvs-worldPopulation').value,squareMiles:$('bvs-worldSquareMiles').value,squareKm:$('bvs-worldSquareKm').value,dangerLevel:$('bvs-worldDanger').value,settlementAxes:getAxisValues('bvs-worldSettlementAxes')});if(covenant)covenant.save('settlement',ui.settlement.id,p.settlementAxes,'Settlement policy authored in Generator');const ok=persist();$('bvs-worldSaveStatus').textContent=ok?'Saved local settlement notes and preferences.':'Unable to save to browser storage.';updatePreview();}
function saveNpcAxes(){if(!ui.settlement||!selectedNpc)return;const p=ensurePrefs();p.npcAxes=p.npcAxes||{};p.npcAxes[selectedNpc]=getAxisValues('bvs-worldNpcAxes');if(covenant)covenant.save('npc',selectedNpc,p.npcAxes[selectedNpc],'NPC conduct authored in Generator');persist();updateNpcAxis();$('bvs-worldAlignmentStatus').textContent='Selected NPC alignment saved locally.';}
function applyAlignment(){let p;try{p=JSON.parse($('bvs-worldAlignmentJson').value)}catch{$('bvs-worldAlignmentStatus').textContent='Invalid JSON.';return;}
 if(!ui.settlement||p?.settlementId!==ui.settlement.id){$('bvs-worldAlignmentStatus').textContent='Settlement ID must match the currently selected settlement.';return;}
 const check=x=>x&&Object.entries(x).every(([k,v])=>axes.some(a=>a.toLowerCase()===k)&&Number.isInteger(v)&&v>=0&&v<=3000)&&(p.schema==='belavados-template-alignment.v2'||axes.every(k=>Number.isInteger(x[k.toLowerCase()])));
 if(!check(p.settlementAxes)|| (p.npcAxes&&!check(p.npcAxes))){$('bvs-worldAlignmentStatus').textContent='Provide eight integer scores from 0–3000; legacy four-axis v2 files are migrated with neutral defaults.';return;}
 const dest=ensurePrefs();dest.settlementAxes=covenant?.normalizeScores(p.settlementAxes,true)||p.settlementAxes;if(covenant)covenant.save('settlement',ui.settlement.id,dest.settlementAxes,'Alignment imported by GM');
 if(p.npcAxes){if(p.npcId&&!records().some(n=>n.id===p.npcId)){$('bvs-worldAlignmentStatus').textContent='Unknown NPC ID; NPC values were not applied.';}else if(p.npcId){dest.npcAxes=dest.npcAxes||{};dest.npcAxes[p.npcId]=covenant?.normalizeScores(p.npcAxes,true)||p.npcAxes;if(covenant)covenant.save('npc',p.npcId,dest.npcAxes[p.npcId],'NPC alignment imported by GM');}}
 if(p.provinceAxes&&ui.province&&p.provinceId===ui.province.id&&check(p.provinceAxes)){covenant?.save('province',ui.province.id,covenant.normalizeScores(p.provinceAxes,true),'Province policy imported by GM');renderAxes('bvs-worldProvinceAxes',p.provinceAxes,updatePreferenceJson);}persist();renderAxes('bvs-worldSettlementAxes',dest.settlementAxes,updatePreferenceJson);updateNpcAxis();$('bvs-worldAlignmentStatus').textContent='Valid alignment data applied and saved.';}
function download(filename,data,mime='application/json'){const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:mime+';charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function fileSlug(s){return String(s||'data').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'_');}
function exportSettlement(){const s=ui.settlement;if(!s)return;const p={...ui.province};delete p.settlements;download(fileSlug(s.name)+'_living_settlement.json',{schema:'belavados.living.settlement.v2',province:p,settlement:s,localPreferences:prefs(),residents:records(),immersiveLocationTemplate:template(),liveMap:getGeneratedMap(),documentedPlaces:getPlaces().map(x=>({name:x.name,sources:[...x.sources],residentIds:x.residents.map(n=>n.id),employeeIds:x.employees.map(n=>n.id),visitorIds:x.visitors.map(n=>n.id),catalogEntries:x.catalog.length}))});}
function exportProvince(){const p=ui.province;if(!p)return;download(fileSlug(p.name)+'_province.json',{schema:'belavados.living.province.v2',province:p,residents:(window.LifeSimulator?.state?.npcs||[]).filter(n=>(n.assignment?.provinceId||n.provinceId)===p.id).concat(world.npcs.filter(n=>n.provinceId===p.id)),localPreferences:Object.fromEntries(p.settlements.map(s=>[s.id,local[s.id]||{}])),approvedRaces:world.approvedRaceNames,approvedMixedHeritages:world.approvedMixedHeritages});}
function exportCsv(){if(!ui.settlement)return;const fields=['id','name','race','age','genderIdentity','pronouns','subject','object','possessiveDeterminer','possessivePronoun','reflexive','formalHonorific','respectfulAddress','everydayTitle','platonicEndearment','romanticEndearment','kinshipTerms','job','workplace','home','household','traits','aspiration','familial','romantic','personal','professional','schedule'];const rows=[fields];for(const n of records()){rows.push([n.id,n.name,n.race?.name||n.race,n.age,n.genderIdentity,n.pronouns,n.pronounForms?.subject,n.pronounForms?.object,n.pronounForms?.possessiveDeterminer,n.pronounForms?.possessivePronoun,n.pronounForms?.reflexive,n.formalHonorific||n.preferredHonorific,n.respectfulAddress,n.everydayTitle,n.platonicEndearment,n.romanticEndearment,JSON.stringify(n.kinshipTerms||{}),n.job?.title,n.job?.location,n.home,n.householdId,(n.traits||[]).join(' | '),n.aspiration,...['familial','romantic','personal','professional'].map(k=>(n.relationships?.[k]||[]).map(r=>`${r.name}: ${r.type}`).join(' | ')),(n.schedule||[]).map(x=>`${x.start}-${x.end} ${x.activity} at ${x.location}`).join(' | ')]);}
 download(fileSlug(ui.settlement.name)+'_npcs.csv',rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv');}
function openTools(which='npc'){app.setTab('tools');$('bvs-integratedToolWindow').hidden=false;if(which==='locations')$('bvs-showLocationToolsPageBtn')?.click();else $('bvs-showNpcSimulatorPageBtn')?.click();$('bvs-integratedToolWindow').scrollIntoView({behavior:'smooth',block:'start'});}
function importPrebuilt(){if(!ui.settlement)return;openTools('npc');$('bvs-importSettlementNpcsBtn')?.click();$('bvs-generatorStatus').textContent=`Existing residents of ${ui.settlement.name} requested for the original NPC editor.`;}
function selectNpc(id){selectedNpc=id;const field=$('bvs-worldNpcSelect');field.value=id;renderNpcDetail();renderLocationDetail();}
function selectLocation(name){const places=getPlaces(),field=$('bvs-worldLocationSelect'),idx=places.findIndex(x=>x.name===name||placeKey(x)===name);if(idx<0)return;selectedLocation=placeKey(places[idx]);field.value=String(idx);renderLocationDetail();}
function jumpToNpc(tab){if(!selectedNpc)return;ui.focusNpc=selectedNpc;app.setTab(tab);app.refresh();app.setTab(tab);const el=$('explorer'+tab[0].toUpperCase()+tab.slice(1));el?.scrollIntoView({behavior:'smooth',block:'start'});}
function proxyFiles(files){if(!files?.length)return;const input=$('bvs-importNpcDocsFile');if(!input){$('bvs-worldUploadStatus').textContent='Open editor tools to import these documents.';return;}
 try{const dt=new DataTransfer();for(const f of files)dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));$('bvs-worldUploadStatus').textContent=`Sent ${files.length} file(s) to the integrated NPC importer. Open Editor Tools to inspect results.`;openTools();}catch(e){$('bvs-worldUploadStatus').textContent='Automatic import unavailable in this browser; use the original importer in Editor Tools.';openTools();}}
// Use the approved roster, not the historical, unapproved race list within the attached source HTML.
const raceSelect=$('bvs-worldApprovedRace');raceSelect.innerHTML='<optgroup label="16 Approved Species">'+world.approvedRaceNames.map(n=>`<option>${enc(n)}</option>`).join('')+'</optgroup><optgroup label="6 Approved Mixed Heritages">'+world.approvedMixedHeritages.map(n=>`<option>${enc(n)}</option>`).join('')+'</optgroup>';
$('bvs-worldMapCanvas').addEventListener('click',e=>{const b=e.target.closest('[data-world-settlement]');if(b)app.changeSettlement(b.dataset.worldSettlement);});
$('bvs-worldLocationSelect').addEventListener('change',e=>{selectedLocation=getPlaces()[Number(e.target.value)]?placeKey(getPlaces()[Number(e.target.value)]):null;renderLocationDetail();});
$('bvs-worldNpcSelect').addEventListener('change',e=>selectNpc(e.target.value));
$('bvs-worldRandomLocation').addEventListener('click',()=>{const list=getPlaces();if(list.length)selectLocation(list[Math.floor(Math.random()*list.length)].name);});
$('bvs-worldRandomNpc').addEventListener('click',()=>{const list=records();if(list.length)selectNpc(list[Math.floor(Math.random()*list.length)].id);});
$('bvs-worldMapRefresh').addEventListener('click',renderMap);
$('bvs-worldNpcInfo').addEventListener('click',e=>{const b=e.target.closest('[data-world-open]');if(b)jumpToNpc(b.dataset.worldOpen);});
$('bvs-worldLocationNpcs').addEventListener('click',e=>{const b=e.target.closest('[data-world-npc]');if(b)selectNpc(b.dataset.worldNpc);});
$('bvs-worldGeneratedList').addEventListener('click',e=>{let b=e.target.closest('[data-world-npc]');if(b){selectNpc(b.dataset.worldNpc);$('bvs-worldNpcSelect').scrollIntoView({behavior:'smooth'});return;}b=e.target.closest('[data-world-location]');if(b){selectLocation(b.dataset.worldLocation);$('bvs-worldLocationSelect').scrollIntoView({behavior:'smooth'});}});
for(const [id,mode] of [['bvs-worldListLocations','locations'],['bvs-worldListNpcs','npcs'],['bvs-worldListRelations','relationships']])$(id).addEventListener('click',()=>{listMode=mode;renderList();});
for(const id of ['bvs-worldSaveTop','bvs-worldSaveFields'])$(id).addEventListener('click',saveFields);
for(const id of ['bvs-worldExportSettlementTop','bvs-worldExportSettlement'])$(id).addEventListener('click',exportSettlement);
$('bvs-worldExportProvince').addEventListener('click',exportProvince);$('bvs-worldExportNpcsCsv').addEventListener('click',exportCsv);
for(const id of ['bvs-worldOpenToolsTop','bvs-worldScrollToTools'])$(id).addEventListener('click',()=>openTools());
$('bvs-worldLaunchNpcGenerator').addEventListener('click',()=>openTools('npc'));
$('bvs-worldLaunchLocationGenerator').addEventListener('click',()=>openTools('locations'));
$('bvs-worldImportExisting').addEventListener('click',importPrebuilt);
$('bvs-worldSaveNpcAlignment').addEventListener('click',saveNpcAxes);
$('bvs-worldSaveProvinceAlignment')?.addEventListener('click',()=>{const p=ui.province;if(!p||!covenant)return;covenant.save('province',p.id,getAxisValues('bvs-worldProvinceAxes'),'Province governance record authored in Generator');$('bvs-worldAlignmentStatus').textContent='Province Covenant saved.';updatePreferenceJson();});
document.addEventListener('aza-calendar:change',()=>{if(selectedLocation)renderLocationDetail();});
document.addEventListener('belavados:location-selected',e=>{const key='id:'+String(e.detail?.buildingId||'');if(getPlaces().some(p=>placeKey(p)===key))selectLocation(key);});
document.addEventListener('elarvess:building-selected',e=>{const key='id:'+String(e.detail?.id||'');if(getPlaces().some(p=>placeKey(p)===key))selectLocation(key);});
$('bvs-worldCopyAlignment').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('bvs-worldAlignmentJson').value);$('bvs-worldAlignmentStatus').textContent='Copied.';}catch{$('bvs-worldAlignmentJson').select();document.execCommand('copy');$('bvs-worldAlignmentStatus').textContent='Selected text for copying.';}});
$('bvs-worldDownloadAlignment').addEventListener('click',()=>download(fileSlug(ui.settlement?.name)+'_alignment.json',$('bvs-worldAlignmentJson').value));
$('bvs-worldApplyAlignment').addEventListener('click',applyAlignment);
$('bvs-worldMultiFileInput').addEventListener('change',e=>proxyFiles(e.target.files));
const dz=$('bvs-worldDropZone');dz.addEventListener('click',()=>$('bvs-worldMultiFileInput').click());dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('bvs-worldMultiFileInput').click();}});
for(const evt of ['dragenter','dragover'])dz.addEventListener(evt,e=>{e.preventDefault();dz.classList.add('dragover')});
for(const evt of ['dragleave','drop'])dz.addEventListener(evt,e=>{e.preventDefault();dz.classList.remove('dragover')});
dz.addEventListener('drop',e=>proxyFiles(e.dataTransfer.files));
$('bvs-worldSquareMiles').addEventListener('input',()=>{const miles=Number($('bvs-worldSquareMiles').value);if(miles>0)$('bvs-worldSquareKm').value=(miles*2.589988).toFixed(2)});
$('bvs-worldSquareKm').addEventListener('input',()=>{const km=Number($('bvs-worldSquareKm').value);if(km>0)$('bvs-worldSquareMiles').value=(km/2.589988).toFixed(2)});
// World_app fires after each province or settlement change.
document.addEventListener('belavados:viewchange',synced);
let lastAzaDay=0;document.addEventListener('aza-calendar:change',()=>{const d=window.AzaCalendar?.getState()?.day||1;if(d!==lastAzaDay){lastAzaDay=d;if(ui.settlement?.id==='aelvanyr-elarvess')synced();}});
window.addEventListener('life-simulator:core-rendered',()=>{if(ui.settlement){updateInput('bvs-worldResidentCount',records().length);renderNpcSelector();renderList();updatePreview();}});
setInterval(refreshClock,15000);
synced();
window.BelavadosSettlementDashboard={refresh:synced,exportSettlement,exportProvince,openTools,records,getPlaces};
})();
