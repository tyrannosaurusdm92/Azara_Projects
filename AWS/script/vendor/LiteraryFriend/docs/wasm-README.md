# Browser WebAssembly

The shipped `text-diagnostics.wasm` is a native WebAssembly build of a compact C text scanning engine. Its JavaScript interface is `script/js/wasm-diagnostics.js`.

Exports: `word_count`, `sentence_count`, `codepoint_count`, `line_count`, and `memory`. It operates on a UTF-8 buffer copied into module memory by the caller. Unicode-aware fallback tokenization remains in JavaScript when WASM isn't available. This is native WASM, not Python or Pyodide.

Desktop FontForge/Pandoc build dependencies, third-party Python scripts, and Python test fixtures are not interpreted or mislabeled as WASM.
