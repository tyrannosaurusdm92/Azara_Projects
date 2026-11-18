

(()=>{
'use strict';
const D=JSON.parse(document.getElementById('letterData').textContent);
const chart=document.getElementById('alphabetChart');
const overlay=document.getElementById('connectors');
const pick=document.getElementById('focus');
const detail=document.getElementById('detail');
const NS='http://www.w3.org/2000/svg';
/* The Modern artwork preserves the original font-unit coordinates.
   Measure the main letter body, not the tail/branch-inclusive SVG viewBox. */
const MODERN_ART_METRICS={
  modern_1:[176,251,12,663],modern_3:[686,920,-311,398],
  modern_6:[492,404,-379,376],modern_8:[978,1150,14,397],
  modern_9:[420,390,-415,370],modern_11:[430,398,-410,375],
  modern_12:[418,436,-416,403],modern_14:[428,386,-411,369],
  modern_18:[949,1232,15,406],modern_19:[842,1216,-312,683],
  modern_20:[846,1239,-336,696],modern_21:[845,1263,-344,697],
  modern_22:[906,1330,-360,734],modern_23:[911,1330,-324,733],
  modern_24:[853,1148,-368,1067],modern_33:[1135,1227,13,402],
  modern_34:[438,403,-408,376],modern_35:[423,389,-413,369],
  modern_36:[493,402,-378,376],modern_44:[682,1072,-363,1009],
  modern_50:[736,1110,-363,1020],modern_52:[270,239,13,673],
  modern_1_U003C:[191,216,11,658],modern_1_U003E:[174,208,10,648]
};
/* Ink centers follow each letter's main body, not its extended flourishes. */
const MODERN_BODY_CENTERS={
  modern_1:80,modern_3:794,modern_6:612,modern_8:700,
  modern_9:625,modern_11:622,modern_12:602,modern_14:620,
  modern_18:653,modern_19:736,modern_20:734,modern_21:742,
  modern_22:751,modern_23:765,modern_24:625,modern_33:814,
  modern_34:668,modern_35:680,modern_36:590,modern_44:619,
  modern_50:645,modern_52:118,modern_1_U003C:89,modern_1_U003E:83
};
function positionModernArt(img,src,context){
  const modernLetter=/\/modern\/independent\/([A-Z])-font\.png(?:\?|$)/.exec(src)?.[1];
  if(modernLetter){
    const registration=window.AZ_FONT_REGISTRATION?.letters?.[modernLetter];
    if(!registration)return false;
    const [xMin,yMin,xMax,yMax]=registration.bbox;
    const [bodyXMin,bodyYMin,bodyXMax,bodyYMax]=registration.bodyBBox;
    const pxPerUnit=(context==='chart'?35:context==='detail'?28:27)/350;
    const xOffset=((bodyXMin+bodyXMax)/2-xMin)*pxPerUnit;
    const yOffset=(yMax-(bodyYMin+bodyYMax)/2)*pxPerUnit;
    img.classList.add('modern-art');img.style.position='absolute';img.style.objectFit='fill';
    img.style.width=((xMax-xMin)*pxPerUnit).toFixed(2)+'px';
    img.style.height=((yMax-yMin)*pxPerUnit).toFixed(2)+'px';
    img.style.left='calc(50% - '+xOffset.toFixed(2)+'px)';
    img.style.top='calc(50% - '+yOffset.toFixed(2)+'px)';
    return true;
  }
  const key=/\/(modern_[^/?]+)\.svg(?:\?|$)/.exec(src)?.[1];
  const bounds=MODERN_ART_METRICS[key];
  if(!bounds)return false; // The former U root is an intentionally empty merger slot.
  const [width,height,originX,originY]=bounds;
  // Consistent main-body size; flourishes retain their full natural dimensions.
  const pxPerUnit=(context==='chart'?35:context==='detail'?28:27)/350;
  img.classList.add('modern-art');
  img.style.position='absolute';
  img.style.objectFit='fill';
  img.style.width=(width*pxPerUnit).toFixed(2)+'px';
  img.style.height=(height*pxPerUnit).toFixed(2)+'px';
  // Shared pen origin and baseline, instead of independently centering each SVG.
  img.style.left='calc(50% - '+(((MODERN_BODY_CENTERS[key]??600)+originX)*pxPerUnit).toFixed(2)+'px)';
  img.style.top='calc(50% + '+((175-originY)*pxPerUnit).toFixed(2)+'px)';
  return true;
}

const roots=new Map(D.roots.map(r=>[r.slot,r]));
const families=new Map(D.families.map(f=>[f.family,f]));
const mergeBySlot=new Map(D.mergers.map(m=>[m.slot,m]));
const stageIndex=new Map(D.stages.map((s,i)=>[s.key,i]));
const stageY=new Map(D.stages.map(s=>[s.key,s.y]));
const orderedSlots=D.roots.map(r=>r.slot).sort((a,b)=>a-b);
const slotRank=new Map(orderedSlots.map((slot,rank)=>[slot,rank]));
const x=slot=>D.chart.startX+(slotRank.get(slot)??0)*D.chart.gap;
const familyFor=r=>r.family||'extra';
const colorFor=r=>D.colors[familyFor(r)]||'#d0d0d0';
const addSvg=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);parent.appendChild(el);return el};
function setMask(el,src){el.src=src;el.alt='';el.loading='eager';el.decoding='async'}
function rootDesc(stage,r,node){const fam=families.get(r.family);return stage.label+' · root '+String(r.slot).padStart(2,'0')+' · '+r.origin+' · '+r.sound+(fam?' · modern '+fam.letter:' · special sign')}
function resolveOwner(slot,stageNo){
 let current=slot;const seen=new Set();
 while(!seen.has(current)){
  seen.add(current);
  const m=mergeBySlot.get(current);
  if(!m||stageIndex.get(m.stage)>stageNo)break;
  current=m.parent;
 }
 const rr=roots.get(current);
 const node=rr&&rr.stages[D.stages[stageNo].key];
 return node?current:null;
}
function mark(src,className,slot,stageKey,title){
 const b=document.createElement('button');b.type='button';b.className=className;b.title=title;
 const r=roots.get(slot);b.dataset.family=familyFor(r);b.dataset.slot=String(slot);b.dataset.stage=stageKey;b.style.color=colorFor(r);
 const m=document.createElement('img');m.className=className==='glyph'?'mark':'table-mark';setMask(m,src);if(stageKey==='modern'&&positionModernArt(m,src,'table'))b.classList.add('modern-art-holder');b.appendChild(m);
 b.addEventListener('click',ev=>{ev.stopPropagation();selectGlyph(stageKey,slot);window.scrollTo({top:0,behavior:'smooth'})});
 return b;
}
function drawLineageChips(slot){
 const wrap=document.createElement('div');wrap.className='detail-glyphs';
 D.stages.forEach((stage,i)=>{
  const owner=resolveOwner(slot,i), r=owner===null?null:roots.get(owner), node=r&&r.stages[stage.key];
  const chip=document.createElement('span');chip.className='lineage-chip';chip.style.color=r?colorFor(r):'#aeb7c7';
  if(node&&node.src){const m=document.createElement('img');m.className='mini-mark';setMask(m,node.src);if(stage.key==='modern'&&positionModernArt(m,node.src,'detail')){const frame=document.createElement('span');frame.className='modern-lineage-frame';frame.appendChild(m);chip.appendChild(frame)}else chip.appendChild(m)}
  else if(node&&node.text){const t=document.createElement('span');t.className='mini-text';t.textContent=node.text;chip.appendChild(t)}
  else{const t=document.createElement('span');t.className='mini-text';t.textContent='—';chip.appendChild(t)}
  const label=document.createElement('small');label.textContent=owner!==null&&owner!==slot?'→ '+stage.label+' · root '+String(owner).padStart(2,'0'):stage.label;chip.appendChild(label);wrap.appendChild(chip);
 });
 return wrap;
}
function highlight(allowed,active){
 document.querySelectorAll('.glyph').forEach(g=>{
  const ok=!allowed||allowed.has(g.dataset.family);
  g.classList.toggle('dim',!ok);
  g.classList.toggle('active',ok&&active&&g.dataset.stage===active[0]&&Number(g.dataset.slot)===active[1]);
 });
 overlay.querySelectorAll('[data-family]').forEach(g=>g.classList.toggle('dim',!!allowed&&!allowed.has(g.getAttribute('data-family'))));
}
function setDefaultDetail(){
 highlight(null,null);detail.replaceChildren();
 const t=document.createElement('div');t.className='detail-title';t.textContent='Select a glyph or modern letter';
 const n=document.createElement('div');n.className='detail-note';n.textContent='Choose a modern letter above or click a glyph in the chart to see its Proto-Aza’raan root, historical forms, and modern correspondence.';
 detail.append(t,n);
}
function copyButton(text,label){
 const cp=document.createElement('button');cp.type='button';cp.className='tool';cp.textContent=label;
 cp.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(text);cp.textContent='Copied '+text}
  catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');cp.textContent='Copied '+text}catch{cp.textContent='Select the text to copy'}ta.remove()}
 });
 return cp;
}
function renderFamily(familyKey){
 if(!familyKey){setDefaultDetail();return}
 const fam=families.get(familyKey);if(!fam){setDefaultDetail();return}
 const members=D.roots.filter(r=>r.family===familyKey);
 detail.replaceChildren();
 const t=document.createElement('div');t.className='detail-title';t.textContent=fam.letter+' · '+fam.sound;
 detail.appendChild(t);detail.appendChild(drawLineageChips(fam.rootSlot));
 const note=document.createElement('div');note.className='detail-note';
 const readings=(fam.readings||[]).map(x=>x.name+' '+x.unicode+(x.ipa?' '+x.ipa:'')).join(' · ');
 const origins=members.map(r=>r.origin+' ('+r.sound+')').join(' · ');
 note.textContent='Historical source roots: '+origins+'. Modern readings: '+readings+'. Current encoding uses '+(window.AZ_CANON?.ind?.[fam.family]||fam.letter)+' plus the supplied Modern marks and subscripts.';
 detail.appendChild(note);detail.appendChild(copyButton(window.AZ_CANON?.ind?.[fam.family]||fam.letter,'Copy Aza’raan '+fam.letter));
 highlight(new Set([familyKey]),null);
}
function selectGlyph(stageKey,slot){
 const r=roots.get(slot);if(!r)return;
 const stageNo=stageIndex.get(stageKey),stage=D.stages[stageNo],node=r.stages[stageKey];
 const family=families.get(r.family);
 detail.replaceChildren();
 const title=document.createElement('div');title.className='detail-title';
 const picked=(node&&node.text)||((stageKey==='modern'&&family&&family.letter)||('Root '+String(slot).padStart(2,'0')));
 title.textContent=picked+' · '+r.origin+' · '+r.sound;detail.appendChild(title);
 detail.appendChild(drawLineageChips(slot));
 const note=document.createElement('div');note.className='detail-note';
 const specialRootCodes={'1':'៏','52':'ះ'};const copyText=(stageKey==='proto')?r.origin:((stageKey==='modern'&&(specialRootCodes[slot]||(family&&window.AZ_CANON?.ind?.[family.family])))||((node&&node.reading)||(family&&family.letter)||r.reflex||r.origin));
 note.textContent=rootDesc(stage,r,node)+'. '+(node&&node.label?node.label+'. ':'')+'The modern reading is '+(family?family.letter:(node&&node.text)||r.reflex)+'.';
 if(slot===31)note.textContent+=' Traditional merger: 𓇖 /wiː/ (wee) → 𓆰 /wɛ/ (weh), with 𓆰 entering the 𓋧 W lineage during the same era transition.';
 if(slot===42)note.textContent+=' During Traditional, 𓆰 /wɛ/ (weh) receives 𓇖 /wiː/ (wee) before joining the 𓋧 W lineage.';
 detail.appendChild(note);detail.appendChild(copyButton(copyText,'Copy reading '+copyText));
 highlight(new Set([familyFor(r)]),[stageKey,slot]);pick.value='';
}
function addTableGlyphs(td,items,stageKey){
 const box=document.createElement('div');box.className='table-glyphs';
 if(!items.length){td.textContent='—';return}
 items.forEach(({root,node})=>{
  if(!node||!node.src)return;
  const b=mark(node.src,'table-glyph',root.slot,stageKey,rootDesc(D.stages[stageIndex.get(stageKey)],root,node));
  box.appendChild(b);
 });td.appendChild(box);
}
function renderTable(){
 const rows=document.getElementById('letterRows');
 for(const fam of D.families){
  const members=D.roots.filter(r=>r.family===fam.family);
  const tr=document.createElement('tr');
  const modern=document.createElement('td');modern.className='symbol-cell table-letter';
  const previewRoot=members.find(r=>r.stages.modern&&r.stages.modern.src&&!/\/modern_37\.svg/.test(r.stages.modern.src));
  if(previewRoot){const entry=document.createElement('div');entry.className='modern-table-entry';const art=mark(previewRoot.stages.modern.src,'table-glyph',previewRoot.slot,'modern',rootDesc(D.stages[stageIndex.get('modern')],previewRoot,previewRoot.stages.modern));const name=document.createElement('span');name.textContent=fam.letter;entry.append(art,name);modern.appendChild(entry)}
  else modern.textContent=fam.letter;
  const variants=document.createElement('small');variants.textContent='Khmer: '+(window.AZ_CANON?.ind?.[fam.family]||fam.letter)+' · 12 marks, 20 subscripts';modern.appendChild(variants);
  tr.appendChild(modern);
  const source=document.createElement('td');const rootsBox=document.createElement('div');rootsBox.className='source-roots';
  members.forEach(r=>{const node=r.stages.proto;const b=mark(node.src,'table-glyph',r.slot,'proto',rootDesc(D.stages[0],r,node));rootsBox.appendChild(b)});
  const sourceText=document.createElement('small');sourceText.textContent=members.map(r=>r.origin+' · '+r.sound).join('; ');rootsBox.appendChild(sourceText);source.appendChild(rootsBox);tr.appendChild(source);
  for(const era of ['ancient','archaic','classical','traditional']){
   const td=document.createElement('td');
   addTableGlyphs(td,members.filter(r=>r.stages[era]).map(root=>({root,node:root.stages[era]})),era);
   tr.appendChild(td);
  }
  tr.addEventListener('click',()=>{pick.value=fam.family;renderFamily(fam.family);document.getElementById('panel-evolution').scrollIntoView({behavior:'smooth'});});
  rows.appendChild(tr);
 }
 for(const sign of D.specialSigns){
  const root=roots.get(sign.rootSlot);if(!root)continue;
  const tr=document.createElement('tr');tr.className='special-row';
  const tdSign=document.createElement('td');tdSign.className='symbol-cell';
  if(sign.src){const wrap=document.createElement('div');wrap.className='table-glyphs';wrap.appendChild(mark(sign.src,'table-glyph',sign.rootSlot,'modern',sign.name+' · '+sign.meaning));tdSign.appendChild(wrap)}
  else{tdSign.textContent=sign.sign}
  tr.appendChild(tdSign);
  const tdSource=document.createElement('td');tdSource.textContent='Special sign · '+sign.name+' · '+sign.meaning+' · '+sign.origin;tr.appendChild(tdSource);
  const ptd=document.createElement('td');addTableGlyphs(ptd,[{root,node:root.stages.proto}],'proto');tr.appendChild(ptd);
  for(const era of ['ancient','archaic','classical','traditional']){
   const td=document.createElement('td');const node=(sign.stageVariants&&sign.stageVariants[era])?sign.stageVariants[era]:root.stages[era];addTableGlyphs(td,[{root,node}],era);tr.appendChild(td);
  }
  tr.addEventListener('click',()=>{
   detail.replaceChildren();
   const name=document.createElement('div');name.className='detail-title';name.textContent=sign.name+' · '+sign.sign;
   const explanation=document.createElement('div');explanation.className='detail-note';explanation.textContent=sign.meaning+' · Historical ancestor '+sign.origin+'; current storage uses Khmer '+sign.codepoint+'.';
   detail.append(name,drawLineageChips(sign.rootSlot),explanation,copyButton(sign.khmer,'Copy Khmer '+sign.name));
   highlight(new Set([familyFor(root)]),['modern',sign.rootSlot]);pick.value='';
   document.getElementById('panel-evolution').scrollIntoView({behavior:'smooth'});
  });
  rows.appendChild(tr);
 }
}
D.stages.forEach((stage,stageNo)=>{
 const lab=document.createElement('div');lab.className='stage-label';lab.style.top=stage.y+'px';
 const h=document.createElement('strong');h.textContent=stage.label;
 const small=document.createElement('small');small.textContent=stage.date;
 lab.append(h,small);chart.appendChild(lab);
 D.roots.forEach(root=>{
  const node=root.stages[stage.key];if(!node)return;
  const b=document.createElement('button');b.type='button';b.className='glyph '+stage.key;
  b.style.left=x(root.slot)+'px';b.style.top=stage.y+'px';b.style.color=colorFor(root);
  b.dataset.family=familyFor(root);b.dataset.stage=stage.key;b.dataset.slot=String(root.slot);
  const d=rootDesc(stage,root,node);
  b.setAttribute('aria-label',d);b.title=d+' — click to inspect';
  if(node.src){const m=document.createElement('img');m.className='mark';setMask(m,node.src);if(stage.key==='modern')positionModernArt(m,node.src,'chart');b.appendChild(m)}
  else if(node.text){const m=document.createElement('span');m.className='textmark';m.textContent=node.text;b.appendChild(m)}
  b.addEventListener('click',()=>selectGlyph(stage.key,root.slot));chart.appendChild(b);
 });
});
D.lines.forEach(line=>{
 const y1=D.stages[line.stage].y+25,y2=D.stages[line.stage+1].y-29;
 const x1=x(line.from),x2=x(line.to),mid=(y1+y2)/2,dx=x2-x1;
 const c1=x1+dx*.34,c2=x2-dx*.34,col=D.colors[line.family]||'#d0d0d0';
 // 𓇖 /wiː/ (wee) merges into 𓆰 /wɛ/ (weh) at the Traditional boundary.
 // Both lineages also enter the wider 𓋧 W family during this transition.
 // Draw the 31 arrow into the live 42→44 connector, rather than an empty
 // Traditional slot 42; no era glyph, stage count, or artwork is altered.
 if(line.mergeIntoLineOf===42 && line.stage===3){
  const recipient=D.lines.find(l=>l.stage===line.stage&&l.from===42);
  if(recipient){
   const rx=x(recipient.from),tx=x(recipient.to),rdx=tx-rx;
   const joinX=(rx+3*(rx+rdx*.34)+3*(tx-rdx*.34)+tx)/8;
   const joinY=mid;
   const path=addSvg('path',{class:'lineage',d:'M'+x1+' '+y1+' C '+(x1+155)+' '+(y1+25)+', '+(joinX-120)+' '+(joinY-24)+', '+joinX+' '+joinY,stroke:col,'data-family':line.family},overlay);
   addSvg('title',{},path).textContent='𓇖 /wiː/ (wee) joins 𓆰 /wɛ/ (weh) during Traditional; their lineage continues through 𓋧.';
   addSvg('path',{class:'arrowtip',d:'M'+(joinX-9)+' '+(joinY-5)+' L'+joinX+' '+joinY+' L'+(joinX-9)+' '+(joinY+5)+' Z',fill:col,'data-family':line.family},overlay);
   return;
  }
 }
 // The yellow 𓃚 /ʌ/ line loops into 𓄣 /æ/ between Traditional and
 // Modern. The arrow meets the A stem *before* the Modern glyph row.
 if(line.mergeBeforeModern && line.stage===4 && line.from===37 && line.to===34){
  const joinY=D.stages[line.stage].y+73;
  const bendY=D.stages[line.stage].y+85;
  const path='M'+x1+' '+y1+
   ' C'+(x1+8)+' '+(y1+27)+', '+(x1+20)+' '+(bendY+6)+', '+(x1-8)+' '+(bendY+15)+
   ' C'+(x1-47)+' '+(bendY+25)+', '+(x2+63)+' '+(joinY+14)+', '+x2+' '+joinY;
  addSvg('path',{class:'lineage uh-merge',d:path,stroke:col,'data-family':line.family},overlay);
  addSvg('path',{class:'arrowtip uh-merge-tip',d:'M'+(x2+10)+' '+(joinY-6)+' L'+x2+' '+joinY+' L'+(x2+10)+' '+(joinY+6)+' Z',fill:col,'data-family':line.family},overlay);
  return;
 }
 addSvg('path',{class:'lineage',d:'M'+x1+' '+y1+' C '+c1+' '+mid+', '+c2+' '+mid+', '+x2+' '+y2,stroke:col,'data-family':line.family},overlay);
 addSvg('path',{class:'arrowtip',d:'M'+(x2-5.3)+' '+(y2-8)+' L'+x2+' '+y2+' L'+(x2+5.3)+' '+(y2-8)+' Z',fill:col,'data-family':line.family},overlay);
});
D.families.forEach(fam=>{
 const o=document.createElement('option');o.value=fam.family;o.textContent=fam.letter+' · '+fam.sound;pick.appendChild(o);
});
pick.addEventListener('change',()=>renderFamily(pick.value));
document.getElementById('evo-clear').addEventListener('click',()=>{pick.value='';setDefaultDetail()});
async function renderOriginInventory(){
 const table=document.getElementById('originRows'),search=document.getElementById('originSearch');
 if(!table||!search)return;
 try{
  const response=await fetch('json/keyboard/modern-khmer-hieroglyph-mapping.json?v=modern-canon-20261116');
  if(!response.ok)throw new Error('The origin inventory could not be loaded.');
  const inventory=await response.json();
  const expected=inventory.rules;
  if(inventory.entries.length!==expected.distinctKhmerScalarCount+expected.independentModernLetters)throw new Error('The inventory count did not match its declared Unicode coverage.');
  function paint(){
   const term=search.value.trim().toLocaleLowerCase();table.replaceChildren();
   for(const entry of inventory.entries){
    const haystack=[entry.role,entry.label,entry.unicode,entry.codepoint,entry.egyptianOrigin].join(' ').toLocaleLowerCase();
    if(term&&!haystack.includes(term))continue;
    const tr=document.createElement('tr');
    for(const value of [entry.role,entry.label,entry.unicode,entry.codepoint,entry.egyptianOrigin]){
     const td=document.createElement('td');td.textContent=value;tr.appendChild(td);
    }
    tr.title=entry.notes||'';table.appendChild(tr);
   }
   if(!table.children.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=5;cell.textContent='No matching code points.';row.append(cell);table.append(row)}
  }
  search.addEventListener('input',paint);paint();
 }catch(error){table.replaceChildren();const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=5;cell.textContent=error.message;row.append(cell);table.append(row)}
}
renderTable();setDefaultDetail();
renderOriginInventory();
})();

