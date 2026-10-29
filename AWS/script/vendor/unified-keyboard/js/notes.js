/* Notes, selection, Unicode-safe editing, and local autosave. No network requests. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const note = $('note'), title = $('noteTitle');
  const storageKey = 'steampunk-keyboard-notes-v1';
  const embedded = /\/embed\.html$/.test(location.pathname) || new URLSearchParams(location.search).get('awsEmbed') === '1';
  let target = note, internalClipboard = '', toastTimer, saveTimer, storageAvailable = true;
  let history = [], historyIndex = -1;
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = text => segmenter ? Array.from(segmenter.segment(text), x => x.segment) : (text.match(/(?:\P{M}\p{M}*|\p{M}+)(?:\u200d\P{M}\p{M}*)*/gu) || []);

  function toast(message, action, callback) {
    clearTimeout(toastTimer);
    $('toastMessage').textContent = message;
    $('toastAction').hidden = !action;
    $('toastAction').textContent = action || '';
    $('toastAction').onclick = () => { callback?.(); $('toast').hidden = true; };
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, action ? 6500 : 3800);
  }
  function snapshot() {
    return { text: note.value, title: title.value, target: target.id, start: target.selectionStart, end: target.selectionEnd };
  }
  function persist() {
    if (embedded) return;
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ text: note.value, title: title.value }));
      $('saveStatus').innerHTML = '<i></i> Saved on this device';
    } catch {
      storageAvailable = false;
      $('saveStatus').textContent = 'Use Save .txt to keep a copy';
    }
  }
  function update() {
    const text = note.value.trim();
    const words = text ? text.split(/\s+/u).length : 0;
    const chars = graphemes(note.value).length;
    $('wordCount').textContent = `${words} ${words === 1 ? 'word' : 'words'} · ${chars} ${chars === 1 ? 'character' : 'characters'}`;
    $('undo').disabled = historyIndex <= 0;
    $('redo').disabled = historyIndex >= history.length - 1;
    if (storageAvailable) $('saveStatus').innerHTML = '<i></i> Saving…';
    clearTimeout(saveTimer); saveTimer = setTimeout(persist, 240);
  }
  function record() {
    const state = snapshot(), previous = history[historyIndex];
    if (previous && previous.text === state.text && previous.title === state.title) history[historyIndex] = state;
    else {
      history = history.slice(0, historyIndex + 1);
      history.push(state);
      if (history.length > 200) history.shift();
      historyIndex = history.length - 1;
    }
    update();
  }
  function focus() { target.focus({ preventScroll: true }); }
  function insert(text) {
    if (target === title) text = text.replace(/[\r\n]/g, ' ');
    const start = target.selectionStart, end = target.selectionEnd;
    if (target === title) text = text.slice(0, Math.max(0, 160 - (title.value.length - (end - start))));
    target.setRangeText(text, start, end, 'end');
    focus(); record();
    target.dispatchEvent(new CustomEvent('keyboardinput', { bubbles: true }));
  }
  function backspace() {
    const start = target.selectionStart, end = target.selectionEnd;
    if (end > start) { insert(''); return; }
    if (!start) return;
    let offset = 0, previous = 0;
    for (const cluster of graphemes(target.value)) {
      if (offset >= start) break;
      previous = offset; offset += cluster.length;
    }
    target.setSelectionRange(previous, start); insert('');
  }
  function undo(delta) {
    const i = historyIndex + delta;
    if (i < 0 || i >= history.length) return;
    historyIndex = i;
    const s = history[i];
    note.value = s.text; title.value = s.title; target = $(s.target) || note;
    focus(); target.setSelectionRange(s.start, s.end); update();
  }
  async function copy(all = false) {
    const selected = target.value.slice(target.selectionStart, target.selectionEnd);
    const value = all ? note.value : selected || target.value;
    internalClipboard = value;
    if (!value) { toast('There is no text to copy yet.'); return; }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      toast('Copied to clipboard.');
    } catch {
      const field = document.createElement('textarea');
      field.value = value; field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none';
      document.body.append(field); field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Internal clipboard remains usable. */ }
      field.remove(); focus();
      toast(copied ? 'Copied to clipboard.' : 'Kept in this app’s clipboard. Device clipboard access is unavailable.');
    }
  }
  async function paste() {
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard API unavailable');
      const value = await navigator.clipboard.readText();
      if (value) { internalClipboard = value; insert(value); return true; }
      toast('Your clipboard is empty.'); return false;
    } catch {
      if (internalClipboard) { insert(internalClipboard); toast('Pasted from this app’s clipboard.'); return true; }
      toast('Paste into the clipboard box, then choose Insert.'); return false;
    }
  }
  function download(filename, blob) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  if (!embedded) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.text === 'string') note.value = saved.text;
      if (saved && typeof saved.title === 'string') title.value = saved.title.slice(0, 160);
    } catch { storageAvailable = false; }
  }
  for (const field of [note, title]) {
    field.addEventListener('focus', () => { target = field; });
    field.addEventListener('input', record);
    field.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === 'z' || key === 'y') {
          event.preventDefault(); undo(key === 'y' || event.shiftKey ? 1 : -1);
        }
      }
    });
  }
  $('undo').onclick = () => undo(-1);
  $('redo').onclick = () => undo(1);
  $('copyNote').onclick = () => copy(true);
  $('downloadNote').onclick = () => {
    const filename = (title.value.trim() || 'Untitled note').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').slice(0, 100) + '.txt';
    download(filename, new Blob([note.value], { type: 'text/plain;charset=utf-8' }));
    toast('Note exported as a text file.');
  };
  $('nativeKeyboard').onclick = () => {
    const enabled = $('nativeKeyboard').getAttribute('aria-pressed') !== 'true';
    for (const field of [note, title]) field.inputMode = enabled ? 'text' : 'none';
    $('nativeKeyboard').setAttribute('aria-pressed', String(enabled));
    $('nativeKeyboard').textContent = `Device keyboard: ${enabled ? 'on' : 'off'}`;
    target.blur();
    if (enabled) focus();
    else toast('Device keyboard off. Use the floating keyboard.');
  };
  $('showGuide').onclick = () => $('guideDialog').showModal();
  document.querySelectorAll('[data-close-dialog]').forEach(button => { button.onclick = () => button.closest('dialog').close(); });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.Notes = { insert, backspace, copy, paste, toast, focus, download, graphemes, getTarget: () => target,
    selectAll: () => { focus(); target.select(); },
    syncText: (value, start=0, end=start) => {
      note.value = String(value || ''); target = note;
      const a = Math.max(0, Math.min(Number(start) || 0, note.value.length));
      const b = Math.max(a, Math.min(Number(end) || 0, note.value.length));
      note.setSelectionRange(a, b);
    },
    getClipboard: () => internalClipboard,
    setClipboard: value => { internalClipboard = value; }
  };
  record(); persist();
})();
