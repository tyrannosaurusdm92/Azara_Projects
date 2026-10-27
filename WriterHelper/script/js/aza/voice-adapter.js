/* The writing desk owns the spelling table. Speech reads the same 21 bases and
   28 mark sequences, so a change to the keyboard cannot silently change audio. */
(()=>{
 'use strict';
 const C=window.AZA_CONFIG;
 if(!C)return;
 window.AZA_DATA={
  keys:Object.fromEntries([...C.keyOrder].map(key=>[key,C.letterMap[key]])),
  vowelCarriers:{A:'អ',E:'ង',I:'ញ',O:'ឋ',U:'ឌ'},
  marks:[...C.accents,...C.specials].map(m=>({id:m.id,output:m.khmer,name:m.name||m.label}))
 };
})();
