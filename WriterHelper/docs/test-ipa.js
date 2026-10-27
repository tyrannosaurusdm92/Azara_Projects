/* Run: node docs/test-ipa.js. Tests only documented phoneme mappings and cues. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'json/ipa-inventory.json'),'utf8'));
const system=JSON.parse(fs.readFileSync(path.join(root,'json/azaaraan-config.json'),'utf8'));
const marks=[...system.accents,...system.specials];
const ui={},handlers={};
const element=id=>ui[id]||(ui[id]={value:id==='voiceBase'?'100':id==='speechRate'||id==='speechVolume'?'1':'',
 textContent:'',disabled:false,addEventListener(event,fn){handlers[id+':'+event]=fn;}});
let audibleCues=0,utterances=[];
class AudioContextMock{
 constructor(){this.sampleRate=44100;this.destination={};}
 resume(){return Promise.resolve();}
 createBuffer(_channels,n){return {getChannelData(){return new Float32Array(n)}};}
 createBufferSource(){return {connect(){},start(){audibleCues++;queueMicrotask(()=>this.onended?.());},stop(){this.onended?.();}};}
 createBiquadFilter(){return {frequency:{value:0},connect(){}};}
 createGain(){return {gain:{value:0},connect(){}};}
}
const voice={name:'Test voice',lang:'en-US'},maori={name:'Māori local',lang:'mi-NZ',localService:true},
 french={name:'French local',lang:'fr-FR',localService:true},arabic={name:'Arabic local',lang:'ar-SA',localService:true};
const synth={getVoices(){return [voice,maori,french,arabic]},cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend?.());}};
const window={speechSynthesis:synth,AudioContext:AudioContextMock,
 SpeechSynthesisUtterance:function(text){this.text=text;},addEventListener(){}};
const document={getElementById:element,querySelectorAll(){return []},querySelector(){return {click(){}}}};
const context={window,document,console,setTimeout,queueMicrotask};vm.createContext(context);
for(const file of ['js/config.js','js/voice-adapter.js','js/tts-data.js','js/ipa-data.js','js/ipa.js','js/tts.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const {plan}=window.AZA_IPA,{transcribe}=window.AzaaraanTTS;
function check(ok,description){if(!ok)throw Error(description);}
check(JSON.stringify(inventory)===JSON.stringify(window.AZA_IPA_DATA),'JSON/JS inventory mismatch');
for(const symbol of inventory.requested){
 const parsed=plan('/'+symbol+'/');
 check(parsed.warnings.length===0,'Creator IPA unsupported: /'+symbol+'/ '+parsed.warnings);
 check(parsed.ipa===symbol,'Creator IPA changed: '+symbol);
 check(transcribe('/'+symbol+'/').ipa==='/'+symbol+'/','Typed IPA not preserved: '+symbol);
}
let referenceCount=0;
for(const [name,symbols] of Object.entries(inventory.references))for(const symbol of symbols){
 referenceCount++;
 const result=plan('/'+symbol+'/');
 check(result.warnings.length===0,name+' phoneme unsupported: /'+symbol+'/ '+result.warnings);
}
check(plan('/ʔ/').events.some(x=>x.type==='glottal'),'No glottal sound event');
check(plan('/ǃ/').events.some(x=>x.type==='click'),'No Aza’raan click event');
check(plan('/eɪ-ɛ/').speech==='ay, eh','Hiatus combination lost');
check(plan('/ow/').speech==='ow','/ow/ mapping lost');
const clickKhmer=system.letterMap.T+marks.find(m=>m.id==='S02').khmer;
check(transcribe(clickKhmer).plan.some(x=>x.type==='click'),'Khmer click mark has no sound event');
const glottalKhmer=system.letterMap.N+marks.find(m=>m.id==='S01').khmer;
check(transcribe(glottalKhmer).plan.some(x=>x.type==='glottal'),'Khmer glottal mark has no sound event');
check(transcribe('/ɣ/').plan.some(x=>x.text==='gh'),'Voiced velar fricative not mapped');
check(transcribe('/ɣ/').uncertain===false,'Supported phone shown as unknown');
check(transcribe('/☃/').uncertain,'Unsupported IPA silently accepted');

(async()=>{
 check(window.AzaaraanTTS.findReferenceVoice(['mi-NZ'])===maori,'Oceanic reference voice routing');
 check(window.AzaaraanTTS.findReferenceVoice(['fr'])===french,'Romance reference voice routing');
 check(window.AzaaraanTTS.findReferenceVoice(['ar-EG','ar'])===arabic,'Arabic regional fallback');
 check(window.AzaaraanTTS.findReferenceVoice(['sw'])===null,'Unavailable African voice should not pretend to exist');
 await window.AzaaraanTTS.speakReference('bonjour',['fr-FR']);
 check(utterances.at(-1).voice===french&&utterances.at(-1).text==='bonjour','Reference sample did not use French voice');
 const before=utterances.length;
 await window.AzaaraanTTS.speakIPA('ŋ');
 check(utterances.at(-1).voice===voice&&utterances.length===before+1,'Aza’raan model voice changed during practice');
 utterances=[];
 ui.speechText.value='/ǃ/';await handlers['speakText:click']();
 check(audibleCues===1,'Isolated click was not sounded');
 ui.speechText.value='/ʔ/';await handlers['speakText:click']();
 check(audibleCues===2,'Isolated glottal cue was not sounded');
 ui.speechText.value='/tæzǃɑː/';await handlers['speakText:click']();
 check(audibleCues===3,'Embedded click was not sounded');
 check(utterances.length===2,'Speech was not split around the click');
 console.log(`${inventory.requested.length} creator entries + ${referenceCount} reference symbols + sound-event checks: PASSED`);
})().catch(e=>{console.error(e);process.exitCode=1});
