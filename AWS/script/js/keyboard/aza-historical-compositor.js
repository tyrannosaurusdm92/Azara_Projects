/* Era-aware vector composer for Archaic, Classical, Traditional.
   Reuses the historical SVG outlines, all 24 historical mark drawings, and
   the existing source-lineage root map. Modern renderer remains unchanged.
   Uniform SVG scaling preserves each era's original relative stroke weights. */
(()=>{
'use strict';
const ERAS=new Set(['Archaic','Classical','Traditional']);
const specialAssets={sOver:'S01',sUnder:'S02',sLeft:'S03',sRight:'S04'};
const specialNames={sOver:'Glottal stop',sUnder:'Click',sLeft:'Previous syllable',sRight:'Next syllable'};
const oldMarks=new Map((window.AZA_DOC_ERA_REFERENCE?.historicalMarks||[]).map(m=>[m.id,m]));
const core=window.AZ_CANON;
function inEra(era){return ERAS.has(era)}
function rootFor(letter,era){
 if(!inEra(era))return null;
 const key=String(letter||'').toUpperCase();
 if(key==='F')return era==='Traditional'?null:7;
 if(key==='V')return 18;
 const roots=window.AZA_DATA?.fontRoots?.[era]||{};
 const name=Object.keys(roots).find(slot=>roots[slot]===key);
 return name?Number(name):null;
}
function art(letter,era,origin){
 if(!inEra(era))return null;
 let slot=rootFor(letter,era);
 if(origin){
  const r=(window.AZA_DOC_ERA_REFERENCE?.readings||[]).find(
    x=>x.origin===origin&&x.era===era&&x.independent);
  if(!r)return null;
  slot=r.slot;
 }
 return slot?'assets/keyboard/svg/evolution/'+era.toLowerCase()+'/'+era.toLowerCase()+'_'+slot+'.svg':null;
}
function markArt(id,era){
 const key=oldMarks.has(id)?id:specialAssets[id];
 return inEra(era)&&key?'assets/keyboard/svg/marks/'+era.toLowerCase()+'/'+key+'.svg':null;
}
function partsFor(input,era){
 if(!inEra(era))throw Error('Historical composer only');
 const base=String(input?.base||'').toUpperCase();
 const source=art(base,era,input?.historicalOrigin);
 if(!source)throw Error('No surviving independent '+base+' in '+era);
 const marks=input?.marks||[],subs=input?.subs||[],specials=input?.specials||[];
 if(marks.length>2||subs.length>2||subs.some(s=>(s.marks||[]).length>2))
  throw Error('Two marks per independent/subscript; maximum two subscripts');
 const parts=[],body={x:48,y:36,w:102,h:110};
 function add(src,kind,x,y,w,h,extra={}){
  if(!src)throw Error('Missing historical artwork for '+kind);
  const record={src,kind,x,y,w,h,...extra};parts.push(record);return record;
 }
 // Place historical mark artwork around its own era's glyph outline; do not
 // reuse Modern 12-mark visuals or Modern primary/secondary anchor tables.
 function placeMarks(ids,host,scope,scale){
  let first=null;
  for(let i=0;i<ids.length;i++){
   const id=ids[i],data=oldMarks.get(id),src=markArt(id,era);
   if(!data||!src)throw Error('Unknown '+era+' accent '+id);
   const side=(data.placement==='top_far'?'top':data.placement)||'top';
   const size=(i===0?36:17)*scale;
   let x,y;
   if(i===0){
    if(side==='left'){x=host.x-size*0.78;y=host.y+host.h*0.46-size*.5;}
    else if(side==='right'){x=host.x+host.w-size*.16;y=host.y+host.h*.46-size*.5;}
    else if(side==='bottom'){x=host.x+host.w*.80-size*.4;y=host.y+host.h-size*.32;}
    else {x=host.x+host.w*.79-size*.4;y=host.y-size*.38;}
   }else{
    // Secondary is ALWAYS anchored to the first accent, never placed directly
    // against the independent glyph or another subscript.
    if(side==='left'){x=first.x-size*.68;y=first.y+(first.h-size)*.5;}
    else if(side==='right'){x=first.x+first.w-size*.35;y=first.y+(first.h-size)*.5;}
    else if(side==='bottom'){x=first.x+first.w*.54;y=first.y+first.h-size*.38;}
    else {x=first.x+first.w*.52;y=first.y-size*.30;}
   }
   const part=add(src,i?'secondary':'primary',x,y,size,size,{id,target:scope,parent:i?first?.id:null});
   if(!first)first=part;
  }
 }
 add(source,'base',body.x,body.y,body.w,body.h,{letter:base,target:'base'});
 placeMarks(marks,body,'base',1);
 // The click and glottal are historical structural marks, ABOVE all strokes,
 // not lower subscripts; syllable emphasis sits to the side.
 specials.forEach((id,i)=>{
  const src=markArt(id,era),s=23;
  const above=id==='sOver'||id==='sUnder';
  const x=above?body.x+body.w*.27+(id==='sUnder'?27:0):id==='sLeft'?body.x-s*.75:body.x+body.w-s*.2;
  const y=above?body.y-s-9:body.y+body.h*.49-s*.5;
  add(src,'special',x,y,s,s,{id,target:'base',name:specialNames[id]||id});
 });
 // One dependent letter is 20% of its independent body; two are side by
 // side, centered under the body and placed BELOW even the longest tail.
 const subW=body.w*.2,subH=body.h*.2,gap=7;
 const total=subW*subs.length+Math.max(0,subs.length-1)*gap;
 // A conservative right-of-tail anchor for descenders preserves the native
 // artwork entirely and avoids painting dependent letters across a tail.
 const descending=new Set(['B','G','H','L','N','O','S','T','Z']);
 let start=body.x+(body.w-total)/2;
 if(descending.has(base))start=Math.max(start,body.x+body.w*.55);
 const underY=Math.max(body.y+body.h+10,...parts.filter(p=>p.target==='base').map(p=>p.y+p.h+5));
 let nextSubX=start;
 subs.forEach((sub,i)=>{
  const key=String(sub.key||'').toUpperCase(),src=art(key,era,sub.origin);
  if(!src)throw Error('Unavailable '+era+' dependent '+key);
  const previousRight=i?Math.max(...parts.filter(p=>p.target==='sub'+(i-1)).map(p=>p.x+p.w)):null;
  const host={x:nextSubX,y:underY,w:subW,h:subH};
  add(src,'subscript',host.x,host.y,host.w,host.h,{letter:key,origin:sub.origin||null,target:'sub'+i});
  placeMarks(sub.marks||[],host,'sub'+i,.2);
  const own=parts.filter(p=>p.target==='sub'+i);
  const shift=i?Math.max(0,previousRight+3-Math.min(...own.map(p=>p.x))):0;
  if(shift)own.forEach(p=>p.x+=shift);
  nextSubX=Math.max(host.x+host.w,...parts.filter(p=>p.target==='sub'+i).map(p=>p.x+p.w))+4;
 });
 return parts;
}
function createCluster(input,era){
 const parts=partsFor(input,era);
 // Reserve the actual composed outline, including marks to the left/right.
 // The old zero-origin strip left a full 48px of blank advance per letter.
 const minX=Math.min(...parts.map(p=>p.x)),minY=Math.min(...parts.map(p=>p.y));
 const maxX=Math.max(...parts.map(p=>p.x+p.w));
 const maxY=Math.max(...parts.map(p=>p.y+p.h));
 const pad=2;
 const root=document.createElement('span');
 root.className='aza-historical-cluster';
 root.dataset.azaEra=era.toLowerCase();
 root.dataset.azaBase=String(input.base||'');
 root.dataset.layout=JSON.stringify(parts.map(({kind,x,y,w,h,id,letter,origin,target,parent})=>({kind,x,y,w,h,id,letter,origin,target,parent})));
 root.style.cssText='position:relative;display:inline-block;vertical-align:baseline;line-height:0;white-space:nowrap;overflow:visible;';
 root.style.width=(maxX-minX+2*pad)+'px';root.style.height=(maxY-minY+2*pad)+'px';
 // An in-flow zero-width marker anchors inline writing at the bottom of the
 // independent body, not at the last dependent mark. This matches the
 // composed-text baseline behavior in the Modern writing editor.
 const body=parts.find(p=>p.kind==='base');
 const baseline=document.createElement('span');baseline.className='aza-historical-baseline';
 baseline.style.cssText='display:inline-block;width:0;line-height:0;font-size:0;vertical-align:baseline;';
 baseline.style.height=(body.y+body.h-minY+pad)+'px';
 root.append(baseline);
 for(const p of parts){
  const shell=document.createElement('span');shell.className='aza-historical-layer aza-historical-'+p.kind;
  shell.dataset.kind=p.kind;shell.dataset.target=p.target||'base';if(p.id)shell.dataset.mark=p.id;
  shell.style.cssText='position:absolute;display:block;overflow:visible;line-height:0;';
  shell.style.left=(p.x-minX+pad)+'px';shell.style.top=(p.y-minY+pad)+'px';
  shell.style.width=p.w+'px';shell.style.height=p.h+'px';
  const img=document.createElement('img');img.src=p.src;img.alt='';
  img.draggable=false;img.setAttribute('aria-hidden','true');
  img.style.cssText='width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;display:block;';
  shell.append(img);root.append(shell);
 }
 return root;
}
window.AZ_HISTORICAL_COMPOSER={art,markArt,partsFor,createCluster};
})();
