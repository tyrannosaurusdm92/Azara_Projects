from pathlib import Path
import zipfile,hashlib,json,re
original=zipfile.ZipFile('/mnt/data/Belavados_V7.zip');root=Path(__file__).resolve().parents[1]
allowed_new=['index.html','js/world_app.js','js/template_dashboard.js','docs/README.md']
changed=[];missing=[]
for item in original.infolist():
 if item.is_dir():continue
 local=root/item.filename
 if not local.exists():missing.append(item.filename);continue
 if hashlib.sha256(original.read(item.filename)).digest()!=hashlib.sha256(local.read_bytes()).digest():changed.append(item.filename)
report={'v7FileCount':len([x for x in original.infolist() if not x.is_dir()]),'missingFromV7':missing,'modifiedV7Files':changed,
 'allowedModifiedFiles':allowed_new, 'unexpectedChanges':[x for x in changed if x not in allowed_new],
 'elarvessOriginalAssetsByteIdentical':all(not x.startswith(('js/elarvess_','json/elarvess_','assets/maps/elarvess')) for x in changed),
 'allOriginalFilesPresent':not missing}
(root/'docs/V8_SOURCE_PRESERVATION.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2)[:4000]);assert not missing and not report['unexpectedChanges']
