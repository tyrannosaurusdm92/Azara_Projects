(function(){
'use strict';
const $=id=>document.getElementById(id);
const click=id=>{const el=$(id);if(el){el.click();return true}return false};
let shellBackendProjectId='',shellProject=null,shellUser=null;
function mirrorSession(token){const value=String(token||'');const keys=['literaryfriend.session.token.v2','literaryfriend.session.token','literaryfriend-book-token','lf.auth.token'];try{for(const key of keys)value?sessionStorage.setItem(key,value):sessionStorage.removeItem(key);}catch(_){}}
function applyHostCloudContext(){const book=window.LFBookStudio;if(!book?.setCloudContext)return;const current=book.getCloudContext?.()||{};if(String(current.projectId||'')!==shellBackendProjectId){book.setCloudContext({projectId:shellBackendProjectId,manifestNodeId:'',pageNodeIds:[],assetNodeIds:{cover:[],pageTexture:[]},bookId:'',editionId:''});}else book.setCloudContext({projectId:shellBackendProjectId});}
function artMode(){click('artModeBtn');}
function bookMode(){click('bookModeBtn');}
function artEditor(){return window.LFArt?.studioApi?._getEditor?.()||null;}
function artRenderer(){return window.LFArt?.studioApi?._getRenderer?.()||null;}
function pane(id){const b=document.querySelector(`[data-toolpane="${id}"]`);if(b)b.click();}
function inspector(id){const b=document.querySelector(`[data-inspector="${id}"]`);if(b)b.click();}
function status(msg){const e=$('statusText');if(e)e.textContent=msg;parent.postMessage({type:'lf-frame-status',message:msg},'*');}
function setArtTool(tool){artMode();pane('createPane');const ed=artEditor();if(ed){ed.setTool(tool);document.querySelectorAll('.editor-tool').forEach(b=>b.classList.toggle('active',b.dataset.editorTool===tool));status(`Tool: ${tool}`);}}
function addShape(shape){artMode();pane('createPane');const ed=artEditor();if(ed){ed.addShape(shape);status(`Added ${shape} shape.`);}}
function setColor(color){const ed=artEditor();if(ed&&/^#[0-9a-f]{6}$/i.test(color)){ed.brush.color=color;const input=$('brushColorInput');if(input){input.value=color;input.dispatchEvent(new Event('input',{bubbles:true}));}status(`Primary color ${color}.`);}}
function setBrush(size,opacity,kind){const ed=artEditor();if(!ed)return;if(size!=null)ed.brush.size=Math.max(1,Number(size)||1);if(opacity!=null)ed.brush.opacity=Math.max(.01,Math.min(1,Number(opacity)));if(kind){const map={round:'paint',marker:'marker',pencil:'pencil',airbrush:'spray'};setArtTool(map[kind]||'paint');}}
function transform(command){artMode();const ed=artEditor(),s=ed?.selected?.();if(command==='resize'){pane('documentPane');status('Cover size controls opened.');return;}if(!s){pane('createPane');inspector('transformInspector');status(`Select a layer before ${command}.`);return;}if(command==='rotate'){ed.updateSelected({rotation:(Number(s.rotation)||0)+90});inspector('transformInspector');status('Selected layer rotated 90°.');return;}if(command==='flip'){ed.updateSelected({flipX:!s.flipX});inspector('transformInspector');status('Selected layer flipped horizontally.');return;}if(command==='crop'){cropSelected(ed,s);}}
async function cropSelected(ed,s){
  if(s.type!=='image'||!s.src){status('Crop works on a selected image layer.');return;}
  const raw=prompt('Crop image by percent from each edge: top,right,bottom,left','0,0,0,0');if(raw==null)return;
  const v=raw.split(',').map(x=>Math.max(0,Math.min(45,Number(x.trim())||0)));while(v.length<4)v.push(0);const [t,r,b,l]=v;
  try{const img=await window.LFArt.util.loadImage(s.src);const sx=img.width*l/100,sy=img.height*t/100,sw=img.width*(1-(l+r)/100),sh=img.height*(1-(t+b)/100);if(sw<1||sh<1)throw new Error('Crop removes the whole image.');const c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw));c.height=Math.max(1,Math.round(sh));c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);ed.updateSelected({src:c.toDataURL('image/png'),naturalWidth:c.width,naturalHeight:c.height});status('Selected image cropped.');}catch(e){status('Crop failed: '+e.message);}
}
function openGroup(group){artMode();if(group==='selection'){pane('createPane');setArtTool('select');inspector('transformInspector');}else if(group==='image'){pane('createPane');inspector('transformInspector');}else if(group==='brushes'||group==='tools'||group==='shapes'||group==='colors'){pane('createPane');}else if(group==='text'){pane('textPane');}else if(group==='3d'){inspector('bookInspector');document.querySelector('[data-inspector="bookInspector"]')?.scrollIntoView({block:'nearest'});}else if(group==='layers'){$('layersList')?.scrollIntoView({block:'center'});}else if(group==='effects'){pane('effectsPane');}}
function applySize(spec){if(!spec)return;const w=Number(spec.width),h=Number(spec.height);if(!w||!h)return;try{window.LFArt?.studioApi?.applyBookSpec?.({width:w,height:h,pageCount:Number(spec.pageCount)||1,binding:spec.binding});}catch{};const s=$('sizePresetSelect');if(s){const presetMap={'paperback-digest':'digest','paperback-standard-trade':'trade','paperback-small-trade':'small-trade','paperback-mass-market':'mass-market','hardcover-us-trade':'hardcover-trade','hardcover-royal':'hardcover-royal','hardcover-compact':'hardcover-compact','hardcover-textbook-7x10':'hardcover-textbook','hardcover-textbook-letter':'hardcover-manual-large','hardcover-childrens-portrait':'hardcover-child-portrait','hardcover-childrens-landscape':'hardcover-child-landscape','hardcover-coffee-10':'hardcover-art-square','hardcover-coffee-12':'hardcover-art-large'};const mapped=presetMap[String(spec.id||'')];const option=mapped?[...s.options].find(o=>o.value===mapped):null;if(option){s.value=option.value;s.dispatchEvent(new Event('change',{bubbles:true}));}else{const wi=$('customWidthInput'),hi=$('customHeightInput');if(wi&&hi){s.value='custom';s.dispatchEvent(new Event('change',{bubbles:true}));wi.value=w;hi.value=h;wi.dispatchEvent(new Event('input',{bubbles:true}));hi.dispatchEvent(new Event('input',{bubbles:true}));}}}}
function applyTheme(theme){const value=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=value;document.body.dataset.theme=value;}
function setCoverBase(value){const base=String(value||'transparent');try{window.LFBookStudio?.setCoverBase?.(base);}catch{}const ed=artEditor();if(ed&&ed.project?.document?.background!=='transparent')ed.setDocument({background:'transparent'},false);status(base==='transparent'?'Transparent cover base.':`Cover base ${base}.`);}
function setTitle(title){const ed=artEditor();if(ed&&title){ed.project.title=title;ed.changed('Title changed from shell');}const bi=$('bookTitleInput');if(bi&&title){bi.value=title;bi.dispatchEvent(new Event('input',{bubbles:true}));}}
async function save(){if($('artStudioView')?.classList.contains('active'))click('saveProjectBtn');else click('saveLocalBtn');status('Save requested from LiteraryFriend shell.');}
function fileMenu(){if($('artStudioView')?.classList.contains('active'))click('projectsBtn');else $('projectImportInput')?.click();}
function editMenu(){if($('artStudioView')?.classList.contains('active'))click('undoBtn');}
function viewMenu(){if($('artStudioView')?.classList.contains('active'))window.LFArt?.studioApi?.fit?.();else click('readerModeBtn');}

function controlInfo(el){
  const label=(el.getAttribute('aria-label')||el.title||document.querySelector(`label[for="${CSS.escape(el.id||'')}"]`)?.textContent||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100);
  return {id:el.id||'',name:el.name||'',type:el.tagName.toLowerCase()+(el.type?`:${el.type}`:''),label,value:'value'in el?el.value:undefined,checked:'checked'in el?el.checked:undefined,disabled:Boolean(el.disabled)};
}
function listControls(){return [...document.querySelectorAll('button[id],input[id],select[id],textarea[id]')].filter(el=>!el.closest('[hidden]')).map(controlInfo);}
function getControl(id){if(!id||!/^[A-Za-z][\w:.-]*$/.test(String(id)))throw new Error('A valid Studio control ID is required.');const el=$(String(id));if(!el)throw new Error(`Studio control not found: ${id}`);return el;}
function setControlValue(id,value){const el=getControl(id);if(el.type==='checkbox'||el.type==='radio')el.checked=Boolean(value);else el.value=String(value);const evt=(el.tagName==='SELECT'||el.type==='checkbox'||el.type==='radio')?'change':'input';el.dispatchEvent(new Event(evt,{bubbles:true}));if(evt==='input')el.dispatchEvent(new Event('change',{bubbles:true}));return controlInfo(el);}
function minimalLayer(layer){if(!layer)return null;const copy={};for(const k of ['id','type','name','x','y','w','h','rotation','opacity','blend','text','shape','fill','stroke','locked','hidden'])if(layer[k]!==undefined)copy[k]=layer[k];return copy;}
function studioState(){const ed=artEditor(),book=window.LFBookStudio;return {mode:$('artStudioView')?.classList.contains('active')?'book-cover':'book-building',art:ed?{title:ed.project?.title||'',document:window.LFArt?.util?.deepClone?window.LFArt.util.deepClone(ed.project.document):ed.project.document,activeTool:ed.activeTool,brush:{...ed.brush},layerCount:ed.project?.layers?.length||0,selectedLayer:minimalLayer(ed.selected())}:null,book:book?.getState?book.getState():null};}
async function runSuperbotAction(action,args={}){
  const ed=artEditor();
  switch(String(action||'')){
    case'state':return {data:studioState(),message:'Studio state read.'};
    case'controls':return {data:{controls:listControls()},message:'Live Studio controls listed.'};
    case'mode':args.mode==='book-building'?bookMode():artMode();return {message:`Mode: ${args.mode==='book-building'?'book-building':'book-cover'}.`};
    case'tool':if(args.tool==='text'){artMode();pane('textPane');}else if(args.tool==='zoom'){artMode();window.LFArt?.studioApi?.fit?.();}else setArtTool(args.tool==='brush'?'paint':String(args.tool||'select'));return {message:`Tool: ${args.tool||'select'}.`};
    case'group':openGroup(args.group);return {message:`Opened ${args.group} tools.`};
    case'shape':addShape(String(args.shape||'rect'));return {message:`Added ${args.shape||'rect'} shape.`};
    case'color':setColor(String(args.color||''));return {message:`Primary color ${args.color}.`};
    case'secondaryColor':if(!ed)throw new Error('Art editor is not ready.');if(!/^#[0-9a-f]{6}$/i.test(String(args.color||'')))throw new Error('Secondary color must be a six-digit hex color.');ed.brush.secondaryColor=args.color;const sc=$('mergedSecondaryColor');if(sc){sc.value=args.color;sc.dispatchEvent(new Event('input',{bubbles:true}));}return {message:`Secondary color ${args.color}.`};
    case'brush':setBrush(args.size,args.opacity,args.kind);return {message:'Brush settings updated.'};
    case'imageCommand':await transform(String(args.command||''));return {message:`Image command ${args.command} requested.`};
    case'sizePreset':{const id=String(args.id||'');const outer=parent?.LFSizeLoader;let p=null;try{p=outer&&await outer.loadPreset(id);}catch(_){}if(!p)throw new Error(`Unknown book-size preset: ${id}`);applySize({id:p.id,width:p.width,height:p.height,binding:p.category||'',dpi:p.dpi,pageCount:1});return {message:`Book size ${p.name||p.id}: ${p.width} × ${p.height} in.`,data:p};}
    case'size':applySize(args.spec||args);return {message:'Book dimensions updated.'};
    case'addPage':bookMode();if(!click('addBlankPageBtn'))throw new Error('Add Page control is unavailable.');return {message:'Blank book page added.'};
    case'addLayer':if(!ed)throw new Error('Art editor is not ready.');artMode();ed.addPaintLayer(args.name||'Paint Layer');return {message:'Paint layer added.'};
    case'addText':if(!ed)throw new Error('Art editor is not ready.');artMode();pane('textPane');const tl=ed.addText(String(args.text||'BOOK TITLE'),args.options||{});return {message:'Text layer added.',data:minimalLayer(tl)};
    case'addImageUrl':if(!ed)throw new Error('Art editor is not ready.');artMode();const il=await ed.addImage(String(args.url||''),args.name||'SuperBot Artwork');return {message:'Image layer added.',data:minimalLayer(il)};
    case'addTexture':if(!ed)throw new Error('Art editor is not ready.');artMode();const tx=ed.addTexture({id:String(args.id||'paper'),name:args.name||String(args.id||'paper')});return {message:'Texture layer added.',data:minimalLayer(tx)};
    case'addPattern':if(!ed)throw new Error('Art editor is not ready.');artMode();const pt=ed.addPattern(String(args.pattern||'checker'),args.options||{});return {message:'Pattern layer added.',data:minimalLayer(pt)};
    case'deleteLayer':if(!ed)throw new Error('Art editor is not ready.');ed.deleteSelected();return {message:'Selected layer deleted.'};
    case'duplicateLayer':if(!ed)throw new Error('Art editor is not ready.');ed.duplicateSelected();return {message:'Selected layer duplicated.'};
    case'moveLayer':if(!ed)throw new Error('Art editor is not ready.');ed.moveLayer(Number(args.direction)||0);return {message:'Selected layer reordered.'};
    case'updateLayer':if(!ed)throw new Error('Art editor is not ready.');ed.updateSelected(args.patch||{});return {message:'Selected layer updated.',data:minimalLayer(ed.selected())};
    case'document':if(!ed)throw new Error('Art editor is not ready.');ed.setDocument(args.patch||{});return {message:'Cover document settings updated.'};
    case'undo':if(!ed)throw new Error('Art editor is not ready.');await ed.undo();return {message:'Undo completed.'};
    case'redo':if(!ed)throw new Error('Art editor is not ready.');await ed.redo();return {message:'Redo completed.'};
    case'fit':artMode();window.LFArt?.studioApi?.fit?.();return {message:'Canvas fitted to viewport.'};
    case'title':setTitle(String(args.title||''));return {message:'Project title updated.'};
    case'coverBase':setCoverBase(String(args.value||'transparent'));return {message:`Cover Base ${args.value||'transparent'}.`};
    case'theme':applyTheme(args.theme);return {message:`Theme ${args.theme==='dark'?'dark':'light'}.`};
    case'save':await save();return {message:'Save requested.'};
    case'new':{const mode=args.mode==='book-building'?'book-building':'book-cover';if(mode==='book-building'){bookMode();click('newBookBtn');ed?.newProject?.((args.title||'Untitled Book')+' Cover');ed?.setDocument?.({background:'transparent'},false);}else{artMode();ed?.newProject?.(args.title||'Untitled Cover');ed?.setDocument?.({background:'transparent'},false);}return {message:`New ${mode} project created.`};}
    case'controlClick':{const el=getControl(args.id);el.click();return {message:`Pressed ${args.id}.`,data:controlInfo(el)};}
    case'controlSet':{const info=setControlValue(args.id,args.value);return {message:`Updated ${args.id}.`,data:info};}
    default:throw new Error(`Unknown Studio action: ${action}`);
  }
}

async function importShellProject(m){
  const mode=m.mode==='book-building'?'book-building':'book-cover';
  if(mode==='book-building'){
    bookMode();
    window.LFBookStudio?.setLauncherProjectId?.(m.projectId||'');
    if(m.payload && window.LFBookStudio?.loadProject){
      await window.LFBookStudio.loadProject(m.payload,{sourceName:m.fileName||m.payload?.title||'Imported project'});
    }else if(m.source && window.LFBookStudio?.importSource){
      await window.LFBookStudio.importSource(m.source);
    }
    applyHostCloudContext();
    await window.LFBookStudio?.saveLauncherProject?.(m.projectId||'');
    status(`Imported ${m.fileName||'project'} into Book Building.`);
    return;
  }
  artMode();
  const ed=artEditor();
  if(!ed){status('Cover editor is still loading.');return;}
  window.LFArt?.studioApi?.setLauncherProjectId?.(m.projectId||'');
  if(m.payload?.schema==='literaryfriend-art-project/v1'){
    await ed.load(m.payload);
    if(m.projectId)ed.project.id=m.projectId;
    await window.LFArt?.studioApi?.saveLauncherProject?.(m.projectId||ed.project.id);
    status(`Imported ${m.fileName||m.payload.title||'cover project'}.`);
    return;
  }
  if(m.payload?.title) ed.newProject?.(m.payload.title);
  else if(m.source?.name) ed.newProject?.(String(m.source.name).replace(/\.[^.]+$/,''));
  if(m.projectId)ed.project.id=m.projectId;
  ed.setDocument?.({background:'transparent'},false);
  if(m.source?.dataUrl&&String(m.source.dataUrl).startsWith('data:image/'))await ed.addImage(m.source.dataUrl,m.source.name||'Imported Cover Art');
  await window.LFArt?.studioApi?.saveLauncherProject?.(m.projectId||ed.project.id);
  status(`Opened ${m.fileName||m.source?.name||'imported source'} as a Book Cover project.`);
}
async function handleShellMessage(m){
  switch(m.type){
    case'lf-shell-session':{shellUser=m.user||null;mirrorSession(m.token||'');window.LFBookStudio?.setBackendSession?.(m.token||'',shellUser);window.LFArt?.backend?.setSession?.(m.token||'',shellUser);break;}
    case'lf-shell-project-context':{shellProject=m.project||null;shellBackendProjectId=String(m.backendProjectId||shellProject?.backendId||'');applyHostCloudContext();break;}
    case'lf-shell-mode':m.mode==='book-building'?bookMode():artMode();break;
    case'lf-shell-tool':if(m.tool==='text'){artMode();pane('textPane');}else if(m.tool==='zoom'){artMode();window.LFArt?.studioApi?.fit?.();}else if(m.tool==='brush')setArtTool('paint');else setArtTool(m.tool);break;
    case'lf-shell-group':openGroup(m.group);break;
    case'lf-shell-shape':addShape(m.shape);break;
    case'lf-shell-color':setColor(m.color);break;
    case'lf-shell-brush':setBrush(m.size,m.opacity,m.kind);break;
    case'lf-shell-image-command':await transform(m.command);break;
    case'lf-shell-size':applySize(m.spec);break;
    case'lf-shell-add-page':bookMode();if(click('addBlankPageBtn'))status('Added a blank book page.');break;
    case'lf-shell-add-layer':{const ed=artEditor();if(ed){ed.addPaintLayer();status('Added a paint layer.');}break;}
    case'lf-shell-title':setTitle(m.title);break;
    case'lf-shell-cover-base':setCoverBase(m.value);break;
    case'lf-shell-background':setCoverBase(m.value);break;
    case'lf-shell-theme':applyTheme(m.theme);break;
    case'lf-shell-save':await save();break;
    case'lf-shell-menu':if(m.menu==='file')fileMenu();else if(m.menu==='edit')editMenu();else if(m.menu==='view')viewMenu();break;
    case'lf-shell-open-saved':{
      const ed=artEditor();
      if(m.mode==='book-building'){
        bookMode();
        window.LFBookStudio?.setLauncherProjectId?.(m.projectId||'');
        const loaded=await window.LFBookStudio?.loadLauncherProject?.(m.projectId||'');
        if(!loaded){
          if(String(m.fallbackCanvasData||'').startsWith('data:image/')) await window.LFBookStudio?.importSource?.({name:`${m.title||'Recovered Book'} Page.png`,mimeType:'image/png',dataUrl:m.fallbackCanvasData});
          else click('newBookBtn');
          window.LFBookStudio?.setLauncherProjectId?.(m.projectId||'');
          await window.LFBookStudio?.saveLauncherProject?.(m.projectId||'');
        }
        if(ed){const coverLoaded=await window.LFArt?.studioApi?.loadLauncherProject?.(m.projectId||'');if(!coverLoaded){ed.newProject?.((m.title||'Untitled Book')+' Cover');if(m.projectId)ed.project.id=m.projectId;}}
      }else{
        artMode();
        const loaded=await window.LFArt?.studioApi?.loadLauncherProject?.(m.projectId||'');
        if(!loaded&&ed){
          ed.newProject?.(m.title||'Untitled Cover');if(m.projectId)ed.project.id=m.projectId;
          if(String(m.fallbackCanvasData||'').startsWith('data:image/')) await ed.addImage?.(m.fallbackCanvasData,'Recovered Cover Artwork');
          await window.LFArt?.studioApi?.saveLauncherProject?.(m.projectId||ed.project.id);
        }
      }
      applyHostCloudContext();
      if(m.spec)applySize(m.spec);
      if(m.coverBase!==undefined)setCoverBase(m.coverBase);
      if(m.title)setTitle(m.title);
      status(`Opened saved ${m.mode==='book-building'?'Book Building':'Book Cover'} project.`);
      break;
    }
    case'lf-shell-import-project':await importShellProject(m);break;
    case'lf-shell-new':{
      const ed=artEditor();
      if(m.mode==='book-building'){
        bookMode();
        window.LFBookStudio?.setLauncherProjectId?.(m.projectId||'');
        click('newBookBtn');
        ed?.newProject?.((m.title||'Untitled Book')+' Cover');
        if(ed&&m.projectId)ed.project.id=m.projectId;
        ed?.setDocument?.({background:'transparent'},false);
      }else{
        artMode();
        ed?.newProject?.(m.title||'Untitled Cover');
        if(ed&&m.projectId)ed.project.id=m.projectId;
        ed?.setDocument?.({background:'transparent'},false);
      }
      applyHostCloudContext();
      if(m.spec)applySize(m.spec);
      if(m.coverBase!==undefined)setCoverBase(m.coverBase);
      if(m.title)setTitle(m.title);
      if(m.mode==='book-building')await window.LFBookStudio?.saveLauncherProject?.(m.projectId||'');
      if(ed)await window.LFArt?.studioApi?.saveLauncherProject?.(m.projectId||ed.project.id);
      status(`Opened new ${m.mode==='book-building'?'Book Building':'Book Cover'} project.`);
      break;
    }
  }
}
window.addEventListener('message',async e=>{
  const m=e.data||{};
  if(!m||typeof m!=='object'||!String(m.type||'').startsWith('lf-shell-'))return;
  try{await handleShellMessage(m);}catch(error){console.error(error);status(`Studio action failed: ${error?.message||error}`);}
});
window.addEventListener('message',async e=>{const m=e.data||{};if(!m||m.type!=='lf-superbot-action')return;const requestId=m.requestId||'';try{const result=await runSuperbotAction(m.action,m.args||{});parent.postMessage({type:'lf-superbot-result',requestId,ok:true,...result},'*');}catch(error){parent.postMessage({type:'lf-superbot-result',requestId,ok:false,error:error?.message||String(error)},'*');}});
let readySent=false;
function announceFrameReady(){
  if(readySent)return;
  const bookReady=Boolean(window.LFBookStudio?.isReady?.());
  const artReady=Boolean(window.LFArt?.studioApi?.isReady?.());
  if(bookReady&&artReady){
    readySent=true;
    parent.postMessage({type:'lf-frame-ready'},'*');
    return;
  }
  setTimeout(announceFrameReady,100);
}
document.addEventListener('lf:book-studio-ready',announceFrameReady);
document.addEventListener('lf:studio-ready',announceFrameReady);
window.addEventListener('DOMContentLoaded',announceFrameReady);
})();
