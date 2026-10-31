(()=>{'use strict';
 const root=document.documentElement,$=s=>document.querySelector(s),slow=$('#slowPetGame'),fast=$('#onyxLeisureFullscreen'),work=$('#onyxWorkFullscreenShell');
 const frameFor=tab=>window.OnyxFullscreenShells?.frameFor?.(tab);
 const forgeExit=$('#belavadosForgeFullscreenExit');
 function closeRuntimeChat(){root.dataset.gameChat='';window.OnyxVirtualPet?.close?.();}
 function openRuntimeChat(tab){if(tab!=='health'&&tab!=='leisure')return;root.dataset.gameChat=tab;window.OnyxRoundWidget?.setTab?.(tab);window.OnyxVirtualPet?.setTab?.(tab);window.OnyxVirtualPet?.open?.();setTimeout(()=>document.querySelector(`[data-chat-input="${tab}"]`)?.focus(),0)}
 function hideWork(){if(work)work.hidden=true}
 function closeTransientSurfaces(){
   window.OnyxVirtualPet?.close?.();
   document.querySelectorAll('#onyxWidget dialog[open]').forEach(d=>{try{d.close()}catch{d.removeAttribute('open')}});
   const widget=$('#onyxWidget'),popout=$('#onyxPopout');
   widget?.classList.remove('is-fullscreen','tab-fullscreen','open');
   if(popout)popout.setAttribute('aria-hidden','true');
   $('#onyxBubble')?.setAttribute('aria-expanded','false');
   root.dataset.gameChat='';
 }
 function notifyWorkFrame(visible){
   const frame=frameFor('work');
   if(!frame?.contentWindow)return;
   try{frame.contentWindow.postMessage({source:'belavados-onyx-parent',type:'shell-visibility',visible:Boolean(visible)},'*')}catch(_){}
 }
 function resetSurfaces(){
   if(slow)slow.hidden=true;
   if(fast)fast.hidden=true;
   if(forgeExit)forgeExit.hidden=true;
   hideWork();
   closeTransientSurfaces();
 }
 function enterForgeFullscreen(){
   // World Forge already occupies the starting page. Reuse it instead of creating a second fullscreen mode.
   resetSurfaces();root.dataset.runtimeMode='module';
   notifyWorkFrame(false);
   window.BelavadosTTRPG?.openGenerator?.();
   $('#belavadosProfileFrame')?.contentWindow?.focus?.();
 }
 function exitForgeFullscreen(){
   if(forgeExit)forgeExit.hidden=true;
   root.dataset.runtimeMode='module';closeTransientSurfaces();
   window.OnyxVirtualPet?.setTab?.('work');
   settleCollapsedBubble();
   requestAnimationFrame(settleCollapsedBubble);
   $('#onyxBubble')?.focus?.({preventScroll:true});
 }
 function enterFastGame(){
   resetSurfaces();root.dataset.runtimeMode='fast-game';notifyWorkFrame(false);
   if(fast)fast.hidden=false;
   window.OnyxFullscreenShells?.load?.('leisure');
   document.body.scrollTop=0;document.documentElement.scrollTop=0;
   setTimeout(()=>window.OnyxFullscreenShells?.focus?.('leisure'),0);
 }
 function enterSlowGame(){
   resetSurfaces();root.dataset.runtimeMode='module';notifyWorkFrame(false);
   $('#belavadosProfileFrame')?.focus?.();
 }
 function enterWorkFullscreen(){
   resetSurfaces();
   root.dataset.runtimeMode='work';
   if(work)work.hidden=false;
   window.OnyxFullscreenShells?.load?.('work');
   notifyWorkFrame(true);
   syncWorkDesign();requestAnimationFrame(syncWorkDesign);
   document.body.scrollTop=0;document.documentElement.scrollTop=0;
   setTimeout(()=>window.OnyxFullscreenShells?.focus?.('work'),0);
 }
 function settleCollapsedBubble(){
   if(root.dataset.runtimeMode!=='module')return;
   if(window.OnyxVirtualPet?.getState?.()?.open)window.OnyxVirtualPet.close?.();
   const widget=$('#onyxWidget');
   if(widget){widget.classList.remove('open','tab-fullscreen','is-fullscreen');widget.dataset.sizeState='hyper-reduced';}
   $('#onyxPopout')?.setAttribute('aria-hidden','true');
   $('#onyxBubble')?.setAttribute('aria-expanded','false');
 }
 function exitWorkFullscreen(){
   if(work)work.hidden=true;
   notifyWorkFrame(false);
   root.dataset.runtimeMode='module';
   closeTransientSurfaces();
   window.OnyxVirtualPet?.setTab?.('work');
   settleCollapsedBubble();
   requestAnimationFrame(settleCollapsedBubble);
   $('#onyxBubble')?.focus?.({preventScroll:true});
 }
 function exitToModule(){
   if(root.dataset.runtimeMode==='forge'){exitForgeFullscreen();return}
   if(root.dataset.runtimeMode==='work'){exitWorkFullscreen();return}
   resetSurfaces();notifyWorkFrame(false);
   root.dataset.runtimeMode='module';
   window.OnyxRoundWidget?.setTab?.('work');window.OnyxVirtualPet?.setTab?.('work');
   $('#onyxBubble')?.focus?.({preventScroll:true});
 }
  function handleShellMessage(event){const d=event.data||{};if(d.source!=='belavados-onyx-fullscreen-shell')return;const expected=frameFor(d.tab==='leisure'?'leisure':d.tab==='work'?'work':'health');if(expected?.contentWindow&&event.source!==expected.contentWindow)return;if(d.type==='open-chat'){openRuntimeChat(d.tab);return}if(d.type==='shell-event'){const name=String(d.detail?.name||'');if(!name)return;window.dispatchEvent(new CustomEvent(name,{detail:{...(d.detail?.detail||{}),fullscreenProduct:d.product,fullscreenTab:d.tab,bridgedFromFullscreen:true}}));return}}
 const designKeys={panelBg:'--panel-bg',panelText:'--panel-text',panelBorder:'--panel-border',tabBg:'--tab-bg',headerBg:'--header-bg',headerText:'--header-text',surface1:'--surface-1',surface2:'--surface-2',surface3:'--surface-3',railBg:'--rail-bg',chatBg:'--chat-bg',userMessageBg:'--user-message-bg',onyxMessageBg:'--onyx-message-bg',inputBg:'--input-bg',inputText:'--input-text',buttonBg:'--button-bg',buttonText:'--button-text',buttonHover:'--button-hover',activeBg:'--active-bg',activeText:'--active-text',linkText:'--link-text',linkHover:'--link-hover',muted:'--muted',focus:'--focus',scrollTrack:'--scroll-track',scrollThumb:'--scroll-thumb'};
 let lastDesign=null;
 function readModuleDesign(){const widget=$('#onyxWidget'),panel=$('#onyxPopout'),style=getComputedStyle(panel||widget),detail={scope:'onyx-five-tab-module-only',themeMode:widget?.dataset.moduleTheme||'auto'};for(const [key,name] of Object.entries(designKeys))detail[key]=style.getPropertyValue(name).trim();return detail}
 function syncWorkDesign(){const frame=frameFor('work');if(!frame?.contentWindow)return;lastDesign=readModuleDesign();const colorMode=document.documentElement.dataset.colorMode==='light'?'light':'dark';try{frame.contentWindow.postMessage({source:'belavados-onyx-parent',type:'design-palette',detail:{...lastDesign,colorMode}},'*')}catch(_){}}
 window.addEventListener('message',handleShellMessage);
 window.OnyxShell=Object.freeze({enterFastGame,enterSlowGame,enterForgeFullscreen,exitForgeFullscreen,enterWorkFullscreen,exitWorkFullscreen,exitToModule,openRuntimeChat,closeRuntimeChat,getMode:()=>root.dataset.runtimeMode||'module'});
 $('#slowGameExit')?.addEventListener('click',exitToModule);$('#onyxLeisureGameExit')?.addEventListener('click',exitToModule);$('#onyxWorkFullscreenExit')?.addEventListener('click',exitWorkFullscreen);$('#onyxOpenWorkFullscreen')?.addEventListener('click',enterWorkFullscreen);forgeExit?.addEventListener('click',exitForgeFullscreen);
 const workFrame=frameFor('work');workFrame?.addEventListener('load',()=>{syncWorkDesign();notifyWorkFrame(root.dataset.runtimeMode==='work')});window.addEventListener('belavados:color-mode-change',syncWorkDesign);
 const widget=$('#onyxWidget');widget?.addEventListener('onyx-module-design-change',event=>{lastDesign=event.detail||readModuleDesign();syncWorkDesign()});
 if(widget&&typeof MutationObserver!=='undefined'){new MutationObserver(()=>{if(widget.classList.contains('open'))return;const tab=root.dataset.gameChat;if(tab==='health'||tab==='leisure')root.dataset.gameChat=''}).observe(widget,{attributes:true,attributeFilter:['class']})}
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(root.dataset.runtimeMode==='forge'){e.preventDefault();exitForgeFullscreen();return}if(root.dataset.runtimeMode==='work'){e.preventDefault();exitWorkFullscreen();return}if((root.dataset.runtimeMode==='slow-game'||root.dataset.runtimeMode==='fast-game')&&$('#onyxWidget')?.classList.contains('open')){e.preventDefault();closeRuntimeChat();return}if(root.dataset.runtimeMode==='slow-game'||root.dataset.runtimeMode==='fast-game'){e.preventDefault();exitToModule()}});
 const requested=new URLSearchParams(location.search).get('mode');if(requested==='forge'||requested==='worldforge')setTimeout(enterForgeFullscreen,0);else if(requested==='game'||requested==='leisure')setTimeout(enterFastGame,0);else if(requested==='virtual'||requested==='health')setTimeout(enterSlowGame,0);else root.dataset.runtimeMode='module';
})();
