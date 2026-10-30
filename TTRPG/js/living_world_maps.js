/* Belavadós V8. Each non-Elarvess settlement has an individual, fully interactive
   georeferenced-internal SVG settlement, named buildings and six-day living NPCs.
   Elarvess original PNG/GeoJSON overlay and 2,016 authored residents stay untouched. */
(()=>{
'use strict';
const app=window.BelavadosLivingWorld,calendar=window.AzaCalendar;
if(!app)return;
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').trim().toLocaleLowerCase();
const mapViewer=$('bvs-mapViewer'), windowParent=mapViewer?.closest('section.window');if(!mapViewer||!windowParent)return;
const enabled=new Set();let data=null,loadedId='',requestedId='',active=false,mode='town',selectedBuilding=null,selectedNpc=null,filterType='',term='',inspectTab='place';
const routeCache=new Map();let activeRoom=null;
let viewBox={x:0,y:0,w:1920,h:1920},drag=null,raf=0,lastTick=-1,searchPane=null,searchResults=[],bodySvg=null;
const lookupNpc=new Map(),lookupBuilding=new Map();
const overlay=document.createElement('div');overlay.id='bvs-livingMapLayer';overlay.hidden=true;mapViewer.append(overlay);
const inspector=document.createElement('div');inspector.id='bvs-livingMapInspector';inspector.className='window';inspector.hidden=true;windowParent.insertAdjacentElement('afterend',inspector);
const toggle=document.createElement('button');toggle.id='bvs-livingShowTown';toggle.type='button';toggle.textContent='Explore Settlement Streets';toggle.className='secondary';
const buttonToolbar=windowParent.querySelector('.map-toolbar')||windowParent.querySelector('.window-footer');buttonToolbar?.append(toggle);
const status=$('bvs-worldMapTemplateStatus');
const colors={RESIDENCE:'#d2bc95',MARKET:'#bf9960',TAVERN:'#a66c4e',INN:'#b58a67',GUILD:'#8f8381',CRAFT:'#a18278',EDUCATIONAL:'#9aabb0',RELIGIOUS:'#b4adbf',CIVIC:'#d8bf9e',INDUSTRIAL:'#828689',HEALING:'#a1c0b4',STABLE:'#ac9772',TRANSIT:'#968979',ENTERTAINMENT:'#cb9796',PARK:'#78a379',GUARD:'#a4acbc',ARCANE:'#9290bb',LIBRARY:'#a0b2b2',FARM:'#b1b879',STORE:'#cfac7a',MARITIME:'#7097ab'};
const polyPath=points=>'M'+points.map(p=>p[0]+','+p[1]).join('L')+'Z';
const pathLine=points=>points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
function nowMinutes(n){const c=calendar?.getState(),t=(Number(c?.hour)||0)*60+(Number(c?.minute)||0);return n?.scheduleProvenance?.startsWith('V9')?t:t*(24/21);}
function day(){return Math.min(6,Math.max(1,Number(calendar?.getState()?.day)||1));}
function timeValue(t){const [h,m]=String(t||'00:00').split(':').map(Number);return (Number(h)||0)*60+(Number(m)||0);}
function activeSlot(n){const t=nowMinutes(n);const slots=n.weeklySchedule?.[day()-1]||[];return slots.find(s=>timeValue(s.start)<=t&&t<timeValue(s.end))||slots[0]||null;}
function findPair(n){const t=nowMinutes(n),slots=n.weeklySchedule?.[day()-1]||[];
 const ix=slots.findIndex(s=>timeValue(s.start)<=t&&t<timeValue(s.end));const i=ix<0?0:ix,cur=slots[i],prev=slots[(i-1+slots.length)%slots.length];
 if(!cur)return null;const minutesInto=t-timeValue(cur.start);return{cur,prev,progress:(prev?.buildingId!==cur.buildingId&&minutesInto>=0&&minutesInto<20)?Math.max(0,minutesInto/20):1};}
function findBuilding(id){return lookupBuilding.get(Number(id));}
function focusLocationFromMain(b){
 const l=$('bvs-worldLocationSelect');if(l){let opt=[...l.options].find(o=>norm(o.textContent)===norm(b.name)||norm(o.textContent)===norm(b.purpose));
 if(!opt&&b.sourceAliases?.length)opt=[...l.options].find(o=>b.sourceAliases.some(v=>norm(v)===norm(o.textContent)));
 if(opt&&l.value!==opt.value){l.value=opt.value;l.dispatchEvent(new Event('change',{bubbles:true}));}}
}
function focusNpcFromMain(n){const l=$('bvs-worldNpcSelect');if(l&&[...l.options].some(o=>o.value===n.id)){l.value=n.id;l.dispatchEvent(new Event('change',{bubbles:true}));}}
function resetCamera(){viewBox={x:0,y:0,w:1920,h:1920};drawCamera();}
function drawCamera(){const svg=$('bvs-livingMapSvg');if(svg)svg.setAttribute('viewBox',[viewBox.x,viewBox.y,viewBox.w,viewBox.h].join(' '));}
function walkRoute(from,to){
 const key=from.id+'-'+to.id;if(routeCache.has(key))return routeCache.get(key);
 const patches=data?.map?.townGeneratorOSTopology?.patches||[], edges=data?.map?.townGeneratorOSTopology?.connections||[];
 const start=[from.x,from.y],end=[to.x,to.y];if(!patches.length)return[start,end];
 const node=p=>patches.reduce((a,c)=>Math.hypot(c.center[0]-p[0],c.center[1]-p[1])<Math.hypot(a.center[0]-p[0],a.center[1]-p[1])?c:a,patches[0]).id;
 const src=node(start),dst=node(end),dist=new Map([[src,0]]),prev=new Map(),pool=new Set(patches.map(p=>p.id));
 while(pool.size){let cur=null,best=Infinity;for(const id of pool){const d=dist.get(id)??Infinity;if(d<best){best=d;cur=id;}}
  if(cur===null||cur===dst)break;pool.delete(cur);
  for(const [a,b] of edges){let other=a===cur?b:b===cur?a:null;if(other===null||!pool.has(other))continue;
   const p=patches.find(p=>p.id===cur),q=patches.find(p=>p.id===other);if(!p||!q)continue;
   const candidate=best+Math.hypot(p.center[0]-q.center[0],p.center[1]-q.center[1]);
   if(candidate<(dist.get(other)??Infinity)){dist.set(other,candidate);prev.set(other,cur);}}
 }
 const chain=[];let cur=dst,guard=0;while(cur!==src&&prev.has(cur)&&guard++<100){chain.push(cur);cur=prev.get(cur);}if(cur===src)chain.push(src);
 const route=[start,...chain.reverse().map(id=>patches.find(p=>p.id===id)?.center).filter(Boolean),end];
 if(routeCache.size>6500)routeCache.clear();routeCache.set(key,route);return route;
}
function travelPoint(points,progress){let lengths=[],total=0;for(let i=1;i<points.length;i++){const length=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(length);total+=length;}
 let left=total*progress;for(let i=0;i<lengths.length;i++){if(left<=lengths[i]||i===lengths.length-1){const q=Math.min(1,left/Math.max(1,lengths[i]));return [points[i][0]+q*(points[i+1][0]-points[i][0]),points[i][1]+q*(points[i+1][1]-points[i][1])];}left-=lengths[i];}
 return points[points.length-1];}
function svgBackground(){const m=data.map,t=m.terrain;
 const bg=t.arid?'#b5a57e':t.mountain?'#78918a':t.waterfront?'#9da991':t.forest?'#789477':'#9eaa86';
 const hills=m.landmarks.map(([x,y,r],i)=>`<g opacity="${.19+i%3*.06}"><ellipse cx="${x}" cy="${y}" rx="${r*2.5}" ry="${r*1.5}" fill="${t.arid?'#e2c58a':'#496e55'}"/><path d="M${x-r} ${y+r/2}Q${x} ${y-r} ${x+r} ${y+r/2}" fill="none" stroke="${t.arid?'#a88a61':'#42664c'}" stroke-width="2"/></g>`).join('');
 const water=t.waterfront?`<path d="M-30 50 Q205 160 178 380 T240 855 Q118 1150 250 1370T180 1940H-80Z" fill="#6b9caa" stroke="#cee5dc" stroke-width="12"/><path d="M75 0 Q285 290 260 600 T320 1240 T275 2000" fill="none" stroke="#def1e6" stroke-width="3" opacity=".52"/>`:'';
 const mountains=t.mountain?`<path d="M-90 350Q120 170 290 220T740 100Q960 30 1140 170T1720 130L2020 320" stroke="#485c54" stroke-width="100" fill="none" opacity=".22"/>`:'';
 const boundary=polyPath(m.boundary);
 const topo=m.townGeneratorOSTopology;
 const wardsFill=topo?(topo.patches||[]).map((p,i)=>`<path d="${polyPath(p.boundary)}" fill="${['#e5d6ba','#d4c8a2','#d6d4bb','#bfc8a4','#d9c1aa','#c8b9aa'][i%6]}" stroke="#665744" stroke-width="2" opacity=".35"><title>${esc(p.ward)} • ${esc(p.districtType)}</title></path>`).join(''):'';
 const arterial=topo?(topo.streets||[]).map(path=>`<path d="${pathLine(path)}" fill="none" stroke="#554b3b" stroke-width="13" opacity=".72"/><path d="${pathLine(path)}" fill="none" stroke="#dfcba6" stroke-width="8" opacity=".83"/>`).join(''):'';
 const gates=topo?(topo.gates||[]).map(g=>`<circle cx="${g[0]}" cy="${g[1]}" r="17" fill="#a8895e" stroke="#473b31" stroke-width="6"/>`).join(''):'';
 const roads=m.roads.map((r,i)=>`<path d="${pathLine(r)}" fill="none" stroke="#4c4434" stroke-linecap="round" stroke-width="${i===0?29:22}" opacity=".68"/><path d="${pathLine(r)}" fill="none" stroke="#c9bd99" stroke-linecap="round" stroke-width="${i===0?19:14}" opacity=".95"/>`).join('');
 const wards=m.wards.map(w=>`<text x="${w.x}" y="${w.y}" fill="#172c26" font-size="24" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" opacity=".6">${esc(w.name)}</text>`).join('');
 return `<rect width="1920" height="1920" fill="${bg}"/>${hills}${mountains}${water}${wardsFill}<path d="${boundary}" fill="#b9b994" stroke="#38453a" stroke-width="20" opacity=".42"/><path d="${boundary}" fill="none" stroke="#544f3e" stroke-width="9" stroke-dasharray="12 15"/>${arterial}${roads}${gates}${wards}`;
}
function drawPeople(){
 if(!data||!active)return;const layer=$('bvs-livingNpcGlyphs');if(!layer)return;
 const list=data.npcs;
 // Every person, including every original resident, receives an SVG target. Spread around its current site.
 let html='';for(let i=0;i<list.length;i++){
  const n=list[i],pair=findPair(n);if(!pair)continue;const dest=findBuilding(pair.cur.buildingId);if(!dest)continue;
  let x=dest.x,y=dest.y;
  if(pair.progress<1){const from=findBuilding(pair.prev?.buildingId);if(from){const p=pair.progress;
   // Three-point road walk (origin -> ward thoroughfare -> destination).
   const route=walkRoute(from,dest),pos=travelPoint(route,p);x=pos[0];y=pos[1];}
  } else {const angle=((i*137.508)%360)*Math.PI/180;const radius=4+Math.sqrt(i%13)*2.2;x+=Math.cos(angle)*radius;y+=Math.sin(angle)*radius;}
  const sel=selectedNpc===n.id;const fill=n.sourceNpcId?'#19aab3':'#c65b43';
  html+=`<circle class="lv-person${sel?' chosen':''}" data-person="${esc(n.id)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${sel?9:3.8}" fill="${sel?'#ffdd5c':fill}" stroke="#f5ead5" stroke-width="1.8"><title>${esc(n.name)} — ${esc(pair.cur.activity)} at ${esc(dest.name)}</title></circle>`;
 }layer.innerHTML=html;
 if(selectedNpc){const npc=lookupNpc.get(selectedNpc);if(npc){const pair=findPair(npc);if(pair){const b=findBuilding(pair.cur.buildingId);const line=$('bvs-livingCurrentPlace');if(line&&b)line.textContent=`Now: ${pair.cur.activity} • ${b.name}`;}}}
}
function setSelectedBuilding(id,center=true){const b=findBuilding(id);if(!b)return;activeRoom=null;selectedBuilding=b.id;selectedNpc=null;inspectTab='place';
 document.querySelectorAll('#bvs-livingBuildingGlyphs .lv-building').forEach(p=>p.classList.toggle('selected',Number(p.dataset.building)===b.id));
 if(center){viewBox.x=Math.max(0,Math.min(1920-viewBox.w,b.x-viewBox.w/2));viewBox.y=Math.max(0,Math.min(1920-viewBox.h,b.y-viewBox.h/2));drawCamera();}
 focusLocationFromMain(b);renderInspector();drawPeople();}
function setSelectedNpc(id,center=true){const n=lookupNpc.get(id);if(!n)return;selectedNpc=id;selectedBuilding=null;inspectTab='person';
 const pair=findPair(n),b=findBuilding(pair?.cur.buildingId||n.homeBuildingId);if(center&&b){viewBox.x=Math.max(0,Math.min(1920-viewBox.w,b.x-viewBox.w/2));viewBox.y=Math.max(0,Math.min(1920-viewBox.h,b.y-viewBox.h/2));drawCamera();}
 document.querySelectorAll('#bvs-livingBuildingGlyphs .lv-building').forEach(p=>p.classList.remove('selected'));
 focusNpcFromMain(n);renderInspector();drawPeople();}
function listNPC(ids,label,limit=24){let a=[...new Set(ids||[])].map(id=>lookupNpc.get(id)).filter(Boolean);return `<section class="lv-list"><h4>${esc(label)} (${a.length})</h4><div class="lv-person-links">${a.slice(0,limit).map(n=>`<button type="button" data-person="${esc(n.id)}">${esc(n.name)}<small>${esc(n.job?.title||'Resident')}</small></button>`).join('')||'<p>No people currently linked.</p>'}</div>${a.length>limit?`<small>Showing ${limit}; search the NPC by name to see the full record.</small>`:''}</section>`;}
function personDetails(n){const home=findBuilding(n.homeBuildingId),work=findBuilding(n.workBuildingId);
 const rel=n.relationships||{},days=['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6'];
 const relationships=Object.entries(rel).map(([kind,entries])=>`<details><summary>${esc(kind)} (${entries?.length||0})</summary><div class="lv-person-links">${(entries||[]).map(t=>`<button type="button" ${lookupNpc.has(t.npcId)?`data-person="${esc(t.npcId)}"`:''}>${esc(t.name||lookupNpc.get(t.npcId)?.name||t.npcId)}<small>${esc(t.type)}</small></button>`).join('')||'None recorded'}</div></details>`).join('');
 return `<div class="lv-inside"><h3>${esc(n.name)}</h3><p>${esc(n.race?.name||'')} • ${esc(n.genderIdentity||'')} • ${esc(n.pronouns||'')} • ${esc(n.job?.title||'Resident')}</p><p>${esc(n.traits?.join(', ')||'')}${n.aspiration?' • Goal: '+esc(n.aspiration):''}</p>${n.biography?`<p class="lv-biography">${esc(n.biography)}</p>`:''}<p>${n.deityAffiliations?.length?'Deities: '+esc(n.deityAffiliations.join(', ')):''}</p><p class="lv-origin">${esc(n.source?.startsWith('V9')?'New V9 resident with six-day routine':n.source==='V8 supplemental generated resident'?'Preserved V8 settlement resident':'Preserved original V7 resident, linked to this map')}</p><div class="lv-person-links">${home?`<button type="button" data-building="${home.id}">Home: ${esc(home.name)}</button>`:''}${work?`<button type="button" data-building="${work.id}">Work: ${esc(work.name)}</button>`:''}</div><p id="bvs-livingCurrentPlace"></p><div class="lv-days">${days.map((name,i)=>`<button type="button" data-viewday="${i+1}" ${day()===i+1?'class="current"':''}>${name}</button>`).join('')}</div><ol class="lv-schedule">${(n.weeklySchedule?.[day()-1]||[]).map(s=>`<li><time>${esc(s.start)}–${esc(s.end)}</time> ${esc(s.activity)} <button type="button" data-building="${Number(s.buildingId)}">${esc(s.location||findBuilding(s.buildingId)?.name||'Place')}</button>${s.sourceLocation&&s.sourceLocation!==s.location?`<small>Original: ${esc(s.sourceLocation)}</small>`:''}</li>`).join('')}</ol><h4>Relationships</h4>${relationships}<details><summary>Identity, family and story details</summary><pre class="lv-person-extra">${esc(JSON.stringify({age:n.age,pronounForms:n.pronounForms,preferredHonorific:n.preferredHonorific,familyLanguage:n.familyLanguage,deityAffiliations:n.deityAffiliations,romance:n.romance,relationshipHistory:n.relationshipHistory,familyConnections:n.familyConnections},null,2))}</pre></details></div>`;}
function interiorSVG(b){const rooms=b?.interior?.rooms||[];if(!rooms.length)return '<p>No room map recorded.</p>';
 const outer=b.path||[],minX=Math.min(...outer.map(p=>p[0])),minY=Math.min(...outer.map(p=>p[1])),maxX=Math.max(...outer.map(p=>p[0])),maxY=Math.max(...outer.map(p=>p[1]));
 const w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY);
 return `<div class="lv-room-plan"><svg role="img" aria-label="Clickable floor plan of ${esc(b.name)}" viewBox="0 0 500 300">${rooms.map((room,i)=>{const [x,y,rw,rh]=room.bounds;return `<g data-room="${esc(room.id)}" role="button" tabindex="0" aria-label="Enter ${esc(room.name)}"><rect x="${(x-minX)/w*485+7}" y="${(y-minY)/h*285+7}" width="${rw/w*485-2}" height="${rh/h*285-2}" rx="3" fill="${['#c3b7a1','#b2c2be','#d2ba9b','#c7c2a0'][i%4]}" stroke="#403a31" stroke-width="2"/><text x="${(x-minX+rw/2)/w*485+7}" y="${(y-minY+rh/2)/h*285+7}" fill="#28231c" font-size="12" text-anchor="middle" pointer-events="none">${esc(room.name.slice(0,18))}</text></g>`;}).join('')}</svg><p id="bvs-livingRoomDescription">Choose a room to inspect it. ${rooms.length} navigable rooms across ${b.interior.levels} floor(s).</p></div>`;
}
function buildingDetails(b){const cur=data.npcs.filter(n=>activeSlot(n)?.buildingId===b.id);
 const goods=(b.goodsAndServices||[]);let resident=b.residentNpcIds||[],staff=b.employeeNpcIds||[],visitors=b.visitorNpcIds||[];
 return `<div class="lv-inside"><h3>${esc(b.name)}</h3><p>${esc(b.type.replaceAll('_',' '))} • ${esc(b.ward)} • ${esc(b.material)}</p><p>${esc(b.address)}</p><p>${esc(b.description)}</p><div class="lv-features">${b.features.map(f=>`<span>${esc(f)}</span>`).join('')}</div>${b.sourceAliases.length?`<p class="lv-origin">Original location reference: ${b.sourceAliases.map(esc).join(', ')}</p>`:''}<p class="lv-origin">${esc(b.hours)}</p><h4>Inside this location</h4>${interiorSVG(b)}${listNPC(cur.map(n=>n.id),'Present at this time',30)}${listNPC(resident,'Residents',30)}${listNPC(staff,'Employees',30)}${listNPC(visitors,'Visitors during the six-day week',30)}<h4>Goods and services (${goods.length})</h4><div class="lv-stock">${goods.slice(0,100).map(x=>`<div><strong>${esc(x.item)}</strong><span>${esc(x.price)}</span><small>${esc(x.category)} · ${esc(x.notes||'')}</small></div>`).join('')||'<p>No priced catalogue entries are recorded for this location.</p>'}</div>${goods.length>100?`<p>Showing 100 of ${goods.length}. Export the settlement JSON for the complete list.</p>`:''}</div>`;
}
function renderInspector(){if(!data||!active)return;
 const b=selectedBuilding&&findBuilding(selectedBuilding),n=selectedNpc&&lookupNpc.get(selectedNpc);
 inspector.hidden=false;inspector.innerHTML=`<div class="window-header"><span>Living Settlement • ${esc(data.settlementName)}</span><span>${data.buildingCount.toLocaleString()} buildings · ${data.npcCount.toLocaleString()} people</span></div><div class="window-body"><div class="lv-inspector-actions"><button type="button" data-lv-tab="places" class="ghost">Buildings</button><button type="button" data-lv-tab="people" class="ghost">Residents</button><button type="button" data-lv-export="json" class="ghost">Export settlement data</button></div>${n?personDetails(n):b?buildingDetails(b):`<p>Select a building footprint or an NPC dot on the map. Every original home, workplace and schedule destination is linked to a physical building; original V7 records remain unchanged.</p>`}</div>`;
}
function searchResultsHTML(q){if(!data||!q)return '';
 const n=norm(q);const bb=data.buildings.filter(b=>(!filterType||b.type===filterType)&&[b.name,b.address,b.purpose,...b.sourceAliases].some(x=>norm(x).includes(n))).slice(0,22);
 const people=data.npcs.filter(p=>norm(p.name).includes(n)||norm(p.job?.title).includes(n)).slice(0,18);
 return `<div class="lv-search-section"><b>Places (${bb.length}${bb.length===22?'+':''})</b>${bb.map(b=>`<button type="button" data-building="${b.id}">${esc(b.name)}<small>${esc(b.address)}</small></button>`).join('')||'<span>No matching place</span>'}<b>People (${people.length}${people.length===18?'+':''})</b>${people.map(p=>`<button type="button" data-person="${esc(p.id)}">${esc(p.name)}<small>${esc(p.job?.title||'')}</small></button>`).join('')||'<span>No matching person</span>'}</div>`;
}
function doSearch(){const pane=$('bvs-livingSearchResults');if(pane)pane.innerHTML=searchResultsHTML(term);}
function renderMap(){if(!data)return;
 routeCache.clear();lookupNpc.clear();for(const n of data.npcs)lookupNpc.set(n.id,n);
 lookupBuilding.clear();for(const b of data.buildings)lookupBuilding.set(Number(b.id),b);
 const types=[...new Set(data.buildings.map(b=>b.type))].sort();
 const p=data.buildings.map(b=>`<path class="lv-building" tabindex="0" role="button" aria-label="${esc(b.name)}" data-building="${b.id}" d="${polyPath(b.path)}" fill="${colors[b.type]||'#c4a381'}"><title>${esc(b.name)} • ${esc(b.address)}</title></path>`).join('');
 overlay.innerHTML=`<svg id="bvs-livingMapSvg" viewBox="0 0 1920 1920" role="img" aria-label="Detailed interactive settlement map of ${esc(data.settlementName)}" preserveAspectRatio="xMidYMid meet"><g id="bvs-livingTerrain">${svgBackground()}</g><g id="bvs-livingBuildingGlyphs">${p}</g><g id="bvs-livingNpcGlyphs"></g></svg><div class="lv-map-toolbar"><input id="bvs-livingSearch" type="search" placeholder="Search named buildings, NPCs, jobs…" aria-label="Search this settlement"><select id="bvs-livingTypeFilter"><option value="">All buildings</option>${types.map(t=>`<option value="${t}">${esc(t)}</option>`).join('')}</select><button type="button" data-zoom="in" title="Zoom in">＋</button><button type="button" data-zoom="out" title="Zoom out">−</button><button type="button" data-zoom="reset" title="Fit all">⤢</button><button type="button" id="bvs-livingOutlines" aria-pressed="false" title="Toggle stronger building boundaries">Outlines</button><button type="button" data-back="atlas">Province Atlas</button></div><div id="bvs-livingSearchResults" class="lv-search-results"></div><div class="lv-map-legend">${esc(data.settlementName)} • ${data.buildingCount.toLocaleString()} clickable locations • ${data.npcCount.toLocaleString()} NPCs • Live six-day schedules</div>`;
 const svg=$('bvs-livingMapSvg');
 window.BelavadosCartography?.decorate?.(data,svg,{inspector,selectBuilding:setSelectedBuilding});
 svg.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-building]')){e.preventDefault();setSelectedBuilding(e.target.dataset.building);}});
 svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,viewX:viewBox.x,viewY:viewBox.y,moved:false};svg.setPointerCapture(e.pointerId);});
 svg.addEventListener('pointermove',e=>{if(!drag)return;const r=svg.getBoundingClientRect();let dx=(e.clientX-drag.x)*viewBox.w/r.width,dy=(e.clientY-drag.y)*viewBox.h/r.height;
  if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;viewBox.x=Math.max(0,Math.min(1920-viewBox.w,drag.viewX-dx));viewBox.y=Math.max(0,Math.min(1920-viewBox.h,drag.viewY-dy));drawCamera();});
 svg.addEventListener('pointerup',e=>{const was=drag?.moved;drag=null;if(was){svg.dataset.justDragged='yes';setTimeout(()=>delete svg.dataset.justDragged,80);}});
 svg.addEventListener('pointercancel',()=>drag=null);
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.27:1/1.27,e);},{passive:false});
 $('bvs-livingSearch').addEventListener('input',e=>{term=e.target.value;doSearch();});
 $('bvs-livingTypeFilter').addEventListener('change',e=>{filterType=e.target.value;svg.querySelectorAll('.lv-building').forEach(p=>p.classList.toggle('lv-filtered',!!filterType&&lookupBuilding.get(+p.dataset.building)?.type!==filterType));doSearch();});
 $('bvs-livingSearch').value=term;$('bvs-livingTypeFilter').value=filterType;
 resetCamera();drawPeople();renderInspector();
}
function zoom(scale,event){const prev=viewBox.w,w=Math.max(145,Math.min(1920,prev/scale)),h=w;const svg=$('bvs-livingMapSvg');if(!svg)return;
 const box=svg.getBoundingClientRect();const px=event?Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)):.5;
 const py=event?Math.max(0,Math.min(1,(event.clientY-box.top)/box.height)):.5;
 viewBox.x=Math.max(0,Math.min(1920-w,viewBox.x+(prev-w)*px));viewBox.y=Math.max(0,Math.min(1920-h,viewBox.y+(viewBox.h-h)*py));viewBox.w=w;viewBox.h=h;drawCamera();}
function showTown(){if(!data)return;mode='town';active=true;overlay.hidden=false;inspector.hidden=false;mapViewer.classList.add('living-town-active');
 $('bvs-worldMapCanvas').hidden=true;const el=$('bvs-elarvessMapLayer');if(el)el.hidden=true;const pop=$('bvs-elarvessMapInspector');if(pop)pop.hidden=true;
 $('bvs-worldTemplateMapImage').hidden=true;$('bvs-worldTemplateMapFrame').hidden=true;
 toggle.hidden=true;renderMap();if(status)status.textContent=`Living map of ${data.settlementName}; select or search any building or resident. Source V7 records retained.`;}
function showAtlas(){active=false;mode='atlas';overlay.hidden=true;inspector.hidden=true;mapViewer.classList.remove('living-town-active');$('bvs-worldMapCanvas').hidden=false;toggle.hidden=false;}
function changeView(){const sid=app.ui.settlement?.id;
 if(sid==='aelvanyr-elarvess'){requestedId='';data=null;showAtlas();toggle.hidden=true;return;}
 if(!sid){requestedId='';data=null;showAtlas();toggle.hidden=true;return;}
 if(sid===loadedId&&data){showTown();return;}
 requestedId=sid;active=false;overlay.hidden=true;toggle.hidden=true;inspector.hidden=true;
 if(status)status.textContent='Loading the distinct living map for '+app.ui.settlement.name+'…';
 const script=document.createElement('script');script.src='../../js/living_maps/'+encodeURIComponent(sid)+'.js';
 script.onload=async()=>{
  script.remove();if(requestedId!==sid)return;
  try{
   const next=window.__BELAVADOS_LIVING_LOADED_PROMISE?await window.__BELAVADOS_LIVING_LOADED_PROMISE:window.__BELAVADOS_LIVING_LOADED;
   if(requestedId!==sid)return;
   if(!next||next.settlementId!==sid){if(status)status.textContent='Settlement map data mismatch for '+sid;return;}
   data=next;loadedId=sid;selectedBuilding=null;selectedNpc=null;term='';filterType='';showTown();window.BelavadosSettlementDashboard?.refresh?.();app.refresh?.();
  }catch(err){console.error('V9 living map load failed',err);if(status)status.textContent='Map load failed: '+err.message;}
 };
 script.onerror=()=>{script.remove();if(requestedId===sid&&status)status.textContent='Could not load the local map. Serve the entire extracted package or verify js/living_maps/'+sid+'.js.';};
 document.head.appendChild(script);
}
mapViewer.addEventListener('click',e=>{if(!active||!data||$('bvs-livingMapSvg')?.dataset.justDragged)return;
 const b=e.target.closest('[data-building]'),n=e.target.closest('[data-person]'),zoomBtn=e.target.closest('[data-zoom]');
 if(n){setSelectedNpc(n.dataset.person);return;}
 if(b){setSelectedBuilding(b.dataset.building);return;}
 if(zoomBtn){if(zoomBtn.dataset.zoom==='reset')resetCamera();else zoom(zoomBtn.dataset.zoom==='in'?1.35:1/1.35);return;}
 if(e.target.closest('[data-back]')){showAtlas();return;}
 if(e.target.id==='bvs-livingOutlines'){const p=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(p));$('bvs-livingBuildingGlyphs').classList.toggle('outline-all',p);}
});
inspector.addEventListener('click',e=>{
 const btn=e.target.closest('button,[data-room]');if(!btn)return;
 if(btn.dataset.room){const b=findBuilding(selectedBuilding);const room=b?.interior?.rooms?.find(room=>room.id===btn.dataset.room);const status=$('bvs-livingRoomDescription');if(room&&status)status.textContent=room.name+' • Level '+room.level+' • '+room.features.join(', ')+'. Visitors use the building’s six-day occupancy schedule.';return;}
 if(btn.dataset.building){setSelectedBuilding(btn.dataset.building);return;}
 if(btn.dataset.person){setSelectedNpc(btn.dataset.person);return;}
 if(btn.dataset.viewday){calendar?.apply({day:+btn.dataset.viewday});renderInspector();drawPeople();return;}
 if(btn.dataset.lvExport){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=data.settlementId+'-living-map.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);return;}
 if(btn.dataset.lvTab){const name=btn.dataset.lvTab;const candidates=name==='places'?data.buildings:data.npcs;let title=name==='places'?'Buildings':'People';selectedBuilding=null;selectedNpc=null;
 inspector.querySelector('.window-body').innerHTML=`<h3>${esc(data.settlementName)} ${title} (${candidates.length})</h3><input id="bvs-lv-list-search" type="search" placeholder="Filter ${title.toLowerCase()}…"><div id="bvs-lv-list-results" class="lv-index"></div>`;
 const input=$('bvs-lv-list-search'),results=$('bvs-lv-list-results');const render=()=>{const q=norm(input.value);const filtered=candidates.filter(x=>norm(x.name).includes(q)||norm(x.address||x.job?.title).includes(q)).slice(0,100);
 results.innerHTML=filtered.map(x=>`<button type="button" data-${name==='places'?'building':'person'}="${esc(x.id)}">${esc(x.name)}<small>${esc(x.address||x.job?.title||'')}</small></button>`).join('')+'<p>Showing up to 100 matches; type to narrow the list.</p>';};input.addEventListener('input',render);render();}
});
toggle.addEventListener('click',showTown);
$('bvs-worldRestoreAtlas')?.addEventListener('click',()=>{if(active)showAtlas();});
$('bvs-worldMapRefresh')?.addEventListener('click',()=>{if(data&&mode==='town')setTimeout(()=>showTown(),0);});
document.addEventListener('belavados:viewchange',()=>setTimeout(changeView,0));
$('bvs-worldNpcSelect')?.addEventListener('change',e=>{if(active&&lookupNpc.has(e.target.value)&&selectedNpc!==e.target.value)setSelectedNpc(e.target.value,false);});
$('bvs-worldLocationSelect')?.addEventListener('change',e=>{if(!active)return;const name=e.target.selectedOptions?.[0]?.textContent;const b=data?.buildings.find(b=>norm(b.name)===norm(name)||b.sourceAliases.some(t=>norm(t)===norm(name)));if(b&&selectedBuilding!==b.id)setSelectedBuilding(b.id,false);});
let prevClock='';document.addEventListener('aza-calendar:change',()=>{if(!active)return;const st=calendar?.getState(),key=st?.day+'-'+st?.hour+'-'+st?.minute;if(key===prevClock)return;prevClock=key;drawPeople();
 if(selectedNpc)renderInspector();});
setInterval(()=>{if(active)drawPeople();},1200);
window.BelavadosLivingMaps={show:showTown,showAtlas,getCurrent:()=>data,selectBuilding:setSelectedBuilding,selectNpc:setSelectedNpc};
setTimeout(changeView,0);
})();
