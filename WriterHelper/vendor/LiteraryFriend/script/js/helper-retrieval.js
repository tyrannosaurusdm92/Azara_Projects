/* Writer Helper Ready consolidated module: helper-retrieval.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-material-hub.js | sha256:a552b450aa87eb77536fc0c93b94eb7c3333ec733549874fb32472c2d16fb2d3 ===== */
/* Writer Tools — relevance-aware context/material hub for generation. */
(function(global){'use strict';const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 async function load(request={}){const c=request.context||{},series=c.series||request.series||{},parent=c.parent||request.parent||null,choice=c.selected_choice||c.choice||request.choice||null,memory=c.continuity?.memory||c.memory||{};let source=null,character=null,setting=null,beats=null,audience=null,writerReference=null,runtime=null,writingContext=null,characterPrompt='',branches=[],lore=[];try{source=global.WriterToolsSourceContext?.build?.(series,parent)||null}catch(_e){}try{character=await global.WriterToolsCharacterLibrary?.ensureForContext?.({characterIds:series.character_profile_ids||[],characters:series.character_bible||[],query:[series.pairing,parent?.content,choice?.description].filter(Boolean).join(' ')})||null}catch(_e){}try{setting=global.WriterToolsSetting?.generate?.({source:series.source_context||series.fandom||'',location:parent?.location||'',tone:series.tone||'',timeline:series.timeline||series.canon_window||'',seed:`${series.key||'story'}:${parent?.id||'opening'}`})||null}catch(_e){}try{beats=global.WriterToolsSceneBeats?.select?.({series,chapter:parent,choice})||[]}catch(_e){}try{audience=global.WriterToolsAudience?.get?.()||null}catch(_e){}try{writerReference=global.StoryTools?.WriterReference?.buildBridgeInfluencePacket?.({query:[series.title,series.premise,parent?.title,choice?.description].filter(Boolean).join(' '),sceneGoal:c.requested?.direction||''})||null}catch(_e){}try{runtime=global.WriterToolsRuntime?.context?.({series,parent,choice,memory,extra:{direction:c.requested?.direction||''}})||null}catch(_e){}try{writingContext=global.WriterToolsWriting?.buildStoryContext?.(series,parent,choice,memory,{direction:c.requested?.direction||'',contentMode:c.content?.effective_mode})||null}catch(_e){}try{characterPrompt=global.WriterToolsCharacterPrompt?.build?.({series,parent,choice,character},{request:c.requested?.direction||'continue',series})||''}catch(_e){}try{branches=global.WriterToolsBranches?.makeChoices?.({seriesKey:series.key||'story',chapterNumber:Number(parent?.chapter_number||0)+1,count:Number(series.choice_count||4),seed:`${series.key||'story'}:${parent?.id||'opening'}`,includeFadeToBlack:global.WriterToolsRomanceBoundary?.normalizeMode?.(series.content_mode)==='fade_to_black'})||[]}catch(_e){}try{lore=global.WriterToolsLore?.list?.(series.key||series.series_slug||'story')||[]}catch(_e){}return {schema:'writer.material-hub.v1',source_context:source,character_context:character,setting,scene_beats:beats,audience,romance_boundary:global.WriterToolsRomanceBoundary?.contractForSeries?.(series)||null,writer_reference:writerReference,runtime,writing_context:writingContext,character_prompt:characterPrompt,branch_suggestions:branches,lore,creation_sources:global.WriterToolsCreationSources?.contextPacket?.(series)||null};}
 function promptFor(packet={}){return ['WRITER MATERIALS',packet.source_context?`SOURCE/TIMELINE: ${JSON.stringify(packet.source_context)}`:'',packet.setting?`SETTING: ${JSON.stringify(packet.setting)}`:'',packet.character_context?`CHARACTERS:\n${global.WriterToolsCharacterLibrary?.promptForPacket?.(packet.character_context)||JSON.stringify(packet.character_context)}`:'',packet.scene_beats?.length?`SCENE BEATS:\n${packet.scene_beats.map(x=>'- '+x.prompt).join('\n')}`:'',global.WriterToolsRomanceBoundary?.promptBlock?.({},{}),packet.character_prompt||'',packet.lore?.length?`PROJECT LORE: ${JSON.stringify(packet.lore.slice(0,20))}`:''].filter(Boolean).join('\n\n');}
 function compactMaterials(p={}){return clone({source_context:p.source_context,setting:p.setting,scene_beats:p.scene_beats,audience:p.audience,romance_boundary:p.romance_boundary,writer_reference:p.writer_reference,branch_suggestions:p.branch_suggestions,lore:p.lore,creation_sources:p.creation_sources});}
 function snapshot(p={}){return compactMaterials(p);}
 global.WriterToolsMaterialHub=Object.freeze({load,promptFor,compactMaterials,snapshot});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== Craft-aware material hub ===== */
(function(global){'use strict';
const base=global.WriterToolsMaterialHub;if(!base)return;
async function craftPacket(input={}){const text=String(input.text||input.prose||''),audience=global.WriterToolsAudience?.resolve?.(input.audience||input.series?.audience||'general_adult'),analysis=text?global.WriterToolsOutputValidator?.analyze?.(text):null,atlas=await global.WriterToolsSceneBeats?.sampleAtlas?.({form:input.workType||input.series?.workType,audience:audience?.id,purpose:input.scenePurpose,seed:input.seed},input.craftCards||4).catch(()=>[]);return {audience,analysis,sceneCraft:atlas,dialogue:text?global.WriterToolsCharacterDialogue?.analyzeDialogue?.(text):null,poetry:/poetry|haiku|song/i.test(input.workType||'')?global.WriterToolsWriting?.analyzePoetry?.(text,input.form||'free_verse'):null};}
global.WriterToolsMaterialHub=Object.freeze({...base,craftPacket});
})(typeof globalThis!=='undefined'?globalThis:window);


/* ===== Language-aware material hub ===== */
(function(global){'use strict';const base=global.WriterToolsMaterialHub;if(!base)return;
async function languagePacket(input={}){const spec=input.language||input.conlang||input.languageSpec||null;if(!spec)return null;const result=spec?.schema==='writer.language-evolution.v1'?spec:global.WriterToolsLanguageEvolution?.simulate?.(spec);if(!result)return null;const [changeCards,phonCards,scriptCards]=await Promise.all([global.WriterToolsLanguageEvolution?.sampleAtlas?.({name:result.name,years:result.years},input.languageCards||4).catch(()=>[]),global.WriterToolsPhonology?.sampleAtlas?.({inventory:result.modern?.phonemes},input.phonologyCards||3).catch(()=>[]),global.WriterToolsScriptEvolution?.sampleAtlas?.({type:result.scriptEvolution?.modern?.scriptType},input.scriptCards||3).catch(()=>[])]);return {result,ruleGuide:global.WriterToolsLanguageEvolution?.buildRuleGuide?.(result),changeCards,phonCards,scriptCards,prompt:global.WriterToolsRuntime?.languagePrompt?.(result)||''};}
global.WriterToolsMaterialHub=Object.freeze({...base,languagePacket});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== RESEARCH EXPANSION PASS II — research-aware craft/language packet ===== */
(function(global){'use strict';
const base=global.WriterToolsMaterialHub;if(!base)return;
async function expansionPacket(input={}){const form=input.form||input.workType||input.series?.workType||input.series?.genre||'fiction',audience=input.audience||input.series?.audience||'general_adult',purpose=input.purpose||input.sceneFunction||input.direction||'',setting=input.setting||input.location||input.series?.setting||'',craft=await global.WriterToolsSceneBeats?.researchPacket?.({form,audience,purpose,setting,trope:input.trope,seed:input.seed||input.series?.key},input.researchCards||12).catch(()=>null);let language=null;if(input.language||input.conlang||input.languageSpec){const spec=input.language||input.conlang||input.languageSpec,result=spec?.schema?.startsWith?.('writer.language-evolution')?spec:global.WriterToolsLanguageEvolution?.simulate?.(spec);language=result?{result,guide:global.WriterToolsLanguageEvolution?.buildRuleGuide?.(result),research:await global.WriterToolsLanguageEvolution?.sampleResearch?.({domain:input.languageResearchDomain||'contact'},6).catch(()=>[])}:null;}return {schema:'writer.material-expansion.v2',craft,language,audience:global.WriterToolsAudience?.lens?.({audience,context:input.medium||input.context})||null};}
global.WriterToolsMaterialHub=Object.freeze({...base,expansionPacket});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== William Saville voice material integration ===== */
(function(global){'use strict';
const base=global.WriterToolsMaterialHub;if(!base)return;
async function load(request={}){const p=await base.load?.(request)||{},c=request.context||{},series=c.series||request.series||{};return{...p,william_voice:global.WriterWilliamVoice?.buildPacket?.({workType:series.story_type||request.workType||'story',prompt:[series.title,series.premise,c.requested?.direction].filter(Boolean).join(' '),includeEvidence:true,exampleCount:2})||null};}
function promptFor(packet={}){const core=base.promptFor?.(packet)||'',voice=global.WriterWilliamVoice?.promptBlock?.({voicePacket:packet.william_voice||global.WriterWilliamVoice?.buildPacket?.({kind:'story',includeEvidence:false}),includeEvidence:Boolean(packet.william_voice?.evidence?.length)})||'';return[voice,core].filter(Boolean).join('\n\n');}
async function craftPacket(input={}){const core=await base.craftPacket?.(input)||{},kind=global.WriterWilliamVoice?.taskKind?.(input)||'story',audit=input.text?global.WriterWilliamVoice?.audit?.(input.text,{kind}):null;return{...core,williamVoice:global.WriterWilliamVoice?.buildPacket?.({...input,kind,includeEvidence:true,exampleCount:2})||null,williamAudit:audit};}
async function expansionPacket(input={}){const core=await base.expansionPacket?.(input)||{},kind=global.WriterWilliamVoice?.taskKind?.(input)||'story';return{...core,williamVoice:global.WriterWilliamVoice?.buildPacket?.({...input,kind,includeEvidence:false})||null};}
global.WriterToolsMaterialHub=Object.freeze({...base,load,promptFor,craftPacket,expansionPacket});
})(typeof globalThis!=='undefined'?globalThis:window);

/* ===== END SOURCE: writer-material-hub.js ===== */


/* ===== WRITER_HELPER_READY — research registry for bounded offline retrieval ===== */
(function(global){'use strict';
const SOURCES=Object.freeze([
 {id:'unicode-egyptian',domain:'script',title:'Unicode Standard Chapter 11 / Egyptian Hieroglyphs',url:'https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-11/',use:'mixed hieroglyphic system, uniliteral/biliteral/triliteral signs, logograms/classifiers, hieratic cursive, long script history'},
 {id:'unikemet',domain:'script',title:'Unicode Standard Annex #57 Unikemet',url:'https://unicode.org/reports/tr57/',use:'hieroglyph catalog/function/description and modern encoding considerations'},
 {id:'unicode-writing-systems',domain:'script',title:'Unicode Writing Systems and Punctuation',url:'https://www.unicode.org/versions/latest/ch06.pdf',use:'alphabet/abjad/abugida/syllabary/logosyllabary typology'},
 {id:'met-alphabet',domain:'script',title:'Metropolitan Museum — alphabet origins',url:'https://www.metmuseum.org/exhibitions/listings/2014/assyria-to-iberia/blog/posts/alphabet',use:'Proto-Sinaitic acrophony and historically specific Phoenician→Greek→Etruscan/Latin path'},
 {id:'phoible',domain:'phonology',title:'PHOIBLE 2.0',url:'https://phoible.org/',use:'cross-linguistic inventories and distinctive-feature reasoning'},
 {id:'wals',domain:'typology',title:'WALS Online',url:'https://wals.info/',use:'cross-linguistic grammatical/phonological typology; descriptive guidance, not frequency-as-destiny'},
 {id:'unesco-vitality',domain:'sociolinguistics',title:'UNESCO Language Vitality and Endangerment',url:'https://ich.unesco.org/doc/src/00120-EN.pdf',use:'nine-factor vitality/endangerment framing; no single-factor verdict'},
 {id:'lexurgy',domain:'sound-change',title:'Lexurgy',url:'https://github.com/def-gthill/lexurgy',use:'ordered formal sound-change workflow reference; GPL code not bundled'},
 {id:'yasgheld',domain:'sound-change',title:'Yasgheld / SoundChange',url:'https://github.com/alray2569/SoundChange',use:'contextual sound-change notation and classes; MIT research reference'},
 {id:'conlang-suite',domain:'conlang',title:"The Conlanger's Suite",url:'https://github.com/Neonnaut/the-conlangers-suite',use:'browser conlang workflow, sound features and change operations; MIT research reference'},
 {id:'opentypejs',domain:'font',title:'opentype.js',url:'https://github.com/opentypejs/opentype.js',use:'browser-side outline/font creation feature reference; independent writer-helper TTF code'},
 {id:'fonteditor-core',domain:'font',title:'fonteditor-core',url:'https://github.com/kekee000/fonteditor-core',use:'browser TTF/WOFF/SVG transform architecture and optional WOFF2/WASM reference; no dependency bundled'},
 {id:'write-good',domain:'craft',title:'write-good',url:'https://github.com/btford/write-good',use:'configurable prose-lint categories: passive/wordiness/weasel/cliche/etc.'},
 {id:'retext',domain:'craft',title:'retext',url:'https://github.com/retextjs/retext',use:'natural-language syntax-tree/plugin architecture for inspect/transform passes'},
 {id:'retext-readability',domain:'craft',title:'retext-readability',url:'https://github.com/retextjs/retext-readability',use:'multi-formula readability design'},
 {id:'wink-nlp',domain:'craft',title:'wink-nlp',url:'https://github.com/winkjs/wink-nlp',use:'browser NLP pipeline patterns for sentences/tokens/POS/entities/negation/sentiment'},
 {id:'ritajs',domain:'poetry',title:'RiTa',url:'https://github.com/dhowe/ritajs',use:'computational-writing reference for syllables/stress/rhyme/POS/letter-to-sound; GPL source not bundled'},
 {id:'inkjs',domain:'story',title:'inkjs',url:'https://github.com/y-lohse/inkjs',use:'static-browser branching narrative runtime/state/choice patterns'}
]);
function search(q='',limit=12){const terms=String(q||'').toLowerCase().split(/\W+/).filter(Boolean);return SOURCES.map(s=>({s,score:terms.reduce((n,t)=>n+(JSON.stringify(s).toLowerCase().includes(t)?1:0),0)})).filter(x=>!terms.length||x.score).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.s);}
const base=global.WriterToolsMaterialHub;global.HelperResearchRegistry=Object.freeze({SOURCES,search});if(base)global.WriterToolsMaterialHub=Object.freeze({...base,researchSources:SOURCES,researchSearch:search});
})(typeof globalThis!=='undefined'?globalThis:window);


if (typeof globalThis !== 'undefined') { globalThis.WRITER_HELPER_READY_BUILD = globalThis.WRITER_HELPER_READY_BUILD || '2026-09-22-ready'; }
