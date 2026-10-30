
(function(){
  const U = window.Life SimulatorUtils;
  const Importers = {};
  Importers.readFile = async function(file){
    const lower = file.name.toLowerCase();
    if(file.type.startsWith('image/')) return {kind:'image', name:file.name, file, text:'', dataUrl:await readAsDataURL(file)};
    if(lower.endsWith('.json') || lower.endsWith('.geojson')) return parseJsonFile(file);
    if(lower.endsWith('.docx')) return parseDocxFile(file);
    if(lower.endsWith('.pdf')) return parsePdfFile(file);
    if(lower.endsWith('.html') || lower.endsWith('.htm')) return parseHtmlFile(file);
    return {kind:'text', name:file.name, text:await file.text(), data:null, warnings:['Unknown extension; read as text.']};
  };
  function readAsDataURL(file){ return new Promise((resolve,reject)=>{const fr=new FileReader(); fr.onload=()=>resolve(fr.result); fr.onerror=reject; fr.readAsDataURL(file);}); }
  async function parseJsonFile(file){
    const text = await file.text();
    try { const data=JSON.parse(text); return {kind: isGeoJson(data)?'geojson':'json', name:file.name, text, data}; }
    catch(err){ return {kind:'json', name:file.name, text, data:null, warnings:['JSON parse failed: '+err.message]}; }
  }
  function isGeoJson(data){ return data && (data.type==='FeatureCollection' || data.type==='Feature' || data.features); }
  async function parseHtmlFile(file){
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const jsonBlocks = Array.from(doc.querySelectorAll('script[type="application/json"], script[data-life_simulator-state]')).map(s=>s.textContent.trim()).filter(Boolean);
    const parsedBlocks=[];
    for(const block of jsonBlocks){ try{ parsedBlocks.push(JSON.parse(block)); }catch{} }
    return {kind:'html', name:file.name, text:doc.body?.innerText || text.replace(/<[^>]+>/g,' '), html:text, data:parsedBlocks[0] || null, jsonBlocks:parsedBlocks};
  }
  async function parseDocxFile(file){
    if(!window.JSZip) return {kind:'docx', name:file.name, text:'', data:null, warnings:['DOCX parsing requires jszip.min.js.']};
    try{
      const zip = await JSZip.loadAsync(file);
      const docXml = await zip.file('word/document.xml')?.async('string');
      const footnotes = await zip.file('word/footnotes.xml')?.async('string').catch(()=>null);
      const headers = await Promise.all(Object.keys(zip.files).filter(k=>/^word\/header\d+\.xml$/.test(k)).map(k=>zip.file(k).async('string')));
      const text = [docXml, footnotes, ...headers].filter(Boolean).map(U.textFromXml).join('\n');
      return {kind:'docx', name:file.name, text, data:null};
    }catch(err){ return {kind:'docx', name:file.name, text:'', data:null, warnings:['DOCX parse failed: '+err.message]}; }
  }
  async function parsePdfFile(file){
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary=''; const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,i+chunk));
    const matches=[];
    const tj = /\((?:\\.|[^\\)]){2,}\)\s*Tj/g; let m;
    while((m=tj.exec(binary)) && matches.length<5000){ matches.push(decodePdfString(m[0].replace(/\)\s*Tj$/,''))); }
    const arrays = /\[((?:\s*\((?:\\.|[^\\)])*\)\s*-?\d*\.?\d*)+)\]\s*TJ/g;
    while((m=arrays.exec(binary)) && matches.length<5000){ const parts=[...m[1].matchAll(/\((?:\\.|[^\\)])*\)/g)].map(x=>decodePdfString(x[0])); matches.push(parts.join('')); }
    const text = matches.join(' ').replace(/\s+/g,' ').trim();
    return {kind:'pdf', name:file.name, text, data:null, warnings:text?[]:['PDF imported, but text extraction was limited. If the PDF is scanned or heavily compressed, upload DOCX/HTML/JSON for stronger scanning.']};
  }
  function decodePdfString(s){ return String(s||'').replace(/^\(|\)$/g,'').replace(/\\([nrtbf()\\])/g,(m,ch)=>({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f','(':'(',')':')','\\':'\\'}[ch]||ch)).replace(/\\(\d{1,3})/g,(m,o)=>String.fromCharCode(parseInt(o,8))); }
  Importers.scanToFields = function(imported, helpers={}){
    const text = [imported.text || '', JSON.stringify(imported.data || '')].join('\n');
    const lower = text.toLowerCase();
    const suggestions = {tags:[], races:[], deities:[], applied:{}};
    const provinces = helpers.provinces || [];
    const biomes = helpers.biomes || [];
    const raceNames = helpers.raceNames || [];
    const deities = helpers.deities || [];
    const province = provinces.find(p => lower.includes(String(p).toLowerCase()));
    if(province) suggestions.applied.province = province;
    const biome = biomes.find(b => lower.includes(String(b).toLowerCase()));
    if(biome) suggestions.applied.biome = biome;
    const stype = ['Capital City','City','Town','Village'].find(t => lower.includes(t.toLowerCase()));
    if(stype) suggestions.applied.settlementType = stype;
    const danger = ['Severe','High','Moderate','Low'].find(d => new RegExp('danger[^\n]{0,30}'+d,'i').test(text) || lower.includes(`${d.toLowerCase()} danger`));
    if(danger) suggestions.applied.dangerLevel = danger;
    const pop = text.match(/population\D{0,20}([\d,]+)/i); if(pop) suggestions.applied.population = Number(pop[1].replace(/,/g,''));
    const area = text.match(/(?:square\s*(?:miles|kilometers|km|mi)|area|sq\.?\s*(?:mi|km))\D{0,20}([\d,.]+\s*(?:sq\.?\s*)?(?:mi|km|miles|kilometers)?)/i); if(area) suggestions.applied.area = area[1].trim();
    const tz = text.match(/UTC\s*[+-]?\d{0,2}/i); if(tz) suggestions.applied.timezone = tz[0].replace(/\s+/g,'');
    suggestions.races = raceNames.filter(r => lower.includes(String(r).toLowerCase())).slice(0,24);
    suggestions.deities = deities.filter(d => lower.includes(String(d).toLowerCase())).slice(0,12);
    suggestions.tags = U.extractKeywords(text).filter(w => /guild|danger|market|rail|skyship|ferry|portal|temple|shrine|forest|coastal|river|noble|criminal|trade|harbor|school|archive|hospital|farm|swamp|cavern|reef|district/.test(w)).slice(0,20);
    return suggestions;
  };
  window.Life SimulatorImporters = Importers;
})();
