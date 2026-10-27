(function (global) {
  'use strict';
  const LF=global.LF;

  class Store {
    constructor(){ this.db=null; this.name='LiteraryFriendDB'; this.version=4; this.cache=new Map(); }
    async open(){
      if(this.db) return this.db;
      this.db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open(this.name,this.version);
        req.onupgradeneeded=e=>{
          const db=e.target.result;
          if(!db.objectStoreNames.contains('records')){
            const s=db.createObjectStore('records',{keyPath:'key'}); s.createIndex('type','type',{unique:false}); s.createIndex('projectId','projectId',{unique:false}); s.createIndex('updatedAt','updatedAt',{unique:false}); s.createIndex('deletedAt','deletedAt',{unique:false});
          }
          if(!db.objectStoreNames.contains('blobs')){ const s=db.createObjectStore('blobs',{keyPath:'id'}); s.createIndex('ownerId','ownerId',{unique:false}); s.createIndex('projectId','projectId',{unique:false}); }
          if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta',{keyPath:'key'});
        };
        req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
      });
      return this.db;
    }
    tx(store,mode='readonly'){ return this.db.transaction(store,mode).objectStore(store); }
    async request(req){ return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}); }
    async put(record){ await this.open(); const now=LF.now(); const rec={...record}; rec.id=rec.id||LF.uid(rec.type||'record'); rec.key=rec.key||`${rec.type}:${rec.id}`; rec.createdAt=rec.createdAt||now; rec.updatedAt=now; await this.request(this.tx('records','readwrite').put(rec)); this.cache.set(rec.key,rec); LF.events.emit('store:put',rec); return rec; }
    async putMany(records){ await this.open(); return Promise.all(records.map(r=>this.put(r))); }
    async get(type,id){ await this.open(); const key=`${type}:${id}`; if(this.cache.has(key)) return this.cache.get(key); const rec=await this.request(this.tx('records').get(key)); if(rec)this.cache.set(key,rec); return rec||null; }
    async getKey(key){ await this.open(); if(this.cache.has(key))return this.cache.get(key); const rec=await this.request(this.tx('records').get(key)); if(rec)this.cache.set(key,rec); return rec||null; }
    async list(type,{projectId,includeDeleted=false,sort='updated-desc',filter}={}){
      await this.open(); const all=await this.request(this.tx('records').index('type').getAll(type));
      let rows=all.filter(r=>(projectId===undefined||r.projectId===projectId)&&(includeDeleted||!r.deletedAt)); if(filter)rows=rows.filter(filter);
      const sorters={
        'updated-desc':(a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)),
        'updated-asc':(a,b)=>String(a.updatedAt).localeCompare(String(b.updatedAt)),
        'created-desc':(a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)),
        'title-asc':(a,b)=>String(a.title||a.name||'').localeCompare(String(b.title||b.name||'')),
        'order':(a,b)=>(Number(a.sortOrder||0)-Number(b.sortOrder||0))||String(a.title||'').localeCompare(String(b.title||''))
      }; rows.sort(sorters[sort]||sorters['updated-desc']); return rows;
    }
    async all({includeDeleted=false}={}){ await this.open(); const rows=await this.request(this.tx('records').getAll()); return includeDeleted?rows:rows.filter(r=>!r.deletedAt); }
    async softDelete(type,id){ const rec=await this.get(type,id); if(!rec)return null; return this.put({...rec,deletedAt:LF.now()}); }
    async restore(type,id){ const rec=await this.get(type,id); if(!rec)return null; const copy={...rec}; delete copy.deletedAt; return this.put(copy); }
    async hardDelete(type,id){ await this.open(); const key=`${type}:${id}`; await this.request(this.tx('records','readwrite').delete(key)); this.cache.delete(key); LF.events.emit('store:delete',{type,id,key}); }
    async putBlob({id=LF.uid('attachment'),ownerId='',projectId='',name='attachment',mimeType='application/octet-stream',blob,metadata={}}){ await this.open(); const row={id,ownerId,projectId,name,mimeType,blob,size:blob?.size||0,metadata,createdAt:LF.now()}; await this.request(this.tx('blobs','readwrite').put(row)); LF.events.emit('blob:put',row); return row; }
    async getBlob(id){ await this.open(); return (await this.request(this.tx('blobs').get(id)))||null; }
    async listBlobs(ownerId){ await this.open(); return await this.request(this.tx('blobs').index('ownerId').getAll(ownerId)); }
    async deleteBlob(id){ await this.open(); await this.request(this.tx('blobs','readwrite').delete(id)); }
    async metaGet(key,fallback=null){ await this.open(); const row=await this.request(this.tx('meta').get(key)); return row?row.value:fallback; }
    async metaSet(key,value){ await this.open(); await this.request(this.tx('meta','readwrite').put({key,value,updatedAt:LF.now()})); return value; }
    async clearAll(){ await this.open(); await Promise.all(['records','blobs','meta'].map(s=>this.request(this.tx(s,'readwrite').clear()))); this.cache.clear(); }
    async exportAll(){
      const records=await this.all({includeDeleted:true}); const meta={settings:await this.metaGet('settings',LF.defaults.settings),activeProjectId:await this.metaGet('activeProjectId','')};
      return {format:'literaryfriend-export/v1',version:LF.VERSION,exportedAt:LF.now(),meta,records};
    }
    async importAll(pack,{merge=true}={}){
      if(!pack||!Array.isArray(pack.records)) throw new Error('Not a LiteraryFriend export.'); if(!merge)await this.clearAll();
      for(const rec of pack.records) await this.put({...rec,updatedAt:rec.updatedAt||LF.now()});
      if(pack.meta?.settings)await this.metaSet('settings',LF.deepMerge(LF.defaults.settings,pack.meta.settings)); if(pack.meta?.activeProjectId)await this.metaSet('activeProjectId',pack.meta.activeProjectId); return pack.records.length;
    }
    async seed(){
      const seeded=await this.metaGet('seeded',false); if(seeded)return;
      const project=await this.put({type:'project',id:LF.uid('project'),title:'My Writing Desk',projectType:'novel',description:'A flexible space for drafts, notes, research, and story planning.',status:'active',wordGoal:80000});
      const welcome=await this.put({type:'document',projectId:project.id,docType:'note',title:'Welcome to LiteraryFriend',content:`<h1>Welcome to LiteraryFriend</h1><p>This workspace is built for writers first. Capture a thought, draft a scene, plan a novel, build a character, keep research beside the manuscript, or use the revision and continuity tools to interrogate a draft.</p><h2>Try these first</h2><ul><li>Create a project from <strong>Projects</strong>.</li><li>Use <strong>Manuscript</strong> for chapters and scenes.</li><li>Keep fast ideas in <strong>Notes &amp; Journal</strong>.</li><li>Open <strong>Literary Assistant</strong> to search the local writing and research corpus.</li></ul>`,tags:['welcome'],pinned:true,sortOrder:0});
      await this.put({type:'note',projectId:project.id,noteType:'journal',title:`Writer's Log — ${new Date().toLocaleDateString()}`,content:'<p>What are you writing today?</p>',tags:['journal','writing-log'],pinned:false});
      await this.put({type:'entity',projectId:project.id,entityType:'character',name:'Example Character',description:'Replace this example with one of your own characters.',attributes:{role:'Protagonist',want:'',need:'',voice:'',arc:''},tags:['example']});
      await this.metaSet('activeProjectId',project.id); await this.metaSet('seeded',true); LF.events.emit('store:seeded',{project,welcome});
    }
  }

  LF.store=new Store();
})(window);
