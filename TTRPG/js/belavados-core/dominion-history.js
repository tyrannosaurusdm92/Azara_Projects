/* Aza'ra canonical Classical-era Dominion chronology, with author-corrected detonation target. */
(function(){
'use strict';
const data=window.AZARA_DOMINION_HISTORY;
if(!data||data.continentDetonationTarget!=='Belavadós')throw new Error('Dominion chronology violates Belavadós destruction canon');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLabel=value=>String(value||'').replace(/[^A-Za-z0-9]/g,'').toLowerCase();
const hooks=[
  'A Dominion procurement charter tries to secure exclusive access to local crafting materials.',
  'An industrial envoy offers transport contracts in exchange for political authority.',
  'Arcane surveyors seek historical information about this settlement’s leyline access.',
  'A trade consortium pressures the local guild to use Dominion routes and toll collection.',
  'A courier network carries rival intelligence reports through this community.',
  'A border official requests passenger records under the pretense of safer skyship travel.',
  'A clandestine mutual-aid network shelters families displaced by industrial expansion.',
  'A temple council debates whether Dominion-supported workshops threaten sacred independence.',
  'A smithing or alchemical workshop weighs the benefits and risks of Dominion machinery.',
  'A merchant household receives a disputed invoice bearing an Iron Council seal.'
];
function seedId(s){let h=2166136261;for(const x of String(s||'')){h^=x.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function scenarioFor(province,settlement,location){
 const id=[province?.id||province?.name,settlement?.id||settlement?.name,location?.id||location?.buildingId||location?.name].filter(Boolean).join('/');
 return hooks[seedId(id)%hooks.length];
}
function locationContext(settlement,place){
 const province=window.BelavadosLivingWorld?.ui?.province||null;
 return '<details class="aza-dom-local"><summary>Classical-era Dominion encounter</summary><p><strong>Playable scenario seed — not recorded canon:</strong> '+esc(scenarioFor(province,settlement,place))+'</p><p>The above hook occurs before the 276 CE destruction of Belavadós. This map preserves an historical reconstruction, not a claim of an inhabited post-destruction site.</p></details>';
}
function render(province,settlement){
 const ui=window.BelavadosLivingWorld?.ui;
 province=province||ui?.province;settlement=settlement||ui?.settlement;
 const target=document.getElementById('bvs-explorerOverview');if(!target||!province)return;
 let section=target.querySelector('#bvs-ironDominionChronicle');
 if(!section){section=document.createElement('section');section.id='bvs-ironDominionChronicle';section.className='explorer-pane aza-dominion-era';target.append(section);}
 const story=data.timeline;
 section.innerHTML='<details open><summary><b>Classical Era · Iron Dominion (65–289 CE)</b></summary>'+
  '<p><strong>Canonical outcome:</strong> Belavadós was destroyed in 276 CE by the Iron Dominion’s anti-matter and dark-matter weapon. The Dominion finally collapsed in 289 CE. Tzaphaer was not the target.</p>'+
  '<p><strong>'+esc(province.name)+'</strong>'+(settlement?' · <b>'+esc(settlement.name)+'</b>':'')+' · A pre-destruction historical settlement record. Sites, NPC schedules and prices can be examined as reconstructed campaign history.</p>'+
  '<div class="aza-dom-events">'+story.map(event=>'<article><time>'+event.startCE+(event.endCE!==event.startCE?'–'+event.endCE:'')+' CE</time><div><strong>'+esc(event.title)+'</strong><p>'+esc(event.text)+'</p>'+(event.kind==='scenario'?'<small>Optional worldbuilding scenario</small>':'')+'</div></article>').join('')+'</div>'+
  '<details><summary>Neighboring continents and trade routes</summary>'+Object.entries(data.regionalCanons).map(([name,r])=>'<p><b>'+esc(name)+'</b> — '+esc(r.note)+'</p>').join('')+'</details>'+
  '<details><summary>Local Classical encounter seed</summary><p><strong>Optional:</strong> '+esc(scenarioFor(province,settlement))+'</p></details></details>';
}
document.addEventListener('belavados:viewchange',()=>setTimeout(()=>render(),0));
document.addEventListener('belavados:unified-viewchange',()=>setTimeout(()=>render(),0));
document.addEventListener('hashchange',()=>setTimeout(()=>render(),0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>render());else render();
window.BelavadosDominionHistory=Object.freeze({data,render,scenarioFor,locationContext});
})();