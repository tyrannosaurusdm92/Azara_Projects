/* Aza'ra Eight-Axis Covenant — 8 independent scores, five exact phases and 81 sealed names. */
(function(){
'use strict';
const canonical=window.AZARA_ALIGNMENT_CANON;
if(!canonical||canonical.catalog.length!==81)throw new Error('Eight-axis canonical roster missing');
const axes=Object.freeze(canonical.axes.map(a=>a.id)),catalog=new Map(canonical.catalog.map(a=>[a.key,a]));
const storageKey='belavados.8axis.covenant.v1',neutral=()=>Object.fromEntries(axes.map(a=>[a,1500]));
let store={version:1,records:{}};
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&saved.version===1&&saved.records&&typeof saved.records==='object')store=saved;}catch(_){}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalizeScores(src,strict=false){
 const input=(src&&typeof src==='object')?(src.scores||src.axisScores||src.alignmentAxes||src.axes||src):{};
 const scores=neutral();
 for(const axis of axes){
  const n=input[axis]??input[axis[0].toUpperCase()+axis.slice(1)];
  if(n==null)continue;
  if(!Number.isFinite(Number(n))||(strict&&(!Number.isInteger(Number(n))||Number(n)<0||Number(n)>3000)))throw new RangeError('Invalid '+axis+' score');
  scores[axis]=Math.max(0,Math.min(3000,Math.round(Number(n))));
 }
 return scores;
}
function band(v){if(!Number.isInteger(v)||v<0||v>3000)throw new RangeError('Axis score out of range');return canonical.fiveBands.find(p=>v>=p.min&&v<=p.max).id;}
function profileKey(raw){
 const s=normalizeScores(raw,true);
 return ['altruism','lawfulness','cooperation','honor'].map(a=>s[a]===1500?'1':((a==='lawfulness'||a==='cooperation')?(s[a]>1500?'0':'2'):(s[a]>1500?'2':'0'))).join('');
}
function resolve(raw){
 const scores=normalizeScores(raw,true),key=profileKey(scores),profile=catalog.get(key);
 if(!profile)throw new Error('Unknown canonical profile key '+key);
 return {scores,phases:Object.fromEntries(axes.map(a=>[a,band(scores[a])])),key,profileId:profile.id,profileName:profile.name,description:profile.description};
}
function idOf(kind,id){return String(kind||'entity').toLowerCase()+':'+String(id??'').trim();}
function sourceScores(source){
 if(!source||typeof source!=='object')return null;
 const allowed=[source.covenant?.scores,source.eightAxisCovenant?.scores,source.authoredAlignmentAxes];
 if(source.alignment?.origin==='authored'&&source.alignment?.scores)allowed.push(source.alignment.scores);
 return allowed.find(v=>v&&typeof v==='object'&&axes.some(a=>v[a]!=null))||null;
}
function get(kind,id,source){
 const s=store.records[idOf(kind,id)],authored=sourceScores(source),out=resolve(s?.scores||authored||neutral());
 return {...out,kind:String(kind),id:String(id),origin:s?.origin||(authored?'authored-source':'unscored'),history:s?.history||[],reputation:s?.reputation||{},convictions:s?.convictions||[],strain:s?.strain||[]};
}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(store))}catch(e){console.warn('Covenant save unavailable',e)}}
function save(kind,id,scores,reason){
 const key=idOf(kind,id),old=get(kind,id),record=store.records[key]||{history:[],reputation:{},convictions:[],strain:[]};
 const next=resolve(scores),entry={eventId:'gm-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),source:'GM',at:new Date().toISOString(),reason:String(reason||'Authored correction'),before:old.scores,after:next.scores};
 record.scores=next.scores;record.origin='authored';record.history=[...record.history,entry].slice(-250);store.records[key]=record;persist();
 document.dispatchEvent(new CustomEvent('azara:covenant-change',{detail:{kind,id,record:get(kind,id)}}));
 return get(kind,id);
}
function applyEvent(kind,id,event){
 if(!event||!event.eventId||!event.sceneId||!event.reason)throw new TypeError('A unique event, scene and reason are required');
 if(!['GM','QUEST','DIALOGUE','WORLD','FACTION','COMBAT','ADMIN'].includes(event.source))throw new TypeError('Unrecognized event source');
 if(event.voluntaryChoice!==true||!['ACTUAL','ATTEMPTED','FAILED_WITH_REAL_CONSEQUENCE'].includes(event.outcome)||event.stakes==='TRIVIAL')return {applied:false,reason:'No qualifying voluntary consequence'};
 const deltas=event.axisDeltas;
 if(!deltas||!Object.keys(deltas).length||Object.entries(deltas).some(([a,v])=>!axes.includes(a)||!Number.isInteger(v)||Math.abs(v)>1000))throw new TypeError('Invalid event axis deltas');
 const key=idOf(kind,id),record=store.records[key]||{history:[],reputation:{},convictions:[],strain:[]};
 const fingerprint=String(event.causalFingerprint||event.eventId);
 if(record.history.some(e=>e.eventId===event.eventId||e.fingerprint===fingerprint))return {applied:false,reason:'Event already applied'};
 const original=get(kind,id),scores={...original.scores};
 for(const [axis,delta] of Object.entries(deltas))scores[axis]=Math.min(3000,Math.max(0,scores[axis]+delta));
 const history={eventId:String(event.eventId),fingerprint,sceneId:String(event.sceneId),source:event.source,at:new Date().toISOString(),reason:String(event.reason),axisDeltas:{...deltas},before:original.scores,after:scores,witnesses:[...(event.witnesses||[])],visibility:event.visibility||'private'};
 record.scores=scores;record.origin='evidence';record.history=[...record.history,history].slice(-250);store.records[key]=record;persist();
 document.dispatchEvent(new CustomEvent('azara:covenant-change',{detail:{kind,id,record:get(kind,id)}}));
 return {applied:true,record:get(kind,id),history};
}
function setReputation(kind,id,observer,entry){
 if(!observer||!entry||typeof entry!=='object')throw new TypeError('Observer and reputation entry required');
 const key=idOf(kind,id),record=store.records[key]||{scores:neutral(),history:[],reputation:{},convictions:[],strain:[],origin:'unscored'};
 record.reputation[String(observer)]={...entry};store.records[key]=record;persist();return get(kind,id);
}
function render(kind,id,source){
 const record=get(kind,id,source);
 const bars=axes.map(axis=>{const p=canonical.axes.find(x=>x.id===axis),v=record.scores[axis],label=record.phases[axis].toLowerCase().replaceAll('_',' ');
 return '<div class="aza-covenant-axis"><div><strong>'+esc(axis[0].toUpperCase()+axis.slice(1))+'</strong><span>'+v+'/3000 · '+esc(label)+'</span></div><meter min="0" max="3000" value="'+v+'" aria-label="'+esc(axis)+' '+v+' '+esc(label)+'"></meter><div class="aza-covenant-ends"><span>'+esc(p.low)+'</span><span>'+esc(p.high)+'</span></div></div>';}).join('');
 return '<section class="aza-covenant-card"><header><strong>'+esc(record.profileName)+'</strong><small>'+esc(record.profileId)+' · '+esc(record.origin==='unscored'?'unscored / neutral baseline':record.origin)+'</small></header><div class="aza-covenant-grid">'+bars+'</div></section>';
}
function exportRecords(){return JSON.stringify({schema:'azara-eight-axis-save.v1',catalogVersion:canonical.schemaVersion,records:store.records},null,2);}
function importRecords(raw){
 const data=typeof raw==='string'?JSON.parse(raw):raw;
 if(data?.schema!=='azara-eight-axis-save.v1'||!data.records||typeof data.records!=='object')throw new Error('Invalid Covenant archive');
 for(const [key,rec] of Object.entries(data.records)){
  if(!key.includes(':'))continue;
  store.records[key]={scores:normalizeScores(rec.scores,true),origin:rec.origin||'imported',history:Array.isArray(rec.history)?rec.history.slice(-250):[],reputation:rec.reputation&&typeof rec.reputation==='object'?rec.reputation:{},convictions:Array.isArray(rec.convictions)?rec.convictions:[],strain:Array.isArray(rec.strain)?rec.strain:[]};
 }
 persist();return Object.keys(data.records).length;
}
window.AzaraCovenant=Object.freeze({reference:canonical,axes,normalizeScores,band,profileKey,resolve,get,save,applyEvent,setReputation,render,exportRecords,importRecords});
})();