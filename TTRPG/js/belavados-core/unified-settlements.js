/* One-document integration: World Forge + canonical province and settlement atlas. */
(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('belavados-unified-app');if(!root)return;
const generator=$('belavados-generator-page'),atlas=$('bvs-settlements-root'),mount=$('belavados-generator-target');
const nav=$('bvs-provinceNavItems'),provinceSelect=$('belavados-unified-province'),settlementSelect=$('belavados-unified-settlement');
const heading=$('belavados-unified-page-title'),subtitle=$('belavados-unified-page-description');
let page='generator';
const atlasApp=()=>window.BelavadosLivingWorld||null;
const provinces=()=>atlasApp()?.world?.provinces||window.BELAVADOS_WORLD?.provinces||[];
const selected=()=>atlasApp()?.ui||{};
const findProvince=id=>provinces().find(p=>p.id===id||p.name===id);
function context(){const ui=selected();return {page,provinceId:ui.province?.id||null,provinceName:ui.province?.name||null,settlementId:ui.settlement?.id||null,settlementName:ui.settlement?.name||null};}
function notify(type){try{if(parent!==window&&location.origin!=='null')parent.postMessage({source:'belavados-unified-index',type,context:context()},location.origin)}catch(error){console.warn('TTRPG context bridge unavailable',error)}}
function refreshPickers(){
 const ps=provinces();if(!ps.length)return;
 const sig=ps.map(p=>p.id).join('|');
 if(provinceSelect.dataset.signature!==sig){provinceSelect.replaceChildren(...ps.map(p=>new Option(p.name,p.id)));provinceSelect.dataset.signature=sig;}
 const p=selected().province||ps[0];provinceSelect.value=p.id;
 const ss=p.settlements||[],ssSig=ss.map(s=>s.id).join('|');
 if(settlementSelect.dataset.signature!==ssSig){settlementSelect.replaceChildren(...ss.map(s=>new Option(s.name+(s.type?' ('+s.type+')':''),s.id)));settlementSelect.dataset.signature=ssSig;}
 settlementSelect.disabled=!ss.length;settlementSelect.value=selected().settlement?.id||ss[0]?.id||'';
 $('belavados-unified-open-settlement').disabled=!p;
}
function feedGenerator(){
 const ui=selected();if(!ui.province)return;
 const province=$('province'),name=$('settlementName'),government=$('government'),size=$('size');
 if(province)province.value=ui.province.name;
 if(name&&ui.settlement)name.value=ui.settlement.name;
 if(government&&ui.settlement?.governmentType)government.value=ui.settlement.governmentType;
 const wanted=ui.settlement?.size||ui.settlement?.type;
 const option=size&&[...size.options].find(x=>x.text.toLowerCase()===String(wanted||'').toLowerCase());
 if(option&&size.value!==option.value){size.value=option.value;size.dispatchEvent(new Event('change',{bubbles:true}));}
}
function refreshNav(){
 nav.querySelectorAll('[data-bvs-generator],[data-province-id]').forEach(b=>{
  const isActive=b.hasAttribute('data-bvs-generator')?page==='generator':page==='province'&&b.dataset.provinceId===selected().province?.id;
  b.classList.toggle('active',isActive);b.setAttribute('aria-current',isActive?'page':'false');
 });
}
function showPage(destination){
 page=destination==='province'?'province':'generator';
 root.dataset.view=page;generator.hidden=page!=='generator';atlas.hidden=page!=='province';
 const ui=selected();heading.textContent=page==='generator'?'Generator':ui.province?.name||'Province';
 subtitle.textContent=page==='generator'?'Create a settlement or choose an existing province and settlement to provide its source information.':(ui.settlement?.name||'Choose settlement')+' · Province settlement records';
 if(page==='generator'){feedGenerator();if(location.hash.startsWith('#province/'))history.replaceState(null,'',location.pathname+location.search);}
 refreshPickers();refreshNav();
 document.dispatchEvent(new CustomEvent('belavados:unified-viewchange',{detail:context()}));notify('viewchange');return context();
}
function openProvince(id){
 const p=findProvince(id),api=atlasApp();if(!p||!api)return false;
 api.changeProvince(p);showPage('province');return true;
}
function openSettlement(provinceId,settlementId){
 const api=atlasApp();if(!api)return false;
 const p=findProvince(provinceId)||api.ui.province;if(!p)return false;
 if(api.ui.province?.id!==p.id)api.changeProvince(p);
 if(settlementId&&p.settlements?.some(s=>s.id===settlementId))api.changeSettlement(settlementId);
 showPage('province');return true;
}
function openGenerator(){showPage('generator');return true;}
function updatedByAtlas(){
 refreshPickers();if(page==='province'){heading.textContent=selected().province?.name||'Province';subtitle.textContent=(selected().settlement?.name||'Choose settlement')+' · Province settlement records';}refreshNav();notify('contextchange');
}
window.BelavadosUnified=Object.freeze({getContext:context,getAtlas:atlasApp,getForge:()=>window.BelavadosWorldForge||null,openGenerator,openProvince,openSettlement,refresh:()=>{refreshPickers();refreshNav();return context();}});
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.source!=='belavados-ttrpg-host')return;
 const d=event.data;
 if(d.action==='generator')openGenerator();
 else if(d.action==='province')openProvince(d.provinceId);
 else if(d.action==='settlement')openSettlement(d.provinceId,d.settlementId);
});
function init(){
 const forgeRoot=$('belavados-worldforge-root');
 if(forgeRoot&&forgeRoot.parentElement!==mount)mount.appendChild(forgeRoot);
 else if(!forgeRoot)window.BelavadosWorldForge?.mount?.(mount);
 refreshPickers();
 showPage(location.hash.startsWith('#province/')?'province':'generator');
 nav.addEventListener('click',e=>{
  if(e.target.closest('[data-bvs-generator]'))openGenerator();
  else if(e.target.closest('[data-province-id]'))showPage('province');
 });
 provinceSelect.addEventListener('change',e=>{const p=findProvince(e.target.value);if(p)atlasApp()?.changeProvince(p);feedGenerator();refreshPickers();});
 settlementSelect.addEventListener('change',e=>{atlasApp()?.changeSettlement(e.target.value);feedGenerator();refreshPickers();});
 $('belavados-unified-open-settlement').addEventListener('click',()=>openSettlement(provinceSelect.value,settlementSelect.value));
 $('belavados-unified-open-generator').addEventListener('click',openGenerator);
 document.addEventListener('belavados:viewchange',updatedByAtlas);
 window.addEventListener('hashchange',()=>{
  const m=decodeURIComponent(location.hash).match(/^#province\/([^/]+)(?:\/settlement\/([^/]+))?/);
  if(m)openSettlement(m[1],m[2]);
 });
 notify('ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();