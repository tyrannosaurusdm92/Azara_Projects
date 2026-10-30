/* Parent Belavados compatibility adapter for the upgraded digital-sprite Onyx module. */
(function(root){
'use strict';
function pet(){return root.OnyxVirtualPet}
function engine(){return root.OnyxConversationEngine}
function profile(){return 'shared'}
function state(){const p=pet();return p?.getState?.()||{open:false,chatMode:'auto',activeTab:'virtual',backendProfile:profile()}}
const api={
  open(){return pet()?.open?.()},close(){return pet()?.close?.()},toggle(){const s=state();return s.open?this.close():this.open()},
  async chat(message,options={}){const p=pet(),tab=String(options.tab||options.lane||state().activeTab||'virtual');if(options.mode)p?.setChatMode?.(options.mode);if(options.tab||options.lane)await p?.setTab?.(tab);if(p?.chat)return p.chat(String(message||''),tab);const out=await engine()?.reply?.({text:String(message||''),lane:tab,mode:options.mode||'auto',history:options.history||[],attachments:options.attachments||[],pet:options.pet||{}});return out?.raw||out},

  setHuman(){return profile()},setMode(mode){pet()?.setChatMode?.(mode||'auto');return state().chatMode},setTab(tab){return pet()?.setTab?.(tab)},setPersonalContextEnabled(){return true},
  setVisualState(value){return pet()?.setState?.(String(value||'listening'),10000,{direct:true,quiet:true})},getVisualState(){return state().state},
  feed(){return pet()?.act?.('feed')},care(actionId){return pet()?.act?.(String(actionId||'pet'))},
  getCompanionState(){return state()},getState(){return {...state(),profileKey:profile(),sourceBridge:!!root.OnyxSourceBridge,capabilitiesReady:Boolean(root.OnyxBackendClient?.snapshot?.()?.capabilityContract)}}
};
root.OnyxSupportChat=Object.freeze(api);
root.BelavadosOnyx=Object.freeze({api:root.OnyxSupportChat,backend:root.OnyxBackendClient,data:root.OnyxDataRuntime,engine:root.OnyxConversationEngine,sourceBridge:root.OnyxSourceBridge});
})(window);

/* Interaction-shell fallback merged from the companion Onyx build.
   Normal operation is owned by onyx-core.js. This activates only when the
   core API did not initialize, keeping the 190px bubble clickable/movable. */
(function(root){
'use strict';
if(root.OnyxVirtualPet?.open)return;
const widget=document.getElementById('onyxWidget'),bubble=document.getElementById('onyxBubble'),panel=document.getElementById('onyxPopout'),close=document.getElementById('onyxClose');
if(!widget||!bubble||!panel)return;
let open=false,drag=null,moved=false,suppressClick=false;
const setOpen=next=>{open=Boolean(next);widget.classList.toggle('open',open);widget.dataset.sizeState=open?'expanded':'hyper-reduced';bubble.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));try{root.dispatchEvent(new CustomEvent('onyx:open-change',{detail:{open,fallback:true}}))}catch(_){}};
bubble.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(widget.classList.contains('is-fullscreen')||widget.classList.contains('tab-fullscreen'))return;const r=widget.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};moved=false;try{bubble.setPointerCapture?.(e.pointerId)}catch(_){}});
bubble.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6){moved=true;widget.classList.add('dragging')}if(!moved)return;e.preventDefault?.();const bw=bubble.offsetWidth||190,bh=bubble.offsetHeight||190;widget.style.left=Math.max(8,Math.min(innerWidth-bw-8,drag.left+dx))+'px';widget.style.top=Math.max(8,Math.min(innerHeight-bh-8,drag.top+dy))+'px';widget.style.right='auto';try{root.dispatchEvent(new CustomEvent('onyx:widget-move'))}catch(_){}});
bubble.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;if(moved){suppressClick=true;setTimeout(()=>suppressClick=false,0)}widget.classList.remove('dragging');drag=null;moved=false});
bubble.addEventListener('pointercancel',()=>{widget.classList.remove('dragging');drag=null;moved=false});
bubble.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;return}setOpen(!open)});
close?.addEventListener('click',()=>setOpen(false));
root.OnyxInteractionFallback=Object.freeze({open:()=>setOpen(true),close:()=>setOpen(false),toggle:()=>setOpen(!open),getState:()=>({open})});
})(window);

