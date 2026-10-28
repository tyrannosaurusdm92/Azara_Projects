
'use strict';
// Embedded unicode character data. No remote calls, no CDN dependencies.
const UNICODE = window.SavanskiData.unicode.characters;
const LONG_PRESS_DATA = window.SavanskiData.accents;
const $ = id => document.getElementById(id);
const charById = new Map(UNICODE.map(item => [item.cp, item]));
const categoryNames = {Lu:'Uppercase letter',Ll:'Lowercase letter',Lt:'Titlecase letter',Mn:'Nonspacing mark',Me:'Enclosing mark',Mc:'Spacing combining mark',Cf:'Format character',So:'Symbol'};
const STORAGE = {text:'unified-unicode-keyboard-text-v1',favorites:'unified-unicode-keyboard-favorites-v1',custom:'unified-unicode-keyboard-custom-v1',nfc:'unified-unicode-keyboard-nfc-v1'};
const editor = $('editor');
const hasSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
const segmenter = hasSegmenter ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
let section = 'all', favorites = new Set(), customKeys = [], editingCustomId = null, active = UNICODE[0], shifted = false;
let history = [], historyIndex = -1;
function safeRead(key,fallback){try{let raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}}
function safeWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{setStatus('Local storage is unavailable; export your work to keep it.',true)}}
function setStatus(message,isError=false){$('status').textContent=message;$('status').classList.toggle('error',isError)}
function htmlCodes(s){return Array.from(s).map(char=>'U+'+char.codePointAt(0).toString(16).toUpperCase().padStart(4,'0'))}
function graphemes(s){if(segmenter)return Array.from(segmenter.segment(s),v=>v.segment);return Array.from(s)}
function previousGrapheme(str,pos){const front=str.slice(0,pos);if(!front)return null;const gs=graphemes(front);const last=gs[gs.length-1];return {start:pos-last.length,end:pos,text:last}}
function isAttachable(s){return /[\p{L}\p{M}\p{N}]$/u.test(s)}
function markPlacement(name){if(name.includes('LATIN SMALL LETTER'))return 'above';if(name.includes('BELOW')||name.includes('LOW LINE')||name.includes('OGONEK')||name.includes('CEDILLA'))return 'below';if(name.includes('OVERLAY')||name.includes('STROKE')||name.includes('SOLIDUS'))return 'overlay';if(name.includes('ABOVE')||name.includes('OVERLINE')||name.includes('MACRON')||name.includes('ACUTE')||name.includes('GRAVE')||name.includes('CIRCUMFLEX')||name.includes('BREVE')||name.includes('TILDE')||name.includes('CARON')||name.includes('RING')||name.includes('DIAERESIS'))return 'above';return 'other'}
function itemMatchType(item,kind){if(kind==='all')return true;if(item.block==='custom')return false;if(kind==='upper'||kind==='lower')return item.cat===(kind==='upper'?'Lu':'Ll');return item.block==='mark'&&markPlacement(item.name)===kind}
function describe(item){if(item.block==='custom')return item.label;return item.name}
function displayItem(item){if(item.block==='custom')return item.value;return item.block==='mark'?'◌'+item.char:item.char}
function currentSnapshot(){return {text:editor.value,start:editor.selectionStart,end:editor.selectionEnd}}
function updateUndoButtons(){$('undo').disabled=historyIndex<=0;$('redo').disabled=historyIndex>=history.length-1}
function record(){const state=currentSnapshot();if(historyIndex>=0&&history[historyIndex].text===state.text){history[historyIndex]=state;updateStats();return}history=history.slice(0,historyIndex+1);history.push(state);if(history.length>110)history.shift();historyIndex=history.length-1;updateUndoButtons();updateStats();safeWrite(STORAGE.text,editor.value)}
function restore(index){if(index<0||index>=history.length)return;historyIndex=index;const s=history[index];editor.value=s.text;editor.focus();editor.setSelectionRange(Math.min(s.start,s.text.length),Math.min(s.end,s.text.length));updateUndoButtons();updateStats();safeWrite(STORAGE.text,editor.value)}
function replace(start,end,text){editor.setRangeText(text,start,end,'end');const caret=start+text.length;editor.focus({preventScroll:true});editor.setSelectionRange(caret,caret);record()}
function insertText(text){const start=editor.selectionStart,end=editor.selectionEnd;replace(start,end,text)}
function applyMark(item){const start=editor.selectionStart,end=editor.selectionEnd;const selected=editor.value.slice(start,end);let base='',from=start,to=end;
 if(selected){base=selected}else{const p=previousGrapheme(editor.value,start);if(p&&isAttachable(p.text)){base=p.text;from=p.start;to=start}else{base='◌'}}
 let output=base+item.char;if($('preferNfc').checked)output=output.normalize('NFC');replace(from,to,output);
 if(output.includes('◌'))setStatus('Inserted a dotted-circle placeholder because no base character was before the cursor.');
 else if(Array.from(output).length===1)setStatus('Composed as a single Unicode code point.');
 else setStatus('Mark added. This visual letter contains '+Array.from(output).length+' Unicode code points.');
}
function insertItem(item){if(item.block==='mark')applyMark(item);else insertText(item.block==='custom'?item.value:item.char);inspect(item)}
function updateStats(){const value=editor.value,pts=Array.from(value),clusters=graphemes(value);$('count').innerHTML='<strong>'+pts.length+'</strong> code point'+(pts.length===1?'':'s')+' · <strong>'+clusters.length+'</strong> grapheme'+(clusters.length===1?'':'s')+' · '+value.length+' UTF-16 units'}
function showCodes(node,text){node.replaceChildren();htmlCodes(text).forEach(code=>{const el=document.createElement('span');el.className='codepoint';el.textContent=code;node.append(el)})}
function isFav(item){return item.block!=='custom'&&item.block!=='variant'&&favorites.has(item.cp)}
function syncFavButton(){$('inspectFavorite').hidden=active.block==='custom'||active.block==='variant';$('inspectFavorite').textContent=isFav(active)?'★ Favorited':'☆ Favorite'}
function inspect(item){active=item;const output=item.block==='custom'?item.value:item.char;
 $('previewGlyph').textContent=displayItem(item);$('previewNote').textContent=item.block==='mark'?'Dotted circle shows mark placement':item.block==='custom'?'Saved custom key':item.block==='variant'?'Long-press character alternative':'Extended Latin character';
 $('detailName').textContent=describe(item);showCodes($('detailCodes'),output);
 $('detailSource').textContent=item.block==='latin'?'Latin Extended Additional':item.block==='mark'?'Combining Diacritical Marks':item.block==='variant'?'Long-press Unicode variants':'Your custom keyboard';
 $('detailCategory').textContent=item.block==='custom'?'User-defined sequence':item.cat+' — '+(categoryNames[item.cat]||'Unicode character');
 const nfd=output.normalize('NFD');$('detailDecomp').textContent=htmlCodes(nfd).join(' + ')+(nfd===output?' (unchanged)':'');
 $('detailLength').textContent=Array.from(output).length+' code point(s), '+graphemes(output).length+' grapheme(s)';
 if(item.block==='mark'){$('example').textContent='a'+item.char+'  ·  '+('a'+item.char).normalize('NFC');$('exampleNote').textContent='The mark follows a base letter. NFC may collapse this sequence into one code point when defined by Unicode.'}
 else if(item.block==='custom'){$('example').textContent=output;$('exampleNote').textContent='This custom key inserts the text exactly as stored, even if it contains multiple Unicode code points.'}
 else{$('example').textContent=''+item.char+' · '+nfd;$('exampleNote').textContent='Compare the single encoded character (left) with its canonical decomposed form (right).'}
 $('customInspectorActions').style.display=item.block==='custom'?'flex':'none';syncFavButton()}
function toggleFavorite(item){if(item.block==='custom')return;if(favorites.has(item.cp))favorites.delete(item.cp);else favorites.add(item.cp);safeWrite(STORAGE.favorites,Array.from(favorites));syncFavButton();renderLibrary()}
function matchesSearch(item,q){if(!q)return true;const terms=[describe(item),displayItem(item),item.char||'',item.cp||'',item.cp?'U+'+item.cp:'',item.block].join(' ').toLowerCase();return q.split(/\s+/).every(term=>terms.includes(term))}
function filteredItems(){const q=$('search').value.trim().toLowerCase(),kind=$('filter').value;let source=section==='latin'?UNICODE.filter(i=>i.block==='latin'):section==='mark'?UNICODE.filter(i=>i.block==='mark'):section==='favorites'?UNICODE.filter(i=>favorites.has(i.cp)):section==='custom'?customKeys.map(k=>({...k,block:'custom'})):UNICODE;
 return source.filter(item=>itemMatchType(item,kind)&&matchesSearch(item,q))}
function renderLibrary(){const shown=filteredItems(),grid=$('charGrid'),frag=document.createDocumentFragment();grid.replaceChildren();
 shown.forEach(item=>{const wrap=document.createElement('div');wrap.className='char-tile';const main=document.createElement('button');main.type='button';main.className='char-key'+(item.block==='mark'?' is-mark':'')+(item.block==='custom'?' is-custom':'');main.dataset.insert=item.block==='custom'?item.id:item.cp;main.title=describe(item)+(item.cp?' (U+'+item.cp+')':'');main.setAttribute('aria-label','Insert '+describe(item));
 const symbol=document.createElement('span');symbol.className='key-glyph';symbol.textContent=displayItem(item);const code=document.createElement('span');code.className='key-code';code.textContent=item.block==='custom'?item.label.slice(0,13):'U+'+item.cp;main.append(symbol,code);wrap.append(main);
 if(item.block!=='custom'){const star=document.createElement('button');star.type='button';star.className='fav-btn'+(isFav(item)?' is-favorite':'');star.dataset.favorite=item.cp;star.textContent=isFav(item)?'★':'☆';star.title=isFav(item)?'Remove favorite':'Add to favorites';star.setAttribute('aria-label',(isFav(item)?'Remove':'Add')+' '+item.name+' '+(isFav(item)?'from':'to')+' favorites');wrap.append(star)}frag.append(wrap)});
 grid.append(frag);if(!shown.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=section==='favorites'?'No matching favorites. Star characters to add them here.':section==='custom'?'No custom keys yet. Create one above to get started.':'No characters match these filters.';grid.append(empty)}
 $('searchStatus').textContent='Showing '+shown.length+' '+(shown.length===1?'key':'keys')+(section==='all'?' from both Unicode blocks.':section==='latin'?' from Latin Extended Additional.':section==='mark'?' from Combining Diacritical Marks.':section==='favorites'?' from your favorites.':' from your custom collection.');
}
function changeTab(tab){section=tab;$('tabs').querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));$('customTools').hidden=tab!=='custom';if(tab==='custom'&&['upper','lower','above','below','overlay','other'].includes($('filter').value))$('filter').value='all';renderLibrary()}
const LAYOUT_ALPHA=[['1','2','3','4','5','6','7','8','9','0'],['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['SHIFT','z','x','c','v','b','n','m','BACK'],['?123',"'",'-',',','.','?','!','SPACE','ENTER']];
const LAYOUT_SYMBOLS=[['1','2','3','4','5','6','7','8','9','0'],['@','#','$','%','&','*','+','-','=', '/'],['(',')','[',']','{','}','<','>','\\'],['ABC',':',';','"',"'",'^','~','|','BACK'],[',','.','?','!','_','SPACE','ENTER']];
const HOLD_DELAY=470;
let symbolsMode=false,pressState=null,physicalPress=null,pickerContext=null,pickerTab='letters',pickerChoices=[],pickerIndex=0,justOpened=0;
function letterKey(key){return /^[a-zA-Z]$/.test(key)}
function effectiveKey(raw){return !symbolsMode&&shifted&&/^[a-z]$/.test(raw)?raw.toUpperCase():raw}
function variantsFor(key){return letterKey(key)?LONG_PRESS_DATA.letters[key]||[]:LONG_PRESS_DATA.symbols[key]||[]}
function createBaseKeyboard(){const rows=symbolsMode?LAYOUT_SYMBOLS:LAYOUT_ALPHA;const wrap=$('baseKeyboard');wrap.replaceChildren();rows.forEach(row=>{const r=document.createElement('div');r.className='base-row';for(const raw of row){const b=document.createElement('button');b.type='button';b.className='base-key';b.dataset.key=raw;const key=effectiveKey(raw);const label=raw==='SHIFT'?'⇧':raw==='BACK'?'⌫':raw==='SPACE'?'Space':raw==='ENTER'?'↵':raw; b.textContent=label;
  if(['SHIFT','BACK','SPACE','ENTER','?123','ABC'].includes(raw))b.classList.add('wide');if(raw==='SPACE')b.classList.add('space');if(raw==='SHIFT'&&shifted)b.classList.add('active');if(variantsFor(key).length)b.classList.add('has-options');b.setAttribute('aria-label',variantsFor(key).length?key+', hold for '+variantsFor(key).length+' alternatives':label);b.title=variantsFor(key).length?'Hold for '+variantsFor(key).length+' choices':'';r.append(b)}wrap.append(r)})}
function handlePlainKey(raw){if(raw==='SHIFT'){shifted=!shifted;createBaseKeyboard();return}if(raw==='?123'||raw==='ABC'){symbolsMode=raw==='?123';createBaseKeyboard();return}if(raw==='BACK'){doBackspace();return}if(raw==='SPACE'){insertText(' ');return}if(raw==='ENTER'){insertText('\n');return}insertText(effectiveKey(raw))}
function allPickerChoices(key,tab){if(tab==='marks')return UNICODE.filter(v=>v.block==='mark').map(v=>({value:($('preferNfc').checked?key+v.char:(key+v.char)).normalize($('preferNfc').checked?'NFC':'NFD'),label:v.name,code:'U+'+v.cp,mark:v}));const variants=variantsFor(key);const plain={value:key,label:'Plain '+key,code:htmlCodes(key)[0],plain:true};return [plain,...variants.map(v=>({value:v.value,label:v.name,code:v.cp}))]}
function pickerPointerLocation(anchor){const rect=anchor.getBoundingClientRect();const viewportW=window.innerWidth, viewportH=window.innerHeight;
 const width=Math.min(540,viewportW-16),x=Math.max(8,Math.min(viewportW-8-width,rect.left+rect.width/2-width/2));let top=rect.bottom+8;
 const actualHeight=Math.min(480,$('variantPicker').offsetHeight||360,viewportH*.64);
 if(top+actualHeight>viewportH-8)top=Math.max(8,rect.top-actualHeight-8);
 if(top+actualHeight>viewportH-8)top=Math.max(8,viewportH-actualHeight-8);
 $('variantPicker').style.left=x+'px';$('variantPicker').style.top=top+'px'}
function renderPicker(){const popup=$('variantPicker');if(!pickerContext)return;const key=pickerContext.key;
 $('pickerTitle').textContent=letterKey(key)?'Accents for '+key:'Alternatives for '+key;
 $('pickerSubtitle').textContent=letterKey(key)?'Choose a whole letter or attach a Unicode mark':'Select a related number or symbol';
 const tabs=$('pickerTabs');tabs.replaceChildren();for(const [id,label] of (letterKey(key)?[['letters','Accented letters'],['marks','Combining marks · 112']]:[['letters','Symbol choices']])){const btn=document.createElement('button');btn.type='button';btn.className='picker-tab';btn.dataset.pickerTab=id;btn.textContent=label;btn.setAttribute('aria-pressed',String(pickerTab===id));tabs.append(btn)}
 const options=$('pickerOptions');options.replaceChildren();pickerChoices=allPickerChoices(key,pickerTab);pickerIndex=0;
 pickerChoices.forEach((v,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='picker-option';btn.dataset.choiceIndex=String(i);btn.title=v.label+' ('+v.code+')';btn.setAttribute('aria-label',v.label+', '+v.code);const glyph=document.createElement('span');glyph.className='variant-glyph';glyph.textContent=v.value;const cp=document.createElement('span');cp.className='variant-cp';cp.textContent=v.code;btn.append(glyph,cp);options.append(btn)});
 highlightPicker(0,false);requestAnimationFrame(()=>{if(!popup.hidden)pickerPointerLocation(pickerContext.anchor)})}
function highlightPicker(i,scroll){if(!pickerChoices.length)return;pickerIndex=Math.min(pickerChoices.length-1,Math.max(0,i));const opts=$('pickerOptions').querySelectorAll('[data-choice-index]');opts.forEach((b,n)=>b.classList.toggle('is-active',n===pickerIndex));if(scroll&&opts[pickerIndex])opts[pickerIndex].scrollIntoView({block:'nearest',inline:'nearest'})}
function openPicker(key,anchor,mode,replaceRange=null){if(!variantsFor(key).length||!anchor)return false;
 closePicker();pickerContext={key,anchor,mode,replaceRange};pickerTab='letters';const el=$('variantPicker');el.hidden=false;renderPicker();if($('hapticHold').checked&&navigator.vibrate)navigator.vibrate(12);return true}
function closePicker(){if($('variantPicker').hidden)return;$('variantPicker').hidden=true;pickerContext=null;pickerChoices=[];if(pressState?.button)pressState.button.classList.remove('is-held')}
function choosePicker(i){if(!pickerContext||!pickerChoices[i])return;const choice=pickerChoices[i],ctx=pickerContext;closePicker();if(ctx.mode==='physical'&&ctx.replaceRange){const {start,end,original}=ctx.replaceRange;if(editor.value.slice(start,end)===original)replace(start,end,choice.value);else{setStatus('Text changed before the held character; selection was not applied.',true);return}}
 else insertText(choice.value);if(choice.mark)inspect(choice.mark);else if(!choice.plain){const item=UNICODE.find(v=>v.char===choice.value);inspect(item||{cp:choice.code.replace(/^U\+/,''),char:choice.value,name:choice.label.toUpperCase(),block:'variant',cat:letterKey(ctx.key)?ctx.key===ctx.key.toUpperCase()?'Lu':'Ll':'So'})}setStatus((choice.mark?'Applied combining mark: ':'Inserted: ')+choice.value)}
function pressPointerDown(e){const button=e.target.closest('button[data-key]');if(!button||e.button!==0)return;e.preventDefault();if(pressState)clearTimeout(pressState.timer);const raw=button.dataset.key;closePicker();const state={button,raw,pointerId:e.pointerId,long:false,timer:null};pressState=state;
 if(variantsFor(effectiveKey(raw)).length)state.timer=setTimeout(()=>{if(pressState!==state)return;state.long=openPicker(effectiveKey(raw),button,'on-screen');button.classList.add('is-held')},HOLD_DELAY)}
function pressPointerMove(e){if(!pressState||pressState.pointerId!==e.pointerId||!pressState.long||$('variantPicker').hidden)return;const found=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-choice-index]');if(found&&$('variantPicker').contains(found))highlightPicker(Number(found.dataset.choiceIndex),false)}
function pressPointerEnd(e){if(!pressState||pressState.pointerId!==e.pointerId)return;const state=pressState;pressState=null;clearTimeout(state.timer);state.button.classList.remove('is-held');if(e.type==='pointercancel')return;
 if(state.long){const picked=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-choice-index]');if(picked&&$('variantPicker').contains(picked))choosePicker(Number(picked.dataset.choiceIndex));return}
 handlePlainKey(state.raw)}
function physicallyEligible(e){if(!$('physicalHold').checked||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.key==='Dead'||e.key.length!==1)return false;return !!variantsFor(e.key).length}
function physicalDown(e){if(!$('variantPicker').hidden&&pickerContext?.mode==='physical'){
  if(e.key==='Escape'){e.preventDefault();closePicker();return}
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();highlightPicker(pickerIndex+1,true);return}
  if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();highlightPicker(pickerIndex-1,true);return}
  if(e.key==='Enter'){e.preventDefault();choosePicker(pickerIndex);return}
  if(e.repeat&&physicalPress&&e.code===physicalPress.code){e.preventDefault();return}
  if(!e.repeat){closePicker()}
 }
 if(!physicallyEligible(e))return;
 if(physicalPress){if(e.code===physicalPress.code){e.preventDefault();return}if(physicalPress.timer)clearTimeout(physicalPress.timer);physicalPress=null}
 e.preventDefault();const base=e.key,start=editor.selectionStart;insertText(base);const end=editor.selectionStart,range={start,end,original:base};const state={key:base,code:e.code,range,timer:null};physicalPress=state;
 state.timer=setTimeout(()=>{if(physicalPress!==state)return;const anchor=editor;openPicker(base,anchor,'physical',range)},HOLD_DELAY)}
function physicalUp(e){if(!physicalPress||e.code!==physicalPress.code)return;clearTimeout(physicalPress.timer);physicalPress=null}
function setupLongPress(){const base=$('baseKeyboard'),popup=$('variantPicker');base.addEventListener('pointerdown',pressPointerDown);base.addEventListener('pointermove',pressPointerMove);document.addEventListener('pointerup',pressPointerEnd,true);document.addEventListener('pointercancel',pressPointerEnd,true);
 base.addEventListener('contextmenu',e=>{if(e.target.closest('[data-key]'))e.preventDefault()});base.addEventListener('click',e=>{if(e.detail!==0)return;const b=e.target.closest('[data-key]');if(b)handlePlainKey(b.dataset.key)});
 popup.addEventListener('pointerdown',e=>{if(e.target.closest('[data-choice-index]'))e.preventDefault()});popup.addEventListener('click',e=>{const tab=e.target.closest('[data-picker-tab]');if(tab){pickerTab=tab.dataset.pickerTab;renderPicker();return}const choice=e.target.closest('[data-choice-index]');if(choice){choosePicker(Number(choice.dataset.choiceIndex));return}});
 $('pickerClose').addEventListener('click',closePicker);
 document.addEventListener('pointerdown',e=>{if(!popup.hidden&&!popup.contains(e.target)&&!base.contains(e.target))closePicker()},true);
 window.addEventListener('resize',()=>{if(!popup.hidden&&pickerContext)pickerPointerLocation(pickerContext.anchor)});
 window.addEventListener('scroll',()=>{if(!popup.hidden&&pickerContext)pickerPointerLocation(pickerContext.anchor)},true);
 document.addEventListener('keydown',e=>{if(popup.hidden)return;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePicker();return}
 if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();highlightPicker(pickerIndex+1,true);return}
 if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();highlightPicker(pickerIndex-1,true);return}
 if(e.key==='Enter'){e.preventDefault();e.stopPropagation();choosePicker(pickerIndex);return}
},true);
 editor.addEventListener('keydown',physicalDown,true);editor.addEventListener('keyup',physicalUp);
 $('physicalHold').checked=safeRead('unified-unicode-keyboard-physical-hold',matchMedia('(pointer:fine)').matches)===true;
 $('physicalHold').addEventListener('change',()=>safeWrite('unified-unicode-keyboard-physical-hold',$('physicalHold').checked));
 $('hapticHold').checked=safeRead('unified-unicode-keyboard-haptic-hold',false)===true;
 $('hapticHold').addEventListener('change',()=>safeWrite('unified-unicode-keyboard-haptic-hold',$('hapticHold').checked));
}
function doBackspace(){const start=editor.selectionStart,end=editor.selectionEnd;if(end>start){replace(start,end,'');return}const p=previousGrapheme(editor.value,start);if(p)replace(p.start,start,'')}
function normalizeAll(mode){const old=editor.value,selStart=editor.selectionStart,selEnd=editor.selectionEnd,changed=old.normalize(mode);if(old===changed){setStatus('Already in '+mode+' form.');return}editor.value=changed;editor.focus();editor.setSelectionRange(old.slice(0,selStart).normalize(mode).length,old.slice(0,selEnd).normalize(mode).length);record();setStatus('Text normalized to '+mode+'.')}
function download(filename,body,mime){const blob=new Blob([body],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function clipboardFallback(value){const start=editor.selectionStart,end=editor.selectionEnd;editor.focus();editor.select();const ok=document.execCommand('copy');editor.setSelectionRange(start,end);if(!ok)throw new Error('Copy command was not available')}
async function copyText(){const value=editor.value;if(!value){setStatus('The writing area is empty.');return}try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else clipboardFallback(value);setStatus('Text copied to the clipboard.')}catch{try{clipboardFallback(value);setStatus('Text copied to the clipboard.')}catch{setStatus('Copy was blocked. Select the text and press Ctrl+C.',true)}}}
function validateCustomKeys(value){if(!Array.isArray(value))throw Error('Expected a JSON list of custom keys.');return value.slice(0,500).map((item,i)=>{if(typeof item!=='object'||item===null||typeof item.label!=='string'||typeof item.value!=='string'||!item.label.trim()||!item.value)throw Error('Invalid custom key at position '+(i+1));return{id:typeof item.id==='string'&&item.id.length<85?item.id:'key_'+i+'_'+Date.now(),label:item.label.slice(0,36),value:item.value.slice(0,64)}})}
function saveKeys(){safeWrite(STORAGE.custom,customKeys);renderLibrary()}
function resetCustomForm(){$('customForm').reset();editingCustomId=null;$('saveCustom').textContent='Save key';$('cancelCustom').hidden=true}
function processInputFile(input,acceptFn){const file=input.files&&input.files[0];if(!file)return;if(file.size>2*1024*1024){setStatus('File too large (2 MB maximum).',true);input.value='';return}file.text().then(acceptFn).catch(e=>setStatus('Could not read file: '+e.message,true)).finally(()=>input.value='')}
function initialize(){const initial=safeRead(STORAGE.text,'');editor.value=typeof initial==='string'?initial:'';const savedFav=safeRead(STORAGE.favorites,[]);favorites=new Set(Array.isArray(savedFav)?savedFav.filter(cp=>charById.has(cp)):[]);try{customKeys=validateCustomKeys(safeRead(STORAGE.custom,[]))}catch{customKeys=[]}const nfc=safeRead(STORAGE.nfc,true);$('preferNfc').checked=nfc!==false;
 history=[currentSnapshot()];historyIndex=0;updateUndoButtons();updateStats();createBaseKeyboard();inspect(active);renderLibrary();
 editor.addEventListener('input',()=>{record();setStatus('')});editor.addEventListener('keydown',e=>{const ctrl=e.ctrlKey||e.metaKey;if(ctrl&&!e.altKey&&(e.key.toLowerCase()==='z'||e.key.toLowerCase()==='y')){e.preventDefault();if(e.key.toLowerCase()==='y'||e.shiftKey)restore(historyIndex+1);else restore(historyIndex-1)}});
 $('charGrid').addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault()});$('charGrid').addEventListener('click',e=>{const favorite=e.target.closest('[data-favorite]');if(favorite){toggleFavorite(charById.get(favorite.dataset.favorite));return}const button=e.target.closest('[data-insert]');if(!button)return;const key=button.dataset.insert;const item=charById.get(key)||(customKeys.find(k=>k.id===key)?{...customKeys.find(k=>k.id===key),block:'custom'}:null);if(item)insertItem(item)});
 setupLongPress();
 $('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)changeTab(b.dataset.tab)});$('search').addEventListener('input',renderLibrary);$('filter').addEventListener('change',renderLibrary);
 $('inspectFavorite').addEventListener('click',()=>toggleFavorite(active));$('preferNfc').addEventListener('change',()=>{safeWrite(STORAGE.nfc,$('preferNfc').checked);setStatus($('preferNfc').checked?'NFC composition enabled for new combining marks.':'Combining marks will remain as separate Unicode code points.')});
 $('undo').addEventListener('click',()=>restore(historyIndex-1));$('redo').addEventListener('click',()=>restore(historyIndex+1));$('copy').addEventListener('click',copyText);$('normalizeNfc').addEventListener('click',()=>normalizeAll('NFC'));$('normalizeNfd').addEventListener('click',()=>normalizeAll('NFD'));
 $('saveTxt').addEventListener('click',()=>{download('unicode-writing.txt',editor.value,'text/plain;charset=utf-8');setStatus('Saved a UTF-8 text file.')});$('loadTxt').addEventListener('click',()=>$('textFile').click());$('textFile').addEventListener('change',()=>processInputFile($('textFile'),text=>{editor.value=text;editor.focus();editor.setSelectionRange(text.length,text.length);record();setStatus('Text file loaded.')}));
 $('clearText').addEventListener('click',()=>{if(!editor.value)return;if(!confirm('Clear all text in the writing area? You can undo this afterward.'))return;editor.value='';editor.focus();record();setStatus('Writing area cleared.')});
 $('customForm').addEventListener('submit',e=>{e.preventDefault();const label=$('customLabel').value.trim(),value=$('customValue').value;if(!label||!value)return;if(editingCustomId){const existing=customKeys.find(k=>k.id===editingCustomId);if(existing){existing.label=label;existing.value=value}}else{customKeys.push({id:'key_'+Date.now()+'_'+Math.random().toString(36).slice(2,9),label,value})}saveKeys();resetCustomForm();setStatus('Custom key saved.');});
 $('cancelCustom').addEventListener('click',resetCustomForm);
 $('editCustomKey').addEventListener('click',()=>{if(active.block!=='custom')return;changeTab('custom');editingCustomId=active.id;$('customLabel').value=active.label;$('customValue').value=active.value;$('saveCustom').textContent='Update key';$('cancelCustom').hidden=false;$('customLabel').focus();$('customTools').scrollIntoView({behavior:'smooth',block:'center'})});
 $('deleteCustomKey').addEventListener('click',()=>{if(active.block!=='custom')return;if(!confirm('Delete custom key "'+active.label+'"?'))return;customKeys=customKeys.filter(k=>k.id!==active.id);saveKeys();resetCustomForm();inspect(UNICODE[0]);setStatus('Custom key deleted.')});
 $('downloadKeys').addEventListener('click',()=>{download('my-unicode-keyboard-keys.json',JSON.stringify({format:'unified-unicode-keyboard-keys',version:1,customKeys,favorites:[...favorites]},null,2),'application/json;charset=utf-8');setStatus('Custom keys and favorites exported.')});
 $('uploadKeys').addEventListener('click',()=>$('keysFile').click());$('keysFile').addEventListener('change',()=>processInputFile($('keysFile'),contents=>{try{const result=JSON.parse(contents);if(!result||result.format!=='unified-unicode-keyboard-keys'||!Array.isArray(result.customKeys))throw Error('Unsupported keyboard JSON file');const incoming=validateCustomKeys(result.customKeys),byId=new Map(customKeys.map(k=>[k.id,k]));for(const key of incoming)byId.set(key.id,key);customKeys=[...byId.values()].slice(0,500);if(Array.isArray(result.favorites))for(const id of result.favorites){if(charById.has(id))favorites.add(id)}safeWrite(STORAGE.custom,customKeys);safeWrite(STORAGE.favorites,[...favorites]);renderLibrary();syncFavButton();setStatus('Imported custom keys and favorites.')}catch(err){setStatus('Import failed: '+err.message,true)}}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.activeElement===$('search')){$('search').value='';renderLibrary();editor.focus()}});
}
initialize();

