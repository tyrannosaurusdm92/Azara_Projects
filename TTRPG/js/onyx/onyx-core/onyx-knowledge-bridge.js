/* Onyx Work reference retriever. Loads source code as knowledge DATA, never runs it.
   No panel, remote backend or network service. Canonical TTRPG data takes priority. */
(function(){'use strict';
const packs=['worldbuilding-core-knowledge.json','worldbuilding-deep-knowledge.json','worldbuilding-cross-domain.json'];
const stop=new Set('the and for with from this that into have there them they their your about then what where when which why how should would could also only does will make more some than every each these those work please help create world build building my our onyx me i a an of to in is it by or at as be do can are was were has had'.split(' '));
let bank=null,promise=null;
const tokenize=s=>[...new Set(String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(x=>x.length>=3&&!stop.has(x)))];
function chunks(text){
 return String(text||'').replace(/\\n/g,'\n').split(/[\n.;{}]+/).map(x=>x.trim()).filter(x=>x.length>35).flatMap(s=>s.length<=420?[s]:s.match(/.{1,420}/g)||[]);
}
async function load(){
 if(bank)return bank;
 if(promise)return promise;
 promise=(async()=>{
  const out=[];
  for(const file of packs){
   try{
    const response=await fetch('json/onyx/'+file,{cache:'force-cache'});
    if(!response.ok)continue;
    const p=await response.json();
    for(const e of p.entries||[]){
     const path=e.sourcePath;
     for(const [i,value] of chunks(e.content).entries())out.push({source:path,sourceBlob:e.sourceBlob,text:value,ordinal:i});
    }
   }catch(error){console.warn('Onyx knowledge pack unavailable:',file,error);}
  }
  bank=out;return out;
 })();
 return promise;
}
function score(part,words){
 const s=part.text.toLowerCase(),path=part.source.toLowerCase();
 let sum=0;
 for(const term of words){if(s.includes(term))sum+=2+(s.includes(' '+term+' ')?1:0);if(path.includes(term))sum+=2;}
 return sum;
}
function sourceUrl(path){return 'https://github.com/tyrannosaurusdm92/LifeHelpers/blob/main/'+path.split('/').map(encodeURIComponent).join('/');}
function getContext(){
 try{
  const a=window.BelavadosTTRPG?.getContext?.();
  return a?{province:a.provinceName,settlement:a.settlementName}:null;
 }catch{return null}
}
async function answer(input){
 const query=String(input||'').trim();
 if(!/\b(world|worldbuild|settlement|province|town|village|city|capital|npc|character|species|race|biome|ecosystem|climate|culture|pantheon|religion|faction|quest|lore|story|history|map|location|travel|language|pronoun|economy|trade|building|district|government|campaign|ttrpg|calendar|planet|galaxy|simulation|schedule|relationship)\b/i.test(query))return null;
 const terms=tokenize(query);if(!terms.length)return null;
 const records=await load();if(!records.length)return null;
 const matches=records.map(p=>({p,weight:score(p,terms)})).filter(x=>x.weight>=3).sort((a,b)=>b.weight-a.weight);
 const chosen=[],seen=new Set();
 for(const m of matches){if(seen.has(m.p.source))continue;seen.add(m.p.source);chosen.push(m.p);if(chosen.length===4)break;}
 if(!chosen.length)return null;
 const context=getContext();
 const intro=context?.settlement
  ?'Work context: '+context.settlement+' in '+(context.province||'Belavadós')+'. Existing world records take priority over generic knowledge.'
  :'Belavadós World Forge · Worldbuilding reference context. Existing canon takes priority.';
 const clean=s=>s.replace(/\s+/g,' ').slice(0,420);
 const items=chosen.map((p,i)=>(i+1)+'. '+clean(p.text)+'\n   Source: '+sourceUrl(p.source));
 return {text:'Papa, I found these installed worldbuilding source notes for this task.\n\n'+intro+'\n\n'+items.join('\n\n')+'\n\nI can use these as references for design choices, but they do not overwrite named buildings, NPC identities, maps, or campaign canon. Tell me which part to apply and I can work through it with you.',state:'thinking',artifacts:[],citations:[],localOnly:true,knowledgeSources:chosen.map(x=>x.source)};
}
window.BelavadosOnyxKnowledge=Object.freeze({load,answer,getContext,sourcePacks:packs.slice()});
})();