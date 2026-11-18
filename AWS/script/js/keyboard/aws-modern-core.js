/* Canonical Aza'raan keyboard runtime — restores shared Modern Unicode and image compositor.
   Historical keyboards preserve their own art and separate 24-accent registry. */
(()=>{
'use strict';
if(window.AZ_CANON&&window.AZ_MK&&window.AZ_ASSETS)return;
const registry=window.AZA_DATA?.modernCanonicalEncoding;
const config=window.AZA_CONFIG;
if(!registry||!config)throw Error("Aza'raan canonical keyboard data was not loaded");
const allowedLetters=[...(config.modernIndependentAlphabet||'ABDEGHIJKLMNOPRSTWYZ')];
const ind=Object.fromEntries(allowedLetters.map(k=>[k,registry.independent[k]||config.letterMap[k]]).filter(([k,v])=>!!v));
const subs=Object.assign({},registry.subscripts);
const ordinary=(registry.marks||[]).filter(x=>!/^s(?:Over|Under|Left|Right)$/.test(x.id));
const specials=(registry.marks||[]).filter(x=>/^s(?:Over|Under|Left|Right)$/.test(x.id));
const marks=[...ordinary,...specials].map(x=>({
 id:x.id,name:x.name,unicode:x.unicode,khmer:x.unicode,codepoint:x.codepoint,
 latin:'◌'+x.unicode,display:'◌'+x.unicode,special:specials.some(s=>s.id===x.id)
}));
const byId=new Map(marks.map(x=>[x.id,x]));
window.AZ_CANON={ind,subs,coeng:'្',nums:Object.assign({},registry.numbers),punct:Object.assign({},registry.punctuation),marks};
const folder='assets/keyboard/modern/';
const slug={
 held:'Held_Consonant',central:'Central_Vowel',open:'Open_Vowel',short:'Short_Vowel',
 long:'Long_Vowel',unvoiced:'Unvoiced_Sound',voiced:'Voiced_Sound',separate:'Separated_Vowel',
 nasal:'Nasalization',soft:'Soft_Sound',hard:'Hard_Sound',glide:'Glide_Sound',
 sOver:'Glottal_Stop',sUnder:'Click_Sound',sLeft:'Emphasis_before',sRight:'Emphasis_after'
};
const primary=Object.fromEntries(Object.entries(slug).map(([id,name])=>[id,folder+'diacritic/Primary_'+name+'.png']));
const secondary=Object.fromEntries(Object.entries(slug).map(([id,name])=>[id,
 folder+'diacritic/Secondary_'+name+(id.startsWith('s')?'-uniform.png':'-uniform.png')]));
const independent=Object.fromEntries(allowedLetters.map(k=>[k,folder+'independent/'+k+'-font.png']));
const subscript=Object.fromEntries(allowedLetters.map(k=>[k,folder+'subscript/'+k+'-uniform.png']));
window.AZ_ASSETS={primary,secondary,independent,subscripts:subscript};
const vowelHosts=new Set(['A','E','I','O','W','Y']);
const markSet=new Set(ordinary.map(x=>x.id)),specialSet=new Set(specials.map(x=>x.id));
const cleanIds=(items)=>[...new Set(Array.isArray(items)?items:[])];
function normalizeLetter(input){
 const base=String(input?.base||'').toUpperCase();
 const subList=Array.isArray(input?.subs)?input.subs:[];
 const subTokens=subList.map(s=>({key:String(s?.key||'').toLowerCase(),marks:cleanIds(s?.marks)}));
 return {type:'letter',base,marks:cleanIds(input?.marks),markOrder:cleanIds(input?.marks),
   subs:subTokens,specials:cleanIds(input?.specials)};
}
function vowelNucleus(base,marks){
 return vowelHosts.has(base.toUpperCase())||
   marks.includes('central')||marks.includes('open')||marks.includes('short')||marks.includes('long');
}
function validateLetterRules(t){
 if(!ind[t.base])return 'No independent Modern '+t.base+' letter.';
 if(t.marks.length>2||t.subs.length>2||t.subs.some(s=>s.marks.length>2))return 'Maximum two phonetic marks per letter/subscript and two subscripts.';
 if(t.specials.length>4)return 'At most four special controls.';
 if(t.marks.some(id=>!markSet.has(id))||t.subs.some(s=>s.marks.some(id=>!markSet.has(id))))return 'Unknown Modern mark.';
 if(t.specials.some(id=>!specialSet.has(id)))return 'Unknown Modern special control.';
 if(t.subs.some(s=>!subs[s.key]))return 'Unknown Modern subscript.';
 if(t.marks.includes('voiced')&&t.marks.includes('unvoiced'))return 'Voiced and Unvoiced Sound cannot be combined on one letter.';
 if(t.subs.some(s=>s.marks.includes('voiced')&&s.marks.includes('unvoiced')))return 'Voiced and Unvoiced Sound cannot be combined on one subscript.';
 if(t.marks.includes('short')&&t.marks.includes('long'))return 'Short and Long Vowel are mutually exclusive.';
 if(t.subs.some(s=>s.marks.includes('short')&&s.marks.includes('long')))return 'Short and Long Vowel are mutually exclusive on one subscript.';
 if(t.subs.some(s=>s.marks.includes('separate')))return 'Separated Vowel belongs only to the independent host.';
 if(t.marks.includes('separate')&&(!vowelNucleus(t.base,t.marks)||!t.subs.some(s=>vowelNucleus(s.key,s.marks))))
   return 'Separated Vowel requires a vowel host and a genuine vowel subscript.';
 if(t.base==='B'&&t.marks.includes('unvoiced')&&!t.marks.includes('soft'))
   return 'Modern F is B + Soft Sound + Unvoiced Sound. P remains independent.';
 return null;
}
function encode(input){
 const t=normalizeLetter(input),error=validateLetterRules(t);if(error)throw Error(error);
 const write=ids=>ids.map(id=>byId.get(id).unicode).join('');
 const early=new Set(['soft','hard','held']);
 return ind[t.base]+write(t.marks.filter(id=>early.has(id)))+
  t.subs.map(s=>subs[s.key]+write(s.marks)).join('')+
  write(t.marks.filter(id=>!early.has(id)))+write(t.specials);
}
/* Keep the user's image silhouettes intact. The compositor uses the existing
   PNGs for the main glyph, primary/secondary accents, and 20%-scale subscripts.
   This visualization is separate from the canonical serialized Khmer Unicode. */
/* Exact glyph-body and diacritic attachment registrations restored from
   Modern_Azaraan_AWS_Styled_Keyboard_Glyph_Studio_2026-11-16 (supplied
   font-registration.json / asset-ink-metrics.json). Values are original,
   not inferred from the stems/tails or CSS keycap bounds. */
const MARK_ORDER=['held','central','open','short','long','unvoiced','voiced','separate','nasal','soft','hard','glide'];
const FONT_REG={
A:[[430,-5,824,354],[430,-4,823,355],[-4.6392,-128.1641],{}],
B:[[46,-765,873,345],[439,-24,873,345],[-3.8812,-128.1641],{1:[-3.8812,-132.1641],3:[0.1188,-128.1641],4:[-3.8812,-130.1641],5:[-3.8812,-132.1641],7:[-3.8812,-130.1641],8:[-3.8812,-130.1641],9:[-9.8812,-134.1641],10:[-15.8812,-134.1641],6:[-3.8812,-130.1641],11:[-3.8812,-130.1641]}],
D:[[403,-4,847,352],[403,-3,847,353],[-4.8812,-128.1641],{}],
E:[[402,-2,847,352],[402,-1,847,352],[-4.9618,-128.1641],{}],
G:[[43,-696,907,340],[421,-24,906,341],[-2.6715,-128.1641],{1:[-2.6715,-130.1641],2:[-0.6715,-130.1641],3:[-0.6715,-128.1641],9:[-12.6715,-128.1641],10:[-12.6715,-136.1641]}],
H:[[426,-530,1200,668],[568,-24,1003,356],[21.0059,-128.1641],{4:[29.0059,-126.1641],6:[31.0059,-124.1641],11:[29.0059,-126.1641]}],
I:[[434,1,815,348],[434,2,815,348],[-4.9618,-128.1641],{}],
J:[[436,1,814,349],[436,2,814,349],[-4.8812,-128.1641],{}],
K:[[425,-24,1164,1010],[425,-23,840,356],[-3.6715,-128.1641],{}],
L:[[390,-531,1169,667],[599,-24,969,356],[20.764,-128.1641],{4:[24.764,-126.1641],10:[18.764,-128.1641],6:[26.764,-124.1641],11:[24.764,-126.1641]}],
M:[[431,-2,819,354],[431,-1,819,355],[-4.8812,-128.1641],{}],
N:[[397,-482,1121,635],[572,-24,942,356],[16.4092,-128.1641],{4:[18.4092,-126.1641],10:[14.4092,-130.1641],6:[20.4092,-124.1641],11:[18.4092,-126.1641]}],
O:[[48,-764,1061,341],[576,-24,1060,342],[8.2479,-134.1641],{1:[6.2479,-134.1641],2:[10.2479,-136.1641],3:[26.2479,-128.1641],4:[-19.91,-171.6617],5:[8.2479,-136.1641],9:[0.2479,-136.1641],10:[-4.7521,-136.1641]}],
P:[[438,-11,812,381],[438,-9,812,356],[-4.8812,-128.1641],{}],
R:[[432,4,818,348],[432,5,818,349],[-4.8812,-128.1641],{}],
S:[[407,-503,1126,634],[574,-24,951,356],[17.2963,-128.1641],{4:[21.2963,-124.1641],6:[25.2963,-126.1641],11:[21.2963,-124.1641]}],
T:[[357,-476,951,352],[623,-24,950,352],[21.1672,-128.1641],{9:[15.1672,-130.1641],10:[11.1672,-136.1641]}],
W:[[416,-10,992,956],[417,-9,819,356],[-6.0102,-128.1641],{7:[-10.0102,-128.1641],8:[-20.0102,-134.1641]}],
Y:[[418,-35,1044,965],[418,-24,845,356],[-5.8328,-128.1641],{1:[-3.8328,-128.1641],2:[-3.8328,-128.1641],3:[-3.8328,-128.1641],4:[-3.8328,-128.1641],5:[-3.8328,-128.1641],8:[-17.8328,-130.1641],9:[-3.8328,-124.1641],10:[-3.8328,-128.1641],6:[-3.8328,-128.1641],11:[-3.8328,-128.1641]}],
Z:[[372,-473,1094,623],[594,-24,920,356],[16.4092,-128.1641],{9:[14.4092,-128.1641],10:[10.4092,-132.1641]}]
};
const INK_PRIMARY={
held:[306,303,693,945],central:[306,303,693,934],open:[296,321,977,924],short:[311,325,895,885],
long:[306,303,1044,956],unvoiced:[306,303,693,934],voiced:[306,303,1019,1027],separate:[305,286,758,933],
nasal:[306,261,821,933],soft:[289,303,693,984],hard:[306,303,693,1007],glide:[306,303,1014,985],
sUnder:[421,474,761,771],sOver:[519,486,732,803],sLeft:[499,491,735,763],sRight:[520,504,736,767]
};
const INK_SECONDARY={
held:[74,73,127,133],central:[80,73,118,119],open:[69,75,129,124],short:[85,83,116,114],
long:[76,71,128,137],unvoiced:[75,82,137,126],voiced:[75,72,125,133],separate:[71,87,125,118],
nasal:[71,73,130,123],soft:[77,77,128,127],hard:[77,72,125,128],glide:[74,77,130,132],
sUnder:[82,83,124,121],sOver:[85,71,117,131],sLeft:[87,71,116,112],sRight:[85,80,114,118]
};
const INK_SUBSCRIPT={
a:[12,8,186,191],b:[7,6,192,189],d:[9,9,189,192],e:[14,10,194,191],g:[5,4,194,191],
h:[9,10,193,190],i:[0,0,200,200],j:[13,11,192,195],k:[11,8,187,192],l:[17,7,181,195],
m:[13,11,188,191],n:[12,10,191,187],o:[10,12,191,194],p:[18,10,187,195],r:[6,8,197,190],
s:[8,9,189,192],t:[12,8,186,191],w:[7,10,191,189],y:[10,13,189,190],z:[17,8,184,194]
};
const FONT_UNITS_PER_PIXEL=6.2, NATIVE_BASE_SIZE=78, NATIVE_PRIMARY_SIZE=200,
 NATIVE_SECONDARY_SIZE=48, NATIVE_SUB_SIZE=NATIVE_BASE_SIZE*0.2, NATIVE_SUB_MARK_SIZE=20;
window.AZ_FONT_REGISTRATION={
 version:3,fontUnitsPerPixel:FONT_UNITS_PER_PIXEL,baseReferenceFrame:NATIVE_BASE_SIZE,
 primaryFrame:NATIVE_PRIMARY_SIZE,
 letters:Object.fromEntries(Object.entries(FONT_REG).map(([key,d])=>[key,{bbox:d[0],bodyBBox:d[1],advance:1250}])),
 primary:Object.fromEntries(Object.entries(FONT_REG).map(([key,d])=>[key,
   Object.fromEntries(MARK_ORDER.map((id,i)=>[id,d[3][i]||d[2]]))])),
 primaryFrames:{O:{long:260}}
};
/* Restore the original 2026-11-16 attachment model: full PNG outlines
   retain their native aspect ratio; primary enclosures are placed from
   per-letter TTF body anchors, not a fixed right-hand CSS slot. */
function inkInfo(group,key,frame){
 const b=group==='primary'?INK_PRIMARY[key]:group==='secondary'?INK_SECONDARY[key]:INK_SUBSCRIPT[key];
 if(!b)throw Error('Missing source ink registration: '+group+'/'+key);
 const canvas=group==='primary'?1254:200,scale=frame/canvas;
 return {left:b[0]*scale,top:b[1]*scale,w:(b[2]-b[0])*scale,h:(b[3]-b[1])*scale};
}
function rectPart(group,key,x,y,frame,kind,target){
 const ink=inkInfo(group,key,frame),rect={x:x+ink.left,y:y+ink.top,w:ink.w,h:ink.h};
 return {group,key,x,y,w:frame,h:frame,frame,rect,kind,target};
}
function atInk(group,key,inkX,inkY,frame,kind,target){
 const d=inkInfo(group,key,frame);
 return rectPart(group,key,inkX-d.left,inkY-d.top,frame,kind,target);
}
function boundsFor(b){return {x:b[0]/FONT_UNITS_PER_PIXEL,y:-b[3]/FONT_UNITS_PER_PIXEL,w:(b[2]-b[0])/FONT_UNITS_PER_PIXEL,h:(b[3]-b[1])/FONT_UNITS_PER_PIXEL};}
function headlessBase(base){
 const bbox=FONT_REG[base][0],rect=boundsFor(bbox);
 return {group:'letters',key:base,x:rect.x,y:rect.y,w:rect.w,h:rect.h,frame:NATIVE_BASE_SIZE,rect,kind:'base',target:'base'};
}
function overlapsRect(a,b){
 return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}
function pickMark(group,id,frame,positions,kind,target,avoid=[]){
 for(const [x,y] of positions){
  const p=atInk(group,id,x,y,frame,kind,target);
  if(!avoid.some(a=>overlapsRect(a.rect,p.rect)))return p;
 }
 // Primary enclosures intentionally wrap the base; prioritize the approved
 // attachment over moving the glyph into empty space just to clear bounding
 // rectangles (the original used pixel masks for outline collision).
 return atInk(group,id,...positions[0],frame,kind,target);
}
function modernParts(input){
 const t=normalizeLetter(input),reg=FONT_REG[t.base],body=boundsFor(reg[1]),base=headlessBase(t.base);
 const pieces=[base];
 let primary=null;
 if(t.marks.length){
  const id=t.marks[0],idx=MARK_ORDER.indexOf(id),frame=(t.base==='O'&&id==='long')?260:NATIVE_PRIMARY_SIZE;
  const primaryPos=(idx>=0&&(reg[3][idx]||reg[2]))||reg[2];
  primary=rectPart('primary',id,primaryPos[0],primaryPos[1],frame,'primary','base');
  pieces.push(primary);
 }
 if(t.marks.length>1){
  const id=t.marks[1],d=inkInfo('secondary',id,NATIVE_SECONDARY_SIZE);
  const p=primary.rect;
  const positions=[
   [p.x-d.w+1,p.y+4],
   [p.x-d.w+1,p.y+p.h-d.h-4],
   [p.x+p.w-1,p.y-d.h+2]
  ];
  // Keep the inherited secondary inside the primary's open side. The
  // unfilled interior of an enclosure may share its bounding rectangle with
  // the main letter; a full-box collision test would detach the mark.
  pieces.push(pickMark('secondary',id,NATIVE_SECONDARY_SIZE,positions,'secondary','base'));
 }
 // Glottal and click are ABOVE every stem, including tall W/Y/K letters.
 const specialsSoFar=[];
 for(const id of t.specials){
  const frame=132,d=inkInfo('primary',id,frame);
  const pBase=base.rect,top=Math.min(pBase.y,...specialsSoFar.filter(x=>x.key==='sOver'||x.key==='sUnder').map(x=>x.rect.y));
  let positions;
  if(id==='sOver'||id==='sUnder'){
   const x=body.x+(body.w-d.w)/2;
   positions=[[x,top-d.h-6],[x-d.w-7,top-d.h-6],[x+d.w+7,top-d.h-6]];
  }else if(id==='sLeft'){
   const x=Math.min(body.x,pBase.x)-d.w-9;
   positions=[[x,body.y+(body.h-d.h)/2],[x-d.w-6,body.y+(body.h-d.h)/2]];
  }else{
   const x=Math.max(body.x+body.w,pBase.x+pBase.w)+9;
   positions=[[x,body.y+(body.h-d.h)/2],[x+d.w+6,body.y+(body.h-d.h)/2]];
  }
  const part=pickMark('primary',id,frame,positions,'special','base',[base,...pieces,...specialsSoFar]);
  specialsSoFar.push(part);pieces.push(part);
 }
 if(t.subs.length){
  const frame=NATIVE_SUB_SIZE,submarks=NATIVE_SUB_MARK_SIZE;
  const blocks=t.subs.map(s=>{
   const left=s.marks[0]?inkInfo('secondary',s.marks[0],submarks).w+2:0;
   const right=s.marks[1]?inkInfo('secondary',s.marks[1],submarks).w+2:0;
   return {...s,left,right,width:frame+left+right};
  });
  const gap=5,total=blocks.reduce((n,s)=>n+s.width,0)+(blocks.length-1)*gap;
  let x=body.x+(body.w-total)/2;
  const priorPrimary=(primary&&primary.rect)||null;
  let y=Math.max(body.y+body.h+11,priorPrimary?priorPrimary.y+priorPrimary.h+5:-Infinity);
  // The archived layout places subscripts below the body and to the RIGHT of
  // any descending tail, never over a tail or above each other.
  const bbox=reg[0],bodyBox=reg[1];
  const descending=bbox[1]<bodyBox[1]-100;
  if(descending){
   const tailLeft=bbox[0]/FONT_UNITS_PER_PIXEL;
   const tailWidth=Math.max(9,(bodyBox[0]-bbox[0])/FONT_UNITS_PER_PIXEL);
   const tailRight=tailLeft+Math.min(tailWidth,body.w*0.50);
   if(x<tailRight+4&&x+total>tailLeft)x=tailRight+4;
  }
  const hosts=[];
  blocks.forEach((s,i)=>{
   const host=rectPart('subscripts',s.key,x+s.left,y,frame,'sub','sub'+i);
   pieces.push(host);hosts.push(host);x+=s.width+gap;
  });
  blocks.forEach((s,i)=>s.marks.forEach((id,j)=>{
   const host=hosts[i],d=inkInfo('secondary',id,submarks);
   const inkX=j?host.rect.x+host.rect.w+1:host.rect.x-d.w-1;
   const inkY=host.rect.y+(host.rect.h-d.h)/2;
   pieces.push(atInk('secondary',id,inkX,inkY,submarks,'submark','sub'+i));
  }));
 }
 return pieces;
}
function createCluster(input){
 const t=normalizeLetter(input),error=validateLetterRules(t);if(error)throw Error(error);
 const parts=modernParts(t),pad=6;
 const minX=Math.min(0,...parts.map(x=>x.rect.x)),minY=Math.min(0,...parts.map(x=>x.rect.y));
 const maxX=Math.max(1250/FONT_UNITS_PER_PIXEL,...parts.map(x=>x.rect.x+x.rect.w));
 const maxY=Math.max(10,...parts.map(x=>x.rect.y+x.rect.h));
 const cell=document.createElement('span');cell.className='az-khmer-cluster packed-cluster';
 cell.style.position='relative';cell.style.display='inline-block';
 cell.style.verticalAlign='baseline';cell.style.lineHeight='0';
 cell.style.width=Math.ceil(maxX-minX+12)+'px';cell.style.height=Math.ceil(maxY-minY+12)+'px';
 cell.dataset.layout=JSON.stringify(parts.map(p=>({key:p.key,kind:p.kind,target:p.target,x:p.rect.x,y:p.rect.y,w:p.rect.w,h:p.rect.h,frame:p.frame})));
 cell.dataset.encoded=encode(t);cell.dataset.baseSize=String(NATIVE_BASE_SIZE);
 for(const p of parts){
  const box=document.createElement('span');box.className='packed-ink az-'+p.kind;
  box.style.position='absolute';box.style.left=(p.x-minX+pad)+'px';box.style.top=(p.y-minY+pad)+'px';
  box.style.width=p.w+'px';box.style.height=p.h+'px';
  box.dataset.inkGroup=p.group;box.dataset.inkKey=p.key;
  const img=document.createElement('img');img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');
  img.src=p.group==='letters'?independent[p.key]:p.group==='subscripts'?subscript[p.key.toUpperCase()]:
    p.group==='primary'?primary[p.key]:secondary[p.key];
  img.style.position='absolute';img.style.left='0';img.style.top='0';
  img.style.width='100%';img.style.height='100%';img.style.maxWidth='none';img.style.maxHeight='none';img.style.objectFit='fill';
  box.append(img);cell.append(box);
 }
 const baseline=document.createElement('span');baseline.className='packed-baseline';
 baseline.style.display='inline-block';baseline.style.height=(-minY+pad)+'px';baseline.style.width='0';
 cell.prepend(baseline);
 return cell;
}
window.AZ_MK={normalizeLetter,validateLetterRules,encode,createCluster};
})();
