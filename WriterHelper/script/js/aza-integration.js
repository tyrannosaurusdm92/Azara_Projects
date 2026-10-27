/* WriterHelper integration: full original Aza'raan + Savanski documents, one HTML entrypoint. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const language=$('wh-language-frame'),aza=$('wh-aza-book-frame'),savanski=$('wh-kb-frame');
const overlay=$('wh-language-overlay'),panel=$('wh-keyboard-panel');
const mode=$('wh-input-mode'),era=$('wh-aza-era'),speaker=$('wh-aza-speak'),stop=$('wh-aza-stop');
const audio=$('wh-audio-on');
const voiceBase=$('wh-voice-base');
let bookReady=false,languageReady=false,lastDoc='',currentSpan=null,previous='',savedEditor=null,savedRange=null,suppress=false,audioCtx=null,cloudAudio=null;
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
   const span=document.createElement('span');span.style.fontFamily=window.WriterHelperFonts?.family(era.value)||'Az'+era.value;span.style.fontSize='1.3em';span.textContent=text;
   r.deleteContents();r.insertNode(span);r.setStartAfter(span);r.collapse(true);
   selection.removeAllRanges();selection.addRange(r);currentSpan=span;
 }else{
   currentSpan.textContent=text;currentSpan.style.fontFamily=window.WriterHelperFonts?.family(era.value)||'Az'+era.value;
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
      const voice=doc.getElementById('voiceBase');if(voice){voice.value=voiceBase.value;voice.dispatchEvent(new Event('input',{bubbles:true}))}
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
savanski.addEventListener('load',()=>{
 const player=savanski.contentWindow?.SavanskiKeyboardAudio;
 if(player)player.muted=!audio.checked;
});
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
audio.onchange=()=>{
 localStorage.setItem('wh:key-sounds',audio.checked?'on':'off');
 const player=savanski.contentWindow?.SavanskiKeyboardAudio;if(player)player.muted=!audio.checked;
};
voiceBase.value=localStorage.getItem('wh:voice-base')||'100';
voiceBase.oninput=()=>{
 localStorage.setItem('wh:voice-base',voiceBase.value);
 for(const frame of [aza,language]){
  const dial=frame.contentDocument?.getElementById('voiceBase');
  if(dial){dial.value=voiceBase.value;dial.dispatchEvent(new Event('input',{bubbles:true}))}
 }
};
mode.onchange=selectMode;
era.onchange=()=>{
 currentSpan=null;previous='';
 const box=aza.contentDocument?.getElementById('era');
 if(box){box.value=era.value;box.dispatchEvent(new Event('change',{bubbles:true}))}
 if(bookReady)aza.contentWindow.AZA_STUDIO.replace([]);
};
function speechText(){
 const selected=savedRange?.toString()?.trim()||getSelection()?.toString()?.trim();
 if(selected)return selected;
 const active=savedEditor?.isConnected?savedEditor:document.querySelector('.rich-editor');
 return active?.textContent?.trim()||'';
}
speaker.onclick=()=>{
 const content=speechText();if(!content){message('Write or select text before speaking.');return}
 if(mode.value==='aza'){
  const field=aza.contentDocument?.getElementById('speechText');
  if(field){field.value=content;field.dispatchEvent(new Event('input',{bubbles:true}));aza.contentDocument.getElementById('speakText')?.click()}
  else message('Aza’raan speech is still loading.');
  return;
 }
 if(window.speechSynthesis){speechSynthesis.cancel();const msg=new SpeechSynthesisUtterance(content);msg.lang='en-US';speechSynthesis.speak(msg)}
};
$('wh-cloud-speak').onclick=async()=>{
 const bridge=window.WriterHelperBridge,content=speechText();
 if(!content){message('Write or select text before generating an MP3.');return}
 if(!bridge?.signedIn){message('Sign in through Settings to generate a private MP3.');return}
 if(content.length>3000){message('Select up to 3,000 characters for one MP3.');return}
 const button=$('wh-cloud-speak');button.disabled=true;
 try{
  message('Generating private Aza’raan MP3…');
  const result=await bridge.request('aza.tts.generate',{text:content,voiceSlider:Number(voiceBase.value)});
  if(!result.driveFileId)throw Error('The backend returned no audio file.');
  const chunks=[];let offset=0,complete=false;
  do{
   const part=await bridge.request('aza.tts.audio.chunk',{driveFileId:result.driveFileId,offset});
   if(!part.base64||part.nextOffset<=offset)throw Error('Audio transfer stopped unexpectedly.');
   const raw=atob(part.base64);chunks.push(Uint8Array.from(raw,c=>c.charCodeAt(0)));
   offset=part.nextOffset;
   if(part.done){complete=true;break}
  }while(offset<20*1024*1024);
  if(!complete)throw Error('Audio is larger than the safe browser transfer limit.');
  if(cloudAudio){cloudAudio.pause();URL.revokeObjectURL(cloudAudio.src)}
  cloudAudio=new Audio(URL.createObjectURL(new Blob(chunks,{type:'audio/mpeg'})));
  await cloudAudio.play();message(result.warnings?.length?'Playing MP3 · review pronunciation warnings in the language studio.':'Playing private Aza’raan MP3.');
 }catch(error){message('MP3 unavailable: '+error.message)}finally{button.disabled=false}
};
stop.onclick=()=>{try{speechSynthesis.cancel()}catch{}try{aza.contentWindow?.AzaaraanTTS?.stop?.()}catch{}if(cloudAudio){cloudAudio.pause();cloudAudio.currentTime=0}};
document.addEventListener('pointerdown',event=>{
 if(!event.target.closest?.('.rich-editor'))return;
 if(currentSpan){currentSpan=null;previous='';if(bookReady)aza.contentWindow.AZA_STUDIO.replace([])}
});
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
