/* Aza’raan — deterministic 24-mark composition and internal IPA audio plan.
   Delivery controls NEVER change phoneme assignments. */
(()=>{
'use strict';
const P=window.AZA_TTS_DATA, D=window.AZA_DATA, IPA=window.AZA_IPA;
const $=id=>document.getElementById(id);
if(!P||!D||!IPA)return;
const synth=typeof window.speechSynthesis!=='undefined'?window.speechSynthesis:null;
const byOutput=D.marks.slice().sort((a,b)=>b.output.length-a.output.length);
const latinMarkId={'\u0301':'C01','\u0300':'C02','\u0302':'C03','\u030C':'C04','\u0304':'C05','\u0306':'C06','\u0308':'C07','\u0303':'C08','\u0328':'C09','\u0327':'C10','\u0307':'C11','\u0335':'C12'};
const baseToKey=Object.fromEntries(Object.entries(D.keys).map(([key,value])=>[value,key]));
for(const [key,value] of Object.entries(D.vowelCarriers))baseToKey[value]=key;
for(const key of ['F','V'])if(window.AZA_CONFIG?.letterMap[key])baseToKey[window.AZA_CONFIG.letterMap[key]]=key;
const vowelKeys=new Set(['A','E','I','O','U']);
const consonantSuffixes={'C08':'g','C11':'f','C12':'b','K01':'z','K02':'s','K03':'tʃ','K06':'d','K07':'k','K08':'l','K09':'m','K10':'n','K11':'r','K12':'t'};
const speechSounds={'æ':'a','ɛ':'e','ɪ':'i','ʌ':'uh','ɑː':'ah','iː':'ee','uː':'oo','ɔɪ':'oy','oʊ':'oh',
  'ʃ':'sh','θ':'th','ɲ':'ny','ŋ':'ng','dʒ':'j','tʃ':'ch','r͡r':'r','j':'y','w':'w'};
const romanTokens=P.latinTokens.slice().sort((a,b)=>b.letters.length-a.letters.length);
let voice=null,active=null,activeAudio=null,audioContext=null,finishPending=null,readToken=0;
function isBase(ch){const n=ch.codePointAt(0);return n>=0x1780&&n<=0x17B3;}
function isMark(ch){const n=ch.codePointAt(0);return n>=0x17B4&&n<=0x17DD;}
function chunks(text){const out=[];let word='',wasCoeng=false;
 for(const ch of text){
  if(isBase(ch)&&!wasCoeng){if(word)out.push(word);word=ch;}
  else if(word&&(isMark(ch)||(wasCoeng&&isBase(ch))))word+=ch;
  else{if(word)out.push(word);word=ch;}
  wasCoeng=ch==='\u17D2'&&!!word;
 }
 if(word)out.push(word);return out;
}
function readKhmerIds(unit){let remainder=Array.from(unit).slice(1).join('');const ids=[];let unknown=false;
 while(remainder){const mark=byOutput.find(m=>remainder.startsWith(m.output));
  if(mark){ids.push(mark.id);remainder=remainder.slice(mark.output.length);}
  else{unknown=true;remainder=remainder.slice(Array.from(remainder)[0].length);}
 }
 return {ids,unknown};
}
function readable(ipa){let result='';for(const p of Array.from(ipa))result+=speechSounds[p]||p;return result;}
function part(ipa,speech){return {ipa,speech:speech??readable(ipa)};}
function compound(key,markIds,extraUnknown=false){
 const marks=new Set(markIds), warnings=[];
 const known=new Set(D.marks.map(m=>m.id));
 if(markIds.some(id=>!known.has(id))||extraUnknown)warnings.push('Unrecognized mark sequence');
 const base=P.keyIpa[key];if(!base)return {ipa:'',speech:'',warnings:['Unknown Aza’raan base letter']};
 const vowelIds=Object.keys(P.vowelMarks).filter(id=>marks.has(id));
 if(vowelIds.length>1)warnings.push('Conflicting vowel accents: only one of Short A/E/I/U or Long A/E/U can be active');
 const vowelId=vowelIds[0]||null;
 const modifierIds=markIds.filter(id=>P.accents[id]&&id!=='K05');
 let onset=base, nucleus='', coda='', speechOnset=P.keySpeech[key],speechNucleus='',speechCoda='';
 if(marks.has('K05')){
  if(modifierIds.length)warnings.push('Base conflicts with sound-changing accents; Base wins');
  // The Base accent is an explicit reset; it does not alter the base sound.
 }else{
  const rules={
   'N':[['C08','ŋ','ng'],['C10','ɲ','ny']],
   'B':[['C09','v','v'],['C11','f','f']],
   'W':[['C12','b','b']],
   'T':[['K03','tʃ','ch'],['K04','θ','th']],
   'D':[['K03','dʒ','j']],
   'S':[['K04','ʃ','sh']],
   'O':[['C10','ɔɪ','oy'],['K04','oʊ','oh']]
  };
  const matches=(rules[key]||[]).filter(row=>marks.has(row[0]));
  if(matches.length>1)warnings.push('Competing sound-change marks: first specified rule takes precedence');
  const used=new Set();
  if(matches.length){
   const [id,ipa,speech]=matches[0];onset=ipa;speechOnset=speech;
   for(const row of matches)used.add(row[0]);
  }
  if(vowelId){
   const v=P.vowelMarks[vowelId];
   if(vowelKeys.has(key)){
    if(matches.length&&key==='O')warnings.push('O + Y / O + Hard H combined with a vowel accent; the explicit vowel accent takes precedence');
    onset='';speechOnset='';
   }
   nucleus=v.ipa;speechNucleus=v.speech;
  }
  // W/Y act as syllable-onset glides unless they were already used in a contextual rewrite.
  if(marks.has('C09')&&!used.has('C09')){
    if(vowelKeys.has(key)&&!vowelId){onset+='w';speechOnset+='w';}
    else {onset+='w';speechOnset+='w';}
    used.add('C09');
  }
  if(marks.has('C10')&&!used.has('C10')){onset+='j';speechOnset+='y';used.add('C10');}
  for(const id of ['C08','C11','C12','K01','K02','K03','K06','K07','K08','K09','K10','K11','K12']){
    if(!marks.has(id)||used.has(id))continue;
    const value=consonantSuffixes[id];coda+=value;speechCoda+=readable(value);used.add(id);
  }
  if(marks.has('K04')&&!used.has('K04'))warnings.push('Hard H has no defined phoneme change on '+key+'; base preserved');
 }
 const prefix=marks.has('S01')?'ʔ':'';const click=marks.has('S02')?'ǃ':'';
 const speechPrefix=marks.has('S01')?', ':'';
 return {ipa:click+prefix+onset+nucleus+coda,
  speech:speechPrefix+speechOnset+speechNucleus+speechCoda,warnings};
}
function canonicalCompound(key,markIds,extraUnknown=false){
 const base=key==='F'?'B':key==='V'?'B':key;
 const ids=key==='F'?['C11',...markIds.filter(id=>id!=='C11')]:
           key==='V'?['C09',...markIds.filter(id=>id!=='C09')]:markIds;
 const warnings=[];
 if(extraUnknown)warnings.push('Unrecognized Khmer mark sequence');
 // Always use the keyboard's validated sound-to-script rules as the IPA source.
 const ph=window.AzaaraanPhonetics;
 if(ph){
  try{
   const unit=ph.compile([base,...ids],'modern');
   const ipa=unit.ipa.slice(1,-1);
   const planned=IPA.plan(ipa);
   warnings.push(...planned.warnings);
   return {ipa,speech:planned.speech,warnings:[...new Set(warnings)]};
  }catch(e){
   warnings.push('Invalid accent recipe: '+(e.message||String(e)));
   // Fail safely: never silently pronounce a disallowed combination as another sound.
   return {ipa:'',speech:'',warnings};
  }
 }
 const legacy=compound(base,ids,extraUnknown);
 return {...legacy,warnings:[...new Set([...warnings,...legacy.warnings])]};
}
function khmerPart(unit){const first=Array.from(unit)[0];const key=baseToKey[first];if(!key)return {ipa:'',speech:'',warnings:['Unknown Khmer letter']};
 const parsed=readKhmerIds(unit);return canonicalCompound(key,parsed.ids,parsed.unknown);
}
function romanWord(word){
 const standard=word.toLocaleLowerCase('en-US').replace(/[‘ʼʻ]/g,'’').replace(/'/g,'’');
 if(P.canonicalNames[standard]){const p=P.canonicalNames[standard];return {...p,warnings:[]};}
 const personal=window.AzaaraanPhonetics;
 if(personal){
  let remembered=null;
  try{
   const saved=JSON.parse(localStorage.getItem('azaaraan-pronunciations-merged-v4')||'{}');
   remembered=saved?.[personal.normalize(word)]||null;
  }catch{}
  const recipe=remembered||personal.known(word)?.recipe;
  if(recipe){
   try{
    const units=personal.fromRecipe(recipe,'modern').units;
    const ipa=units.map(u=>u.ipa.slice(1,-1)).join('');
    return {ipa,speech:IPA.plan(ipa).speech,warnings:[]};
   }catch(e){return {ipa:'',speech:'',warnings:['Stored pronunciation cannot be read: '+e.message]};}
  }
 }
 let ipa='',speech='',warnings=[];
 const chars=Array.from(word.normalize('NFD'));let i=0;
 while(i<chars.length){
  const ch=chars[i];
  if(/[a-z]/i.test(ch)&&i+1<chars.length&&latinMarkId[chars[i+1]]){
   const ids=[];const key=ch.toUpperCase();i++;
   while(i<chars.length&&latinMarkId[chars[i]]){ids.push(latinMarkId[chars[i]]);i++;}
   if(P.keyIpa[key]||key==='F'||key==='V'){const v=canonicalCompound(key,ids);ipa+=v.ipa;speech+=v.speech;warnings.push(...v.warnings);}
   else warnings.push('Unknown marked base '+ch);
   continue;
  }
  const remaining=chars.slice(i).join('').toLocaleLowerCase('en-US').replace(/[‘ʼʻ’]/g,"'");
  const matched=romanTokens.find(t=>remaining.startsWith(t.letters));
  if(matched){ipa+=matched.ipa;speech+=matched.speech;i+=Array.from(matched.letters).length;}
  else{warnings.push('Unrecognized romanized character '+ch);i++;}
 }
 return {ipa,speech,warnings};
}
function transcribe(raw){
 const original=String(raw??'');
 // Bare IPA with phonetic symbols is useful for auditing a single sound.
 if(!/[\u1780-\u17FF]/u.test(original)&&/[ʔʃʒθðŋɲɣɑɛæɪʌɔʁçǀǃǂǁʘɾɭɳʈɖ]/u.test(original)&&
    !/[A-Z]/.test(original)&&!original.includes('/')){
  const r=IPA.plan(original);return {ipa:r.ipa.trim()?'/'+r.ipa.trim()+'/':'—',speech:r.speech,
   plan:r.events,uncertain:r.warnings.length>0,warnings:r.warnings};
 }
 const input=original.normalize('NFD');let ipa='',warnings=[];
 const runs=input.match(/\/[^\/\r\n]+\/|\[[^\]\r\n]+\]|[\u1780-\u17FF]+|[A-Za-zÀ-ž\u0300-\u036F'’ʻʼ]+|[^\u1780-\u17FFA-Za-zÀ-ž\u0300-\u036F'’ʻʼ]+/gu)||[];
 for(const run of runs){
  if((run.startsWith('/')&&run.endsWith('/'))||(run.startsWith('[')&&run.endsWith(']'))){
    const r=IPA.parse(run);ipa+=r.ipa;warnings.push(...r.warnings);
  }else if(/[\u1780-\u17FF]/u.test(run)){
    const units=chunks(run);
    for(let i=0;i<units.length;i++){
      if(units[i]==='៉'){ipa+='ʔ';continue;}
      if(units[i]==='្ឃ'){ipa+='ǃ';continue;}
      if(units[i]==='្'&&units[i+1]==='ឃ'){ipa+='ǃ';i++;continue;}
      const r=khmerPart(units[i]);ipa+=r.ipa;warnings.push(...r.warnings);
    }
  }
  else if(/[A-Za-zÀ-ž]/u.test(run)){
    const r=romanWord(run);ipa+=r.ipa;warnings.push(...r.warnings);
  }else ipa+=run.replace(/¡/g,'ǃ');
 }
 const pronunciation=IPA.plan(ipa);warnings.push(...pronunciation.warnings);
 return {ipa:ipa.trim()?'/'+ipa.trim()+'/':'—',speech:pronunciation.speech,plan:pronunciation.events,
  uncertain:warnings.length>0,warnings:[...new Set(warnings)]};
}
// Read the writing desk's logical units before Khmer serialization reorders
// the selected marks. This also preserves complete Archaic standalone signs.
function transcribeTokens(source){
 let ipa='',warnings=[],literal='';
 const flushLiteral=()=>{
  if(!literal)return;
  const r=transcribe(literal);
  ipa+=r.ipa==='—'?'':r.ipa.slice(1,-1);warnings.push(...r.warnings);literal='';
 };
 for(const token of source||[]){
  if(token.type==='literal'){literal+=token.value||'';continue;}
  flushLiteral();
  if(token.type==='glyph'){
   const r=canonicalCompound(token.base,token.marks||[]);
   if(typeof token.phonetic==='string'&&token.phonetic)ipa+=token.phonetic;
   else {ipa+=r.ipa;warnings.push(...r.warnings);}
  }else if(token.type==='sign'){
   if(token.sign==='ʔ')ipa+='ʔ';
   else if(token.sign==='¡'||token.sign==='ǃ')ipa+='ǃ';
   else warnings.push('Unknown standalone sign '+token.sign);
  }else if(token.type==='space')ipa+=' ';
  else if(token.type==='break')ipa+='\n';
 }
 flushLiteral();
 const pronunciation=IPA.plan(ipa);warnings.push(...pronunciation.warnings);
 return {ipa:ipa.trim()?'/'+ipa.trim()+'/':'—',speech:pronunciation.speech,plan:pronunciation.events,
  uncertain:warnings.length>0,warnings:[...new Set(warnings)]};
}
let linkedToDesk=false;
function currentSpeech(){return linkedToDesk&&window.AzaaraanStudio?
 transcribeTokens(window.AzaaraanStudio.getTokens()):transcribe($('speechText').value);}
function syncPreview(){
 const r=currentSpeech();
 $('speechIpa').textContent=r.ipa;
 $('speechPreview').textContent=r.speech||
  (r.plan.some(e=>e.type==='click'||e.type==='glottal')?'Percussive sound cue':'—');
 $('speechWarning').textContent=r.warnings.length?'Check spelling: '+r.warnings.join(' · '):'';
 return r;
}
function syncComposition(){
 const r=window.AzaaraanStudio?.getTokens ? transcribeTokens(window.AzaaraanStudio.getTokens()) : transcribe($('speechText').value);
 $('compositionIpa').textContent=r.ipa;
 $('compositionPreview').textContent=r.speech||
  (r.plan.some(e=>e.type==='click'||e.type==='glottal')?'Percussive sound cue':'—');
 $('compositionWarning').textContent=r.warnings.length?'Check marks: '+r.warnings.join(' · '):'';
 if(linkedToDesk){$('speechText').value=window.Notes?.getText?.()||'';syncPreview();}
 return r;
}
function status(message){$('speechStatus').textContent=message;}
function resolveVoice(){
 if(!synth||typeof window.SpeechSynthesisUtterance!=='function'){
  voice=null;$('speakText').disabled=true;
  status('Browser speech is unavailable; percussive sound cues may still play.');return;
 }
 let candidates=[];try{candidates=synth.getVoices().filter(x=>/^en[-_]US$/i.test(x.lang));}catch{}
 if(!candidates.length)try{candidates=synth.getVoices().filter(x=>/^en([-_]|$)/i.test(x.lang));}catch{}
 const select=$('voiceChoice');
 if(select){const previous=select.value;const listed=(()=>{try{return synth.getVoices()}catch{return []}})();
  select.replaceChildren(new Option('Automatic browser voice',''));
  listed.forEach((v,i)=>{const opt=new Option(v.name+' ('+v.lang+')',v.voiceURI||v.name+'|'+v.lang);select.append(opt)});
  select.value=previous;
 }
 let chosen=null;
 for(const name of P.voicePolicy.namePriority){chosen=candidates.find(x=>x.name.toLowerCase().includes(name.toLowerCase()));if(chosen)break;}
 const preference=select?.value||'';
 if(preference){const installed=synth.getVoices();voice=installed.find(v=>(v.voiceURI||v.name+'|'+v.lang)===preference)||chosen||candidates[0]||null;}
 else voice=chosen||candidates[0]||null;
 $('speakText').disabled=false;
 status(voice?'Speech engine ready.':'Using browser default voice. Sound may differ by device.');
}
function stop(){
 readToken++;try{synth?.cancel();}catch{}try{activeAudio?.stop();}catch{}
 activeAudio=null;active=null;finishPending?.();finishPending=null;
 status(voice?'Stopped. Ready to speak.':'Speech engine unavailable.');
}
function baseValue(){return Number($('voiceBase').value);}
function pitchFromBase(value){const policy=P.baseSlider;return policy.pitchMin+(policy.pitchMax-policy.pitchMin)*(value/100);}
function updateDials(){
 const n=baseValue();$('voiceBaseOut').textContent=n<25?'Masculine':n<75?(n===50?'Androgynous':n<50?'Masculine–Androgynous':'Androgynous–Feminine'):'Feminine';
 $('speechRateOut').textContent=Number($('speechRate').value).toFixed(2)+'×';
 $('speechVolumeOut').textContent=Math.round(Number($('speechVolume').value)*100)+'%';
}
function speakSegment(text,token,selectedVoice=voice,rate=Number($('speechRate').value)){
 return new Promise(resolve=>{
  if(!synth||!text.trim()||token!==readToken){resolve();return;}
  const u=new window.SpeechSynthesisUtterance(text);
  u.lang=selectedVoice?.lang||'en-US';if(selectedVoice)u.voice=selectedVoice;u.pitch=pitchFromBase(baseValue());
  u.rate=rate;u.volume=Number($('speechVolume').value);
  const finish=()=>{if(active===u)active=null;if(finishPending===finish)finishPending=null;resolve();};
  u.onstart=()=>{if(token===readToken)status('Speaking Aza’raan…');};
  u.onend=finish;u.onerror=e=>{if(token===readToken)status('Speech failed ('+(e.error||'unknown')+').');finish();};
  active=u;finishPending=finish;
  try{synth.speak(u);status('Sending Aza’raan to speech synthesis…');}
  catch(e){status('Unable to start speech: '+e.message);finish();}
 });
}
function playCue(kind,token){
 return new Promise(async resolve=>{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context||token!==readToken){resolve();return;}
  try{
   audioContext ||= new Context();await audioContext.resume();
   if(token!==readToken){resolve();return;}
   const rate=audioContext.sampleRate,length=Math.floor(rate*(kind==='click'?0.10:0.075));
   const buffer=audioContext.createBuffer(1,length,rate),data=buffer.getChannelData(0);
   // A click has a sharp front release and a quiet second release. A glottal
   // stop is a closure followed by a smaller release; isolated silence alone
   // would make it impossible to hear in the studio.
   for(let i=0;i<length;i++){
    const t=i/rate;
    const burst=kind==='click'?
      (t<0.016?Math.exp(-t*300):t>0.045&&t<0.058?0.3*Math.exp(-(t-0.045)*480):0):
      (t>0.032&&t<0.053?0.27*Math.exp(-(t-0.032)*380):0);
    data[i]=(Math.random()*2-1)*burst;
   }
   const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();
   filter.type='highpass';filter.frequency.value=kind==='click'?1800:750;
   gain.gain.value=Number($('speechVolume').value);
   source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
   const finish=()=>{
    if(activeAudio===source)activeAudio=null;
    if(finishPending===finish)finishPending=null;
    resolve();
   };
   activeAudio=source;finishPending=finish;source.onended=finish;
   source.start();status(kind==='click'?'Playing Aza’raan click…':'Marking glottal closure…');
  }catch(e){status('Percussive sound is unavailable in this browser.');resolve();}
 });
}
async function performPlan(content,options={}){
 if(!content.plan.length){status('Type Aza’raan text first.');return false;}
 resolveVoice();
 const selectedVoice=options.voiceOverride||voice;
 if(!synth&&content.plan.some(e=>e.type==='speech'&&e.text.trim())){
  status('A browser speech voice is needed for this text.');return false;
 }
 stop();const token=readToken;
 for(const event of content.plan){
  if(token!==readToken)break;
  if(event.type==='speech')await speakSegment(event.text,token,selectedVoice,options.rate??Number($('speechRate').value));
  else await playCue(event.type,token);
 }
 if(token===readToken){active=null;status('Finished speaking.');}
 return token===readToken;
}
function speak(){return performPlan(syncPreview());}
function speakComposition(){return performPlan(syncComposition());}
function speakIPA(ipa,options={}){return performPlan(transcribe('/'+String(ipa).replace(/^\/|\/$/g,'')+'/'),options);}
function findReferenceVoice(locales){
 if(!synth)return null;
 let available=[];try{available=synth.getVoices();}catch{return null;}
 for(const tag of locales){
  const exact=available.filter(v=>v.lang?.toLowerCase()===tag.toLowerCase());
  if(exact.length)return exact.find(v=>v.localService)||exact[0];
  const primary=tag.split('-')[0].toLowerCase();
  const family=available.filter(v=>v.lang?.toLowerCase().split(/[-_]/)[0]===primary);
  if(family.length)return family.find(v=>v.localService)||family[0];
 }
 return null;
}
async function speakReference(text,locales,rate=0.85){
 const reference=findReferenceVoice(locales);
 if(!reference){status('No matching reference voice is installed.');return false;}
 stop();const token=readToken;
 await speakSegment(text,token,reference,rate);
 if(token===readToken)status('Reference voice sample finished.');
 return token===readToken;
}
function init(){
 $('voiceChoice')?.addEventListener('change',resolveVoice);
 $('speechText').addEventListener('input',()=>{linkedToDesk=false;syncPreview();});
 document.querySelectorAll('[data-tts-example]').forEach(b=>b.addEventListener('click',()=>{linkedToDesk=false;$('speechText').value=b.dataset.ttsExample;syncPreview();}));
 $('useManuscript').addEventListener('click',()=>{
  const value=window.Notes?.getText?.()||'';if(!value.trim()){status('Choose a writing page or notes field with text first.');return;}
  linkedToDesk=false;$('speechText').value=value;syncPreview();
  $('speechText').scrollIntoView?.({behavior:'smooth',block:'nearest'});
 });
 $('speakText').addEventListener('click',speak);$('stopSpeech').addEventListener('click',stop);
 $('speakComposition').addEventListener('click',speakComposition);
 $('stopComposition').addEventListener('click',stop);
 window.addEventListener('azaaraan:change',syncComposition);
 for(const id of ['voiceBase','speechRate','speechVolume'])$(id).addEventListener('input',updateDials);
 $('resetSpeech').addEventListener('click',()=>{$('voiceBase').value='100';$('speechRate').value='1';$('speechVolume').value='1';updateDials();});
 updateDials();syncPreview();syncComposition();resolveVoice();
 if(synth?.addEventListener)synth.addEventListener('voiceschanged',resolveVoice);
 if(synth&&!voice)setTimeout(resolveVoice,1300);
 window.addEventListener('pagehide',()=>{try{synth?.cancel();}catch{}});
}
init();
window.AzaaraanTTS={transcribe,transcribeTokens,readText: raw=>{linkedToDesk=false;$('speechText').value=String(raw||'');syncPreview();return performPlan(transcribe(raw));},previewText: raw=>transcribe(raw),compound:canonicalCompound,pitchFromBase,ipaPlan:IPA.plan,speakIPA,speakReference,speakComposition,
 findReferenceVoice,stop,
 get voiceName(){return voice?.name||null;},get speaking(){return !!active||!!activeAudio;}};
})();
