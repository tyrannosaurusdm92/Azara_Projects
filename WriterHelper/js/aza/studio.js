(()=>{'use strict';
const C=window.AZA_CONFIG;
const $=id=>document.getElementById(id);
const ACC=new Map(C.accents.map(a=>[a.id,a]));
const SPEC=new Map(C.specials.map(a=>[a.id,a]));
const MARKS=new Map([...ACC,...SPEC]);
const VOWELS=new Set(['C01','C02','C03','C04','C05','C06','C07']);
const isOrdinary=id=>ACC.has(id);
function markAllowed(marks,id){
 if(marks.includes(id))return {allowed:false,reason:'Mark already attached'};
 const others=marks.filter(x=>x!==id);
 if(id==='K05'&&others.some(isOrdinary))return {allowed:false,reason:'Base must be the only ordinary accent'};
 if(id!=='K05'&&isOrdinary(id)&&others.includes('K05'))return {allowed:false,reason:'Remove Base before adding other ordinary accents'};
 return {allowed:true};
}

const keyList=Array.from(C.keyOrder);
let era='Modern',tokens=[],cursor=0,selected=-1,paletteLetter='T',draft=-1,activeVariant='T';
const storage='azaaraan_studio_merged_20261027';
function save(){try{localStorage.setItem(storage,JSON.stringify({era,tokens,cursor}))}catch{}}
function setStatus(s){$('status').textContent=s}
function fontName(){return 'Az'+era}
function glyphURL(id){return 'assets/svg/marks/'+era.toLowerCase()+'/'+id+'.svg'}
function tokenUnicode(token){
 if(token.type==='glyph')return (C.letterMap[token.base]||'')+logicalKhmerOrder((token.marks||[]).map(id=>MARKS.get(id)).filter(Boolean));
 if(token.type==='sign')return C.archaicStandalone[token.sign]?.khmer||'';
 if(token.type==='space')return ' ';
 if(token.type==='break')return '\n';
 return token.value||'';
}
// Unicode Khmer syllables conventionally order coeng consonant subscripts before vowel signs,
// and other syllable marks afterwards; three different vowel-sign accents are Aza'raan-specific,
// NOT standard Khmer spelling (we keep their selected semantic order in tokens).
function logicalKhmerOrder(marks){
 const group=m=>m.khmer?.startsWith('្')?0 : ([...m.khmer].every(c=>{let n=c.codePointAt(0);return n>=0x17B6&&n<=0x17C5})?1:2);
 return marks.map((m,i)=>({m,i,g:group(m)})).sort((a,b)=>a.g-b.g||a.i-b.i).map(({m})=>m.khmer).join('');
}
function output(){return tokens.map(tokenUnicode).join('')}
function codepointString(s){return [...s].map(c=>'U+'+c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')).join(' ')}
function mk(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function makeGlyph(t,index=-1){
 const node=mk('span','glyph-atom'+(index===selected?' selected':''));
 node.setAttribute('data-base',t.base);node.title=t.base+' — '+(t.marks||[]).map(x=>MARKS.get(x)?.name||MARKS.get(x)?.label).join(', ');
 const core=mk('span','glyph-core',C.letterMap[t.base]||'');core.style.fontFamily=fontName();node.append(core);
 const counts={top:0,bottom:0,left:0,right:0};
 for(const id of t.marks||[]){const m=MARKS.get(id);if(!m)continue;const side=m.placement||'top';const i=counts[side]++;
  const im=mk('img','mark-overlay '+side);im.src=glyphURL(id);im.alt='';im.draggable=false;
  const tier={top:42-18*i,bottom:112+17*i,left:64+20*i,right:64+20*i}[side]??42;
  im.style.setProperty('--tier',tier+'px');im.title=m.name||m.label;node.append(im);
 }
 if((t.marks||[]).length){node.append(mk('span','mark-number',t.marks.length+'/3'))}
 return node;
}
function render(){
 const host=$('composition');host.className='composition era-'+era.toLowerCase();host.replaceChildren();
 if(!tokens.length){host.append(mk('div','placeholder','Type Aza’raan with the keys below…'))}
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i];let node;
  if(t.type==='glyph')node=makeGlyph(t,i);
  else if(t.type==='space')node=mk('span','wordspace'+(i===selected?' selected':''));
  else if(t.type==='break')node=mk('span','linebreak');
  else if(t.type==='sign'){
   node=mk('span','single-special'+(i===selected?' selected':''));let img=mk('img');img.src=C.archaicStandalone[t.sign].glyph;img.alt=t.sign+' (full Archaic glyph)';node.append(img);
  } else node=mk('span','literal-token'+(i===selected?' selected':''),t.value);
  node.dataset.index=String(i);node.addEventListener('click',e=>{e.stopPropagation();cursor=i+1;selected=i;render();setStatus(t.type==='glyph'?'Selected '+t.base+'; hold '+(t.base==='W'?'W':'its letter')+' to edit marks.':'Selected '+tokenUnicode(t));});
  host.append(node)
 }
 const s=output();$('unicode').value=s;$('hex').textContent=codepointString(s)||'—';
 $('counter').textContent=tokens.filter(x=>x.type==='glyph').length+' letters · '+C.maxMainAndSpecialStack+' marks maximum per letter';
 save();
 // Notify live voice and IPA displays whenever a letter, accent or space changes.
 window.dispatchEvent(new CustomEvent('azaaraan:change', {detail:{era,unicode:s,tokens:tokens.map(t=>({...t, marks:Array.isArray(t.marks)?[...t.marks]:undefined}))}}));
}
function insert(token){tokens.splice(cursor,0,token);selected=cursor;cursor++;render()}
function erase(){if(selected>=0&&selected<tokens.length){tokens.splice(selected,1);cursor=selected;selected=-1}
 else if(cursor>0){tokens.splice(cursor-1,1);cursor--;selected=-1}
 render();}
function switchEra(next){if(!C.eras.includes(next))return;era=next;$('era').value=next;$('era-badge').textContent=era+' · 24 accents · '+(era==='Archaic'?'2 standalone signs':'4 special marks');
 if(era!=='Archaic'){
  // Archaic whole-glyph signs may remain in already composed writing to preserve history.
 }
 buildKeyboard();buildSpecials();render();setStatus('Switched to '+era+' glyphs. Stored Khmer Unicode remains unchanged.');}
function keyboardKey(label){const btn=mk('button','key era-'+era.toLowerCase());btn.type='button';btn.dataset.letter=label;btn.setAttribute('aria-label',label+' — press and hold for accents');
 btn.append(mk('span','key-label',label));const font=mk('span','key-art',C.letterMap[label]);btn.append(font);
 btn.append(mk('span','key-hint',label==='B'?'B F V W':label==='W'?'accent only':'hold ✦'));
 let longTimer=null,wasHold=false,startX=0,startY=0;
 const clean=()=>{clearTimeout(longTimer);longTimer=null;btn.classList.remove('is-held')};
 btn.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;wasHold=false;startX=e.clientX;startY=e.clientY;btn.classList.add('is-held');longTimer=setTimeout(()=>{wasHold=true;openPalette(label)},400)});
 btn.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-startX)>18||Math.abs(e.clientY-startY)>18)clean()});
 btn.addEventListener('pointerup',e=>{if(e.button!==0){clean();return}const held=wasHold;clean();if(!held){if(label==='W')openPalette('W');else addPlain(label)}});
 btn.addEventListener('pointercancel',clean);btn.addEventListener('contextmenu',e=>{e.preventDefault();clean();openPalette(label)});
 btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPalette(label)}});
 return btn;
}
function buildKeyboard(){const host=$('keyboard');host.replaceChildren();keyList.forEach(label=>host.append(keyboardKey(label)));}
function addPlain(label){if(label==='W'){openPalette('W');return}
 const t=(label==='F'?{type:'glyph',base:'B',marks:['C11']}:label==='V'?{type:'glyph',base:'B',marks:['C09']}:{type:'glyph',base:label,marks:[]});
 insert(t);setStatus('Added '+label+'. Hold the key to add accents.');$('composition').focus({preventScroll:true});}
function buildSpecials(){const host=$('special-keys');host.replaceChildren();
 if(era==='Archaic'){
  for(const sign of ['¡','ʔ']){const b=mk('button','special-key',sign);b.type='button';b.title='Original full Archaic glyph, Khmer encoded';b.addEventListener('click',()=>{insert({type:'sign',sign});setStatus('Inserted original Archaic '+sign+' glyph.');});host.append(b)}
 }else{
  const btn=mk('button','special-key','ʔ · ¡ · ‹ · ›');btn.type='button';btn.title='Attach four special marks to the chosen letter';btn.addEventListener('click',()=>openPalette(tokens[selected]?.type==='glyph'?tokens[selected].base:'T'));host.append(btn);
 }
}
function closePalette(){ $('palette-backdrop').hidden=true;$('composition').focus({preventScroll:true});}
function ensureDraft(){
 if(draft>=0&&tokens[draft]?.type==='glyph')return;
 insert({type:'glyph',base:activeVariant,marks:[]});draft=cursor-1;
}
function renderDraft(){
 const t=draft>=0&&tokens[draft]?.type==='glyph'?tokens[draft]:{type:'glyph',base:activeVariant,marks:[]};
 const host=$('draft-glyph');host.className='draft-glyph era-'+era.toLowerCase();host.replaceChildren(makeGlyph(t));
 $('draft-label').textContent='Letter: '+((t.base==='B'&&t.marks?.includes('C11'))?'F (B + F)':(t.base==='B'&&t.marks?.includes('C09'))?'V (B + W)':(t.base||paletteLetter));$('draft-count').textContent=(t.marks?.length||0)+'/3 stacked marks';
 $('remove-mark').disabled=!t.marks?.length;
 for(const opt of $('family-options').querySelectorAll('.family-option'))opt.classList.toggle('active',opt.dataset.base===activeVariant);
 for(const preview of $('palette').querySelectorAll('.mini-core')){preview.textContent=C.letterMap[activeVariant];preview.style.fontFamily=fontName()}
 for(const visual of $('palette').querySelectorAll('.mini-composite'))visual.className='mini-composite era-'+era.toLowerCase();
 for(const opt of $('mark-choices').querySelectorAll('button')){opt.disabled=t.marks?.includes(opt.dataset.id)||((t.marks?.length||0)>=3&&!(VOWELS.has(opt.dataset.id)&&t.marks?.some(x=>VOWELS.has(x))))||(opt.dataset.id==='K05'&&t.marks.some(x=>isOrdinary(x)))||(isOrdinary(opt.dataset.id)&&opt.dataset.id!=='K05'&&t.marks.includes('K05'));opt.classList.toggle('selected-accent',t.marks?.includes(opt.dataset.id))}
 for(const opt of $('special-choices').querySelectorAll('button')){opt.disabled=t.marks?.includes(opt.dataset.id)||((t.marks?.length||0)>=3&&!(VOWELS.has(opt.dataset.id)&&t.marks?.some(x=>VOWELS.has(x))))||(opt.dataset.id==='K05'&&t.marks.some(x=>isOrdinary(x)))||(isOrdinary(opt.dataset.id)&&opt.dataset.id!=='K05'&&t.marks.includes('K05'));opt.classList.toggle('selected-accent',t.marks?.includes(opt.dataset.id))}
}
function setVariant(base){
 const familyAcc=base==='F'?'C11':base==='V'?'C09':null;
 const canonicalBase=familyAcc?'B':base;
 if(draft>=0&&tokens[draft]?.type==='glyph'){
  const t=tokens[draft];const remains=(t.marks||[]).filter(id=>id!=='C11'&&id!=='C09');
  t.base=canonicalBase;t.marks=(base==='W'?[]:familyAcc?[familyAcc,...remains.filter(x=>x!==familyAcc)]:base==='B'?remains:t.marks||[]).slice(0,3);
  selected=draft;render();
 } else {insert({type:'glyph',base:canonicalBase,marks:familyAcc?[familyAcc]:[]});draft=cursor-1;}
 activeVariant=base;renderDraft();
}
function applyMark(id){
 const mark=MARKS.get(id);if(!mark||era==='Archaic'&&SPEC.has(id))return;
 ensureDraft();const t=tokens[draft];
 if(t.marks.includes(id)){setStatus('That mark is already attached.');return}
 // Exactly one Short/Long vowel nucleus: replace the earlier vowel rather than stack it.
 if(VOWELS.has(id))t.marks=t.marks.filter(x=>!VOWELS.has(x));
 const allowed=markAllowed(t.marks,id);
 if(!allowed.allowed){setStatus(allowed.reason);renderDraft();return}
 if(t.marks.length>=3){setStatus('Maximum three marks per letter, including attached structural signs.');renderDraft();return}
 t.marks.push(id);selected=draft;cursor=draft+1;render();renderDraft();setStatus('Added '+(mark.name||mark.label)+' — '+t.marks.length+'/3 marks.');
}
function chooseOption(mark){const button=mk('button','mark-choice');button.type='button';button.dataset.id=mark.id;button.title=mark.name||mark.label;
 const visual=mk('span','mini-composite era-'+era.toLowerCase());const miniature=mk('span','mini-core',C.letterMap[activeVariant]);miniature.style.fontFamily=fontName();visual.append(miniature);const img=mk('img','mini-mark '+(mark.placement||'top'));img.src=glyphURL(mark.id);img.alt='';visual.append(img);button.append(visual);
 button.append(mk('span','variant-label',(mark.name||mark.label)));
 button.append(mk('span','mark-meta',(mark.display||'')+' · '+mark.khmer));button.addEventListener('click',()=>applyMark(mark.id));return button;
}
function openPalette(label){
 paletteLetter=label;activeVariant=label;
 const t=tokens[selected];draft=t?.type==='glyph'&&(label===t.base||(label==='B'&&C.familyVariants.B.includes(t.base)))?selected:-1;
 if(draft>=0)activeVariant=(t.base==='B'&&t.marks?.includes('C11'))?'F':(t.base==='B'&&t.marks?.includes('C09'))?'V':t.base;
 $('palette-title').textContent=label==='B'?'B family — B, F, V & plain W':label==='W'?'W — accented forms only':label+' — Aza’raan marks';
 $('palette-hint').textContent=label==='W'?'Choose any accent. Plain W is only available under B.':'Choose a letterform, then build a single glyph with up to three stacked marks.';
 const families=$('family-options');families.replaceChildren();
 if(label==='B'){
  for(const base of C.familyVariants.B){const b=mk('button','family-option');b.type='button';b.dataset.base=base;b.append(mk('strong',null,base));const line=mk('span',null,base==='W'?'Plain W':base+' letter');b.append(line);b.addEventListener('click',()=>setVariant(base));families.append(b)}
 }else if(label!=='W'){
  const b=mk('button','family-option',label+' (base)');b.type='button';b.dataset.base=label;b.addEventListener('click',()=>setVariant(label));families.append(b)
 }else families.append(mk('span','subnote','Plain W is unavailable here. Choose a mark to create accented W.'));
 const a=$('mark-choices');a.replaceChildren();for(const mark of C.accents)a.append(chooseOption(mark));
 const sp=$('special-choices');sp.replaceChildren();
 const allow=era!=='Archaic';$('special-heading').hidden=!allow;sp.hidden=!allow;
 if(allow)for(const mark of C.specials)sp.append(chooseOption(mark));
 $('palette-backdrop').hidden=false;renderDraft();
}
function buildReference(){const body=$('accent-reference');body.replaceChildren();for(const a of C.accents){const tr=mk('tr');tr.append(mk('td',null,String(a.number)));
 const shape=mk('td');const img=mk('img','accent-image');img.src='assets/svg/marks/modern/'+a.id+'.svg';img.alt=a.display;shape.append(img);tr.append(shape);
 for(const col of ['name','meaning','example'])tr.append(mk('td',null,a[col]));const kh=mk('td');kh.append(mk('code',null,a.khmer));tr.append(kh);body.append(tr)}
}
function parseUnicode(text){
 const mapped=new Map(Object.entries(C.letterMap).map(([k,v])=>[v,k]));
 // Alternative font carrier codepoints and standalone historical signs accepted for imports.
 const extras={'អ':'A','ង':'E','ញ':'I','ឋ':'O','ឌ':'U','វ':'B','ផ':'B'};
 for(const [u,k] of Object.entries(extras))if(!mapped.has(u))mapped.set(u,k);
 const markIds=[...MARKS].sort((a,b)=>b[1].khmer.length-a[1].khmer.length);
 const cp=[...text],result=[];
 for(let i=0;i<cp.length;){const ch=cp[i];
  if(ch===' '){result.push({type:'space'});i++;continue}if(ch==='\n'){result.push({type:'break'});i++;continue}
  if(mapped.has(ch)){
   const t={type:'glyph',base:mapped.get(ch),marks:[]};result.push(t);i++;
   while(i<cp.length){const found=markIds.find(([id,m])=>cp.slice(i,i+[...m.khmer].length).join('')===m.khmer);
    if(!found)break;
    if(t.marks.length<3&&!t.marks.includes(found[0]))t.marks.push(found[0]);else result.push({type:'literal',value:found[1].khmer});
    i+=[...found[1].khmer].length;
   }continue;
  }
  if(ch==='៉'){result.push({type:'sign',sign:'ʔ'});i++;continue}
  if(cp.slice(i,i+2).join('')==='្ឃ'){result.push({type:'sign',sign:'¡'});i+=2;continue}
  result.push({type:'literal',value:ch});i++;
 }return result;
}
async function copyOutput(){const s=output();if(!s){setStatus('Nothing to copy yet.');return}
 try{await navigator.clipboard.writeText(s);setStatus('Copied '+[...s].length+' Khmer Unicode characters.')}catch{
  const field=$('unicode');field.closest('details').open=true;field.focus();field.select();try{document.execCommand('copy');setStatus('Copied encoded text.')}catch{setStatus('Select the Unicode output and copy manually.')}}
}
async function pasteUnicode(){let s='';try{s=await navigator.clipboard.readText()}catch{s=prompt('Paste your Khmer-encoded Aza’raan text here:')||''}if(!s)return;const added=parseUnicode(s);tokens.splice(cursor,0,...added);cursor+=added.length;selected=cursor-1;render();setStatus('Imported '+added.length+' text tokens.');}
function init(){
 // Keep interactive historical graph in the exact same index HTML document.
 for(const name of ['typing','evolution'])$('tab-'+name).addEventListener('click',()=>{
  for(const other of ['typing','evolution']){const active=other===name;$('tab-'+other).classList.toggle('active',active);$('tab-'+other).setAttribute('aria-selected',String(active));$('panel-'+other).hidden=!active}
 });
 buildReference();buildKeyboard();buildSpecials();$('era').addEventListener('change',e=>switchEra(e.target.value));
 $('composition').addEventListener('click',e=>{if(e.target===$('composition')){selected=-1;cursor=tokens.length;render();$('composition').focus()}});
 $('copy').addEventListener('click',copyOutput);$('clear').addEventListener('click',()=>{tokens=[];cursor=0;selected=-1;render();setStatus('Writing desk cleared.')});
 $('backspace').addEventListener('click',erase);$('space').addEventListener('click',()=>insert({type:'space'}));$('enter').addEventListener('click',()=>insert({type:'break'}));
 $('accent-last').addEventListener('click',()=>{const target=tokens[selected]?.type==='glyph'?selected:tokens.map((x,i)=>x.type==='glyph'?i:-1).filter(x=>x>=0).at(-1);if(target===undefined||target===-1){setStatus('Insert a letter before editing its marks.');return}selected=target;openPalette(tokens[target].base)});
 $('paste').addEventListener('click',pasteUnicode);
 $('palette-close').addEventListener('click',closePalette);$('palette-done').addEventListener('click',()=>{
  if(paletteLetter==='W'&&draft>=0&&tokens[draft].base==='W'&&tokens[draft].marks.length===0){setStatus('W requires an accent; pick at least one.');return}
  closePalette()
 });$('palette-backdrop').addEventListener('pointerdown',e=>{if(e.target===$('palette-backdrop'))closePalette()});
 $('remove-mark').addEventListener('click',()=>{if(draft>=0&&tokens[draft]?.marks?.length){tokens[draft].marks.pop();render();renderDraft()}});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('palette-backdrop').hidden){closePalette();return}
  if(!$('palette-backdrop').hidden)return;
  const node=e.target;if(node instanceof Element&&node.closest('input,textarea,select,button,summary'))return;
  if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==='c'&&document.activeElement===$('composition')){e.preventDefault();copyOutput()}return}
  if(e.altKey)return;
  if(/^[a-z]$/i.test(e.key)){
   const k=e.key.toUpperCase();e.preventDefault();if(k==='F'||k==='V')addPlain(k);
   else if(keyList.includes(k)){if(k==='W')openPalette(k);else addPlain(k)}
   else setStatus(k+' is not in the Aza’raan alphabet.');
  }else if(e.key==='Backspace'){e.preventDefault();erase()}
  else if(e.key===' '){e.preventDefault();insert({type:'space'})}
  else if(e.key==='Enter'){e.preventDefault();insert({type:'break'})}
  else if(e.key==='ArrowLeft'){cursor=Math.max(0,cursor-1);selected=cursor-1;render()}
  else if(e.key==='ArrowRight'){cursor=Math.min(tokens.length,cursor+1);selected=cursor-1;render()}
  else if(era==='Archaic'&&(e.key==='¡'||e.key==='ʔ')){e.preventDefault();insert({type:'sign',sign:e.key})}
  else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&'.,!?;:-\'"()'.includes(e.key)){e.preventDefault();insert({type:'literal',value:e.key})}
 });
 $('composition').addEventListener('paste',e=>{const str=e.clipboardData?.getData('text/plain');if(!str)return;e.preventDefault();const x=parseUnicode(str);tokens.splice(cursor,0,...x);cursor+=x.length;selected=cursor-1;render()});
 try{const s=localStorage.getItem(storage);if(s){const t=JSON.parse(s);if(Array.isArray(t.tokens))tokens=t.tokens.filter(x=>x&&['glyph','sign','literal','space','break'].includes(x.type)).slice(0,3000);cursor=Math.min(tokens.length,Math.max(0,t.cursor||tokens.length));if(C.eras.includes(t.era))era=t.era;}}
 catch{}switchEra(era);render();
}
init();

// Public, narrowly scoped integration for the sound-to-script atelier.
window.AZA_STUDIO={
 get era(){return era.toLowerCase()},
 get text(){return output()},
 serialize(list){return list.map(tokenUnicode).join('')},
 append(list){if(!Array.isArray(list)||!list.length)return;tokens.splice(cursor,0,...list);cursor+=list.length;selected=cursor-1;render();setStatus('Inserted '+list.filter(x=>x.type==='glyph').length+' sound-based letters.');},
 replace(list){if(!Array.isArray(list))return;tokens=list.slice();cursor=tokens.length;selected=cursor-1;render();setStatus('Replaced manuscript with phonetic transcription.');},
 preview(list,host){host.replaceChildren();host.className='sound-live era-'+era.toLowerCase();for(const t of list){if(t.type==='glyph')host.append(makeGlyph(t));else if(t.type==='space')host.append(mk('span','wordspace'));else if(t.type==='break')host.append(mk('span','linebreak'));else if(t.type==='sign'){const n=mk('span','single-special');const im=mk('img');im.src=C.archaicStandalone[t.sign]?.glyph||'';im.alt=t.sign;n.append(im);host.append(n)}}}
};
// Shared live writing desk; phonetic and voice engines see identical logical tokens.
window.AzaaraanStudio={
 getTokens(){return tokens.map(t=>({...t,marks:Array.isArray(t.marks)?[...t.marks]:undefined}))},
 getUnicode(){return output()},
 getEra(){return era},
 speakText(){return window.AzaaraanTTS?.speakComposition?.()}
};
})();
