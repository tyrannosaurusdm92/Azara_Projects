/* Local DOM-to-PNG capture: works without a screen-sharing permission prompt. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let busy = false, lastURL = null, lastBlob = null, filename = 'keyboard-notes.png';
  async function capture() {
    if (busy) return;
    busy = true;
    const buttons = document.querySelectorAll('[data-tool="capture"]');
    buttons.forEach(button => { button.disabled = true; });
    try {
      await document.fonts.ready;
      const view = window.visualViewport;
      const width = Math.round(view?.width || innerWidth), height = Math.round(view?.height || innerHeight);
      const x = Math.round(view?.pageLeft || scrollX), y = Math.round(view?.pageTop || scrollY);
      const canvas = await html2canvas(document.body, {
        backgroundColor: '#0a1115', logging: false, allowTaint: false, useCORS: false,
        width, height, x, y, scale: Math.min(devicePixelRatio || 1, 2),
        windowWidth: document.documentElement.clientWidth, windowHeight: innerHeight,
        scrollX, scrollY,
        onclone(clone) {
          clone.querySelectorAll('noscript,.sr-only').forEach(node => node.remove());
          // Direct paths keep the toolbar icons self-contained in the rendered SVGs.
          clone.querySelectorAll('svg.icon').forEach(svg => {
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', svg.classList.contains('close-icon') ? '#ff6b75' : '#8de0dc');
            svg.setAttribute('stroke-width', svg.classList.contains('close-icon') ? '4.2' : '1.7');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
          });
          // Replace native form controls in the cloned page so text wraps and scrolls consistently.
          const original = $('note'), field = clone.getElementById('note');
          const replacement = clone.createElement('div');
          replacement.className = field.className;
          replacement.style.cssText = 'white-space:pre-wrap;overflow:hidden;overflow-wrap:break-word;';
          const inner = clone.createElement('div');
          inner.textContent = original.value || original.placeholder;
          inner.style.transform = `translateY(${-original.scrollTop}px)`;
          if (!original.value) { inner.style.color = '#8b9c99'; inner.style.fontStyle = 'italic'; }
          replacement.append(inner); field.replaceWith(replacement);
          clone.querySelectorAll('[data-tool="capture"]').forEach(button => { button.disabled = false; });
        }
      });
      lastBlob = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export unavailable')), 'image/png'));
      if (lastURL) URL.revokeObjectURL(lastURL);
      lastURL = URL.createObjectURL(lastBlob);
      filename = 'keyboard-notes-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.png';
      $('capturePreview').src = lastURL;
      $('saveCapture').href = lastURL; $('saveCapture').download = filename;
      $('captureCaption').textContent = `${canvas.width} × ${canvas.height} PNG · Visible app area. On a phone, you can also hold the image to save it.`;
      const file = new File([lastBlob], filename, { type: 'image/png' });
      $('shareCapture').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      $('captureDialog').showModal();
    } catch (error) {
      console.error('Print Screen:', error);
      window.Notes.toast('Could not create the PNG in this browser. Your note is unchanged.');
    } finally { busy = false; buttons.forEach(button => { button.disabled = false; }); }
  }
  $('shareCapture').onclick = async () => {
    if (!lastBlob) return;
    try { await navigator.share({ files: [new File([lastBlob], filename, { type: 'image/png' })], title: 'Keyboard notes' }); }
    catch (error) { if (error.name !== 'AbortError') window.Notes.toast('Sharing is unavailable. Use Save PNG.'); }
  };
  window.PrintScreen = { capture };
})();
