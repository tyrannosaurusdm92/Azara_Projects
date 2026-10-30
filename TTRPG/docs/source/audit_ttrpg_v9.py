import zipfile,json,collections,hashlib,os,re,time
from pathlib import Path
R=Path('/mnt/data/ttrpg_v9work');z=zipfile.ZipFile('/mnt/data/Belavados_V8_Elarvess_Standard_All_Settlements(1).zip')
result={'schema':'belavados.v9.integrity-report','source':'V8 original zip and generated maps','settlements':{},'totals':collections.Counter(),'failures':[],'original_elarvess_sha256':{},'canonicalRaces':[],'mapHashDuplicates':{}}
race=json.loads((R/'json/canon/approved_species_roster.json').read_text());allowed={x['name'] for x in race['species']+race['mixed_heritages']};result['canonicalRaces']=sorted(allowed)
used_names={};geomhash={};building_names={}
paths=list((R/'json/living_maps').glob('*.json'));start=time.time()
for i,p in enumerate(sorted(paths)):
 if p.stem=='index':continue
 d=json.loads(p.read_bytes())
 if d.get('schema')!='belavados.living.v9':continue
 old=json.loads(z.read('json/living_maps/'+p.name));ident=d['settlementId']
 errs=[]
 if d['buildingCount']!=len(d['buildings']) or d['npcCount']!=len(d['npcs']):errs.append('count mismatch')
 bmap={b['id']:b for b in d['buildings']};nmap={n['id']:n for n in d['npcs']}
 if len(bmap)!=len(d['buildings']) or len(nmap)!=len(d['npcs']):errs.append('duplicate IDs')
 for b in old['buildings']:
  new=bmap[b['id']]
  for k in ('name','address','path','sourceAliases','goodsAndServices','type','purpose'):
   if new.get(k)!=b.get(k):errs.append('original building changed '+str(b['id'])+' '+k);break
 for n in old['npcs']:
  new=nmap[n['id']]
  for k in ('name','race','weeklySchedule','homeBuildingId','workBuildingId'):
   if new.get(k)!=n.get(k):errs.append('original NPC changed '+n['id']+' '+k);break
  for kind,rels in n.get('relationships',{}).items():
   if any(rel not in new.get('relationships',{}).get(kind,[]) for rel in rels):errs.append('original relationship deleted '+n['id'])
 for n in d['npcs']:
  if n['source'].startswith('V9') and n['name'].casefold() in used_names:errs.append('duplicate new npc name '+n['name']+' also '+used_names[n['name'].casefold()]);
  used_names.setdefault(n['name'].casefold(),ident)
  if n.get('race',{}).get('name') not in allowed:errs.append('race outside canon '+n['id'])
  if n.get('homeBuildingId') not in bmap or n.get('workBuildingId') not in bmap:errs.append('unmapped home/work '+n['id'])
  for day in n.get('weeklySchedule',[]):
   for slot in day:
    if slot.get('buildingId') not in bmap:errs.append('unmapped schedule '+n['id'])
  for kind,rels in n.get('relationships',{}).items():
   for rel in rels:
    if rel['npcId'] not in nmap:errs.append('broken relationship target '+n['id']);continue
    if n['id'] not in [x.get('npcId') for x in nmap[rel['npcId']].get('relationships',{}).get(kind,[])]:
     errs.append('non reciprocal '+n['id']+'->'+rel['npcId']+' '+kind)
 for b in d['buildings']:
  if not b.get('interior',{}).get('rooms'):errs.append('missing room map '+str(b['id']))
  if len(b['path'])<3:errs.append('invalid polygon '+str(b['id']))
  for key in ('residentNpcIds','employeeNpcIds','visitorNpcIds'):
   if any(id not in nmap for id in b.get(key,[])):errs.append('missing NPC in '+str(b['id'])+' '+key)
  key=(ident,b['name'].casefold())
  if key in building_names:errs.append('duplicate building name '+b['name'])
  building_names[key]=1
 route=d['map'].get('townGeneratorOSTopology',{});
 if not route.get('patches') or not route.get('connections') or not route.get('gates'):errs.append('missing patch topology')
 geom=hashlib.sha256(json.dumps((d['map']['boundary'],d['map']['roads'],route.get('patches')),separators=(',',':')).encode()).hexdigest()
 if geom in geomhash:errs.append('duplicate map geometry also '+geomhash[geom]);
 geomhash[geom]=ident
 metr={'name':d['settlementName'],'type':d['type'],'buildings':len(d['buildings']),'npcs':len(d['npcs']),'rooms':sum(len(b['interior']['rooms']) for b in d['buildings']),'sourceNpcPreserved':len(old['npcs']),'sourceBuildingsPreserved':len(old['buildings']),'patches':len(route.get('patches',[])),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'errors':list(dict.fromkeys(errs))[:25]}
 result['settlements'][ident]=metr
 for k in ('buildings','npcs','rooms','sourceNpcPreserved','sourceBuildingsPreserved'):result['totals'][k]+=metr[k]
 result['totals']['nonElarvessSettlements']+=1
 if errs:result['failures'].append({'settlement':ident,'errors':metr['errors'],'count':len(errs)})
 if i%30==0:print('audit',i,'/',len(paths),'failures',len(result['failures']), 'sec',round(time.time()-start),flush=True)
# Exact Elarvess file preservation against V8 archive
for name in ['json/elarvess_living_population.json','assets/maps/elarvess.png','js/elarvess_population_data.js','json/elarvess_location_buildings.json']:
 b=(R/name).read_bytes();orig=z.read(name)
 result['original_elarvess_sha256'][name]={'sha256':hashlib.sha256(b).hexdigest(),'byteIdentical':b==orig}
 if b!=orig:result['failures'].append({'file':name,'error':'Elarvess data modified'})
result['totals']=dict(result['totals']);result['total_failures']=len(result['failures']);result['duration_seconds']=round(time.time()-start,2)
(R/'docs/V9_FULL_INTEGRITY_AUDIT.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
print('DONE',result['totals'],'FAILURES',len(result['failures']),'TIME',result['duration_seconds'],flush=True)
if result['failures']:print('EXAMPLES',str(result['failures'][:5])[:2400])
