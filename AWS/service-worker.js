/* AWS view-only release. Retires legacy offline packages. */
const VERSION='aws-readonly-20261028-r2';
const ASSETS=['./','./index.html','./viewer.css','./viewer.js','./manifest.webmanifest','./json/evolution-chart.json','./assets/images/icon-64.png'];
self.addEventListener('install',event=>{
event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('aws-')||k.startsWith('writerhelper-'))&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
if(event.request.method!=='GET')return;
const url=new URL(event.request.url),base=new URL('./',self.location.href);
if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.search)return;
event.respondWith(fetch(event.request).then(res=>{
if(res.ok&&res.type==='basic'){const clone=res.clone();event.waitUntil(caches.open(VERSION).then(cache=>cache.put(event.request,clone)))}
return res;
}).catch(()=>caches.match(event.request)));
});
