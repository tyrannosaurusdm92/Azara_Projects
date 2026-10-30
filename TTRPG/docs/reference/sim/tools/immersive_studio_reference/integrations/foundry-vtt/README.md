# Foundry VTT Adapter This folder is a system-neutral module shell. The Python app export writes generated data into `foundry-vtt/data/source_world_living_world.json` and keeps raw NPC/location details under `flags.source_world` so the data can survive rules-system differences. Use this pattern when you want Foundry support without locking the source world into one rules implementation: 1. Run `python app.py`.
2. Generate/save your world.
3. Click **Export VTT/Game Bundle** on the application board.
4. Copy the exported `foundry-vtt` folder into Foundry's `Data/modules/source_world-living-world`.
5. Enable the module in a world.
6. Use the importer script pattern to read the bundled JSON into JournalEntry pages.