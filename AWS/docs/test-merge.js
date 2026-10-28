/* Run: node docs/test-merge.js. Exercises the writing desk → voice bridge. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const config=JSON.parse(read('json/azaaraan-config.json'));
const pronunciation=JSON.parse(read('json/tts-pronunciation.json'));
const els={},handlers={},listeners={};
const element=id=>els[id]||(els[id]={value:id==='voiceBase'?'100':id==='speechRate'||id==='speechVolume'?'1':'',
 textContent:'',disabled:false,addEventListener(name,fn){handlers[id+':'+name]=fn;},scrollIntoView(){}});
const voices=[{name:'Test English voice',lang:'en-US'}],utterances=[];
const synth={getVoices(){return voices},cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend?.())}};
let tokens=[];
const encode=token=>token.type==='glyph'?config.letterMap[token.base]+token.marks.map(id=>
 [...config.accents,...config.specials].find(mark=>mark.id===id).khmer).join(''):
 token.type==='sign'?config.archaicStandalone[token.sign].khmer:
 token.type==='space'?' ':token.type==='break'?'\n':token.value||'';
const window={speechSynthesis:synth,SpeechSynthesisUtterance:function(text){this.text=text},
 AzaaraanStudio:{getTokens:()=>tokens.map(t=>({...t,marks:t.marks?.slice()})),getUnicode:()=>tokens.map(encode).join('')},
 addEventListener(name,fn){listeners[name]=fn}};
const document={getElementById:element,querySelectorAll(){return []}};
const context={window,document,console,setTimeout,queueMicrotask};vm.createContext(context);
for(const name of ['config','voice-adapter','tts-data','ipa-data','ipa','tts'])
 vm.runInContext(read('script/js/aza/'+name+'.js'),context);
const T=window.AzaaraanTTS;
assert.deepStrictEqual(JSON.parse(JSON.stringify(window.AZA_CONFIG)),config);
assert.deepStrictEqual(JSON.parse(JSON.stringify(window.AZA_TTS_DATA)),pronunciation);
assert.strictEqual([...config.keyOrder].length,21);
assert.strictEqual(config.accents.length,24);
assert.strictEqual(config.specials.length,4);
for(const mark of [...config.accents,...config.specials])
 assert.strictEqual(window.AZA_DATA.marks.find(m=>m.id===mark.id).output,mark.khmer);
const creatorExamples=[
 ['T',['C01'],'tæ'],['B',['C02'],'bɛ'],['P',['C03'],'pɪ'],['R',['C04'],'rʌ'],
 ['K',['C05'],'kɑː'],['S',['C06'],'siː'],['N',['C07'],'nuː'],['N',['C08'],'ŋ'],
 ['K',['C09'],'kw'],['B',['C09'],'v'],['N',['C10'],'ɲ'],['O',['C10'],'ɔɪ'],
 ['B',['C11'],'f'],['W',['C12'],'b'],['T',['C01','K01'],'tæz'],['K',['K02'],'ks'],
 ['T',['K03'],'tʃ'],['D',['K03'],'dʒ'],['T',['K04'],'θ'],['S',['K04'],'ʃ'],
 ['O',['K04'],'oʊ'],['T',['K05'],'t'],['B',['C02','K06'],'bɛd'],['B',['C01','K07'],'bæk'],
 ['B',['C02','K08'],'bɛl'],['S',['C01','K09'],'sæm'],['P',['C03','K10'],'pɪn'],
 ['K',['C01','K11'],'kær'],['K',['C01','K12'],'kæt']
];
for(const [base,marks,expected] of creatorExamples){
 const got=T.transcribeTokens([{type:'glyph',base,marks}]);
 assert.strictEqual(got.ipa,'/'+expected+'/',base+' + '+marks.join(' + '));
}
tokens=[{type:'glyph',base:'T',marks:['C01','K01','S02']},{type:'space'},
 {type:'glyph',base:'N',marks:['C08']},{type:'sign',sign:'¡'},
 {type:'glyph',base:'A',marks:['C05']},{type:'break'},
 {type:'sign',sign:'ʔ'}];
const phrase=T.transcribeTokens(tokens);
assert.strictEqual(phrase.ipa,'/ǃtæz ŋǃɑː\nʔ/');
assert.strictEqual(phrase.plan.filter(e=>e.type==='click').length,2);
assert.strictEqual(phrase.plan.filter(e=>e.type==='glottal').length,1);
listeners['azaaraan:change']();
assert.strictEqual(els.compositionIpa.textContent,phrase.ipa);
handlers['useManuscript:click']();
assert.strictEqual(els.speechText.value,window.AzaaraanStudio.getUnicode());
assert.strictEqual(els.speechIpa.textContent,phrase.ipa);
tokens=[{type:'glyph',base:'B',marks:['C11']},{type:'space'},
 {type:'glyph',base:'B',marks:['C09']},{type:'space'},
 {type:'glyph',base:'T',marks:['K03']}];
listeners['azaaraan:change']();
assert.strictEqual(els.speechIpa.textContent,'/f v tʃ/');
assert.strictEqual(els.speechText.value,window.AzaaraanStudio.getUnicode());
const before=utterances.length;
handlers['speakComposition:click']();
assert.strictEqual(utterances.length,before+1,'Writing desk did not start browser speech');
assert.strictEqual(utterances.at(-1).text,T.transcribeTokens(tokens).speech);
els.speechText.value='Aza’raan';handlers['speechText:input']();
assert.strictEqual(els.speechIpa.textContent,'/æzʌʔr͡ræn/');
tokens=[{type:'glyph',base:'N',marks:['C08']}];listeners['azaaraan:change']();
assert.strictEqual(els.speechIpa.textContent,'/æzʌʔr͡ræn/','Manual speech text must stay editable');
const archaicClick=config.archaicStandalone['¡'].khmer;
assert.strictEqual(T.transcribe(' '+archaicClick).ipa,'/ǃ/');
assert.strictEqual(T.transcribe(' '+config.archaicStandalone['ʔ'].khmer).ipa,'/ʔ/');
assert.strictEqual(T.transcribe(config.letterMap.F).ipa,'/f/');
assert.strictEqual(T.transcribe(config.letterMap.V).ipa,'/v/');
assert.strictEqual(T.transcribeTokens([..."Aza’raan"].map(value=>({type:'literal',value}))).ipa,'/æzʌʔr͡ræn/');
assert(T.transcribe('/ǃ/').plan.some(e=>e.type==='click'));
console.log('29 accent examples, three-mark stack, archaic signs, phrase audio, live edits, names: PASSED');
