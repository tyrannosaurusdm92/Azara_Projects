/* Re-group existing living-world settlements without changing their original IDs or map data. */
(function(){
 'use strict';
 const source=window.RUQORAKAI_SETTLEMENT_AUTHORITY,world=window.BELAVADOS_WORLD;
 if(!source||!world||!Array.isArray(world.provinces))throw new Error('Ruqorakai province data missing');
 const ps=new Map(world.provinces.map(p=>[p.id,p])),ss=new Map(world.provinces.flatMap(p=>(p.settlements||[]).map(s=>[s.id,s]))),groups=new Map(world.provinces.map(p=>[p.id,[]]));
 for(const r of source.settlements){
   const s=ss.get(r.id),p=ps.get(r.provinceId);if(!s||!p)throw new Error('Missing settlement '+r.id);
   if(r.relocated&&s.coordinates&&!s.originalCoordinates)s.originalCoordinates={...s.coordinates};
   Object.assign(s,{name:r.name,provinceId:r.provinceId,provinceName:p.name,province:p.name,
    type:r.type,size:r.type,isCapital:r.isCapital,originalProvinceId:r.originalProvinceId,originalType:r.originalType,
    relocated:r.relocated,reclassified:r.reclassified,classificationStatus:r.classificationStatus,designationStatus:r.designationStatus});
   groups.get(r.provinceId).push(s);
 }
 if(ss.size!==source.settlements.length)throw new Error('Settlement coverage failed');
 for(const r of source.provinces){
   const p=ps.get(r.id);if(!p)throw new Error('Missing province '+r.id);
   p.originalGovernmentType=p.originalGovernmentType||p.governmentType;
   Object.assign(p,{governmentType:r.government,capitalSettlementId:r.capitalSettlementId,capitalName:r.capitalName,settlements:groups.get(r.id),settlementCount:r.settlementCount,townAvailable:r.townAvailable});
   if(p.settlements.length!==r.settlementCount||p.settlements.filter(s=>s.isCapital).length!==1)throw new Error('Province count incorrect '+r.id);
 }
 window.RUQORAKAI_SETTLEMENTS_APPLIED=true;
})();