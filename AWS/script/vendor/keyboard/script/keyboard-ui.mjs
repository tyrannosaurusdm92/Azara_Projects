/* Savanski Keyboard v1 — touch UI, sizing, focused color targeting, accents.
   UI/PWA adapter only. Native IME hosts must call or adapt the bridge contract. */
import {
  ACTIONS, DEFAULT_THEME, LAYOUTS, NUMPAD, THEME_ROLES, WIDE_KEYS,
  accentOptions, clamp, deleteLastGrapheme, isAction, layoutFor, metricsFor
} from './keyboard-model.mjs';
import { TASK_MODES, LANGUAGES, isLetter, rowsForTask, suggestionCandidates, typedCharacter } from './workflow-model.mjs';
import { captureScreenshot } from './screenshot.mjs';

const $ = id => document.getElementById(id);
const keyboard = $('savanskiKeyboard');
const grid = $('keyboardGrid');
const numpad = $('numpad');
const popup = $('accentPopup');
const keyPreview = $('keyPreview');
const suggestionsBar = $('wordSuggestions');
const panel = $('designPanel');
const status = $('keyboardStatus');
const demo = $('typingSurface') || $('editor');
const STORAGE = 'savanski-keyboard-v1-visual-preferences';
const PALETTE_KEYS = Object.keys(THEME_ROLES);
const validColor = value => /^#[0-9a-f]{6}$/i.test(String(value || ''));
const nativeHost = () => window.SavanskiNativeBridge;
function mergedVariants(symbol, uppercase = false) {
  const normalized = /^[a-z]$/i.test(symbol)
    ? (uppercase ? symbol.toUpperCase() : symbol.toLowerCase()) : symbol;
  const data = window.SavanskiData?.accents;
  const candidates = data?.letters?.[normalized] || data?.symbols?.[normalized];
  return candidates?.length ? candidates : accentOptions(symbol,uppercase).map(value => ({value,name:`Variant of ${symbol}`,cp:''}));
}
const defaultSettings = () => ({
  split: false, floating: false, minimized: false, numpad: false,
  layout: 'auto', task: 'typing', language: 'en',
  predict: true, doubleSpace: false, longPress: 430, splitGap: 26,
  dockHeight: 390, floatingBox: null, colors: { ...DEFAULT_THEME }
  ,keyScale: 100, leftHalfX:0, leftHalfY:0,rightHalfX:0,rightHalfY:0,leftHalfScale:100,rightHalfScale:100
});

function loadSettings() {
  const initial = defaultSettings();
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    if (!stored || typeof stored !== 'object') return initial;
    return {
      ...initial,
      split: stored.split === true,
      floating: stored.floating === true,
      minimized: stored.minimized === true,
      numpad: stored.numpad === true,
      layout: ['auto','compact','standard','desktop'].includes(stored.layout) ? stored.layout : 'auto',
      task: Object.hasOwn(TASK_MODES,stored.task) ? stored.task : 'typing',
      language: Object.hasOwn(LANGUAGES,stored.language) ? stored.language : 'en',
      predict: stored.predict !== false,
      doubleSpace: stored.doubleSpace === true,
      longPress: [300,430,600,800].includes(+stored.longPress) ? +stored.longPress : 430,
      splitGap: clamp(Number(stored.splitGap) || 26, 8, 100),
      dockHeight: clamp(Number(stored.dockHeight) || 390, 175, 650),
      keyScale: clamp(Number(stored.keyScale) || 100,70,145),
      leftHalfX: clamp(Number(stored.leftHalfX) || 0,-95,95),
      leftHalfY: clamp(Number(stored.leftHalfY) || 0,-70,70),
      rightHalfX: clamp(Number(stored.rightHalfX) || 0,-95,95),
      rightHalfY: clamp(Number(stored.rightHalfY) || 0,-70,70),
      leftHalfScale: clamp(Number(stored.leftHalfScale) || 100,80,120),
      rightHalfScale: clamp(Number(stored.rightHalfScale) || 100,80,120),
      floatingBox: isUsableBox(stored.floatingBox) ? stored.floatingBox : null,
      colors: Object.fromEntries(PALETTE_KEYS.map(key => [key,
        validColor(stored.colors?.[key]) ? stored.colors[key] : DEFAULT_THEME[key]
      ]))
    };
  } catch { return initial; }
}

function isUsableBox(value) {
  return value && ['x','y','w','h'].every(k => Number.isFinite(value[k]));
}

const state = loadSettings();
let currentLayout = '';
let symbols = false;
let shift = false;
let caps = false;
let modifier = { Control: false, Alt: false, Meta: false, AltGraph: false };
let activeEditable = demo;
let pointerKey = null;
let accentAnchor = null;
let selectedRole = 'frame';
let picking = false;
let sizingPointer = null;
let lastWidth = 0;
let lastSpaceAt = 0;
let halfPointer = null;

function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  catch { /* Private mode or storage disabled: UI still works. */ }
}

function say(message) { status.textContent = message; }
function setButton(id, pressed) { $(id).setAttribute('aria-pressed', String(pressed)); }

function viewport() {
  return { w: window.innerWidth, h: window.visualViewport?.height || window.innerHeight };
}

function usableBox(box) {
  const { w, h } = viewport();
  const minW = Math.min(280, w - 8);
  const minH = Math.min(188, h - 8);
  const width = clamp(box.w, minW, Math.max(minW, w - 8));
  const height = clamp(box.h, minH, Math.max(minH, h - 8));
  return {
    x: clamp(box.x, 4, Math.max(4, w - width - 4)),
    y: clamp(box.y, 4, Math.max(4, h - height - 4)),
    w: width, h: height
  };
}

function startingBox() {
  const { w, h } = viewport();
  const width = Math.min(w - 12, Math.max(320, w * .78));
  const height = Math.min(h - 12, Math.max(220, h * .52));
  return usableBox({ x:(w-width)/2, y:(h-height)/2, w:width, h:height });
}

function placeFloating(box, persist = true) {
  state.floatingBox = usableBox(box);
  const { x, y, w, h } = state.floatingBox;
  keyboard.style.setProperty('--sk-left', `${x}px`);
  keyboard.style.setProperty('--sk-top', `${y}px`);
  keyboard.style.setProperty('--sk-width', `${w}px`);
  keyboard.style.setProperty('--sk-height', `${h}px`);
  if (persist) save();
}

function setSizingMode() {
  keyboard.classList.toggle('is-docked', !state.floating);
  keyboard.classList.toggle('is-floating', state.floating);
  keyboard.classList.toggle('is-minimized', state.minimized);
  keyboard.classList.toggle('is-split', state.split);
  keyboard.classList.toggle('has-numpad', state.numpad && currentLayout === 'desktop' && !symbols);
  keyboard.style.setProperty('--sk-dock-height', `${clamp(state.dockHeight, 175, viewport().h * .83)}px`);
  keyboard.style.setProperty('--sk-split-gap', `${state.splitGap}px`);
  keyboard.style.setProperty('--sk-key-scale', String(state.keyScale / 100));
  for (const half of ['left','right']) {
    keyboard.style.setProperty(`--sk-${half}-x`, `${state[half+'HalfX']}px`);
    keyboard.style.setProperty(`--sk-${half}-y`, `${state[half+'HalfY']}px`);
    keyboard.style.setProperty(`--sk-${half}-scale`, String(state[half+'HalfScale'] / 100));
  }
  $('toggleDock').textContent = state.floating ? 'Dock' : 'Float';
  setButton('toggleDock', state.floating);
  setButton('toggleSplit', state.split);
  setButton('toggleNumpad', state.numpad);
  $('toggleMinimize').textContent = state.minimized ? '▴' : '⌄';
  $('toggleMinimize').setAttribute('aria-expanded', String(!state.minimized));
  if (state.floating) placeFloating(state.floatingBox || startingBox(), false);
}

function paintTheme() {
  for (const role of PALETTE_KEYS) {
    const css = THEME_ROLES[role].variable;
    keyboard.style.setProperty(css, state.colors[role]);
    popup.style.setProperty(css, state.colors[role]);
  }
}

function labelFor(symbol) {
  if (symbol === 'Space') return 'Space';
  if (symbol === 'Backspace') return 'Backspace';
  if (symbol === 'PrintScreen') return 'Print Screen (native host required)';
  if (isAction(symbol)) return symbol;
  return `Type ${symbol}`;
}

function makeKey(symbol, rowIndex, columnIndex) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sk-key';
  button.dataset.key = symbol;
  button.dataset.row = rowIndex;
  button.dataset.column = columnIndex;
  button.dataset.skinPart = isAction(symbol) ? 'action' : 'key';
  button.style.setProperty('--sk-weight', String(WIDE_KEYS[symbol] || 1));
  const accent = mergedVariants(symbol);
  button.dataset.accent = String(accent.length > 0);
  button.dataset.action = symbol;
  button.setAttribute('aria-label', labelFor(symbol) + (accent.length ? '; hold for accents' : ''));
  button.title = accent.length ? `${symbol}: hold for ${accent.length} alternatives` : labelFor(symbol);
  button.textContent = ACTIONS[symbol] || symbol;
  button.dataset.caseLetter = isLetter(symbol) ? 'true' : 'false';
  return button;
}

function draw() {
  const width = Math.max(1, keyboard.getBoundingClientRect().width);
  const chosen = layoutFor(width, state.layout, symbols && ['typing','big'].includes(state.task));
  if (currentLayout === chosen && grid.childElementCount) { updateMetrics(); return; }
  hideAccent();
  currentLayout = chosen;
  grid.replaceChildren();
  const rows = symbols ? LAYOUTS.symbols : rowsForTask(chosen,state.task,state.language,LAYOUTS);
  for (const [ri, row] of rows.entries()) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sk-key-row';
    const left = document.createElement('div');
    const right = document.createElement('div');
    left.className = right.className = 'sk-row-half';
    const mid = document.createElement('span');
    mid.className = 'sk-row-divider';
    mid.setAttribute('aria-hidden', 'true');
    const pivot = Math.ceil(row.length / 2);
    row.forEach((symbol, i) => (i < pivot ? left : right).append(makeKey(symbol, ri, i)));
    wrapper.append(left, mid, right);
    grid.append(wrapper);
  }
  numpad.replaceChildren();
  if (chosen === 'desktop' && state.numpad && !symbols && state.task === 'typing') {
    for (const [ri, row] of NUMPAD.entries()) {
      const wrapper = document.createElement('div');
      wrapper.className = 'sk-numpad-row';
      row.forEach((symbol, i) => wrapper.append(makeKey(symbol, ri, i)));
      numpad.append(wrapper);
    }
    numpad.hidden = false;
  } else numpad.hidden = true;
  keyboard.classList.toggle('has-numpad', !numpad.hidden);
  updateCase();
  updateMetrics();
}

function updateMetrics() {
  if (state.minimized) return;
  const bounds = keyboard.getBoundingClientRect();
  const body = $('keyboardBody');
  const toolbarHeight = keyboard.querySelector('.sk-toolbar').getBoundingClientRect().height;
  const h = Math.max(160, bounds.height - toolbarHeight);
  let { keyHeight, gap, font, radius } = metricsFor(
    bounds.width * (numpad.hidden ? 1 : .78), h, currentLayout || 'compact', state.split,
    grid.childElementCount
  );
  if (state.task === 'big' && !symbols) {
    keyHeight = Math.max(52,keyHeight);
    font = Math.max(22,font);
  }
  keyHeight = Math.round(keyHeight * state.keyScale / 100);
  font = Math.round(font * state.keyScale / 100);
  keyboard.style.setProperty('--sk-key-h', `${keyHeight}px`);
  keyboard.style.setProperty('--sk-key-gap', `${gap}px`);
  keyboard.style.setProperty('--sk-key-font', `${font}px`);
  keyboard.style.setProperty('--sk-radius', `${radius}px`);
  // The body scrolls on particularly short screens rather than cutting keys off.
  body.setAttribute('aria-label', `${currentLayout} layout; ${Math.round(bounds.width)} by ${Math.round(bounds.height)} pixels`);
}

function updateCase() {
  for (const key of grid.querySelectorAll('[data-case-letter="true"]')) {
    key.textContent = characterFor(key.dataset.key);
  }
  for (const key of grid.querySelectorAll('[data-key="Shift"],[data-key="CapsLock"]')) {
    key.setAttribute('aria-pressed', String(key.dataset.key === 'Shift' ? shift : caps));
  }
  for (const key of grid.querySelectorAll('[data-key="Control"],[data-key="Alt"],[data-key="Meta"],[data-key="AltGraph"]')) {
    key.setAttribute('aria-pressed', String(modifier[key.dataset.key]));
  }
}

function shouldUppercase() { return caps !== shift; }
function characterFor(symbol) { return typedCharacter(symbol,shouldUppercase(),state.language); }

// The imported sound packs are deliberately mapped to physical keyboard codes.
// Translate on-screen labels to those codes, including the distinct numpad keys.
function soundForKey(symbol, fromNumpad = false) {
  const player = window.SavanskiKeyboardAudio;
  if (!player) return;
  let code = symbol;
  if (fromNumpad && /^[0-9]$/.test(symbol)) code = `Numpad${symbol}`;
  else if (fromNumpad) code = ({'/':'NumpadDivide','*':'NumpadMultiply',
    '-':'NumpadSubtract','+':'NumpadAdd','.':'NumpadDecimal',
    'Enter':'NumpadEnter'})[symbol] || symbol;
  else if (/^[a-z]$/i.test(symbol)) code = `Key${symbol.toUpperCase()}`;
  else if (/^[0-9]$/.test(symbol)) code = `Digit${symbol}`;
  else code = ({'`':'Backquote','-':'Minus','=':'Equal','[':'BracketLeft',
    ']':'BracketRight','\\':'Backslash',';':'Semicolon',"'":'Quote',
    ',':'Comma','.':'Period','/':'Slash','Shift':'ShiftLeft',
    'Control':'ControlLeft','Alt':'AltLeft','AltGraph':'AltRight',
    'Meta':'MetaLeft','@':'Digit2','#':'Digit3','$':'Digit4',
    '%':'Digit5','&':'Digit7','(':'Digit9',')':'Digit0',
    '+':'Equal','*':'Digit8','"':'Quote',':':'Semicolon',
    '!':'Digit1','?':'Slash'})[symbol] || symbol;
  void player.playKey(code);
}

function dispatchKey(kind, value) {
  window.dispatchEvent(new CustomEvent('savanski:key', {
    detail: { kind, value, modifiers: { ...modifier }, shift, caps, layout: currentLayout }
  }));
}

function inputTarget() {
  if (activeEditable?.isConnected) return activeEditable;
  return demo;
}

function editableText(target, value, backward = false, forward = false) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if ('selectionStart' in target && target.selectionStart !== null) {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (backward) {
        const before = target.value.slice(0, start);
        const from = start !== end ? start : deleteLastGrapheme(before).length;
        target.setRangeText('', from, end, 'start');
      } else if (forward) {
        const suffix = target.value.slice(end);
        const next = suffix ? [...suffix][0].length : 0;
        target.setRangeText('', start, end === start ? end + next : end, 'start');
      } else target.setRangeText(value, start, end, 'end');
    } else if (!backward && !forward) target.value += value;
    target.dispatchEvent(new InputEvent('input', { bubbles:true, data:value || null, inputType:backward ? 'deleteContentBackward' : forward ? 'deleteContentForward' : 'insertText' }));
    return;
  }
  if (target?.isContentEditable) {
    target.focus({ preventScroll:true });
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    if (backward || forward) {
      // Contenteditable deletion is host-sensitive; ask its editor to process it.
      target.dispatchEvent(new InputEvent('beforeinput', { bubbles:true, cancelable:true,
        inputType: backward ? 'deleteContentBackward' : 'deleteContentForward' }));
      say('For rich editors, connect the native/editor-specific input bridge.');
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(value);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    target.dispatchEvent(new InputEvent('input', { bubbles:true, data:value, inputType:'insertText' }));
  }
}

function updateSuggestions() {
  suggestionsBar.replaceChildren();
  const editor = $('editor');
  if (!state.predict || state.language !== 'en' || !['typing','big'].includes(state.task)) {
    suggestionsBar.hidden = true;
    return;
  }
  const { words = [], bigrams = {} } = window.SavanskiData?.suggestions || {};
  const candidates = suggestionCandidates(editor.value,editor.selectionStart,words,bigrams);
  for (const word of candidates) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sk-suggestion';
    button.textContent = word;
    // Prevent loss of the editor's selection when the button is touched.
    button.addEventListener('pointerdown',event => event.preventDefault());
    button.addEventListener('click',() => {
      const caret = editor.selectionStart;
      const match = editor.value.slice(0,caret).match(/([\p{L}']+)$/u);
      if (!match) return;
      const cased = match[1][0] === match[1][0].toUpperCase()
        ? word[0].toUpperCase() + word.slice(1) : word;
      editor.setRangeText(cased + ' ',caret-match[1].length,caret,'end');
      editor.dispatchEvent(new Event('input',{bubbles:true}));
      editor.focus({preventScroll:true});
    });
    suggestionsBar.append(button);
  }
  suggestionsBar.hidden = candidates.length === 0;
}

async function shortcut(symbol) {
  const target = inputTarget();
  if (!(target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    if (nativeHost()?.performKey) nativeHost().performKey(symbol);
    else say(`${symbol} requires a focused text field or native integration.`);
    return;
  }
  const {selectionStart:start,selectionEnd:end} = target;
  const selection = target.value.slice(start,end);
  try {
    switch (symbol) {
      case 'SelectAll': target.focus({preventScroll:true});target.select();break;
      case 'Copy':
        await navigator.clipboard.writeText(selection || target.value);
        say('Text copied locally.');break;
      case 'Cut':
        if (!selection) { say('Select text to cut.');break; }
        await navigator.clipboard.writeText(selection);
        target.setRangeText('',start,end,'start');
        target.dispatchEvent(new Event('input',{bubbles:true}));
        say('Selection cut locally.');break;
      case 'Paste':
        commitText(await navigator.clipboard.readText());break;
      case 'Undo': $('undo').click();break;
      case 'Redo': $('redo').click();break;
      case 'Find': $('search').focus({preventScroll:true});break;
      case 'Save': $('saveTxt').click();break;
    }
  } catch { say(`${symbol} needs clipboard permission or a supported browser.`); }
}

function commitText(text) {
  if (window.SavanskiInputState?.paused) {say('Keyboard paused. Click Resume Input.');return;}
  dispatchKey('text', text);
  if (nativeHost()?.commitText) nativeHost().commitText(text, {...modifier});
  else if (!nativeHost()) {
    const target = inputTarget();
    const caret = target?.selectionStart;
    const replaceDoubleSpace = state.doubleSpace && text === ' ' && target === demo &&
      typeof caret === 'number' && caret === target.selectionEnd &&
      caret > 0 && target.value[caret-1] === ' ' && Date.now()-lastSpaceAt < 800;
    if (replaceDoubleSpace) {
      target.setRangeText('. ',caret-1,caret,'end');
      target.dispatchEvent(new Event('input',{bubbles:true}));
    } else editableText(target, text);
    lastSpaceAt = text === ' ' ? Date.now() : 0;
  }
  else say('Native host has no commitText(text) bridge.');
  if (shift) { shift = false; updateCase(); }
  if (nativeHost()) {modifier={Control:false,Alt:false,Meta:false,AltGraph:false};updateCase();}
}

function performKey(symbol) {
  if (window.SavanskiInputState?.paused) {say('Keyboard paused.');return;}
  dispatchKey('action', symbol);
  if (nativeHost()?.performKey) {
    nativeHost().performKey(symbol, {...modifier});
    modifier={Control:false,Alt:false,Meta:false,AltGraph:false}; updateCase();
    return;
  }
  if (['Copy','Paste','Cut','SelectAll','Undo','Redo','Find','Save'].includes(symbol)) {
    void shortcut(symbol);
    return;
  }
  if (symbol === 'Backspace' || symbol === 'Delete') {
    if (nativeHost()?.deleteBackward && symbol === 'Backspace') nativeHost().deleteBackward();
    else if (nativeHost()?.performKey) nativeHost().performKey(symbol);
    else if (!nativeHost()) editableText(inputTarget(), '', symbol === 'Backspace', symbol === 'Delete');
  } else if (nativeHost()?.performKey) nativeHost().performKey(symbol);
  else if (!nativeHost()) {
    const target = inputTarget();
    if ((target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) && target.selectionStart !== null) {
      const position = target.selectionStart;
      const movement = { ArrowLeft:-1, ArrowRight:1 }[symbol];
      if (movement) target.setSelectionRange(clamp(position + movement, 0, target.value.length), clamp(position + movement, 0, target.value.length));
      if (symbol === 'Home') target.setSelectionRange(0,0);
      if (symbol === 'End') target.setSelectionRange(target.value.length,target.value.length);
      if (symbol === 'PageUp') target.setSelectionRange(0,0);
      if (symbol === 'PageDown') target.setSelectionRange(target.value.length,target.value.length);
      if (symbol === 'ArrowUp' || symbol === 'ArrowDown') {
        const starts = target.value.slice(0,position);
        const col = starts.length - starts.lastIndexOf('\n') - 1;
        const dest = symbol === 'ArrowUp'
          ? (starts.lastIndexOf('\n',Math.max(0,starts.length-col-2))+1)
          : target.value.indexOf('\n',position);
        if (symbol === 'ArrowUp') target.setSelectionRange(Math.min(dest+col,position),Math.min(dest+col,position));
        else if (dest >= 0) {
          const next = target.value.indexOf('\n',dest+1);
          const p = Math.min(dest+1+col,next < 0 ? target.value.length : next);
          target.setSelectionRange(p,p);
        }
      }
    } else if (/^F\d{1,2}$/.test(symbol) || symbol === 'Insert') {
      say(`${symbol} is visible and forwarded to native hosts; browser text areas do not expose that OS key.`);
    }
  }
}

function press(symbol, fromNumpad = false) {
  if (window.SavanskiInputState?.paused) return;
  hideAccent();
  soundForKey(symbol, fromNumpad);
  if (!isAction(symbol)) { commitText(characterFor(symbol)); return; }
  switch (symbol) {
    case 'Shift': shift = !shift; updateCase(); break;
    case 'CapsLock': caps = !caps; updateCase(); break;
    case 'Space': commitText(' '); break;
    case 'Enter': case 'Tab':
      if (nativeHost()) performKey(symbol);
      else commitText(symbol === 'Enter' ? '\n' : '\t');
      break;
    case 'Symbols': symbols = true; draw(); break;
    case 'Letters': symbols = false; draw(); break;
    case 'Control': case 'Alt': case 'Meta': case 'AltGraph':
      modifier[symbol] = !modifier[symbol]; updateCase(); break;
    case 'Escape': if (nativeHost()) performKey(symbol); else say('Accent chooser closed.'); break;
    case 'Globe': {
      const codes = Object.keys(LANGUAGES);
      changeLanguage(codes[(codes.indexOf(state.language)+1)%codes.length]);
      dispatchKey('action', symbol);
      break;
    }
    case 'Emoji': say('Emoji selection requires a host or an extended emoji layout.'); dispatchKey('action', symbol); break;
    case 'PrintScreen':
      dispatchKey('action', symbol);
      if (nativeHost()?.screenshot) nativeHost().screenshot();
      else if (nativeHost()?.performKey) nativeHost().performKey(symbol);
      else {
        say('Select a screen or window in your browser’s sharing prompt to download one screenshot.');
        void captureScreenshot().then(filename => say(`Screenshot saved as ${filename}.`))
          .catch(error => say(`Print Screen: ${error.message}`));
      }
      break;
    default: performKey(symbol);
  }
}

function hideAccent() {
  popup.hidden = true;
  popup.replaceChildren();
  popup.removeAttribute('data-base');
  accentAnchor = null;
}

function paintAccentChoices(base, tab = 'letters') {
  const capital = popup.dataset.uppercase === 'true';
  const options = tab === 'marks'
    ? (window.SavanskiData?.unicode?.characters || []).filter(v => v.block === 'mark')
        .map(mark => ({value: (capital ? base.toUpperCase() : base.toLowerCase()) + mark.char,
          name: mark.name, cp: `U+${mark.cp}`}))
    : mergedVariants(base, capital);
  popup.replaceChildren();
  if (/^[a-z]$/i.test(base)) {
    const tabs = document.createElement('div');
    tabs.className = 'sk-accent-tabs';
    for (const [type,label] of [['letters',`Accented letters (${mergedVariants(base,capital).length})`],['marks','Combining marks (112)']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.accentTab = type;
      button.className = 'sk-accent-tab';
      button.setAttribute('aria-pressed',String(tab === type));
      button.textContent = label;
      tabs.append(button);
    }
    popup.append(tabs);
  }
  const list = document.createElement('div');
  list.className = 'sk-accent-options';
  options.forEach((option, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'sk-accent-option';
    item.dataset.accentValue = tab === 'marks' && $('preferNfc')?.checked
      ? option.value.normalize('NFC') : option.value;
    item.title = `${option.name || 'Variant'} ${option.cp || ''}`;
    item.setAttribute('aria-label', `${item.title}, option ${i+1} of ${options.length}`);
    item.textContent = option.value;
    list.append(item);
  });
  popup.append(list);
  popup.hidden = false;
  const rect = accentAnchor.getBoundingClientRect();
  const width = popup.getBoundingClientRect().width;
  const height = popup.getBoundingClientRect().height;
  const { w, h } = viewport();
  const x = clamp(rect.left + rect.width/2 - width/2, 3, Math.max(3, w-width-3));
  const above = rect.top - height - 8;
  popup.style.left = `${x}px`;
  popup.style.top = `${above >= 4 ? above : Math.min(h-height-4, rect.bottom+8)}px`;
}

function openAccent(button) {
  const base = button.dataset.key;
  if (!mergedVariants(base,shouldUppercase()).length) return;
  accentAnchor = button;
  popup.dataset.base = base;
  popup.dataset.uppercase = String(shouldUppercase());
  paintAccentChoices(base);
  if ($('hapticHold')?.checked && navigator.vibrate) navigator.vibrate(12);
  say(`Choose an accented ${base}. Slide onto the character and release, or tap an option.`);
}

function accentUnderPointer(x, y) {
  return document.elementFromPoint(x,y)?.closest?.('[data-accent-value]') || null;
}

function highlightAccent(target) {
  for (const element of popup.querySelectorAll('.sk-accent-option')) {
    element.classList.toggle('is-selected', element === target);
  }
}

grid.addEventListener('pointerdown', startKeyPointer);
numpad.addEventListener('pointerdown', startKeyPointer);
function startKeyPointer(event) {
  const button = event.target.closest('.sk-key');
  if (!button || event.button !== 0 || picking) return;
  event.preventDefault(); // Do not blur the text field or summon the OS keyboard again.
  if (pointerKey) finishKeyPointer(null, true);
  const symbol = button.dataset.key;
  pointerKey = { id:event.pointerId, button, symbol, fromNumpad:numpad.contains(button), held:false, timer:null };
  button.classList.add('is-pressed');
  showPreview(button);
  try { button.setPointerCapture(event.pointerId); } catch { /* noncapture pointer */ }
  if (mergedVariants(symbol).length) {
    pointerKey.timer = setTimeout(() => {
      if (!pointerKey || pointerKey.id !== event.pointerId) return;
      pointerKey.held = true;
      button.classList.remove('is-pressed');
      hidePreview();
      openAccent(button);
    }, state.longPress);
  }
}

function finishKeyPointer(event, canceled = false) {
  if (!pointerKey || (event && pointerKey.id !== event.pointerId)) return;
  const key = pointerKey;
  clearTimeout(key.timer);
  key.button.classList.remove('is-pressed');
  hidePreview();
  pointerKey = null;
  if (canceled) { hideAccent(); return; }
  if (key.held) {
    const chosen = event ? accentUnderPointer(event.clientX, event.clientY) : null;
    if (chosen) { soundForKey(key.symbol, key.fromNumpad); commitText(chosen.dataset.accentValue); hideAccent(); }
    return; // Leave the popup open if the finger lifts away from an option.
  }
  press(key.symbol, key.fromNumpad);
}

function showPreview(button) {
  const rect = button.getBoundingClientRect();
  keyPreview.textContent = ACTIONS[button.dataset.key] || characterFor(button.dataset.key);
  keyPreview.hidden = false;
  const width = keyPreview.getBoundingClientRect().width;
  keyPreview.style.left = `${clamp(rect.left+rect.width/2-width/2,4,Math.max(4,viewport().w-width-4))}px`;
  keyPreview.style.top = `${rect.top > 82 ? rect.top-74 : rect.bottom+6}px`;
}

function hidePreview() { keyPreview.hidden = true; }

document.addEventListener('pointerup', event => finishKeyPointer(event));
document.addEventListener('pointercancel', event => finishKeyPointer(event, true));
document.addEventListener('pointermove', event => {
  if (pointerKey?.id === event.pointerId && pointerKey.held && !popup.hidden) {
    highlightAccent(accentUnderPointer(event.clientX, event.clientY));
  }
});
for (const container of [grid,numpad]) {
  container.addEventListener('click', event => {
    const button = event.target.closest('.sk-key');
    if (!button) return;
    if (picking) { selectPicked(button); event.preventDefault(); return; }
    if (event.detail === 0) press(button.dataset.key, numpad.contains(button)); // Switch/keyboard activation.
  });
  container.addEventListener('contextmenu', event => {
    if (event.target.closest('.sk-key')) event.preventDefault();
  });
}
popup.addEventListener('pointerdown', event => { if (event.target.closest('.sk-accent-option')) event.preventDefault(); });
popup.addEventListener('click', event => {
  const tab = event.target.closest('[data-accent-tab]');
  if (tab && accentAnchor) {
    paintAccentChoices(popup.dataset.base,tab.dataset.accentTab);
    return;
  }
  const option = event.target.closest('[data-accent-value]');
  if (option) { soundForKey(popup.dataset.base); commitText(option.dataset.accentValue); hideAccent(); }
});
document.addEventListener('pointerdown', event => {
  if (!popup.hidden && !popup.contains(event.target) && !event.target.closest('.sk-key')) hideAccent();
});

// Keep the last editable target while UI controls are activated.
document.addEventListener('focusin', event => {
  const el = event.target;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement && !['button','color','checkbox','range','radio','file'].includes(el.type) && !panel.contains(el) || el.isContentEditable) {
    if (el !== $('hexColor')) activeEditable = el;
  }
});

function startDragOrResize(event, edge) {
  if (nativeHost() && !edge) {
    event.preventDefault();
    sizingPointer={id:event.pointerId,edge:'native-move',lastX:event.clientX,lastY:event.clientY};
    try {event.currentTarget.setPointerCapture(event.pointerId);}catch{}
    return;
  }
  if (event.button !== 0 || sizingPointer || (state.minimized && edge)) return;
  if (edge && !state.floating && edge !== 'n') return;
  if (!edge && !state.floating) return;
  event.preventDefault();
  const rect = keyboard.getBoundingClientRect();
  sizingPointer = {
    id: event.pointerId, edge:edge || 'move',
    startX:event.clientX, startY:event.clientY,
    box: { x:rect.left, y:rect.top, w:rect.width, h:rect.height }
  };
  keyboard.classList.add('is-resizing');
  try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* no capture */ }
}

$('keyboardDrag').addEventListener('pointerdown', e => startDragOrResize(e, null));
for (const grip of keyboard.querySelectorAll('[data-edge]')) {
  grip.addEventListener('pointerdown', event => startDragOrResize(event, grip.dataset.edge));
}
document.addEventListener('pointermove', event => {
  if (!sizingPointer || sizingPointer.id !== event.pointerId) return;
  if (sizingPointer.edge === 'native-move') {
    const dx=event.clientX-sizingPointer.lastX,dy=event.clientY-sizingPointer.lastY;
    sizingPointer.lastX=event.clientX;sizingPointer.lastY=event.clientY;
    nativeHost()?.moveDelta(dx,dy);return;
  }
  const { edge, startX, startY, box } = sizingPointer;
  const dx = event.clientX - startX, dy = event.clientY - startY;
  if (!state.floating) {
    if (edge === 'n') {
      const cssMax = parseFloat(getComputedStyle(keyboard).maxHeight) || viewport().h * .72;
      state.dockHeight = clamp(box.h - dy, Math.min(175, cssMax), cssMax);
      keyboard.style.setProperty('--sk-dock-height', `${state.dockHeight}px`);
    }
    return;
  }
  let { x,y,w,h } = box;
  if (edge === 'move') { x += dx; y += dy; }
  else {
    const view = viewport();
    const minW = Math.min(280, view.w - 8), minH = Math.min(188, view.h - 8);
    if (edge.includes('e')) w = clamp(box.w + dx, minW, view.w - box.x - 4);
    if (edge.includes('s')) h = clamp(box.h + dy, minH, view.h - box.y - 4);
    if (edge.includes('w')) {
      const opposite = box.x + box.w;
      x = clamp(box.x + dx, 4, opposite - minW);
      w = opposite - x;
    }
    if (edge.includes('n')) {
      const opposite = box.y + box.h;
      y = clamp(box.y + dy, 4, opposite - minH);
      h = opposite - y;
    }
  }
  placeFloating({x,y,w,h},false);
});
document.addEventListener('pointerup', event => {
  if (sizingPointer?.id === event.pointerId) endSizing();
});
document.addEventListener('pointercancel', event => {
  if (sizingPointer?.id === event.pointerId) endSizing();
});
function endSizing() {
  sizingPointer = null;
  keyboard.classList.remove('is-resizing');
  save();
}

// Color wheel, live semantic part targeting, and per-role persistence.
function fillColorTargets() {
  $('colorTarget').replaceChildren();
  for (const role of PALETTE_KEYS) {
    const opt = document.createElement('option');
    opt.value = role;
    opt.textContent = THEME_ROLES[role].label;
    $('colorTarget').append(opt);
  }
  chooseRole(selectedRole);
}

function chooseRole(role) {
  if (!THEME_ROLES[role]) return;
  selectedRole = role;
  $('colorTarget').value = role;
  $('targetColor').value = state.colors[role];
  $('hexColor').value = state.colors[role].toUpperCase();
  keyboard.querySelectorAll('.sk-color-selected').forEach(el => el.classList.remove('sk-color-selected'));
  const example = keyboard.querySelector(`[data-skin-part="${role}"]`);
  if (example && role !== 'shell') example.classList.add('sk-color-selected');
}

function recolor(value) {
  if (!validColor(value)) return;
  state.colors[selectedRole] = value.toUpperCase();
  paintTheme();
  $('targetColor').value = value;
  $('hexColor').value = value.toUpperCase();
  save();
}

function selectPicked(target) {
  const part = target.closest('[data-skin-part]')?.dataset.skinPart;
  if (part && THEME_ROLES[part]) chooseRole(part);
  picking = false;
  keyboard.classList.remove('is-picking');
  setButton('pickPart',false);
  say(`Selected color target: ${THEME_ROLES[selectedRole].label}`);
}
keyboard.addEventListener('pointerdown', event => {
  if (!picking) return;
  const part = event.target.closest('[data-skin-part]');
  if (!part) return;
  event.preventDefault();
  event.stopPropagation();
  selectPicked(part);
}, true);

$('colorTarget').addEventListener('change', e => chooseRole(e.target.value));
$('targetColor').addEventListener('input', e => recolor(e.target.value));
$('hexColor').addEventListener('change', e => recolor(e.target.value));
$('pickPart').addEventListener('click', () => {
  picking = !picking;
  keyboard.classList.toggle('is-picking',picking);
  setButton('pickPart',picking);
  say(picking ? 'Tap the keyboard part to select its color target.' : 'Color target selection canceled.');
});
$('resetColor').addEventListener('click',() => recolor(DEFAULT_THEME[selectedRole]));
$('resetAllColors').addEventListener('click',() => {
  state.colors = {...DEFAULT_THEME}; paintTheme(); chooseRole(selectedRole); save();
});

function toggleDesign(open) {
  panel.hidden = !open;
  $('openDesign').setAttribute('aria-expanded',String(open));
  if (!open) {
    picking = false; keyboard.classList.remove('is-picking'); setButton('pickPart',false);
  }
}
$('openDesign').addEventListener('click',() => toggleDesign(panel.hidden));
$('closeDesign').addEventListener('click',() => toggleDesign(false));
$('toggleSplit').addEventListener('click',() => {
  state.split = !state.split; setSizingMode(); updateMetrics(); save();
});
$('toolbarPrintScreen').addEventListener('click',() => press('PrintScreen'));
$('toggleDock').addEventListener('click',() => {
  if (nativeHost()) {say('The Windows host stays floating. Resize by dragging its edge or use S / M / L.');return;}
  state.floating = !state.floating; setSizingMode(); draw(); save();
});
$('toggleNumpad').addEventListener('click',() => {
  state.numpad = !state.numpad; currentLayout=''; setSizingMode(); draw(); save();
  if (currentLayout !== 'desktop') say('Numpad will appear when the full desktop layout is active.');
});
$('toggleMinimize').addEventListener('click',() => {
  state.minimized = !state.minimized; setSizingMode(); if (!state.minimized) draw(); save();
});
$('layoutProfile').addEventListener('change', e => {
  state.layout = e.target.value; currentLayout=''; draw(); save();
});
function changeLanguage(language) {
  if (!Object.hasOwn(LANGUAGES,language)) return;
  state.language = language;
  $('keyboardLanguage').value = language;
  currentLayout = ''; draw(); updateSuggestions(); save();
  say(`${LANGUAGES[language]} — in-app layout. System-wide language selection needs a native keyboard.`);
}
$('keyboardLanguage').addEventListener('change',event => changeLanguage(event.target.value));
$('taskMode').addEventListener('change',event => {
  if (!Object.hasOwn(TASK_MODES,event.target.value)) return;
  state.task = event.target.value;
  symbols = false;
  currentLayout = '';
  draw();setSizingMode();updateSuggestions();save();
  say(`${TASK_MODES[state.task]} task active.`);
});
const highContrast = {
  dark: {shell:'#000000',frame:'#00FFFF',toolbar:'#000000',toolbarText:'#FFFFFF',
    key:'#000000',keyText:'#FFFFFF',keyBorder:'#FFFFFF',action:'#FFF600',actionText:'#000000',
    pressed:'#1E90FF',accent:'#000000',accentText:'#FFFFFF',accentBorder:'#FFF600',
    split:'#00FFFF',focus:'#FFF600'},
  light: {shell:'#FFFFFF',frame:'#1E90FF',toolbar:'#FFFFFF',toolbarText:'#000000',
    key:'#FFFFFF',keyText:'#000000',keyBorder:'#000000',action:'#FFF600',actionText:'#000000',
    pressed:'#1E90FF',accent:'#FFFFFF',accentText:'#000000',accentBorder:'#000000',
    split:'#1E90FF',focus:'#000000'}
};
$('visualTheme').addEventListener('change',event => {
  if (!highContrast[event.target.value]) return;
  state.colors = { ...highContrast[event.target.value] };
  paintTheme();chooseRole(selectedRole);save();
});
$('predictWords').addEventListener('change',event => {
  state.predict = event.target.checked;updateSuggestions();save();
});
$('doubleSpacePeriod').addEventListener('change',event => {
  state.doubleSpace = event.target.checked;save();
});
$('editor').addEventListener('input',updateSuggestions);
$('editor').addEventListener('keyup',updateSuggestions);
$('editor').addEventListener('click',updateSuggestions);
$('holdDelay').addEventListener('change', e => {state.longPress=+e.target.value; save();});
$('splitWidth').addEventListener('input', e => {
  state.splitGap=+e.target.value; setSizingMode(); updateMetrics(); save();
});
for (const half of ['left','right']) {
  const key=half==='left'?'leftHalfScale':'rightHalfScale';
  $(key).addEventListener('input',event=>{state[key]=+event.target.value;setSizingMode();save();});
}
for (const dragger of document.querySelectorAll('.sk-half-drag')) {
  dragger.addEventListener('pointerdown', event => {
    if (!state.split) return;
    event.preventDefault();
    const half=dragger.dataset.half;
    halfPointer={id:event.pointerId,half,x:event.clientX,y:event.clientY,
      startX:state[half+'HalfX'],startY:state[half+'HalfY']};
    try {dragger.setPointerCapture(event.pointerId);}catch{}
  });
}
document.addEventListener('pointermove',event=>{
  if (!halfPointer || halfPointer.id!==event.pointerId) return;
  const {half,x,y,startX,startY}=halfPointer;
  state[half+'HalfX']=clamp(startX+event.clientX-x,-95,95);
  state[half+'HalfY']=clamp(startY+event.clientY-y,-70,70);
  setSizingMode();
});
for (const name of ['pointerup','pointercancel']) document.addEventListener(name,event=>{
  if (halfPointer?.id===event.pointerId){halfPointer=null;save();}
});
$('keyScale').addEventListener('input', e => {state.keyScale=+e.target.value;setSizingMode();updateMetrics();save();});
window.SavanskiResizeKeyboard = (width,height) => {
  state.floating=true;state.floatingBox=usableBox({...(state.floatingBox||startingBox()),w:width,h:height});
  setSizingMode();currentLayout='';draw();save();
};
$('resetSize').addEventListener('click',() => {
  state.dockHeight = Math.min(390, viewport().h*.62);
  state.floatingBox = startingBox(); setSizingMode(); draw(); save();
});
$('restoreDefaults').addEventListener('click',() => {
  const defaults = defaultSettings();
  Object.assign(state,defaults);
  $('layoutProfile').value=state.layout;
  $('holdDelay').value=String(state.longPress);
  $('splitWidth').value=String(state.splitGap);
  $('keyScale').value=String(state.keyScale);
  $('leftHalfScale').value=String(state.leftHalfScale);
  $('rightHalfScale').value=String(state.rightHalfScale);
  $('keyboardLanguage').value=state.language;
  $('taskMode').value=state.task;
  $('predictWords').checked=state.predict;
  $('doubleSpacePeriod').checked=state.doubleSpace;
  $('visualTheme').value='custom';
  symbols=false;shift=false;caps=false;modifier={Control:false,Alt:false,Meta:false,AltGraph:false};
  currentLayout=''; hideAccent(); setSizingMode(); paintTheme(); chooseRole(selectedRole); draw(); save();
});

const observer = new ResizeObserver(() => {
  const w = Math.round(keyboard.getBoundingClientRect().width);
  if (w !== lastWidth) { lastWidth=w; draw(); }
  else updateMetrics();
});
observer.observe(keyboard);
window.addEventListener('resize',() => {
  if (state.floating) placeFloating(state.floatingBox || startingBox(),false);
  else setSizingMode();
  draw();
});
window.visualViewport?.addEventListener('resize',() => {
  if (state.floating) placeFloating(state.floatingBox || startingBox(),false);
  else setSizingMode();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !popup.hidden) { hideAccent(); event.preventDefault(); }
  const focused = event.target.closest?.('.sk-key');
  if (!focused || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
  const parent = focused.closest('.sk-key-row,.sk-numpad-row');
  const buttons = [...parent.querySelectorAll('.sk-key')];
  const rowIndex = [...parent.parentElement.children].indexOf(parent);
  const colIndex = buttons.indexOf(focused);
  let dest;
  if (event.key === 'ArrowLeft') dest = buttons[Math.max(0,colIndex-1)];
  if (event.key === 'ArrowRight') dest = buttons[Math.min(buttons.length-1,colIndex+1)];
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    const step = event.key === 'ArrowUp' ? -1 : 1;
    const targetRow = parent.parentElement.children[clamp(rowIndex+step,0,parent.parentElement.children.length-1)];
    const rowButtons = [...targetRow.querySelectorAll('.sk-key')];
    dest = rowButtons[Math.min(colIndex,rowButtons.length-1)];
  }
  if (dest) {dest.focus();event.preventDefault();}
});

// Only backend-supported appearance/layout settings are synchronized.
// Never pass text, typed keys, clipboard, or password data to profile storage.
window.SavanskiUI = Object.freeze({
  syncIntoProfile(profile) {
    const result = JSON.parse(JSON.stringify(profile));
    const settings = result.settings;
    settings.split.enabled = state.split;
    settings.split.gapPx = state.splitGap;
    settings.keys.numpad = state.numpad;
    settings.keys.printScreen = true;
    settings.keys.accentPopups = true;
    settings.sizing.widthPercent = state.floating && state.floatingBox
      ? clamp(Math.round(state.floatingBox.w / window.innerWidth * 100),25,100) : 100;
    settings.sizing.heightPercent = clamp(Math.round(state.dockHeight / viewport().h * 100),15,95);
    settings.accessibility.haptics = $('hapticHold').checked;
    settings.appearance.colors = {
      ...settings.appearance.colors,
      background:state.colors.shell,
      text:state.colors.toolbarText,
      keys:state.colors.key,
      keyText:state.colors.keyText,
      border:state.colors.keyBorder,
      toolbar:state.colors.toolbar,
      menu:state.colors.action,
      popup:state.colors.accent,
      accent:state.colors.accentBorder
    };
    return result;
  },
  applySyncedProfile(profile) {
    const settings = profile?.settings;
    if (!settings) throw Error('Cloud profile contained no settings.');
    state.split = settings.split?.enabled === true;
    state.splitGap = clamp(Number(settings.split?.gapPx) || 26,8,100);
    state.numpad = settings.keys?.numpad === true;
    if (Number.isFinite(settings.sizing?.heightPercent))
      state.dockHeight = clamp(viewport().h * settings.sizing.heightPercent / 100,175,620);
    if (typeof settings.accessibility?.haptics === 'boolean')
      $('hapticHold').checked = settings.accessibility.haptics;
    const remoteColors = settings.appearance?.colors || {};
    const translate = {
      background:'shell', text:'toolbarText', keys:'key', keyText:'keyText',
      border:'keyBorder', toolbar:'toolbar', menu:'action', popup:'accent', accent:'accentBorder'
    };
    for (const [from,to] of Object.entries(translate)) {
      if (validColor(remoteColors[from])) state.colors[to] = remoteColors[from];
    }
    if (validColor(remoteColors.border)) state.colors.frame=remoteColors.border;
    state.colors.actionText = state.colors.toolbarText;
    $('splitWidth').value=String(state.splitGap);
    currentLayout='';setSizingMode();paintTheme();chooseRole(selectedRole);draw();save();
  }
});

function initialize() {
  $('layoutProfile').value=state.layout;
  $('keyboardLanguage').value=state.language;
  $('taskMode').value=state.task;
  $('predictWords').checked=state.predict;
  $('doubleSpacePeriod').checked=state.doubleSpace;
  $('holdDelay').value=String(state.longPress);
  $('splitWidth').value=String(state.splitGap);
  $('keyScale').value=String(state.keyScale);
  $('leftHalfScale').value=String(state.leftHalfScale);
  $('rightHalfScale').value=String(state.rightHalfScale);
  fillColorTargets();
  paintTheme();
  setSizingMode();
  draw();
  updateSuggestions();
  if (!nativeHost()) demo.focus({preventScroll:true});
}
initialize();
