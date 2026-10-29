(function () {
  'use strict';
  let getProject = () => null;
  let updateGlyph = () => {};
  let detector = null;
  let stream = null;
  let cameraTimer = null;
  let cameraDetection = null;
  const LETTER = { width: 2550, height: 3300 };
  const A4 = { width: 2480, height: 3508 };

  function parsePayload(raw) {
    let data;
    try { data = JSON.parse(raw); } catch (_) { throw new Error('This QR code is not an Aza’raan Glyph Studio sheet.'); }
    if (data.app !== 'AzaaraanGlyphStudio' || ![1, 2].includes(data.v) || !Array.isArray(data.chars)) throw new Error('This QR code is not a supported glyph sheet.');
    return data;
  }
  function boxFromCorners(corners) {
    if (!corners || !corners.length) return null;
    const xs = corners.map(point => point.x); const ys = corners.map(point => point.y);
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  function bitmapCanvas(source) {
    const canvas = document.createElement('canvas');
    const width = source.videoWidth || source.width || source.naturalWidth;
    const height = source.videoHeight || source.height || source.naturalHeight;
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(source, 0, 0, width, height);
    return { canvas, ctx, width, height };
  }
  async function detect(source) {
    if ('BarcodeDetector' in window) {
      try {
        detector ||= new BarcodeDetector({ formats: ['qr_code'] });
        const results = await detector.detect(source);
        if (results.length) return { payload: parsePayload(results[0].rawValue), qrBox: boxFromCorners(results[0].cornerPoints) || (results[0].boundingBox && { x: results[0].boundingBox.x, y: results[0].boundingBox.y, width: results[0].boundingBox.width, height: results[0].boundingBox.height }) };
      } catch (_) { /* The bundled decoder is the fallback. */ }
    }
    if (typeof jsQR !== 'function') throw new Error('QR decoder is unavailable.');
    const { ctx, width, height } = bitmapCanvas(source);
    const imageData = ctx.getImageData(0, 0, width, height);
    const result = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (!result) throw new Error('No mapping QR code found. Keep the QR at the top right visible in the scan.');
    return { payload: parsePayload(result.data), qrBox: boxFromCorners([result.location.topLeftCorner, result.location.topRightCorner, result.location.bottomLeftCorner, result.location.bottomRightCorner]) };
  }
  function pageGeometry(detected, width, height) {
    const payload = detected.payload; const page = payload.size === 'a4' ? A4 : LETTER;
    const cols = Number(payload.cols) || (Number(payload.perPage) === 12 ? 3 : 4); const rows = Number(payload.rows) || 4;
    const legacy = payload.v === 1;
    const gridX = page.width * .035; const gridY = page.height * (legacy ? .133 : .142); const gridWidth = page.width * .93; const gridHeight = page.height * (legacy ? .82 : .805);
    let scaleX = width / page.width; let scaleY = height / page.height; let originX = 0; let originY = 0;
    const ratioMismatch = Math.abs((width / height) / (page.width / page.height));
    const croppedPage = ratioMismatch <= .12 && width >= page.width * .58;
    if (!croppedPage && detected.qrBox && detected.qrBox.width > 0) {
      const qrSize = page.width * .105; const qrSafe = legacy ? qrSize * .92 : qrSize; const quiet = Math.max(12, Math.round(qrSafe * (legacy ? .06 : .065))); const blackSize = qrSafe - quiet * 2;
      const scale = (detected.qrBox.width + detected.qrBox.height) / 2 / blackSize;
      scaleX = scale; scaleY = scale;
      const qrLeft = page.width - page.width * .035 - qrSize + (qrSize - qrSafe) / 2 + quiet; const qrTop = page.height * (legacy ? .021 : .018) + (qrSize - qrSafe) / 2 + quiet;
      originX = detected.qrBox.x - qrLeft * scale; originY = detected.qrBox.y - qrTop * scale;
      const padX = page.width * scale * .055; const padY = page.height * scale * .055;
      if (originX < -padX || originY < -padY || originX + page.width * scale > width + padX || originY + page.height * scale > height + padY) throw new Error('The full sheet is outside the camera frame. Move back until the whole page is visible.');
    } else if (!croppedPage) throw new Error('The image does not show a full sheet. Crop the scan to the paper edges and try again.');
    return { cols, rows, scaleX, scaleY, originX, originY, x: gridX, y: gridY, legacy, cellWidth: gridWidth / cols, cellHeight: gridHeight / rows };
  }
  function cropCell(source, geometry, index) {
    const col = index % geometry.cols; const row = Math.floor(index / geometry.cols);
    const sx = geometry.originX + (geometry.x + col * geometry.cellWidth + geometry.cellWidth * .02) * geometry.scaleX;
    const legacy = geometry.legacy;
    const header = legacy ? .107 : .145; const bodyHeight = legacy ? .875 : .845;
    const sy = geometry.originY + (geometry.y + row * geometry.cellHeight + geometry.cellHeight * header) * geometry.scaleY;
    const sw = geometry.cellWidth * .96 * geometry.scaleX; const sh = geometry.cellHeight * bodyHeight * geometry.scaleY;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 512, 512);
    const fit = Math.min(440 / sw, 390 / sh); const drawWidth = sw * fit; const drawHeight = sh * fit;
    ctx.drawImage(source, sx, sy, sw, sh, (512 - drawWidth) / 2, 450 - drawHeight, drawWidth, drawHeight);
    const pixels = ctx.getImageData(0, 0, 512, 512); const data = pixels.data;
    for (let pixel = 0; pixel < data.length; pixel += 4) {
      const brightness = data[pixel] * .299 + data[pixel + 1] * .587 + data[pixel + 2] * .114;
      if (brightness > 224) data[pixel + 3] = 0;
      else if (brightness > 194) data[pixel + 3] = Math.round((224 - brightness) / 30 * 255);
      data[pixel] = 24; data[pixel + 1] = 62; data[pixel + 2] = 58;
    }
    ctx.putImageData(pixels, 0, 0); return canvas.toDataURL('image/png');
  }
  function importPage(source, dimensions, detected) {
    const project = getProject(); if (!project) throw new Error('Open a project before importing a page.');
    const payload = detected.payload; const geometry = pageGeometry(detected, dimensions.width, dimensions.height);
    const eraId = project.eras[payload.era] ? payload.era : project.activeEra;
    const targetEra = project.eras[eraId]; const idMap = new Map(targetEra.glyphs.map(glyph => [glyph.id, glyph])); const cpMap = new Map(targetEra.glyphs.map(glyph => [glyph.codepoint, glyph]));
    let imported = 0; let missing = 0;
    payload.chars.forEach((rawEntry, index) => {
      const entry = Array.isArray(rawEntry) ? { id: rawEntry[0], cp: rawEntry[1] } : rawEntry;
      const glyph = idMap.get(entry.id) || (entry.cp == null ? null : cpMap.get(Number(entry.cp)));
      if (!glyph) { missing += 1; return; }
      updateGlyph(glyph.id, { artwork: cropCell(source, geometry, index), layers: [] }, eraId);
      imported += 1;
    });
    return { imported, missing, page: payload.page || 1, mismatch: payload.project !== project.projectId, era: targetEra.label, eraId };
  }
  async function imageSource(file) {
    if (window.createImageBitmap) { const bitmap = await createImageBitmap(file); return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }; }
    return new Promise((resolve, reject) => { const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { URL.revokeObjectURL(url); resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight }); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open this image.')); }; image.src = url; });
  }
  async function scanFile(file) { if (!file || !file.type.startsWith('image/')) throw new Error('Choose a scan image file.'); const image = await imageSource(file); try { return importPage(image.source, image, await detect(image.source)); } finally { if (image.close) image.close(); } }
  async function startCamera() {
    cameraDetection = null; const video = document.getElementById('camera-video'); const status = document.getElementById('camera-status'); const capture = document.getElementById('capture-page-button'); capture.disabled = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Camera access needs a secure HTTPS page. Upload a scan image instead.');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); video.srcObject = stream; await video.play();
      status.textContent = 'Hold the full sheet in frame and keep its QR code visible.'; capture.disabled = false;
      cameraTimer = setInterval(async () => { if (!video.videoWidth || cameraDetection) return; try { cameraDetection = await detect(video); status.textContent = `QR found · ${cameraDetection.payload.era || 'Proto'} · page ${cameraDetection.payload.page || 1} of ${cameraDetection.payload.pages || '?'}.`; } catch (_) { /* Keep looking. */ } }, 650);
    } catch (error) { status.textContent = error.message || 'Camera could not start.'; capture.disabled = true; }
  }
  function stopCamera() { if (cameraTimer) clearInterval(cameraTimer); cameraTimer = null; cameraDetection = null; if (stream) stream.getTracks().forEach(track => track.stop()); stream = null; const video = document.getElementById('camera-video'); if (video) video.srcObject = null; }
  async function captureCameraPage() { const video = document.getElementById('camera-video'); const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext('2d').drawImage(video, 0, 0); const detection = cameraDetection || await detect(canvas); return importPage(canvas, { width: canvas.width, height: canvas.height }, detection); }
  window.GlyphScanner = { configure(options) { getProject = options.getProject; updateGlyph = options.updateGlyph; }, scanFile, startCamera, captureCameraPage, stopCamera };
}());
