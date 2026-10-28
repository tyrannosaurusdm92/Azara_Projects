# William Saville voice integration

The final system treats William's voice as a **shared creative constraint**, not a standalone optional style file. `ai-brain-persona.js` is loaded before creative generation, and both the remote Onyx/AI-Brain path and local fallback use its voice contract.

## What is preserved

- direct/confessional first-person emotional clarity
- concrete recurring imagery (storms, fire/ash, glass, walls, masks, scars, rubble, darkness/light, breath, hearts, chains, roads, trees)
- willingness to name hurt, anger, fear, love, identity and resistance plainly
- dark → defiant / dark → hopeful movement when earned
- rough performance text in lyrics: stretched vowels, repeated title phrases, emphatic lines
- emotional thesis that remains understandable rather than hiding behind literary abstraction

## What the code actively repairs

- **over-explanation:** detect adjacent semantic restatement, repeated explanation markers and abstract paraphrase; keep the strongest statement then advance through image, action, contradiction or consequence
- **rushed thought transitions:** preserve stimulus → interpretation → body/emotion → want → choice when the turn matters, rather than skipping connective logic
- **lyrics that are over-complicated:** protect natural speech stress/breath, shorten prose-sized lines, enforce one main job per section and one dominant image family at a time
- **flat lyrics:** simplify the title/hook and make verses earn it with concrete pressure, not generic inspirational filler
- **dialogue consistency:** authorial voice stays William's, while every speaker receives separate vocabulary/rhythm/goals/avoidance/knowledge/relationship constraints so characters do not become clones of the author
- **language-history exposition:** use clear cause → community effect → linguistic consequence while labeling simulation as modeled rather than inevitable

## Priority lyric evidence

The connected Drive corpus was inspected specifically for: We’ll Survive; Create In Defiance; Modern Day Addictions; Shout It Out; Northern Light / You, My Northern Light; Messy and Real v2; Let Me Be A Tree; Poisonous Kisses; Red Flag Heart version 2; Hanging In There. These are marked as priority anchors in `ai-brain-persona.js`.

The requested title **Take Flight** was not found as a standalone song document or exact title in the connected compiled-song document during this pass. The build does not invent a missing source; it keeps the requested title in the focus metadata as unresolved instead.

## Important boundary

The voice system is meant to amplify William's ideas while doing the minute craft work he asked the tool to help with. It should not erase idiosyncrasy, forcibly make every sentence polished, or make every character speak in William's personal narration voice.
