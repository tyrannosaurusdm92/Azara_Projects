/* Aza'raan Writing Studio: master navigation, local library, cloud attachment bridge and speech UI.
   Static/GitHub Pages compatible. This file never edits or deploys the user's Apps Script backend. */
(()=>{'use strict';
const $=id=>document.getElementById(id),app=()=>window.LiteraryFriendApp,store=()=>window.LuxuryStore;
const stamp=()=>new Date().toISOString(),id=()=>crypto?.randomUUID?.()||'file-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const line=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=String(txt);return n};
const status=message=>{if($('aws-library-status'))$('aws-library-status').textContent=message};
const safeName=name=>String(name||'File').replace(/[\\/:*?"<>|]+/g,'_').slice(0,180);
function downloadBlob(name,blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=safeName(name);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),20000)}
const uid=()=>id();
function escapeHTML(str){return String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const awsFolds=(()=>{try{const saved=JSON.parse(localStorage.getItem('aws-nav-folds-v2')||'{}');return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{}}catch{return {}}})();
function nav(){
 const state=app()?.getNavigationSnapshot?.();if(!state)return;
 const host=$('aws-master-links'),scroll=host.scrollTop;host.replaceChildren();
 const query=($('aws-nav-search')?.value||'').trim().toLowerCase();
 const heading=txt=>host.append(line('h3','aws-nav-section-title',txt));
 const item=(label,action,cls='')=>{const b=line('button','aws-nav-item '+cls,label);b.type='button';b.onclick=action;host.append(b);return b};
 heading('Workspace');
 for(const w of state.workspaces)item('◧ '+w.name,()=>{app()?.switchWorkspace?.(w.id);setExpanded(false)},w.id===state.selectedWorkspaceId?'active':'');
 item('+ New workspace',()=>app()?.newWorkspace?.(),'aws-nav-action');
 heading('Sections & pages');
 const visible=state.channels.filter(c=>c.workspaceId===state.selectedWorkspaceId&&!c.deletedAt),byId=new Map(visible.map(c=>[c.id,c]));
 const ancestors=new Set();let ancestor=byId.get(state.selectedChannelId);
 while(ancestor&&!ancestors.has(ancestor.id)){ancestors.add(ancestor.id);ancestor=byId.get(ancestor.parentId)}
 const matches=new Set();
 if(query)for(const c of visible)if(c.name.toLowerCase().includes(query)){
  let p=c;const path=new Set();while(p&&!path.has(p.id)){path.add(p.id);matches.add(p.id);p=byId.get(p.parentId)}
 }
 const seen=new Set();
 function append(parentId,depth=0,show=true,parentMatch=false){
  for(const c of visible.filter(x=>(x.parentId||null)===(parentId||null))){
   if(seen.has(c.id))continue;seen.add(c.id);
   const ownMatch=!!query&&c.name.toLowerCase().includes(query);
   const display=show&&(!query||matches.has(c.id)||parentMatch);
   const glyphViews=c.role==='glyph'?Array.from(document.querySelectorAll('#aws-glyph-panel .nav-item[data-view]')).filter(b=>!['glyphs','evolution'].includes(b.dataset.view)):[];
   const children=visible.some(x=>x.parentId===c.id)||glyphViews.length;
   const folded=Object.hasOwn(awsFolds,c.id)?awsFolds[c.id]:!ancestors.has(c.id);
   if(display){
    const row=line('div','aws-nav-row');row.style.setProperty('--nav-depth',Math.min(depth,7));row.dataset.channelId=c.id;
    if(children){
     const fold=line('button','aws-nav-fold',folded&&!query?'▸':'▾');fold.type='button';
     fold.setAttribute('aria-label',(folded?'Expand ':'Collapse ')+c.name);fold.setAttribute('aria-expanded',String(!folded||!!query));
     fold.onclick=()=>{awsFolds[c.id]=!folded;try{localStorage.setItem('aws-nav-folds-v2',JSON.stringify(awsFolds))}catch{}nav()};row.append(fold);
    }else row.append(line('span','aws-nav-spacer',''));
    const b=line('button','aws-nav-item'+(c.id===state.selectedChannelId?' active':''),c.name);b.type='button';
    if(c.id===state.selectedChannelId)b.setAttribute('aria-current','page');
    b.onclick=()=>{app().openPage(c.id);setExpanded(false)};
    const menu=line('button','aws-nav-manage','⋯');menu.type='button';menu.setAttribute('aria-label','Manage '+c.name);menu.onclick=()=>app()?.managePage?.(c.id);
    row.append(b,menu);host.append(row);
    if(glyphViews.length&&(!folded||query))for(const source of glyphViews){
     const label=source.querySelector('span:nth-child(2)')?.textContent||source.textContent;
     const button=item(label.trim(),()=>{app().openPage(c.id);window.AWSGlyphStudio?.setView?.(source.dataset.view);setExpanded(false)},'aws-nav-glyph');
     button.style.paddingLeft=(42+(depth+1)*12)+'px';
    }
   }
   append(c.id,depth+1,display&&(!folded||!!query),parentMatch||ownMatch);
  }
 }
 append(null);
 // Display only genuine orphans, not descendants deliberately hidden by a fold.
 for(const c of visible.filter(c=>!seen.has(c.id)&&(!c.parentId||!byId.has(c.parentId)))){
  if(seen.has(c.id))continue;seen.add(c.id);
  if(!query||c.name.toLowerCase().includes(query))item(c.name,()=>{app().openPage(c.id);setExpanded(false)});
  append(c.id,1);
 }
 for(const c of visible.filter(c=>!seen.has(c.id))){
  if(seen.has(c.id))continue;
  seen.add(c.id);if(!query||c.name.toLowerCase().includes(query))item(c.name,()=>{app().openPage(c.id);setExpanded(false)});append(c.id,1);
 }
 if(query&&!host.querySelector('.aws-nav-row'))host.append(line('p','aws-hint','No matching pages.'));
 host.scrollTop=scroll;
}
// Capture installability as soon as this deferred script runs. Waiting for
// the workspace-ready event can miss beforeinstallprompt on faster devices.
let expanded=false,installEvent=null;
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 installEvent=event;
 const hint=$('aws-install-hint');
 if(hint)hint.textContent='Ready to install. Choose Download App to open your browser’s native installation prompt.';
});
window.addEventListener('appinstalled',()=>{
 installEvent=null;
 const hint=$('aws-install-hint');
 if(hint)hint.textContent='App installed. Open it from your device’s home screen or app launcher.';
});
function clampNav(){
 const box=$('aws-master-nav'),r=box.getBoundingClientRect();
 box.style.left=Math.max(4,Math.min(innerWidth-r.width-4,r.left))+'px';
 box.style.top=Math.max(4,Math.min(innerHeight-r.height-4,r.top))+'px';
}
function setExpanded(next){
 expanded=!!next;$('aws-master-nav').classList.toggle('expanded',expanded);$('aws-master-content').hidden=!expanded;
 $('aws-menu-toggle').setAttribute('aria-expanded',String(expanded));
 $('aws-menu-toggle').setAttribute('aria-label',expanded?'Collapse master navigation':'Expand master navigation');
 clampNav();
}
function initNav(){nav();setExpanded(false);
 $('aws-menu-toggle').onclick=()=>setExpanded(!expanded);
 $('aws-nav-search').addEventListener('input',nav);
 window.addEventListener('resize',clampNav);
 $('aws-new-section').onclick=()=>app()?.newPage?.();
 $('aws-new-studio').onclick=()=>app()?.newStudio?.();
 $('aws-master-library').onclick=()=>{app()?.goToRole?.('library')};
 $('aws-master-tasks').onclick=()=>{app()?.showTasks?.();setExpanded(false)};
 $('aws-master-settings').onclick=()=>{$('settings-dialog')?.showModal()};
 window.addEventListener('aws:navigation',nav);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded&&!event.defaultPrevented)setExpanded(false)});
 const handle=$('aws-master-handle'),navBox=$('aws-master-nav');let drag=null;
 handle.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:navBox.offsetLeft,top:navBox.offsetTop};handle.setPointerCapture(e.pointerId)});
 handle.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(0,Math.min(innerWidth-navBox.offsetWidth,drag.left+e.clientX-drag.x));const y=Math.max(0,Math.min(innerHeight-48,drag.top+e.clientY-drag.y));navBox.style.left=x+'px';navBox.style.top=y+'px';navBox.style.right='auto';});
 const stop=()=>{if(!drag)return;drag=null;try{localStorage.setItem('aws-master-position',JSON.stringify({left:navBox.style.left,top:navBox.style.top}))}catch{}};
 handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
 try{const pos=JSON.parse(localStorage.getItem('aws-master-position'));if(pos){navBox.style.left=pos.left;navBox.style.top=pos.top;navBox.style.right='auto'}}catch{}
 clampNav();
 const installDialog=$('aws-install-dialog');
 const closeInstall=()=>{if(installDialog?.open)installDialog.close()};
 $('aws-install-close').onclick=closeInstall;
 $('aws-install-done').onclick=closeInstall;
 function showInstallHelp(message){
   const ua=navigator.userAgent||'';
   const ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   const android=/Android/i.test(ua);
   const isStandalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
   const steps=ios?
     ['Open AWS in Safari or your preferred supported browser.','Tap Share (the square with an upward arrow).','Choose Add to Home Screen, then tap Add.']:
     android?
     ['Open the browser menu (usually ⋮).','Choose Install app or Add to Home screen.','Confirm Add/Install to place the Aza’ra Universe emblem on your home screen.']:
     ['Open this AWS page in Chrome, Edge or another browser that supports installing sites.','Open the browser menu (⋮ or …), or look for an Install icon in the address bar.','Choose Install Aza’raan Writing Studio, Install app, or Apps → Install this site as an app.'];
   $('aws-install-message').textContent=isStandalone?
     'AWS is already running as an installed app. Open it from your device to continue writing.':
     message||'Your browser has not offered a one-click install prompt. Follow these browser steps to install AWS using the Aza’ra Universe icon.';
   const list=$('aws-install-steps');list.replaceChildren(...steps.map(text=>{
     const li=document.createElement('li');li.textContent=text;return li;
   }));
   if(!installDialog.open)installDialog.showModal();
 }
 $('aws-install').onclick=async()=>{
   if(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true){
     showInstallHelp();return;
   }
   if(installEvent){
     const event=installEvent;installEvent=null;
     try{
       const response=await event.prompt();
       const choice=response?.outcome?response:await event.userChoice;
       if(choice?.outcome==='accepted'){
         $('aws-install-hint').textContent='Installation accepted. Look for AWS in your device’s app list.';
       }else{
         $('aws-install-hint').textContent='Installation dismissed. You can try Download App again or follow the browser instructions.';
         showInstallHelp('The install prompt was dismissed. You can also install the site using your browser menu.');
       }
     }catch(error){
       console.warn('Native app install unavailable:',error);
       showInstallHelp('Your browser could not open its native installation prompt. Follow the steps below instead.');
     }
     return;
   }
   showInstallHelp();
 };
}
function allEntries(){const st=app()?.getSnapshot?.();if(!st)return [];
 const pages=st.channels.filter(c=>c.workspaceId===st.selectedWorkspaceId).map(c=>({id:c.id,kind:'page',title:c.name,category:c.role==='section'?'section':c.role==='page'?'page':c.role,updatedAt:c.updatedAt||'',deletedAt:c.deletedAt||'',value:c}));
 const notes=st.channels.filter(c=>c.workspaceId===st.selectedWorkspaceId&&c.notes?.trim()).map(c=>({id:'note:'+c.id,kind:'note',title:c.name+' · Notes',category:'note',updatedAt:c.updatedAt||'',deletedAt:c.deletedAt||'',value:c}));
 const files=(st.files||[]).map(f=>({id:f.id,kind:'upload',title:f.name,category:f.category||'attachment',updatedAt:f.updatedAt||'',deletedAt:f.deletedAt||'',value:f}));
 return [...pages,...notes,...files];
}
function renderLibrary(){const host=$('aws-library-list');if(!host||!app())return;const search=$('aws-library-search').value.trim().toLowerCase(),trash=$('aws-library-trash').checked,sort=$('aws-library-sort').value;
 let entries=allEntries().filter(e=>trash?!!e.deletedAt:!e.deletedAt).filter(e=>(e.title+' '+e.category).toLowerCase().includes(search));
 entries.sort((a,b)=>sort==='name'?a.title.localeCompare(b.title):sort==='type'?a.category.localeCompare(b.category)||a.title.localeCompare(b.title):b.updatedAt.localeCompare(a.updatedAt));
 host.replaceChildren();for(const entry of entries){const row=line('article','aws-library-item');
  const info=line('div','aws-library-item-info');const name=line('strong','',entry.title);const meta=line('span','',entry.category.toUpperCase()+' · '+(entry.value.size?formatSize(entry.value.size)+' · ':'')+(entry.updatedAt?new Date(entry.updatedAt).toLocaleDateString():'Draft'));
  info.append(name,meta);const actions=line('div','aws-library-item-actions');
  function action(label,handler){const b=line('button','',label);b.type='button';b.onclick=async()=>{try{await handler()}catch(e){status(e.message)}};actions.append(b)}
  if(entry.kind==='page'||entry.kind==='note'){
   if(trash){action('Restore',()=>app().restorePage(entry.value.id));if(entry.kind==='page')action('Purge',()=>{if(confirm('Permanently delete this page and child pages?'))app().purgePage(entry.id)})}
   else{action('Open',()=>{app().openPage(entry.value.id);if(entry.kind==='note')setTimeout(()=>$('channel-notes')?.focus(),50)});
    if(entry.kind==='page'){action('Copy',()=>app().duplicatePage(entry.id));action('Trash',()=>app().deletePage(entry.id))}}
  }else{
   if(trash){action('Restore',()=>app().changeFile(entry.id,{deletedAt:''}));action('Purge',async()=>{if(!confirm('Permanently delete '+entry.title+' from local storage?'))return;await store().deleteUpload(entry.id);app().removeFile(entry.id)})}
   else {action('Download',()=>openFile(entry.value));action('Copy',()=>duplicateFile(entry.value));action('Catalog',()=>catalogFile(entry.value));action('Trash',()=>app().changeFile(entry.id,{deletedAt:stamp()}));
    if(!entry.value.cloudId&&entry.value.size<=20*1024*1024)action('Sync to AWS',()=>syncFile(entry.value));
    if(entry.value.cloudId)actions.append(line('span','aws-synced','Cloud ✓'))}
  }
  row.append(info,actions);host.append(row);
 }
 if(!entries.length)host.append(line('p','aws-hint',trash?'Trash is empty.':'No matching library files.'));
 app()?.renderImportant?.();
}
function formatSize(bytes){return bytes<1024?bytes+' B':bytes<1024*1024?(bytes/1024).toFixed(1)+' KB':(bytes/1048576).toFixed(1)+' MB'}
async function encodeBlob(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s)}
function blobFromBase64(text,mime){const bin=atob(text),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime||'application/octet-stream'})}
async function importFiles(files){if(!files?.length)return;let count=0;for(const file of Array.from(files)){
 try{
  if(file.size>20*1024*1024){status('Skipped '+file.name+': max attachment 20 MB for AWS cloud upload.');continue}
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(['txt','md','markdown','html','htm'].includes(ext)){
   const raw=await file.text();if(raw.length>800000)throw new Error('Text document exceeds 800,000 characters. Divide into pages first.');
   const html=['html','htm'].includes(ext)?new DOMParser().parseFromString(raw,'text/html').body.innerHTML:escapeHTML(raw).replace(/\r?\n/g,'<br>');
   const lib=app()?.getSnapshot()?.channels.find(c=>c.role==='library');app().createPageFromText(file.name.replace(/\.[^.]+$/,''),html,lib?.id);count++;continue;
  }
  const rec={id:uid(),name:safeName(file.name),mime:file.type||'application/octet-stream',size:file.size,category:ext==='json'?'data':/^image\//.test(file.type)?'art':/^audio\//.test(file.type)?'audio':'attachment',folderId:'',updatedAt:stamp(),deletedAt:'',inlineData:file.size<=350000?await encodeBlob(file):''};
  await store().saveUpload(rec.id,file);app().addFile(rec);count++;
 }catch(err){status('Could not import '+file.name+': '+err.message)}}
 status('Imported '+count+' file(s). Changes save locally. Connect to AWS and use Sync local → cloud to synchronize.');renderLibrary();
}
async function downloadFromAWS(rec){const rpc=window.LiteraryFriendCloud;if(!rpc?.connected)throw Error('Connect your AWS account in Settings to retrieve this cloud attachment.');
 const info=await rpc.request('attachments.download.info',{id:rec.cloudId});const chunks=[];for(let offset=0;offset<info.size;offset+=info.chunkSize){const c=await rpc.request('attachments.download.chunk',{id:rec.cloudId,offset,size:info.chunkSize});chunks.push(blobFromBase64(c.base64,rec.mime))}
 const blob=new Blob(chunks,{type:rec.mime});await store().saveUpload(rec.id,blob);return blob;
}
async function getBlob(rec){return await store().getUpload(rec.id)||(rec.inlineData?blobFromBase64(rec.inlineData,rec.mime):rec.cloudId?await downloadFromAWS(rec):null)}
async function openFile(rec){status('Opening '+rec.name+'…');const blob=await getBlob(rec);if(!blob)throw Error('Attachment was not on this device. Sign in to the account that synced it, or import it again.');downloadBlob(rec.name,blob);status('Downloaded '+rec.name)}
async function duplicateFile(rec){const cp={...rec,id:uid(),name:rec.name.replace(/(\.[^.]+)?$/,' Copy$1'),updatedAt:stamp(),deletedAt:''},blob=await getBlob(rec);
 if(blob)await store().saveUpload(cp.id,blob);app().addFile(cp);status('File duplicated.')}
function catalogFile(rec){const category=prompt('Catalog category (art, audio, research, manuscript, language, data, reference, other):',rec.category||'other');if(category===null)return;app().changeFile(rec.id,{category:String(category).trim().slice(0,60)||'other'});}
let projectId=null;
async function ensureAWSProject(){const rpc=window.LiteraryFriendCloud;if(!rpc?.connected)throw Error('Connect to AWS in Settings first.');if(projectId)return projectId;
 const r=await rpc.request('projects.list',{});const matching=(r.projects||[]).find(p=>p.title==="Aza'raan Writing Studio"||p.name==="Aza'raan Writing Studio");
 if(matching){projectId=matching.id;return projectId}
 const created=await rpc.request('projects.create',{title:"Aza'raan Writing Studio",name:"Aza'raan Writing Studio",type:'book-series',makeActive:false});projectId=created.project?.id;
 if(!projectId)throw Error('AWS could not create a project for the file uploads.');return projectId;
}
async function syncFile(rec,set=status){if(rec.cloudId||rec.deletedAt)return;const rpc=window.LiteraryFriendCloud;if(!rpc?.connected)throw Error('Sign in to AWS under Settings first.');
 const blob=await getBlob(rec);if(!blob)throw Error('Original file is missing on this device.');if(blob.size>20*1024*1024)throw Error('AWS permits attachments up to 20 MB.');
 const project=await ensureAWSProject(),start=await rpc.request('uploads.begin',{projectId:project,name:rec.name,mimeType:rec.mime,size:blob.size});
 try{for(let idx=0;idx<start.totalChunks;idx++){const chunk=blob.slice(idx*start.chunkSize,(idx+1)*start.chunkSize),base64=await encodeBlob(chunk);
   await rpc.request('uploads.chunk',{uploadId:start.uploadId,index:idx,base64});set('Uploading '+rec.name+' '+(idx+1)+'/'+start.totalChunks);}
  const done=await rpc.request('uploads.complete',{uploadId:start.uploadId,category:rec.category});const cloudId=done.attachment?.id;if(!cloudId)throw Error('AWS completed upload but gave no attachment ID');
  app().changeFile(rec.id,{cloudId});set('Uploaded '+rec.name+' to AWS');}
 catch(e){try{await rpc.request('uploads.cancel',{uploadId:start.uploadId})}catch{}throw e}
}
async function syncUploads(set=status){const files=app()?.getFiles?.()||[];for(const f of files){if(!f.deletedAt&&!f.cloudId)await syncFile(f,set)}}
function initLibrary(){const drop=$('aws-library-drop');$('aws-library-add-file').onclick=()=>$('aws-library-file-input').click();$('aws-library-new-page').onclick=()=>app()?.newPage?.(app()?.getSnapshot?.()?.channels?.find(c=>c.role==='library')?.id);
 $('aws-library-file-input').onchange=async e=>{await importFiles(e.target.files);e.target.value=''};
 drop.addEventListener('click',()=>$('aws-library-file-input').click());drop.addEventListener('keydown',e=>{if(e.key==='Enter')$('aws-library-file-input').click()});
 ['dragover','dragenter'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add('dragover')}));
 ['dragleave','drop'].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove('dragover')}));
 drop.addEventListener('drop',e=>importFiles(e.dataTransfer.files));
 ['aws-library-search','aws-library-sort','aws-library-trash'].forEach(i=>$(i).addEventListener('input',renderLibrary));
 window.addEventListener('aws:library-changed',renderLibrary);window.addEventListener('aws:view',renderLibrary);
 renderLibrary();
}
async function ttsRequest(action,data){const rpc=window.LiteraryFriendCloud;if(!rpc?.connected)throw Error('Connect to your AWS account through Settings to use pronunciation tools.');return rpc.request(action,data)}
let speechPlan=null,speechUrl=null;
function ttsData(){return{text:$('aws-tts-text').value.trim(),era:$('aws-tts-era').value,ipa:$('aws-tts-ipa').value.trim(),voiceSlider:Number($('aws-tts-voice').value),speakingRate:Number($('aws-tts-rate').value)}}
function ttsResult(plan){$('aws-tts-result').textContent='IPA: '+(plan.ipa||'(none)')+'\nPronunciation: '+(plan.readableApproximation||'')+'\nMode: '+(plan.phonemeMode||'')+'\n'+(plan.warnings||[]).join('\n')+(plan.requiresCloudApiKey?'\nCloud TTS key is not configured in the existing backend.':'' )}
function initTTS(){const out=$('aws-tts-result');$('aws-tts-plan').onclick=async()=>{out.textContent='Analyzing…';try{speechPlan=await ttsRequest('aza.tts.plan',ttsData());ttsResult(speechPlan)}catch(e){out.textContent='Analysis unavailable: '+e.message}};
 $('aws-tts-generate').onclick=async()=>{out.textContent='Generating speech through AWS…';try{const result=await ttsRequest('aza.tts.generate',ttsData()),chunks=[];
  for(let off=0;off<result.sizeBytes;){const c=await ttsRequest('aza.tts.audio.chunk',{driveFileId:result.driveFileId,offset:off});chunks.push(blobFromBase64(c.base64,'audio/mpeg'));off=c.nextOffset;out.textContent='Fetching generated audio: '+Math.floor(off/result.sizeBytes*100)+'%';if(c.done)break}
  if(speechUrl)URL.revokeObjectURL(speechUrl);speechUrl=URL.createObjectURL(new Blob(chunks,{type:'audio/mpeg'}));$('aws-tts-audio').src=speechUrl;$('aws-tts-audio').hidden=false;await $('aws-tts-audio').play().catch(()=>{});out.textContent='Speech ready. IPA estimate: '+result.ipaApprox+'\n'+(result.warnings||[]).join('\n');
 }catch(e){out.textContent='Speech unavailable: '+e.message}};
 $('aws-tts-save').onclick=()=>{const data=ttsData();if(!data.text)return out.textContent='Enter text first.';const lang=app()?.getSnapshot?.()?.channels?.find(c=>c.name==='Language');const html='<h2>Pronunciation</h2><p>'+escapeHTML(data.text)+'</p><p>Era: '+escapeHTML(data.era)+'</p><p>IPA: '+escapeHTML(speechPlan?.ipa||data.ipa||'')+'</p>';app()?.createPageFromText?.('Pronunciation · '+data.text.slice(0,30),html,lang?.id);out.textContent='Pronunciation notes saved as a new editable library page.'};
}

function initDictionary(){
 const search=$('aws-dictionary-search'),era=$('aws-dictionary-era'),list=$('aws-dictionary-list'),dialog=$('aws-dictionary-dialog'),form=$('aws-dictionary-form');
 const fields=['id','word','ipa','meaning','era','partOfSpeech','notes'];
 const render=()=>{
  list.replaceChildren();const entries=[...(app()?.getDictionary?.()||[]),...(window.AWSHistoricalLexicon?.entries||[])],q=search.value.trim().toLowerCase(),filter=era.value;
  for(const word of entries.filter(x=>(!filter||x.era===filter)&&(!q||[x.word,x.meaning,x.ipa,x.notes,x.era,x.partOfSpeech].some(s=>String(s||'').toLowerCase().includes(q)))).sort((a,b)=>a.word.localeCompare(b.word))){
   const item=line('article','aws-library-item'),info=line('div','aws-dictionary-entry'),head=line('strong','',word.word),meta=line('span','',`${word.era} · ${word.partOfSpeech||'unclassified'} · ${word.ipa||'no IPA'}`);
   info.append(head,meta,line('p','',word.meaning||'No definition yet.'));
   const actions=line('div','aws-library-item-actions'),edit=line('button','','Edit'),remove=line('button','','Delete');
   if(word.builtin){
    edit.textContent='Copy to my dictionary';edit.onclick=()=>open({...word,id:'',notes:(word.notes||'')+' Copied from historical reconstruction.'});
    const tag=line('small','aws-dictionary-origin',word.status==='proposed'?'Proposed historical reconstruction':'Source example');
    info.append(tag);actions.append(edit);
   }else{
    edit.onclick=()=>open(word);remove.onclick=()=>{if(confirm('Delete this dictionary entry?'))app().deleteDictionaryEntry(word.id)};
    actions.append(edit,remove);
   }
   if(word.lineageId){
    const family=window.AWSHistoricalLexicon?.lineages?.find(x=>x.id===word.lineageId);
    if(family){const detail=line('details','aws-dictionary-lineage'),sum=line('summary','','Full six-era word lineage');
     detail.append(sum);for(const e of ['proto','ancient','archaic','classical','traditional','modern'])detail.append(line('div','',e+': '+family.forms[e]));
     info.append(detail);
    }
   }
   item.append(info,actions);list.append(item);
  }
  if(!list.children.length)list.append(line('p','aws-hint','No dictionary entries match. Choose + Add word to create one.'));
 };
 function open(word){form.reset();for(const key of fields)form.elements.namedItem(key).value=word?.[key]|| (key==='era'?'modern':'');$('aws-dictionary-dialog-title').textContent=word?'Edit dictionary word':'Add dictionary word';dialog.showModal()}
 $('aws-dictionary-add').onclick=()=>open(null);$('aws-dictionary-cancel').onclick=()=>dialog.close();
 form.addEventListener('submit',e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));if(!values.word.trim())return;
  if(values.id)app().updateDictionaryEntry(values.id,values);else app().addDictionaryEntry(values);dialog.close();render();});
 search.addEventListener('input',render);era.addEventListener('change',render);
 window.addEventListener('aws:dictionary-changed',render);window.addEventListener('aws:view',render);
 $('aws-dictionary-export').onclick=()=>{const rows=[['Word','IPA','Meaning','Era','Part of speech','Notes'],...[...(app()?.getDictionary?.()||[]),...(window.AWSHistoricalLexicon?.entries||[])].map(x=>[x.word,x.ipa,x.meaning,x.era,x.partOfSpeech,x.notes])];const csv=rows.map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\r\n');downloadBlob('azaaraan-dictionary.csv',new Blob(['\ufeff'+csv],{type:'text/csv'}))};
 render();
}

window.AWSStudio={syncUploads,importFiles,renderLibrary,downloadFromAWS};
// Presentation preferences affect only the shell; no drafts, glyphs or resize positions change.
function initPresentation(){
 const focusButton=$('aws-focus-toggle'),densityButton=$('aws-density-toggle');
 const saved=key=>{try{return localStorage.getItem(key)==='true'}catch{return false}};
 const remember=(key,value)=>{try{localStorage.setItem(key,String(value))}catch{}};
 let focused=saved('aws-focus-mode-v1'),roomy=saved('aws-roomy-layout-v1');
 const paint=()=>{
   document.body.classList.toggle('aws-focus-mode',focused);
   document.body.classList.toggle('aws-roomy-layout',roomy);
   focusButton.setAttribute('aria-pressed',String(focused));
   focusButton.textContent=focused?'↩ Exit Focus':'⛶ Focus';
   focusButton.title=focused?'Restore the planner and workspace tools':'Expand the workspace without changing your panel sizes';
   densityButton.setAttribute('aria-pressed',String(roomy));
   densityButton.textContent=roomy?'Roomier layout: On':'Roomier layout: Off';
 };
 focusButton.addEventListener('click',()=>{
   focused=!focused;remember('aws-focus-mode-v1',focused);paint();
 });
 densityButton.addEventListener('click',()=>{
   roomy=!roomy;remember('aws-roomy-layout-v1',roomy);paint();
 });
 document.addEventListener('keydown',event=>{
   if(event.key!=='Escape'||!focused||event.defaultPrevented||expanded)return;
   if(document.querySelector('dialog[open]')||($('keyboard')&&!$('keyboard').hidden))return;
   focused=false;remember('aws-focus-mode-v1',false);paint();
 });
 paint();
}
let started=false;
function startStudio(){if(started||!app()?.ready)return;started=true;initNav();initPresentation();initLibrary();initDictionary();initTTS();}
window.addEventListener('literaryfriend:ready',startStudio,{once:true});
startStudio();
})();
