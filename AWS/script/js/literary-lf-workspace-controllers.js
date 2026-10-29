(function(global){
'use strict';
const LF=global.LiteraryFriend,U=LF.util;
const C={
  async route({route}){
    if(!LF.services.identity?.authenticated?.())return;
    try{
      if(route==='characters')await this.characters();
      if(route==='world')await this.world();
      if(route==='timeline')await this.timeline();
      if(route==='languages')await this.languages();
      if(route==='organizer')await this.organizer();
      if(route==='editor')await this.editor();
      if(route==='art-studio')await this.art();
      if(route==='book-builder')await this.books();
      if(route==='publish')await this.publish();
      if(route==='settings')await this.settings();
    }catch(e){U.status(e.message,'error');}
  },
  async characters(query=''){
    const world=LF.get('world'),host=U.id('lf-character-results');if(!host)return;
    const items=query?await world.searchCharacters(query):await world.list({type:'character',limit:200});
    host.innerHTML=items.map(x=>`<article><button type="button" data-character-open="${U.escapeHTML(x.id)}"><strong>${U.escapeHTML(x.name||x.title||'Unnamed')}</strong></button><p>${U.escapeHTML(x.description||x.summary||'')}</p></article>`).join('')||'<p>No characters found.</p>';
  },
  async openCharacter(id){
    const d=await LF.get('world').characterDossier(id),host=U.id('lf-character-profile');if(!host)return;
    host.innerHTML=`<h2>${U.escapeHTML(d.entity.name||'Character')}</h2><p>${U.escapeHTML(d.entity.description||'')}</p><dl>${Object.entries(d.entity.metadata||{}).slice(0,30).map(([k,v])=>`<dt>${U.escapeHTML(k)}</dt><dd>${U.escapeHTML(typeof v==='object'?JSON.stringify(v):v)}</dd>`).join('')}</dl>`;
    const knowledge=U.id('lf-character-knowledge');if(knowledge)knowledge.innerHTML=`<h3>Knowledge & belief</h3>${d.knowledge.map(k=>`<p>${U.escapeHTML(k.fact||k.factText||k.value||'Fact')} — ${U.escapeHTML(k.beliefStatus||k.status||'')}</p>`).join('')}`;
    const scenes=U.id('lf-character-scenes');if(scenes)scenes.innerHTML=`<h3>Scene presence</h3>${d.mentions.map(m=>`<p>${U.escapeHTML(m.nodeTitle||m.sceneTitle||m.excerpt||m.text||'Mention')}</p>`).join('')}`;
  },
  async world(){
    const host=U.id('lf-world-entities');if(!host)return;const items=await LF.get('world').list({limit:300});
    host.innerHTML=`<form data-world-entity-form><label>Type <select name="type">${LF.get('world').entityTypes.map(t=>`<option>${t}</option>`).join('')}</select></label><label>Name <input name="name" required></label><label>Description <textarea name="description"></textarea></label><button type="submit">Save entity</button></form><div>${items.map(x=>`<article><strong>${U.escapeHTML(x.name||'Unnamed')}</strong><span>${U.escapeHTML(x.type||'')}</span><p>${U.escapeHTML(x.description||'')}</p><button type="button" data-entity-delete="${U.escapeHTML(x.id)}">Delete</button></article>`).join('')}</div>`;
  },
  async timeline(){
    const host=U.id('lf-timeline-events');if(!host)return;const items=await LF.get('timeline').list({limit:500});
    const ordered=LF.get('timeline').order(items,'world');
    host.innerHTML=`<form data-timeline-form><label>Event <input name="title" required></label><label>World start <input name="worldStart"></label><label>World end <input name="worldEnd"></label><label>Narrative order <input name="narrativeOrder" type="number"></label><label>Revelation order <input name="revelationOrder" type="number"></label><button type="submit">Save event</button></form><ol>${ordered.map(e=>`<li><strong>${U.escapeHTML(e.title||e.name||'Event')}</strong> <span>${U.escapeHTML(e.worldStart||'')}</span><button type="button" data-timeline-delete="${U.escapeHTML(e.id)}">Delete</button></li>`).join('')}</ol>`;
  },
  async languages(){
    const host=U.id('lf-language-list');if(!host)return;const langs=await LF.get('languages').list();
    host.innerHTML=`<form data-language-form><label>Name <input name="name" required></label><label>Code <input name="code"></label><label>Description <textarea name="description"></textarea></label><button type="submit">Create language</button></form><div>${langs.map(l=>`<article><button type="button" data-language-open="${U.escapeHTML(l.id)}"><strong>${U.escapeHTML(l.name||'Language')}</strong></button><span>${U.escapeHTML(l.code||'')}</span><button type="button" data-language-delete="${U.escapeHTML(l.id)}">Delete</button></article>`).join('')}</div>`;
  },
  async openLanguage(id){
    const lab=LF.get('languages'),[language,words]=await Promise.all([lab.get(id),lab.lexicon(id,{limit:500})]);const host=U.id('lf-language-editor');if(!host)return;
    const section=(name,data)=>`<details open><summary>${U.escapeHTML(name)}</summary><pre>${U.escapeHTML(JSON.stringify(data||{},null,2))}</pre></details>`;
    host.innerHTML=`<h2>${U.escapeHTML(language.name||'Language')}</h2>${section('Phonology',language.phonology)}${section('Orthography',language.orthography)}${section('Grammar',language.grammar)}${section('Morphology',language.morphology)}<section><h3>Lexicon</h3><form data-lexicon-form data-language-id="${U.escapeHTML(id)}"><label>Word <input name="word" required></label><label>Definition <input name="definition" required></label><label>Part of speech <input name="partOfSpeech"></label><button type="submit">Add word</button></form>${words.map(w=>`<p><strong>${U.escapeHTML(w.word||w.term||'')}</strong> — ${U.escapeHTML(w.definition||'')}</p>`).join('')}</section>`;
  },
  async organizer(){
    const o=LF.get('organizer'),[notes,folders,tags,deleted]=await Promise.all([o.notes({limit:100}),o.folders.list(),o.tags(),o.deleted()]);
    const n=U.id('lf-organizer-notes');if(n)n.innerHTML=`<h2>Notes</h2>${notes.map(x=>`<article><strong>${U.escapeHTML(x.title||'Note')}</strong><p>${U.escapeHTML(x.plainText||x.content||'')}</p><button data-note-delete="${U.escapeHTML(x.id)}" type="button">Delete</button></article>`).join('')}`;
    const f=U.id('lf-organizer-folders');if(f)f.innerHTML=`<h2>Folders</h2>${folders.map(x=>`<span>${U.escapeHTML(x.name||x.title||'Folder')}</span>`).join(' ')}`;
    const t=U.id('lf-organizer-tags');if(t)t.innerHTML=`<h2>Tags</h2>${tags.map(x=>`<span>${U.escapeHTML(x.name||x)}</span>`).join(' ')}`;
    const d=U.id('lf-organizer-deleted');if(d)d.innerHTML=`<h2>Recently deleted</h2>${deleted.map(x=>`<button type="button" data-note-restore="${U.escapeHTML(x.id)}">Restore ${U.escapeHTML(x.title||'note')}</button>`).join('')}`;
  },
  async editor(){
    const host=U.id('lf-editor-results');if(host&&!host.dataset.ready){host.dataset.ready='1';host.innerHTML='<p>Choose an editor specialty and scope. Results keep evidence and author decisions separate from automatic mutation.</p>';}
  },
  async art(){
    const toolbar=U.id('lf-art-toolbar');if(toolbar&&!toolbar.dataset.ready){const a=LF.get('art');toolbar.dataset.ready='1';toolbar.innerHTML=`<div role="group" aria-label="Brushes">${a.tools.brushes.map(x=>`<button type="button" data-art-tool="${x}">${U.escapeHTML(x)}</button>`).join('')}</div><div role="group" aria-label="Shapes">${a.tools.shapes.map(x=>`<button type="button" data-art-shape="${x}">${U.escapeHTML(x)}</button>`).join('')}</div><label>Upload art <input type="file" id="lf-art-upload" accept="image/*"></label><form data-art-ai-form><label>Image prompt <textarea name="prompt"></textarea></label><button type="submit">Generate image</button></form>`;}
    const list=await LF.get('art').list();const layers=U.id('lf-art-layers');if(layers)layers.innerHTML=`<h2>Saved art projects</h2>${list.map(x=>`<p>${U.escapeHTML(x.name||x.title||'Art')}</p>`).join('')}`;
  },
  async books(){
    const b=LF.get('books'),[formats,list]=await Promise.all([b.formats(),b.list()]);const host=U.id('lf-book-format');if(!host)return;
    const flat=Array.isArray(formats)?formats:[...(formats.paperback||[]).map(f=>({...f,binding:'paperback'})),...(formats.hardcover||[]).map(f=>({...f,binding:'hardcover'}))];
    host.innerHTML=`<form data-book-form><label>Book title <input name="title" required></label><label>Format <select name="formatId">${flat.map(f=>`<option value="${U.escapeHTML(f.id)}">${U.escapeHTML(f.name)} — ${f.widthIn||f.width} × ${f.heightIn||f.height}</option>`).join('')}</select></label><button type="submit">Create book setup</button></form><div>${list.map(x=>`<article><strong>${U.escapeHTML(x.title||x.name||'Book')}</strong><button type="button" data-book-open="${U.escapeHTML(x.id)}">Open</button></article>`).join('')}</div>`;
  },
  async publish(){
    const host=U.id('lf-export-history');if(host&&!host.dataset.ready){host.dataset.ready='1';host.innerHTML='<p>Exports and backups are generated from the active project without exposing backend implementation details.</p>';}
  },
  async settings(){
    const state=await LF.get('settings').load();
    const drive=U.id('lf-drive-settings');if(drive)drive.innerHTML=`<p>${state.drive?.linked||state.drive?.connected?'Google Drive linked.':'Google Drive is not linked.'}</p><button type="button" data-drive-action="start">Link Google Drive</button>${state.drive?.linked||state.drive?.connected?'<button type="button" data-drive-action="revoke">Disconnect Drive</button>':''}`;
    const sessions=U.id('lf-session-list');if(sessions)sessions.innerHTML=(state.sessions||[]).map(s=>`<article><strong>${U.escapeHTML(s.deviceName||'Device')}</strong><span>${U.escapeHTML(s.lastSeenAt||'')}</span><button type="button" data-session-revoke="${U.escapeHTML(s.id)}">Revoke</button></article>`).join('');
    const contacts=U.id('lf-recovery-contacts');if(contacts)contacts.innerHTML=`<form data-recovery-contact-form><label>Type <select name="kind"><option value="email">Email</option><option value="phone">Phone</option></select></label><label>Contact <input name="value" required></label><label>Label <input name="label"></label><button type="submit">Add recovery contact</button></form>${(state.contacts||[]).map(c=>`<p>${U.escapeHTML(c.label||c.kind)}: ${U.escapeHTML(c.value||'')} ${c.verified?'verified':'unverified'}</p>`).join('')}`;
  },
  bind(){
    LF.events.on('route:changed',r=>this.route(r));
    document.addEventListener('submit',e=>{
      const run=async()=>{
        if(e.target.matches('#lf-character-search-form')){e.preventDefault();return this.characters(U.id('lf-character-search')?.value||'');}
        if(e.target.matches('[data-world-entity-form]')){e.preventDefault();await LF.get('world').save(Object.fromEntries(new FormData(e.target)));return this.world();}
        if(e.target.matches('[data-timeline-form]')){e.preventDefault();await LF.get('timeline').save(Object.fromEntries(new FormData(e.target)));return this.timeline();}
        if(e.target.matches('[data-language-form]')){e.preventDefault();await LF.get('languages').save(LF.get('languages').profile(Object.fromEntries(new FormData(e.target))));return this.languages();}
        if(e.target.matches('[data-lexicon-form]')){e.preventDefault();await LF.get('languages').saveWord(e.target.dataset.languageId,Object.fromEntries(new FormData(e.target)));return this.openLanguage(e.target.dataset.languageId);}
        if(e.target.matches('#lf-quick-capture-form')){e.preventDefault();await LF.get('organizer').quickCapture(U.id('lf-quick-capture')?.value||'');U.id('lf-quick-capture').value='';return this.organizer();}
        if(e.target.matches('[data-art-ai-form]')){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const r=await LF.get('art').generate(d.prompt);U.status(r.message||'Image generation request completed.','success');return;}
        if(e.target.matches('[data-book-form]')){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));await LF.get('books').save(d);return this.books();}
        if(e.target.matches('[data-recovery-contact-form]')){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));await LF.services.identity.addRecoveryContact(d.kind,d.value,d.label);return this.settings();}
      };run().catch(err=>U.status(err.message,'error'));
    });
    document.addEventListener('click',e=>{
      const run=async()=>{
        let b;if((b=e.target.closest('[data-character-open]')))return this.openCharacter(b.dataset.characterOpen);
        if((b=e.target.closest('[data-entity-delete]'))){await LF.get('world').delete(b.dataset.entityDelete);return this.world();}
        if((b=e.target.closest('[data-timeline-delete]'))){await LF.get('timeline').delete(b.dataset.timelineDelete);return this.timeline();}
        if((b=e.target.closest('[data-language-open]')))return this.openLanguage(b.dataset.languageOpen);
        if((b=e.target.closest('[data-language-delete]'))){await LF.get('languages').delete(b.dataset.languageDelete);return this.languages();}
        if((b=e.target.closest('[data-note-delete]'))){await LF.get('organizer').delete(b.dataset.noteDelete);return this.organizer();}
        if((b=e.target.closest('[data-note-restore]'))){await LF.get('organizer').restore(b.dataset.noteRestore);return this.organizer();}
        if(e.target.id==='lf-editor-run'){const mode=U.id('lf-editor-mode').value,scope={type:U.id('lf-editor-scope').value};const r=await LF.get('editors').run(mode,scope);U.id('lf-editor-results').textContent=JSON.stringify(r,null,2);return;}
        if(e.target.id==='lf-export-project'){const r=await LF.get('publish').project();LF.get('publish').downloadResult(r);return;}
        if(e.target.id==='lf-backup-project'){await LF.get('publish').backup();return U.status('Backup complete.','success');}
        if((b=e.target.closest('[data-drive-action]'))){if(b.dataset.driveAction==='start'){const r=await LF.get('settings').driveStart();if(r.url||r.authUrl)global.open(r.url||r.authUrl,'_blank','noopener');}else await LF.get('settings').driveRevoke();return this.settings();}
        if((b=e.target.closest('[data-session-revoke]'))){await LF.services.identity.revokeSession(b.dataset.sessionRevoke);return this.settings();}
      };run().catch(err=>U.status(err.message,'error'));
    });
    document.addEventListener('change',e=>{if(e.target.id==='lf-art-upload'&&e.target.files?.[0])LF.get('art').uploadAsset(e.target.files[0]).then(()=>U.status('Artwork uploaded.','success')).catch(err=>U.status(err.message,'error'));});
  }
};
C.bind();LF.register('workspaceControllers',C);
})(window);
