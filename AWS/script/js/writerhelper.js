
/* Aza’raan Writing Studio — frontend-only, preserves upstream LiteraryFriend and Savanski. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const names=[
  '01 Language',
  '02 Book One: The Door In The Tree',
  '03 Book Two: The Drowned Queen',
  '04 Book Three: The Unwilling Spy',
  '05 Book Four: The Hollow Throne',
  '06 Book Five: Never-Ending Loss',
  '07 Book Six: Threats Of Space',
  '08 Book Seven: Collision Of Worlds',
  '09 Book Eight: Unraveled'
 ];
 const eras=['Proto','Ancient','Archaic','Classical','Traditional','Modern'];
 const idFor=(i)=>i===0?'wh-language':'wh-book-'+i;
 const channel=(id,name,type='document')=>({
  id:'wh:'+id+':'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
  workspaceId:id,name,type,html:'',leftHtml:'',rightHtml:'',notes:'',
  lang:'en',font:'Georgia',size:18,updatedAt:new Date().toISOString()
 });
 async function seed(){
  const app=window.LiteraryFriendApp;
  if(!app||localStorage.getItem('wh:seeded:v1')==='yes')return;
  const state=app.getSnapshot();
  if(!state)return;
  const blank=state.workspaces.length===1&&state.workspaces[0].name==='My Library'&&
   state.tasks.length===0&&state.channels.length===3&&
   state.channels.every(c=>['Manuscript','Character Notes','Drafting Table'].includes(c.name)&&
   ![c.html,c.leftHtml,c.rightHtml,c.notes].some(x=>String(x||'').trim()));
  if(blank){state.workspaces=[];state.channels=[]}
  for(let i=0;i<names.length;i++){
   const id=idFor(i);
   if(state.workspaces.some(w=>w.id===id||w.name===names[i]))continue;
   state.workspaces.push({id,name:names[i]});
   const pages=i===0?eras:['Manuscript','Outline','Character Notes','Continuity Notes','Drafting Table'];
   for(const name of pages)state.channels.push(channel(id,name,name==='Drafting Table'?'studio':'document'));
  }
  if(blank){state.selectedWorkspaceId=idFor(0);state.selectedChannelId=channel(idFor(0),'Proto').id}
  try{await app.replaceSnapshot(state);localStorage.setItem('wh:seeded:v1','yes')}
  catch(err){console.error('WriterHelper project initialization failed',err)}
 }
 let currentEditor=null,caret=null,guard=false,attached=false,attempts=0;
 const frame=$('wh-kb-frame');
 function closestEditor(node){
  const el=node?.nodeType===1?node:node?.parentElement;
  return el?.closest?.('.rich-editor')||null;
 }
 document.addEventListener('selectionchange',()=>{
  if(guard)return;
  const selection=window.getSelection();
  if(!selection?.rangeCount)return;
  const range=selection.getRangeAt(0);
  const editor=closestEditor(range.commonAncestorContainer);
  if(editor){currentEditor=editor;caret=range.cloneRange()}
 });
 document.addEventListener('focusin',e=>{if(e.target.matches?.('.rich-editor'))currentEditor=e.target});
 function restore(){
  const target=currentEditor?.isConnected?currentEditor:document.querySelector('.rich-editor');
  if(!target)return null;
  currentEditor=target;
  guard=true;
  try{
   target.focus({preventScroll:true});
   const selection=window.getSelection();
   if(caret&&target.contains(caret.commonAncestorContainer)){
    selection.removeAllRanges();selection.addRange(caret.cloneRange());
   }else{
    const range=document.createRange();range.selectNodeContents(target);range.collapse(false);
    selection.removeAllRanges();selection.addRange(range);
   }
  }finally{guard=false}
  return target;
 }
 function notify(editor,type='insertText',data=null){
  const sel=window.getSelection();
  if(sel?.rangeCount)caret=sel.getRangeAt(0).cloneRange();
  editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:type,data}));
 }
 function insert(value){
  if(typeof value!=='string'||!value)return;
  const editor=restore();if(!editor)return;
  if(!document.execCommand('insertText',false,value)){
   const selection=window.getSelection();if(!selection?.rangeCount)return;
   const range=selection.getRangeAt(0);range.deleteContents();
   const node=document.createTextNode(value);range.insertNode(node);range.setStartAfter(node);range.collapse(true);
   selection.removeAllRanges();selection.addRange(range);
  }
  notify(editor,'insertText',value);
 }
 function action(key){
  if(key==='Tab'){insert('    ');return}
  const editor=restore();if(!editor)return;
  const sel=window.getSelection();if(!sel?.rangeCount)return;
  if(key==='Backspace'||key==='Delete'){
   if(sel.isCollapsed&&sel.modify)sel.modify('extend',key==='Backspace'?'backward':'forward','character');
   document.execCommand('delete',false,null);
   notify(editor,key==='Backspace'?'deleteContentBackward':'deleteContentForward');
  }else if(key==='Enter'){
   document.execCommand('insertParagraph',false,null);notify(editor,'insertParagraph');
  }else if(key==='Undo'||key==='Redo'){
   document.execCommand(key==='Undo'?'undo':'redo',false,null);notify(editor);
  }else if(key==='ArrowLeft'||key==='ArrowRight'){
   if(sel.modify)sel.modify('move',key==='ArrowLeft'?'backward':'forward','character');
   if(sel.rangeCount)caret=sel.getRangeAt(0).cloneRange();
  }else if(key==='SelectAll'){
   const range=document.createRange();range.selectNodeContents(editor);
   sel.removeAllRanges();sel.addRange(range);caret=range.cloneRange();
  }
 }
 function status(text){$('wh-kb-status').textContent=text}
 function onFrameLoad(){
  let w,d;
  try{w=frame.contentWindow;d=frame.contentDocument}catch{}
  if(!w||!d){status('Same-origin local server required');return}
  if(true){
   w.addEventListener('savanski:key',event=>{
    const x=event.detail;
    if(x?.kind==='text')insert(x.value);
    if(x?.kind==='action')action(x.value);
   });
   attached=true;
  }
  const style=d.createElement('style');
  style.textContent=[
   'html,body{margin:0!important;height:100%!important;min-height:0!important;overflow:hidden!important}',
   'body:not(.wh-full) > .site-header,body:not(.wh-full) > .app-main,body:not(.wh-full) > .site-footer,body > .install-overlay{display:none!important}',
   '#savanskiKeyboard{inset:0!important;left:0!important;top:0!important;width:100%!important;height:100%!important;max-height:none!important;max-width:none!important;border-radius:0!important}',
   '.sk-resize-handle{display:none!important}',
   'body.wh-full{overflow:auto!important;height:auto!important}',
   'body.wh-full #savanskiKeyboard{inset:auto 0 0 0!important;height:45vh!important}',
   'body.wh-full .app-main{padding-bottom:52vh!important}'
  ].join('\n');
  d.head.append(style);
  function launch(){
   const run=d.getElementById('runKeyboard');
   if(w.SavanskiInputState&&run){
    if(w.SavanskiInputState.paused)run.click();
    status('Connected · typing goes to the selected book page');return;
   }
   if(attempts++<44)setTimeout(launch,250);
   else status('Keyboard not ready; initialize both source submodules');
  }
  launch();
 }
 frame.addEventListener('load',onFrameLoad);
 const actions=document.querySelector('.topbar-actions');
 const add=document.createElement('button');add.type='button';add.className='btn tiny light';
 add.textContent='+ New page';add.title='Add a writing channel to this section';
 add.onclick=()=>$('new-writing')?.click();actions.insertBefore(add,actions.firstChild);
 $('wh-library').onclick=()=>{
  const body=frame.contentDocument?.body;if(!body)return;
  const full=body.classList.toggle('wh-full');
  $('wh-library').textContent=full?'Keyboard only':'Unicode library';
 };
 window.addEventListener('literaryfriend:ready',()=>{void seed()},{once:true});
 window.addEventListener('load',()=>{try{if(window.LiteraryFriendApp?.getSnapshot())void seed()}catch{}},{once:true});
})();
