(function (global) {
  'use strict';
  const LF=global.LFArt, U=LF.util;

  function defaultDocument(){
    return {formatId:'paperback-standard',binding:'Paperback',trimWidth:6,trimHeight:9,coverMode:'front',dpi:300,bleed:0.125,safeMargin:0.25,pageCount:300,paperCaliper:0.00225,spineWidth:0.675,customSpine:false,background:'transparent',guides:true};
  }
  function newProject(title='Untitled Cover'){
    const now=new Date().toISOString();
    return {schema:'literaryfriend-art-project/v1',id:U.uid('project'),title,createdAt:now,updatedAt:now,document:defaultDocument(),layers:[],selectedLayerId:null,meta:{version:LF.VERSION},cloud:{projectId:'',bookId:'',artProjectId:''}};
  }
  function normalizeLayer(layer){
    const base={id:U.uid('layer'),name:'Layer',type:'image',visible:true,locked:false,opacity:1,blend:'source-over',x:0,y:0,w:600,h:900,rotation:0,scaleX:1,scaleY:1,skewX:0,skewY:0,flipX:false,flipY:false,shadow:{enabled:false,color:'#000000',blur:18,x:8,y:8},gradient:{enabled:false,a:'#00ffff',b:'#ca6309',angle:45},filters:{brightness:100,contrast:100,saturation:100,grayscale:0,sepia:0,blur:0,invert:0,hue:0},createdAt:new Date().toISOString()};
    return {...base,...layer,shadow:{...base.shadow,...(layer.shadow||{})},gradient:{...base.gradient,...(layer.gradient||{})},filters:{...base.filters,...(layer.filters||{})}};
  }
  function documentMetrics(doc){
    const spine=doc.customSpine?Number(doc.spineWidth||0):Number(doc.pageCount||0)*Number(doc.paperCaliper||0);
    doc.spineWidth=U.round(spine,4);
    const trimW=Number(doc.trimWidth||6), trimH=Number(doc.trimHeight||9), bleed=Number(doc.bleed||0), dpi=Math.max(36,Number(doc.dpi||300));
    const widthIn=doc.coverMode==='wrap'?(trimW*2+spine+bleed*2):(trimW+bleed*2);
    const heightIn=trimH+bleed*2;
    let widthPx=Math.max(64,Math.round(widthIn*dpi)), heightPx=Math.max(64,Math.round(heightIn*dpi));
    const pixels=widthPx*heightPx;
    let effectiveDpi=dpi;
    if(pixels>LF.CONFIG.maxCanvasPixels){const factor=Math.sqrt(LF.CONFIG.maxCanvasPixels/pixels);widthPx=Math.round(widthPx*factor);heightPx=Math.round(heightPx*factor);effectiveDpi=U.round(dpi*factor,1);}
    return {spine,widthIn,heightIn,widthPx,heightPx,effectiveDpi,requestedDpi:dpi,limited:effectiveDpi!==dpi,trimWidthPx:trimW*effectiveDpi,trimHeightPx:trimH*effectiveDpi,bleedPx:bleed*effectiveDpi,safePx:Number(doc.safeMargin||0)*effectiveDpi,spinePx:spine*effectiveDpi};
  }

  LF.model={defaultDocument,newProject,normalizeLayer,documentMetrics};
})(window);
