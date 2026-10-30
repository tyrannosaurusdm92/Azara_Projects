/* Code-first Onyx mood renderers. PNGs are consulted only by the host's failure path. */
(() => {
  'use strict';

  const root = window;
  const ORDER = Object.freeze([
    'advising_professor', 'caring', 'hungry', 'judgmental', 'listening',
    'purring', 'sleepy', 'snuggly', 'thinking', 'thoughtful'
  ]);
  const LABELS = Object.freeze({
    advising_professor: 'Advising Professor', caring: 'Caring', hungry: 'Hungry',
    judgmental: 'Judgmental', listening: 'Listening', purring: 'Purring',
    sleepy: 'Sleepy', snuggly: 'Snuggly', thinking: 'Thinking', thoughtful: 'Thoughtful'
  });
  const FALLBACKS = Object.freeze({
    advising_professor: 'onyx_advising_professor.png', caring: 'onyx_caring.png',
    hungry: 'onyx_hungry.png', judgmental: 'onyx_judgmental.png',
    listening: 'onyx_listening.png', purring: 'onyx_purring.png',
    sleepy: 'onyx_sleepy.png', snuggly: 'onyx_snuggly.png',
    thinking: 'onyx_thinking.png', thoughtful: 'onyx_thoughtful.png'
  });
  const COLORS = Object.freeze({
    outline: '#06080d', fur: '#111319', furLight: '#252a32', furShade: '#080a0f',
    ear: '#62666d', earLight: '#858991', eye: '#dced9b', eyeShade: '#9ebd66',
    pupil: '#07090a', white: '#f3f3ea', whisker: '#d0d1d2', nose: '#5a5154',
    mouth: '#08090c', tie: '#448b52', tieLight: '#85c77e', tieDark: '#17472f',
    gold: '#e0bd62', pink: '#ff9bbb', cyan: '#6ef4ff', blue: '#087de0',
    navy: '#051b45', amber: '#eab65d', paper: '#e9e3d0', board: '#704624'
  });
  const PROFILE = Object.freeze({
    advising_professor: { eyes: 'open', gaze: 'center', pose: 'professor', glasses: true, clipboard: true, duration: 6400, events: ['paw-point', 'glasses-glint', 'breathing', 'blink'] },
    caring: { eyes: 'open', gaze: 'center', pose: 'heart', duration: 5200, events: ['heart-pulse', 'paw-hold', 'breathing', 'slow-blink'] },
    hungry: { eyes: 'open', gaze: 'forward', pose: 'rest', tongue: true, duration: 4200, events: ['food-bob', 'tongue-flick', 'breathing', 'blink'] },
    judgmental: { eyes: 'half', gaze: 'forward', pose: 'rest', duration: 6000, events: ['slow-eye-shift', 'ear-twitch', 'whisker-settle'] },
    listening: { eyes: 'open', gaze: 'up-left', pose: 'listen', duration: 5600, durationLabel: 'slow', events: ['ear-track', 'head-tilt', 'speech-wave', 'breathing'] },
    purring: { eyes: 'closed', gaze: 'center', pose: 'rest', duration: 4600, events: ['purr-vibration', 'heart-pulse', 'breathing'] },
    sleepy: { eyes: 'closed', gaze: 'center', pose: 'rest', duration: 7200, events: ['slow-breathing', 'drifting-z', 'ear-twitch'] },
    snuggly: { eyes: 'closed', gaze: 'center', pose: 'tucked', nest: true, duration: 6800, events: ['nest-settle', 'slow-breathing', 'warm-glow'] },
    thinking: { eyes: 'wink', gaze: 'up-right', pose: 'rest', duration: 4400, durationLabel: 'thought', events: ['bulb-pulse', 'wink', 'ear-twitch'] },
    thoughtful: { eyes: 'open', gaze: 'up', pose: 'chin', duration: 6200, events: ['cloud-drift', 'paw-rest', 'slow-blink', 'breathing'] }
  });
  const SETTINGS = Object.freeze({
    furStyle: 'void', eyeColor: COLORS.eye, plaidStrength: 0.88,
    noseScale: 1, bowtieScale: 1, motionScale: 1, scale: 1, renderEnvironment: false
  });
  const EYE_COLORS = Object.freeze(['#dced9b', '#b9d987', '#efcd75']);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
  const mod = (n, d) => ((n % d) + d) % d;
  const moodOf = value => {
    const raw = String(value || '').toLowerCase().replace(/^onyx_/, '').replace(/[\s-]+/g, '_');
    const state = ({ professor: 'advising_professor', advising: 'advising_professor' })[raw] || raw;
    return ORDER.includes(state) ? state : 'sleepy';
  };
  function normalizeSettings(input = {}) {
    const v = input && typeof input === 'object' ? input : {};
    return {
      furStyle: ['void', 'moonlit', 'charcoal'].includes(v.furStyle) ? v.furStyle : SETTINGS.furStyle,
      eyeColor: EYE_COLORS.includes(String(v.eyeColor || '').toLowerCase()) ? String(v.eyeColor).toLowerCase() : SETTINGS.eyeColor,
      plaidStrength: clamp(v.plaidStrength ?? SETTINGS.plaidStrength, .2, 1),
      noseScale: clamp(v.noseScale ?? SETTINGS.noseScale, .75, 1.25),
      bowtieScale: clamp(v.bowtieScale ?? SETTINGS.bowtieScale, .75, 1.25),
      motionScale: clamp(v.motionScale ?? SETTINGS.motionScale, 0, 2),
      scale: clamp(v.scale ?? SETTINGS.scale, .76, 1.24),
      renderEnvironment: Boolean(v.renderEnvironment)
    };
  }
  function effectiveSettings(mood, options = {}) {
    const state = moodOf(mood), explicit = options.settings && typeof options.settings === 'object' ? options.settings : {};
    return normalizeSettings({ ...(root.OnyxMoodRenderSettings?.[state] || {}), ...options, ...explicit });
  }
  function canvas(size = 170) {
    const c = document.createElement('canvas');
    c.width = c.height = Math.max(1, Math.round(size));
    return c;
  }
  function palette(settings) {
    if (settings.furStyle === 'moonlit') return { ...COLORS, fur: '#171d28', furLight: '#364352', furShade: '#0b1019', eye: settings.eyeColor };
    if (settings.furStyle === 'charcoal') return { ...COLORS, fur: '#19191b', furLight: '#3a3b40', furShade: '#101012', eye: settings.eyeColor };
    return { ...COLORS, eye: settings.eyeColor };
  }
  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const hex = value => '#' + value.map(channel => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, amount) => hex(rgb(a).map((channel, index) => channel * (1 - amount) + rgb(b)[index] * amount));
  const luminance = value => { const [r, g, b] = rgb(value); return .2126 * r + .7152 * g + .0722 * b; };
  const colorDistance = (a, b) => { const d = a.map((channel, index) => channel - b[index]); return 2 * d[0] ** 2 + 4 * d[1] ** 2 + 3 * d[2] ** 2; };
  function applyLegacySettings(target, renderer, settings) {
    const ctx = target.getContext('2d'), base = renderer?.palette;
    if (!ctx || !base) return;
    const targetPalette = palette(settings), furKeys = ['fur', 'fur2', 'fur3', 'fur4', 'furCool'];
    const sourceFur = furKeys.map(key => base[key]).filter(Boolean).sort((a, b) => luminance(a) - luminance(b));
    const targetFur = [targetPalette.furShade, mix(targetPalette.furShade, targetPalette.fur, .62), targetPalette.fur, mix(targetPalette.fur, targetPalette.furLight, .52), targetPalette.furLight].sort((a, b) => luminance(a) - luminance(b));
    const replacements = sourceFur.map((source, index) => [rgb(source), rgb(targetFur[index])]);
    if (base.eye && base.eyeDeep && base.eyeHi) replacements.push([rgb(base.eye), rgb(targetPalette.eye)], [rgb(base.eyeDeep), rgb(mix(targetPalette.eye, '#405b27', .42))], [rgb(base.eyeHi), rgb(mix(targetPalette.eye, '#ffffff', .55))]);
    if (base.bowDark && base.bow) replacements.push([rgb(base.bowDark), rgb(mix(base.bowDark, base.bow, 1 - settings.plaidStrength))]);
    const image = ctx.getImageData(0, 0, target.width, target.height), data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue;
      const color = [data[i], data[i + 1], data[i + 2]];
      let best = null, score = Infinity;
      for (const [from, to] of replacements) { const d = colorDistance(color, from); if (d < score) { best = to; score = d; } }
      if (best && score <= 520) { data[i] = best[0]; data[i + 1] = best[1]; data[i + 2] = best[2]; }
    }
    ctx.putImageData(image, 0, 0);
    if (settings.scale !== 1) {
      const scaled = canvas(target.width), sc = scaled.getContext('2d');
      sc.imageSmoothingEnabled = false; sc.drawImage(target, 0, 0);
      ctx.clearRect(0, 0, target.width, target.height);
      const size = target.width * settings.scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(scaled, (target.width - size) / 2, (target.height - size) / 2, size, size);
    }
  }
  function path(ctx, draw, fill, stroke = COLORS.outline, width = 2) {
    ctx.beginPath(); draw(ctx); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  }
  function drawEnergyEnvironment(ctx, options = {}) {
    const size = clamp(options.size || 170, 1, 4096), scale = size / 170;
    const t = options.reducedMotion ? 0 : Number(options.time) || 0;
    const mood = moodOf(options.state), p = t / 1000;
    ctx.save(); ctx.scale(scale, scale); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const aura = ctx.createRadialGradient(85, 85, 49, 85, 85, 87);
    aura.addColorStop(0, 'rgba(0,18,46,0)'); aura.addColorStop(.64, 'rgba(0,58,127,.025)');
    aura.addColorStop(.82, 'rgba(0,120,235,.09)'); aura.addColorStop(1, 'rgba(0,67,174,.16)');
    ctx.fillStyle = aura; ctx.fillRect(0, 0, 170, 170);
    for (let i = 0; i < 5; i++) {
      const start = (i * 1.46) + p * (i % 2 ? -.10 : .13);
      ctx.save(); ctx.shadowColor = i % 2 ? '#00bfff' : '#16eaff'; ctx.shadowBlur = 10 - i;
      ctx.globalAlpha = .16 + (i % 2) * .05; ctx.strokeStyle = i % 2 ? '#0477e2' : '#08cfff'; ctx.lineWidth = 1.6 + (i % 3) * .7;
      ctx.beginPath(); ctx.ellipse(85, 85, 75 - i * 2.6, 75 - i * 2.1, .02 * Math.sin(p), start, start + 2.55 + (i % 2) * .5); ctx.stroke(); ctx.restore();
    }
    for (let i = 0; i < 13; i++) {
      const a = i * 2.399 + p * .06, r = 66 + Math.sin(i * 4.1 + p * .8) * 6;
      const x = 85 + Math.cos(a) * r, y = 85 + Math.sin(a) * r * .94;
      const pulse = options.reducedMotion ? .5 : .30 + ((Math.sin(p * 1.3 + i * 2.2) + 1) * .3);
      ctx.globalAlpha = pulse; ctx.fillStyle = i % 3 ? '#5df5ff' : '#e5fdff';
      ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 1.6 : .85, 0, Math.PI * 2); ctx.fill();
    }
    if (mood === 'caring' || mood === 'purring') {
      ctx.globalAlpha = .24; ctx.strokeStyle = '#ff7fac'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(85, 85, 71, .2, 1.12); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawNest(ctx, c, p, t, settings) {
    const settle = settings.motionScale && !p.reducedMotion ? Math.sin(t / 2000) * .7 : 0;
    ctx.save(); ctx.translate(0, settle);
    ctx.shadowColor = 'rgba(238,164,53,.32)'; ctx.shadowBlur = 7;
    ctx.fillStyle = '#bd782b'; ctx.beginPath(); ctx.ellipse(85, 143, 54, 23, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#e8ae52'; ctx.beginPath(); ctx.ellipse(85, 137, 48, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f7cf79'; ctx.globalAlpha = .8; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1.08 + i * .14); ctx.beginPath(); ctx.ellipse(85, 138, 47 - i * .8, 17 - i * .35, 0, a, a + .48); ctx.stroke(); }
    ctx.globalAlpha = .68; ctx.strokeStyle = '#9a5f28'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(85, 137, 35, 12, 0, .1, 2.9); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawTorso(ctx, c, t, p, settings) {
    const breath = p.reducedMotion || settings.motionScale === 0 ? 0 : Math.sin(t / 920) * .8 * settings.motionScale;
    ctx.save(); ctx.translate(0, breath);
    const fur = ctx.createLinearGradient(40, 116, 122, 165); fur.addColorStop(0, c.furLight); fur.addColorStop(.38, c.fur); fur.addColorStop(1, c.furShade);
    path(ctx, x => { x.moveTo(43, 164); x.bezierCurveTo(41, 145, 46, 128, 59, 119); x.bezierCurveTo(67, 114, 76, 113, 85, 114); x.bezierCurveTo(100, 113, 114, 117, 123, 127); x.bezierCurveTo(132, 137, 133, 151, 130, 164); x.closePath(); }, fur, '#07090e', 2.2);
    ctx.globalAlpha = .65; ctx.strokeStyle = '#343941'; ctx.lineWidth = 1;
    path(ctx, x => { x.moveTo(63, 127); x.quadraticCurveTo(72, 134, 77, 148); x.moveTo(107, 127); x.quadraticCurveTo(98, 134, 93, 148); }, null, '#343941', 1);
    ctx.globalAlpha = .18; ctx.strokeStyle = '#98a0ae'; ctx.lineWidth = 1;
    path(ctx, x => { x.moveTo(51, 137); x.quadraticCurveTo(57, 128, 68, 126); x.moveTo(116, 129); x.quadraticCurveTo(124, 135, 126, 144); }, null, '#98a0ae', 1);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawEar(ctx, c, left, twitch) {
    const dx = left ? -twitch : twitch;
    ctx.save(); ctx.translate(dx, 0);
    if (left) {
      path(ctx, x => { x.moveTo(43, 76); x.lineTo(47, 20); x.quadraticCurveTo(48, 12, 55, 19); x.lineTo(82, 53); x.closePath(); }, c.fur, '#05070b', 2.2);
      path(ctx, x => { x.moveTo(51, 58); x.lineTo(53, 29); x.quadraticCurveTo(54, 25, 58, 31); x.lineTo(72, 52); x.closePath(); }, c.ear, '#30343a', 1.1);
      ctx.globalAlpha = .55; path(ctx, x => { x.moveTo(55, 53); x.lineTo(55, 37); x.quadraticCurveTo(61, 43, 65, 51); }, null, c.earLight, .9);
    } else {
      path(ctx, x => { x.moveTo(88, 53); x.lineTo(116, 20); x.quadraticCurveTo(123, 13, 125, 22); x.lineTo(131, 77); x.closePath(); }, c.fur, '#05070b', 2.2);
      path(ctx, x => { x.moveTo(99, 52); x.lineTo(117, 30); x.quadraticCurveTo(121, 25, 121, 32); x.lineTo(124, 59); x.closePath(); }, c.ear, '#30343a', 1.1);
      ctx.globalAlpha = .55; path(ctx, x => { x.moveTo(108, 51); x.lineTo(119, 38); x.lineTo(120, 53); }, null, c.earLight, .9);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawHead(ctx, c, profile, t, p, settings) {
    const tilt = profile.pose === 'listen' ? -5.5 : profile.pose === 'chin' ? 2 : profile.pose === 'tucked' ? 1 : 0;
    const bob = p.reducedMotion || settings.motionScale === 0 ? 0 : Math.sin(t / 1500) * .7 * settings.motionScale;
    const twitch = p.reducedMotion || settings.motionScale === 0 ? 0 : Math.max(0, Math.sin(t / 2700)) * .8;
    ctx.save(); ctx.translate(85, 83 + bob); ctx.rotate(tilt * Math.PI / 180); ctx.scale(settings.scale, settings.scale); ctx.translate(-85, -83);
    drawEar(ctx, c, true, twitch); drawEar(ctx, c, false, twitch);
    const head = ctx.createLinearGradient(45, 47, 121, 119); head.addColorStop(0, c.furLight); head.addColorStop(.26, c.fur); head.addColorStop(1, c.furShade);
    path(ctx, x => { x.moveTo(85, 42); x.bezierCurveTo(61, 41, 43, 54, 39, 75); x.bezierCurveTo(34, 95, 43, 113, 59, 121); x.bezierCurveTo(69, 127, 78, 128, 85, 128); x.bezierCurveTo(94, 128, 104, 126, 113, 120); x.bezierCurveTo(129, 110, 137, 94, 132, 73); x.bezierCurveTo(127, 53, 108, 42, 85, 42); x.closePath(); }, head, '#05070b', 2.5);
    ctx.globalAlpha = .42; path(ctx, x => { x.moveTo(48, 77); x.quadraticCurveTo(54, 56, 76, 51); x.moveTo(119, 58); x.quadraticCurveTo(125, 69, 126, 81); }, null, '#4b515b', 1.1);
    const eyes = profile.eyes, eyeColor = c.eye;
    const drawEye = (x, y, mode, gaze) => {
      if (mode === 'closed') {
        ctx.globalAlpha = .92; path(ctx, q => { q.moveTo(x - 10, y); q.quadraticCurveTo(x, y + 6, x + 10, y - .5); }, null, '#080a0d', 2.1);
        ctx.globalAlpha = .5; path(ctx, q => { q.moveTo(x - 8, y + 3); q.quadraticCurveTo(x, y + 6, x + 8, y + 2); }, null, '#62636a', 1); return;
      }
      const h = mode === 'half' ? 5.2 : 8;
      ctx.globalAlpha = 1; ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.ellipse(x, y, 10, h, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#090c0e'; ctx.lineWidth = 2; ctx.stroke();
      const pupilX = x + (gaze === 'up-left' ? -2 : gaze === 'up-right' ? 2 : 0);
      const pupilY = y + (gaze.startsWith('up') ? -2 : 0);
      ctx.fillStyle = c.pupil; ctx.beginPath(); ctx.ellipse(pupilX, pupilY, 2.7, Math.max(2.2, h - 1), 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffef5'; ctx.globalAlpha = .92; ctx.beginPath(); ctx.arc(pupilX - 3, pupilY - 2.5, 1.35, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .32; ctx.fillStyle = c.eyeShade; ctx.beginPath(); ctx.ellipse(x, y + h - 1, 8, 2, 0, 0, Math.PI); ctx.fill();
      if (mode === 'half') {
        ctx.globalAlpha = 1; path(ctx, q => { q.moveTo(x - 11, y - 1); q.quadraticCurveTo(x, y - 8, x + 11, y - 2); q.lineTo(x + 11, y - 5); q.quadraticCurveTo(x, y - 11, x - 11, y - 4); q.closePath(); }, c.fur, '#090a0c', .7);
      }
    };
    const gaze = profile.gaze || 'center';
    if (eyes === 'wink') { drawEye(67, 79, 'open', gaze); drawEye(105, 80, 'closed', gaze); }
    else { drawEye(66, 79, eyes, gaze); drawEye(104, 79, eyes, gaze); }
    // Muzzle, nose and mouth remain small so the eyes and feline silhouette lead.
    ctx.globalAlpha = .5; ctx.fillStyle = '#696a70'; ctx.beginPath(); ctx.ellipse(85, 96, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .86; ctx.fillStyle = '#99999b'; ctx.beginPath(); ctx.ellipse(78, 96, 7, 4.5, -.18, 0, Math.PI * 2); ctx.ellipse(92, 96, 7, 4.5, .18, 0, Math.PI * 2); ctx.fill();
    if (root.OnyxSignatureParts?.drawNose) root.OnyxSignatureParts.drawNose(ctx, { x: 85, y: 95, scale: settings.noseScale, nose: c.nose, outline: '#343239' });
    else path(ctx, q => { q.moveTo(81, 94); q.quadraticCurveTo(85, 91.5, 89, 94); q.lineTo(85, 98); q.closePath(); }, c.nose, '#343239', .7);
    ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 1.1; path(ctx, q => { q.moveTo(85, 98); q.lineTo(85, 101); q.quadraticCurveTo(80, 105, 76, 102); q.moveTo(85, 101); q.quadraticCurveTo(90, 105, 94, 102); }, null, '#090a0d', 1.1);
    if (profile.tongue) { ctx.fillStyle = c.pink; path(ctx, q => { q.moveTo(82, 103); q.quadraticCurveTo(85, 101, 89, 103); q.lineTo(88, 110); q.quadraticCurveTo(84, 111, 82, 107); q.closePath(); }, c.pink, '#a5546d', .8); ctx.strokeStyle = '#d77590'; ctx.lineWidth = .6; path(ctx, q => { q.moveTo(85, 104); q.lineTo(85, 108); }, null, '#d77590', .6); }
    // Six slim whiskers on each side, drawn as fine pale strokes.
    ctx.globalAlpha = .9; ctx.strokeStyle = c.whisker; ctx.lineWidth = .85;
    for (let side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const sy = 97 + i * 4, drift = p.reducedMotion ? 0 : Math.sin(t / 820 + i * .8) * .75 * settings.motionScale;
      path(ctx, q => { q.moveTo(82 + side * 8, sy); q.quadraticCurveTo(85 + side * 22, sy - 2 + drift, 85 + side * (43 + i * 1.4), sy - 4 + i * 2.1 + drift); }, null, c.whisker, .72);
    }
    ctx.globalAlpha = .55; ctx.fillStyle = '#a8a9ad'; ctx.beginPath(); ctx.arc(75, 97, .8, 0, Math.PI * 2); ctx.arc(95, 97, .8, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawBowtie(ctx, c, t, reducedMotion, settings) {
    const settle = reducedMotion ? 0 : Math.sin(t / 1900) * .45 * settings.motionScale;
    if (root.OnyxSignatureParts?.drawBowtie) {
      root.OnyxSignatureParts.drawBowtie(ctx, {
        x: 85, y: 119, scale: settings.bowtieScale, rotation: settle,
        tie: c.tie, tieDark: c.tieDark, tieLight: c.tieLight,
        outline: '#102f22', plaidStrength: settings.plaidStrength
      });
      return;
    }
    ctx.save(); ctx.translate(85, 119); ctx.rotate(settle * Math.PI / 180); ctx.translate(-85, -119);
    path(ctx, x => { x.moveTo(81, 114); x.quadraticCurveTo(68, 108, 54, 109); x.lineTo(59, 126); x.quadraticCurveTo(70, 126, 82, 121); x.closePath(); }, c.tie, '#102f22', 1.8);
    path(ctx, x => { x.moveTo(89, 114); x.quadraticCurveTo(102, 108, 116, 109); x.lineTo(111, 126); x.quadraticCurveTo(100, 126, 88, 121); x.closePath(); }, c.tie, '#102f22', 1.8);
    ctx.save(); ctx.globalAlpha = settings.plaidStrength; ctx.strokeStyle = c.tieDark; ctx.lineWidth = 1.2;
    for (let x = 59; x <= 112; x += 8) { ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x + (x < 85 ? 3 : -3), 126); ctx.stroke(); }
    ctx.lineWidth = .75; for (let y = 112; y <= 124; y += 5) { ctx.beginPath(); ctx.moveTo(57, y); ctx.lineTo(114, y); ctx.stroke(); }
    ctx.globalAlpha *= .6; ctx.strokeStyle = c.tieLight; ctx.lineWidth = .65;
    for (let x = 62; x <= 108; x += 16) { ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x + (x < 85 ? 2 : -2), 125); ctx.stroke(); }
    ctx.restore();
    path(ctx, x => { x.moveTo(80, 114); x.quadraticCurveTo(85, 110, 90, 114); x.lineTo(89, 123); x.quadraticCurveTo(85, 126, 81, 123); x.closePath(); }, c.tieLight, '#17482d', 1.2);
    path(ctx, x => { x.moveTo(63, 126); x.quadraticCurveTo(64, 136, 70, 141); x.lineTo(79, 125); x.closePath(); }, c.tie, '#153c29', 1.2);
    path(ctx, x => { x.moveTo(91, 125); x.lineTo(101, 141); x.quadraticCurveTo(106, 135, 107, 126); x.closePath(); }, c.tie, '#153c29', 1.2);
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function drawPaw(ctx, c, pose, t, reducedMotion, settings) {
    const swing = reducedMotion ? 0 : Math.sin(t / 860) * 1.2 * settings.motionScale;
    if (pose === 'professor') {
      ctx.save(); ctx.translate(0, swing);
      path(ctx, x => { x.moveTo(49, 157); x.bezierCurveTo(45, 137, 46, 117, 50, 97); x.bezierCurveTo(51, 91, 56, 90, 59, 96); x.lineTo(59, 108); x.lineTo(62, 73); x.quadraticCurveTo(63, 66, 68, 70); x.lineTo(69, 93); x.lineTo(72, 77); x.quadraticCurveTo(75, 71, 78, 77); x.lineTo(76, 104); x.quadraticCurveTo(74, 122, 69, 138); x.lineTo(68, 158); x.closePath(); }, c.fur, '#07090e', 2);
      ctx.globalAlpha = .55; path(ctx, x => { x.moveTo(54, 111); x.quadraticCurveTo(59, 119, 67, 117); }, null, '#4d5663', 1);
      ctx.restore(); ctx.globalAlpha = 1;
    } else if (pose === 'heart') {
      ctx.save(); ctx.translate(0, swing * .5);
      path(ctx, x => { x.moveTo(102, 158); x.quadraticCurveTo(98, 143, 103, 129); x.lineTo(109, 115); x.quadraticCurveTo(112, 109, 117, 113); x.lineTo(120, 121); x.lineTo(124, 114); x.quadraticCurveTo(129, 110, 133, 116); x.quadraticCurveTo(140, 126, 132, 136); x.lineTo(127, 158); x.closePath(); }, c.furLight, '#07090e', 2);
      ctx.restore(); ctx.globalAlpha = 1;
    } else if (pose === 'listen') {
      ctx.save(); ctx.translate(swing * .4, 0);
      path(ctx, x => { x.moveTo(110, 153); x.bezierCurveTo(110, 133, 112, 119, 116, 103); x.lineTo(121, 83); x.quadraticCurveTo(123, 77, 127, 80); x.lineTo(128, 96); x.lineTo(132, 84); x.quadraticCurveTo(137, 82, 139, 87); x.lineTo(134, 109); x.quadraticCurveTo(130, 126, 131, 153); x.closePath(); }, c.fur, '#07090e', 2);
      ctx.restore();
    } else if (pose === 'chin') {
      path(ctx, x => { x.moveTo(65, 158); x.quadraticCurveTo(64, 142, 70, 129); x.lineTo(76, 114); x.quadraticCurveTo(80, 110, 84, 114); x.lineTo(86, 124); x.lineTo(91, 117); x.quadraticCurveTo(96, 115, 98, 120); x.quadraticCurveTo(100, 128, 91, 135); x.lineTo(87, 158); x.closePath(); }, c.furLight, '#07090e', 2);
    }
    if (pose === 'heart') drawHeart(ctx, 121, 125, c.pink, .9 + (reducedMotion ? 0 : Math.sin(t / 430) * .06));
  }
  function drawHeart(ctx, x, y, color, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); path(ctx, q => { q.moveTo(0, 6); q.bezierCurveTo(-4, 3, -7, 0, -5, -3); q.bezierCurveTo(-4, -7, 0, -6, 1, -3); q.bezierCurveTo(4, -7, 8, -5, 7, -1); q.bezierCurveTo(7, 2, 3, 5, 0, 7); q.closePath(); }, color, '#b95c83', .9); ctx.globalAlpha = .45; path(ctx, q => { q.moveTo(-3, -3); q.quadraticCurveTo(-1, -5, 1, -3); }, null, '#ffe7ef', .85); ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawGlasses(ctx, c, t, reducedMotion) {
    ctx.save(); ctx.strokeStyle = c.gold; ctx.lineWidth = 1.8; ctx.shadowColor = '#ffd972'; ctx.shadowBlur = 2;
    ctx.beginPath(); ctx.ellipse(66, 79, 12, 10, 0, 0, Math.PI * 2); ctx.ellipse(104, 79, 12, 10, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(78, 78); ctx.quadraticCurveTo(85, 75, 92, 78); ctx.moveTo(54, 78); ctx.lineTo(47, 76); ctx.moveTo(116, 78); ctx.lineTo(123, 76); ctx.stroke();
    const glint = reducedMotion ? .4 : Math.max(0, Math.sin(t / 1550)) ** 8; ctx.globalAlpha = .9 * glint; ctx.strokeStyle = '#fff9d1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(96, 71); ctx.lineTo(101, 70); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawClipboard(ctx, c) {
    ctx.save(); ctx.translate(118, 121); ctx.rotate(-.08);
    path(ctx, x => { x.moveTo(0, 3); x.lineTo(36, 3); x.lineTo(34, 47); x.lineTo(-3, 47); x.closePath(); }, c.board, '#3f2a1b', 2);
    path(ctx, x => { x.moveTo(10, 0); x.lineTo(26, 0); x.lineTo(28, 7); x.lineTo(8, 7); x.closePath(); }, '#9ba4a8', '#4c5459', 1.2);
    ctx.fillStyle = c.paper; ctx.globalAlpha = .76; ctx.fillRect(5, 12, 23, 28); ctx.globalAlpha = .68; ctx.strokeStyle = '#705c47'; ctx.lineWidth = 1;
    for (let y = 18; y < 36; y += 6) { ctx.beginPath(); ctx.moveTo(9, y); ctx.lineTo(24, y); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawSushiBubble(ctx, c, t, reducedMotion) {
    const bob = reducedMotion ? 0 : Math.sin(t / 530) * 1.4;
    ctx.save(); ctx.translate(0, bob);
    path(ctx, x => { x.moveTo(65, 43); x.bezierCurveTo(65, 31, 74, 26, 87, 26); x.bezierCurveTo(101, 26, 111, 32, 110, 42); x.bezierCurveTo(109, 51, 99, 54, 88, 54); x.lineTo(80, 61); x.lineTo(80, 53); x.bezierCurveTo(71, 52, 65, 49, 65, 43); x.closePath(); }, '#071a31', '#1aaee2', 1.6);
    ctx.fillStyle = '#f5ead7'; ctx.beginPath(); ctx.ellipse(88, 40, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
    path(ctx, x => { x.moveTo(73, 39); x.bezierCurveTo(77, 28, 98, 28, 103, 39); x.bezierCurveTo(95, 44, 80, 44, 73, 39); x.closePath(); }, '#ee8066', '#a54b42', 1.2);
    ctx.restore();
  }
  function drawThoughtCloud(ctx, c, t, reducedMotion) {
    const drift = reducedMotion ? 0 : Math.sin(t / 2200) * 1.4;
    ctx.save(); ctx.translate(drift, 0); ctx.strokeStyle = '#37c9ec'; ctx.lineWidth = 1.7; ctx.fillStyle = 'rgba(4,25,52,.76)';
    ctx.beginPath(); ctx.arc(76, 34, 6, 0, Math.PI * 2); ctx.arc(86, 26, 9, 0, Math.PI * 2); ctx.arc(98, 31, 7, 0, Math.PI * 2); ctx.arc(88, 35, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(76, 46, 2.5, 0, Math.PI * 2); ctx.arc(70, 51, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawProps(ctx, c, mood, t, reducedMotion) {
    const pulse = reducedMotion ? 1 : 1 + Math.sin(t / 420) * .07;
    if (mood === 'sleepy') {
      ctx.save(); ctx.strokeStyle = c.cyan; ctx.fillStyle = c.cyan; ctx.lineWidth = 2.4; ctx.globalAlpha = .82;
      for (let i = 0; i < 3; i++) { const x = 119 + i * 10, y = 34 - i * 9 + (reducedMotion ? 0 : Math.sin(t / 850 + i) * 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 1, y + 6); ctx.lineTo(x + 8, y + 6); ctx.stroke(); }
      ctx.restore();
    } else if (mood === 'snuggly') {
      ctx.save(); ctx.globalAlpha = .6; ctx.fillStyle = '#ffda85'; ctx.beginPath(); ctx.arc(45, 143, 2, 0, Math.PI * 2); ctx.arc(126, 142, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (mood === 'purring') {
      ctx.save(); ctx.strokeStyle = c.cyan; ctx.lineWidth = 2; ctx.globalAlpha = .86; const w = reducedMotion ? 0 : Math.sin(t / 260) * 2;
      for (const side of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(85 + side * (39 + i * 5 + w), 86, 7 + i * 3, side < 0 ? -1.05 : 2.12, side < 0 ? 1.05 : 4.18); ctx.stroke(); }
      drawHeart(ctx, 85, 26, c.cyan, pulse); ctx.restore();
    } else if (mood === 'hungry') drawSushiBubble(ctx, c, t, reducedMotion);
    else if (mood === 'listening') {
      ctx.save(); ctx.strokeStyle = c.cyan; ctx.lineWidth = 1.9; ctx.fillStyle = 'rgba(2,26,53,.7)';
      ctx.beginPath(); ctx.moveTo(18, 38); ctx.bezierCurveTo(18, 28, 26, 24, 39, 25); ctx.bezierCurveTo(51, 26, 56, 33, 53, 42); ctx.quadraticCurveTo(51, 49, 40, 49); ctx.lineTo(33, 56); ctx.lineTo(33, 49); ctx.quadraticCurveTo(20, 48, 18, 38); ctx.closePath(); ctx.fill(); ctx.stroke();
      drawHeart(ctx, 36, 36, c.cyan, .78); const wave = reducedMotion ? .5 : (Math.sin(t / 300) + 1) / 2; ctx.globalAlpha = .55 + wave * .4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(51, 36, 4 + i * 4, -.8, .8); ctx.stroke(); }
      ctx.restore();
    } else if (mood === 'caring') {
      drawHeart(ctx, 25, 44, c.pink, pulse); drawHeart(ctx, 134, 52, c.pink, pulse * .84); drawHeart(ctx, 45, 66, '#ffcee0', .68);
    } else if (mood === 'thinking') {
      ctx.save(); ctx.translate(85, 25); const sc = pulse; ctx.scale(sc, sc); ctx.shadowColor = '#ffe488'; ctx.shadowBlur = reducedMotion ? 1 : 5;
      ctx.fillStyle = '#ffe38a'; ctx.strokeStyle = '#916b32'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, -3, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = '#b9c4c6'; ctx.fillRect(-5, 7, 10, 4); ctx.fillRect(-4, 12, 8, 2); ctx.strokeStyle = '#879393'; ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(4, 10); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.strokeStyle = '#ffe99c'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, -3 + Math.sin(a) * 14); ctx.lineTo(Math.cos(a) * 18, -3 + Math.sin(a) * 18); ctx.stroke(); }
      ctx.restore();
    } else if (mood === 'thoughtful') drawThoughtCloud(ctx, c, t, reducedMotion);
    if (mood === 'caring') ctx.globalAlpha = 1;
  }
  function drawCodeMood(ctx, mood, options = {}) {
    const settings = normalizeSettings(options.settings || options), c = palette(settings), profile = PROFILE[mood];
    if (!profile) return false;
    const t = options.reducedMotion ? 0 : (Number(options.time) || 0) * settings.motionScale;
    const baseSize = Number(options.size) || 170, scale = baseSize / 170;
    ctx.save(); ctx.scale(scale, scale); ctx.clearRect(0, 0, 170, 170);
    if (profile.nest) drawNest(ctx, c, { reducedMotion: options.reducedMotion }, t, settings);
    drawTorso(ctx, c, t, { reducedMotion: options.reducedMotion }, settings);
    drawHead(ctx, c, profile, t, { reducedMotion: options.reducedMotion }, settings);
    drawBowtie(ctx, c, t, Boolean(options.reducedMotion), settings);
    drawPaw(ctx, c, profile.pose, t, Boolean(options.reducedMotion), settings);
    if (profile.glasses) drawGlasses(ctx, c, t, Boolean(options.reducedMotion));
    if (profile.clipboard) drawClipboard(ctx, c);
    drawProps(ctx, c, mood, t, Boolean(options.reducedMotion));
    ctx.restore(); return true;
  }
  function supports(mood) {
    const state = moodOf(mood);
    return Boolean(PROFILE[state]);
  }
  async function renderCanvas(mood, options = {}) {
    const state = moodOf(mood), size = Math.round(clamp(options.size || 170, 16, 2048));
    const target = options.target || canvas(size);
    target.width = target.height = size;
    const settings = effectiveSettings(state, options);
    if (state === 'advising_professor' && root.OnyxAdvisingProfessor?.render) {
      try {
        await root.OnyxAdvisingProfessor.render(target, { time: options.reducedMotion || settings.motionScale === 0 ? 0 : (Number(options.time) || 0) * settings.motionScale, reducedMotion: Boolean(options.reducedMotion || settings.motionScale === 0), size, pixelize: false, signatureSettings: settings });
        applyLegacySettings(target, root.OnyxAdvisingProfessor, settings);
        return target;
      } catch (_) {}
    }
    if (state === 'caring' && root.OnyxCaring?.render) {
      try {
        await root.OnyxCaring.render(target, { time: options.reducedMotion || settings.motionScale === 0 ? 0 : (Number(options.time) || 0) * settings.motionScale, reducedMotion: Boolean(options.reducedMotion || settings.motionScale === 0), size, pixelize: false, signatureSettings: settings });
        applyLegacySettings(target, root.OnyxCaring, settings);
        return target;
      } catch (_) {}
    }
    const ctx = target.getContext('2d'); if (!ctx || !drawCodeMood(ctx, state, { ...options, settings, size })) throw new Error('Code renderer unavailable for ' + state);
    return target;
  }
  async function renderPreview(mood, options = {}) {
    const state = moodOf(mood), size = Math.round(clamp(options.size || 170, 16, 2048));
    const target = canvas(size), ctx = target.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    drawEnergyEnvironment(ctx, { ...options, state, size });
    const character = await renderCanvas(state, { ...options, size });
    ctx.drawImage(character, 0, 0);
    return target;
  }
  function renderToContext(ctx, options = {}) {
    if (!ctx) return false;
    const mood = moodOf(options.state || options.mood), x = Number(options.x) || 0, y = Number(options.y) || 0;
    const width = Number(options.width) || 72, height = Number(options.height) || width;
    if (mood === 'advising_professor' && root.OnyxAdvisingProfessor?.renderToContext) {
      const settings = effectiveSettings(mood, options), source = canvas(170), sourceCtx = source.getContext('2d');
      let ok = false;
      try { ok = root.OnyxAdvisingProfessor.renderToContext(sourceCtx, { time: options.reducedMotion || settings.motionScale === 0 ? 0 : (Number(options.time) || 0) * settings.motionScale, reducedMotion: Boolean(options.reducedMotion || settings.motionScale === 0), x: 0, y: 0, width: 170, height: 170, signatureSettings: settings }); } catch (_) {}
      if (ok) applyLegacySettings(source, root.OnyxAdvisingProfessor, settings);
      else if (!drawCodeMood(sourceCtx, mood, { ...options, size: 170, settings })) return false;
      ctx.save(); ctx.imageSmoothingEnabled = false; const w = width * settings.scale, h = height * settings.scale; ctx.drawImage(source, x + (width - w) / 2, y + (height - h) / 2, w, h); ctx.restore(); return true;
    }
    if (mood === 'caring' && root.OnyxCaring?.renderToContext) {
      const settings = effectiveSettings(mood, options), source = canvas(170), sourceCtx = source.getContext('2d');
      let ok = false;
      try { ok = root.OnyxCaring.renderToContext(sourceCtx, { time: options.reducedMotion || settings.motionScale === 0 ? 0 : (Number(options.time) || 0) * settings.motionScale, reducedMotion: Boolean(options.reducedMotion || settings.motionScale === 0), x: 0, y: 0, width: 170, height: 170, signatureSettings: settings }); } catch (_) {}
      if (ok) applyLegacySettings(source, root.OnyxCaring, settings);
      else if (!drawCodeMood(sourceCtx, mood, { ...options, size: 170, settings })) return false;
      ctx.save(); ctx.imageSmoothingEnabled = false; const w = width * settings.scale, h = height * settings.scale; ctx.drawImage(source, x + (width - w) / 2, y + (height - h) / 2, w, h); ctx.restore(); return true;
    }
    const source = canvas(170), sourceCtx = source.getContext('2d');
    if (!sourceCtx || !drawCodeMood(sourceCtx, mood, { ...options, size: 170, settings: effectiveSettings(mood, options) })) return false;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(source, x, y, width, height); ctx.restore(); return true;
  }
  function stateRecord(mood) {
    const state = moodOf(mood); if (!supports(state)) return null;
    return { state, label: LABELS[state], codeRenderer: 'OnyxMoodRenderers', codeOnly: true, fallback: FALLBACKS[state], variants: [] };
  }
  function getAnimationProfile(mood) { const state = moodOf(mood); return { state, label: LABELS[state], duration: PROFILE[state]?.duration || (state === 'advising_professor' ? 6400 : 5200), loopMode: 'loop', reducedMotion: 'static-pose', events: [...(PROFILE[state]?.events || [])] }; }
  function drawEnvironmentToContext(ctx, options = {}) {
    if (!ctx) return false;
    const size = Number(options.size) || 72, source = canvas(170), sc = source.getContext('2d');
    if (!sc) return false;
    drawEnergyEnvironment(sc, { ...options, size: 170 });
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(source, Number(options.x) || 0, Number(options.y) || 0, size, size); ctx.restore(); return true;
  }
  const atlasStates = Object.freeze(Object.fromEntries(ORDER.map(state => [state, Object.freeze({ state, label: LABELS[state], codeRenderer: 'OnyxMoodRenderers', codeOnly: true, fallback: FALLBACKS[state], variants: Object.freeze([]) })])));
  root.OnyxMoodAtlas = Object.freeze({ version: '2.2.0-code-signature', order: ORDER, states: atlasStates, fallbackOnFailure: true });
  root.OnyxMoodRenderers = Object.freeze({
    version: '2.2.0-code-signature', logicalSize: [170, 170], runtimeSize: [72, 72], order: ORDER,
    labels: LABELS, profiles: PROFILE, defaults: SETTINGS, eyeColors: EYE_COLORS, normalizeMood: moodOf, settingsForMood: effectiveSettings,
    normalizeSettings, supports, stateRecord, render: renderCanvas, renderCanvas,
    renderPreview, renderToContext, drawEnvironment: drawEnergyEnvironment,
    drawEnvironmentToContext, getAnimationProfile,
    buildPortalState: mood => ({ schema: 'onyx.code-mood-state/v1', mood: moodOf(mood), label: LABELS[moodOf(mood)], renderer: 'OnyxMoodRenderers', sourcePolicy: 'procedural-code-only', fallbackOnlyOnRendererFailure: true })
  });
  const existingAtlas = root.OnyxAtlas || {};
  root.OnyxAtlas = {
    ...existingAtlas,
    palette: existingAtlas.palette || { 0: null, 1: COLORS.outline, 2: COLORS.fur, 3: COLORS.furLight, 4: COLORS.ear, 5: COLORS.eye, 6: COLORS.pupil, 7: COLORS.tie, 8: COLORS.tieLight, 9: COLORS.gold, 10: COLORS.cyan, 11: COLORS.pink, 12: COLORS.amber },
    states: Object.freeze({ ...atlasStates, ...(existingAtlas.states || {}) })
  };
  root.OnyxAtlasStore = root.OnyxAtlasStore || Object.freeze({
    loadMoodGroup: async () => ORDER.every(supports),
    loadBehaviorGroup: async () => ORDER.every(supports),
    loadTransitions: async () => true
  });
  root.dispatchEvent?.(new CustomEvent('onyx:mood-renderers-ready', { detail: { version: '2.2.0-code-signature', states: ORDER.slice(), codedStates: ORDER.filter(supports), fallbacks: 'on-render-error' } }));
})();
