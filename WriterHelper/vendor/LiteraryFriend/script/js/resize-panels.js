/* Pointer + keyboard resize handles for all chrome panels; sizing is persisted locally. */
(()=>{'use strict';
 const selectors=[['.workspace-rail','rail'],['.channels-pane','channels'],['.inspector','inspector'],['#floating-keyboard','keyboard'],['#helper-window','helper'],['#main-dialog','main-dialog'],['#settings-dialog','settings-dialog']];
 const K='literary-friend-pane-sizes-v1';let saved={};try{saved=JSON.parse(localStorage.getItem(K)||'{}')}catch{}
 const clamp=(v,min,max)=>Math.max(min,Math.min(v,max));
 const app=document.querySelector('.app');
 function applySize(el,name,w,h,x,y){
   if(name==='rail'){const width=clamp(w,54,180);el.style.width=width+'px';app.style.setProperty('--rail-w',width+'px');el.style.height=clamp(h,120,innerHeight)+'px';}
   else if(name==='channels'||name==='inspector'){
     const max=Math.max(180,Math.min(innerWidth*.8,620));
     const width=clamp(w,130,max);el.style.width=width+'px';app.style.setProperty(name==='channels'?'--channels-w':'--inspector-w',width+'px');el.style.height=clamp(h,150,innerHeight)+'px';el.style.bottom='auto';
   }else{
     el.style.width=clamp(w,260,Math.max(260,innerWidth-4))+'px';
     if(name==='keyboard'||name==='helper')el.style.height=clamp(h,48,Math.max(48,innerHeight-5))+'px';
     else el.style.height=clamp(h,200,Math.max(200,innerHeight-5))+'px';
     if((name==='helper'||name==='keyboard')&&Number.isFinite(x)&&Number.isFinite(y)){
       el.style.left=clamp(x,0,Math.max(0,innerWidth-45))+'px';el.style.top=clamp(y,0,Math.max(0,innerHeight-45))+'px';el.style.right='auto';el.style.bottom='auto';
     }
   }
   const base=name==='rail'?70:name==='channels'?242:name==='inspector'?300:name==='keyboard'?600:name==='helper'?500:520;
   el.style.setProperty('--resize-scale',clamp(w/base,.7,1.75).toFixed(3));
 }
 function attach(el,name){
   if(!el)return;
   if(saved[name]){const {w,h,x,y}=saved[name];applySize(el,name,w,h,x,y)}
   const dirs=['e','w','n','s','ne','nw','se','sw'];
   for(const dir of dirs){const g=document.createElement('div');g.className='ui-resize-grip';g.dataset.dir=dir;g.tabIndex=0;g.setAttribute('role','separator');g.setAttribute('aria-label',`Resize ${name}: ${dir}`);el.append(g);
     let start=null;
     g.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=el.getBoundingClientRect();start={px:e.clientX,py:e.clientY,r};g.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation()});
     g.addEventListener('pointermove',e=>{if(!start)return;const {r,px,py}=start;const dx=e.clientX-px,dy=e.clientY-py;
       let w=r.width+(dir.includes('e')?dx:dir.includes('w')?-dx:0),h=r.height+(dir.includes('s')?dy:dir.includes('n')?-dy:0);
       if((name==='rail'||name==='channels'||name==='inspector')&&dir==='w')w=r.width-dx;
       const x=r.left+(dir.includes('w')?dx:0),y=r.top+(dir.includes('n')?dy:0);
       applySize(el,name,w,h,x,y)
     });
     function end(){if(!start)return;start=null;const r=el.getBoundingClientRect();saved[name]={w:r.width,h:r.height,x:r.left,y:r.top};try{localStorage.setItem(K,JSON.stringify(saved))}catch{}}
     g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);g.addEventListener('lostpointercapture',end);
     g.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=el.getBoundingClientRect(),step=e.shiftKey?32:8;const dx=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0,dy=e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0;applySize(el,name,r.width+dx,r.height+dy,r.left,r.top);end();const t=el.getBoundingClientRect();saved[name]={w:t.width,h:t.height,x:t.left,y:t.top};localStorage.setItem(K,JSON.stringify(saved))});
   }
   const observer=new ResizeObserver(()=>{const width=el.getBoundingClientRect().width;const base=name==='rail'?70:name==='channels'?242:name==='inspector'?300:name==='helper'?500:name==='keyboard'?600:520;el.style.setProperty('--resize-scale',clamp(Math.min(width/base,el.getBoundingClientRect().height/Math.max(160,Math.min(850,innerHeight))),.7,1.75).toFixed(3))});observer.observe(el);
 }
 for(const [selector,name] of selectors)attach(document.querySelector(selector),name);
 const windowEl=document.getElementById('helper-window'),handle=document.getElementById('helper-handle');let drag=null;
 handle?.addEventListener('pointerdown',e=>{if(e.target.closest('button,input,select'))return;const r=windowEl.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,l:r.left,t:r.top};handle.setPointerCapture(e.pointerId);e.preventDefault()});
 handle?.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;windowEl.style.left=clamp(drag.l+e.clientX-drag.x,0,innerWidth-45)+'px';windowEl.style.top=clamp(drag.t+e.clientY-drag.y,0,innerHeight-45)+'px'});
 handle?.addEventListener('pointerup',()=>{if(!drag)return;const r=windowEl.getBoundingClientRect();saved.helper={w:r.width,h:r.height,x:r.left,y:r.top};localStorage.setItem(K,JSON.stringify(saved));drag=null});
 window.addEventListener('resize',()=>{for(const [sel,name] of selectors){const el=document.querySelector(sel),r=el?.getBoundingClientRect();if(el&&r&&(r.right>innerWidth+10||r.bottom>innerHeight+10))applySize(el,name,r.width,r.height,clamp(r.left,0,innerWidth-45),clamp(r.top,0,innerHeight-45))}});
})();
