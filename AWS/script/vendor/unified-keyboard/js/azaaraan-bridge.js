/* One-bubble Aza'raan adapter: source phonemes, accents, Khmer slots and TTS.
 * The original source evolution/phonetics/voice engines remain in js/aza-*.js.
 * No second keyboard or external backend is created.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = window.AZA_CONFIG, P = window.AzaaraanPhonetics;
  const rows = [['A','B','D','E','F','G','H','I'], ['J','K','L','M','N','O','P','R'], ['S','T','U','V','W','Y','Z'], ['SYMBOLS','AZA_GLOTTAL','AZA_CLICK','AZA_PREV','AZA_NEXT','SPACE','BACK','ENTER']];
  const letters = new Set(C.keyOrder.split(''));
  const allMarks = [...C.accents, ...C.specials];
  const markMap = new Map(allMarks.map(m=>[m.id,m]));
  const preferenceKey = 'steampunk-azaaraan-keyboard-preferences-v1';
  function loadChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
      return { language:saved.language==='azaaraan'?'azaaraan':'qwerty', era:C.eras.includes(saved.era)?saved.era:'Modern' };
    } catch {return {language:'qwerty',era:'Modern'};}
  }
  function saveChoice(language,era){
    try{localStorage.setItem(preferenceKey,JSON.stringify({language,era}));}catch{/* ephemeral setting */}
  }
  function isLetter(raw){return letters.has(raw);}
  function rowsForEra(era){return rows.map(row=>row.filter(raw=>era!=='Archaic'||!['AZA_PREV','AZA_NEXT'].includes(raw)));}
  function tryEncode(base,marks=[],era='Modern') {
    try {
      if (!isLetter(base)) throw new Error('Unrecognized Aza’raan letter: '+base);
      const allowed = new Set(availableMarks(era).map(m=>m.id));
      if (marks.some(id=>!allowed.has(id))) throw new Error('This special mark is unavailable in '+era+'.');
      if (marks.length>3) throw new Error('Maximum three marks per letter.');
      // The source sound engine owns both the glyph codepoint and permitted combinations.
      const compiled=P.compile([base,...marks],era.toLowerCase());
      return {value:compiled.glyph,ipa:compiled.ipa};
    }catch(e){return {value:null,error:e.message||String(e)};}
  }
  function encode(base,marks=[],era='Modern'){
    const r=tryEncode(base,marks,era);
    return r.value || C.letterMap[base] || '';
  }
  function glyph(base,era){return encode(base,[],era);}
  function soundOptions(base,era){
    const soundData=window.AZA_SOUND_DATA;
    return (soundData?.sounds||[]).filter(x=>x.letter===base && x.marks?.length<=3 && tryEncode(x.base,x.marks,era).value);
  }
  function availableMarks(era){
    return era==='Archaic' ? C.accents : allMarks;
  }
  function markName(id){return markMap.get(id)?.name || markMap.get(id)?.label || id;}
  function handle(raw,era,notes){
    if(isLetter(raw)){
      const encoded=tryEncode(raw,[],era);
      if(encoded.error)notes.toast(encoded.error);else notes.insert(encoded.value);
      return true;
    }
    if(raw==='AZA_GLOTTAL' || raw==='AZA_CLICK' || raw==='AZA_PREV' || raw==='AZA_NEXT'){
      const name={AZA_GLOTTAL:'ʔ',AZA_CLICK:'¡',AZA_PREV:'‹',AZA_NEXT:'›'}[raw];
      if(era==='Archaic' && (raw==='AZA_GLOTTAL'||raw==='AZA_CLICK')){
        notes.insert(C.archaicStandalone[name].khmer);
      } else {
        const ids={AZA_GLOTTAL:'S01',AZA_CLICK:'S02',AZA_PREV:'S03',AZA_NEXT:'S04'};
        notes.insert(markMap.get(ids[raw]).khmer);
      }
      return true;
    }
    return false;
  }
  function textToRead(){
    const note=$('note'),value=note.value;
    if(!value.trim())return '';
    const from=note.selectionStart,to=note.selectionEnd;
    if(to>from)return value.slice(from,to);
    // At a collapsed caret, prefer the current space-separated text run. This
    // preserves Khmer clusters (including combining accents) and Romanization.
    let start=from,end=from;
    while(start>0 && !/\s/u.test(value[start-1]))start--;
    while(end<value.length && !/\s/u.test(value[end]))end++;
    return value.slice(start,end).trim()||value.trim();
  }
  function updateSelectionPreview(){
    const input=textToRead();$('speechText').value=input;
    const engine=window.AzaaraanTTS;
    if(!engine)return;
    const preview=engine.previewText(input);
    $('speechIpa').textContent=preview.ipa;
    $('speechPreview').textContent=preview.speech||'Percussive click/glottal cue or empty text';
    $('speechWarning').textContent=preview.warnings.join(' · ');
  }
  async function speakSelection(){
    const text=textToRead();
    if(!text){window.Notes.toast('Write or select Aza’raan text to read aloud.');return;}
    if(!window.AzaaraanTTS){window.Notes.toast('The speech engine is unavailable.');return;}
    updateSelectionPreview();
    await window.AzaaraanTTS.readText(text);
  }
  function openSettings(){updateSelectionPreview();$('voiceSettings').showModal();}
  const pageNotes=$('pageNotes'),pageEvolution=$('pageEvolution'),desk=$('desk'),evo=$('panel-evolution');
  function showPage(which){
    const toEvolution=which==='evolution';
    if (toEvolution && !desk.hidden) $('note').focus({preventScroll:true});
    desk.hidden=toEvolution;evo.hidden=!toEvolution;
    updateEvolutionPreview();
    pageNotes.classList.toggle('active',!toEvolution);pageEvolution.classList.toggle('active',toEvolution);
    pageNotes.setAttribute('aria-selected',String(!toEvolution));pageEvolution.setAttribute('aria-selected',String(toEvolution));
    // Avoid moving or resetting the bubble when the page changes.
    if(toEvolution)pageEvolution.focus({preventScroll:true});
  }
  function updateEvolutionPreview(){
    const text=$('note').value.trim();
    const preview=$('evolutionDraftPreview');
    preview.textContent=text?text.slice(-420):'Your typed Aza’raan text will appear here while you explore the chart.';
  }
  $('note').addEventListener('keyboardinput',updateEvolutionPreview);
  $('note').addEventListener('input',updateEvolutionPreview);
  $('undo').addEventListener('click',()=>queueMicrotask(updateEvolutionPreview));
  $('redo').addEventListener('click',()=>queueMicrotask(updateEvolutionPreview));
  updateEvolutionPreview();
  pageNotes.addEventListener('click',()=>showPage('notes'));
  pageEvolution.addEventListener('click',()=>showPage('evolution'));
  $('speechText').value='';
  $('note').addEventListener('select',()=>{if(!$('voiceSettings').open)updateSelectionPreview();});
  $('note').addEventListener('keyup',()=>{if($('voiceSettings').open)updateSelectionPreview();});
  document.querySelector('[data-tool="sound"]').addEventListener('pointerdown',()=>{}, {passive:true});
  window.AzaaraanBridge={rows,rowsForEra,isLetter,handle,encode,tryEncode,glyph,soundOptions,availableMarks,markName,loadChoice,saveChoice,speakSelection,openSettings,textToRead,showPage};
})();
