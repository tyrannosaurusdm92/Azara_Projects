/* Writer Helper Ready consolidated module: context-composer.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-character-prompt.js | sha256:f560932000a3e6b0902c1751448dc1bf5bb4d28b83269aae3d4d4d07dc283292 ===== */
/* Writer Tools — character-aware prompt builder. */
(function(global){'use strict';
 function referenceOptions(context={},series={},request='continue'){return {query:[series.source_context||series.fandom,series.title,series.pairing,context?.parent?.title,context?.choice?.description,request].filter(Boolean).join(' '),sceneGoal:request,character:String(series.pairing||''),theme:series.theme||'',dynamic:series.relationship_dynamic||''};}
 function build(context={},options={}){const series=options.series||context.series||{},request=options.request||'continue the scene';const ref=global.StoryTools?.WriterReference?.buildWriterReferencePrompt?.(referenceOptions(context,series,request))||'';const packet=context.character||context.character_library||{};const mode=global.WriterToolsRomanceBoundary?.normalizeMode?.(context?.content?.effective_mode||series.content_mode)||'romance';return ['CHARACTER WRITER',`Request: ${request}`,`Mode: ${mode}`,'Keep each character distinct in goals, diction, knowledge, humor, habits, boundaries, and emotional reactions.','Do not flatten different characters into a single generic voice.',global.WriterToolsRomanceBoundary?.promptBlock?.(series,context)||'',ref,packet&&Object.keys(packet).length?`Character context: ${JSON.stringify(packet)}`:''].filter(Boolean).join('\n\n');}
 global.WriterToolsCharacterPrompt=Object.freeze({build,referenceOptions});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== William Saville voice integration ===== */
(function(global){'use strict';
const base=global.WriterToolsCharacterPrompt;if(!base)return;
function build(context={},options={}){const original=base.build?.(context,options)||'';const series=options.series||context.series||{},request=options.request||'continue the scene';const voice=global.WriterWilliamVoice?.promptBlock?.({kind:'dialogue',prompt:[series.title,series.pairing,request].filter(Boolean).join(' '),includeEvidence:false})||'';return [voice,'DIALOGUE OVERRIDE: William’s authorial voice governs scene framing, emotional pressure, and clarity. It does NOT make every speaker sound like William. Preserve each character’s own diction, knowledge, social habits, humor, avoidance patterns, and level of emotional articulation.',original].filter(Boolean).join('\n\n');}
global.WriterToolsCharacterPrompt=Object.freeze({...base,build});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-character-prompt.js ===== */

if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
