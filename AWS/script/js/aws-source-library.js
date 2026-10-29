/* Curated Google Drive references. Never writes to the user's saved pages. */
(()=>{'use strict';
const $=id=>document.getElementById(id),root='./json/source-library/';
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e};
let index=null,selected=null,activeDoc=null;
async function load(file){const r=await fetch(root+file,{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function init(){
 try{index=await load('index.json');renderIndex()}catch(e){$('aws-source-index').textContent='Source library could not load: '+e.message}
 $('aws-source-search').addEventListener('input',()=>{renderIndex();renderDocument()});
 $('aws-source-category').addEventListener('change',renderIndex);
 window.addEventListener('aws:view',()=>{if(!$('aws-source-library-panel').hidden){renderIndex();renderDocument()}});
}
function renderIndex(){
 const host=$('aws-source-index');if(!host||!index)return;host.replaceChildren();
 const category=$('aws-source-category').value,q=$('aws-source-search').value.trim().toLowerCase();
 for(const item of index.items.filter(x=>(!category||x.category===category)&&(!q||(x.title+' '+x.category).toLowerCase().includes(q)||x.id===selected))){
  const b=node('button','aws-source-item'+(selected===item.id?' active':''),item.title+' · '+item.sections+' sections');
  b.type='button';b.onclick=()=>open(item);host.append(b)
 }
}
async function open(item){
 selected=item.id;renderIndex();
 const viewer=$('aws-source-viewer');viewer.replaceChildren(node('p','','Loading '+item.title+'...'));
 try{activeDoc=await load(item.id+'.json');renderDocument()}
 catch(e){viewer.textContent='Source document unavailable: '+e.message}
}
function renderDocument(){
 if(!activeDoc||$('aws-source-library-panel').hidden)return;
 const host=$('aws-source-viewer'),q=$('aws-source-search').value.trim().toLowerCase();
 host.replaceChildren();const head=node('header','aws-source-head');
 head.append(node('h3','',activeDoc.title),node('p','','Source-only reference. Newer AWS canon and your writing remain authoritative.'));
 const a=node('a','aws-source-original','Open original Google Drive source');a.href=activeDoc.source_url;a.target='_blank';a.rel='noopener noreferrer';head.append(a);host.append(head);
 const matches=activeDoc.sections.filter(s=>!q||(s.title+' '+s.text).toLowerCase().includes(q));
 for(const sec of matches){
  const detail=node('details','aws-source-section');const sum=node('summary','',sec.title);
  const p=node('div','aws-source-text',sec.text);
  detail.append(sum,p);host.append(detail)
 }
 if(!matches.length)host.append(node('p','','No sections match.'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
