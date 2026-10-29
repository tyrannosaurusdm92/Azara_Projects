/* AWS language tool launchers: route through the existing app without replacing the project. */
(()=>{'use strict';
 function openRole(role){
  if(!window.LiteraryFriendApp?.goToRole?.(role)){
   const msg=document.querySelector('#aws-language-hub-panel .aws-language-hub-heading p');
   if(msg)msg.textContent='Could not open '+role+'. Reopen the Language section or refresh the page.';
  }
 }
 function initFoldableGlyphRails(){
  const host=document.querySelector('#aws-glyph-panel .app-body');if(!host)return;
  for(const [selector,cls,title,key] of [
   ['.left-rail','aws-glyph-left-collapsed','Project tools','left'],
   ['.editor-panel','aws-glyph-right-collapsed','Glyph details','right']
  ]){
   const rail=host.querySelector(selector);if(!rail||rail.querySelector('.aws-glyph-panel-toggle'))continue;
   const toggle=document.createElement('button');toggle.type='button';toggle.className='aws-glyph-panel-toggle';
   toggle.title='Expand or retract '+title;toggle.setAttribute('aria-label',title+' expandable panel');
   const storageKey='aws-glyph-rail-'+key;
   const setCollapsed=flag=>{
    rail.classList.toggle('is-collapsed',flag);host.classList.toggle(cls,flag);
    toggle.setAttribute('aria-expanded',String(!flag));toggle.textContent=(flag?'▸ ':'▾ ')+title;
    try{localStorage.setItem(storageKey,String(flag))}catch{}
   };
   rail.prepend(toggle);toggle.addEventListener('click',()=>setCollapsed(!rail.classList.contains('is-collapsed')));
   let wasCollapsed=false;try{wasCollapsed=localStorage.getItem(storageKey)==='true'}catch{}
   setCollapsed(wasCollapsed);
  }
 }
 function init(){
  initFoldableGlyphRails();
  document.querySelectorAll('[data-aws-open-role]').forEach(button=>{button.addEventListener('click',()=>openRole(button.dataset.awsOpenRole));});
  window.addEventListener('aws:view',e=>{
   if(e.detail?.role==='glyph-evolution')window.AWSGlyphStudio?.setView?.('evolution');
   if(e.detail?.role==='glyph')window.AWSGlyphStudio?.setView?.('glyphs');
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
