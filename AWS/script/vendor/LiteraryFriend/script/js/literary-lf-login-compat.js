(function(global){
'use strict';
const LF=global.LiteraryFriend;if(!LF)return;const api=LF.services.api,id=LF.services.identity;
const normalize=(r)=>{if(r?.twoFactorRequired){const c=r.challenge||id.challenge||{};return{twoFactorRequired:true,challengeToken:c.token||r.challengeToken,method:c.method||r.method,destination:c.destination||r.destination,expiresAt:c.expiresAt||r.expiresAt};}return{ok:true,user:r?.user||id.user||null,session:r?.session||null,token:api.token};};
const loadGIS=()=>new Promise((resolve,reject)=>{if(global.google?.accounts?.id)return resolve();let s=document.querySelector('script[data-lf-login-google]');if(s){s.addEventListener('load',resolve,{once:true});s.addEventListener('error',()=>reject(new Error('Google sign-in could not be loaded.')),{once:true});return;}s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.dataset.lfLoginGoogle='true';s.onload=resolve;s.onerror=()=>reject(new Error('Google sign-in could not be loaded.'));document.head.append(s);});
async function googleCredential(){const cfg=id.clientConfig||await api.loadClientConfig();const clientId=cfg.googleClientId||cfg.config?.googleClientId||'';if(!clientId)throw new Error('Google sign-in is not configured for this deployment.');await loadGIS();return new Promise((resolve,reject)=>{let settled=false;google.accounts.id.initialize({client_id:clientId,callback:r=>{if(settled)return;settled=true;r?.credential?resolve(r.credential):reject(new Error('Google did not return a sign-in credential.'));},auto_select:false,cancel_on_tap_outside:true});google.accounts.id.prompt(n=>{if(settled)return;if(n.isNotDisplayed?.()||n.isSkippedMoment?.()){settled=true;reject(new Error('Google sign-in could not be displayed. Check browser pop-up/privacy settings and try again.'));}});});}
async function ensureConfig(){try{id.clientConfig=id.clientConfig||await api.loadClientConfig();}catch(_){} }
global.LFAuth={
 saveSession(result,remember=true){if(result?.token)api.setToken(result.token);try{if(remember&&api.token){localStorage.setItem(LF.backend.tokenStorageKey,api.token);localStorage.setItem('literaryfriend.session.token',api.token);}else if(!remember){localStorage.removeItem(LF.backend.tokenStorageKey);localStorage.removeItem('literaryfriend.session.token');localStorage.removeItem('lf.auth.token');}}catch(_){}},
 async login(data){await ensureConfig();return normalize(await id.login(data));},
 async register(data){await ensureConfig();return normalize(await id.register(data));},
 async google(extra={}){const credential=await googleCredential();return normalize(await id.google(credential,{mode:extra.mode}));},
 async passwordResetRequest(data){return id.requestPasswordReset(data.login);},
 async passwordResetComplete(data){return normalize(await id.completePasswordReset(data));},
 async recoveryCodeLogin(data){return normalize(await id.recoveryCodeLogin(data.login,data.code));},
 async twoFactorVerify(data){id.challenge={token:data.challengeToken,method:'code'};return normalize(await id.verifyTwoFactor(data.code));},
 async twoFactorResend(data){id.challenge={...(id.challenge||{}),token:data.challengeToken};const c=await id.resendTwoFactor();return{challengeToken:c.token,method:c.method,destination:c.destination,expiresAt:c.expiresAt};}
};
global.LFGuestService={start:async(profile={})=>LF.services.session.enterGuest(profile)};
})(window);
