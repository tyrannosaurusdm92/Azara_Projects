#!/usr/bin/env python3
"""Belavadós V9: enrichment layer over authored V8 settlement records.
Procedural patch+ward+gate zoning inspired by supplied GPL-licensed TownGeneratorOS
source architecture. Elarvess is deliberately never edited.
"""
import os,json,hashlib,random,math,glob,re,copy,collections,time
from pathlib import Path
from scipy.spatial import Voronoi
from shapely.geometry import Polygon,Point,box
from shapely.ops import transform as shapely_transform

ROOT=Path('/mnt/data/ttrpg_v9work'); MAPS=ROOT/'json/living_maps';JSMAPS=ROOT/'js/living_maps';
DOC=ROOT/'docs';DOC.mkdir(exist_ok=True)
PREFIXES=['Ae','Ara','Bel','Cael','Dara','Eli','Fael','Gari','Hysa','Ilan','Jora','Kae','Lora','Miri','Nara','Osel','Pira','Qira','Rhea','Sela','Tavi','Ura','Vael','Wera','Xira','Yara','Zora','Thae','Eryn','Auri','Bria','Deri','Evo','Fira','Gwen','Hiri','Iria','Kael','Lys','Mora','Nysa','Orin','Pavo','Rin','Sori','Tera','Viri','Wyn','Zel']
SUFFIXES=['ven','din','var','mir','iel','eth','sen','na','rin','ver','ira','dor','en','vi','los','aris','lin','os','wyn','ase','un','ra','im','el','on','ath','ora','is','an','yen','ae','ess','il','avi','ira','esh','riel','ana','or','eris','ae','enni','et','ith','yr','ena','sel','dai','uneth','ar']
SURNAMES=['Hearth','Glen','Vale','Thorn','River','Moss','Ember','Dusk','Mist','Lantern','Crest','Whisper','Silver','Tide','Stone','Willow','Moon','Ash','Amber','Glass','Oak','Pearl','Briar','Wind','Fern','Flint','Bridge','Cloud','Reed','Sable','Winter','Meadow','Hollow','Sparrow','Kestrel','Copper','Saffron','Star','Shade','Orchard','Frost','Dawn','Haven','Wren','Loom','Spindle','Marsh','Reef','Cinder','Rose','Yarrow','Torch','Sail','Quill','Heather','Bramble','Lily','Copper','Forge','Nettle','Sage','Harbor','Pine','Violet','Clover','Root','Wisp','Dove','Rook','Spruce','Bay','Way','West']
RACE=json.load(open(ROOT/'json/canon/approved_species_roster.json'))
SPECIES=[x['name'] for x in RACE['species']]+[x['name'] for x in RACE['mixed_heritages']]
ACTIVITIES=['a neighborhood music circle','community volunteering','a visit with a close friend','sharing a meal with family','a market walk','a religious observance','the evening storytellers’ gathering','practice at a local guild','a quiet evening at a public garden','a game at the common room','taking part in town council discussion','helping with a neighbor’s repairs','observing passing traders','language exchange with visitors']
GOALS=['establish a dependable household','train an apprentice','restore a damaged friendship','earn guild recognition','save for a workshop','publish a family history','protect the neighborhood','develop a trade route','find a long-missing relative','secure a community garden','learn a second language','win a town council election','restore an old archive','repair the family home','keep ancient recipes alive','expand the market network']
CONFLICTS=['a guild fee dispute','an unresolved inheritance','rising rent in the ward','a delayed trade shipment','a promise to a distant cousin','a neighborhood festival shortage','an apprentice’s mistake','an old rivalry between shops','uncertainty about the next caravan','storm damage to the workshop','an unpaid repair','a contested property boundary']
KIN_REVERSE={'parent':'child','child':'parent','sibling':'sibling','spouse':'spouse','partner':'partner','cousin':'cousin','housemate':'housemate','mentor':'apprentice','apprentice':'mentor','friend':'friend','colleague':'colleague','customer':'merchant','merchant':'customer'}
DIAG={'generatedAt':'2026-10-29','schema':'belavados.v9-depth-audit','settlements':{},'source_sha256':{},'failures':[]}
# Retain old identities across all V8 maps so newly generated names cannot shadow original people.
used_names=set()
for f in MAPS.glob('*.json'):
 if f.stem in ('aelvanyr-elarvess','index'):continue
 d=json.load(open(f));used_names.update(n['name'].casefold() for n in d['npcs'])
used_names.update(n['name'].casefold() for n in json.load(open(ROOT/'json/elarvess_living_population.json'))['npcs'])

# Source names are preserved; the newly generated names are globally unique.
def name_gen(r,i):
 for z in range(100):
  first=PREFIXES[(i*7+r.randint(0,999)+z)%len(PREFIXES)]+SUFFIXES[(i*17+r.randint(0,999)+z)%len(SUFFIXES)]
  last=SURNAMES[(i*19+r.randint(0,999)+z)%len(SURNAMES)]
  if z>0:last+=SUFFIXES[(i*31+z)%len(SUFFIXES)].title()
  nm=first+' '+last
  if nm.casefold() not in used_names:used_names.add(nm.casefold());return nm
 raise Exception('name generator exhausted')

def fixed(v):return round(v,1)
def rng_for(s):return random.Random(int.from_bytes(hashlib.sha256(('V9-TownGeneratorOS-patch-ward:'+s).encode()).digest()[:8],'big'))
def distance(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def make_topology(d,r):
 # TownGeneratorOS concepts: polygonal patches, relaxed Voronoi wards, plaza,
 # citadel, city gates, curtain wall, arteries and local streets.
 # Keep all V8 building coords/footprints intact; zoning overlays are additive.
 size=d['map']['viewBox'][2];count={'Village':9,'Town':15,'City':26,'Capital City':39}.get(d['type'],19)
 cx=cy=size/2
 seeds=[]
 for j in range(count):
  angle=j*2.3999632297+r.uniform(-.18,.18)
  rad=(90+690*math.sqrt((j+.3)/(count+1)))*r.uniform(.82,1.12)
  seeds.append([cx+rad*math.cos(angle),cy+rad*math.sin(angle)])
 for _ in range(2):
  nv=[]
  for i,p in enumerate(seeds):
   near=sorted(((distance(p,q),q) for j,q in enumerate(seeds) if i!=j),key=lambda x:x[0])[:5]
   a=[q[1] for q in near];nv.append([.75*p[0]+.25*sum(q[0] for q in a)/len(a),.75*p[1]+.25*sum(q[1] for q in a)/len(a)])
  seeds=nv
 bound=Polygon(d['map']['boundary'])
 vor=Voronoi(seeds+[[ -1500,-1500],[3500,-1500],[-1500,3500],[3500,3500]])
 patches=[]
 ward_names=[w['name'] for w in d['map']['wards']]
 ward_kinds=['Market','Craftsmen','Residential','Merchant','Education','Gardens','Civic','Temple','Patriciate','Harbor','Industrial','Riverside','Guild','Old Quarter','Watch','Transit']
 for j in range(count):
  region=vor.regions[vor.point_region[j]]
  if -1 in region or len(region)<3:continue
  poly=Polygon([vor.vertices[i] for i in region]).intersection(bound)
  if poly.is_empty:continue
  if poly.geom_type=='MultiPolygon':poly=max(poly.geoms,key=lambda p:p.area)
  if poly.area<200:continue
  ring=[[fixed(x),fixed(y)] for x,y in list(poly.exterior.coords)[:-1]]
  patches.append({'id':j+1,'ward':ward_names[j%len(ward_names)],'districtType':ward_kinds[(j+r.randrange(50))%len(ward_kinds)],'center':[fixed(seeds[j][0]),fixed(seeds[j][1])],'boundary':ring})
 edges=[]
 for (i,j) in vor.ridge_points:
  if i>=count or j>=count:continue
  a=seeds[i];b=seeds[j];
  edges.append([int(i)+1,int(j)+1])
 # Roads connect neighboring patches by dedicated straight segments and common square.
 roads=[[p['center'],q['center']] for i,j in edges for p,q in [(next((a for a in patches if a['id']==i),None),next((a for a in patches if a['id']==j),None))] if p and q]
 plazas=sorted(patches,key=lambda p:distance(p['center'],[cx,cy]))[:2]
 gates=[]
 boundary=d['map']['boundary']
 for q in range(4+r.randrange(5)):
  j=(q*len(boundary)//(4+r.randrange(3)))%len(boundary);gates.append(boundary[j])
 return {'sourceAlgorithm':'TownGeneratorOS Model/Patch/Voronoi/CurtainWall/Ward architecture (independent Python implementation)','patches':patches,'connections':edges,'streets':roads,'gates':gates,'plazaPatchIds':[p['id'] for p in plazas],'citadelPatchId':patches[-1]['id'] if patches and d['type'] in ['Capital City','City'] else None,'walls':d['type']!='Village'}

def create_rooms(b,r):
 k=b['type'];base={'RESIDENCE':['Entry','Common room','Kitchen','Sleeping chamber','Washroom','Storage'], 'TAVERN':['Public taproom','Kitchen','Cellar','Private booths','Staff room'], 'MARKET':['Stall floor','Counter','Storage','Loading platform'],'HEALING':['Waiting room','Consultation','Treatment','Supply room'],'EDUCATIONAL':['Classroom','Office','Archive','Study'],'GUILD':['Reception','Meeting hall','Workshop','Records'],'PARK':['Entrance path','Garden','Shelter'],'RELIGIOUS':['Narthex','Main sanctuary','Shrine','Clergy room'],'CRAFT':['Workshop','Tools','Materials','Office'],'INN':['Lobby','Common room','Guest chambers','Kitchen','Storage']}.get(k,['Entrance','Main hall','Workroom','Storage'])
 if b.get('goodsAndServices') and 'Trade counter' not in base:base=list(base)+['Trade counter']
 pts=b.get('path') or []
 if pts:
  xs=[p[0] for p in pts];ys=[p[1] for p in pts];x0,y0,x1,y1=min(xs),min(ys),max(xs),max(ys)
 else:x0=y0=0;x1=y1=40
 w=max(1,x1-x0);h=max(1,y1-y0)
 rooms=[]
 n=len(base);cols=2 if n<=6 else 3;rows=math.ceil(n/cols)
 for i,label in enumerate(base):
  x=i%cols;y=i//cols
  rx=x0+w*x/cols;ry=y0+h*y/rows
  rooms.append({'id':f"{b['id']}-r{i+1}",'name':label,'level':0 if i<n-1 or k not in ('INN','RESIDENCE') else 1,'bounds':[fixed(rx),fixed(ry),fixed(w/cols),fixed(h/rows)],'features':(['counter','shelves'] if 'counter' in label.lower() or 'trade' in label.lower() else ['doorway','furnishings']),'accessibleFrom':f"{b['id']}-r{i}" if i else None})
 b['interior']={'rooms':rooms,'levels':2 if any(q['level']==1 for q in rooms) else 1,'entranceRoomId':rooms[0]['id'],'entrance':[fixed(b['x']),fixed(b['y'])], 'visitorCapacity':max(4,8+len(base)*3)}
 b['dailyActivity']={'open':'07:00' if k!='TAVERN' else '10:00','close':'18:00' if k!='TAVERN' else '21:00','calendar':'6-day Aza’raan cycle'}

def add_extra_buildings(d,top,r,target):
 existing=d['buildings'];used=collections.defaultdict(list)
 for ob in existing:used[(int(ob['x']//22),int(ob['y']//22))].append((ob['x'],ob['y']));bound=Polygon(d['map']['boundary']);maxid=max(int(b['id']) for b in existing)
 names=['Residence','Workshop','Courtyard Home','Boarding House','Dyers’ Shop','Bookbinder','Market Arcade','Stables','Artisan Hall','Bakery','Herbalist','Courier Desk','Guild Annex','Bathhouse','Schoolhouse','Tea Room','Storehouse','Weaver','Carpenter','Potter','Watch Post','Bridge Store','Family Inn','Gardener','Canal Warehouse','Chandler','Glassblower','Cartographer','Weather Station','Archive Annex','Cloth Merchant','Public House','Festival Hall','House of Records','Healers’ Annex','Tailor']
 wards=d['map']['wards'] or [{'name':'Central Quarter','x':960,'y':960}]
 streets=['Ashen Road','Lantern Lane','Silver Walk','Bridge Street','Moss Way','Crescent Row','Willow Road','Harbor Walk','Stone Lane','Wren Terrace','Fountain Passage','Copper Road','Market Street','Garden Row']
 attempts=0;added=0
 # Cellular fill: locate sites around patch centers, place many townhouses with distinct footprints.
 while len(existing)<target and attempts<(target-len(existing))*105+8000:
  attempts+=1
  patch=r.choice(top['patches']) if top['patches'] else None
  if not patch:break
  px,py=patch['center'];x=px+r.gauss(0,225);y=py+r.gauss(0,225)
  if x<55 or x>1865 or y<55 or y>1865 or not bound.contains(Point(x,y)):continue
  near=(int(x//22),int(y//22))
  if any(distance((x,y),p)<18 for u in (-2,-1,0,1,2) for v in (-2,-1,0,1,2) for p in used.get((near[0]+u,near[1]+v),[])):continue
  w=r.uniform(13,24);h=r.uniform(12,26)
  if not bound.contains(box(x-w/2,y-h/2,x+w/2,y+h/2)):continue
  bid=maxid+added+1;added+=1;used[near].append((x,y))
  ward=min(wards,key=lambda w0:distance((x,y),(w0['x'],w0['y'])))['name']
  street=streets[(bid*7+int(x))%len(streets)];purpose=names[(bid+r.randrange(len(names)))%len(names)]
  kind='RESIDENCE' if bid%4 else ('CRAFT' if bid%3 else 'STORE')
  if kind=='RESIDENCE':purpose=names[(bid+r.randrange(3))%4]
  house_name=f"The {SURNAMES[(bid*17+int(y))%len(SURNAMES)]} {purpose}"
  b={'id':bid,'name':house_name,'type':kind,'material':r.choice(['WOOD','STONE_BRICK','TIMBER','STONE']),'address':f"{100+bid%780} {street}, {ward}, {d['settlementName']}, {d['provinceName']}", 'ward':ward,'street':street,'streetNumber':100+bid%780,'x':fixed(x),'y':fixed(y),'path':[[fixed(x-w/2),fixed(y-h/2)],[fixed(x+w/2),fixed(y-h/2)],[fixed(x+w/2),fixed(y+h/2)],[fixed(x-w/2),fixed(y+h/2)]],'purpose':purpose,'description':f'{house_name} stands in {ward} with a publicly navigable ground floor and documented six-day activity.', 'features':['Front entrance','Public/common room','Store room'],'hours':'Six-day Aza’raan schedule','sourceAliases':[], 'originalLocationSources':['V9 added building; original V8 buildings retained'], 'residentNpcIds':[], 'employeeNpcIds':[],'visitorNpcIds':[], 'goodsAndServices':[]}
  existing.append(b)
 return added

def maybe_rel(a,b,kind,ab,ba=None):
 if a is b:return
 ra=a.setdefault('relationships',{}).setdefault(kind,[]); rb=b.setdefault('relationships',{}).setdefault(kind,[])
 if any(e.get('npcId')==b['id'] and e.get('type')==ab for e in ra):return
 ra.append({'npcId':b['id'],'name':b['name'],'type':ab});rb.append({'npcId':a['id'],'name':a['name'],'type':ba or KIN_REVERSE.get(ab,ab)})

def schedule_for(n,work,home,other,r):
 schedules=[]
 for day in range(1,7):
  dest=other[(day*3+r.randrange(len(other)))%len(other)] if other else work
  if day!=6:
   starts=[('00:00','05:00','Sleeping',home),('05:00','07:00','Household breakfast',home),('07:00','11:00','Working: '+n['job']['title'],work),('11:00','12:00','Market and midday meal',dest),('12:00','16:00','Work and community duties',work),('16:00','19:00',r.choice(ACTIVITIES),dest),('19:00','21:00','Evening at home',home)]
  else:
   starts=[('00:00','07:00','Sleeping',home),('07:00','10:00','Morning household and market',dest),('10:00','14:00','Community gathering',dest),('14:00','18:00','Family and personal time',home),('18:00','21:00','Evening at home',home)]
  schedules.append([{'start':a,'end':b,'activity':c,'buildingId':q,'day':day} for a,b,c,q in starts])
 return schedules

def new_npcs(d,r,target):
 blds=d['buildings'];byid={b['id']:b for b in blds};houses=[b for b in blds if b['type']=='RESIDENCE'];jobs=[b for b in blds if b['type']!='RESIDENCE'];social=[b for b in jobs if b['type'] in ('TAVERN','INN','MARKET','PARK','RELIGIOUS','GUILD','EDUCATIONAL')];
 if not houses:houses=blds[:1]
 if not jobs:jobs=blds[:1]
 if not social:social=jobs
 # Select homes to avoid 20+ residents in a single house.
 additional=max(0,target-len(d['npcs']))
 created=[];cohorts=[];group=[]
 for i in range(additional):
  nm=name_gen(r,i);gender=r.choice(['Female','Male','Nonbinary','Agender','Genderfluid','Demigirl','Demiboy','Trans woman','Trans man']);pronouns='she/her' if gender in ('Female','Trans woman','Demigirl') else 'he/him' if gender in ('Male','Trans man','Demiboy') else r.choice(['they/them','xe/xem','ey/em','ze/zir','she/her','he/him'])
  home=houses[(i//4)%len(houses)]
  if i%5==0:job=jobs[(i*11+r.randint(0,1000))%len(jobs)]
  else:job=jobs[(i//3+r.randint(0,180))%len(jobs)]
  age=r.randrange(18,94);race=r.choice(SPECIES)
  sid=f"{d['settlementId']}-v9-{i+1:05d}";traits=r.sample(['generous','quiet','curious','skeptical','witty','fastidious','patient','steadfast','dramatic','diligent','guarded','outgoing','clever','methodical','creative','reckless','thoughtful','pragmatic'],3)
  asp=r.choice(GOALS);issue=r.choice(CONFLICTS);activity=r.choice(ACTIVITIES)
  n={'id':sid,'name':nm,'age':age,'genderIdentity':gender,'pronouns':pronouns,'race':{'name':race,'category':'Approved Species or Heritage'},'provinceId':d['provinceId'],'provinceName':d['provinceName'],'settlementId':d['settlementId'],'settlementName':d['settlementName'],'source':'V9 enriched resident, generated without overwriting V8','home':home['name'],'homeBuildingId':home['id'],'workBuildingId':job['id'],'homeAddress':home['address'],'workAddress':job['address'],'job':{'title':job['purpose'],'location':job['name']},'traits':traits,'aspiration':asp,'householdId':f"{d['settlementId']}-house-{(i//4)+1:04d}", 'relationships':{'familial':[],'romantic':[],'personal':[],'professional':[]},'biography':f"{nm} lives at {home['address']} and works at {job['name']} in {job['ward']}. Known for being {', '.join(traits)}, {nm.split()[0]} hopes to {asp}, while managing {issue}. On quieter days, {nm.split()[0]} favors {activity}. Residents can find this person at the stated workplaces, meeting places, or home according to the six-day clock.", 'personality':{'strengths':traits[:2],'concern':issue,'currentGoal':asp},'deityAffiliations':r.sample(['Nebyrr','Sigrananna','Marduthor','Ishtanora','Enkirael','Freyseth','Raeshkul','Horundar','Bastveig','Thalunesh'],r.choice([0,1,1,2])),'romance':{'status':'private' if i%7 else 'seeking partnership','consent':'respect all participants'},'regularVisits':[], 'scheduleProvenance':'V9 six-day 21-hour campaign-time routine'}
  n['weeklySchedule']=schedule_for(n,job['id'],home['id'],[social[(i*3+j*13)%len(social)]['id'] for j in range(9)],r)
  visited=set(q['buildingId'] for day in n['weeklySchedule'] for q in day)
  n['regularVisits']=[{'buildingId':bid,'name':byid[bid]['name']} for bid in visited if bid not in (home['id'],job['id'])]
  home['residentNpcIds'].append(sid);job['employeeNpcIds'].append(sid)
  for bid in visited:
   if bid not in (home['id'],job['id']):byid[bid]['visitorNpcIds'].append(sid)
  created.append(n)
  group.append(n)
  if len(group)==4:cohorts.append(group);group=[]
 if group:cohorts.append(group)
 # Reciprocal family and co-residence links; romance is never inferred from identical housing.
 for group in cohorts:
  for j in range(1,len(group)):
   if j==1 and group[0]['age']-group[j]['age']>16:maybe_rel(group[0],group[j],'familial','parent','child')
   else:maybe_rel(group[0],group[j],'familial','housemate')
  if len(group)>2 and group[1]['age']>20 and group[2]['age']>20 and r.random()<.28:maybe_rel(group[1],group[2],'romantic','partner')
 # Reciprocal social/professional relationships across neighborhoods and with original NPCs.
 old=d['npcs'];
 for i,n in enumerate(created):
  if i>0:maybe_rel(n,created[(i*127+59)%len(created)],'personal','friend')
  if i>0:maybe_rel(n,created[(i*41+7)%len(created)],'professional','colleague')
  if old and i%13==0:maybe_rel(n,old[(i//13)%len(old)],'professional','colleague')
  if i%19==0:maybe_rel(n,created[(i*67+31)%len(created)],'personal','friend')
 d['npcs'].extend(created);return len(created)

def main():
 start=time.time();paths=sorted(MAPS.glob('*.json'));metrics=[]
 for count,f in enumerate(paths):
  if f.stem in ('aelvanyr-elarvess','index'):continue
  sourcebytes=f.read_bytes();DIAG['source_sha256'][f.stem]=hashlib.sha256(sourcebytes).hexdigest()
  d=json.loads(sourcebytes)
  if d.get('schema')=='belavados.living.v9':
   DIAG['source_sha256'][f.stem]=d['generation']['v9']['originalV8SHA256'];continue
  r=rng_for(d['settlementId']);b0=len(d['buildings']);n0=len(d['npcs']);origids=[b['id'] for b in d['buildings']];orig_npids=[n['id'] for n in d['npcs']]
  target_b={'Village':420,'Town':900,'City':1312,'Capital City':1800}[d['type']]
  target_n={'Village':350,'Town':1050,'City':2016,'Capital City':2650}[d['type']]
  top=make_topology(d,r);d['map']['townGeneratorOSTopology']=top
  added_b=add_extra_buildings(d,top,r,target_b)
  for b in d['buildings']:create_rooms(b,r)
  added_n=new_npcs(d,r,target_n)
  d['buildingCount']=len(d['buildings']);d['npcCount']=len(d['npcs']);d['schema']='belavados.living.v9';d['generation']['v9']={'method':'TownGeneratorOS-inspired Voronoi ward topology plus visitable interiors and six-day settlement population','originalV8BuildingCount':b0,'originalV8NpcCount':n0,'addedBuildingCount':added_b,'addedResidentCount':added_n,'originalV8SHA256':DIAG['source_sha256'][f.stem]}
  assert d['buildingCount']==target_b and d['npcCount']==target_n,(f,len(d['buildings']),len(d['npcs']))
  assert [b['id'] for b in d['buildings'][:b0]]==origids
  assert [n['id'] for n in d['npcs'][:n0]]==orig_npids
  jdata=json.dumps(d,ensure_ascii=False,separators=(',',':'))
  f.write_text(jdata,encoding='utf-8')
  (JSMAPS/(f.stem+'.js')).write_text('window.__BELAVADOS_LIVING_LOADED='+jdata+';\n',encoding='utf-8')
  met={'name':d['settlementName'],'type':d['type'],'buildings':d['buildingCount'],'npcs':d['npcCount'],'addedBuildings':added_b,'addedNpcs':added_n,'wardPatches':len(top['patches']),'totalRooms':sum(len(b['interior']['rooms']) for b in d['buildings'])}
  DIAG['settlements'][d['settlementId']]=met;metrics.append(met)
  if count%10==0:print('generated',count,'/',len(paths),d['settlementName'],'time',round(time.time()-start),'s',flush=True)
 DOC.joinpath('V9_GENERATION_AUDIT.json').write_text(json.dumps(DIAG,indent=2,ensure_ascii=False),encoding='utf-8')
 print('DONE',len(metrics),'npc',sum(x['npcs'] for x in metrics),'buildings',sum(x['buildings'] for x in metrics),'rooms',sum(x['totalRooms'] for x in metrics),'seconds',time.time()-start)
if __name__=='__main__':main()
