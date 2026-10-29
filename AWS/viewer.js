/* Read-only AWS archive. No input, keyboard, editing, recording or voice runtime. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const books=[
['wh-book-1','Book One: The Door In The Tree'],
['wh-book-2','Book Two: The Drowned Queen'],
['wh-book-3','Book Three: The Unwilling Spy'],
['wh-book-4','Book Four: The Hollow Throne'],
['wh-book-5','Book Five: Never-Ending Loss'],
['wh-book-6','Book Six: Threats Of Space'],
['wh-book-7','Book Seven: Collision Of Worlds'],
['wh-book-8','Book Eight: Unraveled']
];
let archive=null,currentBook=null,chart=null;
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function showLanguage(){
currentBook=null;$('language-view').hidden=false;$('book-view').hidden=true;
$('go-language').classList.add('selected');
document.querySelectorAll('#books button').forEach(b=>b.classList.remove('selected'));
}
function textOnly(html){
if(!html)return '';
const doc=new DOMParser().parseFromString(String(html),'text/html');
doc.querySelectorAll('script,style,iframe,object,template').forEach(el=>el.remove());
doc.querySelectorAll('p,div,section,article,li,br,h1,h2,h3').forEach(el=>el.appendChild(doc.createTextNode('\n')));
return (doc.body.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
}
function showPage(page){
const chunks=[page?.html,page?.leftHtml,page?.rightHtml].map(textOnly).filter(Boolean);
$('page-text').textContent=chunks.join('\n\n')||'No saved writing found on this page.';
document.querySelectorAll('#pages button').forEach(el=>el.classList.toggle('selected',el.dataset.page===page?.id));
}
function showBook(id,fallback){
currentBook=id;$('language-view').hidden=true;$('book-view').hidden=false;
$('go-language').classList.remove('selected');
document.querySelectorAll('#books button').forEach(b=>b.classList.toggle('selected',b.dataset.book===id));
const title=archive?.workspaces?.find(w=>w.id===id)?.name||fallback;
$('book-title').textContent=title;
const pages=(archive?.channels||[]).filter(c=>c.workspaceId===id);
$('pages').replaceChildren();
for(const page of pages){
const b=node('button','era',page.name||'Saved page');b.type='button';b.dataset.page=page.id;
b.addEventListener('click',()=>showPage(page));$('pages').append(b);
}
if(pages.length)showPage(pages[0]);
else $('page-text').textContent='No saved manuscript is available on this device. Existing browser files have not been modified.';
}
function renderBooks(){
$('books').replaceChildren();
for(const [id,fallback] of books){
const title=archive?.workspaces?.find(w=>w.id===id)?.name||fallback;
const b=node('button','nav',title);b.type='button';b.dataset.book=id;
b.addEventListener('click',()=>showBook(id,title));$('books').append(b);
}
}
async function existingLibrary(){
let stored=null;
if('indexedDB' in window)stored=await new Promise(resolve=>{
let r,finished=false;const done=v=>{if(!finished){finished=true;resolve(v)}};
try{r=indexedDB.open('luxury-editor-v1',1)}catch{return done(null)}
r.onupgradeneeded=()=>{try{r.transaction.abort()}catch{}};
r.onerror=()=>done(null);
r.onsuccess=()=>{
const db=r.result;
if(!db.objectStoreNames.contains('settings')){db.close();return done(null)}
let read;try{read=db.transaction('settings','readonly').objectStore('settings').get('state')}
catch{db.close();return done(null)}
read.onsuccess=()=>{const data=read.result;db.close();done(data||null)};
read.onerror=()=>{db.close();done(null)};
};
});
if(stored)return stored;
try{return JSON.parse(localStorage.getItem('luxury-editor-v1:state')||'null')}catch{return null}
}
function showEra(key){
const stage=chart?.stages?.find(s=>s.key===key);if(!stage)return;
document.querySelectorAll('#eras button').forEach(b=>b.classList.toggle('selected',b.dataset.era===key));
$('era-title').textContent=stage.label+' · '+stage.date;
const gallery=$('gallery');gallery.replaceChildren();let count=0;
for(const root of chart.roots||[]){
const part=root.stages?.[key];if(!part)continue;count++;
const fig=node('figure','glyph');
if(part.src){
const img=node('img');img.src=new URL(part.src,location.href).href;img.loading='lazy';
img.alt=part.label||root.sound||'Historic Aza’raan glyph';fig.append(img);
}else fig.append(node('div','',part.text||root.origin||'—'));
const label=node('figcaption');label.append(node('strong','','Root '+String(root.slot).padStart(2,'0')));
label.append(node('span','',part.label||root.sound||'Historical glyph'));fig.append(label);gallery.append(fig);
}
$('gallery-status').textContent=count+' historical forms displayed. This archive is view only.';
}
async function loadChart(){
try{
const response=await fetch('./json/evolution-chart.json',{cache:'no-cache'});
if(!response.ok)throw Error('Evolution data not found');
chart=await response.json();
$('eras').replaceChildren();
for(const s of chart.stages||[]){
const b=node('button','era',s.label);b.type='button';b.dataset.era=s.key;
b.addEventListener('click',()=>showEra(s.key));$('eras').append(b);
}
showEra('modern');
}catch(e){$('gallery-status').textContent='Historical chart could not load: '+e.message}
}
$('go-language').addEventListener('click',showLanguage);
renderBooks();void loadChart();
void existingLibrary().then(data=>{archive=data;renderBooks();if(currentBook){const book=books.find(b=>b[0]===currentBook);if(book)showBook(...book)}});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).catch(()=>{}));
}
})();
