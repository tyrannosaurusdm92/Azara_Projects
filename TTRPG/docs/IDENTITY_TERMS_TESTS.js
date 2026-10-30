'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..');
const window={crypto:require('crypto').webcrypto},context={window,crypto:window.crypto,Uint32Array,Math,Array,Number,String,Object,Set,Map,JSON,Error,console};vm.createContext(context);
for(const x of ['dice','term-lexicon','terms','pronouns-data','settings','identity-engine'])vm.runInContext(fs.readFileSync(path.join(root,'js/identity',x+'.js'),'utf8'),context,{filename:x+'.js'});
const E=window.BelavadosIdentityEngine,items=E.catalog,ids=E.identities;
assert.equal(items.length,232);assert.equal(items.filter(x=>x.category==='Neopronoun').length,206);assert.equal(ids.length,14);assert(!ids.some(x=>x.name==='Neutrois'));assert.equal(new Set(items.map(x=>[x.subject,x.object,x.determiner,x.pronoun,x.reflexive].join('|'))).size,232);
assert.equal(JSON.stringify(E.assignPopulation(Array.from({length:300},(_,i)=>({id:'npc'+i})),{seed:'replay',rerollIdentities:true})),JSON.stringify(E.assignPopulation(Array.from({length:300},(_,i)=>({id:'npc'+i})),{seed:'replay',rerollIdentities:true})));
const a=Array.from({length:2016},(_,i)=>({id:'n'+i,genderIdentity:ids[i%14].name}));const stats=E.assignPopulation(a,{seed:'fixed-identity-upgrade',size:'town',rerollIdentities:false});
for(const id of ids.filter(x=>x.override))assert(Math.abs(stats.identityCounts[id.name]/2-stats.exactHalfOverrides[id.name])<=.5);
for(const n of a){assert(ids.some(x=>x.name===n.genderIdentity));assert(items.some(p=>p.name===n.pronouns));assert(n.pronounForms.subject && n.pronounForms.reflexive);assert(n.formalHonorific);assert(n.respectfulAddress);assert(n.everydayTitle);assert(n.platonicEndearment);assert(n.kinshipTerms.parent);assert(n.languageProfile.pronounMode==='prioritized');assert(n.romanticEndearment===null);const id=ids.find(x=>x.name===n.genderIdentity);if(id.fixed)assert.equal(n.pronouns,id.fixed);}
for(let i=1;i<=20;i++)assert(items.some(p=>p.number===i && p.category==='Neopronoun'));
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(!src.includes('id="diceAudit"'));assert(!src.includes('id="pronounMode"'));assert(src.includes('js/identity/identity-engine.js'));assert((src.match(/<script src="js\/identity\//g)||[]).length===6);
const data=JSON.parse(fs.readFileSync(path.join(root,'json/elarvess_living_population.json'),'utf8'));assert.equal(data.npcs.length,2016);assert.equal(data.buildings.length,1312);
for(const n of data.npcs){assert(n.languageProfile?.generator==='BelavadosIdentityEngineV2');assert(n.weeklySchedule?.length===6);assert(n.homeBuildingId!=null&&n.workBuildingId!=null);}
console.log('PASS identity engine:',items.length,'sets,',ids.length,'identities,',stats.population,'NPC spot-generation records; 2016 persisted NPCs; 1312 original buildings; no visible dice UI');
