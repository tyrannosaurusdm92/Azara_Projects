/* AWS unified keyboard editing adapter. No separate test note or storage: all input belongs
   to the existing book manuscript, channel notes, task, dictionary, glyph or other AWS field. */
(()=>{'use strict';
const $=id=>document.getElementById(id);let target=null, savedRange=null,clip='';
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
const graphemes=s=>segmenter?Array.from(segmenter.segment(s),v=>v.segment):Array.from(s);
const eligible=e=>e && (e.matches?.('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]),textarea,[contenteditable=true]'));
function isEditable(el){return eligible(el) && el.isConnected && !el.closest('#keyboard,#aws-keyboard-compat,#voiceSettings,#captureDialog,#guideDialog') && !el.readOnly && !el.disabled}
function current(){if(isEditable(target))return target;const first=document.querySelector('.rich-editor')||$('channel-notes');if(isEditable(first))return target=first;return null}
function rememberRange(){const el=current();if(!el?.isContentEditable)return;const sel=window.getSelection();if(sel?.rangeCount && el.contains(sel.anchorNode)&&el.contains(sel.focusNode))savedRange=sel.getRangeAt(0).cloneRange()}
document.addEventListener('focusin',e=>{if(isEditable(e.target)){target=e.target;savedRange=null;rememberRange();}},true);
document.addEventListener('selectionchange',()=>{const sel=getSelection();if(sel?.rangeCount){const a=sel.anchorNode;const ed=a?.parentElement?.closest('[contenteditable=true]');if(ed&&isEditable(ed)){target=ed;savedRange=sel.getRangeAt(0).cloneRange();}}});
function focus(){const e=current();if(!e)return; e.focus({preventScroll:true});if(e.isContentEditable&&savedRange){const s=getSelection();s.removeAllRanges();try{s.addRange(savedRange)}catch{}}}
function insert(text){const el=current();if(!el)return toast('Select a writing page or notes field first.');text=String(text);
 if(el.isContentEditable){focus();let ok=false;try{ok=document.execCommand('insertText',false,text)}catch{}
  if(!ok){const sel=getSelection(),r=sel.rangeCount?sel.getRangeAt(0):document.createRange();if(!el.contains(r.commonAncestorContainer)){r.selectNodeContents(el);r.collapse(false)}r.deleteContents();const n=document.createTextNode(text);r.insertNode(n);r.setStartAfter(n);r.collapse(true);sel.removeAllRanges();sel.addRange(r);el.dispatchEvent(new Event('input',{bubbles:true}));}rememberRange();
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
window.Notes={insert,backspace,copy,paste,toast,focus,download,graphemes,getTarget:current,getText:read,getSelectedText:selected,selectAll,getClipboard:()=>clip,setClipboard:v=>clip=String(v),refreshMirror};
window.addEventListener('aws:view',()=>{target=null;savedRange=null;setTimeout(refreshMirror,0)});
})();
