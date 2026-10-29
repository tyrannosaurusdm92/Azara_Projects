/** Verify canonical 24-accent sound functions (Node.js, no browser required).
 *  From the package directory: node docs/verify-phonetics.js
 */
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');const env={};env.window=env;env.globalThis=env;vm.createContext(env);
for(const p of ['js/config.js','js/data.js','js/phonetic-data.js','js/phonetic.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),env,{filename:p});
const P=env.AzaaraanPhonetics;
const checks={
 'T+SHORT_A+Z':'/tæz/', 'B+W+LONG_A':'/vɑː/',
 'N+GLOTTAL+SHORT_I+Z':'/nɪz/', 'K+S':'/ks/',
 'N+G':'/ŋ/', 'N+Y':'/ɲ/', 'T+CH':'/tʃ/',
 'D+CH':'/dʒ/', 'S+HARD_H':'/ʃ/', 'G+HARD_H':'/ɣ/',
 'O+Y':'/ɔɪ/', 'O+HARD_H':'/oʊ/', 'T+SHORT_A+Z+S':'/tæzs/',
 'K+SHORT_A+T':'/kæt/', 'B+SHORT_E+L':'/bɛl/',
};
let failures=0;
for(const [recipe,want] of Object.entries(checks)){
 try{const got=P.fromRecipe(recipe).units[0].ipa;if(got!==want)throw Error(`Expected ${want}, got ${got}`)}
 catch(e){failures++;console.error('FAILED positive',recipe,e.message)}
}
for(const recipe of ['T+SHORT_A+SHORT_E','B+BASE+F','T+SHORT_A+Z+S+CH']){
 try{P.fromRecipe(recipe);failures++;console.error('FAILED negative: should reject',recipe)}catch{}
}
for(const [name,fragment] of [['Pix','P+SHORT_I K+S'],['Lohkahna','L O+H K+LONG_A N+LONG_A']]){
 const known=P.known(name);if(!known||known.recipe!==fragment){failures++;console.error('FAILED example',name)}
}
const expectedOrder=['Short A','Short E','Short I','Short U','Long A','Long E','Long U','G','W','Y','F','B','Z','S','CH','Hard H','Base','D','K','L','M','N','R','T'];
const actual=env.AZA_CONFIG.accents.map(x=>x.name);
if(JSON.stringify(expectedOrder)!==JSON.stringify(actual)){failures++;console.error('FAILED 24-accent names/order')}
if(env.AZA_CONFIG.keyOrder!=='ABDEGHIJKLMNOPRSTUWYZ'){failures++;console.error('FAILED keyboard order')}
if(env.AZA_CONFIG.specials.length!==4){failures++;console.error('FAILED structural markers')}
console.log(`${Object.keys(checks).length+3+2+3} checks completed, ${failures} failures.`);
process.exitCode=failures?1:0;
