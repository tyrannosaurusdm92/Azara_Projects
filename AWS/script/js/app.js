/* Literary Friend: Luxury Editor shell with local writing channels and optional secure cloud bridge. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = window.LuxuryStore;
  const langs = window.LUXURY_LANGUAGES;
  const uid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanName = (s,fallback='Untitled') => String(s||'').trim().slice(0,100)||fallback;
  const safeFilename = s => String(s||'document').replace(/[^\p{L}\p{N}._ -]+/gu,'-').slice(0,90).trim()||'document';
  const nowDate = () => new Date().toISOString();
  const defaultChannel = (workspaceId,name='Manuscript',type='document',parentId=null,role='page') => ({id:uid(),workspaceId,name,type,parentId,role,deletedAt:'',html:'',leftHtml:'',rightHtml:'',notes:'',lang:'en',font:'Georgia',size:18,updatedAt:nowDate()});
  function initialState(){
    const w={id:uid(),name:"Aza'raan Writing Studio"},channels=[];
    function page(name,parent=null,role='page',type='document') {const c=defaultChannel(w.id,name,type,parent?.id||null,role);channels.push(c);return c}
    const language=page('Language',null,'section');
    page('Language Overview',language);page('Dictionary & Lexicon',language,'dictionary');page('Grammar & Syntax',language);
    page('Language Rules & Orthography',language);page('Pronunciation & TTS',language,'tts');
    page('Glyph Studio',language,'glyph');page('Language Evolution Breakdown',language,'language-evolution');
    const library=page('Library',null,'library');
    const series=page('Full Series',null,'section');
    ['Series Synopsis','Series Outline','Characters & Relationships','Overarching Plots','Worldbuilding & Canon','Series Timeline','Series Notes'].forEach(name=>page(name,series));
    const titles=['The Door In The Tree','The Drowned Queen','The Unwilling Spy','The Hollow Throne','Never-Ending Loss','Threats Of Space','Collision Of Worlds','Unraveled'];
    titles.forEach((title,i)=>{const root=page('Book '+['One','Two','Three','Four','Five','Six','Seven','Eight'][i]+': '+title,null,'section');
      ['Synopsis','Book Outline','Manuscript','Chapters','Characters','Plot Threads','Research','Notes & Continuity'].forEach(name=>page(name,root));});
    return {version:2,workspaces:[w],channels,tasks:[],files:[],lexicon:[],important:[],collapsed:{},awsSeeded:true,selectedWorkspaceId:w.id,selectedChannelId:series.id,inspectorOpen:window.innerWidth>1080}
  }
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
  function validateState(input){
    if(!input||!Array.isArray(input.workspaces)||!Array.isArray(input.channels)||!Array.isArray(input.tasks))throw Error("Not an Aza'raan Writing Studio backup.");
    const workspaces=input.workspaces.slice(0,150).filter(x=>x&&typeof x.id==='string').map(x=>({id:x.id.slice(0,150),name:cleanName(x.name,'Workspace')}));
    if(!workspaces.length)throw Error('No valid workspaces in backup.');
    const wsIds=new Set(workspaces.map(w=>w.id));
    let channels=input.channels.slice(0,3000).filter(x=>x&&wsIds.has(x.workspaceId)&&typeof x.id==='string').map(x=>({id:x.id.slice(0,150),workspaceId:x.workspaceId,name:cleanName(x.name),type:x.type==='studio'?'studio':'document',parentId:typeof x.parentId==='string'?x.parentId.slice(0,150):null,role:['page','section','library','glyph','glyph-evolution','language-evolution','tts','dictionary'].includes(x.role)?x.role:'page',deletedAt:String(x.deletedAt||'').slice(0,40),html:cleanHTML(x.html),leftHtml:cleanHTML(x.leftHtml),rightHtml:cleanHTML(x.rightHtml),notes:String(x.notes||'').slice(0,20000),lang:langs[x.lang]?x.lang:'en',font:String(x.font||'Georgia').slice(0,150),size:Math.max(12,Math.min(28,Number(x.size)||18)),updatedAt:x.updatedAt||nowDate()}));
    for(const w of workspaces){if(!channels.some(c=>c.workspaceId===w.id && !c.deletedAt))channels.push(defaultChannel(w.id))}
    const channelIds=new Set(channels.map(c=>c.id));
    const tasks=input.tasks.slice(0,10000).filter(t=>t&&typeof t.id==='string'&&wsIds.has(t.workspaceId)).map(t=>({id:t.id.slice(0,150),workspaceId:t.workspaceId,channelId:channelIds.has(t.channelId)?t.channelId:null,title:cleanName(t.title),details:String(t.details||'').slice(0,2000),due:String(t.due||'').slice(0,40),remindAt:String(t.remindAt||'').slice(0,40),done:!!t.done,notified:!!t.notified}));
    const selectedWorkspaceId=wsIds.has(input.selectedWorkspaceId)?input.selectedWorkspaceId:workspaces[0].id;
    const selectedChannelId=channelIds.has(input.selectedChannelId)&&channels.find(c=>c.id===input.selectedChannelId)?.workspaceId===selectedWorkspaceId&&!channels.find(c=>c.id===input.selectedChannelId).deletedAt?input.selectedChannelId:channels.find(c=>c.workspaceId===selectedWorkspaceId&&!c.deletedAt)?.id;
    return {version:2,workspaces,channels,tasks,files:(Array.isArray(input.files)?input.files:[]).slice(0,10000).filter(f=>f&&typeof f.id==='string').map(f=>({id:f.id,name:cleanName(f.name),mime:String(f.mime||''),size:Math.max(0,Number(f.size)||0),category:String(f.category||'attachment'),folderId:String(f.folderId||''),updatedAt:String(f.updatedAt||nowDate()),deletedAt:String(f.deletedAt||''),inlineData:typeof f.inlineData==='string'&&f.inlineData.length<1500000?f.inlineData:'',cloudId:String(f.cloudId||'')})),lexicon:(Array.isArray(input.lexicon)?input.lexicon:[]).slice(0,15000).filter(x=>x&&typeof x.id==='string').map(x=>({id:x.id.slice(0,150),word:String(x.word||'').slice(0,150),ipa:String(x.ipa||'').slice(0,200),meaning:String(x.meaning||'').slice(0,2000),era:String(x.era||'modern').slice(0,40),partOfSpeech:String(x.partOfSpeech||'').slice(0,100),notes:String(x.notes||'').slice(0,5000)})),important:(Array.isArray(input.important)?input.important:[]).slice(0,5000).map(q=>({id:String(q.id||uid()),channelId:String(q.channelId||''),text:String(q.text||'').slice(0,10000),createdAt:String(q.createdAt||nowDate())})),collapsed:input.collapsed&&typeof input.collapsed==='object'&&!Array.isArray(input.collapsed)?input.collapsed:{},awsSeeded:!!input.awsSeeded,selectedWorkspaceId,selectedChannelId,inspectorOpen:input.inspectorOpen!==false};
  }
  function seedExistingStudio(st){
    // Migration is additive: keep all original LiteraryFriend pages, workspaces, tasks and drafts.
    if(st.awsSeeded || st.channels.some(c=>c.name==='Book Eight: Unraveled'&&!c.deletedAt)){st.awsSeeded=true;return false}
    const target=st.workspaces.find(w=>w.id===st.selectedWorkspaceId)||st.workspaces[0];
    const fresh=initialState();const translations=new Map();
    for(const c of fresh.channels)translations.set(c.id,uid());
    const added=fresh.channels.map(c=>({...c,id:translations.get(c.id),workspaceId:target.id,parentId:c.parentId?translations.get(c.parentId):null}));
    st.channels=[...added,...st.channels];
    if(target.name==='My Library'||target.name==='Writing studio')target.name="Aza'raan Writing Studio";
    st.awsSeeded=true;return true;
  }
  function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
  function renderRail(){const holder=$('workspace-list');holder.replaceChildren();state.workspaces.forEach(w=>{
    const b=make('button','workspace-pill'+(w.id===state.selectedWorkspaceId?' active':''),w.name.slice(0,2).toUpperCase());b.title=w.name;b.setAttribute('aria-label','Open '+w.name);b.setAttribute('aria-current',w.id===state.selectedWorkspaceId?'true':'false');b.addEventListener('click',()=>selectWorkspace(w.id));holder.append(b);
  })}
  function renderChannels(){
    const ws=currentWorkspace();if(!ws)return;
    $('workspace-title').textContent=ws.name;
    $('writing-channels').replaceChildren();$('studio-channels').replaceChildren();
    const list=state.channels.filter(c=>c.workspaceId===ws.id&&!c.deletedAt);
    function descendants(parentId,depth=0,seen=new Set()){
      for(const ch of list.filter(c=>(c.parentId||null)===(parentId||null))){
        if(seen.has(ch.id))continue; const next=new Set([...seen,ch.id]);
        const children=list.some(c=>c.parentId===ch.id);const row=make('div','channel-row');row.style.display='flex';row.style.alignItems='center';row.style.paddingLeft=Math.min(depth,8)*10+'px';
        if(children){const fold=make('button','aws-fold',state.collapsed[ch.id]?'▸':'▾');fold.title=state.collapsed[ch.id]?'Expand section':'Collapse section';fold.setAttribute('aria-label',fold.title+' '+ch.name);fold.onclick=()=>{state.collapsed[ch.id]=!state.collapsed[ch.id];renderChannels();scheduleSave()};row.append(fold)}
        else row.append(make('span','aws-fold-spacer',''));
        const button=make('button','channel-button'+(ch.id===state.selectedChannelId?' active':''));button.setAttribute('aria-current',ch.id===state.selectedChannelId?'page':'false');
        const icon=ch.role==='library'?'▤':ch.role==='glyph'||ch.role==='glyph-evolution'?'◈':ch.role==='tts'?'♫':children?'▣':ch.type==='studio'?'◫':'#';
        button.append(make('span','channel-icon',icon),make('span','channel-name',ch.name));
        button.onclick=()=>selectChannel(ch.id);button.oncontextmenu=e=>{e.preventDefault();openChannelActions(ch)};
        const more=make('button','icon-button subtle channel-more','⋯');more.title='Manage '+ch.name;more.setAttribute('aria-label',more.title);more.onclick=()=>openChannelActions(ch);row.append(button,more);
        (ch.type==='studio'?$('studio-channels'):$('writing-channels')).append(row);
        if(children&&!state.collapsed[ch.id])descendants(ch.id,depth+1,next);
      }
    }
    descendants(null);
    // Existing imported channels with missing parents are still accessible.
    for(const c of list.filter(c=>c.parentId&&!list.some(p=>p.id===c.parentId))){const b=make('button','channel-button',c.name);b.onclick=()=>selectChannel(c.id);$('writing-channels').append(b)}
    window.dispatchEvent(new Event('aws:navigation'));
  }
  function renderDoc(){
    const ch=currentChannel();if(!ch)return;
    const ws=currentWorkspace();$('crumb-workspace').textContent=ws.name;$('crumb-channel').textContent=ch.name;
    const special=['library','glyph','glyph-evolution','language-evolution','tts','dictionary'].includes(ch.role);
    $('aws-evolution-panel').hidden=ch.role!=='language-evolution';$('panel-evolution').hidden=ch.role!=='language-evolution';window.dispatchEvent(new CustomEvent('aws:keyboard-visibility',{detail:{hidden:ch.role==='language-evolution'}}));
    $('aws-library-panel').hidden=ch.role!=='library';$('aws-glyph-panel').hidden=!['glyph','glyph-evolution'].includes(ch.role);$('aws-tts-panel').hidden=ch.role!=='tts';$('aws-dictionary-panel').hidden=ch.role!=='dictionary';if(ch.role==='glyph-evolution')window.AWSGlyphStudio?.setView?.('evolution');if(ch.role==='glyph')window.AWSGlyphStudio?.setView?.('glyphs');
    document.querySelector('.editor-section').hidden=special;
    if(special){$('writing-surface').replaceChildren();$('channel-notes').value=ch.notes||'';activeEditor=null;lastRange=null;lastBookmark=null;window.dispatchEvent(new CustomEvent('aws:view',{detail:{role:ch.role}}));return;}
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
      const paper=make('div','paper');paper.append(make('div','paper-topline'),make('div','paper-meta',"AZA'RAAN WRITING STUDIO  /  "+ws.name.toUpperCase()));paper.append(createRichEditor(ch,'single',ch.html));surface.append(paper);
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
  function renderAll(){renderRail();renderChannels();fontOptions();renderDoc();renderTasks();renderInspector();renderFonts();window.dispatchEvent(new Event('aws:library-changed'))}
  function renderInspector(){
    $('inspector').classList.toggle('hidden',!state.inspectorOpen);
    $('toggle-inspector').setAttribute('aria-expanded',String(state.inspectorOpen));
    $('date-label').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
  }
  function selectWorkspace(id){if(!state.workspaces.some(w=>w.id===id))return;captureEditor();state.selectedWorkspaceId=id;let ch=state.channels.find(x=>x.workspaceId===id&&!x.deletedAt);if(!ch){ch=defaultChannel(id);state.channels.push(ch)}state.selectedChannelId=ch.id;renderAll();scheduleSave();$('app').classList.remove('show-channels')}
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
    const w={id:uid(),name:cleanName(values.name,'New Workspace')};state.workspaces.push(w);const ch=defaultChannel(w.id);state.channels.push(ch);selectWorkspace(w.id);toast('Workspace created')
  })}
  function workspaceRename(){openDialog('Rename workspace',[{name:'name',label:'Workspace name',value:currentWorkspace().name}],'Save name',values=>{currentWorkspace().name=cleanName(values.name);renderAll();scheduleSave()})}
  function channelCreate(type='document',preferredParent){
    const options=[{value:'',label:'Top level'},...state.channels.filter(c=>c.workspaceId===state.selectedWorkspaceId&&!c.deletedAt).map(c=>({value:c.id,label:c.name}))];
    const parent=typeof preferredParent==='string'?preferredParent:(currentChannel()?.role==='library'?'':currentChannel()?.id||'');
    openDialog(type==='studio'?'New parallel writing studio':'New section or page',[
      {name:'name',label:'Name',placeholder:'Chapter / Research / Subcategory…'},
      {name:'parentId',label:'Inside section',type:'select',value:parent,required:false,options},
      {name:'kind',label:'Type',type:'select',value:'page',options:[{value:'page',label:'Editable writing page'},{value:'section',label:'Section (editable overview + child pages)'}]}
    ],'Create',values=>{
      const ch=defaultChannel(state.selectedWorkspaceId,cleanName(values.name),type,values.parentId||null,values.kind);state.channels.push(ch);
      if(values.parentId)state.collapsed[values.parentId]=false;selectChannel(ch.id);toast('Page added to library');
    })
  }
  function childIds(rootId){const ids=new Set([rootId]);let added=true;while(added){added=false;for(const c of state.channels)if(c.parentId&&ids.has(c.parentId)&&!ids.has(c.id)){ids.add(c.id);added=true}}return ids}
  function openChannelActions(ch){
    openDialog('Manage section or page', [{name:'action',label:'Action',type:'select',options:[
      {value:'new',label:'Add child page / subcategory'},{value:'rename',label:'Rename'},{value:'duplicate',label:'Duplicate page'},{value:'move',label:'Move to section'},{value:'delete',label:'Move to Library Trash'}
    ]}],'Continue',v=>{
      if(v.action==='new')return channelCreate('document',ch.id);
      if(v.action==='rename')return openDialog('Rename page',[{name:'name',label:'New name',value:ch.name}],'Save',x=>{ch.name=cleanName(x.name);renderAll();scheduleSave()});
      if(v.action==='duplicate'){captureEditor();const cp={...ch,id:uid(),parentId:ch.parentId,name:ch.name+' Copy',updatedAt:nowDate(),deletedAt:'',role:['library','glyph','tts','glyph-evolution','language-evolution','dictionary'].includes(ch.role)?'page':ch.role};state.channels.push(cp);selectChannel(cp.id);toast('Page duplicated');return}
      if(v.action==='move'){const excludes=childIds(ch.id);return openDialog('Move page',[{name:'parentId',label:'Destination section',type:'select',required:false,value:ch.parentId||'',options:[{value:'',label:'Top level'},...state.channels.filter(x=>x.workspaceId===ch.workspaceId&&!x.deletedAt&&!excludes.has(x.id)).map(x=>({value:x.id,label:x.name}))]}],'Move',x=>{ch.parentId=x.parentId||null;renderAll();scheduleSave()})}
      if(v.action==='delete'){if(!confirm('Move "'+ch.name+'" and its subpages to Library Trash? You can restore them later.'))return;
        const ids=childIds(ch.id);for(const c of state.channels)if(ids.has(c.id))c.deletedAt=nowDate();
        const fallback=state.channels.find(c=>c.workspaceId===state.selectedWorkspaceId&&c.role==='library'&&!c.deletedAt)||state.channels.find(c=>c.workspaceId===state.selectedWorkspaceId&&!c.deletedAt);
        if(!fallback){const newPage=defaultChannel(ch.workspaceId,'Library','document',null,'library');state.channels.push(newPage);state.selectedChannelId=newPage.id}
        else state.selectedChannelId=fallback.id;
        renderAll();scheduleSave();toast('Moved to Trash');}
    });
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
  function markImportant(){
    const ch=currentChannel();if(!ch||!activeEditor)return toast('Select text in an editable page first.');
    if(lastRange&&document.contains(activeEditor)){
      try{const sel=window.getSelection();sel.removeAllRanges();sel.addRange(lastRange.cloneRange())}catch{}
    }
    const selected=window.getSelection()?.toString()?.trim()||'';
    if(!selected)return toast('Highlight some manuscript text, then select ★ Important.');
    state.important.push({id:uid(),channelId:ch.id,text:selected.slice(0,10000),createdAt:nowDate()});
    editorCommand('hiliteColor','#ffefa9');renderImportant();scheduleSave();toast('Saved highlighted excerpt in Library → Important');
  }
  function renderImportant(){const host=$('aws-important-list');if(!host||!state)return;host.replaceChildren();
    for(const q of state.important){const row=make('article','aws-important-item');row.append(make('p','',q.text));const ch=state.channels.find(c=>c.id===q.channelId);const jump=make('button','btn tiny outline',ch?.name||'Deleted page');jump.disabled=!ch||!!ch.deletedAt;jump.onclick=()=>selectChannel(ch.id);const del=make('button','btn tiny outline','Remove');del.onclick=()=>{state.important=state.important.filter(x=>x.id!==q.id);renderImportant();scheduleSave()};row.append(jump,del);host.append(row)}
    if(!state.important.length)host.append(make('p','aws-hint','No important excerpts yet.'));
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
    openDialog('Export document',[{name:'format',type:'select',label:'File format',options:[{value:'html',label:'HTML (preserves formatting)'},{value:'txt',label:'Plain text'},{value:'md',label:'Markdown (simple)'}]}],'Download',values=>{
      const ch=currentChannel(),markup=contentForExport(ch),name=safeFilename(ch.name);
      if(values.format==='html'){
        const html='<!doctype html><html lang="'+ch.lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHTML(ch.name)+'</title><style>body{max-width:800px;margin:5rem auto;padding:0 2rem;color:#19251e;font:18px/1.85 Georgia,serif}h1,h2,h3{color:#10362d;font-family:Georgia,serif}blockquote{border-left:3px solid #c7a35b;padding-left:1em}</style></head><body>'+markup+'</body></html>';
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
    for(const f of fonts)fontData.push({id:f.id,name:f.name,family:f.family,type:f.blob.type,data:await toBase64(f.blob)});
    download('azaaraan-writing-studio-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'luxury-editor-backup',version:1,exportedAt:nowDate(),state:this?.getSnapshot?.()||{...state,glyphProject:window.AWSGlyphStudio?.getSnapshot?.()||null},fonts:fontData},null,2),'application/json');toast('Backup exported');
  }
  async function importBackup(file){
    if(file.size>60*1024*1024)throw Error('Backup is larger than the 60 MB import limit.');
    const data=JSON.parse(await file.text());if(data.format!=='luxury-editor-backup')throw Error('This is not a Luxury Editor backup.');
    const restored=validateState(data.state);
    if(!confirm('Replace your current library with this backup? Download your current backup first if needed.'))return;
    for(const f of Array.isArray(data.fonts)?data.fonts.slice(0,100):[]){
      if(!f.data||typeof f.data!=='string'||f.data.length>12*1024*1024)continue;
      try{const binary=atob(f.data),array=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)array[i]=binary.charCodeAt(i);
        const font={id:f.id,name:f.name,family:f.family,blob:new Blob([array],{type:f.type||'font/ttf'})};await loadFont(font);await store.putFont(font)
      }catch(err){toast('Skipped an unreadable font: '+String(f.name||''))}
    }
    fonts=await store.allFonts();state=restored;renderAll();await persist();if(data.state?.glyphProject)await window.AWSGlyphStudio?.replaceSnapshot?.(data.state.glyphProject);toast('Library restored');
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
    $('new-task').onclick=()=>taskCreate();$('top-task').onclick=()=>taskCreate();$('mark-important').onclick=markImportant;
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
  window.AWSApp=window.LiteraryFriendApp={
    getSnapshot(){captureEditor();const snapshot=JSON.parse(JSON.stringify(state));const glyph=window.AWSGlyphStudio?.getSnapshot?.();if(glyph)snapshot.glyphProject=glyph;return snapshot},
    currentDocument(){captureEditor();const c=currentChannel();if(!c)return null;return {id:c.id,title:c.name,html:c.type==='studio'?c.leftHtml:c.html,notes:c.notes,type:c.type,lang:c.lang,workspace:currentWorkspace()?.name||''}},
    updateCurrent(html){const c=currentChannel();if(!c)throw Error('No selected document');if(c.type==='studio')c.leftHtml=cleanHTML(html);else c.html=cleanHTML(html);renderDoc();scheduleSave()},
    appendCurrent(html){const c=currentChannel();if(!c)throw Error('No selected document');if(c.type==='studio')c.leftHtml+=cleanHTML(html);else c.html+=cleanHTML(html);renderDoc();scheduleSave()},
    async replaceSnapshot(input){captureEditor();state=validateState(input);renderAll();await persist();if(input.glyphProject)await window.AWSGlyphStudio?.replaceSnapshot?.(input.glyphProject)},
    getSelectedWorkspace(){return currentWorkspace()?.name||''},
    goToRole(role){const ch=state.channels.find(c=>c.role===role&&!c.deletedAt&&c.workspaceId===state.selectedWorkspaceId);if(ch){selectChannel(ch.id);return true}return false},
    openPage(id){selectChannel(id)},
    newPage(parentId){channelCreate('document',parentId)},
    createPageFromText(name,html,parentId){const ch=defaultChannel(state.selectedWorkspaceId,cleanName(name),'document',parentId||null,'page');ch.html=cleanHTML(html);state.channels.push(ch);renderAll();scheduleSave();return ch.id},
    duplicatePage(id){const c=state.channels.find(x=>x.id===id);if(!c||c.deletedAt)return;captureEditor();const copy={...c,id:uid(),name:c.name+' Copy',updatedAt:nowDate()};state.channels.push(copy);renderAll();scheduleSave()},
    deletePage(id){const ids=childIds(id);for(const c of state.channels)if(ids.has(c.id))c.deletedAt=nowDate();const fallback=state.channels.find(c=>!c.deletedAt&&c.role==='library')||state.channels.find(c=>!c.deletedAt);state.selectedChannelId=fallback?.id;renderAll();scheduleSave()},
    restorePage(id){const ids=childIds(id);for(const c of state.channels)if(ids.has(c.id))c.deletedAt='';renderAll();scheduleSave()},
    purgePage(id){const ids=childIds(id);state.channels=state.channels.filter(c=>!ids.has(c.id));state.tasks=state.tasks.filter(t=>!ids.has(t.channelId));state.important=state.important.filter(q=>!ids.has(q.channelId));renderAll();scheduleSave()},
    getFiles(){return state.files},
    addFile(record){state.files.push(record);renderImportant();scheduleSave();window.dispatchEvent(new Event('aws:library-changed'))},
    changeFile(id,patch){const f=state.files.find(f=>f.id===id);if(f)Object.assign(f,patch);scheduleSave();window.dispatchEvent(new Event('aws:library-changed'))},
    removeFile(id){state.files=state.files.filter(f=>f.id!==id);scheduleSave();window.dispatchEvent(new Event('aws:library-changed'))},
    renderImportant,
    getDictionary(){return state.lexicon},
    addDictionaryEntry(record){const entry={id:uid(),word:String(record.word||'').slice(0,150),ipa:String(record.ipa||'').slice(0,200),meaning:String(record.meaning||'').slice(0,2000),era:String(record.era||'modern').slice(0,40),partOfSpeech:String(record.partOfSpeech||'').slice(0,100),notes:String(record.notes||'').slice(0,5000)};state.lexicon.push(entry);scheduleSave();window.dispatchEvent(new Event('aws:dictionary-changed'));return entry.id},
    updateDictionaryEntry(id,record){const entry=state.lexicon.find(x=>x.id===id);if(!entry)return;for(const k of ['word','ipa','meaning','era','partOfSpeech','notes'])if(Object.hasOwn(record,k))entry[k]=String(record[k]);scheduleSave();window.dispatchEvent(new Event('aws:dictionary-changed'))},
    deleteDictionaryEntry(id){state.lexicon=state.lexicon.filter(x=>x.id!==id);scheduleSave();window.dispatchEvent(new Event('aws:dictionary-changed'))},
    showTasks(){state.inspectorOpen=true;renderInspector();$('task-filter').value='all';renderTasks()},
    notify(message){toast(message)}
  };
  window.dispatchEvent(new Event('literaryfriend:api-ready'));
  async function init(){
    setupBindings();
    try{state=validateState((await store.readState())||initialState());if(seedExistingStudio(state))scheduleSave()}catch(e){state=initialState();toast('Started a new local library because saved data could not be loaded.')}
    fonts=await store.allFonts();
    for(const f of fonts){try{await loadFont(f)}catch(error){console.warn('Font could not be loaded:',f.name,error)}}
    renderAll();
    if(state.inspectorOpen!==true){renderInspector()}
    checkReminders();setInterval(checkReminders,20000);window.dispatchEvent(new Event('literaryfriend:ready'));
  }
  init().catch(err=>{console.error(err);toast('Initialization error: '+err.message)});
})();
