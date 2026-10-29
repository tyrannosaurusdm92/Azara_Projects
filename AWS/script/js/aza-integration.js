/* Keep the original Language Studio and font-workshop destination. Hide its
   former keyboard so the AWS floating shell is the sole keyboard surface. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const language = $('wh-language-frame'), overlay = $('wh-language-overlay');
  const keyboard = $('wh-unified-keyboard-frame');
  const cloudButton = $('wh-cloud-speak');
  document.querySelector('.shell-main')?.append(overlay);
  const topbar = document.querySelector('.app-topbar');
  if (topbar && 'ResizeObserver' in window) {
    new ResizeObserver(() => overlay.style.setProperty('--wh-topbar-height', topbar.getBoundingClientRect().height + 'px')).observe(topbar);
  }
  let languageReady = false, lastDoc = '', savedEditor = null, savedRange = null, cloudAudio = null;
  const originBase = new URL('./', location.href);
  function srcdoc(source, path) {
    const href = new URL(path, originBase).href;
    const base = '<base href="' + href + '">';
    const css = '<style>.keyboard-section,#keyboard,#keyboardBubble,.floating-keyboard{display:none!important}</style>';
    return source.replace('<head>', '<head>' + base + css);
  }
  function message(text) { const live = $('autosave-status'); if (live) live.textContent = text; }
  function closest(range) {
    const node = range?.commonAncestorContainer;
    const element = node?.nodeType === 1 ? node : node?.parentElement;
    return element?.closest?.('.rich-editor') || null;
  }
  document.addEventListener('selectionchange', () => {
    const selection = getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0), editor = closest(range);
    if (editor) { savedEditor = editor; savedRange = range.cloneRange(); }
  });
  document.addEventListener('focusin', event => { if (event.target?.classList?.contains('rich-editor')) savedEditor = event.target; });
  function speechText() {
    if (document.body.classList.contains('wh-language-active')) {
      try { return language.contentWindow.AZA_STUDIO?.text?.trim() || ''; } catch { return ''; }
    }
    const selected = savedEditor?.isConnected && savedRange && savedEditor.contains(savedRange.commonAncestorContainer) ? savedRange.toString().trim() : '';
    if (selected) return selected;
    const live = getSelection();
    if (live?.rangeCount && closest(live.getRangeAt(0))) return live.toString().trim() || closest(live.getRangeAt(0)).textContent.trim();
    const editor = savedEditor?.isConnected ? savedEditor : document.querySelector('.rich-editor');
    return editor?.textContent?.trim() || '';
  }
  function updateKeyboardEra(name) {
    if (!['Archaic', 'Classical', 'Traditional', 'Modern', 'Proto', 'Ancient'].includes(name)) return;
    try {
      const doc = keyboard.contentDocument, languageSelect = doc.getElementById('languageSelect'), eraSelect = doc.getElementById('eraSelect');
      if (!languageSelect || !eraSelect) return;
      languageSelect.value = 'azaaraan'; languageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      eraSelect.value = ['Proto', 'Ancient'].includes(name) ? 'Archaic' : name;
      eraSelect.dispatchEvent(new Event('change', { bubbles: true }));
    } catch {}
  }
  function setLanguageView() {
    if (!window.LiteraryFriendApp) return;
    let doc;
    try { doc = window.LiteraryFriendApp.currentDocument?.() || null; } catch {}
    const isLanguage = !!doc?.workspace?.startsWith('01 Language');
    overlay.hidden = !isLanguage;
    document.body.classList.toggle('wh-language-active', isLanguage);
    if (isLanguage) {
      if (languageReady) {
        const eraName = doc?.title;
        const inner = language.contentDocument;
        if (eraName === 'Proto' || eraName === 'Ancient') inner.getElementById('tab-evolution')?.click();
        else {
          inner.getElementById('tab-typing')?.click();
          const select = inner.getElementById('era');
          if (select && ['Archaic', 'Classical', 'Traditional', 'Modern'].includes(eraName)) {
            select.value = eraName; select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        updateKeyboardEra(eraName);
      }
    } else if (doc?.id !== lastDoc) {
      lastDoc = doc?.id || ''; savedEditor = null; savedRange = null;
    }
    window.AWSKeyboardHost?.sync?.();
  }
  function waitForLanguage(n=0) {
    try {
      const win = language.contentWindow;
      if (win?.AZA_STUDIO && win?.AzaaraanStudio) {
        languageReady = true;
        window.dispatchEvent(new Event('aws:language-ready'));
        setLanguageView();
        return;
      }
    } catch {}
    if (n < 80) setTimeout(() => waitForLanguage(n + 1), 150);
    else message('Language Studio could not initialize; serve AWS over HTTP or HTTPS.');
  }
  const source = window.WRITERHELPER_AZA_LANGUAGE_HTML;
  if (source) {
    language.srcdoc = srcdoc(source, './');
    language.addEventListener('load', () => waitForLanguage());
  } else message('Language Studio source is missing.');
  function voiceSlider() {
    try { return Number(keyboard.contentDocument.getElementById('voiceBase')?.value || 100); } catch { return 100; }
  }
  cloudButton?.addEventListener('click', async () => {
    const bridge = window.WriterHelperBridge, content = speechText();
    if (!content) { message('Write or select text before generating an MP3.'); return; }
    if (!bridge?.signedIn) { message('Sign in through Settings to generate a private MP3.'); return; }
    if (content.length > 3000) { message('Select up to 3,000 characters for one MP3.'); return; }
    cloudButton.disabled = true;
    try {
      message('Generating private Aza’raan MP3…');
      const result = await bridge.request('aza.tts.generate', { text: content, voiceSlider: voiceSlider() });
      if (!result.driveFileId) throw Error('The backend returned no audio file.');
      const chunks = []; let offset = 0, complete = false;
      do {
        const part = await bridge.request('aza.tts.audio.chunk', { driveFileId: result.driveFileId, offset });
        if (!part.base64 || part.nextOffset <= offset) throw Error('Audio transfer stopped unexpectedly.');
        const raw = atob(part.base64); chunks.push(Uint8Array.from(raw, c => c.charCodeAt(0)));
        offset = part.nextOffset;
        if (part.done) { complete = true; break; }
      } while (offset < 20 * 1024 * 1024);
      if (!complete) throw Error('Audio is larger than the safe browser transfer limit.');
      if (cloudAudio) { cloudAudio.pause(); URL.revokeObjectURL(cloudAudio.src); }
      cloudAudio = new Audio(URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' })));
      await cloudAudio.play();
      message(result.warnings?.length ? 'Playing MP3 · review pronunciation warnings in the Language Studio.' : 'Playing private Aza’raan MP3.');
    } catch (error) { message('MP3 unavailable: ' + error.message); }
    finally { cloudButton.disabled = false; }
  });
  window.addEventListener('writerhelper:font-applied', () => {
    window.WriterHelperFonts?.installInto(language.contentDocument).catch(error => message(error.message));
  });
  language.addEventListener('load', () => window.WriterHelperFonts?.installInto(language.contentDocument).catch(error => message(error.message)));
  function watch(id) { const element = $(id); if (element) new MutationObserver(setLanguageView).observe(element, { childList: true, subtree: true, characterData: true }); }
  watch('crumb-workspace'); watch('crumb-channel');
  window.addEventListener('literaryfriend:ready', setLanguageView, { once: true });
  if (window.LiteraryFriendApp) setLanguageView();
  window.addEventListener('pagehide', () => { if (cloudAudio) cloudAudio.pause(); });
})();
