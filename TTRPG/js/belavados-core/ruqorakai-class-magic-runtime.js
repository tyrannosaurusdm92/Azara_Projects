/* Single-player Rise of Ruqorakai class and school engine, source-linked. */
(function(){
'use strict';
const data=window.RUQORAKAI_MAGIC_CLASS_DATA;
if(!data||data.archetypes.length!==14||data.schools.length!==11)throw new Error('Class-magic catalogue incomplete');
const byName=new Map(data.archetypes.map(x=>[x.name.toLowerCase(),x])),bySchool=new Map(data.schools.map(x=>[x.id,x]));
const normal=n=>String(n||'').toLowerCase().replace(/ magic$/,'');
function getClass(id){return byName.get(String(id||'').toLowerCase())||data.archetypes.find(x=>x.id===id)||null;}
function getSchool(id){return bySchool.get(normal(id))||null;}
function matchup(attack,defense){
 const a=getSchool(attack),b=getSchool(defense);
 if(!a||!b)throw new TypeError('Unknown magic school');
 if(a.strongAgainst.some(x=>normal(x)===b.id))return {relation:'strong',modifier:1.25};
 if(a.weakAgainst.some(x=>normal(x)===b.id))return {relation:'weak',modifier:.75};
 return {relation:'neutral',modifier:1};
}
function canUse({archetype,school,yearCE=121,flags={},ability='',rank=0}={}){
 if(yearCE>=276)return {allowed:false,reason:'Belavadós was destroyed in 276 CE; this game’s intact mainland is pre-destruction.'};
 const cls=getClass(archetype),s=getSchool(school);
 if(school&&!s)return {allowed:false,reason:'Unknown school'};
 if(cls?.name==='Thorned Reclaimer'){
  const postfall=flags?.anubriosh_classical_fall_confirmed===true;
  if(!postfall&&(/necromanc|tearbrand|thornveil|soul shatter|tears of the exiled|reclamation|resurrection/i.test(ability)||s?.id==='necromancy'))
   return {allowed:false,reason:'Anubriosh’s Classical fall has not yet occurred.'};
 }
 if(!Number.isInteger(rank)||rank<0||rank>20)return {allowed:false,reason:'Rank must be 0–20'};
 return {allowed:true,reason:'Train through a witnessed practice, mentor, or consequential scene.'};
}
function emptyState(){return {version:1,edition:'Rise of Ruqorakai',classPaths:{},schoolRanks:Object.fromEntries(data.schools.map(s=>[s.id,0])),unspentPerks:3,retiredPaths:{},flags:{}};}
function validateState(state){
 if(!state||state.edition!=='Rise of Ruqorakai')throw new TypeError('Incorrect edition save');
 for(const [id,rank] of Object.entries(state.schoolRanks||{}))if(!getSchool(id)||!Number.isInteger(rank)||rank<0||rank>20)throw new RangeError('Invalid school rank '+id);
 for(const [key,rank] of Object.entries(state.classPaths||{})){
  const parts=key.split('::'),cls=getClass(parts[0]);
  if(!cls||!cls.roles.some(x=>x.id===parts[1])||!Number.isInteger(rank)||rank<0||rank>20)throw new RangeError('Invalid class role rank '+key);
 }
 return true;
}
const api=Object.freeze({data,getClass,getSchool,matchup,canUse,emptyState,validateState,listClasses:()=>data.archetypes,listSchools:()=>data.schools});
window.RuqorakaiClassMagic=api;
})();