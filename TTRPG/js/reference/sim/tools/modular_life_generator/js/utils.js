
(function(){
  const U = {};
  U.$ = id => document.getElementById(id);
  U.qs = (sel, root=document) => root.querySelector(sel);
  U.qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  U.escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  U.slug = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’'`´-]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  U.normalizeFileName = (settlement, province='', ext='') => {
    const base = [settlement || 'Life SimulatorSettlement', province || 'Province'].filter(Boolean).join('_');
    return U.slug(base).replace(/_/g,'') + (ext ? (ext.startsWith('.') ? ext : '.'+ext) : '');
  };
  U.downloadBlob = (blob, filename) => { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();}, 800); };
  U.downloadText = (text, filename, type='application/json') => U.downloadBlob(new Blob([text], {type}), filename);
  U.clone = obj => JSON.parse(JSON.stringify(obj));
  U.sample = arr => arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : undefined;
  U.sampleMany = (arr, count) => { const pool=[...(arr||[])]; const out=[]; while(pool.length && out.length<count){out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);} return out; };
  U.rand = (min=0,max=1) => min + Math.random() * (max-min);
  U.int = (min,max) => Math.floor(U.rand(min,max+1));
  U.chance = p => Math.random() < p;
  U.uid = (prefix='id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  U.hashCode = str => { let h=2166136261; for(const ch of String(str)){h ^= ch.charCodeAt(0); h = Math.imul(h,16777619);} return h>>>0; };
  U.seededRand = seed => { let x=U.hashCode(seed||'Life Simulator'); return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x>>>0) / 4294967296); }; };
  U.weightedPick = (entries) => { const total=entries.reduce((s,e)=>s+(Number(e.weight)||0),0); if(!total) return entries[0]?.item; let roll=Math.random()*total; for(const e of entries){ roll -= Number(e.weight)||0; if(roll<=0) return e.item; } return entries[entries.length-1]?.item; };
  U.allocateCounts = (total, weightsObj) => {
    const entries = Object.entries(weightsObj).filter(([,w])=>Number(w)>0);
    const sum = entries.reduce((a,[,w])=>a+Number(w),0) || 1;
    const raw = entries.map(([k,w])=>({key:k, exact: total * Number(w)/sum}));
    const out = {}; let assigned=0;
    raw.forEach(r=>{out[r.key]=Math.floor(r.exact); assigned += out[r.key]; r.frac=r.exact-out[r.key];});
    raw.sort((a,b)=>b.frac-a.frac);
    let i=0; while(assigned<total && raw.length){out[raw[i%raw.length].key]++; assigned++; i++;}
    return out;
  };
  U.status = (msg, ms=3600) => { const el=U.$('status'); if(!el) return; el.textContent=msg; el.classList.add('show'); clearTimeout(U.statusTimer); U.statusTimer=setTimeout(()=>el.classList.remove('show'), ms); };
  U.toCSV = rows => {
    if(!rows?.length) return '';
    const keys = Array.from(rows.reduce((set,row)=>{Object.keys(row).forEach(k=>set.add(k)); return set;}, new Set()));
    const esc = v => '"'+String(v ?? '').replace(/"/g,'""')+'"';
    return [keys.map(esc).join(','), ...rows.map(r=>keys.map(k=>esc(Array.isArray(r[k])?r[k].join('; '):typeof r[k]==='object'?JSON.stringify(r[k]):r[k])).join(','))].join('\n');
  };
  U.plain = value => String(value ?? '').replace(/\s+/g,' ').trim();
  U.extractKeywords = text => Array.from(new Set(String(text||'').toLowerCase().match(/[a-zÀ-ž][a-zÀ-ž'’\-]{3,}/gi)||[])).slice(0,80);
  U.textFromXml = xml => String(xml||'').replace(/<w:tab\/>/g,'\t').replace(/<w:br\/>/g,'\n').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  window.Life SimulatorUtils = U;
})();
