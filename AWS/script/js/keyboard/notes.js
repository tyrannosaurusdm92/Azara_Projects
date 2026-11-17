/* AWS unified keyboard editing adapter. No separate test note or storage: all input belongs
   to the existing book manuscript, channel notes, task, dictionary, glyph or other AWS field. */
(()=>{'use strict';
const $=id=>document.getElementById(id);let target=null, savedRange=null,clip='';
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
const graphemes=s=>segmenter?Array.from(segmenter.segment(s),v=>v.segment):Array.from(s);
let writingMode={language:'qwerty',era:'Modern'};
const ERA_NAMES=['Archaic','Classical','Traditional','Modern'];
const isAzaEncoded=value=>/[\u1780-\u17FF]/.test(String(value));
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function applyWritingMode(el){
 if(!isEditable(el))return;
 const era=writingMode.language==='azaaraan'?writingMode.era:(el.dataset.azaContentEra||null);
 el.classList.toggle('aza-writing',!!era);
 for(const name of ERA_NAMES)el.classList.toggle('era-'+name.toLowerCase(),name===era);
 el.dataset.azaInputMode=writingMode.language;
}
function setWritingMode(language,era){
 writingMode={language:language==='azaaraan'?'azaaraan':'qwerty',era:ERA_NAMES.includes(era)?era:'Modern'};
 for(const node of document.querySelectorAll('.aza-writing,[data-aza-input-mode]'))if(isEditable(node))applyWritingMode(node);
 const el=current();if(el)applyWritingMode(el);
}
const eligible=e=>e && (e.matches?.('input:is(:not([type]),[type=text]):not([autocomplete=username]):not([role=searchbox]),textarea,[contenteditable=true]'));
const notWriting=el=>el.closest?.('[role=search],#bridge-box,#voiceSettings,#settings-dialog,#keyboard,#aws-keyboard-compat,#captureDialog,#guideDialog')||false;
function isEditable(el){return eligible(el) && el.isConnected && !notWriting(el) && !el.readOnly && !el.disabled}
function current(){if(isEditable(target))return target;const first=document.querySelector('.rich-editor')||$('channel-notes');if(isEditable(first))return target=first;return null}
function rememberRange(){const el=current();if(!el?.isContentEditable)return;const sel=window.getSelection();if(sel?.rangeCount && el.contains(sel.anchorNode)&&el.contains(sel.focusNode))savedRange=sel.getRangeAt(0).cloneRange()}
document.addEventListener('focusin',e=>{if(isEditable(e.target)){target=e.target;savedRange=null;applyWritingMode(e.target);rememberRange();}},true);
document.addEventListener('selectionchange',()=>{const sel=getSelection();if(sel?.rangeCount){const a=sel.anchorNode;const ed=a?.parentElement?.closest('[contenteditable=true]');if(ed&&isEditable(ed)){target=ed;savedRange=sel.getRangeAt(0).cloneRange();}}});
function focus(){const e=current();if(!e)return; e.focus({preventScroll:true});if(e.isContentEditable&&savedRange){const s=getSelection();s.removeAllRanges();try{s.addRange(savedRange)}catch{}}}
function makeAzaRun(text,token){
 const run=document.createElement('span');run.className='aza-script-run era-'+writingMode.era.toLowerCase();run.dataset.azaEra=writingMode.era;run.contentEditable='false';run.lang='und';
 if(writingMode.era==='Modern'&&token&&window.AZ_MK?.createCluster){
  try{
   const hidden=document.createElement('span');hidden.className='aza-logical-data';hidden.textContent=text;
   const visual=window.AZ_MK.createCluster(token);visual.classList.add('aza-inline-composed');visual.setAttribute('aria-hidden','true');
   run.classList.add('aza-native-composite');run.append(hidden,visual);return run;
  }catch(err){console.warn('Using canonical Aza’raan font instead of artwork compositor',err);}
 }
 run.textContent=text;return run;
}
function insert(text,token=null){const el=current();if(!el)return toast('Select a writing page or notes field first.');text=String(text);
 if(writingMode.language==='azaaraan'&&isAzaEncoded(text)){
  el.dataset.azaContent='yes';el.dataset.azaContentEra=writingMode.era;applyWritingMode(el);
 }
 if(el.isContentEditable){focus();let ok=false;
  const az=(writingMode.language==='azaaraan'&&isAzaEncoded(text));
  if(az){try{ok=document.execCommand('insertHTML',false,makeAzaRun(text,token).outerHTML)}catch{}
  }else try{ok=document.execCommand('insertText',false,text)}catch{}
  if(!ok){const sel=getSelection(),r=sel.rangeCount?sel.getRangeAt(0):document.createRange();if(!el.contains(r.commonAncestorContainer)){r.selectNodeContents(el);r.collapse(false)}r.deleteContents();let n;
    if(az)n=makeAzaRun(text,token);
    else n=document.createTextNode(text);
    r.insertNode(n);r.setStartAfter(n);r.collapse(true);sel.removeAllRanges();sel.addRange(r);el.dispatchEvent(new Event('input',{bubbles:true}));}rememberRange();
 }else{const start=el.selectionStart??el.value.length,end=el.selectionEnd??start;if(el.id==='document-title')text=text.replace(/[\r\n]/g,' ');el.setRangeText(text,start,end,'end');el.dispatchEvent(new Event('input',{bubbles:true}));focus();}
 refreshMirror();}
function backspace(){const el=current();if(!el)return;
 if(el.isContentEditable){focus();const sel=getSelection();if(!sel.rangeCount)return;let r=sel.getRangeAt(0);if(!r.collapsed){r.deleteContents();el.dispatchEvent(new Event('input',{bubbles:true}));}else{
  try{if(!document.execCommand('delete')){if(r.startContainer.nodeType===Node.TEXT_NODE&&r.startOffset>0){const v=r.startContainer.textContent,head=graphemes(v.slice(0,r.startOffset));const n=head.at(-1)?.length||1;r.setStart(r.startContainer,r.startOffset-n);r.deleteContents();el.dispatchEvent(new Event('input',{bubbles:true}));}}}catch{}
 }rememberRange();}
 else {const start=el.selectionStart||0,end=el.selectionEnd||0;if(start!==end)el.setRangeText('',start,end,'end');else if(start){const n=graphemes(el.value.slice(0,start)).at(-1)?.length||1;el.setRangeText('',start-n,start,'end')}el.dispatchEvent(new Event('input',{bubbles:true}))}refreshMirror();}
function read(){const el=current();return el?.isContentEditable?el.innerText||el.textContent||'':el?.value||''}
function selected(){const el=current();if(!el)return '';if(el.isContentEditable){const s=getSelection();return s?.toString()||''}return el.value.slice(el.selectionStart||0,el.selectionEnd||0)}
function refreshMirror(){const e=$('note');if(e)e.value=read();}
function toast(msg){const n=$('toast');if(!n)return;const text=$('toastMessage');if(text)text.textContent=msg;n.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.hidden=true,3000)}
async function copy(all=false){clip=all?read():selected()||read();if(!clip)return toast('No text to copy.');try{await navigator.clipboard.writeText(clip)}catch{}toast('Copied.');}
async function paste(){try{clip=await navigator.clipboard.readText()||clip}catch{}if(!clip){toast('Clipboard is empty');return false}insert(clip);return true}
function download(name,blob){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)}
function selectAll(){const el=current();if(!el)return;focus();if(el.isContentEditable){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);savedRange=r.cloneRange()}else el.select()}
window.Notes={insert,backspace,copy,paste,toast,focus,download,graphemes,getTarget:current,getText:read,getSelectedText:selected,selectAll,getClipboard:()=>clip,setClipboard:v=>clip=String(v),refreshMirror,isEditable,setWritingMode,getWritingMode:()=>({...writingMode})};
window.addEventListener('aws:view',()=>{target=null;savedRange=null;setTimeout(refreshMirror,0)});
})();
