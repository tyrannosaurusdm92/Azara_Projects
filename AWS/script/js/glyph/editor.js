(function () {
  'use strict';

  const SIZE = 512;
  const canvas = document.getElementById('glyph-canvas');
  const display = canvas.getContext('2d', { willReadFrequently: true });
  let currentGlyph = null;
  let onChange = () => {};
  let layers = [];
  let activeLayerId = '';
  let activeTool = 'draw';
  let drawing = false;
  let lastPoint = null;
  let strokePoints = [];
  let beforeStroke = null;
  let undoStack = [];
  let redoStack = [];
  let transformBase = null;
  let neatenAmount = 35;

  function newLayer(name) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = SIZE;
    layerCanvas.height = SIZE;
    return { id: `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name: name || `Layer ${layers.length + 1}`, visible: true, opacity: 100, blendMode: 'source-over', canvas: layerCanvas };
  }

  function currentLayer() { return layers.find(layer => layer.id === activeLayerId); }
  function layerContext(layer = currentLayer()) { return layer && layer.canvas.getContext('2d', { willReadFrequently: true }); }

  function loadDataUrl(layer, dataUrl) {
    if (!dataUrl) return Promise.resolve();
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const ctx = layerContext(layer);
        ctx.clearRect(0, 0, SIZE, SIZE);
        if (image.width === SIZE && image.height === SIZE) ctx.drawImage(image, 0, 0);
        else {
          const scale = Math.min(SIZE * .84 / image.width, SIZE * .84 / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          ctx.drawImage(image, (SIZE - width) / 2, (SIZE - height) / 2, width, height);
        }
        resolve();
      };
      image.onerror = () => resolve();
      image.src = dataUrl;
    });
  }

  function getComposite() {
    const flattened = document.createElement('canvas');
    flattened.width = SIZE;
    flattened.height = SIZE;
    const ctx = flattened.getContext('2d');
    layers.forEach(layer => {
      if (!layer.visible) return;
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';
      ctx.drawImage(layer.canvas, 0, 0);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return flattened;
  }

  function updatePlaceholder(hasArtwork) {
    const placeholder = document.getElementById('board-placeholder');
    const status = document.getElementById('artwork-status');
    if (placeholder) placeholder.classList.toggle('has-art', hasArtwork);
    if (status) {
      status.textContent = hasArtwork ? 'Artwork ready' : 'No artwork';
      status.classList.toggle('has-art', hasArtwork);
    }
  }

  function render() {
    display.clearRect(0, 0, SIZE, SIZE);
    layers.forEach(layer => {
      if (!layer.visible) return;
      display.globalAlpha = layer.opacity / 100;
      display.globalCompositeOperation = layer.blendMode || 'source-over';
      display.drawImage(layer.canvas, 0, 0);
    });
    display.globalAlpha = 1;
    display.globalCompositeOperation = 'source-over';
    const hasArtwork = layers.some(layer => layer.visible && layerContext(layer).getImageData(0, 0, SIZE, SIZE).data.some((value, index) => index % 4 === 3 && value > 0));
    updatePlaceholder(hasArtwork);
    document.getElementById('baseline-guide').style.top = `${currentGlyph ? currentGlyph.baseline : 72}%`;
    renderLayerList();
  }

  function layerSummary() {
    return layers.map(layer => ({ id: layer.id, name: layer.name, visible: layer.visible, opacity: layer.opacity, blendMode: layer.blendMode, artwork: layer.canvas.toDataURL('image/png') }));
  }

  function saveChange() {
    if (!currentGlyph) return;
    render();
    const composite = getComposite().toDataURL('image/png');
    onChange({ artwork: composite, layers: layerSummary() });
  }

  function renderLayerList() {
    const host = document.getElementById('layer-list');
    if (!host) return;
    host.innerHTML = layers.slice().reverse().map(layer => `
      <div class="layer-row${layer.id === activeLayerId ? ' selected' : ''}" data-layer-row="${StudioModel.html(layer.id)}">
        <button class="layer-eye" type="button" data-layer-visible="${StudioModel.html(layer.id)}" aria-label="Toggle layer visibility">${layer.visible ? '◉' : '○'}</button>
        <button class="layer-name" type="button" data-layer-select="${StudioModel.html(layer.id)}">${StudioModel.html(layer.name)}</button>
        <input class="layer-opacity" type="range" min="0" max="100" value="${layer.opacity}" data-layer-opacity="${StudioModel.html(layer.id)}" aria-label="Layer opacity">
      </div>`).join('');
    host.querySelectorAll('[data-layer-select]').forEach(button => button.addEventListener('click', () => selectLayer(button.dataset.layerSelect)));
    host.querySelectorAll('[data-layer-visible]').forEach(button => button.addEventListener('click', () => toggleLayer(button.dataset.layerVisible)));
    host.querySelectorAll('[data-layer-opacity]').forEach(input => input.addEventListener('input', () => setLayerOpacity(input.dataset.layerOpacity, Number(input.value))));
  }

  function snapshot(layer = currentLayer()) {
    if (!layer) return;
    try {
      undoStack.push({ layerId: layer.id, pixels: layerContext(layer).getImageData(0, 0, SIZE, SIZE) });
      if (undoStack.length > 30) undoStack.shift();
      redoStack.length = 0;
    } catch (_) { /* Canvas history is optional if memory is constrained. */ }
  }

  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (SIZE / rect.width), y: (event.clientY - rect.top) * (SIZE / rect.height) };
  }

  function inkContext(layer, tool) {
    const ctx = layerContext(layer);
    const size = Number(document.getElementById('brush-size').value) || 12;
    const opacity = (Number(document.getElementById('brush-opacity').value) || 100) / 100;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = document.getElementById('ink-color').value;
    ctx.fillStyle = document.getElementById('ink-color').value;
    ctx.globalAlpha = tool === 'blend' ? Math.min(.4, opacity * .38) : opacity;
    ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
    return ctx;
  }

  function drawLine(from, to, tool, layer = currentLayer()) {
    if (!layer) return;
    if (tool === 'smudge') {
      const ctx = layerContext(layer);
      const radius = Math.max(3, Number(document.getElementById('brush-size').value) || 12);
      const x = Math.max(0, Math.min(SIZE - radius * 2, Math.round(from.x - radius)));
      const y = Math.max(0, Math.min(SIZE - radius * 2, Math.round(from.y - radius)));
      try {
        const patch = ctx.getImageData(x, y, radius * 2, radius * 2);
        ctx.putImageData(patch, Math.max(0, Math.min(SIZE - radius * 2, x + (to.x - from.x) * .55)), Math.max(0, Math.min(SIZE - radius * 2, y + (to.y - from.y) * .55)));
      } catch (_) { /* Ignore brush samples outside the canvas. */ }
      return;
    }
    const ctx = inkContext(layer, tool);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSmoothedStroke(points, tool, layer) {
    if (points.length < 3 || !neatenAmount) {
      for (let index = 1; index < points.length; index += 1) drawLine(points[index - 1], points[index], tool, layer);
      return;
    }
    const ctx = inkContext(layer, tool);
    const smooth = neatenAmount / 100;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const controlX = current.x + (next.x - points[index - 1].x) * smooth * .18;
      const controlY = current.y + (next.y - points[index - 1].y) * smooth * .18;
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      ctx.quadraticCurveTo(controlX, controlY, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function warpPinch(point, layer) {
    const ctx = layerContext(layer);
    const radius = Math.max(18, Number(document.getElementById('brush-size').value) * 3);
    const left = Math.max(0, Math.floor(point.x - radius));
    const top = Math.max(0, Math.floor(point.y - radius));
    const right = Math.min(SIZE, Math.ceil(point.x + radius));
    const bottom = Math.min(SIZE, Math.ceil(point.y + radius));
    const width = right - left;
    const height = bottom - top;
    if (width < 2 || height < 2) return;
    const source = ctx.getImageData(left, top, width, height);
    const result = ctx.createImageData(width, height);
    const strength = .28;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = left + x - point.x;
        const dy = top + y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const factor = distance < radius ? Math.max(0, 1 - strength * (1 - distance / radius)) : 1;
        const sx = Math.max(0, Math.min(width - 1, Math.round((point.x + dx * factor) - left)));
        const sy = Math.max(0, Math.min(height - 1, Math.round((point.y + dy * factor) - top)));
        const target = (y * width + x) * 4;
        const origin = (sy * width + sx) * 4;
        result.data[target] = source.data[origin];
        result.data[target + 1] = source.data[origin + 1];
        result.data[target + 2] = source.data[origin + 2];
        result.data[target + 3] = source.data[origin + 3];
      }
    }
    ctx.putImageData(result, left, top);
  }

  function startStroke(event) {
    const layer = currentLayer();
    if (!currentGlyph || !layer || event.button > 0) return;
    event.preventDefault();
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    snapshot(layer);
    beforeStroke = layerContext(layer).getImageData(0, 0, SIZE, SIZE);
    lastPoint = position(event);
    strokePoints = [lastPoint];
    if (activeTool === 'draw' || activeTool === 'paint' || activeTool === 'erase' || activeTool === 'blend') {
      const ctx = inkContext(layer, activeTool);
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, Number(document.getElementById('brush-size').value) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function moveStroke(event) {
    if (!drawing) return;
    event.preventDefault();
    const next = position(event);
    if (activeTool !== 'pinch') drawLine(lastPoint, next, activeTool);
    lastPoint = next;
    strokePoints.push(next);
    render();
  }

  function finishStroke() {
    if (!drawing) return;
    drawing = false;
    const layer = currentLayer();
    if (layer && beforeStroke) {
      if (['draw', 'paint', 'erase', 'blend'].includes(activeTool) && strokePoints.length > 2 && neatenAmount > 0) {
        layerContext(layer).putImageData(beforeStroke, 0, 0);
        drawSmoothedStroke(strokePoints, activeTool, layer);
      }
      if (activeTool === 'pinch' && lastPoint) warpPinch(lastPoint, layer);
    }
    beforeStroke = null;
    lastPoint = null;
    strokePoints = [];
    transformBase = null;
    saveChange();
  }

  function getBaseCanvas() {
    const layer = currentLayer();
    if (!layer) return null;
    const copy = document.createElement('canvas');
    copy.width = SIZE;
    copy.height = SIZE;
    copy.getContext('2d').drawImage(transformBase || layer.canvas, 0, 0);
    return copy;
  }

  function setTransform(transform = {}) {
    const layer = currentLayer();
    if (!layer) return;
    if (!transformBase) {
      transformBase = document.createElement('canvas');
      transformBase.width = SIZE;
      transformBase.height = SIZE;
      transformBase.getContext('2d').drawImage(layer.canvas, 0, 0);
    }
    const ctx = layerContext(layer);
    const base = getBaseCanvas();
    const scale = Number(transform.scale || 1);
    const radians = Number(transform.rotate || 0) * Math.PI / 180;
    const skew = Math.tan(Number(transform.skew || 0) * Math.PI / 180);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.translate(SIZE / 2 + Number(transform.dx || 0), SIZE / 2 + Number(transform.dy || 0));
    ctx.rotate(radians);
    ctx.transform(transform.flipX ? -1 : 1, 0, skew, transform.flipY ? -1 : 1, 0, 0);
    ctx.scale(scale, scale);
    ctx.drawImage(base, -SIZE / 2, -SIZE / 2);
    ctx.restore();
    render();
  }

  function commitTransform() { transformBase = null; saveChange(); }

  function nudge(dx, dy, step) {
    const layer = currentLayer();
    if (!layer) return;
    snapshot(layer);
    const previous = document.createElement('canvas');
    previous.width = SIZE;
    previous.height = SIZE;
    previous.getContext('2d').drawImage(layer.canvas, 0, 0);
    const ctx = layerContext(layer);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(previous, dx * step, dy * step);
    saveChange();
  }

  function selectLayer(id) {
    if (!layers.some(layer => layer.id === id)) return;
    activeLayerId = id;
    transformBase = null;
    render();
  }

  function addLayer(name) {
    const layer = newLayer(name);
    layers.push(layer);
    activeLayerId = layer.id;
    render();
    saveChange();
  }

  function duplicateLayer() {
    const source = currentLayer();
    if (!source) return;
    const copy = newLayer(`${source.name} copy`);
    copy.visible = source.visible;
    copy.opacity = source.opacity;
    copy.blendMode = source.blendMode;
    copy.canvas.getContext('2d').drawImage(source.canvas, 0, 0);
    const index = layers.indexOf(source);
    layers.splice(index + 1, 0, copy);
    activeLayerId = copy.id;
    saveChange();
  }

  function mergeLayerDown() {
    const index = layers.findIndex(layer => layer.id === activeLayerId);
    if (index <= 0) return;
    const above = layers[index];
    const below = layers[index - 1];
    const ctx = layerContext(below);
    ctx.globalAlpha = above.opacity / 100;
    ctx.globalCompositeOperation = above.blendMode || 'source-over';
    if (above.visible) ctx.drawImage(above.canvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    layers.splice(index, 1);
    activeLayerId = below.id;
    saveChange();
  }

  function deleteLayer() {
    if (layers.length <= 1) {
      const layer = currentLayer();
      if (!layer) return;
      snapshot(layer);
      layerContext(layer).clearRect(0, 0, SIZE, SIZE);
    } else {
      const index = layers.findIndex(layer => layer.id === activeLayerId);
      layers.splice(index, 1);
      activeLayerId = layers[Math.max(0, index - 1)].id;
    }
    saveChange();
  }

  function toggleLayer(id) {
    const layer = layers.find(item => item.id === id);
    if (!layer) return;
    layer.visible = !layer.visible;
    saveChange();
  }

  function setLayerOpacity(id, opacity) {
    const layer = layers.find(item => item.id === id);
    if (!layer) return;
    layer.opacity = opacity;
    render();
    saveChange();
  }

  function undo() {
    const action = undoStack.pop();
    if (!action) return;
    const layer = layers.find(item => item.id === action.layerId);
    if (!layer) return;
    redoStack.push({ layerId: layer.id, pixels: layerContext(layer).getImageData(0, 0, SIZE, SIZE) });
    layerContext(layer).putImageData(action.pixels, 0, 0);
    saveChange();
  }

  function redo() {
    const action = redoStack.pop();
    if (!action) return;
    const layer = layers.find(item => item.id === action.layerId);
    if (!layer) return;
    undoStack.push({ layerId: layer.id, pixels: layerContext(layer).getImageData(0, 0, SIZE, SIZE) });
    layerContext(layer).putImageData(action.pixels, 0, 0);
    saveChange();
  }

  function setArtwork(dataUrl) {
    const layer = currentLayer();
    if (!layer) return Promise.resolve();
    snapshot(layer);
    return loadDataUrl(layer, dataUrl).then(saveChange);
  }

  canvas.addEventListener('pointerdown', startStroke);
  canvas.addEventListener('pointermove', moveStroke);
  canvas.addEventListener('pointerup', finishStroke);
  canvas.addEventListener('pointercancel', finishStroke);
  canvas.addEventListener('pointerleave', event => { if (drawing && event.buttons === 0) finishStroke(); });

  document.querySelectorAll('[data-tool]').forEach(button => {
    button.addEventListener('click', () => {
      activeTool = button.dataset.tool;
      document.querySelectorAll('[data-tool]').forEach(item => item.classList.toggle('active', item === button));
      canvas.style.cursor = activeTool === 'erase' ? 'cell' : activeTool === 'move' ? 'move' : 'crosshair';
    });
  });
  document.getElementById('undo-drawing-button').addEventListener('click', undo);
  document.getElementById('redo-drawing-button').addEventListener('click', redo);
  document.getElementById('clear-drawing-button').addEventListener('click', () => {
    const layer = currentLayer();
    if (!layer) return;
    snapshot(layer);
    layerContext(layer).clearRect(0, 0, SIZE, SIZE);
    saveChange();
  });
  document.getElementById('add-layer-button').addEventListener('click', () => addLayer());
  document.getElementById('duplicate-layer-button').addEventListener('click', duplicateLayer);
  document.getElementById('merge-layer-button').addEventListener('click', mergeLayerDown);
  document.getElementById('delete-layer-button').addEventListener('click', deleteLayer);

  window.GlyphEditor = {
    async select(glyph, callback) {
      currentGlyph = glyph || null;
      onChange = typeof callback === 'function' ? callback : () => {};
      layers = [];
      undoStack = [];
      redoStack = [];
      transformBase = null;
      if (!glyph) { activeLayerId = ''; render(); return; }
      const sourceLayers = Array.isArray(glyph.layers) && glyph.layers.length ? glyph.layers : (glyph.artwork ? [{ name: 'Artwork', artwork: glyph.artwork }] : []);
      for (let index = 0; index < sourceLayers.length; index += 1) {
        const source = sourceLayers[index];
        const layer = Object.assign(newLayer(source.name || `Layer ${index + 1}`), {
          id: source.id || `layer-${index + 1}`,
          name: String(source.name || `Layer ${index + 1}`),
          visible: source.visible !== false,
          opacity: Number.isFinite(Number(source.opacity)) ? Number(source.opacity) : 100,
          blendMode: source.blendMode || 'source-over'
        });
        await loadDataUrl(layer, source.artwork || '');
        layers.push(layer);
      }
      if (!layers.length) layers.push(newLayer('Artwork'));
      activeLayerId = layers[layers.length - 1].id;
      render();
    },
    setArtwork,
    getCanvas() { return canvas; },
    getLayers() { return layers.map(layer => ({ id: layer.id, name: layer.name, visible: layer.visible, opacity: layer.opacity, blendMode: layer.blendMode })); },
    setTool(tool) { activeTool = tool; },
    setBaseline(value) { document.getElementById('baseline-guide').style.top = `${value}%`; },
    setNeaten(value) { neatenAmount = Number(value); },
    selectLayer,
    addLayer,
    duplicateLayer,
    mergeLayerDown,
    deleteLayer,
    toggleLayer,
    setLayerOpacity,
    applyTransform: setTransform,
    commitTransform,
    nudge,
    undo,
    redo
  };
}());
