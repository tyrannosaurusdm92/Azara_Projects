(function (global) {
  'use strict';

  const LF = global.LF = global.LF || {};
  LF.VERSION = '1.0.0';
  LF.APP_NAME = 'LiteraryFriend';
  LF.now = () => new Date().toISOString();
  LF.uid = (prefix = 'id') => `${prefix}_${global.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  LF.escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  LF.escapeAttr = LF.escapeHtml;
  LF.stripHtml = html => {
    const box = document.createElement('div'); box.innerHTML = html || ''; return (box.textContent || '').replace(/\u00a0/g, ' ');
  };
  LF.slug = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,80) || 'untitled';
  LF.clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  LF.debounce = (fn, wait = 250) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; };
  LF.throttle = (fn, wait = 120) => { let last=0, timer; return (...args) => { const now=Date.now(); const remain=wait-(now-last); if(remain<=0){clearTimeout(timer);last=now;fn(...args);} else {clearTimeout(timer);timer=setTimeout(()=>{last=Date.now();fn(...args);},remain);} }; };
  LF.deepMerge = (base, patch) => {
    const out = Array.isArray(base) ? [...base] : {...(base || {})};
    Object.entries(patch || {}).forEach(([k,v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Blob) && !(v instanceof File)) out[k] = LF.deepMerge(out[k] || {}, v);
      else out[k] = v;
    });
    return out;
  };
  LF.formatDate = (iso, options) => {
    if (!iso) return '';
    try { return new Intl.DateTimeFormat(undefined, options || {year:'numeric',month:'short',day:'numeric'}).format(new Date(iso)); }
    catch (_) { return String(iso); }
  };
  LF.relativeTime = iso => {
    const d = new Date(iso); const s = Math.round((d - new Date())/1000); const abs=Math.abs(s);
    const units = abs < 60 ? ['second',1] : abs < 3600 ? ['minute',60] : abs < 86400 ? ['hour',3600] : abs < 604800 ? ['day',86400] : abs < 2592000 ? ['week',604800] : abs < 31536000 ? ['month',2592000] : ['year',31536000];
    return new Intl.RelativeTimeFormat(undefined,{numeric:'auto'}).format(Math.round(s/units[1]),units[0]);
  };
  LF.download = (name, data, type='text/plain;charset=utf-8') => {
    const blob = data instanceof Blob ? data : new Blob([data], {type}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  LF.readFile = file => new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(r.error); r.readAsText(file); });
  LF.readFileDataUrl = file => new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(r.error); r.readAsDataURL(file); });
  LF.fileToBase64 = file => new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result).split(',')[1]||''); r.onerror=()=>reject(r.error); r.readAsDataURL(file); });
  LF.copyText = async text => { try { await navigator.clipboard.writeText(text); return true; } catch (_) { const ta=document.createElement('textarea'); ta.value=text; document.body.append(ta); ta.select(); const ok=document.execCommand('copy'); ta.remove(); return ok; } };
  LF.tokenize = text => Array.from(new Set((String(text||'').toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,30}/g)||[]).filter(w=>!LF.STOP_WORDS.has(w))));
  LF.STOP_WORDS = new Set('a an and are as at be been but by can could did do does for from had has have he her hers him his i if in into is it its may me might my no not of on or our ours she should so than that the their theirs them then there they this to too us was we were what when where which who will with would you your yours'.split(' '));
  LF.parseTags = value => Array.from(new Set((Array.isArray(value) ? value : String(value||'').split(/[#,;]+/)).map(v=>String(v).trim().replace(/^#/,'')).filter(Boolean))).slice(0,60);
  LF.tagHtml = tags => LF.parseTags(tags).map(t=>`<span class="tag">#${LF.escapeHtml(t)}</span>`).join(' ');
  LF.safeJsonParse = (value, fallback={}) => { try { return JSON.parse(value); } catch (_) { return fallback; } };
  LF.ensureArray = value => Array.isArray(value) ? value : value == null ? [] : [value];

  class EventBus {
    constructor(){ this.map=new Map(); }
    on(name, fn){ if(!this.map.has(name)) this.map.set(name,new Set()); this.map.get(name).add(fn); return ()=>this.off(name,fn); }
    off(name,fn){ this.map.get(name)?.delete(fn); }
    emit(name,payload){ this.map.get(name)?.forEach(fn=>{try{fn(payload);}catch(err){console.error(err);}}); }
  }
  LF.events = new EventBus();

  LF.toast = (message, tone='neutral', timeout=2600) => {
    const region=document.getElementById('toastRegion'); if(!region) return;
    const el=document.createElement('div'); el.className=`toast toast--${tone}`; el.textContent=message; region.append(el);
    requestAnimationFrame(()=>el.classList.add('is-visible')); setTimeout(()=>{el.classList.remove('is-visible');setTimeout(()=>el.remove(),250);},timeout);
  };

  LF.dialog = ({title='Dialog', body='', confirmText='Save', cancelText='Cancel', danger=false, wide=false, onMount}={}) => new Promise(resolve=>{
    const root=document.getElementById('dialogRoot'); const id=LF.uid('dialog');
    const wrap=document.createElement('div'); wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal ${wide?'modal--wide':''}" role="dialog" aria-modal="true" aria-labelledby="${id}-title"><div class="modal__header"><h2 id="${id}-title">${LF.escapeHtml(title)}</h2><button class="icon-button" data-close type="button" aria-label="Close">×</button></div><div class="modal__body">${body}</div><div class="modal__footer"><button class="button button--ghost" data-cancel type="button">${LF.escapeHtml(cancelText)}</button><button class="button ${danger?'button--danger':'button--primary'}" data-confirm type="button">${LF.escapeHtml(confirmText)}</button></div></div>`;
    root.append(wrap); const modal=wrap.querySelector('.modal'); const previous=document.activeElement;
    const finish=value=>{wrap.remove(); previous?.focus?.(); resolve(value);};
    wrap.querySelector('[data-close]').onclick=()=>finish(null); wrap.querySelector('[data-cancel]').onclick=()=>finish(null); wrap.querySelector('[data-confirm]').onclick=()=>finish({root:wrap,modal});
    wrap.addEventListener('click',e=>{if(e.target===wrap)finish(null);});
    wrap.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();finish(null);} if(e.key==='Tab'){ const f=[...modal.querySelectorAll('button,input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled); if(!f.length)return; const first=f[0],last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();} }});
    requestAnimationFrame(()=>{ (modal.querySelector('input,textarea,select,button')||modal).focus(); onMount?.(wrap); });
  });

  LF.confirm = async (message, title='Confirm', danger=false) => {
    const result=await LF.dialog({title,body:`<p>${LF.escapeHtml(message)}</p>`,confirmText:danger?'Delete':'Continue',danger}); return !!result;
  };

  LF.defaults = {
    settings: {
      appearance: {theme:'dark', accent:'cyan', compact:false},
      accessibility: {fontScale:1, lineHeight:1.65, paragraphSpacing:1, textWidth:78, highContrast:false, reduceMotion:false, dyslexiaFriendly:false, largeTargets:true, focusOutline:true},
      reading: {enabled:true, rate:1, pitch:1, voice:'', highlightSentence:true, autoScroll:true},
      editor: {autosave:true, autosaveSeconds:2, spellcheck:true, smartQuotes:false, typewriter:false, showWordCount:true, dailyGoal:500, sessionGoal:250},
      privacy: {backendEnabled:false, rememberLogin:true},
      assistant: {corpusEnabled:true, maxResults:8}
    }
  };

  LF.templates = null;
  LF.loadTemplates = async () => {
    if (LF.templates) return LF.templates;
    try { const r=await fetch('json/templates.json',{cache:'no-store'}); if(!r.ok)throw new Error(r.status); LF.templates=await r.json(); }
    catch (_) { LF.templates={projectTypes:[],documentTemplates:[],journalPrompts:[],storyStructures:[]}; }
    return LF.templates;
  };

})(window);
