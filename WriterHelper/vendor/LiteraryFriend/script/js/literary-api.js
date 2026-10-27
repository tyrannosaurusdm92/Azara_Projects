(function(global){
  'use strict';
  const LF=global.LF;
  const DEFAULT_ENDPOINT='https://script.google.com/macros/s/AKfycbyvpUn2_fADmOAOMqh1pHatTlegwZKYloWRPSSrM1kBkSwP2l5LzADQ7jKMr7TCJJP2/exec';
  const LIBRARY_URL='https://script.google.com/macros/library/d/1uq9wTJuIWNphZvGN_QGR3CGlBSWIRMhdD2i-PwcmHCJWTLOVoGKa_PyC/2';

  class ApiClient{
    constructor(){const S=global.LiteraryFriendStorage;this.endpoint=DEFAULT_ENDPOINT;this.libraryUrl=LIBRARY_URL;let sessionToken='';try{sessionToken=sessionStorage.getItem('literaryfriend.session.token.v2')||sessionStorage.getItem('literaryfriend.session.token')||sessionStorage.getItem('literaryfriend-book-token')||sessionStorage.getItem('lf.auth.token')||'';}catch(_){}this.token=sessionToken||S?.get('lf.auth.token')||'';this.user=LF.safeJsonParse(S?.get('lf.auth.user')||'null',null);this.online=navigator.onLine;this.queue=LF.safeJsonParse(S?.get('lf.sync.queue')||'[]',[]);this._mirrorSession();}
    _mirrorSession(){try{const keys=['literaryfriend.session.token.v2','literaryfriend.session.token','literaryfriend-book-token','lf.auth.token'];for(const key of keys)this.token?sessionStorage.setItem(key,this.token):sessionStorage.removeItem(key);}catch(_){}}
    setToken(token,user){this.token=String(token||'');if(user!==undefined)this.user=user||null;this._mirrorSession();return this.token;}
    saveAuth(){const S=global.LiteraryFriendStorage;this._mirrorSession();if(this.token&&S?.get('lf.auth.token'))S?.set('lf.auth.token',this.token);else if(!this.token)S?.remove('lf.auth.token');if(this.user)S?.set('lf.auth.user',JSON.stringify(this.user));else S?.remove('lf.auth.user');}
    async request(action,data={},opts={}){
      const body={action,data,token:opts.token===undefined?this.token:opts.token,client:{name:'LiteraryFriend',version:LF.VERSION,platform:navigator.platform||''}};
      const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),opts.timeout||20000);
      try{
        const res=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),signal:controller.signal,redirect:'follow'});
        const text=await res.text(); const json=LF.safeJsonParse(text,{ok:false,error:{message:text||`HTTP ${res.status}`}});
        if(!res.ok||json.ok===false) throw new Error(json.error?.message||json.message||`LiteraryFriend backend error ${res.status}`);
        if(json.token){this.token=String(json.token);this._mirrorSession();}if(json.user)this.user=json.user;
        this.online=true; LF.events.emit('api:online',json); return json;
      } catch(err){ this.online=false; LF.events.emit('api:offline',err); throw err; } finally{clearTimeout(timer);}
    }
    async health(){ try{ const res=await fetch(`${this.endpoint}?action=health`,{cache:'no-store'}); return await res.json(); }catch(err){throw err;} }
    async login(email,password){ const r=await this.request('auth.login',{email,password},{token:''}); this.token=r.token||r.session?.token||''; this.user=r.user||r.session?.user||null; this.saveAuth(); return r; }
    async register(data){ const r=await this.request('auth.register',data,{token:''}); if(r.token){this.token=r.token;this.user=r.user||null;this.saveAuth();} return r; }
    async me(){const r=await this.request('auth.me');this.user=r.user||this.user;this.saveAuth();return r;}
    async logout(){try{if(this.token)await this.request('auth.logout');}catch(_){}this.token='';this.user=null;this.saveAuth();}
    queueAction(action,data){this.queue.push({id:LF.uid('sync'),action,data,createdAt:LF.now(),tries:0});global.LiteraryFriendStorage?.set('lf.sync.queue',JSON.stringify(this.queue));LF.events.emit('sync:queue',this.queue.length);}
    async flushQueue(){ if(!this.token||!navigator.onLine||!this.queue.length)return {sent:0,remaining:this.queue.length}; let sent=0; const remain=[]; for(const item of this.queue){try{await this.request(item.action,item.data);sent++;}catch(err){item.tries=(item.tries||0)+1;item.lastError=err.message;remain.push(item);}} this.queue=remain;global.LiteraryFriendStorage?.set('lf.sync.queue',JSON.stringify(remain));return{sent,remaining:remain.length};}
    async pushRecord(rec){
      if(!this.token)throw new Error('Sign in to sync.'); let action,data;
      if(rec.type==='project'){action=rec.backendId?'projects.update':'projects.create';data={id:rec.backendId,title:rec.title,type:rec.projectType||'other',description:rec.description||'',status:rec.status||'active',metadata:{localId:rec.id,wordGoal:rec.wordGoal||0},settings:rec.settings||{}};}
      else if(rec.type==='document'){action='nodes.save';data={id:rec.backendId,projectId:await this.backendProjectId(rec.projectId),nodeType:rec.docType||'document',title:rec.title,content:rec.content||'',plainText:LF.stripHtml(rec.content||''),sortOrder:rec.sortOrder||0,tags:rec.tags||[],links:rec.links||[],metadata:{localId:rec.id,...(rec.metadata||{})}};}
      else if(rec.type==='note'){action='notes.save';data={id:rec.backendId,projectId:rec.projectId?await this.backendProjectId(rec.projectId):'',title:rec.title,content:rec.locked?JSON.stringify({literaryFriendEncrypted:rec.encrypted||null}):(rec.content||''),plainText:rec.locked?'Encrypted LiteraryFriend note':LF.stripHtml(rec.content||''),format:rec.locked?'encrypted-json':'html',folderId:rec.folderId||'',tags:rec.tags||[],pinned:!!rec.pinned,locked:!!rec.locked,metadata:{localId:rec.id,noteType:rec.noteType||'note',encrypted:!!rec.locked,...(rec.metadata||{})}};}
      else if(rec.type==='entity'){action='entities.save';data={id:rec.backendId,projectId:await this.backendProjectId(rec.projectId),entityType:rec.entityType||'other',name:rec.name,aliases:rec.aliases||[],description:rec.description||'',attributes:rec.attributes||{},relationships:rec.relationships||[],tags:rec.tags||[]};}
      else if(rec.type==='timeline'){action='timeline.save';data={id:rec.backendId,projectId:await this.backendProjectId(rec.projectId),title:rec.title,startValue:rec.startValue||rec.dateLabel||'',endValue:rec.endValue||'',sortKey:rec.sortOrder||0,description:rec.description||'',participantIds:rec.participantIds||rec.participants||[],locationIds:rec.locationIds||[],tags:rec.tags||[],metadata:{dateLabel:rec.dateLabel||'',...(rec.metadata||{})}};}
      else if(rec.type==='plotIssue'){action='plotissues.save';data={id:rec.backendId,projectId:await this.backendProjectId(rec.projectId),title:rec.title,issueType:rec.issueType||'continuity',severity:rec.severity||'medium',status:rec.status||'open',description:rec.description||'',relatedIds:rec.relatedIds||[],tags:rec.tags||[],metadata:rec.metadata||{}};}
      else if(rec.type==='language'){action='languages.save';data={id:rec.backendId,projectId:await this.backendProjectId(rec.projectId),name:rec.name,description:rec.description||'',rules:rec.rules||{},metadata:rec.metadata||{}};}
      else if(rec.type==='lexicon'){action='lexicon.save';data={id:rec.backendId,projectId:await this.backendProjectId(rec.projectId),languageId:rec.languageBackendId||'',term:rec.term,meaning:rec.meaning||'',pronunciation:rec.pronunciation||'',partOfSpeech:rec.partOfSpeech||'',notes:rec.notes||'',tags:rec.tags||[]};}
      else return rec;
      try{const r=await this.request(action,data);const remote=r.project||r.node||r.note||r.entity||r.event||r.issue||r.language||r.entry;const backendId=remote?.id||rec.backendId;if(backendId&&!rec.backendId)rec=await LF.store.put({...rec,backendId,lastSyncedAt:LF.now()});else rec=await LF.store.put({...rec,lastSyncedAt:LF.now()});return rec;}catch(err){this.queueAction(action,data);throw err;}
    }
    async backendProjectId(localId){const p=await LF.store.get('project',localId);if(!p)throw new Error('Project not found.');if(p.backendId)return p.backendId;const pushed=await this.pushRecord(p);return pushed.backendId;}
    async uploadAttachment(row){ if(!this.token)throw new Error('Sign in to sync attachments.'); const b=await LF.store.getBlob(row.blobId||row.id); if(!b?.blob)throw new Error('Attachment data is not available.'); const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=()=>reject(r.error);r.readAsDataURL(b.blob);}); const data={projectId:row.projectId?await this.backendProjectId(row.projectId):'',ownerType:row.ownerType||'',ownerId:row.ownerBackendId||'',name:row.name,mimeType:row.mimeType,base64,description:row.description||'',metadata:{localId:row.id}};return this.request('attachments.upload',data); }
  }
  LF.api=new ApiClient();
  LF.API_CONFIG={endpoint:DEFAULT_ENDPOINT,libraryUrl:LIBRARY_URL};
})(window);
