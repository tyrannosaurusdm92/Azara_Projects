/* Native WebAssembly text diagnostics. No Python interpreter or generative service. */
window.LiteraryFriendWASM = (()=>{
  let runtime=null;
  const enc=new TextEncoder();
  const fallback=text=>({words:(text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length,characters:[...text].length,sentences:(text.match(/[.!?]+(?=\s|$)/g)||[]).length||(text.trim()?1:0),lines:text?text.split('\n').length:0,engine:'JavaScript fallback'});
  async function load(){if(runtime)return runtime;const response=await fetch('script/wasm/text-diagnostics.wasm');if(!response.ok)throw Error('WASM text analyzer unavailable');const module=await WebAssembly.instantiate(await response.arrayBuffer());runtime=module.instance.exports;return runtime;}
  async function analyze(text){text=String(text||'');try{
      const wasm=await load(), bytes=enc.encode(text);if(bytes.byteLength>wasm.memory.buffer.byteLength-65536)throw Error('Document exceeds current WASM memory window');
      new Uint8Array(wasm.memory.buffer,65536,bytes.length).set(bytes);
      return {words:wasm.word_count(65536,bytes.length),characters:wasm.codepoint_count(65536,bytes.length),sentences:wasm.sentence_count(65536,bytes.length),lines:wasm.line_count(65536,bytes.length),engine:'WebAssembly'};
    }catch(e){return fallback(text)} }
  return {analyze,load};
})();
