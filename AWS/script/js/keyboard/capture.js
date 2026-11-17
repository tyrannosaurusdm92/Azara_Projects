/* Local DOM-to-PNG capture: works without a screen-sharing permission prompt. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let busy = false, lastURL = null, lastBlob = null, filename = 'keyboard-notes.png';
  /* Print Screen always exports lossless PNG. Render extra device-independent
     pixels so delicate Aza’raan strokes, diacritics and subscripts stay clear.
     Pixel and dimension budgets prevent giant canvases on high-DPI displays. */
  const PIXEL_BUDGET = 32000000;
  const MAX_SIDE = 16384;
  function highResolutionScale(width, height) {
    const pixels = Math.max(1, width * height);
    return Math.max(1, Math.min(4, Math.sqrt(PIXEL_BUDGET / pixels), MAX_SIDE / Math.max(width, height)));
  }
  const visible = element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
      rect.right > 0 && rect.bottom > 0 &&
      rect.left < innerWidth && rect.top < innerHeight;
  };
  async function prepareGlyphs() {
    // html2canvas can snapshot a freshly typed letter while its transparent
    // independent/subscript PNG is still decoding. Wait for visible art only.
    const imgs = [...document.querySelectorAll(
      '.aza-script-run img, .az-khmer-cluster img, .keyboard img, #keyboard img'
    )].filter(visible);
    await document.fonts.ready;
    await Promise.allSettled(imgs.map(img => img.complete && img.naturalWidth ? Promise.resolve() :
      typeof img.decode === 'function' ? img.decode() : Promise.resolve()));
  }
  function colorForFilter(filter) {
    if (!/brightness\(\s*0(?:\.0+)?\s*\)/.test(filter) || !/invert\(/.test(filter)) return null;
    const value = filter.match(/invert\(\s*([\d.]+)%?\s*\)/);
    if (!value) return '#f4f4f4';
    const fraction = Math.max(0, Math.min(1, Number(value[1]) / (filter.includes('%') ? 100 : 1)));
    const byte = Math.round(fraction * 255).toString(16).padStart(2, '0');
    return '#' + byte + byte + byte;
  }
  async function prepareCaptureClone(clone) {
    clone.querySelectorAll('noscript,.sr-only').forEach(node => node.remove());
    const style = clone.createElement('style');
    style.textContent = [
      '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}',
      '.aza-script-run img,.az-khmer-cluster img{image-rendering:auto!important}'
    ].join('\n');
    clone.head.append(style);
    // Direct paths keep toolbar icons self-contained, and preserve thin strokes.
    clone.querySelectorAll('svg.icon').forEach(svg => {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', svg.classList.contains('close-icon') ? '#ff6b75' : '#8de0dc');
      svg.setAttribute('stroke-width', svg.classList.contains('close-icon') ? '4.2' : '1.7');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
    });
    // The legacy #note is hidden and not the active writing surface; replace
    // its native control only when present, without touching .rich-editor art.
    const original = $('note'), field = clone.getElementById('note');
    if (original && field) {
      const replacement = clone.createElement('div');
      replacement.className = field.className;
      replacement.style.cssText = 'white-space:pre-wrap;overflow:hidden;overflow-wrap:break-word;';
      const inner = clone.createElement('div');
      inner.textContent = original.value || original.placeholder || '';
      inner.style.transform = 'translateY(' + (-original.scrollTop) + 'px)';
      if (!original.value) { inner.style.color = '#8b9c99'; inner.style.fontStyle = 'italic'; }
      replacement.append(inner);
      field.replaceWith(replacement);
    }
    // html2canvas 1.4.1 does not faithfully implement CSS filter:brightness(0)
    // + invert(...) on PNG layers. Bake the same pale tint into the cloned
    // *keyboard* artwork at its original image resolution, not into manuscripts.
    // This leaves every original DOM node, asset, and visual design untouched.
    const cache = new Map();
    const imageElements = [...clone.querySelectorAll(
      '.key-glyph-art,.aza-mark-art,.aza-sub-art,.az-khmer-cluster .packed-ink img,.aza-history-cell img'
    )];
    for (const img of imageElements) {
      if (!visible(img)) continue;
      const filter = clone.defaultView?.getComputedStyle(img)?.filter || '';
      const color = colorForFilter(filter);
      if (!color) continue; // In manuscript the approved PNGs remain pure black.
      const src = img.currentSrc || img.src;
      if (!src) continue;
      const key = src + '|' + color;
      if (!cache.has(key)) {
        cache.set(key, (async () => {
          const source = new Image();
          source.src = src;
          if (source.decode) await source.decode();
          else if (!source.complete) await new Promise((resolve,reject)=>{
            source.onload=resolve;source.onerror=reject;
          });
          if (!source.naturalWidth || !source.naturalHeight) return null;
          const canvas = clone.createElement('canvas');
          canvas.width = source.naturalWidth;
          canvas.height = source.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(source,0,0);
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = color;
          ctx.fillRect(0,0,canvas.width,canvas.height);
          return canvas.toDataURL('image/png');
        })().catch(() => null));
      }
      const tinted = await cache.get(key);
      if (tinted) {
        img.src = tinted;
        img.style.setProperty('filter','none','important');
        if (img.decode) await img.decode().catch(()=>{});
      }
    }
    clone.querySelectorAll('[data-tool="capture"]').forEach(button => { button.disabled = false; });
    if (clone.fonts?.ready) await clone.fonts.ready;
  }
  async function capture() {
    if (busy) return;
    busy = true;
    const buttons = document.querySelectorAll('[data-tool="capture"]');
    buttons.forEach(button => { button.disabled = true; });
    try {
      await prepareGlyphs();
      const view = window.visualViewport;
      const width = Math.max(1,Math.round(view?.width || innerWidth));
      const height = Math.max(1,Math.round(view?.height || innerHeight));
      const x = Math.round(view?.pageLeft ?? scrollX);
      const y = Math.round(view?.pageTop ?? scrollY);
      const optimal = highResolutionScale(width,height);
      const scales = [...new Set([optimal, Math.min(2,optimal), 1].map(n=>Number(n.toFixed(3))))];
      let canvas, previousError;
      for (const scale of scales) {
        try {
          canvas = await html2canvas(document.body, {
            backgroundColor: '#0a1115', logging: false, allowTaint: false,
            useCORS: true, imageTimeout: 20000,
            width, height, x, y, scale,
            windowWidth: document.documentElement.clientWidth,
            windowHeight: innerHeight, scrollX, scrollY,
            onclone: prepareCaptureClone
          });
          if (canvas?.width && canvas?.height) break;
          throw new Error('Screenshot canvas was empty');
        } catch (error) {
          previousError = error;
          canvas = null;
          console.warn('Print Screen retrying at lower resolution:', error);
        }
      }
      if (!canvas) throw previousError || new Error('PNG rendering unavailable');
      lastBlob = await new Promise((resolve,reject)=>{
        canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export unavailable')),'image/png');
      });
      if (lastURL) URL.revokeObjectURL(lastURL);
      lastURL = URL.createObjectURL(lastBlob);
      filename = 'keyboard-notes-' + new Date().toISOString().replace(/[:.]/g,'-').slice(0,19) + '.png';
      $('capturePreview').src = lastURL;
      $('saveCapture').href = lastURL;
      $('saveCapture').download = filename;
      const effectiveScale = canvas.width / width;
      $('captureCaption').textContent =
        canvas.width.toLocaleString() + ' × ' + canvas.height.toLocaleString() +
        ' lossless PNG · ' + effectiveScale.toFixed(1) +
        '× detail. The preview is fitted to your screen; Save PNG retains full resolution.';
      const file = new File([lastBlob],filename,{type:'image/png'});
      $('shareCapture').hidden = !(navigator.canShare && navigator.canShare({files:[file]}));
      $('captureDialog').showModal();
    } catch (error) {
      console.error('Print Screen:',error);
      window.Notes.toast('Could not create the PNG in this browser. Your note is unchanged.');
    } finally {
      busy = false;
      buttons.forEach(button=>{button.disabled=false;});
    }
  }
  $('shareCapture').onclick = async () => {
    if (!lastBlob) return;
    try { await navigator.share({ files: [new File([lastBlob], filename, { type: 'image/png' })], title: 'Keyboard notes' }); }
    catch (error) { if (error.name !== 'AbortError') window.Notes.toast('Sharing is unavailable. Use Save PNG.'); }
  };
  // The preview X was rendered but was never wired to close the modal.
  const screenshotDialog = $('captureDialog');
  screenshotDialog?.querySelectorAll('[data-close-dialog]').forEach(button=>{
    button.type='button';
    button.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      if(screenshotDialog.open) screenshotDialog.close();
      else screenshotDialog.removeAttribute('open');
    });
  });
  screenshotDialog?.addEventListener('click',event=>{
    if(event.target!==screenshotDialog)return;
    const rect=screenshotDialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)screenshotDialog.close();
  });
  window.PrintScreen = { capture };
})();
