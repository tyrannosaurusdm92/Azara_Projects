/* Font geometry and raster tracing shared by the workshop and its regression checks. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WriterHelperFontCore=api;
})(globalThis,()=>{
  'use strict';
  function rasterMask(pixels,width,height,mode='auto',threshold=170){
    let transparent=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]<110)transparent++;
    // Inspect the source image, before adding any transparent tracing margins.
    // Otherwise even an opaque white page is misclassified as an alpha silhouette.
    const alpha=mode==='alpha'||mode==='auto'&&transparent>width*height*.03;
    const mask=new Uint8Array(width*height);
    for(let i=0;i<mask.length;i++){
      const k=i*4,a=pixels[k+3],luma=.2126*pixels[k]+.7152*pixels[k+1]+.0722*pixels[k+2];
      mask[i]=alpha?a>110?1:0:a>110&&(mode==='light'?luma>255-threshold:luma<threshold)?1:0;
    }
    return mask;
  }
  function traceMask(mask,width,height){
    const active=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&!!mask[y*width+x];
    const edges=new Map();
    const add=(x,y,xx,yy)=>{const key=x+','+y;const list=edges.get(key)||[];list.push([xx,yy]);edges.set(key,list)};
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(active(x,y)){
      if(!active(x,y-1))add(x,y,x+1,y);
      if(!active(x+1,y))add(x+1,y,x+1,y+1);
      if(!active(x,y+1))add(x+1,y+1,x,y+1);
      if(!active(x-1,y))add(x,y+1,x,y);
    }
    if(!edges.size)throw Error('No glyph ink was found. Try a different ink mode or threshold.');
    const paths=[];
    while(edges.size){
      const [sx,sy]=edges.keys().next().value.split(',').map(Number);
      let at=[sx,sy];const points=[[sx,sy]];
      do{
        const key=at.join(','),nexts=edges.get(key);
        if(!nexts?.length)throw Error('The image outline could not be closed.');
        at=nexts.pop();if(!nexts.length)edges.delete(key);points.push(at);
      }while(at[0]!==sx||at[1]!==sy);
      // Remove points on straight runs, retaining holes and sharp corners.
      const simplified=points.slice(0,-1).filter((p,i,all)=>{
        const a=all[(i+all.length-1)%all.length],b=all[(i+1)%all.length];
        return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);
      });
      if(simplified.length>=3)paths.push('M'+simplified.map(p=>p.join(' ')).join(' L')+' Z');
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="${paths.join(' ')}"/></svg>`;
  }
  function bounds(glyph){
    const points=(glyph.contours||[]).flat();
    if(!points.length)return;
    glyph.xMin=Math.min(...points.map(p=>p.x));glyph.xMax=Math.max(...points.map(p=>p.x));
    glyph.yMin=Math.min(...points.map(p=>p.y));glyph.yMax=Math.max(...points.map(p=>p.y));
    glyph.leftSideBearing=glyph.xMin;
    // Point hinting describes the original outlines and must not survive a geometry edit.
    delete glyph.instructions;
  }
  function transform(glyph,{x=0,y=0,scaleX=1,scaleY=1}){
    for(const contour of glyph.contours||[])for(const point of contour){
      point.x=Math.round(point.x*scaleX+x);point.y=Math.round(point.y*scaleY+y);
    }
    bounds(glyph);
  }
  function kerningPairs(bytes){
    const result=new Map();if(!bytes?.length)return result;
    const view=new DataView(Uint8Array.from(bytes).buffer);
    if(view.byteLength<4||view.getUint16(0)!==0)return result;
    for(let i=0,at=4;i<view.getUint16(2)&&at+6<=view.byteLength;i++){
      const length=view.getUint16(at+2),coverage=view.getUint16(at+4);
      if(length<6||at+length>view.byteLength)break;
      if(coverage>>>8===0&&(coverage&7)===1&&length>=14){
        const n=view.getUint16(at+6);
        for(let j=0;j<n&&at+14+j*6+6<=at+length;j++){
          const p=at+14+j*6,key=view.getUint16(p)+','+view.getUint16(p+2),amount=view.getInt16(p+4);
          result.set(key,(coverage&8)?amount:(result.get(key)||0)+amount);
        }
      }
      at+=length;
    }
    return result;
  }
  function writeKerning(pairs){
    const entries=[...pairs].map(([key,value])=>[...key.split(',').map(Number),value])
      .sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    if(entries.length>10920)throw Error('A font can contain at most 10,920 edited kerning pairs.');
    const bytes=new Uint8Array(18+entries.length*6),v=new DataView(bytes.buffer),n=entries.length;
    v.setUint16(2,1);v.setUint16(6,bytes.length-4);v.setUint16(8,1);v.setUint16(10,n);
    const power=n?2**Math.floor(Math.log2(n)):0;
    v.setUint16(12,power*6);v.setUint16(14,n?Math.log2(power):0);v.setUint16(16,n*6-power*6);
    entries.forEach(([left,right,value],i)=>{const p=18+i*6;v.setUint16(p,left);v.setUint16(p+2,right);v.setInt16(p+4,Math.max(-32768,Math.min(32767,value)))});
    return bytes;
  }
  return Object.freeze({rasterMask,traceMask,bounds,transform,kerningPairs,writeKerning});
});
