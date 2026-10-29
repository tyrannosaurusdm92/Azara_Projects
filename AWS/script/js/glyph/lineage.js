(function () {
  'use strict';

  function safe(value) { return StudioModel.html(value || ''); }
  function glyphTile(glyph) {
    const mark = glyph.artwork
      ? `<img src="${glyph.artwork}" alt="">`
      : `<span>${safe(glyph.character || '·')}</span>`;
    return `<span class="lineage-glyph-mark">${mark}</span><span class="lineage-glyph-copy"><strong>${safe(glyph.name || 'Unnamed glyph')}</strong><small>${safe(glyph.ipa || glyph.sound || StudioModel.codepointLabel(glyph))}</small></span>`;
  }
  function render(project, glyphId, mode) {
    const glyph = StudioModel.activeGlyphs(project).find(item => item.id === glyphId);
    const board = document.getElementById('lineage-board');
    if (!glyph) {
      board.innerHTML = '<div class="lineage-empty">Select a character from the active era to inspect its lineage.</div>';
      document.getElementById('lineage-parent-select').innerHTML = '';
      document.getElementById('lineage-selection-hint').textContent = 'Select a glyph card to edit its parents.';
      return;
    }
    const eraIndex = project.eraOrder.indexOf(project.activeEra);
    const earlierEras = project.eraOrder.slice(0, Math.max(0, eraIndex));
    const parents = glyph.parents || [];
    const columns = earlierEras.map(eraId => {
      const era = project.eras[eraId];
      const found = era.glyphs.filter(candidate => parents.includes(candidate.id));
      return `<section class="lineage-era-column"><header><strong>${safe(era.label)}</strong><small>${found.length ? `${found.length} selected parent${found.length === 1 ? '' : 's'}` : 'No parent assigned'}</small></header>${found.length ? found.map(parent => `<button type="button" class="lineage-card parent-card" data-lineage-parent="${safe(parent.id)}">${glyphTile(parent)}</button>`).join('') : '<div class="lineage-unassigned">Unassigned</div>'}</section>`;
    }).join('');
    const current = `<section class="lineage-era-column current-era-column"><header><strong>${safe(StudioModel.activeEra(project).label)}</strong><small>${safe(mode === 'phonetic' ? 'Sound evolution target' : 'Visual target')}</small></header><button type="button" class="lineage-card current-lineage-card">${glyphTile(glyph)}</button><div class="lineage-confidence-pill">${safe(glyph.confidence || 'Unrated match')}</div></section>`;
    board.innerHTML = `<div class="lineage-path-caption">${mode === 'phonetic' ? 'Read the IPA values across time; the links remain manually assigned.' : 'Visual parents are explicit links. No ancestor is inferred automatically.'}</div><div class="lineage-columns">${columns || '<div class="lineage-era-column"><header><strong>Earlier eras</strong><small>No earlier era in this view</small></header><div class="lineage-unassigned">Choose an era after Proto to connect ancestors.</div></div>'}${current}</div>`;
    const options = earlierEras.flatMap(id => project.eras[id].glyphs.map(parent => ({ era: project.eras[id].label, glyph: parent })));
    const select = document.getElementById('lineage-parent-select');
    select.innerHTML = options.map(({ era, glyph: parent }) => `<option value="${safe(parent.id)}" ${parents.includes(parent.id) ? 'selected' : ''}>${safe(era)} · ${safe(parent.character || '□')} · ${safe(parent.name)}</option>`).join('');
    document.getElementById('lineage-confidence').value = glyph.confidence || '';
    document.getElementById('lineage-note').value = glyph.lineageNote || '';
    document.getElementById('lineage-selection-hint').textContent = `${glyph.character || 'Unassigned character'} · ${glyph.name}`;
  }
  window.LineageView = { render };
}());
