
(function(){
const {toast}=BelUtils;
const files={raceCategories:'data/race_categories.json',generatorData:'data/generator_data.json',locationCatalogue:'data/location_catalogue.json',timeData:'data/provinces.json',defaultSettlements:'data/default_settlements.json',manifest:'data/site_manifest.json',playerSettlements:'data/player_settlements.json'};
async function getJSON(key,path){try{const res=await fetch(path,{cache:'no-cache'}); if(!res.ok) throw new Error(res.status); return await res.json();}catch(e){const boot=window.BELAVADOS_BOOTSTRAP_DATA||{}; if(boot[key]) return boot[key]; if(key==='playerSettlements') return {schema:'belavados.player.map.bundle.v1',settlements:[]}; throw e;}}
async function loadAll(){const out={}; for(const [k,p] of Object.entries(files)) out[k]=await getJSON(k,p); normalize(out); return out;}
function normalize(data){
 data.provinceByName={}; (data.timeData.provinces||[]).forEach(p=>data.provinceByName[p.province]=p);
 data.settlementsByProvince={}; (data.defaultSettlements||[]).forEach(s=>{(data.settlementsByProvince[s.province] ||= []).push(s);});
 data.biomes=BelUtils.uniq((data.generatorData.settlementTypes||[]).map(t=>t.variant||t.terrain).concat(['Forest','Mountain','Swamp Marsh','Surface Docks Coastal','Grassland Plains','Deep Sea','Island','Lake River','Desert Badlands','Hill Plateau','Rainforest','Canyon Valley'])).sort();
 data.sizes=BelUtils.uniq((data.generatorData.settlementTypes||[]).map(t=>t.size)).sort((a,b)=>['Village','Town','City','Capital City'].indexOf(a)-['Village','Town','City','Capital City'].indexOf(b));
 data.allRaces=(data.raceCategories||[]).flatMap(c=>(c.races||[]).map(r=>({race:r,category:c.category,god:c.god,description:c.description})));
}
window.BelData={loadAll};
})();
