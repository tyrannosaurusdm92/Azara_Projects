/* Adapted from the supplied player-map master navigator, for writing workspaces only. */
(()=>{'use strict';
 const key='aws:master-navigation:v1';
 let state={collapsed:false,bar:null,bubble:null};
 try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 const nav=make('nav','aws-master-nav');nav.id='aws-master-nav';nav.setAttribute('aria-label','Master navigation');
 const bar=make('div','aws-nav-bar'),handle=make('button','aws-nav-drag','⠿');
 handle.type='button';handle.setAttribute('aria-label','Move master navigation');handle.title='Drag to move; arrow keys also move the navigation';
 const emblem=make('img','aws-nav-logo');emblem.src=new URL('assets/images/icon-64.png',location.href).href;emblem.width=32;emblem.height=32;emblem.alt='Aza’ra Universe celestial tree';
 const title=make('div','aws-nav-title');title.append(make('strong','','Aza’raan Writing Studio'),make('small','','Language · Eight books'));
 function dropdown(label){const details=make('details'),summary=make('summary','',label),menu=make('div','aws-nav-menu');details.append(summary,menu);return{details,menu}}
 const sections=dropdown('Sections'),pages=dropdown('Pages'),tools=dropdown('Tools');
 const collapse=make('button','aws-nav-collapse','Collapse');collapse.type='button';collapse.setAttribute('aria-label','Collapse master navigation');
 const install=make('button','aws-nav-install');install.type='button';install.setAttribute('aria-label','Download app');install.title='Install Aza’raan Writing Studio on this device';
 install.append(make('span','aws-nav-install-icon','↓'),make('span','aws-nav-install-label','Download app'));
 install.addEventListener('click',()=>window.AWSInstall?.download());
 bar.append(handle,emblem,title,sections.details,pages.details,tools.details,install,collapse);nav.append(bar);document.body.append(nav);
 const bubble=make('button','aws-nav-bubble');bubble.id='aws-nav-bubble';bubble.type='button';bubble.setAttribute('aria-label','Restore master navigation');bubble.title='Open navigation · drag to move';
 bubble.append(emblem.cloneNode(),make('span','','AWS'));document.body.append(bubble);
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch{}};
 const closeMenus=()=>nav.querySelectorAll('details[open]').forEach(d=>d.open=false);
 const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
 function fitMenu(details){
  const menu=details.querySelector('.aws-nav-menu'),summary=details.querySelector('summary');if(!details.open)return;
  const rect=summary.getBoundingClientRect(),width=Math.min(410,innerWidth-24);
  const below=innerHeight-rect.bottom-16,above=rect.top-16,desired=Math.min(menu.scrollHeight,620,innerHeight*.7);
  const openBelow=below>=Math.min(desired,180)||below>=above,height=Math.max(30,Math.min(desired,openBelow?below:above));
  menu.style.position='fixed';menu.style.width=width+'px';menu.style.right='auto';
  menu.style.left=clamp(rect.left,12,Math.max(12,innerWidth-width-12))+'px';
  menu.style.top=(openBelow?rect.bottom+8:Math.max(8,rect.top-height-8))+'px';menu.style.maxHeight=height+'px';
 }
 const fitMenus=()=>nav.querySelectorAll('details[open]').forEach(fitMenu);
 function place(el,position){
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.y))return;
  el.style.left=clamp(position.x,8,Math.max(8,innerWidth-el.offsetWidth-8))+'px';
  el.style.top=clamp(position.y,8,Math.max(8,innerHeight-el.offsetHeight-8))+'px';el.style.bottom='auto';
  if(el===nav)fitMenus();
 }
 function reserve(){document.body.style.setProperty('--aws-nav-reserve',state.collapsed?'0px':nav.offsetHeight+20+'px')}
 function layout(){
  nav.hidden=state.collapsed;bubble.hidden=!state.collapsed;
  document.body.classList.toggle('aws-nav-collapsed',state.collapsed);
  place(nav,state.bar);place(bubble,state.bubble);reserve();
 }
 function setCollapsed(value){state.collapsed=value;closeMenus();layout();save();(value?bubble:handle).focus({preventScroll:true})}
 collapse.onclick=()=>setCollapsed(true);
 function draggable(el,grip,slot){
  let start=null,moved=false;
  grip.style.touchAction='none';
  grip.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   const rect=el.getBoundingClientRect();start={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};moved=false;grip.setPointerCapture(event.pointerId);
  });
  grip.addEventListener('pointermove',event=>{
   if(!start||start.id!==event.pointerId)return;
   const dx=event.clientX-start.x,dy=event.clientY-start.y;
   if(Math.hypot(dx,dy)>5)moved=true;
   if(moved){event.preventDefault();state[slot]={x:start.left+dx,y:start.top+dy};place(el,state[slot])}
  });
  const finish=()=>{if(!start)return;start=null;const rect=el.getBoundingClientRect();state[slot]={x:rect.left,y:rect.top};save()};
  grip.addEventListener('pointerup',finish);grip.addEventListener('pointercancel',finish);grip.addEventListener('lostpointercapture',finish);
  grip.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopImmediatePropagation();moved=false}},true);
  grip.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();const rect=el.getBoundingClientRect(),step=event.shiftKey?24:8;
   state[slot]={x:rect.left+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),y:rect.top+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)};place(el,state[slot]);save();
  });
 }
 draggable(nav,handle,'bar');draggable(bubble,bubble,'bubble');bubble.addEventListener('click',()=>setCollapsed(false));
 const app=()=>window.LiteraryFriendApp;
 function action(menu,label,run){const button=make('button','aws-nav-link',label);button.type='button';button.onclick=()=>{closeMenus();run()};menu.append(button);return button}
 function render(){
  let snapshot;try{snapshot=app()?.getSnapshot()}catch{return}if(!snapshot)return;
  sections.menu.replaceChildren();pages.menu.replaceChildren();tools.menu.replaceChildren();
  const selected=snapshot.selectedWorkspaceId;
  for(const workspace of snapshot.workspaces){
   const button=action(sections.menu,workspace.name,()=>app().navigate(workspace.id));
   if(workspace.id===selected)button.setAttribute('aria-current','page');
   if(workspace.id==='wh-language'){
    const eras=make('div','aws-nav-eras');sections.menu.append(eras);
    for(const era of ['Proto','Ancient','Archaic','Classical','Traditional','Modern']){
     const channel=snapshot.channels.find(c=>c.workspaceId===workspace.id&&c.name===era);if(!channel)continue;
     const link=action(eras,era,()=>app().navigate(workspace.id,channel.id));
     if(channel.id===snapshot.selectedChannelId)link.setAttribute('aria-current','page');
    }
   }
  }
  for(const channel of snapshot.channels.filter(c=>c.workspaceId===selected)){
   const button=action(pages.menu,channel.name,()=>app().navigate(selected,channel.id));
   if(channel.id===snapshot.selectedChannelId)button.setAttribute('aria-current','page');
  }
  action(pages.menu,'+ New writing page',()=>document.getElementById('new-writing').click());
  action(tools.menu,'Font workshop',()=>document.getElementById('wh-open-font-workshop').click());
  action(tools.menu,'Open keyboard bubble',()=>window.LuxuryKeyboard?.open());
  const language=selected==='wh-language';
  action(tools.menu,language?'Read language desk':'Read selection / page',()=>{
   if(language)document.getElementById('wh-language-frame').contentDocument?.getElementById('speakComposition')?.click();
   else document.getElementById('wh-aza-speak').click();
  });
  action(tools.menu,'Stop speech',()=>document.getElementById('wh-aza-stop').click());
  action(tools.menu,'Back up / restore',()=>document.getElementById('open-backup').click());
  action(tools.menu,'Sync devices / restore cloud',()=>{
   document.getElementById('sidebar-settings').click();
   setTimeout(()=>document.getElementById('bridge-box')?.scrollIntoView({behavior:'smooth',block:'center'}),100);
  });
  action(tools.menu,'Settings / account',()=>document.getElementById('sidebar-settings').click());
  action(tools.menu,'Reset navigation position',()=>{state={collapsed:false,bar:null,bubble:null};nav.style.left='12px';nav.style.top='10px';bubble.style.left='14px';bubble.style.top='auto';bubble.style.bottom='14px';layout();save()});
  title.lastElementChild.textContent=snapshot.workspaces.find(w=>w.id===selected)?.name||'Language · Eight books';
  fitMenus();
 }
 nav.addEventListener('toggle',event=>{if(event.target.open){for(const d of nav.querySelectorAll('details'))if(d!==event.target)d.open=false;fitMenu(event.target)}},true);
 document.addEventListener('pointerdown',event=>{if(!nav.contains(event.target))closeMenus()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenus()});
 window.addEventListener('literaryfriend:ready',render);window.addEventListener('literaryfriend:navigated',render);
 window.addEventListener('resize',layout);new ResizeObserver(reserve).observe(nav);
 layout();render();window.AWSNavigation=Object.freeze({open:()=>setCollapsed(false),collapse:()=>setCollapsed(true),refresh:render});
})();
