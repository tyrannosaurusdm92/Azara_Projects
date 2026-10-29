(()=>{'use strict';
const C=window.AZA_CONFIG;
const $=id=>document.getElementById(id);
const ACC=new Map(C.accents.map(a=>[a.id,a]));
const SPEC=new Map(C.specials.map(a=>[a.id,a]));
const MARKS=new Map([...ACC,...SPEC]);
const VOWELS=new Set(['C01','C02','C03','C04','C05','C06','C07']);
const STRUCTURAL=new Set(['S01','S02','S03','S04']);
const EMPHASIS=new Set(['S03','S04']);
const EVOLUTION=(()=>{try{return JSON.parse($('letterData')?.textContent||'{}')}catch{return {roots:[]}}})();
const GLYPH_REGISTRY_KEY='writerhelper-glyph-sound-registry-v1';
const SOUND_SLOTS={B:[5],F:[7],V:[18]};
const SOUND_RECIPES={
 2:['T',['C01','K01']],3:['T',['K03']],4:['N',['C08']],5:['B',[]],6:['D',[]],7:['B',['C11']],
 8:['G',[]],9:['J',[]],10:['K',[]],11:['M',[]],12:['P',[]],13:['N',[]],14:['R',[]],15:['S',[]],
 16:['T',['K04']],17:['T',[]],18:['B',['C09']],19:['Z',[]],20:['N',['C10']],21:['S',['K04']],22:['H',[]],23:['L',[]],
 24:['K',['C09']],25:['K',['K02']],26:['A',['C05']],27:['A',['C10']],28:['A',['C09']],29:['O',['C07']],30:['E',['C02']],
 31:['A',['C10','C02']],32:['Y',['C07']],33:['O',['C10']],34:['A',['C01']],35:['I',['C10']],36:['E',['C06']],37:['U',['C04']],
 38:['I',['C03']],39:['O',['K04']],40:['O',['C09']],41:['W',['C05']],42:['W',['C02']],43:['W',['C03']],44:['W',['C07']],
 45:['W',['K05']],46:['Y',['C05']],47:['Y',['C02']],48:['Y',['C03']],49:['Y',['C06']],50:['Y',['C07']],51:['Y',['K05']]
};
const isOrdinary=id=>ACC.has(id);
function markAllowed(marks,id){
 if(marks.includes(id))return {allowed:false,reason:'Mark already attached'};
 const others=marks.filter(x=>x!==id);
 if(STRUCTURAL.has(id)&&others.filter(x=>STRUCTURAL.has(x)).length>=2)return {allowed:false,reason:'A glyph can carry at most two special signs.'};
 if(EMPHASIS.has(id)&&others.some(x=>EMPHASIS.has(x)))return {allowed:false,reason:'Choose either previous-syllable or next-syllable emphasis.'};
 if(id==='K05'&&others.some(isOrdinary))return {allowed:false,reason:'Base must be the only ordinary accent'};
 if(id!=='K05'&&isOrdinary(id)&&others.includes('K05'))return {allowed:false,reason:'Remove Base before adding other ordinary accents'};
 return {allowed:true};
}
function canApplyMark(marks,id){
 if(marks.includes(id))return false;
 if(era==='Archaic'&&SPEC.has(id))return false;
 const effective=VOWELS.has(id)?marks.filter(x=>!VOWELS.has(x)):marks;
 if(effective.length>=C.maxMainAndSpecialStack)return false;
 return markAllowed(effective,id).allowed;
}

const keyList=Array.from(C.keyOrder);
let era='Modern',tokens=[],cursor=0,selected=-1,paletteLetter='T',draft=-1,activeVariant='T';
const storage='azaaraan_studio_merged_20261027'+(window.frameElement?.id==='wh-aza-book-frame'?':book':':language');
function glyphAssignmentForUnicode(unicode){
 try{
  const registry=JSON.parse(localStorage.getItem(GLYPH_REGISTRY_KEY)||'{}'),slots=registry.slots||{};
  const characters=[...String(unicode||'')],rawKeys=[];
  if(characters.length)rawKeys.push(characters.map(ch=>'U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')).join(' '));
  for(const ch of characters)rawKeys.push('U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0'));
  const keys=rawKeys.flatMap(key=>[era+'|'+key,key]);
  return keys.map(key=>slots[key]).find(record=>record&&!record.retired&&(record.sound||record.ipa))||null;
 }catch{return null}
}
function assignmentForToken(token){
 const marks=(token.marks||[]).slice().reverse();
 for(const id of marks){const record=glyphAssignmentForUnicode(MARKS.get(id)?.khmer);if(record)return record}
 return glyphAssignmentForUnicode(C.letterMap[token.base]);
}
function applyCustomAssignment(token){
 const record=assignmentForToken(token);if(!record)return false;
 if(record.ipa)token.ipa='/'+String(record.ipa).replace(/^\/+|\/+$/g,'')+'/';
 if(record.sound)token.sound=record.sound;
 if(record.family)token.soundFamily=record.family;
 return Boolean(record.ipa||record.sound);
}
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
 if(!tokens.length){host.append(mk('div','placeholder','Compose Aza’raan with the phonetic tools.'))}
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
 render();setStatus('Switched to '+era+' glyphs. Stored Khmer Unicode remains unchanged.');}
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
 const variantGlyph=activeVariant==='F'?tokenUnicode({type:'glyph',base:'B',marks:['C11']}):activeVariant==='V'?tokenUnicode({type:'glyph',base:'B',marks:['C09']}):C.letterMap[activeVariant];
 for(const preview of $('palette').querySelectorAll('.mini-core')){preview.textContent=variantGlyph;preview.style.fontFamily=fontName()}
 for(const visual of $('palette').querySelectorAll('.mini-composite'))visual.className='mini-composite era-'+era.toLowerCase();
 for(const opt of $('mark-choices').querySelectorAll('button')){opt.disabled=!canApplyMark(t.marks||[],opt.dataset.id);opt.classList.toggle('selected-accent',t.marks?.includes(opt.dataset.id))}
 for(const opt of $('special-choices').querySelectorAll('button')){opt.disabled=!canApplyMark(t.marks||[],opt.dataset.id);opt.classList.toggle('selected-accent',t.marks?.includes(opt.dataset.id))}
}
function setVariant(base){
 const familyAcc=base==='F'?'C11':base==='V'?'C09':null;
 const canonicalBase=familyAcc?'B':base;
 if(draft>=0&&tokens[draft]?.type==='glyph'){
  const t=tokens[draft];const remains=(t.marks||[]).filter(id=>id!=='C11'&&id!=='C09');
  t.base=canonicalBase;t.marks=(base==='W'?[]:familyAcc?[familyAcc,...remains.filter(x=>x!==familyAcc)]:base==='B'?remains:t.marks||[]).slice(0,3);delete t.ipa;delete t.sound;
  selected=draft;render();
 } else {const token={type:'glyph',base:canonicalBase,marks:familyAcc?[familyAcc]:[]};applyCustomAssignment(token);insert(token);draft=cursor-1;}
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
 t.marks.push(id);if(!SPEC.has(id)){delete t.ipa;delete t.sound;applyCustomAssignment(t)}selected=draft;cursor=draft+1;render();renderDraft();setStatus('Added '+(mark.name||mark.label)+' — '+t.marks.length+'/3 marks.');
}
function chooseOption(mark){const assigned=glyphAssignmentForUnicode(mark.khmer);const button=mk('button','mark-choice');button.type='button';button.dataset.id=mark.id;button.title=(assigned?.sound||mark.name||mark.label)+(assigned?.ipa?' · '+assigned.ipa:'');
 const variantGlyph=activeVariant==='F'?tokenUnicode({type:'glyph',base:'B',marks:['C11']}):activeVariant==='V'?tokenUnicode({type:'glyph',base:'B',marks:['C09']}):C.letterMap[activeVariant];
 const visual=mk('span','mini-composite era-'+era.toLowerCase());const miniature=mk('span','mini-core',variantGlyph);miniature.style.fontFamily=fontName();visual.append(miniature);const img=mk('img','mini-mark '+(mark.placement||'top'));img.src=glyphURL(mark.id);img.alt='';visual.append(img);button.append(visual);
 button.append(mk('span','variant-label',assigned?.sound||mark.name||mark.label));
 button.append(mk('span','mark-meta',assigned?.ipa?'IPA '+assigned.ipa+' · '+mark.khmer:(mark.display||'')+' · '+mark.khmer));button.addEventListener('click',()=>applyMark(mark.id));return button;
}
function familyVariant(t){return t?.base==='B'&&t.marks?.includes('C11')?'F':t?.base==='B'&&t.marks?.includes('C09')?'V':t?.base||''}
function ipaVariants(value){return String(value||'').replace(/^\/+|\/+$/g,'').split(/\s*~\s*/).map(x=>x.trim()).filter(Boolean)}
function soundRecipe(label,root,ipa,index){
 let [base,marks]=SOUND_RECIPES[root.slot]||[label,[]];marks=marks.slice();
 if(root.slot===6&&index===1)base='R';
 if(root.slot===7&&index===1){base='B';marks=['C09'];}
 if(root.slot===15&&index===1){base='Z';marks=[];}
 if(root.slot===5&&index===1)ipa='β';
 if(root.slot===18&&index===1)ipa='ʋ';
 return {base,marks,ipa:'/'+ipa+'/',family:label,sound:root.sound,rootSlot:root.slot};
}
function makeSoundChoices(label){
 const host=$('sound-choices');host.replaceChildren();
 const family=label==='F'||label==='V'?'B':label;
 const slots=SOUND_SLOTS[label];
 let roots=(EVOLUTION.roots||[]).filter(root=>!root.special&&root.family===family&&(!slots||slots.includes(root.slot)));
 const choices=[];
 for(const root of roots){
  const alternatives=ipaVariants(root.ipa);alternatives.forEach((ipa,index)=>choices.push(soundRecipe(label,root,ipa,index)));
 }
 if(label==='A')choices.push({base:'A',marks:['C04'],ipa:'/ʌ/',family:'A',sound:'A (uh)',rootSlot:37,extra:true});
 if(label==='R')choices.push({base:'R',marks:['K11'],ipa:'/r͡r/',family:'R',sound:'Rolled R (R + R)',rootSlot:14,extra:true});
 $('sound-choice-source').textContent='Letter Evolution Table · '+choices.length+' sound choices';
 $('sound-choices').setAttribute('aria-label',label+' sound choices');
 for(const choice of choices){
  const button=mk('button','sound-choice');button.type='button';
  const choiceUnicode=(C.letterMap[choice.base]||'')+choice.marks.map(id=>MARKS.get(id)?.khmer||'').join('');
  const assigned=glyphAssignmentForUnicode(choice.marks.map(id=>MARKS.get(id)?.khmer||'').join(''))||glyphAssignmentForUnicode(choiceUnicode)||glyphAssignmentForUnicode(C.letterMap[choice.base]);
  button.append(mk('strong',null,assigned?.sound||choice.sound));
  button.append(mk('span','sound-choice-ipa','/'+(assigned?.ipa||choice.ipa.replace(/^\/+|\/+$/g,''))+'/'));
  const recipe=[choice.base,...choice.marks.map(id=>MARKS.get(id)?.name||id)].join(' + ');
  button.append(mk('small',null,recipe+(assigned?.family?' · '+assigned.family+' family':'')));
  button.title=(assigned?.sound||choice.sound)+' · '+(assigned?.ipa||choice.ipa)+' · '+recipe;
  button.addEventListener('click',()=>applySoundChoice({...choice,sound:assigned?.sound||choice.sound,ipa:assigned?.ipa?'/'+assigned.ipa.replace(/^\/+|\/+$/g,'')+'/':choice.ipa,family:assigned?.family||choice.family}));
  host.append(button);
 }
}
function applySoundChoice(choice){
 const next={type:'glyph',base:choice.base,marks:choice.marks.slice(),sound:choice.sound,ipa:choice.ipa,soundFamily:choice.family,rootSlot:choice.rootSlot};
 if(draft>=0&&tokens[draft]?.type==='glyph'){tokens[draft]=next;selected=draft;cursor=draft+1;render()}
 else{insert(next);draft=cursor-1}
 activeVariant=choice.base==='B'&&choice.marks.includes('C11')?'F':choice.base==='B'&&choice.marks.includes('C09')?'V':choice.base;
 renderDraft();setStatus('Applied '+choice.sound+' ('+choice.ipa+') using the existing Khmer glyph and accent mapping. Add a special sign or continue typing.');
}
function openPalette(label){
 paletteLetter=label;activeVariant=label;
 const t=tokens[selected],variant=familyVariant(t),familyKeys=C.familyVariants.B||[];
 draft=t?.type==='glyph'&&(label===variant||(familyKeys.includes(label)&&familyKeys.includes(variant)))?selected:-1;
 if(draft>=0)activeVariant=variant;
 $('palette-title').textContent=familyKeys.includes(label)?'B family — B, F, V & W':label+' — Aza’raan sounds and marks';
 $('palette-hint').textContent='Choose a sound from the Letter Evolution Table, then add up to two special signs or other accents.';
 const families=$('family-options');families.replaceChildren();
 if(familyKeys.includes(label)){
  for(const base of C.familyVariants.B){const b=mk('button','family-option');b.type='button';b.dataset.base=base;b.append(mk('strong',null,base));const line=mk('span',null,base==='W'?'Plain W':base+' letter');b.append(line);b.addEventListener('click',()=>setVariant(base));families.append(b)}
 }else if(label!=='W'){
  const b=mk('button','family-option',label+' (base)');b.type='button';b.dataset.base=label;b.addEventListener('click',()=>setVariant(label));families.append(b)
 }else families.append(mk('span','subnote','Plain W is unavailable here. Choose a mark to create accented W.'));
 makeSoundChoices(label);
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
 }for(const token of result)if(token.type==='glyph')applyCustomAssignment(token);return result;
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
 buildReference();$('era').addEventListener('change',e=>switchEra(e.target.value));
 $('composition').addEventListener('click',e=>{if(e.target===$('composition')){selected=-1;cursor=tokens.length;render();$('composition').focus()}});
 $('copy').addEventListener('click',copyOutput);$('clear').addEventListener('click',()=>{tokens=[];cursor=0;selected=-1;render();setStatus('Writing desk cleared.')});
 $('backspace').addEventListener('click',erase);
 $('palette-close').addEventListener('click',closePalette);$('palette-done').addEventListener('click',()=>{
  if(paletteLetter==='W'&&draft>=0&&tokens[draft].base==='W'&&tokens[draft].marks.length===0){setStatus('W requires an accent; pick at least one.');return}
  closePalette()
 });$('palette-backdrop').addEventListener('pointerdown',e=>{if(e.target===$('palette-backdrop'))closePalette()});
 $('remove-mark').addEventListener('click',()=>{if(draft>=0&&tokens[draft]?.marks?.length){tokens[draft].marks.pop();delete tokens[draft].ipa;delete tokens[draft].sound;render();renderDraft()}});
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
