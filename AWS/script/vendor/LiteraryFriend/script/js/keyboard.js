window.LuxuryKeyboard = (() => {
  const $ = id => document.getElementById(id);
  const layouts = new Set(['standard','archaic','classical','traditional','modern']);
  const eraLabels = {archaic:'Archaic',classical:'Classical',traditional:'Traditional',modern:'Modern'};
  let insert = () => {};
  let language = 'en';
  let shifted = false;
  let split = false;
  let mode = 'letters';
  let keyboardStyle = 'standard';
  let dragging = null;
  let resizing = null;
  let bubbleDragging = null;
  let ignoreBubbleClick = false;
  let panelWidth = 840;
  let panelHeight = 0;
  let panelLeft = null;
  let panelTop = null;
  let bubbleLeft = null;
  let bubbleTop = null;
  const panel = () => $('floating-keyboard');
  const clamp = (value,min,max) => Math.max(min,Math.min(value,max));
  const defaultPanelHeight=()=>clamp(innerHeight*.34,250,innerWidth<=760?300:360);

  function getPreferences() {
    try { return JSON.parse(localStorage.getItem('luxury-editor-keyboard') || '{}'); }
    catch { return {}; }
  }
  function persist() {
    try {
      const p=panel();
      if(p?.classList.contains('is-open')){
        const rect=p.getBoundingClientRect();
        panelWidth=rect.width;panelHeight=rect.height;panelLeft=rect.left;panelTop=rect.top;
      }
      localStorage.setItem('luxury-editor-keyboard',JSON.stringify({language,split,mode,panelWidth,panelHeight,panelLeft,panelTop,bubbleLeft,bubbleTop,keyboardStyle,placementVersion:2}));
      localStorage.setItem('aws:keyboard-style:v1',keyboardStyle);
    } catch {}
  }
  function createKey(value,label=value,kind='') {
    const button=document.createElement('button');button.type='button';button.className='keyboard-key '+kind;
    button.textContent=label;button.dataset.value=value;
    button.setAttribute('aria-label',value==='Backspace'?'Backspace':value==='Enter'?'Enter':value==='Space'?'Space':value==='Tab'?'Tab':label);
    button.addEventListener('pointerdown',event=>event.preventDefault());
    button.addEventListener('click',()=>{if(value==='Shift'){shifted=!shifted;render()}else insert(value)});
    return button;
  }
  function letterRows() {
    const pack=window.LUXURY_LANGUAGES[language]||window.LUXURY_LANGUAGES.en;
    const rows=pack.rows.map(row=>Array.from(row));rows.push(pack.extra);rows.unshift(Array.from('1234567890'));
    return rows.map((keys,index)=>index===4?keys:keys.map(char=>shifted?char.toLocaleUpperCase(language):char));
  }
  function render() {
    const holder=$('keyboard-keys');if(!holder)return;holder.replaceChildren();
    const p=panel();p.classList.toggle('split',split);p.classList.toggle('extended',mode!=='letters');
    $('keyboard-search').hidden=mode==='letters';$('keyboard-shift').parentElement.hidden=mode!=='letters';
    $('keyboard-layout').value=mode;$('keyboard-language').value=language;$('keyboard-shift').checked=shifted;
    if(mode==='letters'){
      const rows=letterRows();
      const rowNode=(keys,extra=[])=>{
        const row=document.createElement('div');row.className='keyboard-row';
        for(const key of keys)row.append(createKey(key));
        for(const spec of extra)row.append(createKey(spec[0],spec[1],spec[2]||'special'));
        return row;
      };
      if(split){
        const left=document.createElement('div'),right=document.createElement('div');left.className=right.className='keyboard-half';
        rows.slice(0,4).forEach(keys=>{const i=Math.ceil(keys.length/2);left.append(rowNode(keys.slice(0,i)));right.append(rowNode(keys.slice(i)))});
        const extra=rows[4],half=Math.ceil(extra.length/2);left.append(rowNode(extra.slice(0,half),[['Space','Space','space']]));right.append(rowNode(extra.slice(half),[['Backspace','⌫'],['Enter','↵']]));holder.append(left,right);
      } else {
        rows.slice(0,4).forEach(keys=>holder.append(rowNode(keys)));holder.append(rowNode(rows[4]));
        holder.append(rowNode([],[['Shift','⇧ Shift'],['Tab','Tab'],['Space','Space','space'],['Backspace','⌫'],['Enter','↵']]));
      }
      return;
    }
    const search=$('keyboard-search').value.trim().toLowerCase();
    let chars=(window.LUXURY_UNICODE||[]).filter(item=>mode==='extended'?item.block==='latin':item.block!=='latin');
    if(search)chars=chars.filter(item=>item.name.toLowerCase().includes(search)||item.cp.toLowerCase().includes(search.replace(/^u\+/,'').replace(/^0x/,''))||item.char.toLowerCase().includes(search));
    if(!chars.length){holder.textContent='No matching characters.';return}
    const addChars=(target,data)=>{for(const item of data){const key=createKey(item.char,mode==='combining'?'◌'+item.char:item.char);key.title=item.name+' · U+'+item.cp;target.append(key)}};
    if(split){const left=document.createElement('div'),right=document.createElement('div');left.className=right.className='unicode-half';const mid=Math.ceil(chars.length/2);addChars(left,chars.slice(0,mid));addChars(right,chars.slice(mid));holder.append(left,right)}
    else addChars(holder,chars);
  }
  function syncFrameScale(scale) {
    for(const id of ['wh-kb-frame','wh-aza-book-frame']){
      const frame=$(id);let doc,win;try{doc=frame?.contentDocument;win=frame?.contentWindow}catch{}
      if(!doc)continue;
      if(id==='wh-kb-frame'){
        doc.documentElement.style.setProperty('--aws-host-scale',String(scale));
        const target=doc.getElementById('savanskiKeyboard');
        target?.style.setProperty('--aws-host-scale',String(scale));
        win?.SavanskiSetHostScale?.(scale);
        continue;
      }
      const target=doc.getElementById('keyboard')||doc.querySelector('.keyboard')||doc.body;
      if(target)target.style.zoom=String(scale);
    }
  }
  function updateScale() {
    const p=panel();if(!p?.classList.contains('is-open'))return;
    const rect=p.getBoundingClientRect();
    const baseWidth=Math.min(840,Math.max(280,innerWidth-16));
    const baseHeight=defaultPanelHeight();
    const scale=clamp(Math.min(rect.width/baseWidth,rect.height/baseHeight),.38,1.35);
    p.style.setProperty('--keyboard-scale',scale.toFixed(3));syncFrameScale(scale);
  }
  function placeOpenPanel() {
    const p=panel();
    const minWidth=Math.min(280,Math.max(200,innerWidth-16));
    const minHeight=Math.min(190,Math.max(120,innerHeight-16));
    panelWidth=clamp(Number(panelWidth)||Math.min(840,innerWidth-16),minWidth,Math.max(minWidth,innerWidth-16));
    panelHeight=clamp(Number(panelHeight)||defaultPanelHeight(),minHeight,Math.max(minHeight,innerHeight-16));
    const x=Number.isFinite(panelLeft)?panelLeft:(innerWidth-panelWidth)/2;
    const y=Number.isFinite(panelTop)?panelTop:innerHeight-panelHeight-16;
    p.style.left=clamp(x,8,Math.max(8,innerWidth-panelWidth-8))+'px';
    p.style.top=clamp(y,8,Math.max(8,innerHeight-panelHeight-8))+'px';
    p.style.right='auto';p.style.bottom='auto';p.style.width=panelWidth+'px';p.style.height=panelHeight+'px';
  }
  function placeBubble() {
    const p=panel();
    if(Number.isFinite(bubbleLeft)&&Number.isFinite(bubbleTop)){
      p.style.left=clamp(bubbleLeft,8,Math.max(8,innerWidth-158))+'px';
      p.style.top=clamp(bubbleTop,8,Math.max(8,innerHeight-158))+'px';p.style.right='auto';p.style.bottom='auto';
    }else{p.style.left='auto';p.style.top='auto';p.style.right='18px';p.style.bottom='18px'}
    p.style.width='';p.style.height='';
  }
  function open() {
    const p=panel();if(p.classList.contains('is-open'))return;
    p.classList.remove('is-bubble');p.classList.add('is-open');$('keyboard-bubble').hidden=true;$('keyboard-dock').hidden=false;
    placeOpenPanel();updateScale();persist();$('keyboard-era-select').focus({preventScroll:true});
  }
  function collapse() {
    const p=panel();if(p.classList.contains('is-open')){
      const rect=p.getBoundingClientRect();panelWidth=rect.width;panelHeight=rect.height;panelLeft=rect.left;panelTop=rect.top;
    }
    p.classList.remove('is-open');p.classList.add('is-bubble');$('keyboard-dock').hidden=true;$('keyboard-bubble').hidden=false;
    placeBubble();persist();$('keyboard-bubble').focus({preventScroll:true});
  }
  function toggle(){panel().classList.contains('is-open')?collapse():open()}
  function setStyle(value,write=true) {
    if(!layouts.has(value))value='standard';keyboardStyle=value;
    const select=$('keyboard-era-select'),content=$('keyboard-content'),map=$('keyboard-body'),mapButton=$('keyboard-unicode-toggle');
    if(select)select.value=value;
    content?.classList.remove('character-map');if(map)map.hidden=true;
    if(mapButton){mapButton.hidden=value!=='standard';mapButton.setAttribute('aria-expanded','false')}
    const inputMode=$('wh-input-mode'),era=$('wh-aza-era');
    if(inputMode){inputMode.value=value==='standard'?'qwerty':'aza';inputMode.dispatchEvent(new Event('change',{bubbles:true}))}
    if(value!=='standard'&&era){era.value=eraLabels[value];era.dispatchEvent(new Event('change',{bubbles:true}))}
    panel().dataset.keyboardStyle=value;
    if(write)persist();
  }
  function reflectStyle() {
    const inputMode=$('wh-input-mode'),era=$('wh-aza-era');
    const next=inputMode?.value==='qwerty'?'standard':String(era?.value||'Modern').toLowerCase();
    if(layouts.has(next)&&next!==keyboardStyle)setStyle(next,false);
    const select=$('keyboard-era-select');if(select&&layouts.has(next))select.value=next;
  }
  function beginMove(event) {
    if(event.button!==0||event.target.closest('button,select,input'))return;
    const p=panel(),rect=p.getBoundingClientRect();dragging={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
    $('keyboard-handle').setPointerCapture(event.pointerId);event.preventDefault();
  }
  function move(event) {
    if(!dragging||dragging.id!==event.pointerId)return;
    const p=panel(),rect=p.getBoundingClientRect();
    const x=clamp(dragging.left+event.clientX-dragging.x,8,Math.max(8,innerWidth-rect.width-8));
    const y=clamp(dragging.top+event.clientY-dragging.y,8,Math.max(8,innerHeight-rect.height-8));
    p.style.left=x+'px';p.style.top=y+'px';p.style.right='auto';p.style.bottom='auto';event.preventDefault();
  }
  function finishMove(event) {if(dragging&&dragging.id===event.pointerId){dragging=null;persist()}}
  function startBubbleMove(event) {
    if(event.button!==0)return;const rect=panel().getBoundingClientRect();
    bubbleDragging={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};
    $('keyboard-bubble').setPointerCapture(event.pointerId);event.preventDefault();
  }
  function moveBubble(event) {
    if(!bubbleDragging||bubbleDragging.id!==event.pointerId)return;
    const dx=event.clientX-bubbleDragging.x,dy=event.clientY-bubbleDragging.y;
    if(Math.hypot(dx,dy)>5)bubbleDragging.moved=true;
    if(!bubbleDragging.moved)return;
    bubbleLeft=clamp(bubbleDragging.left+dx,8,Math.max(8,innerWidth-158));bubbleTop=clamp(bubbleDragging.top+dy,8,Math.max(8,innerHeight-158));
    const p=panel();p.style.left=bubbleLeft+'px';p.style.top=bubbleTop+'px';p.style.right='auto';p.style.bottom='auto';event.preventDefault();
  }
  function finishBubbleMove(event) {
    if(!bubbleDragging||bubbleDragging.id!==event.pointerId)return;
    ignoreBubbleClick=event.type==='pointerup'&&bubbleDragging.moved;bubbleDragging=null;persist();
  }
  function resizeBy(edge,dx,dy,origin) {
    const p=panel(),rect=origin||p.getBoundingClientRect();
    const minW=Math.min(280,Math.max(200,innerWidth-16)),minH=Math.min(190,Math.max(120,innerHeight-16));
    let left=rect.left,right=rect.right,top=rect.top,bottom=rect.bottom;
    if(edge.includes('w'))left=clamp(rect.left+dx,8,rect.right-minW);
    if(edge.includes('e'))right=clamp(rect.right+dx,left+minW,innerWidth-8);
    if(edge.includes('n'))top=clamp(rect.top+dy,8,rect.bottom-minH);
    if(edge.includes('s'))bottom=clamp(rect.bottom+dy,top+minH,innerHeight-8);
    p.style.left=left+'px';p.style.top=top+'px';p.style.right='auto';p.style.bottom='auto';p.style.width=(right-left)+'px';p.style.height=(bottom-top)+'px';
    panelWidth=right-left;panelHeight=bottom-top;panelLeft=left;panelTop=top;updateScale();
  }
  function beginResize(event) {
    if(event.button!==0)return;const edge=event.currentTarget.dataset.resizeEdge;
    resizing={id:event.pointerId,edge,x:event.clientX,y:event.clientY,rect:panel().getBoundingClientRect()};
    event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
  }
  function resize(event) {
    if(!resizing||resizing.id!==event.pointerId)return;
    resizeBy(resizing.edge,event.clientX-resizing.x,event.clientY-resizing.y,resizing.rect);event.preventDefault();
  }
  function finishResize(event) {if(resizing&&resizing.id===event.pointerId){resizing=null;persist()}}
  function resizeWithKeys(event) {
    const delta=event.shiftKey?24:8;let dx=0,dy=0;
    if(event.key==='ArrowLeft')dx=-delta;if(event.key==='ArrowRight')dx=delta;
    if(event.key==='ArrowUp')dy=-delta;if(event.key==='ArrowDown')dy=delta;
    if(!dx&&!dy)return;event.preventDefault();resizeBy(event.currentTarget.dataset.resizeEdge,dx,dy);persist();
  }
  function setLanguage(value){language=window.LUXURY_LANGUAGES[value]?value:'en';render();persist()}
  function init({onInsert}) {
    insert=onInsert;
    const prefs=getPreferences();language=prefs.language||'en';split=!!prefs.split;mode=prefs.mode||'letters';
    if(!['letters','extended','combining'].includes(mode))mode='letters';
    panelWidth=Number(prefs.panelWidth||prefs.width)||840;panelHeight=Number(prefs.panelHeight||prefs.height)||0;
    const savedLeft=Number.isFinite(prefs.panelLeft)?prefs.panelLeft:(Number.isFinite(prefs.left)?prefs.left:null);
    const savedTop=Number.isFinite(prefs.panelTop)?prefs.panelTop:(Number.isFinite(prefs.top)?prefs.top:null);
    const savedRightGap=savedLeft==null?Infinity:innerWidth-savedLeft-panelWidth;
    const savedBottomGap=savedTop==null?Infinity:innerHeight-savedTop-(panelHeight||defaultPanelHeight());
    const legacyBottomRight=savedRightGap>=0&&savedRightGap<=24&&savedBottomGap>=0&&savedBottomGap<=24;
    panelLeft=legacyBottomRight?null:savedLeft;panelTop=legacyBottomRight?null:savedTop;
    bubbleLeft=Number.isFinite(prefs.bubbleLeft)?prefs.bubbleLeft:null;bubbleTop=Number.isFinite(prefs.bubbleTop)?prefs.bubbleTop:null;
    const savedStyle=localStorage.getItem('aws:keyboard-style:v1');
    const formerMode=localStorage.getItem('wh:book-keyboard'),formerEra=String(localStorage.getItem('wh:book-era')||'Modern').toLowerCase();
    keyboardStyle=layouts.has(savedStyle)?savedStyle:formerMode==='aza'&&layouts.has(formerEra)?formerEra:'standard';
    $('keyboard-language').replaceChildren();
    Object.entries(window.LUXURY_LANGUAGES).forEach(([code,info])=>$('keyboard-language').add(new Option(info.name,code)));
    $('keyboard-language').addEventListener('change',event=>setLanguage(event.target.value));
    $('keyboard-layout').addEventListener('change',event=>{mode=event.target.value;render();persist()});
    $('keyboard-search').addEventListener('input',render);$('keyboard-shift').addEventListener('change',event=>{shifted=event.target.checked;render()});
    $('keyboard-split')?.addEventListener('click',()=>{split=!split;render();persist()});$('keyboard-nfc').addEventListener('click',()=>insert('NFC'));
    $('keyboard-bubble').addEventListener('click',event=>{if(ignoreBubbleClick){ignoreBubbleClick=false;event.preventDefault();return}open()});
    $('keyboard-bubble').addEventListener('pointerdown',startBubbleMove);$('keyboard-bubble').addEventListener('pointermove',moveBubble);$('keyboard-bubble').addEventListener('pointerup',finishBubbleMove);$('keyboard-bubble').addEventListener('pointercancel',finishBubbleMove);
    $('keyboard-close').addEventListener('click',collapse);
    $('keyboard-era-select').addEventListener('change',event=>setStyle(event.target.value));
    $('keyboard-unicode-toggle').addEventListener('click',event=>{
      if(keyboardStyle!=='standard')return;
      const content=$('keyboard-content'),map=$('keyboard-body'),show=map.hidden;
      content.classList.toggle('character-map',show);map.hidden=!show;event.currentTarget.setAttribute('aria-expanded',String(show));
      event.currentTarget.title=show?'Return to the standard keyboard':'Open the Unicode character map';
    });
    const handle=$('keyboard-handle');handle.addEventListener('pointerdown',beginMove);handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finishMove);handle.addEventListener('pointercancel',finishMove);
    for(const edge of document.querySelectorAll('.keyboard-resize-handle')){edge.addEventListener('pointerdown',beginResize);edge.addEventListener('pointermove',resize);edge.addEventListener('pointerup',finishResize);edge.addEventListener('pointercancel',finishResize);edge.addEventListener('keydown',resizeWithKeys)}
    for(const id of ['wh-kb-frame','wh-aza-book-frame'])$(id).addEventListener('load',updateScale);
    $('wh-input-mode').addEventListener('change',reflectStyle);$('wh-aza-era').addEventListener('change',reflectStyle);
    const p=panel();p.classList.remove('is-open');p.classList.add('is-bubble');$('keyboard-dock').hidden=true;$('keyboard-bubble').hidden=false;placeBubble();
    render();setStyle(keyboardStyle,true);
    if('ResizeObserver' in window)new ResizeObserver(updateScale).observe(p);
    window.addEventListener('resize',()=>{
      const p=panel();if(p.classList.contains('is-open')){
        panelWidth=Math.min(panelWidth,innerWidth-16);panelHeight=Math.min(panelHeight,innerHeight-16);placeOpenPanel();updateScale();
      }else placeBubble();
    });
    window.AWSKeyboard=Object.freeze({open,collapse,toggle,setStyle,get style(){return keyboardStyle}});
  }
  return {init,open,toggle,setLanguage,setStyle,collapse};
})();
