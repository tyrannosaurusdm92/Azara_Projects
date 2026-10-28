/* Literary Friend: on-demand, lossless reconstruction of archived Helper JavaScript.
 * Large scripts remain off the startup path and do not connect to generation services.
 * Desktop-only converter binaries are deliberately excluded.
 */
(function(root){'use strict';
 const FILES={"helper-creative.js":["helper-creative.js.pt1","helper-creative.js.pt2","helper-creative.js.pt3","helper-creative.js.pt4","helper-creative.js.pt5","helper-creative.js.pt6"],"helper-world-model.js":["helper-world-model.js.pt1","helper-world-model.js.pt2","helper-world-model.js.pt3","helper-world-model.js.pt4","helper-world-model.js.pt5"]};
 const active=new Map();
 const moduleBase = new URL('.', document.currentScript?.src || new URL('script/js/', location.href).href);
 async function loadScript(filename,baseUrl){
  const basename=String(filename).split('/').pop();
  if(active.has(basename))return active.get(basename);
  const run=(async()=>{
   const parent=baseUrl?new URL('.',baseUrl):moduleBase;
   const parts=FILES[basename];
   if(!parts)throw Error('No split Helper module found: '+basename);
   // Fetch sequentially to avoid large, parallel memory spikes.
   const chunks=[];
   for(const name of parts){
     const r=await fetch(new URL(name,parent));
     if(!r.ok)throw Error('Missing Helper chunk '+name+' (HTTP '+r.status+')');
     chunks.push(await r.blob());
   }
   const url=URL.createObjectURL(new Blob(chunks,{type:'text/javascript'}));
   try{
    await new Promise((resolve,reject)=>{
     const el=document.createElement('script');el.async=false;el.src=url;
     el.onload=resolve;el.onerror=()=>reject(Error('Failed to evaluate '+basename));
     document.head.appendChild(el);
    });
   }finally{URL.revokeObjectURL(url)}
  })();
  active.set(basename,run);
  try{return await run}catch(error){active.delete(basename);throw error}
 }
 root.LFHelperChunks=Object.freeze({list:()=>Object.keys(FILES),loadScript});
})(globalThis);
