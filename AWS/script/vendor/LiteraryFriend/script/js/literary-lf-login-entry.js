(function(global){
'use strict';
const LF=global.LiteraryFriend,U=LF.util;
let installPrompt=null,initialized=false;
function show(name){
  U.qsa('[data-login-view]').forEach(n=>n.hidden=n.dataset.loginView!==name);
  U.qs(`[data-login-view="${name}"] input`)?.focus();
}
function redirect(){location.replace('literaryfriend.html');}
function bindImmediateControls(){
  if(initialized)return;initialized=true;show('menu');
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-login-action]');if(!b)return;
    const action=b.dataset.loginAction;
    if(action==='sign-in')show('sign-in');
    else if(action==='sign-up')show('sign-up');
    else if(action==='back')show('menu');
    else if(action==='recovery')show('recovery');
    else if(action==='recovery-code-form'){const h=U.id('lf-reset-code-stage');if(h){h.hidden=false;h.querySelector('input')?.focus();}}
    else if(action==='skip'){LF.services.session.enterGuest();redirect();}
    else if(action==='install'){
      if(installPrompt){installPrompt.prompt();const choice=await installPrompt.userChoice;U.status(choice.outcome==='accepted'?'Install started.':'Install was not started.',choice.outcome==='accepted'?'success':'info');installPrompt=null;}
      else U.status('Use your browser’s Install App / Add to Home Screen command if the native install prompt is not currently available.');
    }
  });
  global.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;const b=U.qs('[data-login-action="install"]');if(b)b.dataset.installReady='true';});
  global.addEventListener('appinstalled',()=>U.status('LiteraryFriend installed.','success'));
}
async function init(){
  bindImmediateControls();
  if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js').catch(error=>console.warn('[LiteraryFriend PWA]',error));}
  try{await LF.services.store?.open?.();}catch(_){}
  LF.services.accessibility?.init?.();
  LF.events.on('status',s=>{const h=U.id('lf-auth-status');if(h){h.textContent=s.message;h.dataset.kind=s.kind;}});
  LF.events.on('auth:signed-in',redirect);
  const identity=LF.services.identity;
  try{const me=await identity.init();if(me&&identity.authenticated())return redirect();}catch(e){console.warn(e);U.status('Account service is unavailable. You can still use Skip Sign In.','info');}
  LF.get('googleAuth')?.init?.().catch(console.warn);
}
document.addEventListener('DOMContentLoaded',init);
})(window);
