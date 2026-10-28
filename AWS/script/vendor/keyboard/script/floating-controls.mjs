const $ = id => document.getElementById(id);
const host = window.SavanskiNativeBridge;
const shell = $('savanskiKeyboard');
const runStatus = $('runStatus');
let running = host ? true : false;
let hidden = false;
let paused = false;
let pinned = false;

function report(message) { if (runStatus) runStatus.textContent = message; }
function render() {
  shell.hidden = hidden || !running;
  $('runKeyboard').textContent = running ? '▶ Keyboard Running' : '▶ Run Keyboard';
  $('pauseKeyboard').textContent = paused ? 'Resume Input' : 'Pause Input';
  $('pauseKeyboard').setAttribute('aria-pressed', String(paused));
  $('togglePin').setAttribute('aria-pressed', String(pinned));
  $('togglePin').textContent = pinned ? 'Unpin' : 'Pin';
  if (host) $('togglePin').title = 'Always on Top';
}

window.SavanskiInputState = Object.freeze({get paused(){return paused || !running;}});
$('runKeyboard').addEventListener('click', () => {
  running = true; hidden = false; paused = false;
  if (!host && $('toggleDock').getAttribute('aria-pressed') !== 'true') $('toggleDock').click();
  host?.show(); host?.pause(false);
  render();
  report(host ? 'Floating Windows keyboard is running. Tap an app’s text field to begin.' :
    'Browser keyboard is running. It can type only in Savanski’s own editor.');
});
$('showKeyboard').addEventListener('click', () => {
  hidden = !hidden;
  if (hidden) host?.hide(); else {running=true;host?.show();}
  render();report(hidden ? 'Keyboard hidden; settings retained.' : 'Keyboard visible.');
});
$('pauseKeyboard').addEventListener('click', () => {
  paused = !paused;host?.pause(paused);render();
  report(paused ? 'Input paused; no characters are sent.' : 'Keyboard input resumed.');
});
$('exitKeyboard').addEventListener('click', () => {
  paused=true;running=false;hidden=true;host?.exit();render();
  report(host ? 'Exiting Windows host…' : 'Web keyboard stopped. Choose Run Keyboard to start again.');
});
$('togglePin').addEventListener('click', () => {
  if (!host) {report('Always on Top works in the Windows desktop host, not the browser PWA.');return;}
  pinned=!pinned;host.pin(pinned);render();
});
for (const [id,width,height] of [['sizeSmall',600,255],['sizeMedium',910,375],['sizeLarge',1200,510]]) {
  $(id).addEventListener('click', () => {
    if (host) host.resize(width,height);
    else {
      const viewW=window.innerWidth,viewH=window.innerHeight;
      window.SavanskiResizeKeyboard?.(Math.min(width,viewW-12),Math.min(height,viewH-12));
    }
    report(`${id.slice(4)} keyboard preset selected.`);
  });
}
if (host) report('Savanski Windows floating host connected; click a text field in another app and type.');
render();
