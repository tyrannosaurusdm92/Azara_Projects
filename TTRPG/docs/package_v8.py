import os,zipfile,time,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=Path('/mnt/data/Belavados_V8_Elarvess_Standard_All_Settlements.zip')
files=sorted(p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts and not p.name.startswith('.'))
start=time.time()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=4,allowZip64=True) as z:
 for i,p in enumerate(files):
  z.write(p,p.relative_to(root).as_posix())
  if i%150==0:print('packaged',i,'/',len(files),'output MB',round(out.stat().st_size/1e6,1),flush=True)
print('READY',out, 'compressedMB',round(out.stat().st_size/1e6,1),'files',len(files),'elapsed seconds',round(time.time()-start,1),flush=True)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert len([x for x in z.namelist() if x.lower().endswith('.html')])==1
 assert set(x.split('/')[0] for x in z.namelist())=={'index.html','js','json','css','assets','docs'}
 print('CRC VERIFIED, single index.html, strict top-level',flush=True)
