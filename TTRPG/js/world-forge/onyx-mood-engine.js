/* Lord Onyx Blepman: five-image portrait and mood controller.
 * Standalone browser JavaScript. No virtual-pet needs, hunger clock, or CSS file.
 * Mood changes are based on known events/selected dialogue, never on scanning HTML.
 * Asset URLs resolve relative to the script in standalone or bundled form.
 */
(function (global) {
  'use strict';
  const MOODS = Object.freeze(['listening', 'thinking', 'hungry', 'judgmental', 'snuggly']);
  const SOURCES = Object.freeze({ idle: 5, activity: 15, conversation: 50, response: 60, manual: 100 });
  const FILES = Object.freeze(Object.fromEntries(MOODS.map(m => [m, 'onyx_' + m + '.png'])));
  const LABELS = Object.freeze({ listening: 'Onyx is listening', thinking: 'Onyx is thinking', hungry: 'Onyx is thinking about food', judgmental: 'Onyx is judging this decision', snuggly: 'Onyx is feeling snuggly' });
  const DEFAULT_ROOT = new URL('../assets/', document.currentScript && document.currentScript.src || document.baseURI).href;
  const STYLES_ID = 'onyx-mood-engine-styles';
  const STYLES = `
.onyx-portrait{display:block;position:relative;overflow:hidden;isolation:isolate;background:#12141b;flex:none}
.onyx-portrait__image{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;opacity:0;visibility:hidden;transition:opacity 260ms ease,visibility 260ms ease;pointer-events:none}
.onyx-portrait__image.is-visible{opacity:1;visibility:visible}
.onyx-launcher-portrait{display:block;position:absolute;inset:0;width:100%;height:100%}.onyx-header-portrait{display:block;width:48px;height:48px}.onyx-portrait--launcher{width:100%;height:100%;border-radius:50%}
.onyx-portrait--header{width:48px;height:48px;border-radius:50%;border:1px solid rgba(217,164,65,.45)}
.onyx-portrait--external{width:100%;height:100%}
@media (prefers-reduced-motion: reduce){.onyx-portrait__image{transition:none!important}}
`;
  function styleOnce() {
    if (document.getElementById(STYLES_ID)) return;
    const sheet = document.createElement('style');
    sheet.id = STYLES_ID; sheet.textContent = STYLES;
    (document.head || document.documentElement).appendChild(sheet);
  }
  function normalized(input) {
    const value = String(input || '').replace(/^onyx[_ -]/i, '').toLowerCase();
    if (!MOODS.includes(value)) throw new RangeError('Unknown Onyx mood: ' + input);
    return value;
  }
  function create(options = {}) {
    const assetRoot = new URL(options.assetBase || DEFAULT_ROOT, document.baseURI).href;
    const imageURLs = Object.freeze(Object.fromEntries(MOODS.map(m => [m, new URL(FILES[m], assetRoot).href])));
    const inFlight = new Map(), ready = new Set(), failedAt = new Map(), portraits = new Set(), mirroredImages = new Set(), subscriptions = new Set();
    let current = 'listening', requested = 'listening', lastReason = 'initial', priority = 0, protectedUntil = 0;
    let generation = 0, alive = true, started = false, idleTimer = null, idleIndex = 0;
    const idleSequence = ['thinking', 'listening', 'snuggly', 'listening']; // only passive states: NEVER hunger/care.
    const idleDelay = Math.max(12000, Number(options.idleMs) || 70000);
    const now = () => Date.now();
    function emit(mood, previous, source) {
      for (const fn of subscriptions) { try { fn({ mood, previous, source, src: imageURLs[mood] }); } catch (e) { console.warn('Onyx mood subscriber failed', e); } }
      if (typeof global.CustomEvent === 'function') {
        for (const view of portraits) view.root.dispatchEvent(new CustomEvent('onyx:moodchange', { detail: { mood, source }, bubbles: true }));
      }
    }
    function load(mood) {
      mood = normalized(mood);
      if (inFlight.has(mood)) return inFlight.get(mood);
      if (failedAt.has(mood) && now() - failedAt.get(mood) < 6000) return Promise.reject(new Error('Image unavailable: ' + FILES[mood]));
      const work = new Promise((resolve, reject) => {
        const img = new Image(); let settled = false;
        const timer = setTimeout(() => finish(false, new Error('Timed out loading ' + FILES[mood])), 12000);
        function finish(success, error) {
          if (settled) return; settled = true; clearTimeout(timer); img.onload = null; img.onerror = null;
          if (success) { failedAt.delete(mood); ready.add(mood); resolve(imageURLs[mood]); }
          else { ready.delete(mood); failedAt.set(mood, now()); reject(error); }
        }
        img.onload = () => finish(true);
        img.onerror = () => finish(false, new Error('Failed to load ' + FILES[mood]));
        img.src = imageURLs[mood];
        if (img.complete && img.naturalWidth > 0) finish(true);
      });
      inFlight.set(mood, work);
      work.then(() => {}, () => inFlight.delete(mood));
      return work;
    }
    async function show(view, mood, src, ticket = generation) {
      if (!alive) return false;
      const oldNode = view.layers[view.active];
      if (oldNode.dataset.onyxMood === mood && oldNode.classList.contains('is-visible') && oldNode.complete && oldNode.naturalWidth > 0) return true;
      const nextIndex = 1 - view.active, nextNode = view.layers[nextIndex];
      const update = ++view.update;
      // Preload alone warms the browser cache; decoding the actual DOM image is also
      // required. Otherwise its opacity can change before the pixels are ready.
      nextNode.src = src;
      nextNode.dataset.onyxMood = mood;
      try {
        if (typeof nextNode.decode === 'function') await nextNode.decode();
        else if (!(nextNode.complete && nextNode.naturalWidth > 0)) await new Promise((resolve, reject) => {
          nextNode.addEventListener('load', resolve, {once:true});
          nextNode.addEventListener('error', reject, {once:true});
        });
      } catch (error) { return false; }
      if (!alive || update !== view.update || ticket !== generation) return false;
      nextNode.classList.add('is-visible');
      oldNode.classList.remove('is-visible');
      view.active = nextIndex;
      view.root.setAttribute('aria-label', LABELS[mood]);
      view.root.dataset.onyxMood = mood;
      return true;
    }
    function mirror(mood) {
      for (const img of mirroredImages) {
        img.src = imageURLs[mood]; img.alt = LABELS[mood]; img.dataset.onyxMood = mood;
      }
    }
    async function setMood(input, opts = {}) {
      if (!alive) return false;
      const mood = normalized(input);
      const source = opts.source || 'manual', level = Number.isFinite(opts.priority) ? opts.priority : (SOURCES[source] || SOURCES.manual);
      if (!opts.force && level < priority && now() < protectedUntil) return false;
      const duration = Number.isFinite(opts.holdMs) ? Math.max(0, opts.holdMs) : (source === 'manual' ? 8000 : source === 'response' ? 4500 : source === 'conversation' ? 2500 : 0);
      requested = mood; lastReason = source; priority = level; protectedUntil = now() + duration;
      const ticket = ++generation;
      try {
        const src = await load(mood);
        if (!alive || ticket !== generation) return false; // slow earlier image must NEVER replace newer mood.
        const results = await Promise.all(Array.from(portraits, view => show(view, mood, src, ticket)));
        if (!alive || ticket !== generation) return false;
        if (results.some(ok => !ok)) {
          if (typeof options.onImageError === 'function') options.onImageError({mood,error:new Error('Portrait image decode failed'),url:src});
          if (mood !== 'listening') return setMood('listening', {source:'activity', priority:level, holdMs:duration, force:true});
          return false;
        }
        const previous = current;
        current = mood;
        mirror(mood);
        if (previous !== mood) emit(mood, previous, source);
        scheduleIdle();
        return true;
      } catch (err) {
        if (ticket !== generation || !alive) return false;
        if (typeof options.onImageError === 'function') options.onImageError({ mood, error: err, url: imageURLs[mood] });
        if (mood !== 'listening') return setMood('listening', { source: 'activity', priority: level, holdMs: duration, force: true });
        // If the default is unavailable, retain the previous loaded image/placeholder and do not flash a broken asset.
        requested = current;
        scheduleIdle();
        return false;
      }
    }
    function mount(target, kind = 'external') {
      if (!target || typeof target.appendChild !== 'function') throw new TypeError('Portrait mount needs a DOM node');
      styleOnce();
      const root = document.createElement('span');
      root.className = 'onyx-portrait onyx-portrait--' + kind;
      root.setAttribute('role', 'img'); root.setAttribute('aria-label', LABELS[current]);
      root.dataset.onyxMood = current;
      const layers = [document.createElement('img'), document.createElement('img')];
      for (const img of layers) {
        img.className = 'onyx-portrait__image'; img.alt = ''; img.setAttribute('aria-hidden', 'true');
        img.draggable = false; img.decoding = 'async'; root.appendChild(img);
      }
      target.appendChild(root);
      const view = { root, layers, active: 1, update: 0 };
      portraits.add(view);
      const capturedMood = current;
      load(capturedMood).then(src => {
        if (!alive || !portraits.has(view)) return;
        if (current === capturedMood) show(view, current, src);
        else load(current).then(s => { if (alive && portraits.has(view)) show(view, current, s); }).catch(() => {});
      }).catch(() => {});
      return { element: root, unmount() { portraits.delete(view); root.remove(); } };
    }
    function bindImage(img) {
      if (!img || img.tagName?.toLowerCase() !== 'img') throw new TypeError('Expected an <img> element');
      mirroredImages.add(img);
      load(current).then(() => { if (alive && mirroredImages.has(img)) mirror(current); }).catch(() => {});
      return () => mirroredImages.delete(img);
    }
    function scheduleIdle() {
      clearTimeout(idleTimer); idleTimer = null;
      if (!alive || !started || document.hidden) return;
      idleTimer = setTimeout(() => {
        if (!alive || document.hidden) return;
        if (now() < protectedUntil) { scheduleIdle(); return; }
        const choice = idleSequence[idleIndex++ % idleSequence.length];
        setMood(choice, { source: 'idle', priority: SOURCES.idle, holdMs: 0 }).catch(() => {});
      }, idleDelay);
    }
    function activity(kind = 'listening') {
      if (!alive) return;
      // User activity is not food/care and does not override a deliberately chosen mood.
      scheduleIdle();
      setMood(kind, { source: 'activity', holdMs: 0 }).catch(() => {});
    }
    function start() { if (started) return; started = true; document.addEventListener('visibilitychange', scheduleIdle); scheduleIdle(); }
    function stop() { started = false; clearTimeout(idleTimer); idleTimer = null; document.removeEventListener('visibilitychange', scheduleIdle); }
    function destroy() { if (!alive) return; stop(); alive = false; ++generation; for (const view of portraits) view.root.remove(); portraits.clear(); mirroredImages.clear(); subscriptions.clear(); }
    function preloadAll() { return Promise.allSettled(MOODS.map(load)); }
    function subscribe(handler) { if (typeof handler !== 'function') throw new TypeError('Mood listener must be a function'); subscriptions.add(handler); return () => subscriptions.delete(handler); }
    function diagnostics() {
      return Object.freeze({ mood: current, requested, lastReason, portraitCount: portraits.size,
        mirrorCount: mirroredImages.size, loaded: [...ready], unavailable: [...failedAt.keys()], idleRunning: started });
    }
    return Object.freeze({ moods: MOODS, files: FILES, urls: imageURLs, get mood() { return current; }, get requestedMood() { return requested; }, get reason() { return lastReason; }, setMood, mount, bindImage, activity, start, stop, destroy, load, preloadAll, subscribe, diagnostics });
  }
  global.OnyxMoodEngine = Object.freeze({ create, moods: MOODS, files: FILES });
})(window);
