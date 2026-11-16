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
  const modernIndependent = new Set(C.modernIndependentAlphabet.split(''));
  const allMarks = [...C.accents, ...C.specials, ...C.modernAccents, ...C.modernSpecials];
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
  function tryEncode(base,marks=[],era='Modern',subscripts=[]) {
    try {
      if(!isLetter(base))throw new Error('Unrecognized Aza’raan letter '+base);
      if(era!=='Modern'){
        if(marks.length>3)throw new Error('Historical mark limit exceeded.');
        const compiled=P.compile([base,...marks],era.toLowerCase());
        return {value:compiled.glyph,ipa:compiled.ipa};
      }
      if(!modernIndependent.has(base))throw new Error(base+' is not a Modern independent letter.');
      const mm=new Map(C.modernAccents.map(x=>[x.id,x]));
      const sm=new Map(C.modernSpecials.map(x=>[x.id,x]));
      const normal=marks.filter(id=>mm.has(id)),structure=marks.filter(id=>sm.has(id));
      if(marks.length!==normal.length+structure.length)throw new Error('Unknown Modern mark.');
      if(normal.length>2||new Set(normal).size!==normal.length)throw new Error('Only two distinct ordinary diacritics are permitted.');
      if(normal.includes('M06')&&normal.includes('M07'))throw new Error('Cannot combine Voiced and Unvoiced Sound.');
      if(!Array.isArray(subscripts)||subscripts.length>2)throw new Error('Only two dependent subscripts are permitted.');
      if(normal.includes('M08')){
        if(!'AEIOWY'.includes(base))throw new Error('Separated Vowel needs a vowel-bearing independent host.');
        if(!subscripts.some(x=>'AEIOWY'.includes(String(x.base||x.letter||'').toUpperCase())))throw new Error('Separated Vowel needs an additional vowel subscript.');
      }
      let value=C.modernLetterMap[base]+normal.map(id=>mm.get(id).khmer).join('');
      for(const sub of subscripts){
        const key=String(sub.base||sub.letter||'').toUpperCase(),submarks=Array.isArray(sub.marks)?sub.marks:[];
        if(!modernIndependent.has(key))throw new Error('Unknown dependent letter '+key);
        if(submarks.length>2||submarks.some(id=>!mm.has(id)||id==='M08')||new Set(submarks).size!==submarks.length)throw new Error('Invalid dependent-letter marks.');
        if(submarks.includes('M06')&&submarks.includes('M07'))throw new Error('Voiced and Unvoiced cannot combine on subscripts.');
        value+='្'+C.modernLetterMap[key]+submarks.map(id=>mm.get(id).khmer).join('');
      }
      value+=structure.map(id=>sm.get(id).khmer).join('');
      const preset=(window.AZA_SOUND_DATA?.sounds||[]).find(x=>x.modernHost===base&&x.modernMarks.join(',')===normal.join(','));
      return {value,ipa:preset?'/'+preset.ipa+'/':'(unverified family combination)'};
    }catch(e){return {value:null,error:e.message||String(e)};}
  }
  function encode(base,marks=[],era='Modern'){
    const r=tryEncode(base,marks,era);
    return r.value || (era==='Modern'?C.modernLetterMap[base]:C.letterMap[base]) || '';
  }
  function glyph(base,era){return encode(base,[],era);}
  function soundOptions(base,era){
    const entries=window.AZA_SOUND_DATA?.sounds||[];
    return era==='Modern'
      ? entries.filter(s=>s.modernHost===base&&s.modernMarks.length<=2).map(s=>({...s,base:s.modernHost,marks:s.modernMarks}))
      : entries.filter(s=>s.letter===base&&s.marks?.length<=3&&tryEncode(s.base,s.marks,era).value);
  }
  function availableMarks(era){
    return era==='Modern' ? [...C.modernAccents,...C.modernSpecials] : (era==='Archaic'?C.accents:[...C.accents,...C.specials]);
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
        const ids=era==='Modern'?{AZA_GLOTTAL:'MS01',AZA_CLICK:'MS02',AZA_PREV:'MS03',AZA_NEXT:'MS04'}:{AZA_GLOTTAL:'S01',AZA_CLICK:'S02',AZA_PREV:'S03',AZA_NEXT:'S04'};
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
