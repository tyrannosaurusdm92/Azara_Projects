/* Writer Helper Ready consolidated module: helper-memory.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-session-memory.js | sha256:82815a3bd32ef7a0e2603add3644defd4766602074480fd5520fb545e0030b73 ===== */
/* Writer Tools — lightweight local session turn memory. */
(function(global){'use strict';
class WriterToolsSessionMemory{constructor({maxTurns=80,storage=null,key='writer-tools-session-v2',persist=true}={}){this.maxTurns=maxTurns;if(storage===null){try{storage=global.localStorage}catch(_){storage=null}}this.storage=storage;this.key=key;this.persist=persist;this.turns=[];if(persist)this.load();}add(turn){this.turns.push({...turn,at:turn?.at||new Date().toISOString()});this.turns=this.turns.slice(-this.maxTurns);this.save();return this.turns.at(-1);}recent(n=12){return this.turns.slice(-n);}clear(){this.turns=[];this.save();}save(){if(this.persist&&this.storage)try{this.storage.setItem(this.key,JSON.stringify(this.turns))}catch(_){}}load(){if(this.storage)try{const v=JSON.parse(this.storage.getItem(this.key)||'[]');if(Array.isArray(v))this.turns=v.slice(-this.maxTurns)}catch(_){}return this.turns;}}
global.WriterToolsSessionMemory=WriterToolsSessionMemory;
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-session-memory.js ===== */

/* ===== BEGIN SOURCE: writer-continuity-memory.js | sha256:88827389f2ff8ce62d5833dcf16f7b5f0527037a8f1da42a7be55170387d358c ===== */
/* Writer Tools — continuity memory for story facts, choices, and unresolved threads. */
(function(global){'use strict';const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
class WriterToolsContinuityMemory{
 constructor(seed={}){this.state={stories:{},facts:[],...clone(seed)}}
 story(key='story'){if(!this.state.stories[key])this.state.stories[key]={seriesKey:key,choices:[],chapters:[],qualities:{},flags:{},notes:[],continuityUpdates:[],unresolvedThreads:[],dialogueThreads:[],writerStyleSnapshots:[],peopleDetails:{},callbacks:[],updatedAt:new Date().toISOString()};return this.state.stories[key];}
 rememberFact(fact,meta={}){const item={id:meta.id||`fact-${Math.random().toString(36).slice(2)}`,fact:String(fact),tags:meta.tags||[],seriesKey:meta.seriesKey||null,createdAt:new Date().toISOString()};this.state.facts.push(item);return clone(item);}
 recall(query='',limit=20){const terms=String(query).toLowerCase().split(/\W+/).filter(Boolean);return this.state.facts.map(item=>({item,score:terms.reduce((n,t)=>n+(item.fact.toLowerCase().includes(t)?1:0)+((item.tags||[]).some(x=>String(x).toLowerCase().includes(t))?2:0),0)})).sort((a,b)=>b.score-a.score).filter(x=>x.score||!terms.length).slice(0,limit).map(x=>clone(x.item));}
 rememberChoice(key,choice){const s=this.story(key);s.choices.push({...clone(choice),at:new Date().toISOString()});for(const [k,v] of Object.entries(choice?.effect||{}))s.qualities[k]=typeof v==='number'?(Number(s.qualities[k])||0)+v:v;s.choices=s.choices.slice(-200);s.updatedAt=new Date().toISOString();return clone(s);}
 rememberChapter(key,chapter={}){const s=this.story(key);const item={id:chapter.id||null,chapter_number:chapter.chapter_number||null,title:chapter.title||'',generated:Boolean(chapter.generated),relationship_stage:chapter.chapter_writer_context?.relationship_stage||chapter.continuity_snapshot?.relationship_stage||null,ending:String(chapter.content||'').slice(-3000),continuity_snapshot:clone(chapter.continuity_snapshot||{}),writer_reference:clone(chapter.writer_reference||{}),path_variants:clone(chapter.path_variants||{}),fade_to_black_eligibility:clone(chapter.fade_to_black_eligibility||{}),choices:(chapter.choices||[]).map(c=>({id:c.id,label:c.label,path_key:c.path_key,target:c.target,effect:clone(c.effect||{}),generation_hint:c.generation_hint||'',writer_reference_query:c.writer_reference_query||'',memory_requirements:clone(c.memory_requirements||[])}))};const i=s.chapters.findIndex(x=>x.id&&x.id===item.id);if(i>=0)s.chapters[i]=item;else s.chapters.push(item);s.chapters=s.chapters.slice(-100);if(chapter.continuity_updates)s.continuityUpdates.push({chapterId:item.id,updates:clone(chapter.continuity_updates)});if(chapter.unresolved_threads)s.unresolvedThreads=[...new Set([...(s.unresolvedThreads||[]),...chapter.unresolved_threads])];if(chapter.continuity_snapshot?.closing_anchor)s.notes.push({type:'closing-anchor',chapterId:item.id,text:chapter.continuity_snapshot.closing_anchor});s.notes=s.notes.slice(-120);s.updatedAt=new Date().toISOString();return clone(item);}
 snapshot(){return clone(this.state);} load(seed={}){this.state={stories:{},facts:[],...clone(seed)};return this;}
}
global.WriterToolsContinuityMemory=WriterToolsContinuityMemory;
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-continuity-memory.js ===== */

/* ===== BEGIN SOURCE: writer-memory.js | sha256:bb16e2802bb1de73633501469e8bfc53156f04ff9226f90cecd072606ff51284 ===== */
(function () {
  'use strict';
/**
 * Consolidated story-writing module generated from the user's supplied JavaScript package.
 * Source concepts preserved and refactored for a smaller five-file writing system.
 * No network backend is hard-coded here; callers may send generated request objects to their own backend.
 */

const GLOBAL = typeof globalThis !== 'undefined' ? globalThis : window;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
const asArray = value => Array.isArray(value) ? value : value == null ? [] : [value];
const words = text => String(text || '').toLowerCase().match(/\b[\w’'-]+\b/g) || [];

class SessionMemory {
  constructor({maxTurns=24,persist=false,storage=null,key='writer-session'}={}) {
    this.maxTurns=Math.max(1,Number(maxTurns)||24); this.persist=Boolean(persist); this.storage=storage || (typeof localStorage!=='undefined'?localStorage:null); this.key=key; this.turns=[];
    if(this.persist) this.load();
  }
  add(role,text,meta={}){ this.turns.push({id:meta.id||uid('turn'),role:String(role||'user'),text:String(text||'').slice(0,24000),meta:clone(meta),at:meta.at||now()}); this.turns=this.turns.slice(-this.maxTurns); this.save(); return this.turns.at(-1); }
  clear(){ this.turns=[]; if(this.storage) try{this.storage.removeItem(this.key)}catch{} return this; }
  save(){ if(this.persist&&this.storage) try{this.storage.setItem(this.key,JSON.stringify(this.turns))}catch{} return this; }
  load(){ if(this.storage) try{const v=JSON.parse(this.storage.getItem(this.key)||'[]'); if(Array.isArray(v))this.turns=v.slice(-this.maxTurns)}catch{} return this; }
  context(limit=this.maxTurns){ return this.turns.slice(-limit).map(t=>({role:t.role,content:t.text,meta:clone(t.meta)})); }
}

class WriterMemory {
  constructor(seed={}){
    this.state={
      schema:'writer.memory.v2', project:{}, stories:{}, characters:{}, locations:{}, factions:{}, items:{}, relationships:{},
      chapters:{}, scenes:{}, beats:{}, promises:{}, callbacks:{}, facts:[], notes:[], revisions:[], preferences:{}, ...clone(seed)
    };
    this._ensure();
  }
  _ensure(){ for(const k of ['stories','characters','locations','factions','items','relationships','chapters','scenes','beats','promises','callbacks','preferences']) if(!this.state[k]||Array.isArray(this.state[k]))this.state[k]={}; for(const k of ['facts','notes','revisions']) if(!Array.isArray(this.state[k]))this.state[k]=[]; return this; }
  upsert(bucket,id,value={}){ this._ensure(); if(!this.state[bucket]||Array.isArray(this.state[bucket]))this.state[bucket]={}; const key=String(id||value.id||uid(bucket)); const prev=this.state[bucket][key]||{}; this.state[bucket][key]={...prev,...clone(value),id:key,updatedAt:now(),createdAt:prev.createdAt||value.createdAt||now()}; return clone(this.state[bucket][key]); }
  remove(bucket,id){ if(this.state[bucket]&&!Array.isArray(this.state[bucket])) delete this.state[bucket][id]; return this; }
  remember(fact,meta={}){ const item={id:meta.id||uid('fact'),fact:String(fact||'').trim(),tags:asArray(meta.tags).map(String),scope:meta.scope||'general',storyId:meta.storyId||null,chapterId:meta.chapterId||null,sceneId:meta.sceneId||null,characterIds:asArray(meta.characterIds),confidence:meta.confidence==null?1:Number(meta.confidence),source:meta.source||'writer',createdAt:meta.createdAt||now(),updatedAt:now()}; if(item.fact)this.state.facts.push(item); return clone(item); }
  note(text,meta={}){ const item={id:meta.id||uid('note'),text:String(text||''),kind:meta.kind||'note',tags:asArray(meta.tags),createdAt:now(),...clone(meta)}; this.state.notes.push(item); return clone(item); }
  rememberCharacter(character){ const id=character.id||character.characterId||uid('character'); return this.upsert('characters',id,{...character,id}); }
  rememberScene(scene){ const id=scene.id||scene.sceneId||uid('scene'); const row=this.upsert('scenes',id,{...scene,id}); for(const fact of asArray(scene.facts))this.remember(typeof fact==='string'?fact:fact.fact||JSON.stringify(fact),{scope:'scene',sceneId:id,storyId:scene.storyId,chapterId:scene.chapterId,tags:fact.tags||[]}); return row; }
  rememberPromise(promise){ const id=promise.id||uid('promise'); return this.upsert('promises',id,{status:'open',introducedAt:now(),...promise,id}); }
  resolvePromise(id,resolution={}){ const current=this.state.promises[id]||{id}; return this.upsert('promises',id,{...current,status:'resolved',resolution:clone(resolution),resolvedAt:now()}); }
  addRelationship(a,b,type,meta={}){ const ids=[String(a),String(b)].sort(); const id=meta.id||`${ids[0]}__${type||'related'}__${ids[1]}`; return this.upsert('relationships',id,{from:String(a),to:String(b),type:type||'related',...meta,id}); }
  recall(query='',options={}){
    const terms=words(query).filter(Boolean); const limit=Math.max(1,Number(options.limit||30)); const scope=options.scope||null;
    const pool=[...this.state.facts.map(x=>({...x,_bucket:'facts',_text:x.fact})),...this.state.notes.map(x=>({...x,_bucket:'notes',_text:x.text}))];
    for(const bucket of ['characters','locations','factions','items','relationships','chapters','scenes','beats','promises','callbacks']) for(const value of Object.values(this.state[bucket]||{})) pool.push({...value,_bucket:bucket,_text:JSON.stringify(value)});
    return pool.map(item=>{ const hay=String(item._text||'').toLowerCase(); const tags=asArray(item.tags).map(v=>String(v).toLowerCase()); let score=terms.reduce((n,t)=>n+(hay.includes(t)?1:0)+(tags.some(tag=>tag.includes(t))?2:0),0); if(options.storyId&&item.storyId===options.storyId)score+=2; if(options.characterId&&asArray(item.characterIds).includes(options.characterId))score+=3; return {item,score}; }).filter(r=>(!scope||r.item.scope===scope||r.item._bucket===scope)&&(r.score||!terms.length)).sort((a,b)=>b.score-a.score).slice(0,limit).map(r=>clone(r.item));
  }
  buildContext(query='',options={}){
    const recalled=this.recall(query,options); return {project:clone(this.state.project),preferences:clone(this.state.preferences),recalled,openPromises:Object.values(this.state.promises).filter(p=>p.status!=='resolved'),recentScenes:Object.values(this.state.scenes).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,options.recentSceneLimit||8)};
  }
  merge(snapshot={}){ const other=new WriterMemory(snapshot); for(const bucket of ['stories','characters','locations','factions','items','relationships','chapters','scenes','beats','promises','callbacks','preferences']) Object.assign(this.state[bucket],clone(other.state[bucket]||{})); for(const bucket of ['facts','notes','revisions']){ const seen=new Set(this.state[bucket].map(x=>x.id)); for(const item of other.state[bucket]||[]) if(!seen.has(item.id))this.state[bucket].push(clone(item)); } return this; }
  snapshot(){ return clone(this.state); }
  load(snapshot){ this.state=clone(snapshot||{}); this._ensure(); return this; }
  serialize(){ return JSON.stringify(this.snapshot()); }
  static deserialize(text){ return new WriterMemory(JSON.parse(String(text||'{}'))); }
  save(storage,key='writer-memory'){ const target=storage||(typeof localStorage!=='undefined'?localStorage:null); if(target)target.setItem(key,this.serialize()); return this; }
  static fromStorage(storage,key='writer-memory'){ const target=storage||(typeof localStorage!=='undefined'?localStorage:null); if(!target)return new WriterMemory(); try{return WriterMemory.deserialize(target.getItem(key)||'{}')}catch{return new WriterMemory()} }
}

class MemoryEngine extends WriterMemory {
  constructor(seed={}){ super(seed); }
}

class WriterMemoryHub {
  constructor(options={}){ this.longTerm=options.longTerm instanceof WriterMemory?options.longTerm:new WriterMemory(options.seed||{}); this.session=options.session instanceof SessionMemory?options.session:new SessionMemory(options.sessionOptions||{}); }
  addTurn(role,text,meta={}){ return this.session.add(role,text,meta); }
  remember(fact,meta={}){ return this.longTerm.remember(fact,meta); }
  context(query='',options={}){ return {session:this.session.context(options.turns||12),memory:this.longTerm.buildContext(query,options)}; }
  snapshot(){ return {longTerm:this.longTerm.snapshot(),session:clone(this.session.turns)}; }
}

const WriterMemoryAPI=Object.freeze({SessionMemory,WriterMemory,MemoryEngine,WriterMemoryHub});
GLOBAL.StoryTools=GLOBAL.StoryTools||{}; GLOBAL.StoryTools.WriterMemory=WriterMemoryAPI;


/* Consolidation provenance:
 * - memory-engine.js
 * - session-memory.js
 * - persona-manager.js
 * - persona-agents--dialogue-context.js
 */


/* ===== Writer project-memory extensions ===== */
class WriterProjectMemory extends WriterMemory {
  constructor(seed={}){
    super(seed);
    this.state.viewpoint=this.state.viewpoint||{};
    this.state.relationshipPreferences=this.state.relationshipPreferences||{};
    this.state.boundaryHistory=this.state.boundaryHistory||[];
    this.state.voiceHistory=this.state.voiceHistory||{};
    this.state.choiceHistory=this.state.choiceHistory||[];
    this.state.peopleDetails=this.state.peopleDetails||{};
    this.state.surpriseSeeds=this.state.surpriseSeeds||[];
    this.state.styleContinuity=this.state.styleContinuity||[];
    this.state.sceneFingerprints=this.state.sceneFingerprints||[];
    this.state.dialogueThreads=this.state.dialogueThreads||[];
  }
  rememberPreference(key,value){this.state.preferences[String(key)]=clone(value);return this;}
  rememberViewpoint(profile={}){this.state.viewpoint={...this.state.viewpoint,...clone(profile)};return clone(this.state.viewpoint);}
  rememberChoice(choice={}){this.state.choiceHistory.push({...clone(choice),at:now()});this.state.choiceHistory=this.state.choiceHistory.slice(-200);return this;}
  rememberVoice(characterId,notes={}){const key=String(characterId||'character');this.state.voiceHistory[key]={...(this.state.voiceHistory[key]||{}),...clone(notes),updatedAt:now()};return clone(this.state.voiceHistory[key]);}
  rememberPeopleDetail(id,detail){const key=String(id||'person');const list=this.state.peopleDetails[key]||(this.state.peopleDetails[key]=[]);list.push({detail:clone(detail),at:now()});this.state.peopleDetails[key]=list.slice(-80);return this;}
  addSurpriseSeed(seed){this.state.surpriseSeeds.push({id:uid('surprise'),...clone(typeof seed==='object'?seed:{text:String(seed||'')}),at:now()});this.state.surpriseSeeds=this.state.surpriseSeeds.slice(-100);return this;}
}
class CallbackTracker{
  constructor(memory){this.memory=memory;}
  add(text,meta={}){const id=meta.id||uid('callback');this.memory.upsert('callbacks',id,{id,text:String(text||''),status:'open',...clone(meta)});return id;}
  resolve(id,resolution={}){return this.memory.upsert('callbacks',id,{...(this.memory.state.callbacks[id]||{}),status:'resolved',resolution:clone(resolution),resolvedAt:now()});}
  open(limit=20){return Object.values(this.memory.state.callbacks||{}).filter(x=>x.status!=='resolved').slice(-limit).map(clone);}
}
function createDefaultWriterMemory(seed={}){const m=new WriterProjectMemory(seed);m.rememberPreference('character_specific_voice',true);m.rememberPreference('preserve_project_voice',true);m.rememberPreference('specific_feedback_over_generic_praise',true);m.rememberPreference('remember_recurring_details',true);m.rememberPreference('use_details_for_callbacks',true);m.rememberPreference('repair_continuity_after_conflict',true);m.rememberPreference('fade_to_black_for_sexual_escalation',true);return m;}
GLOBAL.StoryTools=GLOBAL.StoryTools||{};
GLOBAL.StoryTools.WriterMemory=Object.freeze({SessionMemory,WriterMemory,MemoryEngine,WriterMemoryHub,WriterProjectMemory,CallbackTracker,createDefaultWriterMemory});

})();

/* ===== END SOURCE: writer-memory.js ===== */

if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
