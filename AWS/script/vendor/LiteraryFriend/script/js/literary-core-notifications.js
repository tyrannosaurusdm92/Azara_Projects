import {announce} from './literary-core-dom.js'; import {events} from './event-bus.js'; import {userMessage} from './literary-core-errors.js';
export function installNotifications(){events.on('notify',e=>announce(e.detail?.message||''));events.on('error',e=>announce(userMessage(e.detail?.error||e.detail)));events.on('autosave:saved',()=>announce('Saved'));}
export const notify=(message,type='info')=>events.emit('notify',{message,type});
