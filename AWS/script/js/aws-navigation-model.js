/* Workspace navigation repair. Original records are retained in backup data. */
(function(root){
  'use strict';
  const tools = [
    ['Language Rules & Orthography','rules',['Language Rules & Orthography']],
    ['Dictionary & Lexicon','dictionary',['Dictionary & Lexicon','Dictionary']],
    ['Pronunciation & TTS','tts',['Pronunciation & TTS']],
    ['Glyph Studio','glyph',['Glyph Studio']],
    ['Alphabet Evolution','glyph-evolution',['Alphabet Evolution']],
    ['Language Evolution Breakdown','language-evolution',['Language Evolution Breakdown']]
  ];
  const title = value => String(value || '').trim().replace(/\s+/g,' ').toLowerCase();
  const isLanguage = c => /^(?:(?:0?1)[\s.:)\-]+)?language(?:\s*\(0?1\))?$/i.test(String(c.name || '').trim());
  const hasWriting = c => ['html','leftHtml','rightHtml','notes'].some(k=>String(c[k]||'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim());
  function normalize(state, create){
    let changed=false;
    const archive = c => {
      state.navigationArchive ||= [];
      if(!state.navigationArchive.some(x=>x.id===c.id))state.navigationArchive.push(JSON.parse(JSON.stringify(c)));
    };
    function absorb(source,target){
      archive(source);
      for(const c of state.channels)if(c.parentId===source.id)c.parentId=target.id;
      if(hasWriting(source)){
        source.parentId=target.id;source.role='page';
        const base=source.name.replace(/^0?1[\s.:)\-]+/,'')+' notes';
        let name=base,n=2;
        while(state.channels.some(c=>c!==source&&c.workspaceId===source.workspaceId&&c.name===name))name=base+' ('+(n++)+')';
        source.name=name;
      }else{
        for(const collection of [state.tasks,state.important])for(const item of collection||[])if(item.channelId===source.id)item.channelId=target.id;
        for(const item of state.files||[])if(item.folderId===source.id)item.folderId=target.id;
        if(state.selectedChannelId===source.id)state.selectedChannelId=target.id;
        state.channels=state.channels.filter(c=>c!==source);
      }
      changed=true;
    }
    for(const ws of state.workspaces){
      const active=()=>state.channels.filter(c=>c.workspaceId===ws.id&&!c.deletedAt);
      const parents=active().filter(isLanguage);
      let parent=parents.find(c=>c.role==='section'&&!c.parentId&&title(c.name)==='language')||parents[0];
      if(!parent){parent=create(ws.id,'Language','document',null,'section');state.channels.push(parent);changed=true;}
      if(parent.name!=='Language'||parent.role!=='section'||parent.parentId){archive(parent);parent.name='Language';parent.role='section';parent.parentId=null;changed=true;}
      for(const duplicate of parents)if(duplicate!==parent)absorb(duplicate,parent);
      for(const [name,role,names] of tools){
        const candidates=active().filter(c=>c.role===role||(c.parentId===parent.id&&names.map(title).includes(title(c.name))));
        let canonical=candidates.find(c=>c.role===role&&c.parentId===parent.id)||candidates.find(c=>c.role===role)||candidates.find(c=>!hasWriting(c));
        if(!canonical){canonical=create(ws.id,name,'document',parent.id,role);state.channels.push(canonical);changed=true;}
        if(canonical.parentId!==parent.id||canonical.role!==role){archive(canonical);canonical.parentId=parent.id;canonical.role=role;changed=true;}
        for(const duplicate of candidates)if(duplicate!==canonical)absorb(duplicate,canonical);
      }
    }
    return changed;
  }
  const api={normalize,isLanguage};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AWSNavigationModel=api;
})(typeof window!=='undefined'?window:globalThis);
