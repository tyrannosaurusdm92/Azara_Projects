from pathlib import Path
import gzip,base64,time,json
R=Path('/mnt/data/ttrpg_v9work/js/living_maps');paths=sorted(R.glob('*.js'));start=time.time();size=[0,0]
for i,p in enumerate(paths):
 t=p.read_bytes();prefix=b'window.__BELAVADOS_LIVING_LOADED=';assert t.startswith(prefix)
 payload=t[len(prefix):].rstrip(b';\n');compressed=gzip.compress(payload,compresslevel=9,mtime=0)
 b64=base64.b64encode(compressed).decode('ascii')
 # DecompressionStream is implemented by modern browsers and Node 22; no external CDN required.
 content='''/* Belavadós V9 on-demand gzip data. The complete map and 21-hour six-day schedule records are embedded offline. */
window.__BELAVADOS_LIVING_LOADED_PROMISE=(async()=>{
if(typeof DecompressionStream==='undefined')throw new Error('A modern browser with DecompressionStream support is required for detailed V9 maps');
const encoded='''+json.dumps(b64)+''';
const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
const decompressed=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
const data=await new Response(decompressed).json();
window.__BELAVADOS_LIVING_LOADED=data;
return data;
})();
'''
 p.write_text(content,encoding='utf-8')
 size[0]+=len(t);size[1]+=p.stat().st_size
 if i%16==0:print(i,'/',len(paths),'rawMB',round(size[0]/1e6),'encodedMB',round(size[1]/1e6),'time',round(time.time()-start),flush=True)
print('done',size,'time',time.time()-start,flush=True)
