/* Professor Onyx full-body atlas renderer — 2026-10-04.
 * Uses the supplied 30x22 professor contact sheet for the only rendered biped appearance.
 * The existing Feed Him MEOW quadruped/placeholder implementation is intentionally untouched.
 */
(()=>{"use strict";
const ASSET="assets/images/games/virtual/atlases/onyx_professor_sprite_atlas.png";
const METADATA="json/prof.json";
const GRID=Object.freeze({columns:30,rows:22,cell:64,width:1919,height:1408});
const VISUAL_ANCHOR=Object.freeze({cellWidth:64,cellHeight:64,centerX:32,groundY:60,visibleFootY:61,centerXFraction:32/64,groundYFraction:60/64,visibleFootYFraction:61/64});
const CLIPS=Object.freeze({"idle_stand":{"directions":{"right":["f000","f001","f002","f003","f004"],"down-right":["f005","f006","f007","f008","f009"],"down-left":["f010","f011","f012","f013","f014"],"left":["f015","f016","f017","f018","f019"],"up-left":["f020","f021","f022","f023","f024"],"up-right":["f025","f026","f027","f028","f029"]},"loop":true},"walk_quadruped":{"directions":{"right":["f030","f031"],"down-right":["f035","f036"],"down-left":["f040","f041"],"left":["f045","f046","f047"],"up-left":["f050","f051","f052"],"up-right":["f055","f056","f057"]},"frameDurationMs":135,"loop":true},"walk_biped":{"directions":{"right":["f032","f033","f034"],"down-right":["f037","f038","f039"],"down-left":["f042","f043","f044"],"left":["f048","f049"],"up-left":["f053","f054"],"up-right":["f058","f059"]},"frameDurationMs":135,"loop":true},"professor_enter_rise":{"directions":{"right":["f060","f061","f062","f063","f064"],"down-right":["f065","f066","f067","f068","f069"],"down-left":["f070","f071","f072","f073","f074"],"left":["f075","f076","f077","f078","f079"],"up-left":["f080","f081","f082","f083","f084"],"up-right":["f085","f086","f087","f088","f089"]},"frameDurationsMs":[110,120,140,120,140],"loop":false,"holdLastFrame":true},"professor_exit_rise":{"directions":{"right":["f064","f063","f062","f061","f060"],"down-right":["f069","f068","f067","f066","f065"],"down-left":["f074","f073","f072","f071","f070"],"left":["f079","f078","f077","f076","f075"],"up-left":["f084","f083","f082","f081","f080"],"up-right":["f089","f088","f087","f086","f085"]},"frameDurationsMs":[140,120,140,120,110],"loop":false,"holdLastFrame":true},"professor_enter_spin":{"directions":{"right":["f090","f091","f092","f093","f094"],"down-right":["f095","f096","f097","f098","f099"],"down-left":["f100","f101","f102","f103","f104"],"left":["f105","f106","f107","f108","f109"],"up-left":["f110","f111","f112","f113","f114"],"up-right":["f115","f116","f117","f118","f119"]},"frameDurationsMs":[100,95,120,120,150],"loop":false,"holdLastFrame":true},"professor_exit_spin":{"directions":{"right":["f094","f093","f092","f091","f090"],"down-right":["f099","f098","f097","f096","f095"],"down-left":["f104","f103","f102","f101","f100"],"left":["f109","f108","f107","f106","f105"],"up-left":["f114","f113","f112","f111","f110"],"up-right":["f119","f118","f117","f116","f115"]},"frameDurationsMs":[150,120,120,95,100],"loop":false,"holdLastFrame":true},"professor_stand":{"directions":{"right":["f064"],"down-right":["f069"],"down-left":["f074"],"left":["f079"],"up-left":["f084"],"up-right":["f089"]},"loop":false,"holdLastFrame":true},"professor_sit_settle":{"directions":{"front":["f180","f181","f182","f183","f184"]},"frameDurationMs":220,"equivalentFrontBlocks":[["f180","f181","f182","f183","f184"],["f185","f186","f187","f188","f189"],["f190","f191","f192","f193","f194"],["f195","f196","f197","f198","f199"],["f200","f201","f202","f203","f204"],["f205","f206","f207","f208","f209"]],"loop":true},"professor_sit_lean":{"directions":{"front":["f210","f211","f212","f213","f214"]},"frameDurationMs":220,"equivalentFrontBlocks":[["f210","f211","f212","f213","f214"],["f215","f216","f217","f218","f219"],["f220","f221","f222","f223","f224"],["f225","f226","f227","f228","f229"],["f230","f231","f232","f233","f234"],["f235","f236","f237","f238","f239"]],"loop":true},"professor_sit_listen":{"directions":{"front":["f450","f451","f452","f453","f454"]},"frameDurationMs":220,"equivalentFrontBlocks":[["f450","f451","f452","f453","f454"],["f455","f456","f457","f458","f459"],["f460","f461","f462","f463","f464"],["f465","f466","f467","f468","f469"],["f470","f471","f472","f473","f474"],["f475","f476","f477","f478","f479"]],"loop":true},"professor_sit_notes":{"directions":{"front":["f540","f541","f542","f543","f544"]},"frameDurationMs":220,"equivalentFrontBlocks":[["f540","f541","f542","f543","f544"],["f545","f546","f547","f548","f549"],["f550","f551","f552","f553","f554"],["f555","f556","f557","f558","f559"],["f560","f561","f562","f563","f564"],["f565","f566","f567","f568","f569"]],"loop":true},"professor_sit_crossed":{"directions":{"front":["f600","f601","f602","f603","f604"]},"frameDurationMs":220,"equivalentFrontBlocks":[["f600","f601","f602","f603","f604"],["f605","f606","f607","f608","f609"],["f610","f611","f612","f613","f614"],["f615","f616","f617","f618","f619"],["f620","f621","f622","f623","f624"],["f625","f626","f627","f628","f629"]],"loop":true},"professor_sit_prepare":{"directions":{"front":["f630","f631","f632","f633","f634"]},"frameDurationMs":220,"equivalentFrontBlocks":[["f630","f631","f632","f633","f634"],["f635","f636","f637","f638","f639"],["f640","f641","f642","f643","f644"],["f645","f646","f647","f648","f649"],["f650","f651","f652","f653","f654"],["f655","f656","f657","f658","f659"]],"loop":true}});
const DIR=Object.freeze({right:"right",forward:"down-right",down:"down-right",left:"left",back:"up-right",up:"up-right","down-right":"down-right","down-left":"down-left","up-left":"up-left","up-right":"up-right"});
const CHAT_POSES=Object.freeze(["professor_sit_settle","professor_sit_listen","professor_sit_lean","professor_sit_notes","professor_sit_crossed"]);
const FRAME_PROFILE=window.OnyxFrameAnimation?.profile?.("advising_professor")||null;
const clipTiming=(name,fallback)=>FRAME_PROFILE?.clipTimingsMs?.[name]??fallback;
const ENTER_MS=clipTiming("professor_enter_rise",CLIPS.professor_enter_rise.frameDurationsMs||[110,120,140,120,140]).reduce((a,b)=>a+b,0);
const EXIT_MS=clipTiming("professor_exit_rise",CLIPS.professor_exit_rise.frameDurationsMs||[140,120,140,120,110]).reduce((a,b)=>a+b,0);
const SETTLE_MS=760, PREPARE_MS=820, TURN_STEP_MS=125;
const FACING_ORDER=Object.freeze(["right","down-right","down-left","left","up-left","up-right"]);
const atlasImage=new Image();
atlasImage.decoding="async";atlasImage.src=ASSET;
const VECTOR_ROOT="assets/images/games/virtual/professor";
const PROFESSOR_VECTORS=Object.freeze({
  enter:["quadruped_standing_mid_transition.svg","quadruped_spin_low_blur.svg","quadruped_spin_rising_blur.svg","transformation_mid_biped_clothed.svg","biped_spin_finishing_blur.svg","professor_standing_front.svg"],
  walkToward:["professor_walking_toward_left_step_with_clipboard.svg","professor_walking_toward_right_step_with_clipboard.svg"],
  walkAway:["professor_walking_away_left_step.svg","professor_walking_away_head_turn_left.svg","professor_walking_away_right_step.svg","professor_walking_away_head_turn_right.svg"],
  settle:["professor_standing_front_clipboard_at_side.svg","professor_half_standing_with_clipboard.svg","professor_crouching_to_sit.svg","professor_seated_front_holding_clipboard.svg"],
  seated:["professor_seated_front_hands_on_knees.svg","professor_seated_front_holding_clipboard.svg","professor_seated_cross_legged_reading_clipboard.svg","professor_seated_cross_legged_writing_clipboard.svg"],
  prepare:["professor_seated_cross_legged_writing_clipboard.svg","professor_crouching_to_sit.svg","professor_rising_from_seat_with_clipboard.svg","professor_half_standing_with_clipboard.svg","professor_standing_front_clipboard_at_side.svg"]
});
const vectorImages=Object.create(null);
function now(){return typeof performance!=="undefined"?performance.now():Date.now()}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dirKey(facing){return DIR[String(facing||"forward").toLowerCase()]||"down-right"}
function frameIndex(id){const n=parseInt(String(id||"").replace(/^f/,""),10);return Number.isFinite(n)?clamp(n,0,659):0}
function frameRect(id){const n=frameIndex(id),row=Math.floor(n/30),col=n%30;return {x:col*64,y:row*64,width:col===29?63:64,height:64,row,col,index:n}}
function clipDurations(seq,durations){
  return (durations?.length===seq.length?durations:Array(seq.length).fill(Number(durations)||180)).map(v=>Math.max(16,Number(v)||180));
}
function timedFrame(seq,durations,elapsed,loop=false){
  if(!seq?.length)return"f000";
  const ds=clipDurations(seq,durations);
  const total=ds.reduce((a,b)=>a+b,0)||1;let t=loop?((elapsed%total)+total)%total:clamp(elapsed,0,total-.001);
  for(let i=0;i<seq.length;i++){if(t<ds[i])return seq[i];t-=ds[i]}
  return seq[seq.length-1]
}
function travelTimedFrame(seq,durations,distancePx,speedPxPerSec){
  if(!seq?.length||!Number.isFinite(Number(distancePx)))return null;
  const speed=Math.abs(Number(speedPxPerSec));if(!Number.isFinite(speed)||speed<=0)return null;
  const total=clipDurations(seq,durations).reduce((a,b)=>a+b,0)||1;
  const stridePx=speed*total/1000;if(!Number.isFinite(stridePx)||stridePx<=0)return null;
  const progress=(((Number(distancePx)%stridePx)+stridePx)%stridePx)/stridePx;
  return timedFrame(seq,durations,progress*total,true)
}
function seqFor(name,facing,block=0){const clip=CLIPS[name]||{};if(clip.equivalentFrontBlocks?.length)return clip.equivalentFrontBlocks[((block%clip.equivalentFrontBlocks.length)+clip.equivalentFrontBlocks.length)%clip.equivalentFrontBlocks.length];const d=dirKey(facing);return clip.directions?.[d]||clip.directions?.front||Object.values(clip.directions||{})[0]||["f000"]}
function drawFrame(target,id,size){
  if(!target)return false;const out=Math.max(1,Math.floor(Number(size)||target.width||96));if(target.width!==out)target.width=out;if(target.height!==out)target.height=out;
  const ctx=target.getContext?.("2d");if(!ctx)return false;ctx.clearRect(0,0,out,out);ctx.imageSmoothingEnabled=false;
  if(!atlasImage.complete||!atlasImage.naturalWidth)return false;const r=frameRect(id);ctx.drawImage(atlasImage,r.x,r.y,r.width,r.height,0,0,out,out);return true
}
function vectorImage(src){
  if(!src)return null;if(vectorImages[src])return vectorImages[src];
  const image=new Image();image.decoding="async";image.src=src;vectorImages[src]=image;return image;
}
function drawVectorFrame(target,src,size){
  if(!target||!src)return false;const image=vectorImage(src),out=Math.max(1,Math.floor(Number(size)||target.width||96));
  if(!image?.complete||!image.naturalWidth)return false;if(target.width!==out)target.width=out;if(target.height!==out)target.height=out;
  const ctx=target.getContext?.("2d");if(!ctx)return false;ctx.clearRect(0,0,out,out);ctx.imageSmoothingEnabled=true;
  const scale=Math.min(out/image.naturalWidth,out/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
  ctx.drawImage(image,(out-width)/2,(out-height)/2,width,height);return true;
}
function vectorAssetForProfessor(runtime,elapsed,options={}){
  if(options.reducedMotion)return "";
  try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return ""}catch(_){}
  const mode=runtime.mode,moving=Boolean(options.moving);let interval=150,frames=[];
  if(mode==="enter"||mode==="exit"){interval=115;frames=mode==="exit"?[...PROFESSOR_VECTORS.enter].reverse():PROFESSOR_VECTORS.enter}
  else if(mode==="standing"&&moving){interval=135;frames=/up/.test(String(options.facing||""))?PROFESSOR_VECTORS.walkAway:PROFESSOR_VECTORS.walkToward}
  else if(mode==="settle"){interval=SETTLE_MS/PROFESSOR_VECTORS.settle.length;frames=PROFESSOR_VECTORS.settle}
  else if(mode==="prepare"){interval=PREPARE_MS/PROFESSOR_VECTORS.prepare.length;frames=PROFESSOR_VECTORS.prepare}
  else if(mode==="seated"){interval=220;frames=PROFESSOR_VECTORS.seated}
  else return "";
  const step=Math.max(0,elapsed/Math.max(16,interval)),fraction=step-Math.floor(step);
  if(fraction<.5)return "";
  return VECTOR_ROOT+frames[Math.floor(step)%frames.length];
}
function createProfessorActor(){
  const runtime={mode:"quadruped",desired:"quadruped",stateSince:now(),poseIndex:0,poseBlock:0,nextPoseAt:0,lastRole:"",chatting:false,lastFrame:"f000",lastFacing:"forward",prepareTarget:"exit",enterTarget:"standing",turnPath:[]};
  function setMode(mode,t=now()){runtime.mode=mode;runtime.stateSince=t}
  function beginQuadrupedProfessor(t=now()){
    runtime.desired="professor";runtime.chatting=true;runtime.enterTarget="standing";runtime.turnPath=[];
    if(runtime.mode==="quadruped"||runtime.mode==="quadruped-professor")setMode("quadruped-professor",t);
    return runtime.mode;
  }
  function beginProfessorEntry(t=now()){
    runtime.desired="professor";runtime.enterTarget="standing";runtime.turnPath=[];
    setMode("enter",t);return runtime.mode;
  }
  function enterProfessor(t=now(),reason="manual",target="standing"){
    runtime.desired="professor";runtime.enterTarget=target==="seated"?"seated":"standing";
    if(reason==="chat")runtime.chatting=true;
    if(runtime.mode==="quadruped"||runtime.mode==="quadruped-professor"||runtime.mode==="exit")setMode("enter",t);
    return runtime.mode;
  }
  function exitProfessor(t=now()){
    runtime.desired="quadruped";runtime.chatting=false;runtime.prepareTarget="exit";runtime.turnPath=[];
    if(runtime.mode==="seated"||runtime.mode==="settle")setMode("prepare",t);
    else if(runtime.mode!=="quadruped")setMode("exit",t);
    return runtime.mode;
  }
  function toggleProfessor(t=now()){
    return runtime.desired==="professor"?exitProfessor(t):enterProfessor(t,"manual","standing");
  }
  function sit(t=now()){
    runtime.desired="professor";runtime.prepareTarget="standing";
    if(runtime.mode==="quadruped"||runtime.mode==="quadruped-professor"||runtime.mode==="exit"){
      enterProfessor(t,"manual","seated");return runtime.mode;
    }
    if(runtime.mode==="standing"||runtime.mode==="turn"||runtime.mode==="prepare")setMode("settle",t);
    return runtime.mode;
  }
  function getUp(t=now()){
    runtime.desired="professor";runtime.chatting=false;runtime.prepareTarget="standing";
    if(runtime.mode==="quadruped"||runtime.mode==="quadruped-professor"||runtime.mode==="exit"){
      enterProfessor(t,"manual","standing");return runtime.mode;
    }
    if(runtime.mode==="enter"){runtime.enterTarget="standing";return runtime.mode;}
    if(runtime.mode==="seated"||runtime.mode==="settle")setMode("prepare",t);
    return runtime.mode;
  }
  function turnTo(facing,t=now()){
    const target=dirKey(facing),start=dirKey(runtime.lastFacing||"forward");
    let from=FACING_ORDER.indexOf(start),to=FACING_ORDER.indexOf(target);
    if(from<0)from=1;if(to<0)to=1;
    const forward=(to-from+6)%6,backward=(from-to+6)%6,step=forward<=backward?1:-1;
    const count=Math.min(forward,backward);runtime.turnPath=[FACING_ORDER[from]];
    for(let i=1;i<=count;i++)runtime.turnPath.push(FACING_ORDER[(from+step*i+6)%6]);
    runtime.lastFacing=facing;setMode("turn",t);return runtime.mode;
  }
  function noteChatActivity(role="user",t=now()){
    runtime.lastRole=String(role||"");
    if(runtime.mode==="quadruped"||runtime.mode==="quadruped-professor"||runtime.mode==="exit")enterProfessor(t,"chat","standing");
    runtime.chatting=true;
    if(runtime.mode==="seated"){
      if(runtime.lastRole==="user")runtime.poseIndex=2;
      else runtime.poseIndex=(runtime.poseIndex+1)%CHAT_POSES.length;
      runtime.poseBlock=(runtime.poseBlock+1)%6;runtime.stateSince=t;runtime.nextPoseAt=t+2200;
    }
  }
  function advance(t){
    let e=t-runtime.stateSince;
    if(runtime.mode==="quadruped"&&runtime.desired==="professor"){setMode("enter",t);e=0;}
    if(runtime.mode==="enter"&&e>=ENTER_MS){
      if(runtime.desired==="quadruped")setMode("exit",t);
      else if(runtime.enterTarget==="seated")setMode("settle",t);
      else setMode("standing",t);e=0;
    }
    if(runtime.mode==="turn"&&e>=runtime.turnPath.length*TURN_STEP_MS){setMode("standing",t);runtime.turnPath=[];e=0;}
    if(runtime.mode==="settle"&&e>=SETTLE_MS){setMode("seated",t);runtime.nextPoseAt=t+2400;e=0;}
    if(runtime.mode==="seated"&&runtime.desired==="quadruped"){setMode("prepare",t);e=0;}
    if(runtime.mode==="seated"&&t>=runtime.nextPoseAt){runtime.poseIndex=(runtime.poseIndex+1)%CHAT_POSES.length;runtime.poseBlock=(runtime.poseBlock+1)%6;runtime.stateSince=t;runtime.nextPoseAt=t+2400+((runtime.poseIndex%3)*350);e=0;}
    if(runtime.mode==="prepare"&&e>=PREPARE_MS){
      if(runtime.prepareTarget==="standing"&&runtime.desired==="professor")setMode("standing",t);
      else setMode("exit",t);e=0;
    }
    if(runtime.mode==="exit"&&e>=EXIT_MS){setMode(runtime.desired==="professor"?"enter":"quadruped",t);e=0;}
    return t-runtime.stateSince;
  }
  function pickFrame(t,options){
    const facing=options.facing||runtime.lastFacing||"forward";runtime.lastFacing=facing;const elapsed=advance(t);
    if(runtime.mode==="quadruped"||runtime.mode==="quadruped-professor"){
      const moving=!!options.moving,name=moving?"walk_quadruped":"idle_stand",seq=seqFor(name,facing),fd=clipTiming(name,CLIPS[name].frameDurationMs||150);
      if(moving&&FRAME_PROFILE?.gaitPhaseSource==="screen-distance"){const grounded=travelTimedFrame(seq,fd,options.gaitDistancePx,options.gaitSpeedPxPerSec);if(grounded)return grounded}
      return timedFrame(seq,fd,elapsed,true);
    }
    if(runtime.mode==="enter")return timedFrame(seqFor("professor_enter_rise",facing),clipTiming("professor_enter_rise",CLIPS.professor_enter_rise.frameDurationsMs),elapsed,false);
    if(runtime.mode==="standing"){
      if(options.moving){const seq=seqFor("walk_biped",facing),fd=clipTiming("walk_biped",CLIPS.walk_biped.frameDurationMs||135);if(FRAME_PROFILE?.gaitPhaseSource==="screen-distance"){const grounded=travelTimedFrame(seq,fd,options.gaitDistancePx,options.gaitSpeedPxPerSec);if(grounded)return grounded}return timedFrame(seq,fd,elapsed,true)}
      return seqFor("professor_stand",facing)[0];
    }
    if(runtime.mode==="turn"){
      const i=Math.min(Math.max(0,runtime.turnPath.length-1),Math.floor(elapsed/TURN_STEP_MS));
      return seqFor("professor_stand",runtime.turnPath[i]||facing)[0];
    }
    if(runtime.mode==="settle")return timedFrame(seqFor("professor_sit_settle","front",0),clipTiming("professor_sit_settle",Array(5).fill(SETTLE_MS/5)),elapsed,false);
    if(runtime.mode==="prepare")return timedFrame(seqFor("professor_sit_prepare","front",runtime.poseBlock),clipTiming("professor_sit_prepare",Array(5).fill(PREPARE_MS/5)),elapsed,false);
    if(runtime.mode==="exit")return timedFrame(seqFor("professor_exit_rise",facing),clipTiming("professor_exit_rise",CLIPS.professor_exit_rise.frameDurationsMs),elapsed,false);
    const pose=CHAT_POSES[runtime.poseIndex%CHAT_POSES.length],seq=seqFor(pose,"front",runtime.poseBlock),fd=clipTiming(pose,CLIPS[pose].frameDurationMs||220);
    return timedFrame(seq,fd,elapsed,true);
  }
  function render(target,options={}){
    const t=Number(options.time)||now();
    if(options.chatting===true){runtime.chatting=true;if(runtime.desired!=="professor")enterProfessor(t,"chat","standing");}
    else if(options.chatting===false)runtime.chatting=false;
    if(options.avatarPose?.mode==="seated"&&runtime.desired!=="professor")enterProfessor(t,"manual","seated");
    const id=pickFrame(t,options),elapsed=Math.max(0,t-runtime.stateSince),vectorSrc=vectorAssetForProfessor(runtime,elapsed,options);runtime.lastFrame=id;
    const vectorDrawn=drawVectorFrame(target,vectorSrc,options.size);if(!vectorDrawn)drawFrame(target,id,options.size);
    if(target?.dataset){target.dataset.onyxBody="advising_professor_atlas";target.dataset.onyxAtlasState=runtime.mode;target.dataset.onyxAtlasTransition=(runtime.mode==="enter"||runtime.mode==="exit"||runtime.mode==="turn")?runtime.mode:"idle";target.dataset.onyxAtlasFrame=id;target.dataset.onyxAtlasAsset=ASSET;target.dataset.onyxFrameRenderer=vectorDrawn?"svg-inbetween":"atlas-keyframe";target.dataset.onyxVectorFrame=vectorDrawn?vectorSrc:"";}
    return {frame:id,mode:runtime.mode,desired:runtime.desired,chatting:runtime.chatting,metadata:METADATA};
  }
  function reset(t=now()){
    runtime.mode="quadruped";runtime.desired="quadruped";runtime.chatting=false;runtime.stateSince=t;runtime.poseIndex=0;runtime.poseBlock=0;runtime.nextPoseAt=0;runtime.lastRole="";runtime.prepareTarget="exit";runtime.enterTarget="standing";runtime.turnPath=[];
  }
  const api={
    schema:"onyx-professor-contact-sheet-actor/v2",state:"advising_professor",variant:"advising_professor",label:"Professor Onyx — contact-sheet actor",
    asset:ASSET,metadata:METADATA,grid:GRID,visualAnchor:VISUAL_ANCHOR,getVisualAnchor:()=>({...VISUAL_ANCHOR}),render,
    beginQuadrupedProfessor,beginProfessorEntry,enterProfessor,exitProfessor,toggleProfessor,sit,getUp,turnTo,
    beginChat:(t)=>enterProfessor(t,"chat","standing"),endChat:()=>{runtime.chatting=false;},noteChatActivity,reset,
    getState:()=>({...runtime}),validateIntegration:()=>true
  };
  return Object.freeze(api);
}
function registerIntegratedActor(api){if(!api?.render)throw new Error("Invalid Professor atlas actor");window.OnyxIntegratedActorRegistry=Object.freeze({advising_professor:api});return api}
const FACTORY=Object.freeze({schema:"onyx-professor-contact-sheet-factory/v1",createProfessorActor,registerIntegratedActor,asset:ASSET,metadata:METADATA});
window.OnyxBipedalPaperDollFactory=FACTORY; // compatibility name; renderer is now atlas-backed, not a paper doll.
window.OnyxProfessorContactSheetFactory=FACTORY;
window.OnyxKitchenVariantRegistry=Object.freeze({}); // old hungry/purring/judgmental rendered bipeds intentionally removed.
})();
