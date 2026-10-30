/* Run: node AWS/docs/verify-navigation.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {normalize,isLanguage}=require('../script/js/aws-navigation-model.js');
let sequence=0;
const create=(workspaceId,name,type='document',parentId=null,role='page')=>({id:'new-'+(++sequence),workspaceId,name,type,parentId,role,html:'',leftHtml:'',rightHtml:'',notes:'',deletedAt:''});
const page=(id,name,parentId=null,role='page',extra={})=>({...create('one',name,'document',parentId,role),id,...extra});
const s={workspaces:[{id:'one'},{id:'two'}],channels:[
 page('lang','Language',null,'section',{html:'<p>Language canon</p>'}),
 page('old','01) Language',null,'section',{html:'<p>Older unique notes</p>',notes:'Do not lose me'}),
 page('empty','Language'),
 page('parallel','Language (01)',null,'section',{type:'studio',leftHtml:'Left draft',rightHtml:'Right draft'}),
 page('dict','Dictionary & Lexicon','lang','dictionary'),
 page('dict-old','Dictionary','old','dictionary',{notes:'Vocabulary notes'}),
 page('glyph','Glyph Studio','old','glyph'),
 page('glyph-copy','Glyph Studio','lang','glyph'),
 page('custom','Custom phonology','old','page',{html:'<p>Saved chapter</p>'}),
 page('deleted','Language',null,'section',{deletedAt:'2026-01-01'}),
 page('book','Book One',null,'section',{html:'<p>Book content</p>'}),
 page('chapter','Chapter 1','book','page',{html:'<p>Keep every word</p>'})
],tasks:[{id:'t',channelId:'empty'},{id:'t2',channelId:'old'}],important:[{channelId:'empty',text:'Keep'}],files:[{id:'f',folderId:'empty'}],selectedChannelId:'empty',selectedWorkspaceId:'one'};
const books=JSON.stringify(s.channels.filter(c=>['book','chapter'].includes(c.id)));
assert.equal(normalize(s,create),true);
for(const ws of s.workspaces){
 const cs=s.channels.filter(c=>c.workspaceId===ws.id&&!c.deletedAt),parent=cs.filter(isLanguage);
 assert.equal(parent.length,1);
 for(const role of ['rules','dictionary','tts','glyph','glyph-evolution','language-evolution']){
  const found=cs.filter(c=>c.role===role);assert.equal(found.length,1);assert.equal(found[0].parentId,parent[0].id);
 }
}
assert.equal(s.channels.find(c=>c.id==='old').html,'<p>Older unique notes</p>');
assert.equal(s.channels.find(c=>c.id==='old').notes,'Do not lose me');
assert.equal(s.channels.find(c=>c.id==='dict-old').notes,'Vocabulary notes');
assert.equal(s.channels.find(c=>c.id==='custom').parentId,'lang');
assert.equal(s.channels.find(c=>c.id==='parallel').type,'studio');
assert.equal(s.channels.find(c=>c.id==='parallel').leftHtml,'Left draft');
assert.equal(s.channels.find(c=>c.id==='parallel').rightHtml,'Right draft');
assert.equal(s.tasks[0].channelId,'lang');assert.equal(s.tasks[1].channelId,'old');
assert.equal(s.files[0].folderId,'lang');assert.equal(s.important[0].channelId,'lang');
assert.equal(s.selectedChannelId,'lang');assert.equal(s.channels.find(c=>c.id==='deleted').deletedAt,'2026-01-01');
assert.equal(JSON.stringify(s.channels.filter(c=>['book','chapter'].includes(c.id))),books);
assert(s.navigationArchive.some(c=>c.id==='old'&&c.name==='01) Language'));
const once=JSON.stringify(s);assert.equal(normalize(s,create),false);assert.equal(JSON.stringify(s),once);
const restored=JSON.parse(once);assert.equal(normalize(restored,create),false);
// A navigation snapshot must never write a previous editor into a newly selected document.
const app=fs.readFileSync(require.resolve('../script/js/app.js'),'utf8');
const capture=app.match(/  function captureEditor\(\)\{[^\n]+/)[0];
const doc={id:'new-page',html:'New page text',notes:'New notes'};
const context={currentChannel:()=>doc,renderedChannelId:'previous-page',document:{querySelectorAll:()=>[{dataset:{part:'single'},innerHTML:'Previous page text'}]},cleanHTML:x=>x,$:()=>({value:'Previous notes'}),nowDate:()=>''};
vm.createContext(context);vm.runInContext(capture+'\ncaptureEditor();',context);
assert.equal(doc.html,'New page text');assert.equal(doc.notes,'New notes');
context.renderedChannelId='new-page';vm.runInContext('captureEditor()',context);
assert.equal(doc.html,'Previous page text');assert.equal(doc.notes,'Previous notes');
assert(app.includes('state=validateState(input);renderedChannelId=null;ensureLanguageTools(state)'));
assert(app.includes('state=restored;renderedChannelId=null;ensureLanguageTools(state)'));
assert(app.includes('function renderAll(){renderRail();fontOptions();renderDoc();renderChannels();'));
const nav=fs.readFileSync(require.resolve('../script/js/aws-studio.js'),'utf8');
assert(nav.includes('const state=app()?.getNavigationSnapshot?.()'));
// Synchronous view events must not capture the outgoing DOM during a render.
const render=app.slice(app.indexOf('  function renderDoc(){'),app.indexOf('  function createRichEditor('));
let oldEditors=[{dataset:{part:'single'},innerHTML:'Outgoing content'}];
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{dataset:{},value:'Outgoing notes',replaceChildren(){oldEditors=[];}});return elements.get(id)};
const incoming={id:'incoming',name:'Library',role:'library',notes:'Incoming notes',html:'Incoming content'};
const rendering={currentChannel:()=>incoming,currentWorkspace:()=>({name:'Test'}),renderedChannelId:'outgoing',document:{querySelectorAll:()=>oldEditors,querySelector:()=>({})},cleanHTML:x=>x,$:element,nowDate:()=>'',CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},window:{},activeEditor:null,lastRange:null,lastBookmark:null};
vm.createContext(rendering);vm.runInContext(capture+'\n'+render,rendering);
rendering.window.dispatchEvent=()=>vm.runInContext('captureEditor()',rendering);
vm.runInContext('renderDoc()',rendering);
assert.equal(incoming.html,'Incoming content');assert.equal(incoming.notes,'Incoming notes');
assert.equal(rendering.renderedChannelId,'incoming');
// Closed descendants, orphaned pages and imported cycles each render at most once.
const node=(tag,cls='',txt='')=>({tag,cls,txt,children:[],dataset:{},style:{setProperty(){}},append(...children){this.children.push(...children)},replaceChildren(){this.children=[]},setAttribute(){}});
const host=node('div');host.scrollTop=0;
host.querySelector=selector=>host.children.find(n=>n.cls.split(' ').includes(selector.slice(1)))||null;
const search={value:''};
const navState={workspaces:[{id:'one',name:'Workspace'}],selectedWorkspaceId:'one',selectedChannelId:'root',channels:[
 {id:'root',name:'Root'},{id:'child',name:'Hidden child',parentId:'root'},
 {id:'orphan',name:'Orphan',parentId:'missing'},{id:'orphan-child',name:'Orphan child',parentId:'orphan'},
 {id:'cycle-a',name:'Cycle A',parentId:'cycle-b'},{id:'cycle-b',name:'Cycle B',parentId:'cycle-a'}
].map(c=>({...c,workspaceId:'one',role:'page'}))};
const navContext={app:()=>({getNavigationSnapshot:()=>navState}),$:id=>id==='aws-master-links'?host:search,line:node,awsFolds:{root:true},document:{querySelectorAll:()=>[]}};
vm.createContext(navContext);vm.runInContext(nav.slice(nav.indexOf('function nav(){'),nav.indexOf('\nlet expanded='))+'\nnav();',navContext);
const labels=()=>{const found=[];const walk=n=>{if(n.cls.split(' ').includes('aws-nav-item'))found.push(n.txt);n.children.forEach(walk)};walk(host);return found};
for(const name of ['Root','Orphan','Orphan child','Cycle A','Cycle B'])assert.equal(labels().filter(x=>x===name).length,1,name);
assert(!labels().includes('Hidden child'));
search.value='Hidden child';vm.runInContext('nav()',navContext);assert(labels().includes('Root'));assert(labels().includes('Hidden child'));
// Presentation/creation regression checks. Existing content and source assets must remain intact.
assert(app.includes("ch.name='Language notes';ch.parentId=canonicalLanguage.id;ch.role='page'"));
assert(app.includes("There is already one Language section"));
assert(app.includes("c.deletedAt='';ensureLanguageTools(state)"));
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
assert.equal((html.match(/name="theme-color"/g)||[]).length,1,'one theme color');
const theme=fs.readFileSync(require.resolve('../style/aws-unified.css'),'utf8');
for(const selector of ['#aws-glyph-panel','#aws-evolution-panel','#keyboard','.aws-feature-panel'])assert(theme.includes(selector),selector);
assert(theme.includes('Cohesion pass: one teal/brass vocabulary'));
// Focus/spacing control regression checks: do not replace the existing editor, glyphs or resize handlers.
assert(html.includes('id="aws-focus-toggle"'));
assert(html.includes('id="aws-density-toggle"'));
const studio=fs.readFileSync(require.resolve('../script/js/aws-studio.js'),'utf8');
assert(studio.includes('function initPresentation()'));
assert(studio.includes("initNav();initPresentation();initLibrary()"));
assert(studio.includes('aws-focus-mode-v1'));
assert(studio.includes('aws-roomy-layout-v1'));
assert(theme.includes('.aws-focus-mode #inspector'));
assert(theme.includes('#aws-glyph-panel .app-shell {min-height:0;height:auto;max-height:none}'));
assert(theme.includes('.aws-roomy-layout'));
assert(theme.includes('overflow:visible;min-height:0'));
assert(html.includes('id="keyboardBubble"'));
assert(html.includes('id="aws-glyph-panel"'));
assert(html.includes('id="aws-evolution-panel"'));
const sw=fs.readFileSync(require.resolve('../service-worker.js'),'utf8');
assert(sw.includes('./style/aws-unified.css'));
assert(sw.includes('./script/js/aws-studio.js'));
// Install and brand regression: correct emblem everywhere; do not reintroduce legacy launchers.
assert(html.includes('id="aws-install-dialog"'));
assert(html.includes('id="aws-install-message"'));
assert(html.includes('id="aws-install-close"'));
assert(html.includes('manifest.webmanifest?v=aws-install-20261030'));
assert(studio.includes("window.addEventListener('beforeinstallprompt'"));
assert(studio.includes("showInstallHelp("));
assert(studio.includes("await event.prompt()"));
assert(theme.includes('width:calc(33px * 2.5)'));
assert(theme.includes('height:calc(32px * 2.5)'));
const pwaManifest=JSON.parse(fs.readFileSync(require.resolve('../manifest.webmanifest'),'utf8'));
assert(pwaManifest.icons.some(icon=>icon.src.includes('azara-universe-logo.svg')&&icon.sizes==='any'));
assert(pwaManifest.icons.some(icon=>icon.src.includes('azara-universe-app.webp')));
assert(pwaManifest.icons.every(icon=>/azara-universe/.test(icon.src)));
for(const legacy of ['aws-icon-192.png','aws-icon-512.png','literary-icon-192.png','literary-icon-512.png'])
 assert(!fs.existsSync(require('node:path').join(__dirname,'../assets',legacy)),legacy+' must not remain');
assert(sw.includes('aws-writing-studio-unified-v21'));
assert(sw.includes('./assets/azara-universe-app.webp'));
console.log('PASS: per-workspace consolidation, six unique tools, content/reference preservation, idempotence, restore, editor capture isolation, render event safety, folded/orphan/cyclic navigation and search.');
