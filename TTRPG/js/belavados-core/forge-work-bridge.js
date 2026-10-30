/* Unified Belavadós Forge + Onyx Work workspace: preserve one chat and one editable Forge document. */
(()=>{'use strict';
const frame=document.getElementById('belavadosProfileFrame');
function getForge(){try{return frame?.contentWindow?.BelavadosWorldForge||null}catch(_){return null}}
window.BelavadosTTRPG=Object.freeze({
 openForge(){window.OnyxShell?.enterForgeFullscreen?.()},
 openWork(){window.OnyxShell?.enterWorkFullscreen?.()},
 getForge,
 forgeAction(name,...args){const forge=getForge();const action=String(name||'');if(!forge||!['generateSettlement','generateNPCs','validate'].includes(action))return false;const fn=forge[action];if(typeof fn!=='function')return false;return fn(...args)},
 focusForge(){try{frame?.contentWindow?.focus?.();return true}catch(_){return false}}
});
})();
