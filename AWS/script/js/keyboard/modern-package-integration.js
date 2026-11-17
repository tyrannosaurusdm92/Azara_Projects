/* Canonical Modern Aza'raan adapter, 2026-11-16.
 * Historical era image and stage files are intentionally untouched. */
(()=>{
'use strict';
const C=window.AZA_CONFIG;
if(!C||!C.letterMap)return;
const letters=C.letterMap;
const data=window.AZA_DATA;
if(data){
  data.modernKhmerByLatin=Object.assign({},letters);
  data.modernOrigins=Object.assign({},C.modernOrigins);
  data.modernDigits=Object.assign({},C.modernDigitMap);
  data.modernPunctuation=Object.assign({},C.modernPunctuationMap);
  data.modernDiacritics=(C.accents||[]).map(x=>Object.assign({},x));
  data.modernSpecialControls=(C.specials||[]).map(x=>Object.assign({},x));
  data.modernSubscriptCoeng=C.coeng||'\u17D2';
  // Only the current Modern-facing key map is rewritten.
  if(data.keys&&typeof data.keys==='object')Object.assign(data.keys,letters);
}
const rootToLetter={3:'T',6:'D',8:'G',9:'J',11:'M',12:'P',14:'R',18:'B',19:'Z',20:'N',21:'S',22:'H',23:'L',24:'K',33:'O',34:'A',35:'I',36:'E',44:'W',50:'Y'};
const rootControl={1:'\u17CF',52:'\u17C7'};
const specials={previous:'\u17B7',next:'\u17BC'};
const digits=C.modernDigitMap||{};
const punctuation=C.modernPunctuationMap||{};
const fontUrl=new URL('assets/keyboard/ttf/Azaaraan-Modern-20261116.ttf',document.baseURI).href;
let loaded=false;
function allowFont(){
  if(typeof FontFace!=='function'||!document.fonts)return Promise.resolve(false);
  const face=new FontFace('AzaaraanModernCanonical','url("'+fontUrl+'")',{style:'normal',weight:'normal'});
  return face.load().then(()=>{document.fonts.add(face);loaded=true;document.documentElement.classList.add('aza-modern-package-loaded');return true},()=>false);
}
function rootKey(button){
  const slot=+button.dataset.slot;
  if(rootToLetter[slot])return letters[rootToLetter[slot]];
  if(slot===1){
    const title=(button.getAttribute('title')||'').toLowerCase();
    if(title.includes('previous')||title.includes('before'))return specials.previous;
    if(title.includes('next')||title.includes('after'))return specials.next;
  }
  return rootControl[slot]||null;
}
function restyleEvolution(){
  if(!loaded)return;
  document.querySelectorAll('.evolution-pane .glyph.modern, .evolution-pane .table-glyph[data-stage="modern"]').forEach(button=>{
    const token=rootKey(button);if(!token||button.dataset.canonicalRendered==='yes')return;
    const old=button.querySelector('img.mark,img.table-mark');
    if(!old)return;
    const span=document.createElement('span');
    span.className='azaraan-modern-font-mark';
    span.textContent=token;
    span.setAttribute('aria-hidden','true');
    old.replaceWith(span);
    button.dataset.canonicalRendered='yes';
    button.dataset.modernUnicode='U+'+token.codePointAt(0).toString(16).toUpperCase();
  });
  document.querySelectorAll('.evolution-pane .modern-lineage-frame').forEach(frame=>{
    const img=frame.querySelector('img.modern-art');if(!img)return;
    const src=img.getAttribute('src')||'';
    const m=src.match(/modern_(\d+)\.svg/);
    if(!m)return;
    const letter=rootToLetter[Number(m[1])],control=rootControl[Number(m[1])];
    const token=(letter&&letters[letter])||control;if(!token)return;
    const el=document.createElement('span');el.className='azaraan-modern-font-mark';el.textContent=token;img.replaceWith(el);
  });
}
const mainSelector='[id*="keyboard" i], [class*="keyboard" i]';
function restyleKeycaps(){
  if(!loaded)return;
  const selectors=['button[data-key]','button[data-letter]','button[data-char]','[role="button"][data-key]'];
  const roots=document.querySelectorAll(mainSelector);
  roots.forEach(root=>{
    if(root.closest('.evolution-pane')||root.closest('#panel-evolution'))return;
    for(const key of root.querySelectorAll(selectors.join(','))){
      if(key.dataset.azaModernKeycap==='yes')continue;
      const val=key.dataset.key||key.dataset.letter||key.dataset.char||'';
      const map=(val in letters)?letters:(val in digits)?digits:(val in punctuation)?punctuation:null;
      if(!map)continue;
      // Preserve click handlers and all button attributes, replace only visual label.
      const existing=key.querySelector('.azaraan-modern-font-mark');
      if(existing){existing.textContent=map[val];key.dataset.azaModernKeycap='yes';continue;}
      const visual=key.querySelector('.keycap-glyph,.key-glyph,.glyph-preview');
      if(visual){visual.textContent=map[val];visual.classList.add('azaraan-modern-font-mark');key.dataset.azaModernKeycap='yes';}
    }
  });
}
function refresh(){restyleEvolution();restyleKeycaps();}
function start(){
  allowFont().then(ok=>{
    if(!ok)return; // Never substitute plain Khmer characters for missing artwork.
    refresh();
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;refresh()});
    });
    observer.observe(document.querySelector('#panel-evolution')||document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target.closest('#tab-evolution,[data-era],.era-select'))requestAnimationFrame(refresh)},true);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
