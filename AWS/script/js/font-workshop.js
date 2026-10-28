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
  const drawingCanvas=$('wh-font-draw-canvas');
  const drawingContext=drawingCanvas?.getContext('2d',{willReadFrequently:true});
  const drawingDrafts=new Map();
  let drawingLayers=[],activeDrawingLayerId='',drawingPointer=false,drawingLastPoint=null;
  let drawingUndo=[],drawingRedo=[],drawingLoadToken=0,drawingPersistQueue=Promise.resolve();
  const drawingKey=index=>{const glyph=data()?.glyf[index],cp=glyph?.unicode?.[0];return model.era+':'+(Number.isInteger(cp)?'u'+cp.toString(16):'g'+index)};
  const newDrawingLayer=(name='Artwork')=>({id:globalThis.crypto?.randomUUID?.()||'layer-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:String(name||'Artwork').slice(0,80),visible:true,opacity:100,blendMode:'source-over',canvas:Object.assign(document.createElement('canvas'),{width:512,height:512})});
  const activeDrawingLayer=()=>drawingLayers.find(layer=>layer.id===activeDrawingLayerId)||drawingLayers[drawingLayers.length-1]||null;
  const layerContext=layer=>layer?.canvas.getContext('2d',{willReadFrequently:true});
  function persistDrawingDraft(key,value){
    drawingPersistQueue=drawingPersistQueue.catch(()=>{}).then(async()=>{
      const database=await db();
      await new Promise((resolve,reject)=>{
        const tx=database.transaction('fonts','readwrite'),store=tx.objectStore('fonts'),recordKey='artwork:'+key;
        if(value)store.put(value,recordKey);else store.delete(recordKey);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      });
      database.close();
    });
    return drawingPersistQueue;
  }
  async function readDrawingDraft(key,index=null,era=model.era){
    async function read(recordKey){
      const database=await db();
      return new Promise((resolve,reject)=>{
        const tx=database.transaction('fonts'),request=tx.objectStore('fonts').get('artwork:'+recordKey);
        request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);
        tx.oncomplete=()=>database.close();tx.onerror=()=>{database.close();reject(tx.error)};
      });
    }
    const saved=await read(key);
    return saved||(Number.isInteger(index)?read(era+':'+index):null);
  }
  function clearDrawingDrafts(era){
    for(const key of drawingDrafts.keys())if(key.startsWith(era+':'))drawingDrafts.delete(key);
    drawingPersistQueue=drawingPersistQueue.catch(()=>{}).then(async()=>{
      const database=await db();
      await new Promise((resolve,reject)=>{
        const tx=database.transaction('fonts','readwrite'),store=tx.objectStore('fonts'),request=store.getAllKeys();
        request.onsuccess=()=>{for(const key of request.result)if(String(key).startsWith('artwork:'+era+':'))store.delete(key)};
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      });
      database.close();
    });
  }
  function saveDrawingDraft(index=model.selected){
    if(!drawingContext||!data()?.glyf[index])return;
    let hasInk=false;
    for(const layer of drawingLayers){
      const pixels=layerContext(layer).getImageData(0,0,512,512).data;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]){hasInk=true;break}
      if(hasInk)break;
    }
    const key=drawingKey(index);
    const metadata=drawingDrafts.get(key)?.metadata||null;
    if(!hasInk&&!metadata){drawingDrafts.delete(key);void persistDrawingDraft(key,null).catch(error=>console.warn('Could not save glyph layers:',error));return}
    const snapshot={activeLayerId:activeDrawingLayerId,metadata,layers:hasInk?drawingLayers.map(layer=>({id:layer.id,name:layer.name,visible:layer.visible,opacity:layer.opacity,blendMode:layer.blendMode,artwork:layer.canvas.toDataURL('image/png')})):[]};
    drawingDrafts.set(key,snapshot);void persistDrawingDraft(key,snapshot).catch(error=>console.warn('Could not save glyph layers:',error));
  }
  async function loadLayerArtwork(layer,dataUrl){
    if(!dataUrl)return;
    const response=await fetch(dataUrl);if(!response.ok)throw Error('Could not load a saved glyph layer.');
    const bitmap=await createImageBitmap(await response.blob()),ctx=layerContext(layer);
    ctx.clearRect(0,0,512,512);
    if(bitmap.width===512&&bitmap.height===512)ctx.drawImage(bitmap,0,0);
    else{const scale=Math.min(430/bitmap.width,430/bitmap.height),width=bitmap.width*scale,height=bitmap.height*scale;ctx.drawImage(bitmap,(512-width)/2,(512-height)/2,width,height)}
    bitmap.close();
  }
  function renderLayerControls(){
    const host=$('wh-font-layer-list');if(!host)return;host.replaceChildren();
    if(!drawingLayers.length){host.append(Object.assign(document.createElement('p'),{className:'wh-font-layer-empty',textContent:'No artwork layers.'}));return}
    for(const layer of drawingLayers.slice().reverse()){
      const row=document.createElement('div');row.className='wh-font-layer-row';row.setAttribute('role','listitem');row.setAttribute('aria-current',String(layer.id===activeDrawingLayerId));
      const select=document.createElement('button');select.type='button';select.textContent='✎';select.title='Edit '+layer.name;select.setAttribute('aria-label','Edit layer '+layer.name);select.onclick=()=>{activeDrawingLayerId=layer.id;renderLayerControls()};
      const visibility=document.createElement('button');visibility.type='button';visibility.textContent=layer.visible?'◉':'○';visibility.title=layer.visible?'Hide layer':'Show layer';visibility.setAttribute('aria-label',visibility.title+' '+layer.name);visibility.onclick=()=>{layer.visible=!layer.visible;renderDrawingLayers();saveDrawingDraft()};
      const name=document.createElement('input');name.type='text';name.maxLength=80;name.value=layer.name;name.setAttribute('aria-label','Layer name');name.onchange=()=>{layer.name=name.value.trim().slice(0,80)||'Artwork';renderLayerControls();saveDrawingDraft()};
      const opacity=document.createElement('input');opacity.type='range';opacity.min='0';opacity.max='100';opacity.value=String(layer.opacity);opacity.setAttribute('aria-label','Layer opacity');opacity.oninput=()=>{layer.opacity=Number(opacity.value);renderDrawingLayers();saveDrawingDraft()};
      const blend=document.createElement('select');blend.setAttribute('aria-label','Layer blend mode');
      for(const [value,label] of [['source-over','Normal'],['multiply','Multiply'],['screen','Screen']])blend.add(new Option(label,value));
      blend.value=layer.blendMode;blend.onchange=()=>{layer.blendMode=blend.value;renderDrawingLayers();saveDrawingDraft()};
      const up=document.createElement('button');up.type='button';up.textContent='↑';up.title='Move layer up';up.setAttribute('aria-label','Move '+layer.name+' up');up.onclick=()=>moveDrawingLayer(layer.id,1);
      const down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Move layer down';down.setAttribute('aria-label','Move '+layer.name+' down');down.onclick=()=>moveDrawingLayer(layer.id,-1);
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Delete layer';remove.dataset.layerDelete='true';remove.setAttribute('aria-label','Delete '+layer.name);remove.onclick=()=>deleteDrawingLayer(layer.id);
      row.append(select,visibility,name,opacity,blend,up,down,remove);host.append(row);
    }
  }
  function renderDrawingLayers(){
    if(!drawingContext)return;
    drawingContext.clearRect(0,0,512,512);
    for(const layer of drawingLayers){
      if(!layer.visible)continue;
      drawingContext.globalAlpha=layer.opacity/100;drawingContext.globalCompositeOperation=layer.blendMode||'source-over';drawingContext.drawImage(layer.canvas,0,0);
    }
    drawingContext.globalAlpha=1;drawingContext.globalCompositeOperation='source-over';renderLayerControls();
  }
  async function loadDrawingDraft(index){
    if(!drawingContext)return;
    const token=++drawingLoadToken,era=model.era,key=drawingKey(index);
    drawingLayers=[newDrawingLayer('Artwork')];activeDrawingLayerId=drawingLayers[0].id;drawingUndo=[];drawingRedo=[];renderDrawingLayers();
    let saved=drawingDrafts.get(key);
    if(!saved)try{saved=await readDrawingDraft(key,index,era);if(saved)drawingDrafts.set(key,saved)}catch(error){console.warn('Could not restore glyph layers:',error)}
    if(token!==drawingLoadToken||model.selected!==index||model.era!==era||!Array.isArray(saved?.layers))return;
    const restored=[];
    for(const source of saved.layers.slice(0,24)){
      const layer=newDrawingLayer(source.name||'Artwork');layer.id=String(source.id||layer.id);layer.name=String(source.name||'Artwork').slice(0,80);
      layer.visible=source.visible!==false;layer.opacity=Math.max(0,Math.min(100,Number.isFinite(Number(source.opacity))?Number(source.opacity):100));
      layer.blendMode=['source-over','multiply','screen'].includes(source.blendMode)?source.blendMode:'source-over';
      try{await loadLayerArtwork(layer,String(source.artwork||''))}catch(error){console.warn('A glyph layer could not be restored:',error)}
      restored.push(layer);
    }
    if(token!==drawingLoadToken||model.selected!==index||model.era!==era)return;
    if(restored.length)drawingLayers=restored;
    activeDrawingLayerId=drawingLayers.some(layer=>layer.id===saved.activeLayerId)?saved.activeLayerId:drawingLayers[drawingLayers.length-1].id;
    renderDrawingLayers();
  }
  async function savePackageDrawing(index,source){
    const inputs=Array.isArray(source.layers)&&source.layers.length?source.layers.filter(layer=>layer&&typeof layer.artwork==='string'&&layer.artwork.startsWith('data:image/')).slice(0,24):[];
    const layers=inputs.map(layer=>({id:String(layer.id||'').slice(0,120),name:String(layer.name||'Artwork').slice(0,80),visible:layer.visible!==false,opacity:Math.max(0,Math.min(100,Number.isFinite(Number(layer.opacity))?Number(layer.opacity):100)),blendMode:['source-over','multiply','screen'].includes(layer.blendMode)?layer.blendMode:'source-over',artwork:layer.artwork}));
    if(!layers.length&&typeof source.artwork==='string'&&source.artwork.startsWith('data:image/'))layers.push({id:'imported-artwork',name:'Imported artwork',visible:true,opacity:100,blendMode:'source-over',artwork:source.artwork});
    const metadata={};
    for(const field of ['id','name','meaning','category','key','ipa','sound','pronunciation','transliteration','latinSubstitute','notes','lineageNote'])if(source[field]!=null)metadata[field]=String(source[field]).slice(0,12000);
    if(Array.isArray(source.parents))metadata.parents=source.parents.slice(0,100).map(parent=>String(parent).slice(0,200));
    if(Number.isFinite(Number(source.confidence)))metadata.confidence=Math.max(0,Math.min(1,Number(source.confidence)));
    for(const field of ['size','baseline','leftSpacing','rightSpacing','advanceWidth','ascender','descender'])if(Number.isFinite(Number(source[field])))metadata[field]=Number(source[field]);
    if(Array.isArray(source.vectorContours))metadata.vectorContours=source.vectorContours.slice(0,500).map(contour=>({hole:!!contour?.hole,points:(Array.isArray(contour?.points)?contour.points:[]).slice(0,12000).map(pair=>[Number(pair?.[0])||0,Number(pair?.[1])||0])})).filter(contour=>contour.points.length>=3);
    if(!layers.length&&!Object.keys(metadata).length)return;
    const key=drawingKey(index),snapshot={activeLayerId:layers[layers.length-1]?.id||'',layers,metadata};
    drawingDrafts.set(key,snapshot);await persistDrawingDraft(key,snapshot);
    if(model.selected===index)await loadDrawingDraft(index);
  }
  const glyphDetailFields={meaning:'wh-font-glyph-meaning',category:'wh-font-glyph-category',key:'wh-font-glyph-key',ipa:'wh-font-glyph-ipa',sound:'wh-font-glyph-sound',pronunciation:'wh-font-glyph-pronunciation',transliteration:'wh-font-glyph-transliteration',latinSubstitute:'wh-font-glyph-latin',notes:'wh-font-glyph-notes',lineageNote:'wh-font-glyph-lineage'};
  async function loadGlyphStudioDetails(index){
    const era=model.era,key=drawingKey(index);let saved=drawingDrafts.get(key);
    if(!saved)try{saved=await readDrawingDraft(key,index,era);if(saved)drawingDrafts.set(key,saved)}catch(error){console.warn('Could not load glyph research details:',error)}
    if(model.era!==era||model.selected!==index)return;
    const metadata=saved?.metadata||{};
    for(const [field,id] of Object.entries(glyphDetailFields))$(id).value=String(metadata[field]||'');
    $('wh-font-glyph-parents').value=Array.isArray(metadata.parents)?metadata.parents.join(', '):'';
    $('wh-font-glyph-confidence').value=Number.isFinite(metadata.confidence)?String(metadata.confidence):'0';
  }
  function saveGlyphStudioDetails(){
    if(!current())return;
    const key=drawingKey(model.selected),saved=drawingDrafts.get(key)||{activeLayerId:activeDrawingLayerId,layers:[]},metadata={...(saved.metadata||{})};
    for(const [field,id] of Object.entries(glyphDetailFields))metadata[field]=$(id).value.trim().slice(0,field==='notes'?12000:field==='lineageNote'?4000:240);
    metadata.parents=$('wh-font-glyph-parents').value.split(',').map(value=>value.trim().slice(0,200)).filter(Boolean).slice(0,100);
    metadata.confidence=Math.max(0,Math.min(1,Number($('wh-font-glyph-confidence').value)||0));
    const next={...saved,metadata,layers:Array.isArray(saved.layers)?saved.layers:[]};drawingDrafts.set(key,next);
    void persistDrawingDraft(key,next).then(()=>status('Glyph metadata saved locally.')).catch(error=>status('Glyph metadata save failed: '+error.message));
  }
  function invalidatePackageVector(index=model.selected){
    const key=drawingKey(index),saved=drawingDrafts.get(key);
    if(!saved?.metadata?.vectorContours?.length)return;
    const next={...saved,metadata:{...saved.metadata,vectorContours:[]}};
    drawingDrafts.set(key,next);void persistDrawingDraft(key,next).catch(error=>console.warn('Could not update Glyph Studio project metadata:',error));
  }
  function drawingSnapshot(){
    const layer=activeDrawingLayer();if(!layer)return;
    drawingUndo.push({layerId:layer.id,pixels:layerContext(layer).getImageData(0,0,512,512)});
    if(drawingUndo.length>30)drawingUndo.shift();drawingRedo=[];
  }
  function drawingPosition(event){
    const rect=drawingCanvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*512/rect.width,y:(event.clientY-rect.top)*512/rect.height};
  }
  function drawInk(from,to){
    const layer=activeDrawingLayer();if(!layer)return;
    invalidatePackageVector();
    const size=number($('wh-font-brush-size').value,14),ctx=layerContext(layer);
    ctx.save();ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=$('wh-font-brush-color').value;ctx.fillStyle=$('wh-font-brush-color').value;
    ctx.globalCompositeOperation=$('wh-font-draw-tool').value==='erase'?'destination-out':'source-over';ctx.beginPath();
    if(from===to){ctx.arc(from.x,from.y,size/2,0,Math.PI*2);ctx.fill()}else{ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke()}
    ctx.restore();renderDrawingLayers();
  }
  function undoDrawing(){
    const action=drawingUndo.pop(),layer=action&&drawingLayers.find(item=>item.id===action.layerId);if(!layer)return;
    drawingRedo.push({layerId:layer.id,pixels:layerContext(layer).getImageData(0,0,512,512)});layerContext(layer).putImageData(action.pixels,0,0);renderDrawingLayers();saveDrawingDraft();
  }
  function redoDrawing(){
    const action=drawingRedo.pop(),layer=action&&drawingLayers.find(item=>item.id===action.layerId);if(!layer)return;
    drawingUndo.push({layerId:layer.id,pixels:layerContext(layer).getImageData(0,0,512,512)});layerContext(layer).putImageData(action.pixels,0,0);renderDrawingLayers();saveDrawingDraft();
  }
  function clearDrawing(){
    const layer=activeDrawingLayer();if(!layer)return;drawingSnapshot();layerContext(layer).clearRect(0,0,512,512);renderDrawingLayers();saveDrawingDraft();
  }
  function addDrawingLayer(){
    const layer=newDrawingLayer('Layer '+(drawingLayers.length+1));drawingLayers.push(layer);activeDrawingLayerId=layer.id;renderDrawingLayers();saveDrawingDraft();
  }
  function duplicateDrawingLayer(){
    const source=activeDrawingLayer();if(!source)return;
    const layer=newDrawingLayer(source.name+' copy');layer.visible=source.visible;layer.opacity=source.opacity;layer.blendMode=source.blendMode;layerContext(layer).drawImage(source.canvas,0,0);
    drawingLayers.splice(drawingLayers.indexOf(source)+1,0,layer);activeDrawingLayerId=layer.id;renderDrawingLayers();saveDrawingDraft();
  }
  function mergeDrawingLayer(){
    const index=drawingLayers.findIndex(layer=>layer.id===activeDrawingLayerId);if(index<=0)return;
    const above=drawingLayers[index],below=drawingLayers[index-1],ctx=layerContext(below);
    if(above.visible){ctx.globalAlpha=above.opacity/100;ctx.globalCompositeOperation=above.blendMode||'source-over';ctx.drawImage(above.canvas,0,0)}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';drawingLayers.splice(index,1);activeDrawingLayerId=below.id;renderDrawingLayers();saveDrawingDraft();
  }
  function deleteDrawingLayer(id){
    const index=drawingLayers.findIndex(layer=>layer.id===id);if(index<0)return;
    if(drawingLayers.length===1){layerContext(drawingLayers[0]).clearRect(0,0,512,512)}
    else{drawingLayers.splice(index,1);activeDrawingLayerId=drawingLayers[Math.max(0,index-1)].id}
    renderDrawingLayers();saveDrawingDraft();
  }
  function moveDrawingLayer(id,direction){
    const index=drawingLayers.findIndex(layer=>layer.id===id),next=index+direction;if(index<0||next<0||next>=drawingLayers.length)return;
    [drawingLayers[index],drawingLayers[next]]=[drawingLayers[next],drawingLayers[index]];renderDrawingLayers();saveDrawingDraft();
  }
  function traceDrawing(){
    if(!drawingContext||!current())return;
    try{
      renderDrawingLayers();const pixels=drawingContext.getImageData(0,0,512,512).data;
      const svg=geometry.traceMask(geometry.rasterMask(pixels,512,512,'alpha',number($('wh-font-threshold').value,170)),512,512);
      svgImport(svg);status('Layer composite traced into editable font outlines. Adjust the outline or keep editing artwork layers.');
    }catch(error){status('Drawing trace failed: '+error.message)}
  }
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
  async function loadBuffer(bytes,era,discardDrawing=false){
    saveDrawingDraft(model.selected);
    // Artwork stays keyed by Unicode so imported font tables do not orphan editable glyph layers.
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
      saveDrawingDraft(model.selected);
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
    if(model.selected!==index)saveDrawingDraft(model.selected);
    model.selected=index;
    loadDrawingDraft(index);void loadGlyphStudioDetails(index);
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
    invalidatePackageVector();
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
    try{
      const bitmap=await createImageBitmap(file),layer=newDrawingLayer('Imported '+file.name.slice(0,40)),ctx=layerContext(layer);
      const scale=Math.min(430/bitmap.width,430/bitmap.height),width=bitmap.width*scale,height=bitmap.height*scale;
      ctx.drawImage(bitmap,(512-width)/2,(512-height)/2,width,height);bitmap.close();
      drawingLayers.push(layer);activeDrawingLayerId=layer.id;renderDrawingLayers();saveDrawingDraft();
    }catch(error){console.warn('Could not keep an editable raster copy of this glyph file:',error)}
    svgImport(text);status('Glyph outline imported; available artwork is kept as a separate layer.');
  }
  const glyphStudioEraName=id=>({proto:'Proto',ancient:'Ancient',preclassical:'Archaic',archaic:'Archaic',classical:'Classical',traditional:'Traditional',modern:'Modern'})[String(id||'').toLowerCase()];
  function glyphStudioContours(source){
    if(!Array.isArray(source.vectorContours)||!source.vectorContours.length)return [];
    const font=data(),upm=(font.head.unitsPerEm||1000)/1000;
    const width=Math.max(100,number(source.advanceWidth,600));
    const sideBearings=number(source.leftSpacing)+number(source.rightSpacing);
    const scale=.78*Math.max(80,width-sideBearings)/512*(number(source.size,100)/100)*upm;
    const baseline=Number.isFinite(Number(source.baseline))?Number(source.baseline):72;
    const baseY=512*baseline/100,leftPad=number(source.leftSpacing);
    const result=[];
    for(const contour of source.vectorContours.slice(0,500)){
      const raw=Array.isArray(contour?.points)?contour.points:[];
      if(raw.length<3||raw.length>12000)continue;
      const points=raw.map(pair=>{
        const x=Number(pair?.[0]),y=Number(pair?.[1]);
        if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>20||Math.abs(y)>20)throw Error('The glyph project contains invalid vector points.');
        return {x:Math.round(leftPad+x*512*scale),y:Math.round((baseY-y*512)*scale),onCurve:true};
      });
      let area=0;
      for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a.x*b.y-b.x*a.y}
      if((area>0)!==!contour.hole)points.reverse();
      result.push(points);
    }
    return result;
  }
  async function traceGlyphStudioArtwork(dataUrl){
    const response=await fetch(dataUrl);if(!response.ok)throw Error('Could not read glyph artwork.');
    const blob=await response.blob();if(blob.size>8*1024*1024)throw Error('A glyph artwork image exceeds the 8 MB limit.');
    const bitmap=await createImageBitmap(blob),scale=Math.min(512/bitmap.width,512/bitmap.height,1);
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    return geometry.traceMask(geometry.rasterMask(pixels,canvas.width,canvas.height,$('wh-font-ink').value,number($('wh-font-threshold').value,170)),canvas.width,canvas.height);
  }
  async function importGlyphStudioProject(project){
    if(project?.schemaVersion!==2||!project.eras||typeof project.eras!=='object')throw Error('This is not an Aza’raan Glyph Studio .azglyph.json project.');
    const entries=Object.entries(project.eras).filter(([,era])=>Array.isArray(era?.glyphs));
    if(!entries.length)throw Error('The glyph project has no era inventories.');
    let chosen=entries.find(([id])=>glyphStudioEraName(id)===model.era);
    if(!chosen)chosen=entries.find(([id])=>id===project.activeEra)||entries[0];
    const sourceEraId=chosen[0],sourceEra=chosen[1],targetEra=glyphStudioEraName(sourceEraId)||model.era;
    if(targetEra!==model.era){$('wh-font-era').value=targetEra;await loadEra(targetEra)}
    const settings=project.settings||{};
    if(settings.fontFamily){data().name.fontFamily=String(settings.fontFamily).slice(0,80);$('wh-font-family').value=data().name.fontFamily}
    if(settings.fontVersion){data().name.version=String(settings.fontVersion).slice(0,60);$('wh-font-version').value=data().name.version}
    if(Number.isFinite(Number(settings.ascender))&&Number(settings.ascender)>0){data().hhea.ascent=number(settings.ascender);$('wh-font-ascender').value=data().hhea.ascent}
    if(Number.isFinite(Number(settings.descender))&&Number(settings.descender)>0){data().hhea.descent=-Math.abs(number(settings.descender));$('wh-font-descender').value=data().hhea.descent}
    updateMetadata();
    const seen=new Set();let added=0,updated=0,traced=0,skipped=0;
    for(const source of sourceEra.glyphs.slice(0,2000)){
      const chars=Array.from(String(source.character||''));
      const cp=Number.isInteger(source.codepoint)?source.codepoint:(chars.length===1?chars[0].codePointAt(0):NaN);
      if(!Number.isInteger(cp)||cp<0||cp>0x10ffff||cp>=0xd800&&cp<=0xdfff||seen.has(cp)){skipped++;continue}
      let vector=[];try{vector=glyphStudioContours(source)}catch(error){skipped++;continue}
      const visibleArtwork=source.layers?.find(layer=>layer?.visible!==false&&typeof layer?.artwork==='string'&&layer.artwork.startsWith('data:image/'))?.artwork;
      const artworkCandidate=source.artwork||visibleArtwork;
      const artwork=typeof artworkCandidate==='string'&&artworkCandidate.startsWith('data:image/')?artworkCandidate:'';
      const hasLayers=Array.isArray(source.layers)&&source.layers.some(layer=>typeof layer?.artwork==='string'&&layer.artwork.startsWith('data:image/'));
      if(!vector.length&&!artwork&&!hasLayers){skipped++;continue}
      seen.add(cp);
      let index=data().glyf.findIndex(glyph=>glyph.unicode?.includes(cp));
      if(index<0){index=data().glyf.length;data().glyf.push({name:'glyph_'+cp.toString(16).toUpperCase(),unicode:[cp],advanceWidth:Math.max(100,number(source.advanceWidth,600)),contours:[]});added++}
      else updated++;
      const target=data().glyf[index];
      target.name=String(source.name||'glyph_'+cp.toString(16).toUpperCase()).slice(0,80);
      target.unicode=[cp];
      target.advanceWidth=Math.max(100,Math.min(4000,number(source.advanceWidth,target.advanceWidth||600)));
      if(vector.length){target.contours=vector;geometry.bounds(target)}
      else if(artwork){
        try{select(index);svgImport(await traceGlyphStudioArtwork(artwork));traced++}
        catch(error){skipped++;status('One glyph could not be traced: '+error.message)}
      }
      await savePackageDrawing(index,source);
    }
    render();select(Math.min(model.selected,data().glyf.length-1));renderKerning();markDirty();
    status('Imported '+targetEra+' Glyph Studio project: '+added+' added, '+updated+' updated, '+traced+' raster artwork traced, '+skipped+' skipped.');
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
  function rasterGlyphArtwork(glyph){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext('2d'),contours=glyph.contours||[];let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const contour of contours)for(const point of contour){minX=Math.min(minX,point.x);minY=Math.min(minY,point.y);maxX=Math.max(maxX,point.x);maxY=Math.max(maxY,point.y)}
    if(!Number.isFinite(minX))return '';
    const scale=Math.min(432/Math.max(1,maxX-minX),432/Math.max(1,maxY-minY));
    ctx.translate(256-(minX+maxX)/2*scale,256+(minY+maxY)/2*scale);ctx.scale(scale,-scale);ctx.fillStyle='#000';ctx.beginPath();
    for(const points of contours){
      if(!points?.length)continue;
      const n=points.length,first=points[0],last=points[n-1],mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
      const start=first.onCurve?first:last.onCurve?last:mid(first,last);ctx.moveTo(start.x,start.y);
      for(let i=0;i<n;i++){const point=points[i],next=points[(i+1)%n];if(point.onCurve)ctx.lineTo(point.x,point.y);else if(next.onCurve){ctx.quadraticCurveTo(point.x,point.y,next.x,next.y);i++}else{const join=mid(point,next);ctx.quadraticCurveTo(point.x,point.y,join.x,join.y)}}
      ctx.closePath();
    }
    ctx.fill('nonzero');return canvas.toDataURL('image/png');
  }
  async function exportGlyphStudioProject(){
    const eraIds={Proto:'proto',Ancient:'ancient',Archaic:'preclassical',Classical:'classical',Traditional:'traditional',Modern:'modern'};
    const eraId=eraIds[model.era]||model.era.toLowerCase(),font=data(),glyphs=[];
    for(let index=0;index<font.glyf.length;index++){
      const glyph=font.glyf[index],key=drawingKey(index);
      let saved=drawingDrafts.get(key);
      if(!saved)try{saved=await readDrawingDraft(key,index)}catch(error){console.warn('Could not include glyph artwork:',error)}
      const metadata=saved?.metadata||{},cp=Number.isInteger(glyph.unicode?.[0])?glyph.unicode[0]:null;
      const layers=Array.isArray(saved?.layers)?saved.layers.slice():[];
      if(!layers.length){const artwork=rasterGlyphArtwork(glyph);if(artwork)layers.push({id:'aws-outline-preview-'+index,name:'Font outline artwork',visible:true,opacity:100,blendMode:'source-over',artwork})}
      glyphs.push({
        id:String(metadata.id||'aws-'+eraId+'-'+index).slice(0,150),era:eraId,order:index,
        character:cp==null?'':String.fromCodePoint(cp),codepoint:cp,name:String(metadata.name||glyph.name||'glyph_'+index).slice(0,100),
        meaning:String(metadata.meaning||''),category:String(metadata.category||''),key:String(metadata.key||''),
        ipa:String(metadata.ipa||''),sound:String(metadata.sound||''),pronunciation:String(metadata.pronunciation||''),
        transliteration:String(metadata.transliteration||''),latinSubstitute:String(metadata.latinSubstitute||''),
        notes:String(metadata.notes||''),parents:Array.isArray(metadata.parents)?metadata.parents:[],
        confidence:Number.isFinite(metadata.confidence)?metadata.confidence:0,lineageNote:String(metadata.lineageNote||''),
        size:Number.isFinite(metadata.size)?metadata.size:100,baseline:Number.isFinite(metadata.baseline)?metadata.baseline:72,
        leftSpacing:Number.isFinite(metadata.leftSpacing)?metadata.leftSpacing:0,rightSpacing:Number.isFinite(metadata.rightSpacing)?metadata.rightSpacing:0,
        advanceWidth:Number(glyph.advanceWidth)||600,ascender:Number(metadata.ascender)||font.hhea.ascent,descender:Number(metadata.descender)||Math.abs(font.hhea.descent),
        vectorContours:Array.isArray(metadata.vectorContours)?metadata.vectorContours:[],
        layers,
        artwork:layers.find(layer=>layer.visible&&layer.artwork)?.artwork||''
      });
    }
    const project={
      schemaVersion:2,projectId:'aws-'+eraId+'-'+Date.now().toString(36),name:String(font.name.fontFamily||'Aza’raan Glyph Studio'),
      language:'Aza’raan',activeEra:eraId,eraOrder:[eraId],
      eras:{[eraId]:{id:eraId,label:model.era,backendEra:eraId==='preclassical'?'archaic':eraId,targetCount:glyphs.length,glyphs}},
      settings:{fontFamily:String(font.name.fontFamily||'Aza’raan '+model.era),fontVersion:String(font.name.version||'1.0'),
        ascender:Number(font.hhea.ascent)||800,descender:Math.abs(Number(font.hhea.descent)||200),
        letterSpacing:Number(model.spacing)||0,baselineShift:Number(model.baseline)||0,lineSpacing:1.45,glyphSize:100}
    };
    download(JSON.stringify(project),model.era+'-glyph-studio.azglyph.json','application/json');
    status('Exported this era as a portable .azglyph.json project with glyph metadata and saved artwork layers.');
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
    $('wh-font-codepoint').onchange=async e=>{
      try{
        const glyph=current(),points=e.target.value.trim()?e.target.value.split(',').map(code):[];
        if(data().glyf.some(g=>g!==glyph&&g.unicode?.some(cp=>points.includes(cp))))throw Error('That Unicode slot belongs to another glyph.');
        const oldKey=drawingKey(model.selected);let saved=drawingDrafts.get(oldKey);
        if(!saved)try{saved=await readDrawingDraft(oldKey,model.selected)}catch(error){console.warn('Could not migrate glyph artwork:',error)}
        glyph.unicode=[...new Set(points)];
        const newKey=drawingKey(model.selected);
        if(saved&&oldKey!==newKey){drawingDrafts.set(newKey,saved);drawingDrafts.delete(oldKey);await persistDrawingDraft(newKey,saved);await persistDrawingDraft(oldKey,null)}
        list();markDirty()
      }catch(error){status(error.message);select(model.selected)}
    };
    $('wh-font-glyph-name').onchange=e=>{
      const glyph=current();glyph.name=e.target.value.trim();
      const key=drawingKey(model.selected),saved=drawingDrafts.get(key);
      if(saved?.metadata){const next={...saved,metadata:{...saved.metadata,name:glyph.name}};drawingDrafts.set(key,next);void persistDrawingDraft(key,next).catch(error=>console.warn('Could not save glyph name:',error))}
      list();markDirty();
    };
    $('wh-font-advance').onchange=e=>{current().advanceWidth=Math.max(0,number(e.target.value));draw(current());markDirty()};
    $('wh-font-transform').onclick=()=>{
      const glyph=current();if(!glyph)return;
      invalidatePackageVector();
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
    $('wh-font-draw-canvas').addEventListener('pointerdown',event=>{
      if(!model.font||event.button!==0)return;
      event.preventDefault();drawingPointer=true;drawingCanvas.setPointerCapture(event.pointerId);
      drawingSnapshot();drawingLastPoint=drawingPosition(event);drawInk(drawingLastPoint,drawingLastPoint);
    });
    $('wh-font-draw-canvas').addEventListener('pointermove',event=>{
      if(!drawingPointer)return;
      event.preventDefault();const next=drawingPosition(event);drawInk(drawingLastPoint,next);drawingLastPoint=next;
    });
    const endDrawing=()=>{if(!drawingPointer)return;drawingPointer=false;drawingLastPoint=null;saveDrawingDraft()};
    $('wh-font-draw-canvas').addEventListener('pointerup',endDrawing);
    $('wh-font-draw-canvas').addEventListener('pointercancel',endDrawing);
    $('wh-font-brush-size').oninput=e=>$('wh-font-brush-size-value').textContent=number(e.target.value,14)+' px';
    $('wh-font-draw-undo').onclick=undoDrawing;
    $('wh-font-draw-redo').onclick=redoDrawing;
    $('wh-font-draw-clear').onclick=clearDrawing;
    $('wh-font-draw-trace').onclick=traceDrawing;
    $('wh-font-glyph-details-save').onclick=saveGlyphStudioDetails;
    for(const id of [...Object.values(glyphDetailFields),'wh-font-glyph-parents','wh-font-glyph-confidence'])$(id).addEventListener('change',saveGlyphStudioDetails);
    $('wh-font-layer-add').onclick=addDrawingLayer;
    $('wh-font-layer-duplicate').onclick=duplicateDrawingLayer;
    $('wh-font-layer-merge').onclick=mergeDrawingLayer;
    $('wh-font-layer-delete').onclick=()=>deleteDrawingLayer(activeDrawingLayerId);
    $('wh-font-layer-up').onclick=()=>moveDrawingLayer(activeDrawingLayerId,1);
    $('wh-font-layer-down').onclick=()=>moveDrawingLayer(activeDrawingLayerId,-1);
    $('wh-font-glyph-upload').onchange=e=>{
      const file=e.target.files?.[0];if(file)uploadGlyph(file).catch(error=>status('Glyph import failed: '+error.message));e.target.value='';
    };
    $('wh-font-import').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const bytes=new Uint8Array(await file.arrayBuffer());await loadBuffer(bytes,model.era,true);markDirty();status('Imported '+file.name+'. Export a TTF to keep your changes.')}
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
    $('wh-font-export-azglyph').onclick=()=>exportGlyphStudioProject().catch(error=>status('Glyph project export failed: '+error.message));
    $('wh-font-export-json').onclick=()=>{
      try{const bytes=serialize();let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
        const project={format:'WriterHelper-font-project/v1',era:model.era,ttf:btoa(binary)};
        download(JSON.stringify(project),`${model.era}-font-project.json`,'application/json');
        status('Exported a portable font project with metadata, outlines, and layout tables.');
      }catch(error){status('Project export failed: '+error.message)}
    };
    $('wh-font-import-json').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        if(file.size>40*1024*1024)throw Error('Project JSON is too large (40 MB maximum).');
        const project=JSON.parse(await file.text());
        if(project.format==='WriterHelper-font-project/v1'&&eras.includes(project.era)&&typeof project.ttf==='string'){
          const raw=atob(project.ttf),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
          $('wh-font-era').value=project.era;await loadBuffer(bytes,project.era,true);markDirty();status('Imported '+project.era+' font project.');
        }else await importGlyphStudioProject(project);
      }catch(error){status('Project import failed: '+error.message)}e.target.value='';
    };
  }
  bind();void loadEra(model.era);
})();
