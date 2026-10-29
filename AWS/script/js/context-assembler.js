/* Writer Helper Ready consolidated module: context-assembler.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-source-context.js | sha256:69bc15468df8913d1a415fc2eccfab971a492444cdf408a8a6fd0c030e1c7498 ===== */
/* Writer Tools — source/canon context normalizer for original and transformative fiction. */
(function(global){'use strict';
 function build(series={},chapter=null){const timeline=global.WriterToolsTimeline?.context?.(series)||{};return {schema:'writer.source-context.v1',source_type:series.source_type||((series.fandom&&series.fandom!=='Original')?'transformative':'original'),source_name:series.source_context||series.fandom||'Original',series_title:series.title||series.series_title||'',series_path:series.series_path||'',timeline:series.timeline||series.canon_window||chapter?.canon_window||'',relationship_focus:series.pairing||chapter?.pairing||'',story_bible:series.story_bible||[],character_bible:series.character_bible||[],must_include:series.must_include||[],avoid:series.avoid||[],...timeline};}
 global.WriterToolsSourceContext=Object.freeze({build});
})(typeof globalThis!=='undefined'?globalThis:window);


/* ===== Constructed-language source context helper ===== */
(function(global){'use strict';const base=global.WriterToolsSourceContext;if(!base)return;
function languageContext(series={}){const lang=series.language||series.conlang||series.language_spec||null;if(!lang)return null;const result=lang?.schema==='writer.language-evolution.v1'?lang:global.WriterToolsLanguageEvolution?.simulate?.(lang);return result?global.WriterToolsLanguageEvolution?.buildRuleGuide?.(result)||result:null;}
global.WriterToolsSourceContext=Object.freeze({...base,languageContext});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== William voice source-context integration ===== */
(function(global){'use strict';const base=global.WriterToolsSourceContext;if(!base)return;const oldBuild=base.build,oldLanguage=base.languageContext;
function build(series={},chapter=null){const ctx=oldBuild?.(series,chapter)||{};const prompt=[ctx.series_title,ctx.source_name,ctx.relationship_focus,series.premise,series.tone,chapter?.title].filter(Boolean).join(' ');return{...ctx,william_voice:global.WriterWilliamVoice?.buildPacket?.({kind:'story',prompt,includeEvidence:false})||null,authorial_rule:'Use source/canon facts as constraints; render narration through William Saville’s voice and craft governor without altering canon or making every character speak like the narrator.'};}
function languageContext(series={}){const ctx=oldLanguage?.(series);if(!ctx)return ctx;return{...ctx,william_voice:global.WriterWilliamVoice?.buildPacket?.({kind:'language_history',prompt:series.title||series.language?.name||'constructed language',includeEvidence:false})||null,descriptive_rule:'Explain grammar and history in William Saville’s clear, human voice while distinguishing supplied facts from modeled inference.'};}
global.WriterToolsSourceContext=Object.freeze({...base,build,languageContext});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-source-context.js ===== */

/* ===== BEGIN SOURCE: writer-character-context.js | sha256:831d817360bc7317501b64decfeb7dbecb04b4d859ced6d02e711a9944ecef33 ===== */
/* Writer Tools — character/relationship context assembler with project style-reference influence. */
(function(global){'use strict';const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function build({series={},chapter=null,choice=null,memory={},characters=[]}={}){
  const query=[series.fandom,series.title,series.pairing,chapter?.title,choice?.label,choice?.description,choice?.generation_hint].filter(Boolean).join(' ');
  const writer_reference=global.StoryTools?.WriterReference?.buildBridgeInfluencePacket?.({query,sceneGoal:choice?.description||choice?.generation_hint||'',character:String(series.pairing||''),theme:series.theme||'',dynamic:series.relationship_dynamic||'',referenceLimit:5,passageLimit:4,guideLimit:4,guideChars:700})||null;
  return {
    schema:'writer-tools.character-context.v3',
    audience:global.WriterToolsAudience?.get?.()||null,
    fandom:series.fandom||'',series:series.title||'',pairing:series.pairing||'',canon_window:series.canon_window||'',story_bible:series.story_bible||'',
    characters:clone(characters.length?characters:series.character_bible||[]),
    character_profile_ids:clone(series.character_profile_ids||[]),
    creation_sources:clone(series.creation_sources||null),
    relationship_state:clone(memory?.values||{}),flags:clone(memory?.flags||{}),
    chapter:chapter?{id:chapter.id,title:chapter.title,number:chapter.chapter_number,ending:String(chapter.content||'').slice(-2400),writer_context:clone(chapter.chapter_writer_context||null)}:null,
    choice:clone(choice),
    writer_reference,
    william_voice:global.WriterWilliamVoice?.buildPacket?.({kind:'dialogue',prompt:query,characters:characters.length?characters:series.character_bible||[]})||null,
    dialogue_contract:{authorial_frame:'William Saville voice governs narration, emotional framing, pacing, and scene selection.',character_speech:'Each character must retain their own vocabulary, syntax, rhythm, knowledge, evasions, humor, and social habits. Do not turn every speaker into William.',correction:'Prefer believable partial speech, interruptions, subtext, repair, and concrete responses over exposition disguised as conversation.'},
    continuity_carry:['canon voice','current dialogue thread','relationship changes','open plot threads','callbacks/favorite details','boundaries/promises','objects/locations','viewpoint emotional state','project-specific cadence']
  };
}
global.WriterToolsCharacterContext=Object.freeze({build});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-character-context.js ===== */

if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
