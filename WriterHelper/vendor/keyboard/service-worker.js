/* GitHub Pages/HTTPS offline static caching. Never cache typed text or cloud RPCs. */
const CACHE_NAME = 'savanski-keyboard-v1-floating-flat-20261020';
const LOCAL_ASSETS = [
  './keyboard.html','./manifest.webmanifest',
  './style/unicode-studio.css','./style/keyboard.css','./style/app.css','./style/audio-dropdown.css','./style/floating.css',
  './script/bootstrap.mjs','./script/install-app.mjs','./script/unicode-studio.mjs',
  './script/keyboard-model.mjs','./script/keyboard-ui.mjs','./script/workflow-model.mjs','./script/screenshot.mjs',
  './script/backend-client.mjs','./script/cloud-sync.mjs','./script/audio-dropdown.js',
  './script/native-bridge.mjs','./script/floating-controls.mjs',
  './json/unicode-characters.json','./json/accent-variants.json','./json/audio-manifest.json','./json/suggestions.json',
  './assets/images/savanski-logo.png',
  './assets/images/icon-192.png','./assets/images/icon-512.png','./assets/images/icon-180.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(k => k.startsWith('savanski-keyboard-') && k !== CACHE_NAME)
    .map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Cache WAV/MP3 clips only when a chosen pack is used. Caching all 719 WAVs
  // during installation can overwhelm mobile devices and block PWA installs.
  const audioRoot = new URL('./assets/audio/', self.registration.scope).pathname;
  const soundFile = url.pathname.startsWith(audioRoot) && /\.(?:wav|mp3)$/i.test(url.pathname);
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response.ok && response.type === 'basic' && (soundFile || LOCAL_ASSETS.some(path => new URL(path,self.registration.scope).pathname === url.pathname))) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request,copy)));
      }
      return response;
    });
  }));
});
