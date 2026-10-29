import {runLocalContinuitySnapshot,detectTemporalFactConflicts,detectKnowledgeLeaks,detectPossessionConflicts} from './engines/continuity-engine.js';
import {buildThreeClockView,detectOrderConflicts} from './literary-engines-timeline-engine.js';
import {buildThreadMatrix,findStalledThreads} from './engines/thread-matrix.js';
import {generateWord,generateLexicon,validateLexicon} from './literary-engines-language-generator.js';
import {similarity,groupVersions,lineDiff,buildMergePlan,applyDecisions} from './engines/consolidation-engine.js';
import {coverSpec,normalizePageSettings,chapterManifest} from './literary-engines-book-engine.js';
import {createArtState,addLayer,moveLayer,patchLayer,deleteLayer,serializeArtState} from './literary-engines-art-state.js';
import {reconstructCharacterView} from './literary-engines-character-view.js';
import {classifyImport,classifyBatch} from './literary-engines-import-classifier.js';
import {readImportFile,readImportFiles} from './literary-engines-file-reader.js';
import {retrieveLocal} from './ai/local-retrieval.js';
import {LiteraryFriendAI} from './ai/literaryfriend-ai.js';

const readJson=async path=>{const r=await fetch(path);if(!r.ok)throw new Error(`Could not load ${path}: ${r.status}`);return r.json();};
const functional={
 continuity:{runLocalContinuitySnapshot,detectTemporalFactConflicts,detectKnowledgeLeaks,detectPossessionConflicts},
 timeline:{buildThreeClockView,detectOrderConflicts}, threads:{buildThreadMatrix,findStalledThreads},
 language:{generateWord,generateLexicon,validateLexicon}, consolidation:{similarity,groupVersions,lineDiff,buildMergePlan,applyDecisions},
 book:{coverSpec,normalizePageSettings,chapterManifest}, art:{createArtState,addLayer,moveLayer,patchLayer,deleteLayer,serializeArtState},
 character:{reconstructCharacterView}, imports:{classifyImport,classifyBatch,readImportFile,readImportFiles}, ai:{retrieveLocal,LiteraryFriendAI},
 data:{featureRegistry:()=>readJson('json/feature-registry.json'),storyModel:()=>readJson('json/story-intelligence-model.json'),backendContracts:()=>readJson('json/backend-action-contracts.json')}
};
window.LiteraryFriendFunctional=functional;
if(window.LF){window.LF.functional=functional;try{const token=sessionStorage.getItem('literaryfriend.session.token');if(token&&!window.LF.api?.token){window.LF.api.token=token;window.LF.api.saveAuth?.();}}catch(_){}}
window.dispatchEvent(new CustomEvent('literaryfriend:functional-ready',{detail:{engines:Object.keys(functional)}}));
