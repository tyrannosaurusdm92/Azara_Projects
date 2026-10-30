#!/usr/bin/env python3
"""Reproducible Belavadós V8 procedural ward maps; preserves V7 source data unchanged.
TownGeneratorOS influences Voronoi ward/parcel practice, but original Haxe engine is
not executed/ported. See docs/TOWN_GENERATOR_INTEGRATION.md and GPL attribution.
"""
from __future__ import annotations
import os,json,hashlib,random,re,math,collections,statistics
from pathlib import Path
from shapely.geometry import Polygon,MultiPoint,Point,box,LineString
from shapely.ops import unary_union
from shapely import voronoi_polygons
from shapely.strtree import STRtree
ROOT=Path(__file__).resolve().parents[1]
SOURCES=json.load(open(ROOT/'json/settlement_index.json'))
ORIG=json.load(open(ROOT/'json/settlement_npcs.json'))
SOURCE_TYPES=json.load(open(ROOT/'json/visitable_locations.json'))['settlementTypes']
WORLDJS=(ROOT/'js/world_bundle.js').read_text()
WORLD=json.loads(WORLDJS[WORLDJS.index('{'):WORLDJS.rfind('}')+1])
ALLOWED=WORLD['approvedRaceNames']
OUT=ROOT/'json/living_maps'; OUT.mkdir(exist_ok=True)
SRCINDEX={n['id']:[] for n in SOURCES}
for n in ORIG:SRCINDEX[n['settlementId']].append(n)
FIRST=['Aela','Sora','Kiren','Mira','Tavin','Auri','Neth','Vaela','Oryn','Raisa','Luna','Silan','Vira','Aeron','Tira','Zarin','Naya','Corin','Niri','Fiora','Nerin','Vessa','Emril','Liora','Seren','Navi','Kaela','Orin','Velo','Zena','Marin','Elira','Lorin','Tala','Salen','Kora','Nyra','Aven','Letha','Iven','Rena','Zora','Iri','Kael','Thena','Berr','Tere','Elan','Lumi','Zaela']
LAST=['Cinder','Willow','Fernweave','Lark','Slate','Pearl','Thistle','Moss','Mist','Ember','Vale','Renn','Dawn','Lantern','Riversong','Mere','Foxwood','Wind','Stonefall','Rowan','Goldleaf','Bracken','Brightwater','Copperhill','Cloudglen','Hearth','Myr','Silverbrook','Bough','Lanternwick','Saltmere','Ridge','Tidewatch','Kestrel','Ashbriar','Fenn','Marshgate','Thornspire','Sund','Ardyn','Oakwake','Voss','Wren','Stonehand']
ADJECTIVES=['Copper','Spindle','Amber','Star','Duskwater','Cinder','Glen','Kestrel','Lark','Reed','Willow','Grey','Sable','Thistle','Brass','Lantern','Dawn','Cloud','Foxglove','Stone','Blue','Juniper','Aster','Moon','Waking','Salt','Silver','Golden','Winter','Honey','Elder','Moss','Briar','Saffron','Hazel','Crescent','Iron','Aurora','Rose','Glass','Wind','River','Sun','North','South','East','West']
NOUNS=['Hearth','Fountain','Bough','Cove','Hall','Gate','Lantern','Bridge','Stair','Market','House','Workshop','Terrace','Quay','Court','Forge','Walk','Lodge','Yard','Arch','Corner','Tower','Well','Wharf','Garden','Square','Passage','Arcade','Nook','Keep','Mews','Retreat','Court','Alley','Hall','Stable','Inn','Sanctuary']
STREETS=['Spindle','Aster','Copper','Reed','Lantern','Brass','Willow','Quay','Hearth','Cinder','Slate','Fern','Kestrel','Mist','Pearl','Cove','Wind','Saffron','Rook','Guild','River','Thistle','Ember','Iris','Star','Glass','Market','Rose','Northgate','Moss']
WARDS=['Old Quarter','Northgrove','Lantern Ward','Canal Ward','Coppergate','Windfell','Mossmeadow','Crown Ward','Eastmarket','Southgrove','Hearthside','Dockward','Bridgehill','Riverhold','Aster Vale','Lower Terrace','Scholars Row','Oldforge','Amber Cross','Willow Quarter','Pilgrim Ward','High Gate']
PURPOSES=['RESIDENCE','MARKET','TAVERN','INN','GUILD','CRAFT','EDUCATIONAL','RELIGIOUS','CIVIC','INDUSTRIAL','HEALING','STABLE','TRANSIT','ENTERTAINMENT','PARK','GUARD','ARCANE','LIBRARY','FARM','STORE','MARITIME']
ROLEWORDS=[('tavern','TAVERN'),('alehouse','TAVERN'),('inn','INN'),('hostel','INN'),('hotel','INN'),('market','MARKET'),('bazaar','MARKET'),('grocer','MARKET'),('bak','MARKET'),('blacksmith','CRAFT'),('forge','CRAFT'),('artisan','CRAFT'),('carpenter','CRAFT'),('tailor','CRAFT'),('weaver','CRAFT'),('potter','CRAFT'),('guild','GUILD'),('school','EDUCATIONAL'),('academy','EDUCATIONAL'),('universit','EDUCATIONAL'),('temple','RELIGIOUS'),('shrine','RELIGIOUS'),('monastery','RELIGIOUS'),('hall','CIVIC'),('council','CIVIC'),('court','CIVIC'),('healer','HEALING'),('apothecary','HEALING'),('clinic','HEALING'),('hospital','HEALING'),('stable','STABLE'),('farrier','STABLE'),('rail','TRANSIT'),('station','TRANSIT'),('caravan','TRANSIT'),('dock','MARITIME'),('ferry','MARITIME'),('harbor','MARITIME'),('pier','MARITIME'),('fish','MARITIME'),('ship','MARITIME'),('guard','GUARD'),('peacekeeper','GUARD'),('watch','GUARD'),('tower','GUARD'),('arcane','ARCANE'),('magic','ARCANE'),('scroll','ARCANE'),('alchem','ARCANE'),('librar','LIBRARY'),('archive','LIBRARY'),('book','LIBRARY'),('theater','ENTERTAINMENT'),('casino','ENTERTAINMENT'),('park','PARK'),('garden','PARK'),('orchard','FARM'),('farm','FARM'),('field','FARM'),('store','STORE'),('shop','STORE'),('merchant','STORE')]
ROLEJOB={'RESIDENCE':'Resident','MARKET':'Market trader','TAVERN':'Tavern keeper','INN':'Inn host','GUILD':'Guild clerk','CRAFT':'Artisan','EDUCATIONAL':'Teacher','RELIGIOUS':'Temple attendant','CIVIC':'Civic clerk','INDUSTRIAL':'Mechanist','HEALING':'Healer','STABLE':'Stablemaster','TRANSIT':'Transit conductor','ENTERTAINMENT':'Performer','PARK':'Groundskeeper','GUARD':'Peacekeeper','ARCANE':'Arcane scholar','LIBRARY':'Librarian','FARM':'Farmer','STORE':'Shopkeeper','MARITIME':'Dockworker'}
FEATURES={'RESIDENCE':['Hearth room','Sleeping chambers','Kitchen','Private courtyard'], 'MARKET':['Public stalls','Counter','Goods store','Delivery entrance'], 'TAVERN':['Taproom','Common tables','Kitchen','Cellar'], 'INN':['Reception','Guest rooms','Common hall','Kitchen'],'GUILD':['Guild meeting room','Ledgers','Workshop','Archive'],'CRAFT':['Workshop','Tool bench','Store room'],'EDUCATIONAL':['Classroom','Library','Study tables'],'RELIGIOUS':['Sanctuary','Reflection room','Shrine'],'CIVIC':['Council office','Records room','Waiting chamber'],'INDUSTRIAL':['Workshop floor','Machine room','Supply warehouse'],'HEALING':['Consultation rooms','Apothecary cabinet','Waiting room'],'STABLE':['Animal stalls','Equipment room','Grooming yard'],'TRANSIT':['Ticket desk','Waiting concourse','Platform'],'ENTERTAINMENT':['Main hall','Performance stage','Dressing room'],'PARK':['Public paths','Benches','Green space'],'GUARD':['Watch desk','Equipment room','Guard quarters'],'ARCANE':['Study room','Warded archive','Ritual chamber'],'LIBRARY':['Reading hall','Book stacks','Archive'],'FARM':['Store shed','Field access','Equipment room'],'STORE':['Sales floor','Stock room','Service desk'],'MARITIME':['Loading stage','Mooring point','Storage area']}
SPECIAL={'Village':(140,55),'Town':(370,125),'City':(680,205),'Capital City':(1060,300)}

def seed(s):return int(hashlib.sha256(s.encode()).hexdigest()[:16],16)
def norm(s):return re.sub(r'\s+',' ',str(s or '').strip()).casefold()
def btype(name):
 s=norm(name)
 if 'house-' in s or any(a in s for a in [' residence','sleeping','family home','household']):return 'RESIDENCE'
 for k,v in ROLEWORDS:
  if k in s:return v
 return 'STORE'
def prefer_type(place):return btype(place)
def timeval(t):
 try:
  a,b=str(t).split(':',1);return min(1440,max(0,int(a)*60+int(b)))
 except:return 0

def roadcurve(r,axis,k=0):
 pts=[]
 for i in range(33):
  t=i/32; p=115+1690*t
  jitter=37*math.sin((t*2.3+k*.24)*math.pi)+14*math.sin((t*6.3+k*.73)*math.pi)
  v=940+k*55+jitter
  pts.append([round(p,1),round(v,1)] if axis=='h' else [round(v,1),round(p,1)])
 return pts

def matching_places(s):
 family=s['type'].replace('Capital City','Capital').replace(' ','').lower()
 bi=norm(s['biome']);short=bi.split()[0]
 entries=[row for row in SOURCE_TYPES if norm(row.get('size',''))==norm(s['type'])]
 # biome is 'Forest', 'Surface Docks Coastal', etc. match exact terrain or variant
 rows=sorted(entries,key=lambda x:(short not in norm(x.get('terrain','')+' '+x.get('variant','')),
     'coastal' in norm(x.get('variant','')) and 'coastal' not in bi))
 if not rows:return []
 return [str(p) for p in rows[0].get('locations',[]) if p][:360]

def make_wall(r, biome):
 pts=[]
 for i in range(72):
  a=2*math.pi*i/72
  noise=1+.105*math.sin(5*a+r.random()*0.3)+.05*math.sin(11*a+.4)
  x=960+790*math.cos(a)*noise; y=960+740*math.sin(a)*noise
  pts.append((max(72,min(1848,x)),max(70,min(1850,y))))
 poly=Polygon(pts).buffer(0)
 return poly,[[round(x,1),round(y,1)] for x,y in pts]

def namefor(r, typ, used):
 suffix={'RESIDENCE':'Residence','MARKET':'Market','TAVERN':'Tavern','INN':'Inn','GUILD':'Guildhall','CRAFT':'Workshop','EDUCATIONAL':'Academy','RELIGIOUS':'Sanctuary','CIVIC':'Council Hall','INDUSTRIAL':'Works','HEALING':'Clinic','STABLE':'Stables','TRANSIT':'Station','ENTERTAINMENT':'Theatre','PARK':'Gardens','GUARD':'Watchpost','ARCANE':'Arcane House','LIBRARY':'Library','FARM':'Farm','STORE':'Shop','MARITIME':'Docks'}[typ]
 for j in range(500):
  s='The '+r.choice(ADJECTIVES)+' '+r.choice(NOUNS)+' '+suffix if j<25 else 'The '+r.choice(ADJECTIVES)+' '+r.choice(STREETS)+' '+suffix
  if s not in used: used.add(s);return s
 raise Exception('names exhausted')

def points_for(s,r,target,wall):
 # Voronoi fills the enclosed town; irregular inset polygons leave natural streets.
 points=[];side=int(math.ceil(math.sqrt(target*1.42))); step=1570/side
 for i in range(side):
  for j in range(side):
   x=170+step*(i+.5)+r.uniform(-.38,.38)*step
   y=170+step*(j+.5)+r.uniform(-.38,.38)*step
   if wall.contains(Point(x,y)): points.append([x,y])
 r.shuffle(points)
 if len(points)>target:points=points[:target]
 # ensure parcels sufficient despite wall clipping
 while len(points)<target:
  x=r.uniform(160,1760);y=r.uniform(160,1760)
  if wall.contains(Point(x,y)):points.append([x,y])
 return points

def map_geometry(s,r,target):
 # Town-generator ward model: bounded Voronoi *blocks* followed by several
 # rectangular/angled building footprints per block. Connected gap space is
 # walkable streets, with separate arterial routes carved through the blocks.
 wall,bound=make_wall(r,s['biome']);block_count=max(45,round(target/4.7))
 points=points_for(s,r,block_count,wall)
 cells=voronoi_polygons(MultiPoint(points),extend_to=wall.envelope)
 roads=[roadcurve(r,'h',-4),roadcurve(r,'v',0),roadcurve(r,'h',3),roadcurve(r,'v',-5)]
 corridors=unary_union([LineString(line).buffer(14,cap_style='round') for line in roads])
 footprints=[]
 waterfront=('coast' in norm(s['biome']) or 'river' in norm(s['biome']) or 'sea' in norm(s['biome']))
 for polygon in cells.geoms:
  block=polygon.intersection(wall).buffer(-8.5,join_style='mitre')
  if block.is_empty:continue
  if block.geom_type=='MultiPolygon':block=max(block.geoms,key=lambda x:x.area)
  minx,miny,maxx,maxy=block.bounds
  dx=maxx-minx;dy=maxy-miny
  if dx<23 or dy<23:continue
  # Individual rectangles are not a single Voronoi mosaic: blocks contain
  # multiple roof outlines and alleys, following a street/block hierarchy.
  nx=3 if dx>45 else 2;ny=3 if dy>45 else 2
  if dx/dy>1.55:nx+=1
  elif dy/dx>1.55:ny+=1
  # Slight block variations keep each township recognizable and distinctive.
  margin=r.uniform(2.7,5.8)
  for i in range(nx):
   for j in range(ny):
    xa=minx+dx*i/nx+margin;xb=minx+dx*(i+1)/nx-margin
    ya=miny+dy*j/ny+margin;yb=miny+dy*(j+1)/ny-margin
    if xb-xa<5 or yb-ya<5:continue
    parcel=box(xa,ya,xb,yb).intersection(block)
    if not parcel.is_empty and parcel.intersects(corridors):parcel=parcel.difference(corridors)
    if parcel.is_empty:continue
    if parcel.geom_type=='MultiPolygon':parcel=max(parcel.geoms,key=lambda x:x.area)
    if parcel.area<95:continue
    pt=parcel.representative_point()
    if waterfront and pt.x<260:continue
    coords=list(parcel.exterior.coords)[:-1]
    if len(coords)<3:continue
    footprints.append((round(pt.x,1),round(pt.y,1),[[round(x,1),round(y,1)] for x,y in coords],round(parcel.area)))
 if len(footprints)>target:
  r.shuffle(footprints)
  footprints=footprints[:target]
 footprints.sort(key=lambda p:(p[1],p[0]))
 return footprints,bound,roads

def make_map(s):
 sid=s['id'];r=random.Random(seed(sid+'v8.3'))
 if sid=='aelvanyr-elarvess':return None
 originals=SRCINDEX[sid];template=WORLD['templates'][s['immersiveTemplateId']]
 catalog=template['inventory'];pool=matching_places(s)
 # Create one canonical anchor for every distinct actual home, work and scheduled destination.
 sourcePlaces=collections.OrderedDict()
 def remember(place,kind):
  if not isinstance(place,str):return
  place=place.strip()
  if not place or place=='/':return
  key=norm(place)
  if key not in sourcePlaces:sourcePlaces[key]={'name':place,'type':btype(place),'origins':set()}
  sourcePlaces[key]['origins'].add(kind)
 for n in originals:
  remember(n.get('home',''),'original NPC home');remember(n.get('job',{}).get('location',''),'original NPC workplace')
  for b in n.get('schedule',[]):
   loc=b.get('location','');remember(loc if ' / ' not in loc else loc.split(' / ')[0], 'original NPC schedule')
 for p in pool:remember(p,'original biome location library')
 for x in catalog:remember(x.get('location',''),'original goods/service vendor')
 # Set target to fit all canonical source places, plus unique residence and ward parcels.
 base,pop= SPECIAL.get(s['type'],SPECIAL['Town']);target=max(base,len(sourcePlaces)+20+int(pop*.12));target=min(1500,target)
 footprint,bound,roads=map_geometry(s,r,target)
 if len(footprint)<len(sourcePlaces): raise RuntimeError(f'{sid} no room: {len(footprint)} vs {len(sourcePlaces)}')
 r.shuffle(footprint)
 centerWards=r.sample(WARDS,min(9,4+target//240));wardCenters=[(r.randint(350,1600),r.randint(350,1600),name) for name in centerWards]
 localStreets=r.sample(STREETS, min(len(STREETS),max(9,6+target//100)))
 used=set();buildings=[];aliases={};originalLinks={}
 # Spread named sites deliberately rather than cluster at one edge.
 srcItems=list(sourcePlaces.values());srcItems.sort(key=lambda a:(a['type']=='RESIDENCE',a['type']=='STORE',a['name']))
 r.shuffle(srcItems)
 for k,(x,y,coords,area) in enumerate(footprint):
  loc=srcItems[k] if k<len(srcItems) else None
  typ=loc['type'] if loc else r.choices(['RESIDENCE','MARKET','CRAFT','STORE','INN','GUILD','PARK','HEALING','TAVERN','CIVIC','GUARD','STABLE','RELIGIOUS','ENTERTAINMENT','EDUCATIONAL','FARM','ARCANE','LIBRARY'],weights=[45,7,6,6,2,2,4,2,3,2,2,2,3,2,2,3,2,2],k=1)[0]
  ward=min(wardCenters,key=lambda c:(x-c[0])**2+(y-c[1])**2)[2];street=localStreets[(k//11+int(x//200)+int(y//250))%len(localStreets)]
  num=100+(k//len(localStreets))*4+(k%4)
  nm=loc['name'] if loc else namefor(r,typ,used)
  if nm in used: nm=namefor(r,typ,used)
  used.add(nm)
  bid=k+1;addr=f'{num} {street} {r.choice(["Street","Lane","Road","Way","Walk","Quay","Terrace"])}, {ward}, {s["name"]}, {s["provinceName"]}'
  b={'id':bid,'name':nm,'type':typ,'material':r.choice(['STONE','WOOD','STONE_BRICK','BRASS','TIMBER']),
   'address':addr,'ward':ward,'street':street,'streetNumber':num,'x':x,'y':y,'path':coords,'purpose':loc['name'] if loc else ROLEJOB[typ],
   'description':f'{nm} is a visitable {typ.lower().replace("_"," ")} in {ward}. {s["biome"]} district of {s["name"]}.',
   'features':FEATURES[typ], 'hours':'Six-day Aza’raan campaign schedule; see named occupants and shifts',
   'sourceAliases':[loc['name']] if loc else [],'originalLocationSources':sorted(loc['origins']) if loc else [],
   'residentNpcIds':[],'employeeNpcIds':[],'visitorNpcIds':[],'goodsAndServices':[]}
  buildings.append(b)
  if loc:aliases[norm(loc['name'])]=bid;originalLinks[loc['name']]=bid
 byid={b['id']:b for b in buildings}
 bytype=collections.defaultdict(list)
 for b in buildings:bytype[b['type']].append(b)
 def choose(typ,ident=''):
  pool=bytype.get(typ) or buildings
  return pool[seed(ident+sid)%len(pool)]
 def mapalias(loc,typ=None):
  key=norm(loc)
  if key in aliases:return byid[aliases[key]]
  if ' / ' in key:key=key.split(' / ')[0]
  if key in aliases:return byid[aliases[key]]
  for k,idx in aliases.items():
   if k==key or (key and key in k):return byid[idx]
  return choose(typ or btype(loc),key)
 # Assign every source good/service including exact price, source designation and notes.
 for j,x in enumerate(catalog):
  vendor=mapalias(x.get('location','Shop'))
  vendor['goodsAndServices'].append({'id':f'{sid}-item-{j+1:04d}','category':x.get('category',''),'item':x.get('item',''),'price':x.get('price',''),'notes':x.get('notes',''),'sourceLocation':x.get('location','')})
 # Maintain EXACT original NPC records in world_bundle & settlement_npcs; overlay only map lookup here.
 converted=[]
 def weekly(n,homeId,jobId):
  out=[]
  for day in range(1,7):
   blocks=[]
   for block in n['schedule']:
    lo=block.get('location','')
    target=mapalias(lo)
    if ' / ' in lo:target=byid[homeId]
    start=block.get('start','00:00');end=block.get('end','21:00')
    if start==end:continue
    if 'Nebday' in str(block.get('days','')) and day==6: # default off day: keep source schedule but give actual leisure destination
     if target['id']==jobId:target=choose('MARKET',n['id']+str(day))
    blocks.append({'start':start,'end':end,'activity':block.get('activity',''),'buildingId':target['id'],'location':target['name'],
                   'sourceLocation':lo,'days':block.get('days','daily')})
    if n['id'] not in target['visitorNpcIds']:target['visitorNpcIds'].append(n['id'])
   out.append(blocks)
  return out
 for n in originals:
  home=mapalias(n['home'],'RESIDENCE');work=mapalias(n['job']['location'],btype(n['job']['location']))
  home['residentNpcIds'].append(n['id']);work['employeeNpcIds'].append(n['id'])
  converted.append({'id':n['id'],'name':n['name'],'sourceNpcId':n['id'],'source':'V7 existing NPC unchanged','homeBuildingId':home['id'],
  'workBuildingId':work['id'],'homeAddress':home['address'],'workAddress':work['address'],'weeklySchedule':weekly(n,home['id'],work['id']),
  'relationships':n['relationships'],'pronouns':n.get('pronouns',''),'race':n['race'],'age':n.get('age'),'job':n.get('job'),
  'genderIdentity':n.get('genderIdentity'),'deityAffiliations':n.get('deityAffiliations',[]),'traits':n.get('traits',[]),'aspiration':n.get('aspiration',''),
  'romance':n.get('romance',{}),'relationshipHistory':n.get('relationshipHistory',[]),'familyConnections':n.get('familyConnections',{}),
  'pronounForms':n.get('pronounForms',{}),'familyLanguage':n.get('familyLanguage',{}),'preferredHonorific':n.get('preferredHonorific','')})
 # New distinct cast assigned to real individual businesses / homes (not replacement for original named roster).
 max_cast=max(pop,round(target*.23));max_cast=min(380,max_cast)
 npcUsed={n['name'] for n in originals};additional=[]
 homePool=bytype['RESIDENCE'] or buildings
 workPool=[b for b in buildings if b['type']!='RESIDENCE' and b['type']!='PARK']
 r.shuffle(workPool)
 families=collections.defaultdict(list)
 for i in range(max_cast):
  fam=i//3;last=LAST[(fam+seed(sid))%len(LAST)]
  first=FIRST[(i*13+fam*17+seed(sid))%len(FIRST)];name=first+' '+last
  while name in npcUsed:name=FIRST[r.randrange(len(FIRST))]+' '+last+' '+r.choice(['II','III','IV','the Younger'])
  npcUsed.add(name)
  home=homePool[(fam*7+seed(sid))%len(homePool)];work=workPool[(i*13+seed(name))%len(workPool)]
  rp=r.choice(ALLOWED);rid=f'{sid}-resident-{i+1:04d}';families[fam].append(rid)
  pers={'id':rid,'name':name,'age':r.randint(18,82),'pronouns':r.choice(['he/him','she/her','they/them','xe/xem','ze/zir','ey/em']),
  'genderIdentity':r.choice(['Female','Male','Nonbinary','Agender','Genderfluid','Demi-Male','Demi-Female']),
  'race':{'name':rp,'category':'Approved Species'},'provinceId':s['provinceId'],'provinceName':s['provinceName'],
  'settlementId':sid,'settlementName':s['name'],'job':{'title':ROLEJOB[work['type']],'location':work['name']},
  'home':home['name'],'source':'V8 supplemental generated resident','homeBuildingId':home['id'],'workBuildingId':work['id'],
  'homeAddress':home['address'],'workAddress':work['address'],'traits':r.sample(['inquisitive','cautious','gentle','resourceful','jovial','thoughtful','stubborn','ambitious','kind','practical','witty','steadfast','dreamy','outgoing'],2),
  'aspiration':r.choice(['Learn a new craft','Raise a family','Protect the community','Find a better home','Explore the province','Build a business','Repair the family name']),
  'deityAffiliations':[],'householdId':f'{sid}-new-home-{fam:03d}',
  'relationships':{'familial':[],'romantic':[],'personal':[],'professional':[]},'weeklySchedule':[], 'regularVisits':[]}
  home['residentNpcIds'].append(rid);work['employeeNpcIds'].append(rid)
  for day in range(1,7):
   off=(day==6 and i%5!=0) or (day==5 and i%8==0)
   lounge=choose('TAVERN' if i%3==0 else 'MARKET',rid+str(day));social=choose('PARK' if i%4==0 else 'RELIGIOUS',name+str(day))
   course=[('00:00','06:00','Resting at home',home),('06:00','08:00','Breakfast and household errands',home),
           ('08:00','12:00','Leisure or visiting' if off else 'Working: '+ROLEJOB[work['type']],social if off else work),
           ('12:00','13:00','Market meal and errands',lounge),
           ('13:00','17:00','Day off: visiting friends' if off else 'Working: '+ROLEJOB[work['type']],social if off else work),
           ('17:00','20:00','Social visits and community activities',social),('20:00','24:00','Returning home and rest',home)]
   slots=[]
   for start,end,action,dest in course:
    slots.append({'start':start,'end':end,'activity':action,'buildingId':dest['id'],'location':dest['name'],'day':day})
    if rid not in dest['visitorNpcIds']:dest['visitorNpcIds'].append(rid)
   pers['weeklySchedule'].append(slots)
   if day==1:pers['regularVisits']=[lounge['id'],social['id']]
  additional.append(pers)
 # All new family, personal, romantic, professional bonds are reciprocal and refer to valid NPCs.
 id2={p['id']:p for p in additional}
 def tie(a,b,cat,term):
  if a==b:return
  for x,y in [(a,b),(b,a)]:
   v=id2[x]['relationships'][cat]
   if not any(t['npcId']==y for t in v):v.append({'npcId':y,'name':id2[y]['name'],'type':term})
 for fam,members in families.items():
  for i,a in enumerate(members):
   for b in members[i+1:]:tie(a,b,'familial','sibling' if fam%2==0 else 'relative')
 for i,p in enumerate(additional):
  if i%3==0 and i+1<len(additional):tie(p['id'],additional[i+1]['id'],'personal','trusted friend')
  if i%8==0 and i+3<len(additional):tie(p['id'],additional[i+3]['id'],'romantic','partners')
  if i%5==0:
   colleague=next((x for x in additional if x['id']!=p['id'] and x['workBuildingId']==p['workBuildingId']),None)
   if colleague:tie(p['id'],colleague['id'],'professional','colleague')
 # For each business, record actual opening occupants and all inventory items from the source catalogue.
 for b in buildings:
  b['residentNpcIds']=list(dict.fromkeys(b['residentNpcIds']))
  b['employeeNpcIds']=list(dict.fromkeys(b['employeeNpcIds']))
  b['visitorNpcIds']=list(dict.fromkeys(b['visitorNpcIds']))
  b['description']+=f' {len(b["residentNpcIds"])} residents, {len(b["employeeNpcIds"])} workers, {len(b["visitorNpcIds"])} weekly visitors.'
 variants={'waterfront':('coast' in norm(s['biome']) or 'river' in norm(s['biome']) or 'island' in norm(s['biome']) or 'sea' in norm(s['biome'])),'mountain':('mountain' in norm(s['biome']) or 'hill' in norm(s['biome']) or 'canyon' in norm(s['biome'])),'forest':('forest' in norm(s['biome']) or 'rain' in norm(s['biome'])),'arid':('desert' in norm(s['biome']) or 'badland' in norm(s['biome']))}
 landmarks=[]
 for _ in range(min(130,target//7)):
  x=r.randint(60,1860);y=r.randint(60,1860)
  if 0.6<math.hypot((x-960)/820,(y-960)/760)<1.33:landmarks.append([x,y,r.randrange(9,23)])
 out={'schema':'belavados.living.v8','settlementId':sid,'settlementName':s['name'],'provinceId':s['provinceId'],'provinceName':s['provinceName'],
      'type':s['type'],'biome':s['biome'],'governmentType':s['governmentType'],'dangerLevel':s['dangerLevel'],
      'source':'Belavados V7 named settlement + original NPCs + original immersive location/service library',
      'generation':{'engine':'deterministic Voronoi ward and footprint generator inspired by attached TownGeneratorOS Haxe architecture, not a compiled port','seed':seed(sid+'v8.3'),'mapSize':1920,'originalNpcCount':len(originals),'newNpcCount':len(additional),'sourceLocationCount':len(sourcePlaces),'sourceGoodsCount':len(catalog)},
      'map':{'viewBox':[0,0,1920,1920],'boundary':bound,'roads':roads,'terrain':variants,'landmarks':landmarks,'wards':[{'name':x[2],'x':x[0],'y':x[1]} for x in wardCenters]},
      'buildingCount':len(buildings),'npcCount':len(converted)+len(additional),'buildings':buildings,'npcs':converted+additional,
      'sourceLocationAliases':originalLinks, 'sourceNpcIds':[n['id'] for n in originals], 'calendar':{'daysPerWeek':6,'hoursPerDay':21,'sourceScheduleClock':'24h','displayClock':'Aza calendar'}}
 path=OUT/(sid+'.json');path.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
 return {'id':sid,'name':s['name'],'province':s['provinceName'],'type':s['type'],'biome':s['biome'],'buildings':len(buildings),'originalNpcCount':len(converted),'newNpcCount':len(additional),'goods':sum(len(b['goodsAndServices']) for b in buildings),'sourcePlaceAnchors':len(sourcePlaces),'file':f'json/living_maps/{sid}.json'}

def main():
 rows=[]
 for i,s in enumerate(SOURCES):
  row=make_map(s)
  if row:rows.append(row)
  if i%20==0:print('generated',i,'/',len(SOURCES),flush=True)
 index={'schema':'belavados.living.v8.index','count':len(rows),'base':'Belavados_V7.zip',
   'canonicalElarvess':{'id':'aelvanyr-elarvess','buildingCount':1312,'npcCount':2016,'preserved':True},'settlements':rows}
 (OUT/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2))
 print('DONE',len(rows),'buildings',sum(x['buildings'] for x in rows),'new NPCs',sum(x['newNpcCount'] for x in rows),'goods',sum(x['goods'] for x in rows),flush=True)
if __name__=='__main__':main()
