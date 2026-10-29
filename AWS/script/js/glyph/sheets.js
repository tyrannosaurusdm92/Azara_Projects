(function () {
  'use strict';
  const LETTER = { width: 2550, height: 3300, label: 'US Letter' };
  const A4 = { width: 2480, height: 3508, label: 'A4' };
  const esc = StudioModel.html;
  function pageSpec(project) { return project.settings.paperSize === 'a4' ? A4 : LETTER; }
  function glyphs(project) { return StudioModel.activeGlyphs(project).slice().sort((a, b) => a.order - b.order); }
  function gridSpec(project) {
    const cols = project.settings.cellsPerPage === 12 ? 3 : 4;
    const rows = 4;
    const page = pageSpec(project);
    const x = page.width * .035;
    const y = page.height * .142;
    const width = page.width * .93;
    const height = page.height * .805;
    return { cols, rows, x, y, width, height, cellWidth: width / cols, cellHeight: height / rows };
  }
  function getPages(project) {
    const perPage = project.settings.cellsPerPage;
    const source = glyphs(project);
    const pages = [];
    for (let index = 0; index < source.length; index += perPage) pages.push(source.slice(index, index + perPage));
    return pages.length ? pages : [[]];
  }
  function drawQr(ctx, payload, x, y, size) {
    if (typeof qrcode !== 'function') throw new Error('The local QR generator could not be loaded.');
    const code = qrcode(0, 'M');
    code.addData(JSON.stringify(payload), 'Byte');
    code.make();
    const count = code.getModuleCount();
    const quiet = Math.max(12, Math.round(size * .065));
    const unit = (size - quiet * 2) / count;
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size); ctx.fillStyle = '#173d37';
    for (let row = 0; row < count; row += 1) for (let col = 0; col < count; col += 1) if (code.isDark(row, col)) ctx.fillRect(x + quiet + col * unit, y + quiet + row * unit, Math.ceil(unit), Math.ceil(unit));
  }
  function drawCell(ctx, box, glyph, index, pageWidth) {
    const { x, y, width, height } = box;
    const line = Math.max(1, pageWidth * .00048);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#87938d'; ctx.lineWidth = line; ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = '#f2f5f2'; ctx.fillRect(x + line, y + line, width - line * 2, height * .14);
    ctx.strokeStyle = '#d4ddd8'; ctx.beginPath(); ctx.moveTo(x, y + height * .14); ctx.lineTo(x + width, y + height * .14); ctx.stroke();
    const cp = glyph ? StudioModel.codepointLabel(glyph) : 'OPEN CELL';
    ctx.fillStyle = glyph ? '#243f38' : '#a5b0ab'; ctx.font = `600 ${pageWidth * .0053}px monospace`;
    ctx.fillText(`${String(index + 1).padStart(2, '0')}  ${cp}`, x + width * .035, y + height * .055);
    if (glyph) {
      ctx.fillStyle = '#77867f'; ctx.font = `400 ${pageWidth * .0035}px system-ui, sans-serif`;
      const detail = [glyph.name, glyph.ipa ? `/${glyph.ipa}/` : '', glyph.meaning ? `· ${glyph.meaning}` : ''].filter(Boolean).join(' ');
      ctx.fillText(detail.slice(0, 58), x + width * .035, y + height * .112);
    }
    ctx.strokeStyle = '#e1e7e2'; ctx.lineWidth = line * .8; ctx.setLineDash([pageWidth * .0015, pageWidth * .0016]);
    for (const position of [.38, .59]) { ctx.beginPath(); ctx.moveTo(x + width * .055, y + height * position); ctx.lineTo(x + width * .945, y + height * position); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = '#c89b67'; ctx.lineWidth = line * 1.1;
    ctx.beginPath(); ctx.moveTo(x + width * .055, y + height * .79); ctx.lineTo(x + width * .945, y + height * .79); ctx.stroke();
  }
  function renderPage(project, pageIndex, options = {}) {
    const pages = getPages(project); const page = pageSpec(project); const ratio = options.scale || 1;
    const canvas = document.createElement('canvas'); canvas.width = Math.round(page.width * ratio); canvas.height = Math.round(page.height * ratio);
    const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, page.width, page.height);
    const margin = page.width * .035; const qrSize = page.width * .105; const qrX = page.width - margin - qrSize; const qrY = page.height * .018;
    const grid = gridSpec(project); const sourcePage = pages[pageIndex] || []; const pageNumber = pageIndex + 1; const era = StudioModel.activeEra(project);
    const payload = { app: 'AzaaraanGlyphStudio', v: 2, project: project.projectId, era: project.activeEra, page: pageNumber, pages: pages.length, size: project.settings.paperSize, perPage: project.settings.cellsPerPage, cols: grid.cols, rows: grid.rows, chars: sourcePage.map(glyph => [glyph.id, glyph.codepoint]) };
    ctx.fillStyle = '#173d37'; ctx.font = `700 ${page.width * .014}px system-ui, sans-serif`; ctx.fillText(`AZA'RAAN · ${era.label.toUpperCase()} CHARACTER SHEET`, margin, page.height * .045);
    ctx.fillStyle = '#61736c'; ctx.font = `400 ${page.width * .0052}px system-ui, sans-serif`; ctx.fillText(`${project.name} · Page ${pageNumber} of ${pages.length} · ${page.label}`, margin, page.height * .07);
    ctx.fillStyle = '#87938d'; ctx.font = `400 ${page.width * .0044}px system-ui, sans-serif`; ctx.fillText('One character per box · keep the full page visible when scanning', margin, page.height * .095);
    ctx.strokeStyle = '#dbe4df'; ctx.lineWidth = Math.max(1, page.width * .00045); ctx.beginPath(); ctx.moveTo(margin, page.height * .122); ctx.lineTo(page.width - margin, page.height * .122); ctx.stroke();
    drawQr(ctx, payload, qrX, qrY, qrSize);
    ctx.fillStyle = '#75857e'; ctx.font = `500 ${page.width * .0032}px monospace`; ctx.textAlign = 'center'; ctx.fillText(`${era.id.toUpperCase()} · ${String(project.projectId).slice(-8)} · ${pageNumber}/${pages.length}`, qrX + qrSize / 2, qrY + qrSize + page.height * .007); ctx.textAlign = 'left';
    for (let index = 0; index < grid.cols * grid.rows; index += 1) {
      const row = Math.floor(index / grid.cols); const col = index % grid.cols; const x = grid.x + col * grid.cellWidth; const y = grid.y + row * grid.cellHeight;
      drawCell(ctx, { x, y, width: grid.cellWidth, height: grid.cellHeight }, sourcePage[index] || null, index, page.width);
    }
    ctx.fillStyle = '#84928c'; ctx.font = `400 ${page.width * .0041}px system-ui, sans-serif`; ctx.fillText('Scan with Aza’raan Glyph Studio to map each box to its character.', margin, page.height * .978);
    ctx.textAlign = 'right'; ctx.font = `500 ${page.width * .0036}px monospace`; ctx.fillText(`PROJECT ${String(project.projectId).slice(-8).toUpperCase()}`, page.width - margin, page.height * .978); ctx.textAlign = 'left';
    return canvas;
  }
  function createPreview(project, host) {
    const pages = getPages(project); host.innerHTML = '';
    pages.forEach((page, index) => { const card = document.createElement('div'); card.className = 'sheet-preview-card'; const image = document.createElement('img'); image.alt = `Print sheet ${index + 1}`; image.src = renderPage(project, index, { scale: .2 }).toDataURL('image/png'); const label = document.createElement('span'); label.textContent = `PAGE ${String(index + 1).padStart(2, '0')} · ${page.length} GLYPHS`; card.append(image, label); host.append(card); });
  }
  function downloadCanvas(canvas, name) { return new Promise(resolve => canvas.toBlob(blob => { if (!blob) return resolve(false); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); resolve(true); }, 'image/png')); }
  function filename(project) { return (project.name || 'azaaraan-glyph-set').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'azaaraan-glyph-set'; }
  async function downloadPngs(project) { const pages = getPages(project); for (let index = 0; index < pages.length; index += 1) await downloadCanvas(renderPage(project, index, { scale: .8 }), `${filename(project)}-${project.activeEra}-sheet-${String(index + 1).padStart(2, '0')}.png`); }
  async function printPages(project) {
    const printWindow = window.open('', '_blank'); if (!printWindow) throw new Error('Allow the print window to open, then try again.');
    printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Aza’raan glyph sheets</title></head><body><p style="font:14px system-ui;padding:24px">Preparing print sheets…</p></body></html>');
    const pages = getPages(project); const images = pages.map((_, index) => renderPage(project, index, { scale: 1 }).toDataURL('image/png'));
    const size = project.settings.paperSize === 'a4' ? 'A4 portrait' : 'letter portrait';
    const markup = images.map((src, index) => `<section class="page"><img src="${src}" alt="Glyph sheet ${index + 1}"></section>`).join('');
    printWindow.document.open(); printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(project.name)} - glyph sheets</title><style>@page{size:${size};margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}.page{width:100%;height:100vh;page-break-after:always;break-after:page;overflow:hidden}.page:last-child{page-break-after:auto;break-after:auto}.page img{display:block;width:100%;height:100%;object-fit:fill}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}@media screen{body{background:#e8ece9}.page{height:auto;width:min(8.5in,90vw);margin:20px auto;box-shadow:0 6px 24px #5672}}</style></head><body>${markup}<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},450)};<\/script></body></html>`); printWindow.document.close();
  }
  window.SheetGenerator = { getPages, gridSpec, pageSpec, renderPage, createPreview, downloadPngs, printPages };
}());
