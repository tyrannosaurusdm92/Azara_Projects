/* Savanski Keyboard v1 — shared, offline-only layout and accent data.
   This module is independent of any browser or native operating-system APIs. */

export const ACCENTS = Object.freeze({
  a: ['á','à','â','ä','ã','å','ā','ă','ą','ǎ','æ'],
  e: ['é','è','ê','ë','ē','ĕ','ė','ę','ě'],
  i: ['í','ì','î','ï','ī','ĭ','į','ǐ','ı'],
  o: ['ó','ò','ô','ö','õ','ø','ō','ŏ','ő','ǒ','œ'],
  u: ['ú','ù','û','ü','ũ','ū','ŭ','ů','ű','ų','ǔ'],
  y: ['ý','ỳ','ŷ','ÿ','ȳ'],
  c: ['ç','ć','ĉ','ċ','č'],
  n: ['ñ','ń','ņ','ň','ŋ'],
  s: ['ś','ŝ','ş','š','ß'],
  z: ['ź','ż','ž'],
  d: ['ď','đ','ð'],
  t: ['ţ','ť','ŧ','þ'],
  l: ['ĺ','ļ','ľ','ł'],
  r: ['ŕ','ŗ','ř'],
  g: ['ĝ','ğ','ġ','ģ'],
  h: ['ĥ','ħ'],
  j: ['ĵ'],
  k: ['ķ'],
  w: ['ŵ'],
  b: ['ḃ'],
  p: ['ṕ'],
  m: ['ḿ']
});

export const ACTIONS = Object.freeze({
  Escape: 'Esc', Backspace: '⌫', Delete: 'Del', Tab: 'Tab',
  Enter: '↵', Shift: '⇧', CapsLock: 'Caps', Space: 'Space',
  Control: 'Ctrl', Alt: 'Alt', Meta: 'Win / ⌘', AltGraph: 'AltGr',
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn',
  Insert: 'Ins', PrintScreen: 'PrtSc', Symbols: '?123', Letters: 'ABC',
  Globe: '🌐', Emoji: '☺', Hide: '⌄', Numpad: '#',
  Copy:'Copy',Paste:'Paste',Cut:'Cut',SelectAll:'Select all',
  Undo:'Undo',Redo:'Redo',Find:'Find',Save:'Save'
});

const keys = line => line.split(' ').filter(Boolean);

export const LAYOUTS = Object.freeze({
  compact: [
    keys('q w e r t y u i o p'),
    keys('a s d f g h j k l'),
    keys('Shift z x c v b n m Backspace'),
    keys('Symbols Globe , Space . Enter')
  ],
  standard: [
    keys('1 2 3 4 5 6 7 8 9 0 Backspace'),
    keys('Tab q w e r t y u i o p [ ]'),
    keys('CapsLock a s d f g h j k l ; \''),
    keys('Shift z x c v b n m , . / Enter'),
    keys('Control Meta Alt Globe Space AltGraph ArrowLeft ArrowDown ArrowUp ArrowRight')
  ],
  desktop: [
    keys('Escape F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 PrintScreen'),
    keys('` 1 2 3 4 5 6 7 8 9 0 - = Backspace'),
    keys('Tab q w e r t y u i o p [ ] \\'),
    keys('CapsLock a s d f g h j k l ; \' Enter'),
    keys('Shift z x c v b n m , . / Shift'),
    keys('Control Meta Alt Space AltGraph Control ArrowLeft ArrowDown ArrowUp ArrowRight'),
    keys('Insert Home PageUp Delete End PageDown')
  ],
  symbols: [
    keys('1 2 3 4 5 6 7 8 9 0'),
    keys('@ # $ % & - + ( ) /'),
    keys('= * \" \' : ; ! ? Backspace'),
    keys('Letters Globe , Space . Enter')
  ]
});

export const NUMPAD = Object.freeze([
  keys('7 8 9 /'), keys('4 5 6 *'), keys('1 2 3 -'), keys('0 . Enter +')
]);

export const WIDE_KEYS = Object.freeze({
  Space: 5.0, Backspace: 1.7, Enter: 1.65, Shift: 1.55,
  CapsLock: 1.65, Tab: 1.4, Control: 1.45, Alt: 1.3,
  Meta: 1.35, AltGraph: 1.3, Symbols: 1.65, Letters: 1.65,
  Globe: 1.1, PrintScreen: 1.7
});

export const THEME_ROLES = Object.freeze({
  shell: { label: 'Keyboard shell', variable: '--sk-shell' },
  frame: { label: 'Frame / outline', variable: '--sk-frame' },
  toolbar: { label: 'Toolbar background', variable: '--sk-toolbar' },
  toolbarText: { label: 'Toolbar text', variable: '--sk-toolbar-text' },
  key: { label: 'Letter / number keys', variable: '--sk-key' },
  keyText: { label: 'Key characters', variable: '--sk-key-text' },
  keyBorder: { label: 'Key borders', variable: '--sk-key-border' },
  action: { label: 'Action / modifier keys', variable: '--sk-action' },
  actionText: { label: 'Action key text', variable: '--sk-action-text' },
  pressed: { label: 'Pressed / selected keys', variable: '--sk-pressed' },
  accent: { label: 'Accent popup', variable: '--sk-accent' },
  accentText: { label: 'Accent letters', variable: '--sk-accent-text' },
  accentBorder: { label: 'Accent popup border', variable: '--sk-accent-border' },
  split: { label: 'Split divider', variable: '--sk-split' },
  focus: { label: 'Focus outline', variable: '--sk-focus' }
});

export const DEFAULT_THEME = Object.freeze({
  shell: '#0C1017', frame: '#B07A3A', toolbar: '#122B32',
  toolbarText: '#F3E9DB', key: '#172932', keyText: '#F3E9DB',
  keyBorder: '#3D9FA0', action: '#19343D', actionText: '#E8C76E',
  pressed: '#B07A3A', accent: '#111720', accentText: '#F3E9DB',
  accentBorder: '#D7AA63', split: '#8DE0DC', focus: '#00FFFF'
});

export function accentOptions(symbol, uppercase = false) {
  const list = ACCENTS[String(symbol).toLocaleLowerCase('en')] || [];
  return uppercase ? list.map(item => item.toLocaleUpperCase('en')) : [...list];
}

export function isAction(value) {
  return Object.hasOwn(ACTIONS, value) || /^F(?:[1-9]|1[0-2])$/.test(value);
}

export function layoutFor(width, override = 'auto', symbols = false) {
  if (symbols) return 'symbols';
  if (['compact','standard','desktop'].includes(override)) return override;
  if (width < 610) return 'compact';
  if (width < 1050) return 'standard';
  return 'desktop';
}

export function metricsFor(width, height, layout = 'compact', split = false, rowCount = null) {
  const rows = rowCount || LAYOUTS[layout].length;
  const approxColumns = layout === 'desktop' ? 15 : layout === 'standard' ? 14 : 10;
  const availableHeight = Math.max(120, height - 112);
  const byHeight = (availableHeight - (rows - 1) * 4) / rows;
  const byWidth = Math.max(25, (width - 26 - (split ? 18 : 0)) / approxColumns);
  const keyHeight = Math.round(Math.max(32, Math.min(68, byHeight, byWidth * 1.34)));
  return {
    keyHeight,
    gap: Math.max(2, Math.min(7, Math.round(keyHeight * .075))),
    font: Math.max(12, Math.min(23, Math.round(keyHeight * .34))),
    radius: Math.max(5, Math.min(13, Math.round(keyHeight * .17)))
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function deleteLastGrapheme(text) {
  const str = String(text ?? '');
  if (!str) return '';
  if (typeof Intl.Segmenter === 'function') {
    const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)];
    return str.slice(0, segments.at(-1).index);
  }
  return [...str].slice(0, -1).join('');
}
