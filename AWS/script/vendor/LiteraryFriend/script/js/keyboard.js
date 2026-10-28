window.LuxuryKeyboard = (() => {
  const $ = id => document.getElementById(id);
  let insert = () => {};
  let instance = null;
  let language = 'en';
  let shifted = false;
  let split = false;
  let mode = 'letters';
  let dragging = null;
  const panel = () => $('floating-keyboard');
  function getPreferences() { try {return JSON.parse(localStorage.getItem('luxury-editor-keyboard') || '{}')}catch{return {}} }
  function persist() {
    const p = panel();
    try {localStorage.setItem('luxury-editor-keyboard',JSON.stringify({left:p.style.left,top:p.style.top,width:p.style.width,height:p.style.height,split,mode,language,collapsed:p.classList.contains('collapsed')}));}catch{}
  }
  function createKey(value,label=value,kind='') {
    const b = document.createElement('button');b.type='button';b.className='keyboard-key '+kind;
    b.textContent=label;b.dataset.value=value;
    b.setAttribute('aria-label', value === 'Backspace'?'Backspace': value==='Enter'?'Enter':value==='Space'?'Space':value==='Tab'?'Tab':label);
    b.addEventListener('pointerdown',e=>e.preventDefault());
    b.addEventListener('click',()=>{if(value==='Shift'){shifted=!shifted;render()}else insert(value)});
    return b;
  }
  function letterRows() {
    const pack=window.LUXURY_LANGUAGES[language] || window.LUXURY_LANGUAGES.en;
    const rows=pack.rows.map(x=>Array.from(x));
    rows.push(pack.extra);
    rows.unshift(Array.from('1234567890'));
    return rows.map((keys,i)=>i===4?keys:keys.map(c=>shifted?c.toLocaleUpperCase(language):c));
  }
  function render() {
    const holder=$('keyboard-keys');holder.replaceChildren();
    const p=panel();p.classList.toggle('split',split);p.classList.toggle('extended',mode!=='letters');
    $('keyboard-mode-label').textContent=mode==='letters'?'Letters':mode==='extended'?'Latin Extended':'Combining';
    $('keyboard-search').hidden=mode==='letters';$('keyboard-shift').parentElement.hidden=mode!=='letters';
    $('keyboard-layout').value=mode;$('keyboard-language').value=language;$('keyboard-shift').checked=shifted;
    if(mode==='letters'){
      const rows=letterRows();
      function rowNode(keys,extra=[]) {
        const r=document.createElement('div');r.className='keyboard-row';
        for(const key of keys) r.append(createKey(key));
        for(const spec of extra) r.append(createKey(spec[0],spec[1],spec[2]||'special'));
        return r;
      }
      if(split){
        const left=document.createElement('div'),right=document.createElement('div');
        left.className=right.className='keyboard-half';
        rows.slice(0,4).forEach(r=>{const i=Math.ceil(r.length/2);left.append(rowNode(r.slice(0,i)));right.append(rowNode(r.slice(i)));});
        const ex=rows[4],half=Math.ceil(ex.length/2);
        left.append(rowNode(ex.slice(0,half),[['Space','Space','space']]));
        right.append(rowNode(ex.slice(half),[['Backspace','⌫'],['Enter','↵']]));
        holder.append(left,right);
      } else {
        rows.slice(0,4).forEach(r=>holder.append(rowNode(r)));
        holder.append(rowNode(rows[4]));
        holder.append(rowNode([],[['Shift','⇧ Shift'],['Tab','Tab'],['Space','Space','space'],['Backspace','⌫'],['Enter','↵']]));
      }
      return;
    }
    const search=$('keyboard-search').value.trim().toLowerCase();
    let chars=(window.LUXURY_UNICODE||[]).filter(x=>mode==='extended'?x.block==='latin':x.block!=='latin');
    if(search) chars=chars.filter(x=>x.name.toLowerCase().includes(search)||x.cp.toLowerCase().includes(search.replace(/^u\+/,'').replace(/^0x/,''))||x.char.toLowerCase().includes(search));
    if(!chars.length){holder.textContent='No matching characters.';return}
    function addChars(target,data) {
      for(const x of data){const key=createKey(x.char,mode==='combining'?'◌'+x.char:x.char);key.title=x.name+' · U+'+x.cp;target.append(key);}
    }
    if(split){const a=document.createElement('div'),b=document.createElement('div');a.className=b.className='unicode-half';const mid=Math.ceil(chars.length/2);addChars(a,chars.slice(0,mid));addChars(b,chars.slice(mid));holder.append(a,b)}
    else addChars(holder,chars);
  }
  function moveStart(e) {
    if(e.target.closest('button,select,input')) return;
    const p=panel(),r=p.getBoundingClientRect();
    dragging={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
    $('keyboard-handle').setPointerCapture(e.pointerId);e.preventDefault();
  }
  function move(e) {
    if(!dragging||dragging.id!==e.pointerId)return;
    const p=panel();
    let x=dragging.left+e.clientX-dragging.x, y=dragging.top+e.clientY-dragging.y;
    x=Math.max(0,Math.min(window.innerWidth-50,x));y=Math.max(0,Math.min(window.innerHeight-44,y));
    p.style.left=x+'px';p.style.top=y+'px';p.style.bottom='auto';
  }
  function moveEnd(e){if(dragging&&dragging.id===e.pointerId){dragging=null;persist()}}
  function setLanguage(value){language=window.LUXURY_LANGUAGES[value]?value:'en';render();persist()}
  function open(){const p=panel();p.setAttribute('aria-hidden','false');p.classList.remove('collapsed');render();persist()}
  function toggle(){const p=panel();if(p.getAttribute('aria-hidden')==='true'){open();return}p.setAttribute('aria-hidden','true');persist()}
  function init({onInsert}){
    insert=onInsert;
    const prefs=getPreferences();language=prefs.language||'en';split=!!prefs.split;mode=prefs.mode||'letters';
    if(!['letters','extended','combining'].includes(mode))mode='letters';
    const p=panel();
    for(const prop of ['left','top','width','height'])if(prefs[prop])p.style[prop]=prefs[prop];
    if(prefs.collapsed)p.classList.add('collapsed');
    $('keyboard-language').replaceChildren();
    Object.entries(window.LUXURY_LANGUAGES).forEach(([code,info])=>{const o=new Option(info.name,code);$('keyboard-language').add(o)});
    $('keyboard-language').addEventListener('change',e=>setLanguage(e.target.value));
    $('keyboard-layout').addEventListener('change',e=>{mode=e.target.value;render();persist()});
    $('keyboard-search').addEventListener('input',render);
    $('keyboard-shift').addEventListener('change',e=>{shifted=e.target.checked;render()});
    $('keyboard-split').addEventListener('click',()=>{split=!split;render();persist()});
    $('keyboard-collapse').addEventListener('click',()=>{p.classList.toggle('collapsed');persist()});
    $('keyboard-close').addEventListener('click',()=>{p.setAttribute('aria-hidden','true');persist()});
    $('keyboard-nfc').addEventListener('click',()=>insert('NFC'));
    $('keyboard-handle').addEventListener('pointerdown',moveStart);
    $('keyboard-handle').addEventListener('pointermove',move);
    $('keyboard-handle').addEventListener('pointerup',moveEnd);
    $('keyboard-handle').addEventListener('pointercancel',moveEnd);
    window.addEventListener('resize',()=>{
      const r=p.getBoundingClientRect();if(r.left>innerWidth-48)p.style.left=Math.max(0,innerWidth-60)+'px';
      if(r.top>innerHeight-40)p.style.top=Math.max(0,innerHeight-60)+'px';
    });
    new ResizeObserver(persist).observe(p);
    render();instance=p;
  }
  return {init,open,toggle,setLanguage};
})();
