import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = folder => fs.readdirSync(path.join(root,folder),{withFileTypes:true});
const has = item => fs.existsSync(path.join(root,item));
const directories = entries('.').filter(x=>x.isDirectory()).map(x=>x.name).sort();
const files = entries('.').filter(x=>x.isFile()).map(x=>x.name).sort();
assert.deepEqual(directories,['assets','docs','json','script','style']);
assert.deepEqual(files,['keyboard.html','manifest.webmanifest','service-worker.js']);
for (const folder of ['style','docs','script','json'])
  assert.ok(entries(folder).every(entry=>entry.isFile()),`${folder}/ must be flat`);
assert.deepEqual(entries('assets').filter(e=>e.isDirectory()).map(e=>e.name).sort(),['audio','images']);
assert.ok(entries('assets/images').every(x=>x.isFile()));
assert.ok(entries('assets/audio').every(x=>x.isDirectory()));
for (const pack of entries('assets/audio'))
  assert.ok(entries(`assets/audio/${pack.name}`).every(x=>x.isFile()),`Unexpected nested audio/${pack.name}`);

const forbidden = /\.(?:bat|cmd|gs|exe|msi|dll|apk|ipa)$/i;
for(const folder of ['.','style','docs','script','json','assets/images',
  ...entries('assets/audio').map(e=>`assets/audio/${e.name}`)])
  assert.ok(entries(folder).every(e=>!forbidden.test(e.name)),`Disallowed executable/backend in ${folder}`);

const html = fs.readFileSync(path.join(root,'keyboard.html'),'utf8');
assert.equal((html.match(/<script\b/g)||[]).length,1);
assert.match(html,/src="script\/bootstrap\.mjs"/);
assert.match(html,/id="downloadApp"/);
for (const id of ['runKeyboard','pauseKeyboard','exitKeyboard','showKeyboard','togglePin',
  'toggleSplit','toggleDock','toolbarPrintScreen','numpad','keyboardGrid','keyScale',
  'leftHalfScale','rightHalfScale','halfDraggers','editor','copy','charGrid','designPanel'])
  assert.ok(html.includes(`id="${id}"`),`Missing ${id}`);
const styles = [...html.matchAll(/href="(style\/[^"]+\.css)"/g)].map(m=>m[1]);
for (const css of styles) assert.ok(has(css),`Missing referenced stylesheet ${css}`);

const boot = fs.readFileSync(path.join(root,'script/bootstrap.mjs'),'utf8');
for (const module of ['audio-dropdown.js','native-bridge.mjs','keyboard-ui.mjs','floating-controls.mjs'])
  assert.ok(boot.includes(module),`Bootstrap did not load ${module}`);
const worker = fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const match of worker.matchAll(/'\.\/([^']+)'/g))
  assert.ok(has(match[1]),`Offline cache points to missing ${match[1]}`);

const accents = JSON.parse(fs.readFileSync(path.join(root,'json/accent-variants.json'),'utf8'));
const unicode = JSON.parse(fs.readFileSync(path.join(root,'json/unicode-characters.json'),'utf8'));
assert.equal(unicode.characters.length,368);
assert.ok(accents.letters.a.length>20);
const audio = JSON.parse(fs.readFileSync(path.join(root,'json/audio-manifest.json'),'utf8'));
assert.equal(audio.packs.length,7);
assert.equal(audio.packs.reduce((n,p)=>n+p.clips.length,0),719);
for (const pack of audio.packs) {
  assert.ok(has(pack.original));
  assert.equal(Object.keys(pack.keyMap).length,126);
  for (const code of ['KeyA','Backspace','Space','Enter','PrintScreen','Numpad0','F12'])
    assert.ok(Object.hasOwn(pack.keyMap,code),`Missing ${code} in ${pack.id}`);
  for (const clip of pack.clips) assert.ok(has(clip.file),`Missing ${clip.file}`);
  for (const index of Object.values(pack.keyMap))
    assert.ok(Number.isInteger(index) && pack.clips[index]);
}
const soundSource = fs.readFileSync(path.join(root,'script/audio-dropdown.js'),'utf8');
assert.match(soundSource,/preassigned per-key sound packs/);
assert.ok(!soundSource.includes('sad-assign'),'Users must not remap individual sound clips');
assert.match(soundSource,/sad-save-offline/);

const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.start_url,'./keyboard.html');
for(const icon of manifest.icons)assert.ok(has(icon.src));
const native = fs.readFileSync(path.join(root,'script/native-bridge.mjs'),'utf8');
assert.match(native,/postMessage/);
assert.match(native,/moveDelta/);
console.log('PASS: one HTML, shallow paths, 7 fixed sound themes/719 clips, offline assets, Unicode and native bridge, backend excluded');
