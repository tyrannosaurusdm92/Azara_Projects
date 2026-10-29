/* Aza’raan Writing Studio integration. Existing writing pages and Language
   Studio remain the destinations; this file routes the one attached keyboard. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = [
    '01 Language',
    '02 Book One: The Door In The Tree',
    '03 Book Two: The Drowned Queen',
    '04 Book Three: The Unwilling Spy',
    '05 Book Four: The Hollow Throne',
    '06 Book Five: Never-Ending Loss',
    '07 Book Six: Threats Of Space',
    '08 Book Seven: Collision Of Worlds',
    '09 Book Eight: Unraveled'
  ];
  const eras = ['Proto', 'Ancient', 'Archaic', 'Classical', 'Traditional', 'Modern'];
  const idFor = i => i === 0 ? 'wh-language' : 'wh-book-' + i;
  const channel = (id, name, type='document') => ({
    id: 'wh:' + id + ':' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    workspaceId: id, name, type, html: '', leftHtml: '', rightHtml: '', notes: '',
    lang: 'en', font: 'Georgia', size: 18, updatedAt: new Date().toISOString()
  });
  async function seed() {
    const app = window.LiteraryFriendApp;
    if (!app || localStorage.getItem('wh:seeded:v1') === 'yes') return;
    const state = app.getSnapshot();
    if (!state) return;
    const blank = state.workspaces.length === 1 && state.workspaces[0].name === 'My Library' &&
      state.tasks.length === 0 && state.channels.length === 3 &&
      state.channels.every(c => ['Manuscript', 'Character Notes', 'Drafting Table'].includes(c.name) &&
        ![c.html, c.leftHtml, c.rightHtml, c.notes].some(x => String(x || '').trim()));
    if (blank) { state.workspaces = []; state.channels = []; }
    for (let i = 0; i < names.length; i++) {
      const id = idFor(i);
      if (state.workspaces.some(w => w.id === id || w.name === names[i])) continue;
      state.workspaces.push({ id, name: names[i] });
      const pages = i === 0 ? eras : ['Manuscript', 'Outline', 'Character Notes', 'Continuity Notes', 'Drafting Table'];
      for (const name of pages) state.channels.push(channel(id, name, name === 'Drafting Table' ? 'studio' : 'document'));
    }
    if (blank) { state.selectedWorkspaceId = idFor(0); state.selectedChannelId = channel(idFor(0), 'Proto').id; }
    try { await app.replaceSnapshot(state); localStorage.setItem('wh:seeded:v1', 'yes'); }
    catch (error) { console.error('WriterHelper project initialization failed', error); }
  }

  let currentEditor = null, caret = null, guard = false, keyboardConnected = false;
  const keyboardFrame = $('wh-unified-keyboard-frame');
  const languageFrame = $('wh-language-frame');
  const pendingLanguageTokens = [];
  function closestEditor(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    return el?.closest?.('.rich-editor') || null;
  }
  function offsetInEditor(editor, node, offset) {
    try {
      const range = document.createRange();
      range.selectNodeContents(editor); range.setEnd(node, offset);
      return range.toString().length;
    } catch { return editor.textContent?.length || 0; }
  }
  function syncKeyboardBuffer() {
    let notes;
    try { notes = keyboardFrame?.contentWindow?.Notes; } catch {}
    if (!notes?.syncText) return;
    if (document.body.classList.contains('wh-language-active')) {
      let text = '';
      try { text = languageFrame.contentWindow.AZA_STUDIO?.text || ''; } catch {}
      notes.syncText(text, text.length, text.length);
      return;
    }
    const editor = currentEditor?.isConnected ? currentEditor : document.querySelector('.rich-editor');
    if (!editor) { notes.syncText('', 0, 0); return; }
    currentEditor = editor;
    const text = editor.textContent || '';
    const range = caret && editor.contains(caret.commonAncestorContainer) ? caret : null;
    const start = range ? offsetInEditor(editor, range.startContainer, range.startOffset) : text.length;
    const end = range ? offsetInEditor(editor, range.endContainer, range.endOffset) : start;
    notes.syncText(text, start, end);
  }
  document.addEventListener('selectionchange', () => {
    if (guard) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0), editor = closestEditor(range.commonAncestorContainer);
    if (editor) { currentEditor = editor; caret = range.cloneRange(); syncKeyboardBuffer(); }
  });
  document.addEventListener('focusin', event => {
    if (event.target.matches?.('.rich-editor')) { currentEditor = event.target; queueMicrotask(syncKeyboardBuffer); }
  });
  function restore() {
    const target = currentEditor?.isConnected ? currentEditor : document.querySelector('.rich-editor');
    if (!target) return null;
    currentEditor = target; guard = true;
    try {
      target.focus({ preventScroll: true });
      const selection = window.getSelection();
      if (caret && target.contains(caret.commonAncestorContainer)) {
        selection.removeAllRanges(); selection.addRange(caret.cloneRange());
      } else {
        const range = document.createRange(); range.selectNodeContents(target); range.collapse(false);
        selection.removeAllRanges(); selection.addRange(range);
      }
    } finally { guard = false; }
    return target;
  }
  function notify(editor, type='insertText', data=null) {
    const selection = window.getSelection();
    if (selection?.rangeCount) caret = selection.getRangeAt(0).cloneRange();
    try { editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: type, data })); }
    catch { editor.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  function insertText(value, azaMode=false, era='Modern') {
    if (typeof value !== 'string' || !value) return;
    const editor = restore(); if (!editor) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0); range.deleteContents();
    if (azaMode) {
      const span = document.createElement('span');
      span.className = 'azaaraan-typed';
      span.style.fontFamily = window.WriterHelperFonts?.family(era) || ('Az' + era);
      span.textContent = value; range.insertNode(span); range.setStartAfter(span);
    } else {
      const node = document.createTextNode(value); range.insertNode(node); range.setStartAfter(node);
    }
    range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
    notify(editor, 'insertText', value);
  }
  function action(key) {
    if (key === 'Tab') { insertText('    '); return; }
    const editor = restore(); if (!editor) return;
    const selection = window.getSelection(); if (!selection?.rangeCount) return;
    if (key === 'Backspace' || key === 'Delete') {
      if (selection.isCollapsed && selection.modify) selection.modify('extend', key === 'Backspace' ? 'backward' : 'forward', 'character');
      document.execCommand('delete', false, null);
      notify(editor, key === 'Backspace' ? 'deleteContentBackward' : 'deleteContentForward');
    } else if (key === 'Enter') {
      document.execCommand('insertParagraph', false, null); notify(editor, 'insertParagraph');
    } else if (key === 'Undo' || key === 'Redo') {
      document.execCommand(key === 'Undo' ? 'undo' : 'redo', false, null); notify(editor);
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (selection.modify) selection.modify('move', key === 'ArrowLeft' ? 'backward' : 'forward', 'character');
      if (selection.rangeCount) caret = selection.getRangeAt(0).cloneRange();
    } else if (key === 'SelectAll') {
      const range = document.createRange(); range.selectNodeContents(editor);
      selection.removeAllRanges(); selection.addRange(range); caret = range.cloneRange();
    }
    syncKeyboardBuffer();
  }
  function matchesAt(chars, index, value) {
    const letters = [...String(value || '')];
    return letters.length && chars.slice(index, index + letters.length).join('') === letters.join('') ? letters.length : 0;
  }
  function parseAzaTokens(text, config) {
    if (!config) return [...String(text)].map(ch => ch === ' ' ? { type: 'space' } : ch === '\n' ? { type: 'break' } : { type: 'literal', value: ch });
    const bases = Object.entries(config.letterMap || {}).map(([base, khmer]) => ({ base, khmer: String(khmer) })).filter(x => x.khmer).sort((a,b) => [...b.khmer].length - [...a.khmer].length);
    const marks = [...(config.accents || []), ...(config.specials || [])].filter(m => m?.khmer).sort((a,b) => [...b.khmer].length - [...a.khmer].length);
    const standalone = Object.entries(config.archaicStandalone || {}).map(([sign, item]) => ({ sign, khmer: item?.khmer })).filter(x => x.khmer);
    const chars = [...String(text)], output = [];
    for (let i = 0; i < chars.length;) {
      if (chars[i] === ' ') { output.push({ type: 'space' }); i++; continue; }
      if (chars[i] === '\n') { output.push({ type: 'break' }); i++; continue; }
      const base = bases.find(item => matchesAt(chars, i, item.khmer));
      if (base) {
        const token = { type: 'glyph', base: base.base, marks: [] };
        i += matchesAt(chars, i, base.khmer);
        while (i < chars.length) {
          const mark = marks.find(item => matchesAt(chars, i, item.khmer));
          if (!mark || token.marks.length >= 3 || token.marks.includes(mark.id)) break;
          token.marks.push(mark.id); i += matchesAt(chars, i, mark.khmer);
        }
        output.push(token); continue;
      }
      const sign = standalone.find(item => matchesAt(chars, i, item.khmer));
      if (sign) { output.push({ type: 'sign', sign: sign.sign }); i += matchesAt(chars, i, sign.khmer); continue; }
      const mark = marks.find(item => matchesAt(chars, i, item.khmer));
      if (mark) { output.push({ type: 'literal', value: mark.khmer }); i += matchesAt(chars, i, mark.khmer); continue; }
      const ch = chars[i++];
      if (ch === '៉') output.push({ type: 'sign', sign: 'ʔ' });
      else output.push({ type: 'literal', value: ch });
    }
    return output;
  }
  function appendLanguage(tokens) {
    let studio;
    try { studio = languageFrame?.contentWindow?.AZA_STUDIO; } catch {}
    if (studio?.append) { studio.append(tokens); syncKeyboardBuffer(); }
    else pendingLanguageTokens.push(...tokens);
  }
  function flushLanguageTokens() {
    if (!pendingLanguageTokens.length) return;
    let studio;
    try { studio = languageFrame?.contentWindow?.AZA_STUDIO; } catch {}
    if (studio?.append) { const batch = pendingLanguageTokens.splice(0); studio.append(batch); syncKeyboardBuffer(); }
  }
  window.addEventListener('aws:language-ready', flushLanguageTokens);
  function onKeyboardEvent(event) {
    const detail = event.detail || {};
    if (detail.kind === 'action') { action(detail.value); return; }
    if (detail.kind !== 'text' || typeof detail.value !== 'string') return;
    if (document.body.classList.contains('wh-language-active')) {
      if (detail.language === 'azaaraan') {
        let config;
        try { config = keyboardFrame.contentWindow.AZA_CONFIG; } catch {}
        appendLanguage(parseAzaTokens(detail.value, config));
      } else {
        appendLanguage([...detail.value].map(ch => ch === ' ' ? { type: 'space' } : ch === '\n' ? { type: 'break' } : { type: 'literal', value: ch }));
      }
      return;
    }
    insertText(detail.value, detail.language === 'azaaraan', detail.era || 'Modern');
    syncKeyboardBuffer();
  }
  function onKeyboardFrameLoad() {
    let win;
    try { win = keyboardFrame.contentWindow; } catch {}
    if (!win) return;
    win.addEventListener('aws:keyboard-input', onKeyboardEvent);
    keyboardConnected = true; syncKeyboardBuffer();
  }
  keyboardFrame?.addEventListener('load', onKeyboardFrameLoad);
  if (keyboardFrame?.contentDocument?.readyState === 'complete') onKeyboardFrameLoad();
  languageFrame?.addEventListener('load', flushLanguageTokens);

  const actions = document.querySelector('.topbar-actions');
  if (actions && !$('writerhelper-new-page')) {
    const add = document.createElement('button'); add.type = 'button'; add.id = 'writerhelper-new-page';
    add.className = 'btn tiny light'; add.textContent = '+ New page';
    add.title = 'Add a writing channel to this section'; add.onclick = () => $('new-writing')?.click();
    actions.insertBefore(add, actions.firstChild);
  }
  window.addEventListener('literaryfriend:ready', () => { void seed(); flushLanguageTokens(); }, { once: true });
  window.addEventListener('load', () => { try { if (window.LiteraryFriendApp?.getSnapshot()) void seed(); } catch {} }, { once: true });
  window.AWSKeyboardHost = Object.freeze({ sync: syncKeyboardBuffer, get connected() { return keyboardConnected; } });
})();
