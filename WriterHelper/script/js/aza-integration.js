/* WriterHelper integration: full original Aza'raan + Savanski documents, one HTML entrypoint. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const language=$('wh-language-frame'),aza=$('wh-aza-book-frame'),savanski=$('wh-kb-frame');
const overlay=$('wh-language-overlay'),panel=$('wh-keyboard-panel');
const mode=$('wh-input-mode'),era=$('wh-aza-era'),speaker=$('wh-aza-speak'),stop=$('wh-aza-stop');
const audio=$('wh-audio-on');
let bookReady=false,languageReady=false,lastDoc='',currentSpan=null,previous='',savedEditor=null,savedRange=null,suppress=false,audioCtx=null;
const originBase=new URL('./',location.href);
function srcdoc(source,path,book){
 const href=new URL(path,originBase).href;
 const base='<base href="'+href+'">';
 const css=book?'<style>html,body{height:100%!important;min-height:0!important;overflow:hidden!important;background:#141c24!important}header.mast,nav.tabs,.studio-shell>:not(.keyboard-section),#panel-evolution,.evolution-pane{display:none!important}main{padding:0!important;margin:0!important;max-width:none!important;height:100vh!important;overflow:auto!important}#panel-typing{display:block!important;padding:0!important;margin:0!important}.studio-shell{display:block!important;max-width:none!important;width:100%!important;padding:2px!important}.keyboard-section{display:block!important;max-width:none!important;width:100%!important;padding:3px!important;margin:0!important}.keyboard{margin:0!important;max-width:none!important}.palette{max-height:90vh!important}</style>':'';
 return source.replace('<head>','<head>'+base+css);
}
function message(s){const el=$('wh-kb-status');if(el)el.textContent=s}
function closest(range){const n=range?.commonAncestorContainer;const el=n?.nodeType===1?n:n?.parentElement;return el?.closest?.('.rich-editor')||null}
document.addEventListener('selectionchange',()=>{if(suppress)return;const sel=getSelection();if(!sel?.rangeCount)return;const r=sel.getRangeAt(0);const e=closest(r);if(e){savedEditor=e;savedRange=r.cloneRange()}});
document.addEventListener('focusin',e=>{if(e.target?.classList?.contains('rich-editor'))savedEditor=e.target});
function editor(){
 const e=savedEditor?.isConnected?savedEditor:document.querySelector('.rich-editor');
 if(!e)return null;savedEditor=e;
 suppress=true;try{
 e.focus({preventScroll:true});const sel=getSelection();sel.removeAllRanges();
 if(savedRange&&e.contains(savedRange.commonAncestorContainer))sel.addRange(savedRange.cloneRange());
 else{const r=document.createRange();r.selectNodeContents(e);r.collapse(false);sel.addRange(r)}
 }finally{suppress=false}return e;
}
function saveAfter(e,value){
 e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));
 const sel=getSelection();if(sel?.rangeCount)savedRange=sel.getRangeAt(0).cloneRange();
}
function updateManuscript(text){
 if(mode.value!=='aza'||panel.hidden||document.body.classList.contains('wh-language-active'))return;
 if(text===previous)return;
 const e=editor();if(!e)return;
 if(currentSpan&&!currentSpan.isConnected)currentSpan=null;
 if(!currentSpan){
   if(!text){previous='';return}
   const selection=getSelection();if(!selection?.rangeCount)return;const r=selection.getRangeAt(0);
   const span=document.createElement('span');span.style.fontFamily='Az'+era.value;span.style.fontSize='1.3em';span.textContent=text;
   r.deleteContents();r.insertNode(span);r.setStartAfter(span);r.collapse(true);
   selection.removeAllRanges();selection.addRange(r);currentSpan=span;
 }else{
   currentSpan.textContent=text;currentSpan.style.fontFamily='Az'+era.value;
   if(!text){currentSpan.remove();currentSpan=null}
 }
 previous=text;saveAfter(e,text);
}
function tone(){
 if(!audio.checked)return;
 try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
 const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
 osc.type='triangle';osc.frequency.value=430;
 gain.gain.setValueAtTime(.025,audioCtx.currentTime);
 gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.045);
 osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+.05)}catch{}
}
function readiness(frame,kind){
 frame.addEventListener('load',()=>{
  const win=frame.contentWindow,doc=frame.contentDocument;
  if(!win||!doc)return;
  if(kind==='savanski')return;
  const poll=n=>{
    if(win.AZA_STUDIO&&win.AzaaraanStudio){
      if(kind==='language'){languageReady=true;syncView();return}
      bookReady=true;
      let previousFrameText=win.AZA_STUDIO.text;
      const composition=doc.getElementById('composition');
      if(composition){
        new MutationObserver(()=>{
          const next=win.AZA_STUDIO.text;
          if(previousFrameText!==next){previousFrameText=next;updateManuscript(next)}
        }).observe(composition,{subtree:true,childList:true,characterData:true,attributes:true});
      }
      doc.addEventListener('pointerup',e=>{if(e.target?.closest?.('#keyboard,#special-keys,.keyboard-footer,.palette'))tone()});
      const select=doc.getElementById('era');
      if(select){select.value=era.value;select.dispatchEvent(new Event('change',{bubbles:true}))}
      win.AZA_STUDIO.replace([]);
      message('Aza’raan keyboard connected · 24 marks · three-mark stacks · voice ready');
      return;
    }
    if(n<65)setTimeout(()=>poll(n+1),150);
    else message('Keyboard modules could not initialize. Serve over HTTP or HTTPS.');
  };poll(0);
 });
}
readiness(language,'language');readiness(aza,'book');
const originalAza=window.WRITERHELPER_AZA_LANGUAGE_HTML,originalQ=window.WRITERHELPER_SAVANSKI_HTML;
if(originalAza){
 language.srcdoc=srcdoc(originalAza,'./',false);
 aza.srcdoc=srcdoc(originalAza,'./',true);
}else message('Aza’raan document missing');
if(originalQ)savanski.srcdoc=srcdoc(originalQ,'./vendor/keyboard/',false);
function selectMode(){
 const azaMode=mode.value==='aza';aza.hidden=!azaMode;savanski.hidden=azaMode;
 era.disabled=!azaMode;
 const library=$('wh-library');if(library)library.hidden=azaMode;
 localStorage.setItem('wh:book-keyboard',mode.value);
 currentSpan=null;previous='';
 if(azaMode&&bookReady)aza.contentWindow.AZA_STUDIO.replace([]);
 message(azaMode?'Aza’raan · source keyboard, phonemes and voice':'QWERTY · Savanski keyboard with key audio');
}
mode.value=localStorage.getItem('wh:book-keyboard')==='qwerty'?'qwerty':'aza';
audio.checked=localStorage.getItem('wh:key-sounds')!=='off';
audio.onchange=()=>localStorage.setItem('wh:key-sounds',audio.checked?'on':'off');
mode.onchange=selectMode;
era.onchange=()=>{
 currentSpan=null;previous='';
 const box=aza.contentDocument?.getElementById('era');
 if(box){box.value=era.value;box.dispatchEvent(new Event('change',{bubbles:true}))}
 if(bookReady)aza.contentWindow.AZA_STUDIO.replace([]);
};
speaker.onclick=()=>{
 if(mode.value==='aza'){aza.contentWindow?.AzaaraanTTS?.speakComposition?.();return}
 const target=window.LiteraryFriendApp?.currentDocument?.();
 const selected=getSelection()?.toString()||'';
 const content=selected||String(target?.html||'').replace(/<[^>]+>/g,' ');
 if(content.trim()&&window.speechSynthesis){speechSynthesis.cancel();const msg=new SpeechSynthesisUtterance(content);msg.lang='en-US';speechSynthesis.speak(msg)}
};
stop.onclick=()=>{try{speechSynthesis.cancel()}catch{}try{aza.contentWindow?.AzaaraanTTS?.stop?.()}catch{}};
selectMode();
function selected(){try{return window.LiteraryFriendApp?.currentDocument?.()||null}catch{return null}}
function syncView(){
 if(!window.LiteraryFriendApp)return;
 const doc=selected(),isLanguage=!!doc?.workspace?.startsWith('01 Language');
 overlay.hidden=!isLanguage;
 document.body.classList.toggle('wh-language-active',isLanguage);
 panel.style.visibility=isLanguage?'hidden':'';
 if(isLanguage){
  if(languageReady){
   const eraName=doc?.title;
   const d=language.contentDocument;
   if(eraName==='Proto'||eraName==='Ancient')d.getElementById('tab-evolution')?.click();
   else{
     d.getElementById('tab-typing')?.click();
     const select=d.getElementById('era');
     if(select&&['Archaic','Classical','Traditional','Modern'].includes(eraName)){
       select.value=eraName;select.dispatchEvent(new Event('change',{bubbles:true}))
     }
   }
  }
 }else if(doc?.id!==lastDoc){
   lastDoc=doc?.id||'';savedEditor=null;savedRange=null;currentSpan=null;previous='';
   if(bookReady)aza.contentWindow.AZA_STUDIO.replace([]);
 }
}
function watch(id){const e=$(id);if(e)new MutationObserver(syncView).observe(e,{childList:true,subtree:true,characterData:true})}
watch('crumb-workspace');watch('crumb-channel');
window.addEventListener('literaryfriend:ready',syncView,{once:true});
if(window.LiteraryFriendApp)syncView();
})();