(function (global) {
  'use strict';

  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util = {};

  U.$ = (selector, root = document) => root.querySelector(selector);
  U.$$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  U.id = id => document.getElementById(id);
  U.nowIso = () => new Date().toISOString();
  U.epochSeconds = () => Math.floor(Date.now() / 1000);
  U.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  U.clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  U.uid = (prefix = 'sb') => `${prefix}_${Date.now().toString(36)}_${cryptoRandom(12)}`;
  U.deepClone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  U.debounce = (fn, delay = 200) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  function cryptoRandom(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._~-';
    const bytes = new Uint8Array(length);
    if (global.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, byte => chars[byte % chars.length]).join('');
  }

  U.escapeHtml = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  U.escapeAttr = U.escapeHtml;

  U.formatBytes = bytes => {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = n / 1024;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[i]}`;
  };

  U.formatDate = value => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      }).format(new Date(value));
    } catch {
      return String(value || '');
    }
  };

  U.safeJsonParse = (text, fallback = null) => {
    try { return JSON.parse(text); } catch { return fallback; }
  };

  U.truncate = (text, max = 10000) => {
    const s = String(text == null ? '' : text);
    return s.length <= max ? s : `${s.slice(0, max)}\n…[truncated ${s.length - max} characters]`;
  };

  U.normalizeWhitespace = text => String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  U.words = text => String(text || '').toLowerCase().match(/[a-z0-9][a-z0-9_+.#'/-]{1,}/g) || [];

  const STOP = new Set('a an and are as at be been being but by can could did do does doing for from had has have having he her hers him his how i if in into is it its itself may might more most must my no nor not of on once only or other our ours out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who why will with would you your yours'.split(' '));
  U.keywords = (text, limit = 24) => {
    const counts = new Map();
    for (const word of U.words(text)) {
      if (word.length < 3 || STOP.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([word]) => word);
  };

  U.hashText = async text => {
    const data = new TextEncoder().encode(String(text));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, '0')).join('');
  };

  U.hashFile = async file => {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, '0')).join('');
  };

  U.fileExtension = name => {
    const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  };

  U.fileToDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

  U.readTextFile = async file => {
    const ext = U.fileExtension(file.name);
    if (!SB.CONFIG.supportedTextExtensions.includes(ext) && !String(file.type || '').startsWith('text/')) {
      throw new Error(`${file.name} is not a supported text attachment.`);
    }
    return file.text();
  };

  U.download = (filename, data, type = 'application/octet-stream') => {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  U.copyText = async text => {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(String(text));
    const area = document.createElement('textarea');
    area.value = String(text);
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  };

  U.markdown = input => {
    const source = String(input == null ? '' : input).replace(/\r\n?/g, '\n');
    const codeBlocks = [];
    let text = source.replace(/```([\w.+#-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const index = codeBlocks.length;
      codeBlocks.push(`<div class="code-wrap"><div class="code-head"><span>${U.escapeHtml(lang || 'text')}</span><button type="button" data-copy-code="${index}">Copy</button></div><pre><code>${U.escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`);
      return `\n@@CODEBLOCK_${index}@@\n`;
    });
    text = U.escapeHtml(text);
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    const lines = text.split('\n');
    const out = [];
    let listType = '';
    const closeList = () => {
      if (listType) out.push(`</${listType}>`);
      listType = '';
    };
    for (const line of lines) {
      const unordered = line.match(/^\s*[-*] (.+)$/);
      const ordered = line.match(/^\s*\d+[.)] (.+)$/);
      if (unordered) {
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push(`<li>${unordered[1]}</li>`);
      } else if (ordered) {
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push(`<li>${ordered[1]}</li>`);
      } else {
        closeList();
        if (!line.trim()) out.push('');
        else if (/^<(h[1-3]|blockquote|hr)/.test(line) || /^@@CODEBLOCK_/.test(line)) out.push(line);
        else out.push(`<p>${line}</p>`);
      }
    }
    closeList();
    let html = out.join('\n');
    codeBlocks.forEach((block, index) => { html = html.replace(`<p>@@CODEBLOCK_${index}@@</p>`, block).replace(`@@CODEBLOCK_${index}@@`, block); });
    return html;
  };

  U.toast = (message, type = 'info', timeout = 3500) => {
    let host = U.id('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost';
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = String(message);
    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 250);
    }, timeout);
  };

  U.errorMessage = error => {
    if (!error) return 'Unknown error.';
    if (error.name === 'AbortError') return 'The request was cancelled or timed out.';
    return error.message || String(error);
  };
})(window);
