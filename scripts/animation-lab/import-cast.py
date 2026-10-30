"""Import explicitly named five-character Jimeng idle trials for visual acceptance."""
from pathlib import Path
import argparse,json,shutil,hashlib,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('--process',action='store_true');args=p.parse_args()
recipe=json.loads(Path('docs/animation-lab/cast-v1.json').read_text(encoding='utf8'))
root=Path('test-results/animation-lab/cast-v1');statuses=[]
for c in recipe['characters']:
    folder=root/c['file'];source=folder/'source.mp4'
    matches=sorted((f for f in (Path.home()/'Downloads').glob('jimeng-*.mp4') if c['name']+'待机V1' in f.name),key=lambda f:f.stat().st_mtime,reverse=True)
    if matches:
        shutil.copy2(matches[0],source)
        (folder/'generation.json').write_text(json.dumps({'character':c['file'],'sourceFile':matches[0].name,'model':recipe['settings']['model'],'seconds':5,'credits':10,'prompt':c['name']+'待机V1。'+recipe['shared']+c['idle'],'reference':str(folder/'anchor.png'),'productionApproved':False},ensure_ascii=False,indent=2),encoding='utf8')
    audit=folder/'audit.json';same=source.exists() and audit.exists() and json.loads(audit.read_text())['sourceSha256']==hashlib.sha256(source.read_bytes()).hexdigest()
    if args.process and source.exists() and not same:subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder)],check=True)
    statuses.append({'character':c['file'],'sourceReady':source.exists(),'draftReady':(folder/'draft.webm').exists(),'productionApproved':False})
(root/'status.json').write_text(json.dumps(statuses,indent=2),encoding='utf8');print(json.dumps(statuses))
