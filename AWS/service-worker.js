/* Only explicitly listed frontend files enter the offline cache. Never intercept RPC. */
const VERSION='aws-sound-aware-keyboard-20261028';
const BASE=new URL('./',self.location.href);
const MANIFEST=new URL('json/offline-assets.json',BASE).href;
let manifestPromise;
async function manifest(){
  if(!manifestPromise)manifestPromise=(async()=>{
    const cache=await caches.open(VERSION),response=await cache.match(MANIFEST);
    if(!response)throw Error('Offline asset manifest is unavailable.');
    const data=await response.json();
    return new Set(data.static.map(path=>new URL(path,BASE).pathname));
  })().catch(error=>{manifestPromise=null;throw error});
  return manifestPromise;
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const response=await fetch(MANIFEST,{cache:'no-store'});
    if(!response.ok)throw Error('Cannot load offline asset manifest.');
    const data=await response.clone().json();
    if(data.version!==VERSION)throw Error('The offline manifest and worker versions differ.');
    const cache=await caches.open(VERSION);
    try{
      let cursor=0;
      // Keep installation bounded instead of opening hundreds of requests at once.
      await Promise.all(Array.from({length:8},async()=>{
        while(cursor<data.core.length){
          const url=new URL(data.core[cursor++],BASE).href;
          const item=await fetch(url,{cache:'reload'});
          if(!item.ok)throw Error('Offline file is missing: '+url);
          await cache.put(url,item);
        }
      }));
      await cache.put(MANIFEST,response);
    }catch(error){await caches.delete(VERSION);throw error}
    // Activate updates after existing tabs close so a page never mixes old and new scripts.
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys
    .filter(key=>(key.startsWith('aws-')||key.startsWith('writerhelper-'))&&key!==VERSION)
    .map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(url.search||request.headers.has('Authorization'))return;
  if(request.mode==='navigate'){
    if(![BASE.pathname,new URL('index.html',BASE).pathname].includes(url.pathname))return;
    event.respondWith(caches.open(VERSION).then(cache=>cache.match(new URL('index.html',BASE).href)).then(cached=>cached||fetch(request)));
    return;
  }
  event.respondWith((async()=>{
    const allowed=await manifest();
    if(!allowed.has(url.pathname))return fetch(request);
    const cache=await caches.open(VERSION),cached=await cache.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok&&response.type==='basic'){
      const write=cache.put(request,response.clone());event.waitUntil(write);await write;
    }
    return response;
  })());
});
