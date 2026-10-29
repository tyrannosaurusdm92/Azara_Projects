/* Aza’raan Writing Studio integration. Existing writing pages and Language
   Studio remain the destinations; no on-screen keyboard controls are loaded. */
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

  const actions = document.querySelector('.topbar-actions');
  if (actions && !$('writerhelper-new-page')) {
    const add = document.createElement('button'); add.type = 'button'; add.id = 'writerhelper-new-page';
    add.className = 'btn tiny light'; add.textContent = '+ New page';
    add.title = 'Add a writing channel to this section'; add.onclick = () => $('new-writing')?.click();
    actions.insertBefore(add, actions.firstChild);
  }
  window.addEventListener('literaryfriend:ready', () => { void seed(); }, { once: true });
  window.addEventListener('load', () => { try { if (window.LiteraryFriendApp?.getSnapshot()) void seed(); } catch {} }, { once: true });
})();
