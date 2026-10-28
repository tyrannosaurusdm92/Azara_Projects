(function(global){
'use strict';
const LF=global.LiteraryFriend=global.LiteraryFriend||{}, U=LF.util;

function normalizeArt(data={}){
  const palette = Array.isArray(data.palette)
    ? {colors: U.deepClone(data.palette)}
    : U.deepMerge({colors:[]}, data.palette || {});
  return {
    name:data.name||'Cover Art',
    width:Number(data.width||data.canvas?.width||1800),
    height:Number(data.height||data.canvas?.height||2700),
    dpi:Number(data.dpi||300),
    canvas:U.deepMerge({zoom:1,guides:true,safeArea:true},data.canvas||{}),
    layers:Array.isArray(data.layers)?U.deepClone(data.layers):[],
    palette,
    toolSettings:U.deepMerge({tool:'brush',size:16,opacity:1,flow:1,hardness:1,foreground:'#001010',background:'#F2FFFF'},data.toolSettings||{}),
    background:U.deepMerge({type:'transparent',value:'transparent'},data.background||{})
  };
}

class ArtDocument{
  constructor(data={}){
    Object.assign(this,normalizeArt(data));
    this.id=data.id||'';
    this.bookId=data.bookId||'';
    this.history=[];
    this.future=[];
    this.activeLayerId=data.activeLayerId||this.layers[0]?.id||'';
  }
  snapshot(label='change'){
    this.history.push({label,state:JSON.stringify(this.serialize())});
    if(this.history.length>80)this.history.shift();
    this.future.length=0;
  }
  serialize(){
    return {id:this.id,name:this.name,width:this.width,height:this.height,dpi:this.dpi,bookId:this.bookId,canvas:U.deepClone(this.canvas),layers:U.deepClone(this.layers),palette:U.deepClone(this.palette),toolSettings:U.deepClone(this.toolSettings),background:U.deepClone(this.background),activeLayerId:this.activeLayerId};
  }
  layer(id=this.activeLayerId){return this.layers.find(l=>l.id===id)||null;}
  _newLayer(type='raster',name='Layer'){
    return {id:U.uid('layer'),type,name,visible:true,locked:false,opacity:1,blendMode:'source-over',x:0,y:0,scaleX:1,scaleY:1,rotation:0,flipX:false,flipY:false,content:type==='raster'?[]:{text:'',font:'48px Georgia',fill:'#001010'},metadata:{}};
  }
  addLayer(type='raster',name='Layer'){
    this.snapshot('add layer');
    const l=this._newLayer(type,name);
    this.layers.push(l);this.activeLayerId=l.id;return l;
  }
  removeLayer(id){
    if(!this.layers.some(l=>l.id===id))return;
    this.snapshot('remove layer');
    this.layers=this.layers.filter(l=>l.id!==id);this.activeLayerId=this.layers.at(-1)?.id||'';
  }
  duplicateLayer(id){
    const l=this.layer(id);if(!l)return null;
    this.snapshot('duplicate layer');
    const copy=U.deepClone(l);copy.id=U.uid('layer');copy.name=`${copy.name} copy`;this.layers.push(copy);this.activeLayerId=copy.id;return copy;
  }
  moveLayer(id,delta){
    const i=this.layers.findIndex(x=>x.id===id);if(i<0)return;
    const j=Math.max(0,Math.min(this.layers.length-1,i+delta));if(i===j)return;
    this.snapshot('reorder layer');const [l]=this.layers.splice(i,1);this.layers.splice(j,0,l);
  }
  transform(id,patch){
    const l=this.layer(id);if(!l||l.locked)return;
    this.snapshot('transform');Object.assign(l,U.deepClone(patch||{}));
  }
  addStroke(points,style){
    this.snapshot('paint stroke');
    let l=this.layer();
    if(!l||l.type!=='raster'||l.locked){l=this._newLayer('raster','Paint');this.layers.push(l);this.activeLayerId=l.id;}
    l.content.push({kind:'stroke',points:(points||[]).map(p=>({x:Number(p.x||0),y:Number(p.y||0),pressure:Number(p.pressure??.5)})),style:U.deepClone(style||{})});
  }
  addShape(shape,box,style){
    this.snapshot('draw shape');
    let l=this.layer();
    if(!l||l.type!=='raster'||l.locked){l=this._newLayer('raster','Shape');this.layers.push(l);this.activeLayerId=l.id;}
    l.content.push({kind:'shape',shape,box:U.deepClone(box||{}),style:U.deepClone(style||{})});
  }
  addText(text,x,y,style={}){
    this.snapshot('add text');
    const l=this._newLayer('text','Text');
    Object.assign(l,{x:Number(x||0),y:Number(y||0),content:{text:String(text||''),font:style.font||'64px Georgia',fill:style.fill||this.toolSettings.foreground,stroke:style.stroke||'',align:style.align||'left'}});
    this.layers.push(l);this.activeLayerId=l.id;return l;
  }
  undo(){
    const prev=this.history.pop();if(!prev)return false;
    this.future.push({label:'redo',state:JSON.stringify(this.serialize())});
    const restored=JSON.parse(prev.state);const history=this.history,future=this.future;Object.assign(this,normalizeArt(restored),restored,{history,future});return true;
  }
  redo(){
    const next=this.future.pop();if(!next)return false;
    this.history.push({label:'undo',state:JSON.stringify(this.serialize())});
    const restored=JSON.parse(next.state);const history=this.history,future=this.future;Object.assign(this,normalizeArt(restored),restored,{history,future});return true;
  }
}
LF.ArtDocument=ArtDocument;
LF.register('artDocument',ArtDocument);
})(window);
