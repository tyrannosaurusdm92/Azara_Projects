(function (global) {
  'use strict';
  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util;

  const SHAPES = ['rect','ellipse','roundrect','triangle','diamond','star','polygon','cloud','burst','moon','plant','cube','heart','arrow','speech','line'];
  const TOOLS = ['select','brush','paint','pencil','ink','marker','crayon','charcoal','calligraphy','neon','spray','graffiti','pixel','fill','text','eraser','eyedropper','zoom','stamp'];
  const IMAGE_COMMANDS = ['crop','resize','rotate','flip'];
  const MODES = ['book-cover','book-building'];

  const help = `# LiteraryFriend Studio controls

SuperBot is connected to the actual Studio editing bridge. Examples:

- \`/studio tool pencil\`, \`/studio tool eraser\`, \`/studio tool fill\`
- \`/studio shape star\`, \`/studio shape ellipse\`, \`/studio shape speech\`
- \`/studio color #00ffff\` or \`/studio secondary-color #ca6309\`
- \`/studio brush size 40\`, \`/studio brush opacity 55\`, \`/studio brush type marker\`
- \`/studio add layer\`, \`/studio add page\`, \`/studio add text My Book Title\`
- \`/studio image rotate\`, \`/studio image flip\`, \`/studio image crop\`, \`/studio image resize\`
- \`/studio undo\`, \`/studio redo\`, \`/studio delete layer\`, \`/studio duplicate layer\`
- \`/studio layer up\`, \`/studio layer down\`, \`/studio fit\`, \`/studio save\`
- \`/studio cover-base #111111\` or \`/studio cover-base gradient:ocean\`
- \`/studio mode book-building\` or \`/studio mode book-cover\`
- \`/studio size paperback-standard-trade\`
- \`/studio new book-building\` or \`/studio new book-cover\`
- \`/studio state\` — inspect current document/layer/book state
- \`/studio controls\` — list live editor buttons/inputs/selects
- \`/studio click CONTROL_ID\` — press a live editor control by ID
- \`/studio set CONTROL_ID VALUE\` — set a live input/select by ID

The generic **click** and **set** commands are the compatibility layer for editing controls added later, so SuperBot is not limited to a hard-coded subset of the Studio UI.`;

  function integration() {
    try { return parent && parent.LFStudioIntegration; } catch (_) { return null; }
  }

  async function request(action, args = {}) {
    const bridge = integration();
    if (!bridge || typeof bridge.request !== 'function') throw new Error('LiteraryFriend Studio editing bridge is not ready yet.');
    return bridge.request({ type: 'lf-superbot-action', action, args });
  }

  function cleanResult(result, label) {
    if (!result) return `${label || 'Studio action'} requested.`;
    if (result.ok === false) throw new Error(result.error || 'Studio action failed.');
    const detail = result.message || result.status || label || 'Studio action completed.';
    return detail;
  }

  async function runCommand(argument) {
    const raw = String(argument || '').trim();
    if (!raw || /^(help|commands|tools)$/i.test(raw)) return { text: help, source: 'studio-tool' };
    if (/^state$/i.test(raw)) {
      const r = await request('state');
      return { text: `# Current Studio state\n\n\`\`\`json\n${JSON.stringify(r.data || r, null, 2)}\n\`\`\``, source: 'studio-tool', meta: r };
    }
    if (/^(controls|catalog)$/i.test(raw)) {
      const r = await request('controls');
      const controls = r.data?.controls || [];
      return { text: `# Live Studio controls\n\n${controls.map(c => `- **${c.id || c.name || c.selector}** — ${c.type}${c.label ? ` · ${c.label}` : ''}${c.value !== undefined ? ` · current: \`${String(c.value)}\`` : ''}`).join('\n') || 'No controls reported.'}`, source: 'studio-tool', meta: r };
    }

    let m;
    if ((m = raw.match(/^tool\s+(.+)$/i))) return result('tool', { tool: m[1].trim().toLowerCase() }, `Tool changed to ${m[1].trim()}.`);
    if ((m = raw.match(/^shape\s+(.+)$/i))) return result('shape', { shape: normalizeToken(m[1]) }, `Added ${m[1].trim()} shape.`);
    if ((m = raw.match(/^color\s+(#[0-9a-f]{6})$/i))) return result('color', { color: m[1] }, `Primary color set to ${m[1]}.`);
    if ((m = raw.match(/^secondary(?:-color|\s+color)\s+(#[0-9a-f]{6})$/i))) return result('secondaryColor', { color: m[1] }, `Secondary color set to ${m[1]}.`);
    if ((m = raw.match(/^cover(?:-base|\s+base)\s+(.+)$/i))) return result('coverBase', { value: m[1].trim() }, `Cover Base set to ${m[1].trim()}.`);
    if ((m = raw.match(/^brush\s+size\s+(\d+(?:\.\d+)?)$/i))) return result('brush', { size: Number(m[1]) }, `Brush size set to ${m[1]}.`);
    if ((m = raw.match(/^brush\s+opacity\s+(\d+(?:\.\d+)?)%?$/i))) return result('brush', { opacity: Math.max(0.01, Math.min(1, Number(m[1]) > 1 ? Number(m[1]) / 100 : Number(m[1]))) }, `Brush opacity set to ${m[1]}${Number(m[1]) > 1 ? '%' : ''}.`);
    if ((m = raw.match(/^brush\s+(?:type|kind)\s+(.+)$/i))) return result('brush', { kind: normalizeToken(m[1]) }, `Brush type set to ${m[1].trim()}.`);
    if ((m = raw.match(/^image\s+(crop|resize|rotate|flip)$/i))) return result('imageCommand', { command: m[1].toLowerCase() }, `${m[1]} requested.`);
    if ((m = raw.match(/^mode\s+(book-cover|book-building)$/i))) return result('mode', { mode: m[1].toLowerCase() }, `Studio mode changed to ${m[1]}.`);
    if ((m = raw.match(/^size\s+(.+)$/i))) return result('sizePreset', { id: m[1].trim() }, `Book size changed to ${m[1].trim()}.`);
    if ((m = raw.match(/^title\s+(.+)$/i))) return result('title', { title: m[1].trim() }, 'Project title updated.');
    if ((m = raw.match(/^new\s+(book-cover|book-building)(?:\s+(.+))?$/i))) return result('new', { mode: m[1].toLowerCase(), title: (m[2] || '').trim() }, `New ${m[1]} project created.`);
    if ((m = raw.match(/^add\s+text\s+([\s\S]+)$/i))) return result('addText', { text: m[1].trim() }, 'Text layer added.');
    if ((m = raw.match(/^add\s+(?:image|artwork)\s+(https?:\/\/\S+)$/i))) return result('addImageUrl', { url: m[1] }, 'Image layer requested.');
    if ((m = raw.match(/^add\s+texture(?:\s+(.+))?$/i))) return result('addTexture', { id: normalizeToken(m[1] || 'paper') }, 'Texture layer added.');
    if ((m = raw.match(/^add\s+pattern(?:\s+(.+))?$/i))) return result('addPattern', { pattern: normalizeToken(m[1] || 'checker') }, 'Pattern layer added.');
    if (/^add\s+page$/i.test(raw)) return result('addPage', {}, 'Book page added.');
    if (/^add\s+layer$/i.test(raw)) return result('addLayer', {}, 'Paint layer added.');
    if (/^delete\s+layer$/i.test(raw)) return result('deleteLayer', {}, 'Selected layer deleted.');
    if (/^duplicate\s+layer$/i.test(raw)) return result('duplicateLayer', {}, 'Selected layer duplicated.');
    if (/^layer\s+up$/i.test(raw)) return result('moveLayer', { direction: 1 }, 'Selected layer moved up.');
    if (/^layer\s+down$/i.test(raw)) return result('moveLayer', { direction: -1 }, 'Selected layer moved down.');
    if (/^undo$/i.test(raw)) return result('undo', {}, 'Undo completed.');
    if (/^redo$/i.test(raw)) return result('redo', {}, 'Redo completed.');
    if (/^(fit|fit\s+canvas)$/i.test(raw)) return result('fit', {}, 'Canvas fitted to the viewport.');
    if (/^save$/i.test(raw)) return result('save', {}, 'Studio save requested.');
    if ((m = raw.match(/^click\s+([A-Za-z][\w:.-]*)$/i))) return result('controlClick', { id: m[1] }, `Pressed ${m[1]}.`);
    if ((m = raw.match(/^set\s+([A-Za-z][\w:.-]*)\s+([\s\S]+)$/i))) return result('controlSet', { id: m[1], value: parseValue(m[2].trim()) }, `Set ${m[1]}.`);

    return { text: `I could not parse that Studio command.\n\n${help}`, source: 'studio-tool' };
  }

  async function result(action, args, fallback) {
    const r = await request(action, args);
    return { text: cleanResult(r, fallback), source: 'studio-tool', meta: r };
  }

  function normalizeToken(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-'); }
  function parseValue(value) {
    if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
    if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
    return value;
  }

  async function tryNatural(message) {
    const s = String(message || '').trim();
    if (!s || s.startsWith('/')) return null;
    let m;
    // Only intercept explicit edit imperatives so ordinary writing/chat prompts remain normal SuperBot conversation.
    if (/^(?:please\s+)?(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?page\b/i.test(s)) return runCommand('add page');
    if (/^(?:please\s+)?(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?(?:paint\s+)?layer\b/i.test(s)) return runCommand('add layer');
    if (/^(?:please\s+)?undo\b/i.test(s)) return runCommand('undo');
    if (/^(?:please\s+)?redo\b/i.test(s)) return runCommand('redo');
    if (/^(?:please\s+)?save(?:\s+(?:the\s+)?(?:project|studio|cover|book))?\b/i.test(s)) return runCommand('save');
    if ((m=s.match(/^(?:please\s+)?(?:use|select|switch\s+to)\s+(?:the\s+)?([a-z -]+?)\s+(?:tool|brush)\.?$/i))) return runCommand(`tool ${normalizeToken(m[1])}`);
    if ((m=s.match(/^(?:please\s+)?(?:add|create|insert)\s+(?:a\s+)?(rectangle|rect|ellipse|circle|rounded rectangle|triangle|diamond|star|polygon|cloud|burst|moon|plant|cube|heart|arrow|speech bubble|line)(?:\s+shape)?\.?$/i))) {
      const map = {'rectangle':'rect','circle':'ellipse','rounded rectangle':'roundrect','speech bubble':'speech'};
      return runCommand(`shape ${map[m[1].toLowerCase()] || m[1]}`);
    }
    if ((m=s.match(/^(?:please\s+)?(?:set|change)\s+(?:the\s+)?(?:primary\s+)?color\s+to\s+(#[0-9a-f]{6})\.?$/i))) return runCommand(`color ${m[1]}`);
    if ((m=s.match(/^(?:please\s+)?(?:set|change)\s+(?:the\s+)?cover\s+base\s+to\s+(.+)$/i))) return runCommand(`cover-base ${m[1].replace(/[.]+$/,'')}`);
    if ((m=s.match(/^(?:please\s+)?add\s+(?:the\s+)?text\s+["“]?([\s\S]+?)["”]?\.?$/i))) return runCommand(`add text ${m[1]}`);
    return null;
  }

  function modelInstructions() {
    return `You can operate the user's open LiteraryFriend Studio through a local action protocol. When the user asks you to EDIT the open Studio, you may append one fenced block named studio-actions containing a JSON array. Do not use the block for mere advice. Supported actions are: tool, shape, color, secondaryColor, brush, imageCommand, mode, sizePreset, title, new, addPage, addLayer, addText, addImageUrl, addTexture, addPattern, deleteLayer, duplicateLayer, moveLayer, undo, redo, fit, save, coverBase, controlClick, controlSet, state. Each item must be {"action":"...","args":{...}}. The generic controlClick/controlSet actions can address any live editor control by its DOM id. Keep the natural-language answer concise and put the action block last. Example: \`\`\`studio-actions\n[{"action":"shape","args":{"shape":"star"}},{"action":"color","args":{"color":"#00ffff"}}]\n\`\`\``;
  }

  async function executeModelActions(text) {
    const raw = String(text || '');
    const patterns = [
      /```studio-actions\s*([\s\S]*?)```/ig,
      /<studio-actions>([\s\S]*?)<\/studio-actions>/ig
    ];
    let cleaned = raw;
    const actions = [];
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, (_, body) => {
        try {
          const parsed = JSON.parse(body.trim());
          if (Array.isArray(parsed)) actions.push(...parsed);
        } catch (_) { /* malformed model block stays non-operative */ }
        return '';
      });
    }
    if (!actions.length) return { text: raw, executed: [] };
    const executed = [];
    for (const item of actions.slice(0, 30)) {
      if (!item || typeof item.action !== 'string') continue;
      try {
        const r = await request(item.action, item.args && typeof item.args === 'object' ? item.args : {});
        executed.push({ action: item.action, ok: r?.ok !== false, message: r?.message || '' });
      } catch (error) {
        executed.push({ action: item.action, ok: false, message: U.errorMessage(error) });
      }
    }
    const summary = executed.map(x => `- ${x.ok ? '✓' : '✗'} ${x.action}${x.message ? ` — ${x.message}` : ''}`).join('\n');
    return { text: `${cleaned.trim()}${cleaned.trim() ? '\n\n' : ''}**Studio actions**\n${summary}`, executed };
  }

  SB.studio = { help, SHAPES, TOOLS, IMAGE_COMMANDS, MODES, request, runCommand, tryNatural, modelInstructions, executeModelActions };
})(window);
