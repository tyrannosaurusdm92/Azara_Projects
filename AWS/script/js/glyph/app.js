(function () {
  'use strict';
  let project = null;
  let selectedId = null;
  let lineageId = null;
  let activeFilter = 'all';
  let saveTimer = null;
  let dragDepth = 0;
  let markGroup = 'ordinary';
  let selectedMarks = [];
  let transformState = { scale: 1, rotate: 0, skew: 0, flipX: false, flipY: false, dx: 0, dy: 0 };
  const $ = id => document.getElementById(id);
  const html = value => StudioModel.html(value == null ? '' : value);
  const currentEra = () => project && project.eras[project.activeEra];
  const glyphs = (eraId = project.activeEra) => project.eras[eraId] ? project.eras[eraId].glyphs : [];
  const orderedGlyphs = (eraId = project.activeEra) => glyphs(eraId).slice().sort((a, b) => a.order - b.order);
  const selectedGlyph = () => glyphs().find(glyph => glyph.id === selectedId) || null;
  const saveState = $('save-state');
  const saveLabel = $('save-label');
  const toastStack = $('toast-stack');

  function toast(message, error = false) {
    const item = document.createElement('div'); item.className = `toast${error ? ' error' : ''}`; item.textContent = message; toastStack.append(item); setTimeout(() => item.remove(), 3800);
  }
  function setSaveState(state, label) { saveState.classList.toggle('saving', state === 'saving'); saveState.classList.toggle('error', state === 'error'); saveLabel.textContent = label; }
  function queueSave() {
    clearTimeout(saveTimer); project.updatedAt = new Date().toISOString(); setSaveState('saving', 'Saving…');
    saveTimer = setTimeout(async () => { try { await StudioStorage.save(project); setSaveState('saved', 'Saved in this browser'); } catch (error) { setSaveState('error', 'Save failed'); toast(error.message, true); } }, 420);
  }
  async function saveNow() { clearTimeout(saveTimer); setSaveState('saving', 'Saving…'); try { await StudioStorage.save(project); setSaveState('saved', 'Saved in this browser'); } catch (error) { setSaveState('error', 'Save failed'); toast(error.message, true); } }
  function updateGlyph(id, patch, options = {}) {
    const eraId = options.eraId || project.activeEra; const list = glyphs(eraId); const index = list.findIndex(glyph => glyph.id === id); if (index < 0) return;
    const prior = list[index];
    const updated = Object.assign({}, prior, patch);
    if (Object.prototype.hasOwnProperty.call(patch,'character') && updated.character !== prior.character) {
      const occupied = project.unicodeRegistry?.find(slot=>slot.value===updated.character && slot.status==='assigned' && slot.glyphId!==id);
      if (occupied) {toast('Unicode already assigned to another glyph.', true); return;}
      releaseGlyph(prior);
    }
    list[index] = updated;
    if (['character','origin','sound','ipa','category'].some(field=>Object.prototype.hasOwnProperty.call(patch, field))) registerGlyph(updated);
    if (!options.noSave) queueSave();
    if (!options.noCards && eraId === project.activeEra) renderGlyphCards();
    if (!options.noDetails && id === selectedId && eraId === project.activeEra) renderSelectedDetails(false);
    if (document.getElementById('view-inventory').classList.contains('active')) renderInventory();
    if (document.getElementById('view-preview').classList.contains('active')) renderSpacingPreview(false);
  }
  function setActiveEra(eraId) {
    if (!project.eras[eraId]) return;
    project.activeEra = eraId; selectedId = orderedGlyphs(eraId)[0]?.id || null; lineageId = selectedId;
    document.querySelectorAll('.era-selector').forEach(select => { if (select.value !== eraId) select.value = eraId; });
    queueSave(); renderAll(true);
  }
  function populateEraSelectors() {
    const markup = project.eraOrder.map(id => `<option value="${html(id)}">${html(project.eras[id].label)}</option>`).join('');
    document.querySelectorAll('.era-selector').forEach(select => { select.innerHTML = markup; select.value = project.activeEra; });
  }
  function setView(name) {
    document.querySelectorAll('#aws-glyph-panel .nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === name));
    document.querySelectorAll('#aws-glyph-panel .view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
    if (name === 'sheets') renderSheets();
    if (name === 'preview') renderSpacingPreview();
    if (name === 'inventory') renderInventory();
    if (name === 'evolution') renderLineage();
    if (name === 'marks') renderMarks();
    
    if (name === 'fonts') renderFonts();
  }

  function ensureUnicodeVault(){
    const basis=window.AWSKhmerUnicodeRegistry||[];
    const existing=new Map((project.unicodeRegistry||[]).map(x=>[x.codepoint,x]));
    project.unicodeRegistry=basis.map(x=>({...x,...(existing.get(x.codepoint)||{})}));
    // Reconcile against active glyphs: removed glyphs release codepoints, never delete them.
    const all=Object.values(project.eras).flatMap(e=>e.glyphs);
    const known=new Map(all.filter(g=>g.character).map(g=>[g.id,g]));
    for(const slot of project.unicodeRegistry){
      if(slot.glyphId&&!known.has(slot.glyphId)){slot.glyphId=null;slot.status='unassigned';}
    }
    for(const glyph of all){
      const cps=Array.from(glyph.character||'');if(!cps.length)continue;
      if(cps.length!==1)continue;
      const cp='U+'+cps[0].codePointAt(0).toString(16).toUpperCase().padStart(4,'0');
      const slot=project.unicodeRegistry.find(x=>x.codepoint===cp);
      if(slot && (!slot.glyphId || slot.glyphId===glyph.id) && slot.eligible){slot.status='assigned';slot.glyphId=glyph.id;slot.sound=glyph.sound;slot.ipa=glyph.ipa;slot.origin=glyph.origin||'';}
    }
    publishKeyboardMapping();
  }
  function publishKeyboardMapping(){
    window.AWSGlyphAssignments=Object.fromEntries((project.eras.modern?.glyphs||[]).filter(g=>g.key&&g.character).map(g=>[g.key,{character:g.character,ipa:g.ipa,sound:g.sound,origin:g.origin||''}]));
    window.AWSExtraAccents=(project.eras.modern?.glyphs||[]).filter(g=>g.category==='accent' && g.character).map(g=>({value:g.character,name:g.name||g.sound||'Custom accent',ipa:g.ipa,sound:g.sound}));
    window.dispatchEvent(new Event('aws:glyph-mapping-updated'));
  }
  function registerGlyph(glyph){
    const slot=project.unicodeRegistry.find(x=>x.value===glyph.character);
    if(slot){slot.glyphId=glyph.id;slot.status='assigned';slot.ipa=glyph.ipa;slot.sound=glyph.sound;slot.origin=glyph.origin||'';}
    publishKeyboardMapping();
  }
  function releaseGlyph(glyph){
    for(const slot of project.unicodeRegistry.filter(x=>x.glyphId===glyph.id)){slot.glyphId=null;slot.status='unassigned';slot.ipa='';slot.sound='';slot.origin='';}
    publishKeyboardMapping();
  }
  function firstFreeSlot(type){return project.unicodeRegistry.find(x=>x.type===type&&x.eligible&&x.status!=='assigned');}
  function assignSlot(glyph,slot){
    if(!slot||slot.status==='assigned'&&slot.glyphId!==glyph.id)return false;
    releaseGlyph(glyph);glyph.character=slot.value;glyph.codepoint=slot.value.codePointAt(0);
    glyph.category=slot.type==='letter'?'letter':'accent';registerGlyph(glyph);queueSave();renderAll(true);return true;
  }
  function renderUnicodeVault(){
    const summary=$('aws-registry-summary'),host=$('aws-registry-slots');if(!summary||!project)return;
    const slots=project.unicodeRegistry,free=slots.filter(x=>x.eligible&&x.status!=='assigned');
    summary.textContent=slots.length+' preserved Khmer codepoints · '+free.length+' unassigned letter/accent slots · unused and reserved codes retained for later mapping.';
    const filter=$('aws-registry-filter').value;host.replaceChildren();
    for(const slot of slots.filter(x=>filter==='all'||(filter==='unassigned'?x.status!=='assigned':x.status==='assigned'))){
      const button=document.createElement('button');button.type='button';button.disabled=!slot.eligible||slot.status==='assigned'&&slot.glyphId!==selectedId;
      button.title=slot.name+' · '+slot.type;button.textContent=slot.value+' '+slot.codepoint;
      const small=document.createElement('small');small.textContent=(slot.status==='assigned'?'Assigned':'Available')+' · '+slot.type;button.append(small);
      button.onclick=()=>{const glyph=selectedGlyph();if(!glyph)return toast('Select a glyph first.',true);if(!assignSlot(glyph,slot))toast('This Unicode slot is assigned to another glyph.',true)};
      host.append(button);
    }
  }

  function renderCounts() {
    const list = glyphs(); const era = currentEra(); const art = list.filter(glyph => glyph.artwork).length; const defined = list.filter(glyph => glyph.meaning.trim()).length;
    $('nav-glyph-count').textContent = list.length; $('summary-glyph-count').textContent = list.length; $('summary-art-count').textContent = art; $('summary-defined-count').textContent = defined;
    $('era-target-count').textContent = era.id === 'modern' ? `${list.length} glyphs · ${era.targetCount} base-key target` : `${list.length} / ${era.targetCount} target rows`;
  }
  function symbol(glyph) {
    if (glyph.artwork) return `<img src="${glyph.artwork}" alt="${html(glyph.name)} artwork">`;
    return `<span class="glyph-symbol">${html(glyph.character || '＋')}</span><span class="glyph-fallback">${html(StudioModel.codepointLabel(glyph))}</span>`;
  }
  function renderGlyphCards() {
    if (!project) return;
    const search = $('glyph-search').value.trim().toLocaleLowerCase(); const filter = activeFilter;
    const cards = orderedGlyphs().filter(glyph => {
      const value = `${glyph.character} ${glyph.name} ${glyph.meaning} ${glyph.ipa} ${glyph.sound} ${glyph.transliteration} ${StudioModel.codepointLabel(glyph)}`.toLocaleLowerCase();
      return (!search || value.includes(search)) && (filter === 'all' || (filter === 'art' ? Boolean(glyph.artwork) : !glyph.artwork));
    });
    const grid = $('glyph-grid');
    grid.innerHTML = cards.map(glyph => `<button class="glyph-card${glyph.id === selectedId ? ' selected' : ''}${glyph.artwork ? ' has-art' : ''}" type="button" data-glyph-card="${html(glyph.id)}" aria-label="Select ${html(glyph.name)}"><div class="glyph-art">${symbol(glyph)}</div><span class="glyph-card-footer"><span class="glyph-card-label">${html(glyph.name || 'Unnamed glyph')}</span><span class="glyph-card-code">${html(StudioModel.codepointLabel(glyph))}</span></span></button>`).join('');
    $('glyph-empty-state').classList.toggle('hidden', cards.length > 0); grid.classList.toggle('hidden', cards.length === 0);
    grid.querySelectorAll('[data-glyph-card]').forEach(card => {
      card.addEventListener('click', () => selectGlyph(card.dataset.glyphCard));
      card.addEventListener('dragover', event => { event.preventDefault(); card.classList.add('drag-target'); });
      card.addEventListener('dragleave', () => card.classList.remove('drag-target'));
      card.addEventListener('drop', async event => { event.preventDefault(); card.classList.remove('drag-target'); await assignFiles(Array.from(event.dataTransfer.files || []), card.dataset.glyphCard, true); });
    });
    renderCounts();
  }
  async function selectGlyph(id) { const glyph = glyphs().find(item => item.id === id); if (!glyph) return; selectedId = id; lineageId = id; renderGlyphCards(); await renderSelectedDetails(true); }
  function renderSelectedDetails(loadCanvas) {
    const glyph = selectedGlyph(); const remove = $('remove-glyph-button');
    if (!glyph) {
      remove.disabled = true; $('selected-glyph').textContent = '＋'; $('selected-codepoint').textContent = 'No characters'; $('selected-glyph-name').textContent = 'Add a character to begin';
      document.querySelectorAll('.editor-scroll input,.editor-scroll textarea').forEach(input => { if (input.type !== 'range' && input.type !== 'color') input.value = ''; });
      GlyphEditor.select(null); return Promise.resolve();
    }
    remove.disabled = false; $('selected-glyph').innerHTML = glyph.artwork ? `<img src="${glyph.artwork}" alt="">` : html(glyph.character || '＋');
    $('selected-codepoint').textContent = StudioModel.codepointLabel(glyph); $('selected-glyph-name').textContent = glyph.name || 'Unnamed glyph';
    $('glyph-character-input').value = glyph.character || ''; $('glyph-name-input').value = glyph.name || '';
    $('glyph-origin-input').value = glyph.origin || '';$('glyph-type-letter').checked = glyph.category==='letter'||glyph.category==='independent'||glyph.category==='consonant';$('glyph-type-accent').checked = glyph.category==='accent'||glyph.category==='mark';
    $('glyph-ipa-input').value = glyph.ipa || ''; $('glyph-meaning-input').value = glyph.meaning || ''; $('glyph-sound-input').value = glyph.sound || '';
    $('glyph-transliteration-input').value = glyph.transliteration || ''; $('glyph-latin-input').value = glyph.latinSubstitute || ''; $('glyph-notes-input').value = glyph.notes || '';
    [['glyph-size-input', 'size', 'glyph-size-value', value => `${value}%`], ['glyph-baseline-input', 'baseline', 'glyph-baseline-value', value => `${value}%`], ['glyph-left-spacing-input', 'leftSpacing', 'glyph-left-spacing-value', value => `${value} units`], ['glyph-right-spacing-input', 'rightSpacing', 'glyph-right-spacing-value', value => `${value} units`], ['glyph-advance-input', 'advanceWidth', 'glyph-advance-value', value => `${value} units`]].forEach(([inputId, field, outputId, format]) => { $(inputId).value = glyph[field]; $(outputId).textContent = format(glyph[field]); });
    $('baseline-guide').style.top = `${glyph.baseline}%`;
    if (loadCanvas) {
      transformState = { scale: 1, rotate: 0, skew: 0, flipX: false, flipY: false, dx: 0, dy: 0 };
      $('transform-scale-slider').value = 100; $('transform-scale-value').textContent = '100%';
      $('transform-rotate-slider').value = 0; $('transform-rotate-value').textContent = '0°';
      $('transform-skew-slider').value = 0; $('transform-skew-value').textContent = '0°';
    }
    const status = $('artwork-status'); status.textContent = glyph.artwork ? 'Artwork ready' : 'No artwork'; status.classList.toggle('has-art', Boolean(glyph.artwork));
    $('board-placeholder').classList.toggle('has-art', Boolean(glyph.artwork));
    $('brush-size').value = project.settings.brushSize; $('brush-opacity').value = project.settings.brushOpacity;
    return loadCanvas ? GlyphEditor.select(glyph, patch => updateGlyph(glyph.id, Object.assign({ vectorContours: [] }, patch), { noCards: true, noDetails: true })) : Promise.resolve();
  }
  function setGlyphField(field, value) {
    const glyph = selectedGlyph(); if (!glyph) return;
    updateGlyph(glyph.id, { [field]: value }, { noCards: true, noDetails: true });
    if (field === 'name') { $('selected-glyph-name').textContent = value || 'Unnamed glyph'; renderGlyphCards(); }
    if (field === 'meaning') renderGlyphCards();
    renderCounts();
    if ($('view-preview').classList.contains('active')) renderSpacingPreview(false);
  }
  function renderSheets() {
    if (!project) return;
    $('cells-per-page').value = project.settings.cellsPerPage; $('paper-size').value = project.settings.paperSize;
    const pages = SheetGenerator.getPages(project); $('sheet-page-count').textContent = `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`;
    $('sheet-character-count').textContent = `${glyphs().length} ${glyphs().length === 1 ? 'character' : 'characters'}`;
    $('sheet-era-label').textContent = currentEra().label;
    SheetGenerator.createPreview(project, $('sheet-preview-grid'));
  }
  function renderSpacingPreview(syncInput = true) {
    if (!project) return;
    const { letterSpacing: letter, lineSpacing: line, glyphSize: size } = project.settings;
    $('global-letter-spacing').value = letter; $('letter-spacing-value').textContent = `${letter} px`;
    $('global-line-spacing').value = line; $('line-spacing-value').textContent = `${Number(line).toFixed(2).replace(/0$/, '')}×`;
    $('global-glyph-size').value = size; $('global-glyph-size-value').textContent = `${size}%`;
    if (syncInput) $('preview-text').value = project.previewText;
    const host = $('preview-canvas'); host.innerHTML = '';
    const map = new Map(glyphs().filter(g => g.character).map(g => [g.character, g])); const parts = StudioModel.graphemes(project.previewText); const chunkSize = 54;
    for (let start = 0; start < parts.length; start += chunkSize) {
      const lineEl = document.createElement('div'); lineEl.className = 'preview-line'; lineEl.style.setProperty('--global-line-height', line); lineEl.style.minHeight = `${63 * line}px`;
      parts.slice(start, start + chunkSize).forEach(character => {
        if (character === '\n') { lineEl.append(document.createElement('br')); return; }
        if (character === ' ') { const space = document.createElement('span'); space.className = 'preview-space'; space.style.width = `${Math.max(8, 9 + letter)}px`; lineEl.append(space); return; }
        const glyph = map.get(character); const span = document.createElement('span'); span.className = `preview-glyph${glyph ? '' : ' unknown'}`;
        const chosenSize = glyph ? glyph.size : size; span.style.setProperty('--preview-size', Math.round(chosenSize * size / 100)); span.style.fontSize = `${Math.round(chosenSize * size / 100 * .32)}px`;
        span.style.setProperty('--glyph-gap', `${letter + ((glyph ? glyph.leftSpacing + glyph.rightSpacing : 0) * .035)}px`);
        span.style.transform = `translateY(${((glyph ? glyph.baseline : 72) - 72) * .45}px)`;
        if (glyph && glyph.artwork) { const image = document.createElement('img'); image.src = glyph.artwork; image.alt = glyph.name; image.style.height = `${Math.round(chosenSize * size / 100 * .48)}px`; span.append(image); }
        else span.textContent = glyph ? glyph.character : '□';
        lineEl.append(span);
      }); host.append(lineEl);
    }
    if (!parts.length) host.textContent = 'Type a character sequence above to preview it.';
  }
  function renderInventory() {
    const rows = orderedGlyphs();
    $('inventory-stats').innerHTML = `<span>${rows.length} rows</span><span>${rows.filter(g => g.artwork).length} with artwork</span><span>${rows.filter(g => g.ipa).length} with IPA</span><span>${rows.filter(g => g.character).length} Unicode assigned</span>`;
    $('inventory-table-body').innerHTML = rows.map(glyph => `<tr data-inventory-row="${html(glyph.id)}"><td><input class="inventory-char" data-field="character" value="${html(glyph.character)}" aria-label="Character" maxlength="8"><small>${html(StudioModel.codepointLabel(glyph))}</small></td><td><input data-field="ipa" value="${html(glyph.ipa)}" aria-label="IPA"></td><td><input data-field="sound" value="${html(glyph.sound)}" aria-label="Sound or family"></td><td><input data-field="transliteration" value="${html(glyph.transliteration)}" aria-label="Transliteration"></td><td><input data-field="latinSubstitute" value="${html(glyph.latinSubstitute)}" aria-label="Latin substitute"></td><td><code>${html(StudioModel.codepointLabel(glyph))}</code></td><td><select data-field="category" aria-label="Glyph type"><option ${glyph.category === 'independent' ? 'selected' : ''}>independent</option><option ${glyph.category === 'consonant' ? 'selected' : ''}>consonant</option><option ${glyph.category === 'vowel' ? 'selected' : ''}>vowel</option><option ${glyph.category === 'mark' ? 'selected' : ''}>mark</option><option ${glyph.category === 'special' ? 'selected' : ''}>special</option><option ${glyph.category === 'punctuation' ? 'selected' : ''}>punctuation</option></select></td><td><input data-field="notes" value="${html(glyph.notes)}" aria-label="Notes"></td><td><button class="small-action" type="button" data-edit-glyph="${html(glyph.id)}">Open</button><button class="small-action danger-action" type="button" data-delete-glyph="${html(glyph.id)}" aria-label="Delete ${html(glyph.name)}">×</button></td></tr>`).join('');
  }
  function renderLineage() {
    if (!lineageId || !glyphs().some(g => g.id === lineageId)) lineageId = selectedId || orderedGlyphs()[0]?.id || null;
    LineageView.render(project, lineageId, $('lineage-mode').value);
  }
  function renderMarks() {
    $('ordinary-mark-count').textContent = project.marks.length; $('special-mark-count').textContent = project.specialMarks.length;
    const entries = markGroup === 'ordinary' ? project.marks.map(mark => ({ ...mark, special: false })) : project.specialMarks.map(mark => ({ ...mark, special: true }));
    const selectedBaseId = $('mark-base-select').value;
    $('mark-grid').innerHTML = entries.map(mark => `<button type="button" class="mark-card${selectedMarks.includes(mark.id) ? ' selected' : ''}" data-mark-id="${html(mark.id)}" data-mark-special="${mark.special}"><span class="mark-char">${html(mark.character)}</span><strong>${html(mark.name)}</strong><small>${html(mark.ipa || mark.kind)} · ${html(mark.kind)}</small></button>`).join('');
    $('mark-grid').querySelectorAll('[data-mark-id]').forEach(button => button.addEventListener('click', () => toggleMark(button.dataset.markId, button.dataset.markSpecial === 'true')));
    const bases = orderedGlyphs().filter(g => g.character); $('mark-base-select').innerHTML = `<option value="">Choose a base glyph</option>${bases.map(g => `<option value="${html(g.id)}">${html(g.character)} · ${html(g.name)}</option>`).join('')}`; $('mark-base-select').value = selectedBaseId;
    updateMarkPreview();
  }
  function toggleMark(id, isSpecial) {
    const selected = selectedMarks.findIndex(item => item.id === id);
    if (selected >= 0) selectedMarks.splice(selected, 1);
    else if (selectedMarks.length >= Number(project.rules.maxStackedMarks || 3)) { toast(`The stack limit is ${project.rules.maxStackedMarks || 3} marks.`, true); return; }
    else selectedMarks.push({ id, special: isSpecial });
    renderMarks();
  }
  function updateMarkPreview() {
    const base = glyphs().find(g => g.id === $('mark-base-select').value);
    const entries = selectedMarks.map(item => (item.special ? project.specialMarks : project.marks).find(mark => mark.id === item.id)).filter(Boolean);
    const baseMark = entries.some(mark => mark.kind === 'base'); const vowelCount = entries.filter(mark => mark.kind === 'vowel').length;
    const archaicStandalone = currentEra().backendEra === 'archaic' && entries.some(mark => ['glottal', 'click'].includes(mark.id));
    const issues = [];
    if (vowelCount > Number(project.rules.maxVowelMarks || 1)) issues.push(`Only ${project.rules.maxVowelMarks || 1} vowel mark is allowed.`);
    if (baseMark && (entries.length > 1 || base)) issues.push('The base mark must be used alone.');
    if (archaicStandalone && (base || entries.length > 1)) issues.push('Proto glottal and click are standalone marks.');
    if (!base && entries.length && !archaicStandalone && !baseMark) issues.push('Choose a base glyph to attach these marks.');
    if (entries.length > Number(project.rules.maxStackedMarks || 3)) issues.push('This stack exceeds the mark limit.');
    $('mark-stack-count').textContent = `${entries.length} / ${project.rules.maxStackedMarks || 3} marks`;
    $('selected-mark-chips').innerHTML = entries.map(mark => `<span class="mark-chip">${html(mark.character)} <small>${html(mark.name)}</small></span>`).join('');
    $('mark-validation').textContent = issues.join(' '); $('mark-validation').classList.toggle('invalid', issues.length > 0);
    const sequence = archaicStandalone && entries.length === 1 ? entries[0].character : `${base ? base.character : ''}${entries.map(mark => mark.character).join('')}`;
    $('mark-composition-preview').textContent = issues.length ? 'The current stack breaks an era rule.' : sequence || 'Choose a base and tap marks to compose.';
  }

  function renderFonts() {
    $('font-family-input').value = project.settings.fontFamily; $('font-version-input').value = project.settings.fontVersion;
    $('font-ascender-input').value = project.settings.ascender; $('font-descender-input').value = project.settings.descender;
    $('font-era-list').innerHTML = project.eraOrder.map(id => {
      const era = project.eras[id]; const ready = era.glyphs.filter(g => g.character && g.artwork && g.vectorContours.length).length;
      return `<article class="font-era-card"><div><strong>${html(era.label)}</strong><span>${ready} traced · ${era.glyphs.length} inventory rows</span></div><div><button class="button button-secondary" data-font-export="${html(id)}" data-format="ttf" ${ready ? '' : 'disabled'}>TTF</button><button class="button button-secondary" data-font-export="${html(id)}" data-format="otf" ${ready ? '' : 'disabled'}>OTF</button></div></article>`;
    }).join('');
    $('font-era-list').querySelectorAll('[data-font-export]').forEach(button => button.addEventListener('click', () => exportFont(button.dataset.fontExport, button.dataset.format)));
    const available = project.eraOrder.some(id => project.eras[id].glyphs.some(g => g.vectorContours.length));
    $('export-all-ttf-button').disabled = !available; $('export-all-otf-button').disabled = !available;
  }
  function renderAll(loadCanvas = true) {
    if(project)renderUnicodeVault();
    $('project-name').value = project.name; populateEraSelectors(); $('inventory-era-selector').value = project.activeEra; $('lineage-era-selector').value = project.activeEra;
    if (!glyphs().some(g => g.id === selectedId)) selectedId = orderedGlyphs()[0]?.id || null;
    $('era-selector').value = project.activeEra;
    renderGlyphCards(); renderCounts(); renderSelectedDetails(loadCanvas);
    if ($('view-sheets').classList.contains('active')) renderSheets();
    if ($('view-preview').classList.contains('active')) renderSpacingPreview();
    if ($('view-inventory').classList.contains('active')) renderInventory();
    if ($('view-evolution').classList.contains('active')) renderLineage();
    if ($('view-marks').classList.contains('active')) renderMarks();
    if ($('view-fonts').classList.contains('active')) renderFonts();
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('Choose an image file.'));
      if (file.size > 24 * 1024 * 1024) return reject(new Error(`${file.name} is larger than 24 MB.`));
      const url = URL.createObjectURL(file); const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url); const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d'); const scale = Math.min(430 / image.naturalWidth, 430 / image.naturalHeight); const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
        ctx.drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height); resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not open ${file.name}.`)); }; image.src = url;
    });
  }
  async function assignFiles(files, startId = selectedId, replaceStart = false) {
    const images = files.filter(file => file.type.startsWith('image/')); if (!images.length) return;
    const list = orderedGlyphs(); const start = Math.max(0, list.findIndex(g => g.id === startId));
    const candidates = list.slice(start).filter(g => !g.artwork || (replaceStart && g.id === startId)).concat(list.slice(0, start).filter(g => !g.artwork));
    if (!candidates.length) { toast('All glyphs in this era already have artwork. Choose a tile to replace one.', true); return; }
    const count = Math.min(images.length, candidates.length);
    for (let index = 0; index < count; index += 1) { try { updateGlyph(candidates[index].id, { artwork: await readFile(images[index]), layers: [] }, { noCards: true, noDetails: true }); } catch (error) { toast(error.message, true); } }
    renderAll(true); toast(`${count} image${count === 1 ? '' : 's'} assigned in ${currentEra().label}.`);
  }
  function createGlyph(character,name,meaning,sound='',ipa='',origin='',type='letter'){
    const slot=firstFreeSlot(type);const raw=String(character||'').trim();
    if(!slot)return 'No unused Khmer '+type+' Unicode slots are available.';
    const explicitlySelected=project.unicodeRegistry.find(x=>x.value===raw&&x.type===type&&x.eligible&&x.status!=='assigned');
    const value=explicitlySelected?.value||slot.value;if(Array.from(value).length>3)return 'Character sequence is too long.';
    if(glyphs().some(g=>g.character===value))return 'That character already exists in this era.';
    const taken=project.unicodeRegistry.find(x=>x.value===value&&x.status==='assigned');if(taken)return 'That Khmer Unicode slot is already assigned.';
    const list=glyphs(),glyph=StudioModel.createGlyph(project.activeEra,list.length,{
      id:StudioModel.createId(project.activeEra+'-glyph'),character:value,codepoint:value.codePointAt(0),
      name:String(name||'New '+type).slice(0,80),meaning:String(meaning||'').slice(0,500),
      sound:String(sound).slice(0,120),ipa:String(ipa).slice(0,80),origin:String(origin).slice(0,160),category:type,order:list.length});
    list.push(glyph);selectedId=glyph.id;lineageId=glyph.id;registerGlyph(glyph);queueSave();renderAll(true);return '';
  }
  function removeGlyph(id) {
    const list = glyphs(); const index = list.findIndex(g => g.id === id); if (index < 0) return;
    const glyph = list[index]; if (!window.confirm(`Remove ${glyph.name || glyph.character || 'this character'} from ${currentEra().label}?`)) return;
    releaseGlyph(glyph);list.splice(index, 1); project.eraOrder.forEach(eraId => project.eras[eraId].glyphs.forEach(item => { item.parents = (item.parents || []).filter(parent => parent !== id); }));
    selectedId = orderedGlyphs()[Math.max(0, index - 1)]?.id || orderedGlyphs()[0]?.id || null; lineageId = selectedId; queueSave(); renderAll(true); toast('Character removed.');
  }
  function downloadBlob(blob, fileName) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
  function safeFileName(value) { return String(value || 'azaaraan-glyph-set').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'azaaraan-glyph-set'; }
  function downloadProject() { downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${safeFileName(project.name)}.azglyph.json`); toast('Portable project saved with artwork, metrics, and era data.'); }
  async function openProject(file) {
    if (!file) return;
    try { project = StudioModel.normalizeProject(JSON.parse(await file.text())); selectedId = orderedGlyphs()[0]?.id || null; lineageId = selectedId; await saveNow(); renderAll(true); toast('Project opened.'); }
    catch (error) { toast(error.message || 'Could not open this project file.', true); }
  }
  function exportJson(value, name) { downloadBlob(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }), name); }
  function exportCsv(headers, rows, name) {
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), name);
  }
  function exportInventory() {
    const headers = ['Character', 'Name', 'IPA', 'Sound', 'Transliteration', 'Latin substitute', 'Unicode', 'Meaning', 'Type', 'Notes'];
    exportCsv(headers, orderedGlyphs().map(g => [g.character, g.name, g.ipa, g.sound, g.transliteration, g.latinSubstitute, StudioModel.codepointLabel(g), g.meaning, g.category, g.notes]), `${safeFileName(project.name)}-${project.activeEra}-inventory.csv`);
  }
  function exportLineage() {
    const relations = project.eraOrder.flatMap(eraId => project.eras[eraId].glyphs.filter(g => g.parents.length || g.lineageNote).map(g => ({ era: eraId, glyphId: g.id, character: g.character, ipa: g.ipa, parents: g.parents, confidence: g.confidence, note: g.lineageNote })));
    exportJson({ schemaVersion: 1, projectId: project.projectId, relationships: relations }, `${safeFileName(project.name)}-lineage.json`);
  }
  function exportMarks() { exportJson({ rules: project.rules, marks: project.marks, specialMarks: project.specialMarks }, `${safeFileName(project.name)}-marks.json`); }
  function exportFont(eraId, format) {
    try { const result = FontExporter.exportEra(project, eraId, format); $('font-output-status').textContent = `${project.eras[eraId].label} ${format.toUpperCase()} downloaded · ${result.glyphCount} outlined characters.`; }
    catch (error) { $('font-output-status').textContent = error.message; toast(error.message, true); }
  }
  async function exportAllFonts(format) {
    const available = project.eraOrder.filter(id => project.eras[id].glyphs.some(g => g.character && g.vectorContours.length));
    if (!available.length) { toast('Trace glyph artwork before exporting fonts.', true); return; }
    for (const eraId of available) { exportFont(eraId, format); await new Promise(resolve => setTimeout(resolve, 450)); }
    const missing = project.eraOrder.length - available.length;
    $('font-output-status').textContent = `${available.length} ${format.toUpperCase()} font${available.length === 1 ? '' : 's'} downloaded.${missing ? ` ${missing} eras have no traced glyphs yet.` : ''}`;
  }
  async function traceSelected() {
    const glyph = selectedGlyph(); if (!glyph || !glyph.artwork) { toast('Upload or draw artwork before tracing it.', true); return; }
    $('trace-glyph-button').disabled = true; $('trace-glyph-button').textContent = 'Loading outline engine…';
    try { const contours = await GlyphImageEngine.trace(glyph.artwork, project.settings.threshold, 1.5); updateGlyph(glyph.id, { vectorContours: contours }); toast(`${contours.length} outline contour${contours.length === 1 ? '' : 's'} saved.`); }
    catch (error) { toast(error.message, true); }
    finally { $('trace-glyph-button').disabled = false; $('trace-glyph-button').textContent = 'Trace to outline'; }
  }
  async function cleanSelected() {
    const glyph = selectedGlyph(); if (!glyph || !glyph.artwork) { toast('Upload or draw artwork before neatening it.', true); return; }
    $('clean-glyph-button').disabled = true; $('clean-glyph-button').textContent = 'Cleaning…';
    try { const artwork = await GlyphImageEngine.neaten(glyph.artwork, project.settings.threshold, 1 + project.settings.neatenStroke / 25); await GlyphEditor.setArtwork(artwork); updateGlyph(glyph.id, { vectorContours: [] }, { noDetails: true }); toast('Artwork cleaned. Trace it again to refresh its outline.'); }
    catch (error) { toast(error.message, true); }
    finally { $('clean-glyph-button').disabled = false; $('clean-glyph-button').textContent = 'Neaten artwork'; }
  }
  function showScanResult(result) {
    const element = $('scan-result'); element.classList.remove('hidden', 'error');
    if (result.error) { element.textContent = result.error; element.classList.add('error'); return; }
    project.activeEra = result.eraId || project.activeEra; selectedId = orderedGlyphs().find(g => !g.artwork)?.id || orderedGlyphs()[0]?.id || null;
    const missing = result.missing ? ` · ${result.missing} character${result.missing === 1 ? '' : 's'} not found` : ''; const mismatch = result.mismatch ? ' · QR came from another project; Unicode matching was used.' : '';
    element.textContent = `${result.era || currentEra().label} page ${result.page} imported · ${result.imported} glyph image${result.imported === 1 ? '' : 's'} added${missing}${mismatch}`;
    queueSave(); renderAll(true); setView('glyphs');
  }
  function bindField(id, field, refreshCards = false) {
    $(id).addEventListener('input', event => { const value = event.target.value; setGlyphField(field, value); if (field === 'name') $('selected-glyph-name').textContent = value || 'Unnamed glyph'; });
  }
  function bindEvents() {
    document.querySelectorAll('#aws-glyph-panel .nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
    document.querySelectorAll('.era-selector').forEach(select => select.addEventListener('change', () => setActiveEra(select.value)));
    $('project-name').addEventListener('input', event => { project.name = event.target.value.slice(0, 100); project.settings.fontFamily = project.settings.fontFamily || project.name; queueSave(); });
    $('glyph-search').addEventListener('input', renderGlyphCards); $('glyph-filter').addEventListener('change', event => { activeFilter = event.target.value; renderGlyphCards(); });
    $('add-glyph-button').addEventListener('click', () => { $('add-glyph-error').textContent = ''; $('new-glyph-character').value = ''; $('new-glyph-name').value = ''; $('new-glyph-meaning').value = '';$('new-glyph-sound').value='';$('new-glyph-ipa').value='';$('new-glyph-origin').value=''; $('add-glyph-dialog').showModal(); setTimeout(() => $('new-glyph-character').focus(), 20); });
    $('cancel-add-glyph').addEventListener('click', () => $('add-glyph-dialog').close());
    $('add-glyph-form').addEventListener('submit', event => { event.preventDefault(); const error = createGlyph($('new-glyph-character').value, $('new-glyph-name').value, $('new-glyph-meaning').value, $('new-glyph-sound').value, $('new-glyph-ipa').value, $('new-glyph-origin').value, $('new-glyph-accent').checked?'accent':'letter'); $('add-glyph-error').textContent = error; if (!error) { $('add-glyph-dialog').close(); toast('Character added.'); } });
    $('remove-glyph-button').addEventListener('click', () => selectedGlyph() && removeGlyph(selectedId));
    $('glyph-character-input').addEventListener('change', event => {
      const glyph = selectedGlyph(); const value = event.target.value.trim(); if (!glyph) return;
      if (Array.from(value).length !== 1) { event.target.value = glyph.character; toast('Use one Unicode character per glyph.', true); return; }
      if (glyphs().some(item => item.id !== glyph.id && item.character === value)) { event.target.value = glyph.character; toast('That character already exists in this era.', true); return; }
      const codepoint = value.codePointAt(0); updateGlyph(glyph.id, { character: value, codepoint, vectorContours: [] }); $('selected-codepoint').textContent = StudioModel.codepointLabel({ character: value }); renderSelectedDetails(false);
    });
    bindField('glyph-origin-input','origin');
    for(const type of ['letter','accent']){
      $('new-glyph-'+type).addEventListener('change',()=>{$('new-glyph-letter').checked=type==='letter';$('new-glyph-accent').checked=type==='accent';});
      $('glyph-type-'+type).addEventListener('change',()=>{const glyph=selectedGlyph();if(!glyph)return;
        const slot=firstFreeSlot(type);if(!slot){toast('No unused Khmer '+type+' Unicode slots are available.',true);renderSelectedDetails(false);return;}
        if(!assignSlot(glyph,slot)){toast('That Unicode is not available.',true);renderSelectedDetails(false);return;}
        $('glyph-type-letter').checked=type==='letter';$('glyph-type-accent').checked=type==='accent';
      });
    }
    $('aws-registry-filter').addEventListener('change',renderUnicodeVault);
    $('aws-registry-export').addEventListener('click',()=>exportJson({entries:project.unicodeRegistry},'aws-khmer-unicode-vault.json'));
    bindField('glyph-name-input', 'name'); bindField('glyph-ipa-input', 'ipa'); bindField('glyph-meaning-input', 'meaning'); bindField('glyph-sound-input', 'sound'); bindField('glyph-transliteration-input', 'transliteration'); bindField('glyph-latin-input', 'latinSubstitute'); bindField('glyph-notes-input', 'notes');
    [['glyph-size-input', 'size', value => `${value}%`], ['glyph-baseline-input', 'baseline', value => `${value}%`], ['glyph-left-spacing-input', 'leftSpacing', value => `${value} units`], ['glyph-right-spacing-input', 'rightSpacing', value => `${value} units`], ['glyph-advance-input', 'advanceWidth', value => `${value} units`]].forEach(([id, field, format]) => $(id).addEventListener('input', event => { const value = Number(event.target.value); $(`${field === 'size' ? 'glyph-size' : field === 'baseline' ? 'glyph-baseline' : field === 'leftSpacing' ? 'glyph-left-spacing' : field === 'rightSpacing' ? 'glyph-right-spacing' : 'glyph-advance'}-value`).textContent = format(value); if (field === 'baseline') $('baseline-guide').style.top = `${value}%`; setGlyphField(field, value); }));
    $('upload-glyph-button').addEventListener('click', () => $('glyph-image-input').click());
    $('glyph-image-input').addEventListener('change', async event => { const file = event.target.files[0]; try { if (file && selectedGlyph()) { await GlyphEditor.setArtwork(await readFile(file)); updateGlyph(selectedId, { vectorContours: [] }, { noDetails: true }); toast('Glyph image uploaded.'); } } catch (error) { toast(error.message, true); } event.target.value = ''; });
    $('batch-upload-button').addEventListener('click', () => $('batch-image-input').click()); $('batch-image-input').addEventListener('change', async event => { await assignFiles(Array.from(event.target.files || [])); event.target.value = ''; });
    $('export-project-button').addEventListener('click', downloadProject); $('import-project-button').addEventListener('click', () => $('project-file-input').click()); $('project-file-input').addEventListener('change', async event => { await openProject(event.target.files[0]); event.target.value = ''; });
    $('cells-per-page').addEventListener('change', event => { project.settings.cellsPerPage = Number(event.target.value); queueSave(); renderSheets(); }); $('paper-size').addEventListener('change', event => { project.settings.paperSize = event.target.value; queueSave(); renderSheets(); });
    $('print-sheets-button').addEventListener('click', async () => { try { await SheetGenerator.printPages(project); } catch (error) { toast(error.message, true); } });
    $('download-pngs-button').addEventListener('click', async event => { const button = event.currentTarget; button.disabled = true; try { await SheetGenerator.downloadPngs(project); toast('PNG sheets downloaded.'); } catch (error) { toast(error.message, true); } button.disabled = false; });
    $('global-letter-spacing').addEventListener('input', event => { project.settings.letterSpacing = Number(event.target.value); queueSave(); renderSpacingPreview(false); }); $('global-line-spacing').addEventListener('input', event => { project.settings.lineSpacing = Number(event.target.value); queueSave(); renderSpacingPreview(false); }); $('global-glyph-size').addEventListener('input', event => { project.settings.glyphSize = Number(event.target.value); queueSave(); renderSpacingPreview(false); }); $('preview-text').addEventListener('input', event => { project.previewText = event.target.value.slice(0, 8000); queueSave(); renderSpacingPreview(false); });
    $('scan-upload-button').addEventListener('click', () => $('scan-file-input').click()); $('scan-file-input').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; $('scan-result').classList.remove('hidden', 'error'); $('scan-result').textContent = 'Reading sheet QR and matching its boxes…'; try { showScanResult(await GlyphScanner.scanFile(file)); } catch (error) { showScanResult({ error: error.message }); } event.target.value = ''; });
    const cameraDialog = $('camera-dialog'); const closeCamera = () => { GlyphScanner.stopCamera(); if (cameraDialog.open) cameraDialog.close(); };
    $('scan-camera-button').addEventListener('click', async () => { cameraDialog.showModal(); await GlyphScanner.startCamera(); }); $('close-camera-button').addEventListener('click', closeCamera); $('cancel-camera-button').addEventListener('click', closeCamera);
    $('capture-page-button').addEventListener('click', async () => { try { const result = await GlyphScanner.captureCameraPage(); closeCamera(); showScanResult(result); } catch (error) { $('camera-status').textContent = error.message; } }); cameraDialog.addEventListener('close', () => GlyphScanner.stopCamera());
    $('help-button').addEventListener('click', () => $('help-dialog').showModal()); $('close-help-button').addEventListener('click', () => $('help-dialog').close()); $('close-help-done').addEventListener('click', () => $('help-dialog').close());
    document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => { GlyphEditor.setTool(button.dataset.tool); document.querySelectorAll('[data-tool]').forEach(item => item.classList.toggle('active', item === button)); }));
    $('brush-size').addEventListener('input', event => { project.settings.brushSize = Number(event.target.value); queueSave(); }); $('brush-opacity').addEventListener('input', event => { project.settings.brushOpacity = Number(event.target.value); queueSave(); });
    $('undo-drawing-button').addEventListener('click', () => GlyphEditor.undo()); $('redo-drawing-button').addEventListener('click', () => GlyphEditor.redo());
    $('add-layer-button').addEventListener('click', () => GlyphEditor.addLayer()); $('duplicate-layer-button').addEventListener('click', () => GlyphEditor.duplicateLayer()); $('merge-layer-button').addEventListener('click', () => GlyphEditor.mergeLayerDown()); $('delete-layer-button').addEventListener('click', () => GlyphEditor.deleteLayer());
    $('trace-glyph-button').addEventListener('click', traceSelected); $('clean-glyph-button').addEventListener('click', cleanSelected); $('neaten-slider').addEventListener('input', event => { project.settings.neatenStroke = Number(event.target.value); $('neaten-value').textContent = `${event.target.value}%`; GlyphEditor.setNeaten(event.target.value); queueSave(); });
    const applyTransform = commit => { GlyphEditor.applyTransform(transformState); if (commit) GlyphEditor.commitTransform(); };
    [['transform-scale-slider', 'scale', value => Number(value) / 100], ['transform-rotate-slider', 'rotate', Number], ['transform-skew-slider', 'skew', Number]].forEach(([id, field, parse]) => $(id).addEventListener('input', event => { transformState[field] = parse(event.target.value); $(`${field === 'scale' ? 'transform-scale' : `transform-${field}`}-value`).textContent = field === 'scale' ? `${event.target.value}%` : `${event.target.value}°`; applyTransform(false); }));
    ['transform-scale-slider', 'transform-rotate-slider', 'transform-skew-slider'].forEach(id => $(id).addEventListener('change', () => applyTransform(true)));
    $('nudge-step-slider').addEventListener('input', event => { project.settings.nudgeStep = Number(event.target.value); $('nudge-value').textContent = `${event.target.value} px`; queueSave(); });
    document.querySelectorAll('[data-nudge]').forEach(button => button.addEventListener('click', () => { const [dx, dy] = button.dataset.nudge.split(',').map(Number); GlyphEditor.nudge(dx, dy, project.settings.nudgeStep); }));
    $('flip-horizontal-button').addEventListener('click', () => { transformState.flipX = !transformState.flipX; applyTransform(true); }); $('flip-vertical-button').addEventListener('click', () => { transformState.flipY = !transformState.flipY; applyTransform(true); });
    $('rotate-left-button').addEventListener('click', () => { transformState.rotate -= 15; $('transform-rotate-slider').value = transformState.rotate; $('transform-rotate-value').textContent = `${transformState.rotate}°`; applyTransform(true); }); $('rotate-right-button').addEventListener('click', () => { transformState.rotate += 15; $('transform-rotate-slider').value = transformState.rotate; $('transform-rotate-value').textContent = `${transformState.rotate}°`; applyTransform(true); });
    $('duplicate-glyph-button').addEventListener('click', () => { const source = selectedGlyph(); if (!source) return; const copy = StudioModel.createGlyph(project.activeEra, glyphs().length, { name: `${source.name} copy`, artwork: source.artwork, layers: JSON.parse(JSON.stringify(source.layers)), size: source.size, baseline: source.baseline, leftSpacing: source.leftSpacing, rightSpacing: source.rightSpacing, advanceWidth: source.advanceWidth, vectorContours: JSON.parse(JSON.stringify(source.vectorContours)), order: glyphs().length }); glyphs().push(copy); selectedId = copy.id; lineageId = copy.id; queueSave(); renderAll(true); toast('Glyph artwork duplicated. Assign a unique character when ready.'); });
    $('swap-glyph-button').addEventListener('click', () => { const list = orderedGlyphs(); const index = list.findIndex(g => g.id === selectedId); const next = list[index + 1]; if (!next) { toast('There is no next glyph to swap with.', true); return; } const first = selectedGlyph(); const artwork = first.artwork; const layers = first.layers; updateGlyph(first.id, { artwork: next.artwork, layers: next.layers, vectorContours: next.vectorContours }, { noCards: true, noDetails: true }); updateGlyph(next.id, { artwork, layers, vectorContours: first.vectorContours }, { noCards: true, noDetails: true }); renderAll(true); toast(`Artwork swapped with ${next.name}.`); });
    $('inventory-table-body').addEventListener('change', event => {
      const field = event.target.dataset.field; const row = event.target.closest('[data-inventory-row]'); if (!field || !row) return; const glyph = glyphs().find(item => item.id === row.dataset.inventoryRow); if (!glyph) return;
      let value = event.target.value;
      if (field === 'character') { value = value.trim(); if (value && Array.from(value).length !== 1) { toast('Use one Unicode character per glyph.', true); renderInventory(); return; } if (glyphs().some(item => item.id !== glyph.id && item.character === value && value)) { toast('That character already exists in this era.', true); renderInventory(); return; } updateGlyph(glyph.id, { character: value, codepoint: value ? value.codePointAt(0) : null, vectorContours: [] }); }
      else updateGlyph(glyph.id, { [field]: value }, { noCards: true });
      renderInventory();
    });
    $('inventory-table-body').addEventListener('click', event => { const edit = event.target.closest('[data-edit-glyph]'); const remove = event.target.closest('[data-delete-glyph]'); if (edit) { selectGlyph(edit.dataset.editGlyph); setView('glyphs'); } if (remove) removeGlyph(remove.dataset.deleteGlyph); });
    $('add-inventory-row-button').addEventListener('click', () => { const row = StudioModel.createGlyph(project.activeEra, glyphs().length, { order: glyphs().length }); glyphs().push(row); selectedId = row.id; queueSave(); renderAll(true); });
    $('restore-era-targets-button').addEventListener('click', () => { const era = currentEra(); let order = glyphs().length; while (glyphs().length < era.targetCount) glyphs().push(StudioModel.createGlyph(era.id, order, { order: order++ })); queueSave(); renderInventory(); renderCounts(); toast(`Restored ${era.targetCount} target rows.`); }); $('export-inventory-csv-button').addEventListener('click', exportInventory);
    $('lineage-mode').addEventListener('change', renderLineage); $('lineage-search').addEventListener('input', event => { const query = event.target.value.trim().toLocaleLowerCase(); if (!query) return; const found = orderedGlyphs().find(g => `${g.character} ${g.name} ${g.ipa} ${g.sound}`.toLocaleLowerCase().includes(query)); if (found) { lineageId = found.id; renderLineage(); } });
    $('save-lineage-button').addEventListener('click', () => { const glyph = glyphs().find(g => g.id === lineageId); if (!glyph) return; const parents = Array.from($('lineage-parent-select').selectedOptions).map(option => option.value).slice(0, 8); updateGlyph(glyph.id, { parents, confidence: $('lineage-confidence').value, lineageNote: $('lineage-note').value }, { noCards: true, noDetails: true }); renderLineage(); toast('Lineage relationship saved.'); }); $('export-lineage-button').addEventListener('click', exportLineage);
    document.querySelectorAll('[data-mark-group]').forEach(button => button.addEventListener('click', () => { markGroup = button.dataset.markGroup; document.querySelectorAll('[data-mark-group]').forEach(item => item.classList.toggle('active', item === button)); renderMarks(); })); $('mark-base-select').addEventListener('change', updateMarkPreview); $('clear-mark-stack-button').addEventListener('click', () => { selectedMarks = []; updateMarkPreview(); renderMarks(); }); $('export-marks-button').addEventListener('click', exportMarks);
    [['font-family-input', 'fontFamily', value => value], ['font-version-input', 'fontVersion', value => value], ['font-ascender-input', 'ascender', Number], ['font-descender-input', 'descender', Number]].forEach(([id, field, parse]) => $(id).addEventListener('change', event => { project.settings[field] = parse(event.target.value); queueSave(); }));
    $('export-all-ttf-button').addEventListener('click', () => exportAllFonts('ttf')); $('export-all-otf-button').addEventListener('click', () => exportAllFonts('otf'));
    document.addEventListener('dragenter', event => { if ($('aws-glyph-panel').hidden) return; if (!Array.from(event.dataTransfer.types || []).includes('Files')) return; dragDepth += 1; $('global-drop-hint').classList.add('show'); }); document.addEventListener('dragleave', event => { if ($('aws-glyph-panel').hidden) return; if (!Array.from(event.dataTransfer.types || []).includes('Files')) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('global-drop-hint').classList.remove('show'); }); document.addEventListener('dragover', event => { if ($('aws-glyph-panel').hidden) return; if (Array.from(event.dataTransfer.types || []).includes('Files')) event.preventDefault(); }); document.addEventListener('drop', async event => { if ($('aws-glyph-panel').hidden) return; if (!Array.from(event.dataTransfer.types || []).includes('Files')) return; event.preventDefault(); dragDepth = 0; $('global-drop-hint').classList.remove('show'); if (!event.target.closest('[data-glyph-card]')) await assignFiles(Array.from(event.dataTransfer.files || [])); });
  }
  window.AWSGlyphStudio = {
    setView(name){if(project&&['glyphs','inventory','evolution','marks','sheets','preview','fonts'].includes(name))setView(name)},
    getSnapshot(){return project ? JSON.parse(JSON.stringify(project)) : null;},
    async replaceSnapshot(input){if(!input||typeof input!=='object')return;project=StudioModel.normalizeProject(input);ensureUnicodeVault();await StudioStorage.save(project);selectedId=orderedGlyphs()[0]?.id||null;lineageId=selectedId;renderAll(true);}
  };
  // Keep the glyph view synchronized after asynchronous saved project initialization.
  function syncAWSLanguageView(){
   const snapshot=window.LiteraryFriendApp?.getSnapshot?.();
   const selected=snapshot?.channels?.find(ch=>ch.id===snapshot.selectedChannelId);
   if(selected?.role==='glyph-evolution')setView('evolution');
   else if(selected?.role==='glyph')setView('glyphs');
  }
  window.addEventListener('aws:view',e=>{
   if(!project)return;
   if(e.detail?.role==='glyph-evolution')setView('evolution');
   else if(e.detail?.role==='glyph')setView('glyphs');
  });
  async function initialize() {
    try {
      const [template, eraData, aws] = await Promise.all(['assets/glyph/azaraan-character-set.json', 'assets/glyph/era-data.json', 'assets/glyph/aws-language-data.json'].map(path => fetch(path).then(response => { if (!response.ok) throw new Error(`Could not load ${path}`); return response.json(); })));
      const stored = await StudioStorage.load();
      project = stored ? StudioModel.normalizeProject(stored) : StudioModel.createProject({ template, eraData, aws });
      const seeded = StudioModel.createProject({ template, eraData, aws });
      eraData.eras.forEach(definition => {
        if (!project.eras[definition.id]) project.eras[definition.id] = JSON.parse(JSON.stringify(seeded.eras[definition.id]));
        else Object.assign(project.eras[definition.id], { label: definition.label, backendEra: definition.backendEra, targetCount: definition.targetCount, description: definition.description });
      });
      project.eraOrder = eraData.eras.map(era => era.id); project.rules = Object.assign({}, eraData.rules, project.rules || {});
      project.marks = project.marks.length ? project.marks : JSON.parse(JSON.stringify(aws.marks));
      project.specialMarks = project.specialMarks.length ? project.specialMarks : JSON.parse(JSON.stringify(aws.specialMarks));
      project.keyLabels = aws.keyLabels.slice();
      ensureUnicodeVault();
      const modern = project.eras.modern;
      const defaultModern = seeded.eras.modern.glyphs;
      if (!modern.glyphs.some(glyph => glyph.key)) {
        const hasUserArtOrIdentity = modern.glyphs.some(glyph => glyph.character || glyph.artwork || glyph.meaning || glyph.notes);
        if (!hasUserArtOrIdentity) modern.glyphs = JSON.parse(JSON.stringify(defaultModern));
        else defaultModern.forEach(glyph => {
          const existing = modern.glyphs.find(item => item.character === glyph.character || item.key === glyph.key);
          if (existing) { existing.key = existing.key || glyph.key; existing.ipa = existing.ipa || glyph.ipa; existing.sound = existing.sound || glyph.sound; existing.transliteration = existing.transliteration || glyph.transliteration; existing.latinSubstitute = existing.latinSubstitute || glyph.latinSubstitute; }
          else modern.glyphs.push(JSON.parse(JSON.stringify(glyph)));
        });
      } else {
        defaultModern.filter(glyph => ['F', 'V'].includes(glyph.key)).forEach(glyph => { if (!modern.glyphs.some(item => item.key === glyph.key)) modern.glyphs.push(JSON.parse(JSON.stringify(glyph))); });
      }

      project.updatedAt = new Date().toISOString();
      await StudioStorage.save(project);
      selectedId = orderedGlyphs()[0]?.id || null; lineageId = selectedId; bindEvents(); renderAll(true); syncAWSLanguageView();
      GlyphScanner.configure({ getProject: () => project, updateGlyph: (id, patch, eraId) => updateGlyph(id, Object.assign({ vectorContours: [] }, patch), { eraId, noCards: true, noDetails: true }) });
      window.addEventListener('beforeunload', () => { if (saveTimer) { clearTimeout(saveTimer); try { localStorage.setItem('azaraan-glyph-studio-project', JSON.stringify(project)); } catch (_) {} } });
    } catch (error) { toast(error.message || 'Could not start the glyph studio.', true); }
  }
  initialize();
}());
