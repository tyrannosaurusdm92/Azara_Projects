/* Task layouts and in-app language switching. No OS-wide keystroke injection. */

const row = text => text.split(' ').filter(Boolean);

export const TASK_MODES = Object.freeze({
  typing: 'Full keyboard', big: 'Large split keys', code: 'Coding',
  numbers: 'Numbers', navigation: 'Navigation', shortcuts: 'Shortcuts'
});

export const LANGUAGES = Object.freeze({
  en: 'English · QWERTY', fr: 'Français · AZERTY', de: 'Deutsch · QWERTZ',
  es: 'Español · QWERTY', pt: 'Português · QWERTY', ru: 'Русский · ЙЦУКЕН'
});

const mapFrench = {q:'a',a:'q',w:'z',z:'w',m:',',';':'m',',':';'};
const mapGerman = {y:'z',z:'y',';':'ö',"'":'ä','[':'ü','-':'ß'};
const mapSpanish = {';':'ñ'};
const mapPortuguese = {';':'ç'};
const mapRussian = {
  q:'й',w:'ц',e:'у',r:'к',t:'е',y:'н',u:'г',i:'ш',o:'щ',p:'з',
  a:'ф',s:'ы',d:'в',f:'а',g:'п',h:'р',j:'о',k:'л',l:'д',
  z:'я',x:'ч',c:'с',v:'м',b:'и',n:'т',m:'ь',
  '[':'х',']':'ъ',';':'ж',"'":'э',',':'б','.':'ю'
};
const substitutions = {fr:mapFrench,de:mapGerman,es:mapSpanish,pt:mapPortuguese,ru:mapRussian};

export function translateRows(rows, language = 'en') {
  const mapping = substitutions[language] || {};
  return rows.map(r => r.map(key => mapping[key] ?? key));
}

const compactBig = [
  row('q w e r t'), row('y u i o p'), row('a s d f g'),
  row('h j k l'), row('Shift z x c v'), row('b n m Backspace'),
  row('Symbols Globe , Space . Enter')
];

const modeLayouts = Object.freeze({
  code: [
    row('Escape Tab { } [ ] ( ) < >'),
    row('= + - * / % & | ! ?'),
    row('; : " \' ` _ # $ @ \\'),
    row('ArrowLeft ArrowDown ArrowUp ArrowRight Home End'),
    row('Control Shift Space Backspace Delete Enter')
  ],
  numbers: [
    row('7 8 9 / % Backspace'), row('4 5 6 * ( )'),
    row('1 2 3 - + ='), row('0 . , : Enter Tab'),
    row('Home End ArrowLeft ArrowRight Delete')
  ],
  navigation: [
    row('Escape F1 F2 F3 F4 F5 F6'),
    row('F7 F8 F9 F10 F11 F12 PrintScreen'),
    row('Home ArrowUp End PageUp'),
    row('ArrowLeft ArrowDown ArrowRight PageDown'),
    row('Tab Backspace Delete Insert Enter Space')
  ],
  shortcuts: [
    row('Copy Paste Cut SelectAll'),
    row('Undo Redo Find Save'),
    row('Home End ArrowLeft ArrowRight'),
    row('Control Alt Shift Meta Tab Escape'),
    row('PrintScreen Space Backspace Enter')
  ]
});

export function rowsForTask(layout, task, language, layouts) {
  if (task === 'big') {
    const rows = translateRows(compactBig, language);
    if (language === 'fr') rows[3].push('m');
    if (language === 'de') rows[3].push('ä','ö','ü','ß');
    if (language === 'es') rows[3].push('ñ');
    if (language === 'pt') rows[3].push('ç');
    return rows;
  }
  if (modeLayouts[task]) return modeLayouts[task].map(r => [...r]);
  const rows = translateRows(layouts[layout] || layouts.compact, language);
  if (layout === 'compact') {
    if (language === 'fr') rows[1].push('m');
    if (language === 'de') rows[1].push('ä','ö','ü','ß');
    if (language === 'es') rows[1].push('ñ');
    if (language === 'pt') rows[1].push('ç');
  }
  return rows;
}

export function isLetter(key) {
  return /^\p{Ll}$/u.test(key);
}

export function typedCharacter(key, uppercase = false, language = 'en') {
  return isLetter(key) && uppercase ? key.toLocaleUpperCase(language) : key;
}

export function suggestionCandidates(text, caret, words, bigrams, max = 3) {
  const before = String(text).slice(0,caret);
  const match = before.match(/([\p{L}']+)$/u);
  const prefix = match?.[1].toLocaleLowerCase('en') || '';
  if (prefix.length < 2 || prefix.length > 24) return [];
  const previous = before.slice(0, -prefix.length).trim().match(/([\p{L}']+)$/u)?.[1]?.toLowerCase() || '';
  const preferred = (bigrams[previous] || []).filter(word => word.startsWith(prefix));
  const candidates = [...new Set([...preferred,...words.filter(word => word.startsWith(prefix))])];
  return candidates.filter(word => word !== prefix).slice(0,max);
}
