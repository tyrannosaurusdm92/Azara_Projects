/* Cache only static WriterHelper resources. Never store authentication or backend responses. */
const VERSION='writerhelper-aza-v3',BASE=new URL('./',self.location.href);
const CORE=['index.html','manifest.webmanifest','script/js/aza-integration.js','script/js/aza-language-document.js','script/js/savanski-document.js','style/css/aza-integration.css','script/js/backend-bridge.js','js/aza/config.js','js/aza/studio.js','js/aza/tts.js','vendor/LiteraryFriend/script/js/app.js'].map(x=>new URL(x,BASE).href);
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('writerhelper-')&&k!==VERSION).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(BASE.pathname))return;
if(u.searchParams.has('token')||u.searchParams.has('action')||r.headers.has('Authorization')||/\/(?:auth|api|backend)\//i.test(u.pathname))return;
if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match(new URL('index.html',BASE))));return}
if(/\.(?:gs|pt\d*)$/i.test(u.pathname)||u.pathname.includes('literary-corpus-'))return;
e.respondWith(caches.match(r).then(c=>c||fetch(r).then(res=>{if(res.ok&&res.type==='basic'&&/\.(?:js|css|json|svg|png|wav|ttf|webmanifest)$/.test(u.pathname)){const copy=res.clone();caches.open(VERSION).then(cache=>cache.put(r,copy)).catch(()=>{})}return res})))});
