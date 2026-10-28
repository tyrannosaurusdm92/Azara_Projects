import {events} from './event-bus.js'; import {store} from './state-store.js';
class Router{
  #routes=new Map(); #fallback='project-hub';
  register(id,handler,{requiresProject=false}={}){this.#routes.set(id,{handler,requiresProject});return this;}
  async go(id,params={},opts={}){let route=this.#routes.get(id); if(!route){id=this.#fallback;route=this.#routes.get(id);} if(route?.requiresProject&&!store.get('activeProject')){id='project-hub';route=this.#routes.get(id);}
    if(!route)return; store.set({route:id},'router'); if(!opts.noHash&&location.hash!==`#${id}`)history.pushState({route:id},'',`#${id}`); events.emit('route:before',{id,params}); await route.handler(params); events.emit('route:after',{id,params}); return id;}
  start(){window.addEventListener('popstate',()=>this.go(location.hash.slice(1)||this.#fallback,{}, {noHash:true}));document.addEventListener('click',e=>{const button=e.target.closest('[data-route]');if(button){e.preventDefault();this.go(button.dataset.route);}});return this.go(location.hash.slice(1)||this.#fallback,{}, {noHash:true});}
}
export const router=new Router();
