import {extensionOf} from './literary-engines-import-classifier.js';
export async function fileToBase64(file){const buffer=await file.arrayBuffer();let binary='';const bytes=new Uint8Array(buffer);const step=0x8000;for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));return btoa(binary);}
export async function readImportFile(file,{base64Limit=12*1024*1024}={}){
 const ext=extensionOf(file.name); const out={name:file.name,mimeType:file.type||'',size:file.size,extension:ext,lastModified:file.lastModified};
 if(file.size<=2*1024*1024 && ['txt','md','json','csv','html'].includes(ext)){out.text=await file.text();if(ext==='json'){try{out.json=JSON.parse(out.text);}catch{}}}
 if(file.size<=base64Limit)out.base64=await fileToBase64(file);else out.requiresChunkedUpload=true;
 return out;
}
export async function readImportFiles(files,options){const results=[];for(const file of files)results.push(await readImportFile(file,options));return results;}
