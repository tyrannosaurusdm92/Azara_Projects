/* Shared Onyx frame-by-frame timing, direction, and SVG in-between utility. */
(()=>{
  "use strict";
  const profiles=window.OnyxFrameByFrameProfiles||(window.OnyxFrameByFrameProfiles=Object.create(null));
  const DEFAULT_WEIGHTS={idle:[7,1,8,1,9],walk:[1,1,1,1,1],run:[1,1,1,1,1],action:[2,1,1,1,2]};
  const DEFAULT_CYCLE={idle:2500,walk:520,run:390,action:900};
  const DIRECTIONS=Object.freeze(["right","down_right","down_left","left","up_left","up_right"]);
  const RUN_POSES=Object.freeze(["rear_push","gathered_stride","airborne_extended","front_reach"]);
  const JUMP_POSES=Object.freeze(["crouched_start","launch","airborne_rise","airborne_fall","landing_crouch"]);
  const MOOD_FRAMES=Object.freeze({
    caring:["approaching_front_head_tilt_close.svg","approaching_front_head_tilt_tail_up.svg","sitting_front_head_tilt_soft_gaze.svg","sitting_front_paw_reaching_gently.svg","sitting_paw_raised_head_tilt.svg","sitting_paw_reaching_head_tilt.svg","standing_three_quarter_head_tilt_tail_up.svg","walking_toward_tail_up_soft_gaze.svg"],
    hungry:["sitting_front_alert_waiting.svg","sitting_front_mouth_open_begging.svg","sitting_front_tongue_out.svg","standing_front_tongue_out_tail_low.svg","standing_front_tongue_out_tail_up.svg","standing_three_quarter_tongue_out_tail_curled.svg","walking_toward_paw_lifted_expectant.svg","walking_toward_tongue_out_tail_up.svg"],
    judgmental:["sitting_front_head_tilt_skeptical_left.svg","sitting_front_head_tilt_skeptical_right.svg","sitting_front_side_eye_head_left.svg","sitting_front_side_eye_head_right.svg","sitting_three_quarter_side_eye.svg","standing_front_three_quarter_stern_tail_low.svg","standing_three_quarter_side_eye_tail_low.svg","standing_three_quarter_stern_tail_low.svg"],
    listening:["sitting_front_ears_forward.svg","sitting_front_head_tilt_side.svg","sitting_front_head_tilt_up.svg","sitting_three_quarter_head_tilt_attentive.svg","sitting_three_quarter_head_up_attentive.svg","standing_three_quarter_ears_forward.svg","standing_three_quarter_head_lowered_attentive.svg","standing_three_quarter_head_tilt_listening.svg"],
    purring:["sitting_eyes_closed_head_raised.svg","sitting_eyes_closed_head_raised_tail_curled.svg","sitting_eyes_closed_tail_curled.svg","sitting_front_relaxed_tail_curled.svg","sitting_three_quarter_relaxed_tail_curled.svg","standing_front_relaxed_tail_high.svg","standing_three_quarter_head_up_tail_high.svg","standing_three_quarter_relaxed_tail_curled.svg"],
    sleepy:["sitting_front_eyes_closed.svg","sitting_front_head_drooped_asleep.svg","sitting_front_head_drooped_eyes_closed.svg","sitting_three_quarter_dozy_head_turned.svg","sitting_three_quarter_eyes_closed.svg","standing_profile_drowsy_head_low.svg","standing_three_quarter_drowsy.svg","standing_three_quarter_eyes_closed.svg"],
    snuggly:["approaching_front_head_tilt.svg","crouched_close_head_tilt.svg","curled_loaf_relaxed.svg","curled_lying_head_down.svg","curled_lying_head_raised.svg","sitting_curled_tail_around_paws.svg","sitting_three_quarter_head_tilt.svg","standing_three_quarter_head_tilt_tail_high.svg"],
    thinking:["sitting_front_head_tilt_thinking.svg","sitting_front_paw_raised_considering.svg","sitting_front_paw_to_chest_head_tilt.svg","sitting_side_head_tilt_thinking.svg","sitting_three_quarter_looking_up.svg","standing_front_three_quarter_looking_up.svg","standing_three_quarter_gazing_up.svg","standing_three_quarter_looking_up_tail_curved.svg"],
    thoughtful:["sitting_front_gazing_up.svg","sitting_paw_to_chest_head_tilt.svg","sitting_paw_to_chin.svg","sitting_paw_to_chin_head_tilt.svg","sitting_three_quarter_head_tilt_tail_extended.svg","standing_front_head_tilt_tail_low.svg","standing_three_quarter_gazing_up_tail_low.svg","standing_three_quarter_head_tilt_tail_up.svg"]
  });
  const LOAF_FRAMES=Object.freeze(["turn_transition_loaf_standing_three_quarter_tail_low_a.svg","turn_transition_loaf_standing_three_quarter_tail_low_b.svg","turn_transition_loaf_loaf_three_quarter_head_up.svg","turn_transition_loaf_loaf_three_quarter_head_level.svg","turn_transition_loaf_loaf_front_head_up.svg","turn_transition_loaf_loaf_front_head_level.svg"]);
  const SLEEP_FRAMES=Object.freeze(["turn_transition_sleep_loaf_front_awake.svg","turn_transition_sleep_loaf_front_drowsy.svg","turn_transition_sleep_loaf_front_relaxed.svg","turn_transition_sleep_reclining_side_head_up.svg","turn_transition_sleep_sleep_curled_side.svg","turn_transition_sleep_sleep_curled_tight.svg"]);
  const STRETCH_FRAMES=Object.freeze(["turn_transition_stretch_standing_profile_right.svg","turn_transition_stretch_forward_stretch_tail_up.svg","turn_transition_stretch_deep_forward_stretch_tail_up.svg","turn_transition_stretch_deep_forward_stretch_tail_curved.svg","turn_transition_stretch_deep_forward_stretch_tail_hooked.svg","turn_transition_stretch_standing_profile_left.svg"]);

  function register(profile){
    if(!profile||!profile.id)return null;
    profiles[profile.id]=Object.freeze({...profile});
    return profiles[profile.id];
  }
  function profile(name){return profiles[String(name||"")]||profiles.base_cat||null}
  function assetFor(name){return profile(name)?.asset||profile("base_cat")?.asset||"assets/images/games/virtual/atlases/onyx_meow_sprite_atlas.png"}
  function cssToken(element,name){try{return getComputedStyle(element).getPropertyValue(name).trim()}catch(_){return ""}}
  function numberToken(value,fallback){const n=parseFloat(String(value||""));return Number.isFinite(n)&&n>0?n:fallback}
  function weightToken(value,fallback){
    const values=String(value||"").trim().split(/[\s,]+/).map(Number).filter(n=>Number.isFinite(n)&&n>0);
    return values.length===5?values:fallback.slice();
  }
  function reducedMotion(){try{return Boolean(matchMedia("(prefers-reduced-motion: reduce)").matches)}catch(_){return false}}
  function categoryFor(action){
    return action==="idle"?"idle":action==="walk"?"walk":/^(run|dash|dashjump)$/.test(action)?"run":"action";
  }
  function sampleFor(options={}){
    let {actor=null,mood="base_cat",action="idle",elapsedMs=0,durationMs=0,loop=true,count=5,distancePx=null,speedPxPerSec=null}=options;
    count=Math.max(1,Math.floor(Number(count)||5));
    if(reducedMotion())return Object.freeze({sequenceIndex:0,segmentProgress:0,inbetween:false,category:categoryFor(action),cycleProgress:0});
    const p=profile(mood),category=categoryFor(action);
    const cssCycle=cssToken(actor,`--onyx-${category}-cycle-ms`);
    const cssWeights=cssToken(actor,`--onyx-${category}-phase-weights`);
    const cycle=numberToken(cssCycle,p?.timingMs?.[category]||DEFAULT_CYCLE[category]);
    const sourceWeights=weightToken(cssWeights,p?.phaseWeights?.[category]||DEFAULT_WEIGHTS[category]);
    const weights=Array.from({length:count},(_,index)=>sourceWeights[index%sourceWeights.length]);
    const totalWeight=weights.reduce((a,b)=>a+b,0)||1;
    const span=loop?cycle:Math.max(1,Number(durationMs)||cycle);
    let cursor,cycleProgress=0;
    const distance=Number(distancePx),speed=Math.abs(Number(speedPxPerSec));
    const phaseSource=cssToken(actor,`--onyx-${category}-phase-source`)||p?.gaitPhaseSource||"elapsed";
    if((category==="walk"||category==="run")&&phaseSource==="screen-distance"&&Number.isFinite(distance)&&Number.isFinite(speed)&&speed>0){
      const stridePx=speed*cycle/1000;
      cycleProgress=(((distance%stridePx)+stridePx)%stridePx)/stridePx;
      cursor=cycleProgress*totalWeight;
    }else{
      let t=Number(elapsedMs)||0;
      if(loop)t=((t%span)+span)%span;else t=Math.max(0,Math.min(span-.001,t));
      cycleProgress=t/span;
      cursor=cycleProgress*totalWeight;
    }
    for(let index=0;index<count;index++){
      const weight=weights[index]||1;
      if(cursor<weight){
        const segmentProgress=Math.max(0,Math.min(.999999,cursor/weight));
        return Object.freeze({sequenceIndex:index,segmentProgress,inbetween:segmentProgress>=.5,category,cycleProgress});
      }
      cursor-=weight;
    }
    return Object.freeze({sequenceIndex:count-1,segmentProgress:.999999,inbetween:true,category,cycleProgress});
  }
  function phaseFor(options={}){return sampleFor(options).sequenceIndex}
  function vectorAssetFor({mood="base_cat",action="idle",direction=0,sequenceIndex=0,inbetween=true}={}){
    if(!inbetween||reducedMotion())return "";
    const dir=DIRECTIONS[((Math.floor(Number(direction)||0)%6)+6)%6],index=Math.max(0,Math.floor(Number(sequenceIndex)||0));
    const base="assets/images/games/virtual/base_cat";
    if(/^(walk|run|dash)$/.test(action))return `${base}turn_transition_run_${dir}_${RUN_POSES[index%RUN_POSES.length]}.svg`;
    if(/jump|dashjump|drop/.test(action))return `${base}turn_transition_jump_${dir}_${JUMP_POSES[index%JUMP_POSES.length]}.svg`;
    if(/loaf|sitToLoaf/i.test(action))return base+LOAF_FRAMES[index%LOAF_FRAMES.length];
    if(/sleep|curl|snuggle/i.test(action))return base+SLEEP_FRAMES[index%SLEEP_FRAMES.length];
    if(/stretch|backLegExtend|riseFromStretch/i.test(action))return base+STRETCH_FRAMES[index%STRETCH_FRAMES.length];
    const moodFrames=MOOD_FRAMES[mood];
    if(moodFrames&&(dir==="down_left"||dir==="down_right"))return `assets/images/games/virtual/${mood}/${moodFrames[index%moodFrames.length]}`;
    return `${base}turn_transition_idle_${dir}_01.svg`;
  }
  function octantFromVector(x,y){if(Math.hypot(Number(x)||0,Number(y)||0)<.03)return null;return ((Math.round(Math.atan2(y,x)/(Math.PI/4))%8)+8)%8}
  function viewForOctant(octant,previous=0){
    const left=Number(previous)===2||Number(previous)===3||Number(previous)===4;
    return [0,1,left?2:1,2,3,4,left?4:5,5][((Number(octant)||0)%8+8)%8];
  }
  window.OnyxFrameAnimation=Object.freeze({
    schema:"onyx-svg-atlas-inbetweens/v1",register,profile,profiles,assetFor,phaseFor,sampleFor,vectorAssetFor,
    octantFromVector,viewForOctant,directions:DIRECTIONS,moodFrames:MOOD_FRAMES,
    frameStrategy:"atlas keyframes with SVG halfway poses"
  });
})();
