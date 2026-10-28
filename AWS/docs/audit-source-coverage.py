"""Compare local checkouts with the integrated runtime; no network or backend access."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess

parser=argparse.ArgumentParser()
parser.add_argument('--literaryfriend',required=True,type=Path)
parser.add_argument('--keyboard',required=True,type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
sources=[('Language',root.parent/'Language',root),
         ('LiteraryFriend',args.literaryfriend,root/'script/vendor/LiteraryFriend'),
         ('Keyboard',args.keyboard,root/'script/vendor/keyboard')]
replacements={
    'Language':{'index.html':'script/js/aza-language-document.js'},
    'LiteraryFriend':{'index.html':'index.html','manifest.webmanifest':'manifest.webmanifest',
                     'service-worker.js':'service-worker.js','script/js/backend-bridge.js':'script/js/backend-bridge.js'},
    'Keyboard':{'keyboard.html':'script/js/savanski-document.js','manifest.webmanifest':'manifest.webmanifest',
                'service-worker.js':'service-worker.js','script/backend-client.mjs':'script/js/backend-bridge.js',
                'script/cloud-sync.mjs':'script/js/backend-bridge.js'}
}
report={'scope':'Full frontend source coverage; obsolete standalone entries, PWA owners and cloud transports are integrated replacements.', 'sources':[]}
for name,source,target in sources:
    files=[]
    revision=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
    for file in sorted(source.rglob('*')):
        relative=file.relative_to(source)
        if not file.is_file() or any(part.startswith('.') for part in relative.parts):
            continue
        source_path=relative.as_posix()
        if source_path in replacements[name]:
            destination=root/replacements[name][source_path]
            state='integrated replacement'
        else:
            dest_path=source_path
            if name=='Language':
                if dest_path.startswith('js/'):dest_path='script/js/aza/'+dest_path[3:]
                elif dest_path.startswith('css/'):dest_path='style/css/aza/'+dest_path[4:]
            destination=target/dest_path
            state='identical' if destination.exists() and file.read_bytes()==destination.read_bytes() else 'adapted'
        if not destination.is_file():raise SystemExit(f'Missing source coverage: {name}/{source_path}')
        files.append({'source':source_path,'destination':destination.relative_to(root).as_posix(),
                      'status':state,'sourceSHA256':hashlib.sha256(file.read_bytes()).hexdigest()})
    counts={label:sum(f['status']==label for f in files) for label in ['identical','adapted','integrated replacement']}
    report['sources'].append({'name':name,'revision':revision,'fileCount':len(files),'counts':counts,'files':files})
    print(name,len(files),counts)
report['missing']=[]
(root/'docs/SOURCE_COVERAGE.json').write_text(json.dumps(report,indent=2)+'\n')
