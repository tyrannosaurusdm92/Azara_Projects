
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const bookView = $('bookStudioView');
  const artView = $('artStudioView');
  const bookModeBtn = $('bookModeBtn');
  const artModeBtn = $('artModeBtn');
  const bridgeActions = $('bridgeActions');
  const bridgeStatus = $('bridgeStatus');

  function setStatus(message, error=false){
    bridgeStatus.textContent = message;
    bridgeStatus.style.color = error ? '#8d302d' : '';
  }
  function setMode(mode){
    const art = mode === 'art';
    bookView.classList.toggle('active', !art);
    artView.classList.toggle('active', art);
    bookModeBtn.classList.toggle('active', !art);
    artModeBtn.classList.toggle('active', art);
    bookModeBtn.setAttribute('aria-pressed', String(!art));
    artModeBtn.setAttribute('aria-pressed', String(art));
    bridgeActions.hidden = !art;
    if (art) {
      setStatus('Cover & Art workspace · connected to the active book');
      requestAnimationFrame(() => window.LFArt?.studioApi?.fit?.());
    } else {
      setStatus('Book Builder · cover handoff is connected');
      if (window.LFBookStudio?.isReady?.()) window.LFBookStudio.refresh();
    }
    try { sessionStorage.setItem('literaryfriend.bookstudio.mode', mode); } catch {}
  }

  async function sendCover(){
    try {
      setStatus('Rendering the front cover…');
      const result = await window.LFArt?.studioApi?.exportFrontCoverDataUrl?.();
      if (!result?.dataUrl) throw new Error('The art workspace did not return cover artwork.');
      window.LFBookStudio?.setCoverArt(result.dataUrl,{width:result.width,height:result.height,syncSize:true,showText:false});
      window.LFBookStudio?.openCoverPanel?.();
      setMode('book');
      setStatus(`Cover placed into the book at ${result.width} × ${result.height} in.`);
    } catch (error) {
      console.error(error); setStatus(`Cover handoff failed: ${error.message}`, true);
    }
  }

  function matchArtToBook(){
    try {
      const spec = window.LFBookStudio?.getBookSpec?.();
      if (!spec) throw new Error('The book workspace is still initializing.');
      window.LFArt?.studioApi?.applyBookSpec?.(spec);
      setStatus(`Art canvas matched to ${spec.width} × ${spec.height} in · ${spec.pageCount} content pages.`);
    } catch (error) { console.error(error); setStatus(`Could not match art canvas: ${error.message}`, true); }
  }

  bookModeBtn.addEventListener('click',()=>setMode('book'));
  artModeBtn.addEventListener('click',()=>setMode('art'));
  $('openArtFromBookBtn')?.addEventListener('click',()=>setMode('art'));
  $('matchArtToBookBtn')?.addEventListener('click',matchArtToBook);
  $('sendCoverToBookBtn')?.addEventListener('click',sendCover);
  $('sendCoverFromExportBtn')?.addEventListener('click',async()=>{ await sendCover(); document.getElementById('exportModal')?.classList.remove('open'); });

  let initial='book'; try { initial=sessionStorage.getItem('literaryfriend.bookstudio.mode')||'book'; } catch {}
  setMode(initial === 'art' ? 'art' : 'book');
})();
