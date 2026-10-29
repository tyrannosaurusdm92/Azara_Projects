/* Floating frame and keyboard. Pointer Events support mouse, touch and pen. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), data = window.KeyboardData, notes = window.Notes;
  const keyboard = $('keyboard'), bubble = $('keyboardBubble'), rows = $('keyRows');
  const embedded = new URLSearchParams(location.search).get('awsEmbed') === '1' || /\/embed\.html$/.test(location.pathname);
  const state = { open: false, mode: 'letters', page: 0, caps: false, shift: 0, panel: null, language: 'qwerty', era: 'Modern' };
  let frame = { x: 0, y: 0, width: 860, height: 410 }, bubblePosition = { x: 0, y: 0 };
  let gesture = null, press = null, lastShift = 0, bubbleClickSuppressed = false, ignoredClickPointer = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));
  const letters = key => /^[a-z]$/i.test(key);
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  function bounds() {
    if (embedded) return { x: 0, y: 0, width: Math.max(1, innerWidth), height: Math.max(1, innerHeight) };
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
    if (embedded) {
      frame = { x: 0, y: 0, width: b.width, height: b.height };
      return;
    }
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
    if (embedded) return;
    const b = bounds(), size = Math.min(150, b.width, b.height);
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
    if (embedded) { resizeTo(); return; }
    if (state.open) return;
    const size = defaultSize();
    frame = { ...size, x: bubblePosition.x + 75 - size.width / 2, y: bubblePosition.y + 75 - size.height / 2 };
    state.open = true; bubble.hidden = true; keyboard.hidden = false; drawFrame();
  }
  function collapse() {
    if (embedded) return;
    cancelPress(); gesture = null;
    bubblePosition = { x: frame.x + frame.width - 150, y: frame.y + frame.height - 150 };
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
        let label = (azaLetters && raw === 'SPACE') ? 'Aza’raan' : (azaLetters && raw === 'AZA_GLOTTAL') ? 'ʔ' : (azaLetters && raw === 'AZA_CLICK') ? '¡' : (azaLetters && raw === 'AZA_PREV') ? '‹' : (azaLetters && raw === 'AZA_NEXT') ? '›' : (labels[raw] || effective(raw));
        if (raw === 'PAGE') label = `${state.page + 1}/2`;
        if (!azaLetters && state.mode === 'letters' && state.shift && letters(raw)) label = data.shiftMap[raw];
        if (azaLetters && window.AzaaraanBridge.isLetter(raw)) { label = window.AzaaraanBridge.glyph(raw, state.era); button.classList.add('aza-key', 'aza-'+state.era.toLowerCase()); button.dataset.roman = raw; }
        button.append(make('span', 'key-label', label));
        if (azaLetters && window.AzaaraanBridge.isLetter(raw)) button.append(make('span', 'key-symbol', raw));
        if (!azaLetters && state.mode === 'letters' && letters(raw) && !state.shift) {
          button.classList.add('has-hint'); button.append(make('span', 'key-symbol', data.shiftMap[raw]));
        }
        if (['SHIFT', 'BACK', 'ENTER', 'SYMBOLS', 'ABC', 'PAGE', 'AZA_GLOTTAL', 'AZA_CLICK', 'AZA_PREV', 'AZA_NEXT'].includes(raw)) button.classList.add('wide');
        if (raw === 'SPACE') button.classList.add('space');
        if (raw === 'SHIFT') { button.classList.toggle('active', !!state.shift); button.setAttribute('aria-pressed', String(!!state.shift)); if (state.shift === 2) button.querySelector('.key-label').textContent = '⇧•'; }
        button.setAttribute('aria-label', azaLetters && window.AzaaraanBridge.isLetter(raw) ? `${raw}: ${label}, hold to choose Aza’raan sounds and accents` : aria[raw] || (raw.startsWith('AZA_') ? 'Aza’raan special sign' : `${label}${letters(raw) ? ', hold for accents' : ''}`));
        button.title = azaLetters && window.AzaaraanBridge.isLetter(raw) ? `${raw} · hold for pronunciation and up to 3 accents` : (letters(raw) ? `${effective(raw)} · hold for accents` : aria[raw] || label);
        row.append(button);
      }
      if (row.children.length) rows.append(row);
    });
    if (!rows.children.length) rows.append(make('div', 'key empty-message', 'No keys in this layout.'));
    keyboard.querySelector('[data-tool="case"]').hidden = state.language === 'azaaraan';
    keyboard.querySelector('[data-tool="case"]').setAttribute('aria-pressed', String(state.caps));
    $('keyHint').textContent = state.language === 'azaaraan' ? 'Hold for Aza’raan sounds' : state.shift === 2 ? 'Symbols locked' : 'Hold for accents';
    $('footerMode').textContent = state.language === 'azaaraan' ? 'Aza’raan · '+state.era : 'QWERTY · English (US)';
    $('languageSelect').value=state.language;
    $('eraSelectWrap').hidden=state.language!=='azaaraan';
    $('eraSelect').value=state.era;
    const awsLayout=$('awsLayoutSelect');
    if(awsLayout) awsLayout.value=state.language==='azaaraan'?state.era.toLowerCase():'standard';
    document.getElementById('note').classList.toggle('aza-writing',state.language==='azaaraan');
    for(const era of ['Archaic','Classical','Traditional','Modern']) document.getElementById('note').classList.toggle('era-'+era.toLowerCase(),state.language==='azaaraan' && state.era===era);
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
  $('awsLayoutSelect')?.addEventListener('change',event=>{
    const eraByLayout={archaic:'Archaic',classical:'Classical',traditional:'Traditional',modern:'Modern'};
    const selected=event.target.value;
    state.language=selected==='standard'?'qwerty':'azaaraan';
    if(eraByLayout[selected]) state.era=eraByLayout[selected];
    state.mode='letters';state.page=0;state.shift=0;
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
  function showAza(base, view='sounds', selectedMarks=[]) {
    if (!window.AzaaraanBridge.isLetter(base)) return;
    state.panel = { type:'azaaraan', base, view };
    const bridge=window.AzaaraanBridge, era=state.era;
    panel(`Aza’raan · ${base} · ${era}`,view==='sounds'?'Choose a pronunciation':'Maximum 3 marks');
    tab('Pronunciation choices',view==='sounds',()=>showAza(base,'sounds'));
    tab('Build 24 accents',view==='marks',()=>showAza(base,'marks',selectedMarks));
    if(view==='sounds'){
      const list=bridge.soundOptions(base,era),grid=make('div','choices-grid aza-choices');
      const simple=bridge.encode(base,[],era);
      grid.append(choice({value:simple,label:bridge.glyph(base,era)+' · Base '+base},()=>{notes.insert(simple);closePanel();}));
      for(const option of list){
        const glyph=bridge.encode(option.base,option.marks,era);
        const button=make('button','choice aza-choice');button.type='button';
        const g=make('span','aza-choice-glyph aza-'+era.toLowerCase(),glyph);
        const name=make('span','aza-choice-name',option.label+' · /'+option.ipa+'/');
        button.append(g,name);
        button.addEventListener('click',()=>{notes.insert(glyph);closePanel();});
        grid.append(button);
      }
      const info=make('p','emoji-help','The displayed letter is drawn with the selected era font. Inserted characters use the source Khmer Unicode encoding; historically shared glyphs can have multiple sound names.');
      $('panelContent').append(info,grid);
    } else {
      const selections=[...selectedMarks];
      const builder=make('div','builder aza-builder');
      const preview=make('output','builder-preview aza-glyph-preview aza-'+era.toLowerCase());
      const description=make('p','emoji-help','Select up to three different marks (including specials), with at most one vowel. Earlier eras restrict special signs.');
      const action=make('div','builder-top');
      const undo=make('button','','⌫ Undo'),clear=make('button','','Clear'),insert=make('button','insert-accent','Insert glyph');
      const msg=make('small','aza-mark-warning');
      const grid=make('div','choices-grid aza-mark-grid');
      function update(){
        const checked=bridge.tryEncode(base,selections,era); preview.textContent=checked.value||'—';
        msg.textContent=checked.error||selections.map(id=>bridge.markName(id)).join(' + ')||'Base letter';
        insert.disabled=!!checked.error;
        for(const b of grid.querySelectorAll('[data-mark]'))b.setAttribute('aria-pressed',String(selections.includes(b.dataset.mark)));
      }
      undo.onclick=()=>{selections.pop();update()};clear.onclick=()=>{selections.length=0;update()};
      insert.onclick=()=>{const composed=bridge.tryEncode(base,selections,era);if(composed.error){notes.toast(composed.error);return;}notes.insert(composed.value);closePanel();};
      action.append(preview,undo,clear,insert);
      const marks=bridge.availableMarks(era);
      for(const mark of marks){
        const button=make('button','choice aza-mark-option');button.type='button';button.dataset.mark=mark.id;
        const marker=make('span','aza-mark-symbol',mark.display);
        const name=make('span','aza-mark-text',mark.name+' · '+(mark.ipa||mark.meaning||''));
        button.append(marker,name);
        button.title=mark.meaning||mark.name;
        button.onclick=()=>{
          const n=selections.indexOf(mark.id);if(n>=0)selections.splice(n,1);else selections.push(mark.id);
          update();
        };grid.append(button);
      }
      builder.append(action,msg,description,grid);$('panelContent').append(builder);update();
    }
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
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.panel && !document.querySelector('dialog[open]')) { event.preventDefault(); closePanel(); notes.focus(); }
  });

  function startGesture(event, type, direction) {
    if (embedded) return;
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
  document.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 5) gesture.moved = true;
    if (gesture.type === 'bubble') { bubblePosition = { x: gesture.bubble.x + dx, y: gesture.bubble.y + dy }; drawBubble(); }
    if (gesture.type === 'move') { frame.x = gesture.frame.x + dx; frame.y = gesture.frame.y + dy; drawFrame(); }
    if (gesture.type === 'resize') resizeFrom(gesture.frame, gesture.direction, dx, dy);
  }, { passive: false });
  function endGesture(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const previous = gesture; gesture = null; previous.node.classList.remove('is-dragging');
    if (previous.type === 'bubble') {
      bubbleClickSuppressed = previous.moved || event.type !== 'pointerup';
      // Expand on click, after the browser has fixed its event target. Expanding
      // on pointerup can retarget a phone's follow-up click to a key underneath.
      if (bubbleClickSuppressed) setTimeout(() => { bubbleClickSuppressed = false; }, 450);
    }
  }
  document.addEventListener('pointerup', endGesture);
  document.addEventListener('pointercancel', endGesture);
  bubble.addEventListener('pointerdown', event => startGesture(event, 'bubble'));
  bubble.addEventListener('contextmenu', event => event.preventDefault());
  bubble.addEventListener('click', () => { if (!bubbleClickSuppressed) open(); });
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
    if (node === bubble) { bubblePosition.x += dx; bubblePosition.y += dy; drawBubble(); }
    else { frame.x += dx; frame.y += dy; drawFrame(); }
  });
  function resizeTo() {
    if (!embedded) return;
    state.open = true; bubble.hidden = true; keyboard.hidden = false;
    frame = { x: 0, y: 0, width: Math.max(1, innerWidth), height: Math.max(1, innerHeight) };
    drawFrame();
  }
  function viewportChanged() { if (state.open) drawFrame(); else drawBubble(); }
  addEventListener('resize', viewportChanged);
  window.visualViewport?.addEventListener('resize', viewportChanged);
  window.visualViewport?.addEventListener('scroll', viewportChanged);
  if (!embedded) {
    const b = bounds(); bubblePosition = { x: b.x + b.width - 162, y: b.y + b.height - 162 };
  }
  const preference=window.AzaaraanBridge.loadChoice();state.language=preference.language;state.era=preference.era;
  render();
  if (embedded) resizeTo(); else drawBubble();
  window.FloatingKeyboard = { open, collapse, resizeTo, bounds, getState: () => ({ ...state, frame: { ...frame }, bubble: { ...bubblePosition } }) };
})();
