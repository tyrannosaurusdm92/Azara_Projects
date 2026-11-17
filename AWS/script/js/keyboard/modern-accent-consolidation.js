/* Semantic-only 24→12 accent consolidation. No glyph/Unicode or historical-era changes. */
(() => {
'use strict';
const root='json/keyboard/accent-consolidation.json';
function el(tag, value) { const n=document.createElement(tag); if(value!==undefined)n.textContent=String(value);return n; }
function makeTable(data){
 const host=document.getElementById('panel-evolution');
 if(!host || document.getElementById('aza-accent-consolidation')) return;
 const section=el('section');section.id='aza-accent-consolidation';section.className='origin-inventory';
 section.setAttribute('aria-labelledby','aza-accent-consolidation-title');
 section.append(el('h2','Accent evolution: 24 historical meanings → 12 Modern marks'));
 section.querySelector('h2').id='aza-accent-consolidation-title';
 section.append(el('p','The Archaic, Classical and Traditional systems retain all 24 original accent definitions. Modern reuses 12 mark shapes, each with its existing meaning and an inherited, contextual reading. Historical consonant codas are not automatically inserted by a single Modern accent; the host, subscript and other diacritics determine the actual IPA.'));
 const outer=el('div');outer.className='table-scroll';
 const table=el('table'),head=el('thead'),tr=el('tr');
 for(const title of ['Modern accent / Khmer','Existing Modern meaning','Added inherited meaning','Historical marks preserved'])tr.append(el('th',title));
 head.append(tr);table.append(head);
 const tbody=el('tbody');
 for(const entry of data.marks){
   const row=el('tr');
   const h=el('td');const strong=el('strong',entry.name+' · '+entry.unicode);h.append(strong);row.append(h);
   row.append(el('td',entry.primary));
   const sec=el('td');sec.append(el('span',entry.secondary),el('small',' '+entry.context));row.append(sec);
   row.append(el('td',entry.historical_sources.map(s=>s.name+' ('+s.id+'; '+s.ipa+')').join(' · ')));
   tbody.append(row);
 }
 table.append(tbody);outer.append(table);section.append(outer);
 const target=host.querySelector('.origin-inventory');if(target)target.before(section);else host.append(section);
}
function annotatePanel(data){
 const panel=document.getElementById('panelContent'),era=document.getElementById('eraSelect');
 if(!panel||era?.value!=='Modern')return;
 const byId=new Map(data.marks.map(m=>[m.id,m]));
 panel.querySelectorAll('button[data-mark]').forEach(button=>{
   const m=byId.get(button.dataset.mark);if(!m)return;
   const content=m.primary+' Added inherited meaning: '+m.secondary+' '+m.context;
   const previous=button.title||m.name;
   if(!previous.includes('Added inherited meaning:'))button.title=previous+' — '+content;
   button.setAttribute('aria-description',content);
 });
}
async function init(){
 try{
  const response=await fetch(root,{cache:'no-cache'});if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();
  if(data.modern_mark_count!==12||data.historical_source_count!==24||data.marks?.length!==12)throw Error('unexpected accent counts');
  window.AZA_MODERN_ACCENT_CONSOLIDATION=data;
  window.AZA_CONFIG&&(window.AZA_CONFIG.modernAccentConsolidation=data.marks);
  window.AZA_DATA&&(window.AZA_DATA.modernAccentConsolidation=data.marks);
  makeTable(data);
  const panel=document.getElementById('panelContent');
  if(panel){const observer=new MutationObserver(()=>annotatePanel(data));observer.observe(panel,{childList:true,subtree:true});}
  document.getElementById('eraSelect')?.addEventListener('change',()=>annotatePanel(data));
  annotatePanel(data);
 }catch(err){console.warn('Accent consolidation reference unavailable:',err);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
