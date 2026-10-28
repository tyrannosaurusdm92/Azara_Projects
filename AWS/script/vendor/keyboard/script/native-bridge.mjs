/* Host bridge is present ONLY in WebView2; a PWA cannot type into other applications. */
const webview = window.chrome?.webview;
if (webview?.postMessage) {
  function send(type, payload = {}) {
    webview.postMessage({type, ...payload});
  }
  window.SavanskiNativeBridge = Object.freeze({
    commitText(text, modifiers = {}) { send('text', {text,modifiers}); },
    deleteBackward(modifiers = {}) { send('key', {key:'Backspace',modifiers}); },
    performKey(key, modifiers = {}) { send('key', {key,modifiers}); },
    screenshot() { send('screenshot'); },
    show() { send('show'); },
    hide() { send('hide'); },
    pin(pinned) { send('pin',{pinned:!!pinned}); },
    resize(width,height) { send('resize',{width,height}); },
    move(x,y) { send('move',{x,y}); },
    moveDelta(dx,dy) { send('moveDelta',{dx,dy}); },
    pause(paused) { send('pause',{paused:!!paused}); },
    exit() { send('exit'); }
  });
  document.documentElement.classList.add('savanski-native-host');
  webview.addEventListener('message', e => {
    if (e.data?.type === 'status') {
      const status = document.getElementById('runStatus');
      if (status) status.textContent = String(e.data.message || '');
    }
  });
}
