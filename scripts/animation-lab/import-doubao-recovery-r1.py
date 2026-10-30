"""Import one explicitly downloaded recovery trial; never overwrite production."""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,sys
import cv2
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=Path.home()/'Downloads'/'gpt-recovery-r1.mp4');p.add_argument('--process',action='store_true');a=p.parse_args()
if not a.source.is_file():
    print(json.dumps({'ready':False,'expected':str(a.source)}));sys.exit(0)
c=cv2.VideoCapture(str(a.source));fps=c.get(cv2.CAP_PROP_FPS);n=c.get(cv2.CAP_PROP_FRAME_COUNT);w=int(c.get(cv2.CAP_PROP_FRAME_WIDTH));h=int(c.get(cv2.CAP_PROP_FRAME_HEIGHT));c.release()
if fps<=0 or (w,h)!=(1280,720) or not 9.5<n/fps<10.6:raise SystemExit('Unexpected R1 dimensions/duration; verify the downloaded trial.')
folder=Path('test-results/animation-lab/cast-v1/gpt/doubao-recovery-r1');folder.mkdir(parents=True,exist_ok=True);target=folder/'source.mp4';sha=hashlib.sha256(a.source.read_bytes()).hexdigest()
if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()!=sha:raise SystemExit('Different R1 original already exists; preserve it.')
if target.resolve()!=a.source.resolve():shutil.copy2(a.source,target)
(folder/'generation.json').write_text(json.dumps({'character':'gpt','action':'release-happy-recover','provider':'Doubao web','model':'Seedance 2.0 Mini','width':w,'height':h,'fps':fps,'seconds':n/fps,'sourceSha256':sha,'references':['pixverse-tail-p2/recovery-start.png','reference-audit/tail-anchor-builtin-v2-720.png'],'referenceMode':'two ordinary references; hard endpoint control not confirmed','prompt':'docs/animation-lab/gpt-doubao-recovery-r1-prompt.txt','productionApproved':False,'mustCheck':['tail stays low throughout','tail does not reverse root/tip','start joins P2 frame65','end joins neutral idle','body proportions and clothing do not drift']},ensure_ascii=False,indent=2),encoding='utf8')
if a.process:subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],check=True)
print(json.dumps({'ready':True,'folder':str(folder),'productionApproved':False}))
