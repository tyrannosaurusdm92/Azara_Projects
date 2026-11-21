/* Canonical author-supplied Rise of Ruqorakai province/settlement origin data. */
(function(){'use strict';const source=window.RUQORAKAI_SETTLEMENT_AUTHORITY,world=window.BELAVADOS_WORLD;
if(!source||!world||!Array.isArray(world.provinces))throw Error('Missing province or settlement authority');
const byName=new Map(world.provinces.map(p=>[p.name,p]));const ss=new Map(world.provinces.flatMap(p=>(p.settlements||[]).map(s=>[s.id,s])));
const pr=new Map(source.provinces.map(p=>[p.id,p]));const grouped=new Map(source.provinces.map(p=>[p.id,[]]));
for(const r of source.provinces){const p=byName.get(r.name);if(!p)throw Error('Missing province '+r.name);const legacy=p.id;
p.legacyProvinceId=legacy===r.id?(p.legacyProvinceId||null):legacy;p.originalGovernmentType=p.originalGovernmentType||p.governmentType;p.id=r.id;p.governmentType=r.government;
p.capitalSettlementId=r.capitalSettlementId;p.capitalName=r.capitalName;p.settlementCount=r.settlementCount;p.townAvailable=r.townAvailable;}
for(const r of source.settlements){const s=ss.get(r.id),p=pr.get(r.provinceId);if(!s||!p)throw Error('Missing settlement '+r.id);
const legacy=s.provinceId;if(r.relocated&&s.coordinates&&!s.originalCoordinates)s.originalCoordinates={...s.coordinates};
Object.assign(s,{name:r.name,provinceId:r.provinceId,provinceName:p.name,province:p.name,type:r.type,size:r.type,isCapital:r.isCapital,originalProvinceId:r.originalProvinceId,originalType:r.originalType,relocated:r.relocated,reclassified:r.reclassified,classificationStatus:r.classificationStatus,designationStatus:r.designationStatus,...(legacy===r.provinceId?{}:{legacyProvinceId:legacy})});grouped.get(r.provinceId).push(s);}
if(ss.size!==source.settlements.length)throw Error('Settlement count mismatch');
for(const r of source.provinces){const p=byName.get(r.name);p.settlements=grouped.get(r.id);if(p.settlements.length!==r.settlementCount||p.settlements.filter(s=>s.isCapital).length!==1)throw Error('Province distribution mismatch '+r.id);}
const aliases=source.provinceIdAliases||{};
const canonicalProvinceId=id=>aliases[id]||id;
const resolveProvince=id=>world.provinces.find(p=>p.id===canonicalProvinceId(id)||p.name===id)||null;
window.RuqorakaiProvinceAuthority=Object.freeze({data:source,aliases,canonicalProvinceId,resolveProvince});window.RUQORAKAI_SETTLEMENTS_APPLIED=true;
})();
