(function () {
  'use strict';

  const StudioModel = {
    schemaVersion: 2,
    createId(prefix = 'id') {
      return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    },
    clamp(value, min, max, fallback) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    },
    fromCodepoints(values, eraId = 'proto') {
      return values.map((codepoint, index) => this.createGlyph(eraId, index, {
        codepoint,
        character: String.fromCodePoint(codepoint),
        name: `Proto glyph ${String(index + 1).padStart(2, '0')}`
      }));
    },
    createGlyph(eraId, index, extra = {}) {
      return Object.assign({
        id: `${eraId}-${String(index + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 5)}`,
        eraId,
        order: index,
        character: '',
        codepoint: null,
        name: `${eraId} glyph ${String(index + 1).padStart(2, '0')}`,
        ipa: '',
        sound: '',
        transliteration: '',
        latinSubstitute: '',
        meaning: '',
        pronunciation: '',
        origin: '',
        notes: '',
        category: 'independent',
        key: '',
        artwork: '',
        layers: [],
        vectorContours: [],
        size: 100,
        baseline: 72,
        leftSpacing: 10,
        rightSpacing: 10,
        advanceWidth: 600,
        ascender: 800,
        descender: 200,
        parents: [],
        confidence: '',
        lineageNote: ''
      }, extra);
    },
    createProject(data) {
      const template = data.template.characters || [];
      const defs = data.eraData.eras;
      const eras = {};
      defs.forEach(definition => {
        let glyphs = Array.from({ length: definition.targetCount }, (_, index) => this.createGlyph(definition.id, index));
        if (definition.id === 'proto') {
          glyphs = this.fromCodepoints(template, 'proto');
          glyphs.forEach((glyph, index) => { glyph.order = index; glyph.eraId = 'proto'; });
        }
        if (definition.id === 'modern') {
          glyphs = data.aws.baseLetters.map((letter, index) => {
            const codepoint = letter.character.codePointAt(0);
            return this.createGlyph('modern', index, {
              id: `modern-${letter.key}`,
              codepoint,
              character: letter.character,
              name: `Modern ${letter.key}`,
              ipa: letter.ipa,
              sound: letter.key,
              transliteration: letter.key,
              latinSubstitute: letter.key,
              key: letter.key,
              category: 'independent'
            });
          });
          (data.aws.familyGlyphs || []).forEach(letter => {
            const index = glyphs.length;
            glyphs.push(this.createGlyph('modern', index, {
              id: `modern-family-${letter.key}`,
              codepoint: letter.character.codePointAt(0),
              character: letter.character,
              name: `Modern ${letter.key} family glyph`,
              ipa: letter.ipa,
              sound: letter.key,
              transliteration: letter.key,
              latinSubstitute: letter.key,
              key: letter.key,
              category: 'family',
              order: index
            }));
          });
        }
        eras[definition.id] = Object.assign({}, definition, { glyphs });
      });
      return {
        schemaVersion: 2,
        projectId: this.createId('aza'),
        name: "Aza'raan Glyph Studio",
        language: "Aza'raan",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeEra: 'proto',
        eraOrder: defs.map(item => item.id),
        eras,
        rules: Object.assign({}, data.eraData.rules),
        marks: JSON.parse(JSON.stringify(data.aws.marks)),
        specialMarks: JSON.parse(JSON.stringify(data.aws.specialMarks)),
        keyLabels: data.aws.keyLabels.slice(),
        settings: {
          letterSpacing: 0,
          lineSpacing: 1.45,
          glyphSize: 100,
          cellsPerPage: 16,
          paperSize: 'letter',
          fontFamily: "Aza'raan",
          fontVersion: '1.0',
          ascender: 800,
          descender: 200,
          threshold: 185,
          neatenStroke: 35,
          brushOpacity: 100,
          brushSize: 12,
          nudgeStep: 5
        },
        previewText: template.slice(0, 16).map(codepoint => String.fromCodePoint(codepoint)).join(''),
        keyboard: this.defaultKeyboard(data.aws.baseLetters),
        unicodeRegistry: []
      };
    },
    defaultKeyboard(baseLetters) {
      return baseLetters.map(letter => ({ key: letter.key, glyphId: `modern-${letter.key}`, character: letter.character, ipa: letter.ipa, enabled: true }));
    },
    activeGlyphs(project, eraId = project.activeEra) {
      return project.eras[eraId] ? project.eras[eraId].glyphs : [];
    },
    activeEra(project) { return project.eras[project.activeEra]; },
    codepointLabel(glyph) {
      const values = Array.from(glyph.character || '').map(char => char.codePointAt(0));
      if (values.length) return values.map(point => `U+${point.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
      return Number.isInteger(glyph.codepoint) ? `U+${glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}` : 'Unassigned';
    },
    html(value) {
      return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    },
    graphemes(text) {
      if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment);
      return Array.from(text);
    },
    normalizeGlyph(source, eraId, index) {
      const character = String(source.character || '');
      const codepoint = Number.isInteger(source.codepoint) ? source.codepoint : (character ? character.codePointAt(0) : null);
      const validArtwork = value => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
      const validChar = !character || (Array.from(character).length <= 3 && character.codePointAt(0) <= 0x10ffff);
      const layers = Array.isArray(source.layers) ? source.layers.slice(0, 32).map((layer, layerIndex) => ({
        id: String(layer.id || `layer-${layerIndex + 1}`),
        name: String(layer.name || `Layer ${layerIndex + 1}`).slice(0, 80),
        visible: layer.visible !== false,
        opacity: this.clamp(layer.opacity, 0, 100, 100),
        blendMode: String(layer.blendMode || 'source-over'),
        artwork: validArtwork(layer.artwork)
      })) : [];
      return Object.assign(this.createGlyph(eraId, index), source, {
        id: String(source.id || this.createId(`${eraId}-glyph`)),
        eraId,
        order: Number.isFinite(source.order) ? source.order : index,
        character: validChar ? character : '',
        codepoint: Number.isInteger(codepoint) && codepoint >= 0 && codepoint <= 0x10ffff ? codepoint : null,
        name: String(source.name || `Glyph ${index + 1}`).slice(0, 100),
        ipa: String(source.ipa || '').slice(0, 80),
        sound: String(source.sound || '').slice(0, 120),
        origin: String(source.origin || '').slice(0, 160),
        transliteration: String(source.transliteration || '').slice(0, 120),
        latinSubstitute: String(source.latinSubstitute || '').slice(0, 120),
        meaning: String(source.meaning || '').slice(0, 500),
        pronunciation: String(source.pronunciation || '').slice(0, 160),
        notes: String(source.notes || '').slice(0, 12000),
        category: String(source.category || 'independent').slice(0, 40),
        key: String(source.key || '').slice(0, 4),
        artwork: validArtwork(source.artwork),
        layers,
        vectorContours: Array.isArray(source.vectorContours) ? source.vectorContours.slice(0, 500) : [],
        size: this.clamp(source.size, 20, 220, 100),
        baseline: this.clamp(source.baseline, 0, 100, 72),
        leftSpacing: this.clamp(source.leftSpacing, -100, 200, 10),
        rightSpacing: this.clamp(source.rightSpacing, -100, 200, 10),
        advanceWidth: this.clamp(source.advanceWidth, 100, 1600, 600),
        ascender: this.clamp(source.ascender, 0, 1400, 800),
        descender: this.clamp(source.descender, 0, 800, 200),
        parents: Array.isArray(source.parents) ? source.parents.map(String).slice(0, 8) : [],
        confidence: String(source.confidence || '').slice(0, 20),
        lineageNote: String(source.lineageNote || '').slice(0, 3000)
      });
    },
    normalizeProject(input) {
      if (!input || typeof input !== 'object') throw new Error('This file is not a glyph project.');
      if (!input.eras) {
        if (!Array.isArray(input.characters)) throw new Error('This project file does not contain glyph data.');
        const eras = {};
        ['proto', 'ancient', 'preclassical', 'classical', 'traditional', 'modern'].forEach((id, eraIndex) => {
          const target = [52, 52, 52, 49, 44, 21][eraIndex];
          const glyphs = eraIndex === 0 ? input.characters.map((glyph, index) => this.normalizeGlyph(glyph, id, index)) : Array.from({ length: target }, (_, index) => this.createGlyph(id, index));
          eras[id] = { id, label: id[0].toUpperCase() + id.slice(1), backendEra: ['archaic', 'archaic', 'archaic', 'classical', 'traditional', 'modern'][eraIndex], targetCount: target, description: '', glyphs };
        });
        return this.normalizeProject(Object.assign({}, input, { schemaVersion: 2, eras, eraOrder: Object.keys(eras), activeEra: 'proto', characters: undefined }));
      }
      const eras = {};
      const order = Array.isArray(input.eraOrder) ? input.eraOrder : Object.keys(input.eras);
      order.forEach(eraId => {
        const era = input.eras[eraId];
        if (!era || !Array.isArray(era.glyphs)) return;
        eras[eraId] = {
          id: eraId,
          label: String(era.label || eraId).slice(0, 60),
          backendEra: String(era.backendEra || 'archaic'),
          targetCount: this.clamp(era.targetCount, 1, 500, era.glyphs.length || 52),
          description: String(era.description || '').slice(0, 1000),
          glyphs: era.glyphs.map((glyph, index) => this.normalizeGlyph(glyph, eraId, index))
        };
      });
      const validOrder = order.filter(id => eras[id]);
      if (!validOrder.length) throw new Error('This project has no usable eras.');
      const activeEra = eras[input.activeEra] ? input.activeEra : validOrder[0];
      const settings = input.settings || {};
      const keyLabels = Array.isArray(input.keyLabels) && input.keyLabels.length
        ? input.keyLabels.map(String).slice(0, 64)
        : (eras.modern ? eras.modern.glyphs.filter(glyph => glyph.key).map(glyph => glyph.key) : []);
      const keyboardRows = Array.isArray(input.keyboard) ? input.keyboard.map(row => ({ key: String(row.key || '').slice(0, 4), glyphId: String(row.glyphId || ''), character: String(row.character || ''), ipa: String(row.ipa || ''), enabled: row.enabled !== false })) : [];
      const rowByKey = new Map(keyboardRows.map(row => [row.key, row]));
      const keyboard = keyLabels.map(key => {
        const saved = rowByKey.get(key);
        if (saved) return saved;
        const glyph = eras.modern && eras.modern.glyphs.find(item => item.key === key);
        return { key, glyphId: glyph ? glyph.id : '', character: glyph ? glyph.character : '', ipa: glyph ? glyph.ipa : '', enabled: Boolean(glyph) };
      });
      return {
        schemaVersion: 2,
        projectId: String(input.projectId || this.createId('aza')),
        name: String(input.name || "Aza'raan Glyph Studio").slice(0, 100),
        language: String(input.language || "Aza'raan").slice(0, 100),
        createdAt: String(input.createdAt || new Date().toISOString()),
        updatedAt: new Date().toISOString(),
        activeEra,
        eraOrder: validOrder,
        eras,
        rules: Object.assign({ maxStackedMarks: 3, maxVowelMarks: 1, uniqueUnicodePerEra: true }, input.rules || {}),
        marks: Array.isArray(input.marks) ? input.marks : [],
        specialMarks: Array.isArray(input.specialMarks) ? input.specialMarks : [],
        keyLabels,
        unicodeRegistry: Array.isArray(input.unicodeRegistry) ? input.unicodeRegistry.slice(0,500).map(x=>({...x})):[],
        settings: {
          letterSpacing: this.clamp(settings.letterSpacing, -4, 18, 0),
          lineSpacing: this.clamp(settings.lineSpacing, 1, 2.5, 1.45),
          glyphSize: this.clamp(settings.glyphSize, 50, 180, 100),
          cellsPerPage: Number(settings.cellsPerPage) === 12 ? 12 : 16,
          paperSize: settings.paperSize === 'a4' ? 'a4' : 'letter',
          fontFamily: String(settings.fontFamily || input.name || "Aza'raan").slice(0, 100),
          fontVersion: String(settings.fontVersion || '1.0').slice(0, 30),
          ascender: this.clamp(settings.ascender, 300, 1400, 800),
          descender: this.clamp(settings.descender, 0, 800, 200),
          threshold: this.clamp(settings.threshold, 30, 250, 185),
          neatenStroke: this.clamp(settings.neatenStroke, 0, 100, 35),
          brushOpacity: this.clamp(settings.brushOpacity, 1, 100, 100),
          brushSize: this.clamp(settings.brushSize, 1, 80, 12),
          nudgeStep: this.clamp(settings.nudgeStep, 1, 20, 5)
        },
        previewText: String(input.previewText || '').slice(0, 8000),
        keyboard
      };
    }
  };
  window.StudioModel = StudioModel;
}());
