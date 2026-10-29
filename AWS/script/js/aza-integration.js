/* Keep the original Language Studio and font-workshop destination. Keep its writing and evolution views without an on-screen keyboard. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const language = $('wh-language-frame'), overlay = $('wh-language-overlay');

  document.querySelector('.shell-main')?.append(overlay);
  const topbar = document.querySelector('.app-topbar');
  if (topbar && 'ResizeObserver' in window) {
    new ResizeObserver(() => overlay.style.setProperty('--wh-topbar-height', topbar.getBoundingClientRect().height + 'px')).observe(topbar);
  }
  let languageReady = false, lastDoc = '', savedEditor = null, savedRange = null;
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
      }
    } else if (doc?.id !== lastDoc) {
      lastDoc = doc?.id || ''; savedEditor = null; savedRange = null;
    }
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
  window.addEventListener('writerhelper:font-applied', () => {
    window.WriterHelperFonts?.installInto(language.contentDocument).catch(error => message(error.message));
  });
  language.addEventListener('load', () => window.WriterHelperFonts?.installInto(language.contentDocument).catch(error => message(error.message)));
  function watch(id) { const element = $(id); if (element) new MutationObserver(setLanguageView).observe(element, { childList: true, subtree: true, characterData: true }); }
  watch('crumb-workspace'); watch('crumb-channel');
  window.addEventListener('literaryfriend:ready', setLanguageView, { once: true });
  if (window.LiteraryFriendApp) setLanguageView();
})();
