/* Writer Helper Ready consolidated module: helper-safety.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-fade-to-black.js | sha256:4f8646a82d9f22aaa954f8ad7596131743819e88bb6905394b2706598d6053a0 ===== */
/* Writer Tools — fade-to-black transition bridge. This module never generates sexual content. */
(function(global){'use strict';
 const VERSION='1.0.0-fade-only';
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 function makeFadeChapter(options={}){
   const parent=options.parent||options.chapter||{}; const series=options.series||{}; const n=Math.max(1,Number(options.chapterNumber||parent.chapter_number||0)+1);
   const resume=String(options.resumeTarget||'@generate');
   return {schema_version:'7.0',work_type:'story_chapter',id:options.id||`fade-${Date.now().toString(36)}`,chapter_number:n,title:options.title||'Fade to Black',generated:true,content:'The romantic moment reaches the story boundary.\n\n[Fade to black.]\n\nLater, the story returns to what changed emotionally, practically, or in the larger plot, without describing what happened off-page.',choices:[{id:'resume-story',label:'Return to the story',description:'Continue after the fade.',path_key:'resume_story',target:resume,effect:{},generation_hint:'Resume after the fade with continuity preserved and no sexual recap.'}],continuity_snapshot:clone(parent.continuity_snapshot||{}),content_mode:'fade_to_black',fade_to_black:true,series_key:series.key||''};
 }
 async function create(options={}){return {chapter:makeFadeChapter(options),fade_to_black:true};}
 async function continueStory(options={}){return create(options);}
 async function branch(options={}){return create(options);}
 function attachToApp(app){if(app&&typeof app==='object'){app.fadeToBlack={create,continue:continueStory,branch,makeFadeChapter,VERSION};}return app;}
 const api=Object.freeze({VERSION,makeFadeChapter,create,continue:continueStory,branch,attachToApp});
 global.WriterFadeToBlackBridge=api;
 try{global.StoryTools?.WriterGeneration?.registerSceneTransition?.(api);}catch(_e){}
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== William Saville fade-transition prose integration ===== */
(function(global){'use strict';const base=global.WriterFadeToBlackBridge;if(!base)return;
function makeFadeChapter(options={}){const chapter=base.makeFadeChapter?.(options)||{};chapter.content='The moment changed before either of them needed to explain it. A question, a pause, and the kind of answer that made the next step private.\n\n[Fade to black.]\n\nLater, the story returned to the part that mattered on-page: what had shifted between them, what still needed words, and what the larger world would ask of them next. The private moment stayed private.';chapter.william_voice=global.WriterWilliamVoice?.buildPacket?.({kind:'story',prompt:'fade to black emotional transition',includeEvidence:false})||null;return chapter;}
async function create(options={}){return{chapter:makeFadeChapter(options),fade_to_black:true};}
async function continueStory(options={}){return create(options);}async function branch(options={}){return create(options);}
const api=Object.freeze({...base,makeFadeChapter,create,continue:continueStory,branch});global.WriterFadeToBlackBridge=api;try{global.StoryTools?.WriterGeneration?.registerSceneTransition?.(api);}catch(_e){}
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-fade-to-black.js ===== */

/* ===== BEGIN SOURCE: writer-romance-boundary.js | sha256:5cfa7f170d03a6248ccc4d4ea94316d7911b44dc2078a825060b031639478d14 ===== */
/* Writer Tools — romance boundary. Romance may be on-page; scenes that would become sexual always fade to black. */
(function(global){'use strict';
 const RATING='General / Romance / Fade to Black';
 const audience=Object.freeze({project_scope:'general writing tools',fixed_person:false});
 const romancePolicy=Object.freeze({allowed:['romance','affection','kissing','flirting','relationship conversations'],boundary:'fade_to_black',on_page_sexual_content:false});
 const relationshipPolicy=Object.freeze({approach:'relationship-first',fade_to_black:true,after_scene:'resume with emotions, dialogue, plot consequences, or a time jump without describing off-page events'});
 const reader=Object.freeze({id:'writer-tools-audience',name:'Project audience',fixed_person:false});
 function normalizeMode(value='romance'){const v=String(value?.id||value||'romance').toLowerCase();if(['fade','fade_to_black','fade-to-black'].includes(v))return 'fade_to_black';return v==='general'?'general':'romance';}
 function validateSeries(series={}){return {ok:true,mode:normalizeMode(series.content_mode),issues:[]};}
 function validateContext(context={}){return {ok:true,mode:normalizeMode(context?.content?.effective_mode||context?.content?.requested_mode||'romance'),issues:[]};}
 function enforceTimeline(series={}){return {series:{...series,content_mode:normalizeMode(series.content_mode)},gate:{ok:true,issues:[]},adjusted:false};}
 function contractForSeries(series={}){return {rating:RATING,audience,romancePolicy,relationshipPolicy,reader,mode:normalizeMode(series.content_mode),rules:['Keep romance non-graphic.','If the scene would become sexual, end the on-page moment with [Fade to black.].','Resume later with emotion, dialogue, plot consequences, or a time jump without describing what happened off-page.','Never sexualize minors.']};}
 function promptBlock(series={},context={}){const c=contractForSeries(series);return ['ROMANCE BOUNDARY',`Mode: ${normalizeMode(context?.content?.effective_mode||series.content_mode)}`,...c.rules].join('\n');}
 global.WriterToolsRomanceBoundary=Object.freeze({RATING,audience,romancePolicy,relationshipPolicy,reader,normalizeMode,validateSeries,validateContext,enforceTimeline,contractForSeries,promptBlock});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-romance-boundary.js ===== */

/* ===== BEGIN SOURCE: writer-content-boundary.js | sha256:27806c30a59351eb298977731a082e59a3fa6bcc7c7da15728f4e7c7b5c14398 ===== */
/* Writer Tools — content-boundary utilities for safe fade-to-black handling. */
(function(global){'use strict';
 const FADE='[Fade to black.]';
 const escalation=/\b(?:sex|sexual|intercourse|oral sex|penetration|genitals?|explicit|erotic|smut|porn(?:ographic)?)\b/i;
 function isFade(context={}){const mode=String(context?.content?.effective_mode||context?.content?.requested_mode||context?.mode||'').toLowerCase();const target=String(context?.selected_choice?.target||'').toLowerCase();return mode.includes('fade')||target.startsWith('@generate-fade');}
 function stripQuotedText(value=''){return String(value||'').replace(/[“”"']([^“”"']{0,500})[“”"']/g,' ');}
 function promptBlock(){return 'CONTENT BOUNDARY: Romance may remain on-page, but do not generate sexual acts or explicit erotic description. When escalation would cross that boundary, end the on-page moment with [Fade to black.] and resume later without sexual detail.';}
 function validateChapter(chapter={}){const text=String(chapter.content||chapter.text||chapter.prose||'');const issues=[];if(escalation.test(stripQuotedText(text))&&!text.includes(FADE))issues.push({code:'SEXUAL_DETAIL_REQUIRES_FADE',severity:'error'});return {ok:issues.length===0,issues};}
 function ensureFade(text=''){const s=String(text||'').trim();return s.includes(FADE)?s:`${s}${s?'\n\n':''}${FADE}`;}
 global.WriterToolsContentBoundary=Object.freeze({FADE,isFade,stripQuotedText,promptBlock,validateChapter,validatePrivateChapter:validateChapter,ensureFade,isPrivate:isFade});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-content-boundary.js ===== */

if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
