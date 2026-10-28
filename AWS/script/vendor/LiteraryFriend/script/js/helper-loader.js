/* Writer Helper Ready consolidated module: helper-loader.js
 * Generated 2026-09-22 by loss-preserving concatenation.
 * Every source module is retained below in an isolated source section unless explicitly documented.
 */

/* ===== BEGIN SOURCE: writer-tools-app.js | sha256:d29d26464c95256eebe784429c601e0f5144176adbe6c89923e10397cda76df3 ===== */
(function () {
  'use strict';

  const appScriptSrc = document.currentScript && document.currentScript.src;

  function loadStoryEngine() {
    if (window.CYOAStoryEngine) return Promise.resolve(window.CYOAStoryEngine);
    if (window.LFHelperChunks) return window.LFHelperChunks.loadScript('helper-creative.js', appScriptSrc).then(() => window.CYOAStoryEngine);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = false;
      try {
        script.src = appScriptSrc ? new URL('helper-creative.js', appScriptSrc).href : 'js/helper-creative.js';
      } catch (_error) {
        script.src = 'js/helper-creative.js';
      }
      script.onload = () => window.CYOAStoryEngine ? resolve(window.CYOAStoryEngine) : reject(new Error('CYOA engine loaded without registering itself.'));
      script.onerror = () => reject(new Error('Could not load js/helper-creative.js.'));
      document.head.appendChild(script);
    });
  }

  function loadHelperStack() {
    const specs = [
      ['helper-persona.js', () => window.WriterWilliamVoice],
      ['helper-safety.js', () => window.WriterToolsContentBoundary || window.WriterToolsRomanceBoundary],
      ['helper-memory.js', () => window.WriterToolsMemory || window.WriterToolsContinuityMemory],
      ['helper-world-model.js', () => window.WriterToolsLanguageEvolution],
      ['helper-retrieval.js', () => window.WriterToolsMaterialHub],
      ['context-assembler.js', () => window.WriterToolsSourceContext || window.WriterToolsCharacterContext],
      ['context-composer.js', () => window.WriterToolsCharacterPrompt],
      ['helper-core.js', () => window.WriterToolsOutputValidator || window.WriterToolsPlotHoleChecker],
      ['helper-provider-bridge.js', () => window.WriterToolsBackendBridge],
      ['helper-creative.js', () => window.CYOAStoryEngine],
      ['helper-router.js', () => window.WriterToolsIntent],
      ['helper-index.js', () => window.WriterToolsRuntime],
      ['debug-trace.js', () => window.WriterToolsIntegrationDiagnostics]
    ];
    const loadOne = ([file, ready]) => {
      if (ready()) return Promise.resolve();
      if (window.LFHelperChunks && window.LFHelperChunks.list().includes(file)) return window.LFHelperChunks.loadScript(file, appScriptSrc).then(() => { if (!ready()) throw new Error(file + ' loaded but did not register its expected API'); });
      return new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.async = false;
        try { script.src = appScriptSrc ? new URL(file, appScriptSrc).href : `js/${file}`; }
        catch (_error) { script.src = `js/${file}`; }
        script.onload = () => ready() ? resolve() : reject(new Error(`${file} loaded without registering its expected API.`));
        script.onerror = () => reject(new Error(`Could not load ${file}.`));
        document.head.appendChild(script);
      });
    };
    return specs.reduce((p, spec) => p.then(() => loadOne(spec)), Promise.resolve());
  }

  loadHelperStack().then(loadStoryEngine).then(boot).catch(error => {
    document.body.innerHTML = `<main class="fallback-error"><h1>Story engine could not open.</h1><p>${escapeHtmlStatic(error.message)}</p><p>Keep the consolidated <code>js/helper-*.js</code> files beside <code>js/helper-loader.js</code>.</p></main>`;
  });

  function escapeHtmlStatic(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[character]));
  }

  async function boot(CYOA) {
    const bundle = window.WRITER_PROJECT_DATA && Array.isArray(window.WRITER_PROJECT_DATA.series)
      ? window.WRITER_PROJECT_DATA
      : {
          schema_version: '3.0',
          title: 'Writer Tools Studio',
          subtitle: 'Plan, draft, branch, revise, and continue stories',
          series: []
        };

    const engine = new CYOA.StoryEngine(bundle);
    // GitHub Pages fix: do not block the writer UI while IndexedDB/project-folder
    // restoration and ~200 hosted JSON files load. The bundled library is complete
    // enough to open the HUD and read immediately; hosted JSON hydrates afterward.
    const engineReady = Promise.resolve()
      .then(() => engine.ready())
      .catch(error => {
        console.warn('Project-folder restore was skipped; writer tools remain available.', error);
        return engine;
      });
    window.WRITER_CYOA = engine;
    window.WriterToolsApp = { engine, ready: engineReady, fadeController: window.WriterToolsFadeController || null, capabilities: {
      create: true, continue: true, branch: true, saveBranches: true, restoreBranches: true,
      chooseYourOwnAdventure: true, adaptiveWritingStyle: true, writerReference: true,
      fullMaterialHub: true, unifiedCharacterLibrary: true, peoplePlacesSupport: true,
      fadeToBlackBoundary: true, romanceTools: true, grammarValidator: true,
      continuityMemory: true, storyGraph: true, integrationDiagnostics: true
    } };
    // Attach the optional fade-to-black transition layer to the main app object.
    window.WriterFadeToBlackBridge?.attachToApp?.(window.WriterToolsApp);

    const appShell = document.getElementById('appShell');
    const leftContent = document.getElementById('leftContent');
    const rightContent = document.getElementById('rightContent');
    const sidePanel = document.getElementById('sidePanel');
    const sideTitle = document.getElementById('sideTitle');
    const sideCount = document.getElementById('sideCount');
    const chapterIndex = document.getElementById('chapterIndex');
    const branchJournal = document.getElementById('branchJournal');
    const journalEntries = document.getElementById('journalEntries');
    const readerToolbar = document.getElementById('readerToolbar');
    const searchInput = document.getElementById('searchInput');
    const soundButton = document.getElementById('soundButton');
    const zoomLabel = document.getElementById('zoomLabel');
    const pageFooter = document.getElementById('pageFooter');
    const footerStatus = document.getElementById('footerStatus');
    const rightPageNumber = document.getElementById('rightPageNumber');
    const pageFlipAudio = document.getElementById('pageFlipAudio');
    const book = document.getElementById('book');
    const bookZoomFrame = document.getElementById('bookZoomFrame');
    const leftPage = document.getElementById('leftPage');
    const rightPage = document.getElementById('rightPage');
    const leftPageNumber = document.getElementById('leftPageNumber');
    const turnSheet = document.getElementById('turnSheet');
    const readerDrawer = document.getElementById('readerDrawer');
    const readerDrawerScrim = document.getElementById('readerDrawerScrim');
    const readerMenuButton = document.getElementById('readerMenuButton');
    const readerDrawerClose = document.getElementById('readerDrawerClose');
    const hudLibrary = document.getElementById('hudLibrary');
    const hudWritingDropdown = document.getElementById('hudWritingDropdown');
    const hudWritingMenu = document.getElementById('hudWritingMenu');
    const hudWritingLabel = document.getElementById('hudWritingLabel');
    const hudStoryTitle = document.getElementById('hudStoryTitle');
    const hudPageStatus = document.getElementById('hudPageStatus');
    const drawerStoryStatus = document.getElementById('drawerStoryStatus');

    if (!appShell || !leftContent || !rightContent) {
      document.body.innerHTML = '<main class="fallback-error"><h1>Reader shell is incomplete.</h1><p>The JavaScript loaded, but the expected book-page elements are missing from index.html.</p></main>';
      return;
    }

    configurePageFlipAudio();

    const state = {
      route: null,
      search: '',
      sound: true,
      zoom: (() => { try { return Math.max(.5, Math.min(3, Number(localStorage.getItem('writer-book-zoom')) || 1)); } catch (_error) { return 1; } })(),
      fadeReturn: null,
      busy: false,
      message: '',
      lastRoute: (() => { try { return localStorage.getItem('writer-last-route') || ''; } catch (_error) { return ''; } })(),
      chapterPage: 0,
      turning: false,
      drag: null,
      drawerOpen: false
    };
    document.documentElement.style.setProperty('--book-zoom', state.zoom.toFixed(2));
    if (zoomLabel) zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json,application/json';
    importInput.multiple = true;
    importInput.hidden = true;
    document.body.appendChild(importInput);

    const folderInput = document.createElement('input');
    folderInput.type = 'file';
    folderInput.accept = '.json,application/json';
    folderInput.multiple = true;
    folderInput.hidden = true;
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.setAttribute('directory', '');
    document.body.appendChild(folderInput);

    function escapeHtml(value) { return escapeHtmlStatic(value); }

    function paragraphs(text) {
      return String(text || '').split(/\n\s*\n/).filter(Boolean).map(paragraph => {
        return `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`;
      }).join('');
    }

    function currentSeries() { return state.route ? engine.getSeries(state.route) : null; }
    function currentChapter() { return state.route ? engine.current(state.route) : null; }

    function currentIndex() {
      const series = currentSeries();
      const chapter = currentChapter();
      return series && chapter ? series.chapters.findIndex(item => item.id === chapter.id) : -1;
    }

    function routeAccent(series) { appShell.dataset.route = series ? series.key : ''; }

    function setDrawerOpen(open, focus = true) {
      state.drawerOpen = Boolean(open);
      appShell.classList.toggle('drawer-open', state.drawerOpen);
      if (readerDrawer) {
        readerDrawer.setAttribute('aria-hidden', String(!state.drawerOpen));
        readerDrawer.inert = !state.drawerOpen;
      }
      if (readerDrawerScrim) readerDrawerScrim.setAttribute('aria-hidden', String(!state.drawerOpen));
      if (readerMenuButton) readerMenuButton.setAttribute('aria-expanded', String(state.drawerOpen));
      if (focus && state.drawerOpen) window.requestAnimationFrame(() => readerDrawerClose?.focus({ preventScroll: true }));
      if (focus && !state.drawerOpen && document.activeElement && readerDrawer?.contains(document.activeElement)) readerMenuButton?.focus({ preventScroll: true });
    }

    function renderHudLibrary() {
      const series = engine.listSeries();
      if (hudLibrary) {
        hudLibrary.innerHTML = series.length ? series.map(routeCard).join('') : '<p class="empty-index">No writing loaded.</p>';
        hudLibrary.querySelectorAll('[data-route]').forEach(button => {
          button.onclick = () => { setDrawerOpen(false, false); openRoute(button.dataset.route, false); };
        });
      }
      if (hudWritingMenu) {
        hudWritingMenu.innerHTML = series.length ? series.map(routeCard).join('') : '<p class="empty-index">No writing loaded.</p>';
        hudWritingMenu.querySelectorAll('[data-route]').forEach(button => {
          button.onclick = () => {
            if (hudWritingDropdown) hudWritingDropdown.open = false;
            setDrawerOpen(false, false);
            openRoute(button.dataset.route, false);
          };
        });
      }
      if (hudWritingLabel) {
        const selected = state.route ? series.find(item => item.key === state.route) : null;
        hudWritingLabel.textContent = selected ? `${selected.fandom} · ${selected.title}` : 'Writing';
      }
    }

    function updateHud() {
      const series = currentSeries();
      const chapter = currentChapter();
      if (hudStoryTitle) hudStoryTitle.textContent = series ? series.title : 'Writer Tools Studio';
      if (hudWritingLabel) hudWritingLabel.textContent = series ? `${series.fandom} · ${series.title}` : 'Writing';
      if (drawerStoryStatus) drawerStoryStatus.textContent = series && chapter ? `Chapter ${chapter.chapter_number} · ${chapter.title}` : 'Library';
      if (hudPageStatus) {
        if (!series || !chapter) hudPageStatus.textContent = appShell.classList.contains('is-open') ? 'Choose a writing' : 'Open the book';
        else {
          const leaves = currentChapterPages(chapter).length + 1;
          const shown = Math.min(leaves, state.chapterPage + 1);
          const spreadEnd = Math.min(leaves, state.chapterPage + (isPortraitReader() ? 1 : 2));
          hudPageStatus.textContent = isPortraitReader() || shown === spreadEnd ? `Ch ${chapter.chapter_number} · page ${shown}/${leaves}` : `Ch ${chapter.chapter_number} · pages ${shown}–${spreadEnd}/${leaves}`;
        }
      }
    }

    function configurePageFlipAudio() {
      if (!pageFlipAudio) return;
      pageFlipAudio.volume = 0.18;
      pageFlipAudio.playbackRate = 0.88;
      if ('preservesPitch' in pageFlipAudio) pageFlipAudio.preservesPitch = true;
      if ('mozPreservesPitch' in pageFlipAudio) pageFlipAudio.mozPreservesPitch = true;
    }

    function playFlip(progress = 0) {
      if (!state.sound || !pageFlipAudio) return;
      configurePageFlipAudio();
      try {
        pageFlipAudio.pause();
        pageFlipAudio.currentTime = Math.min(.16, Math.max(0, progress * .10));
        pageFlipAudio.volume = .42;
        const promise = pageFlipAudio.play();
        if (promise && promise.catch) promise.catch(() => {});
      } catch (_error) {}
    }

    function isPortraitReader() {
      return window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
    }

    function updateBookZoomFrame() {
      if (!book || !bookZoomFrame) return;
      const outer = bookZoomFrame.parentElement;
      if (!outer) return;
      const footerHeight = pageFooter && !pageFooter.hidden ? pageFooter.getBoundingClientRect().height : 0;
      const availableWidth = Math.max(240, outer.clientWidth - 16);
      const availableHeight = Math.max(240, outer.clientHeight - footerHeight - 16);
      const portrait = isPortraitReader();
      const aspect = portrait ? (668 / 1047) : (1336 / 1047);
      const designMax = portrait ? 620 : 1120;
      const fittedWidth = Math.max(240, Math.min(designMax, availableWidth, availableHeight * aspect));

      book.style.width = `${Math.floor(fittedWidth)}px`;
      book.style.aspectRatio = portrait ? '668 / 1047' : '1336 / 1047';

      window.requestAnimationFrame(() => {
        const width = book.offsetWidth;
        const height = book.offsetHeight;
        if (!width || !height) return;
        bookZoomFrame.style.width = `${Math.ceil(width * state.zoom)}px`;
        bookZoomFrame.style.height = `${Math.ceil(height * state.zoom)}px`;
      });
    }

    function scheduleFitPageContent() {
      window.requestAnimationFrame(() => window.requestAnimationFrame(updateBookZoomFrame));
    }

    function paginateChapterText(text, targetWords = 220) {
      const rawParagraphs = String(text || '').split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);
      if (!rawParagraphs.length) return [''];
      const pieces = [];
      rawParagraphs.forEach(paragraph => {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (words.length <= targetWords) {
          pieces.push(paragraph);
          return;
        }
        const sentences = paragraph.match(/[^.!?]+[.!?]+(?:["'’”]+)?|[^.!?]+$/g) || [paragraph];
        let part = [];
        let count = 0;
        sentences.forEach(sentence => {
          const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean).length;
          if (part.length && count + sentenceWords > targetWords) {
            pieces.push(part.join(' ').trim());
            part = [];
            count = 0;
          }
          if (sentenceWords > targetWords) {
            const longWords = sentence.trim().split(/\s+/);
            for (let i = 0; i < longWords.length; i += targetWords) {
              if (part.length) {
                pieces.push(part.join(' ').trim());
                part = [];
                count = 0;
              }
              pieces.push(longWords.slice(i, i + targetWords).join(' '));
            }
          } else {
            part.push(sentence.trim());
            count += sentenceWords;
          }
        });
        if (part.length) pieces.push(part.join(' ').trim());
      });

      const pages = [];
      let current = [];
      let words = 0;
      pieces.forEach(piece => {
        const count = piece.split(/\s+/).filter(Boolean).length;
        if (current.length && words + count > targetWords) {
          pages.push(current.join('\n\n'));
          current = [];
          words = 0;
        }
        current.push(piece);
        words += count;
      });
      if (current.length) pages.push(current.join('\n\n'));
      return pages.length ? pages : [''];
    }

    function chapterWordTarget() {
      if (isPortraitReader()) return 105;
      if (window.innerWidth <= 980) return 155;
      return 205;
    }

    function bundledChapterContent(chapter) {
      if (!chapter || !state.route) return '';
      const sourceSeries = Array.isArray(bundle?.series)
        ? bundle.series.find(item => item && item.key === state.route)
        : null;
      if (!sourceSeries || !Array.isArray(sourceSeries.chapters)) return '';
      const sourceChapter = sourceSeries.chapters.find(item =>
        item && (item.id === chapter.id || Number(item.chapter_number) === Number(chapter.chapter_number))
      );
      return String(sourceChapter?.content || '');
    }

    function currentChapterPages(chapter = currentChapter()) {
      if (!chapter) return [''];
      const target = chapterWordTarget();
      const primaryText = String(chapter.content || '');
      let pages = paginateChapterText(primaryText, target);

      // GitHub-hosted manifests contain chapter metadata as well as full chapter JSON.
      // If a transient/partial hosted merge ever leaves only metadata in memory, never
      // collapse a 1,500-word bundled chapter into a blank text leaf + choice leaf.
      const expectedWords = Number(chapter.word_count || 0);
      if (pages.length <= 1 && expectedWords > target * 2) {
        const fallbackText = bundledChapterContent(chapter);
        if (fallbackText.trim().length > primaryText.trim().length) {
          pages = paginateChapterText(fallbackText, target);
        }
      }
      return pages.length ? pages : [''];
    }

    function setStatus(message) {
      state.message = message || '';
      if (footerStatus && message) footerStatus.textContent = message;
    }

    function privateKey() {
      const chapter = currentChapter();
      return chapter && state.route ? `writer-private-${state.route}-${chapter.id}` : '';
    }

    function savePrivateText(text) {
      const key = privateKey();
      if (!key) return;
      try { localStorage.setItem(key, text); } catch (_error) {}
    }

    function loadPrivateText() {
      const key = privateKey();
      if (!key) return '';
      try { return localStorage.getItem(key) || ''; } catch (_error) { return ''; }
    }

    function totalWords(series) {
      return series ? series.chapters.reduce((sum, chapter) => sum + CYOA.wordCount(chapter.content), 0) : 0;
    }

    function folderLabel() {
      return engine.hasProjectFolder() ? 'Project folder connected' : 'Connect project folder';
    }

    function toolsMarkup() {
      const hasLast = Boolean(state.lastRoute && engine.getSeries(state.lastRoute));
      return `
        <div class="home-actions" aria-label="Writing tools">
          <button class="home-action home-action-create" type="button" data-action="create-story">Create Writing</button>
          <button class="home-action" type="button" data-action="resume-last" ${hasLast ? '' : 'disabled'}>Resume</button>
          <button class="home-action" type="button" data-action="save-last" ${hasLast ? '' : 'disabled'}>Save</button>
          <button class="home-action" type="button" data-action="import-json">Import</button>
          <button class="home-action" type="button" data-action="import-folder">Folder</button>
          <button class="home-action" type="button" data-action="connect-folder">${escapeHtml(engine.hasProjectFolder() ? 'Folder ✓' : 'Connect')}</button>
        </div>`;
    }

    function openBook() {
      appShell.classList.add('is-open', 'is-home');
      appShell.classList.remove('is-reading');
      setDrawerOpen(false, false);
      renderHome();
      updateHud();
    }

    function closeBook() {
      state.route = null;
      setDrawerOpen(false, false);
      renderHome();
      appShell.classList.remove('is-open', 'is-reading');
      appShell.classList.add('is-home');
      updateHud();
    }

    function routeCard(series) {
      const generatedCount = series.chapters.filter(chapter => chapter.generated).length;
      const resume = engine.memory(series.key)?.state.currentId ? ' · resume' : '';
      const routeClass = CYOA.slug(series.fandom_folder || series.fandom || series.key);
      return `<button class="route-button route-${escapeHtml(routeClass)}" type="button" data-route="${escapeHtml(series.key)}">
        <span class="route-kicker">${escapeHtml(series.fandom)}</span>
        <strong>${escapeHtml(series.title)}</strong>
        <span>${escapeHtml(series.pairing || 'Interactive writing')} · ${series.chapters.length} ch.${generatedCount ? ` · ${generatedCount} new` : ''}${resume}</span>
      </button>`;
    }

    function renderHome() {
      state.route = null;
      state.search = '';
      state.fadeReturn = null;
      state.chapterPage = 0;
      if (searchInput) searchInput.value = '';
      appShell.classList.add('is-home');
      appShell.classList.remove('is-reading', 'show-left-page');
      routeAccent(null);
      if (readerToolbar) readerToolbar.hidden = true;
      if (pageFooter) pageFooter.hidden = true;
      if (sidePanel) sidePanel.hidden = true;
      renderHudLibrary();
      updateHud();

      leftContent.innerHTML = `
        <div class="page-inner title-page home-page">
          <div class="home-intro">
            <div class="title-mark" aria-hidden="true">✦</div>
            <p class="series-kicker">Writer's library</p>
            <h2>Writer Tools<br>Studio</h2>
            <h3>Writing can branch, resume, and keep growing.</h3>
          </div>
        </div>`;

      rightContent.innerHTML = `
        <div class="page-inner title-page home-page home-bookplate">
          <div>
            <div class="title-mark" aria-hidden="true">☰</div>
            <p class="series-kicker">Writer menu</p>
            <h2>Choose a Writing</h2>
            <h3>Projects · Chapters · Search · Branches</h3>
          </div>
        </div>`;
      if (leftPageNumber) leftPageNumber.textContent = 'i';
      if (rightPageNumber) rightPageNumber.textContent = 'ii';
      bindDynamicButtons();
      updateNavButtons();
      scheduleFitPageContent();
    }

    function renderCreateStory() {
      appShell.classList.add('is-open', 'is-home');
      appShell.classList.remove('is-reading');
      if (readerToolbar) readerToolbar.hidden = true;
      if (sidePanel) sidePanel.hidden = true;
      leftContent.innerHTML = `
        <div class="page-inner title-page home-page">
          <div>
            <div class="title-mark" aria-hidden="true">✦</div>
            <p class="series-kicker">Create</p>
            <h2>New Writing</h2>
            <h3>Start a branchable story.</h3>
          </div>
        </div>`;
      rightContent.innerHTML = `
        <div class="page-inner writer-page create-page">
          <div class="running-head"><span>Create Writing</span><span>CYOA</span></div>
          <div class="page-scroll chapter-scroll">
            <form id="createStoryForm" class="story-form">
              <label>Title<input name="title" required placeholder="Story title"></label>
              <label>Project / source world<input name="fandom" required placeholder="Original, existing universe, or project name"></label>
              <label>Characters / relationship focus<input name="pairing" placeholder="Lead character, ensemble, or relationship focus"></label>
              <label>Character personalities<textarea name="character_bible" required rows="5" placeholder="Voice, habits, history, boundaries, dynamics"></textarea></label>
              <label>Premise<textarea name="premise" class="writer-editor" required rows="6" placeholder="What happens, where it starts, tone, conflict, must-have moments"></textarea></label>
              <label>Tone<input name="tone" placeholder="Slow burn, adventure, domestic, dark humor..."></label>
              <label>Timeline / continuity<textarea name="canon_window" rows="3" placeholder="Timeline, source constraints, and facts to preserve"></textarea></label>
              <label>Story bible<textarea name="story_bible" rows="4" placeholder="Recurring facts, boundaries, locations, promises, injuries, items"></textarea></label>
              <label>Length<input name="target_words" type="number" min="600" max="10000" step="100" value="1800"></label>
              <label>Tags<input name="content_tags" placeholder="romance, slow burn, adventure, humor, mystery, worldbuilding..."></label>
              <label>Romance handling<select name="content_mode"><option value="general">General</option><option value="romance" selected>Romance (fade to black when needed)</option></select></label>
              <p class="writer-project-note">Use this workspace for original fiction, transformative fiction, character work, worldbuilding, branching stories, and revision. Romance may remain on-page, but sexual escalation is handled only with a fade-to-black transition.</p>
              <div class="form-actions">
                <button class="choice-button" type="submit">Generate Chapter 01</button>
                <button class="choice-button" type="button" data-action="home">Cancel</button>
              </div>
            </form>
          </div>
        </div>`;
      bindDynamicButtons();
      scheduleFitPageContent();
    }

    function renderStorySettings() {
      const series = currentSeries();
      if (!series) return;
      const contentMode = series.content_mode || 'romance';
      const tags = Array.isArray(series.content_tags) ? series.content_tags.join(', ') : '';
      rightContent.innerHTML = `
        <div class="page-inner writer-page">
          <div class="running-head"><span>${escapeHtml(series.title)}</span><span>Generation settings</span></div>
          <div class="page-scroll chapter-scroll">
            <h2 class="chapter-title">Story settings</h2>
            <div class="ornament"></div>
            <form id="storySettingsForm" class="writer-actions" style="display:grid;gap:.8rem">
              <label>Writing style
                <select name="style_mode">
                  <option value="story_adaptive" ${series.style_mode !== 'story_only' ? 'selected' : ''}>Adaptive + continuity</option>
                  <option value="story_only" ${series.style_mode === 'story_only' ? 'selected' : ''}>Existing chapters only</option>
                </select>
              </label>
              <label>Chapter length<input name="target_words" type="number" min="600" max="10000" step="100" value="${escapeHtml(String(series.target_words || 1600))}"></label>
              <label>Tone / genre<input name="tone" value="${escapeHtml(series.tone || '')}" placeholder="slow burn, domestic, adventure, grief, humor..."></label>
              <label>Story tags<input name="content_tags" value="${escapeHtml(tags)}" placeholder="romance, slow burn, adventure, mystery, humor, worldbuilding..."></label>
              <label>Romance handling><select name="content_mode"><option value="general" ${contentMode === 'general' ? 'selected' : ''}>General</option><option value="romance" ${contentMode !== 'general' ? 'selected' : ''}>Romance (fade to black when needed)</option></select></label>
              <p class="writer-project-note">Sexual scenes are not generated. When a romantic scene would cross that boundary, the story uses a fade-to-black transition and resumes afterward without sexual detail.</p>
              <label>Canon / continuity notes<textarea name="canon_window" rows="4">${escapeHtml(series.canon_window || '')}</textarea></label>
              <label>Story / character bible<textarea name="story_bible" rows="7">${escapeHtml(series.story_bible || '')}</textarea></label>
              <div class="writer-actions">
                <button class="choice-button" type="submit">Save settings</button>
                <button class="choice-button secondary" type="button" data-action="cancel-story-settings">Cancel</button>
              </div>
            </form>
          </div>
        </div>`;
      bindDynamicButtons();
    }

    function renderIndex() {
      const series = currentSeries();
      if (!series || !chapterIndex) return;
      const chapter = currentChapter();
      if (sideTitle) sideTitle.textContent = series.title;
      if (sideCount) sideCount.textContent = `${series.chapters.length} chapters · ${totalWords(series).toLocaleString()} words`;
      const query = state.search.trim().toLowerCase();
      const visible = series.chapters.filter(item => {
        if (!query) return true;
        return `${item.title} ${item.subtitle} ${item.content}`.toLowerCase().includes(query);
      });
      chapterIndex.innerHTML = visible.length ? visible.map(item => {
        const current = item.id === chapter?.id;
        const generated = item.generated ? ' · generated' : '';
        return `<button class="index-link reader-chapter-link ${current ? 'is-current' : ''}" type="button" data-chapter-id="${escapeHtml(item.id)}">
          <span>${padDisplay(item.chapter_number)}. ${escapeHtml(item.title)}</span>
          <small>${CYOA.wordCount(item.content).toLocaleString()} words · ${item.choices.length} choices${generated}</small>
        </button>`;
      }).join('') : '<p class="empty-index">No chapter matches that search.</p>';
      chapterIndex.querySelectorAll('[data-chapter-id]').forEach(button => {
        button.addEventListener('click', () => openChapter(button.dataset.chapterId, true));
      });
    }

    function padDisplay(number) { return String(number || 0).padStart(2, '0'); }

    function renderJournal() {
      if (!branchJournal || !journalEntries) return;
      const journal = state.route ? engine.getJournal(state.route) : [];
      const branches = state.route ? engine.listBranches(state.route) : [];
      if (!journal.length && !branches.length) {
        branchJournal.hidden = true;
        journalEntries.innerHTML = '';
        return;
      }
      branchJournal.hidden = false;
      const saved = branches.length ? `<div class="drawer-branch-list">${branches.slice(0, 12).map(branch => `<button class="branch-button" type="button" data-restore-branch="${escapeHtml(branch.id)}"><strong>${escapeHtml(branch.label)}</strong><span>${escapeHtml(branch.chapterNumber ? `Chapter ${branch.chapterNumber}` : 'Saved branch')}</span></button>`).join('')}</div>` : '';
      const path = journal.length ? `<div class="drawer-path-list">${journal.slice(-8).map(entry => `<p class="journal-entry"><strong>${escapeHtml(entry.chapter || `Chapter ${entry.chapterNumber}`)}</strong><br>${escapeHtml(entry.choice)}</p>`).join('')}</div>` : '';
      journalEntries.innerHTML = saved + path;
      journalEntries.querySelectorAll('[data-restore-branch]').forEach(button => {
        button.onclick = () => { setDrawerOpen(false, false); restoreBranch(button.dataset.restoreBranch); };
      });
    }

    function qualitiesText() {
      const values = engine.getQualities(state.route);
      const entries = Object.entries(values).filter(([, value]) => value !== 0 && value != null);
      if (!entries.length) return 'No branch qualities recorded yet.';
      return entries.slice(0, 8).map(([key, value]) => `${key}: ${value}`).join(' · ');
    }

    function renderLeftPage() {
      const series = currentSeries();
      const chapter = currentChapter();
      if (!series || !chapter) return;
      renderIndex();
      renderJournal();
      updateHud();
      document.querySelectorAll('[data-action="undo"]').forEach(button => { button.disabled = !engine.canUndo(state.route); });
    }

    function choiceMarkup(choice) {
      const fadeClass = String(choice.target || '').startsWith('@generate-fade') ? ' fade-to-black' : '';
      const effect = choice.effect && Object.keys(choice.effect).length
        ? `<small>${escapeHtml(Object.entries(choice.effect).map(([key, value]) => `${key} ${typeof value === 'number' && value >= 0 ? '+' : ''}${value}`).join(' · '))}</small>`
        : '';
      return `<button class="choice-button${fadeClass}" type="button" data-choice="${escapeHtml(choice.id)}">
        <span class="choice-label">${escapeHtml(choice.label)}</span>
        <span class="choice-description">${escapeHtml(choice.description || '')}</span>
        ${effect}
      </button>`;
    }

    function chapterLeafCount(chapter = currentChapter()) {
      return chapter ? currentChapterPages(chapter).length + 1 : 0;
    }

    function readerStep() { return isPortraitReader() ? 1 : 2; }

    function normalizeLeaf(index, chapter = currentChapter()) {
      const count = Math.max(1, chapterLeafCount(chapter));
      let value = Math.max(0, Math.min(Number(index) || 0, count - 1));
      if (!isPortraitReader()) value -= value % 2;
      return value;
    }

    function leafMarkup(chapter, leafIndex) {
      if (!chapter) return '<div class="page-inner"><div class="blank-page"></div></div>';
      const series = currentSeries() || engine.getSeries(state.route);
      const textPages = currentChapterPages(chapter);
      const decisionIndex = textPages.length;
      if (leafIndex < 0 || leafIndex > decisionIndex) return '<div class="page-inner"><div class="blank-page">✦</div></div>';
      if (leafIndex === decisionIndex) {
        const choices = engine.availableChoices(chapter);
        return `
          <div class="page-inner chapter-page decision-leaf">
            <div class="running-head"><span>${escapeHtml(series?.title || '')}</span><span>Chapter ${chapter.chapter_number} · choice</span></div>
            <div class="page-scroll chapter-scroll decision-scroll">
              <h2 class="chapter-title">${series?.story_type === 'short_story' ? 'The End' : 'What happens next?'}</h2>
              <div class="ornament"></div>
              ${series?.story_type === 'short_story' ? `
                <div class="choice-grid">
                  <button class="choice-button" type="button" data-action="home"><span class="choice-label">Project library</span></button>
                  <button class="choice-button" type="button" data-action="create-story"><span class="choice-label">Create another</span></button>
                </div>` : `
                <div class="choice-grid">${choices.length ? choices.map(choiceMarkup).join('') : `
                  <button class="choice-button" type="button" data-action="continue-story">
                    <span class="choice-label">Continue this branch</span>
                    <span class="choice-description">Generate the next chapter.</span>
                  </button>`}</div>`}
            </div>
          </div>`;
      }
      const pageText = textPages[leafIndex] || '';
      const bridge = engine.getEntryBridge(state.route);
      const first = leafIndex === 0;
      return `
        <div class="page-inner chapter-page">
          <div class="running-head"><span>${escapeHtml(series?.title || '')}</span><span>Chapter ${chapter.chapter_number} · ${leafIndex + 1}/${textPages.length + 1}</span></div>
          <div class="page-scroll chapter-scroll">
            ${first ? `<h2 class="chapter-title">${escapeHtml(chapter.title)}</h2><p class="chapter-meta">${escapeHtml(chapter.subtitle || '')}${chapter.generated ? ' · generated continuation' : ''}</p><div class="ornament"></div>` : `<p class="continued">${escapeHtml(chapter.title)} · continued</p>`}
            ${bridge && first ? `<div class="path-card carry-card"><strong>Carried forward</strong><span>${escapeHtml(bridge)}</span></div>` : ''}
            <div class="story-body">${paragraphs(pageText)}</div>
          </div>
        </div>`;
    }

    function setPageNumbers(chapter, start) {
      const total = chapterLeafCount(chapter);
      if (leftPageNumber) leftPageNumber.textContent = isPortraitReader() ? '' : (start < total ? `${chapter.chapter_number}.${start + 1}` : '');
      if (rightPageNumber) {
        const idx = isPortraitReader() ? start : start + 1;
        rightPageNumber.textContent = idx < total ? `${chapter.chapter_number}.${idx + 1}` : '';
      }
    }

    function renderSpread(chapter = currentChapter(), start = state.chapterPage) {
      if (!chapter) return;
      const normalized = normalizeLeaf(start, chapter);
      state.chapterPage = normalized;
      if (isPortraitReader()) {
        leftContent.innerHTML = '<div class="page-inner"><div class="blank-page"></div></div>';
        rightContent.innerHTML = leafMarkup(chapter, normalized);
      } else {
        leftContent.innerHTML = leafMarkup(chapter, normalized);
        rightContent.innerHTML = leafMarkup(chapter, normalized + 1);
      }
      setPageNumbers(chapter, normalized);
    }

    function renderChapter() {
      const series = currentSeries();
      const chapter = currentChapter();
      if (!series || !chapter) return renderHome();
      appShell.classList.add('is-reading');
      appShell.classList.remove('is-home', 'show-left-page');
      if (readerToolbar) readerToolbar.hidden = false;
      if (sidePanel) sidePanel.hidden = false;
      updateBookZoomFrame();
      state.chapterPage = normalizeLeaf(state.chapterPage, chapter);
      renderSpread(chapter, state.chapterPage);
      renderIndex();
      renderJournal();
      renderHudLibrary();
      updateHud();
      if (footerStatus) footerStatus.textContent = hudPageStatus?.textContent || `${series.title} · Chapter ${chapter.chapter_number}`;
      if (pageFooter) pageFooter.hidden = false;
      bindDynamicButtons();
      updateNavButtons();
      scheduleFitPageContent();
    }

    function renderEnding() {
      const series = currentSeries();
      const chapter = currentChapter();
      if (!series || !chapter) return;
      state.chapterPage = Math.max(0, chapterLeafCount(chapter) - 1);
      renderChapter();
      setStatus(`${series.title} · ready to continue after chapter ${chapter.chapter_number}`);
    }

    function peekNavigation(dir) {
      const series = currentSeries();
      const chapter = currentChapter();
      const index = currentIndex();
      if (!series || !chapter || index < 0) return null;
      const step = readerStep();
      const count = chapterLeafCount(chapter);
      if (dir === 'next') {
        const next = state.chapterPage + step;
        if (next < count) return { chapter, chapterId: chapter.id, page: normalizeLeaf(next, chapter) };
        return null;
      }
      const previous = state.chapterPage - step;
      if (previous >= 0) return { chapter, chapterId: chapter.id, page: normalizeLeaf(previous, chapter) };
      if (index <= 0) return null;
      const previousChapter = series.chapters[index - 1];
      const previousCount = chapterLeafCount(previousChapter);
      return { chapter: previousChapter, chapterId: previousChapter.id, page: normalizeLeaf(previousCount - 1, previousChapter) };
    }

    function updateNavButtons() {
      const reading = appShell.classList.contains('is-reading');
      const prev = reading && Boolean(peekNavigation('prev'));
      const next = reading && Boolean(peekNavigation('next'));
      document.querySelectorAll('[data-action="previous"]').forEach(button => { button.disabled = !prev || state.turning || state.busy; });
      document.querySelectorAll('[data-action="next"]').forEach(button => { button.disabled = !next || state.turning || state.busy; });
      document.querySelectorAll('[data-action="undo"]').forEach(button => { button.disabled = !state.route || !engine.canUndo(state.route); });
      document.querySelectorAll('[data-action="save-progress"]').forEach(button => { button.disabled = !state.route || state.busy; });
    }

    function targetSpreadMarkup(target) {
      if (isPortraitReader()) return { left: '', right: leafMarkup(target.chapter, target.page) };
      return { left: leafMarkup(target.chapter, target.page), right: leafMarkup(target.chapter, target.page + 1) };
    }

    function prepareTurn(dir) {
      if (state.turning || state.busy || !appShell.classList.contains('is-reading')) return null;
      const target = peekNavigation(dir);
      if (!target || !turnSheet) return null;
      state.turning = true;
      updateNavButtons();
      book.classList.add('is-turning');
      turnSheet.className = `turn-sheet active ${dir}`;
      const front = turnSheet.querySelector('.sheet-front');
      const back = turnSheet.querySelector('.sheet-back');
      const targetMarkup = targetSpreadMarkup(target);
      if (isPortraitReader()) {
        front.innerHTML = rightContent.innerHTML;
        back.innerHTML = targetMarkup.right;
        rightContent.innerHTML = targetMarkup.right;
      } else if (dir === 'next') {
        front.innerHTML = rightContent.innerHTML;
        back.innerHTML = targetMarkup.left;
        rightContent.innerHTML = targetMarkup.right;
      } else {
        front.innerHTML = leftContent.innerHTML;
        back.innerHTML = targetMarkup.right;
        leftContent.innerHTML = targetMarkup.left;
      }
      applyTurnProgress(dir, 0);
      return { dir, target, finished: false, fallbackTimer: 0 };
    }

    function applyTurnProgress(dir, progress) {
      if (!turnSheet) return;
      const p = Math.max(0, Math.min(1, progress));
      const curl = Math.pow(Math.sin(Math.PI * p), .88);
      const sign = dir === 'next' ? -1 : 1;
      const angle = sign * 180 * p;
      const lift = 46 * Math.pow(curl, 1.45);
      const droop = sign * (1.35 * Math.sin(Math.PI * p) + .28 * Math.sin(2 * Math.PI * p));
      const skew = sign * .65 * curl;
      const squeeze = 1 - .025 * curl;
      const style = turnSheet.style;
      style.setProperty('--progress', p.toFixed(4));
      style.setProperty('--curl', curl.toFixed(4));
      style.setProperty('--shadow-x', `${((.5 - p) * 18).toFixed(2)}px`);
      style.setProperty('--shadow-blur', `${(14 + curl * 30).toFixed(2)}px`);
      style.setProperty('--shadow-alpha', (0.20 + curl * 0.42).toFixed(3));
      style.setProperty('--paper-hi', (0.06 + curl * 0.18).toFixed(3));
      style.setProperty('--paper-dark', (curl * 0.16).toFixed(3));
      style.setProperty('--paper-dark-back', (curl * 0.18).toFixed(3));
      style.setProperty('--face-hi', (curl * 0.26).toFixed(3));
      style.setProperty('--face-dark', (curl * 0.34).toFixed(3));
      style.setProperty('--ridge-a-opacity', (curl * 0.95).toFixed(3));
      style.setProperty('--ridge-b-opacity', (curl * 0.70).toFixed(3));
      style.setProperty('--ridge-a-offset', `${(2 + curl * 12).toFixed(2)}%`);
      style.setProperty('--ridge-b-offset', `${(18 + curl * 19).toFixed(2)}%`);
      style.setProperty('--ridge-skew', `${(curl * 1.1).toFixed(3)}deg`);
      style.setProperty('--edge-width', `${(9 + curl * 24).toFixed(2)}px`);
      style.setProperty('--edge-opacity', (0.35 + curl * 0.65).toFixed(3));
      style.setProperty('--edge-blur', `${(8 + curl * 18).toFixed(2)}px`);
      style.setProperty('--edge-shadow-alpha', (0.15 + curl * 0.24).toFixed(3));
      style.setProperty('--edge-radius', `${(4 + curl * 18).toFixed(2)}px`);
      style.transform = `translateZ(${lift.toFixed(2)}px) rotateY(${angle.toFixed(3)}deg) rotateZ(${droop.toFixed(3)}deg) skewY(${skew.toFixed(3)}deg) scaleX(${squeeze.toFixed(4)})`;
    }

    function heavyEase(value) {
      const t = Math.max(0, Math.min(1, value));
      if (t < .46) { const x = t / .46; return .5 * Math.pow(x, 1.55); }
      const x = (t - .46) / .54;
      return .5 + .5 * (1 - Math.pow(1 - x, 1.85));
    }

    function finishTurn(context, commit) {
      if (!context || context.finished) return;
      context.finished = true;
      if (context.fallbackTimer) window.clearTimeout(context.fallbackTimer);
      if (commit && context.target) {
        if (context.target.chapterId !== currentChapter()?.id) engine.openChapter(state.route, context.target.chapterId, { record: true });
        state.chapterPage = context.target.page;
      }
      if (turnSheet) {
        turnSheet.className = 'turn-sheet';
        turnSheet.style.transform = '';
        turnSheet.querySelector('.sheet-front').innerHTML = '';
        turnSheet.querySelector('.sheet-back').innerHTML = '';
      }
      book.classList.remove('is-turning', 'is-grabbing');
      state.turning = false;
      state.drag = null;
      renderChapter();
    }

    function animateFrom(context, from, to, duration, commit) {
      if (!context || context.finished) return;
      const start = performance.now();
      if (context.fallbackTimer) window.clearTimeout(context.fallbackTimer);
      // Mobile browsers can occasionally suspend a requestAnimationFrame sequence
      // during touch/scroll/UI changes. Always complete or cancel the same turn so
      // state.turning can never strand Writer on page two.
      context.fallbackTimer = window.setTimeout(() => finishTurn(context, commit), Math.max(450, duration + 320));
      if (to === 1 && from < .15) playFlip(from);
      function frame(now) {
        if (context.finished) return;
        const raw = Math.max(0, Math.min(1, (now - start) / duration));
        const eased = to === 1 ? heavyEase(raw) : 1 - heavyEase(1 - raw);
        const progress = from + (to - from) * eased;
        applyTurnProgress(context.dir, progress);
        if (raw < 1) requestAnimationFrame(frame); else finishTurn(context, commit);
      }
      requestAnimationFrame(frame);
    }

    function requestTurn(dir) {
      const context = prepareTurn(dir);
      if (!context) return false;
      playFlip(0);
      animateFrom(context, 0, 1, 840, true);
      return true;
    }

    function previousChapter() { return requestTurn('prev'); }
    function nextChapter() { return requestTurn('next'); }

    function dragStart(event) {
      if (state.turning || state.busy || !appShell.classList.contains('is-reading') || event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button,input,a,select,textarea,label')) return;
      const source = isPortraitReader() ? rightPage : event.currentTarget;
      const rect = source.getBoundingClientRect();
      let dir = null;
      if (isPortraitReader()) {
        const local = event.clientX - rect.left;
        if (local > rect.width * .55) dir = 'next';
        else if (local < rect.width * .45) dir = 'prev';
      } else dir = event.currentTarget === rightPage ? 'next' : 'prev';
      if (!dir || !peekNavigation(dir)) return;
      const context = prepareTurn(dir);
      if (!context) return;
      source.setPointerCapture?.(event.pointerId);
      state.drag = { context, startX: event.clientX, lastT: performance.now(), progress: 0, velocity: 0, source, pointerId: event.pointerId, sounded: false };
      book.classList.add('is-grabbing');
      event.preventDefault();
    }

    function dragMove(event) {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const rect = drag.source.getBoundingClientRect();
      const delta = drag.context.dir === 'next' ? drag.startX - event.clientX : event.clientX - drag.startX;
      const progress = Math.max(0, Math.min(1, delta / Math.max(1, rect.width)));
      const now = performance.now();
      drag.velocity = (progress - drag.progress) / Math.max(1, now - drag.lastT);
      drag.progress = progress;
      drag.lastT = now;
      if (progress > .045 && !drag.sounded) { playFlip(progress); drag.sounded = true; }
      applyTurnProgress(drag.context.dir, progress);
      event.preventDefault();
    }

    function dragEnd(event) {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const commit = drag.progress > .27 || drag.velocity > .0016;
      const remaining = Math.abs((commit ? 1 : 0) - drag.progress);
      animateFrom(drag.context, drag.progress, commit ? 1 : 0, Math.max(220, 620 * remaining), commit);
    }


    function openRoute(key, restart) {
      if (!engine.getSeries(key)) return;
      state.route = key;
      state.lastRoute = key;
      try { localStorage.setItem('writer-last-route', key); } catch (_error) {}
      state.search = '';
      state.fadeReturn = null;
      state.chapterPage = 0;
      if (searchInput) searchInput.value = '';
      engine.start(key, { restart: Boolean(restart) });
      appShell.classList.add('is-open', 'is-reading');
      appShell.classList.remove('is-home', 'show-left-page');
      routeAccent(engine.getSeries(key));
      if (readerToolbar) readerToolbar.hidden = false;
      if (sidePanel) sidePanel.hidden = false;
      setDrawerOpen(false, false);
      playFlip();
      renderChapter();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_error) {}
    }

    function openChapter(id, announce) {
      const series = currentSeries();
      if (!series) return;
      const chapter = engine.openChapter(state.route, id, { record: true });
      if (!chapter) return;
      state.fadeReturn = null;
      state.chapterPage = 0;
      setDrawerOpen(false, false);
      if (announce) playFlip();
      renderChapter();
    }

    async function withBusy(label, fn) {
      if (state.busy) return null;
      state.busy = true;
      updateNavButtons();
      setStatus(label || 'Working…');
      try {
        return await fn();
      } catch (error) {
        console.error(error);
        setStatus(error?.message || 'Something went wrong while progressing the story.');
        return null;
      } finally {
        state.busy = false;
        updateNavButtons();
      }
    }

    async function chooseChoice(choiceId) {
      const chapterBefore = currentChapter();
      const choiceBefore = Array.isArray(chapterBefore?.choices) ? chapterBefore.choices.find(item => item.id === choiceId) : null;
      const fadeController = window.WriterToolsFadeController;
      const transitioning = Boolean(fadeController && (fadeController.isFadeChoice?.(choiceBefore) || fadeController.isResumeChoice?.(choiceBefore)));
      if (transitioning) {
        await fadeController.beforeChoice({
          seriesKey: state.route,
          chapterId: chapterBefore?.id || '',
          choice: choiceBefore
        });
      }

      const busyLabel = fadeController?.isFadeChoice?.(choiceBefore)
        ? 'Applying fade to black…'
        : fadeController?.isResumeChoice?.(choiceBefore)
          ? 'Returning to the story…'
          : 'Following that branch…';
      const result = await withBusy(busyLabel, () => engine.choose(choiceId));
      if (!result) {
        if (transitioning) await fadeController.afterChoice({ seriesKey: state.route, chapterId: chapterBefore?.id || '', choice: choiceBefore, result: null });
        return;
      }
      playFlip();
      if (result.type === 'ending') {
        renderJournal();
        renderEnding();
        if (transitioning) await fadeController.afterChoice({ seriesKey: state.route, chapterId: chapterBefore?.id || '', choice: choiceBefore, result });
        return;
      }
      if (result.type === 'chapter') {
        state.chapterPage = 0;
        renderChapter();
        if (result.generated) {
          if (result.fadeTransition) {
            setStatus(result.resumeTarget
              ? `Fade to black applied. “Return to the story” will resume at ${result.resumeTarget === '@generate' ? 'the next generated chapter' : 'the next authored chapter'}.`
              : 'Fade to black applied with story state preserved.');
          } else {
            setStatus(engine.hasProjectFolder() ? 'New branch chapter generated and written to JSON.' : 'New branch chapter generated and saved in browser storage.');
          }
        }
      }
      if (transitioning) await fadeController.afterChoice({ seriesKey: state.route, chapterId: chapterBefore?.id || '', choice: choiceBefore, result });
    }

    async function continueStory(direction) {
      const chapter = await withBusy('Creating the next chapter from the current branch…', () => engine.continueStory(direction || 'continue'));
      if (!chapter) return;
      playFlip();
      state.chapterPage = 0;
      renderChapter();
      const series = currentSeries();
      setStatus(engine.hasProjectFolder()
        ? `Chapter ${chapter.chapter_number} generated and written to json/${series?.series_path || ''}/${padDisplay(chapter.chapter_number)}.json.`
        : `Chapter ${chapter.chapter_number} generated and saved in this browser.`);
    }


    function saveProgress() {
      if (!state.route) return;
      engine.saveProgress(state.route);
      setStatus('Progress saved in this browser.');
      if (currentChapter()) {
        renderLeftPage();
        bindDynamicButtons();
      }
    }

    function undoDecision() {
      if (!state.route) return;
      const branch = engine.undo(state.route);
      if (!branch) {
        setStatus('There is no choice to undo yet.');
        return;
      }
      state.fadeReturn = null;
      state.chapterPage = 0;
      playFlip();
      renderChapter();
      setStatus(`Undid ${branch.choiceLabel ? `“${branch.choiceLabel}”` : 'the last choice'}. The branch remains available below.`);
    }

    function saveBranch() {
      if (!state.route) return;
      const chapter = currentChapter();
      const defaultLabel = chapter ? `Bookmark at chapter ${chapter.chapter_number}` : 'Saved branch';
      const label = typeof window.prompt === 'function' ? window.prompt('Name this branch', defaultLabel) : defaultLabel;
      if (label === null) return;
      const branch = engine.createBranch(String(label || defaultLabel).trim() || defaultLabel, state.route);
      if (branch) {
        renderLeftPage();
        bindDynamicButtons();
        setStatus(`Saved branch “${branch.label}”.`);
      }
    }

    function restoreBranch(branchId) {
      if (!state.route) return;
      const branch = engine.restoreBranch(branchId, state.route);
      if (!branch) return;
      state.fadeReturn = null;
      state.chapterPage = 0;
      playFlip();
      renderChapter();
      setStatus(`Returned to “${branch.label}”.`);
    }

    async function connectProjectFolder() {
      await withBusy('Connecting the project folder…', async () => {
        await engine.connectProjectFolder();
        setStatus('Project folder connected. New writing files will write to json/<Project-Or-Source>/<Dashed-Story-Name>/, with missing folders created automatically.');
      });
      if (state.route) renderChapter(); else renderHome();
    }

    async function handleImport(files) {
      const list = [...(files || [])].filter(file => String(file.name || '').toLowerCase().endsWith('.json'));
      if (!list.length) return;
      await withBusy(`Importing ${list.length} JSON file${list.length === 1 ? '' : 's'}…`, async () => {
        await engine.importFiles(list);
        setStatus(`${list.length} JSON file${list.length === 1 ? '' : 's'} read. Partial stories can now resume from their existing chapters.`);
      });
      renderHome();
    }

    async function submitCreateStory(form) {
      const data = new FormData(form);
      const requestedMode = String(data.get('content_mode') || 'romance');
      const spec = {
        title: data.get('title'),
        fandom: data.get('fandom'),
        story_type: data.get('story_type') || 'cyoa_writing',
        pairing: data.get('pairing'),
        character_bible: String(data.get('character_bible') || '').split(/\n\s*\n|\n(?=[^\s])/).map(value => value.trim()).filter(Boolean),
        premise: data.get('premise'),
        canon_window: data.get('canon_window'),
        story_bible: data.get('story_bible'),
        tone: data.get('tone'),
        style_mode: data.get('style_mode') || 'story_adaptive',
        target_words: Number(data.get('target_words') || (data.get('story_type') === 'short_story' ? 2500 : 1600)),
        content_tags: String(data.get('content_tags') || '').split(',').map(value => value.trim()).filter(Boolean),
        content_mode: requestedMode,
        fade_to_black_enabled: true,
        audience: window.WriterToolsRomanceBoundary?.audience || {},
        romance_policy: window.WriterToolsRomanceBoundary?.romancePolicy || {},
        romance_profile: window.WriterToolsRomanceBoundary?.relationshipPolicy || {},
        reader_profile: window.WriterToolsRomanceBoundary?.reader || {}
      };
      const enrichedSpec = await (window.WriterToolsCreationSources?.enrichSpec?.(spec) || Promise.resolve(spec));
      const created = await withBusy(enrichedSpec.story_type === 'short_story' ? 'Generating the short story…' : 'Generating the opening chapter…', () => engine.createStory(enrichedSpec));
      if (!created) return;
      state.route = created.series.key;
      appShell.classList.add('is-open');
      appShell.classList.remove('is-home');
      appShell.classList.add('is-reading');
      routeAccent(created.series);
      if (readerToolbar) readerToolbar.hidden = false;
      if (sidePanel) sidePanel.hidden = false;
      setDrawerOpen(false, false);
      renderChapter();
      setStatus(engine.hasProjectFolder()
        ? `New ${created.series.story_type === 'short_story' ? 'short story' : 'writing'} created and written to json/${created.series.series_path}/01.json.`
        : `New ${created.series.story_type === 'short_story' ? 'short story' : 'writing'} created in browser storage. Connect the project folder to create json/${created.series.series_path}/ and its files directly.`);
    }

    function submitStorySettings(form) {
      const data = new FormData(form);
      const requestedMode = String(data.get('content_mode') || 'romance');
      engine.configureSeries(state.route, {
        style_mode: data.get('style_mode') || 'story_adaptive',
        target_words: Number(data.get('target_words') || 1600),
        tone: data.get('tone') || '',
        content_tags: String(data.get('content_tags') || '').split(',').map(value => value.trim()).filter(Boolean),
        content_mode: requestedMode,
        fade_to_black_enabled: true,
        audience: window.WriterToolsRomanceBoundary?.audience || {},
        romance_policy: window.WriterToolsRomanceBoundary?.romancePolicy || {},
        romance_profile: window.WriterToolsRomanceBoundary?.relationshipPolicy || {},
        reader_profile: window.WriterToolsRomanceBoundary?.reader || {},
        canon_window: data.get('canon_window') || '',
        story_bible: data.get('story_bible') || ''
      });
      renderChapter();
      setStatus('Settings saved.');
    }

    function bindDynamicButtons() {
      // IMPORTANT: appShell also has data-route for theming. Binding every [data-route]
      // element made the entire app shell reopen the current writing on every tap, which
      // reset chapterPage to 0 before Next/Save/Create/etc. could run. Route navigation
      // belongs only on actual route buttons.
      if (appShell) appShell.onclick = null;
      document.querySelectorAll('button[data-route]').forEach(button => {
        button.onclick = () => { setDrawerOpen(false, false); openRoute(button.dataset.route, false); };
      });
      document.querySelectorAll('[data-choice]').forEach(button => {
        button.onclick = () => chooseChoice(button.dataset.choice);
      });
      document.querySelectorAll('[data-restore-branch]').forEach(button => {
        button.onclick = () => restoreBranch(button.dataset.restoreBranch);
      });
      document.querySelectorAll('[data-action="restart"]').forEach(button => {
        button.onclick = () => openRoute(state.route, true);
      });
      const form = document.getElementById('createStoryForm');
      if (form) form.onsubmit = event => { event.preventDefault(); submitCreateStory(form); };
      const settingsForm = document.getElementById('storySettingsForm');
      if (settingsForm) settingsForm.onsubmit = event => { event.preventDefault(); submitStorySettings(settingsForm); };
      scheduleFitPageContent();
    }

    document.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton || actionButton.dataset.choice || actionButton.dataset.privateAction) return;
      const action = actionButton.dataset.action;
      if (action === 'open-book') openBook();
      if (action === 'cover') closeBook();
      if (action === 'home') { setDrawerOpen(false, false); renderHome(); }
      if (action === 'contents') setDrawerOpen(true);
      if (action === 'previous') previousChapter();
      if (action === 'next') nextChapter();
      if (action === 'continue-story') continueStory('continue');
      if (action === 'create-story') { setDrawerOpen(false, false); renderCreateStory(); }
      if (action === 'save-progress') saveProgress();
      if (action === 'undo') undoDecision();
      if (action === 'save-branch') saveBranch();
      if (action === 'branches') setDrawerOpen(true);
      if (action === 'story-settings') { setDrawerOpen(false, false); renderStorySettings(); }
      if (action === 'cancel-story-settings') renderChapter();
      if (action === 'import-json') importInput.click();
      if (action === 'import-folder') folderInput.click();
      if (action === 'connect-folder') connectProjectFolder();
      if (action === 'export-generated') {
        const count = engine.exportGenerated(state.route);
        setStatus(count ? `Exported ${count} generated chapter JSON file${count === 1 ? '' : 's'}.` : 'There are no generated chapters to export yet.');
      }
      if (action === 'resume-last') {
        const key = state.lastRoute && engine.getSeries(state.lastRoute) ? state.lastRoute : engine.listSeries()[0]?.key;
        if (key) openRoute(key, false);
      }
      if (action === 'save-last') {
        const key = state.lastRoute && engine.getSeries(state.lastRoute) ? state.lastRoute : '';
        if (key) {
          engine.saveProgress(key);
          setStatus('Saved.');
        }
      }
      if (action === 'sound') {
        state.sound = !state.sound;
        if (soundButton) soundButton.textContent = `Sound: ${state.sound ? 'on' : 'off'}`;
      }
      if (action === 'smaller' || action === 'larger') {
        state.zoom = Math.round(Math.max(.5, Math.min(3, state.zoom + (action === 'larger' ? .1 : -.1))) * 100) / 100;
        try { localStorage.setItem('writer-book-zoom', String(state.zoom)); } catch (_error) {}
        document.documentElement.style.setProperty('--book-zoom', state.zoom.toFixed(2));
        if (zoomLabel) zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
        scheduleFitPageContent();
      }
    });

    readerMenuButton?.addEventListener('click', () => setDrawerOpen(!state.drawerOpen));
    readerDrawerClose?.addEventListener('click', () => setDrawerOpen(false));
    readerDrawerScrim?.addEventListener('click', () => setDrawerOpen(false));
    document.addEventListener('pointerdown', event => {
      if (hudWritingDropdown?.open && !hudWritingDropdown.contains(event.target)) hudWritingDropdown.open = false;
    });
    [leftPage, rightPage].filter(Boolean).forEach(page => {
      page.addEventListener('pointerdown', dragStart);
      page.addEventListener('pointermove', dragMove);
      page.addEventListener('pointerup', dragEnd);
      page.addEventListener('pointercancel', dragEnd);
    });
    document.addEventListener('keydown', event => {
      if (event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'Escape' && state.drawerOpen) { setDrawerOpen(false); event.preventDefault(); return; }
      if (event.key === 'ArrowLeft') { requestTurn('prev'); event.preventDefault(); }
      if (event.key === 'ArrowRight') { requestTurn('next'); event.preventDefault(); }
    });


    importInput.addEventListener('change', () => {
      handleImport(importInput.files);
      importInput.value = '';
    });
    folderInput.addEventListener('change', () => {
      handleImport(folderInput.files);
      folderInput.value = '';
    });
    if (searchInput) searchInput.addEventListener('input', event => {
      state.search = event.target.value;
      if (state.route) renderIndex();
    });
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      scheduleFitPageContent();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (state.route && appShell.classList.contains('is-reading')) renderChapter();
      }, 140);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFitPageContent).catch(() => {});

    document.addEventListener('cyoa:generated', event => {
      const detail = event.detail || {};
      if (detail.project?.written) setStatus(`Generated JSON written to ${detail.project.filename}.`);
    });

    setDrawerOpen(false, false);
    // Render/wire the bundled library immediately. This is the important GitHub Pages
    // behavior change: Writing/Create/Save/Undo are usable before hosted JSON hydration.
    renderHome();

    async function refreshHostedLibraryInBackground() {
      await engineReady;
      const imported = await engine.loadHostedJson().catch(error => {
        console.warn('Hosted JSON refresh skipped; bundled library remains active.', error);
        return [];
      });
      // Do not interrupt a page turn or reset Writer's current leaf. Just refresh menus
      // and chapter metadata after the hosted files have merged into the same engine.
      if (imported && imported.length) {
        renderHudLibrary();
        if (state.route) {
          renderIndex();
          renderJournal();
        }
        updateHud();
        updateNavButtons();
      }
      return imported;
    }

    const hostedRefresh = new Promise(resolve => {
      window.setTimeout(() => resolve(refreshHostedLibraryInBackground()), 0);
    }).then(value => value);
    window.WriterToolsApp.hostedRefresh = hostedRefresh;
  }
}());

/* ===== END SOURCE: writer-tools-app.js ===== */
