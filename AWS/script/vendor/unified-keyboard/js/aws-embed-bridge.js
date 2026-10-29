/* Connect the supplied keyboard to AWS writing destinations without exposing
   its demo notes page as a second writing workspace. */
(() => {
  'use strict';
  if (!/\/embed\.html$/.test(location.pathname) && new URLSearchParams(location.search).get('awsEmbed') !== '1') return;
  const notes = window.Notes;
  if (!notes) return;
  function send(kind, value) {
    const state = window.FloatingKeyboard?.getState?.() || {};
    window.dispatchEvent(new CustomEvent('aws:keyboard-input', {
      detail: { kind, value, language: state.language || 'qwerty', era: state.era || 'Modern' }
    }));
  }
  notes.insert = value => {
    const text = String(value ?? '');
    if (!text) return;
    if (text === '\n') send('action', 'Enter');
    else send('text', text);
  };
  notes.backspace = () => send('action', 'Backspace');
  notes.selectAll = () => send('action', 'SelectAll');
})();
