/* 2026 Pass 3: Attached settlement_generator.html interface integration.
   No NPCs, locations, relationships or approved race data are replaced. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const app=window.BelavadosLivingWorld;
if(!app||!window.BelavadosSettlementDashboard)return;
const maps=new Map();let pdfObjectUrl=null;
let activeId=null,activeType='atlas';
const canvas=$('worldMapCanvas'), img=$('worldTemplateMapImage'),frame=$('worldTemplateMapFrame');
const status=$('worldMapTemplateStatus');
function settlementKey(){return app.ui.settlement?.id||null;}
function stop(){img.hidden=true;frame.hidden=true;canvas.hidden=false;frame.removeAttribute('srcdoc');img.removeAttribute('src');activeType='atlas';}
function restore(){stop();status.textContent='Showing the preserved provincial atlas with its existing, named settlements.';}
function showTemplate(entry){stop();if(!entry){status.textContent='Province atlas shown. Import an HTML or image template to preview it here.';return;}
  canvas.hidden=true;activeType=entry.type;
  if(entry.type==='html'){frame.srcdoc=entry.text;frame.hidden=false;}
  else if(entry.type==='image'){img.src=entry.url;img.hidden=false;}
  status.textContent='Viewing '+entry.name+' in this settlement. NPCs, services and locations below are still the original, generated records.';
}
async function loadFiles(files){const list=[...files||[]];if(!list.length)return;const others=[];let messages=[];
for(const file of list){const ext=file.name.toLowerCase().split('.').pop();
 if(['htm','html'].includes(ext)||file.type==='text/html'){
   const key=settlementKey();if(!key){messages.push('Choose a named settlement before attaching a map.');continue;}
   const text=await file.text();maps.set(key,{type:'html',name:file.name,text});showTemplate(maps.get(key));messages.push('Opened HTML map '+file.name+' in a sandboxed frame (scripts disabled).');
 }else if(file.type.startsWith('image/')||['png','jpg','jpeg','gif','webp','svg'].includes(ext)){
   const key=settlementKey();if(!key){messages.push('Choose a named settlement before attaching a map.');continue;}
   const prev=maps.get(key);if(prev?.url)URL.revokeObjectURL(prev.url);
   const url=URL.createObjectURL(file);maps.set(key,{type:'image',name:file.name,url});showTemplate(maps.get(key));messages.push('Opened image map '+file.name+'.');
 }else if(ext==='pdf'||file.type==='application/pdf'){
   if(pdfObjectUrl)URL.revokeObjectURL(pdfObjectUrl);pdfObjectUrl=URL.createObjectURL(file);$('worldPdfFrame').src=pdfObjectUrl;$('worldPdfModal').hidden=false;messages.push('Opened PDF reference '+file.name+'.');
 }else{others.push(file);}
}
if(others.length){const input=$('importNpcDocsFile');if(input&&typeof DataTransfer!=='undefined'){
 try{const dt=new DataTransfer();others.forEach(f=>dt.items.add(f));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));messages.push('Sent '+others.length+' JSON/document file(s) to the original simulator import tool.');}catch(err){messages.push('Open NPC & Location Tools to import remaining JSON files.');}
}else messages.push('Open NPC & Location Tools to import '+others.length+' JSON/document files.');}
$('worldUploadStatus').textContent=messages.join(' ');if(messages.length)status.textContent=messages.join(' ');
}
$('worldMapTemplateInput').addEventListener('change',e=>{loadFiles(e.target.files).catch(err=>status.textContent='Unable to read uploaded template: '+err.message);});
$('worldRestoreAtlas').addEventListener('click',restore);
$('worldClosePdf').addEventListener('click',()=>{$('worldPdfModal').hidden=true;});
$('worldPdfModal').addEventListener('click',e=>{if(e.target===$('worldPdfModal'))$('worldPdfModal').hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('worldPdfModal').hidden=true;});
// Override the previous generic drop-zone routing, for HTML, images and PDFs ONLY.
// Capture lets us stop the old listener before it forwards these visual references to the NPC importer.
const drop=$('worldDropZone'),input=$('worldMultiFileInput');
drop.addEventListener('drop',e=>{const fs=[...e.dataTransfer?.files||[]];if(fs.some(f=>/\.(html?|png|jpe?g|webp|gif|svg|pdf)$/i.test(f.name))){e.preventDefault();e.stopImmediatePropagation();drop.classList.remove('dragover');loadFiles(fs).catch(err=>status.textContent=err.message);}},true);
input.addEventListener('change',e=>{const fs=[...e.target.files||[]];if(fs.some(f=>/\.(html?|png|jpe?g|webp|gif|svg|pdf)$/i.test(f.name))){e.stopImmediatePropagation();loadFiles(fs).catch(err=>status.textContent=err.message);}},true);
// Restore the appropriate uploaded template when changing provinces/settlements.
document.addEventListener('belavados:viewchange',()=>{const k=settlementKey();if(k!==activeId){activeId=k;showTemplate(maps.get(k));}});
activeId=settlementKey();showTemplate(maps.get(activeId));
// Use source province UTC offset by default. Only optional, user-entered values are stored.
const key='belavados.template.utcOverrides.v3';let offsets={};try{offsets=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
function offsetToMinutes(s){const m=String(s||'').trim().match(/^(?:UTC)?\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);if(!m)return null;const h=Number(m[2]),mm=Number(m[3]||0);if(h>14||mm>59)return null;return (m[1]==='-'?-1:1)*(h*60+mm);}
function refreshLocalClock(){if(window.AzaCalendar){const v=offsets[settlementKey()]||'';if(document.activeElement!==$('worldUtcOffsetInput'))$('worldUtcOffsetInput').value=v;return;}const id=settlementKey(),p=app.ui.province,s=app.ui.settlement;const txt=offsets[id]||s?.timeZone||p?.primaryUtc||'UTC+0';const mins=offsetToMinutes(txt);if(document.activeElement!==$('worldUtcOffsetInput'))$('worldUtcOffsetInput').value=offsets[id]||'';if(mins===null)return;
 const date=new Date(Date.now()+mins*60000),d=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);if($('worldBelavadosClock').textContent!==d)$('worldBelavadosClock').textContent=d;const label=txt+(offsets[id]?' • Local override':' • Source UTC offset');if($('worldClockSource').textContent!==label)$('worldClockSource').textContent=label;}
$('worldApplyUtcOffset').addEventListener('click',()=>{const s=settlementKey();if(!s)return;const v=$('worldUtcOffsetInput').value.trim();if(v && offsetToMinutes(v)===null){$('worldClockSource').textContent='Use UTC-5, UTC+7 or -05:00.';return;}if(v)offsets[s]=v;else delete offsets[s];try{localStorage.setItem(key,JSON.stringify(offsets));}catch{}refreshLocalClock();$('worldUtcOffsetInput').title=v?'Earth reference offset stored; Aza’raan clock is independent.':'Earth reference override cleared; Aza’raan clock is independent.';});
document.addEventListener('belavados:viewchange',refreshLocalClock);
// Re-run after the dashboard's own periodic clock update, without introducing a second timer.
const clockNode=$('worldBelavadosClock');if(typeof MutationObserver!=='undefined'){let active=false;new MutationObserver(()=>{if(active||!offsets[settlementKey()])return;active=true;refreshLocalClock();active=false;}).observe(clockNode,{childList:true,characterData:true,subtree:true});}
refreshLocalClock();
window.BelavadosTemplatePass3={loadFiles,restore,backgroundImageCss:'css/steampunk-background.css'};
})();
