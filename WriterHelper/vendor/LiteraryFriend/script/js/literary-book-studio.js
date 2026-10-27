(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbyzbjqonkGubp-g2XnLr5vSgDc6EnYreGBS-hSBRGIdMRPFarQxeGTmOdSN9nBRp3eF/exec';
  const LIBRARY_URL = 'https://script.google.com/macros/library/d/1uq9wTJuIWNphZvGN_QGR3CGlBSWIRMhdD2i-PwcmHCJWTLOVoGKa_PyC/2';
  const APP_SCHEMA = 'literaryfriend.interactive-book.v1';
  const PAGE_SCHEMA = 'literaryfriend.interactive-book.page.v1';
  const DB_NAME = 'literaryfriend-interactive-book-studio';
  const DB_STORE = 'projects';
  const DB_VERSION = 1;
  const LOCAL_KEY = 'current-book';
  const TOKEN_KEY = 'literaryfriend-book-token';
  const MAX_CLOUD_NODE_TEXT = 690000;
  const TARGET_CHUNK_TEXT = 520000;

  const SIZE_PRESETS = [
    { id: 'digest', label: 'Paperback — Digest / US Trade', width: 5.5, height: 8.5, binding: 'paperback' },
    { id: 'trade', label: 'Paperback — Standard Trade', width: 6, height: 9, binding: 'paperback' },
    { id: 'small-trade', label: 'Paperback — Small Trade', width: 5, height: 8, binding: 'paperback' },
    { id: 'mass-market', label: 'Paperback — Mass Market', width: 4.25, height: 6.87, binding: 'paperback' },
    { id: 'hardcover-trade', label: 'Hardcover — US Trade', width: 6, height: 9, binding: 'hardcover' },
    { id: 'hardcover-royal', label: 'Hardcover — Royal', width: 6.14, height: 9.21, binding: 'hardcover' },
    { id: 'hardcover-compact', label: 'Hardcover — Compact / Novella', width: 5.5, height: 8.5, binding: 'hardcover' },
    { id: 'hardcover-textbook', label: 'Hardcover — Textbook / Manual', width: 7, height: 10, binding: 'hardcover' },
    { id: 'hardcover-manual-large', label: 'Hardcover — Large Manual', width: 8.5, height: 11, binding: 'hardcover' },
    { id: 'hardcover-child-portrait', label: "Hardcover — Children's Portrait", width: 8, height: 10, binding: 'hardcover' },
    { id: 'hardcover-child-landscape', label: "Hardcover — Children's Landscape", width: 10, height: 8, binding: 'hardcover' },
    { id: 'hardcover-art-square', label: 'Hardcover — Coffee Table 10 × 10', width: 10, height: 10, binding: 'hardcover' },
    { id: 'hardcover-art-large', label: 'Hardcover — Coffee Table 12 × 12', width: 12, height: 12, binding: 'hardcover' },
    { id: 'custom', label: 'Custom Size', width: 6, height: 9, binding: 'custom' }
  ];

  const PAPER_PRESETS = {
    cream: { label: 'Warm Cream', background: '#f7efd9', ink: '#2b241b', accent: '#8b5f32', pattern: 'paper', font: 'serif' },
    white: { label: 'Clean White', background: '#fffef8', ink: '#161616', accent: '#3a4f76', pattern: 'plain', font: 'serif' },
    parchment: { label: 'Parchment', background: '#efe0b8', ink: '#382a1c', accent: '#7d4e24', pattern: 'parchment', font: 'serif' },
    night: { label: 'Night Reader', background: '#20242c', ink: '#eef0f2', accent: '#75c8d8', pattern: 'plain', font: 'sans' },
    notebook: { label: 'Notebook', background: '#fbfcf8', ink: '#232323', accent: '#466890', pattern: 'grid', font: 'sans' },
    custom: { label: 'Custom', background: '#f7efd9', ink: '#2b241b', accent: '#8b5f32', pattern: 'paper', font: 'serif' }
  };

  const COVER_PRESETS = {
    classic: { bg: '#362a25', text: '#fff7e9', overlay: 22, fit: 'cover' },
    midnight: { bg: '#101827', text: '#e6f8ff', overlay: 38, fit: 'cover' },
    'retro-pulp': { bg: '#a53f2b', text: '#fff2a8', overlay: 14, fit: 'cover' },
    minimal: { bg: '#e9e3d9', text: '#24201d', overlay: 0, fit: 'contain' },
    custom: { bg: '#362a25', text: '#fff7e9', overlay: 18, fit: 'cover' }
  };

  const els = {};
  let state = makeDefaultBook();
  let pageFlip = null;
  let selectedPageIndex = 0;
  let visibleFlipIndex = 0;
  let rebuildTimer = null;
  let forceRebuildPending = false;
  let localSaveTimer = null;
  let pageTurnSoundAt = 0;
  let fallbackMode = false;
  let fallbackFlipIndex = 0;
  let dbPromise = null;
  let launcherProjectId = '';
  let appReady = false;
  let cloudToken = '';
  try {
    cloudToken = sessionStorage.getItem(TOKEN_KEY)
      || sessionStorage.getItem('literaryfriend.session.token.v2')
      || sessionStorage.getItem('literaryfriend.session.token')
      || localStorage.getItem('literaryfriend.session.token.v2')
      || localStorage.getItem('literaryfriend.session.token')
      || localStorage.getItem('lf.auth.token')
      || '';
    if (cloudToken) sessionStorage.setItem(TOKEN_KEY, cloudToken);
  } catch (_) {}
  let cloudUser = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    fillSizePresets();
    bindTabs();
    bindBookControls();
    bindCoverControls();
    bindPageControls();
    bindDesignControls();
    bindNavigation();
    bindInspector();
    bindCloudControls();
    bindKeyboard();

    try {
      const saved = await localGet(LOCAL_KEY);
      if (saved && saved.schema === APP_SCHEMA) {
        state = normalizeProject(saved);
        setStatus('Restored your last local book draft.');
      } else {
        setStatus('Ready. Start a blank book or load the Book Studio sample.');
      }
    } catch (error) {
      console.warn('Local restore failed', error);
      setStatus('Local restore was unavailable; using a fresh starter.', true);
    }

    syncAllControls();
    rebuildBook(false);
    renderPageList();
    selectPage(Math.min(selectedPageIndex, Math.max(0, state.pages.length - 1)), false);
    updateSoundControls();
    updatePreviewMeta();

    appReady = true;
    document.dispatchEvent(new CustomEvent('lf:book-studio-ready'));

    if (cloudToken) {
      verifyCloudSession();
    }
  }

  function cacheElements() {
    document.querySelectorAll('[id]').forEach((node) => { els[node.id] = node; });
  }

  function makeDefaultBook() {
    const now = new Date().toISOString();
    return {
      schema: APP_SCHEMA,
      version: '1.0.0',
      id: cryptoRandomId('book'),
      title: 'Untitled Book',
      subtitle: '',
      author: '',
      createdAt: now,
      updatedAt: now,
      size: { preset: 'trade', width: 6, height: 9, unit: 'in', binding: 'paperback' },
      cover: {
        preset: 'classic',
        artUrl: '',
        artDataUrl: '',
        showText: true,
        title: 'Untitled Book',
        subtitle: '',
        author: '',
        background: '#362a25',
        text: '#fff7e9',
        fit: 'cover',
        overlay: 12
      },
      pageDesign: {
        preset: 'cream',
        background: '#f7efd9',
        ink: '#2b241b',
        accent: '#8b5f32',
        pattern: 'paper',
        font: 'serif',
        margin: 8,
        pageNumbers: true,
        textureDataUrl: '',
        textureUrl: ''
      },
      sound: { enabled: true, volume: 0.55, file: 'assets/page-flip.wav' },
      pages: [
        {
          schema: PAGE_SCHEMA,
          id: cryptoRandomId('page'),
          title: 'Welcome to Book Studio',
          type: 'article',
          html: '<h1>Build a book that behaves like a book.</h1><p>Upload page JSON files separately from your cover art, choose a physical trim size, style the paper, then drag or swipe the page corners to turn pages.</p><div class="page-callout"><strong>Connected cover workflow:</strong> Open Cover & Art Studio, design the cover, then send it directly into this book.</div>'
        },
        {
          schema: PAGE_SCHEMA,
          id: cryptoRandomId('page'),
          title: 'JSON Pages',
          type: 'article',
          html: '<h2>One file or many</h2><p>The Pages tab accepts one JSON page, an array of pages, a project containing <code>pages</code>, or structured records. Multiple files can be selected and naturally sorted by filename.</p><p>Cover art is never bundled into the page-upload action, so creators can replace art without touching their page data.</p>'
        },
        {
          schema: PAGE_SCHEMA,
          id: cryptoRandomId('page'),
          title: 'Design It Your Way',
          type: 'article',
          html: '<h2>Cover, paper, texture, and trim are independent.</h2><p>Choose paperback, hardcover, square, portrait, landscape, or custom dimensions. Paper colors, ink, patterns, reading fonts, margins, and textures can all be changed without changing page content.</p>'
        }
      ],
      cloud: { projectId: '', manifestNodeId: '', pageNodeIds: [], assetNodeIds: { cover: [], pageTexture: [] }, bookId: '', editionId: '' }
    };
  }

  function normalizeProject(raw) {
    const base = makeDefaultBook();
    const src = raw && typeof raw === 'object' ? deepClone(raw) : {};
    const merged = {
      ...base,
      ...src,
      size: { ...base.size, ...(src.size || {}) },
      cover: { ...base.cover, ...(src.cover || {}) },
      pageDesign: { ...base.pageDesign, ...(src.pageDesign || {}) },
      sound: { ...base.sound, ...(src.sound || {}) },
      cloud: { ...base.cloud, ...(src.cloud || {}) }
    };
    merged.schema = APP_SCHEMA;
    merged.pages = Array.isArray(src.pages) ? src.pages.map((p, i) => normalizePage(p, `Page ${i + 1}`)) : base.pages;
    merged.updatedAt = new Date().toISOString();
    if (!merged.id) merged.id = cryptoRandomId('book');
    if (!merged.cloud.pageNodeIds || !Array.isArray(merged.cloud.pageNodeIds)) merged.cloud.pageNodeIds = [];
    merged.cloud.assetNodeIds = { cover: [], pageTexture: [], ...(merged.cloud.assetNodeIds || {}) };
    if (!Array.isArray(merged.cloud.assetNodeIds.cover)) merged.cloud.assetNodeIds.cover = [];
    if (!Array.isArray(merged.cloud.assetNodeIds.pageTexture)) merged.cloud.assetNodeIds.pageTexture = [];
    return merged;
  }

  function normalizePage(raw, fallbackTitle = 'Untitled Page') {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? deepClone(raw) : { text: String(raw ?? '') };
    const recognized = ['article', 'image', 'record', 'blank'];
    const hasPageFields = ['title', 'type', 'html', 'text', 'image', 'blocks', 'data', 'design'].some((key) => Object.prototype.hasOwnProperty.call(value, key));

    if (!hasPageFields) {
      return {
        schema: PAGE_SCHEMA,
        id: cryptoRandomId('page'),
        title: fallbackTitle,
        type: 'record',
        data: value
      };
    }

    const page = {
      ...value,
      schema: PAGE_SCHEMA,
      id: value.id || cryptoRandomId('page'),
      title: String(value.title || fallbackTitle),
      type: recognized.includes(value.type) ? value.type : inferPageType(value)
    };
    return page;
  }

  function inferPageType(page) {
    if (page.image || page.imageUrl || page.src) return 'image';
    if (page.data && typeof page.data === 'object') return 'record';
    if (page.html || page.text || page.blocks) return 'article';
    return 'record';
  }

  function fillSizePresets() {
    els.sizePresetSelect.innerHTML = SIZE_PRESETS.map((preset) =>
      `<option value="${escapeAttr(preset.id)}">${escapeHtml(preset.label)} — ${formatNumber(preset.width)} × ${formatNumber(preset.height)} in</option>`
    ).join('');
  }

  function bindTabs() {
    document.querySelectorAll('.panel-tab').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.panel-page').forEach((panel) => panel.classList.remove('active'));
        button.classList.add('active');
        const target = document.getElementById(button.dataset.panel);
        if (target) target.classList.add('active');
      });
    });
  }

  function bindBookControls() {
    els.bookTitleInput.addEventListener('input', () => {
      const previousTitle = state.title;
      state.title = els.bookTitleInput.value;
      if (!state.cover.title || state.cover.title === previousTitle) {
        state.cover.title = state.title;
        els.coverTitleInput.value = state.cover.title;
      }
      touch();
      updatePreviewMeta();
      scheduleRebuild();
    });
    els.bookSubtitleInput.addEventListener('input', () => {
      const old = state.subtitle;
      state.subtitle = els.bookSubtitleInput.value;
      if (!state.cover.subtitle || state.cover.subtitle === old) {
        state.cover.subtitle = state.subtitle;
        els.coverSubtitleInput.value = state.cover.subtitle;
      }
      touch();
      scheduleRebuild();
    });
    els.bookAuthorInput.addEventListener('input', () => {
      const old = state.author;
      state.author = els.bookAuthorInput.value;
      if (!state.cover.author || state.cover.author === old) {
        state.cover.author = state.author;
        els.coverAuthorInput.value = state.cover.author;
      }
      touch();
      scheduleRebuild();
    });

    els.sizePresetSelect.addEventListener('change', () => {
      const preset = SIZE_PRESETS.find((item) => item.id === els.sizePresetSelect.value) || SIZE_PRESETS[1];
      state.size.preset = preset.id;
      if (preset.id !== 'custom') {
        state.size.width = preset.width;
        state.size.height = preset.height;
        state.size.binding = preset.binding;
      }
      syncSizeControls();
      touch();
      scheduleRebuild(true);
    });

    [els.customWidthInput, els.customHeightInput].forEach((input) => {
      input.addEventListener('input', () => {
        state.size.preset = 'custom';
        state.size.binding = 'custom';
        state.size.width = clamp(Number(els.customWidthInput.value) || 6, 2, 20);
        state.size.height = clamp(Number(els.customHeightInput.value) || 9, 2, 20);
        els.sizePresetSelect.value = 'custom';
        syncSizeControls();
        touch();
        scheduleRebuild(true);
      });
    });

    els.newBookBtn.addEventListener('click', () => {
      state = makeDefaultBook();
      state.id = cryptoRandomId('book');
      state.title = 'Untitled Interactive Book';
      state.subtitle = '';
      state.author = '';
      state.cover = {
        ...state.cover,
        artUrl: '',
        showText: true,
        title: state.title,
        subtitle: '',
        author: '',
        background: '#362a25',
        text: '#fff7e9'
      };
      state.pages = [makeBlankPage('Page 1')];
      state.cloud = { projectId: '', manifestNodeId: '', pageNodeIds: [], assetNodeIds: { cover: [], pageTexture: [] }, bookId: '', editionId: '' };
      selectedPageIndex = 0;
      syncAllControls();
      renderPageList();
      selectPage(0, false);
      rebuildBook(false);
      touch(true);
      setStatus('Started a new blank interactive book.');
    });

    els.loadStarterBtn.addEventListener('click', async () => {
      try {
        setStatus('Loading the Book Studio sample…');
        const response = await fetch('json/starter-book-studio.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state = normalizeProject(await response.json());
        state.cloud = { projectId: '', manifestNodeId: '', pageNodeIds: [], assetNodeIds: { cover: [], pageTexture: [] }, bookId: '', editionId: '' };
        selectedPageIndex = 0;
        syncAllControls();
        renderPageList();
        selectPage(0, false);
        rebuildBook(false);
        touch(true);
        setStatus(`Loaded the Book Studio sample with ${state.pages.length} editable pages.`);
      } catch (error) {
        console.error(error);
        setStatus('Could not fetch the sample JSON. Serve the LiteraryFriend folder from a local web server or import json/starter-book-studio.json manually.', true);
      }
    });

    els.projectImportInput.addEventListener('change', async () => {
      const [file] = els.projectImportInput.files || [];
      if (!file) return;
      try {
        const raw = JSON.parse(await file.text());
        if (raw.schema === APP_SCHEMA || Array.isArray(raw.pages)) {
          state = normalizeProject(raw);
        } else {
          const imported = normalizeImportedPages(raw, file.name);
          state = makeDefaultBook();
          state.title = stripExtension(file.name);
          state.cover.title = state.title;
          state.pages = imported;
        }
        state.cloud = { projectId: '', manifestNodeId: '', pageNodeIds: [], assetNodeIds: { cover: [], pageTexture: [] }, bookId: '', editionId: '' };
        selectedPageIndex = 0;
        syncAllControls();
        renderPageList();
        selectPage(0, false);
        rebuildBook(false);
        touch(true);
        setStatus(`Imported project: ${file.name}`);
      } catch (error) {
        console.error(error);
        setStatus(`Project import failed: ${error.message}`, true);
      } finally {
        els.projectImportInput.value = '';
      }
    });

    els.saveLocalBtn.addEventListener('click', async () => {
      await saveLocalNow(true);
    });

    els.exportProjectBtn.addEventListener('click', () => {
      downloadJson(`${safeFilename(state.title || 'interactive-book')}.literaryfriend-book.json`, state);
      setStatus('Exported the complete interactive book project JSON.');
    });

    els.readerModeBtn.addEventListener('click', () => {
      const bookView = document.getElementById('bookStudioView');
      const active = !bookView.classList.contains('reader-mode');
      bookView.classList.toggle('reader-mode', active);
      els.readerModeBtn.setAttribute('aria-pressed', String(active));
      els.readerModeBtn.textContent = active ? 'Exit Reader Mode' : 'Reader Mode';
      window.setTimeout(() => rebuildBook(true, true), 180);
    });
  }

  function bindCoverControls() {
    els.coverArtInput.addEventListener('change', async () => {
      const [file] = els.coverArtInput.files || [];
      if (!file) return;
      try {
        state.cover.artDataUrl = await imageFileToDataUrl(file, 1800, 430000);
        state.cover.artUrl = '';
        touch();
        scheduleRebuild();
        setStatus(`Cover art replaced with ${file.name}.`);
      } catch (error) {
        setStatus(`Cover art could not be prepared: ${error.message}`, true);
      } finally {
        els.coverArtInput.value = '';
      }
    });

    els.clearCoverBtn.addEventListener('click', () => {
      state.cover.artDataUrl = '';
      state.cover.artUrl = '';
      touch();
      scheduleRebuild();
      setStatus('Cover art cleared; the cover design color remains.');
    });

    els.coverPresetSelect.addEventListener('change', () => {
      const id = els.coverPresetSelect.value;
      const preset = COVER_PRESETS[id] || COVER_PRESETS.custom;
      state.cover.preset = id;
      if (id !== 'custom') {
        state.cover.background = preset.bg;
        state.cover.text = preset.text;
        state.cover.overlay = preset.overlay;
        state.cover.fit = preset.fit;
      }
      syncCoverControls();
      touch();
      scheduleRebuild();
    });

    els.coverShowTextInput.addEventListener('change', () => {
      state.cover.showText = els.coverShowTextInput.checked;
      touch();
      scheduleRebuild();
    });

    const coverTextInputs = [
      [els.coverTitleInput, 'title'],
      [els.coverSubtitleInput, 'subtitle'],
      [els.coverAuthorInput, 'author']
    ];
    coverTextInputs.forEach(([input, key]) => {
      input.addEventListener('input', () => {
        state.cover[key] = input.value;
        touch();
        scheduleRebuild();
      });
    });

    els.coverBgInput.addEventListener('input', () => setCoverCustom('background', els.coverBgInput.value));
    els.coverTextInput.addEventListener('input', () => setCoverCustom('text', els.coverTextInput.value));
    els.coverFitSelect.addEventListener('change', () => setCoverCustom('fit', els.coverFitSelect.value));
    els.coverOverlayInput.addEventListener('input', () => {
      setCoverCustom('overlay', Number(els.coverOverlayInput.value));
      els.coverOverlayValue.textContent = `${els.coverOverlayInput.value}%`;
    });
  }

  function setCoverCustom(key, value) {
    state.cover[key] = value;
    state.cover.preset = 'custom';
    els.coverPresetSelect.value = 'custom';
    touch();
    scheduleRebuild();
  }

  function bindPageControls() {
    els.pageFilesInput.addEventListener('change', async () => {
      let files = Array.from(els.pageFilesInput.files || []);
      if (!files.length) return;
      if (els.naturalSortInput.checked) {
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      }
      const additions = [];
      const failures = [];
      for (const file of files) {
        try {
          const parsed = JSON.parse(await file.text());
          additions.push(...normalizeImportedPages(parsed, file.name));
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`);
        }
      }
      if (additions.length) {
        state.pages.push(...additions);
        selectedPageIndex = Math.max(0, state.pages.length - additions.length);
        renderPageList();
        selectPage(selectedPageIndex, false);
        touch();
        rebuildBook(true);
      }
      els.pageFilesInput.value = '';
      const message = `Imported ${additions.length} page${additions.length === 1 ? '' : 's'} from ${files.length} JSON file${files.length === 1 ? '' : 's'}.`;
      setStatus(failures.length ? `${message} ${failures.length} file(s) failed: ${failures.join(' | ')}` : message, failures.length > 0);
    });

    els.addBlankPageBtn.addEventListener('click', () => {
      const page = makeBlankPage(`Page ${state.pages.length + 1}`);
      const insertAt = state.pages.length ? selectedPageIndex + 1 : 0;
      state.pages.splice(insertAt, 0, page);
      renderPageList();
      selectPage(insertAt, true);
      touch();
      rebuildBook(true);
      setStatus('Added a blank page.');
    });

    els.downloadPagesBtn.addEventListener('click', () => {
      downloadJson(`${safeFilename(state.title || 'book')}.pages.json`, { schema: `${APP_SCHEMA}.pages`, pages: state.pages });
      setStatus(`Exported ${state.pages.length} page${state.pages.length === 1 ? '' : 's'} as JSON.`);
    });

    els.duplicatePageBtn.addEventListener('click', () => {
      if (!state.pages.length) return;
      const copy = deepClone(state.pages[selectedPageIndex]);
      copy.id = cryptoRandomId('page');
      copy.title = `${copy.title || 'Page'} Copy`;
      state.pages.splice(selectedPageIndex + 1, 0, copy);
      renderPageList();
      selectPage(selectedPageIndex + 1, true);
      touch();
      rebuildBook(true);
      setStatus('Duplicated the selected page.');
    });
  }

  function normalizeImportedPages(data, fileName = 'page.json') {
    const fallback = stripExtension(fileName);
    if (Array.isArray(data)) {
      return data.map((item, index) => normalizePage(item, `${fallback} ${index + 1}`));
    }
    if (!data || typeof data !== 'object') {
      return [normalizePage({ text: String(data ?? '') }, fallback)];
    }
    if (Array.isArray(data.pages)) {
      return data.pages.map((item, index) => normalizePage(item, `${fallback} ${index + 1}`));
    }
    if (Array.isArray(data.records)) {
      if (data.records.length > 500) {
        throw new Error(`This JSON contains ${data.records.length} records. Split it into smaller page files to avoid creating an unusably large live flipbook.`);
      }
      return data.records.map((record, index) => normalizePage({
        title: record.name || record.title || `${fallback} ${index + 1}`,
        type: 'record',
        data: record,
        source: { kind: 'records', fileName }
      }, `${fallback} ${index + 1}`));
    }
    return [normalizePage(data, fallback)];
  }

  function bindDesignControls() {
    els.paperPresetSelect.addEventListener('change', () => {
      const id = els.paperPresetSelect.value;
      const preset = PAPER_PRESETS[id] || PAPER_PRESETS.custom;
      state.pageDesign.preset = id;
      if (id !== 'custom') {
        state.pageDesign.background = preset.background;
        state.pageDesign.ink = preset.ink;
        state.pageDesign.accent = preset.accent;
        state.pageDesign.pattern = preset.pattern;
        state.pageDesign.font = preset.font;
      }
      syncDesignControls();
      touch();
      scheduleRebuild();
    });

    els.paperColorInput.addEventListener('input', () => setPaperCustom('background', els.paperColorInput.value));
    els.inkColorInput.addEventListener('input', () => setPaperCustom('ink', els.inkColorInput.value));
    els.accentColorInput.addEventListener('input', () => setPaperCustom('accent', els.accentColorInput.value));
    els.paperPatternSelect.addEventListener('change', () => setPaperCustom('pattern', els.paperPatternSelect.value));
    els.pageFontSelect.addEventListener('change', () => setPaperCustom('font', els.pageFontSelect.value));

    els.pageMarginInput.addEventListener('input', () => {
      state.pageDesign.margin = Number(els.pageMarginInput.value);
      els.pageMarginValue.textContent = `${formatNumber(state.pageDesign.margin)}%`;
      touch();
      scheduleRebuild();
    });

    els.pageTextureInput.addEventListener('change', async () => {
      const [file] = els.pageTextureInput.files || [];
      if (!file) return;
      try {
        state.pageDesign.textureDataUrl = await imageFileToDataUrl(file, 1200, 210000);
        state.pageDesign.textureUrl = '';
        touch();
        scheduleRebuild();
        setStatus(`Page texture changed to ${file.name}.`);
      } catch (error) {
        setStatus(`Page texture could not be prepared: ${error.message}`, true);
      } finally {
        els.pageTextureInput.value = '';
      }
    });

    els.clearTextureBtn.addEventListener('click', () => {
      state.pageDesign.textureDataUrl = '';
      state.pageDesign.textureUrl = '';
      touch();
      scheduleRebuild();
      setStatus('Custom page texture cleared.');
    });

    els.pageNumbersInput.addEventListener('change', () => {
      state.pageDesign.pageNumbers = els.pageNumbersInput.checked;
      touch();
      scheduleRebuild();
    });

    els.soundEnabledInput.addEventListener('change', () => {
      state.sound.enabled = els.soundEnabledInput.checked;
      updateSoundControls();
      touch();
    });

    els.soundVolumeInput.addEventListener('input', () => {
      state.sound.volume = clamp(Number(els.soundVolumeInput.value) / 100, 0, 1);
      updateSoundControls();
      touch();
    });
  }

  function setPaperCustom(key, value) {
    state.pageDesign[key] = value;
    state.pageDesign.preset = 'custom';
    els.paperPresetSelect.value = 'custom';
    touch();
    scheduleRebuild();
  }

  function bindNavigation() {
    els.prevPageBtn.addEventListener('click', () => navigateBook('prev'));
    els.nextPageBtn.addEventListener('click', () => navigateBook('next'));
    els.firstPageBtn.addEventListener('click', () => navigateBook('first'));
    els.lastPageBtn.addEventListener('click', () => navigateBook('last'));
    els.soundToggleBtn.addEventListener('click', () => {
      state.sound.enabled = !state.sound.enabled;
      updateSoundControls();
      touch();
    });
  }

  function navigateBook(action) {
    if (pageFlip && !fallbackMode) {
      if (action === 'prev') pageFlip.flipPrev('top');
      if (action === 'next') pageFlip.flipNext('top');
      if (action === 'first') pageFlip.flip(0, 'top');
      if (action === 'last') pageFlip.flip(state.pages.length + 1, 'top');
      return;
    }
    const max = state.pages.length + 1;
    if (action === 'prev') fallbackFlipIndex = clamp(fallbackFlipIndex - 1, 0, max);
    if (action === 'next') fallbackFlipIndex = clamp(fallbackFlipIndex + 1, 0, max);
    if (action === 'first') fallbackFlipIndex = 0;
    if (action === 'last') fallbackFlipIndex = max;
    visibleFlipIndex = fallbackFlipIndex;
    renderFallbackPage(true);
    playPageTurn();
    updatePagePosition();
  }

  function bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || document.activeElement?.isContentEditable) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateBook('prev');
      } else if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        navigateBook('next');
      } else if (event.key === 'Home') {
        event.preventDefault();
        navigateBook('first');
      } else if (event.key === 'End') {
        event.preventDefault();
        navigateBook('last');
      }
    });
  }

  function bindInspector() {
    els.pageTitleInput.addEventListener('input', () => {
      if (!state.pages[selectedPageIndex]) return;
      state.pages[selectedPageIndex].title = els.pageTitleInput.value;
      touch();
      renderPageList();
      scheduleRebuild();
    });

    els.pageTypeSelect.addEventListener('change', () => {
      const page = state.pages[selectedPageIndex];
      if (!page) return;
      page.type = els.pageTypeSelect.value;
      touch();
      syncInspector();
      renderPageList();
      scheduleRebuild();
    });

    els.applyPageJsonBtn.addEventListener('click', () => {
      if (!state.pages[selectedPageIndex]) return;
      try {
        const parsed = JSON.parse(els.pageJsonEditor.value);
        const page = normalizePage(parsed, state.pages[selectedPageIndex].title || `Page ${selectedPageIndex + 1}`);
        page.id = parsed.id || state.pages[selectedPageIndex].id || cryptoRandomId('page');
        state.pages[selectedPageIndex] = page;
        touch();
        syncInspector();
        renderPageList();
        rebuildBook(true);
        setStatus(`Applied JSON to page ${selectedPageIndex + 1}.`);
      } catch (error) {
        setStatus(`Page JSON is invalid: ${error.message}`, true);
      }
    });

    els.downloadPageBtn.addEventListener('click', () => {
      const page = state.pages[selectedPageIndex];
      if (!page) return;
      downloadJson(`${String(selectedPageIndex + 1).padStart(3, '0')}-${safeFilename(page.title || 'page')}.json`, page);
      setStatus('Downloaded the selected page JSON.');
    });

    els.deletePageBtn.addEventListener('click', () => {
      if (!state.pages.length) return;
      state.pages.splice(selectedPageIndex, 1);
      if (!state.pages.length) state.pages.push(makeBlankPage('Page 1'));
      selectedPageIndex = clamp(selectedPageIndex, 0, state.pages.length - 1);
      renderPageList();
      selectPage(selectedPageIndex, false);
      touch();
      rebuildBook(false);
      setStatus('Deleted the selected page.');
    });
  }

  function renderPageList() {
    els.pageCountLabel.textContent = `${state.pages.length} page${state.pages.length === 1 ? '' : 's'}`;
    els.pageList.innerHTML = '';
    state.pages.forEach((page, index) => {
      const item = document.createElement('div');
      item.className = `page-list-item${index === selectedPageIndex ? ' selected' : ''}`;
      item.setAttribute('role', 'listitem');
      item.innerHTML = `
        <button class="page-select" type="button" title="Edit page ${index + 1}">
          <span class="page-list-num">${index + 1}</span>
          <span class="page-list-copy"><strong>${escapeHtml(page.title || `Page ${index + 1}`)}</strong><small>${escapeHtml(page.type || 'article')}</small></span>
        </button>
        <span class="page-order-buttons">
          <button type="button" class="tiny-icon" data-move="up" title="Move page up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="tiny-icon" data-move="down" title="Move page down" ${index === state.pages.length - 1 ? 'disabled' : ''}>↓</button>
        </span>`;
      item.querySelector('.page-select').addEventListener('click', () => selectPage(index, true));
      item.querySelector('[data-move="up"]').addEventListener('click', () => movePage(index, index - 1));
      item.querySelector('[data-move="down"]').addEventListener('click', () => movePage(index, index + 1));
      els.pageList.appendChild(item);
    });
  }

  function movePage(from, to) {
    if (to < 0 || to >= state.pages.length || from === to) return;
    const [page] = state.pages.splice(from, 1);
    state.pages.splice(to, 0, page);
    selectedPageIndex = to;
    renderPageList();
    syncInspector();
    touch();
    rebuildBook(false);
    jumpToContentPage(to);
  }

  function selectPage(index, flipToPage = true) {
    if (!state.pages.length) return;
    selectedPageIndex = clamp(index, 0, state.pages.length - 1);
    syncInspector();
    renderPageList();
    if (flipToPage) jumpToContentPage(selectedPageIndex);
  }

  function jumpToContentPage(index) {
    const engineIndex = index + 1;
    if (pageFlip && !fallbackMode) {
      try { pageFlip.turnToPage(engineIndex); } catch (_) { try { pageFlip.flip(engineIndex, 'top'); } catch (_) {} }
      visibleFlipIndex = engineIndex;
      updatePagePosition();
    } else {
      fallbackFlipIndex = engineIndex;
      visibleFlipIndex = engineIndex;
      renderFallbackPage(false);
      updatePagePosition();
    }
  }

  function syncInspector() {
    const page = state.pages[selectedPageIndex];
    if (!page) {
      els.selectedPageBadge.textContent = 'No page';
      els.pageTitleInput.value = '';
      els.pageJsonEditor.value = '';
      return;
    }
    els.selectedPageBadge.textContent = `Page ${selectedPageIndex + 1}`;
    els.pageTitleInput.value = page.title || '';
    els.pageTypeSelect.value = ['article', 'image', 'record', 'blank'].includes(page.type) ? page.type : 'article';
    els.pageJsonEditor.value = JSON.stringify(page, null, 2);
  }

  function syncAllControls() {
    els.bookTitleInput.value = state.title || '';
    els.bookSubtitleInput.value = state.subtitle || '';
    els.bookAuthorInput.value = state.author || '';
    syncSizeControls();
    syncCoverControls();
    syncDesignControls();
    updateSoundControls();
    updatePreviewMeta();
  }

  function syncSizeControls() {
    const presetExists = SIZE_PRESETS.some((item) => item.id === state.size.preset);
    els.sizePresetSelect.value = presetExists ? state.size.preset : 'custom';
    els.customWidthInput.value = formatNumber(state.size.width);
    els.customHeightInput.value = formatNumber(state.size.height);
    els.customWidthInput.disabled = els.sizePresetSelect.value !== 'custom';
    els.customHeightInput.disabled = els.sizePresetSelect.value !== 'custom';
    els.sizeReadout.textContent = `${formatNumber(state.size.width)} × ${formatNumber(state.size.height)} ${state.size.unit || 'in'} · ${capitalize(state.size.binding || 'custom')}`;
    updatePreviewMeta();
  }

  function syncCoverControls() {
    els.coverPresetSelect.value = Object.prototype.hasOwnProperty.call(COVER_PRESETS, state.cover.preset) ? state.cover.preset : 'custom';
    els.coverShowTextInput.checked = Boolean(state.cover.showText);
    els.coverTitleInput.value = state.cover.title || '';
    els.coverSubtitleInput.value = state.cover.subtitle || '';
    els.coverAuthorInput.value = state.cover.author || '';
    els.coverBgInput.value = validHex(state.cover.background, '#362a25');
    els.coverTextInput.value = validHex(state.cover.text, '#fff7e9');
    els.coverFitSelect.value = ['cover', 'contain', 'stretch'].includes(state.cover.fit) ? state.cover.fit : 'cover';
    els.coverOverlayInput.value = String(clamp(Number(state.cover.overlay) || 0, 0, 80));
    els.coverOverlayValue.textContent = `${els.coverOverlayInput.value}%`;
  }

  function syncDesignControls() {
    els.paperPresetSelect.value = Object.prototype.hasOwnProperty.call(PAPER_PRESETS, state.pageDesign.preset) ? state.pageDesign.preset : 'custom';
    els.paperColorInput.value = validHex(state.pageDesign.background, '#f7efd9');
    els.inkColorInput.value = validHex(state.pageDesign.ink, '#2b241b');
    els.accentColorInput.value = validHex(state.pageDesign.accent, '#8b5f32');
    els.paperPatternSelect.value = ['plain', 'paper', 'parchment', 'linen', 'grid', 'dots'].includes(state.pageDesign.pattern) ? state.pageDesign.pattern : 'plain';
    els.pageFontSelect.value = ['serif', 'sans', 'mono'].includes(state.pageDesign.font) ? state.pageDesign.font : 'serif';
    els.pageMarginInput.value = String(clamp(Number(state.pageDesign.margin) || 8, 3, 15));
    els.pageMarginValue.textContent = `${formatNumber(Number(els.pageMarginInput.value))}%`;
    els.pageNumbersInput.checked = Boolean(state.pageDesign.pageNumbers);
  }

  function updateSoundControls() {
    const enabled = Boolean(state.sound.enabled);
    const volume = clamp(Number(state.sound.volume ?? 0.55), 0, 1);
    els.soundEnabledInput.checked = enabled;
    els.soundVolumeInput.value = String(Math.round(volume * 100));
    els.soundVolumeValue.textContent = `${Math.round(volume * 100)}%`;
    els.soundToggleBtn.textContent = enabled ? '🔊' : '🔇';
    els.soundToggleBtn.setAttribute('aria-pressed', String(enabled));
    els.pageFlipAudio.volume = volume;
  }

  function updatePreviewMeta() {
    els.previewTitle.textContent = state.title || 'Untitled Book';
    els.previewTrim.textContent = `${formatNumber(state.size.width)} × ${formatNumber(state.size.height)} in`;
  }

  function scheduleRebuild(forceRecreate = false) {
    forceRebuildPending = forceRebuildPending || forceRecreate;
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => {
      const force = forceRebuildPending;
      forceRebuildPending = false;
      rebuildBook(true, force);
    }, 190);
  }

  function rebuildBook(preservePosition = true, forceRecreate = false) {
    const desired = preservePosition ? visibleFlipIndex : 0;
    const pages = buildBookPageElements();
    const canUseEngine = Boolean(window.St && typeof window.St.PageFlip === 'function');

    if (pageFlip && !fallbackMode && canUseEngine && !forceRecreate && typeof pageFlip.updateFromHtml === 'function') {
      try {
        pageFlip.updateFromHtml(pages);
        visibleFlipIndex = clamp(desired, 0, state.pages.length + 1);
        try { pageFlip.turnToPage(visibleFlipIndex); } catch (_) {}
        els.engineState.textContent = 'Real-page engine · drag corners, swipe, click, or use arrows';
        els.engineState.classList.remove('fallback');
        updatePagePosition();
        return;
      } catch (error) {
        console.warn('Live page update failed; recreating page engine', error);
        forceRecreate = true;
      }
    }

    if (pageFlip) {
      try { pageFlip.destroy(); } catch (_) {}
      pageFlip = null;
    }
    fallbackMode = false;
    els.bookHost.innerHTML = '<div class="book-mount" id="bookMount"></div>';
    els.bookMount = document.getElementById('bookMount');

    if (!canUseEngine) {
      fallbackMode = true;
      fallbackFlipIndex = clamp(desired, 0, state.pages.length + 1);
      visibleFlipIndex = fallbackFlipIndex;
      renderFallbackPage(false);
      els.engineState.textContent = 'Fallback reader · page engine CDN unavailable';
      els.engineState.classList.add('fallback');
      updatePagePosition();
      return;
    }

    pages.forEach((page) => els.bookMount.appendChild(page));
    const geometry = calculatePageGeometry();

    try {
      pageFlip = new window.St.PageFlip(els.bookMount, {
        width: geometry.width,
        height: geometry.height,
        size: 'stretch',
        minWidth: geometry.minWidth,
        maxWidth: geometry.maxWidth,
        minHeight: geometry.minHeight,
        maxHeight: geometry.maxHeight,
        drawShadow: true,
        flippingTime: 900,
        usePortrait: true,
        startPage: clamp(desired, 0, state.pages.length + 1),
        autoSize: true,
        maxShadowOpacity: 0.6,
        showCover: true,
        mobileScrollSupport: false,
        clickEventForward: true,
        useMouseEvents: true,
        swipeDistance: 20,
        showPageCorners: true,
        disableFlipByClick: false
      });
      pageFlip.on('init', (event) => {
        visibleFlipIndex = Number(event.data?.page ?? desired) || 0;
        updatePagePosition();
      });
      pageFlip.on('flip', (event) => {
        visibleFlipIndex = Number(event.data) || 0;
        updatePagePosition();
        playPageTurn();
      });
      pageFlip.on('changeState', () => {
        els.engineState.textContent = 'Real-page engine · drag corners, swipe, click, or use arrows';
      });
      pageFlip.loadFromHTML(pages);
      els.engineState.textContent = 'Real-page engine · drag corners, swipe, click, or use arrows';
      els.engineState.classList.remove('fallback');
      visibleFlipIndex = clamp(desired, 0, state.pages.length + 1);
      updatePagePosition();
    } catch (error) {
      console.error('StPageFlip initialization failed', error);
      pageFlip = null;
      fallbackMode = true;
      fallbackFlipIndex = clamp(desired, 0, state.pages.length + 1);
      visibleFlipIndex = fallbackFlipIndex;
      renderFallbackPage(false);
      els.engineState.textContent = 'Fallback reader · page engine could not initialize';
      els.engineState.classList.add('fallback');
      setStatus(`The real-page engine could not initialize, so the safe fallback reader is active: ${error.message}`, true);
    }
  }

  function calculatePageGeometry() {
    const widthIn = clamp(Number(state.size.width) || 6, 2, 20);
    const heightIn = clamp(Number(state.size.height) || 9, 2, 20);
    const baseHeight = 760;
    let height = baseHeight;
    let width = Math.round(baseHeight * (widthIn / heightIn));
    if (width > 760) {
      const scale = 760 / width;
      width = 760;
      height = Math.round(height * scale);
    }
    if (height > 880) {
      const scale = 880 / height;
      height = 880;
      width = Math.round(width * scale);
    }
    width = Math.max(230, width);
    height = Math.max(300, height);
    return {
      width,
      height,
      minWidth: Math.max(160, Math.round(width * 0.48)),
      maxWidth: width,
      minHeight: Math.max(220, Math.round(height * 0.48)),
      maxHeight: height
    };
  }

  function normalizeCoverBase(value) {
    const raw = String(value || 'transparent').trim();
    if (raw === 'transparent' || /^#[0-9a-f]{6}$/i.test(raw) || /^gradient:(mono|sunset|earth|spring|ocean)$/i.test(raw)) return raw.toLowerCase();
    return 'transparent';
  }

  function coverBaseStyle(value) {
    const raw = normalizeCoverBase(value);
    const gradients = {
      mono: 'linear-gradient(#fff,#aaa,#000)',
      sunset: 'linear-gradient(#c3272b,#3259ac)',
      earth: 'linear-gradient(#3a958e,#d47c33)',
      spring: 'linear-gradient(#d7314f,#62cc70)',
      ocean: 'linear-gradient(#7846a8,#38c8af)'
    };
    if (raw === 'transparent') return { color: 'transparent', image: 'none' };
    if (raw.startsWith('gradient:')) return { color: 'transparent', image: gradients[raw.split(':')[1]] || 'none' };
    return { color: raw, image: 'none' };
  }

  function buildBookPageElements() {
    const result = [];
    result.push(makeCoverElement(false));
    state.pages.forEach((page, index) => result.push(makeContentPageElement(page, index)));
    result.push(makeCoverElement(true));
    return result;
  }

  function makeCoverElement(backCover) {
    const outer = document.createElement('div');
    outer.className = `book-page book-cover-page ${backCover ? 'back-cover' : 'front-cover'} cover-${cssToken(state.cover.preset || 'custom')}`;
    outer.dataset.density = 'hard';
    const art = safeAssetUrl(state.cover.artDataUrl || state.cover.artUrl || '');
    const backgroundSize = state.cover.fit === 'stretch' ? '100% 100%' : (state.cover.fit || 'cover');
    const coverBase = coverBaseStyle(state.cover.background);
    outer.style.setProperty('--cover-bg', coverBase.image !== 'none' ? coverBase.image : coverBase.color);
    outer.style.setProperty('--cover-bg-color', coverBase.color);
    outer.style.setProperty('--cover-bg-image', coverBase.image);
    outer.style.setProperty('--cover-text', state.cover.text || '#fff7e9');
    outer.style.setProperty('--cover-overlay', String(clamp(Number(state.cover.overlay) || 0, 0, 80) / 100));
    outer.style.setProperty('--cover-image', art ? `url("${escapeCssUrl(art)}")` : 'none');
    outer.style.setProperty('--cover-fit', backgroundSize);

    if (backCover) {
      outer.innerHTML = `<div class="cover-inner back-cover-inner"><div class="back-cover-rule"></div><p>${escapeHtml(state.title || 'Untitled Book')}</p>${state.author ? `<small>${escapeHtml(state.author)}</small>` : ''}<div class="back-cover-mark">Interactive edition</div></div>`;
      return outer;
    }

    const titleText = state.cover.title || state.title || 'Untitled Book';
    const subtitleText = state.cover.subtitle || state.subtitle || '';
    const authorText = state.cover.author || state.author || '';
    outer.innerHTML = `<div class="cover-inner">
      <div class="cover-overlay"></div>
      ${state.cover.showText ? `<div class="cover-copy"><h1>${escapeHtml(titleText)}</h1>${subtitleText ? `<p>${escapeHtml(subtitleText)}</p>` : ''}${authorText ? `<small>${escapeHtml(authorText)}</small>` : ''}</div>` : ''}
    </div>`;
    return outer;
  }

  function makeContentPageElement(page, index) {
    const design = { ...state.pageDesign, ...(page.design || {}) };
    const outer = document.createElement('div');
    outer.className = `book-page content-page pattern-${cssToken(design.pattern || 'plain')} font-${cssToken(design.font || 'serif')}`;
    outer.dataset.density = 'soft';
    outer.dataset.pageIndex = String(index);
    outer.style.setProperty('--page-bg', design.background || '#f7efd9');
    outer.style.setProperty('--page-ink', design.ink || '#2b241b');
    outer.style.setProperty('--page-accent', design.accent || '#8b5f32');
    outer.style.setProperty('--page-margin', `${clamp(Number(design.margin) || 8, 3, 15)}%`);
    const texture = safeAssetUrl(design.textureDataUrl || design.textureUrl || '');
    outer.style.setProperty('--page-texture', texture ? `url("${escapeCssUrl(texture)}")` : 'none');
    outer.innerHTML = `<div class="page-surface">
      <div class="page-running-title">${escapeHtml(state.title || '')}</div>
      <div class="page-content-scroll">${renderPageContent(page)}</div>
      ${design.pageNumbers !== false ? `<div class="page-number">${index + 1}</div>` : ''}
    </div>`;
    return outer;
  }

  function renderPageContent(page) {
    if (!page) return '';
    if (page.type === 'blank') return '<div class="blank-page"></div>';
    if (page.type === 'image') return renderImagePage(page);
    if (page.type === 'record') return renderRecordPage(page);
    return renderArticlePage(page);
  }

  function renderArticlePage(page) {
    const title = page.title ? `<h1>${escapeHtml(page.title)}</h1>` : '';
    if (page.html) return `${title}${sanitizeHtml(String(page.html))}`;
    if (Array.isArray(page.blocks)) return `${title}${renderBlocks(page.blocks)}`;
    if (page.text != null) {
      const paragraphs = String(page.text).split(/\n{2,}/).map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');
      return `${title}${paragraphs}`;
    }
    if (page.data && typeof page.data === 'object') return `${title}${renderRecordValue(page.data, 0)}`;
    return `${title}<p class="empty-state">This page has no content yet.</p>`;
  }

  function renderImagePage(page) {
    const src = safeAssetUrl(page.image || page.imageUrl || page.src || '');
    const caption = page.caption || page.text || '';
    return `${page.title ? `<h1>${escapeHtml(page.title)}</h1>` : ''}
      ${src ? `<figure class="image-page-figure"><img src="${escapeAttr(src)}" alt="${escapeAttr(page.alt || page.title || '')}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>` : '<p class="empty-state">Add an image URL or data URL to this page JSON.</p>'}`;
  }

  function renderRecordPage(page) {
    const title = page.title ? `<h1>${escapeHtml(page.title)}</h1>` : '';
    const data = page.data !== undefined ? page.data : Object.fromEntries(Object.entries(page).filter(([key]) => !['schema', 'id', 'title', 'type', 'design', 'source'].includes(key)));
    return `${title}<div class="record-page">${renderRecordValue(data, 0)}</div>`;
  }

  function renderBlocks(blocks) {
    return blocks.slice(0, 120).map((block) => {
      if (!block || typeof block !== 'object') return `<p>${escapeHtml(String(block ?? ''))}</p>`;
      const type = block.type || 'paragraph';
      if (type === 'heading') {
        const level = clamp(Number(block.level) || 2, 2, 4);
        return `<h${level}>${escapeHtml(block.text || '')}</h${level}>`;
      }
      if (type === 'quote') return `<blockquote>${escapeHtml(block.text || '')}</blockquote>`;
      if (type === 'callout') return `<div class="page-callout">${sanitizeHtml(String(block.html || escapeHtml(block.text || '')))}</div>`;
      if (type === 'divider') return '<hr>';
      if (type === 'code') return `<pre><code>${escapeHtml(block.code || block.text || '')}</code></pre>`;
      if (type === 'image') {
        const src = safeAssetUrl(block.src || block.image || '');
        return src ? `<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(block.alt || '')}">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>` : '';
      }
      if (type === 'list' && Array.isArray(block.items)) {
        const tag = block.ordered ? 'ol' : 'ul';
        return `<${tag}>${block.items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('')}</${tag}>`;
      }
      if (type === 'table' && Array.isArray(block.rows)) {
        return `<div class="page-table-wrap"><table>${block.rows.slice(0, 30).map((row) => `<tr>${(Array.isArray(row) ? row : [row]).slice(0, 10).map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`).join('')}</tr>`).join('')}</table></div>`;
      }
      if (type === 'rawJson') return `<pre><code>${escapeHtml(JSON.stringify(block.data ?? block.value ?? block, null, 2))}</code></pre>`;
      return `<p>${escapeHtml(block.text || block.content || '')}</p>`;
    }).join('');
  }

  function renderRecordValue(value, depth) {
    if (depth > 4) return `<pre class="json-preview">${escapeHtml(truncate(JSON.stringify(value, null, 2), 4000))}</pre>`;
    if (value === null || value === undefined) return '<span class="record-null">—</span>';
    if (typeof value !== 'object') return `<span class="record-value">${escapeHtml(String(value))}</span>`;
    if (Array.isArray(value)) {
      if (!value.length) return '<span class="record-null">None</span>';
      if (value.every((item) => ['string', 'number', 'boolean'].includes(typeof item) || item == null)) {
        return `<ul class="record-list">${value.slice(0, 80).map((item) => `<li>${escapeHtml(String(item ?? '—'))}</li>`).join('')}${value.length > 80 ? `<li>… ${value.length - 80} more</li>` : ''}</ul>`;
      }
      return `<div class="record-array">${value.slice(0, 36).map((item, i) => `<section class="record-array-item"><h3>${escapeHtml(item?.name || item?.title || `Item ${i + 1}`)}</h3>${renderRecordValue(item, depth + 1)}</section>`).join('')}${value.length > 36 ? `<p class="record-overflow">${value.length - 36} additional items are preserved in JSON but hidden in this page preview.</p>` : ''}</div>`;
    }
    const entries = Object.entries(value).filter(([, val]) => val !== '' && val !== null && val !== undefined);
    return `<dl class="record-grid">${entries.slice(0, 90).map(([key, val]) => {
      const heading = humanizeKey(key);
      return `<div class="record-field"><dt>${escapeHtml(heading)}</dt><dd>${renderRecordValue(val, depth + 1)}</dd></div>`;
    }).join('')}${entries.length > 90 ? `<div class="record-field"><dt>More data</dt><dd>${entries.length - 90} additional fields remain in the JSON source.</dd></div>` : ''}</dl>`;
  }

  function renderFallbackPage(animate) {
    const index = clamp(fallbackFlipIndex, 0, state.pages.length + 1);
    let element;
    if (index === 0) element = makeCoverElement(false);
    else if (index === state.pages.length + 1) element = makeCoverElement(true);
    else element = makeContentPageElement(state.pages[index - 1], index - 1);
    element.classList.add('fallback-page');
    if (animate) element.classList.add('fallback-turning');
    els.bookMount.innerHTML = '';
    els.bookMount.appendChild(element);
  }

  function updatePagePosition() {
    const index = clamp(Number(visibleFlipIndex) || 0, 0, state.pages.length + 1);
    if (index === 0) els.pagePosition.textContent = 'Cover';
    else if (index >= state.pages.length + 1) els.pagePosition.textContent = 'Back Cover';
    else els.pagePosition.textContent = `Page ${index} of ${state.pages.length}`;
  }

  function playPageTurn() {
    if (!state.sound.enabled) return;
    const now = performance.now();
    if (now - pageTurnSoundAt < 140) return;
    pageTurnSoundAt = now;
    const audio = els.pageFlipAudio;
    try {
      audio.volume = clamp(Number(state.sound.volume ?? 0.55), 0, 1);
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    } catch (_) {}
  }

  function sanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script, iframe, object, embed, link, meta, base, form').forEach((node) => node.remove());
    template.content.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').trim();
        if (name.startsWith('on') || name === 'srcdoc') node.removeAttribute(attr.name);
        if (['href', 'src', 'xlink:href'].includes(name) && /^\s*(javascript|vbscript):/i.test(value)) node.removeAttribute(attr.name);
      });
      if (node.tagName === 'A') {
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
      }
    });
    return template.innerHTML;
  }

  function safeAssetUrl(value) {
    if (!value) return '';
    const url = String(value).trim();
    if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(url)) return url;
    if (/^blob:/i.test(url)) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (/^(assets|json)\/[\w./%+@()-]+$/i.test(url)) return url;
    return '';
  }

  async function imageFileToDataUrl(file, maxDimension, maxChars) {
    if (!file.type.startsWith('image/')) throw new Error('Select an image file.');
    const original = await fileToDataUrl(file);
    const image = await loadImage(original);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    const ratio = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas image processing is unavailable.');
    let quality = 0.9;
    let result = original;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= maxChars) return result;
      quality = Math.max(0.5, quality - 0.08);
      width = Math.max(320, Math.round(width * 0.84));
      height = Math.max(320, Math.round(height * 0.84));
    }
    if (result.length > maxChars) throw new Error('The image is still too large after safe compression. Try a smaller source image.');
    return result;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image could not be decoded.'));
      image.src = src;
    });
  }

  function makeBlankPage(title = 'Untitled Page') {
    return { schema: PAGE_SCHEMA, id: cryptoRandomId('page'), title, type: 'blank', text: '' };
  }

  function touch(saveImmediately = false) {
    state.updatedAt = new Date().toISOString();
    els.autosaveState.textContent = 'Unsaved changes';
    clearTimeout(localSaveTimer);
    if (saveImmediately) {
      saveLocalNow(false);
    } else {
      localSaveTimer = setTimeout(() => saveLocalNow(false), 750);
    }
  }

  async function saveLocalNow(showMessage) {
    try {
      await localPut(LOCAL_KEY, state);
      if (launcherProjectId) await localPut(`launcher:${launcherProjectId}`, state);
      els.autosaveState.textContent = 'Saved locally';
      if (showMessage) setStatus('Saved the current book locally in this browser.');
    } catch (error) {
      console.error(error);
      els.autosaveState.textContent = 'Local save failed';
      if (showMessage) setStatus(`Local save failed: ${error.message}`, true);
    }
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available in this browser.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB could not be opened.'));
    });
    return dbPromise;
  }

  async function localPut(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(deepClone(value), key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Local save transaction failed.'));
    });
  }

  async function localGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const request = tx.objectStore(DB_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Local read failed.'));
    });
  }

  function bindCloudControls() {
    els.backendHealthBtn.addEventListener('click', checkBackendHealth);
    els.cloudLoginBtn.addEventListener('click', cloudLogin);
    els.cloudRegisterBtn.addEventListener('click', cloudRegister);
    els.cloudListBtn.addEventListener('click', listCloudBooks);
    els.cloudSaveBtn.addEventListener('click', saveBookToCloud);
    els.cloudLoadBtn.addEventListener('click', loadSelectedCloudBook);
    els.cloudProjectSelect.addEventListener('change', () => {
      els.cloudLoadBtn.disabled = !els.cloudProjectSelect.value;
    });
    els.cloudPasswordInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') cloudLogin();
    });
  }

  async function checkBackendHealth() {
    setBackendStatus('Checking backend…');
    try {
      let result;
      try {
        const response = await fetch(`${API_URL}?action=health&_=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        result = await response.json();
      } catch (_) {
        result = await apiPost('health', {}, '');
      }
      setBackendStatus(result.ok === false ? 'Backend replied with an error' : 'Backend online', result.ok === false);
      setStatus(`LiteraryFriend backend is reachable. Library reference: ${LIBRARY_URL}`);
    } catch (error) {
      setBackendStatus('Backend unavailable', true);
      setStatus(`Backend check failed: ${error.message}`, true);
    }
  }

  async function cloudLogin() {
    const login = els.cloudLoginInput.value.trim();
    const password = els.cloudPasswordInput.value;
    if (!login || !password) {
      setStatus('Enter your LiteraryFriend email/username and password first.', true);
      return;
    }
    try {
      setStatus('Signing in to LiteraryFriend…');
      const result = await apiPost('auth.login', { login, password }, '');
      acceptCloudAuth(result);
      setStatus('Signed in. You can now save and load interactive books from the supplied LiteraryFriend backend.');
      await listCloudBooks();
    } catch (error) {
      setStatus(`Sign-in failed: ${error.message}`, true);
    }
  }

  async function cloudRegister() {
    const email = els.cloudLoginInput.value.trim();
    const password = els.cloudPasswordInput.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('Registration requires an email address in the login field.', true);
      return;
    }
    if (password.length < 10) {
      setStatus('The LiteraryFriend backend requires a password of at least 10 characters.', true);
      return;
    }
    const stem = (email.split('@')[0] || 'reader').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 28) || 'reader';
    const username = `${stem}${String(Date.now()).slice(-4)}`;
    try {
      setStatus('Creating LiteraryFriend account…');
      const result = await apiPost('auth.register', { email, username, password, displayName: stem }, '');
      acceptCloudAuth(result);
      setStatus(`Account created as ${username}. Your browser has stored the returned session token for this tab.`);
      await listCloudBooks();
    } catch (error) {
      setStatus(`Registration failed: ${error.message}`, true);
    }
  }

  function acceptCloudAuth(result) {
    const token = result.token || result.data?.token || result.session?.token || '';
    const user = result.user || result.data?.user || null;
    if (!token) throw new Error('Backend did not return a session token.');
    cloudToken = token;
    cloudUser = user;
    sessionStorage.setItem(TOKEN_KEY, cloudToken);
    updateCloudUserLabel();
    setBackendStatus('Signed in');
  }

  async function verifyCloudSession() {
    try {
      const result = await apiPost('auth.me', {}, cloudToken);
      cloudUser = result.user || result.data?.user || result.data || null;
      updateCloudUserLabel();
      setBackendStatus('Signed in');
      await listCloudBooks(false);
    } catch (error) {
      console.warn('Stored cloud session rejected', error);
      cloudToken = '';
      cloudUser = null;
      sessionStorage.removeItem(TOKEN_KEY);
      updateCloudUserLabel();
    }
  }

  function updateCloudUserLabel() {
    if (!cloudToken) {
      els.cloudUserLabel.textContent = 'Not signed in';
      return;
    }
    els.cloudUserLabel.textContent = cloudUser?.displayName || cloudUser?.username || cloudUser?.email || 'Signed in';
  }

  async function listCloudBooks(report = true) {
    if (!requireCloudToken()) return;
    try {
      if (report) setStatus('Loading cloud book list…');
      const result = await apiPost('projects.list', { type: 'book' }, cloudToken);
      const projects = result.projects || result.data?.projects || result.data || [];
      const list = Array.isArray(projects) ? projects : [];
      els.cloudProjectSelect.innerHTML = '<option value="">Choose a saved book…</option>' + list.map((project) => {
        const id = project.id || project.projectId || '';
        const title = project.title || project.name || 'Untitled book';
        return `<option value="${escapeAttr(id)}">${escapeHtml(title)}</option>`;
      }).join('');
      if (state.cloud.projectId && list.some((p) => (p.id || p.projectId) === state.cloud.projectId)) {
        els.cloudProjectSelect.value = state.cloud.projectId;
      }
      els.cloudLoadBtn.disabled = !els.cloudProjectSelect.value;
      if (report) setStatus(`Found ${list.length} cloud project${list.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setStatus(`Could not list cloud books: ${error.message}`, true);
    }
  }

  async function saveBookToCloud() {
    if (!requireCloudToken()) return;
    try {
      setStatus('Preparing book for cloud save…');
      let projectId = state.cloud.projectId;
      if (!projectId) {
        const created = await apiPost('projects.create', {
          type: 'book',
          title: state.title || 'Untitled Interactive Book',
          description: 'Interactive book created in LiteraryFriend Interactive Book Studio.',
          metadata: { app: 'interactive-book-studio', schema: APP_SCHEMA },
          settings: { size: state.size }
        }, cloudToken);
        const project = created.project || created.data?.project || created.data || {};
        projectId = project.id || project.projectId;
        if (!projectId) throw new Error('Backend created the project but did not return a project ID.');
        state.cloud.projectId = projectId;
      } else {
        await apiPost('projects.update', {
          projectId,
          title: state.title || 'Untitled Interactive Book',
          metadata: { app: 'interactive-book-studio', schema: APP_SCHEMA, updatedAt: new Date().toISOString() },
          settings: { size: state.size }
        }, cloudToken);
      }

      setStatus('Syncing native Book Builder record and edition…');
      await syncNativeBookRecords(projectId);

      const chunks = chunkPagesForCloud(state.pages);
      const previousIds = Array.isArray(state.cloud.pageNodeIds) ? state.cloud.pageNodeIds.slice() : [];
      const newIds = [];
      for (let i = 0; i < chunks.length; i += 1) {
        setStatus(`Saving cloud page chunk ${i + 1} of ${chunks.length}…`);
        const content = JSON.stringify({
          schema: 'literaryfriend.interactive-book.pages-chunk.v1',
          index: i,
          total: chunks.length,
          pages: chunks[i]
        });
        const payload = {
          projectId,
          parentId: '',
          nodeType: 'interactive-book-pages',
          title: `Interactive Book Pages ${String(i + 1).padStart(3, '0')}`,
          sortOrder: i + 100,
          content,
          plainText: `Page chunk ${i + 1} of ${chunks.length}`,
          metadata: { app: 'interactive-book-studio', schema: APP_SCHEMA, chunkIndex: i, chunkCount: chunks.length },
          tags: ['interactive-book', 'page-chunk']
        };
        if (previousIds[i]) payload.id = previousIds[i];
        const result = await apiPost('nodes.save', payload, cloudToken);
        const node = result.node || result.data?.node || result.data || {};
        const id = node.id || node.nodeId || result.id;
        if (!id) throw new Error(`Backend did not return a node ID for page chunk ${i + 1}.`);
        newIds.push(id);
      }

      for (let i = newIds.length; i < previousIds.length; i += 1) {
        try { await apiPost('nodes.delete', { projectId, id: previousIds[i], nodeId: previousIds[i] }, cloudToken); } catch (error) { console.warn('Old page chunk cleanup failed', error); }
      }
      state.cloud.pageNodeIds = newIds;

      const priorAssets = state.cloud.assetNodeIds || { cover: [], pageTexture: [] };
      const coverAssetIds = await saveCloudStringAsset(projectId, 'cover', state.cover?.artDataUrl || '', priorAssets.cover || []);
      const pageTextureIds = await saveCloudStringAsset(projectId, 'page-texture', state.pageDesign?.textureDataUrl || '', priorAssets.pageTexture || []);
      state.cloud.assetNodeIds = { cover: coverAssetIds, pageTexture: pageTextureIds };

      const manifest = deepClone(state);
      manifest.pages = [];
      if (coverAssetIds.length && manifest.cover) manifest.cover.artDataUrl = '';
      if (pageTextureIds.length && manifest.pageDesign) manifest.pageDesign.textureDataUrl = '';
      manifest.cloud = { ...state.cloud, projectId, pageNodeIds: newIds };
      const manifestText = JSON.stringify(manifest);
      if (manifestText.length > MAX_CLOUD_NODE_TEXT) {
        throw new Error('The cover/texture metadata is too large for one backend node. Replace it with smaller images and try again.');
      }
      const manifestPayload = {
        projectId,
        parentId: '',
        nodeType: 'interactive-book-manifest',
        title: 'Interactive Book Manifest',
        sortOrder: 1,
        content: manifestText,
        plainText: `${state.title || 'Untitled Interactive Book'} manifest`,
        metadata: { app: 'interactive-book-studio', schema: APP_SCHEMA, role: 'manifest' },
        tags: ['interactive-book', 'manifest']
      };
      if (state.cloud.manifestNodeId) manifestPayload.id = state.cloud.manifestNodeId;
      const manifestResult = await apiPost('nodes.save', manifestPayload, cloudToken);
      const manifestNode = manifestResult.node || manifestResult.data?.node || manifestResult.data || {};
      state.cloud.manifestNodeId = manifestNode.id || manifestNode.nodeId || manifestResult.id || state.cloud.manifestNodeId;
      try { await syncNativeBookRecords(projectId); } catch (error) { console.warn('Native Book Builder metadata refresh failed', error); }
      touch(true);
      document.dispatchEvent(new CustomEvent('literaryfriend:book-saved', { detail: { projectId, bookId: state.cloud.bookId, editionId: state.cloud.editionId, manifestNodeId: state.cloud.manifestNodeId, localBookId: state.id } }));
      await listCloudBooks(false);
      els.cloudProjectSelect.value = projectId;
      els.cloudLoadBtn.disabled = false;
      setStatus(`Saved ${state.pages.length} page${state.pages.length === 1 ? '' : 's'} to LiteraryFriend cloud in ${chunks.length} page chunk${chunks.length === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error(error);
      setStatus(`Cloud save failed: ${error.message}`, true);
    }
  }

  async function saveCloudStringAsset(projectId, key, text, previousIds = []) {
    const value = String(text || '');
    if (!value) {
      for (const id of previousIds || []) { try { await apiPost('nodes.delete', {projectId, id, nodeId:id}, cloudToken); } catch (error) { console.warn('Old cloud asset cleanup failed', error); } }
      return [];
    }
    const partSize = 480000;
    const pieces=[]; for(let i=0;i<value.length;i+=partSize) pieces.push(value.slice(i,i+partSize));
    const ids=[];
    for(let i=0;i<pieces.length;i+=1){
      setStatus(`Saving ${key} data ${i+1} of ${pieces.length}…`);
      const payload={projectId,parentId:'',nodeType:'interactive-book-asset-chunk',title:`Interactive Book ${key} ${String(i+1).padStart(3,'0')}`,sortOrder:5000+i,content:pieces[i],plainText:`${key} chunk ${i+1} of ${pieces.length}`,metadata:{app:'interactive-book-studio',schema:APP_SCHEMA,role:'asset-chunk',assetKey:key,chunkIndex:i,chunkCount:pieces.length},tags:['interactive-book','asset-chunk',key]};
      if(previousIds[i])payload.id=previousIds[i];
      const result=await apiPost('nodes.save',payload,cloudToken),node=result.node||result.data?.node||result.data||{},id=node.id||node.nodeId||result.id;
      if(!id)throw new Error(`Backend did not return an ID for ${key} chunk ${i+1}.`);ids.push(id);
    }
    for(let i=ids.length;i<(previousIds||[]).length;i+=1){try{await apiPost('nodes.delete',{projectId,id:previousIds[i],nodeId:previousIds[i]},cloudToken);}catch(error){console.warn('Old cloud asset cleanup failed',error);}}
    return ids;
  }

  async function loadCloudStringAsset(projectId, ids, nodeMap = null) {
    if(!Array.isArray(ids)||!ids.length)return '';
    const pieces=[];
    for(let i=0;i<ids.length;i+=1){const id=ids[i],known=nodeMap?.get(id)||{id};const node=await hydrateNodeIfNeeded(projectId,known),content=node.content||node.data?.content||'';pieces.push(String(content));}
    return pieces.join('');
  }

  async function syncNativeBookRecords(projectId) {
    const bookPayload = {
      projectId,
      title: state.title || 'Untitled Interactive Book',
      subtitle: state.subtitle || '',
      authorName: state.author || '',
      bookType: 'book',
      description: 'Interactive HTML book authored in LiteraryFriend Book Studio.',
      metadata: {
        studioSchema: APP_SCHEMA,
        studioProjectId: state.id,
        interactiveHtmlPages: true,
        pageCount: Array.isArray(state.pages) ? state.pages.length : 0,
        manifestNodeId: state.cloud.manifestNodeId || ''
      }
    };
    if (state.cloud.bookId) bookPayload.id = state.cloud.bookId;
    const bookResult = await apiPost('books.save', bookPayload, cloudToken);
    const book = bookResult.book || bookResult.data?.book || bookResult.data || {};
    state.cloud.bookId = book.id || book.bookId || state.cloud.bookId;
    if (!state.cloud.bookId) throw new Error('Backend did not return a native Book Builder book ID.');

    const editionPayload = {
      bookId: state.cloud.bookId,
      name: 'Interactive Book Studio Edition',
      binding: state.size.binding || 'paperback',
      trimWidthIn: Number(state.size.width) || 6,
      trimHeightIn: Number(state.size.height) || 9,
      bleedIn: 0.125,
      margins: { top: 0.75, bottom: 0.75, inside: 0.85, outside: 0.65 },
      typography: { fontFamily: state.pageDesign.font || 'serif', ink: state.pageDesign.ink || '#211b17' },
      pageStyle: { color: state.pageDesign.background || '#fffdf8', texture: state.pageDesign.pattern || 'paper', pageFlipSound: !!state.sound.enabled },
      settings: { studioSchema: APP_SCHEMA, editableHtmlPages: true, studioPageDesign: { ...deepClone(state.pageDesign), textureDataUrl: '' }, studioSound: deepClone(state.sound) }
    };
    if (state.cloud.editionId) editionPayload.id = state.cloud.editionId;
    const editionResult = await apiPost('books.editions.save', editionPayload, cloudToken);
    const edition = editionResult.edition || editionResult.data?.edition || editionResult.data || {};
    state.cloud.editionId = edition.id || edition.editionId || state.cloud.editionId;
    if (!state.cloud.editionId) throw new Error('Backend did not return a Book Builder edition ID.');
    return { book, edition };
  }

  function chunkPagesForCloud(pages) {
    const chunks = [];
    let current = [];
    let currentSize = 120;
    pages.forEach((page, index) => {
      const text = JSON.stringify(page);
      if (text.length > TARGET_CHUNK_TEXT) {
        throw new Error(`Page ${index + 1} (${page.title || 'Untitled'}) is too large for the backend node limit. Split its content across pages.`);
      }
      if (current.length && currentSize + text.length + 2 > TARGET_CHUNK_TEXT) {
        chunks.push(current);
        current = [];
        currentSize = 120;
      }
      current.push(page);
      currentSize += text.length + 2;
    });
    if (current.length || !chunks.length) chunks.push(current);
    return chunks;
  }

  async function loadSelectedCloudBook() {
    if (!requireCloudToken()) return;
    const projectId = els.cloudProjectSelect.value;
    if (!projectId) {
      setStatus('Choose a cloud book first.', true);
      return;
    }
    try {
      setStatus('Loading cloud book structure…');
      const result = await apiPost('projects.get', { projectId }, cloudToken);
      const project = result.project || result.data?.project || result.data || result;
      let nodes = result.nodes || project.nodes || result.data?.nodes || [];
      if (!Array.isArray(nodes) || !nodes.length) {
        const listed = await apiPost('nodes.list', { projectId }, cloudToken);
        nodes = listed.nodes || listed.data?.nodes || listed.data || [];
      }
      if (!Array.isArray(nodes)) nodes = [];
      const manifestCandidates = nodes.filter((node) => node.nodeType === 'interactive-book-manifest' || node.type === 'interactive-book-manifest' || node.metadata?.role === 'manifest');
      let manifestNode = manifestCandidates.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
      if (!manifestNode) throw new Error('No interactive-book manifest node was found in this project.');
      manifestNode = await hydrateNodeIfNeeded(projectId, manifestNode);
      const manifestText = manifestNode.content || manifestNode.data?.content || '';
      const loaded = normalizeProject(JSON.parse(manifestText));

      const allPageNodes = nodes.filter((node) => node.nodeType === 'interactive-book-pages' || node.type === 'interactive-book-pages');
      const pageNodeMap = new Map(allPageNodes.map((node) => [node.id || node.nodeId, node]));
      let orderedNodes = [];
      const referencedIds = loaded.cloud?.pageNodeIds || [];
      if (referencedIds.length) {
        orderedNodes = referencedIds.map((id) => pageNodeMap.get(id) || { id }).filter(Boolean);
      } else {
        orderedNodes = allPageNodes.slice().sort((a, b) => {
          const ai = Number(a.metadata?.chunkIndex ?? a.sortOrder ?? 0);
          const bi = Number(b.metadata?.chunkIndex ?? b.sortOrder ?? 0);
          return ai - bi;
        });
      }
      const assembled = [];
      const hydratedIds = [];
      for (let i = 0; i < orderedNodes.length; i += 1) {
        setStatus(`Loading cloud page chunk ${i + 1} of ${orderedNodes.length}…`);
        const node = await hydrateNodeIfNeeded(projectId, orderedNodes[i]);
        const content = node.content || node.data?.content || '';
        if (!content) continue;
        const chunk = JSON.parse(content);
        if (Array.isArray(chunk.pages)) assembled.push(...chunk.pages.map((p, pageIndex) => normalizePage(p, `Page ${assembled.length + pageIndex + 1}`)));
        const id = node.id || node.nodeId;
        if (id) hydratedIds.push(id);
      }
      loaded.pages = assembled.length ? assembled : [makeBlankPage('Page 1')];
      loaded.cloud = {
        ...(loaded.cloud || {}),
        projectId,
        manifestNodeId: manifestNode.id || manifestNode.nodeId || '',
        pageNodeIds: hydratedIds,
        assetNodeIds: { cover: [], pageTexture: [], ...(loaded.cloud?.assetNodeIds || {}) }
      };
      const assetNodes = nodes.filter((node)=>node.nodeType==='interactive-book-asset-chunk'||node.type==='interactive-book-asset-chunk');
      const assetMap = new Map(assetNodes.map((node)=>[node.id||node.nodeId,node]));
      if (loaded.cloud.assetNodeIds.cover?.length) loaded.cover.artDataUrl = await loadCloudStringAsset(projectId, loaded.cloud.assetNodeIds.cover, assetMap);
      if (loaded.cloud.assetNodeIds.pageTexture?.length) loaded.pageDesign.textureDataUrl = await loadCloudStringAsset(projectId, loaded.cloud.assetNodeIds.pageTexture, assetMap);
      state = loaded;
      selectedPageIndex = 0;
      syncAllControls();
      renderPageList();
      selectPage(0, false);
      rebuildBook(false);
      touch(true);
      document.dispatchEvent(new CustomEvent('literaryfriend:book-loaded', { detail: { projectId: state.cloud.projectId, bookId: state.cloud.bookId, editionId: state.cloud.editionId, localBookId: state.id } }));
      setStatus(`Loaded “${state.title}” with ${state.pages.length} page${state.pages.length === 1 ? '' : 's'} from LiteraryFriend cloud.`);
    } catch (error) {
      console.error(error);
      setStatus(`Cloud load failed: ${error.message}`, true);
    }
  }

  async function hydrateNodeIfNeeded(projectId, node) {
    if (node?.content) return node;
    const id = node?.id || node?.nodeId;
    if (!id) return node || {};
    const result = await apiPost('nodes.get', { projectId, id, nodeId: id }, cloudToken);
    return result.node || result.data?.node || result.data || result;
  }

  function requireCloudToken() {
    if (cloudToken) return true;
    setStatus('Sign in to the supplied LiteraryFriend backend first.', true);
    return false;
  }

  async function apiPost(action, data, token = cloudToken) {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: token || '', data: data || {} })
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch (_) { throw new Error(`Backend returned non-JSON (HTTP ${response.status}).`); }
    if (!response.ok || result.ok === false) {
      throw new Error(result.error?.message || result.message || result.error || `Backend request failed (HTTP ${response.status}).`);
    }
    return result;
  }

  function setBackendStatus(message, isError = false) {
    els.backendStatus.textContent = message;
    els.backendStatus.classList.toggle('error', Boolean(isError));
    els.backendStatus.classList.toggle('ok', !isError && /online|signed/i.test(message));
  }

  function setStatus(message, isError = false) {
    els.statusMessage.textContent = message;
    els.statusMessage.classList.toggle('error', Boolean(isError));
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function validHex(value, fallback) {
    const str = String(value || '');
    return /^#[0-9a-f]{6}$/i.test(str) ? str : fallback;
  }

  function deepClone(value) {
    if (typeof structuredClone === 'function') {
      try { return structuredClone(value); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function cryptoRandomId(prefix) {
    const random = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    return `${prefix}-${random}`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
  function escapeCssUrl(value) { return String(value).replace(/["\\\n\r]/g, (m) => `\\${m}`); }
  function cssToken(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-'); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function formatNumber(value) { return Number(value).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'); }
  function capitalize(value) { const str = String(value || ''); return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
  function stripExtension(name) { return String(name || '').replace(/\.[^.]+$/, ''); }
  function safeFilename(name) { return String(name || 'book').trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'book'; }
  function truncate(text, max) { const str = String(text ?? ''); return str.length > max ? `${str.slice(0, max)}\n…` : str; }
  function humanizeKey(key) { return String(key).replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (m) => m.toUpperCase()); }

  window.LFBookStudio = {
    version: 1,
    isReady: () => appReady,
    getBookSpec: () => ({
      id: state.id,
      title: state.title,
      subtitle: state.subtitle,
      author: state.author,
      width: Number(state.size.width) || 6,
      height: Number(state.size.height) || 9,
      binding: state.size.binding || 'paperback',
      pageCount: Array.isArray(state.pages) ? state.pages.length : 0,
      coverBase: normalizeCoverBase(state.cover.background)
    }),
    getState: () => deepClone(state),
    setLauncherProjectId: (value) => { launcherProjectId = String(value || ''); return launcherProjectId; },
    saveLauncherProject: async (value) => {
      if (value !== undefined) launcherProjectId = String(value || '');
      await saveLocalNow(false);
      return true;
    },
    loadLauncherProject: async (value) => {
      launcherProjectId = String(value || '');
      if (!launcherProjectId) return false;
      const saved = await localGet(`launcher:${launcherProjectId}`).catch(() => null);
      if (!saved) return false;
      state = normalizeProject(saved);
      selectedPageIndex = 0;
      syncAllControls();
      renderPageList();
      selectPage(0, false);
      rebuildBook(false);
      updateSoundControls();
      updatePreviewMeta();
      setStatus(`Opened saved book: ${state.title || 'Untitled Book'}`);
      return true;
    },
    loadProject: async (raw, options = {}) => {
      const sourceName = String(options.sourceName || raw?.title || 'Imported project');
      if (raw?.schema === APP_SCHEMA || Array.isArray(raw?.pages)) {
        state = normalizeProject(raw);
      } else {
        const imported = normalizeImportedPages(raw, sourceName);
        state = makeDefaultBook();
        state.title = stripExtension(sourceName) || state.title;
        state.cover.title = state.title;
        state.pages = imported.length ? imported : [makeBlankPage('Page 1')];
      }
      state.cloud = { projectId: '', manifestNodeId: '', pageNodeIds: [], assetNodeIds: { cover: [], pageTexture: [] }, bookId: '', editionId: '' };
      selectedPageIndex = 0;
      syncAllControls();
      renderPageList();
      selectPage(0, false);
      rebuildBook(false);
      touch(true);
      setStatus(`Imported project: ${sourceName}`);
      return deepClone(state);
    },
    importSource: async (source = {}) => {
      const name = String(source.name || 'Imported Source');
      const text = String(source.text || '');
      state = makeDefaultBook();
      state.title = stripExtension(name) || 'Imported Book';
      state.cover.title = state.title;
      const page = makeBlankPage(stripExtension(name) || 'Imported Source');
      const imageDataUrl = String(source.dataUrl || '');
      if (imageDataUrl.startsWith('data:image/')) {
        page.type = 'image';
        page.image = imageDataUrl;
        page.alt = stripExtension(name) || 'Imported page image';
      } else {
        page.type = 'article';
        page.html = text
          ? `<h1>${escapeHtml(stripExtension(name) || 'Imported Source')}</h1><pre>${escapeHtml(text)}</pre>`
          : `<h1>${escapeHtml(stripExtension(name) || 'Imported Source')}</h1><p>The source file <strong>${escapeHtml(name)}</strong> is attached to this Studio launch. Use LiteraryFriend Import Center conversion when text extraction is required.</p>`;
      }
      state.pages = [page];
      state.cloud = { projectId: '', manifestNodeId: '', pageNodeIds: [], assetNodeIds: { cover: [], pageTexture: [] }, bookId: '', editionId: '' };
      selectedPageIndex = 0;
      syncAllControls();
      renderPageList();
      selectPage(0, false);
      rebuildBook(false);
      touch(true);
      setStatus(`Imported source opened: ${name}`);
      return deepClone(state);
    },
    setCoverBase: (value) => {
      state.cover.background = normalizeCoverBase(value);
      state.cover.preset = 'custom';
      syncCoverControls();
      scheduleRebuild(true);
      touch(true);
      setStatus(state.cover.background === 'transparent' ? 'Cover base set to transparent.' : `Cover base set to ${state.cover.background}.`);
      return state.cover.background;
    },
    getCloudContext: () => ({ ...state.cloud, signedIn: Boolean(cloudToken), user: cloudUser ? { id: cloudUser.id || '', displayName: cloudUser.displayName || '', email: cloudUser.email || '' } : null }),
    setCloudContext: (patch = {}) => { state.cloud = { ...state.cloud, ...(patch || {}) }; touch(true); return { ...state.cloud }; },
    setBackendSession: (token, user = null) => {
      cloudToken = String(token || '').trim(); cloudUser = user || null;
      try { for (const key of [TOKEN_KEY, 'literaryfriend.session.token.v2', 'literaryfriend.session.token', 'lf.auth.token']) cloudToken ? sessionStorage.setItem(key, cloudToken) : sessionStorage.removeItem(key); } catch (_) {}
      refreshCloudUi();
      document.dispatchEvent(new CustomEvent('literaryfriend:session-changed', { detail: { signedIn: Boolean(cloudToken), user: cloudUser } }));
      return Boolean(cloudToken);
    },
    setCoverArt: (dataUrl, options = {}) => {
      if (!dataUrl || !String(dataUrl).startsWith('data:image/')) throw new Error('Cover artwork is not a valid image data URL.');
      state.cover.artDataUrl = String(dataUrl);
      state.cover.artUrl = '';
      state.cover.showText = options.showText ?? state.cover.showText;
      if (options.syncSize && Number(options.width) > 0 && Number(options.height) > 0) {
        state.size = { ...state.size, preset: 'custom', width: Number(options.width), height: Number(options.height), unit: 'in', binding: state.size.binding || 'custom' };
      }
      syncCoverControls();
      syncSizeControls();
      updatePreviewMeta();
      scheduleRebuild(true);
      touch(true);
      setStatus('Cover artwork received from Cover & Art Studio.');
      return true;
    },
    openCoverPanel: () => {
      document.querySelectorAll('#bookStudioView .panel-tab').forEach((button) => button.classList.toggle('active', button.dataset.panel === 'coverPanel'));
      document.querySelectorAll('#bookStudioView .panel-page').forEach((panel) => panel.classList.toggle('active', panel.id === 'coverPanel'));
    },
    refresh: () => { updatePreviewMeta(); scheduleRebuild(true); }
  };

})();
