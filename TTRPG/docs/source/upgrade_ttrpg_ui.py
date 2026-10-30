from pathlib import Path
p=Path('/mnt/data/ttrpg_v9work/js/living_world_maps.js');s=p.read_text()
s=s.replace('let viewBox={x:0,y:0,w:1920,h:1920}', 'const routeCache=new Map();let activeRoom=null;\nlet viewBox={x:0,y:0,w:1920,h:1920}')
s=s.replace('function nowMinutes(){const c=calendar?.getState();return ((Number(c?.hour)||0)*60+(Number(c?.minute)||0))*(24/21);}', "function nowMinutes(n){const c=calendar?.getState(),t=(Number(c?.hour)||0)*60+(Number(c?.minute)||0);return n?.scheduleProvenance?.startsWith('V9')?t:t*(24/21);}")
s=s.replace('const t=nowMinutes();const slots=n.weeklySchedule?', 'const t=nowMinutes(n);const slots=n.weeklySchedule?')
s=s.replace('const t=nowMinutes(),slots=n.weeklySchedule?', 'const t=nowMinutes(n),slots=n.weeklySchedule?')
s=s.replace("function svgBackground(){const m=data.map,t=m.terrain;", """function walkRoute(from,to){
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
function svgBackground(){const m=data.map,t=m.terrain;""")
s=s.replace("const boundary=polyPath(m.boundary);", """const boundary=polyPath(m.boundary);
 const topo=m.townGeneratorOSTopology;
 const wardsFill=topo?(topo.patches||[]).map((p,i)=>`<path d="${polyPath(p.boundary)}" fill="${['#e5d6ba','#d4c8a2','#d6d4bb','#bfc8a4','#d9c1aa','#c8b9aa'][i%6]}" stroke="#665744" stroke-width="2" opacity=".35"><title>${esc(p.ward)} • ${esc(p.districtType)}</title></path>`).join(''):'';
 const arterial=topo?(topo.streets||[]).map(path=>`<path d="${pathLine(path)}" fill="none" stroke="#554b3b" stroke-width="13" opacity=".72"/><path d="${pathLine(path)}" fill="none" stroke="#dfcba6" stroke-width="8" opacity=".83"/>`).join(''):'';
 const gates=topo?(topo.gates||[]).map(g=>`<circle cx="${g[0]}" cy="${g[1]}" r="17" fill="#a8895e" stroke="#473b31" stroke-width="6"/>`).join(''):'';""")
s=s.replace("${hills}${mountains}${water}<path d=", "${hills}${mountains}${water}${wardsFill}<path d=")
s=s.replace("${roads}${wards}`;", "${arterial}${roads}${gates}${wards}`;")
s=s.replace('const t=nowMinutes();const list=data.npcs;', 'const list=data.npcs;')
a='''const hub={x:960+120*Math.sin((from.x+dest.x)/420),y:960+100*Math.cos((from.y+dest.y)/450)};
   if(p<.5){const q=p*2;x=from.x+(hub.x-from.x)*q;y=from.y+(hub.y-from.y)*q;}
   else {const q=(p-.5)*2;x=hub.x+(dest.x-hub.x)*q;y=hub.y+(dest.y-hub.y)*q;}'''
b='''const route=walkRoute(from,dest),pos=travelPoint(route,p);x=pos[0];y=pos[1];'''
assert a in s;s=s.replace(a,b)
s=s.replace("function setSelectedBuilding(id,center=true){const b=findBuilding(id);if(!b)return;selectedBuilding=b.id;", "function setSelectedBuilding(id,center=true){const b=findBuilding(id);if(!b)return;activeRoom=null;selectedBuilding=b.id;")
s=s.replace("function buildingDetails(b){const cur=data.npcs.filter", """function interiorSVG(b){const rooms=b?.interior?.rooms||[];if(!rooms.length)return '<p>No room map recorded.</p>';
 const outer=b.path||[],minX=Math.min(...outer.map(p=>p[0])),minY=Math.min(...outer.map(p=>p[1])),maxX=Math.max(...outer.map(p=>p[0])),maxY=Math.max(...outer.map(p=>p[1]));
 const w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY);
 return `<div class="lv-room-plan"><svg role="img" aria-label="Clickable floor plan of ${esc(b.name)}" viewBox="0 0 500 300">${rooms.map((room,i)=>{const [x,y,rw,rh]=room.bounds;return `<g data-room="${esc(room.id)}" role="button" tabindex="0" aria-label="Enter ${esc(room.name)}"><rect x="${(x-minX)/w*485+7}" y="${(y-minY)/h*285+7}" width="${rw/w*485-2}" height="${rh/h*285-2}" rx="3" fill="${['#c3b7a1','#b2c2be','#d2ba9b','#c7c2a0'][i%4]}" stroke="#403a31" stroke-width="2"/><text x="${(x-minX+rw/2)/w*485+7}" y="${(y-minY+rh/2)/h*285+7}" fill="#28231c" font-size="12" text-anchor="middle" pointer-events="none">${esc(room.name.slice(0,18))}</text></g>`;}).join('')}</svg><p id="livingRoomDescription">Choose a room to inspect it. ${rooms.length} navigable rooms across ${b.interior.levels} floor(s).</p></div>`;
}
function buildingDetails(b){const cur=data.npcs.filter""")
s=s.replace("<h4>Inside this location</h4>${listNPC", "<h4>Inside this location</h4>${interiorSVG(b)}${listNPC")
s=s.replace("if(btn.dataset.building){setSelectedBuilding(btn.dataset.building);return;}", """if(btn.dataset.room){const b=findBuilding(selectedBuilding);const room=b?.interior?.rooms?.find(room=>room.id===btn.dataset.room);const status=$('livingRoomDescription');if(room&&status)status.textContent=room.name+' • Level '+room.level+' • '+room.features.join(', ')+'. Visitors use the building’s six-day occupancy schedule.';return;}
 if(btn.dataset.building){setSelectedBuilding(btn.dataset.building);return;}""")
# SVG room click is not a button, use event bubbling on inspector
s=s.replace("const btn=e.target.closest('button');if(!btn)return;", "const btn=e.target.closest('button,[data-room]');if(!btn)return;")
s=s.replace('routeCache.set(key,route);return route;', 'routeCache.set(key,route);return route;')
s=s.replace("lookupNpc.clear();for(const n of data.npcs)", "routeCache.clear();lookupNpc.clear();for(const n of data.npcs)")
s=s.replace('if(selectedBuilding||selectedNpc)renderInspector();', 'if(selectedNpc)renderInspector();')
# avoid gigantic circles when zoom full out; still all NPCs visible but reduced glyph size
s=s.replace('r="${sel?9:5.5}"','r="${sel?9:3.8}"')
p.write_text(s)
# CSS: room floor plan and selectability
css=Path('/mnt/data/ttrpg_v9work/css/living-world-maps.css')
with css.open('a') as f:f.write('''\n/* V9 TownGeneratorOS-style patch wards and visitable indoor layouts */\n.lv-room-plan{border:1px solid #a68756;background:#efe4c9;padding:10px;border-radius:9px;margin:10px 0;color:#25211c}.lv-room-plan svg{width:100%;max-height:320px;display:block;background:#f8f0dc}.lv-room-plan svg [data-room]{cursor:pointer}.lv-room-plan svg [data-room]:hover rect,.lv-room-plan svg [data-room]:focus rect{stroke:#bc7830;stroke-width:5;fill:#f4d48d}.lv-room-plan p{font-size:.82rem;color:#28211a}.lv-biography{line-height:1.65}\n''')
print('patched',p,css)
