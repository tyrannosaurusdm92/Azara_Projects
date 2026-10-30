/* Belavadós relationship generator, V7. Runs invisibly in the existing NPC generator.
   Current relationships are reciprocal; past unions never count toward the 60% target.
   No romantic relationships are generated for minors. */
(()=>{'use strict';
function ensureCoverage(npcs, rng=Math.random){
 if(!Array.isArray(npcs)||npcs.length<2)return {total:npcs?.length||0,attached:0};
 const byId=new Map(npcs.map(n=>[n.id,n]));
 const groups=new Map();
 for(const n of npcs){
  const sid=n.assignment?.settlementId||n.settlementId||'unassigned';
  if(!groups.has(sid))groups.set(sid,[]);groups.get(sid).push(n);
  if(!n.relationships)n.relationships={};
  for(const kind of ['familial','romantic','personal','professional'])if(!Array.isArray(n.relationships[kind]))n.relationships[kind]=[];
  if(!n.relationshipHistory)n.relationshipHistory=[];
  if(!n.familyConnections)n.familyConnections={parentIds:[],childIds:[],halfSiblingIds:[],stepParentIds:[],stepChildIds:[]};
  if(!n.romance)n.romance={currentPartnerIds:[],currentStatus:'single',styles:[],consentRequired:true};
 }
 const active=n=>(n.relationships?.romantic||[]).filter(e=>e.status!=='ended'&&e.status!=='deceased'&&!/^ex[- ]|widow/i.test(e.type||e.label||''));
 const family=(a,b)=>a.id!==b.id && (
  a.familyTree?.householdId&&a.familyTree.householdId===b.familyTree?.householdId ||
  a.householdId&&a.householdId===b.householdId&&a.settlementId===b.settlementId ||
  (a.relationships.familial||[]).some(r=>r.npcId===b.id) ||
  (b.relationships.familial||[]).some(r=>r.npcId===a.id));
 const eligible=(a,b)=>a!==b && a.age>=18 && b.age>=18 && !family(a,b) && !active(a).some(e=>e.npcId===b.id);
 const styles=['monogamous','consensual polyamory','polyfidelity','kitchen-table polyamory','parallel polyamory','relationship anarchy','plural marriage','group marriage'];
 const types=['dating','committed partners','engaged','spouses','civil partners'];
 function add(a,b,style,typ){
  if(!eligible(a,b))return false;
  for(const [p,q] of [[a,b],[b,a]])p.relationships.romantic.push({npcId:q.id,name:q.name,type:typ,label:typ,status:'current',agreement:style,mutualConsent:true});
  return true;
 }
 // Existing current unions remain intact. The generator's old label-only edges are normalized.
 for(const n of npcs)for(const e of active(n)){
  const other=byId.get(e.npcId);if(!other||other.age<18||n.age<18)continue;
  e.type=e.type||e.label||'committed partners';e.status='current';e.mutualConsent=true;e.agreement=e.agreement||'monogamous';
  if(!active(other).some(r=>r.npcId===n.id))other.relationships.romantic.push({npcId:n.id,name:n.name,type:e.type,label:e.type,status:'current',agreement:e.agreement,mutualConsent:true});
 }
 for(const group of groups.values()){
  const adults=group.filter(n=>n.age>=18);const target=Math.min(adults.length,Math.ceil(group.length*0.64));
  const attached=()=>group.filter(n=>active(n).length).length;
  let un=adults.filter(n=>!active(n).length).sort(()=>rng()-.5);
  let tries=0;
  while(attached()<target && un.length && tries++<group.length*8){
   const a=un.shift(); if(active(a).length)continue;
   const choices=un.filter(b=>eligible(a,b));
   let b=choices.length?choices[Math.floor(rng()*choices.length)]:null;
   if(!b){const joined=adults.filter(x=>active(x).length&&eligible(a,x));b=joined[Math.floor(rng()*joined.length)]||null;}
   if(!b)continue;
   if(active(b).length) add(a,b,'consensual polyamory','committed partners');
   else add(a,b,rng()<0.28?styles[1+Math.floor(rng()*(styles.length-1))]:'monogamous',types[Math.floor(rng()*types.length)]);
   un=un.filter(n=>!active(n).length);
  }
  // Supplemental voluntary multi-partner connections; no implied infidelity.
  const joined=adults.filter(n=>active(n).length);let remaining=Math.round(joined.length*0.14);
  for(const a of joined){if(remaining<=0)break;if(active(a).length>=3)continue;
   const choices=joined.filter(b=>eligible(a,b)&&active(b).length<3);
   if(!choices.length)continue;
   const b=choices[Math.floor(rng()*choices.length)];
   if(add(a,b,styles[1+Math.floor(rng()*(styles.length-1))],types[Math.floor(rng()*types.length)]))remaining--;
  }
  // Former partners and widowhood as distinct history. Never count these as current.
  const elders=group.filter(n=>n.age>=27);
  for(const n of elders){
   if(rng()<0.08){const possibles=elders.filter(b=>b!==n&&!active(n).some(e=>e.npcId===b.id)&&!family(n,b)&&!n.relationshipHistory.some(e=>e.npcId===b.id));
    const b=possibles[Math.floor(rng()*possibles.length)];
    if(b){const type=['ex-partner','ex-fiancé','ex-spouse'][Math.floor(rng()*3)];
     n.relationshipHistory.push({npcId:b.id,name:b.name,type,status:'ended',mutualConsentAtTime:true});
     b.relationshipHistory.push({npcId:n.id,name:n.name,type,status:'ended',mutualConsentAtTime:true});}
   }
   if(n.age>=38&&rng()<0.05&&!n.romance.widowed){
    n.romance.widowed=true;
    n.relationshipHistory.push({memorialId:'memorial-'+n.id,name:'Late spouse of '+n.name,type:'deceased spouse',status:'deceased',notAnActiveNPC:true});
   }
  }
  // Co-parenting, guardianship and adoption need not presuppose romantic relationships.
  for(const child of group.filter(n=>n.age<18)){
   const parents=new Set(child.familyConnections.parentIds||[]);
   for(const entry of child.relationships.familial){if(['parent','adoptive parent','guardian','foster parent'].includes(entry.type||entry.label))parents.add(entry.npcId);}
   const desired=rng()<0.28?3:2;
   for(let i=parents.size;i<desired;i++){
    const opts=adults.filter(p=>p.age-child.age>=18&&!parents.has(p.id)&&!active(p).some(e=>e.npcId===child.id));
    if(!opts.length)break;
    const p=opts[Math.floor(rng()*opts.length)],type=i===2?'adoptive parent':'parent';
    if(!p||parents.has(p.id))break;
    child.relationships.familial.push({npcId:p.id,name:p.name,type});
    p.relationships.familial.push({npcId:child.id,name:child.name,type:type==='parent'?'child':'adopted child'});
    parents.add(p.id);
    if(!p.familyConnections)p.familyConnections={parentIds:[],childIds:[],halfSiblingIds:[],stepParentIds:[],stepChildIds:[]};
    if(!p.familyConnections.childIds.includes(child.id))p.familyConnections.childIds.push(child.id);
   }
   child.familyConnections.parentIds=[...parents];
  }
 }
 // Sibling provenance is derived from actual shared parents, with different second parents => half-siblings.
 const kidsByParent=new Map();
 for(const n of npcs){
  for(const pid of n.familyConnections?.parentIds||[]){
   if(!kidsByParent.has(pid))kidsByParent.set(pid,[]);
   kidsByParent.get(pid).push(n);
  }
 }
 for(const children of kidsByParent.values()){
  for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
   const a=children[i],b=children[j];
   if(a.id===b.id || a.relationships.familial.some(x=>x.npcId===b.id))continue;
   const shared=(a.familyConnections?.parentIds||[]).filter(id=>(b.familyConnections?.parentIds||[]).includes(id));
   const half=shared.length===1 && new Set(a.familyConnections.parentIds).size>1 && new Set(b.familyConnections.parentIds).size>1;
   const type=half?'half-sibling':'sibling';
   a.relationships.familial.push({npcId:b.id,name:b.name,type});
   b.relationships.familial.push({npcId:a.id,name:a.name,type});
   if(half){a.familyConnections.halfSiblingIds.push(b.id);b.familyConnections.halfSiblingIds.push(a.id);}
  }
 }
 // A parent's current consenting spouse or partner may be a step-parent without being a biological parent.
 for(const child of npcs.filter(n=>n.age<18)){
  const pids=new Set(child.familyConnections?.parentIds||[]);
  for(const pid of pids){
   const parent=byId.get(pid);if(!parent)continue;
   for(const e of active(parent)){
    const step=byId.get(e.npcId);
    if(!step||pids.has(step.id)||step.age-child.age<18||child.relationships.familial.some(r=>r.npcId===step.id))continue;
    child.relationships.familial.push({npcId:step.id,name:step.name,type:'step-parent'});
    step.relationships.familial.push({npcId:child.id,name:child.name,type:'step-child'});
    child.familyConnections.stepParentIds.push(step.id);step.familyConnections.stepChildIds.push(child.id);
   }
  }
 }
 for(const n of npcs){
  const romances=active(n);
  if(romances.length>1)for(const e of romances)if(e.agreement==='monogamous')e.agreement='consensual polyamory';
  n.romance.currentPartnerIds=[...new Set(romances.map(r=>r.npcId))];
  n.romance.currentStatus=romances.length?'partnered':n.romance.widowed?'widowed':'single';
  n.romance.styles=[...new Set(romances.map(r=>r.agreement))];n.romance.consentRequired=true;
  if(n.familyTree){n.familyTree.partners=n.romance.currentPartnerIds.map(id=>({id,name:byId.get(id)?.name||id,status:'current'}));}
 }
 // Normalize both directed halves of every current edge to identical consensual agreements.
 for(const n of npcs)for(const e of active(n)){
  const other=byId.get(e.npcId);if(!other)continue;
  const rev=active(other).find(r=>r.npcId===n.id);if(!rev)continue;
  if(active(n).length>1||active(other).length>1){
   if(e.agreement==='monogamous')e.agreement='consensual polyamory';
   if(rev.agreement==='monogamous')rev.agreement='consensual polyamory';
  }
  const agreement=e.agreement==='consensual polyamory'&&rev.agreement!=='consensual polyamory'?rev.agreement:e.agreement;
  e.agreement=rev.agreement=agreement;
  e.type=rev.type=e.type||rev.type||'committed partners';
 }
 for(const n of npcs){n.romance.styles=[...new Set(active(n).map(r=>r.agreement))];}
 return {total:npcs.length,attached:npcs.filter(n=>n.romance.currentPartnerIds.length).length};
}
window.BelavadosRelationshipEngine={ensureCoverage};
})();
