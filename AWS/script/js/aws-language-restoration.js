/* AWS language tool launchers: route through the existing app without replacing the project. */
(()=>{'use strict';
 function openRole(role){
  if(!window.LiteraryFriendApp?.goToRole?.(role)){
   const msg=document.querySelector('#aws-language-hub-panel .aws-language-hub-heading p');
   if(msg)msg.textContent='Could not open '+role+'. Reopen the Language section or refresh the page.';
  }
 }
 function init(){
  document.querySelectorAll('[data-aws-open-role]').forEach(button=>{button.addEventListener('click',()=>openRole(button.dataset.awsOpenRole));});
  window.addEventListener('aws:view',e=>{
   if(e.detail?.role==='glyph-evolution')window.AWSGlyphStudio?.setView?.('evolution');
   if(e.detail?.role==='glyph')window.AWSGlyphStudio?.setView?.('glyphs');
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
