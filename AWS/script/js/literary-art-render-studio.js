(function (global) {
  'use strict';
  const LF=global.LFArt, U=LF.util;

  class Renderer {
    constructor(canvas,overlay,frame){
      this.canvas=canvas; this.ctx=canvas.getContext('2d',{alpha:true});
      this.overlay=overlay; this.octx=overlay.getContext('2d',{alpha:true});
      this.frame=frame; this.project=null; this.metrics=null; this.zoom=1;
      this.imageCache=new Map(); this.paintCache=new Map(); this.renderPending=false;
    }
    setProject(project){this.project=project; this.resize();}
    resize(){
      if(!this.project)return;
      this.metrics=LF.model.documentMetrics(this.project.document);
      const {widthPx,heightPx}=this.metrics;
      if(this.canvas.width!==widthPx||this.canvas.height!==heightPx){this.canvas.width=widthPx;this.canvas.height=heightPx;this.overlay.width=widthPx;this.overlay.height=heightPx;}
      this.frame.style.width=`${widthPx}px`; this.frame.style.height=`${heightPx}px`;
      this.setZoom(this.zoom,true); this.requestRender();
    }
    setZoom(value,silent=false){
      this.zoom=U.clamp(value,.05,4);
      this.frame.style.transform=`scale(${this.zoom})`;
      this.frame.style.margin=`${Math.round((this.frame.offsetHeight*(this.zoom-1))/2)}px ${Math.round((this.frame.offsetWidth*(this.zoom-1))/2)}px`;
      if(!silent) document.dispatchEvent(new CustomEvent('lf:zoom',{detail:{zoom:this.zoom}}));
    }
    fitTo(viewport){if(!this.metrics)return;const pad=80,sx=Math.max(.05,(viewport.clientWidth-pad)/this.metrics.widthPx),sy=Math.max(.05,(viewport.clientHeight-pad)/this.metrics.heightPx);this.setZoom(Math.min(1,sx,sy));}
    pointFromEvent(event){const r=this.overlay.getBoundingClientRect();return {x:(event.clientX-r.left)*(this.overlay.width/r.width),y:(event.clientY-r.top)*(this.overlay.height/r.height)};}
    requestRender(){if(this.renderPending)return;this.renderPending=true;requestAnimationFrame(()=>{this.renderPending=false;this.render();});}
    async ensureImage(src){if(!src)return null;if(this.imageCache.has(src))return this.imageCache.get(src);const promise=U.loadImage(src).catch(()=>null);this.imageCache.set(src,promise);return promise;}
    async ensurePaint(layer){if(this.paintCache.has(layer.id))return this.paintCache.get(layer.id);const c=document.createElement('canvas');c.width=this.canvas.width;c.height=this.canvas.height;if(layer.dataUrl){const img=await this.ensureImage(layer.dataUrl);if(img)c.getContext('2d').drawImage(img,0,0,c.width,c.height);}this.paintCache.set(layer.id,c);return c;}
    invalidatePaint(layerId){this.paintCache.delete(layerId);}
    getPaintCanvas(layer){let c=this.paintCache.get(layer.id);if(!c){c=document.createElement('canvas');c.width=this.canvas.width;c.height=this.canvas.height;this.paintCache.set(layer.id,c);if(layer.dataUrl)this.ensureImage(layer.dataUrl).then(img=>{if(img){c.getContext('2d').drawImage(img,0,0,c.width,c.height);this.requestRender();}});}if(c.width!==this.canvas.width||c.height!==this.canvas.height){const n=document.createElement('canvas');n.width=this.canvas.width;n.height=this.canvas.height;n.getContext('2d').drawImage(c,0,0,n.width,n.height);this.paintCache.set(layer.id,n);c=n;}return c;}
    layerTransform(ctx,layer){const cx=layer.x+layer.w/2,cy=layer.y+layer.h/2;ctx.translate(cx,cy);ctx.rotate((Number(layer.rotation)||0)*Math.PI/180);const sx=(layer.flipX?-1:1)*(Number(layer.scaleX)||1),sy=(layer.flipY?-1:1)*(Number(layer.scaleY)||1);ctx.transform(1,Math.tan((Number(layer.skewY)||0)*Math.PI/180),Math.tan((Number(layer.skewX)||0)*Math.PI/180),1,0,0);ctx.scale(sx,sy);ctx.translate(-layer.w/2,-layer.h/2);}
    layerFilter(layer){const f=layer.filters||{};return `brightness(${f.brightness??100}%) contrast(${f.contrast??100}%) saturate(${f.saturation??100}%) grayscale(${f.grayscale??0}%) sepia(${f.sepia??0}%) blur(${f.blur??0}px) invert(${f.invert??0}%) hue-rotate(${f.hue??0}deg)`;}
    async drawLayer(ctx,layer){
      if(!layer.visible)return;ctx.save();ctx.globalAlpha=U.clamp(layer.opacity??1,0,1);ctx.globalCompositeOperation=layer.blend||'source-over';
      if(layer.shadow?.enabled){ctx.shadowColor=layer.shadow.color||'#000';ctx.shadowBlur=Number(layer.shadow.blur)||0;ctx.shadowOffsetX=Number(layer.shadow.x)||0;ctx.shadowOffsetY=Number(layer.shadow.y)||0;}
      if(layer.type==='paint'){const p=this.getPaintCanvas(layer);ctx.filter=this.layerFilter(layer);ctx.drawImage(p,0,0,this.canvas.width,this.canvas.height);ctx.restore();return;}
      if(layer.type==='texture'){this.drawTexture(ctx,layer);ctx.restore();return;}
      this.layerTransform(ctx,layer);ctx.filter=this.layerFilter(layer);
      if(layer.type==='image'){const img=await this.ensureImage(layer.src);if(img)ctx.drawImage(img,0,0,layer.w,layer.h);}else if(layer.type==='text')this.drawText(ctx,layer);else if(layer.type==='shape')this.drawShape(ctx,layer);ctx.restore();
    }
    drawShape(ctx,l){if(LF.effects?.drawShape)return LF.effects.drawShape(ctx,l);ctx.fillStyle=l.fill||'#184c54';ctx.fillRect(0,0,l.w,l.h);}
    drawText(ctx,l){if(LF.effects?.drawText)return LF.effects.drawText(ctx,l);ctx.fillStyle=l.color||'#17252a';ctx.font=`${Math.max(4,Number(l.fontSize)||72)}px ${l.fontFamily||'Georgia'}`;ctx.fillText(l.text||'',0,0);}
    seeded(seed){return LF.effects?.seeded?LF.effects.seeded(seed):(()=>Math.random());}
    drawTexture(ctx,l){if(LF.effects?.drawTexture)return LF.effects.drawTexture(ctx,l,this.canvas.width,this.canvas.height);}
    async render(){if(!this.project)return;const ctx=this.ctx;ctx.save();ctx.clearRect(0,0,this.canvas.width,this.canvas.height);const bg=this.project.document.background||'#fff';if(bg!=='transparent'){ctx.fillStyle=bg;ctx.fillRect(0,0,this.canvas.width,this.canvas.height);}for(const layer of this.project.layers)await this.drawLayer(ctx,layer);ctx.restore();this.renderOverlay();document.dispatchEvent(new CustomEvent('lf:rendered'));}
    renderOverlay(){const ctx=this.octx;ctx.clearRect(0,0,this.overlay.width,this.overlay.height);if(!this.project)return;if(this.project.document.guides)this.drawGuides(ctx);const layer=this.project.layers.find(l=>l.id===this.project.selectedLayerId);if(layer&&layer.visible&&layer.type!=='paint'&&layer.type!=='texture')this.drawSelection(ctx,layer);}
    drawGuides(ctx){const m=this.metrics,d=this.project.document;ctx.save();ctx.lineWidth=Math.max(1,1/this.zoom);ctx.setLineDash([12,8]);ctx.strokeStyle='rgba(255,65,65,.88)';const b=m.bleedPx;ctx.strokeRect(b,b,this.canvas.width-b*2,this.canvas.height-b*2);ctx.strokeStyle='rgba(0,210,225,.95)';const s=b+m.safePx;ctx.strokeRect(s,s,this.canvas.width-s*2,this.canvas.height-s*2);if(d.coverMode==='wrap'){const left=b+m.trimWidthPx,right=left+m.spinePx;ctx.strokeStyle='rgba(255,180,0,.95)';ctx.beginPath();ctx.moveTo(left,b);ctx.lineTo(left,this.canvas.height-b);ctx.moveTo(right,b);ctx.lineTo(right,this.canvas.height-b);ctx.stroke();}ctx.restore();}
    corners(layer){const pts=[[0,0],[layer.w,0],[layer.w,layer.h],[0,layer.h]],cx=layer.x+layer.w/2,cy=layer.y+layer.h/2,a=(Number(layer.rotation)||0)*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),sx=(layer.flipX?-1:1)*(Number(layer.scaleX)||1),sy=(layer.flipY?-1:1)*(Number(layer.scaleY)||1),kx=Math.tan((Number(layer.skewX)||0)*Math.PI/180),ky=Math.tan((Number(layer.skewY)||0)*Math.PI/180);return pts.map(([x,y])=>{x-=layer.w/2;y-=layer.h/2;let tx=(x+kx*y)*sx,ty=(ky*x+y)*sy;return{x:cx+tx*cos-ty*sin,y:cy+tx*sin+ty*cos};});}
    drawSelection(ctx,l){const c=this.corners(l);ctx.save();ctx.strokeStyle='#00ffff';ctx.fillStyle='#fff';ctx.lineWidth=Math.max(1,2/this.zoom);ctx.setLineDash([7/this.zoom,4/this.zoom]);ctx.beginPath();ctx.moveTo(c[0].x,c[0].y);for(let i=1;i<c.length;i++)ctx.lineTo(c[i].x,c[i].y);ctx.closePath();ctx.stroke();ctx.setLineDash([]);const r=5/this.zoom;for(const p of c){ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.strokeRect(p.x-r,p.y-r,r*2,r*2);}ctx.restore();}
    pointInLayer(point,l){if(l.type==='paint'||l.type==='texture')return false;const cx=l.x+l.w/2,cy=l.y+l.h/2,a=-(Number(l.rotation)||0)*Math.PI/180,dx=point.x-cx,dy=point.y-cy,cos=Math.cos(a),sin=Math.sin(a);let x=dx*cos-dy*sin,y=dx*sin+dy*cos;const sx=(l.flipX?-1:1)*(Number(l.scaleX)||1),sy=(l.flipY?-1:1)*(Number(l.scaleY)||1);if(Math.abs(sx)<.001||Math.abs(sy)<.001)return false;x/=sx;y/=sy;const kx=Math.tan((Number(l.skewX)||0)*Math.PI/180),ky=Math.tan((Number(l.skewY)||0)*Math.PI/180),det=1-kx*ky;if(Math.abs(det)>.001){const nx=(x-kx*y)/det,ny=(y-ky*x)/det;x=nx;y=ny;}return x>=-l.w/2&&x<=l.w/2&&y>=-l.h/2&&y<=l.h/2;}
    hitTest(point){for(let i=this.project.layers.length-1;i>=0;i--){const l=this.project.layers[i];if(l.visible&&!l.locked&&this.pointInLayer(point,l))return l;}return null;}
    async exportCanvas(){const c=document.createElement('canvas');c.width=this.canvas.width;c.height=this.canvas.height;const ctx=c.getContext('2d');const bg=this.project.document.background||'#fff';if(bg!=='transparent'){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}for(const layer of this.project.layers)await this.drawLayer(ctx,layer);return c;}
    async previewDataUrl(maxW=420,maxH=420){const source=await this.exportCanvas(),scale=Math.min(1,maxW/source.width,maxH/source.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(source.width*scale));c.height=Math.max(1,Math.round(source.height*scale));c.getContext('2d').drawImage(source,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.78);}
  }
  LF.Renderer=Renderer;
})(window);
