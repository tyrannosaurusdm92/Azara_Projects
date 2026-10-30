#!/usr/bin/env python3
"""Identity, lore and cross-cast relationship enrichment; original V7 canon untouched."""
from pathlib import Path
import json,random,hashlib,collections
ROOT=Path(__file__).resolve().parents[1]
worldjs=(ROOT/'js/world_bundle.js').read_text();W=json.loads(worldjs[worldjs.index('{'):worldjs.rfind('}')+1])
GODS=W['pantheonCanonicalNames'];FILES=[p for p in (ROOT/'json/living_maps').glob('*.json') if p.stem!='index']
NOUNS=['warm gatherings','craft apprenticeship','roadside trade','elder stories','observing the stars','garden walks','festival music','family meals','fishing days','the harvest','restoration work','guild meetings','river journeys','barter negotiations','scholarly debates','steamwork repairs']
DICT={'he/him':('he','him','his','his','himself'),'she/her':('she','her','her','hers','herself'),'they/them':('they','them','their','theirs','themself'),'xe/xem':('xe','xem','xyr','xyrs','xemself'),'ze/zir':('ze','zir','zir','zirs','zirself'),'ey/em':('ey','em','eir','eirs','emself')}
KIN={'male':('Father','Son','Brother','Husband','Uncle'),'female':('Mother','Daughter','Sister','Wife','Aunt'),'neutral':('Parent','Child','Sibling','Spouse','Pibling')}
def fill(n,r,settlement):
 gender=r.choices(['Cis-Male','Cis-Female','Trans-Male','Trans-Female','Demi-Male','Demi-Female','Agender','Nonbinary','Genderfluid'],[12,12,6,6,8,8,10,21,17])[0]
 if gender in ('Cis-Male','Trans-Male'):p='he/him'
 elif gender in ('Cis-Female','Trans-Female'):p='she/her'
 elif gender=='Demi-Male':p=r.choices(['he/him','they/them','xe/xem','ey/em'],[65,23,7,5])[0]
 elif gender=='Demi-Female':p=r.choices(['she/her','they/them','ze/zir','ey/em'],[65,23,7,5])[0]
 else:p=r.choice(['they/them','ze/zir','ey/em','xe/xem','he/him','she/her'])
 n['genderIdentity']=gender;n['pronouns']=p
 terms=DICT[p];n['pronounForms']={'subject':terms[0],'object':terms[1],'possessiveDeterminer':terms[2],'possessivePronoun':terms[3],'reflexive':terms[4]}
 kind='male' if gender.endswith('Male') and not gender.endswith('Female') else 'female' if gender.endswith('Female') else 'neutral'
 words=KIN[kind]
 n['familyLanguage']={'parent':words[0],'child':words[1],'sibling':words[2],'spouse':words[3],'parentSibling':words[4]}
 n['kinshipTerms']=n['familyLanguage']
 n['preferredHonorific']={'male':'Mr.','female':'Ms.','neutral':'Mx.'}[kind];n['formalHonorific']=n['preferredHonorific']
 n['everydayTitle']='Neighbor';n['platonicEndearment']=r.choice(['Friend','Neighbor','Comrade','Dear one','Good soul'])
 n['romanticEndearment']=r.choice(['Beloved','Sweetheart','Dearest'])
 n['deityAffiliations']=r.sample(GODS,min(len(GODS),r.choices([0,1,2],[3,7,2])[0]))
 n['biography']=f"{n['name']} lives in {settlement['settlementName']} and works as a {n['job']['title'].lower()} at {n['job']['location']}. Known for being {', '.join(n['traits'])}, {n['name'].split()[0]} enjoys {r.choice(NOUNS)} and hopes to {n['aspiration'].lower()}. Regular routes pass between home, work, community spaces, and friends across the six-day week."
 n['personality']={'traits':n['traits'],'aspiration':n['aspiration'],'socialStyle':r.choice(['quietly observant','welcoming','reserved but loyal','lively and talkative','cautious at first','generous with time'])}
 n['romance']={'currentStatus':'single','currentPartnerIds':[],'styles':[]}
 n['relationshipHistory']=[];n['familyConnections']={'parentIds':[],'childIds':[],'siblingIds':[]}
 n['languageProfile']={'primary':'Local provincial lingua franca','additional':[], 'pronounForms':n['pronounForms']}
 n['scheduleProvenance']='Generated V8 district/home/work routes; six-day canonical campaign calendar, preserved separately from V7 source.'

def tie(a,b,cat,kind):
 for x,y in ((a,b),(b,a)):
  dest=x.setdefault('relationships',{}).setdefault(cat,[])
  if not any(t.get('npcId')==y['id'] for t in dest):dest.append({'npcId':y['id'],'name':y['name'],'type':kind,'source':'V8 new reciprocal supplementary link'})

for idx,fn in enumerate(FILES):
 p=json.loads(fn.read_text());sid=p['settlementId'];r=random.Random(int(hashlib.sha256((sid+'cast-v8.1').encode()).hexdigest()[:12],16));
 existing=[n for n in p['npcs'] if n.get('sourceNpcId')];new=[n for n in p['npcs'] if not n.get('sourceNpcId')];
 for n in new:fill(n,r,p)
 # Keep existing authored familial / romantic bonds untouched. Add only reciprocal
 # community and employment connections to existing NPCs in the *overlay*.
 bywork=collections.defaultdict(list)
 for n in existing:bywork[n['workBuildingId']].append(n)
 for i,n in enumerate(new):
  if not existing:continue
  if i%3==0:
   match=(bywork[n['workBuildingId']] or [existing[(i*7+idx)%len(existing)]])[0]
   tie(n,match,'professional' if n['workBuildingId']==match['workBuildingId'] else 'personal','colleague' if n['workBuildingId']==match['workBuildingId'] else 'community acquaintance')
  elif i%7==0:
   match=existing[(i*3+idx)%len(existing)];tie(n,match,'personal','local friend')
 # Give previously created new-new romantic partners explicit current agreements.
 lookup={n['id']:n for n in new}
 for n in new:
  partners=[t['npcId'] for t in n.get('relationships',{}).get('romantic',[]) if t['npcId'] in lookup]
  if partners:
   n['romance']={'currentStatus':'partnered','currentPartnerIds':partners,'styles':['consensual dating']}
   for t in n['relationships']['romantic']:
    t.update(status='current',mutualConsent=True,agreement='consensual dating')
 fn.write_text(json.dumps(p,ensure_ascii=False,separators=(',',':')))
 if idx%35==0:print(idx,'/',len(FILES),flush=True)
print('augmented',len(FILES), 'with approved races, identity, biographies, reciprocal social links',flush=True)
