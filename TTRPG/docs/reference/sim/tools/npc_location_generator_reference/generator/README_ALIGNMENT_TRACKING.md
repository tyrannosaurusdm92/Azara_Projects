# the source world Settlement + NPC Alignment Tracking Remake Files included: - `npc_directory.html`
- `generator/npc-page.js` What changed: - Adds a same-page **Settlement alignment preference for visitors** panel.
- Adds generated **NPC alignment records** for every NPC.
- NPC alignment begins at generation and is saved to each NPC object.
- NPC choices can alter Altruism, Lawfulness, Cooperation, and Honor.
- Each NPC keeps an alignment history with before/after scores and deltas.
- The settlement visitor preference can be adjusted manually, imported, copied, downloaded, reset, and exported with the normal site JSON state.
- Adds alignment searching/filtering to the NPC list.
- Exposes these helper methods for other scripts: - `LIFE_SIMULATOR.ensureAlignmentTracking()` - `LIFE_SIMULATOR.applyNpcAlignmentChoice(npcId, choiceOrDelta, label)` - `LIFE_SIMULATOR.recordNpcAlignmentChoice(npcId, choiceOrDelta, label)` - `LIFE_SIMULATOR.undoLastNpcAlignmentChoice(npcId)` - `LIFE_SIMULATOR.importSettlementAlignmentPreference(payload)` - `LIFE_SIMULATOR.exportSettlementAlignmentPreference()` Example from another script: ```js
LIFE_SIMULATOR.applyNpcAlignmentChoice(npc.id, { delta: { altruism: 125, lawfulness: -50, cooperation: 75, honor: 100 }, note: 'Protected a visitor even though local procedure discouraged intervention'
});
``` Install: 1. Replace your existing `npc_directory.html` with the included `npc_directory.html`.
2. Replace your existing `generator/npc-page.js` with the included `generator/npc-page.js`.
3. Keep your existing `generator/site.css`, `generator/core.js`, `generator/data-bundle.js`, and other generator scripts in place.