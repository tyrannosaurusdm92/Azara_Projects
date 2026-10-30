/* Shared Onyx identity details used by every procedural mood renderer. */
(() => {
  'use strict';
  const root = window;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(Number(n)) ? Number(n) : 1));
  const DEFAULTS = Object.freeze({ noseScale: 1, bowtieScale: 1, plaidStrength: 0.88 });
  function normalizeSettings(input = {}) {
    const v = input && typeof input === 'object' ? input : {};
    return {
      noseScale: clamp(v.noseScale ?? DEFAULTS.noseScale, 0.75, 1.25),
      bowtieScale: clamp(v.bowtieScale ?? DEFAULTS.bowtieScale, 0.75, 1.25),
      plaidStrength: clamp(v.plaidStrength ?? DEFAULTS.plaidStrength, 0.2, 1)
    };
  }
  function paintPath(ctx, draw, fill, stroke, width) {
    ctx.beginPath(); draw(ctx);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  }
  function drawNose(ctx, options = {}) {
    if (!ctx) return false;
    const x = Number(options.x ?? 85), y = Number(options.y ?? 95);
    const scale = clamp(options.scale ?? 1, 0.25, 2);
    const nose = options.nose || '#5a5154', outline = options.outline || '#343239';
    if (x === 85 && y === 95 && scale === 1) {
      paintPath(ctx, q => { q.moveTo(81, 94); q.quadraticCurveTo(85, 91.5, 89, 94); q.lineTo(85, 98); q.closePath(); }, nose, outline, 0.7);
    } else {
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      paintPath(ctx, q => { q.moveTo(-4, -1); q.quadraticCurveTo(0, -3.5, 4, -1); q.lineTo(0, 3); q.closePath(); }, nose, outline, 0.7);
      ctx.restore();
    }
    return true;
  }
  function traceWing(ctx, side) {
    const s = side;
    ctx.beginPath(); ctx.moveTo(s * 4, -5);
    ctx.quadraticCurveTo(s * 17, -11, s * 31, -10);
    ctx.lineTo(s * 26, 7); ctx.quadraticCurveTo(s * 15, 7, s * 3, 2); ctx.closePath();
  }
  function traceTail(ctx, side) {
    ctx.beginPath();
    if (side < 0) {
      ctx.moveTo(-22, 7); ctx.quadraticCurveTo(-21, 17, -15, 22); ctx.lineTo(-6, 6);
    } else {
      ctx.moveTo(6, 6); ctx.lineTo(16, 22); ctx.quadraticCurveTo(21, 16, 22, 7);
    }
    ctx.closePath();
  }
  function drawBowtie(ctx, options = {}) {
    if (!ctx) return false;
    const x = Number(options.x ?? 85), y = Number(options.y ?? 119);
    const scale = clamp(options.scale ?? 1, 0.25, 2);
    const rotation = Number(options.rotation) || 0;
    const tie = options.tie || '#448b52', tieDark = options.tieDark || '#17472f';
    const tieLight = options.tieLight || '#85c77e', outline = options.outline || '#102f22';
    const plaidStrength = clamp(options.plaidStrength ?? DEFAULTS.plaidStrength, 0, 1);
    if (x === 85 && y === 119 && scale === 1) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation * Math.PI / 180); ctx.translate(-x, -y);
      paintPath(ctx, q => { q.moveTo(81, 114); q.quadraticCurveTo(68, 108, 54, 109); q.lineTo(59, 126); q.quadraticCurveTo(70, 126, 82, 121); q.closePath(); }, tie, outline, 1.8);
      paintPath(ctx, q => { q.moveTo(89, 114); q.quadraticCurveTo(102, 108, 116, 109); q.lineTo(111, 126); q.quadraticCurveTo(100, 126, 88, 121); q.closePath(); }, tie, outline, 1.8);
      ctx.save(); ctx.globalAlpha = plaidStrength; ctx.strokeStyle = tieDark; ctx.lineWidth = 1.2;
      for (let xx = 59; xx <= 112; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, 110); ctx.lineTo(xx + (xx < 85 ? 3 : -3), 126); ctx.stroke(); }
      ctx.lineWidth = 0.75; for (let yy = 112; yy <= 124; yy += 5) { ctx.beginPath(); ctx.moveTo(57, yy); ctx.lineTo(114, yy); ctx.stroke(); }
      ctx.globalAlpha *= 0.6; ctx.strokeStyle = tieLight; ctx.lineWidth = 0.65;
      for (let xx = 62; xx <= 108; xx += 16) { ctx.beginPath(); ctx.moveTo(xx, 110); ctx.lineTo(xx + (xx < 85 ? 2 : -2), 125); ctx.stroke(); }
      ctx.restore();
      paintPath(ctx, q => { q.moveTo(80, 114); q.quadraticCurveTo(85, 110, 90, 114); q.lineTo(89, 123); q.quadraticCurveTo(85, 126, 81, 123); q.closePath(); }, tieLight, '#17482d', 1.2);
      paintPath(ctx, q => { q.moveTo(63, 126); q.quadraticCurveTo(64, 136, 70, 141); q.lineTo(79, 125); q.closePath(); }, tie, '#153c29', 1.2);
      paintPath(ctx, q => { q.moveTo(91, 125); q.lineTo(101, 141); q.quadraticCurveTo(106, 135, 107, 126); q.closePath(); }, tie, '#153c29', 1.2);
      ctx.globalAlpha = 0.26; ctx.strokeStyle = tieLight; ctx.lineWidth = 0.8;
      paintPath(ctx, q => { q.moveTo(85, 114); q.lineTo(85, 123); }, null, tieLight, 0.8);
      ctx.restore();
      return true;
    }
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.translate(x, y); ctx.rotate(rotation * Math.PI / 180); ctx.scale(scale, scale);
    for (const side of [-1, 1]) {
      traceWing(ctx, side); ctx.fillStyle = tie; ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 1.8; ctx.stroke();
    }
    ctx.save();
    ctx.globalAlpha = plaidStrength; ctx.strokeStyle = tieDark; ctx.lineWidth = 1.2;
    for (let offset = -26; offset <= 22; offset += 8) {
      ctx.beginPath(); ctx.moveTo(offset, -9); ctx.lineTo(offset + (offset < 0 ? 3 : -3), 7); ctx.stroke();
    }
    ctx.lineWidth = 0.75;
    for (let yy = -7; yy <= 3; yy += 5) { ctx.beginPath(); ctx.moveTo(-28, yy); ctx.lineTo(29, yy); ctx.stroke(); }
    ctx.globalAlpha *= 0.6; ctx.strokeStyle = tieLight; ctx.lineWidth = 0.65;
    for (let offset = -23; offset <= 9; offset += 16) {
      ctx.beginPath(); ctx.moveTo(offset, -9); ctx.lineTo(offset + (offset < 0 ? 2 : -2), 6); ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-5, -5); ctx.quadraticCurveTo(0, -9, 5, -5); ctx.lineTo(4, 4); ctx.quadraticCurveTo(0, 7, -4, 4); ctx.closePath();
    ctx.fillStyle = tieLight; ctx.fill(); ctx.strokeStyle = '#17482d'; ctx.lineWidth = 1.2; ctx.stroke();
    for (const side of [-1, 1]) {
      traceTail(ctx, side); ctx.fillStyle = tie; ctx.fill(); ctx.strokeStyle = '#153c29'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.globalAlpha = 0.26; ctx.strokeStyle = tieLight; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 4); ctx.stroke();
    ctx.restore();
    return true;
  }
  root.OnyxSignatureParts = Object.freeze({ version: '1.0.0', defaults: DEFAULTS, normalizeSettings, drawNose, drawBowtie });
})();
