/* Run: node docs/test-practice.js. Integration checks for the local workshop. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const practice=JSON.parse(fs.readFileSync(path.join(root,'json/pronunciation-practice.json'),'utf8'));
const inventory=JSON.parse(fs.readFileSync(path.join(root,'json/ipa-inventory.json'),'utf8'));
let stoppedTracks=0,revoked=0;
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.handlers={};this.value='';this.dataset={};this.hidden=false;this.disabled=false;this.attributes={};this.textContent='';}
 addEventListener(event,handler){this.handlers[event]=handler;}
 setAttribute(name,value){this.attributes[name]=value;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 getContext(){return {fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};}
}
const elements={},filters=['all','oceanic','romance','african','arabic'].map(group=>{
 const b=new Element('button');b.dataset.practiceGroup=group;return b;
});
const elem=id=>elements[id]||(elements[id]=new Element());
elem('practiceWave').width=640;elem('practiceWave').height=92;
const document={getElementById:elem,createElement:tag=>new Element(tag),querySelectorAll(selector){return selector==='[data-practice-group]'?filters:[];}};
const voices=[{lang:'en-US'},{lang:'mi-NZ',localService:true},{lang:'fr-FR',localService:true},{lang:'sw-KE',localService:true},{lang:'ar-SA',localService:true}];
const calls=[];
const tts={stop(){calls.push(['stop'])},speakIPA(ipa,options){calls.push(['model',ipa,options]);return Promise.resolve(true)},
 speakReference(text,locales){calls.push(['reference',text,locales]);return Promise.resolve(true)},
 findReferenceVoice(locales){return voices.find(v=>locales.some(tag=>v.lang.toLowerCase().split('-')[0]===tag.toLowerCase().split('-')[0]))||null;}};
class AudioContextMock{
 createMediaStreamSource(){return {connect(){}};}
 createAnalyser(){return {fftSize:0,getByteTimeDomainData(data){data.fill(128)}};}
 close(){return Promise.resolve();}
}
class MediaRecorderMock{
 static isTypeSupported(){return true;}
 constructor(){this.state='inactive';this.mimeType='audio/webm';}
 start(){this.state='recording';}
 stop(){this.state='inactive';this.ondataavailable({data:new Blob(['my voice'],{type:this.mimeType})});this.onstop();}
}
const stream={getTracks(){return [{stop(){stoppedTracks++}}]}};
const navigator={language:'en-US',mediaDevices:{getUserMedia:async()=>stream}};
const window={AZA_PRACTICE_DATA:practice,AZA_IPA_DATA:inventory,AzaaraanTTS:tts,
 AudioContext:AudioContextMock,MediaRecorder:MediaRecorderMock,
 speechSynthesis:{getVoices:()=>voices,addEventListener(){}},addEventListener(){}};
const URL={createObjectURL(){return 'blob:test-practice'},revokeObjectURL(){revoked++}};
const context={window,document,navigator,URL,Blob,Intl,setTimeout(){},requestAnimationFrame(){return 1},cancelAnimationFrame(){},console};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'script/js/aza/pronunciation-lab.js'),'utf8'),context);
const lab=window.AzaaraanPractice;
function check(ok,message){if(!ok)throw Error(message);}
(async()=>{
 check(lab.selected==='ʔ'&&elem('practiceSoundList').children.length===51,'All requested sounds not rendered');
 filters[1].handlers.click();
 check(lab.group==='oceanic'&&elem('practiceSoundList').children.length===practice.profiles.oceanic.sounds.length,'Oceanic filter');
 check(!elem('practiceReference').disabled,'Māori reference voice unavailable in mock');
 await elem('practiceReference').handlers.click();
 check(calls.at(-1)[1]==='Māori','Regional voice sample not selected');
 lab.setGroup('african');lab.select('ǃ');
 await elem('practiceModel').handlers.click();
 check(calls.at(-1)[0]==='model'&&calls.at(-1)[1]==='ǃ','Click model not requested');
 check(elem('practiceContrast').attributes['aria-pressed']===undefined,'Contrast button state unexpectedly changed');
 elem('practiceLocale').value='fr-FR';elem('practiceLocale').handlers.change();
 check(elem('practiceWorldText').value==='bonjour'&&!elem('practiceWorldSpeak').disabled,'Worldwide sample input');
 await elem('practiceWorldSpeak').handlers.click();
 check(calls.at(-1)[1]==='bonjour','Worldwide voice route');
 await elem('practiceRecord').handlers.click();
 check(elem('practiceRecord').textContent.includes('Finish'),'Recording did not start');
 await elem('practiceRecord').handlers.click();
 check(stoppedTracks===1&&!elem('practicePlayback').hidden,'Recorded clip unavailable or microphone still active');
 check(elem('practiceDownload').href==='blob:test-practice','Local recording save link');
 console.log('51 sound cards, four filters, regional/world voices, local recording: PASSED');
})().catch(e=>{console.error(e);process.exitCode=1});
