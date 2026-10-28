"""Validate the deployable AWS entry, resource paths, PWA and static-only offline list."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parents[1]
assert {p.name for p in ROOT.iterdir() if p.is_dir()}=={'script','style','json','docs','assets'}
assert list(ROOT.rglob('*.html'))==[ROOT/'index.html']
assert list(ROOT.rglob('*.webmanifest'))==[ROOT/'manifest.webmanifest']
assert list(ROOT.rglob('service-worker.js'))==[ROOT/'service-worker.js']
assert not list(ROOT.rglob('*.gs')),'Backend source must not be deployed with AWS'

class Resources(HTMLParser):
    def __init__(self,base):super().__init__();self.base=base;self.refs=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='base':self.base=urljoin(self.base,attrs.get('href',''))
        if tag in {'script','img','link'}:
            ref=attrs.get('src') if tag!='link' else attrs.get('href')
            if ref:self.refs.append(urljoin(self.base,ref))

entry=(ROOT/'index.html').read_text()
assert '<title>Aza’raan Writing Studio</title>' in entry
documents=[(entry,ROOT.as_uri()+'/')]
for name,var,base in [('aza-language-document','WRITERHELPER_AZA_LANGUAGE_HTML',ROOT),
                      ('savanski-document','WRITERHELPER_SAVANSKI_HTML',ROOT/'script/vendor/keyboard')]:
    raw=(ROOT/'script/js'/f'{name}.js').read_text();prefix='window.'+var+'='
    documents.append((json.loads(raw.split(prefix,1)[1].strip().removesuffix(';')),base.as_uri()+'/'))
for document,base in documents:
    parser=Resources(base);parser.feed(document)
    for ref in parser.refs:
        parsed=urlparse(ref)
        if parsed.scheme=='file':
            target=Path(unquote(parsed.path))
            assert target.is_relative_to(ROOT) and target.is_file(),ref
for file in (ROOT/'style').rglob('*.css'):
    for ref in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)',file.read_text()):
        if not urlparse(ref).scheme and not ref.startswith('#'):
            assert (file.parent/unquote(ref)).resolve().is_file(),(file,ref)
manifest=json.loads((ROOT/'manifest.webmanifest').read_text())
assert manifest['name']=='Aza’raan Writing Studio' and manifest['short_name']=='AWS'
for icon in manifest['icons']:
    file=ROOT/icon['src'];raw=file.read_bytes()
    assert raw[:8]==b'\x89PNG\r\n\x1a\n'
    size=tuple(int.from_bytes(raw[i:i+4],'big') for i in [16,20])
    assert icon['sizes']==f'{size[0]}x{size[1]}'
offline=json.loads((ROOT/'json/offline-assets.json').read_text())
assert "const VERSION='"+offline['version']+"';" in (ROOT/'service-worker.js').read_text()
for ref in offline['static']:
    assert '?' not in ref and '..' not in Path(ref).parts and not ref.endswith('.gs')
    assert (ROOT/ref).is_file(),ref
assert {'script/js/master-navigation.js','style/css/master-navigation.css'}<=set(offline['core'])
for file in (ROOT/'json').glob('*.json'):json.loads(file.read_text())
for file in (ROOT/'script/js').rglob('*.js'):
    subprocess.run(['node','--check',str(file)],check=True,capture_output=True)
print('PASS AWS structure, branding, entry/embedded resources, CSS paths, app icons and offline allowlist')
