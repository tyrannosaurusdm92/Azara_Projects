/* Floating frame and keyboard. Pointer Events support mouse, touch and pen. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), data = window.KeyboardData, notes = window.Notes;
  const keyboard = $('keyboard'), bubble = $('keyboardBubble'), rows = $('keyRows');
  const state = { open: false, mode: 'letters', page: 0, caps: false, shift: 0, panel: null, language: 'qwerty', era: 'Modern' };

  // Modern key art uses the uploaded font's body bounding boxes, not the
  // tail-inclusive PNG bounds. Historical key artwork is left untouched.
  function alignModernKeyArt(img, latin) {
    const reg = window.AZ_FONT_REGISTRATION?.letters?.[latin];
    if (!reg?.bbox || !reg?.bodyBBox) return;
    const [xMin,yMin,xMax,yMax] = reg.bbox;
    const [bxMin,byMin,bxMax,byMax] = reg.bodyBBox;
    const scale = n => 'calc(var(--key-font) * ' + (n / 350 * .55).toFixed(6) + ')';
    img.classList.add('aza-body-aligned');
    img.style.width = scale(xMax-xMin);
    img.style.height = scale(yMax-yMin);
    img.style.left = 'calc(72% - ' + scale((bxMin+bxMax)/2-xMin) + ')';
    img.style.top = 'calc(52% - ' + scale(yMax-(byMin+byMax)/2) + ')';
    img.style.right = 'auto';
    img.style.bottom = 'auto';
    img.style.objectFit = 'fill';
  }

  let frame = { x: 0, y: 0, width: 860, height: 410 }, bubblePosition = { x: 0, y: 0 };
  let bubbleSize=150;try{bubbleSize=Number(localStorage.getItem('azaaraan-bubble-size'))||150}catch{}
  let gesture = null, press = null, lastShift = 0, bubbleClickSuppressed = false, ignoredClickPointer = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));
  const letters = key => /^[a-z]$/i.test(key);
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  function bounds() {
    const v = window.visualViewport, s = getComputedStyle($('safeArea'));
    const left = parseFloat(s.paddingLeft) || 0, right = parseFloat(s.paddingRight) || 0;
    const top = parseFloat(s.paddingTop) || 0, bottom = parseFloat(s.paddingBottom) || 0;
    return { x: (v?.offsetLeft || 0) + left + 6, y: (v?.offsetTop || 0) + top + 6,
      width: Math.max(1, (v?.width || innerWidth) - left - right - 12), height: Math.max(1, (v?.height || innerHeight) - top - bottom - 12) };
  }
  function defaultSize() {
    const b = bounds();
    return { width: Math.min(860, b.width), height: Math.min(b.height, b.width < 600 ? clamp(b.height * .42, 265, 340) : clamp(b.height * .46, 285, 430)) };
  }
  function fitFrame() {
    const b = bounds();
    frame.width = clamp(frame.width, Math.min(280, b.width), b.width);
    frame.height = clamp(frame.height, Math.min(220, b.height), b.height);
    frame.x = clamp(frame.x, b.x, b.x + b.width - frame.width);
    frame.y = clamp(frame.y, b.y, b.y + b.height - frame.height);
  }
  function drawFrame() {
    fitFrame();
    Object.assign(keyboard.style, { left: frame.x + 'px', top: frame.y + 'px', width: frame.width + 'px', height: frame.height + 'px' });
    const narrow = frame.width < 600;
    const dragH = clamp(frame.height * .056, 16, 25), footerH = frame.width < 520 ? clamp(frame.height * .13, 42, 54) : clamp(frame.height * .065, 25, 32);
    const toolSize = clamp(Math.min(frame.width / 8, frame.height * .12), 27, 48);
    const toolbarH = narrow ? (frame.width < 360 ? 90 : 78) : 58;
    const gap = clamp(Math.min(frame.width / 80, frame.height / 55), 3, 10);
    const visibleRows = state.mode === 'letters' ? (state.language === 'azaaraan' ? window.AzaaraanBridge.rows.length : data.alphaRows.length) : data.symbolPages[state.page].length;
    const rowHeight = (frame.height - 24 - dragH - footerH - toolbarH - Math.max(0, visibleRows - 1) * gap) / visibleRows;
    const fontSize = clamp(Math.min((frame.width - 45 - 9 * gap) / 10 * .61, rowHeight * .53), 10, 35);
    for (const [name, value] of Object.entries({ '--key-font': fontSize, '--hint-font': clamp(fontSize * .41, 7, 14), '--key-gap': gap,
      '--tool-size': toolSize, '--toolbar-height': toolbarH, '--drag-height': dragH, '--footer-height': footerH,
      '--key-radius': clamp(frame.width / 80, 5, 13), '--label-size': clamp(frame.width / 95, 7, 10) })) keyboard.style.setProperty(name, value + 'px');
    keyboard.classList.toggle('very-short', frame.height < 240);
  }
  function drawBubble() {
    const b = bounds(), size = bubbleSize=clamp(bubbleSize,Math.min(56,b.width,b.height),Math.min(240,b.width,b.height));
    bubblePosition.x = clamp(bubblePosition.x, b.x, b.x + b.width - size);
    bubblePosition.y = clamp(bubblePosition.y, b.y, b.y + b.height - size);
    Object.assign(bubble.style, { left: bubblePosition.x + 'px', top: bubblePosition.y + 'px', width: size + 'px', height: size + 'px' });
  }
  function effective(raw) { return letters(raw) ? state.caps ? raw.toUpperCase() : raw : raw; }
  function reset() {
    state.mode = 'letters'; state.page = 0; state.caps = false; state.shift = 0; lastShift = 0;
    closePanel(); render();
  }
  function open() {
    if (state.open) return;
    const size = defaultSize();
    frame = { ...size, x: bubblePosition.x + bubbleSize / 2 - size.width / 2, y: bubblePosition.y + bubbleSize / 2 - size.height / 2 };
    state.open = true; bubble.hidden = true; keyboard.hidden = false; drawFrame();
  }
  function collapse() {
    cancelPress(); gesture = null;
    bubblePosition = { x: frame.x + frame.width - bubbleSize, y: frame.y + frame.height - bubbleSize };
    state.open = false; reset(); keyboard.hidden = true; bubble.hidden = false; drawBubble(); bubble.focus({ preventScroll: true });
  }
  const labels = { SHIFT: '⇧', BACK: '⌫', SPACE: 'English (US)', ENTER: '↵', SYMBOLS: '123', ABC: 'ABC' };
  const aria = { SHIFT: 'Shift: reveal symbols; double tap to lock', BACK: 'Backspace', SPACE: 'Space', ENTER: 'Enter', SYMBOLS: 'Symbol keyboard', ABC: 'Letter keyboard', PAGE: 'Next symbol page' };
  function render() {
    rows.replaceChildren();
    const azaLetters = state.language === 'azaaraan' && state.mode === 'letters';
    const layout = state.mode === 'letters' ? (azaLetters ? window.AzaaraanBridge.rowsForEra(state.era) : data.alphaRows) : data.symbolPages[state.page];
    layout.forEach((keys, rowIndex) => {
      const row = make('div', 'key-row' + (state.mode === 'letters' && rowIndex === 2 ? ' home-row' : ''));
      for (const raw of keys) {
        const button = make('button', 'key'); button.type = 'button'; button.dataset.key = raw;
        let label = (state.language === 'azaaraan' && raw === 'SPACE') ? 'Aza’raan' : (azaLetters && raw === 'AZA_GLOTTAL') ? 'ʔ' : (azaLetters && raw === 'AZA_CLICK') ? '¡' : (azaLetters && raw === 'AZA_PREV') ? '‹' : (azaLetters && raw === 'AZA_NEXT') ? '›' : (labels[raw] || effective(raw));
        if (raw === 'PAGE') label = `${state.page + 1}/2`;
        if (!azaLetters && state.mode === 'letters' && state.shift && letters(raw)) label = data.shiftMap[raw];
        if (azaLetters && window.AzaaraanBridge.isLetter(raw)) { label = raw; button.classList.add('aza-key', 'aza-'+state.era.toLowerCase()); button.dataset.roman = raw; }
        button.append(make('span', 'key-label', label));
        if (azaLetters && window.AzaaraanBridge.isLetter(raw)) {
          const art=window.AzaaraanBridge.art(raw,state.era);
          if(art){const img=make('img','key-glyph-art');img.src=art;img.alt='';img.setAttribute('aria-hidden','true');if(state.era==='Modern')alignModernKeyArt(img,raw);button.append(img)}
          else button.append(make('span', 'key-symbol', window.AzaaraanBridge.glyph(raw,state.era)));
        }
        if (state.language==='azaaraan' && state.mode==='symbols' && window.AzaaraanBridge.symbol(raw)) {
          const value=window.AzaaraanBridge.symbol(raw);button.title=`${raw} → ${value}`;
          if(state.era==='Modern'){
            const names={',':'comma','.':'period','?':'question','!':'exclamation','"':'quotes','(':'open-parenthesis',')':'close-parenthesis','&':'ampersand'};
            const folder=/^[0-9]$/.test(raw)?'numbers':'punctuation',file=folder==='numbers'?raw:names[raw];
            if(file){const img=make('img','key-glyph-art');img.src=`assets/keyboard/modern/${folder}/${file}.png`;img.alt='';img.setAttribute('aria-hidden','true');button.append(img)}
          }
        }
        if (!azaLetters && state.mode === 'letters' && letters(raw) && !state.shift) {
          button.classList.add('has-hint'); button.append(make('span', 'key-symbol', data.shiftMap[raw]));
        }
        if (['SHIFT', 'BACK', 'ENTER', 'SYMBOLS', 'ABC', 'PAGE', 'AZA_GLOTTAL', 'AZA_CLICK', 'AZA_PREV', 'AZA_NEXT'].includes(raw)) button.classList.add('wide');
        if (raw === 'SPACE') button.classList.add('space');
        if (raw === 'SHIFT') { button.classList.toggle('active', !!state.shift); button.setAttribute('aria-pressed', String(!!state.shift)); if (state.shift === 2) button.querySelector('.key-label').textContent = '⇧•'; }
        button.setAttribute('aria-label', azaLetters && window.AzaaraanBridge.isLetter(raw) ? `${raw}, hold for diacritics and subscripts` : aria[raw] || (raw.startsWith('AZA_') ? 'Aza’raan special sign' : `${label}${letters(raw) ? ', hold for accents' : ''}`));
        if(azaLetters && window.AzaaraanBridge.isLetter(raw))button.title=`${raw} · hold for diacritics and subscripts`;
        row.append(button);
      }
      if (row.children.length) rows.append(row);
    });
    if (!rows.children.length) rows.append(make('div', 'key empty-message', 'No keys in this layout.'));
    keyboard.querySelector('[data-tool="case"]').hidden = state.language === 'azaaraan';
    keyboard.querySelector('[data-tool="case"]').setAttribute('aria-pressed', String(state.caps));
    $('keyHint').textContent = state.language === 'azaaraan' ? 'Hold for marks and subscripts' : state.shift === 2 ? 'Symbols locked' : 'Hold for accents';
    $('footerMode').textContent = state.language === 'azaaraan' ? 'Aza’raan · '+state.era : 'QWERTY · English (US)';
    $('languageSelect').value=state.language;
    $('eraSelectWrap').hidden=state.language!=='azaaraan';
    $('eraSelect').value=state.era;
    notes.setWritingMode(state.language,state.era);
    drawFrame();
  }
  function handleKey(raw) {
    if (state.language === 'azaaraan' && state.mode === 'letters' && window.AzaaraanBridge.handle(raw,state.era,notes)) return;
    if (raw === 'SHIFT') {
      const now = performance.now();
      if (state.shift === 1 && now - lastShift < 420) state.shift = 2;
      else state.shift = state.shift ? 0 : 1;
      lastShift = now; render(); return;
    }
    if (raw === 'SYMBOLS' || raw === 'ABC') { state.mode = raw === 'ABC' ? 'letters' : 'symbols'; state.page = 0; state.shift = 0; render(); return; }
    if (raw === 'PAGE') { state.page = 1 - state.page; render(); return; }
    if (raw === 'BACK') { notes.backspace(); return; }
    if (raw === 'SPACE') { notes.insert(' '); return; }
    if (raw === 'ENTER') { notes.insert('\n'); return; }
    if(state.language==='azaaraan'){
      const result=window.AzaaraanBridge.physicalValue(raw,state.era);
      if(result?.value!=null)notes.insert(result.value);
      else notes.toast(result?.error||'That key is not assigned in Aza’raan.');
      return;
    }
    notes.insert(state.mode === 'letters' && state.shift && letters(raw) ? data.shiftMap[raw] : effective(raw));
    if (state.shift === 1) { state.shift = 0; render(); }
  }
  function cancelPress() {
    if (!press) return;
    clearTimeout(press.timer); clearInterval(press.repeat); press.button?.classList.remove('is-held'); press = null;
  }
  rows.addEventListener('pointerdown', event => {
    const button = event.target.closest('[data-key]');
    if (!button || event.button !== 0 || gesture) return;
    event.preventDefault(); cancelPress();
    const raw = button.dataset.key, key = effective(raw);
    const current = { button, raw, id: event.pointerId, x: event.clientX, y: event.clientY, held: false };
    press = current; button.classList.add('is-held');
    if (raw === 'BACK') current.timer = setTimeout(() => { if (press !== current) return; current.held = true; notes.backspace(); current.repeat = setInterval(() => notes.backspace(), 70); }, 480);
    else if ((state.language === 'azaaraan' && state.mode === 'letters' && window.AzaaraanBridge.isLetter(raw)) || letters(raw) || data.symbols[key]) current.timer = setTimeout(() => { if (press !== current) return; current.held = true; button.classList.remove('is-held'); state.language === 'azaaraan' && state.mode === 'letters' ? showAza(raw) : showAccents(key); }, 480);
  });
  document.addEventListener('pointermove', event => {
    if (!press || event.pointerId !== press.id) return;
    if (!press.held && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 14) cancelPress();
  });
  document.addEventListener('pointerup', event => {
    if (!press || event.pointerId !== press.id) return;
    const current = press; cancelPress();
    if (current.held) ignoredClickPointer = event.pointerId;
    if (!current.held && current.button.contains(document.elementFromPoint(event.clientX, event.clientY))) handleKey(current.raw);
  });
  document.addEventListener('click', event => {
    if (ignoredClickPointer !== null && event.pointerId === ignoredClickPointer) {
      ignoredClickPointer = null; event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('pointercancel', cancelPress);
  window.addEventListener('blur', () => { cancelPress(); gesture = null; });
  rows.addEventListener('click', event => {
    if (event.detail !== 0 || event.pointerType) return; // Only keyboard/AT activation; touch clicks can have detail=0.
    const button = event.target.closest('[data-key]');
    if (button) handleKey(button.dataset.key);
  });
  rows.addEventListener('keydown', event => {
    const button = event.target.closest('[data-key]');
    if (button && event.key === 'ArrowDown' && (letters(button.dataset.key) || data.symbols[button.dataset.key])) { event.preventDefault(); state.language === 'azaaraan' && state.mode === 'letters' ? showAza(button.dataset.key) : showAccents(effective(button.dataset.key)); }
  });
  keyboard.addEventListener('contextmenu', event => {
    event.preventDefault();
    const button = event.target.closest('[data-key]');
    if (!button) return;
    const raw = button.dataset.key;
    if (state.language === 'azaaraan' && state.mode === 'letters' && window.AzaaraanBridge.isLetter(raw)) showAza(raw);
    else if (letters(raw)) showAccents(effective(raw));
  });
  keyboard.addEventListener('pointerdown', event => {
    if (event.target.closest('button') && !event.target.closest('input,textarea')) event.preventDefault();
  });
  $('keyboardToolbar').addEventListener('click', event => {
    const button = event.target.closest('[data-tool]');
    if (!button) return;
    if (button.dataset.tool === 'case') { state.caps = !state.caps; render(); }
    if (button.dataset.tool === 'emoji') showEmoji();
    if (button.dataset.tool === 'clipboard') showClipboard();
    if (button.dataset.tool === 'capture') window.PrintScreen.capture();
    if (button.dataset.tool === 'sound') window.AzaaraanBridge.speakSelection();
    if (button.dataset.tool === 'settings') window.AzaaraanBridge.openSettings();
  });
  $('collapseKeyboard').onclick = collapse;
  $('languageSelect').addEventListener('change',event=>{
    state.language=event.target.value==='azaaraan'?'azaaraan':'qwerty';state.mode='letters';state.page=0;state.shift=0;
    closePanel();render();window.AzaaraanBridge.saveChoice(state.language,state.era);
  });
  $('eraSelect').addEventListener('change',event=>{
    if (!window.AZA_CONFIG.eras.includes(event.target.value))return;
    state.era=event.target.value;closePanel();render();window.AzaaraanBridge.saveChoice(state.language,state.era);
  });

  function panel(title, count) {
    rows.hidden = true; $('keyPanel').hidden = false;
    $('panelTitle').textContent = title; $('panelCount').textContent = count || '';
    $('panelTabs').replaceChildren(); $('panelContent').replaceChildren(); $('panelContent').scrollTop = 0;
  }
  function closePanel() { state.panel = null; rows.hidden = false; $('keyPanel').hidden = true; $('panelContent').replaceChildren(); }
  $('panelBack').onclick = () => { closePanel(); notes.focus(); };
  function tab(label, active, callback) {
    const button = make('button', '', label); button.type = 'button'; button.setAttribute('aria-pressed', String(active)); button.onclick = callback; $('panelTabs').append(button);
  }
  function choice(item, callback, emoji = false) {
    const button = make('button', 'choice' + (emoji ? ' emoji-choice' : ''), item.label || item.value);
    button.type = 'button'; button.title = item.name || item.value; button.setAttribute('aria-label', `${item.name || item.value}${item.cp ? ' ' + item.cp : ''}`);
    button.dataset.value = item.value; button.onclick = () => callback(item); return button;
  }
  function showAccents(base, section = 'letters', stack = []) {
    state.panel = { type: 'accents', base, section, stack };
    const forms = letters(base) ? data.letters[base] || [] : data.symbols[base] || [];
    panel(`Accents · ${base}`, section === 'letters' ? `${forms.length + 1} forms` : `${data.marks.length} marks`);
    tab('Letter forms', section === 'letters', () => showAccents(base));
    if (letters(base)) tab('Build accents', section === 'marks', () => showAccents(base, 'marks', stack));
    if (section === 'letters') {
      const grid = make('div', 'choices-grid');
      for (const item of [{ value: base, name: 'Plain ' + base }, ...forms]) grid.append(choice(item, selected => { notes.insert(selected.value); if (state.shift === 1) { state.shift = 0; render(); } closePanel(); }));
      $('panelContent').append(grid);
    } else {
      const builder = make('div', 'builder'), toolbar = make('div', 'builder-top');
      const preview = make('output', 'builder-preview', (base + stack.join('')).normalize('NFC')); preview.setAttribute('aria-label', 'Accent preview');
      const undo = make('button', '', '⌫'), clear = make('button', '', 'Reset'), insert = make('button', 'insert-accent', 'Insert');
      undo.title = 'Remove last combining mark'; undo.setAttribute('aria-label', undo.title);
      undo.onclick = () => { stack.pop(); preview.textContent = (base + stack.join('')).normalize('NFC'); };
      clear.onclick = () => { stack.length = 0; preview.textContent = base; };
      insert.onclick = () => { notes.insert((base + stack.join('')).normalize('NFC')); if (state.shift === 1) { state.shift = 0; render(); } closePanel(); };
      toolbar.append(preview, undo, clear, insert);
      const scroller = make('div', 'builder-grid'), grid = make('div', 'choices-grid');
      for (const item of data.marks) grid.append(choice({ ...item, label: '◌' + item.value }, selected => { stack.push(selected.value); preview.textContent = (base + stack.join('')).normalize('NFC'); }));
      scroller.append(grid); builder.append(toolbar, scroller); $('panelContent').append(builder);
    }
  }
  function showAza(base, view='compose', saved=null) {
    const bridge=window.AzaaraanBridge, era=state.era;
    if(!bridge.isLetter(base))return;
    const draft=saved||{marks:[],specials:[],subs:[],target:'base'};
    state.panel={type:'azaaraan',base,view};
    panel(`Aza’raan · ${base} · ${era}`,'Hold to compose · two diacritics per target · two subscripts');
    tab('Diacritics + subscripts',view==='compose',()=>showAza(base,'compose',draft));
    tab('Readings',view==='sounds',()=>showAza(base,'sounds',draft));
    if(view==='sounds'){
      const grid=make('div','choices-grid aza-choices');
      const simple=bridge.tryEncode(base,[],era);
      grid.append(choice({value:simple.value,label:'Base '+base},()=>{notes.insert(simple.value,simple.token);closePanel();}));
      for(const option of bridge.soundOptions(base,era)){
        const result=bridge.tryEncode(option.base,option.marks,era);
        if(result.error)continue;
        const button=make('button','choice aza-choice');button.type='button';
        const visual=make('span','aza-choice-glyph aza-'+era.toLowerCase());
        visual.append(bridge.preview(base,option.marks,era)||document.createTextNode(result.value));
        button.append(visual,make('span','aza-choice-name',option.label+' · '+option.ipa));
        button.onclick=()=>{notes.insert(result.value,result.token);closePanel()};grid.append(button);
      }
      $('panelContent').append(make('p','emoji-help','Tap a reading to insert it, or build a letter with diacritics and up to two subscripts.'),grid);
      return;
    }
    const builder=make('div','builder aza-builder');
    const preview=make('output','builder-preview aza-glyph-preview aza-'+era.toLowerCase());
    const status=make('small','aza-mark-warning');
    const actions=make('div','builder-top');
    const undo=make('button','','Undo'),clear=make('button','','Clear'),insert=make('button','insert-accent','Insert glyph');
    const target=make('select','aza-target');target.setAttribute('aria-label','Attach marks to');
    const targets=make('div','aza-target-row');targets.append(make('label','','Attach to '),target);
    const subtitle=make('p','emoji-help',era==='Modern'?'Select up to two subscripts (20% letter-body size); choose Independent or Subscript in Attach to, then add up to two primary/secondary diacritics. Click and glottal sit above the independent letter.':'Choose a historical subscript, then attach era-available marks. The independent letter, its marks, and up to two subscripts are composed together.');
    const subGrid=make('div','choices-grid aza-sub-grid');
    const markGrid=make('div','choices-grid aza-mark-grid');
    const assets=window.AZ_ASSETS||{};
    const assetImg=(src,css)=>{if(!src)return null;const img=make('img',css);img.src=src;img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');return img;};
    function currentMarks(){return draft.target==='base'?draft.marks:draft.subs[Number(draft.target.slice(3))]?.marks}
    function draw(){
      const result=bridge.tryEncode(base,draft.marks,era,draft.subs,draft.specials);
      preview.replaceChildren(result.value?(bridge.preview(base,draft.marks,era,draft.subs,draft.specials)||document.createTextNode(result.value)):document.createTextNode('—'));
      status.textContent=result.error||`${result.value} · ${draft.marks.length}/2 main marks · ${draft.subs.length}/2 subscripts`;
      insert.disabled=!!result.error;
      target.replaceChildren();
      for(const [value,label] of [['base','Independent '+base],...draft.subs.map((s,i)=>['sub'+i,'Subscript '+(i+1)+' · '+s.key])]){
        const option=make('option','',label);option.value=value;target.append(option);
      }
      if(![...target.options].some(o=>o.value===draft.target))draft.target='base';target.value=draft.target;
      for(const button of markGrid.querySelectorAll('[data-mark]')){
        const id=button.dataset.mark,isSpecial=button.hasAttribute('data-special'),sub=draft.target!=='base';
        const selected=(isSpecial?draft.specials:currentMarks()||[]).includes(id);
        button.setAttribute('aria-pressed',String(selected));
        button.disabled=(sub&&(isSpecial||id==='separate'))||(era==='Modern'&&draft.target==='base'&&id==='separate'&&!['A','E','I','O','W','Y'].includes(base));
        const image=button.querySelector('.aza-mark-art');if(image)image.src=(sub?assets.secondary?.[id]:assets.primary?.[id])||image.src;
        button.title=(sub?'Secondary mark on subscript: ':'Primary mark on independent letter: ')+bridge.markName(id);
      }
      for(const button of subGrid.querySelectorAll('[data-sub]'))button.setAttribute('aria-pressed',String(draft.subs.some(s=>s.key===button.dataset.sub)));
    }
    target.onchange=()=>{draft.target=target.value;draw()};
    undo.onclick=()=>{if(draft.target==='base'){if(draft.specials.length)draft.specials.pop();else draft.marks.pop()}else currentMarks()?.pop();draw()};
    clear.onclick=()=>{draft.marks=[];draft.specials=[];draft.subs=[];draft.target='base';draw()};
    insert.onclick=()=>{const result=bridge.tryEncode(base,draft.marks,era,draft.subs,draft.specials);if(result.error)return notes.toast(result.error);notes.insert(result.value,result.token);closePanel()};
    actions.append(preview,undo,clear,insert);
    for(const key of bridge.availableSubscripts(era)){
      const button=make('button','choice aza-sub-option');button.type='button';button.dataset.sub=key;
      button.append(make('span','aza-sub-latin',key));
      if(era==='Modern'){const img=assetImg(assets.subscripts?.[key],'aza-sub-art');if(img)button.append(img)}
      else {const sign=make('span','aza-sub-era-glyph aza-'+era.toLowerCase(),window.AZ_CANON.subs[key]||window.AZ_CANON.coeng+window.AZA_HISTORICAL_U);button.append(sign)}
      button.title='Subscript '+key+' · '+(window.AZ_CANON.subs[key]||window.AZ_CANON.coeng+window.AZA_HISTORICAL_U);
      button.onclick=()=>{const i=draft.subs.findIndex(s=>s.key===key);if(i>=0){draft.subs.splice(i,1);draft.target='base'}else if(draft.subs.length<2){draft.subs.push({key,marks:[]});draft.target='sub'+(draft.subs.length-1)}else return notes.toast('Maximum two subscripts.');draw()};subGrid.append(button);
    }
    for(const mark of bridge.availableMarks(era)){
      const button=make('button','choice aza-mark-option');button.type='button';button.dataset.mark=mark.id;
      if(mark.special)button.dataset.special='true';
      const thumb=assetImg(era==='Modern'?assets.primary?.[mark.id]:null,'aza-mark-art');
      if(thumb)button.append(thumb);
      button.append(make('span','aza-mark-symbol',mark.display),make('span','aza-mark-text',mark.name+' · '+mark.codepoint));
      button.title=mark.name+' · '+mark.codepoint;
      button.onclick=()=>{
        if(mark.special&&draft.target!=='base')return notes.toast('Special controls attach to the independent letter.');
        if(mark.id==='separate'&&draft.target!=='base')return notes.toast('Separated Vowel attaches to the independent letter.');
        const list=mark.special?draft.specials:currentMarks();if(!list)return;
        const i=list.indexOf(mark.id);if(i>=0)list.splice(i,1);else if(list.length<(mark.special?4:2))list.push(mark.id);else return notes.toast(mark.special?'Maximum four special controls.':'Maximum two phonetic marks on this target.');draw();
      };markGrid.append(button);
    }
    builder.append(actions,status,subtitle,targets,make('h4','','Dependent / subscript letters'),subGrid,make('h4','','Diacritics, click, glottal and emphasis'),markGrid);
    $('panelContent').append(builder);draw();
  }

  function showEmoji(category = Object.keys(data.emoji)[0], initialQuery = '') {
    state.panel = { type: 'emoji', category }; panel('Emoji · Emojipedia', 'Unicode characters');
    for (const name of Object.keys(data.emoji)) tab(name, name === category, () => showEmoji(name));
    const controls = make('div', 'emoji-controls');
    const search = make('input', 'emoji-search');
    search.type = 'search'; search.placeholder = 'Search emojis by name…';
    search.value = initialQuery; search.autocomplete = 'off';
    search.setAttribute('aria-label', 'Search emojis');
    const reference = make('a', 'emoji-source', 'Browse Emojipedia');
    reference.href = 'https://emojipedia.org/'; reference.target = '_blank'; reference.rel = 'noopener noreferrer';
    reference.title = 'Browse emoji names and meanings on Emojipedia (opens a new tab)';
    controls.append(search, reference);
    const subtitle = make('p', 'emoji-help', 'Tap to insert. Emojipedia is an external reference; designs use your device’s native emoji font.');
    const grid = make('div', 'choices-grid');
    const resultInfo = make('p', 'emoji-results');
    function fill() {
      const term = search.value.trim().toLocaleLowerCase();
      reference.href = term ? 'https://emojipedia.org/search?q=' + encodeURIComponent(term) : 'https://emojipedia.org/';
      reference.textContent = term ? 'Search Emojipedia' : 'Browse Emojipedia';
      const items = term ? [...new Set(Object.values(data.emoji).flat())] : data.emoji[category];
      grid.replaceChildren();
      let count = 0;
      for (const value of items) {
        const name = data.emojiNames?.[value] || value;
        if (term && !name.includes(term) && !value.includes(term)) continue;
        if (++count > 400) break; // Keep very large search result sets responsive on phones.
        const button = choice({ value, name }, selected => notes.insert(selected.value), true);
        grid.append(button);
      }
      resultInfo.textContent = count ? (term ? `${count} matching emoji${count === 400 ? ' (first 400)' : ''}` : `${count} emojis in this category`) : 'No matching emojis. Try a different word.';
    }
    search.addEventListener('input', fill);
    $('panelContent').append(controls, subtitle, resultInfo, grid);
    fill();
  }
  function showClipboard() {
    state.panel = { type: 'clipboard' }; panel('Clipboard');
    const actions = make('div', 'clipboard-actions');
    for (const [label, callback] of [['Copy', () => notes.copy()], ['Paste', async () => { if (await notes.paste()) closePanel(); }], ['Select all', () => notes.selectAll()]]) {
      const button = make('button', '', label); button.onclick = callback; actions.append(button);
    }
    const help = make('p', 'clipboard-help', 'You can also paste text in this box and insert it into your note.');
    const field = make('textarea', 'clipboard-text'); field.value = notes.getClipboard(); field.placeholder = 'Paste text here…'; field.setAttribute('aria-label', 'Clipboard text');
    const insert = make('button', '', 'Insert'); insert.onclick = () => { if (field.value) { notes.setClipboard(field.value); notes.insert(field.value); closePanel(); } };
    const bottom = make('div', 'clipboard-actions'); bottom.append(insert); $('panelContent').append(actions, help, field, bottom);
  }
  // Hardware and mobile keyboards must use the same canonical encoder as the
  // steampunk keys. QWERTY deliberately keeps the browser's native Latin input.
  function writableTarget(node){
    const el=node?.closest?.('input,textarea,[contenteditable=true]')||null;
    return notes.isEditable(el)?el:null;
  }
  function writePhysical(value){
    if(value?.error){notes.toast(value.error);return;}
    if(value?.value!=null)notes.insert(value.value,value.token);
  }
  document.addEventListener('keydown',event=>{
    if(state.language!=='azaaraan'||event.defaultPrevented||event.isComposing||
       event.key==='Dead'||event.key==='Process'||event.ctrlKey||event.metaKey||event.altKey)return;
    if(!writableTarget(event.target))return;
    const result=window.AzaaraanBridge.physicalValue(event.key,state.era);
    if(!result)return;
    event.preventDefault();
    event.stopPropagation();
    writePhysical(result);
  },true);
  document.addEventListener('beforeinput',event=>{
    if(state.language!=='azaaraan'||event.defaultPrevented||event.isComposing||
       !['insertText','insertReplacementText','insertFromComposition'].includes(event.inputType)||!writableTarget(event.target))return;
    if(!event.data)return;
    const chars=[...event.data];
    const pieces=chars.map(c=>window.AzaaraanBridge.physicalValue(c,state.era));
    // No browser fallback to ordinary Khmer or Latin when Aza’raan is selected.
    if(!pieces.length)return;
    if(pieces.every(x=>x===null)){
      if(!/[\u1780-\u17FF]/u.test(event.data))return;
      if(event.cancelable){event.preventDefault();notes.toast('Khmer input is blocked in Aza’raan mode. Use Latin keys to type Aza’raan glyphs.');}
      return;
    }
    if(!event.cancelable)return;
    event.preventDefault();
    const invalid=pieces.find(x=>!x||x.error);
    if(invalid){notes.toast(invalid.error||'This input has no Aza’raan equivalent.');return;}
    for(const piece of pieces)notes.insert(piece.value,piece.token);
  },true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.panel && !document.querySelector('dialog[open]')) { event.preventDefault(); closePanel(); notes.focus(); }
  });

  function startGesture(event, type, direction) {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault(); cancelPress();
    gesture = { id: event.pointerId, type, direction, x: event.clientX, y: event.clientY, frame: { ...frame }, bubble: { ...bubblePosition }, moved: false, node: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging');
  }
  function resizeFrom(origin, direction, dx, dy) {
    const b = bounds(), minW = Math.min(280, b.width), minH = Math.min(220, b.height);
    let left = origin.x, right = origin.x + origin.width, top = origin.y, bottom = origin.y + origin.height;
    if (direction.includes('w')) left = clamp(origin.x + dx, b.x, right - minW);
    if (direction.includes('e')) right = clamp(origin.x + origin.width + dx, left + minW, b.x + b.width);
    if (direction.includes('n')) top = clamp(origin.y + dy, b.y, bottom - minH);
    if (direction.includes('s')) bottom = clamp(origin.y + origin.height + dy, top + minH, b.y + b.height);
    frame = { x: left, y: top, width: right - left, height: bottom - top }; drawFrame();
  }
  function resizeBubble(size){bubbleSize=clamp(size,56,Math.min(240,bounds().width,bounds().height));drawBubble();try{localStorage.setItem('azaaraan-bubble-size',String(bubbleSize))}catch{}}
  document.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 5) gesture.moved = true;
    if (gesture.type === 'bubble') { bubblePosition = { x: gesture.bubble.x + dx, y: gesture.bubble.y + dy }; drawBubble(); }
    if (gesture.type === 'bubble-resize') resizeBubble(gesture.size+Math.max(dx,dy));
    if (gesture.type === 'move') { frame.x = gesture.frame.x + dx; frame.y = gesture.frame.y + dy; drawFrame(); }
    if (gesture.type === 'resize') resizeFrom(gesture.frame, gesture.direction, dx, dy);
  }, { passive: false });
  function endGesture(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const previous = gesture; gesture = null; previous.node.classList.remove('is-dragging');
    if (previous.type === 'bubble'||previous.type === 'bubble-resize') {
      bubbleClickSuppressed = previous.type === 'bubble-resize' || previous.moved || event.type !== 'pointerup';
      // Expand on click, after the browser has fixed its event target. Expanding
      // on pointerup can retarget a phone's follow-up click to a key underneath.
      if (bubbleClickSuppressed) setTimeout(() => { bubbleClickSuppressed = false; }, 450);
    }
  }
  document.addEventListener('pointerup', endGesture);
  document.addEventListener('pointercancel', endGesture);
  bubble.addEventListener('pointerdown', event => startGesture(event, 'bubble'));
  const bubbleHandle=make('span','bubble-resize-handle','⤡');bubbleHandle.setAttribute('aria-hidden','true');bubble.append(bubbleHandle);
  bubbleHandle.addEventListener('pointerdown',event=>{event.stopPropagation();startGesture(event,'bubble-resize');if(gesture)gesture.size=bubbleSize});
  bubble.addEventListener('contextmenu', event => event.preventDefault());
  bubble.addEventListener('click', () => { if (!bubbleClickSuppressed) open(); });
  bubble.addEventListener('wheel',event=>{if(!event.altKey)return;event.preventDefault();resizeBubble(bubbleSize+(event.deltaY<0?10:-10))},{passive:false});
  $('dragBar').addEventListener('pointerdown', event => startGesture(event, 'move'));
  keyboard.querySelectorAll('[data-resize]').forEach(handle => {
    handle.addEventListener('pointerdown', event => startGesture(event, 'resize', handle.dataset.resize));
    handle.addEventListener('keydown', event => {
      const delta = event.shiftKey ? 1 : 10, dx = event.key === 'ArrowLeft' ? -delta : event.key === 'ArrowRight' ? delta : 0;
      const dy = event.key === 'ArrowUp' ? -delta : event.key === 'ArrowDown' ? delta : 0;
      if (dx || dy) { event.preventDefault(); resizeFrom({ ...frame }, handle.dataset.resize, dx, dy); }
    });
  });
  for (const node of [bubble, $('dragBar')]) node.addEventListener('keydown', event => {
    const delta = event.shiftKey ? 1 : 10, dx = event.key === 'ArrowLeft' ? -delta : event.key === 'ArrowRight' ? delta : 0;
    const dy = event.key === 'ArrowUp' ? -delta : event.key === 'ArrowDown' ? delta : 0;
    if (!dx && !dy) return;
    event.preventDefault();
    if (node === bubble) {if(event.altKey)resizeBubble(bubbleSize+(dx||dy));else{bubblePosition.x += dx; bubblePosition.y += dy; drawBubble();}}
    else { frame.x += dx; frame.y += dy; drawFrame(); }
  });
  function viewportChanged() { if (state.open) drawFrame(); else drawBubble(); }
  addEventListener('resize', viewportChanged);
  window.visualViewport?.addEventListener('resize', viewportChanged);
  window.visualViewport?.addEventListener('scroll', viewportChanged);
  const b = bounds(); bubblePosition = { x: b.x + b.width - 162, y: b.y + b.height - 162 };
  const preference=window.AzaaraanBridge.loadChoice();state.language=preference.language;state.era=preference.era;
  render(); drawBubble();
  window.FloatingKeyboard = { open, collapse, bounds, getState: () => ({ ...state, frame: { ...frame }, bubble: { ...bubblePosition } }) };
})();
