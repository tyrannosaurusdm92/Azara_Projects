/* Belavadós fictional NPC wording choices. Not rules for real people. */
(function(global){'use strict';
const data=global.BelavadosTermLexicon;
if(!data)throw Error('Belavadós term lexicon must load first.');
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const options={prioritized:'prioritized',original:'original','neo-only':'neo-only'};
const policies={linked:'linked',neutral:'neutral',varied:'varied'};
function isNeo(pronoun){return pronoun.category==='Neopronoun'}
function randDefault(n){if(!global.crypto||!global.crypto.getRandomValues)throw Error('Secure random generator unavailable.');const x=new Uint32Array(1);const limit=4294967296-(4294967296%n);do{global.crypto.getRandomValues(x)}while(x[0]>=limit);return x[0]%n}
function pick(values,rand=randDefault){if(!values.length)throw Error('Empty language term pool');return values[rand(values.length)]}
function normalizeSettings(raw){raw=raw||{};return {pronounMode:own(options,raw.pronounMode)?raw.pronounMode:'prioritized',termPolicy:own(policies,raw.termPolicy)?raw.termPolicy:'linked',romantic:!!raw.romantic}}
function classForPronoun(p,policy,rand=randDefault){
 if(policy==='neutral')return 'neutral';
 const name=String(p.name||'').toLowerCase();
 const canonical=name==='he/him'?'masculine':name==='she/her'?'feminine':'neutral';
 if(policy==='linked')return canonical;
 if(canonical!=='neutral')return rand(100)<65?canonical:'neutral';
 if(p.category==='Mixed-form' && rand(100)<20)return rand(2)===0?'masculine':'feminine';
 return 'neutral';
}
function pickAligned(pool,tone,policy,rand){
 const neutral=pool.neutral||[];
 const gendered=pool[tone]||[];
 if(tone==='neutral'||policy==='neutral'||!gendered.length)return pick(neutral,rand);
 // Gendered pronouns can still use gender-neutral language. 70% associated options by default.
 if(rand(100)<70)return pick(gendered,rand);
 return pick(neutral,rand);
}
function selectPronoun(face,sets,mode,rand=randDefault){
 const candidates=sets.filter(p=>p.number===face);
 if(!candidates.length)throw Error('No pronoun assigned to d20 face '+face);
 const neo=candidates.filter(isNeo);
 // Prioritize neopronouns on 80% of non-cis NPC rolls; keep 20% original inclusive.
 if(mode==='neo-only')return pick(neo.length?neo:candidates.filter(isNeo),rand);
 if(mode==='prioritized'&&neo.length&&rand(100)<80)return pick(neo,rand);
 return pick(candidates,rand);
}
function probabilityForSet(p,all,mode){
 const candidates=all.filter(x=>x.number===p.number);
 const neo=candidates.filter(isNeo);
 const original=1/(20*candidates.length);
 if(mode==='original')return original;
 if(mode==='neo-only')return isNeo(p)?(neo.length?1/(20*neo.length):0):0;
 if(mode==='prioritized')return neo.length?original*.2+(isNeo(p)?(.8/(20*neo.length)):0):original;
 throw Error('Unknown pronoun selection mode.');
}
function suggest(p,raw={},rand=randDefault){
 const cfg=normalizeSettings(raw),tone=classForPronoun(p,cfg.termPolicy,rand);
 const forms=data.forms,kinship={};
 for(const [role,groups] of Object.entries(data.kinship))kinship[role]=pickAligned(groups,tone,cfg.termPolicy,rand);
 return {termProfile:tone,formalHonorific:pickAligned(forms.honorific,tone,cfg.termPolicy,rand),respectfulAddress:pickAligned(forms.respectfulAddress,tone,cfg.termPolicy,rand),everydayTitle:pickAligned(forms.everydayTitle,tone,cfg.termPolicy,rand),platonicEndearment:pickAligned(forms.platonicEndearment,tone,cfg.termPolicy,rand),romanticEndearment:cfg.romantic?pickAligned(forms.romanticEndearment,tone,cfg.termPolicy,rand):null,kinshipTerms:kinship,termNote:'Suggestions only; not confirmed individual preferences or actual relationships.'};
}
function rollSingle(identity,sets,raw,rand=randDefault){
 const cfg=normalizeSettings(raw);let p,face=null,rule='Random d20';
 if(identity.fixed){p=sets.find(x=>x.name===identity.fixed);rule='Cisgender fixed';}
 else if(identity.override&&rand(2)===0){p=sets.find(x=>x.name===identity.override);rule='Demi/trans 50% sample override';}
 else{face=rand(20)+1;p=selectPronoun(face,sets,cfg.pronounMode,rand)}
 if(!p)throw Error('Required pronoun set missing');
 return {identity:identity.name,d20:face,assignment:rule,pronouns:p,language:suggest(p,cfg,rand)};
}
function diagnose(sets){return {total:sets.length,neopronouns:sets.filter(isNeo).length,emptyNeoFaces:Array.from({length:20},(_,i)=>i+1).filter(n=>!sets.some(p=>p.number===n&&isNeo(p)))}}
global.BelavadosTerms=Object.freeze({data,normalizeSettings,classForPronoun,selectPronoun,probabilityForSet,suggest,rollSingle,diagnose});
})(window);
