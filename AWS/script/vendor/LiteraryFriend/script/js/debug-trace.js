/* Writer Helper Ready consolidated module: debug-trace.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-integration-diagnostics.js | sha256:48a2d034d5714ffa53fe43666c1acbbfba05c593d67e8327b0a14b5b9610d662 ===== */
/* Writer Tools — integration diagnostics. */
(function(global){'use strict';
 function check(label,value,detail=''){return {label,ok:Boolean(value),detail:detail||''};}
 function run(){const rows=[];rows.push(check('branching engine',global.CYOAStoryEngine||global.WRITER_CYOA,'CYOAStoryEngine / WRITER_CYOA'));rows.push(check('writer generation',global.StoryTools?.WriterGeneration,'StoryTools.WriterGeneration'));rows.push(check('writer reference',global.StoryTools?.WriterReference,'StoryTools.WriterReference'));rows.push(check('memory',global.StoryTools?.WriterMemory||global.WriterToolsSessionMemory,'writer memory'));rows.push(check('continuity',global.StoryTools?.WriterContinuity||global.StoryTools?.Continuity,'writer continuity'));rows.push(check('plot-hole checker',global.StoryTools?.PlotHoleDefeater,'plot-hole checker'));rows.push(check('character library',global.WriterToolsCharacterLibrary,'character library'));rows.push(check('material hub',global.WriterToolsMaterialHub,'material hub'));rows.push(check('romance boundary',global.WriterToolsRomanceBoundary,'fade-to-black boundary'));rows.push(check('fade bridge',global.WriterFadeToBlackBridge,'fade-to-black bridge'));rows.push(check('output validator',global.WriterToolsOutputValidator,'output validator'));rows.push(check('William voice engine',global.WriterWilliamVoice,'shared authorial/craft contract'));rows.push(check('static fallback brain',global.WriterFallbackBrain,'offline/local fallback'));rows.push(check('backend provider',global.WRITER_TOOLS_BACKEND_PROVIDER||global.CYOA_STORY_PROVIDER,'Onyx AI-brain primary provider'));rows.push(check('general generation bridge',global.WRITER_TOOLS_GENERAL_PROVIDER||global.StoryTools?.WriterGeneration?.execute,'story/poetry/lyrics/language generic route'));return {ok:rows.every(r=>r.ok),rows,voiceContract:global.WriterWilliamVoice?.contractForBackend?.({kind:'diagnostic'})||null};}
 global.WriterToolsIntegrationDiagnostics=Object.freeze({run});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-integration-diagnostics.js ===== */


/* ===== WRITER_HELPER_READY — merged-module trace helpers ===== */
(function(global){'use strict';const base=global.WriterToolsIntegrationDiagnostics;function report(){return{integrity:global.WriterHelperIntegrity?.check?.()||null,helper:global.WriterHelperReady?.health?.()||null,backend:{endpoint:global.WriterToolsBackendBridge?.endpoint?.()||null,hasSession:Boolean(global.WriterToolsBackendBridge?.sessionToken?.({}))},voice:{version:global.WriterWilliamVoice?.VERSION||null,prioritySongs:global.HelperPersona?.prioritySongs||[]},researchSources:global.HelperResearchRegistry?.SOURCES?.length||0};}global.WriterToolsIntegrationDiagnostics=Object.freeze({...base,writerHelperReport:report});global.WriterHelperDebug=Object.freeze({report});})(typeof globalThis!=='undefined'?globalThis:window);


if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
