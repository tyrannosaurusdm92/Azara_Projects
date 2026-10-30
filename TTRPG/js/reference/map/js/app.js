(function(){
const U=BelUtils;
const STORE='belavados_player_map_site_v1';

function isDMMode(){return location.hash==='#dm-editor';}
function safeToast(msg){try{U.toast(msg);}catch(e){console.warn(msg,e);}}
function stripHeavyForStorage(state){
  const clone=JSON.parse(JSON.stringify(state||{settlements:[],selectedId:null}));
  (clone.settlements||[]).forEach(s=>{
    if(s?.map?.svgText && s.map.svgText.length>450000){
      s.map.svgText='';
      s.map.svgTextOmittedForLocalStorage=true;
    }
    if(Array.isArray(s.npcs) && s.npcs.length>260){
      s.npcs=s.npcs.slice(0,260);
      s.localStoragePrunedNPCs=true;
    }
  });
  return clone;
}
const App={
  data:null,
  state:{settlements:[],selectedId:null},
  uploadedSettlements:[],
  storageWarning:'',
  currentSettlement(){return (this.state.settlements||[]).find(s=>s.id===this.state.selectedId)||this.state.settlements?.[0]||null;},
  saveLocal(){
    try{
      localStorage.setItem(STORE,JSON.stringify(this.state));
      this.storageWarning='';
      return true;
    }catch(err){
      try{
        const compact=stripHeavyForStorage(this.state);
        localStorage.setItem(STORE,JSON.stringify(compact));
        this.storageWarning='Local browser storage was full, so very large embedded SVG/NPC payloads were compacted locally. Use Export Player Data to publish the full map bundle.';
        safeToast(this.storageWarning);
        return true;
      }catch(err2){
        this.storageWarning='Browser local storage is full or blocked. The editor will still work in this session; use Export Player Data to save your work.';
        console.warn('Belavadós map local save failed:',err2);
        safeToast(this.storageWarning);
        return false;
      }
    }
  },
  loadLocal(){
    try{
      const s=JSON.parse(localStorage.getItem(STORE)||'null');
      if(s&&Array.isArray(s.settlements)) this.state=s;
    }catch(e){
      console.warn('Belavadós map local load failed; starting with bundled data.',e);
      this.state={settlements:[],selectedId:null};
    }
  },
  upsertSettlement(s,select=true){
    if(!s)return;
    s.id=s.id||U.slug(`${s.province}-${s.settlementName}`);
    const i=this.state.settlements.findIndex(x=>x.id===s.id);
    if(i>=0)this.state.settlements[i]=s; else this.state.settlements.push(s);
    if(select)this.state.selectedId=s.id;
    this.saveLocal();
    populateSelectors(this);
  },
  renderAll(){
    try{
      if(isDMMode()) BelDM.render(this); else BelPlayer.render(this);
    }catch(e){
      console.error('Belavadós map render failed:',e);
      showStartupError(e);
    }
    try{BelTime.render(this.data,this.currentSettlement());}catch(e){console.warn('Belavadós time render failed:',e);}
  }
};

function showStartupError(err){
  const msg=(err&&err.message)||String(err||'Unknown startup error');
  const target=U.$('dmStats')||U.$('settlementInfo')||document.body;
  if(target){
    target.innerHTML=`<div class="empty"><strong>The Belavadós map shell loaded, but one startup step failed.</strong><br>${U.esc(msg)}<br><br>Try clearing old browser site data for this page, then reload. Export buttons and SVG uploads are still protected from crashing the whole page.</div>`;
  }
}
function setupMode(){
  const dm=isDMMode();
  document.body.classList.toggle('dm-mode',dm);
  document.body.classList.toggle('player-mode',!dm);
  const title=U.$('siteTitle'), chip=U.$('modeChip'), sub=U.$('siteSubtitle');
  if(title) title.textContent=dm?'Belavadós Hidden DM Settlement Editor':'Belavadós Player Settlement Map';
  if(chip) chip.textContent=dm?'DM Editor Mode':'Player Mode';
  if(sub && dm) sub.textContent='SVG-only hidden DM back door. Upload clickable SVG maps with blank locations, autofill them through the location generator, and assign Sims-style NPC lives without manual pin creation.';
}
function populateSelectors(app){
  if(!app.data)return;
  const defaults=app.data.settlementsByProvince||{};
  const provs=Object.keys(defaults).filter(p=>(defaults[p]||[]).length || app.state.settlements.some(s=>s.province===p)).sort();
  const allProvs=U.uniq(provs.concat(Object.keys(app.data.provinceByName||{}))).sort();
  ['provinceSelect','dmProvinceSelect'].forEach(id=>{const el=U.$(id); if(el) el.innerHTML=allProvs.map(p=>`<option>${U.esc(p)}</option>`).join('');});
  const current=app.currentSettlement();
  if(current){const ps=U.$('provinceSelect'), dps=U.$('dmProvinceSelect'); if(ps)ps.value=current.province; if(dps)dps.value=current.province;}
  populateSettlementDropdown(app);
  const biome=U.$('dmBiomeSelect'); if(biome) biome.innerHTML=(app.data.biomes||[]).map(b=>`<option>${U.esc(b)}</option>`).join('');
  syncDMFields(app);
}
function populateSettlementDropdown(app){
  if(!app.data)return;
  const prov=U.$('provinceSelect')?.value || U.$('dmProvinceSelect')?.value || Object.keys(app.data.settlementsByProvince||{})[0];
  const saved=app.state.settlements.filter(s=>s.province===prov);
  const defaults=(app.data.settlementsByProvince?.[prov]||[]).filter(d=>!saved.some(s=>s.settlementName===d.settlementName));
  const merged=saved.concat(defaults);
  const sel=U.$('settlementSelect');
  if(sel){
    sel.innerHTML=merged.map(s=>`<option value="${U.esc(s.id)}">${U.esc(s.settlementName)}</option>`).join('');
    if(app.state.selectedId&&merged.some(s=>s.id===app.state.selectedId)) sel.value=app.state.selectedId; else if(merged[0]) sel.value=merged[0].id;
  }
  const opt=merged.find(s=>s.id===(sel?.value));
  if(opt && !app.state.settlements.some(s=>s.id===opt.id)){
    const full=BelGenerator.generateSettlement(app.data,{province:opt.province,settlementName:opt.settlementName,size:opt.size||opt.settlementType||'Town',biome:opt.biome||'Grassland Plains',governmentType:opt.governmentType,dangerLevel:opt.dangerLevel,alignmentPreference:opt.alignmentPreference,tags:(opt.tags||[]).join(', '),locationCount:Math.min(80,opt.settlementType==='Capital City'?120:opt.settlementType==='City'?90:50),npcCount:Math.min(180,opt.settlementType==='Capital City'?240:opt.settlementType==='City'?180:100),timeZone:opt.timeZone,displayTimeZones:opt.displayTimeZones});
    app.upsertSettlement(full,true);
    return;
  }
  if(opt){app.state.selectedId=opt.id; app.saveLocal();}
}
function syncDMFields(app){
  const s=app.currentSettlement(); if(!s)return;
  const ids={dmSettlementName:s.settlementName,dmSettlementSize:s.size||s.settlementType,dmBiomeSelect:s.biome,dmGovernmentType:s.governmentType,dmDanger:s.dangerLevel,dmAlignmentPref:s.alignmentPreference,dmTags:(s.tags||[]).join(', '),dmLocationCount:(s.locations||[]).length||60,dmNpcCount:(s.npcs||[]).length||120};
  Object.entries(ids).forEach(([id,val])=>{const el=U.$(id); if(el&&val!=null)el.value=val;});
}
function showPage(nav, pageId){
  const group=nav.id==='dmTabs'?'dm-only':'player-only';
  U.$$(`.page.${group}`).forEach(p=>p.classList.toggle('active',p.id===pageId));
  U.$$('#'+nav.id+' .page-tab').forEach(b=>{b.classList.toggle('active',b.dataset.page===pageId); b.classList.toggle('secondary',b.dataset.page!==pageId);});
}
function wireTabs(){
  U.$$('.page-tabs').forEach(nav=>nav.addEventListener('click',e=>{const btn=e.target.closest('[data-page]'); if(!btn)return; showPage(nav,btn.dataset.page); App.renderAll();}));
  if(isDMMode()) showPage(U.$('dmTabs'), 'dm-control'); else showPage(U.$('playerTabs'), 'player-map');
}
function wireSelectors(app){
  U.$('provinceSelect')?.addEventListener('change',()=>{populateSettlementDropdown(app); app.renderAll(); syncDMFields(app);});
  U.$('settlementSelect')?.addEventListener('change',()=>{app.state.selectedId=U.$('settlementSelect').value; app.saveLocal(); syncDMFields(app); app.renderAll();});
  U.$('dmProvinceSelect')?.addEventListener('change',()=>{const p=U.$('dmProvinceSelect').value; const ps=U.$('provinceSelect'); if(ps)ps.value=p; populateSettlementDropdown(app); syncDMFields(app); app.renderAll();});
}
async function ensureSeedSettlement(){
  if(App.state.settlements.length)return;
  const seed=App.data.defaultSettlements.find(s=>s.province==='Aelvanyr'&&s.settlementName==='Elarvess')||App.data.defaultSettlements[0]||{province:'Aelvanyr',settlementName:'Elarvess',size:'Town',biome:'Forest'};
  const s=BelGenerator.generateSettlement(App.data,{province:seed.province,settlementName:seed.settlementName,size:seed.size||seed.settlementType||'Town',biome:seed.biome||'Forest',governmentType:seed.governmentType,dangerLevel:seed.dangerLevel,alignmentPreference:seed.alignmentPreference,tags:(seed.tags||[]).join(', '),locationCount:90,npcCount:160,timeZone:seed.timeZone,displayTimeZones:seed.displayTimeZones});
  App.upsertSettlement(s,true);
}
async function init(){
  setupMode();
  try{BelNav.init();}catch(e){console.warn('Navigation setup failed:',e);}
  wireTabs();
  try{
    App.data=await BelData.loadAll();
    App.loadLocal();
    (App.data.playerSettlements?.settlements||[]).forEach(s=>{if(!App.state.settlements.some(x=>x.id===s.id)) App.state.settlements.push(s);});
    await ensureSeedSettlement();
    populateSelectors(App);
    wireSelectors(App);
    try{BelMap.init(App);}catch(e){console.warn('Map controls setup failed:',e);}
    try{BelPlayer.init(App);}catch(e){console.warn('Player controls setup failed:',e);}
    try{BelDM.init(App);}catch(e){console.warn('DM controls setup failed:',e);}
    try{BelTime.init(App);}catch(e){console.warn('Time setup failed:',e);}
    window.BelApp=App;
    App.renderAll();
  }catch(e){
    console.error('Belavadós map startup failed:',e);
    showStartupError(e);
  }
  window.addEventListener('hashchange',()=>{setupMode(); wireTabs(); App.renderAll();});
}
document.addEventListener('DOMContentLoaded',init);
})();
