/* Writer Helper Ready consolidated module: helper-index.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-runtime.js | sha256:c32ff6050a990f702fd3eb2a398c06765e5cfc0f7cf268963cc20c8e65fcc3f8 ===== */
/* Writer Tools — merged specialist runtime for the Writer Tools workspace. */
(function(global){'use strict';
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const session=global.WriterToolsSessionMemory?new global.WriterToolsSessionMemory({key:'writer-tools-session-v3',maxTurns:120,persist:true}):null;
  const continuity=global.WriterToolsContinuityMemory?new global.WriterToolsContinuityMemory():null;
  const graphs=new Map();
  const relationships=new Map();
  function graph(key='story'){if(!graphs.has(key)&&global.WriterToolsStoryGraph)graphs.set(key,new global.WriterToolsStoryGraph());return graphs.get(key)||null;}
  function relationship(key='story',seed={}){if(!relationships.has(key)&&global.WriterToolsRelationshipEngine)relationships.set(key,new global.WriterToolsRelationshipEngine(seed));return relationships.get(key)||null;}
  function context({series={},parent=null,choice=null,memory={},extra={}}={}){
    const key=series.key||series.series_slug||'story';
    const fandom=global.WriterToolsSourceContext?.build?.(series,parent)||null;
    const character=global.WriterToolsCharacterContext?.build?.({series,chapter:parent,choice,memory,characters:series.character_bible||[]})||null;
    const setting=global.WriterToolsSetting?.generate?.({fandom:series.fandom||'',location:parent?.location||'',tone:series.tone||'',canonWindow:series.canon_window||parent?.canon_window||'',seed:`${key}:${parent?.id||'opening'}:${choice?.id||extra.direction||'continue'}`})||null;
    const lore=global.WriterToolsLore?.list?.(key)?.slice(-24)||[];
    const intent=global.WriterToolsIntent?.analyze?.(extra.sceneSeed||choice?.generation_hint||choice?.description||'')||null;
    const relEngine=relationship(key,memory?.values||{});if(relEngine&&memory?.values)for(const [name,value] of Object.entries(memory.values))relEngine.set(name,value);const rel=relEngine?.snapshot?.()||clone(memory?.values||{});
    const continuityStory=continuity?.story?.(key)||null;
    const refOptions={query:[extra.direction,choice?.generation_hint,choice?.description,parent?.title,series.title].filter(Boolean).join(' '),sceneGoal:extra.direction||choice?.description||'',character:String(series.pairing||''),theme:series.theme||'',dynamic:series.relationship_dynamic||'',guideLimit:5,guideChars:900,referenceLimit:6,passageLimit:5};
    const writerReference=global.StoryTools?.WriterReference?.buildBridgeInfluencePacket?.(refOptions)||null;
    const writerPrompt=global.StoryTools?.WriterReference?.buildWriterReferencePrompt?.(refOptions)||'';
    return {
      reader:global.WriterToolsAudience?.get?.()||null,fandom,character,setting,lore,intent,relationship:rel,
      creation_sources:global.WriterToolsCreationSources?.contextPacket?.(series)||clone(series.creation_sources||null),
      character_profile_ids:clone(series.character_profile_ids||[]),
      material_hub_available:Boolean(global.WriterToolsMaterialHub),
      people_places_available:Boolean(global.PeoplePlaces),
      session:session?.recent?.(24)||[],continuity:clone(continuityStory),
      writer_reference:writerReference,writer_reference_prompt:writerPrompt,
      story_carry:{seriesKey:key,parentId:parent?.id||null,parentTitle:parent?.title||'',selectedChoice:clone(choice||null),direction:extra.direction||'',openThreads:clone(continuityStory?.open_threads||continuityStory?.openThreads||[])}
    };
  }
  function recordChoice(series,chapter,choice,memory){if(!series||!choice)return;const key=series.key||series.series_slug||'story';continuity?.rememberChoice?.(key,choice);const rel=relationship(key,memory?.values||{});if(rel&&memory?.values)for(const [name,value] of Object.entries(memory.values))rel.set(name,value);session?.add?.({type:'choice',seriesKey:key,chapterId:chapter?.id||null,choiceId:choice.id||null,label:choice.label||'',pathKey:choice.path_key||null});graph(key)?.event?.({type:'choice',seriesKey:key,chapterId:chapter?.id||null,choiceId:choice.id||null,pathKey:choice.path_key||null});}
  function recordChapter(series,chapter,from={}){if(!series||!chapter)return;const key=series.key||series.series_slug||'story';continuity?.rememberChapter?.(key,chapter);session?.add?.({type:'chapter',seriesKey:key,chapterId:chapter.id||null,chapterNumber:chapter.chapter_number||null,title:chapter.title||'',generated:Boolean(chapter.generated)});graph(key)?.ingestChapter?.(chapter,{seriesKey:key,choiceFrom:from});}
  function recordVisit(series,chapter){if(!series||!chapter)return;const key=series.key||series.series_slug||'story';session?.add?.({type:'visit',seriesKey:key,chapterId:chapter.id||null,chapterNumber:chapter.chapter_number||null,title:chapter.title||''});graph(key)?.ingestChapter?.(chapter,{seriesKey:key});}
  function snapshot(key='story'){return {session:session?.recent?.(120)||[],continuity:continuity?.snapshot?.()||null,graph:graph(key)?.snapshot?.()||null,relationship:relationship(key)?.snapshot?.()||null};}
  global.WriterToolsRuntime=Object.freeze({session,continuity,graph,relationship,context,recordChoice,recordChapter,recordVisit,snapshot});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== Runtime craft context helper ===== */
(function(global){'use strict';
const base=global.WriterToolsRuntime;if(!base)return;
async function craftContext(input={}){return global.WriterToolsMaterialHub?.craftPacket?.(input)||null;}
global.WriterToolsRuntime=Object.freeze({...base,craftContext});
})(typeof globalThis!=='undefined'?globalThis:window);


/* ===== Language evolution / conlang runtime integration ===== */
(function(global){'use strict';const base=global.WriterToolsRuntime;if(!base)return;
function evolveLanguage(input={}){if(!global.WriterToolsLanguageEvolution)throw new Error('helper-world-model.js is not loaded');return global.WriterToolsLanguageEvolution.simulate(input);}
async function languageArtifacts(input={},opts={}){const result=input?.schema==='writer.language-evolution.v1'?input:evolveLanguage(input);if(!global.WriterToolsLanguageExport)throw new Error('helper-creative.js is not loaded');return global.WriterToolsLanguageExport.buildArtifacts(result,opts);}
function languagePrompt(result={}){const guide=global.WriterToolsLanguageEvolution?.buildRuleGuide?.(result)||result;return ['CONSTRUCTED LANGUAGE REFERENCE','Use the supplied phonology, grammar, lexicon, historical stage, dialect, and orthography consistently. Do not treat simulated change as inevitable.',JSON.stringify(guide)].join('\n\n');}
global.WriterToolsRuntime=Object.freeze({...base,evolveLanguage,languageArtifacts,languagePrompt});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== RESEARCH EXPANSION PASS II — advanced language/craft runtime routes ===== */
(function(global){'use strict';
const base=global.WriterToolsRuntime;if(!base)return;
function evolveLanguageAdvanced(input={}){if(!global.WriterToolsLanguageEvolution)throw new Error('helper-world-model.js is not loaded');return global.WriterToolsLanguageEvolution.simulateAdvanced?.(input)||global.WriterToolsLanguageEvolution.simulate(input);}
async function craftResearch(input={}){return global.WriterToolsMaterialHub?.expansionPacket?.(input)||null;}
async function generatedLanguageBundle(input={},opts={}){const result=input?.schema?.startsWith?.('writer.language-evolution')?input:evolveLanguageAdvanced(input);if(!global.WriterToolsLanguageExport)throw new Error('helper-creative.js is not loaded');const artifacts=await global.WriterToolsLanguageExport.buildArtifacts(result,opts);artifacts.result=result;artifacts.reference=global.WriterToolsLanguageExport.referenceObject?.(result)||null;return artifacts;}
async function languageArtifacts(input={},opts={}){return generatedLanguageBundle(input,opts);}
global.WriterToolsRuntime=Object.freeze({...base,evolveLanguage:evolveLanguageAdvanced,evolveLanguageAdvanced,languageArtifacts,craftResearch,generatedLanguageBundle});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== William Saville shared primary/fallback runtime ===== */
(function(global){'use strict';
const base=global.WriterToolsRuntime;if(!base)return;
function context(input={}){const c=base.context?.(input)||{},series=input.series||{},direction=input.extra?.direction||input.choice?.generation_hint||input.choice?.description||'';return {...c,william_voice:global.WriterWilliamVoice?.buildPacket?.({kind:'story',prompt:[series.title,series.premise,direction].filter(Boolean).join(' '),includeEvidence:true,exampleCount:2})||null,writer_voice_contract:'William Saville voice + research-driven craft correction'};}
function languagePrompt(result={}){const guide=global.WriterToolsLanguageEvolution?.buildRuleGuide?.(result)||result,voice=global.WriterWilliamVoice?.promptBlock?.({kind:'language_history',prompt:result.name||'constructed language history',includeEvidence:false})||'';return [voice,'CONSTRUCTED LANGUAGE REFERENCE','Use the supplied phonology, grammar, lexicon, historical stage, dialect, and orthography consistently. Separate input facts, modeled changes, and inference. Do not treat simulated change as inevitable.',JSON.stringify(guide)].join('\n\n');}
function fallbackWrite(request={},ctx={}){return global.WriterFallbackBrain?.generate?.(request,ctx)||null;}
global.WriterToolsRuntime=Object.freeze({...base,context,languagePrompt,fallbackWrite,voiceContract:(options={})=>global.WriterWilliamVoice?.contractForBackend?.(options)||null});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-runtime.js ===== */


/* ===== WRITER_HELPER_READY — single static API for Onyx primary + fallback ===== */
(function(global){'use strict';
async function generate(request={}){return global.WriterToolsBackendBridge?.generateWithFallback?.(request)||global.WriterFallbackBrain?.generate?.(request,request.context||{});}
function analyze(text,options={}){return global.HelperCreativeResearch?.craftPacket?.({...options,text})||global.HelperPersona?.audit?.(text,options)||null;}
function evolveLanguage(input={}){return global.HelperLanguageResearch?.simulateDeep?.(input)||global.WriterToolsConlangWorkbench?.create?.(input)||global.WriterToolsLanguageEvolution?.simulateAdvanced?.(input)||global.WriterToolsLanguageEvolution?.simulate?.(input);}
async function languageArtifacts(input={},options={}){const result=input?.modern?input:evolveLanguage(input);return global.WriterToolsLanguageExport?.buildArtifacts?.(result,options);}
async function createConlang(input={},options={}){const result=evolveLanguage(input),files=await languageArtifacts(result,options);return{result,files,explanation:global.HelperLanguageResearch?.explain?.(result,input)||null};}
async function createFont(result={},options={}){return global.WriterToolsFontTTF?.buildFromLanguage?.(result,options)||global.WriterToolsGlyphSynthesis?.buildTTF?.(result.scriptEvolution?.modern?.symbols||[],options);}
function health(){const req=['WriterWilliamVoice','HelperPersona','WriterToolsLanguageEvolution','HelperLanguageResearch','WriterToolsFontTTF','HelperCreativeResearch','WriterFallbackBrain','WriterToolsBackendBridge','WriterToolsRuntime'];const missing=req.filter(k=>!global[k]);return{ok:missing.length===0,version:'4.0.0-ready',staticRuntime:true,primary:'OurSpace onyx.chat → shared AI-Brain',fallback:'local JavaScript William-voice writer brain',missing};}
global.WriterHelperReady=Object.freeze({VERSION:'4.0.0-ready',generate,analyze,evolveLanguage,languageArtifacts,createConlang,createFont,health,voice:()=>global.HelperPersona,research:()=>global.HelperResearchRegistry?.SOURCES||[]});
})(typeof globalThis!=='undefined'?globalThis:window);


if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
