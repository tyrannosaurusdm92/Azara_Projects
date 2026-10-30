/* Elarvess (Aelvanyr) interactive, pixel-registered settlement map.
 * Image and the GeoJSON-derived paths share the same 0..1920 square SVG viewBox.
 * Buildings are not guessed onto the artwork: geometry is derived using
 * x = (worldX + 1750) * 1920 / 3500; y = (1750 - worldY) * 1920 / 3500.
 * All other provinces / settlements retain their existing atlas and records.
 */
(() => {
  'use strict';
  const app = window.BelavadosLivingWorld;
  const dashboard = window.BelavadosSettlementDashboard;
  const buildings = window.ELARVESS_MAP_BUILDINGS;
  if (!app || !dashboard || !Array.isArray(buildings)) return;
  const $ = id => document.getElementById(id);
  const TARGET = 'aelvanyr-elarvess';
  const W = 1920, byId = new Map(buildings.map(b => [String(b.id), b]));
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').trim().toLocaleLowerCase();
  const labelType = s => String(s || 'Unknown').replaceAll('_',' ').toLocaleLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const mapViewer = $('mapViewer'), canvas = $('worldMapCanvas'), image = $('worldTemplateMapImage'), frame = $('worldTemplateMapFrame');
  const mapStatus = $('mapStatus'), hint = $('worldMapHint'), templateStatus = $('worldMapTemplateStatus');
  if (!mapViewer) return;
  let mode = 'atlas', active = false, selectedId = null, zoom = 1, vx = 0, vy = 0;
  let lastPointer = null, wasDrag = false, dragging = false, showOutlines = false, syncingLocation = false;
  const paths = new Map();

  const root = document.createElement('div');
  root.id = 'elarvessMapLayer'; root.hidden = true;
  root.innerHTML = `
    <svg id="elarvessSvg" viewBox="0 0 1920 1920" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Elarvess illustrated map with accurately aligned clickable GeoJSON building footprints">
      <image x="0" y="0" width="1920" height="1920" preserveAspectRatio="none" href="assets/maps/elarvess.png"/>
      <g id="elarvessBuildings"></g>
    </svg>
    <div class="elarvess-toolbar" role="toolbar" aria-label="Elarvess map controls">
      <input id="elarvessSearch" class="elf-search" type="search" placeholder="Find a named building…" aria-label="Find a building by name">
      <select id="elarvessFilter" class="elf-filter" aria-label="Filter building category"><option value="">All buildings</option></select>
      <button type="button" id="elarvessZoomIn" title="Zoom in" aria-label="Zoom in">+</button>
      <button type="button" id="elarvessZoomOut" title="Zoom out" aria-label="Zoom out">−</button>
      <button type="button" id="elarvessZoomReset" title="Full map">Fit</button>
      <button type="button" id="elarvessOutlines" class="elf-toggle" aria-pressed="false" title="Show or hide all outlines">Outlines</button>
    </div>
    <div id="elarvessZoomLabel" class="elarvess-zoom">100% · Drag to pan • Scroll to zoom • Tap buildings</div>`;
  mapViewer.append(root);
  const inspector = document.createElement('section');
  inspector.id = 'elarvessMapInspector'; inspector.hidden = true;
  inspector.setAttribute('aria-label','Elarvess map building details');
  inspector.innerHTML = `
    <h3 id="elarvessSelectedTitle">Elarvess • Building map</h3>
    <p id="elarvessSelectedDetails">Select a building on the map or find one by name. Every shaded footprint corresponds to its exact building.</p>
    <div id="elarvessLinkedRecords"></div>
    <div id="elarvessSearchResults" class="elf-results" role="group" aria-label="Building search results"></div>
    <p class="elf-muted">All 1,312 buildings use their single canonical names and fixed footprint IDs. No alternate names or manual cross-location links are used.</p>`;
  mapViewer.insertAdjacentElement('afterend', inspector);
  const toolbar = $('worldMapRefresh')?.parentElement;
  const showMapButton = document.createElement('button');
  showMapButton.id = 'elarvessShowMap'; showMapButton.type='button'; showMapButton.className='ghost';
  showMapButton.textContent = 'Show Elarvess Building Map'; showMapButton.hidden = true;
  toolbar?.append(showMapButton);
  const svg = $('elarvessSvg'), group = $('elarvessBuildings'), search = $('elarvessSearch'), filter = $('elarvessFilter');
  const richBuildings = new Map((window.ELARVESS_POPULATION?.buildings||[]).map(b=>[String(b.id),b]));
  const types = [...new Set(buildings.map(b=>b.type))].sort();
  types.forEach(type=>{const o=document.createElement('option');o.value=type;o.textContent=labelType(type);filter.append(o);});

  // Precomputed source footprint paths preserve subpixel alignment; use actual SVG hit-testing.
  const frag = document.createDocumentFragment();
  const ns = 'http://www.w3.org/2000/svg';
  for (const building of buildings) {
    const path = document.createElementNS(ns,'path');
    path.classList.add('elf-building');
    path.setAttribute('d',building.d);
    path.setAttribute('data-geo-id',String(building.id));
    path.setAttribute('tabindex','0');path.setAttribute('role','button');
    const rich=richBuildings.get(String(building.id));
    path.setAttribute('aria-label',`${rich?.name||building.name}, ${rich?.address||''}, ${labelType(building.type)}, building ${building.id}`);
    const title = document.createElementNS(ns,'title');
    title.textContent = `${rich?.name||building.name} • ${rich?.address||''} • ${labelType(building.type)} • GeoJSON #${building.id}`;
    path.append(title); frag.append(path);
    paths.set(String(building.id),path);
  }
  group.append(frag);
  function current() { return app.ui.settlement?.id === TARGET; }
  function listPlaces() { return dashboard.getPlaces() || []; }
  // Canonical place-name joins are determined by the immutable original footprint ID.
  function resolvedLink(b) {
    if (!b) return '';
    const canonical=richBuildings.get(String(b.id));
    return canonical?.name || '';
  }
  function openLocation(placeName, scroll=true){
    const sel=$('worldLocationSelect');
    const opt=[...sel.options].find(o=>o.textContent===placeName);
    if(!opt)return;
    if(sel.value!==opt.value){
      syncingLocation=true;sel.value=opt.value;sel.dispatchEvent(new Event('change',{bubbles:true}));syncingLocation=false;
    }
    if(scroll)$('worldLocationInfo')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function openNpc(npcId){
    const sel=$('worldNpcSelect');if(!sel)return;
    if(![...sel.options].some(o=>o.value===npcId))return;
    sel.value=npcId;sel.dispatchEvent(new Event('change',{bubbles:true}));
    $('worldNpcInfo')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function renderInspector(){
    const b=byId.get(selectedId);
    const title=$('elarvessSelectedTitle'),detail=$('elarvessSelectedDetails'),records=$('elarvessLinkedRecords');
    if(!b){
      title.textContent=`Elarvess (Aelvanyr) • ${buildings.length.toLocaleString()} clickable buildings`;
      detail.textContent='Select any original footprint to inspect the canonical named building, its residents, work, school and visitors.';
      records.innerHTML='<p class="elf-muted">The map and settlement directory resolve the same canonical building IDs.</p>';
      return;
    }
    const rich=richBuildings.get(String(b.id));
    title.textContent=`${rich?.name||b.name} • Building #${b.id}`;
    detail.textContent=`${rich?.address||''} • ${labelType(b.type)} • ${labelType(b.material)} • exact unchanged illustrated footprint`;
    const place=listPlaces().find(p => Number(p.buildingId)===Number(b.id));
    if(!place){records.innerHTML='<p class="elf-muted">Building record is still available below in the living directory.</p>';return;}
    const categories=[['Lives here',place.residents],['Works/studies here',place.employees],['Visits during week',place.visitors]];
    const related=new Map();
    for (const [kind,arr] of categories) for (const n of arr){
      if(!related.has(n.id))related.set(n.id,{n,roles:[]});
      related.get(n.id).roles.push(kind);
    }
    records.innerHTML=`<p><strong>Canonical mapped location:</strong> ${escapeHtml(place.name)} • ${place.catalog.length} catalogue entries</p>
      <p class="elf-muted">${place.residents.length} residents · ${place.employees.length} workers/students · ${place.visitors.length} six-day visitors</p>
      <div class="elf-people">${[...related.values()].slice(0,60).map(x=>`<button type="button" data-elf-npc="${escapeHtml(x.n.id)}" title="${escapeHtml(x.roles.join(', '))}">${escapeHtml(x.n.name)} · ${escapeHtml(x.roles.join(', '))}</button>`).join('')||'<span class="elf-muted">No NPCs assigned to this building.</span>'}</div>`;
  }
  function selectBuilding(id, focus=false){
    const b=byId.get(String(id));if(!b)return;
    if(selectedId) paths.get(selectedId)?.classList.remove('elf-selected');
    selectedId=String(b.id);paths.get(selectedId)?.classList.add('elf-selected');
    if(filter.value && filter.value!==b.type){filter.value='';applyFilter();}
    renderInspector();document.dispatchEvent(new CustomEvent('elarvess:building-selected',{detail:{id:b.id}}));
    const link=resolvedLink(b);if(link)openLocation(link,false);
    if(focus)zoomTo(b,Math.max(zoom,5));
  }
  function applyFilter(){
    const t=filter.value;
    for(const b of buildings)paths.get(String(b.id))?.classList.toggle('elf-filtered',Boolean(t&&b.type!==t&&String(b.id)!==selectedId));
    renderSearch();
  }
  function renderSearch(){
    const q=norm(search.value),t=filter.value;
    const results=buildings.filter(b=>(!t||b.type===t) && (!q||norm(b.name).includes(q)||norm(richBuildings.get(String(b.id))?.name).includes(q)||norm(richBuildings.get(String(b.id))?.address).includes(q)||String(b.id)===q));
    const limit=q?24:0;
    $('elarvessSearchResults').innerHTML=(!q?'':`<p class="elf-muted">${results.length} building${results.length===1?'':'s'} found • Select a result to zoom to its precise footprint</p>`)
      + results.slice(0,limit).map(b=>`<button type="button" data-elf-result="${b.id}">${escapeHtml(richBuildings.get(String(b.id))?.name||b.name)} <small>• ${escapeHtml(richBuildings.get(String(b.id))?.address||'')} • #${b.id}</small></button>`).join('');
  }
  function clampView(){const size=W/zoom;vx=Math.max(0,Math.min(W-size,vx));vy=Math.max(0,Math.min(W-size,vy));}
  function updateView(){clampView();const size=W/zoom;svg.setAttribute('viewBox',`${vx.toFixed(5)} ${vy.toFixed(5)} ${size.toFixed(5)} ${size.toFixed(5)}`);$('elarvessZoomLabel').textContent=`${Math.round(zoom*100)}% · Drag to pan • Scroll to zoom • Tap buildings`;}
  function focusPoint(clientX,clientY){
    const rect=svg.getBoundingClientRect(),sq=Math.min(rect.width,rect.height)||1;
    const offX=(rect.width-sq)/2,offY=(rect.height-sq)/2;
    return {x:vx+((clientX-rect.left-offX)/sq)*(W/zoom),y:vy+((clientY-rect.top-offY)/sq)*(W/zoom)};
  }
  function setZoom(value,focus){
    const next=Math.max(1,Math.min(14,value)),previous=W/zoom;
    const point=focus||{x:vx+previous/2,y:vy+previous/2};
    const newSize=W/next;
    vx=point.x-(point.x-vx)*newSize/previous;
    vy=point.y-(point.y-vy)*newSize/previous;
    zoom=next;updateView();
  }
  function zoomTo(b,next){zoom=Math.max(1,Math.min(14,next));vx=b.x-W/zoom/2;vy=b.y-W/zoom/2;updateView();}
  function resetView(){zoom=1;vx=vy=0;updateView();}
  function showMap(reset=false){
    if(!current())return;
    mode='geo';active=true;
    canvas.hidden=true;image.hidden=true;frame.hidden=true;
    root.hidden=false;inspector.hidden=false;mapViewer.classList.add('elarvess-active');
    showMapButton.hidden=false;
    renderInspector();if(reset)resetView();
    mapStatus.textContent=`Elarvess • ${buildings.length.toLocaleString()} clickable buildings`;
    hint.textContent='Tap a footprint or search by its canonical building name or address. Zoom to select smaller sites.';
    templateStatus.textContent='Elarvess image and 1,312 unchanged clickable building footprints share one aligned SVG viewport. Each ID has one canonical name.';
  }
  function showAtlas(){
    mode='atlas';active=false;root.hidden=true;inspector.hidden=true;mapViewer.classList.remove('elarvess-active');
    canvas.hidden=false;image.hidden=true;frame.hidden=true;showMapButton.hidden=!current();
    mapStatus.textContent='Aelvanyr • Province atlas';
    hint.textContent='Province atlas: choose a settlement marker, or return to the Elarvess building map.';
    templateStatus.textContent='Showing the original Aelvanyr province atlas. The Elarvess clickable building map is still available.';
  }
  function hideOnOtherSettlement(){
    mode='atlas';active=false;root.hidden=true;inspector.hidden=true;mapViewer.classList.remove('elarvess-active');showMapButton.hidden=true;
  }
  function onSettlementChange(){if(current()){showMap();}else hideOnOtherSettlement();}
  group.addEventListener('click', e=>{
    if(!active||wasDrag)return;
    const path=e.target.closest('[data-geo-id]');if(path)selectBuilding(path.dataset.geoId);
  });
  group.addEventListener('dblclick',e=>{
    const path=e.target.closest('[data-geo-id]');if(path){e.preventDefault();selectBuilding(path.dataset.geoId,true);}
  });
  group.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){const el=e.target.closest('[data-geo-id]');if(el){e.preventDefault();selectBuilding(el.dataset.geoId,true);}}
  });
  svg.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    dragging=true;wasDrag=false;lastPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
  });
  svg.addEventListener('pointermove',e=>{
    if(!dragging||!lastPointer||e.pointerId!==lastPointer.id)return;
    const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
    if(!wasDrag&&Math.hypot(dx,dy)<3)return;
    if(!wasDrag){wasDrag=true;svg.setPointerCapture(e.pointerId);}
    svg.classList.add('elf-dragging');
    const rect=svg.getBoundingClientRect(),size=Math.min(rect.width,rect.height)||1;
    vx-=dx*(W/zoom)/size;vy-=dy*(W/zoom)/size;
    lastPointer={id:e.pointerId,x:e.clientX,y:e.clientY};updateView();
  });
  function finishPointer(e){if(!lastPointer||e.pointerId!==lastPointer.id)return;dragging=false;lastPointer=null;svg.classList.remove('elf-dragging');
    if(wasDrag){ /* suppress the browser click caused by the drag once */
      const suppress=ev=>{ev.stopImmediatePropagation();svg.removeEventListener('click',suppress,true);};
      svg.addEventListener('click',suppress,true);
      setTimeout(()=>svg.removeEventListener('click',suppress,true),120);
    }
    wasDrag=false;
  }
  svg.addEventListener('pointerup',finishPointer);
  svg.addEventListener('pointercancel',finishPointer);
  svg.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();const point=focusPoint(e.clientX,e.clientY);setZoom(zoom*(e.deltaY<0?1.22:1/1.22),point);},{passive:false});
  $('elarvessZoomIn').addEventListener('click',()=>setZoom(zoom*1.5));
  $('elarvessZoomOut').addEventListener('click',()=>setZoom(zoom/1.5));
  $('elarvessZoomReset').addEventListener('click',resetView);
  $('elarvessOutlines').addEventListener('click',()=>{
    showOutlines=!showOutlines;group.classList.toggle('elf-outlines',showOutlines);
    $('elarvessOutlines').setAttribute('aria-pressed',String(showOutlines));
  });
  filter.addEventListener('change',applyFilter);
  search.addEventListener('input',renderSearch);
  search.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    const q=norm(search.value),b=buildings.find(x=>(!filter.value||x.type===filter.value)&&norm(x.name).includes(q));
    if(b)selectBuilding(b.id,true);
  });
  $('elarvessSearchResults').addEventListener('click',e=>{
    const button=e.target.closest('[data-elf-result]');if(button)selectBuilding(button.dataset.elfResult,true);
  });
  $('elarvessLinkedRecords').addEventListener('click',e=>{
    const button=e.target.closest('[data-elf-npc]');if(button)openNpc(button.dataset.elfNpc);
  });
  $('worldLocationSelect')?.addEventListener('change',e=>{
    if(!active||syncingLocation)return;
    const name=e.target.selectedOptions?.[0]?.textContent;
    const hit=buildings.find(b=>resolvedLink(b)===name);
    if(hit && String(hit.id)!==selectedId)selectBuilding(hit.id,true);
  });
  showMapButton.addEventListener('click',()=>showMap());
  $('worldRestoreAtlas')?.addEventListener('click',()=>{if(current())showAtlas();});
  $('worldMapRefresh')?.addEventListener('click',()=>{if(current()){if(mode==='atlas')showAtlas();else {showMap(true);}}});
  // A user-supplied replacement template still works. Returning to our map is always one click away.
  $('worldMapTemplateInput')?.addEventListener('change',e=>{
    if(current()&&e.target.files?.length){mode='template';active=false;root.hidden=true;inspector.hidden=true;mapViewer.classList.remove('elarvess-active');showMapButton.hidden=false;}
  });
  document.addEventListener('belavados:viewchange',onSettlementChange);
  resetView();renderInspector();onSettlementChange();
  window.BelavadosElarvessMap = {show:showMap,showAtlas,selectBuilding,resetView,getLinks:()=>Object.fromEntries(buildings.map(b=>[String(b.id),resolvedLink(b)])),featureCount:buildings.length};
})();
