const assert=require('node:assert/strict');
const core=require('../script/js/font-workshop-core.js');
function image(width,height,background){
  const pixels=new Uint8Array(width*height*4);
  for(let i=0;i<width*height;i++)pixels.set(background,i*4);
  return pixels;
}
const opaque=image(12,12,[255,255,255,255]);
for(let y=3;y<9;y++)for(let x=4;x<8;x++)opaque.set([0,0,0,255],(y*12+x)*4);
const dark=core.rasterMask(opaque,12,12);
assert.equal(dark.reduce((a,b)=>a+b,0),24,'A white PNG background must not become a filled rectangle');
assert.equal(core.traceMask(dark,12,12).match(/M/g).length,1);
const alpha=image(12,12,[0,0,0,0]);
for(let y=3;y<9;y++)for(let x=4;x<8;x++)alpha.set([255,255,255,255],(y*12+x)*4);
assert.deepEqual(core.rasterMask(alpha,12,12),dark,'White glyphs on transparency remain importable');
const ring=new Uint8Array(25).fill(1);ring[12]=0;
assert.equal(core.traceMask(ring,5,5).match(/M/g).length,2,'Tracing must keep counters/holes');
const pairs=new Map([['34,18',-85],['1,2',25]]);
assert.deepEqual(core.kerningPairs(core.writeKerning(pairs)),new Map([['1,2',25],['34,18',-85]]));
const glyph={contours:[[{x:0,y:0,onCurve:true},{x:40,y:0,onCurve:true},{x:0,y:100,onCurve:true}]],instructions:[1,2]};
core.transform(glyph,{x:15,y:-10,scaleX:2,scaleY:.5});
assert.deepEqual([glyph.xMin,glyph.yMin,glyph.xMax,glyph.yMax],[15,-10,95,40]);
assert.equal(glyph.instructions,undefined,'Outdated point hinting must not survive edited geometry');
console.log('PASS Raster background detection, transparency, holes, kerning and glyph transforms');
