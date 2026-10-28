/* Writer Helper Ready consolidated module: helper-router.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-intent.js | sha256:33f1fa746e7fc2e26d3f533723be2cb86b83e0c5ca37dccd27d780b448f7d6dc ===== */
/* Writer Tools — lightweight writing-intent fallback. */
(function(global){'use strict';
 function analyze(text){const raw=String(text||'').trim(),l=raw.toLowerCase(),tags=[];if(/outline|beat|structure/.test(l))tags.push('planning');if(/dialogue|conversation|banter/.test(l))tags.push('dialogue');if(/revise|edit|rewrite/.test(l))tags.push('revision');if(/poem|poetry|haiku|sonnet|verse/.test(l))tags.push('poetry');if(/lyric|song|chorus|bridge|hook/.test(l))tags.push('lyrics');if(/language|grammar|phonolog|orthograph|alphabet|script|etymolog|sound change|histor/.test(l))tags.push('language-history');if(/romance|kiss|relationship|date/.test(l))tags.push('romance');const fade=/fade(?:\s|-)?to(?:\s|-)?black|private moment|intimate scene|sexual|explicit|erotic|smut|nsfw/.test(l);if(fade)tags.push('fade-to-black');const provisional={raw,intent:fade?'fade-to-black':tags[0]||'story-continuation',tags,contentMode:fade?'fade_to_black':(/romance|kiss|relationship|date/.test(l)?'romance':'general'),boundary:fade?'end on-page scene before sexual detail':'project-defined'};const voiceKind=global.WriterWilliamVoice?.taskKind?.({prompt:raw,kind:tags.includes('poetry')?'poetry':tags.includes('lyrics')?'lyrics':tags.includes('language-history')?'language_history':tags.includes('dialogue')?'dialogue':'story'})||'story';return {...provisional,voiceKind,william_voice:global.WriterWilliamVoice?.buildPacket?.({kind:voiceKind,prompt:raw})||null};}
 global.WriterToolsIntent=Object.freeze({analyze});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-intent.js ===== */


/* ===== WRITER_HELPER_READY — richer creative/language intent routing ===== */
(function(global){'use strict';const base=global.WriterToolsIntent;function analyze(text=''){const src=String(text||''),low=src.toLowerCase();const old=base?.analyze?.(src)||{};let kind=old.kind||old.type||'story';if(/\b(ttf|truetype|font|glyph|hieroglyph|alphabet|orthograph|script evolution|conlang|constructed language|phonolog|sound change|language evolution|grammar evolution)\b/.test(low))kind='language';else if(/\b(lyric|song|chorus|verse|bridge|refrain|hook|prosody)\b/.test(low))kind='lyrics';else if(/\b(poem|poetry|haiku|sonnet|tanka|limerick|verse poem)\b/.test(low))kind='poetry';else if(/\b(nonfiction|memoir|essay|article|feature|biograph)\b/.test(low))kind='nonfiction';else if(/\b(dialogue|conversation|banter|argument|monologue)\b/.test(low))kind='dialogue';return{...old,kind,language:kind==='language',creative:['story','lyrics','poetry','nonfiction','dialogue'].includes(kind),needsWilliamVoice:['story','lyrics','poetry','nonfiction','dialogue','language'].includes(kind),needsFont:/\b(ttf|truetype|font|glyph|alphabet)\b/.test(low),needsEvolution:/\b(evol|1,?500|centur|histor|ancestor|proto-|sound change|borrow|dialect|slang)\b/.test(low)};}global.WriterToolsIntent=Object.freeze({...base,analyze});})(typeof globalThis!=='undefined'?globalThis:window);


if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
