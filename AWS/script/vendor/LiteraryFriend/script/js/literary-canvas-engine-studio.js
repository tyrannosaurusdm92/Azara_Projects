(function () {
  class CanvasEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', {alpha: true});
      this.tool = 'select';
      this.shape = 'rectangle';
      this.primary = '#000000';
      this.secondary = '#ffffff';
      this.size = 12;
      this.opacity = 1;
      this.brushType = 'round';
      this.isDrawing = false;
      this.start = null;
      this.snapshot = null;
      this.undoStack = [];
      this.redoStack = [];
      this.maxHistory = 24;
      this.layers = [{id:'layer-1', name:'Layer 1', visible:true}];
      this.activeLayerId = 'layer-1';
      this.onChange = null;
      this.bind();
    }

    resize(width, height, preserve = false) {
      let existing = null;
      if (preserve && this.canvas.width && this.canvas.height) {
        existing = document.createElement('canvas'); existing.width = this.canvas.width; existing.height = this.canvas.height;
        existing.getContext('2d').drawImage(this.canvas, 0, 0);
      }
      this.canvas.width = width; this.canvas.height = height;
      if (existing) this.ctx.drawImage(existing, 0, 0, width, height);
      this.notify();
    }
    setTool(tool) { this.tool = tool; }
    setShape(shape) { this.shape = shape; this.tool = 'shape'; }
    setPrimary(color) { this.primary = color; }
    setSize(size) { this.size = Number(size); }
    setOpacity(value) { this.opacity = Math.max(.01, Math.min(1, Number(value))); }
    setBrushType(type) { this.brushType = type; }

    point(evt) {
      const r = this.canvas.getBoundingClientRect();
      return {x:(evt.clientX-r.left)*(this.canvas.width/r.width), y:(evt.clientY-r.top)*(this.canvas.height/r.height)};
    }
    pushHistory() {
      try {
        this.undoStack.push(this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height));
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        this.redoStack = [];
      } catch (_) {}
    }
    undo() {
      if (!this.undoStack.length) return;
      const current = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
      const previous = this.undoStack.pop(); this.redoStack.push(current); this.ctx.putImageData(previous,0,0); this.notify();
    }
    redo() {
      if (!this.redoStack.length) return;
      const current = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
      const next = this.redoStack.pop(); this.undoStack.push(current); this.ctx.putImageData(next,0,0); this.notify();
    }
    clear(recordHistory=true) { if(recordHistory) this.pushHistory(); this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); this.notify(); }
    fill(color=this.primary) { this.pushHistory(); this.ctx.save(); this.ctx.globalCompositeOperation='source-over'; this.ctx.fillStyle=color; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height); this.ctx.restore(); this.notify(); }

    bind() {
      this.canvas.addEventListener('pointerdown', e => this.down(e));
      this.canvas.addEventListener('pointermove', e => this.move(e));
      window.addEventListener('pointerup', e => this.up(e));
    }
    down(e) {
      const p=this.point(e); this.start=p;
      if (this.tool === 'fill') { this.fill(); return; }
      if (this.tool === 'eyedropper') {
        const px=this.ctx.getImageData(Math.max(0,Math.floor(p.x)),Math.max(0,Math.floor(p.y)),1,1).data;
        const hex='#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join(''); this.setPrimary(hex); this.notify({pickedColor:hex}); return;
      }
      if (!['brush','pencil','eraser','shape'].includes(this.tool)) return;
      this.pushHistory(); this.isDrawing=true; this.canvas.setPointerCapture?.(e.pointerId);
      if (this.tool==='shape') this.snapshot=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
      else this.strokeStart(p);
    }
    move(e) {
      const p=this.point(e); this.notify({pointer:p});
      if (!this.isDrawing) return;
      if (this.tool==='shape') { this.ctx.putImageData(this.snapshot,0,0); this.drawShape(this.start,p); }
      else this.strokeTo(p);
    }
    up(e) { if (!this.isDrawing) return; this.isDrawing=false; this.ctx.closePath(); this.notify(); }
    strokeStart(p) { this.ctx.beginPath(); this.ctx.moveTo(p.x,p.y); this.strokeTo(p); }
    strokeTo(p) {
      const c=this.ctx; c.save(); c.globalAlpha=this.opacity; c.lineWidth=this.tool==='pencil'?Math.max(1,this.size*.35):this.size; c.lineCap=this.brushType==='marker'?'square':'round'; c.lineJoin='round';
      if (this.tool==='eraser') { c.globalCompositeOperation='destination-out'; c.strokeStyle='rgba(0,0,0,1)'; }
      else { c.globalCompositeOperation='source-over'; c.strokeStyle=this.primary; }
      if (this.brushType==='airbrush' && this.tool!=='eraser') { c.globalAlpha=this.opacity*.14; c.lineWidth=this.size*2.2; }
      c.lineTo(p.x,p.y); c.stroke(); c.restore();
    }
    drawShape(a,b) {
      const c=this.ctx; c.save(); c.globalAlpha=this.opacity; c.strokeStyle=this.primary; c.lineWidth=this.size; c.lineCap='round'; c.lineJoin='round'; const x=Math.min(a.x,b.x), y=Math.min(a.y,b.y), w=Math.abs(b.x-a.x), h=Math.abs(b.y-a.y);
      c.beginPath();
      if(this.shape==='line'){c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);} else if(this.shape==='rectangle'){c.rect(x,y,w,h);} else if(this.shape==='ellipse'){c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);} else if(this.shape==='triangle'){c.moveTo(x+w/2,y);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();} else if(this.shape==='diamond'){c.moveTo(x+w/2,y);c.lineTo(x+w,y+h/2);c.lineTo(x+w/2,y+h);c.lineTo(x,y+h/2);c.closePath();} else {c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}
      c.stroke(); c.restore();
    }
    addText(text,x,y,opts={}) { if(!text) return; this.pushHistory(); const c=this.ctx; c.save(); c.globalAlpha=this.opacity; c.fillStyle=this.primary; c.font=`${opts.size||Math.max(24,this.size*3)}px Segoe UI, sans-serif`; c.textBaseline='top'; String(text).split(/\n/).forEach((line,i)=>c.fillText(line,x,y+i*(opts.size||Math.max(24,this.size*3))*1.2)); c.restore(); this.notify(); }
    toDataURL() { return this.canvas.toDataURL('image/png'); }
    loadDataURL(url) { return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.ctx.drawImage(img,0,0,this.canvas.width,this.canvas.height);this.notify();resolve();};img.onerror=reject;img.src=url;}); }
    notify(detail={}) { if(typeof this.onChange==='function') this.onChange(detail); }
  }
  window.LFCanvasEngine=CanvasEngine;
})();
