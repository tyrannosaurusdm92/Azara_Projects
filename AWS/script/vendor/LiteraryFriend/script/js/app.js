/* Literary Friend: Luxury Editor shell with local writing channels and optional secure cloud bridge. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = window.LuxuryStore;
  const langs = window.LUXURY_LANGUAGES;
  const uid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanName = (s,fallback='Untitled') => String(s||'').trim().slice(0,100)||fallback;
  const cleanTags = value => [...new Set((Array.isArray(value)?value:String(value||'').split(',')).map(x=>String(x||'').trim().replace(/^#+/,'').slice(0,40)).filter(Boolean))].slice(0,20);
  const safeFilename = s => String(s||'document').replace(/[^\p{L}\p{N}._ -]+/gu,'-').slice(0,90).trim()||'document';
  const nowDate = () => new Date().toISOString();
  const defaultChannel = (workspaceId,name='Manuscript',type='document') => ({id:uid(),workspaceId,name,type,html:'',leftHtml:'',rightHtml:'',notes:'',lang:'en',font:'Georgia',size:18,tags:[],updatedAt:nowDate()});
  function initialState(){const w={id:uid(),name:'My Library'};const a=defaultChannel(w.id,'Manuscript');const b=defaultChannel(w.id,'Character Notes');const c=defaultChannel(w.id,'Drafting Table','studio');return {version:1,workspaces:[{...w,tags:[]}],channels:[a,b,c],tasks:[],trash:[],selectedWorkspaceId:w.id,selectedChannelId:a.id,inspectorOpen:window.innerWidth>1080}}
  let state,activeEditor=null,lastRange=null,lastBookmark=null,savingTimer=null,saveQueue=Promise.resolve(),fonts=[],dialogCallback=null,notificationChecking=false;
  const currentWorkspace=()=>state.workspaces.find(x=>x.id===state.selectedWorkspaceId);
  const currentChannel=()=>state.channels.find(x=>x.id===state.selectedChannelId);
  function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;$('toast-region').append(el);setTimeout(()=>el.remove(),4500)}
  function status(text){$('autosave-status').textContent=text;$('footer-save').textContent=text}
  async function persist(){
    if(!state)return;
    clearTimeout(savingTimer);savingTimer=null;
    const snapshot=JSON.parse(JSON.stringify(state));
    saveQueue=saveQueue.catch(()=>{}).then(()=>store.writeState(snapshot));
    try{await saveQueue;status('Saved locally');window.dispatchEvent(new CustomEvent('literaryfriend:saved',{detail:{snapshot}}))}catch(error){status('Save failed');toast('Could not save: '+error.message)}
  }
  function scheduleSave(){status('Saving…');clearTimeout(savingTimer);savingTimer=setTimeout(()=>{persist()},500)}
  function captureEditor(){const ch=currentChannel();if(!ch)return;document.querySelectorAll('.rich-editor').forEach(el=>{const value=cleanHTML(el.innerHTML);if(el.dataset.part==='single')ch.html=value;else if(el.dataset.part==='left')ch.leftHtml=value;else if(el.dataset.part==='right')ch.rightHtml=value;});ch.notes=$('channel-notes').value;ch.updatedAt=nowDate()}
  const allowedElements=new Set('p div br h1 h2 h3 h4 blockquote strong b em i u s strike span a ul ol li hr pre code sup sub'.split(' '));
  const removeEntirely=new Set('script style iframe object embed svg math form input textarea select video audio link meta base button template'.split(' '));
  const allowedStyleProps=new Set(['font-family','font-size','font-weight','font-style','color','background-color','text-align','text-decoration','text-decoration-line','line-height','margin-left','margin-right','direction']);
  function cleanHTML(value){
    const dom=new DOMParser().parseFromString('<body>'+String(value||'')+'</body>','text/html');
    function sanitize(node){
      for(const child of Array.from(node.childNodes)){
        if(child.nodeType===8){child.remove();continue}
        if(child.nodeType!==1)continue;
        const tag=child.localName;
        if(removeEntirely.has(tag)){child.remove();continue}
        sanitize(child);
        if(!allowedElements.has(tag)){child.replaceWith(...Array.from(child.childNodes));continue}
        for(const attr of Array.from(child.attributes)){
          if(attr.name==='href' && tag==='a'){
            if(!/^(https?:\/\/|mailto:|#)/i.test(attr.value.trim()))child.removeAttribute('href');
          } else if(attr.name==='style'){
            const rules=attr.value.split(';').map(v=>v.trim()).filter(Boolean);
            const safe=rules.filter(rule=>{
              const m=/^([\w-]+)\s*:\s*(.+)$/.exec(rule);
              return !!m&&allowedStyleProps.has(m[1].toLowerCase())&&!/[<>]|url\s*\(|expression\s*\(|@import|\\/i.test(m[2]);
            });
            if(safe.length)child.setAttribute('style',safe.join(';'));else child.removeAttribute('style');
          }else if(!(attr.name==='dir' && ['ltr','rtl','auto'].includes(attr.value)))child.removeAttribute(attr.name);
        }
      }
    }
    sanitize(dom.body);return dom.body.innerHTML;
  }
  function normalizeWorkspace(record){
    if(!record||typeof record.id!=='string')return null;
    return {id:record.id.slice(0,150),name:cleanName(record.name,'Workspace'),tags:cleanTags(record.tags),updatedAt:String(record.updatedAt||nowDate()).slice(0,40)};
  }
  function normalizeChannel(record,workspaceId=record?.workspaceId){
    if(!record||typeof record.id!=='string')return null;
    return {id:record.id.slice(0,150),workspaceId:String(workspaceId||'').slice(0,150),name:cleanName(record.name),type:record.type==='studio'?'studio':'document',html:cleanHTML(record.html),leftHtml:cleanHTML(record.leftHtml),rightHtml:cleanHTML(record.rightHtml),notes:String(record.notes||'').slice(0,20000),lang:langs[record.lang]?record.lang:'en',font:String(record.font||'Georgia').slice(0,150),size:Math.max(12,Math.min(28,Number(record.size)||18)),tags:cleanTags(record.tags),updatedAt:String(record.updatedAt||nowDate()).slice(0,40)};
  }
  function normalizeTask(record,workspaceIds=null,channelIds=null){
    if(!record||typeof record.id!=='string'||workspaceIds&&!workspaceIds.has(record.workspaceId))return null;
    const channelId=typeof record.channelId==='string'?record.channelId:null;
    return {id:record.id.slice(0,150),workspaceId:String(record.workspaceId||'').slice(0,150),channelId:channelIds?(channelIds.has(channelId)?channelId:null):channelId,title:cleanName(record.title),details:String(record.details||'').slice(0,2000),due:String(record.due||'').slice(0,40),remindAt:String(record.remindAt||'').slice(0,40),done:!!record.done,notified:!!record.notified};
  }
  function normalizeTrashEntry(item){
    if(!item||!['channel','workspace'].includes(item.kind))return null;
    const base={id:String(item.id||uid()).slice(0,150),kind:item.kind,deletedAt:String(item.deletedAt||nowDate()).slice(0,40)};
    if(item.kind==='channel'){
      const channel=normalizeChannel(item.channel);if(!channel)return null;
      base.channel=channel;base.tasks=(Array.isArray(item.tasks)?item.tasks:[]).slice(0,10000).map(task=>normalizeTask(task)).filter(Boolean);
      return base;
    }
    const workspace=normalizeWorkspace(item.workspace);if(!workspace)return null;
    base.workspace=workspace;base.channels=(Array.isArray(item.channels)?item.channels:[]).slice(0,3000).map(channel=>normalizeChannel(channel,workspace.id)).filter(Boolean);
    base.tasks=(Array.isArray(item.tasks)?item.tasks:[]).slice(0,10000).map(task=>normalizeTask(task)).filter(Boolean);
    return base;
  }
  function validateState(input){
    if(!input||!Array.isArray(input.workspaces)||!Array.isArray(input.channels)||!Array.isArray(input.tasks))throw Error('Not a Literary Friend backup.');
    const workspaces=input.workspaces.slice(0,150).map(normalizeWorkspace).filter(Boolean);
    if(!workspaces.length)throw Error('No valid workspaces in backup.');
    const workspaceIds=new Set(workspaces.map(workspace=>workspace.id));
    const channels=input.channels.slice(0,3000).map(record=>normalizeChannel(record)).filter(channel=>channel&&workspaceIds.has(channel.workspaceId));
    for(const workspace of workspaces)if(!channels.some(channel=>channel.workspaceId===workspace.id))channels.push(defaultChannel(workspace.id));
    const channelIds=new Set(channels.map(channel=>channel.id));
    const tasks=input.tasks.slice(0,10000).map(task=>normalizeTask(task,workspaceIds,channelIds)).filter(Boolean);
    const trash=(Array.isArray(input.trash)?input.trash:[]).slice(0,1000).map(normalizeTrashEntry).filter(Boolean);
    const selectedWorkspaceId=workspaceIds.has(input.selectedWorkspaceId)?input.selectedWorkspaceId:workspaces[0].id;
    const selectedChannelId=channelIds.has(input.selectedChannelId)&&channels.find(channel=>channel.id===input.selectedChannelId)?.workspaceId===selectedWorkspaceId?input.selectedChannelId:channels.find(channel=>channel.workspaceId===selectedWorkspaceId).id;
    return {version:1,workspaces,channels,tasks,trash,selectedWorkspaceId,selectedChannelId,inspectorOpen:input.inspectorOpen!==false};
  }
  function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
  function renderRail(){const holder=$('workspace-list');holder.replaceChildren();state.workspaces.forEach(w=>{
    const b=make('button','workspace-pill'+(w.id===state.selectedWorkspaceId?' active':''),w.name.slice(0,2).toUpperCase());b.title=w.name;b.setAttribute('aria-label','Open '+w.name);b.setAttribute('aria-current',w.id===state.selectedWorkspaceId?'true':'false');b.addEventListener('click',()=>selectWorkspace(w.id));holder.append(b);
  })}
  function renderChannels(){
    const ws=currentWorkspace();if(!ws)return;
    $('workspace-title').textContent=ws.name;
    $('writing-channels').replaceChildren();$('studio-channels').replaceChildren();
    for(const ch of state.channels.filter(x=>x.workspaceId===ws.id)){
      const row=make('div','channel-row');row.style.display='flex';row.style.alignItems='center';
      const b=make('button','channel-button'+(ch.id===state.selectedChannelId?' active':''));b.setAttribute('aria-current',ch.id===state.selectedChannelId?'page':'false');
      b.append(make('span','channel-icon',ch.type==='studio'?'◫':'#'),make('span','channel-name',ch.name));
      b.addEventListener('click',()=>selectChannel(ch.id));b.addEventListener('contextmenu',e=>{e.preventDefault();openChannelActions(ch)});
      const more=make('button','icon-button subtle channel-more','⋯');more.setAttribute('aria-label','Manage '+ch.name);more.title='Manage channel';more.addEventListener('click',()=>openChannelActions(ch));
      row.append(b,more);(ch.type==='studio'?$('studio-channels'):$('writing-channels')).append(row);
    }
    // Channel actions sit adjacent to the selected item without changing its hit area.
  }
  function renderDoc(){
    const ch=currentChannel();if(!ch)return;
    const ws=currentWorkspace();$('crumb-workspace').textContent=ws.name;$('crumb-channel').textContent=ch.name;
    $('document-title').value=ch.name;$('channel-type').textContent=ch.type==='studio'?'TWO-PANE WRITING STUDIO':'DOCUMENT CHANNEL';
    $('document-subtitle').textContent=ch.type==='studio'?'Draft alongside notes, references or another version.':'A quiet place for the next chapter.';
    $('type-mark').textContent=ch.type==='studio'?'◫':'✒';
    $('language-select').value=ch.lang;$('current-language').textContent=langs[ch.lang].name;
    $('font-select').value=ch.font;if($('font-select').value!==ch.font){ch.font='Georgia';$('font-select').value='Georgia'}
    $('font-size').value=String(ch.size);
    const surface=$('writing-surface');surface.replaceChildren();surface.classList.toggle('studio-surface',ch.type==='studio');
    if(ch.type==='studio'){
      surface.append(createStudioPane(ch,'left','Draft',ch.leftHtml),createStudioPane(ch,'right','Reference / alternate draft',ch.rightHtml));
    }else{
      const paper=make('div','paper');paper.append(make('div','paper-topline'),make('div','paper-meta','AZA’RAAN WRITING STUDIO  /  '+ws.name.toUpperCase()));paper.append(createRichEditor(ch,'single',ch.html));surface.append(paper);
    }
    $('channel-notes').value=ch.notes||'';
    activeEditor=document.querySelector('.rich-editor');lastRange=null;lastBookmark=null;
    updateWordCount();
  }
  function createRichEditor(ch,part,html){
    const ed=make('div','rich-editor');ed.dataset.part=part;ed.contentEditable='true';ed.spellcheck=true;
    ed.setAttribute('role','textbox');ed.setAttribute('aria-multiline','true');ed.setAttribute('aria-label',part==='single'?'Document body':part==='left'?'Primary draft':'Reference or alternate draft');
    ed.setAttribute('data-placeholder',part==='right'?'Write reference notes or an alternate draft…':'Begin writing here…');
    ed.setAttribute('lang',ch.lang);ed.dir=langs[ch.lang].dir;ed.style.fontFamily=ch.font;ed.style.fontSize=ch.size+'px';
    ed.innerHTML=cleanHTML(html);
    ed.addEventListener('focus',()=>{activeEditor=ed;saveSelection()});
    ed.addEventListener('mouseup',saveSelection);ed.addEventListener('keyup',saveSelection);
    ed.addEventListener('input',()=>{captureEditor();updateWordCount();scheduleSave()});
    ed.addEventListener('paste',e=>{
      e.preventDefault();const text=e.clipboardData?.getData('text/plain')||'';
      document.execCommand('insertText',false,text);
    });
    return ed;
  }
  function createStudioPane(ch,part,heading,html){
    const panel=make('article','studio-pane');const header=make('header');header.append(make('strong','',heading),make('span','eyebrow',part==='left'?'01 · WRITING':'02 · WRITING'));
    panel.append(header,createRichEditor(ch,part,html));return panel;
  }
  function updateWordCount(){
    const content=Array.from(document.querySelectorAll('.rich-editor')).map(e=>e.textContent||'').join('\n');
    const words=content.trim()?content.trim().split(/\s+/u).length:0;
    const charCount=Array.from(document.querySelectorAll('.rich-editor')).reduce((n,el)=>n+Array.from(el.textContent||'').length,0);
    $('word-count').textContent=words.toLocaleString()+' words';$('character-count').textContent=charCount.toLocaleString()+' characters';
  }
  function renderAll(){renderRail();renderChannels();fontOptions();renderDoc();renderTasks();renderInspector();renderFonts();window.dispatchEvent(new Event('literaryfriend:navigated'))}
  function renderInspector(){
    $('inspector').classList.toggle('hidden',!state.inspectorOpen);
    $('toggle-inspector').setAttribute('aria-expanded',String(state.inspectorOpen));
    $('date-label').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
  }
  function selectWorkspace(id){if(!state.workspaces.some(w=>w.id===id))return;captureEditor();state.selectedWorkspaceId=id;let ch=state.channels.find(x=>x.workspaceId===id);if(!ch){ch=defaultChannel(id);state.channels.push(ch)}state.selectedChannelId=ch.id;renderAll();scheduleSave();$('app').classList.remove('show-channels')}
  function selectChannel(id){const ch=state.channels.find(x=>x.id===id);if(!ch)return;captureEditor();state.selectedWorkspaceId=ch.workspaceId;state.selectedChannelId=id;renderAll();scheduleSave();$('app').classList.remove('show-channels')}
  function inputField({name,label,type='text',value='',placeholder='',required=true,options=[]}){
    const wrapper=make('label');wrapper.append(make('span','',label));let ctl;
    if(type==='select'){ctl=make('select');for(const opt of options)ctl.add(new Option(opt.label,opt.value))}
    else if(type==='textarea'){ctl=make('textarea');ctl.rows=3}
    else{ctl=make('input');ctl.type=type}
    ctl.name=name;ctl.id='dialog-field-'+name;ctl.required=required;ctl.placeholder=placeholder;
    if(type==='select')ctl.value=options.some(o=>o.value===value)?value:(options[0]?.value??'');else ctl.value=value;
    if(type==='text')ctl.maxLength=100;
    wrapper.append(ctl);return wrapper;
  }
  function openDialog(title,fields,submitText,onSubmit){dialogCallback=onSubmit;$('dialog-title').textContent=title;$('dialog-submit').textContent=submitText;$('dialog-fields').replaceChildren(...fields.map(inputField));$('main-dialog').showModal();setTimeout(()=>$('dialog-fields').querySelector('input,select,textarea')?.focus(),0)}
  function workspaceCreate(){openDialog('New workspace',[{name:'name',label:'Workspace name',placeholder:'Novel, research project, journal…'}],'Create workspace',values=>{
    const w={id:uid(),name:cleanName(values.name,'New Workspace'),tags:[],updatedAt:nowDate()};state.workspaces.push(w);const ch=defaultChannel(w.id);state.channels.push(ch);selectWorkspace(w.id);toast('Workspace created')
  })}
  function workspaceRename(){openDialog('Rename workspace',[{name:'name',label:'Workspace name',value:currentWorkspace().name}],'Save name',values=>{currentWorkspace().name=cleanName(values.name);currentWorkspace().updatedAt=nowDate();renderAll();scheduleSave()})}
  function channelCreate(type='document',workspaceId=state.selectedWorkspaceId){
    openDialog(type==='studio'?'New writing studio':'New writing channel',[{name:'name',label:type==='studio'?'Studio name':'Channel name',placeholder:type==='studio'?'Parallel drafts':'Chapter 01'}],'Create channel',values=>{
      const ch=defaultChannel(workspaceId,cleanName(values.name),type);state.channels.push(ch);selectChannel(ch.id);toast('Channel created')
    })
  }
  function stashTrash(entry){state.trash=Array.isArray(state.trash)?state.trash:[];state.trash.unshift(entry);state.trash=state.trash.slice(0,1000)}
  function duplicateChannel(ch){
    captureEditor();const copy=JSON.parse(JSON.stringify(ch));copy.id=uid();copy.name=cleanName(ch.name+' Copy');copy.updatedAt=nowDate();
    state.channels.push(copy);selectChannel(copy.id);toast('Page duplicated');renderOrganizer();
  }
  function duplicateWorkspace(workspace){
    captureEditor();const copy={...JSON.parse(JSON.stringify(workspace)),id:uid(),name:cleanName(workspace.name+' Copy'),updatedAt:nowDate()};
    const originals=state.channels.filter(channel=>channel.workspaceId===workspace.id),idMap=new Map();
    const channels=originals.map(channel=>{const next={...JSON.parse(JSON.stringify(channel)),id:uid(),workspaceId:copy.id,updatedAt:nowDate()};idMap.set(channel.id,next.id);return next});
    const tasks=state.tasks.filter(task=>task.workspaceId===workspace.id).map(task=>({...JSON.parse(JSON.stringify(task)),id:uid(),workspaceId:copy.id,channelId:idMap.get(task.channelId)||null,done:false,remindAt:'',notified:false}));
    state.workspaces.push(copy);state.channels.push(...(channels.length?channels:[defaultChannel(copy.id)]));state.tasks.push(...tasks);
    selectWorkspace(copy.id);toast('Workspace duplicated');renderOrganizer();
  }
  function softDeleteChannel(ch){
    captureEditor();const tasks=state.tasks.filter(task=>task.channelId===ch.id);
    stashTrash({id:uid(),kind:'channel',deletedAt:nowDate(),channel:JSON.parse(JSON.stringify(ch)),tasks:JSON.parse(JSON.stringify(tasks))});
    state.channels=state.channels.filter(channel=>channel.id!==ch.id);state.tasks=state.tasks.filter(task=>task.channelId!==ch.id);
    let remaining=state.channels.filter(channel=>channel.workspaceId===ch.workspaceId);
    if(!remaining.length){const fallback=defaultChannel(ch.workspaceId);state.channels.push(fallback);remaining=[fallback]}
    if(state.selectedChannelId===ch.id){state.selectedWorkspaceId=ch.workspaceId;state.selectedChannelId=remaining[0].id}
    renderAll();scheduleSave();renderOrganizer();toast('Page moved to Trash · it can be restored from the Library organizer');
  }
  function softDeleteWorkspace(workspace){
    captureEditor();const channels=state.channels.filter(channel=>channel.workspaceId===workspace.id),tasks=state.tasks.filter(task=>task.workspaceId===workspace.id);
    stashTrash({id:uid(),kind:'workspace',deletedAt:nowDate(),workspace:JSON.parse(JSON.stringify(workspace)),channels:JSON.parse(JSON.stringify(channels)),tasks:JSON.parse(JSON.stringify(tasks))});
    state.workspaces=state.workspaces.filter(item=>item.id!==workspace.id);state.channels=state.channels.filter(channel=>channel.workspaceId!==workspace.id);state.tasks=state.tasks.filter(task=>task.workspaceId!==workspace.id);
    if(!state.workspaces.length){const fallback={id:uid(),name:'My Library',tags:[],updatedAt:nowDate()};state.workspaces.push(fallback);state.channels.push(defaultChannel(fallback.id))}
    if(state.selectedWorkspaceId===workspace.id){
      const fallback=state.workspaces[0];state.selectedWorkspaceId=fallback.id;
      let fallbackChannel=state.channels.find(channel=>channel.workspaceId===fallback.id);
      if(!fallbackChannel){fallbackChannel=defaultChannel(fallback.id);state.channels.push(fallbackChannel)}
      state.selectedChannelId=fallbackChannel.id;
    }
    renderAll();scheduleSave();renderOrganizer();toast('Workspace moved to Trash · it can be restored from the Library organizer');
  }
  function moveChannelToWorkspace(channelId,workspaceId){
    const channel=state.channels.find(item=>item.id===channelId),target=state.workspaces.find(item=>item.id===workspaceId);
    if(!channel||!target||channel.workspaceId===workspaceId)return false;
    captureEditor();const sourceId=channel.workspaceId;channel.workspaceId=workspaceId;channel.updatedAt=nowDate();
    if(!state.channels.some(item=>item.workspaceId===sourceId))state.channels.push(defaultChannel(sourceId));
    if(state.selectedChannelId===channel.id)state.selectedWorkspaceId=workspaceId;
    renderAll();scheduleSave();renderOrganizer();toast('Page moved to '+target.name);return true;
  }
  function moveChannelDialog(channel){
    const choices=state.workspaces.filter(workspace=>workspace.id!==channel.workspaceId);
    if(!choices.length){toast('Create another workspace before moving this page.');return}
    openDialog('Move page to workspace',[{name:'workspaceId',label:'Destination workspace',type:'select',value:choices[0].id,options:choices.map(workspace=>({value:workspace.id,label:workspace.name}))}],'Move page',values=>moveChannelToWorkspace(channel.id,values.workspaceId));
  }
  function editCatalogLabels(record,label){
    openDialog('Edit '+label+' labels',[{name:'labels',label:'Comma-separated catalog labels',value:(record.tags||[]).join(', '),required:false}],'Save labels',values=>{
      record.tags=cleanTags(values.labels);record.updatedAt=nowDate();renderAll();scheduleSave();renderOrganizer();
    });
  }
  function openChannelActions(ch){
    openDialog('Manage page',[{name:'action',label:'Page actions',type:'select',options:[{value:'rename',label:'Rename page'},{value:'duplicate',label:'Duplicate page'},{value:'move',label:'Move to workspace'},{value:'labels',label:'Edit catalog labels'},{value:'delete',label:'Move to Trash'}]}],'Continue',v=>{
      if(v.action==='rename')openDialog('Rename page',[{name:'name',label:'Page name',value:ch.name}],'Rename',x=>{ch.name=cleanName(x.name);ch.updatedAt=nowDate();renderAll();scheduleSave();renderOrganizer()});
      else if(v.action==='duplicate')duplicateChannel(ch);
      else if(v.action==='move')moveChannelDialog(ch);
      else if(v.action==='labels')editCatalogLabels(ch,'page');
      else if(v.action==='delete'&&confirm('Move "'+ch.name+'" and its attached tasks to Trash? You can restore it from the Library organizer.'))softDeleteChannel(ch);
    })
  }
  let organizerView='library',organizerSort='recent',organizerQuery='';
  function ensureOrganizer(){
    let overlay=$('library-organizer-overlay');if(overlay)return overlay;
    overlay=make('div','library-organizer-overlay');overlay.id='library-organizer-overlay';overlay.hidden=true;
    const panel=make('section','library-organizer');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','library-organizer-title');
    const header=make('header','library-organizer-header'),heading=make('div','library-organizer-heading');
    heading.append(make('span','eyebrow','YOUR WRITING LIBRARY'),make('h2','','Library organizer'),make('p','','Catalog every language era, book, page and studio. Move pages between workspaces, add labels, and restore deleted work from Trash.'));
    const close=make('button','library-organizer-close','×');close.type='button';close.setAttribute('aria-label','Close Library organizer');close.onclick=closeOrganizer;header.append(heading,close);
    const toolbar=make('div','library-organizer-toolbar'),search=make('input','library-organizer-search'),view=make('select','library-organizer-view'),sort=make('select','library-organizer-sort');
    search.type='search';search.placeholder='Search workspaces, pages, and labels';search.setAttribute('aria-label','Search Library organizer');
    view.add(new Option('My library','library'));view.add(new Option('Trash','trash'));view.setAttribute('aria-label','Library view');
    sort.add(new Option('Recently changed','recent'));sort.add(new Option('Name A–Z','az'));sort.add(new Option('Name Z–A','za'));sort.setAttribute('aria-label','Sort library items');
    const newWorkspace=make('button','library-organizer-primary','+ Workspace');newWorkspace.type='button';newWorkspace.onclick=()=>{closeOrganizer();workspaceCreate()};
    const newPage=make('button','library-organizer-secondary','+ Page');newPage.type='button';newPage.onclick=()=>{closeOrganizer();channelCreate('document')};
    toolbar.append(search,sort,view,newWorkspace,newPage);
    const summary=make('p','library-organizer-summary');summary.id='library-organizer-summary';summary.setAttribute('role','status');
    const content=make('div','library-organizer-content');content.id='library-organizer-content';
    panel.append(header,toolbar,summary,content);overlay.append(panel);document.body.append(overlay);
    search.value=organizerQuery;search.addEventListener('input',()=>{organizerQuery=search.value.trim().toLowerCase();renderOrganizer()});
    view.value=organizerView;view.addEventListener('change',()=>{organizerView=view.value;renderOrganizer()});
    sort.value=organizerSort;sort.addEventListener('change',()=>{organizerSort=sort.value;renderOrganizer()});
    content.addEventListener('dragover',event=>{const target=event.target.closest('[data-drop-workspace]');if(target){event.preventDefault();target.classList.add('is-drop-target')}});
    content.addEventListener('dragleave',event=>{const target=event.target.closest('[data-drop-workspace]');if(target&&!target.contains(event.relatedTarget))target.classList.remove('is-drop-target')});
    content.addEventListener('drop',event=>{
      const target=event.target.closest('[data-drop-workspace]');if(!target)return;
      event.preventDefault();target.classList.remove('is-drop-target');
      const id=event.dataTransfer?.getData('application/x-aws-page')||event.dataTransfer?.getData('text/plain');
      if(id)moveChannelToWorkspace(id,target.dataset.dropWorkspace);
    });
    overlay.addEventListener('click',event=>{if(event.target===overlay)closeOrganizer()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)closeOrganizer()});
    return overlay;
  }
  function closeOrganizer(){const overlay=$('library-organizer-overlay');if(overlay)overlay.hidden=true;document.body.classList.remove('library-organizer-open')}
  function organizerAction(label,handler,kind=''){
    const button=make('button','library-organizer-action'+(kind?' '+kind:''),label);button.type='button';button.addEventListener('click',handler);return button;
  }
  function compareCatalogItems(a,b){
    if(organizerSort==='az')return a.name.localeCompare(b.name,undefined,{sensitivity:'base'});
    if(organizerSort==='za')return b.name.localeCompare(a.name,undefined,{sensitivity:'base'});
    return (Date.parse(b.updatedAt||b.deletedAt||'')||0)-(Date.parse(a.updatedAt||a.deletedAt||'')||0);
  }
  function organizerLabels(record){
    const tags=cleanTags(record.tags),host=make('div','library-organizer-labels');
    if(!tags.length){host.append(make('span','library-organizer-no-labels','No labels'));return host}
    for(const tag of tags)host.append(make('span','library-organizer-label',tag));
    return host;
  }
  function organizerTimestamp(value){
    const time=Date.parse(value||'');return Number.isFinite(time)?new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(time):'Not edited yet';
  }
  function organizerPageRow(channel,workspace){
    const row=make('article','library-organizer-page');row.draggable=true;row.dataset.organizerChannel=channel.id;
    row.addEventListener('dragstart',event=>{event.dataTransfer?.setData('application/x-aws-page',channel.id);event.dataTransfer.effectAllowed='move';row.classList.add('is-dragging')});
    row.addEventListener('dragend',()=>row.classList.remove('is-dragging'));
    const details=make('div','library-organizer-page-details'),title=make('strong','',channel.name),meta=make('span','library-organizer-meta',(channel.type==='studio'?'Writing studio':'Writing page')+' · Edited '+organizerTimestamp(channel.updatedAt));
    details.append(title,meta,organizerLabels(channel));
    const actions=make('div','library-organizer-page-actions');
    actions.append(organizerAction('Open',()=>{closeOrganizer();selectChannel(channel.id)}));
    actions.append(organizerAction('Rename',()=>openDialog('Rename page',[{name:'name',label:'Page name',value:channel.name}],'Rename',values=>{channel.name=cleanName(values.name);channel.updatedAt=nowDate();renderAll();scheduleSave();renderOrganizer()})));
    actions.append(organizerAction('Move',()=>moveChannelDialog(channel)));
    actions.append(organizerAction('Labels',()=>editCatalogLabels(channel,'page')));
    actions.append(organizerAction('Duplicate',()=>duplicateChannel(channel)));
    actions.append(organizerAction('Trash',()=>{if(confirm('Move “'+channel.name+'” and its attached tasks to Trash?'))softDeleteChannel(channel)},'danger'));
    row.append(details,actions);return row;
  }
  function renderOrganizer(){
    const overlay=ensureOrganizer(),content=$('library-organizer-content'),summary=$('library-organizer-summary');
    const search=$('library-organizer-overlay').querySelector('.library-organizer-search'),view=$('library-organizer-view'),sort=$('library-organizer-sort');
    if(search&&search.value!==organizerQuery)search.value=organizerQuery;
    if(view)view.value=organizerView;if(sort)sort.value=organizerSort;
    content.replaceChildren();
    if(organizerView==='trash'){
      const records=state.trash.filter(item=>{
        const names=item.kind==='workspace'?[item.workspace.name,...item.channels.map(channel=>channel.name)]:[item.channel.name];
        const labels=item.kind==='workspace'?[...cleanTags(item.workspace.tags),...item.channels.flatMap(channel=>cleanTags(channel.tags))]:cleanTags(item.channel.tags);
        return !organizerQuery||([...names,...labels].join(' ').toLowerCase().includes(organizerQuery));
      }).sort(compareCatalogItems);
      summary.textContent=records.length+' item'+(records.length===1?'':'s')+' in Trash. Restoring a workspace brings its pages and saved tasks back.';
      if(!records.length){content.append(make('p','library-organizer-empty','Trash is empty. Deleted workspaces, pages and their tasks will appear here.'));return}
      for(const entry of records){
        const name=entry.kind==='workspace'?entry.workspace.name:entry.channel.name;
        const row=make('article','library-organizer-page library-organizer-trash-row'),details=make('div','library-organizer-page-details');
        details.append(make('strong','',name),make('span','library-organizer-meta',(entry.kind==='workspace'?'Workspace':'Page')+' · Deleted '+organizerTimestamp(entry.deletedAt)));
        const actions=make('div','library-organizer-page-actions');
        actions.append(organizerAction('Restore',()=>restoreTrashItem(entry.id),'primary'));
        actions.append(organizerAction('Delete permanently',()=>permanentlyDeleteTrashItem(entry.id),'danger'));
        row.append(details,actions);content.append(row);
      }
      return;
    }
    const query=organizerQuery,allChannels=state.channels;
    let workspaces=state.workspaces.slice().sort((a,b)=>{
      if(organizerSort==='az'||organizerSort==='za')return compareCatalogItems(a,b);
      const latest=ws=>Math.max(0,...allChannels.filter(c=>c.workspaceId===ws.id).map(c=>Date.parse(c.updatedAt||'')||0));
      return latest(b)-latest(a);
    });
    let visiblePages=0;
    for(const workspace of workspaces){
      const workspaceMatches=!query||(workspace.name+' '+cleanTags(workspace.tags).join(' ')).toLowerCase().includes(query);
      let channels=allChannels.filter(channel=>channel.workspaceId===workspace.id&&(!query||workspaceMatches||(channel.name+' '+cleanTags(channel.tags).join(' ')).toLowerCase().includes(query))).sort(compareCatalogItems);
      if(query&&!workspaceMatches&&!channels.length)continue;
      const folder=make('section','library-organizer-folder');folder.dataset.dropWorkspace=workspace.id;
      const heading=make('header','library-organizer-folder-header'),title=make('div','library-organizer-folder-title');
      title.append(make('span','library-organizer-folder-icon','▰'),make('div','',workspace.name),make('span','library-organizer-folder-count',channels.length+' pages'));
      title.children[1].title='Drop a page here to move it into this workspace';
      heading.append(title,organizerLabels(workspace));
      const actions=make('div','library-organizer-page-actions');
      actions.append(organizerAction('+ Page',()=>{closeOrganizer();channelCreate('document',workspace.id)}));
      actions.append(organizerAction('Open',()=>{closeOrganizer();selectWorkspace(workspace.id)}));
      actions.append(organizerAction('Rename',()=>openDialog('Rename workspace',[{name:'name',label:'Workspace name',value:workspace.name}],'Save name',values=>{workspace.name=cleanName(values.name);workspace.updatedAt=nowDate();renderAll();scheduleSave();renderOrganizer()})));
      actions.append(organizerAction('Labels',()=>editCatalogLabels(workspace,'workspace')));
      actions.append(organizerAction('Duplicate',()=>duplicateWorkspace(workspace)));
      actions.append(organizerAction('Trash',()=>{if(confirm('Move workspace “'+workspace.name+'”, its pages and tasks to Trash?'))softDeleteWorkspace(workspace)},'danger'));
      heading.append(actions);folder.append(heading);
      const nested=make('div','library-organizer-pages');
      for(const channel of channels){nested.append(organizerPageRow(channel,workspace));visiblePages++}
      if(!channels.length)nested.append(make('p','library-organizer-empty','No pages match this search.'));
      folder.append(nested);content.append(folder);
    }
    summary.textContent=state.workspaces.length+' workspaces · '+visiblePages+' matching pages · '+state.trash.length+' items in Trash';
    if(!content.children.length)content.append(make('p','library-organizer-empty','No workspaces or pages match this search.'));
  }
  function openOrganizer(){
    const overlay=ensureOrganizer();overlay.hidden=false;document.body.classList.add('library-organizer-open');renderOrganizer();
    setTimeout(()=>overlay.querySelector('.library-organizer-search')?.focus({preventScroll:true}),0);
  }
  function restoreTrashItem(id){
    const index=state.trash.findIndex(item=>item.id===id);if(index<0)return;
    const item=state.trash[index];
    if(item.kind==='channel'){
      let channel=normalizeChannel(item.channel);if(!state.workspaces.some(workspace=>workspace.id===channel.workspaceId)){toast('Restore the parent workspace first.');return}
      const previousId=channel.id;if(state.channels.some(existing=>existing.id===previousId))channel.id=uid();
      state.channels.push(channel);
      for(const task of item.tasks||[]){const copy={...task,id:state.tasks.some(existing=>existing.id===task.id)?uid():task.id,workspaceId:channel.workspaceId,channelId:channel.id};state.tasks.push(copy)}
      state.selectedWorkspaceId=channel.workspaceId;state.selectedChannelId=channel.id;
    }else{
      let workspace=normalizeWorkspace(item.workspace),oldWorkspaceId=workspace.id;
      if(state.workspaces.some(existing=>existing.id===workspace.id))workspace={...workspace,id:uid(),name:cleanName(workspace.name+' Restored')};
      const idMap=new Map();const channels=(item.channels||[]).map(record=>{const channel=normalizeChannel(record,workspace.id),oldId=channel.id;if(state.channels.some(existing=>existing.id===oldId))channel.id=uid();idMap.set(oldId,channel.id);return channel});
      state.workspaces.push(workspace);
      if(channels.length)state.channels.push(...channels);else state.channels.push(defaultChannel(workspace.id));
      for(const task of item.tasks||[]){state.tasks.push({...task,id:state.tasks.some(existing=>existing.id===task.id)?uid():task.id,workspaceId:workspace.id,channelId:idMap.get(task.channelId)||null})}
      state.selectedWorkspaceId=workspace.id;state.selectedChannelId=channels[0]?.id||state.channels.find(channel=>channel.workspaceId===workspace.id).id;
    }
    state.trash.splice(index,1);renderAll();scheduleSave();renderOrganizer();toast('Item restored from Trash');
  }
  function permanentlyDeleteTrashItem(id){
    const item=state.trash.find(record=>record.id===id);if(!item)return;
    const name=item.kind==='workspace'?item.workspace.name:item.channel.name;
    if(!confirm('Permanently delete “'+name+'” and its saved tasks? This cannot be undone.'))return;
    state.trash=state.trash.filter(record=>record.id!==id);scheduleSave();renderOrganizer();toast('Item permanently deleted');
  }
  function taskCreate(existing=null){const t=existing||{title:'',details:'',due:'',remindAt:'',channelId:currentChannel().id};
    openDialog(existing?'Edit task':'New task / reminder',[
      {name:'title',label:'Task',value:t.title,placeholder:'Finish the next scene'},
      {name:'details',label:'Notes (optional)',type:'textarea',value:t.details,required:false},
      {name:'due',label:'Due date and time (optional)',type:'datetime-local',value:t.due,required:false},
      {name:'remindAt',label:'Remind me (optional)',type:'datetime-local',value:t.remindAt,required:false},
      {name:'channelId',label:'Assign to',type:'select',value:t.channelId||currentChannel().id,required:false,options:[{value:'',label:'Entire workspace'},...state.channels.filter(c=>c.workspaceId===state.selectedWorkspaceId).map(c=>({value:c.id,label:c.name}))]}
    ],existing?'Save task':'Create task',values=>{
      if(existing){const previousReminder=existing.remindAt;Object.assign(existing,{title:cleanName(values.title),details:String(values.details||'').slice(0,2000),due:values.due,remindAt:values.remindAt,channelId:values.channelId||null,notified:values.remindAt===previousReminder?existing.notified:false})}
      else state.tasks.push({id:uid(),workspaceId:state.selectedWorkspaceId,channelId:values.channelId||null,title:cleanName(values.title),details:String(values.details||'').slice(0,2000),due:values.due,remindAt:values.remindAt,done:false,notified:false});
      renderTasks();scheduleSave();checkReminders();toast(existing?'Task updated':'Task added');
    });
    const select=$('dialog-field-channelId');if(select)select.value=t.channelId||'';
  }
  function renderTasks(){
    const filter=$('task-filter').value;const all=state.tasks.filter(t=>filter==='all'||filter==='workspace'&&t.workspaceId===state.selectedWorkspaceId||(filter==='current'&&t.workspaceId===state.selectedWorkspaceId&&(t.channelId===currentChannel().id||!t.channelId)));
    const incomplete=state.tasks.filter(t=>!t.done).length;
    $('task-summary').textContent=incomplete?incomplete+' open task'+(incomplete===1?'':'s')+' across your library.':'All caught up. Your pages are ready.';
    const holder=$('task-list');holder.replaceChildren();
    const sorted=all.slice().sort((a,b)=>Number(a.done)-Number(b.done)||String(a.due||'9999').localeCompare(b.due||'9999'));
    if(!sorted.length){holder.append(make('div','tasks-empty','No tasks here yet. Add a writing goal or reminder.'));return}
    for(const t of sorted){
      const row=make('div','task-item'+(t.done?' done':''));const box=make('input');box.type='checkbox';box.checked=t.done;box.setAttribute('aria-label','Complete '+t.title);box.addEventListener('change',()=>{t.done=box.checked;renderTasks();scheduleSave()});
      const info=make('div','task-info');info.append(make('strong','',t.title));
      if(t.due||t.remindAt){const bits=[];if(t.due)bits.push('Due '+humanDate(t.due));if(t.remindAt)bits.push('⏰ '+humanDate(t.remindAt));info.append(make('small','',bits.join(' · ')))}
      if(t.details){const detail=make('small','',t.details);detail.style.overflowWrap='anywhere';info.append(detail)}
      const edit=make('button','','✎');edit.type='button';edit.title='Edit task';edit.setAttribute('aria-label','Edit '+t.title);edit.addEventListener('click',()=>taskCreate(t));
      const del=make('button','','×');del.type='button';del.title='Delete task';del.setAttribute('aria-label','Delete '+t.title);del.addEventListener('click',()=>{if(confirm('Delete task "'+t.title+'"?')){state.tasks=state.tasks.filter(x=>x.id!==t.id);renderTasks();scheduleSave()}});
      row.append(box,info,edit,del);holder.append(row);
    }
  }
  function humanDate(value){const d=new Date(value);return Number.isNaN(+d)?value:new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(d)}
  async function checkReminders(){
    if(!state||notificationChecking)return;notificationChecking=true;
    let changed=false;const now=Date.now();
    for(const t of state.tasks){
      if(t.done||t.notified||!t.remindAt)continue;
      const due=new Date(t.remindAt).getTime();if(!Number.isFinite(due)||due>now)continue;
      t.notified=true;changed=true;toast('Reminder: '+t.title);
      if('Notification' in window && Notification.permission==='granted'){
        try{new Notification('Luxury Editor reminder',{body:t.title,tag:'luxury-task-'+t.id})}catch{}
      }
    }
    if(changed) {renderTasks();scheduleSave()}
    notificationChecking=false;
  }
  function saveSelection(){
    const sel=window.getSelection();if(!sel||!sel.rangeCount||!activeEditor)return;
    const range=sel.getRangeAt(0);
    if(!activeEditor.contains(range.commonAncestorContainer))return;
    lastRange=range.cloneRange();
    try{
      const start=document.createRange(),end=document.createRange();
      start.selectNodeContents(activeEditor);end.selectNodeContents(activeEditor);
      start.setEnd(range.startContainer,range.startOffset);
      end.setEnd(range.endContainer,range.endOffset);
      lastBookmark={editor:activeEditor,start:start.toString().length,end:end.toString().length};
    }catch{}
  }
  function textPosition(ed,offset){
    const walk=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT);
    let node,remaining=offset,last=null;
    while((node=walk.nextNode())){
      last=node;
      if(remaining<=node.textContent.length)return {node,offset:remaining};
      remaining-=node.textContent.length;
    }
    return last?{node:last,offset:last.textContent.length}:{node:ed,offset:ed.childNodes.length};
  }
  function focusEditor(){
    if(!activeEditor||!document.contains(activeEditor))activeEditor=document.querySelector('.rich-editor');
    if(!activeEditor)return false;
    const bookmark=lastBookmark?.editor===activeEditor?{...lastBookmark}:null;
    activeEditor.focus();
    const sel=window.getSelection();
    if(bookmark){
      try{
        const a=textPosition(activeEditor,bookmark.start),b=textPosition(activeEditor,bookmark.end);
        const range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);
        sel.removeAllRanges();sel.addRange(range);return true;
      }catch{}
    }
    if(lastRange&&activeEditor.contains(lastRange.commonAncestorContainer)){
      try{sel.removeAllRanges();sel.addRange(lastRange.cloneRange());return true}catch{}
    }
    const range=document.createRange();range.selectNodeContents(activeEditor);range.collapse(false);sel.removeAllRanges();sel.addRange(range);return true;
  }
  function editorCommand(command,value=null){
    if(!focusEditor())return;
    document.execCommand(command,false,value);
    saveSelection();captureEditor();updateWordCount();scheduleSave();
  }
  function fontOptions(){
    const select=$('font-select');
    Array.from(select.options).filter(o=>o.dataset.uploaded).forEach(o=>o.remove());
    for(const font of fonts){const o=new Option(font.name,font.family);o.dataset.uploaded='true';select.add(o)}
    const ch=currentChannel();if(ch){select.value=ch.font;if(select.value!==ch.font)select.value='Georgia'}
  }
  async function loadFont(font){
    const url=URL.createObjectURL(font.blob);
    try{const face=new FontFace(font.family,`url("${url}")`);await face.load();document.fonts.add(face)}finally{URL.revokeObjectURL(url)}
  }
  async function addFonts(files){
    for(const file of files){
      if(!/\.(ttf|otf|woff2?)$/i.test(file.name)){toast('Only TTF, OTF, WOFF and WOFF2 font files are supported.');continue}
      if(file.size>8*1024*1024){toast('Font exceeds 8 MB: '+file.name);continue}
      const id=uid();const name=file.name.replace(/\.(ttf|otf|woff2?)$/i,'').slice(0,60);const f={id,name,family:'LuxuryFont'+id.replace(/[^a-z0-9]/gi,''),blob:file};
      try{await loadFont(f);await store.putFont(f);fonts.push(f);toast('Font added: '+name)}catch(error){toast('Could not use font '+name+': '+error.message)}
    }
    fontOptions();renderFonts();
  }
  function renderFonts(){const list=$('uploaded-fonts-list');list.replaceChildren();
    if(!fonts.length){list.textContent='No fonts uploaded yet.';return}
    for(const f of fonts){const row=make('div');row.style.display='flex';row.style.justifyContent='space-between';row.style.gap='8px';row.append(make('span','',f.name));
      const del=make('button','btn tiny outline','Remove');del.addEventListener('click',async()=>{
        if(!confirm('Remove '+f.name+' from this browser?'))return;
        await store.removeFont(f.id);fonts=fonts.filter(v=>v.id!==f.id);
        for(const c of state.channels)if(c.font===f.family)c.font='Georgia';
        fontOptions();renderFonts();renderDoc();scheduleSave();
      });row.append(del);list.append(row);
    }
  }
  function download(filename,body,mime='text/plain;charset=utf-8'){
    const b=new Blob([body],{type:mime});const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
  function contentForExport(ch){captureEditor();return ch.type==='studio'?
    '<h1>Draft</h1>'+ch.leftHtml+'<hr><h1>Reference / alternate draft</h1>'+ch.rightHtml:ch.html;}
  function exportDocument(){
    openDialog('Export document',[{name:'format',type:'select',label:'File format',options:[{value:'html',label:'HTML (preserves formatting and embeds fonts)'},{value:'txt',label:'Plain text'},{value:'md',label:'Markdown (simple)'}]}],'Download',async values=>{
      const ch=currentChannel(),markup=contentForExport(ch),name=safeFilename(ch.name);
      if(values.format==='html'){
        let fontCSS='';
        try{
          fontCSS=await window.WriterHelperFonts?.exportCSS(markup,ch.font)||'';
          for(const font of fonts){
            if(!markup.includes(font.family)&&!ch.font.includes(font.family))continue;
            if(!/^[A-Za-z0-9_-]+$/.test(font.family))continue;
            fontCSS+=`@font-face{font-family:${font.family};src:url(data:${font.blob.type||'font/ttf'};base64,${await toBase64(font.blob)})}\n`;
          }
        }catch(error){toast('Export failed: '+error.message);return}
        const cssFamily=String(ch.font||'Georgia').replace(/[<>;{}\\]/g,'');
        const html='<!doctype html><html lang="'+ch.lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHTML(ch.name)+'</title><style>'+fontCSS+'body{max-width:800px;margin:5rem auto;padding:0 2rem;color:#19251e;font:18px/1.85 Georgia,serif;font-family:'+cssFamily+'}h1,h2,h3{color:#10362d}blockquote{border-left:3px solid #c7a35b;padding-left:1em}</style></head><body>'+markup+'</body></html>';
        download(name+'.html',html,'text/html;charset=utf-8');
      }else{
        const doc=new DOMParser().parseFromString('<body>'+markup+'</body>','text/html');
        const txt=doc.body.innerText||doc.body.textContent||'';
        if(values.format==='txt')download(name+'.txt',txt);
        else {const md=markup.replace(/<h1[^>]*>(.*?)<\/h1>/gi,'# $1\n').replace(/<h2[^>]*>(.*?)<\/h2>/gi,'## $1\n').replace(/<h3[^>]*>(.*?)<\/h3>/gi,'### $1\n').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>|<\/div>|<\/li>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');download(name+'.md',md)}
      }
      toast('Document downloaded');
    });
  }
  const toBase64=async blob => {
    const bytes=new Uint8Array(await blob.arrayBuffer());let result='';const step=8192;
    for(let i=0;i<bytes.length;i+=step)result+=String.fromCharCode(...bytes.subarray(i,i+step));
    return btoa(result);
  };
  async function exportBackup(){captureEditor();await persist();const fontData=[];
    for(const f of fonts)fontData.push({id:f.id,name:f.name,family:f.family,era:f.era,type:f.blob.type,data:await toBase64(f.blob)});
    download('azaaraan-writing-studio-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'luxury-editor-backup',version:1,exportedAt:nowDate(),state,fonts:fontData},null,2),'application/json');toast('Backup exported');
  }
  async function importBackup(file){
    if(file.size>60*1024*1024)throw Error('Backup is larger than the 60 MB import limit.');
    const data=JSON.parse(await file.text());if(data.format!=='luxury-editor-backup')throw Error('This is not a Luxury Editor backup.');
    const restored=validateState(data.state);
    if(!confirm('Replace your current library with this backup? Download your current backup first if needed.'))return;
    for(const f of Array.isArray(data.fonts)?data.fonts.slice(0,100):[]){
      if(!f.data||typeof f.data!=='string'||f.data.length>12*1024*1024)continue;
      try{const binary=atob(f.data),array=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)array[i]=binary.charCodeAt(i);
        const font={id:f.id,name:f.name,family:f.family,era:['Proto','Ancient','Archaic','Classical','Traditional','Modern'].includes(f.era)?f.era:undefined,blob:new Blob([array],{type:f.type||'font/ttf'})};await loadFont(font);await store.putFont(font)
      }catch(err){toast('Skipped an unreadable font: '+String(f.name||''))}
    }
    fonts=await store.allFonts();state=restored;renderAll();await persist();window.dispatchEvent(new Event('writerhelper:fonts-ready'));toast('Library restored');
  }
  async function importDocument(file){
    if(file.size>5*1024*1024)throw Error('Document exceeds 5 MB.');const ch=currentChannel();const raw=await file.text();
    const html=/\.html?$/i.test(file.name)?cleanHTML(new DOMParser().parseFromString(raw,'text/html').body.innerHTML):escapeHTML(raw).replace(/\r?\n/g,'<br>');
    if(ch.type==='studio')ch.leftHtml=html;else ch.html=html;
    ch.name=cleanName(file.name.replace(/\.[^.]+$/,''));renderAll();scheduleSave();toast('Document imported');
  }
  function setupBindings(){
    $('new-workspace').onclick=workspaceCreate;$('rename-workspace').onclick=workspaceRename;
    $('new-writing').onclick=()=>channelCreate('document');$('new-studio').onclick=()=>channelCreate('studio');
    $('new-channel-shortcut').onclick=()=>channelCreate('document');
    $('new-task').onclick=()=>taskCreate();$('top-task').onclick=()=>taskCreate();
    $('task-filter').onchange=renderTasks;
    $('document-title').addEventListener('input',e=>{currentChannel().name=cleanName(e.target.value);$('crumb-channel').textContent=currentChannel().name;scheduleSave()});
    $('document-title').addEventListener('blur',renderChannels);
    $('channel-notes').addEventListener('input',()=>{currentChannel().notes=$('channel-notes').value;scheduleSave()});
    $('language-select').replaceChildren(...Object.entries(langs).map(([code,data])=>new Option(data.name,code)));
    $('language-select').onchange=e=>{
      const ch=currentChannel();ch.lang=e.target.value;
      document.querySelectorAll('.rich-editor').forEach(ed=>{ed.lang=ch.lang;ed.dir=langs[ch.lang].dir});
      $('current-language').textContent=langs[ch.lang].name;scheduleSave();
    };
    $('font-select').onchange=e=>{const ch=currentChannel();ch.font=e.target.value;document.querySelectorAll('.rich-editor').forEach(el=>el.style.fontFamily=ch.font);scheduleSave()};
    $('font-size').onchange=e=>{const ch=currentChannel();ch.size=Number(e.target.value);document.querySelectorAll('.rich-editor').forEach(el=>el.style.fontSize=ch.size+'px');scheduleSave()};
    $('editor-toolbar').addEventListener('pointerdown',e=>{if(e.target.closest('.format-button,#insert-divider'))e.preventDefault()});
    document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>editorCommand(b.dataset.command));
    $('format-block').onchange=e=>{editorCommand('formatBlock',e.target.value);e.target.value='p'};
    $('insert-divider').onclick=()=>editorCommand('insertHorizontalRule');
    $('upload-font').onclick=()=>$('font-upload-input').click();
    $('font-upload-input').onchange=async e=>{await addFonts(e.target.files);e.target.value=''};
    $('print-doc').onclick=()=>window.print();$('export-doc').onclick=exportDocument;
    $('toggle-inspector').onclick=()=>{state.inspectorOpen=!state.inspectorOpen;renderInspector();scheduleSave()};
    $('close-inspector').onclick=()=>{state.inspectorOpen=false;renderInspector();scheduleSave()};
    $('toggle-sidebar').onclick=()=>$('app').classList.toggle('show-channels');
    $('dialog-close').onclick=$('dialog-cancel').onclick=()=>$('main-dialog').close();
    $('dialog-form').addEventListener('submit',e=>{
      e.preventDefault();if(!$('dialog-form').reportValidity())return;
      const values=Object.fromEntries(new FormData($('dialog-form')));
      const cb=dialogCallback;$('main-dialog').close();dialogCallback=null;
      try{cb?.(values)}catch(error){toast(error.message)}
    });
    $('sidebar-settings').onclick=$('rail-settings').onclick=()=>$('settings-dialog').showModal();
    $('rail-home').onclick=()=>{state.inspectorOpen=true;renderInspector();$('task-filter').value='all';renderTasks()};
    $('open-backup').onclick=()=>$('settings-dialog').showModal();
    $('settings-close').onclick=()=>$('settings-dialog').close();
    $('backup-json').onclick=()=>exportBackup().catch(e=>toast('Backup error: '+e.message));
    $('restore-json').onclick=()=>$('import-input').click();
    $('import-input').onchange=async e=>{if(e.target.files[0])try{await importBackup(e.target.files[0])}catch(err){toast('Import error: '+err.message)}e.target.value=''};
    $('import-document').onclick=()=>$('document-import-input').click();
    $('document-import-input').onchange=async e=>{if(e.target.files[0])try{await importDocument(e.target.files[0])}catch(err){toast(err.message)}e.target.value=''};
    $('notification-permission').onclick=async()=>{
      if(!('Notification' in window))return toast('This browser does not support notifications.');
      try{const p=await Notification.requestPermission();toast(p==='granted'?'Notifications enabled while the app is open.':'Notifications not enabled.')}catch(e){toast('Notification permission unavailable in this context.')}
    };
    $('delete-workspace').onclick=()=>{
      if(state.workspaces.length===1)return toast('Keep at least one workspace. Create another before deleting this one.');
      const ws=currentWorkspace();if(!confirm('Permanently delete workspace "'+ws.name+'" including channels and tasks?'))return;
      state.workspaces=state.workspaces.filter(w=>w.id!==ws.id);
      state.channels=state.channels.filter(c=>c.workspaceId!==ws.id);
      state.tasks=state.tasks.filter(t=>t.workspaceId!==ws.id);
      state.selectedWorkspaceId=state.workspaces[0].id;
      state.selectedChannelId=state.channels.find(c=>c.workspaceId===state.selectedWorkspaceId).id;
      $('settings-dialog').close();renderAll();scheduleSave();
    };
    document.addEventListener('selectionchange',saveSelection);
    window.addEventListener('beforeunload',()=>{captureEditor();if(savingTimer)persist()});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminders()});
  }
  window.LiteraryFriendApp={
    openOrganizer,
    navigate(workspaceId,channelId){
      const workspace=state.workspaces.find(w=>w.id===workspaceId);if(!workspace)return false;
      const channel=state.channels.find(c=>c.workspaceId===workspaceId&&c.id===channelId)||state.channels.find(c=>c.workspaceId===workspaceId);
      if(!channel)return false;captureEditor();state.selectedWorkspaceId=workspaceId;state.selectedChannelId=channel.id;
      document.getElementById('app').classList.remove('show-channels');renderAll();scheduleSave();return true;
    },
    async registerFont(font){
      if(!font?.blob||font.blob.size>8*1024*1024||!/^[A-Za-z0-9_-]+$/.test(font.family))throw Error('Invalid font or font exceeds 8 MB.');
      await loadFont(font);await store.putFont(font);fonts=fonts.filter(f=>f.id!==font.id);fonts.push(font);fontOptions();renderFonts();
    },
    getSnapshot(){captureEditor();return JSON.parse(JSON.stringify(state))},
    currentDocument(){captureEditor();const c=currentChannel();if(!c)return null;return {id:c.id,title:c.name,html:c.type==='studio'?c.leftHtml:c.html,notes:c.notes,type:c.type,lang:c.lang,workspace:currentWorkspace()?.name||''}},
    updateCurrent(html){const c=currentChannel();if(!c)throw Error('No selected document');if(c.type==='studio')c.leftHtml=cleanHTML(html);else c.html=cleanHTML(html);renderDoc();scheduleSave()},
    appendCurrent(html){const c=currentChannel();if(!c)throw Error('No selected document');if(c.type==='studio')c.leftHtml+=cleanHTML(html);else c.html+=cleanHTML(html);renderDoc();scheduleSave()},
    async replaceSnapshot(input){captureEditor();state=validateState(input);renderAll();await persist()},
    getSelectedWorkspace(){return currentWorkspace()?.name||''},
    notify(message){toast(message)}
  };
  window.dispatchEvent(new Event('literaryfriend:api-ready'));
  async function init(){
    setupBindings();
    try{state=validateState((await store.readState())||initialState())}catch(e){state=initialState();toast('Started a new local library because saved data could not be loaded.')}
    fonts=await store.allFonts();
    for(const f of fonts){try{await loadFont(f)}catch(error){console.warn('Font could not be loaded:',f.name,error)}}
    window.LuxuryKeyboard.init();renderAll();
    if(state.inspectorOpen!==true){renderInspector()}
    checkReminders();setInterval(checkReminders,20000);window.dispatchEvent(new Event('writerhelper:fonts-ready'));window.dispatchEvent(new Event('literaryfriend:ready'));
  }
  init().catch(err=>{console.error(err);toast('Initialization error: '+err.message)});
})();
