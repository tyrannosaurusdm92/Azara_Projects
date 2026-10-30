#!/usr/bin/env python3
"""Export full V9 settlement JSON from the browser-loadable JavaScript maps.
Run: python docs/export_v9_json.py [destination]
"""
from pathlib import Path
import json,sys,gzip,base64,re
root=Path(__file__).resolve().parents[1]
dest=Path(sys.argv[1]) if len(sys.argv)>1 else root/'json/v9_exported'
dest.mkdir(parents=True,exist_ok=True)
start='window.__BELAVADOS_LIVING_LOADED='
for f in sorted((root/'js/living_maps').glob('*.js')):
 text=f.read_text(encoding='utf-8')
 if text.startswith(start):
  data=json.loads(text[len(start):].strip().rstrip(';'))
  (dest/(f.stem+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
 else:
  match=re.search(r'const encoded=(\"[A-Za-z0-9+/=]+\");',text)
  if not match:continue
  raw=gzip.decompress(base64.b64decode(json.loads(match.group(1))))
  data=json.loads(raw)
  (dest/(f.stem+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('Exported',len(list(dest.glob('*.json'))),'V9 settlement JSON files to',dest)
