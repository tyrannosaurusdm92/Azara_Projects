const cache=new Map();
export async function loadJson(path,{fresh=false}={}) {
  if(!fresh&&cache.has(path)) return cache.get(path);
  const response=await fetch(path,{cache:fresh?'no-store':'default'}); if(!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
  const data=await response.json(); cache.set(path,data); return data;
}
export async function loadRuntime(){ return loadJson('json/runtime.json'); }
export async function loadBackendConfig(path='backend/backend-links.json'){ return loadJson(path); }
export function clearConfigCache(){ cache.clear(); }
