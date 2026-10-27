/* WriterHelper owns this scope. Cache static files only; keep manuscripts and RPC private. */
const VERSION='writerhelper-aza-v4';
const BASE=new URL('./',self.location.href);
const CORE=[
  'index.html','manifest.webmanifest',
  'assets/images/icon-192.png','assets/images/icon-512.png',
  'assets/ttf/Azaaraan-Archaic.ttf','assets/ttf/Azaaraan-Classical.ttf',
  'assets/ttf/Azaaraan-Traditional.ttf','assets/ttf/Azaaraan-Modern.ttf',
  'style/css/writerhelper.css','style/css/aza-integration.css',
  'style/css/writerhelper-theme.css','style/css/font-workshop.css',
  'script/js/writerhelper.js','script/js/aza-integration.js',
  'script/js/aza-language-document.js','script/js/savanski-document.js',
  'script/js/font-workshop.js','script/js/fonteditor-core.min.js',
  'script/js/backend-bridge.js','script/js/pwa.js',
  'vendor/LiteraryFriend/css/luxury-editor.css',
  'vendor/LiteraryFriend/css/keyboard.css',
  'vendor/LiteraryFriend/css/literary-friend.css',
  'vendor/LiteraryFriend/script/js/app.js',
  'vendor/LiteraryFriend/script/js/storage.js',
  'vendor/LiteraryFriend/script/js/keyboard.js',
  'vendor/keyboard/script/bootstrap.mjs',
  'vendor/keyboard/json/unicode-characters.json',
  'vendor/keyboard/json/accent-variants.json'
].map(path=>new URL(path,BASE).href);

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys
    .filter(key=>key.startsWith('writerhelper-')&&key!==VERSION)
    .map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(request.headers.has('Authorization')||url.searchParams.has('action')||url.searchParams.has('token'))return;
  if(/\.(?:gs|pt\d*)$/i.test(url.pathname)||/\/(?:api|auth|backend)\//i.test(url.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match(new URL('index.html',BASE))));
    return;
  }
  if(!/\.(?:js|mjs|css|json|svg|png|jpg|jpeg|webp|wav|mp3|ttf|woff2?|webmanifest)$/i.test(url.pathname))return;
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok&&response.type==='basic'){
      const copy=response.clone();
      event.waitUntil(caches.open(VERSION).then(cache=>cache.put(request,copy)));
    }
    return response;
  })));
});
