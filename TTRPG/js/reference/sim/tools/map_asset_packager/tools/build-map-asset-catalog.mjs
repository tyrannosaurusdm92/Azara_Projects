#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const defaultLocalAssetDir = process.env.MAP_ASSET_MAP_ASSET_DIR || 'C:\\Users\\Public\\Pictures\\map_assets';
const requestedAssetDir = process.argv[2] || defaultLocalAssetDir;
const outputDir = path.join(root, 'map_assets');
const chunkDir = path.join(outputDir, 'map_asset_catalog_chunks');
const manifestPath = path.join(outputDir, 'map_assets_catalog_manifest.json');
const indexPath = path.join(outputDir, 'map_assets_catalog_index.json');
const legacyPath = path.join(outputDir, 'map_assets_catalog.json');
const chunkSize = Number(process.env.MAP_ASSET_CATALOG_CHUNK_SIZE || process.argv[3] || 10000);
const localAssetBaseUrl = process.env.MAP_ASSET_LOCAL_ASSET_BASE_URL || 'http://127.0.0.1:5177/local-map-assets/';
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

function resolveAssetDir(input) {
  const value = String(input || '').trim();
  if (/^[A-Za-z]:[\\/]/.test(value)) return path.normalize(value);
  if (path.isAbsolute(value)) return path.normalize(value);
  return path.resolve(root, value);
}

const assetDir = resolveAssetDir(requestedAssetDir);

const keywordGroups = {
  terrain: ['terrain','ground','land','dirt','soil','grass','meadow','prairie','field','farm','sand','beach','shore','mud','moss','rock','stone','cliff','mountain','hill','valley','cave','cavern','floor','tile','plateau','cobble','cobblestone','gravel','ground texture'],
  water: ['water','surface water','deep water','ocean','sea','river','lake','pond','stream','creek','shore','coast','wave','waterfall','canal','underwater','submerged','deepsea','seafloor','open ocean'],
  reef: ['reef','coral','kelp','shell','anemone','seagrass','lagoon'],
  plants: ['plant','tree','forest','woods','bush','shrub','leaf','leaves','flower','grass','moss','root','log','stump','reed','swamp','marsh','vine','canopy','palm','orchard','garden'],
  building: ['building','building cluster','cluster','district','house','home','hut','cottage','cabin','tower','castle','outer wall','wall','walls','gate','roof','roofs','temple','shrine','chapel','church','cathedral','government','civic','courthouse','barracks','embassy','market','shop','barn','inn','hotel','hostel','tavern','apartment','apartments','residence','manor','palace','mill','dome','platform','treehouse','large treehouse','ruin'],
  path: ['path','paths','road','roads','trail','street','bridge','stairs','ladder','ramp','plank','pier','dock','walkway','fence','rail','courtyard','causeway'],
  object: ['object','prop','crate','barrel','cart','wagon','well','sign','statue','lamp','lantern','torch','boat','ship','anchor','crystal','ore','table','bench','rockpile','chest','bed','bunk','mattress','cot','hearth','fireplace','stove','chair','desk','wardrobe','shelf','bookcase','bookshelf','cabinet','interior','indoor','room','kitchen','door']
};

const tagAliases = {
  floating: ['float','floating','raft','platform','barge'],
  underwater: ['underwater','submerged','sea_floor','seafloor','deepsea','dome'],
  roof: ['roof','roofs','thatch','tile_roof','shingles'],
  wall: ['wall','walls','outer_wall','outerwall','fortification','gate'],
  cluster: ['cluster','district','neighborhood','block'],
  treehouse: ['treehouse','tree_house','canopy_house','large_treehouse','platform'],
  cavern: ['cave','cavern','underground','subterranean'],
  farm: ['farm','field','crop','orchard','barn'],
  swamp: ['swamp','marsh','bog','reed','mud'],
  beach: ['beach','sand','shore','coast'],
  government: ['government','civic','hall','courthouse','barracks','embassy'],
  residential: ['house','home','cottage','apartment','apartments','residence'],
  hospitality: ['inn','hotel','hostel','tavern'],
  religious: ['chapel','church','temple','shrine','cathedral'],
  deepwater: ['deep_water','deepwater','underwater','open_ocean','abyss'],
  surfacewater: ['surface_water','surfacewater','shore','coast','river','lake','ocean_surface'],
  interior: ['interior','indoor','room','hall','chamber'],
  bed: ['bed','bunk','mattress','cot'],
  hearth: ['hearth','fireplace','stove','chimney']
};

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9\s.]/g, ' ').replace(/\s+/g, ' ').trim();
}
function slugToken(text) { return normalize(text).replace(/\s+/g, '-'); }
function tokenize(text) {
  return [...new Set(normalize(text).split(/\s+/).filter(t => t.length > 2 && t.length < 48 && !/^\d+$/.test(t)))];
}
function addMapSet(map, key, chunkId) {
  if (!key) return;
  if (!map[key]) map[key] = new Set();
  map[key].add(chunkId);
}
function counterAdd(obj, key, amount = 1) { obj[key] = (obj[key] || 0) + amount; }

function tagFile(relPath) {
  const text = normalize(relPath);
  const categories = [];
  const tags = new Set();
  for (const [category, words] of Object.entries(keywordGroups)) {
    for (const word of words) {
      if (text.includes(normalize(word))) {
        if (!categories.includes(category)) categories.push(category);
        tags.add(category);
        tags.add(slugToken(word));
      }
    }
  }
  for (const [tag, words] of Object.entries(tagAliases)) {
    for (const word of words) {
      if (text.includes(normalize(word))) tags.add(tag);
    }
  }
  if (!categories.length) categories.push('object');
  return { categories, tags: Array.from(tags).sort() };
}

async function* walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && imageExts.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.rm(chunkDir, { recursive: true, force: true });
  await fs.mkdir(chunkDir, { recursive: true });

  const chunks = [];
  const tokenToChunks = {};
  const categoryToChunks = {};
  const tagToChunks = {};
  const categoryTotals = {};
  const tagTotals = {};
  let current = [];
  let total = 0;
  let totalBytes = 0;
  let chunkId = 0;

  async function flushChunk() {
    if (!current.length) return;
    const file = `map_assets/map_asset_catalog_chunks/chunk_${String(chunkId).padStart(5, '0')}.json`;
    const out = path.join(root, file);
    const categories = {};
    const tags = {};
    const tokens = new Set();
    let bytes = 0;

    for (const asset of current) {
      bytes += Number(asset.size) || 0;
      asset.categories.forEach(cat => { counterAdd(categories, cat); counterAdd(categoryTotals, cat); addMapSet(categoryToChunks, cat, chunkId); });
      asset.tags.forEach(tag => { counterAdd(tags, tag); counterAdd(tagTotals, tag); addMapSet(tagToChunks, tag, chunkId); });
      tokenize(asset.relativePath + ' ' + asset.name + ' ' + asset.tags.join(' ')).forEach(token => tokens.add(token));
    }
    for (const token of tokens) addMapSet(tokenToChunks, token, chunkId);
    await fs.writeFile(out, JSON.stringify({ chunkId, count: current.length, assets: current }), 'utf8');
    chunks.push({ id: chunkId, file, count: current.length, bytes, categories, tags });
    chunkId += 1;
    current = [];
  }

  for await (const full of walk(assetDir)) {
    const stat = await fs.stat(full);
    const relToAsset = path.relative(assetDir, full).split(path.sep).join('/');
    const tagged = tagFile(relToAsset);
    current.push({
      name: path.basename(full),
      path: relToAsset,
      relativePath: relToAsset,
      localAbsolutePath: full,
      localImageRoot: assetDir,
      assetBaseUrl: localAssetBaseUrl,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      categories: tagged.categories,
      tags: tagged.tags
    });
    total += 1;
    totalBytes += stat.size;
    if (current.length >= chunkSize) {
      await flushChunk();
      if (total % 100000 === 0) console.log(`Cataloged ${total.toLocaleString()} assets...`);
    }
  }
  await flushChunk();

  const setMapToArrayMap = map => Object.fromEntries(Object.entries(map).map(([key, set]) => [key, Array.from(set).sort((a,b)=>a-b)]));
  const generatedAt = new Date().toISOString();
  const manifest = {
    app: 'MapAssetPackager',
    mode: 'chunked-static-catalog-local-images',
    generatedAt,
    assetRoot: assetDir,
    assetRootWindows: defaultLocalAssetDir,
    localImageRoot: assetDir,
    assetBaseUrl: localAssetBaseUrl,
    catalogFolder: 'map_assets',
    sourceAssetDirectory: assetDir,
    imagesStoredInGithub: false,
    cataloguesStoredInGithub: true,
    count: total,
    totalBytes,
    chunkSize,
    chunkCount: chunks.length,
    chunks,
    categoryTotals,
    tagTotals,
    indexFile: 'map_assets/map_assets_catalog_index.json',
    instructions: 'Commit the map_assets JSON catalogues only. Keep the actual images at C:\\Users\\Public\\Pictures\\map_assets or set MAP_ASSET_MAP_ASSET_DIR. Run node tools/start-local-preview.mjs so MapAssetPackager can fetch selected local images during ZIP export.'
  };
  const index = {
    app: 'MapAssetPackager',
    mode: 'chunked-static-catalog-index',
    generatedAt,
    catalogFolder: 'map_assets',
    chunkCount: chunks.length,
    chunkFiles: Object.fromEntries(chunks.map(chunk => [chunk.id, chunk.file])),
    categoryToChunks: setMapToArrayMap(categoryToChunks),
    tagToChunks: setMapToArrayMap(tagToChunks),
    tokenToChunks: setMapToArrayMap(tokenToChunks)
  };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
  await fs.writeFile(legacyPath, JSON.stringify({ app: manifest.app, mode: manifest.mode, generatedAt, count: total, manifest: 'map_assets/map_assets_catalog_manifest.json', index: 'map_assets/map_assets_catalog_index.json', assetRoot: assetDir, assetBaseUrl: localAssetBaseUrl }, null, 2), 'utf8');
  console.log(`MapAssetPackager cataloged ${total.toLocaleString()} image assets into ${chunks.length.toLocaleString()} chunks.`);
  console.log(`Source images: ${assetDir}`);
  console.log(`Wrote ${path.relative(root, manifestPath)}`);
  console.log(`Wrote ${path.relative(root, indexPath)}`);
  console.log(`Wrote ${path.relative(root, chunkDir)}/chunk_*.json`);
}

main().catch(error => {
  console.error('MapAssetPackager refused the catalog because:', error.message);
  process.exit(1);
});
