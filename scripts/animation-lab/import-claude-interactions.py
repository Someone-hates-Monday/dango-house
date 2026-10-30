"""Import only the five explicitly named Jimeng trials; never access account data."""
from pathlib import Path
import argparse, json, shutil, hashlib, subprocess, sys
parser=argparse.ArgumentParser()
parser.add_argument('--downloads',default=str(Path.home()/'Downloads'))
parser.add_argument('--process',action='store_true')
args=parser.parse_args()
root=Path('test-results/animation-lab/claude/interactions-v1')
titles={'pat':'摸头回应','affection':'收到喜爱','chat':'被选中私聊','rice':'投喂大米饭','bookmark':'整理书签'}
status=[]
for clip,title in titles.items():
    matches=sorted((p for p in Path(args.downloads).glob('jimeng-*.mp4') if title in p.name),key=lambda p:p.stat().st_mtime,reverse=True)
    folder=root/clip;source=folder/'source.mp4'
    if matches:
        folder.mkdir(parents=True,exist_ok=True)
        if not source.exists() or hashlib.sha256(source.read_bytes()).digest()!=hashlib.sha256(matches[0].read_bytes()).digest():shutil.copy2(matches[0],source)
        mini=clip in ['pat','affection'] and '补拍' not in matches[0].name
        (folder/'generation.json').write_text(json.dumps({'clip':clip,'title':title,'provider':'Jimeng web','model':'Seedance 2.0 mini' if mini else 'Seedance 1.0 Fast','duration':4 if mini else 5,'reference':'original community Claude' if mini else 'approved idle anchor-green.png','creditCost':0 if mini else 10,'sourceFile':matches[0].name,'productionApproved':False},ensure_ascii=False,indent=2),encoding='utf8')
    audit=folder/'audit.json'
    unchanged=source.exists() and audit.exists() and json.loads(audit.read_text())['sourceSha256']==hashlib.sha256(source.read_bytes()).hexdigest()
    if source.exists() and args.process and not unchanged:
        subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],check=True)
    status.append({'clip':clip,'sourceReady':source.exists(),'draftReady':(folder/'draft.webm').exists()})
(root/'import-status.json').write_text(json.dumps(status,indent=2),encoding='utf8')
print(json.dumps(status))
