/* Belavadós internal-only identity / pronoun / address generator. No standalone UI, dice controls or new HTML. */
(function(global){'use strict';
const Dice=global.BelavadosDice, Terms=global.BelavadosTerms, sets=global.BELAVADOS_PRONOUN_SETS;
if(!Dice||!Terms||!Array.isArray(sets)||sets.length!==232)throw Error('Incomplete identity engine');
const identities=[
 ['Agender',12],['Apagender',6],['Bigender',8],['Cis-Female',10,'she/her'],['Cis-Male',6,'he/him'],
 ['Demi-Female',4,null,'she/her'],['Demi-Male',8,null,'he/him'],['Gender-Flexible',12],
 ['Genderfluid',8],['Genderless',6],['Nonbinary',10],['Poly-Gender',4],
 ['Trans-Female',12,null,'she/her'],['Trans-Male',8,null,'he/him']
].map(([name,die,fixed,override])=>({name,die,fixed:fixed||null,override:override||null}));
const allowed=new Set(identities.map(x=>x.name));
const originalFace=Array.from({length:21},()=>[]);for(const p of sets)originalFace[p.number].push(p);
const fixedByName=Object.fromEntries(['he/him','she/her'].map(s=>[s,sets.find(p=>p.name===s)]));
const rolls={village:3,town:6,city:10,capital:18};
const options=Object.freeze(Terms.normalizeSettings(global.BELAVADOS_IDENTITY_SETTINGS||{}));
const intRand=(rng)=>max=>rng.int(max);
function settlementSize(value){let x=String(value||'town').toLowerCase();return x.includes('capit')?'capital':x.includes('city')?'city':x.includes('vill')?'village':'town';}
function createSession(seed){return Dice.create(seed===undefined?null:seed)}
function weightPool(rng,size){const n=rolls[settlementSize(size)];const dice=[4,6,8,10,12,20],pool={};for(const d of dice)pool['d'+d]=rng.rollPool(d,n);
const weights=identities.map((id,i)=>.35+1.3*pool['d'+id.die][(i*7+Math.floor(i/3))%n]/id.die+.25*pool.d20[(i*5+1)%n]/20);
return {weights,pool,rollsPerDie:n};}
function weightedIndex(weights,rng){const sum=weights.reduce((a,b)=>a+b,0);let x=rng.int(1000000000)/1000000000*sum;for(let i=0;i<weights.length;i++){x-=weights[i];if(x<0)return i}return weights.length-1;}
function pickIdentity(seed,size='town'){const rng=createSession(seed),p=weightPool(rng,size);return identities[weightedIndex(p.weights,rng)];}
function apportion(n,weights,rng){const sum=weights.reduce((a,b)=>a+b,0),raw=weights.map(w=>n*w/sum),counts=raw.map(Math.floor);let rest=n-counts.reduce((a,b)=>a+b,0);
const ties=raw.map((x,i)=>({i,fract:x-Math.floor(x),tie:rng.int(2147483647)})).sort((a,b)=>b.fract-a.fract||a.tie-b.tie);
for(let i=0;i<rest;i++)counts[ties[i].i]++;return counts;}
function selectedPronouns(identity,rng,forced){const rnd=intRand(rng);if(identity.fixed)return {p:fixedByName[identity.fixed],face:null,assignment:'Fixed cis'};
if(identity.override&&forced)return {p:fixedByName[identity.override],face:null,assignment:'Exact-half trans/demi override'};
const face=rng.roll(20);return {p:Terms.selectPronoun(face,sets,options.pronounMode,rnd),face,assignment:'d20 selection'};}
function apply(npc,id,forced,rng,overwrite){if(!npc||!id)throw Error('NPC / identity required');if(!overwrite&&npc.languageProfile?.generator==='BelavadosIdentityEngineV2')return npc;
const choice=selectedPronouns(id,rng,forced);
const suggestion=Terms.suggest(choice.p,options,intRand(rng));
const forms={subject:choice.p.subject,object:choice.p.object,possessiveDeterminer:choice.p.determiner,possessivePronoun:choice.p.pronoun,reflexive:choice.p.reflexive};
npc.genderIdentity=id.name;npc.pronouns=choice.p.name;npc.pronounForms=forms;
npc.preferredHonorific=suggestion.formalHonorific;
npc.formalHonorific=suggestion.formalHonorific;
npc.respectfulAddress=suggestion.respectfulAddress;
npc.everydayTitle=suggestion.everydayTitle;
npc.platonicEndearment=suggestion.platonicEndearment;
npc.romanticEndearment=suggestion.romanticEndearment;
npc.kinshipTerms=suggestion.kinshipTerms;
npc.familyLanguage={parent:suggestion.kinshipTerms.parent,sibling:suggestion.kinshipTerms.sibling,child:suggestion.kinshipTerms.child,parentSibling:suggestion.kinshipTerms.parentsSibling,siblingChild:suggestion.kinshipTerms.siblingsChild,grandparent:suggestion.kinshipTerms.grandparent,partner:suggestion.kinshipTerms.partner,spouse:suggestion.kinshipTerms.partner,cousin:'Cousin',relative:'Relative'};
npc.languageProfile={generator:'BelavadosIdentityEngineV2',pronounCategory:choice.p.category,pronounNumber:choice.p.number,pronounMode:options.pronounMode,termPolicy:options.termPolicy,romanticEndearmentsEnabled:options.romantic,termProfile:suggestion.termProfile,pronounRoll:choice.face,assignment:choice.assignment,termsAreSuggestions:true};
return npc;}
function assignOne(npc,{seed,size='town',rerollIdentity=false,overwrite=false}={}){const rng=createSession(seed===undefined?null:String(seed));const id=(!rerollIdentity&&identities.find(x=>x.name===npc.genderIdentity))||pickIdentity((seed===undefined?null:String(seed)+'|identity'),size);const forced=!!id.override&&rng.int(2)===0;return apply(npc,id,forced,rng,overwrite);}
function assignPopulation(npcs,{seed='Belavados|identity|v2',size='town',rerollIdentities=false,overwrite=true}={}){
const rng=createSession(seed),pools=weightPool(rng,size);let indexes=[];
if(rerollIdentities){const counts=apportion(npcs.length,pools.weights,rng);identities.forEach((x,i)=>{for(let j=0;j<counts[i];j++)indexes.push(i)});rng.shuffleInPlace(indexes)}
else indexes=npcs.map(n=>{const found=identities.findIndex(x=>x.name===n.genderIdentity);return found===-1?weightedIndex(pools.weights,rng):found});
const byIdentity=identities.map(()=>[]);indexes.forEach((i,k)=>byIdentity[i].push(k));const forced=new Set();
identities.forEach((id,i)=>{if(!id.override)return;const indices=byIdentity[i].slice();rng.shuffleInPlace(indices);const count=Math.floor(indices.length/2)+(indices.length%2?rng.int(2):0);for(let n=0;n<count;n++)forced.add(indices[n])});
for(let i=0;i<npcs.length;i++)apply(npcs[i],identities[indexes[i]],forced.has(i),rng,overwrite);
return {population:npcs.length,identityCounts:Object.fromEntries(identities.map((x,i)=>[x.name,byIdentity[i].length])),exactHalfOverrides:Object.fromEntries(identities.filter(x=>x.override).map(x=>[x.name,[...forced].filter(k=>identities[indexes[k]].name===x.name).length])),dicePool:pools.pool,rollsPerDie:pools.rollsPerDie,pronounCatalogSize:sets.length,mode:options.pronounMode};}
const catalog=Object.freeze(sets);const api={identities:Object.freeze(identities),catalog,settings:options,createSession,pickIdentity,assignOne,assignPopulation,weightPool,settlementSize,rollIdentity:(seed,size)=>{const x=pickIdentity(seed,size);return {identity:x.name,pronouns:x.fixed||'they/them'}}};
global.BelavadosIdentityEngine=Object.freeze(api);
})(window);
