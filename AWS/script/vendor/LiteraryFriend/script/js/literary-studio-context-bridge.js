(function(){
'use strict';
let lastContext=null;
function mirrorSession(token){const value=String(token||'');const keys=['literaryfriend.session.token.v2','literaryfriend.session.token','literaryfriend-book-token','lf.auth.token'];try{for(const key of keys)value?sessionStorage.setItem(key,value):sessionStorage.removeItem(key);}catch(_){}}
function sendContext(ctx){if(!ctx)return;const token=String(ctx.session?.token||'');const user=ctx.session?.user||null;mirrorSession(token);window.LiteraryFriendBackend?.setSession?.(token,user);window.LFStudioIntegration?.post?.({type:'lf-shell-session',token,user,backend:ctx.backend||{}});window.LFStudioIntegration?.post?.({type:'lf-shell-project-context',project:ctx.project||null,backendProjectId:ctx.backendProjectId||ctx.project?.backendId||'',settings:ctx.settings||{}});}
window.addEventListener('message',event=>{const message=event.data||{};if(message.type==='literaryfriend:project-context'){lastContext=message;sendContext(lastContext);}else if(message.type==='literaryfriend:accessibility-settings'){lastContext={...(lastContext||{}),settings:message.settings||{}};sendContext(lastContext);}});
window.addEventListener('message',event=>{if(event.data?.type==='lf-frame-ready'&&lastContext)sendContext(lastContext);});
document.addEventListener('DOMContentLoaded',()=>{try{parent.postMessage({type:'literaryfriend:studio-ready'},'*');}catch(_){}if(lastContext)sendContext(lastContext);});
window.LFStudioContextBridge={get:()=>lastContext,resend:()=>sendContext(lastContext)};
})();
