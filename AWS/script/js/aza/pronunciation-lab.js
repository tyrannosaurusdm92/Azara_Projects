/* Adapted shadowing flow: listen → record locally → replay; no inferred score.
   See docs/GITHUB_SOURCES.md and third-party attribution. */
(()=>{
'use strict';
const P=window.AZA_PRACTICE_DATA,I=window.AZA_IPA_DATA,T=window.AzaaraanTTS;
if(!P||!I||!T)return;
const $=id=>document.getElementById(id);
let group='all',selected='ʔ',runId=0,recorder=null,stream=null,context=null,frame=0,recordingUrl=null;
const allSounds=[...new Set(I.requested)];
function groupSounds(){return group==='all'?allSounds:P.profiles[group].sounds;}
function name(ipa){
 if(P.tips[ipa])return P.tips[ipa].name;
 const item=I.units[ipa];
 if(item)return item.kind==='vowel'?'Vowel':'Consonant';
 return ipa.includes('-')?'Two-part sequence':'Sound sequence';
}
function hint(ipa){
 return P.tips[ipa]?.how||'Listen to the model, repeat it slowly, then play back your recording. Browser voices approximate this IPA.';
}
function status(message){$('practiceStatus').textContent=message;}
function renderSounds(){
 const search=$('practiceSearch').value.trim().toLocaleLowerCase();
 const list=$('practiceSoundList');list.replaceChildren();
 for(const ipa of groupSounds()){
  if(search&&!(`${ipa} ${name(ipa)}`.toLocaleLowerCase().includes(search)))continue;
  const b=document.createElement('button');b.type='button';b.dataset.ipa=ipa;
  b.setAttribute('aria-pressed',String(ipa===selected));b.setAttribute('aria-label',`Practice /${ipa}/: ${name(ipa)}`);
  const symbol=document.createElement('strong');symbol.textContent='/'+ipa+'/';
  const label=document.createElement('small');label.textContent=name(ipa);
  b.append(symbol,label);b.addEventListener('click',()=>select(ipa));list.append(b);
 }
 if(!list.children.length){const p=document.createElement('p');p.className='hint';p.textContent='No matching sound in this group.';list.append(p);}
}
function refreshReference(){
 const profile=P.profiles[group],button=$('practiceReference');
 if(!profile){
  button.disabled=true;$('practiceVoiceStatus').textContent='Choose Oceanic, Romance, African or Arabic for a regional sample.';
  $('practiceGroupNote').textContent='Regional samples are separate from the Aza’raan model voice.';return;
 }
 $('practiceGroupNote').textContent=profile.note;
 const voice=T.findReferenceVoice(profile.locales);
 button.disabled=!voice;
 $('practiceVoiceStatus').textContent=voice?
  `A ${voice.lang} voice is available for a language sample.`:
  'No matching voice is installed on this device. The Aza’raan model remains available.';
}
function localeLabel(tag){
 try{
  const locale=new Intl.Locale(tag.replace('_','-'));
  const languages=new Intl.DisplayNames([navigator.language||'en'],{type:'language'});
  const regions=new Intl.DisplayNames([navigator.language||'en'],{type:'region'});
  return `${languages.of(locale.language)||locale.language}${locale.region?' ('+regions.of(locale.region)+')':''} · ${tag}`;
 }catch{return tag;}
}
function refreshWorldwide(){
 const select=$('practiceLocale'),old=select.value;
 let voices=[];try{voices=window.speechSynthesis?.getVoices()||[];}catch{}
 const locales=[...new Set(voices.map(v=>v.lang).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 select.replaceChildren();
 const initial=document.createElement('option');initial.value='';initial.textContent=locales.length?'Choose an installed language':'No voices reported by this browser';select.append(initial);
 for(const tag of locales){const option=document.createElement('option');option.value=tag;option.textContent=localeLabel(tag);select.append(option);}
 if(locales.includes(old))select.value=old;
 $('practiceWorldSpeak').disabled=!select.value||!$('practiceWorldText').value.trim();
}
function onLocaleChange(){
 const lang=$('practiceLocale').value.split(/[-_]/)[0].toLowerCase();
 $('practiceWorldText').value=P.voiceSamples[lang]||'';
 $('practiceWorldSpeak').disabled=!$('practiceLocale').value||!$('practiceWorldText').value.trim();
}
async function worldwide(){
 const lang=$('practiceLocale').value,text=$('practiceWorldText').value.trim();
 if(!lang||!text)return;
 runId++;status(`Speaking your text through an installed ${lang} voice…`);
 if(!await T.speakReference(text,[lang],Number($('speechRate').value)))
  status('The selected language voice is no longer available.');
 else status('Worldwide voice sample finished. The Aza’raan model is unchanged.');
}
function select(ipa){
 if(!allSounds.includes(ipa))return;
 if(recorder?.state==='recording')stopRecording();
 runId++;T.stop();selected=ipa;
 $('practiceIpa').textContent='/'+ipa+'/';$('practiceName').textContent=name(ipa);
 $('practiceHow').textContent=hint(ipa);
 $('practiceContrast').disabled=!P.tips[ipa]?.contrast;
 $('practiceContrast').textContent=P.tips[ipa]?.contrast?
  `⇄ Contrast /${P.tips[ipa].contrast}/`:'⇄ No contrast set';
 renderSounds();status(`Ready to practice /${ipa}/.`);
}
function setGroup(next){
 if(next!=='all'&&!P.profiles[next])return;
 group=next;runId++;T.stop();
 document.querySelectorAll('[data-practice-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.practiceGroup===next)));
 $('practiceSearch').value='';
 if(!groupSounds().includes(selected))selected=groupSounds()[0];
 select(selected);refreshReference();
}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function model(rate=1){
 const id=++runId;status(`Playing /${selected}/ through the Aza’raan model…`);
 const played=await T.speakIPA(selected,{rate:Math.max(.45,Math.min(1.4,Number($('speechRate').value)*rate))});
 if(id===runId)status(played?`Listen again or record /${selected}/.`:'Model speech is unavailable on this device.');
}
async function repeat(){
 const id=++runId,ipa=selected;
 for(let n=1;n<=3&&id===runId;n++){
  status(`Repetition ${n} of 3 for /${ipa}/…`);
  if(!await T.speakIPA(ipa,{rate:.72})||id!==runId)return;
  if(n<3)await delay(270);
 }
 if(id===runId)status('Three repetitions complete. Try recording your version.');
}
async function contrast(){
 const other=P.tips[selected]?.contrast;if(!other)return;
 const id=++runId,ipa=selected;
 for(const sound of [ipa,other,ipa]){
  if(id!==runId)return;
  status(`Listening: /${sound}/`);
  if(!await T.speakIPA(sound,{rate:.8}))return;
  await delay(230);
 }
 if(id===runId)status(`Contrast: /${ipa}/ — /${other}/ — /${ipa}/.`);
}
async function reference(){
 const profile=P.profiles[group];if(!profile)return;
 const voice=T.findReferenceVoice(profile.locales);if(!voice){refreshReference();return;}
 const language=voice.lang.split(/[-_]/)[0].toLowerCase();
 const sample=P.voiceSamples[language];
 if(!sample){status('This installed voice has no verified sample in the studio.');return;}
 runId++;status(`Playing a ${voice.lang} language sample. It is not an Aza’raan phoneme model.`);
 await T.speakReference(sample,profile.locales,.85);
}
function drawWave(){
 const canvas=$('practiceWave'),ctx=canvas.getContext('2d');if(!ctx)return;
 const width=canvas.width,height=canvas.height;
 ctx.fillStyle='#081a23';ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='#9ac6b4';ctx.lineWidth=1.5;ctx.beginPath();
 const values=new Uint8Array(512);
 if(context?.analyser)context.analyser.getByteTimeDomainData(values);
 else values.fill(128);
 for(let i=0;i<values.length;i++){
  const x=i/(values.length-1)*width,y=values[i]/255*height;
  if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
 }
 ctx.stroke();
 if(recorder?.state==='recording')frame=requestAnimationFrame(drawWave);
}
function releaseMic(){
 if(frame)cancelAnimationFrame(frame);frame=0;
 stream?.getTracks().forEach(t=>t.stop());stream=null;
 if(context?.audio&&context.audio.state!=='closed')context.audio.close().catch(()=>{});
 context=null;
 $('practiceRecord').textContent='● Record my attempt';
 drawWave();
}
function stopRecording(){
 if(recorder?.state==='recording')recorder.stop();
 else releaseMic();
}
async function record(){
 if(recorder?.state==='recording'){stopRecording();status('Preparing your recording…');return;}
 if(!navigator.mediaDevices?.getUserMedia||typeof window.MediaRecorder!=='function'){
  status('Recording needs microphone access and MediaRecorder in a supported browser.');return;
 }
 runId++;T.stop();
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio){
   try{
    const audio=new Audio(),source=audio.createMediaStreamSource(stream),analyser=audio.createAnalyser();
    analyser.fftSize=1024;source.connect(analyser);context={audio,analyser};
   }catch{context=null;}
  }
  const formats=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'];
  const mime=formats.find(x=>window.MediaRecorder.isTypeSupported?.(x));
  recorder=new window.MediaRecorder(stream,mime?{mimeType:mime}:undefined);
  const current=recorder,chunks=[];current.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  current.onstop=()=>{
   const type=current.mimeType||chunks[0]?.type||'audio/webm';
   const blob=new Blob(chunks,{type});
   releaseMic();
   if(!blob.size){status('The microphone did not capture audio.');return;}
   if(recordingUrl)URL.revokeObjectURL(recordingUrl);
   recordingUrl=URL.createObjectURL(blob);
   $('practicePlayback').src=recordingUrl;$('practicePlayback').hidden=false;
   const download=$('practiceDownload');download.href=recordingUrl;
   download.download='azaaraan-practice.'+(type.includes('ogg')?'ogg':type.includes('mp4')?'m4a':'webm');
   download.hidden=false;status('Recording ready. Play it back beside the model.');
  };
  current.onerror=()=>{releaseMic();status('Recording failed. Please try again.')};
  current.start();$('practiceRecord').textContent='■ Finish recording';
  status(`Recording your /${selected}/ attempt…`);drawWave();
 }catch(e){releaseMic();status('Microphone access was unavailable or declined.');}
}
function init(){
 document.querySelectorAll('[data-practice-group]').forEach(b=>b.addEventListener('click',()=>setGroup(b.dataset.practiceGroup)));
 $('practiceSearch').addEventListener('input',renderSounds);
 $('practiceModel').addEventListener('click',()=>model(1));$('practiceSlow').addEventListener('click',()=>model(.65));
 $('practiceRepeat').addEventListener('click',repeat);$('practiceContrast').addEventListener('click',contrast);
 $('practiceStop').addEventListener('click',()=>{runId++;T.stop();status('Stopped.');});
 $('practiceReference').addEventListener('click',reference);$('practiceRecord').addEventListener('click',record);
 $('practiceLocale').addEventListener('change',onLocaleChange);
 $('practiceWorldText').addEventListener('input',()=>{$('practiceWorldSpeak').disabled=!$('practiceLocale').value||!$('practiceWorldText').value.trim()});
 $('practiceWorldSpeak').addEventListener('click',worldwide);
 select(selected);refreshReference();refreshWorldwide();drawWave();
 window.speechSynthesis?.addEventListener?.('voiceschanged',()=>{refreshReference();refreshWorldwide()});
 setTimeout(()=>{refreshReference();refreshWorldwide()},1300);
 window.addEventListener('pagehide',()=>{
  runId++;if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop();}
  releaseMic();if(recordingUrl)URL.revokeObjectURL(recordingUrl);
 });
}
init();
window.AzaaraanPractice={get group(){return group},get selected(){return selected},setGroup,select};
})();
