
(function(){
function drag(el,handle){let start=null; handle.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY,l:el.offsetLeft,t:el.offsetTop}; handle.setPointerCapture(e.pointerId);}); handle.addEventListener('pointermove',e=>{if(!start)return; el.style.left=Math.max(4,start.l+e.clientX-start.x)+'px'; el.style.top=Math.max(4,start.t+e.clientY-start.y)+'px'; el.style.bottom='auto';}); handle.addEventListener('pointerup',()=>start=null);}
function init(){const nav=document.getElementById('bd-global-dropdown-nav'), bubble=document.getElementById('bd-nav-bubble'); const h=nav?.querySelector('.bdg-drag-handle'), bcore=bubble?.querySelector('.bdg-bubble-core'); if(nav&&h)drag(nav,h); if(bubble&&bcore)drag(bubble,bcore); document.getElementById('bdg-hide-nav')?.addEventListener('click',()=>document.body.classList.add('bdg-nav-hidden')); document.getElementById('bdg-show-nav')?.addEventListener('click',()=>document.body.classList.remove('bdg-nav-hidden'));}
window.BelNav={init};
})();
