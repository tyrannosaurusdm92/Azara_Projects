const TEXT_EXT=new Set(['txt','md','rtf','docx','pdf','html','htm']);
const IMAGE_EXT=new Set(['png','jpg','jpeg','webp','gif','svg','bmp','tif','tiff']);
const score=(hay,terms)=>terms.reduce((n,t)=>n+(hay.includes(t)?1:0),0);
export function extensionOf(name=''){const m=String(name).toLowerCase().match(/\.([a-z0-9]+)$/);return m?m[1]:'';}
export function classifyImport({name='',type='',text='',json=null}={}){
 const ext=extensionOf(name),hay=`${name} ${type} ${text.slice(0,8000)}`.toLowerCase();
 if(IMAGE_EXT.has(ext)||type.startsWith('image/'))return {logicalType:'artwork',destination:'art',confidence:.99,reasons:['image format']};
 if(json && (json.appName==='LiteraryFriend'||json.project||json.projects))return {logicalType:'project-package',destination:'consolidation',confidence:.98,reasons:['LiteraryFriend project structure']};
 const candidates=[
  ['language','languages',score(hay,['lexicon','dictionary','phonology','orthography','grammar','morphology','conlang'])],
  ['timeline','timeline',score(hay,['timeline','chronology','era','dated event','year ','history'])],
  ['character','characters',score(hay,['character','cast list','relationship','appearance','motivation','protagonist','antagonist'])],
  ['worldbuilding','world',score(hay,['worldbuilding','lore','location','faction','culture','species','magic system','technology','religion'])],
  ['outline','outline',score(hay,['outline','beat sheet','synopsis','act i','act 1','chapter plan','plot point'])],
  ['research','research',score(hay,['research','references','bibliography','citation','sources'])],
  ['manuscript','manuscript',score(hay,['chapter','scene','prologue','epilogue','manuscript'])]
 ].sort((a,b)=>b[2]-a[2]);
 if(candidates[0][2]>0){const [logicalType,destination,s]=candidates[0];return {logicalType,destination,confidence:Math.min(.95,.55+s*.1),reasons:[`matched ${s} content indicators`]};}
 if(TEXT_EXT.has(ext)||type.startsWith('text/'))return {logicalType:'manuscript',destination:'manuscript',confidence:.45,reasons:['generic document format']};
 if(ext==='json')return {logicalType:'structured-data',destination:'imports',confidence:.4,reasons:['generic JSON requires review']};
 return {logicalType:'attachment',destination:'research',confidence:.25,reasons:['unknown type routed for review']};
}
export function classifyBatch(files){return files.map(file=>({...file,classification:classifyImport(file)}));}
