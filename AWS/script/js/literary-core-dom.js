export const $=(selector,root=document)=>root.querySelector(selector);
export const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
export function el(tag, attrs={}, children=[]) {
  const node=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{ if(v==null||v===false)return; if(k==='class')node.className=v; else if(k==='text')node.textContent=v; else if(k.startsWith('on')&&typeof v==='function')node.addEventListener(k.slice(2).toLowerCase(),v); else if(k==='dataset')Object.assign(node.dataset,v); else if(k in node && !k.startsWith('aria-'))node[k]=v; else node.setAttribute(k,v===true?'':String(v)); });
  (Array.isArray(children)?children:[children]).forEach(child=>node.append(child?.nodeType?child:document.createTextNode(String(child??'')))); return node;
}
export function clear(node){ node.replaceChildren(); return node; }
export function formDataObject(form){ const out={}; for(const [k,v] of new FormData(form)){ if(k in out)out[k]=Array.isArray(out[k])?[...out[k],v]:[out[k],v]; else out[k]=v; } return out; }
export function setBusy(node,busy=true){ node?.setAttribute('aria-busy',String(Boolean(busy))); }
export function announce(message){ const r=$('#toast-region'); if(r){ r.textContent=''; queueMicrotask(()=>r.textContent=String(message||'')); } }
export function focusHeading(root=document){ const h=root.querySelector('h1,h2,[tabindex="-1"]'); h?.focus?.(); }
