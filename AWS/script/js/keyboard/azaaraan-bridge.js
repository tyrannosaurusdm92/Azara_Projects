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
  const modernIndependent = new Set('ABDEGHIJKLMNOPRSTYZ'.split(''));
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
  function rowsForEra(era){return rows.map(row=>row.filter(raw=>(era!=='Archaic'||!['AZA_PREV','AZA_NEXT'].includes(raw))&&(era!=='Modern'||!letters.has(raw)||modernIndependent.has(raw))));}
  function tryEncode(base,marks=[],era='Modern') {
    try {
      if (!isLetter(base)) throw new Error('Unrecognized Aza’raan letter: '+base);
       if (era==='Modern'&&!modernIndependent.has(base)) throw new Error('Modern Aza’raan uses the 19-letter alphabet; choose a family accent instead of '+base+'.');
      const allowed = new Set(availableMarks(era).map(m=>m.id));
      if (marks.some(id=>!allowed.has(id))) throw new Error('This special mark is unavailable in '+era+'.');
      if (marks.length>3) throw new Error('Maximum three marks per letter.');
      // The source sound engine owns both the glyph codepoint and permitted combinations.
      const compiled=P.compile([base,...marks],era.toLowerCase());
      const replacement=(era==='Modern'&&marks.length===0)?window.AWSGlyphAssignments?.[base]:null;
      return {value:replacement?.character||compiled.glyph,ipa:replacement?.ipa||compiled.ipa};
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
    return window.Notes.getSelectedText()?.trim() || window.Notes.getText()?.trim() || '';
  }
  function updateSelectionPreview(){
    const input=textToRead();const field=$('speechText');if(field)field.value=input;
    const engine=window.AzaaraanTTS;if(!engine)return;
    const preview=engine.previewText(input);
    $('speechIpa').textContent=preview.ipa;$('speechPreview').textContent=preview.speech||'No pronunciation available';
    $('speechWarning').textContent=(preview.warnings||[]).join(' · ');
  }
  async function speakSelection(){const value=textToRead();if(!value)return window.Notes.toast('Choose text to pronounce.');updateSelectionPreview();return window.AzaaraanTTS?.readText(value);}
  function openSettings(){updateSelectionPreview();$('voiceSettings').showModal();}
  function showPage(which){if(which==='evolution')window.LiteraryFriendApp?.goToRole('language-evolution');}
  window.AzaaraanBridge={rows,rowsForEra,isLetter,handle,encode,tryEncode,glyph,soundOptions,availableMarks,markName,loadChoice,saveChoice,speakSelection,openSettings,textToRead,showPage};
})();
