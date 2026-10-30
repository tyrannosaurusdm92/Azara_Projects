const CACHE='aws-writing-studio-unified-v19';
const SHELL=['./script/js/aws-navigation-model.js','./style/aws-unified.css','./script/js/aws-language-restoration.js','./json/source-library/book-series.json','./json/source-library/language-guide.json','./json/source-library/earthkeepers.json','./json/source-library/species.json','./json/source-library/naming.json','./json/source-library/letter-evolution-source.json','./json/source-library/peoples-approved.json','./json/source-library/source-priority-readme.json','./json/source-library/ttrpg-lore.json','./json/source-library/mmorpg-lore.json','./json/source-library/root-readme.json','./json/source-library/language-readme.json','./json/source-library/approved-peoples-readme.json','./json/source-library/naming-atlas.json','./json/source-library/peoples-atlas.json','./json/source-library/english-comparison.json','./json/source-library/voice-notes.json','./json/source-library/conflict-register.json','./json/source-library/continuity-changelog.json','./json/source-library/language-history.json','./json/source-library/naming-readme.json','./json/source-library/original-generator.json','./json/source-library/continuation-books.json','./json/source-library/continuation-language.json','./json/source-library/continuation-ttrpg-world.json','./json/source-library/continuation-mmorpg-world.json','./json/source-library/english-alphabet-history.json','./json/source-library/drive-sync-status.json','./json/source-library/continued-rules-readme.json','./json/source-library/continued-source-readme.json','./json/source-library/deep-import-audit.json','./json/source-library/import-stats.json','./json/source-library/inventory-root.json','./script/js/keyboard/azaaraan-bridge.js','./script/js/keyboard/aza-config.js','./script/js/keyboard/aza-data.js','./json/keyboard/azaaraan-config.json','./assets/azara-universe-logo.svg','./script/js/aws-source-library.js','./style/aws-source-library.css','./json/source-library/index.json','./json/azaraan-rules/continents.json','./script/js/aws-language-rules.js','./json/azaraan-rules/manifest.json','./json/azaraan-rules/sources.json','./json/azaraan-rules/alphabet-and-sounds.json','./json/azaraan-rules/diacritic-registry.json','./json/azaraan-rules/letter-construction.json','./json/azaraan-rules/phonotactics.json','./json/azaraan-rules/grammar-eras.json','./json/azaraan-rules/particles-and-morphology.json','./json/azaraan-rules/historical-sound-changes.json','./json/azaraan-rules/examples-and-tests.json','./json/azaraan-rules/historical-dictionary.json','./','./index.html','./manifest.webmanifest','./style/luxury-editor.css','./style/literary-friend.css','./style/aws-studio.css','./style/keyboard/keyboard.css','./style/keyboard/evolution.css','./style/keyboard/aza-merge.css','./style/glyph-studio-scoped.css','./script/js/app.js','./script/js/khmer-registry-data.js','./json/khmer-unicode-registry.json','./json/keyboard/evolution-chart.json','./json/keyboard/keyboard-data.json', ...['aza-config','aza-data','aza-evolution','aza-ipa-data','aza-ipa','aza-phonetic-data','aza-phonetic','aza-sound-data','aza-tts-data','aza-tts','azaaraan-bridge','capture','html2canvas.min','keyboard-data','keyboard','notes','aws-keyboard-app'].map(s=>'./script/js/keyboard/'+s+'.js'),'./script/js/aws-studio.js','./script/js/storage.js','./script/js/languages.js','./script/js/literary-core.js','./script/js/literary-writer-tools.js','./script/js/helper-safe.js','./script/js/helper-chunks.js','./script/js/literary-friend.js','./script/js/resize-panels.js','./script/js/backend-bridge.js','./script/js/wasm-diagnostics.js','./script/js/wasm-preload.js','./assets/mark.svg','./assets/aws-icon-192.png','./assets/aws-icon-512.png','./assets/glyph/era-data.json','./assets/glyph/aws-language-data.json','./assets/glyph/azaraan-character-set.json', ...['qrcode-generator.js','jsQR.js','opentype.js'].map(s=>'./script/vendor/glyph/'+s), ...['model','storage','editor','image-engine','lineage','font-export','sheets','scanner','app'].map(s=>'./script/js/glyph/'+s+'.js')];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
   let index=0;
   const worker=async()=>{
     while(index<SHELL.length){
       const url=SHELL[index++];
       try{await cache.add(new Request(url,{cache:'reload'}))}
       catch(error){console.warn('Offline asset skipped:',url,error)}
     }
   };
   await Promise.all(Array.from({length:4},worker));
 }));
 self.skipWaiting();
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('literary-friend-shell-')||k.startsWith('azaaraan-writing-studio-')||k.startsWith('aws-writing-studio-'))&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
// Online-first for HTML and the core AWS shell; cache-first for large static assets.
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==location.origin)return;
 if(/\.pt\d+$|helper-index-shard|literary-corpus|reference-assets|reference-catalog/.test(url.pathname))return;
 const core=/(?:^|\/)(?:index\.html|aws-unified\.css|aws-studio\.js|aws-navigation-model\.js|app\.js)$/.test(url.pathname);
 const fresh=request.mode==='navigate'||core;
 const storeResponse=async response=>{
   if(response.ok&&response.type==='basic'){
     const cache=await caches.open(CACHE);
     await cache.put(request,response.clone()).catch(()=>{});
   }
   return response;
 };
 const network=()=>fetch(fresh?new Request(request,{cache:'no-cache'}):request).then(storeResponse);
 if(fresh){
   event.respondWith(network().catch(async()=>{
     const cached=await caches.match(request);
     return cached||(request.mode==='navigate'?await caches.match('./index.html'):null)||Response.error();
   }));
 }else{
   event.respondWith(caches.match(request).then(cached=>cached||network().catch(()=>Response.error())));
 }
});
