"""Rebuild the static allowlist and invalidate WriterHelper's offline cache."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {'.js', '.mjs', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg',
           '.webp', '.wav', '.mp3', '.ttf', '.otf', '.woff', '.woff2', '.wasm'}
paths = []
core = ['index.html', 'manifest.webmanifest']
classic = json.loads((ROOT / 'vendor/keyboard/json/audio-manifest.json').read_text())
classic_files = {'vendor/keyboard/' + clip['file']
                 for pack in classic['packs'] if pack['id'] == 'classic'
                 for clip in pack['clips']}
for file in sorted(ROOT.rglob('*')):
    relative = file.relative_to(ROOT)
    name = relative.as_posix()
    if not file.is_file() or any(part.startswith('.') for part in relative.parts):
        continue
    if relative.parts[0] not in {'script', 'style', 'json', 'assets', 'vendor'}:
        continue
    if name == 'json/offline-assets.json':
        continue
    if file.suffix.lower() not in ALLOWED and not re.search(r'\.js\.pt\d+$', name):
        continue
    paths.append(name)
    if name.startswith(('script/', 'style/', 'json/')):
        core.append(name)
    elif name.startswith('assets/') and file.stat().st_size < 1024 * 1024:
        core.append(name)
    elif name.startswith(('vendor/keyboard/script/', 'vendor/keyboard/css/', 'vendor/keyboard/style/', 'vendor/keyboard/json/', 'vendor/keyboard/assets/images/')):
        core.append(name)
    elif name in classic_files:
        core.append(name)
    elif name.startswith(('vendor/LiteraryFriend/css/', 'vendor/LiteraryFriend/script/')) and file.stat().st_size < 2 * 1024 * 1024:
        core.append(name)
paths = sorted(set(paths + core + ['json/offline-assets.json']))
core = sorted(set(core))
digest = hashlib.sha256()
for name in paths:
    if name != 'json/offline-assets.json':
        digest.update(name.encode())
        digest.update((ROOT / name).read_bytes())
version = 'writerhelper-' + digest.hexdigest()[:16]
manifest = {'version': version, 'core': core, 'static': paths,
            'coreBytes': sum((ROOT / name).stat().st_size for name in core)}
(ROOT / 'json/offline-assets.json').write_text(json.dumps(manifest, indent=2) + '\n')
worker = ROOT / 'service-worker.js'
worker.write_text(re.sub(r"const VERSION='[^']+';", f"const VERSION='{version}';", worker.read_text()))
print(f"{len(core)} offline core files, {manifest['coreBytes'] / 1048576:.1f} MiB; {len(paths)} static paths")
