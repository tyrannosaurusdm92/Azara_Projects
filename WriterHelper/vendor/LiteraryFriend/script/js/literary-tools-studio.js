(function (global) {
  'use strict';

  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util;

  class ExpressionParser {
    constructor(input) {
      this.input = String(input || '');
      this.index = 0;
      this.token = null;
      this.next();
    }

    next() {
      while (/\s/.test(this.input[this.index] || '')) this.index++;
      if (this.index >= this.input.length) return this.token = { type: 'eof' };
      const rest = this.input.slice(this.index);
      const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (number) {
        this.index += number[0].length;
        return this.token = { type: 'number', value: Number(number[0]) };
      }
      const ident = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (ident) {
        this.index += ident[0].length;
        return this.token = { type: 'ident', value: ident[0].toLowerCase() };
      }
      const char = this.input[this.index++];
      if ('+-*/%^(),'.includes(char)) return this.token = { type: char };
      throw new Error(`Unexpected character: ${char}`);
    }

    parse() {
      const value = this.expression();
      if (this.token.type !== 'eof') throw new Error('Unexpected trailing input.');
      if (!Number.isFinite(value)) throw new Error('Result is not finite.');
      return value;
    }

    expression() {
      let value = this.term();
      while (this.token.type === '+' || this.token.type === '-') {
        const op = this.token.type; this.next();
        const right = this.term();
        value = op === '+' ? value + right : value - right;
      }
      return value;
    }

    term() {
      let value = this.power();
      while (this.token.type === '*' || this.token.type === '/' || this.token.type === '%') {
        const op = this.token.type; this.next();
        const right = this.power();
        if ((op === '/' || op === '%') && right === 0) throw new Error('Division by zero.');
        value = op === '*' ? value * right : op === '/' ? value / right : value % right;
      }
      return value;
    }

    power() {
      let value = this.unary();
      if (this.token.type === '^') {
        this.next();
        value = Math.pow(value, this.power());
      }
      return value;
    }

    unary() {
      if (this.token.type === '+') { this.next(); return this.unary(); }
      if (this.token.type === '-') { this.next(); return -this.unary(); }
      return this.primary();
    }

    primary() {
      if (this.token.type === 'number') {
        const value = this.token.value; this.next(); return value;
      }
      if (this.token.type === '(') {
        this.next();
        const value = this.expression();
        if (this.token.type !== ')') throw new Error('Missing closing parenthesis.');
        this.next();
        return value;
      }
      if (this.token.type === 'ident') {
        const name = this.token.value; this.next();
        if (name === 'pi') return Math.PI;
        if (name === 'e') return Math.E;
        if (this.token.type !== '(') throw new Error(`Unknown constant: ${name}`);
        this.next();
        const args = [];
        if (this.token.type !== ')') {
          args.push(this.expression());
          while (this.token.type === ',') { this.next(); args.push(this.expression()); }
        }
        if (this.token.type !== ')') throw new Error('Missing closing parenthesis.');
        this.next();
        return this.call(name, args);
      }
      throw new Error('Expected a number, function, or parenthesized expression.');
    }

    call(name, args) {
      const functions = {
        abs: { min: 1, max: 1, fn: Math.abs },
        sqrt: { min: 1, max: 1, fn: Math.sqrt },
        cbrt: { min: 1, max: 1, fn: Math.cbrt },
        round: { min: 1, max: 1, fn: Math.round },
        floor: { min: 1, max: 1, fn: Math.floor },
        ceil: { min: 1, max: 1, fn: Math.ceil },
        sin: { min: 1, max: 1, fn: Math.sin },
        cos: { min: 1, max: 1, fn: Math.cos },
        tan: { min: 1, max: 1, fn: Math.tan },
        asin: { min: 1, max: 1, fn: Math.asin },
        acos: { min: 1, max: 1, fn: Math.acos },
        atan: { min: 1, max: 1, fn: Math.atan },
        log: { min: 1, max: 1, fn: Math.log },
        log10: { min: 1, max: 1, fn: Math.log10 },
        exp: { min: 1, max: 1, fn: Math.exp },
        min: { min: 1, max: Infinity, fn: Math.min },
        max: { min: 1, max: Infinity, fn: Math.max },
        pow: { min: 2, max: 2, fn: Math.pow }
      };
      const spec = functions[name];
      if (!spec) throw new Error(`Unsupported function: ${name}`);
      if (args.length < spec.min || args.length > spec.max) throw new Error(`Invalid argument count for ${name}.`);
      return spec.fn(...args);
    }
  }

  function textStats(text) {
    const value = String(text || '');
    const words = value.trim() ? value.trim().split(/\s+/) : [];
    const sentences = value.split(/[.!?]+(?:\s|$)/).map(v => v.trim()).filter(Boolean);
    const lines = value ? value.split(/\r?\n/).length : 0;
    const paragraphs = value.split(/\n\s*\n/).map(v => v.trim()).filter(Boolean).length;
    const readingMinutes = words.length / 225;
    const frequencies = new Map();
    for (const word of U.words(value)) frequencies.set(word, (frequencies.get(word) || 0) + 1);
    const common = Array.from(frequencies.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return { characters: value.length, charactersNoSpaces: value.replace(/\s/g, '').length, words: words.length, sentences: sentences.length, lines, paragraphs, readingMinutes, common };
  }

  const helpText = `# Superbot commands

- \`/help\` — show this command reference
- \`/health\` — test the Apps Script backend
- \`/calc EXPRESSION\` — safe local arithmetic
- \`/json JSON\` — validate and pretty-print JSON
- \`/text TEXT\` — local word, sentence, line, and reading-time statistics
- \`/hash TEXT\` — SHA-256 hash
- \`/search QUERY\` — search the built-in intelligence corpus
- \`/memory QUERY\` — search local and backend memory
- \`/remember TEXT\` — save a local memory and attempt backend persistence
- \`/time\` — current browser date and time
- \`/document PROMPT\`, \`/workflow PROMPT\`, \`/component PROMPT\`, \`/schema PROMPT\`, \`/checklist PROMPT\` — specialized backend generation
- \`/image PROMPT\` — backend image generation
- \`/3d PROMPT\` — backend 3D blueprint or provider job
- \`/export\` — export conversations, local memory, skills, and non-secret settings
- \`/clear\` — clear the active conversation
- \`/studio ACTION\` — control the open LiteraryFriend Studio; use \`/studio help\` for editing commands

Normal messages use the backend LLM. When it is unavailable, Superbot can optionally return local retrieval results.`;

  SB.tools = {
    helpText,

    calculate(expression) {
      const result = new ExpressionParser(expression).parse();
      return Number.isInteger(result) ? String(result) : String(Number(result.toPrecision(14)));
    },

    formatJson(text) {
      const value = JSON.parse(String(text || ''));
      return JSON.stringify(value, null, 2);
    },

    textStats,

    async hash(text) { return U.hashText(text); },

    currentTime() {
      const now = new Date();
      return `${now.toString()}\nISO: ${now.toISOString()}\nTime zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'}`;
    },

    search(query) {
      const matches = SB.retrieval.search(query, { limit: 8 });
      if (!matches.length) return 'No close local skill-corpus matches were found.';
      return matches.map((match, index) => `## ${index + 1}. ${match.title}\nMode: ${match.mode} · Score: ${match.score}\n\n${U.truncate(match.prompt, 1600)}`).join('\n\n---\n\n');
    },

    async parseCommand(message) {
      const trimmed = String(message || '').trim();
      if (!trimmed.startsWith('/')) return null;
      const match = trimmed.match(/^\/(\S+)(?:\s+([\s\S]*))?$/);
      if (!match) return null;
      return { command: match[1].toLowerCase(), argument: match[2] || '' };
    }
  };
})(window);
