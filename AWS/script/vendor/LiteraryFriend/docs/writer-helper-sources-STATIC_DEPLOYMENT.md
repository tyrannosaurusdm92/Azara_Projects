# Static deployment

This package contains only static JavaScript plus documentation. No Python/server runtime is required and no WASM was needed for this pass.

Recommended manual script load order:

1. `js/ai-brain-persona.js`
2. `js/ai-brain-safety.js`
3. `js/ai-brain-memory.js`
4. `js/ai-brain-world-model.js`
5. `js/ai-brain-retrieval.js`
6. `js/context-assembler.js`
7. `js/context-composer.js`
8. `js/ai-brain-core.js`
9. `js/ai-brain-provider-bridge.js`
10. `js/ai-brain-creative.js`
11. `js/ai-brain-router.js`
12. `js/ai-brain-index.js`
13. `js/debug-trace.js`
14. `js/ai-brain-loader.js`


Alternatively load only `js/ai-brain-loader.js` in the existing Writer Tools DOM shell. The loader now sequentially loads the consolidated stack beside itself before booting the UI.

`WriterHelperReady` is the high-level API for non-UI/static integration. `WriterHelperReady.health()` reports whether the expected subsystems are registered.
