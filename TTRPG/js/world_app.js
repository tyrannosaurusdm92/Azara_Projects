(() => {
  'use strict';
  const world = window.BELAVADOS_WORLD;
  if (!world) { console.error('World data bundle not loaded'); return; }
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const bySettlement = new Map();
  for (const npc of world.npcs) {
    if (!bySettlement.has(npc.settlementId)) bySettlement.set(npc.settlementId,[]);
    bySettlement.get(npc.settlementId).push(npc);
  }
  const byId=new Map(world.npcs.map(x=>[x.id,x]));
  const ui={province:null,settlement:null,tab:'overview',focusNpc:null,search:'',itemSearch:''};
  const nav=$('bvs-masterProvinceNav'), navItems=$('bvs-provinceNavItems');
  const provinceSelect=$('bvs-provinceSelect'),settlementSelect=$('bvs-settlementSelect');
  const locationProvinceSelect=$('bvs-locationProvinceSelect'),locationSettlementSelect=$('bvs-locationSettlementSelect');
  const navStore='belavados.provinceNav.v1', viewStore='belavados.provinceView.v1';
  const stored=(()=>{try{return JSON.parse(localStorage.getItem(viewStore)||'{}')}catch{return {}}})();
  const hash=decodeURIComponent(location.hash.slice(1));
  const match=hash.match(/^province\/([^/]+)(?:\/settlement\/([^/]+))?/);
  ui.province=world.provinces.find(x=>x.id===(match?.[1]||stored.province))||world.provinces[0];
  ui.settlement=ui.province.settlements.find(x=>x.id===(match?.[2]||stored.settlement))||ui.province.settlements[0]||null;
  const orderedTabs=['overview','residents','relationships','schedules','services','tools'];
  function npcList(){
    if (!ui.settlement) return [];
    const base=bySettlement.get(ui.settlement?.id)||[];
    const live=window.BelavadosLivingMaps?.getCurrent?.();
    if(live?.settlementId===ui.settlement.id){const canon=new Map(base.map(n=>[n.id,n]));return live.npcs.map(n=>({...canon.get(n.id),...n,schedule:canon.get(n.id)?.schedule||n.weeklySchedule?.[0]?.map(x=>({...x,location:x.location,days:'six-day calendar'}))||[]}));}
    const sim=window.LifeSimulator?.state?.npcs || [];
    const extras=sim.filter(x=>x.assignment?.settlementId===ui.settlement?.id || x.settlementId===ui.settlement?.id);
    return [...base,...extras.filter(x=>!base.some(n=>n.id===x.id))];
  }
  function updateDeepLink(){
    try{
      const url=ui.province?'#province/'+encodeURIComponent(ui.province.id)+(ui.settlement?'/settlement/'+encodeURIComponent(ui.settlement.id):''):'';
      history.replaceState(null,'',url);
      localStorage.setItem(viewStore,JSON.stringify({province:ui.province.id,settlement:ui.settlement?.id}));
    }catch(err){console.warn('Could not persist the selected province',err)}
  }
  function changeProvince(p){
    if(!p)return;
    ui.province=p;ui.settlement=p.settlements[0]||null;ui.focusNpc=null;ui.search='';ui.itemSearch='';
    setTab('overview');render();updateDeepLink();
  }
  function changeSettlement(id){
    ui.settlement=ui.province.settlements.find(s=>s.id===id)||null;
    ui.focusNpc=null;ui.search='';ui.itemSearch='';render();updateDeepLink();
  }
  function setTab(tab){
    ui.tab=orderedTabs.includes(tab)?tab:'overview';
    document.querySelectorAll('[data-explorer-tab]').forEach(el=>{
      const active=el.dataset.explorerTab===ui.tab;
      el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active));
    });
    for(const t of orderedTabs){const el=$('explorer'+t[0].toUpperCase()+t.slice(1));if(el)el.hidden=t!==ui.tab;}
  }
  function updateOldSimulator(){
    const sim=window.LifeSimulator;
    if(!sim?.state?.data)return;
    const p=ui.province,s=ui.settlement;
    if(sim.state.provinceId!==p.id){
      sim.state.provinceId=p.id;
      if(provinceSelect){provinceSelect.value=p.id;provinceSelect.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    if(s && sim.state.settlementId!==s.id){
      sim.state.settlementId=s.id;
      if(settlementSelect){settlementSelect.value=s.id;settlementSelect.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    if(locationProvinceSelect){locationProvinceSelect.value=p.id;locationProvinceSelect.dispatchEvent(new Event('change',{bubbles:true}));}
    if(s && locationSettlementSelect){locationSettlementSelect.value=s.id;locationSettlementSelect.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function render(){
    const p=ui.province, s=ui.settlement;
    $('bvs-provinceHeading').textContent=p.name;
    $('bvs-provinceDescription').textContent=`${p.settlements.length} named settlements • ${p.governmentType||'Provincial administration'} • ${p.primaryUtc||'Local time zone unavailable'}`;
    navItems.innerHTML=(document.getElementById('belavados-unified-app')?'<button type="button" data-bvs-generator="true">Generator</button>':'')+world.provinces.map(x=>`<button type="button" data-province-id="${escape(x.id)}" class="${x.id===p.id?'active':''}" aria-current="${x.id===p.id?'page':'false'}">${escape(x.name)}</button>`).join('');
    $('bvs-provinceSettlementDropdown').innerHTML=p.settlements.length?p.settlements.map(x=>`<option value="${escape(x.id)}" ${x.id===s?.id?'selected':''}>${escape(x.name)} (${escape(x.type)})</option>`).join(''):'<option value="">No named settlements in the source</option>';
    $('bvs-provinceSettlementDropdown').disabled=!p.settlements.length;
    renderOverview();
    renderResidents();
    renderRelationships();
    renderSchedules();
    renderServices();
    clock();updateOldSimulator();
    document.dispatchEvent(new CustomEvent('belavados:viewchange',{detail:{provinceId:p.id,settlementId:s?.id||null}}));
  }
  function small(n){return `<span class="explorer-tag">${escape(n)}</span>`;}
  function noSettlement(){return `<div class="empty-province"><h2>No named settlements yet</h2><p>The source map names ${escape(ui.province.name)} but supplies no settlement records for it. The province remains visible; no invented settlements have been added.</p></div>`;}
  function renderOverview(){
    const p=ui.province, s=ui.settlement;
    if(!s){$('bvs-explorerOverview').innerHTML=noSettlement();return}
    const people=npcList();
    const lat=Number(s.centerLatitude??0),lon=Number(s.centerLongitude??0);
    $('bvs-explorerOverview').innerHTML=`
      <div class="explorer-grid">
        <section class="explorer-pane"><h2>${escape(s.name)}</h2><div class="explorer-tags">${small(s.type)}${small(s.biome)}${small(s.dangerLevel)}${small(s.timeZone||p.primaryUtc)}</div>
          <p><b>Province:</b> ${escape(p.name)}</p><p><b>Government:</b> ${escape(s.governmentType)}</p><p><b>Population roster:</b> ${people.length} named simulated residents</p>
          <p><b>Terrain:</b> ${escape(s.biome)}</p><p><b>Province center (source):</b> ${escape(p.center?.latitude)}, ${escape(p.center?.longitude)}</p>
        </section>
        <section class="explorer-pane"><h2>Daily life</h2><p>Every resident has a named home, occupation, working location, daily time blocks and linked social relationships. Visit the Residents, Relationships and Schedules sections for their records.</p>
         <div class="explorer-tags">${small('Family networks')}${small('Romantic ties')}${small('Personal ties')}${small('Professional ties')}</div>
         <button type="button" data-open-tab="residents">Explore residents</button></section>
      </div>
      <section class="explorer-pane" style="margin-top:15px"><h2>Settlements of ${escape(p.name)}</h2><div class="settlement-map" id="bvs-settlementMap">${renderMapPins(p)}</div><p class="settlement-map-caption">Schematic placement using source coordinates where distinct; overlapping markers are separated for readability. Select a labeled marker to visit its settlement.</p></section>`;
  }
  function renderMapPins(p){
    const points=p.settlements.map((s,i)=>({s,i,x:Number(s.coordinates?.longitude??s.centerLongitude??p.center.longitude),y:Number(s.coordinates?.latitude??s.centerLatitude??p.center.latitude)}));
    let minx=Math.min(...points.map(v=>v.x)),maxx=Math.max(...points.map(v=>v.x));
    let miny=Math.min(...points.map(v=>v.y)),maxy=Math.max(...points.map(v=>v.y));
    const same=(maxx-minx)<.001 && (maxy-miny)<.001;
    return points.map(v=>{
      const x=same?50+38*Math.cos((v.i*2*Math.PI)/points.length):10+80*(v.x-minx)/(maxx-minx||1);
      const y=same?50+39*Math.sin((v.i*2*Math.PI)/points.length):12+76*(maxy-v.y)/(maxy-miny||1);
      return `<button type="button" class="settlement-pin ${ui.settlement?.id===v.s.id?'selected':''}" data-settlement-id="${escape(v.s.id)}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" title="${escape(v.s.name)}">${escape(v.s.name)}</button>`;
    }).join('');
  }
  function renderResidents(){
    const el=$('bvs-explorerResidents');if(!ui.settlement){el.innerHTML=noSettlement();return}
    const list=npcList().filter(n=>[n.name,n.race?.name,n.job?.title,n.job?.location,n.home].join(' ').toLowerCase().includes(ui.search.toLowerCase()));
    el.innerHTML=`<div class="explorer-pane"><h2>Residents of ${escape(ui.settlement.name)} (${npcList().length})</h2><label for="bvs-residentSearch">Search by name, species, heritage, profession or home</label><input id="bvs-residentSearch" class="explorer-search" type="search" value="${escape(ui.search)}" placeholder="Search residents..."/><div id="bvs-residentResults" class="resident-list">${renderResidentCards(list)}</div></div>`;
    $('bvs-residentSearch').addEventListener('input',event=>{ui.search=event.target.value;$('bvs-residentResults').innerHTML=renderResidentCards(npcList().filter(n=>[n.name,n.race?.name,n.job?.title,n.job?.location,n.home].join(' ').toLowerCase().includes(ui.search.toLowerCase())));});
  }
  function renderResidentCards(list){
    if(!list.length)return '<p>No matching residents.</p>';
    return list.map(n=>`<article class="resident-card"><h3>${escape(n.name)}</h3>
      <p>${escape(n.age)} years • ${escape(n.pronouns)} • ${escape(n.race?.name)} • ${escape(n.formalHonorific||n.preferredHonorific||'')} </p>
      <p><b>${escape(n.job?.title)}</b> • ${escape(n.job?.location)}</p>
      <p><b>Home:</b> ${escape(n.home||n.assignedLocations?.home?.name)}</p>
      <div class="resident-actions"><button data-focus-npc="${escape(n.id)}" data-destination="relationships">Relationships</button><button data-focus-npc="${escape(n.id)}" data-destination="schedules">Daily schedule</button></div></article>`).join('');
  }
  function findFocus(){
    const list=npcList();return list.find(n=>n.id===ui.focusNpc)||list[0];
  }
  function focusSelector(){
    return `<label class="settlement-menu-label">Choose resident <select id="bvs-focusResidentSelect">${npcList().map(n=>`<option value="${escape(n.id)}" ${findFocus()?.id===n.id?'selected':''}>${escape(n.name)} • ${escape(n.job?.title)}</option>`).join('')}</select></label>`;
  }
  function renderRelationships(){
    const el=$('bvs-explorerRelationships');const n=findFocus();if(!n){el.innerHTML=noSettlement();return}
    const kinds=['familial','romantic','personal','professional'];
    el.innerHTML=`<section class="explorer-pane"><h2>Relationship networks</h2><p>All relationships are reciprocal within each settlement. Select a connection to follow it to the other resident.</p>${focusSelector()}
      <h3 style="margin-top:14px">${escape(n.name)} • ${escape(n.race?.name)}</h3><div class="relationship-buckets">
      <p><b>Current status:</b> ${escape(n.romance?.currentStatus||'single')} • <b>Current attachments:</b> ${(n.romance?.currentPartnerIds||[]).length} • <b>Agreement:</b> ${escape((n.romance?.styles||[]).join(', ')||'None')}</p><details><summary>Former partners, widowhood and historical unions (${(n.relationshipHistory||[]).length})</summary>${(n.relationshipHistory||[]).map(h=>`<p>${escape(h.name)} · ${escape(h.type)}</p>`).join('')||'<p>No recorded history</p>'}</details><p><b>Parents:</b> ${(n.familyConnections?.parentIds||[]).length} • <b>Children:</b> ${(n.familyConnections?.childIds||[]).length} • <b>Half-siblings:</b> ${(n.familyConnections?.halfSiblingIds||[]).length}</p>
      ${kinds.map(kind=>`<section class="relationship-bucket ${kind}"><h3>${kind[0].toUpperCase()+kind.slice(1)} relationships</h3><div class="relationship-members">${(n.relationships?.[kind]||[]).length?(n.relationships[kind]||[]).map(r=>`<button type="button" data-focus-npc="${escape(r.npcId||r.id)}" data-destination="relationships">${escape(r.name||byId.get(r.npcId)?.name||'Resident')} · ${escape(r.type||r.label||kind)}</button>`).join(''):'No known ties'}</div></section>`).join('')}
      </div></section>`;
    $('bvs-focusResidentSelect').addEventListener('change',e=>{ui.focusNpc=e.target.value;renderRelationships()});
  }
  function currentLocalHour(){
    const offset=(ui.settlement?.timeZone||ui.province.primaryUtc||'UTC+0').match(/UTC\s*([+-])(\d{1,2})(?::(\d{2}))?/i);
    const minute=offset?(offset[1]==='-'?-1:1)*(Number(offset[2])*60+Number(offset[3]||0)):0;
    return new Date(Date.now()+minute*60000);
  }
  function clock(){
    const d=currentLocalHour();const utc = d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
    $('bvs-provinceClock').textContent=window.AzaCalendar?.display() || `${escape(ui.settlement?.timeZone||ui.province.primaryUtc)} · ${utc} · ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
  }
  function allSchedule(n){return n?.schedule||n?.schedules||[]}
  function renderSchedules(){
    const el=$('bvs-explorerSchedules'),n=findFocus();if(!n){el.innerHTML=noSettlement();return}
    const now=currentLocalHour().getUTCHours()*60+currentLocalHour().getUTCMinutes();
    el.innerHTML=`<section class="explorer-pane"><h2>Daily schedule · ${escape(ui.settlement.name)}</h2><p>Aza’raan 21-hour campaign clock. Original timetable values appear in parentheses; seven-day source labels are preserved as source metadata.</p>
      ${focusSelector()}<p><strong>${escape(n.name)}</strong>, ${escape(n.job?.title)} • home: ${escape(n.home||n.assignedLocations?.home?.name)}</p>
      <div class="day-table-wrap"><table class="day-table"><thead><tr><th>Aza’raan time (source)</th><th>Activity</th><th>Location</th><th>Repeats</th></tr></thead><tbody>${allSchedule(n).map(x=>{
      const st=x.start||x.startTime||'00:00',en=x.end||x.endTime||'00:00';const mins=(t)=>{let [h,m]=String(t).split(':').map(Number);return (h||0)*60+(m||0)};
      const convertedSt=window.AzaCalendar?.source24(st)||st,convertedEn=window.AzaCalendar?.source24(en)||en;const campaignNow=window.AzaCalendar?.getState();const campaignMin=campaignNow?campaignNow.hour*60+campaignNow.minute:now;const ongoing=campaignMin>=mins(convertedSt)&&campaignMin<mins(convertedEn);
      return `<tr class="${ongoing?'current-block':''}"><td>${escape(convertedSt)}–${escape(convertedEn)}<small> (source ${escape(st)}–${escape(en)})</small>${ongoing?' · Campaign Now':''}</td><td>${escape(x.activity)}</td><td>${escape(x.location?.name||x.locationName||x.location)}</td><td>${escape((x.days||x.weekday)==='Nebday–Valkhaday'?'Every Aza day (source 7-day range)':(x.days||x.weekday||'daily'))}</td></tr>`}).join('')}</tbody></table></div></section>`;
    $('bvs-focusResidentSelect').addEventListener('change',e=>{ui.focusNpc=e.target.value;renderSchedules()});
  }
  function renderServices(){
    const el=$('bvs-explorerServices');if(!ui.settlement){el.innerHTML=noSettlement();return}
    const key=ui.settlement.immersiveTemplateId;
    const t=world.templates[key];
    if(!t){el.innerHTML=`<p>Missing location profile: ${escape(key)}</p>`;return}
    el.innerHTML=`<section class="explorer-pane"><h2>${escape(ui.settlement.name)} · ${escape(t.title)}</h2>
     <p>Explore ${escape(t.size)} ${escape(t.biome)} locations, services, and trade.</p>
     <div class="catalog-search-row"><input id="bvs-catalogSearch" type="search" placeholder="Search goods, services, prices or locations…" value="${escape(ui.itemSearch)}"><strong>${t.inventory.length} entries</strong></div>
     <div id="bvs-catalogResults" class="catalog-results"></div>
     <details class="immersive-original" open><summary>Settlement guide</summary><div class="immersive-source">${t.html}</div></details>
     </section>`;
    $('bvs-catalogSearch').addEventListener('input', e=>{ui.itemSearch=e.target.value;renderItemResults(t)});
    renderItemResults(t);
  }
  function renderItemResults(t){
    const q=ui.itemSearch.trim().toLowerCase(),out=$('bvs-catalogResults');if(!out)return;
    if(!q){out.innerHTML='<p class="hint">Search goods, services, locations, and prices.</p>';return}
    const result=t.inventory.filter(x=>[x.item,x.category,x.price,x.location,x.notes].join(' ').toLowerCase().includes(q)).slice(0,80);
    out.innerHTML=`<p class="hint">${result.length}${result.length===80?'+':''} matching entries</p>`+(result.length?result.map(x=>`<div class="catalog-row"><span>${escape(x.item)}</span><strong>${escape(x.price)}</strong><span>${escape(x.location)}</span></div>`).join(''):'<p>No matching location services found.</p>');
  }
  // Province-only master navigation. Drag handle works with mouse, touchscreen and stylus.
  navItems.addEventListener('click',event=>{const btn=event.target.closest('[data-province-id]');if(btn)changeProvince(world.provinces.find(x=>x.id===btn.dataset.provinceId));});
  $('bvs-provinceSettlementDropdown').addEventListener('change',e=>changeSettlement(e.target.value));
  $('bvs-provincePageTabs').addEventListener('click',e=>{const b=e.target.closest('[data-explorer-tab]');if(b)setTab(b.dataset.explorerTab);});
  $('bvs-provincePage').addEventListener('click',e=>{
    const tab=e.target.closest('[data-open-tab]');if(tab){setTab(tab.dataset.openTab);return}
    const pin=e.target.closest('[data-settlement-id]');if(pin){changeSettlement(pin.dataset.settlementId);return}
    const focus=e.target.closest('[data-focus-npc]');if(focus){ui.focusNpc=focus.dataset.focusNpc;setTab(focus.dataset.destination||'relationships');renderRelationships();renderSchedules();}
  });
  $('bvs-importSettlementNpcsBtn').addEventListener('click',()=>{
    const sim=window.LifeSimulator;if(!sim?.state?.data||!ui.settlement){$('bvs-npcImportStatus').textContent='No active settlement or generator';return}
    const records=bySettlement.get(ui.settlement.id)||[];
    const have=new Set(sim.state.npcs.map(n=>n.id));
    const newRows=records.filter(n=>!have.has(n.id)).map(n=>({
      ...JSON.parse(JSON.stringify(n)),
      assignment:{provinceId:n.provinceId,provinceName:n.provinceName,settlementId:n.settlementId,settlementName:n.settlementName},
      source:{type:'imported',priority:'settlement-canon',file:'../../json/settlement_npcs.json'},
      protectedFields:['id','name','race','age','job','schedule','relationships','assignment'],
      importedRaw:n,
      schedules:n.schedule.map(x=>({startTime:x.start,endTime:x.end,activity:x.activity,locationName:x.location,weekday:x.days})),
    }));
    sim.state.npcs.push(...newRows);
    sim.actions.ensureNpcExpansion(newRows,sim.helpers.makeRng(ui.settlement.id+'|base-canon'),{linkExisting:true});
    sim.actions.renderAll();
    $('bvs-npcImportStatus').textContent=`Imported ${newRows.length} new resident records from ${ui.settlement.name}; ${records.length-newRows.length} were already in the generator.`;
    renderResidents();renderRelationships();renderSchedules();
  });
  let navState={collapsed:!document.getElementById('belavados-unified-app')||window.innerWidth<900,left:12,top:95};try{navState={...navState,...JSON.parse(localStorage.getItem(navStore)||'{}')}}catch{}
  const saveNav=()=>{try{localStorage.setItem(navStore,JSON.stringify(navState))}catch{}};
  function applyNav(){nav.classList.toggle('collapsed',!!navState.collapsed);nav.style.left=`${Math.max(0,Math.min(window.innerWidth-72,navState.left))}px`;nav.style.top=`${Math.max(0,Math.min(window.innerHeight-48,navState.top))}px`;}
  $('bvs-navCollapse').addEventListener('click',e=>{e.stopPropagation();navState.collapsed=!navState.collapsed;applyNav();saveNav();});
  const handle=$('bvs-navDrag');let drag=null;
  handle.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;if(e.button!==0&&e.pointerType==='mouse')return;drag={id:e.pointerId,dx:e.clientX-nav.getBoundingClientRect().left,dy:e.clientY-nav.getBoundingClientRect().top};handle.setPointerCapture(e.pointerId)});
  handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;navState.left=Math.max(0,Math.min(window.innerWidth-nav.offsetWidth,e.clientX-drag.dx));navState.top=Math.max(0,Math.min(window.innerHeight-48,e.clientY-drag.dy));applyNav();});
  handle.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;saveNav()});
  handle.addEventListener('pointercancel',()=>{drag=null;saveNav()});
  window.addEventListener('resize',applyNav);applyNav();
  window.addEventListener('life-simulator:ready',()=>updateOldSimulator(),{once:true});
  window.addEventListener('life-simulator:core-rendered',()=>{renderOverview();renderResidents();renderRelationships();renderSchedules();});
  render();setTab('overview');
  // Active tools are inside each province's own page; no other application pages or master-nav items.
  document.addEventListener('aza-calendar:change',()=>{if(ui.settlement){clock();renderSchedules();}});
  setInterval(clock,60000);
  window.BelavadosLivingWorld={world,ui,changeProvince,changeSettlement,setTab,refresh:render};
})();
