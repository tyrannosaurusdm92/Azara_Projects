
(function(){
  const U = window.Life SimulatorUtils;
  const E = {};
  E.exportJSON = state => U.downloadText(JSON.stringify(state,null,2), exportBase(state)+'.json');
  E.exportGeoJSON = state => U.downloadText(JSON.stringify(state.geojson||{type:'FeatureCollection',features:[]},null,2), exportBase(state)+'.geojson', 'application/geo+json');
  E.exportHTML = state => U.downloadText(E.buildSettlementHTML(state), exportBase(state)+'.html', 'text/html');
  E.exportDOCX = async state => U.downloadBlob(await E.buildDocxBlob(state), exportBase(state)+'.docx');
  E.exportZIP = async function(state){
    if(!window.JSZip){ U.status('ZIP export requires jszip.min.js.'); return; }
    const zip=new JSZip(); const base=exportBase(state); const data=zip.folder('data'); const geo=zip.folder('geojson'); const html=zip.folder('html'); const docx=zip.folder('docx'); const assets=zip.folder('assets'); const program=zip.folder('program_files');
    zip.file('README.txt', E.readme(state));
    data.file('settlement.json', JSON.stringify(state.settings||{},null,2));
    data.file('npc_data.json', JSON.stringify(state.npcs||[],null,2));
    data.file('location_data.json', JSON.stringify(state.locations||[],null,2));
    data.file('relationship_data.json', JSON.stringify(state.relationships||[],null,2));
    data.file('schedule_data.json', JSON.stringify(state.schedules||[],null,2));
    data.file('travel_history.json', JSON.stringify(state.travel||[],null,2));
    data.file('full_restore_state.json', JSON.stringify(state,null,2));
    geo.file(base+'.geojson', JSON.stringify(state.geojson||{type:'FeatureCollection',features:[]},null,2));
    html.file(base+'.html', E.buildSettlementHTML(state));
    docx.file(base+'.docx', await E.buildDocxBlob(state));
    if(state.mapImage?.dataUrl){ const [meta,b64]=state.mapImage.dataUrl.split(','); const ext=(meta.match(/image\/(\w+)/)||[])[1]||'png'; assets.file(`map_image.${ext}`, b64, {base64:true}); }
    const css = await fetchText('css/life_generator.css'); const app = await fetchText('js/life_generator_app.js'); const core = await fetchText('js/generator_core.js');
    program.file('life_generator.css', css || ''); program.file('life_generator_app.js', app || ''); program.file('generator_core.js', core || '');
    const blob=await zip.generateAsync({type:'blob'}); U.downloadBlob(blob, `${U.slug(state.settings?.settlementName || state.settings?.province || 'Life Simulator') || 'Life Simulator'}.zip`);
  };
  async function fetchText(path){ try{return await fetch(path).then(r=>r.ok?r.text():'');}catch{return '';} }
  function exportBase(state){ return U.normalizeFileName(state.settings?.settlementName || 'Life SimulatorSettlement', state.settings?.province || 'Province', '').replace(/\.$/,'') || 'Life SimulatorSettlement'; }
  E.buildSettlementHTML = function(state){
    const css = `body{font-family:Georgia,serif;background:#041014;color:#f5fbff;margin:0;padding:24px}h1{color:#00ffff}section{border:1px solid rgba(0,255,255,.35);border-radius:18px;padding:16px;margin:14px 0;background:rgba(8,22,28,.95)}.tag{display:inline-block;border:1px solid #e8c76e;color:#e8c76e;border-radius:999px;padding:3px 7px;margin:3px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}.card{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px}`;
    const s=state.settings||{};
    const locs=(state.locations||[]).slice(0,500).map(l=>`<div class="card"><b>${U.escapeHTML(l.name)}</b><br>${U.escapeHTML(l.category)} / ${U.escapeHTML(l.subcategory)}<br>${U.escapeHTML(l.description)}</div>`).join('');
    const npcs=(state.npcs||[]).slice(0,500).map(n=>`<div class="card"><b>${U.escapeHTML(n.name)}</b><br>${U.escapeHTML(n.race)} · ${U.escapeHTML(n.genderIdentity)} · ${U.escapeHTML(n.pronouns)}<br>${U.escapeHTML(n.employment)}<br>${U.escapeHTML(n.alignment?.summary||'')}</div>`).join('');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${U.escapeHTML(s.settlementName||'Life Simulator Export')}</title><style>${css}</style><script type="application/json" data-life_simulator-state>${escapeScript(JSON.stringify(state))}</script></head><body><h1>${U.escapeHTML(s.settlementName||s.province||'Life Simulator Export')}</h1><p>${U.escapeHTML(s.province||'')} · ${U.escapeHTML(s.settlementType||'')} · ${U.escapeHTML(s.biome||'')}</p><section><h2>Summary</h2><p>Locations: ${state.locations?.length||0}. NPCs: ${state.npcs?.length||0}. Relationships: ${state.relationships?.length||0}. Travel records: ${state.travel?.length||0}.</p>${(s.tags||[]).map(t=>`<span class="tag">${U.escapeHTML(t)}</span>`).join('')}</section><section><h2>Locations Preview</h2><div class="grid">${locs}</div></section><section><h2>NPC Preview</h2><div class="grid">${npcs}</div></section><section><h2>Restore Data</h2><p>The complete generated state is embedded as application/json in this HTML and can be imported back into the generator.</p></section></body></html>`;
  };
  function escapeScript(s){ return s.replace(/<\//g,'<\\/'); }
  E.buildDocxBlob = async function(state){
    const zip=new JSZip(); const s=state.settings||{};
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${p('Life Simulator Life Generator Export')}${p((s.settlementName||s.province||'Generated World')+' · '+(s.settlementType||'')+' · '+(s.biome||''))}${p('Locations: '+(state.locations?.length||0)+' | NPCs: '+(state.npcs?.length||0)+' | Relationships: '+(state.relationships?.length||0)+' | Travel Records: '+(state.travel?.length||0))}${p('Settings: '+JSON.stringify(s))}${p('Top Locations')}${(state.locations||[]).slice(0,80).map(l=>p(l.name+' — '+l.category+' / '+l.subcategory+' — '+l.description)).join('')}${p('Top NPCs')}${(state.npcs||[]).slice(0,120).map(n=>p(n.name+' — '+n.race+' — '+n.genderIdentity+' — '+(n.alignment?.summary||'')+' — '+n.employment)).join('')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.folder('word').file('document.xml',documentXml).folder('_rels').file('document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
    return zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  };
  function p(text){ return `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(String(text||''))}</w:t></w:r></w:p>`; }
  function xmlEscape(s){ return s.replace(/[<>&]/g, ch=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[ch])); }
  E.readme = state => `Life Simulator Life Generator Export\n\nThis ZIP preserves generated NPC records, locations, relationships, schedules, GeoJSON pins, travel histories, and restore data.\n\nOpen html/${exportBase(state)}.html for a readable settlement export. Import data/full_restore_state.json back into life_generator.html to restore all records without regeneration.\n`;
  window.Life SimulatorExporters = E;
})();
