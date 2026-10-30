/* Belavadós parent bridge: existing Onyx/Forge methods plus province navigation. */
(()=>{'use strict';
const frame=document.getElementById('belavadosProfileFrame'),listeners=new Set();
const child=()=>{try{return frame?.contentWindow||null}catch{return null}};
const unified=()=>{try{return child()?.BelavadosUnified||null}catch{return null}};
const getForge=()=>{try{return child()?.BelavadosWorldForge||null}catch{return null}};
const getAtlas=()=>{try{return child()?.BelavadosLivingWorld||null}catch{return null}};
const getContext=()=>unified()?.getContext?.()||null;
function broadcast(ctx){const data=ctx||getContext();if(!data)return;window.dispatchEvent(new CustomEvent('belavados:ttrpg-contextchange',{detail:data}));listeners.forEach(cb=>{try{cb(data)}catch(e){console.error('TTRPG listener failed',e)}});}
function navigate(action,extra={}){
 const ui=unified();
 if(ui){if(action==='generator')return ui.openGenerator();if(action==='province')return ui.openProvince(extra.provinceId);if(action==='settlement')return ui.openSettlement(extra.provinceId,extra.settlementId);}
 const win=child();if(win&&location.origin!=='null'){win.postMessage({source:'belavados-ttrpg-host',action,...extra},location.origin);return true;}return false;
}
window.BelavadosTTRPG=Object.freeze({
 openForge(){window.OnyxShell?.enterForgeFullscreen?.()},
 openWork(){window.OnyxShell?.enterWorkFullscreen?.()},
 getForge,getAtlas,getContext,getUnified:unified,
 openGenerator(){return navigate('generator')},
 openProvince(provinceId){return navigate('province',{provinceId})},
 openSettlement(provinceId,settlementId){return navigate('settlement',{provinceId,settlementId})},
 forgeAction(name,...args){const forge=getForge();const key=String(name||'');if(!forge||!['generateSettlement','generateNPCs','validate'].includes(key))return false;const fn=forge[key];return typeof fn==='function'?fn(...args):false},
 focusForge(){try{child()?.focus?.();return true}catch{return false}},
 onContextChange(callback){if(typeof callback!=='function')return()=>{};listeners.add(callback);return()=>listeners.delete(callback)}
});
window.addEventListener('message',event=>{if(event.source!==child()||event.origin!==location.origin||event.data?.source!=='belavados-unified-index')return;if(['ready','viewchange','contextchange'].includes(event.data.type))broadcast(event.data.context);});
frame?.addEventListener('load',()=>broadcast());
})();