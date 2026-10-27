import {events} from './event-bus.js';
export function applyAccessibility(settings={}){
  const a=settings.accessibility||settings; const html=document.documentElement;
  html.dataset.highContrast=String(Boolean(a.highContrast)); html.dataset.reduceMotion=String(Boolean(a.reduceMotion)); html.dataset.dyslexiaFriendly=String(Boolean(a.dyslexiaFriendly)); html.dataset.largeTargets=String(a.largeTargets!==false);
  html.style.setProperty('--lf-font-scale',String(Number(a.fontScale)||1));
  if(a.reduceMotion) html.setAttribute('data-reduce-motion','true'); else html.removeAttribute('data-reduce-motion');
  events.emit('a11y:applied',{settings:a});
}
export function installPasswordToggles(root=document){root.addEventListener('click',e=>{const b=e.target.closest('[data-toggle-password]');if(!b)return;const input=b.parentElement?.querySelector('input');if(!input)return;const showing=input.type==='text';input.type=showing?'password':'text';b.setAttribute('aria-pressed',String(!showing));b.setAttribute('aria-label',showing?'Show password':'Hide password');b.textContent=showing?'Show':'Hide';});}
export function installDialogClose(root=document){root.addEventListener('click',e=>{const b=e.target.closest('[data-close-dialog]');if(b)b.closest('dialog')?.close();});}
