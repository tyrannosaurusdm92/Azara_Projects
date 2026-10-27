/* Savanski v1. Loads both uploaded keyboard engines, with shared source datasets. */
import './install-app.mjs';
import './audio-dropdown.js';
import './native-bridge.mjs';

async function readJson(path) {
  const response = await fetch(path, {cache:'default'});
  if (!response.ok) throw Error(`Cannot load ${path} (${response.status})`);
  return response.json();
}

async function start() {
  const [unicode, accents, suggestions] = await Promise.all([
    readJson('./json/unicode-characters.json'),
    readJson('./json/accent-variants.json'),
    readJson('./json/suggestions.json').catch(() => ({words:[],bigrams:{}}))
  ]);
  if (unicode.characters?.length !== 368 || !accents.letters || !accents.symbols) {
    throw Error('The required Unicode character catalogs were incomplete.');
  }
  window.SavanskiData = Object.freeze({unicode, accents, suggestions});
  await import('./unicode-studio.mjs');
  await import('./keyboard-ui.mjs');
  await import('./floating-controls.mjs');
  await import('./cloud-sync.mjs');

  if ('serviceWorker' in navigator &&
      (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
    navigator.serviceWorker.register('./service-worker.js', {scope:'./'})
      .catch(() => { document.getElementById('cloudStatus').textContent = 'Keyboard works online. Offline caching could not be registered.'; });
  }
}

start().catch(error => {
  const message = document.getElementById('status') || document.getElementById('cloudStatus');
  if (message) message.textContent = `Keyboard files could not load: ${error.message}. Serve keyboard.html over HTTP/HTTPS rather than opening file://.`;
});
