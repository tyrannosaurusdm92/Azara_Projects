/* Belavadós V10 original cartography enhancer.
   TownGeneratorOS studied as architecture/reference only, not Haxe copied.
   Preserves every original building, NPC, schedule, and the Elarvess overlay. */
(function(){'use strict';
const ns='http://www.w3.org/2000/svg';
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function random(h){return()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};}
function svg(tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));return n;}
function enc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const profiles=[
 ['Coastal',/coast|dock|beach|waterfront|port|harbor|maritime|reef|ocean/i,'#397c8b','#548d94'],
 ['Island',/island|archipelago/i,'#428d90','#4e8d6e'],
 ['Arid',/desert|arid|dune|sand|badland/i,'#b29464','#c0a97e'],
 ['Highland',/mountain|cliff|alpine|highland|peak/i,'#627778','#6f918b'],
 ['Woodland',/forest|wood|grove|jungle|rainforest/i,'#3e654a','#558b66'],
 ['Wetland',/marsh|swamp|fen|wetland|bog/i,'#5b7863','#6b9d8f'],
 ['Frostbound',/snow|ice|frost|glacier|tundra/i,'#7897a0','#b3cbca'],
 ['Lowland',/.*/,'#5b744a','#74a16a']
];
function profile(data){const biome=String(data.biome||data.settlementBiome||data.map?.terrain?.biome||'');return {seed:hash(data.settlementId+'|'+biome),type:profiles.find(x=>x[1].test(biome))||profiles[7]};}
function districts(data){
 const byName=new Map(),keep=(name,x,y)=>{const k=String(name||'').trim().toLowerCase();if(k&&!byName.has(k))byName.set(k,{name:String(name),x:Number(x)||960,y:Number(y)||960,buildings:[],types:{},residents:0});};
 for(const w of data.map?.wards||[])keep(w.name,w.x,w.y);
 for(const p of data.map?.townGeneratorOSTopology?.patches||[])keep(p.ward,p.center?.[0],p.center?.[1]);
 let list=[...byName.values()];
 if(!list.length){(data.buildings||[]).filter((b,i)=>i%Math.max(1,Math.floor(data.buildings.length/8))===0).slice(0,8).forEach((b,i)=>keep('District '+(i+1),b.x,b.y));list=[...byName.values()];}
 const byBuilding=new Map();
 for(const b of data.buildings||[]){
  byBuilding.set(Number(b.id),b);
  let w=byName.get(String(b.ward||'').toLowerCase());
  if(!w&&list.length){let best=Infinity;for(const candidate of list){const dx=candidate.x-b.x,dy=candidate.y-b.y,d=dx*dx+dy*dy;if(d<best){best=d;w=candidate;}}}
  if(w){w.buildings.push(b);w.types[b.type]=(w.types[b.type]||0)+1;}
 }
 for(const npc of data.npcs||[]){const home=byBuilding.get(Number(npc.homeBuildingId));const w=home&&byName.get(String(home.ward||'').toLowerCase());if(w)w.residents++;}
 return list.filter(w=>w.buildings.length);
}
function decorate(data,root,opts){
 if(!data||!root||data.settlementId==='aelvanyr-elarvess')return null;
 const base=root.querySelector('#bvs-livingTerrain');if(!base)return null;
 const style=profile(data),p=style.type,rand=random(style.seed);
 root.dataset.distinctCartography=p[0];root.dataset.cartographySeed=String(style.seed);
 const marks=svg('g',{class:'bv10-ecology','aria-hidden':'true','pointer-events':'none',opacity:'.5'});
 for(let i=0;i<68;i++){
  const x=Math.round(40+rand()*1840),y=Math.round(40+rand()*1840),r=7+Math.round(rand()*20);
  let item;
  if(/Woodland|Lowland|Wetland|Island/.test(p[0]))item=svg('path',{d:'M'+(x-r)+' '+(y+r)+'L'+x+' '+(y-r)+'L'+(x+r)+' '+(y+r)+'Z',fill:p[2],opacity:'.28'});
  else if(p[0]==='Highland')item=svg('path',{d:'M'+(x-r)+' '+(y+r/2)+'L'+x+' '+(y-r)+'L'+(x+r)+' '+(y+r/2),fill:'none',stroke:p[2],'stroke-width':3});
  else if(p[0]==='Arid')item=svg('path',{d:'M'+(x-r)+' '+y+'Q'+x+' '+(y-r)+' '+(x+r)+' '+y,fill:'none',stroke:p[2],'stroke-width':3});
  else item=svg('ellipse',{cx:x,cy:y,rx:r*2,ry:r*.5,fill:p[3],opacity:'.38'});
  marks.append(item);
 }
 base.append(marks);
 const title=svg('g',{'class':'bv10-cartouche','aria-hidden':'true','pointer-events':'none'}),label=String(data.settlementName||'Settlement');
 title.append(svg('rect',{x:36,y:38,width:Math.min(850,310+label.length*21),height:112,rx:12,fill:'#0d212b',opacity:'.84',stroke:'#cfb27a','stroke-width':3}));
 const province=svg('text',{x:56,y:75,fill:'#e1d0ab','font-size':25,'font-family':'Georgia,serif'});province.textContent=data.provinceName||'Belavadós';title.append(province);
 const name=svg('text',{x:56,y:123,fill:'#b5ece9','font-size':40,'font-family':'Georgia,serif','font-weight':700});name.textContent=label.slice(0,28);title.append(name);base.append(title);
 const list=districts(data).slice(0,18),layer=svg('g',{'class':'bv10-neighborhood-markers',role:'group','aria-label':'Clickable neighborhoods'});
 function open(w){
  const inspector=opts?.inspector,body=inspector?.querySelector('.window-body');if(!body)return;
  inspector.hidden=false;
  body.innerHTML='<section class="bv10-district-detail"><h3>'+enc(w.name)+'</h3><p>'+enc(label)+' · '+w.buildings.length+' locations · '+w.residents+' people living here</p><p>These locations retain their addresses, ownership, goods, room layouts, and linked NPC schedules.</p><div class="bv10-district-tags">'+Object.entries(w.types).sort((a,b)=>b[1]-a[1]).slice(0,9).map(t=>'<span>'+enc(t[0].replaceAll('_',' '))+': '+t[1]+'</span>').join('')+'</div><div class="bv10-district-places">'+w.buildings.slice(0,80).map(b=>'<button type="button" data-bv10-building="'+Number(b.id)+'">'+enc(b.name)+' <small>'+enc(b.address)+'</small></button>').join('')+'</div><p>Search the full map to open additional buildings and NPCs.</p></section>';
 }
 list.forEach((w,i)=>{
  const x=Math.max(22,Math.min(1898,w.x)),y=Math.max(22,Math.min(1898,w.y));
  const m=svg('g',{class:'bv10-neighborhood',role:'button',tabindex:0,'data-bv10-neighborhood':i,'aria-label':'Explore '+w.name,transform:'translate('+x+','+y+')'});
  m.innerHTML='<circle r="20" fill="#13313a" stroke="#d5b878" stroke-width="5"/><text y="7" text-anchor="middle" fill="#fff5d3" font-size="20" font-weight="bold">'+(i+1)+'</text><title>'+enc(w.name)+' ('+w.buildings.length+' places)</title>';
  layer.append(m);
 });
 root.append(layer);
 const reveal=e=>{const button=e.target.closest?.('[data-bv10-neighborhood]');if(button){const w=list[Number(button.dataset.bv10Neighborhood)];if(w)open(w);}};
 layer.addEventListener('click',reveal);
 layer.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();reveal(e);}});
 const inspector=opts?.inspector;
 if(inspector){
  inspector.__bv10Select=opts.selectBuilding;
  if(!inspector.dataset.bv10Events){inspector.dataset.bv10Events='yes';inspector.addEventListener('click',e=>{const button=e.target.closest?.('[data-bv10-building]');if(button)inspector.__bv10Select?.(Number(button.dataset.bv10Building));});}
 }
 return {terrain:p[0],seed:style.seed,districts:list.length,buildings:data.buildings.length,npcs:data.npcs.length};
}
window.BelavadosCartography=Object.freeze({decorate,profile,hash});
})();