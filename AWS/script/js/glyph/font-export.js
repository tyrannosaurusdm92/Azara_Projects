(function () {
  'use strict';

  function fileSafe(value) { return String(value || 'azaaraan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'azaaraan'; }
  function area(points) {
    let total = 0;
    for (let index = 0; index < points.length; index += 1) {
      const next = points[(index + 1) % points.length];
      total += points[index][0] * next[1] - next[0] * points[index][1];
    }
    return total / 2;
  }
  function createPath(contours, glyph, settings) {
    const path = new opentype.Path();
    const width = Number(glyph.advanceWidth) || 600;
    const sideBearings = Number(glyph.leftSpacing || 0) + Number(glyph.rightSpacing || 0);
    const scale = .78 * Math.max(80, width - sideBearings) / 512 * (Number(glyph.size) || 100) / 100;
    const baseline = Number.isFinite(Number(glyph.baseline)) ? Number(glyph.baseline) : 72;
    const baseY = 512 * baseline / 100;
    const leftPad = Number(glyph.leftSpacing || 0);
    contours.forEach(contour => {
      if (!contour || !Array.isArray(contour.points) || contour.points.length < 3) return;
      let points = contour.points.map(pair => [leftPad + Number(pair[0]) * 512 * scale, (baseY - Number(pair[1]) * 512) * scale]);
      const signed = area(points);
      const shouldPositive = !contour.hole;
      if ((signed > 0) !== shouldPositive) points = points.reverse();
      path.moveTo(points[0][0], points[0][1]);
      for (let index = 1; index < points.length; index += 1) path.lineTo(points[index][0], points[index][1]);
      path.close();
    });
    return path;
  }
  function toFont(project, eraId, format) {
    const era = project.eras[eraId];
    const used = new Map([[32, 'space']]);
    const glyphs = [
      new opentype.Glyph({ name: '.notdef', advanceWidth: 600, path: new opentype.Path() }),
      new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 320, path: new opentype.Path() })
    ];
    const unsupported = [];
    era.glyphs.slice().sort((a, b) => a.order - b.order).forEach(glyph => {
      if (!glyph.character || !glyph.artwork || !Array.isArray(glyph.vectorContours) || !glyph.vectorContours.length) return;
      const unicode = glyph.character.codePointAt(0);
      if (used.has(unicode)) { unsupported.push(`${glyph.character}: duplicate Unicode assignment`); return; }
      used.set(unicode, glyph.id);
      const name = `uni${unicode.toString(16).toUpperCase().padStart(4, '0')}`;
      const path = createPath(glyph.vectorContours, glyph, project.settings);
      glyphs.push(new opentype.Glyph({ name, unicode, advanceWidth: Math.max(100, Number(glyph.advanceWidth) || 600), path }));
    });
    if (glyphs.length === 2) throw new Error(`No traced glyphs in ${era.label}. Upload artwork and choose “Trace to outline” for at least one character.`);
    const font = new opentype.Font({
      familyName: `${project.settings.fontFamily || project.name} ${era.label}`,
      styleName: 'Regular',
      version: `Version ${project.settings.fontVersion || '1.0'}`,
      unitsPerEm: 1000,
      ascender: Number(project.settings.ascender) || 800,
      descender: -(Number(project.settings.descender) || 200),
      glyphs
    });
    font.outlinesFormat = format === 'otf' ? 'cff' : 'truetype';
    return { font, glyphCount: glyphs.length - 2, unsupported };
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportEra(project, eraId, format) {
    const result = toFont(project, eraId, format);
    const buffer = result.font.toArrayBuffer();
    const mime = format === 'otf' ? 'font/otf' : 'font/ttf';
    download(new Blob([buffer], { type: mime }), `${fileSafe(project.settings.fontFamily || project.name)}-${eraId}.${format}`);
    return result;
  }
  window.FontExporter = { exportEra, toFont };
}());
