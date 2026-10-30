
(function(){
const U={};
U.$=(id)=>document.getElementById(id);
U.$$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
U.esc=(s)=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
U.slug=(s)=>String(s||'item').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'item';
U.uniq=(arr)=>[...new Set((arr||[]).filter(Boolean))];
U.sample=(arr,rng=Math.random)=>arr&&arr.length?arr[Math.floor(rng()*arr.length)]:undefined;
U.clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
U.seeded=(seed)=>{let h=2166136261>>>0; const s=String(seed||'Belavados'); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return ()=>{h+=0x6D2B79F5; let t=h; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296;};};
U.download=(filename,content,type='application/octet-stream')=>{const blob=content instanceof Blob?content:new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},300);};
U.toast=(msg)=>{const t=U.$('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); clearTimeout(U.toastTimer); U.toastTimer=setTimeout(()=>t.classList.remove('show'),3600);};
U.parseUTC=(label)=>{const m=String(label||'UTC').match(/UTC\s*([+-])?\s*(\d{1,2})?(?::?(\d{2}))?/i); if(!m) return 0; const sign=m[1]==='-'?-1:1; const h=Number(m[2]||0), min=Number(m[3]||0); return sign*(h*60+min);};
U.formatUTC=(minutes)=>{const sign=minutes<0?'-':'+'; const abs=Math.abs(minutes); return `UTC${sign}${String(Math.floor(abs/60)).padStart(2,'0')}:${String(abs%60).padStart(2,'0')}`;};
U.readFile=(file,mode='text')=>new Promise((resolve,reject)=>{const fr=new FileReader(); fr.onerror=()=>reject(fr.error); fr.onload=()=>resolve(fr.result); if(mode==='arrayBuffer') fr.readAsArrayBuffer(file); else if(mode==='dataURL') fr.readAsDataURL(file); else fr.readAsText(file);});
U.csv=(rows)=>rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
U.textIncludes=(hay,q)=>String(hay||'').toLowerCase().includes(String(q||'').toLowerCase());
U.normal=(s)=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
window.BelUtils=U;
})();
