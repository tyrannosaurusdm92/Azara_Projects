/* Writer Helper retained adapter: AI-network dispatch disabled intentionally.
   Only the existing Literary Friend account bridge is allowed (backend-bridge.js). */
(function(global){'use strict';
  const disabled=async()=>{throw Error('Helper cannot call generative providers; this is a local writing assistant.');};
  const result=Object.freeze({VERSION:'5.0.0-local',providerEnabled:false,endpoint:()=>'',post:disabled,postOnyx:disabled,postCompat:disabled,generatePrimary:disabled,generateWithFallback:disabled,provider:disabled,finalizeText:t=>String(t||''),finalizeResult:r=>r,install:()=>false});
  global.WriterToolsBackendBridge=result;
})(window);
