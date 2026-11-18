/* Canonical Aza'raan keyboard runtime — restores shared Modern Unicode and image compositor.
   Historical keyboards preserve their own art and separate 24-accent registry. */
(()=>{
'use strict';
if(window.AZ_CANON&&window.AZ_MK&&window.AZ_ASSETS)return;
const registry=window.AZA_DATA?.modernCanonicalEncoding;
const config=window.AZA_CONFIG;
if(!registry||!config)throw Error("Aza'raan canonical keyboard data was not loaded");
const allowedLetters=[...(config.modernIndependentAlphabet||'ABDEGHIJKLMNOPRSTWYZ')];
const ind=Object.fromEntries(allowedLetters.map(k=>[k,registry.independent[k]||config.letterMap[k]]).filter(([k,v])=>!!v));
const subs=Object.assign({},registry.subscripts);
const ordinary=(registry.marks||[]).filter(x=>!/^s(?:Over|Under|Left|Right)$/.test(x.id));
const specials=(registry.marks||[]).filter(x=>/^s(?:Over|Under|Left|Right)$/.test(x.id));
const marks=[...ordinary,...specials].map(x=>({
 id:x.id,name:x.name,unicode:x.unicode,khmer:x.unicode,codepoint:x.codepoint,
 latin:'◌'+x.unicode,display:'◌'+x.unicode,special:specials.some(s=>s.id===x.id)
}));
const byId=new Map(marks.map(x=>[x.id,x]));
window.AZ_CANON={ind,subs,coeng:'្',nums:Object.assign({},registry.numbers),punct:Object.assign({},registry.punctuation),marks};
const folder='assets/keyboard/modern/';
const slug={
 held:'Held_Consonant',central:'Central_Vowel',open:'Open_Vowel',short:'Short_Vowel',
 long:'Long_Vowel',unvoiced:'Unvoiced_Sound',voiced:'Voiced_Sound',separate:'Separated_Vowel',
 nasal:'Nasalization',soft:'Soft_Sound',hard:'Hard_Sound',glide:'Glide_Sound',
 sOver:'Glottal_Stop',sUnder:'Click_Sound',sLeft:'Emphasis_before',sRight:'Emphasis_after'
};
const primary=Object.fromEntries(Object.entries(slug).map(([id,name])=>[id,folder+'diacritic/Primary_'+name+'.png']));
const secondary=Object.fromEntries(Object.entries(slug).map(([id,name])=>[id,
 folder+'diacritic/Secondary_'+name+(id.startsWith('s')?'-uniform.png':'-uniform.png')]));
const independent=Object.fromEntries(allowedLetters.map(k=>[k,folder+'independent/'+k+'-font.png']));
const subscript=Object.fromEntries(allowedLetters.map(k=>[k,folder+'subscript/'+k+'-uniform.png']));
window.AZ_ASSETS={primary,secondary,independent,subscripts:subscript};
const vowelHosts=new Set(['A','E','I','O','W','Y']);
const markSet=new Set(ordinary.map(x=>x.id)),specialSet=new Set(specials.map(x=>x.id));
const cleanIds=(items)=>[...new Set(Array.isArray(items)?items:[])];
function normalizeLetter(input){
 const base=String(input?.base||'').toUpperCase();
 const subList=Array.isArray(input?.subs)?input.subs:[];
 const subTokens=subList.map(s=>({key:String(s?.key||'').toLowerCase(),marks:cleanIds(s?.marks)}));
 return {type:'letter',base,marks:cleanIds(input?.marks),markOrder:cleanIds(input?.marks),
   subs:subTokens,specials:cleanIds(input?.specials)};
}
function vowelNucleus(base,marks){
 return vowelHosts.has(base.toUpperCase())||
   marks.includes('central')||marks.includes('open')||marks.includes('short')||marks.includes('long');
}
function validateLetterRules(t){
 if(!ind[t.base])return 'No independent Modern '+t.base+' letter.';
 if(t.marks.length>2||t.subs.length>2||t.subs.some(s=>s.marks.length>2))return 'Maximum two phonetic marks per letter/subscript and two subscripts.';
 if(t.specials.length>4)return 'At most four special controls.';
 if(t.marks.some(id=>!markSet.has(id))||t.subs.some(s=>s.marks.some(id=>!markSet.has(id))))return 'Unknown Modern mark.';
 if(t.specials.some(id=>!specialSet.has(id)))return 'Unknown Modern special control.';
 if(t.subs.some(s=>!subs[s.key]))return 'Unknown Modern subscript.';
 if(t.marks.includes('voiced')&&t.marks.includes('unvoiced'))return 'Voiced and Unvoiced Sound cannot be combined on one letter.';
 if(t.subs.some(s=>s.marks.includes('voiced')&&s.marks.includes('unvoiced')))return 'Voiced and Unvoiced Sound cannot be combined on one subscript.';
 if(t.marks.includes('short')&&t.marks.includes('long'))return 'Short and Long Vowel are mutually exclusive.';
 if(t.subs.some(s=>s.marks.includes('short')&&s.marks.includes('long')))return 'Short and Long Vowel are mutually exclusive on one subscript.';
 if(t.subs.some(s=>s.marks.includes('separate')))return 'Separated Vowel belongs only to the independent host.';
 if(t.marks.includes('separate')&&(!vowelNucleus(t.base,t.marks)||!t.subs.some(s=>vowelNucleus(s.key,s.marks))))
   return 'Separated Vowel requires a vowel host and a genuine vowel subscript.';
 if(t.base==='B'&&t.marks.includes('unvoiced')&&!t.marks.includes('soft'))
   return 'Modern F is B + Soft Sound + Unvoiced Sound. P remains independent.';
 return null;
}
function encode(input){
 const t=normalizeLetter(input),error=validateLetterRules(t);if(error)throw Error(error);
 const write=ids=>ids.map(id=>byId.get(id).unicode).join('');
 const early=new Set(['soft','hard','held']);
 return ind[t.base]+write(t.marks.filter(id=>early.has(id)))+
  t.subs.map(s=>subs[s.key]+write(s.marks)).join('')+
  write(t.marks.filter(id=>!early.has(id)))+write(t.specials);
}
/* Keep the user's image silhouettes intact. The compositor uses the existing
   PNGs for the main glyph, primary/secondary accents, and 20%-scale subscripts.
   This visualization is separate from the canonical serialized Khmer Unicode. */
function createCluster(input){
 const t=normalizeLetter(input);const err=validateLetterRules(t);if(err)throw Error(err);
 const box=document.createElement('span');box.className='az-khmer-cluster';
 box.setAttribute('aria-label',t.base+' Aza’raan glyph');
 box.style.position='relative';box.style.width='206px';box.style.height='246px';
 box.style.display='inline-block';box.style.verticalAlign='baseline';box.style.lineHeight='0';
 const layout=[];
 function part(src,x,y,w,h,label){
  if(!src)return;
  const place=document.createElement('span');place.className='packed-ink';
  place.style.left=x+'px';place.style.top=y+'px';place.style.width=w+'px';place.style.height=h+'px';
  const img=document.createElement('img');img.src=src;img.alt='';img.draggable=false;
  img.setAttribute('aria-hidden','true');img.style.left='0';img.style.top='0';img.style.width='100%';img.style.height='100%';
  img.style.objectFit='contain';place.append(img);box.append(place);layout.push({x,y,w,h,label});
 }
 part(independent[t.base],22,27,135,175,'independent');
 t.marks.forEach((id,i)=>part(i===0?primary[id]:secondary[id],i===0?136:170,i===0?94:110,i===0?52:29,i===0?50:28,id));
 const subLeft=t.subs.length===1?139:125;
 t.subs.forEach((s,i)=>{
  const x=subLeft+i*32;
  part(subscript[s.key.toUpperCase()],x,198,27,35,'subscript-'+s.key);
  s.marks.forEach((id,j)=>part(secondary[id],x+21+j*9,199+j*11,j===0?14:10,j===0?14:10,'subscript-mark-'+id));
 });
 const controls={sOver:[82,0,39,30],sUnder:[122,0,39,30],sLeft:[0,110,31,31],sRight:[177,110,31,31]};
 t.specials.forEach(id=>{const boxPos=controls[id];if(boxPos)part(primary[id],...boxPos,id)});
 box.dataset.layout=JSON.stringify(layout);
 box.dataset.encoded=encode(t);
 return box;
}
window.AZ_MK={normalizeLetter,validateLetterRules,encode,createCluster};
})();
