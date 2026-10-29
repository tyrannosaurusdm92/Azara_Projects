/* AWS shell for the single unified keyboard. The actual key layouts and speech
   engine live in the attached keyboard package. This shell owns the one bubble,
   move/resize gestures, and its persisted position. */
window.LuxuryKeyboard = (() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = () => $('floating-keyboard');
  const bubble = () => $('keyboard-bubble');
  const dock = () => $('keyboard-dock');
  const frame = () => $('wh-unified-keyboard-frame');
  const clamp = (n, min, max) => Math.max(min, Math.min(Number(n) || 0, Math.max(min, max)));
  const isOpen = () => panel()?.classList.contains('is-open');
  let wired = false, activeGesture = null, suppressBubbleClick = false;
  let bubblePoint = null, panelPoint = null, panelSize = null;
  const prefKey = 'aws:unified-keyboard:v1';
  const viewport = () => ({ width: document.documentElement.clientWidth || innerWidth, height: document.documentElement.clientHeight || innerHeight });
  function readPrefs() {
    try { return JSON.parse(localStorage.getItem(prefKey) || '{}'); } catch { return {}; }
  }
  function writePrefs() {
    try {
      const p = panel(), b = bubble();
      if (isOpen()) {
        const r = p.getBoundingClientRect();
        panelPoint = { x: r.left, y: r.top }; panelSize = { width: r.width, height: r.height };
      } else {
        const r = b.getBoundingClientRect();
        bubblePoint = { x: r.left, y: r.top };
      }
      localStorage.setItem(prefKey, JSON.stringify({ bubblePoint, panelPoint, panelSize }));
    } catch {}
  }
  function positionBubble() {
    const p = panel(), v = viewport(), b = bubblePoint;
    p.style.width = '150px'; p.style.height = '150px';
    if (b && Number.isFinite(b.x) && Number.isFinite(b.y)) {
      p.style.left = clamp(b.x, 8, v.width - 158) + 'px';
      p.style.top = clamp(b.y, 8, v.height - 158) + 'px';
      p.style.right = 'auto'; p.style.bottom = 'auto';
    } else {
      p.style.left = 'auto'; p.style.top = 'auto';
      p.style.right = '18px'; p.style.bottom = '18px';
    }
  }
  function dimensions() {
    const v = viewport(), mobile = v.width <= 760;
    const minWidth = Math.min(280, Math.max(200, v.width - 16));
    const minHeight = Math.min(220, Math.max(150, v.height - 16));
    const width = clamp(panelSize?.width || Math.min(860, v.width - 16), minWidth, v.width - 16);
    const preferred = mobile ? clamp(v.height * .34, 250, 300) : clamp(v.height * .42, 300, 430);
    const height = clamp(panelSize?.height || preferred, minHeight, v.height - 16);
    return { width, height };
  }
  function placeOpen() {
    const p = panel(), v = viewport(), size = dimensions();
    panelSize = size;
    const b = bubble().getBoundingClientRect();
    const x = Number.isFinite(panelPoint?.x) ? panelPoint.x : b.left + b.width / 2 - size.width / 2;
    const y = Number.isFinite(panelPoint?.y) ? panelPoint.y : b.top + b.height / 2 - size.height / 2;
    p.style.left = clamp(x, 8, v.width - size.width - 8) + 'px';
    p.style.top = clamp(y, 8, v.height - size.height - 8) + 'px';
    p.style.right = 'auto'; p.style.bottom = 'auto';
    p.style.width = size.width + 'px'; p.style.height = size.height + 'px';
    p.style.setProperty('--keyboard-scale', String(clamp(Math.min(size.width / 840, size.height / 430), .7, 1.1)));
  }
  function resizeChild() {
    try { requestAnimationFrame(() => frame()?.contentWindow?.FloatingKeyboard?.resizeTo?.()); } catch {}
  }
  function open() {
    const p = panel();
    if (!p || isOpen()) return;
    p.classList.remove('is-bubble'); p.classList.add('is-open');
    bubble().hidden = true; dock().hidden = false;
    placeOpen(); resizeChild(); writePrefs();
  }
  function collapse() {
    const p = panel();
    if (!p) return;
    if (isOpen()) {
      const r = p.getBoundingClientRect();
      panelPoint = { x: r.left, y: r.top }; panelSize = { width: r.width, height: r.height };
    }
    p.classList.remove('is-open'); p.classList.add('is-bubble');
    dock().hidden = true; bubble().hidden = false;
    positionBubble(); writePrefs(); bubble().focus({ preventScroll: true });
  }
  function toggle() { isOpen() ? collapse() : open(); }
  function beginMove(event) {
    if (event.button !== 0 || event.target.closest('button,select,input,a')) return;
    const r = panel().getBoundingClientRect();
    activeGesture = { type: 'move', id: event.pointerId, x: event.clientX, y: event.clientY, left: r.left, top: r.top, node: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
  }
  function beginBubbleMove(event) {
    if (event.button !== 0) return;
    const r = panel().getBoundingClientRect();
    activeGesture = { type: 'bubble', id: event.pointerId, x: event.clientX, y: event.clientY, left: r.left, top: r.top, moved: false, node: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
  }
  function beginResize(event) {
    if (event.button !== 0) return;
    const r = panel().getBoundingClientRect();
    activeGesture = { type: 'resize', id: event.pointerId, edge: event.currentTarget.dataset.resizeEdge, x: event.clientX, y: event.clientY, rect: r, node: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); event.stopPropagation();
  }
  function resizeFrom(edge, dx, dy, origin) {
    const p = panel(), v = viewport(), minW = Math.min(280, Math.max(200, v.width - 16)), minH = Math.min(220, Math.max(150, v.height - 16));
    let left = origin.left, right = origin.right, top = origin.top, bottom = origin.bottom;
    if (edge.includes('w')) left = clamp(origin.left + dx, 8, right - minW);
    if (edge.includes('e')) right = clamp(origin.right + dx, left + minW, v.width - 8);
    if (edge.includes('n')) top = clamp(origin.top + dy, 8, bottom - minH);
    if (edge.includes('s')) bottom = clamp(origin.bottom + dy, top + minH, v.height - 8);
    p.style.left = left + 'px'; p.style.top = top + 'px';
    p.style.right = 'auto'; p.style.bottom = 'auto';
    p.style.width = (right - left) + 'px'; p.style.height = (bottom - top) + 'px';
    panelPoint = { x: left, y: top }; panelSize = { width: right - left, height: bottom - top };
    p.style.setProperty('--keyboard-scale', String(clamp(Math.min(panelSize.width / 840, panelSize.height / 430), .7, 1.1)));
  }
  function pointerMove(event) {
    const g = activeGesture;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y, v = viewport();
    if (g.type === 'bubble') {
      if (Math.hypot(dx, dy) > 5) g.moved = true;
      if (!g.moved) return;
      bubblePoint = { x: clamp(g.left + dx, 8, v.width - 158), y: clamp(g.top + dy, 8, v.height - 158) };
      panel().style.left = bubblePoint.x + 'px'; panel().style.top = bubblePoint.y + 'px';
      panel().style.right = 'auto'; panel().style.bottom = 'auto';
    } else if (g.type === 'move') {
      const r = panel().getBoundingClientRect();
      panelPoint = { x: clamp(g.left + dx, 8, v.width - r.width - 8), y: clamp(g.top + dy, 8, v.height - r.height - 8) };
      panel().style.left = panelPoint.x + 'px'; panel().style.top = panelPoint.y + 'px';
      panel().style.right = 'auto'; panel().style.bottom = 'auto';
    } else {
      resizeFrom(g.edge, dx, dy, g.rect);
    }
    event.preventDefault();
  }
  function finishGesture(event) {
    if (!activeGesture || activeGesture.id !== event.pointerId) return;
    if (activeGesture.type === 'bubble') {
      suppressBubbleClick = activeGesture.moved;
      if (suppressBubbleClick) setTimeout(() => { suppressBubbleClick = false; }, 450);
    }
    activeGesture = null; writePrefs();
  }
  function resizeWithKeys(event) {
    const d = event.shiftKey ? 24 : 8, dx = event.key === 'ArrowLeft' ? -d : event.key === 'ArrowRight' ? d : 0;
    const dy = event.key === 'ArrowUp' ? -d : event.key === 'ArrowDown' ? d : 0;
    if (!dx && !dy) return;
    event.preventDefault(); resizeFrom(event.currentTarget.dataset.resizeEdge, dx, dy, panel().getBoundingClientRect()); writePrefs();
  }
  function setStyle(style) {
    const doc = frame()?.contentDocument;
    if (!doc) return;
    const language = doc.getElementById('languageSelect'), era = doc.getElementById('eraSelect');
    if (style === 'standard') {
      language.value = 'qwerty'; language.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (['archaic', 'classical', 'traditional', 'modern'].includes(style)) {
      language.value = 'azaaraan'; language.dispatchEvent(new Event('change', { bubbles: true }));
      era.value = style[0].toUpperCase() + style.slice(1); era.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  function getStyle() {
    try {
      const s = frame().contentWindow.FloatingKeyboard.getState();
      return s.language === 'qwerty' ? 'standard' : String(s.era).toLowerCase();
    } catch { return 'standard'; }
  }
  function init() {
    if (wired) return;
    const p = panel(), prefs = readPrefs();
    if (!p || !bubble() || !dock()) return;
    wired = true; bubblePoint = prefs.bubblePoint || null; panelPoint = prefs.panelPoint || null; panelSize = prefs.panelSize || null;
    p.classList.remove('is-open'); p.classList.add('is-bubble');
    dock().hidden = true; bubble().hidden = false; positionBubble();
    bubble().addEventListener('click', event => {
      if (suppressBubbleClick) { suppressBubbleClick = false; event.preventDefault(); return; }
      open();
    });
    bubble().addEventListener('pointerdown', beginBubbleMove);
    $('keyboard-handle').addEventListener('pointerdown', beginMove);
    $('keyboard-close').addEventListener('click', collapse);
    for (const handle of document.querySelectorAll('.keyboard-resize-handle')) {
      handle.addEventListener('pointerdown', beginResize);
      handle.addEventListener('keydown', resizeWithKeys);
    }
    document.addEventListener('pointermove', pointerMove, { passive: false });
    document.addEventListener('pointerup', finishGesture);
    document.addEventListener('pointercancel', finishGesture);
    frame().addEventListener('load', resizeChild);
    addEventListener('resize', () => { if (isOpen()) { panelSize = dimensions(); placeOpen(); resizeChild(); } else positionBubble(); });
    window.AWSKeyboard = Object.freeze({ open, collapse, toggle, setStyle, get style() { return getStyle(); } });
    writePrefs();
  }
  function setLanguage() { /* The attached keyboard owns its QWERTY and Aza’raan selector. */ }
  return { init, open, collapse, toggle, setStyle, setLanguage };
})();
