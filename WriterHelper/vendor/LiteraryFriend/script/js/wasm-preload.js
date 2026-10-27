/* Browser-native operations are loaded on demand; the WebAssembly core is small. */
window.addEventListener('load',()=>window.LiteraryFriendWASM?.load?.().catch(()=>{}),{once:true});
