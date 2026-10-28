

(()=>{
'use strict';
const D=JSON.parse(document.getElementById('letterData').textContent);
const chart=document.getElementById('alphabetChart');
const overlay=document.getElementById('connectors');
const pick=document.getElementById('focus');
const detail=document.getElementById('detail');
const NS='http://www.w3.org/2000/svg';
const roots=new Map(D.roots.map(r=>[r.slot,r]));
const families=new Map(D.families.map(f=>[f.family,f]));
const mergeBySlot=new Map(D.mergers.map(m=>[m.slot,m]));
const stageIndex=new Map(D.stages.map((s,i)=>[s.key,i]));
const stageY=new Map(D.stages.map(s=>[s.key,s.y]));
const x=slot=>D.chart.startX+(slot-1)*D.chart.gap;
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
 const m=document.createElement('img');m.className=className==='glyph'?'mark':'table-mark';setMask(m,src);b.appendChild(m);
 b.addEventListener('click',ev=>{ev.stopPropagation();selectGlyph(stageKey,slot);window.scrollTo({top:0,behavior:'smooth'})});
 return b;
}
function drawLineageChips(slot){
 const wrap=document.createElement('div');wrap.className='detail-glyphs';
 D.stages.forEach((stage,i)=>{
  const owner=resolveOwner(slot,i), r=owner===null?null:roots.get(owner), node=r&&r.stages[stage.key];
  const chip=document.createElement('span');chip.className='lineage-chip';chip.style.color=r?colorFor(r):'#aeb7c7';
  if(node&&node.src){const m=document.createElement('img');m.className='mini-mark';setMask(m,node.src);chip.appendChild(m)}
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
 note.textContent='Historical source roots: '+origins+'. Legacy Latin readings: '+readings+'. Current encoding uses '+((window.AZA_LETTERS||{})[fam.family]||fam.letter)+' plus the revised accents in the typing tab.';
 detail.appendChild(note);detail.appendChild(copyButton((window.AZA_LETTERS||{})[fam.family]||fam.letter,'Copy Aza’raan '+fam.letter));
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
 const specialRootCodes={'1':'៉','52':'្ឃ'};const copyText=(stageKey==='proto')?r.origin:((stageKey==='modern'&&(specialRootCodes[slot]||(family&&(window.AZA_LETTERS||{})[family.family])))||((node&&node.reading)||(family&&family.letter)||r.reflex||r.origin));
 note.textContent=rootDesc(stage,r,node)+'. '+(node&&node.label?node.label+'. ':'')+'The modern reading is '+(family?family.letter:(node&&node.text)||r.reflex)+'.';
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
  const modern=document.createElement('td');modern.className='symbol-cell table-letter';modern.textContent=fam.letter;
  const variants=document.createElement('small');variants.textContent='Khmer: '+((window.AZA_LETTERS||{})[fam.family]||fam.letter)+' · 24 contemporary marks';modern.appendChild(variants);
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
  if(node.src){const m=document.createElement('img');m.className='mark';setMask(m,node.src);b.appendChild(m)}
  else if(node.text){const m=document.createElement('span');m.className='textmark';m.textContent=node.text;b.appendChild(m)}
  b.addEventListener('click',()=>selectGlyph(stage.key,root.slot));chart.appendChild(b);
 });
});
D.lines.forEach(line=>{
 const y1=D.stages[line.stage].y+25,y2=D.stages[line.stage+1].y-29;
 const x1=x(line.from),x2=x(line.to),mid=(y1+y2)/2,dx=x2-x1;
 const c1=x1+dx*.34,c2=x2-dx*.34,col=D.colors[line.family]||'#d0d0d0';
 addSvg('path',{class:'lineage',d:'M'+x1+' '+y1+' C '+c1+' '+mid+', '+c2+' '+mid+', '+x2+' '+y2,stroke:col,'data-family':line.family},overlay);
 addSvg('path',{class:'arrowtip',d:'M'+(x2-5.3)+' '+(y2-8)+' L'+x2+' '+y2+' L'+(x2+5.3)+' '+(y2-8)+' Z',fill:col,'data-family':line.family},overlay);
});
D.families.forEach(fam=>{
 const o=document.createElement('option');o.value=fam.family;o.textContent=fam.letter+' · '+fam.sound;pick.appendChild(o);
});
pick.addEventListener('change',()=>renderFamily(pick.value));
document.getElementById('evo-clear').addEventListener('click',()=>{pick.value='';setDefaultDetail()});
renderTable();setDefaultDetail();
})();

