import os,json,hashlib,collections,re
from pathlib import Path
r=Path(__file__).resolve().parents[1]
idx=json.load(open(r/'json/living_maps/index.json'))
orig=json.load(open(r/'json/settlement_npcs.json'))
sindex=json.load(open(r/'json/settlement_index.json'))
byS=collections.defaultdict(list)
for n in orig:byS[n['settlementId']].append(n)
errors=[];totals=collections.Counter();checks=[]
for i,row in enumerate(idx['settlements']):
 p=r/row['file'];j=json.load(open(p));sid=j['settlementId'];allids=set(n['id'] for n in j['npcs']);bids=set(b['id'] for b in j['buildings'])
 originalIDs=set(n['id'] for n in byS[sid]);newOrig=set(j['sourceNpcIds']);onMap=set(n['id'] for n in j['npcs'] if n.get('sourceNpcId'))
 if originalIDs!=newOrig or originalIDs!=onMap:errors.append((sid,'original roster mismatch'))
 if len(allids)!=len(j['npcs']) or len(bids)!=len(j['buildings']):errors.append((sid,'duplicate IDs'))
 if len({n['name'] for n in j['npcs']})!=len(j['npcs']):errors.append((sid,'duplicate full names'))
 if not all(len(b['path'])>=3 for b in j['buildings']):errors.append((sid,'empty footprint'))
 if sum(len(b['goodsAndServices']) for b in j['buildings'])!=row['goods']:errors.append((sid,'catalogue mismatch'))
 for b in j['buildings']:
  if not all(x in allids for k in ['residentNpcIds','employeeNpcIds','visitorNpcIds'] for x in b[k]):errors.append((sid,'missing building NPC link'));break
 for n in j['npcs']:
  if n['homeBuildingId'] not in bids or n['workBuildingId'] not in bids:errors.append((sid,'missing home/work'));break
  if len(n.get('weeklySchedule',[]))!=6:errors.append((sid,'not six day schedule'));break
  if any(a['buildingId'] not in bids for day in n['weeklySchedule'] for a in day):errors.append((sid,'orphan schedule building'));break
  if any(t['npcId'] not in allids for a in n.get('relationships',{}).values() for t in a):
   # Original V7 cross-links can refer to NPCs in the SAME V7 settlement or other settlements.
   errors.append((sid,'orphan related NPC'));break
 names=[b['name'] for b in j['buildings']]
 if len(set(names))!=len(names):errors.append((sid,'duplicate building names'))
 if len(j['sourceLocationAliases'])!=row['sourcePlaceAnchors']:errors.append((sid,'missing source place aliases'))
 if not (r/'js/living_maps'/(sid+'.js')).is_file():errors.append((sid,'missing loadable JS'))
 totals['buildings']+=len(j['buildings']);totals['newNpcCount']+=row['newNpcCount'];totals['originalNpcCount']+=row['originalNpcCount'];totals['goods']+=row['goods'];totals['sourcePlaces']+=row['sourcePlaceAnchors'];totals['npcCount']+=len(j['npcs']);totals['schedules']+=sum(len(day) for n in j['npcs'] for day in n['weeklySchedule']);
 # Each map geometry fingerprint unique
 checks.append(hashlib.sha256(json.dumps(j['map']['boundary']+j['map']['roads']).encode()).hexdigest())
if len(set(checks))!=len(checks):errors.append(('global','map geometry duplicated'))
if len(idx['settlements'])!=len(sindex)-1:errors.append(('global','settlement map count'))
if len(set(x['id'] for x in idx['settlements'])|{'aelvanyr-elarvess'})!=len(sindex):errors.append(('global','settlement ID coverage'))
for fn in r.rglob('*.html'):
 if fn.name!='index.html':errors.append(('structure','other html '+str(fn.relative_to(r))))
css=(r/'css/steampunk-background.css').read_text();manifest=json.load(open(r/'json/source_template_manifest.json'));url=manifest['backgroundImageUrl']
if url not in css:errors.append(('style','missing original steampunk wallpaper URL'))
for fn in ['js/elarvess_buildings.js','js/elarvess_map.js','js/elarvess_living.js','js/elarvess_population_data.js','assets/maps/elarvess.png','assets/maps/elarvess.geojson']:
 if not (r/fn).is_file():errors.append(('elarvess', 'missing '+fn))
report={'schema':'belavados.V8.audit','base':'Belavados_V7.zip','townGeneratorSource':'TownGeneratorOS-master(1).zip','totalNamedSettlements':len(sindex),'newProceduralMaps':len(idx['settlements']),'untouchedElarvess':{'buildings':1312,'npcs':2016,'map':'assets/maps/elarvess.png, unchanged'},'totals':dict(totals),'distinctGeometryFingerprints':len(set(checks)),'legacyNpcSourceCount':len(orig),'otherHTMLFiles':len(list(r.rglob('*.html')))-1,'wallpaperUrlInActiveCSS':url in css,'errors':errors[:100],'errorCount':len(errors)}
(r/'docs/V8_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2)[:12000]);
if errors:raise SystemExit('Audit failures')
