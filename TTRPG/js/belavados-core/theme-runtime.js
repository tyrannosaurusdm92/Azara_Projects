/* Color-only runtime for dynamic same-origin fullscreen panes. Do not recolor user images. */
(()=>{'use strict';
 const css=new URL('css/belavados-core/belavados-theme.css?v=20261029-unified-pass2',document.baseURI).href;
 const candidate=id=>document.getElementById(id);
 function themeFrame(frame){if(!frame)return;try{
   const doc=frame.contentDocument;
   if(!doc||!doc.head||doc.getElementById('belavados-unified-iframe-palette'))return;
   const link=doc.createElement('link');link.id='belavados-unified-iframe-palette';link.rel='stylesheet';link.href=css;
   doc.head.appendChild(link);
 }catch(_){/* Cross-origin frame: cannot style; never bypass the browser origin policy. */}}
 // Never inject into the user's original index.html: its original palette is the source of truth.
 const id='onyxWorkFullscreenFrame';const frame=candidate(id);
 if(frame){frame.addEventListener('load',()=>themeFrame(frame));}
 window.BelavadosTheme=Object.freeze({name:'belavados',colors:Object.freeze({panel:'#111720',base:'#0c1017',
   teal:'#3d9fa0',aqua:'#8de0dc',bronze:'#b07a3a',gold:'#d7aa63',plum:'#4d3658',text:'#f3e9db'})});
})();
