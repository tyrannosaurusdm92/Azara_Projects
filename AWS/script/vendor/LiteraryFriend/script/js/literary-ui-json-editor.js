import {el} from './literary-core-dom.js';
export function jsonEditor(name,value={},label='Structured data'){const wrap=el('label',{},[document.createTextNode(label+' ')]),area=el('textarea',{name,rows:8,value:JSON.stringify(value||{},null,2),spellcheck:false});wrap.append(area);return wrap;}
export function parseJsonField(fd,name,fallback={}){const raw=String(fd.get(name)||'').trim();if(!raw)return fallback;try{return JSON.parse(raw);}catch(error){throw new Error(`${name} must contain valid JSON: ${error.message}`);}}
