/* Rise of Ruqorakai: authoritative eleven-school, fourteen-class, seventy-path rules. */
(function(){
'use strict';
const data=window.RUQORAKAI_MAGIC_CLASS_DATA;
if(!data||data.archetypes.length!==14||data.schools.length!==11||data.archetypes.some(c=>c.roles.length!==5))
 throw Error('Class and magic source data incomplete');
if(data.campaign.mode!=='single-player'||data.campaign.pvp!==false||data.campaign.books!==false)throw Error('Incorrect game-edition magic rules');
const roles=['steelborn','wildshot','spellsword','psionist','etherist'];
const classById=new Map(data.archetypes.map(c=>[c.id,c])),classByName=new Map(data.archetypes.map(c=>[c.name.toLowerCase(),c]));
const schoolById=new Map(data.schools.map(s=>[s.id,s]));
function norm(x){return String(x||'').trim().toLowerCase().replace(/ magic$/,'');}
function getClass(value){return classById.get(norm(value))||classByName.get(norm(value))||null;}
function getSchool(value){return schoolById.get(norm(value))||null;}
function getClassForDeity(name){return data.archetypes.filter(c=>c.deity.toLowerCase()===norm(name));}
function getRole(archetype,role){return getClass(archetype)?.roles.find(r=>r.id===norm(role))||null;}
function listPaths(){return data.archetypes.flatMap(c=>c.roles.map(r=>({id:c.id+'::'+r.id,classId:c.id,className:c.name,deity:c.deity,roleId:r.id,roleName:r.role,title:r.title,abilities:r.abilities,rankCap:r.rankCap})));}
/* ±25% is a tunable school-matchup mechanic; it never modifies divine rank. */
function matchup(attack,defense,{enabled=true}={}){
 const a=getSchool(attack),b=getSchool(defense);if(!a||!b)throw TypeError('Unknown magic school');
 if(!enabled)return {relation:'neutral',modifier:1};
 if(a.strongAgainst.some(x=>norm(x)===b.id))return {relation:'strong',modifier:1.25};
 if(a.weakAgainst.some(x=>norm(x)===b.id))return {relation:'weak',modifier:.75};
 return {relation:'neutral',modifier:1};
}
function canUse({archetype,role,school,yearCE=121,flags={},ability='',rank=0}={}){
 if(!Number.isInteger(yearCE))return {allowed:false,reason:'The campaign year must be a whole number.'};
 if(yearCE>=276)return {allowed:false,reason:'Belavadós was destroyed in 276 CE; mainland travel is limited to earlier dates.'};
 if(!Number.isInteger(rank)||rank<0||rank>20)return {allowed:false,reason:'Skill ranks are 0–20.'};
 const cls=archetype?getClass(archetype):null,s=school?getSchool(school):null;
 if(archetype&&!cls)return {allowed:false,reason:'Unknown class tradition.'};
 if(school&&!s)return {allowed:false,reason:'Unknown school.'};
 if(role&&(!cls||!getRole(cls.id,role)))return {allowed:false,reason:'Unknown class role path.'};
 if(role&&ability){
  const record=getRole(cls.id,role)?.abilities.find(x=>norm(x.name)===norm(ability));
  if(record&&rank<record.rank)return {allowed:false,reason:'This technique requires '+record.rank+' in the '+role+' role path.'};
 }
 if(cls?.id==='thorned-reclaimer'&&flags.anubriosh_classical_fall_confirmed!==true&&
  (s?.id==='necromancy'||/necromanc|black tearbrand|thornveil|soul shatter|tears of the exiled|resurrect|reclamation|gravebloom|thornward renewal/i.test(String(ability)))){
   return {allowed:false,reason:'This Anubriosh technique requires the confirmed Classical fall event.'};
 }
 return {allowed:true,reason:'Training is gained through mentorship, practice, a trial, or meaningful experience.'};
}
function trialFor(archetype,{yearCE=121,flags={}}={}){
 const cls=getClass(archetype);if(!cls)return null;
 const beforeFall=cls.id==='thorned-reclaimer'&&flags.anubriosh_classical_fall_confirmed!==true;
 return {id:cls.id,archetype:cls.name,title:beforeFall?'The Hourglass Before Thorns':cls.trial,
  steps:['Observe','Sample','Decide'],roles:[...roles],firstTrialRequired:true,
  classIsNotForcedWorship:true,canSampleWithoutUnlock:true,yearCE,postFallFeaturesAvailable:!beforeFall};
}
function emptyState(){return {version:2,edition:'Rise of Ruqorakai',yearCE:121,characterLevel:1,
 classPaths:{},schoolRanks:Object.fromEntries(data.schools.map(s=>[s.id,0])),
 unspentPerks:3,retiredPaths:{},flags:{},bookInventory:null,pvp:false};}
function validateState(state){
 if(!state||state.edition!=='Rise of Ruqorakai'||state.pvp===true)throw TypeError('Incorrect single-player character state');
 if(state.yearCE!=null&&(!Number.isInteger(state.yearCE)||state.yearCE>=276))throw RangeError('Invalid pre-destruction campaign year');
 if(state.bookInventory!=null||state.skillBooks!=null)throw TypeError('Rise does not use book-gated magic');
 for(const [id,rank]of Object.entries(state.schoolRanks||{}))
  if(!getSchool(id)||!Number.isInteger(rank)||rank<0||rank>20)throw RangeError('Invalid school rank '+id);
 for(const [id,rank]of Object.entries(state.classPaths||{})){
  const [cls,role]=id.split('::');
  if(!getRole(cls,role)||!Number.isInteger(rank)||rank<0||rank>20)throw RangeError('Invalid class path rank '+id);
 }
 return true;
}
const api=Object.freeze({data,getClass,getSchool,getClassForDeity,getRole,listPaths,matchup,canUse,trialFor,emptyState,validateState,listClasses:()=>data.archetypes,listSchools:()=>data.schools,roleIds:[...roles]});
window.RuqorakaiClassMagic=api;
})();