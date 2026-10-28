/* Internal IPA parser and browser-readable pronunciation plan. No new UI. */
(()=>{
'use strict';
const D=window.AZA_IPA_DATA;
if(!D)return;
const sequences=Object.keys(D.sequences).sort((a,b)=>b.length-a.length);
const units=Object.keys(D.units).sort((a,b)=>b.length-a.length);
const modifiers=Object.keys(D.modifiers).sort((a,b)=>b.length-a.length);
const clicks=new Set(D.clicks);
const isPunctuation=c=>/[\s,.!?;:()\-–]/u.test(c);

function parse(input){
 let ipa=String(input??'').trim();
 if((ipa.startsWith('/')&&ipa.endsWith('/'))||(ipa.startsWith('[')&&ipa.endsWith(']')))
  ipa=ipa.slice(1,-1);
 const tokens=[],warnings=[];
 for(let at=0;at<ipa.length;){
  const rem=ipa.slice(at);
  const sequence=sequences.find(s=>rem.startsWith(s));
  if(sequence){tokens.push({ipa:sequence,type:'speech',text:D.sequences[sequence]});at+=sequence.length;continue;}
  const unit=units.find(s=>rem.startsWith(s));
  if(unit){
   const type=clicks.has(unit)?'click':unit==='ʔ'?'glottal':'speech';
   tokens.push({ipa:unit,type,text:D.units[unit].speech});at+=unit.length;continue;
  }
  const modifier=modifiers.find(s=>rem.startsWith(s));
  if(modifier){
   tokens.push({ipa:modifier,type:modifier==='ʼ'||modifier==='ˀ'?'glottal':'speech',text:D.modifiers[modifier]});
   at+=modifier.length;continue;
  }
  const char=Array.from(rem)[0];
  if(isPunctuation(char))tokens.push({ipa:char,type:'speech',text:char==='-'?', ':char});
  else warnings.push('Unsupported IPA symbol '+char);
  at+=char.length;
 }
 return {ipa,tokens,warnings:[...new Set(warnings)]};
}

function plan(input){
 const parsed=parse(input),events=[];
 function addSpeech(text){
  if(!text)return;
  const last=events[events.length-1];
  if(last?.type==='speech')last.text+=text;
  else events.push({type:'speech',text});
 }
 for(const token of parsed.tokens){
  if(token.type==='speech')addSpeech(token.text);
  else events.push({type:token.type,ipa:token.ipa});
 }
 const speech=events.filter(e=>e.type==='speech').map(e=>e.text).join('')
  .replace(/\s+/g,' ').trim();
 return {...parsed,events,speech};
}

window.AZA_IPA={parse,plan,inventory:D};
})();
