/* Browser-local Aza’raan font workshop. No source fonts or edits leave this device. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const F = window.FontEditorCore;
  const geometry = window.WriterHelperFontCore;
  if (!F?.createFont) { $('wh-font-status').textContent = 'The font editor could not load.'; return; }
  const eras = ['Proto','Ancient','Archaic','Classical','Traditional','Modern'];
  const model = {era:'Modern',font:null,source:null,selected:0,baseline:0,spacing:0,busy:false,proofFace:null,proofUrl:null,dirty:false};
  const appliedKey='writerhelper-era-fonts-v1';
  let applied={};try{applied=JSON.parse(localStorage.getItem(appliedKey)||'{}')}catch{}
  const installed=new WeakMap();
  async function restoreApplied(){
    const records=await window.LuxuryStore.allFonts();
    for(const era of eras){
      if(!records.some(f=>f.family===applied[era])){
        const matching=records.filter(f=>f.era===era);applied[era]=matching.at(-1)?.family;
      }
    }
    localStorage.setItem(appliedKey,JSON.stringify(applied));
    window.dispatchEvent(new Event('writerhelper:font-applied'));
  }
  async function installInto(doc){
    if(!doc?.defaultView)return;
    const records=await window.LuxuryStore.allFonts();
    let seen=installed.get(doc);if(!seen){seen=new Set();installed.set(doc,seen)}
    for(const [era,family] of Object.entries(applied)){
      if(seen.has(family))continue;
      const record=records.find(f=>f.family===family);if(!record)continue;
      const bytes=await record.blob.arrayBuffer();
      // The studio's existing selectors use AzModern etc.; install the edited era there.
      const face=new doc.defaultView.FontFace('Az'+era,bytes);
      await face.load();doc.fonts.add(face);seen.add(family);
    }
  }
  async function exportCSS(markup,channelFont){
    let css='';
    for(const era of ['Archaic','Classical','Traditional','Modern']){
      const family='Az'+era;if(!markup.includes(family)&&!String(channelFont).includes(family))continue;
      const response=await fetch(new URL('assets/ttf/Azaaraan-'+era+'.ttf',location.href));
      if(!response.ok)throw Error('The '+era+' font could not be embedded in the export.');
      const bytes=new Uint8Array(await response.arrayBuffer());let raw='';
      for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
      css+=`@font-face{font-family:${family};src:url(data:font/ttf;base64,${btoa(raw)}) format('truetype')}\n`;
    }
    return css;
  }
  window.WriterHelperFonts = Object.freeze({family:era=>applied[era]||'Az'+era,installInto,exportCSS});
  window.addEventListener('writerhelper:fonts-ready',()=>restoreApplied().catch(error=>status(error.message)));
  const status = message => { $('wh-font-status').textContent=message; };
  const fileBase = new URL('./', location.href);
  const familyInput = $('wh-font-family');
  const fields = {fontFamily:'wh-font-family',fontSubFamily:'wh-font-style',version:'wh-font-version',designer:'wh-font-designer',description:'wh-font-description',copyright:'wh-font-copyright',manufacturer:'wh-font-manufacturer',licence:'wh-font-license',urlOfLicence:'wh-font-license-url',urlOfFontDesigner:'wh-font-designer-url'};
  const number = (value,fallback=0) => Number.isFinite(+value)?Math.round(+value):fallback;
  const data = () => model.font?.get();
  const current = () => data()?.glyf[model.selected] || null;
  const hex = cp => Number.isInteger(cp)?'U+'+cp.toString(16).toUpperCase().padStart(4,'0'):'';
  const code = value => {
    const clean=String(value||'').trim().replace(/^U\+/i,'');
    const cp=parseInt(clean,16);
    if(!/^[0-9A-F]{1,6}$/i.test(clean)||cp>0x10ffff||cp>=0xd800&&cp<=0xdfff)throw Error('Enter a valid Unicode code point, such as U+1780.');
    return cp;
  };
  const markDirty=()=>{model.dirty=true;status('Unsaved font changes.');};
  function download(bytes,name,type){
    const url=URL.createObjectURL(new Blob([bytes],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function readDir(bytes){
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(view.getUint32(0)!==0x00010000)return null;
    const tables=new Map(),n=view.getUint16(4);
    for(let i=0;i<n;i++){
      const at=12+i*16;
      const tag=String.fromCharCode(...bytes.slice(at,at+4));
      const off=view.getUint32(at+8),len=view.getUint32(at+12);
      if(off+len>bytes.length)throw Error('Invalid TrueType table directory.');
      tables.set(tag,bytes.slice(off,off+len));
    }
    return tables;
  }
  function checksum(bytes){
    let sum=0;
    for(let i=0;i<bytes.length;i+=4){
      const word=(((bytes[i]||0)<<24)|((bytes[i+1]||0)<<16)|((bytes[i+2]||0)<<8)|(bytes[i+3]||0))>>>0;
      sum=(sum+word)>>>0;
    }
    return sum;
  }
  function preserveKhmerLayout(newBytes,originalBytes){
    if(!originalBytes)return newBytes;
    const previous=readDir(originalBytes),tables=readDir(newBytes);
    if(!previous||!tables)return newBytes;
    for(const tag of ['GDEF','GPOS','GSUB'])if(previous.has(tag))tables.set(tag,previous.get(tag));
    const tags=[...tables.keys()].sort(),n=tags.length;
    const power=2**Math.floor(Math.log2(n)),start=12+n*16;
    const total=start+tags.reduce((size,tag)=>size+(tables.get(tag).length+3&~3),0);
    const output=new Uint8Array(total),view=new DataView(output.buffer);
    view.setUint32(0,0x00010000);view.setUint16(4,n);view.setUint16(6,power*16);
    view.setUint16(8,Math.log2(power));view.setUint16(10,n*16-power*16);
    let offset=start;
    for(const [i,tag] of tags.entries()){
      const bytes=tables.get(tag).slice();
      if(tag==='head')new DataView(bytes.buffer).setUint32(8,0);
      output.set(bytes,offset);
      for(let j=0;j<4;j++)output[12+i*16+j]=tag.charCodeAt(j);
      view.setUint32(12+i*16+4,checksum(bytes));
      view.setUint32(12+i*16+8,offset);
      view.setUint32(12+i*16+12,bytes.length);
      offset+=(bytes.length+3)&~3;
    }
    const head=tags.indexOf('head');
    if(head>=0){const headOffset=view.getUint32(12+head*16+8);
      view.setUint32(headOffset+8,(0xB1B0AFBA-checksum(output))>>>0);
    }
    return output;
  }
  function serialize(){
    if(!model.font)throw Error('No font has loaded.');
    const font=data();
    // The library otherwise assigns the .null name to unencoded shaping glyphs.
    for(const glyph of font.glyf)if(!Array.isArray(glyph.unicode))glyph.unicode=[];
    font['OS/2'].sTypoAscender=font.hhea.ascent;font['OS/2'].sTypoDescender=font.hhea.descent;
    font['OS/2'].usWinAscent=Math.max(font.hhea.ascent,...font.glyf.map(g=>g.yMax||0));
    font['OS/2'].usWinDescent=Math.max(-font.hhea.descent,...font.glyf.map(g=>-(g.yMin||0)));
    // Keep every glyph index stable: Khmer GSUB/GDEF/GPOS refer to those indices.
    const exported=model.font.write({type:'ttf',kerning:true,hinting:false});
    const bytes=new Uint8Array(exported);
    const complete=preserveKhmerLayout(bytes,model.source);
    const check=F.createFont(complete.buffer.slice(complete.byteOffset,complete.byteOffset+complete.byteLength),{type:'ttf'});
    if(check.get().glyf.length!==data().glyf.length)throw Error('Font export failed glyph verification.');
    return complete;
  }
  const db=()=>new Promise((resolve,reject)=>{
    const req=indexedDB.open('WriterHelperFontDrafts',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('fonts');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  async function getDraft(era){
    const database=await db();
    return new Promise((resolve,reject)=>{const tx=database.transaction('fonts');
      const req=tx.objectStore('fonts').get(era);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
      tx.oncomplete=()=>database.close();
    });
  }
  async function saveDraft(silent=false){
    if(!model.font)return;
    const bytes=serialize(),era=model.era,database=await db();
    await new Promise((resolve,reject)=>{const tx=database.transaction('fonts','readwrite');
      tx.objectStore('fonts').put(bytes,era);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
    database.close();model.dirty=false;
    if(!silent)status(era+' font saved in this browser. Export a TTF or project JSON for a portable copy.');
  }
  async function loadBuffer(bytes,era){
    const fontType=String.fromCharCode(...bytes.slice(0,4))==='OTTO'?'otf':'ttf';
    const font=F.createFont(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),
      {type:fontType,kerning:true,hinting:true,compound2simple:true});
    model.font=font;model.source=bytes.slice();model.selected=Math.min(6,font.get().glyf.length-1);
    model.era=era;model.baseline=0;model.spacing=0;model.dirty=false;
    $('wh-font-baseline').value=0;$('wh-font-spacing').value=0;
    $('wh-font-baseline-value').textContent='0';$('wh-font-spacing-value').textContent='0';
    render();renderKerning();
  }
  async function loadEra(era){
    if(!eras.includes(era)||model.busy)return;
    model.busy=true;
    $('wh-font-era').disabled=true;
    try{
      if(model.dirty)await saveDraft(true);
      let stored=null;try{stored=await getDraft(era)}catch(error){status('Local draft storage is unavailable: '+error.message)}
      let bytes=stored&&new Uint8Array(stored);
      if(!bytes&&['Archaic','Classical','Traditional','Modern'].includes(era)){
        const url=new URL('assets/ttf/Azaaraan-'+era+'.ttf',fileBase);
        const response=await fetch(url);if(!response.ok)throw Error('Could not load '+url.pathname);
        bytes=new Uint8Array(await response.arrayBuffer());
      }
      if(bytes)await loadBuffer(bytes,era);
      else{
        model.font=F.createFont();model.source=null;model.era=era;model.selected=0;
        model.baseline=0;model.spacing=0;model.dirty=false;
        const f=data();f.head.unitsPerEm=1024;f.hhea.ascent=812;f.hhea.descent=-212;
        f.name.fontFamily='Aza’raan '+era;f.name.fontSubFamily='Regular';render();renderKerning();
      }
      status(stored?era+' draft restored.':era+' font ready. '+(bytes?'Original era glyphs loaded.':'Upload glyphs to start this era.'));
    }catch(error){status('Font load failed: '+error.message);console.error(error)}
    finally{model.busy=false;$('wh-font-era').disabled=false}
  }
  function render(){
    if(!data())return;
    for(const [key,id] of Object.entries(fields))$(id).value=data().name[key]||'';
    $('wh-font-ascender').value=data().hhea.ascent;
    $('wh-font-descender').value=data().hhea.descent;
    list();select(model.selected);
    $('wh-font-proof').textContent=$('wh-font-proof-input').value;
  }
  function list(){
    const host=$('wh-font-glyph-list'),search=$('wh-font-search').value.trim().toLowerCase();
    host.replaceChildren();
    data().glyf.forEach((glyph,index)=>{
      const label=(glyph.name||'glyph '+index)+' '+(glyph.unicode||[]).map(hex).join(' ');
      if(search&&!label.toLowerCase().includes(search))return;
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===model.selected));
      button.onclick=()=>select(index);host.append(button);
    });
  }
  function select(index){
    const glyph=data()?.glyf[index];if(!glyph)return;
    model.selected=index;
    $('wh-font-codepoint').value=(glyph.unicode||[]).map(hex).join(', ');
    $('wh-font-glyph-name').value=glyph.name||'';
    $('wh-font-advance').value=glyph.advanceWidth??0;
    [...$('wh-font-glyph-list').children].forEach(b=>b.setAttribute('aria-selected',String(b.textContent===(glyph.name||'glyph '+index)+' '+(glyph.unicode||[]).map(hex).join(' '))));
    draw(glyph);
  }
  function draw(glyph){
    const canvas=$('wh-font-canvas'),ctx=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height,upm=data().head.unitsPerEm||1000;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f2e8d8';ctx.fillRect(0,0,w,h);
    const scale=Math.min((h-52)/(upm*1.6),(w-110)/(Math.max(upm,glyph.advanceWidth||upm)));
    const baseline=Math.round(h*.75),left=70;
    ctx.strokeStyle='#b07a3a';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,baseline+.5);ctx.lineTo(w,baseline+.5);ctx.stroke();
    ctx.fillStyle='#865a2a';ctx.font='12px system-ui';ctx.fillText('baseline',8,baseline-6);
    ctx.save();ctx.translate(left,baseline);ctx.scale(scale,-scale);
    ctx.fillStyle='#123f48';ctx.strokeStyle='#1c7380';ctx.lineWidth=3;
    ctx.beginPath();
    for(const points of glyph.contours||[]){
      if(!points?.length)continue;
      const n=points.length,first=points[0],last=points[n-1];
      const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
      const start=first.onCurve?first:last.onCurve?last:mid(first,last);
      ctx.moveTo(start.x,start.y);
      for(let i=0;i<n;i++){
        const point=points[i],next=points[(i+1)%n];
        if(point.onCurve)ctx.lineTo(point.x,point.y);
        else if(next.onCurve){ctx.quadraticCurveTo(point.x,point.y,next.x,next.y);i++}
        else{const join=mid(point,next);ctx.quadraticCurveTo(point.x,point.y,join.x,join.y)}
      }
      ctx.closePath();
    }
    ctx.fill('nonzero');ctx.stroke();ctx.restore();
    if(!glyph.contours?.length){ctx.fillStyle='#65594d';ctx.font='16px Georgia';ctx.fillText('No outline yet — upload an SVG or PNG.',left,baseline-70)}
  }
  function renderKerning(){
    const list=$('wh-font-kern-list');list.replaceChildren();
    const pairs=geometry.kerningPairs(data().kern);
    if(!pairs.size){list.textContent='No custom pairs. Negative values bring two letters closer.';return}
    for(const [key,amount] of pairs){
      const row=document.createElement('div'),indices=key.split(',').map(Number);
      const label=document.createElement('span');
      label.textContent=indices.map(i=>data().glyf[i]?.unicode?.map(hex).join('/')||data().glyf[i]?.name||i).join(' + ')+' : '+amount;
      const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';
      remove.onclick=()=>{pairs.delete(key);data().kern=geometry.writeKerning(pairs);renderKerning();markDirty()};
      row.append(label,remove);list.append(row);
    }
  }
  function updateMetadata(){
    if(!data())return;
    for(const [key,id] of Object.entries(fields))data().name[key]=$(id).value.trim();
    const name=(data().name.fontFamily||'Azaaraan')+' '+(data().name.fontSubFamily||'Regular');
    data().name.fullName=name;
    data().name.preferredFamily=data().name.fontFamily;
    data().name.preferredSubFamily=data().name.fontSubFamily;
    data().name.uniqueSubFamily=name+' '+(data().name.version||'Version 1.0');
    data().name.postScriptName=name.normalize('NFKD').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,63)||'AzaaraanFont';
    markDirty();
  }
  function shiftBaseline(value){
    const next=number(value),delta=next-model.baseline;if(!delta)return;
    for(const glyph of data().glyf){
      for(const contour of glyph.contours||[])for(const point of contour)point.y+=delta;
      geometry.bounds(glyph);
    }
    model.baseline=next;$('wh-font-baseline-value').textContent=String(next);draw(current());markDirty();
  }
  function changeSpacing(value){
    const next=number(value),delta=next-model.spacing;if(!delta)return;
    for(const glyph of data().glyf){if(glyph.advanceWidth>0)glyph.advanceWidth=Math.max(1,glyph.advanceWidth+delta)}
    model.spacing=next;$('wh-font-spacing-value').textContent=String(next);select(model.selected);markDirty();
  }
  function svgImport(text){
    const doc=new DOMParser().parseFromString(text,'image/svg+xml');
    if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Upload a valid SVG with outlined paths.');
    for(const node of [...doc.querySelectorAll('script,foreignObject,image,use,text,style')])node.remove();
    const svg=new XMLSerializer().serializeToString(doc);
    const imported=F.createFont(svg,{type:'svg',combinePath:true}).get();
    const outline=imported.glyf.find(g=>g.contours?.length);
    if(!outline)throw Error('The SVG has no supported vector outlines. Convert text or strokes to paths first.');
    const target=current(),ratio=(data().head.unitsPerEm||1000)/(imported.head.unitsPerEm||1024);
    target.contours=outline.contours.map(contour=>contour.map(p=>({x:Math.round(p.x*ratio),y:Math.round(p.y*ratio),onCurve:p.onCurve!==false})));
    const points=target.contours.flat();
    target.xMin=Math.min(...points.map(p=>p.x));target.xMax=Math.max(...points.map(p=>p.x));
    target.yMin=Math.min(...points.map(p=>p.y));target.yMax=Math.max(...points.map(p=>p.y));
    target.leftSideBearing=target.xMin;
    target.compound=false;delete target.glyfs;delete target.instructions;
    if(!target.advanceWidth)target.advanceWidth=Math.max(350,Math.ceil((outline.xMax-outline.xMin)*ratio+100));
    select(model.selected);markDirty();
  }
  async function pngToSvg(file){
    const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');
    const scale=Math.min(256/bitmap.width,256/bitmap.height,1);
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    return geometry.traceMask(geometry.rasterMask(pixels,canvas.width,canvas.height,$('wh-font-ink').value,number($('wh-font-threshold').value,170)),canvas.width,canvas.height);
  }
  async function uploadGlyph(file){
    if(!file||!current())return;
    if(file.size>8*1024*1024)throw Error('Glyph image is too large (8 MB maximum).');
    const text=/\.png$/i.test(file.name)?await pngToSvg(file):await file.text();
    svgImport(text);status('Glyph outline imported. Inspect the preview and export a TTF when ready.');
  }
  async function proof(useInBooks=false){
    const bytes=serialize();
    if(model.proofFace)document.fonts.delete(model.proofFace);
    if(model.proofUrl)URL.revokeObjectURL(model.proofUrl);
    model.proofUrl=URL.createObjectURL(new Blob([bytes],{type:'font/ttf'}));
    const family=useInBooks?'WH-'+model.era+'-'+Date.now():'WH-Proof-'+Date.now();
    const face=new FontFace(family,`url("${model.proofUrl}")`);
    await face.load();document.fonts.add(face);model.proofFace=face;
    $('wh-font-proof').style.fontFamily=`"${family}",Georgia,serif`;
    $('wh-font-proof').textContent=$('wh-font-proof-input').value;
    if(useInBooks){
      await window.LiteraryFriendApp.registerFont({id:family,name:(data().name.fontFamily||model.era)+' · '+model.era,family,era:model.era,blob:new Blob([bytes],{type:'font/ttf'})});
      applied[model.era]=family;localStorage.setItem(appliedKey,JSON.stringify(applied));
      window.dispatchEvent(new Event('writerhelper:font-applied'));
      await saveDraft(true);
      status(model.era+' font saved for books, reloads, document exports and complete backups.');
    }
    else status('Proof preview updated from the current TTF.');
  }
  function bind(){
    $('wh-open-font-workshop').onclick=()=>{
      $('wh-font-workshop').hidden=false;
      const era=window.LiteraryFriendApp?.currentDocument()?.title;
      if(eras.includes(era)&&era!==model.era){$('wh-font-era').value=era;void loadEra(era)}
    };
    $('wh-font-close').onclick=()=>{$('wh-font-workshop').hidden=true;};
    $('wh-font-era').onchange=event=>{void loadEra(event.target.value)};
    $('wh-font-search').oninput=list;
    for(const id of Object.values(fields))$(id).oninput=updateMetadata;
    $('wh-font-baseline').oninput=e=>shiftBaseline(e.target.value);
    $('wh-font-spacing').oninput=e=>changeSpacing(e.target.value);
    for(const [id,key] of [['wh-font-ascender','ascent'],['wh-font-descender','descent']]){
      $(id).onchange=e=>{data().hhea[key]=number(e.target.value);markDirty()};
    }
    $('wh-font-codepoint').onchange=e=>{
      try{const glyph=current(),points=e.target.value.trim()?e.target.value.split(',').map(code):[];
        if(data().glyf.some(g=>g!==glyph&&g.unicode?.some(cp=>points.includes(cp))))throw Error('That Unicode slot belongs to another glyph.');
        glyph.unicode=[...new Set(points)];list();markDirty()}
      catch(error){status(error.message);select(model.selected)}
    };
    $('wh-font-glyph-name').onchange=e=>{current().name=e.target.value.trim();list();markDirty()};
    $('wh-font-advance').onchange=e=>{current().advanceWidth=Math.max(0,number(e.target.value));draw(current());markDirty()};
    $('wh-font-transform').onclick=()=>{
      const glyph=current();if(!glyph)return;
      geometry.transform(glyph,{x:number($('wh-font-offset-x').value),y:number($('wh-font-offset-y').value),scaleX:number($('wh-font-scale-x').value,100)/100,scaleY:number($('wh-font-scale-y').value,100)/100});
      select(model.selected);markDirty();
      $('wh-font-offset-x').value=0;$('wh-font-offset-y').value=0;$('wh-font-scale-x').value=100;$('wh-font-scale-y').value=100;
    };
    $('wh-font-kern-save').onclick=()=>{
      try{
        const slot=id=>{const input=$(id).value.trim(),cp=[...input].length===1?input.codePointAt(0):code(input);
          const index=data().glyf.findIndex(g=>g.unicode?.includes(cp));if(index<0)throw Error('No glyph is mapped to '+hex(cp));return index};
        const pairs=geometry.kerningPairs(data().kern);pairs.set(slot('wh-font-kern-left')+','+slot('wh-font-kern-right'),Math.max(-2000,Math.min(2000,number($('wh-font-kern-value').value))));
        data().kern=geometry.writeKerning(pairs);renderKerning();markDirty();
      }catch(error){status(error.message)}
    };
    $('wh-font-add-glyph').onclick=()=>{
      try{const cp=code($('wh-font-new-codepoint').value);
        if(data().glyf.some(g=>g.unicode?.includes(cp)))throw Error('That Unicode slot already exists. Select it from the list to replace its outline.');
        const name='glyph_'+cp.toString(16).toUpperCase();
        data().glyf.push({name,unicode:[cp],advanceWidth:Math.max(1,number($('wh-font-advance').value,800)),contours:[]});
        list();select(data().glyf.length-1);$('wh-font-new-codepoint').value='';markDirty();
      }catch(error){status(error.message)}
    };
    $('wh-font-glyph-upload').onchange=e=>{
      const file=e.target.files?.[0];if(file)uploadGlyph(file).catch(error=>status('Glyph import failed: '+error.message));e.target.value='';
    };
    $('wh-font-import').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const bytes=new Uint8Array(await file.arrayBuffer());await loadBuffer(bytes,model.era);markDirty();status('Imported '+file.name+'. Export a TTF to keep your changes.')}
      catch(error){status('Font import failed: '+error.message)}e.target.value='';
    };
    $('wh-font-save').onclick=()=>saveDraft().catch(error=>status('Save failed: '+error.message));
    $('wh-font-export').onclick=()=>{
      try{const bytes=serialize();const name=(familyInput.value||'Azaaraan')+'-'+model.era+'.ttf';
        download(bytes,name.replace(/[^\w .-]+/g,'-'),'font/ttf');status('Exported a valid TrueType font with '+data().glyf.length+' glyphs.');
      }catch(error){status('TTF export failed: '+error.message)}
    };
    $('wh-font-update-preview').onclick=()=>proof().catch(error=>status('Preview failed: '+error.message));
    $('wh-font-use').onclick=()=>proof(true).catch(error=>status('Book font failed: '+error.message));
    $('wh-font-proof-input').oninput=e=>$('wh-font-proof').textContent=e.target.value;
    $('wh-font-export-json').onclick=()=>{
      try{const bytes=serialize();let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
        const project={format:'WriterHelper-font-project/v1',era:model.era,ttf:btoa(binary)};
        download(JSON.stringify(project),`${model.era}-font-project.json`,'application/json');
        status('Exported a portable font project with metadata, outlines, and layout tables.');
      }catch(error){status('Project export failed: '+error.message)}
    };
    $('wh-font-import-json').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const project=JSON.parse(await file.text());
        if(project.format!=='WriterHelper-font-project/v1'||!eras.includes(project.era)||typeof project.ttf!=='string')throw Error('Not a WriterHelper font project.');
        const raw=atob(project.ttf),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
        $('wh-font-era').value=project.era;await loadBuffer(bytes,project.era);markDirty();status('Imported '+project.era+' font project.');
      }catch(error){status('Project import failed: '+error.message)}e.target.value='';
    };
  }
  bind();void loadEra(model.era);
})();
