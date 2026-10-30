(function(){
'use strict';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const widget=$('onyxWidget'),bubble=$('onyxBubble'),panel=$('onyxPopout'),canvas=$('onyxCanvas'),fallback=$('onyxFallback');
if(!widget||!bubble||!panel||!canvas)return;
const adminTestMode=()=>/^#admin(?:$|[&?=])/i.test(String(location.hash||""));
function syncAdminTestMarker(){
  const enabled=adminTestMode();
  widget.dataset.adminTest=String(enabled);
  document.documentElement.dataset.onyxAdminTest=String(enabled);
  window.ONYX_ADMIN_TEST=enabled;
  return enabled;
}
syncAdminTestMarker();
window.addEventListener("hashchange",()=>{
  const enabled=syncAdminTestMarker();
  const status=document.getElementById("onyxBackendStatus");
  if(status)status.textContent='Ready';
});
const ART_SIZE=72,RENDER_SCALE=3;
let ctx=null;try{
  if(canvas.width!==ART_SIZE*RENDER_SCALE)canvas.width=ART_SIZE*RENDER_SCALE;
  if(canvas.height!==ART_SIZE*RENDER_SCALE)canvas.height=ART_SIZE*RENDER_SCALE;
  ctx=canvas.getContext('2d',{alpha:true});
  if(ctx){ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);ctx.imageSmoothingEnabled=false}
}catch(_){ctx=null}
function makeArtLayer(){const c=document.createElement('canvas');c.width=ART_SIZE;c.height=ART_SIZE;const x=c.getContext('2d',{alpha:true});if(x)x.imageSmoothingEnabled=false;return{canvas:c,ctx:x}}
const spriteLayer=makeArtLayer(),tintLayer=makeArtLayer(),detailLayer=makeArtLayer();
const ART={outline:'#04070d',rim:'#63eeff',rimSoft:'#2fb9dc',shadow:'#000103',white:'#fffdf8',cyan:'#b9f7ff',blue:'#19c8ee',deepBlue:'#0b5c86',green:'#a8df72',greenDark:'#315735',pink:'#ff9fc8',gold:'#f2dc87',violet:'#bf9cff'};
const artFx={stateAt:performance.now(),careAt:0,careKind:'',from:'sleepy',to:'sleepy'};
const KEY_BASE='onyxAutonomousPsychPetV6',POS='onyxAutonomousPsychPetPosV7LeftDefault',FRAME_PIXELS=72*72,LOAD_TIMEOUT=12000;
const defaults={energy:76,hunger:70,joy:80,affection:95,comfort:88,paused:false,lastSaved:Date.now(),lastInteractionAt:Date.now(),lastChatAt:0,lastCareAt:0,lastCareAction:'',careCount:0,visits:0};
function localProfileId(){const candidates=[window.BelavadosProfiles?.getActiveProfile?.(),document.documentElement.dataset.belavadosProfile,window.OnyxBackendClient?.activeProfile?.()];for(const v of candidates){const k=String(v||'').toLowerCase();if(['william','jasper','shared'].includes(k))return k}return'shared'}
function petStorageKey(profile=localProfileId()){return KEY_BASE+':'+String(profile||'shared').toLowerCase()}
function loadLocalPet(profile=localProfileId()){let parsed=null;try{parsed=JSON.parse(localStorage.getItem(petStorageKey(profile))||'null');if(!parsed){const legacy=JSON.parse(localStorage.getItem(KEY_BASE)||'null');if(legacy){parsed=legacy;localStorage.setItem(petStorageKey(profile),JSON.stringify(legacy))}}}catch(_){}return parsed?{...defaults,...parsed}:{...defaults}}
let localPetProfile=localProfileId(),pet=loadLocalPet(localPetProfile)
const CANONICAL_BEHAVIORS=Object.freeze(['thinking','listening','snuggly','hungry','judgmental']);
const STATE_GROUP=Object.freeze({thinking:4,listening:3,snuggly:1,hungry:2,judgmental:2});
const MOOD_FILE=Object.freeze({thinking:0,listening:0,snuggly:0,hungry:0,judgmental:0});
const FALLBACK=Object.freeze({thinking:'onyx_thinking.png',listening:'onyx_listening.png',snuggly:'onyx_snuggly.png',hungry:'onyx_hungry.png',judgmental:'onyx_judgmental.png'});
const REMOTE_TO_LOCAL=Object.freeze({onyx_thinking:'thinking',onyx_listening:'listening',onyx_snuggly:'snuggly',onyx_hungry:'hungry',onyx_judgmental:'judgmental'});
const LOCAL_TO_REMOTE=Object.freeze({thinking:'onyx_thinking',listening:'onyx_listening',snuggly:'onyx_snuggly',hungry:'onyx_hungry',judgmental:'onyx_judgmental'});
function canonicalBehaviorName(value){return window.OnyxMoodContract?.normalize?.(value)||'sleepy'}
const loadedBehavior=new Set(),loadingBehavior=new Map(),loadedMood=new Set(),loadingMood=new Map();
const CODED_AVATAR_AVAILABLE=false;if(!CODED_AVATAR_AVAILABLE)showFallback('listening');let transitionsLoaded=false,transitionPromise=null;
let open=false,state='listening',variant=0,frame=0,lastFrame=performance.now(),stateUntil=Infinity,transition=null,requestSerial=0,renderErrors=0,lastGoodFrame=null,lastAdvance=performance.now(),lastRender=performance.now(),drag=null,moved=false,designReturnState='snuggly',variantNonce=0;
let semanticFrame={eyes:null,bowtie:null,nose:{x:36,y:35}},gaze={x:0,y:0,targetX:0,targetY:0,active:false};
let directOverrideUntil=0,chatMode='auto',chatTurns=0,conversationActive=false,autonomyNext=performance.now()+14000,closedNext=performance.now()+22000,recentAutonomy=[],deep={behavior:null,reflex:null,habitat:null,support:null},deepLoadStarted=false;
let petVoice=null,lastPetVoiceAt=0,careOverlayToken=0,focusBeforeOpen=null,quietCompanion=false;
const reducedMotionQuery=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;let reducedMotion=Boolean(reducedMotionQuery?.matches),reducedTickTimer=0;
function playPetVoice(volume=.18){const now=Date.now();if(now-lastPetVoiceAt<1800)return;lastPetVoiceAt=now;try{if(!petVoice){petVoice=new Audio('assets/audio/shared/onyx-meow.wav');petVoice.preload='auto'}petVoice.pause();petVoice.currentTime=0;petVoice.volume=Math.max(0,Math.min(.35,Number(volume)||.18));const pr=petVoice.play();if(pr&&typeof pr.catch==='function')pr.catch(()=>{})}catch(_){}}
const TAB_IDS=['work'];let activeTab='work',fullScreenTab='';const laneModes={virtual:'auto',health:'auto',leisure:'auto',work:'auto'},laneMemory={virtual:[],health:[],leisure:[],work:[]},laneAttachments={virtual:[],health:[],leisure:[],work:[]},laneThreads={virtual:'',health:'',leisure:'',work:''};let historyLoaded=false,historyProfile='',backendBooted=false,backendProfile='',conversationCursor='',remoteDirty=false,remoteSaveTimer=0,lastRemoteSave=0,lastRemoteLoad=0;const busyTabs=new Set(),requestControllers=new Map();
function storageWarning(scope){try{window.dispatchEvent(new CustomEvent('onyx:storage-warning',{detail:{scope:String(scope||'local data')}}))}catch(_){}}
function save(markRemote=true){pet.lastSaved=Date.now();const p=localProfileId();if(p!==localPetProfile)localPetProfile=p;try{localStorage.setItem(petStorageKey(localPetProfile),JSON.stringify(pet))}catch(_){storageWarning('pet state')}if(markRemote)remoteDirty=true}
/* No offline meter decay: backend pet contract is intentionally non-punishing. */
function valid(d){return !!(d&&((Array.isArray(d.variants)&&d.variants.length&&d.variants.some(v=>Array.isArray(v)&&v.some(f=>typeof f==='string'&&f.length===FRAME_PIXELS)))||(d.codeRenderer==='OnyxMoodRenderers'&&window.OnyxMoodRenderers?.supports?.(d.state))))}
function stateData(s){return null; /* legacy static PNGs, no procedural sprite states */}
function codeRendererOnly(s){const d=stateData(s);return Boolean(d&&d.codeRenderer==='OnyxMoodRenderers'&&window.OnyxMoodRenderers?.supports?.(d.state||canonicalBehaviorName(s)))}
function moodOf(s=state){return canonicalBehaviorName(s)}
const STATE_PRIORITY=Object.freeze({idle:100,careNeed:200,tab:300,pause:350,directCare:400,host:450,output:500,tool:600,phase:700,input:800,safety:900,debug:1000});
const SETTLING_RX=/\b(i(?:'m| am) (?:safe|okay|ok|better|calmer)|we can move on|i(?:'m| am) good now|that helped|feeling better|not in danger|i am not in danger|i'm not in danger|crisis (?:is )?over|panic (?:is )?passing)\b/i;
let conversationPhase='idle',conversationLock=null;
let stateMeta={stateReason:'initialization',statePriority:STATE_PRIORITY.idle,stateSource:'system',stateStartedAt:Date.now(),stateLock:null,conversationPhase:'idle'};
function priorityForSource(source){return ({idle:STATE_PRIORITY.idle,autonomy:STATE_PRIORITY.idle,remote:STATE_PRIORITY.careNeed,'care-need':STATE_PRIORITY.careNeed,tab:STATE_PRIORITY.tab,design:STATE_PRIORITY.tab,pause:STATE_PRIORITY.pause,'direct-care':STATE_PRIORITY.directCare,host:STATE_PRIORITY.host,output:STATE_PRIORITY.output,tool:STATE_PRIORITY.tool,phase:STATE_PRIORITY.phase,input:STATE_PRIORITY.input,safety:STATE_PRIORITY.safety,debug:STATE_PRIORITY.debug,system:STATE_PRIORITY.idle})[String(source||'').toLowerCase()]||STATE_PRIORITY.host}
function stateLockSnapshot(){return conversationLock?{phase:conversationLock.phase,state:conversationLock.state,priority:conversationLock.priority,reason:conversationLock.reason,source:conversationLock.source,startedAt:conversationLock.startedAt}:null}
function syncStateMetaLock(){stateMeta.stateLock=stateLockSnapshot();stateMeta.conversationPhase=conversationPhase;widget.dataset.stateReason=String(stateMeta.stateReason||'');widget.dataset.stateSource=String(stateMeta.stateSource||'');widget.dataset.statePriority=String(stateMeta.statePriority||0);widget.dataset.conversationPhase=conversationPhase}
function setConversationLock(phase,nextState,priority,reason,source='phase'){conversationPhase=phase;conversationLock={phase,state:canonicalBehaviorName(nextState||state),priority:Number(priority)||STATE_PRIORITY.phase,reason:String(reason||phase),source:String(source||'phase'),startedAt:Date.now()};syncStateMetaLock();return conversationLock}
function clearConversationLock(reason='conversation settled'){conversationPhase='idle';conversationLock=null;syncStateMetaLock();try{window.dispatchEvent(new CustomEvent('onyx:conversation-phase',{detail:{phase:'idle',reason}}))}catch(_){}}
function activeStateLock(){return conversationLock}
function beginConversationState(text,tab,mode,preferredState){const prior=conversationPhase,serious=crisis.test(text)||distress.test(text),listenOnly=String(mode||'').toLowerCase()==='listen'||Boolean(window.OnyxConversationEngine?.isListenOnly?.(text,mode,null));let phase='active',next=preferredState||'listening',priority=STATE_PRIORITY.input,reason='current user input',source='input';if(serious){phase='serious_active';next='caring';priority=STATE_PRIORITY.safety;reason='serious distress or safety-relevant input';source='safety'}else if(prior==='serious_active'){phase=SETTLING_RX.test(text)?'settling':'stabilizing';next=phase==='settling'?'thoughtful':'listening';priority=phase==='settling'?STATE_PRIORITY.phase:STATE_PRIORITY.input;reason=phase==='settling'?'user indicated the serious moment is settling':'serious conversation is stabilizing';source='phase'}else if(prior==='stabilizing'){phase='settling';next=preferredState||'thoughtful';priority=STATE_PRIORITY.phase;reason='conversation moved from stabilizing toward ordinary support';source='phase'}else if(tab==='health'){phase='active';next='caring';priority=STATE_PRIORITY.input;reason='Health conversation begins in caring';source='input'}else if(listenOnly){phase='listening_active';next='listening';priority=STATE_PRIORITY.input;reason='explicit listen-only conversation';source='input'}else{phase='active';next=preferredState||'listening';priority=STATE_PRIORITY.input;reason='active conversation input';source='input'}const lock=setConversationLock(phase,next,priority,reason,source);try{window.dispatchEvent(new CustomEvent('onyx:conversation-phase',{detail:{...lock,tab}}))}catch(_){}return lock}
function finishConversationState(nextState,answer={},tab=activeTab){let phase=conversationPhase||'active',next=nextState||conversationLock?.state||'listening',priority=STATE_PRIORITY.phase,reason='conversation output';if(answer?.listenOnly||answer?.responseIntent==='listen_only'){phase='listening_active';next='listening';priority=STATE_PRIORITY.phase;reason='listen-only output remains receptive'}else if(phase==='serious_active'){next='caring';priority=STATE_PRIORITY.safety;reason='serious conversation remains active'}else if(phase==='stabilizing'){priority=STATE_PRIORITY.input;reason='serious conversation is stabilizing'}else if(phase==='settling'){priority=STATE_PRIORITY.phase;reason='conversation is settling'}else{phase='active';priority=STATE_PRIORITY.phase;reason='active conversation output'}const lock=setConversationLock(phase,next,priority,reason,phase==='serious_active'?'safety':'phase');try{window.dispatchEvent(new CustomEvent('onyx:conversation-phase',{detail:{...lock,tab}}))}catch(_){}return lock}
function stateRequestDecision(nextState,options={}){const source=String(options.source||'host'),priority=Number.isFinite(Number(options.priority))?Number(options.priority):priorityForSource(source),lock=activeStateLock(),overlay=Boolean(options.overlay),force=Boolean(options.force);if(force||!lock)return{allow:true,source,priority,lock,overlay};if(overlay&&priority<=STATE_PRIORITY.directCare&&lock.priority<STATE_PRIORITY.safety)return{allow:true,source,priority,lock,overlay};if(priority<lock.priority)return{allow:false,source,priority,lock,overlay,reason:`blocked by ${lock.phase} (${lock.priority})`};return{allow:true,source,priority,lock,overlay}}
function reconciledOpenRequest(){const lock=activeStateLock();if(lock)return{state:lock.state,source:lock.source||'phase',priority:lock.priority,reason:'restore active conversation state'};if(pet.paused)return{state:'sleepy',source:'pause',priority:STATE_PRIORITY.pause,reason:'paused/rest state'};if(pet.hunger<42)return{state:'hungry',source:'care-need',priority:STATE_PRIORITY.careNeed,reason:'low-stakes fullness care need'};if(pet.energy<42)return{state:'sleepy',source:'care-need',priority:STATE_PRIORITY.careNeed,reason:'low energy'};if(pet.comfort<56)return{state:'snuggly',source:'care-need',priority:STATE_PRIORITY.careNeed,reason:'comfort care need'};const current=moodOf(state);if(LOCAL_TO_REMOTE[current])return{state:current,source:'tab',priority:STATE_PRIORITY.tab,reason:'preserve current canonical state on open'};return{state:stateForTab(activeTab),source:'tab',priority:STATE_PRIORITY.tab,reason:'active tab default'}}
function closedSettleRequest(){const lock=activeStateLock();if(lock?.phase==='serious_active')return{state:'caring',source:'safety',priority:lock.priority,reason:'unresolved serious conversation remains present while closed',speech:'Still here.',keepLock:true};if(lock?.phase==='stabilizing')return{state:'snuggly',source:'phase',priority:lock.priority,reason:'stabilizing conversation closes without implying resolution',speech:'Still here.',keepLock:true};if(lock?.phase==='quiet_companion')return{state:'snuggly',source:'phase',priority:lock.priority,reason:'quiet companionship remains active while closed',speech:'Still here.',keepLock:true};if(lock?.phase==='listening_active')return{state:'snuggly',source:'phase',priority:lock.priority,reason:'listen-only conversation pauses in quiet companionship',speech:'Still here.',keepLock:true};if(lock?.phase==='settling')return{state:'snuggly',source:'phase',priority:lock.priority,reason:'resolved conversation settles warmly',speech:'Snuggly.',keepLock:false};return{state:Math.random()<.62?'sleepy':'snuggly',source:'idle',priority:STATE_PRIORITY.idle,reason:'ordinary closed-bubble rest',speech:'Zzz.',keepLock:false}}
function stateDiagnostics(){return{stateReason:stateMeta.stateReason,statePriority:stateMeta.statePriority,stateSource:stateMeta.stateSource,stateStartedAt:stateMeta.stateStartedAt,stateLock:stateLockSnapshot(),conversationPhase}}
async function ensureBehavior(s){s=canonicalBehaviorName(s);const g=STATE_GROUP[s]||1;if(loadedBehavior.has(g))return true;if(loadingBehavior.has(g))return loadingBehavior.get(g);const p=Promise.resolve(window.OnyxAtlasStore?.loadBehaviorGroup?.(g)).then(ok=>{if(ok)loadedBehavior.add(g);return Boolean(ok)}).catch(()=>false).finally(()=>loadingBehavior.delete(g));loadingBehavior.set(g,p);return p}
async function ensureMood(m){m=canonicalBehaviorName(m);const g=MOOD_FILE[m]||1;if(loadedMood.has(g))return true;if(loadingMood.has(g))return loadingMood.get(g);const p=Promise.resolve(window.OnyxAtlasStore?.loadMoodGroup?.(g)).then(ok=>{if(ok)loadedMood.add(g);return Boolean(ok)}).catch(()=>false).finally(()=>loadingMood.delete(g));loadingMood.set(g,p);return p}
async function ensureTransitions(){if(transitionsLoaded)return true;if(transitionPromise)return transitionPromise;transitionPromise=Promise.resolve(window.OnyxAtlasStore?.loadTransitions?.()).then(ok=>{transitionsLoaded=Boolean(ok);return transitionsLoaded}).catch(()=>false).finally(()=>transitionPromise=null);return transitionPromise}
function safeFrame(){const d=stateData(state)||stateData('sleepy');if(!d)return lastGoodFrame||'0'.repeat(FRAME_PIXELS);const v=d.variants[variant%d.variants.length]||d.variants[0],f=v?.[frame%v.length]||v?.[0];if(typeof f==='string'&&f.length===FRAME_PIXELS)lastGoodFrame=f;return lastGoodFrame||'0'.repeat(FRAME_PIXELS)}
function label(s=state){const m={advising_professor:'Advising Professor',caring:'Caring',hungry:'Hungry',judgmental:'Judgmental',listening:'Listening',purring:'Purring',sleepy:'Sleepy',snuggly:'Snuggly',thinking:'Thinking',thoughtful:'Thoughtful'};return m[canonicalBehaviorName(s)]||'Sleepy'}
function showFallback(m=moodOf()){const name=canonicalBehaviorName(m);const src='assets/images/shared/legacy-static/'+FALLBACK[name];if(fallback.getAttribute('src')!==src)fallback.setAttribute('src',src);fallback.hidden=false;fallback.dataset.onyxAvatarSource='legacy-static';canvas.hidden=true;canvas.setAttribute('aria-hidden','true')}
function hideFallback(){fallback.hidden=true;canvas.hidden=false}
function hash32(value){let h=2166136261>>>0;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return h>>>0}
function seededUnit(value){return hash32(value)/4294967296}
function seededVariantIndex(s,count){if(count<=1)return 0;const key=[localProfileId(),s,variantNonce++,pet.careCount||0,chatTurns||0].join('|');return Math.min(count-1,Math.floor(seededUnit(key)*count))}
function meanPoint(points){if(!points?.length)return null;let x=0,y=0;for(const p of points){x+=p[0];y+=p[1]}return{x:x/points.length,y:y/points.length}}
function boundsOf(points){if(!points?.length)return null;let x0=99,y0=99,x1=-1,y1=-1;for(const [x,y] of points){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}return{x0,y0,x1,y1,cx:(x0+x1)/2,cy:(y0+y1)/2}}
function finalizeSemanticFrame(leftEye,rightEye,bowtie){const l=meanPoint(leftEye),r=meanPoint(rightEye),b=boundsOf(bowtie);return{eyes:l&&r?{left:l,right:r}:null,bowtie:b,nose:{x:b?.cx??36,y:b?Math.max(29,b.y0-5):35}}}
function updateGaze(){const ease=gaze.active?.18:.075;gaze.x+=(gaze.targetX-gaze.x)*ease;gaze.y+=(gaze.targetY-gaze.y)*ease}
function drawFurSheen(t,m){const dc=detailLayer.ctx;if(!dc)return;dc.clearRect(0,0,ART_SIZE,ART_SIZE);const p=t/1000;dc.save();dc.globalAlpha=m==='sleepy'?.12:m==='judgmental'?.15:.2;dc.strokeStyle=m==='caring'||m==='purring'?'#47748a':'#355369';dc.lineWidth=.55;dc.lineCap='round';const drift=Math.sin(p*.9)*.5;for(const [x,y,len] of [[23,24,7],[43,23,6],[26,50,8],[43,52,7]]){dc.beginPath();dc.moveTo(x,y);dc.quadraticCurveTo(x+len*.42,y-1.2+drift,x+len,y-.3);dc.stroke()}dc.globalCompositeOperation='destination-in';dc.globalAlpha=1;dc.drawImage(spriteLayer.canvas,0,0);dc.globalCompositeOperation='source-over';dc.restore();ctx.save();ctx.globalAlpha=.62;ctx.drawImage(detailLayer.canvas,0,0);ctx.restore()}
function drawWhiskerDetail(t,m){const n=semanticFrame.nose||{x:36,y:35},p=t/1000,sway=Math.sin(p*(m==='purring'?3.6:1.4))*.55;ctx.save();ctx.globalAlpha=m==='sleepy'?.36:.58;ctx.strokeStyle='#e9edf0';ctx.lineWidth=.48;ctx.lineCap='round';for(const side of [-1,1])for(let i=0;i<3;i++){const y=n.y+1.5+i*2.4;ctx.beginPath();ctx.moveTo(n.x+side*4,y);ctx.quadraticCurveTo(n.x+side*(10+i),y-1+sway*side,n.x+side*(19+i*1.8),y-2+i*.45+sway);ctx.stroke()}ctx.restore()}
function drawEyeDetail(t,m){const e=semanticFrame.eyes;if(!e)return;updateGaze();const blinkPhase=(Math.sin(t/1000*1.73+seededUnit(localProfileId())*6.28)+1)*.5;const blink=blinkPhase>.972;ctx.save();for(const eye of [e.left,e.right]){if(blink){ctx.globalAlpha=.88;ctx.strokeStyle=ART.outline;ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(eye.x-3,eye.y+.2);ctx.lineTo(eye.x+3,eye.y+.2);ctx.stroke();continue}const px=eye.x+gaze.x*.8,py=eye.y+gaze.y*.42;ctx.globalAlpha=.9;ctx.fillStyle='#0a100c';ctx.fillRect(px-.65,py-1.65,1.3,3.3);ctx.globalAlpha=.88;ctx.fillStyle='#f7ffe7';ctx.fillRect(eye.x-1.95,eye.y-1.75,.9,.9);ctx.globalAlpha=.42;ctx.fillStyle=ART.gold;ctx.fillRect(eye.x+1.55,eye.y+.75,.7,.7)}if(m==='judgmental'){ctx.globalAlpha=.78;ctx.strokeStyle=ART.outline;ctx.lineWidth=.95;for(const eye of [e.left,e.right]){ctx.beginPath();ctx.moveTo(eye.x-3.2,eye.y-2.2);ctx.lineTo(eye.x+3.2,eye.y-1.3);ctx.stroke()}}if(m==='advising_professor'){ctx.globalAlpha=.7;ctx.strokeStyle=ART.gold;ctx.lineWidth=.6;for(const eye of [e.left,e.right]){ctx.beginPath();ctx.arc(eye.x,eye.y,4.7,0,Math.PI*2);ctx.stroke()}ctx.beginPath();ctx.moveTo(e.left.x+4.5,e.left.y);ctx.lineTo(e.right.x-4.5,e.right.y);ctx.stroke()}ctx.restore()}
function drawBowtieDetail(t){const b=semanticFrame.bowtie;if(!b)return;ctx.save();ctx.beginPath();ctx.rect(b.x0,b.y0,Math.max(1,b.x1-b.x0+1),Math.max(1,b.y1-b.y0+1));ctx.clip();ctx.globalAlpha=.25;ctx.strokeStyle='#d8efb6';ctx.lineWidth=.45;for(let x=b.x0+2;x<=b.x1;x+=4){ctx.beginPath();ctx.moveTo(x,b.y0);ctx.lineTo(x,b.y1+1);ctx.stroke()}ctx.globalAlpha=.22;ctx.strokeStyle='#173b28';for(let y=b.y0+2;y<=b.y1;y+=3){ctx.beginPath();ctx.moveTo(b.x0,y);ctx.lineTo(b.x1+1,y);ctx.stroke()}ctx.restore();ctx.save();ctx.globalAlpha=.34+.08*Math.sin(t/1000*1.4);ctx.fillStyle='#bfe09a';ctx.fillRect(Math.round(b.cx)-1,Math.round(b.cy)-1,2,1);ctx.restore()}
function drawCampyFaceAccents(t,m,s){
  const e=semanticFrame.eyes,n=semanticFrame.nose||{x:36,y:35},p=t/1000;
  ctx.save();
  if(e){
    const warmth=(m==='caring'||m==='snuggly'||m==='purring');
    ctx.globalAlpha=warmth?.42:.25;ctx.fillStyle=warmth?ART.pink:ART.cyan;
    for(const eye of [e.left,e.right]){const sx=Math.round(eye.x+(eye.x<36?-4:4)),sy=Math.round(eye.y+4);ctx.fillRect(sx,sy,1,1)}
    if(m==='advising_professor'&&Math.sin(p*3.6)>.7){ctx.globalAlpha=.85;drawSpark(Math.round(e.right.x+5),Math.round(e.right.y-5),ART.gold,.72)}
  }
  if(m==='judgmental'&&Math.sin(p*1.25)>.25){ctx.globalAlpha=.76;ctx.fillStyle=ART.pink;ctx.fillRect(Math.round(n.x+12),Math.round(n.y-10),1,4);ctx.fillRect(Math.round(n.x+15),Math.round(n.y-8),1,3)}
  ctx.restore()
}
function drawIdentityDetail(t,m,s){drawFurSheen(t,m);drawWhiskerDetail(t,m);drawEyeDetail(t,m);drawBowtieDetail(t);drawCampyFaceAccents(t,m,s)}
function motionVector(x,y,t,s){
  const m=moodOf(s),phase=t/1000;let dx=0,dy=0;
  const breathe=Math.sin(phase*(m==='sleepy'?1.92:m==='purring'?4.0:2.55));
  const headSway=Math.sin(phase*(m==='judgmental'?.78:1.0));
  if(y>=35&&breathe>.45)dy+=1;
  if(y>=44&&m==='sleepy'&&Math.cos(phase*1.28)>.76)dx+=1;
  if(y<37&&(m==='thinking'||m==='thoughtful'||m==='listening'||m==='advising_professor')&&headSway>.84)dy-=1;
  if(y<21&&((x<31&&Math.sin(phase*3.1)>.91)||(x>40&&Math.cos(phase*2.78)>.91)))dy-=1;
  if(y<24&&m==='listening'&&x>40&&Math.sin(phase*4.2)>.9){dx+=1;dy-=1}
  if(m==='purring'&&y>45&&Math.sin(phase*6.7+x*.23)>.77)dx+=(x<36?-1:1);
  if(m==='hungry'&&x>43&&y>37&&Math.sin(phase*5.15)>.69)dy-=1;
  if(m==='judgmental'&&y<35&&Math.sin(phase*.86)>.958)dx+=1;
  if(m==='caring'&&y<40&&Math.sin(phase*1.3)>.875)dy+=1;
  if((m==='snuggly'||m==='sleepy')&&x>48&&y>42&&Math.sin(phase*1.55+x*.08)>.92)dx+=1;
  if(m==='advising_professor'){
    if(x>44&&y>32&&Math.sin(phase*2.82)>.54)dy-=1;
    if(x<30&&y>34&&Math.cos(phase*2.28)>.71)dy-=1;
    if(y<34&&Math.sin(phase*1.76)>.895)dy-=1;
  }
  return[dx,dy]
}
function tintLayerFromSprite(color,alpha=1){const tc=tintLayer.ctx;if(!tc||!spriteLayer.ctx)return;tc.clearRect(0,0,ART_SIZE,ART_SIZE);tc.globalCompositeOperation='source-over';tc.globalAlpha=1;tc.drawImage(spriteLayer.canvas,0,0);tc.globalCompositeOperation='source-in';tc.fillStyle=color;tc.globalAlpha=alpha;tc.fillRect(0,0,ART_SIZE,ART_SIZE);tc.globalCompositeOperation='source-over';tc.globalAlpha=1}
function drawContactShadow(m,t){if(!ctx)return;const p=t/1000,w=m==='sleepy'||m==='snuggly'?28:m==='advising_professor'?23:25,y=m==='advising_professor'?63:62,x=36-(w>>1);ctx.save();ctx.globalAlpha=m==='sleepy'?.4:.31;ctx.fillStyle=ART.shadow;ctx.fillRect(x,y,w,2);ctx.globalAlpha*=.58;ctx.fillRect(x+3,y-1,w-6,1);if(m==='purring'){ctx.globalAlpha=.2+.06*Math.sin(p*5);ctx.fillRect(x-1,y+2,w+2,1)}ctx.restore()}
function shadedPixelColor(n,x,y,m,t,pal){
  const base=pal[n]||pal[1];
  if(n>=1&&n<=5){
    const phase=((x*4+y*6+((t/150)|0))%23+23)%23;
    if((m==='caring'||m==='purring'||m==='advising_professor')&&phase===0&&y<49)return'#22384a';
    if((m==='sleepy'||m==='snuggly')&&phase===1&&y>35)return'#162131';
    if((m==='thinking'||m==='thoughtful')&&phase===2&&x>16&&x<56&&y<44)return'#203446';
  }
  return base
}
function trimEarTufts(data,src,zoneStart,zoneEnd,height){
  const topY=[];
  const alpha=(x,y)=>x>=0&&x<ART_SIZE&&y>=0&&y<height?src[((y*ART_SIZE+x)*4)+3]:0;
  for(let x=zoneStart;x<=zoneEnd;x++){
    let top=height;
    for(let y=0;y<height;y++){if(alpha(x,y)>0){top=y;break}}
    topY.push(top);
  }
  const usable=topY.filter(y=>y<height).sort((a,b)=>a-b);
  if(!usable.length)return;
  const median=usable[(usable.length/2)|0];
  for(let i=0;i<topY.length;i++){
    const x=zoneStart+i,top=topY[i];
    if(top>=height)continue;
    const allowed=Math.max(7,Math.min(median,median-1+(i>1&&i<topY.length-2?0:1)));
    if(top<allowed-1){
      for(let y=top;y<allowed-1;y++){
        const idx=(y*ART_SIZE+x)*4;data[idx]=data[idx+1]=data[idx+2]=data[idx+3]=0;
      }
    }
  }
}
function normalizeDomesticShorthairSilhouette(sc){
  try{
    const h=24,img=sc.getImageData(0,0,ART_SIZE,h),data=img.data,src=new Uint8ClampedArray(data);
    const alpha=(x,y)=>x>=0&&x<ART_SIZE&&y>=0&&y<h?src[((y*ART_SIZE+x)*4)+3]:0;
    trimEarTufts(data,src,6,23,h);
    trimEarTufts(data,src,48,65,h);
    for(let y=0;y<22;y++)for(let x=4;x<ART_SIZE-4;x++){
      const idx=((y*ART_SIZE+x)*4)+3;
      if(!src[idx])continue;
      let neighbors=0,below=0;
      for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){
        if(!xx&&!yy)continue;
        if(alpha(x+xx,y+yy)>0){neighbors++;if(yy>0)below++}
      }
      const inEarOuter=(x<17||x>54)&&y<16;
      if((neighbors<=2&&below<=1)||(inEarOuter&&neighbors<=4&&below<=2)){
        const base=(y*ART_SIZE+x)*4;data[base]=data[base+1]=data[base+2]=data[base+3]=0;
      }
    }
    for(const [x,y] of [[13,11],[14,10],[15,10],[56,10],[57,10],[58,11]]){
      const idx=(y*ART_SIZE+x)*4;
      if(data[idx+3]===0){data[idx]=1;data[idx+1]=2;data[idx+2]=4;data[idx+3]=255}
    }
    sc.putImageData(img,0,0);
  }catch(_){ }
}
function decode(str,a=1,t=performance.now(),s=state){
  if(!ctx||!spriteLayer.ctx||typeof str!=='string'||str.length!==FRAME_PIXELS)return false;
  const pal=window.OnyxAtlas.palette,sc=spriteLayer.ctx;sc.clearRect(0,0,ART_SIZE,ART_SIZE);let i=0,leftEye=[],rightEye=[],bowtie=[];
  for(let y=0;y<ART_SIZE;y++)for(let x=0;x<ART_SIZE;x++,i++){
    const n=parseInt(str[i],16);if(!n)continue;const mv=motionVector(x,y,t,s),px=x+mv[0],py=y+mv[1];if(px<0||py<0||px>=ART_SIZE||py>=ART_SIZE)continue;sc.fillStyle=shadedPixelColor(n,px,py,moodOf(s),t,pal);sc.fillRect(px,py,1,1);
    if((n===6||n===7)&&py<35)(px<36?leftEye:rightEye).push([px,py]);
    if(n>=10&&n<=12&&py>34&&px>18&&px<54)bowtie.push([px,py]);
  }
  semanticFrame=finalizeSemanticFrame(leftEye,rightEye,bowtie);
  normalizeDomesticShorthairSilhouette(sc);
  drawContactShadow(moodOf(s),t);
  ctx.save();ctx.globalAlpha=a;
  const m=moodOf(s),campRim=(m==='caring'||m==='snuggly'||m==='purring')?ART.pink:(m==='advising_professor'?ART.gold:ART.rim);
  tintLayerFromSprite(ART.outline,.92);for(const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1]])ctx.drawImage(tintLayer.canvas,ox,oy);
  tintLayerFromSprite(ART.rimSoft,.38);ctx.drawImage(tintLayer.canvas,-1,-1);
  tintLayerFromSprite(campRim,.27);ctx.drawImage(tintLayer.canvas,0,-1);
  tintLayerFromSprite(ART.cyan,.10);ctx.drawImage(tintLayer.canvas,1,0);
  ctx.drawImage(spriteLayer.canvas,0,0);drawIdentityDetail(t,m,s);ctx.restore();return true
}
function drawHeart(x,y,color=ART.pink,scale=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;const pts=[[1,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[2,3]];for(const [px,py] of pts)ctx.fillRect(x+px*scale,y+py*scale,scale,scale);ctx.restore()}
function drawZ(x,y,color=ART.cyan,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x,y,4,1);ctx.fillRect(x+2,y+1,1,1);ctx.fillRect(x+1,y+2,1,1);ctx.fillRect(x,y+3,4,1);ctx.restore()}
function drawSpark(x,y,color=ART.cyan,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x,y-2,1,5);ctx.fillRect(x-2,y,5,1);ctx.fillRect(x-1,y-1,3,3);ctx.restore()}
function stateTransitionFx(t,m){const age=t-artFx.stateAt;if(age<0||age>720)return;const step=Math.max(0,Math.min(9,(age/80)|0)),r=12+step*2,alpha=(1-age/720)*.38;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=ART.blue;for(let i=0;i<24;i++){const a=(i/24)*Math.PI*2,x=Math.round(36+Math.cos(a)*r),y=Math.round(37+Math.sin(a)*r*.82);if(x>2&&x<70&&y>2&&y<70)ctx.fillRect(x,y,1,1)}ctx.restore()}
function careBurstFx(t){const age=t-artFx.careAt;if(age<0||age>1100)return;const progress=age/1100,kind=artFx.careKind,alpha=1-progress;for(let i=0;i<8;i++){const ang=(i/8)*Math.PI*2+((kind.length%5)*.22),r=5+progress*(14+(i%3)*3),x=Math.round(36+Math.cos(ang)*r),y=Math.round(39+Math.sin(ang)*r*.72-progress*5);if(kind==='pet'||kind==='scratch'||kind==='nuzzle'||kind==='slowblink'||kind==='brush')drawHeart(x-2,y-2,i%2?ART.pink:ART.cyan,1,alpha*.8);else drawSpark(x,y,i%2?ART.gold:ART.cyan,alpha*.7)}}
function drawMusicNote(x,y,color=ART.pink,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x+2,y,1,5);ctx.fillRect(x+3,y,3,1);ctx.fillRect(x,y+4,3,2);ctx.restore()}
function drawQuestion(x,y,color=ART.gold,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x+1,y,3,1);ctx.fillRect(x+4,y+1,1,2);ctx.fillRect(x+2,y+3,2,1);ctx.fillRect(x+2,y+5,1,1);ctx.restore()}
function drawTinyFish(x,y,color=ART.gold,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x+2,y+1,4,3);ctx.fillRect(x+6,y+2,2,1);ctx.fillRect(x,y,2,2);ctx.fillRect(x,y+3,2,2);ctx.fillStyle=ART.outline;ctx.fillRect(x+5,y+2,1,1);ctx.restore()}
function liveOverlay(t,m,s){
  if(!ctx)return;const p=t/1000,twinkle=(n,period,offset=0)=>Math.sin((p+offset)*period+n)>.94;ctx.save();ctx.globalAlpha=.95;
  if(m==='sleepy'){const drift=((p*.7)%1);drawZ(49,17-Math.round(drift*2),ART.cyan,.5+.28*(1-drift));if(twinkle(2,1.1))drawZ(57,11,ART.rim,.58);if(twinkle(7,1.8))drawSpark(14,18,ART.violet,.45)}
  if(m==='snuggly'){if(twinkle(3,1.45))drawHeart(11,16,ART.pink,1,.9);if(twinkle(6,1.75))drawHeart(57,22,ART.cyan,1,.68);if(twinkle(9,1.2))drawSpark(61,13,ART.gold,.42)}
  if(m==='purring'){ctx.fillStyle=ART.cyan;const wobble=Math.sin(p*5)>.1?1:0;ctx.globalAlpha=.58;for(const y of [55,59]){ctx.fillRect(16-wobble,y,2,1);ctx.fillRect(54+wobble,y,2,1)}if(twinkle(9,2.2))drawHeart(57,16,ART.pink,1,.82);if(twinkle(4,2.6))drawMusicNote(12,22,ART.violet,.65)}
  if(m==='hungry'){ctx.globalAlpha=.82;drawTinyFish(54,13,ART.gold,.82);if(twinkle(4,2.8))drawSpark(60,10,ART.cyan,.62)}
  if(m==='judgmental'){ctx.globalAlpha=.72;ctx.fillStyle=ART.cyan;if(twinkle(8,1.2)){ctx.fillRect(56,19,5,1);ctx.fillRect(59,20,2,1)}ctx.fillStyle=ART.pink;ctx.fillRect(13,20,1,4);ctx.fillRect(16,22,1,3)}
  if(m==='listening'){ctx.globalAlpha=.8;ctx.fillStyle=ART.cyan;const wave=(Math.sin(p*3.2)+1)*.5;ctx.fillRect(58,27,1,3);if(wave>.35)ctx.fillRect(61,25,1,7);if(wave>.72)ctx.fillRect(64,23,1,11);if(twinkle(5,2.1))drawSpark(12,17,ART.violet,.44)}
  if(m==='thinking'){drawQuestion(56,12,ART.gold,.86);if(twinkle(7,1.7))drawSpark(62,21,ART.cyan,.66)}
  if(m==='thoughtful'){ctx.globalAlpha=.72;ctx.fillStyle=ART.cyan;ctx.fillRect(55,18,2,2);ctx.fillRect(59,14,3,3);ctx.fillRect(64,9,4,4);if(twinkle(5,1.6))drawSpark(14,16,ART.violet,.5)}
  if(m==='caring'){if(twinkle(3,1.55))drawHeart(10,18,ART.pink,1,.92);if(twinkle(5,1.85))drawHeart(58,15,ART.cyan,1,.78);if(twinkle(8,1.3))drawHeart(61,26,ART.violet,1,.52);ctx.globalAlpha=.25;ctx.fillStyle=ART.cyan;ctx.fillRect(17,61,38,1)}
  if(m==='advising_professor'){ctx.fillStyle='#d7fbff';if(twinkle(1,3.4)){ctx.fillRect(27,27,2,1);ctx.fillRect(42,27,2,1)}ctx.fillStyle=ART.blue;if(twinkle(2,2.1)){ctx.fillRect(54,47,1,1);ctx.fillRect(55,46,1,1)}if(twinkle(4,2.7))drawSpark(58,15,ART.gold,.78);ctx.globalAlpha=.34;ctx.fillStyle=ART.green;ctx.fillRect(18,51,10,1)}
  ctx.restore();stateTransitionFx(t,m);careBurstFx(t)
}
function draw(t){
  const m=moodOf();showFallback(m);return; /* Static PNGs ALWAYS win; no pixel animation. */
  /* Portal-era chest-up avatars are the PRIMARY widget/module renderer.
     Scope lock: this branch can only paint #onyxCanvas. The Leisure and
     Virtual+Health game actors use separate canvases and separate renderers. */
  if(ctx&&canvas?.id==='onyxCanvas'&&codeRendererOnly(m)&&window.OnyxMoodRenderers?.supports?.(m)){
    hideFallback();background(t,m);let rendered=false;ctx.save();ctx.imageSmoothingEnabled=false;
    try{rendered=window.OnyxMoodRenderers.renderToContext(ctx,{state:m,time:t,reducedMotion,x:0,y:0,width:ART_SIZE,height:ART_SIZE})}
    catch(error){console.warn('Chest-up module renderer failed for '+m,error)}
    finally{ctx.restore()}
    if(rendered){canvas.dataset.onyxAvatarSource='portal-chest-up-code';canvas.dataset.onyxAvatarScope='module-widget-only';liveOverlay(t,m,state);return}
    showFallback(m);return;
  }
  if(!ctx||!stateData(state)){showFallback(m);return}
  hideFallback();background(t,m);if(transition){const i=Math.floor(((t-transition.start)/1000)*transition.fps);if(i<transition.frames.length){if(!decode(transition.frames[i],1,t,state))throw new Error('transition');liveOverlay(t,m,state);return}transition=null}if(!decode(safeFrame(),1,t,state))throw new Error('frame');liveOverlay(t,m,state)
}
function background(t,m){
  if(!ctx)return;
  ctx.clearRect(0,0,ART_SIZE,ART_SIZE);
  const step=(t/720)|0,p=t/1000;
  const ps={
    sleepy:[ART.deepBlue,ART.cyan],snuggly:[ART.blue,ART.pink],purring:[ART.cyan,ART.pink],hungry:[ART.gold,ART.cyan],
    judgmental:[ART.deepBlue,ART.pink],listening:[ART.blue,ART.cyan],thinking:[ART.violet,ART.gold],thoughtful:[ART.blue,ART.violet],
    caring:[ART.pink,ART.cyan],professor:[ART.blue,ART.gold]
  }[m]||[ART.blue,ART.cyan];
  ctx.save();
  /* Transparent dither halo: it lives inside the circular bubble and never paints an opaque 72x72 box. */
  for(let y=6;y<67;y++)for(let x=6;x<67;x++){
    const dx=x-36,dy=(y-36)*1.04,d=dx*dx+dy*dy;
    if(d>930||d<230)continue;
    const gate=(x*7+y*11+step)%31;
    if(gate<3){ctx.globalAlpha=d>730?.09:.13;ctx.fillStyle=gate&1?ps[0]:ps[1];ctx.fillRect(x,y,1,1)}
  }
  const ringR=29+((Math.sin(p*.82)+1)>.92?1:0);ctx.globalAlpha=.24;ctx.fillStyle=ps[0];
  for(let i=0;i<44;i++){if((i+step)%3===0)continue;const a=(i/44)*Math.PI*2,x=Math.round(36+Math.cos(a)*ringR),y=Math.round(36+Math.sin(a)*ringR*.88);if(x>4&&x<68&&y>4&&y<68)ctx.fillRect(x,y,1,1)}
  ctx.globalAlpha=.68;for(let i=0;i<14;i++){const x=8+((i*19+step*2)%56),y=8+((i*29+step)%55);const dx=x-36,dy=y-36;if(dx*dx+dy*dy<900&&((i+step)%4===0))drawSpark(x,y,i%2?ps[1]:ART.cyan,.45)}
  ctx.globalAlpha=.16;ctx.fillStyle=ps[1];ctx.fillRect(18,63,36,1);ctx.restore()
}

function transitionFrames(a,b){a=canonicalBehaviorName(a);b=canonicalBehaviorName(b);return window.OnyxMoodTransitions?.frames?.[`${a}>${b}`]||null}
function commit(s,ms=0,meta={}){s=canonicalBehaviorName(s);const d=stateData(s),newMood=s;if(!d&&!FALLBACK[newMood])return false;const oldMood=moodOf();state=s;variant=d?seededVariantIndex(s,d.variants.length):0;frame=0;lastFrame=performance.now();artFx.from=oldMood;artFx.to=newMood;artFx.stateAt=lastFrame;stateUntil=lastFrame+(ms||10000+Math.random()*14000);const tf=!reducedMotion&&oldMood!==newMood?transitionFrames(oldMood,newMood):null;transition=tf?.length?{frames:tf,start:lastFrame,fps:window.OnyxMoodTransitions?.fps||10}:null;widget.dataset.state=state;widget.dataset.mood=newMood;stateMeta={stateReason:String(meta.reason||'state request'),statePriority:Number(meta.priority)||0,stateSource:String(meta.source||'host'),stateStartedAt:Date.now(),stateLock:stateLockSnapshot(),conversationPhase};syncStateMetaLock();if(!d)showFallback(newMood);$('onyxBubbleState').textContent=label();$('onyxMomentText').textContent=label();recentAutonomy.unshift(newMood);recentAutonomy=recentAutonomy.slice(0,4);remoteDirty=true;try{window.dispatchEvent(new CustomEvent('onyx:state-transition',{detail:{canonicalState:canonicalState(),canonicalMood:newMood,behaviorVariant:state,...stateDiagnostics()}}))}catch(_){}if(reducedMotion){try{frame=0;transition=null;draw(artFx.stateAt+240)}catch(_){}}return true}
async function requestState(s,ms=0,options={}){s=canonicalBehaviorName(s);const {direct=false,quiet=false}=options||{},decision=stateRequestDecision(s,options||{});if(!decision.allow){try{window.dispatchEvent(new CustomEvent('onyx:state-rejected',{detail:{requested:moodOf(s),source:decision.source,priority:decision.priority,reason:decision.reason,stateLock:stateLockSnapshot()}}))}catch(_){}return false}const serial=++requestSerial;if(direct)directOverrideUntil=performance.now()+Math.max(ms||5000,5000);const m=moodOf(s);/* No atlas downloads: use the locally bundled static legacy image. */if(!stateData(s)){if(FALLBACK[m])return commit(s,ms,{source:decision.source,priority:decision.priority,reason:String(options.reason||decision.reason||'fallback state request'),overlay:decision.overlay});if(!quiet)$('onyxSpeech').textContent='Try again.';return false}if(!reducedMotion&&moodOf()!==m)ensureTransitions();if(serial!==requestSerial)return false;return commit(s,ms,{source:decision.source,priority:decision.priority,reason:String(options.reason||decision.reason||'state request'),overlay:decision.overlay})}
function band(v){return v<38?'low':v<68?'medium':'high'}
function dayPeriod(){const h=new Date().getHours();return h<6?'night':h<11?'morning':h<18?'day':h<22?'evening':'night'}
function weighted(items){let total=0;const adjusted=items.map(([s,w])=>[s,recentAutonomy.includes(moodOf(s))?w*.28:w]).filter(x=>x[1]>0);for(const x of adjusted)total+=x[1];let r=Math.random()*total;for(const x of adjusted){r-=x[1];if(r<=0)return x[0]}return adjusted[0]?.[0]||items[0]?.[0]}
function autonomousChoice(){const t=performance.now(),period=dayPeriod(),sinceCare=Date.now()-(pet.lastCareAt||0);if(t<directOverrideUntil)return null;if(activeStateLock())return null;if(pet.paused&&!conversationActive)return'sleepy';if(!open){if(period==='night'||pet.energy<50)return weighted([['sleepy',7],['snuggly',3]]);return weighted([['sleepy',5],['snuggly',5]])}if(sinceCare<30000){if(['pet','scratch','slowblink','nuzzle'].includes(pet.lastCareAction))return weighted([['purring',7],['snuggly',3],['caring',2]]);if(['rest','blanket','tuck','settle'].includes(pet.lastCareAction))return weighted([['snuggly',7],['sleepy',3],['purring',1]]);if(['feed','treat'].includes(pet.lastCareAction))return weighted([['purring',5],['snuggly',2],['thinking',1]])}if(pet.hunger<42)return weighted([['hungry',8],['judgmental',1],['thinking',1]]);if(pet.energy<42)return weighted([['sleepy',8],['snuggly',7]]);if(pet.comfort<56)return weighted([['snuggly',7],['caring',3],['thinking',1]]);if(pet.joy<50)return weighted([['caring',4],['judgmental',2],['thinking',2],['snuggly',1]]);const longIdle=Date.now()-Math.max(pet.lastInteractionAt||0,pet.lastChatAt||0)>120000;if(longIdle&&Math.random()<.22)return weighted([['listening',3],['thinking',3],['caring',2],['snuggly',4],['purring',2],['judgmental',2]]);return activeTab==='health'?weighted([['thinking',3],['thoughtful',2],['snuggly',3],['judgmental',1.2],['purring',1.5],['caring',1.4],['listening',1],['advising_professor',.35]]):weighted([['thinking',3],['thoughtful',2],['snuggly',3],['judgmental',1.2],['purring',1.5],['caring',1.4],['listening',1]])}
function autonomyDelay(){const m=moodOf();if(!open)return 22000+Math.random()*26000;if(conversationActive)return 11000+Math.random()*13000;if(m==='sleepy'||m==='snuggly')return 17000+Math.random()*19000;return 14000+Math.random()*18000}
async function autonomy(t){if(activeStateLock())return;if(!open&&t>=closedNext){const d=autonomyDelay();closedNext=t+d;const c=autonomousChoice();if(c)requestState(c,d,{quiet:true,source:'autonomy',priority:STATE_PRIORITY.idle,reason:'closed-bubble idle behavior'})}else if(open&&t>=autonomyNext){const d=autonomyDelay();autonomyNext=t+d;const c=autonomousChoice();if(c)requestState(c,d,{quiet:true,source:'autonomy',priority:STATE_PRIORITY.idle,reason:'idle behavior'})}}
function scheduleTick(){if(reducedMotion){clearTimeout(reducedTickTimer);reducedTickTimer=setTimeout(()=>tick(performance.now()),900)}else requestAnimationFrame(tick)}
function tick(t){try{const d=stateData(state)||stateData('sleepy');if(d?.variants?.length&&!reducedMotion){const interval=1000/(d.fps||3),elapsed=t-lastFrame;if(elapsed>=interval){const v=d.variants[variant%d.variants.length]||d.variants[0],steps=Math.max(1,Math.min(3,Math.floor(elapsed/interval)));frame=(frame+steps)%v.length;lastFrame+=steps*interval;if(t-lastFrame>interval*4)lastFrame=t;lastAdvance=t}}if(reducedMotion){frame=0;transition=null;gaze.x=0;gaze.y=0;gaze.targetX=0;gaze.targetY=0}draw(reducedMotion?artFx.stateAt+240:t);lastRender=t;renderErrors=0;if(!reducedMotion)autonomy(t)}catch(e){renderErrors++;transition=null;frame=0;if(renderErrors>=3){showFallback(moodOf());requestState('sleepy',5000,{quiet:true}).catch(()=>{})}}finally{scheduleTick()}}
function localHistoryRetentionKey(profile=localProfileId()){return 'belavados.onyx.module.retention.v1.'+String(profile||'shared').toLowerCase()}
function localHistoryMode(tab,profile=localProfileId()){let raw={};try{raw=JSON.parse(localStorage.getItem(localHistoryRetentionKey(profile))||'{}')||{}}catch(_){}const mode=String(raw?.[tab]||'').toLowerCase();if(mode==='session'||mode==='device')return mode;return tab==='health'?'session':'device'}
function laneStoreKey(profile=localProfileId(),mode='device'){return 'onyxChatLanesV3:'+String(mode||'device')+':'+String(profile||'shared').toLowerCase()}
function legacyLaneStoreKey(profile=localProfileId()){return 'onyxChatLanesV2:'+String(profile||'shared').toLowerCase()}
function persistLanes(){const profile=localProfileId(),out={device:{},session:{}};for(const tab of TAB_IDS){const mode=localHistoryMode(tab,profile);out[mode][tab]=(laneMemory[tab]||[]).slice(-40).map(x=>({role:x.role,content:String(x.content||'').slice(0,16000)}))}try{localStorage.setItem(laneStoreKey(profile,'device'),JSON.stringify(out.device));localStorage.removeItem(legacyLaneStoreKey(profile))}catch(_){storageWarning('device chat cache')}try{sessionStorage.setItem(laneStoreKey(profile,'session'),JSON.stringify(out.session))}catch(_){storageWarning('session chat cache')}}
function restoreLanes(){const profile=localProfileId();for(const tab of TAB_IDS){laneMemory[tab]=[];const log=document.querySelector(`[data-chat-log="${tab}"]`);if(log)log.textContent=''}let device={},session={},legacy={};try{device=JSON.parse(localStorage.getItem(laneStoreKey(profile,'device'))||'{}')||{}}catch(_){}try{session=JSON.parse(sessionStorage.getItem(laneStoreKey(profile,'session'))||'{}')||{}}catch(_){}try{legacy=JSON.parse(localStorage.getItem(legacyLaneStoreKey(profile))||'{}')||{}}catch(_){}let migrated=false;for(const tab of TAB_IDS){const mode=localHistoryMode(tab,profile),selected=mode==='session'?session:device,rows=Array.isArray(selected?.[tab])?selected[tab]:(Array.isArray(legacy?.[tab])?(migrated=true,legacy[tab]):[]);for(const t of rows.slice(-40)){const role=t?.role==='user'?'user':'onyx';appendChat(tab,role,t?.content,{remember:true,persist:false,messageId:t?.id||'',emit:false,restore:true})}}if(migrated)persistLanes()}
function safeHttpUrl(value){try{const u=new URL(String(value||''),location.href);return /^https?:$/i.test(u.protocol)?u.href:''}catch(_){return''}}
function appendInlineMarkdown(parent,text){
  const source=String(text||''),rx=/\[([^\]\n]{1,240})\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;let last=0,m;
  while((m=rx.exec(source))){if(m.index>last)parent.appendChild(document.createTextNode(source.slice(last,m.index)));if(m[1]&&m[2]){const href=safeHttpUrl(m[2]),a=document.createElement('a');a.textContent=m[1];if(href){a.href=href;a.target='_blank';a.rel='noopener noreferrer'}parent.appendChild(a)}else if(m[3]){const strong=document.createElement('strong');strong.textContent=m[3];parent.appendChild(strong)}else if(m[4]){const em=document.createElement('em');em.textContent=m[4];parent.appendChild(em)}else if(m[5]){const code=document.createElement('code');code.textContent=m[5];parent.appendChild(code)}last=rx.lastIndex}
  if(last<source.length)parent.appendChild(document.createTextNode(source.slice(last)))
}
function renderChatText(container,text){
  const source=String(text||''),fence=/```([^\n]*)\n([\s\S]*?)```/g;let last=0,m;
  function normal(chunk){const lines=String(chunk||'').split('\n');lines.forEach((line,i)=>{appendInlineMarkdown(container,line);if(i<lines.length-1)container.appendChild(document.createElement('br'))})}
  while((m=fence.exec(source))){normal(source.slice(last,m.index));const pre=document.createElement('pre'),code=document.createElement('code');if(m[1])code.dataset.language=String(m[1]).trim().slice(0,32);code.textContent=m[2];pre.appendChild(code);container.appendChild(pre);last=fence.lastIndex}normal(source.slice(last))
}
function dataUrlForArtifact(a){if(a?.content!=null){try{return URL.createObjectURL(new Blob([String(a.content)],{type:a.mimeType||'text/plain'}))}catch(_){return''}}if(a?.base64){try{const mime=a.mimeType||'application/octet-stream';return String(a.base64).startsWith('data:')?a.base64:`data:${mime};base64,${a.base64}`}catch(_){return''}}return safeHttpUrl(a?.url)}
function renderArtifacts(container,artifacts=[]){if(!container||!artifacts.length)return;const wrap=document.createElement('div');wrap.className='onyx-artifacts';for(const a of artifacts.slice(0,16)){if(!a)continue;const card=document.createElement('div');card.className='onyx-artifact';const title=document.createElement('div');title.className='onyx-artifact-name';title.textContent=String(a.name||a.fileName||(a.kind==='image'?'Image':'File')).slice(0,180);card.appendChild(title);const href=dataUrlForArtifact(a);const isImage=a.kind==='image'||/^image\//i.test(a.mimeType||'');if(isImage&&href){const img=document.createElement('img');img.alt=title.textContent;img.src=href;card.appendChild(img)}if(href){const link=document.createElement('a');link.className='onyx-artifact-link';link.href=href;link.target='_blank';link.rel='noopener noreferrer';if(a.content!=null||a.base64){link.download=String(a.name||a.fileName||'onyx-output')}link.textContent=isImage?'Open':'Open file';card.appendChild(link)}wrap.appendChild(card)}if(wrap.children.length)container.appendChild(wrap)}
function renderCitations(container,citations=[]){const urls=[...new Set((citations||[]).map(x=>safeHttpUrl(typeof x==='string'?x:(x?.url||x?.href||''))).filter(Boolean))].slice(0,12);if(!container||!urls.length)return;const wrap=document.createElement('div');wrap.className='onyx-citations';urls.forEach((url,i)=>{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Source '+(i+1);wrap.appendChild(a)});container.appendChild(wrap)}
function appendChat(tab,who,text,{remember=true,persist=true,artifacts=[],citations=[],messageId='',emit=true,restore=false}={}){tab=TAB_IDS.includes(tab)?tab:'virtual';const cleanText=String(text||'').trim();if(!cleanText&&!artifacts.length)return null;const log=document.querySelector(`[data-chat-log="${tab}"]`);if(!log)return null;const id=String(messageId||('msg-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)));const d=document.createElement('div');d.className='onyx-chat-line '+(who==='user'?'user':who==='system'?'system':'onyx');d.dataset.onyxMessageId=id;if(cleanText){const body=document.createElement('div');body.className='onyx-chat-body';renderChatText(body,cleanText);d.appendChild(body)}renderArtifacts(d,artifacts);renderCitations(d,citations);const followNewest=Boolean(restore)||(log.scrollHeight-log.scrollTop-log.clientHeight<=100);log.appendChild(d);while(log.children.length>80)log.removeChild(log.firstChild);if(followNewest)requestAnimationFrame(()=>{log.scrollTop=log.scrollHeight});if(remember&&cleanText&&who!=='system'){laneMemory[tab].push({role:who==='user'?'user':'assistant',content:cleanText,id});laneMemory[tab]=laneMemory[tab].slice(-64);if(persist)persistLanes()}if(emit)window.dispatchEvent(new CustomEvent('onyx:chat-line',{detail:{tab,role:who==='user'?'user':who==='system'?'system':'assistant',content:cleanText,messageId:id,artifacts,citations,restore:Boolean(restore),element:d}}));return d}
const fallbackCrisis=/\b(suicid|kill myself|end my life|self[- ]?harm|hurt myself|overdose|cannot stay safe|can't stay safe|immediate danger)\b/i;
const fallbackDistress=/\b(panic|panicking|flashback|overwhelmed|dissociat|meltdown|shutdown|unsafe|terrified|trauma|grief|depressed|depression|anxious|anxiety)\b/i;
function safetyAssessment(text){try{return window.OnyxSafetyKernel?.assess?.(text)||null}catch(_){return null}}
const crisis={test(text){const a=safetyAssessment(text);return a?Boolean(a.emergency):fallbackCrisis.test(String(text||''))}};
const distress={test(text){const a=safetyAssessment(text);return a?Boolean(a.distress):fallbackDistress.test(String(text||''))}};
const appointment=/\b(appointment|psychiatr|therap|doctor|clinician|medication|side effect|symptom|prescriber)\b/i;
const actionNeed=/\b(can't start|cannot start|stuck|executive|task|clean|shower|eat|drink|hygiene|routine)\b/i;
function localFallback(text,mode,tab){const s=text.trim(),assessment=safetyAssessment(s);if(assessment?.emergency||(!assessment&&crisis.test(s))){return{state:'caring',text:window.OnyxSafetyKernel?.emergencyMessage?.({country:assessment?.country||''})||'This may be an emergency. Contact local emergency services or go to the nearest emergency department if there is immediate danger, a possible overdose, severe breathing trouble, severe chest pain or pressure, sudden stroke-like symptoms, or someone cannot be kept safe.'}}if(assessment?.needsSafetyClarification){return{state:'caring',text:window.OnyxSafetyKernel?.clarificationMessage?.()||'I want to make sure I read that correctly. Is this about a current real safety concern, or fictional, quoted, historical, or hypothetical content?'}}if(tab==='health'&&(mode==='ground'||distress.test(s))){return{state:'caring',text:window.OnyxSafetyKernel?.groundingChoiceMessage?.()||'I can stay with you quietly, or we can choose one low-demand grounding option. You can also skip grounding and have me just listen.'}}if(tab==='health'&&mode==='dbt')return{state:'advising_professor',text:'Give me the facts, the strongest emotion, and the urge that came with it. We’ll choose one DBT skill.'};if(tab==='health'&&mode==='journal')return{state:'thoughtful',text:'Start with what happened, then what you felt and what you needed.'};if(tab==='health'&&(mode==='appointment'||appointment.test(s)))return{state:'advising_professor',text:'What changed, when did it start, how often does it happen, and what do you want the clinician to answer?'};if(tab==='health'&&actionNeed.test(s))return{state:'thoughtful',text:'What is the smallest visible first step that takes under two minutes?'};if(tab==='health'&&mode==='checkin')return{state:'listening',text:'Food, water, pain, temperature, bathroom, rest—then the strongest emotion and its intensity from 0–10.'};if(tab==='work')return{state:'thinking',text:'I’m with you. Give me the piece you want to build, debug, research, or turn into a file.'};if(tab==='leisure')return{state:'listening',text:'Tell me what you’re playing or thinking about, and what you want to figure out.'};return{state:'listening',text:'I’m listening.'}}
async function backendCall(action,data={},timeout=22000){if(!window.OnyxBackendClient?.request)return null;try{return await window.OnyxBackendClient.request(action,data,{timeout})}catch(_){return null}}
function canonicalState(){return LOCAL_TO_REMOTE[moodOf()]||'onyx_snuggly'}
function applyRemotePet(remote){if(!remote||typeof remote!=='object')return;pet.energy=clamp(remote.energy??pet.energy);pet.hunger=clamp(remote.fullness??remote.hunger??pet.hunger);pet.joy=clamp(remote.joy??pet.joy);pet.affection=clamp(remote.affection??pet.affection);pet.comfort=clamp(remote.comfort??pet.comfort);if(typeof remote.paused==='boolean')pet.paused=remote.paused;if(remote.lastInteractionAt)pet.lastInteractionAt=Date.parse(remote.lastInteractionAt)||pet.lastInteractionAt;if(remote.lastFedAt&&(!pet.lastCareAt||Date.parse(remote.lastFedAt)>pet.lastCareAt)){pet.lastCareAt=Date.parse(remote.lastFedAt)||pet.lastCareAt;pet.lastCareAction='feed'}save(false);remoteDirty=false;render(false);const mapped=REMOTE_TO_LOCAL[String(remote.state||'')];if(open&&mapped&&!pet.paused)requestState(mapped,7000,{quiet:true,source:'remote',priority:STATE_PRIORITY.careNeed,reason:'remote persisted pet state'}).catch(()=>{});else if(open&&pet.paused&&!activeStateLock())requestState('sleepy',12000,{quiet:true,source:'pause',priority:STATE_PRIORITY.pause,reason:'remote paused/rest state'}).catch(()=>{})}
async function syncPetFromBackend(force=false){if(!window.OnyxBackendClient?.available?.())return false;if(!force&&Date.now()-lastRemoteLoad<60000)return true;const r=await backendCall('onyx.pet.state.get',{},12000);if(!r)return false;lastRemoteLoad=Date.now();backendProfile=r.profileKey||backendProfile;conversationCursor=String(r.conversationCursor||conversationCursor||'');applyRemotePet(r.state);return true}
async function savePetToBackend(reason='state',immediate=false){if(!window.OnyxBackendClient?.available?.())return false;if(!remoteDirty&&!immediate)return true;const now=Date.now();if(!immediate&&now-lastRemoteSave<45000)return false;const data={state:{state:canonicalState(),energy:Math.round(pet.energy),fullness:Math.round(pet.hunger),joy:Math.round(pet.joy),affection:Math.round(pet.affection),comfort:Math.round(pet.comfort),lastInteractionAt:pet.lastInteractionAt?new Date(pet.lastInteractionAt).toISOString():'',lastFedAt:pet.lastCareAction==='feed'&&pet.lastCareAt?new Date(pet.lastCareAt).toISOString():'',paused:Boolean(pet.paused),closed:!open,version:1},interaction:['care','chat','open','close'].includes(reason),fed:reason==='feed',pixelStyle:{pixelized:true,source:'Onyx',spriteStyle:'72x72-code-frame',mysticBackground:'blue-pixel'},conversationCursor:conversationCursor||''};const r=await backendCall('onyx.pet.state.save',data,14000);if(r){lastRemoteSave=Date.now();remoteDirty=false;backendProfile=r.profileKey||backendProfile;return true}return false}
function queueBackendSave(reason='state',delay=2500){save(false)}
async function loadBackendHistory(force=false){if(!window.OnyxBackendClient?.available?.())return false;let expected='';try{expected=String(await window.OnyxBackendClient?.resolveProfile?.()||backendProfile||'').toLowerCase()}catch(_){}if(!force&&historyLoaded&&(!expected||historyProfile===expected))return true;const r=await backendCall('onyx.chat.history',{limit:60},16000);if(!r?.messages)return false;const got=String(r.profileKey||expected||backendProfile||'').toLowerCase();historyLoaded=true;historyProfile=got;backendProfile=got||backendProfile;window.OnyxConversationEngine?.clearHistoryCache?.();return true}
function adminTestConversation(text,mode,tab){
  const local=localFallback(text,mode,tab),quoted=String(text||"").trim().replace(/\s+/g," ").slice(0,220);
  const generic=/^(I’m listening\.|I'm listening\.|I’m with you\.|Tell me what you’re playing)/i.test(String(local?.text||""));
  if(!generic)return{...local,artifacts:[],citations:[],adminTest:true,localOnly:true};
  const byTab={
    virtual:`Mrrp. I heard you${quoted?`: “${quoted}”`:""}. #admin is running the local Onyx test path, so the conversation controls, state changes, history, and UI can be tested without an Belavados login.`,
    health:`I heard you${quoted?`: “${quoted}”`:""}. #admin is local test mode. I can exercise the Health conversation UI and safety fallbacks here, but account-backed AI, records, and tools stay disconnected.`,
    leisure:`Mrrp. #admin heard${quoted?` “${quoted}”`:" your message"}. This local test path keeps the Leisure conversation usable without signing in; live research and account tools remain off.`,
    work:`Clipboard deployed. #admin received${quoted?` “${quoted}”`:" your message"}. This is the local Work-chat test path, so you can test Onyx’s conversation UI without signing in; backend research, files, and generation remain gated.`
  };
  return{state:local?.state||preStateFor(tab,mode,text),text:byTab[tab]||byTab.virtual,artifacts:[],citations:[],adminTest:true,localOnly:true};
}

function preStateFor(tab,mode,text){const safety=safetyAssessment(text);if(safety?.emergency||crisis.test(text))return'caring';if(safety?.needsSafetyClarification)return'caring';if(window.OnyxConversationEngine?.isListenOnly?.(text,mode,null))return'listening';if(distress.test(text))return'caring';if(tab==='health'){if(mode==='pet')return/snug|cuddle|purr|pet|treat|feed|sleep|nap|meow|scratch|blanket|good boy|come here/i.test(text)?'snuggly':'listening';if(mode==='work')return/ research|search|debug|analy[sz]e|compare|code|file|repo|project/i.test(' '+text)?'thinking':'advising_professor';if(mode==='appointment'||mode==='dbt'||mode==='cbt'||mode==='support'||mode==='health')return'advising_professor';if(mode==='journal')return'thoughtful';if(mode==='ground')return'caring';return'listening'}if(tab==='work'){if(/\b(search|research|lookup|web|url|parse|file|archive|zip|debug|analy[sz]e|compare|repo|repository)\b/i.test(text))return'thinking';if(/\b(tell you|context|history|background|vent|listen)\b/i.test(text))return'listening';return'thoughtful'}if(tab==='leisure'){if(/\b(rules?|tutorial|walkthrough|strategy breakdown|explain|teach|guide|strategy|build|quest|boss|wiki|current|latest|search|compare)\b/i.test(text))return'thinking';return'snuggly'}return'listening'}
function finishStateFor(tab,answer){if(answer?.state){const requested=canonicalBehaviorName(answer.state);if(requested==='advising_professor'&&tab!=='health')return tab==='leisure'?'thinking':'thoughtful';return requested}if(tab==='health')return'advising_professor';if(tab==='work')return'thoughtful';if(tab==='leisure')return'purring';return'listening'}
function worldForgeDialogue(text,tab){
  const library=window.OnyxDialogue;
  if(!library?.select)return null;
  const mood=library.classify(text,{activity:tab==='work'?'work':undefined});
  const entry=library.select({mood,topic:text});
  return {text:entry.text,state:mood,artifacts:[],citations:[],localOnly:true,dialogueId:entry.id};
}
async function backendConversation(text,tab,mode,options={}){
  if(options.signal?.aborted)return{error:true,cancelled:true,publicError:'Stopped.'};
  if(tab==='work'&&window.BelavadosOnyxKnowledge?.answer){try{const reference=await window.BelavadosOnyxKnowledge.answer(text);if(reference)return reference;}catch(error){console.warn('Onyx reference retrieval failed',error);}}
  return worldForgeDialogue(text,tab)||{text:'Papa, I am here in local Belavadós mode. The World Forge generator works without a server, and I can respond from my installed dialogue library.',state:'listening',localOnly:true};
}

function setBusy(tab,on){if(on)busyTabs.add(tab);else busyTabs.delete(tab);const form=document.querySelector(`[data-chat-form="${tab}"]`);form?.querySelectorAll('button[type="submit"]').forEach(b=>{b.disabled=on});const stop=form?.querySelector(`[data-stop-button="${tab}"]`);if(stop){stop.hidden=!on;stop.disabled=!on;stop.setAttribute('aria-hidden',String(!on))}const statusEl=$('onyxBackendStatus');if(statusEl)statusEl.textContent=busyTabs.has(activeTab)?'Thinking…':'Ready'}
function cancelChat(tab=activeTab){tab=TAB_IDS.includes(tab)?tab:activeTab;const ctl=requestControllers.get(tab);if(!ctl||ctl.signal.aborted)return false;ctl.abort();const statusEl=$('onyxBackendStatus');if(statusEl&&tab===activeTab)statusEl.textContent='Stopping…';window.dispatchEvent(new CustomEvent('onyx:conversation-cancel-requested',{detail:{tab,threadId:laneThreads[tab]||''}}));return true}
async function chat(text,tab=activeTab,{imageIntent=false,forceWeb=false,forceArchive=false,forceWrite=false,forceParse=false,maxOutputTokens=2600,memoryPolicy='auto',signal:externalSignal=null}={}){
  tab=TAB_IDS.includes(tab)?tab:activeTab;
  text=String(text||'').trim();
  if(!text||busyTabs.has(tab))return null;
  if(imageIntent&&!/\b(generate|create|make|draw|render|design)\b[\s\S]{0,80}\b(image|picture|art|portrait|illustration|map|logo|icon|sprite|graphic)\b/i.test(text))text='Generate an image: '+text;
  const controller=new AbortController(),relay=()=>controller.abort();if(externalSignal){if(externalSignal.aborted)return{error:true,cancelled:true,publicError:'Stopped.'};externalSignal.addEventListener('abort',relay,{once:true})}requestControllers.set(tab,controller);
  const turnAttachments=laneAttachments[tab].map(item=>({...item}));
  setBusy(tab,true);
  appendChat(tab,'user',text);
  pet.lastChatAt=Date.now();
  pet.lastInteractionAt=Date.now();
  conversationActive=true;
  chatTurns++;
  activeTab=tab;
  chatMode=laneModes[tab]||'auto';
  directOverrideUntil=performance.now()+42000;
  const serious=crisis.test(text)||distress.test(text),pre=preStateFor(tab,chatMode,text),phaseLock=beginConversationState(text,tab,chatMode,pre);
  const writingIntent=tab==='work'&&/\b(write|writing|draft|rewrite|edit|story|chapter|scene|fiction|worldbuild|worldbuilding)\b/i.test(text);
  window.dispatchEvent(new CustomEvent('onyx:conversation-status',{detail:{kind:serious?'important':writingIntent?'writing':'thinking',tab,threadId:laneThreads[tab]||'',conversationPhase}}));
  try{
    await requestState(phaseLock.state,10000,{direct:true,quiet:true,source:phaseLock.source,priority:phaseLock.priority,reason:phaseLock.reason});
    let answer=await backendConversation(text,tab,chatMode,{maxOutputTokens,memoryPolicy,attachments:turnAttachments,signal:controller.signal,toolHints:{imageIntent:Boolean(imageIntent),forceWeb:Boolean(forceWeb),forceArchive:Boolean(forceArchive),forceWrite:Boolean(forceWrite),forceParse:Boolean(forceParse)}});
    if(!answer||answer.error){
      if(answer?.cancelled||controller.signal.aborted){
        const message='Stopped.';appendChat(tab,'system',message,{remember:false});$('onyxSpeech').textContent=message;
        if(!['serious_active','stabilizing','listening_active'].includes(conversationPhase))clearConversationLock('request cancelled');
        const lock=activeStateLock();await requestState(lock?.state||'thoughtful',4500,{direct:true,quiet:true,source:lock?.source||'output',priority:lock?.priority||STATE_PRIORITY.output,reason:lock?.reason||'request cancelled'});
        window.dispatchEvent(new CustomEvent('onyx:conversation-cancelled',{detail:{tab,threadId:laneThreads[tab]||'',conversationPhase}}));
        return{error:true,cancelled:true,text:'',message,state:lock?.state||'thoughtful',tab}
      }
      const currentSafety=safetyAssessment(text),safetyLocal=serious||Boolean(currentSafety?.needsSafetyClarification)||(tab==='health'&&(chatMode==='ground'||distress.test(text)));
      if(safetyLocal){const r=localFallback(text,chatMode,tab);answer={text:r.text,state:r.state,artifacts:[],citations:[],localSafetyFallback:true}}
      else{
        const message=String(answer?.publicError||"Onyx couldn't connect.");
        appendChat(tab,'system',message,{remember:false});$('onyxSpeech').textContent=message;
        if(!['serious_active','stabilizing','listening_active'].includes(conversationPhase))clearConversationLock('conversation request failed');
        const lock=activeStateLock();await requestState(lock?.state||'thoughtful',6500,{direct:true,quiet:true,source:lock?.source||'output',priority:lock?.priority||STATE_PRIORITY.output,reason:lock?.reason||'conversation request failed'});
        window.dispatchEvent(new CustomEvent('onyx:conversation-failed',{detail:{tab,threadId:laneThreads[tab]||'',message,conversationPhase}}));
        return{error:true,text:'',message,state:lock?.state||'thoughtful',tab}
      }
    }
    if(turnAttachments.length){const sent=new Set(turnAttachments.map(a=>window.OnyxMedia?.attachmentKey?.(a)||[a.fileId||'',a.url||'',a.name||'',a.sizeBytes||''].join('|')));laneAttachments[tab]=laneAttachments[tab].filter(a=>!sent.has(window.OnyxMedia?.attachmentKey?.(a)||[a.fileId||'',a.url||'',a.name||'',a.sizeBytes||''].join('|')));attachmentDisplay(tab);window.dispatchEvent(new CustomEvent('onyx:attachments-consumed',{detail:{tab,count:turnAttachments.length}}))}
    const finalState=finishStateFor(tab,answer),outputLock=finishConversationState(finalState,answer,tab);
    await requestState(outputLock.state,13000,{direct:true,quiet:true,source:outputLock.source,priority:outputLock.priority,reason:outputLock.reason});
    const replyLine=appendChat(tab,'onyx',answer.text,{artifacts:answer.artifacts||[],citations:answer.citations||[]});
    $('onyxSpeech').textContent=answer.text;
    render();
    queueBackendSave('chat',1000);
    window.dispatchEvent(new CustomEvent('onyx:conversation-complete',{detail:{tab,threadId:laneThreads[tab]||answer.threadId||'',answer:{...answer,toolTrace:undefined},conversationPhase,state:stateDiagnostics(),element:replyLine}}));
    if(quietCompanion&&!['serious_active','stabilizing'].includes(conversationPhase)){const quietLock=setConversationLock('quiet_companion','snuggly',STATE_PRIORITY.phase,'return to timerless quiet companionship after chat','phase');await requestState('snuggly',10000,{direct:true,quiet:true,source:'phase',priority:quietLock.priority,reason:quietLock.reason});$('onyxSpeech').textContent='Still here.';syncQuietCompanionUi()}
    return answer
  }finally{if(externalSignal)externalSignal.removeEventListener('abort',relay);if(requestControllers.get(tab)===controller)requestControllers.delete(tab);setBusy(tab,false)}
}
async function setPaused(value){pet.paused=Boolean(value);pet.lastInteractionAt=Date.now();careOverlayToken++;directOverrideUntil=performance.now()+12000;const lock=activeStateLock(),applied=await requestState(pet.paused?'sleepy':'snuggly',12000,{direct:true,quiet:true,source:'pause',priority:STATE_PRIORITY.pause,reason:pet.paused?'user entered pause/rest':'user resumed from pause/rest'});$('onyxSpeech').textContent=applied?(pet.paused?'Nap mode.':'Back.'):(lock?.phase==='serious_active'?'Pause saved. I’m still here.':pet.paused?'Pause saved.':'Back.');render();save();savePetToBackend('state',true).catch(()=>{});window.dispatchEvent(new CustomEvent('onyx:pause-change',{detail:{paused:pet.paused,profileKey:localProfileId(),stateApplied:Boolean(applied),conversationPhase}}));return pet.paused}
const CARE={feed:{state:'purring',hunger:24,joy:5,affection:2,line:'Tribute accepted.'},water:{state:'purring',comfort:4,line:'Water inspection complete.'},treat:{state:'purring',hunger:8,joy:5,line:'Treat accepted.'},pet:{state:'purring',joy:6,affection:7,line:'Purr motor engaged.'},scratch:{state:'purring',joy:8,affection:8,line:'Excellent scratchies.'},play:{state:'purring',energy:-5,joy:14,affection:4,line:'A brief burst of chaos.'},brush:{state:'caring',comfort:6,affection:5,line:'Grooming approved.'},rest:{state:'snuggly',energy:20,comfort:8,line:'Nap jurisdiction.'},blanket:{state:'snuggly',comfort:12,line:'Blanket installed.'},fan:{state:'snuggly',comfort:10,line:'Climate control approved.'},bowtie:{state:'purring',joy:6,comfort:2,line:'Formal authority restored.'},pillow:{state:'snuggly',comfort:9,line:'Pillow approved.'},tuck:{state:'sleepy',comfort:10,energy:8,line:'Tucked in.'},check:{state:'snuggly',comfort:3,line:'Inspection accepted.'},settle:{state:'sleepy',comfort:7,energy:5,line:'Settling.'},nuzzle:{state:'purring',joy:6,affection:8,line:'Onyx leans in.'},slowblink:{state:'purring',affection:5,comfort:3,line:'Slow blink returned.'}};
async function act(name){const c=CARE[name];if(!c)return;window.dispatchEvent(new CustomEvent('onyx:pet-action',{detail:{action:name,tab:'virtual'}}));if(['feed','treat','pet','scratch','nuzzle','bowtie','slowblink'].includes(name))playPetVoice(name==='feed'?.16:.12);const keepConversation=Boolean(activeStateLock()),token=++careOverlayToken;pet.energy=clamp(pet.energy+(c.energy||0));pet.hunger=clamp(pet.hunger+(c.hunger||0));pet.joy=clamp(pet.joy+(c.joy||0));pet.affection=clamp(pet.affection+(c.affection||0));pet.comfort=clamp(pet.comfort+(c.comfort||0));pet.careCount++;pet.lastCareAt=Date.now();pet.lastCareAction=name;pet.lastInteractionAt=Date.now();directOverrideUntil=performance.now()+10000;artFx.careAt=performance.now();artFx.careKind=String(name||'care');const applied=await requestState(c.state,6500,{direct:true,quiet:true,source:'direct-care',priority:STATE_PRIORITY.directCare,reason:'direct pet interaction: '+name,overlay:true});if(applied)$('onyxSpeech').textContent=c.line;render();save();savePetToBackend(name==='feed'?'feed':'care',true).catch(()=>{});if(keepConversation&&applied)setTimeout(()=>{if(token!==careOverlayToken||!activeStateLock())return;const lock=activeStateLock();requestState(lock.state,9000,{direct:true,quiet:true,source:lock.source,priority:lock.priority,reason:'return from direct-care overlay'}).catch(()=>{})},6600)}
function render(markRemote=true){for(const k of ['energy','hunger','joy','affection','comfort']){const C=k[0].toUpperCase()+k.slice(1),v=Math.round(pet[k]);const value=$(`onyx${C}Value`),fill=$(`onyx${C}Fill`),meter=$(`onyx${C}Meter`);if(value)value.textContent=v;if(fill)fill.style.width=v+'%';if(meter)meter.setAttribute('aria-valuenow',String(v))}$('onyxMoodText').textContent=label();save(markRemote)}
function syncQuietCompanionUi(){try{window.dispatchEvent(new CustomEvent('onyx:quiet-companion-change',{detail:{active:quietCompanion,profileKey:localProfileId(),conversationPhase}}))}catch(_){}return quietCompanion}
async function setQuietCompanion(value){const next=Boolean(value);if(next===quietCompanion){syncQuietCompanionUi();return quietCompanion}quietCompanion=next;pet.lastInteractionAt=Date.now();directOverrideUntil=performance.now()+12000;if(next){conversationActive=true;const lock=setConversationLock('quiet_companion','snuggly',STATE_PRIORITY.phase,'timerless quiet companionship/body-double mode','phase');await requestState('snuggly',12000,{direct:true,quiet:true,source:'phase',priority:lock.priority,reason:lock.reason});$('onyxSpeech').textContent='I’m here. No timer. No report required.'}else{if(conversationPhase==='quiet_companion')clearConversationLock('quiet companionship ended by user');conversationActive=Boolean(activeStateLock());const lock=activeStateLock();await requestState(lock?.state||stateForTab(activeTab),7000,{direct:true,quiet:true,source:lock?.source||'tab',priority:lock?.priority||STATE_PRIORITY.tab,reason:lock?.reason||'quiet companionship ended'});$('onyxSpeech').textContent=lock?'Still here.':'Back.'}syncQuietCompanionUi();window.dispatchEvent(new CustomEvent('onyx:quiet-companion',{detail:{active:quietCompanion,profileKey:localProfileId()}}));return quietCompanion}
function setChatMode(m,tab='health'){if(tab!=='health')m='auto';if(tab==='health'&&quietCompanion){quietCompanion=false;syncQuietCompanionUi()}laneModes[tab]=m||'auto';if(activeTab===tab)chatMode=laneModes[tab];document.querySelectorAll('[data-mode-group="health"] [data-chat-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.chatMode===laneModes.health));const cue={auto:'I’m here.',listen:'I’m listening.',checkin:'How are you?',ground:'Stay with me.',dbt:'What are we working on?',journal:'Go ahead.',appointment:'What should we organize?'}[laneModes.health]||'I’m here.';if(tab==='health')$('onyxSpeech').textContent=cue;conversationActive=true;directOverrideUntil=performance.now()+18000;if(tab==='health'){const next=laneModes.health==='appointment'||laneModes.health==='dbt'?'advising_professor':laneModes.health==='journal'?'thoughtful':laneModes.health==='ground'?'caring':'listening',phase=laneModes.health==='listen'?'listening_active':'active',priority=laneModes.health==='listen'?STATE_PRIORITY.input:STATE_PRIORITY.phase;setConversationLock(phase,next,priority,laneModes.health==='listen'?'explicit Health listen mode':'Health conversation mode','input');requestState(next,10000,{direct:true,quiet:true,source:'input',priority,reason:conversationLock.reason})}}
function stateForTab(tab){return ({virtual:'snuggly',health:'listening',leisure:'snuggly',work:'thoughtful'})[tab]||'listening'}
async function setTab(tab,{focus=false}={}){if(tab==='health'||tab==='leisure'||tab==='virtual')tab='work';if(!TAB_IDS.includes(tab))return false;activeTab=tab;chatMode=laneModes[tab]||'auto';widget.dataset.onyxTab=tab;document.querySelectorAll('[data-onyx-tab-button]').forEach(b=>{const on=b.dataset.onyxTabButton===tab;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on))});document.querySelectorAll('[data-onyx-tab-panel]').forEach(p=>{const on=p.dataset.onyxTabPanel===tab;p.hidden=!on;p.classList.toggle('is-active',on)});conversationActive=Boolean(activeStateLock());directOverrideUntil=performance.now()+4000;const next=pet.paused&&!activeStateLock()?'sleepy':stateForTab(tab);await requestState(next,8500,{direct:true,quiet:true,source:'tab',priority:STATE_PRIORITY.tab,reason:'active tab bias: '+tab});if(focus)document.querySelector(`[data-chat-input="${tab}"]`)?.focus();window.dispatchEvent(new CustomEvent('onyx:tab-change',{detail:{tab,conversationPhase,state:stateDiagnostics()}}));return true}
function exitFullscreen(){if(!fullScreenTab)return;const p=document.querySelector(`[data-onyx-tab-panel="${fullScreenTab}"]`);p?.classList.remove('is-fullscreen');widget.classList.remove('tab-fullscreen');widget.dataset.sizeState=open?'expanded':'hyper-reduced';fullScreenTab='';document.documentElement.style.overflow='';document.body.style.overflow='';window.dispatchEvent(new CustomEvent('onyx:fullscreen-change',{detail:{fullscreen:false,tab:activeTab}}))}
function enterFullscreen(tab){if(adminTestMode()||!['virtual','health','leisure'].includes(tab))return;exitFullscreen();setTab(tab);const p=document.querySelector(`[data-onyx-tab-panel="${tab}"]`);p?.classList.add('is-fullscreen');widget.classList.add('tab-fullscreen');widget.dataset.sizeState='mega-larger';fullScreenTab=tab;document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';p?.querySelector('[data-chat-input]')?.focus();window.dispatchEvent(new CustomEvent('onyx:fullscreen-change',{detail:{fullscreen:true,tab}}))}
function setThread(tab,threadId=''){if(!TAB_IDS.includes(tab))return false;laneThreads[tab]=String(threadId||'');window.OnyxConversationEngine?.resetLane?.(localProfileId(),tab,laneThreads[tab]);window.dispatchEvent(new CustomEvent('onyx:thread-change',{detail:{tab,threadId:laneThreads[tab]}}));return true}
function getThread(tab=activeTab){return TAB_IDS.includes(tab)?laneThreads[tab]:''}
function clearLane(tab,{keepThread=true}={}){if(!TAB_IDS.includes(tab))return false;laneMemory[tab]=[];laneAttachments[tab]=[];const log=document.querySelector(`[data-chat-log="${tab}"]`);if(log)log.textContent='';attachmentDisplay(tab);if(!keepThread)laneThreads[tab]='';persistLanes();return true}
function newChat(tab=activeTab,threadId=''){if(!TAB_IDS.includes(tab))return false;clearLane(tab,{keepThread:false});setThread(tab,threadId||('belavados-onyx-'+localProfileId()+'-'+tab+'-'+Date.now().toString(36)));window.OnyxConversationEngine?.resetLane?.(localProfileId(),tab,laneThreads[tab]);conversationActive=false;return laneThreads[tab]}
function loadThread(tab=activeTab,thread={}){if(!TAB_IDS.includes(tab))return false;clearLane(tab,{keepThread:false});laneThreads[tab]=String(thread.threadId||'');window.OnyxConversationEngine?.resetLane?.(localProfileId(),tab,laneThreads[tab]);const messages=Array.isArray(thread.messages)?thread.messages:[];for(const m of messages.slice(-80)){const who=m.role==='user'?'user':m.role==='system'?'system':'onyx';appendChat(tab,who,m.content,{remember:who!=='system',persist:false,artifacts:m.artifacts||[],citations:m.citations||[],messageId:m.id||'',emit:false,restore:true})}persistLanes();conversationActive=laneMemory[tab].length>0;window.dispatchEvent(new CustomEvent('onyx:thread-change',{detail:{tab,threadId:laneThreads[tab]}}));return true}
function attachmentDisplay(tab){const strip=document.querySelector(`[data-attachment-strip="${tab}"]`);if(!strip)return;strip.textContent='';laneAttachments[tab].forEach((a,i)=>{const chip=document.createElement('div');chip.className='onyx-attachment-chip';const name=document.createElement('span');name.textContent=a.name||'File';const rm=document.createElement('button');rm.type='button';rm.className='onyx-attachment-remove';rm.textContent='×';rm.setAttribute('aria-label','Remove '+(a.name||'file'));rm.addEventListener('click',()=>{laneAttachments[tab].splice(i,1);attachmentDisplay(tab)});chip.append(name,rm);strip.appendChild(chip)})}
async function addFiles(tab,fileList){if(!TAB_IDS.includes(tab))return;const files=[...(fileList||[])].slice(0,12);if(!files.length)return;const status=$('onyxBackendStatus');for(const file of files){if(laneAttachments[tab].length>=12)break;try{if(status)status.textContent='Uploading…';if(!window.OnyxBackendClient?.fileUpload)throw new Error('Upload unavailable');const r=await window.OnyxBackendClient.fileUpload(file,{purpose:`Onyx ${tab} conversation attachment`});const candidates=window.OnyxBackendClient.extractArtifacts?.(r)||[];const a=candidates[0]||{kind:/^image\//i.test(file.type)?'image':'file',name:file.name,mimeType:file.type,sizeBytes:file.size,fileId:r?.driveFileId||r?.fileId||r?.mediaId||'',url:r?.url||r?.driveUrl||''};a.name=a.name||file.name;a.mimeType=a.mimeType||file.type;a.sizeBytes=a.sizeBytes||file.size;if(!a.fileId&&!a.url)throw new Error('Upload incomplete');laneAttachments[tab].push(a);attachmentDisplay(tab)}catch(e){appendChat(tab,'system',window.OnyxBackendClient?.publicError?.(e)||'That file could not be attached.',{remember:false})}}if(status)status.textContent='Ready'}
async function setOpen(v){if(v)focusBeforeOpen=document.activeElement;open=v;widget.classList.toggle('open',v);widget.dataset.sizeState=v?'expanded':'hyper-reduced';bubble.setAttribute('aria-expanded',String(v));panel.setAttribute('aria-hidden',String(!v));window.dispatchEvent(new CustomEvent('onyx:open-change',{detail:{open:v,conversationPhase}}));pet.visits+=(v?1:0);pet.lastInteractionAt=Date.now();if(v){conversationActive=Boolean(activeStateLock());directOverrideUntil=performance.now()+4000;const req=reconciledOpenRequest();await ensureMood(moodOf(req.state));if(!reducedMotion)ensureTransitions();await requestState(req.state,6500,{direct:true,quiet:true,source:req.source,priority:req.priority,reason:req.reason});$('onyxSpeech').textContent=pet.paused&&!activeStateLock()?'Nap mode.':activeStateLock()?'Still here.':'I’m here.';autonomyNext=performance.now()+11000;if(!backendBooted)bootstrapBackend();else{syncPetFromBackend(false);loadBackendHistory()}if(!deepLoadStarted)loadDeepDataLight();requestAnimationFrame(()=>{try{panel.focus({preventScroll:true})}catch(_){panel.focus?.()}})}else{exitFullscreen();conversationActive=false;requestSerial++;const req=closedSettleRequest();await ensureMood(moodOf(req.state));await requestState(req.state,18000,{quiet:true,source:req.source,priority:req.priority,reason:req.reason,force:req.source==='idle'});$('onyxSpeech').textContent=req.speech;closedNext=performance.now()+22000;if(!req.keepLock)clearConversationLock('conversation settled on close');queueBackendSave('close',1200);requestAnimationFrame(()=>{const target=focusBeforeOpen&&focusBeforeOpen.isConnected?focusBeforeOpen:bubble;try{target?.focus?.({preventScroll:true})}catch(_){target?.focus?.()}focusBeforeOpen=null})}render()}
async function loadDeepDataLight(){deepLoadStarted=true;try{const data=await window.OnyxDataRuntime?.load?.();deep.support=data?.shared?.support||null;deep.config=window.OnyxConfig||data?.shared?.config||null}catch(_){deep.support=null;deep.config=window.OnyxConfig||null}}
async function bootstrapBackend(){backendBooted=true;const el=$('onyxBackendStatus');if(el)el.textContent='Ready';return true}
document.querySelectorAll('[data-onyx-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.onyxAction)));
$('onyxWidget')?.querySelector('[data-onyx-pause-toggle]')?.addEventListener('click',()=>setPaused(!pet.paused));
document.querySelectorAll('[data-chat-mode]').forEach(b=>b.addEventListener('click',()=>setChatMode(b.dataset.chatMode,'health')));
// Tab chrome is owned by the upgraded module shell; core exposes setTab() but does not bind a second click handler.
document.querySelectorAll('[data-fullscreen-enter]').forEach(b=>b.addEventListener('click',()=>enterFullscreen(b.dataset.fullscreenEnter)));
document.querySelectorAll('[data-fullscreen-exit]').forEach(b=>b.addEventListener('click',exitFullscreen));
window.addEventListener('onyx:design-enter',()=>{designReturnState=moodOf();directOverrideUntil=performance.now()+5000;requestState('thoughtful',9000,{direct:true,quiet:true,source:'design',priority:STATE_PRIORITY.tab,reason:'Design tab entered'}).catch(()=>{})});
window.addEventListener('onyx-module-design-change',()=>{directOverrideUntil=performance.now()+4200;requestState('thinking',4200,{direct:true,quiet:true,source:'design',priority:STATE_PRIORITY.tab,reason:'Design control changed'}).catch(()=>{})});
window.addEventListener('onyx:design-action',event=>{const action=String(event.detail?.action||'edit');const next=/save|apply/.test(action)?'purring':'thinking';directOverrideUntil=performance.now()+5200;requestState(next,5200,{direct:true,quiet:true,source:'design',priority:STATE_PRIORITY.tab,reason:'Design action: '+action}).catch(()=>{})});
window.addEventListener('onyx:design-exit',event=>{const nextTab=String(event.detail?.nextTab||activeTab),next=stateForTab(nextTab)||designReturnState||'thoughtful';requestState(next,6500,{direct:true,quiet:true,source:'tab',priority:STATE_PRIORITY.tab,reason:'Design tab exited'}).catch(()=>{})});
document.querySelectorAll('[data-chat-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const tab=form.dataset.chatForm,input=form.querySelector('[data-chat-input]'),v=input?.value||'',forceWeb=form.dataset.forceWeb==='true';if(input)input.value='';form.dataset.forceWeb='false';chat(v,tab,{forceWeb,memoryPolicy:form.dataset.memoryPolicy||'auto'})}));
document.querySelectorAll('[data-stop-button]').forEach(b=>b.addEventListener('click',()=>cancelChat(b.dataset.stopButton)));
document.querySelectorAll('[data-attach-button]').forEach(b=>b.addEventListener('click',()=>document.querySelector(`[data-file-input="${b.dataset.attachButton}"]`)?.click()));
document.querySelectorAll('[data-file-input]').forEach(inp=>inp.addEventListener('change',async()=>{const tab=inp.dataset.fileInput;await addFiles(tab,inp.files);inp.value=''}));
document.querySelectorAll('[data-image-button]').forEach(b=>b.addEventListener('click',()=>{const tab=b.dataset.imageButton,input=document.querySelector(`[data-chat-input="${tab}"]`),v=String(input?.value||'').trim();if(!v){input?.focus();return}if(input)input.value='';chat(v,tab,{imageIntent:true})}));
document.querySelectorAll('[data-chat-surface]').forEach(surface=>{surface.addEventListener('dragover',e=>{if(e.dataTransfer?.types?.includes('Files'))e.preventDefault()});surface.addEventListener('drop',e=>{if(!e.dataTransfer?.files?.length)return;e.preventDefault();addFiles(surface.dataset.chatSurface,e.dataTransfer.files)})});
$('onyxClose').addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(fullScreenTab)exitFullscreen();else setOpen(false)});
bubble.addEventListener('pointermove',e=>{if(reducedMotion)return;const r=bubble.getBoundingClientRect();if(!r.width||!r.height)return;gaze.targetX=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)*2));gaze.targetY=Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height-.5)*2));gaze.active=true});bubble.addEventListener('pointerleave',()=>{gaze.targetX=0;gaze.targetY=0;gaze.active=false});
let suppressBubbleClickUntil=0;
function bubbleFullscreen(){return widget.classList.contains('is-fullscreen')||widget.classList.contains('tab-fullscreen')}
function emitWidgetMove(){try{window.dispatchEvent(new CustomEvent('onyx:widget-move',{detail:{left:widget.getBoundingClientRect().left,top:widget.getBoundingClientRect().top}}))}catch(_){}}
function clampBubblePosition(left,top){
  const w=bubble.offsetWidth||190,h=bubble.offsetHeight||190;
  return{
    left:Math.max(8,Math.min(Math.max(8,innerWidth-w-8),Number(left)||8)),
    top:Math.max(8,Math.min(Math.max(8,innerHeight-h-8),Number(top)||8))
  }
}
function finishBubbleDrag(e,cancelled=false){
  if(!drag||(!cancelled&&e&&drag.id!==e.pointerId))return;
  const wasMoved=moved;
  if(wasMoved){
    const r=widget.getBoundingClientRect(),next=clampBubblePosition(r.left,r.top);
    widget.style.left=next.left+'px';widget.style.top=next.top+'px';widget.style.right='auto';
    try{localStorage.setItem(POS,JSON.stringify(next))}catch(_){storageWarning('widget position')}
    suppressBubbleClickUntil=performance.now()+450;
    emitWidgetMove();
  }
  widget.classList.remove('dragging');
  const pointerId=e?.pointerId;
  drag=null;moved=false;
  try{if(pointerId!=null&&bubble.hasPointerCapture?.(pointerId))bubble.releasePointerCapture?.(pointerId)}catch(_){}
}
bubble.addEventListener('pointerdown',e=>{
  if(bubbleFullscreen())return;
  if(e.button!==undefined&&e.button!==0)return;
  const r=widget.getBoundingClientRect();
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,l:r.left,t:r.top};
  moved=false;
  try{bubble.setPointerCapture?.(e.pointerId)}catch(_){}
});
bubble.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId||bubbleFullscreen())return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!moved&&Math.hypot(dx,dy)>6){moved=true;widget.classList.add('dragging')}
  if(!moved)return;
  e.preventDefault?.();
  const next=clampBubblePosition(drag.l+dx,drag.t+dy);
  widget.style.left=next.left+'px';widget.style.top=next.top+'px';widget.style.right='auto';
  emitWidgetMove();
});
bubble.addEventListener('pointerup',e=>finishBubbleDrag(e,false));
bubble.addEventListener('pointercancel',e=>finishBubbleDrag(e,true));
bubble.addEventListener('lostpointercapture',e=>{if(drag&&drag.id===e.pointerId)finishBubbleDrag(e,true)});
bubble.addEventListener('click',e=>{
  // Click owns opening/closing. Pointer-up only finishes drag, which makes the
  // control reliable for mouse, touch, pen, and keyboard activation alike.
  if(performance.now()<suppressBubbleClickUntil){e.preventDefault();e.stopPropagation();return}
  if(bubbleFullscreen())return;
  setOpen(!open);
});
try{
  const p=JSON.parse(localStorage.getItem(POS)||'null');
  if(p&&Number.isFinite(p.left)&&Number.isFinite(p.top)){
    const next=clampBubblePosition(p.left,p.top);
    widget.style.left=next.left+'px';widget.style.top=next.top+'px';widget.style.right='auto';
  }
}catch(_){ }
window.addEventListener('resize',()=>{
  if(bubbleFullscreen())return;
  const r=widget.getBoundingClientRect(),next=clampBubblePosition(r.left,r.top);
  widget.style.left=next.left+'px';widget.style.top=next.top+'px';widget.style.right='auto';
  emitWidgetMove();
});
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();lastRender=performance.now();if(document.hidden){savePetToBackend('state',false).catch(()=>{})}else{if(!stateData(state))requestState('sleepy',5000,{quiet:true});syncPetFromBackend(false)}});window.addEventListener('pagehide',()=>{persistLanes();savePetToBackend('state',false).catch(()=>{})});
setInterval(()=>{if(document.hidden||reducedMotion)return;const t=performance.now();if(t-lastRender>7000||t-lastAdvance>11000){transition=null;frame=0;lastFrame=t;requestState(stateData(state)?state:'sleepy',5000,{quiet:true})}},3000);
/* Core relationship meters never decay from absence. Energy/fullness use only tiny active-session simulation floors. */
setInterval(()=>{if(pet.paused){render(false);return}pet.energy=clamp(pet.energy-.012,40,100);pet.hunger=clamp(pet.hunger-.018,35,100);render();if(remoteDirty)savePetToBackend('state',false).catch(()=>{})},60000);
setInterval(()=>{if(!document.hidden&&backendBooted)syncPetFromBackend(false).catch(()=>{})},30000);
if(window.OnyxBackendClient?.onStatus){window.OnyxBackendClient.onStatus(function(st){const el=$('onyxBackendStatus');if(el)el.textContent=st.online?'Ready':(st.transportReady?(st.lastError?'Offline':'Connecting…'):'Offline');if(st.transportReady&&!backendBooted)bootstrapBackend().catch(()=>{});if(st.profileKey){const next=String(st.profileKey).toLowerCase();if(backendProfile&&next&&next!==backendProfile){historyLoaded=false;historyProfile='';for(const tab of TAB_IDS){laneMemory[tab]=[];laneAttachments[tab]=[];laneThreads[tab]='';const log=document.querySelector(`[data-chat-log="${tab}"]`);if(log)log.textContent='';attachmentDisplay(tab)}window.OnyxConversationEngine?.clearHistoryCache?.();window.OnyxHealthRuntime?.clear?.();localPetProfile=next;pet=loadLocalPet(next);remoteDirty=false;restoreLanes();render();syncPetFromBackend(true).catch(()=>{})}backendProfile=next||backendProfile}})}
try{reducedMotionQuery?.addEventListener?.('change',event=>{reducedMotion=Boolean(event.matches);transition=null;frame=0;gaze.x=gaze.y=gaze.targetX=gaze.targetY=0;lastFrame=performance.now();lastAdvance=lastFrame;autonomyNext=lastFrame+60000;if(reducedMotion){clearTimeout(reducedTickTimer);try{draw(artFx.stateAt+240)}catch(_){}}})}catch(_){}
try{window.addEventListener('onyx:local-retention-change',()=>persistLanes())}catch(_){}
window.OnyxBackendBridge=Object.freeze({syncPet:()=>syncPetFromBackend(true),savePet:()=>savePetToBackend('state',true),history:loadBackendHistory,capabilities:()=>window.OnyxBackendClient?.capabilities?.(),connected:()=>Boolean(window.OnyxBackendClient?.available?.())});
// Compatibility aliases keep older parent integrations on the upgraded conversation path.
function localPsych(text,mode='auto',tab=activeTab){return localFallback(String(text||''),mode,tab)}
function backendPsych(text,tab=activeTab,mode=laneModes[tab]||'auto'){return backendConversation(String(text||''),tab,mode)}
function backendCueState(result,text='',tab=activeTab){const stateName=finishStateFor(tab,result||{});if(result&&typeof result==='object'&&!result.state)result.state=stateName;return stateName}
function publicSetState(next,ms=0,options={}){const local=canonicalBehaviorName(next),safe={...options};delete safe.force;delete safe.source;delete safe.priority;return requestState(local,ms,{...safe,source:'host',priority:STATE_PRIORITY.host,reason:'host canonical state request'})}
window.OnyxVirtualPet=Object.freeze({getState:()=>({...pet,state:canonicalState(),canonicalState:canonicalState(),canonicalMood:moodOf(),behaviorVariant:state,open,chatMode,activeTab,backendProfile,conversationCursor,threadId:laneThreads[activeTab]||'',busyTabs:[...busyTabs],quietCompanion,...stateDiagnostics()}),setState:publicSetState,setBehaviorVariant:(next,ms=0,options={})=>{const safe={...options};delete safe.force;delete safe.source;delete safe.priority;return requestState(next,ms,{...safe,source:'host',priority:STATE_PRIORITY.host,reason:'host behavior-variant request'})},act,pause:()=>setPaused(true),resume:()=>setPaused(false),togglePause:()=>setPaused(!pet.paused),setQuietCompanion,toggleQuietCompanion:()=>setQuietCompanion(!quietCompanion),chat:(message,tab=activeTab,options={})=>chat(message,tab,options),cancelChat,open:()=>setOpen(true),close:()=>setOpen(false),setTab,setChatMode:(mode)=>setChatMode(mode,'work'),enterFullscreen,exitFullscreen,newChat,loadThread,setThread,getThread,getLaneHistory:(tab=activeTab)=>(laneMemory[tab]||[]).map(x=>({...x})),clearLane,attachments:(tab=activeTab)=>laneAttachments[tab].map(x=>({...x,base64:undefined,content:undefined})),stateDiagnostics,clearConversationState:()=>clearConversationLock('host cleared conversation state'),preload:async()=>{await ensureMood('advising_professor');await ensureTransitions();return true},cycleMoods:async(ms=1800)=>{for(const m of CANONICAL_BEHAVIORS){await requestState(m,ms,{direct:true,quiet:true,source:'debug',priority:STATE_PRIORITY.debug,reason:'debug mood cycle',force:true});await sleep(ms)}},backend:window.OnyxBackendBridge});
restoreLanes();render();requestState('listening',18000,{quiet:true,source:'system',priority:STATE_PRIORITY.idle,reason:'initial listening state',force:true}).catch(()=>{});setTab('work');syncQuietCompanionUi();scheduleTick();window.dispatchEvent(new CustomEvent('onyx:core-ready',{detail:{tabs:TAB_IDS.slice(),state:stateDiagnostics()}}));setTimeout(()=>bootstrapBackend(),350);
})();
