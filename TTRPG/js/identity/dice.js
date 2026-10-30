/* Browser adapter for the supplied Unified Dice Randomizer's unbiased dice concepts.
   Independent lightweight implementation: no Node.js imports or third-party modules. */
(function(global){'use strict';
const UINT32=4294967296;
function hash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seedSource(seed){
 let a=hash('A:'+seed),b=hash('B:'+seed),c=hash('C:'+seed),d=hash('D:'+seed);
 return function(){a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b)|0;a=b^(b>>>9);b=(c+(c<<3))|0;c=(c<<21)|(c>>>11);d=(d+1)|0;t=(t+d)|0;c=(c+t)|0;return t>>>0;};
}
function create(seed){
 const seeded=seed!==undefined&&seed!==null&&String(seed).length>0;
 const nextSeed=seeded?seedSource(String(seed)):null;
 let buffer=null,cursor=0;
 function next32(){
  if(nextSeed)return nextSeed();
  if(!global.crypto||typeof global.crypto.getRandomValues!=='function')throw Error('Secure randomness unavailable. Provide a seed or use a supported browser.');
  if(!buffer||cursor>=buffer.length){buffer=new Uint32Array(8192);global.crypto.getRandomValues(buffer);cursor=0}
  return buffer[cursor++];
 }
 function int(max){
  if(!Number.isSafeInteger(max)||max<1||max>UINT32)throw RangeError('Invalid dice RNG range');
  const cap=UINT32-(UINT32%max);let n;do{n=next32()}while(n>=cap);return n%max;
 }
 function roll(sides){if(!Number.isInteger(sides)||sides<2||sides>1000000)throw RangeError('Invalid die size');return int(sides)+1}
 function shuffleInPlace(items){for(let i=items.length-1;i>0;i--){const j=int(i+1);[items[i],items[j]]=[items[j],items[i]]}return items}
 function choose(items){if(!items.length)throw RangeError('Empty random choices');return items[int(items.length)]}
 function percent(chance){if(!Number.isFinite(chance)||chance<0||chance>100)throw RangeError('Invalid percentage');return int(1000000)<Math.round(chance*10000)}
 return Object.freeze({seed:seeded?String(seed):null,int,roll,shuffleInPlace,choose,percent,rollPool:(sides,count)=>Array.from({length:count},()=>roll(sides))});
}
global.BelavadosDice=Object.freeze({create,allowedDice:[4,6,8,10,12,20],version:'1.0.0-browser'});
})(window);
