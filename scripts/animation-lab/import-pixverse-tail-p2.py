"""Import the low-motion P2 trial, preserving full forward action and the source."""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,sys
import cv2
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=Path.home()/'Downloads'/'gpt-tail-p2.mp4');p.add_argument('--process',action='store_true');a=p.parse_args()
if not a.source.is_file():
    matches=list((Path.home()/'Downloads').glob('PixVerse*P2*.mp4'))
    if len(matches)==1:a.source=matches[0]
    elif len(matches)>1:raise SystemExit('Multiple P2 downloads; pass --source explicitly.')
    else:
        print(json.dumps({'ready':False,'expected':str(a.source)}));sys.exit(0)
cap=cv2.VideoCapture(str(a.source));fps=cap.get(cv2.CAP_PROP_FPS);n=cap.get(cv2.CAP_PROP_FRAME_COUNT);w=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));h=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT));cap.release()
if fps<=0 or (w,h)!=(1024,576) or not 4.5<n/fps<5.6:raise SystemExit('Unexpected P2 dimensions/duration; verify selected original (540P UI, actual 1024x576).')
folder=Path('test-results/animation-lab/cast-v1/gpt/pixverse-tail-p2');folder.mkdir(parents=True,exist_ok=True);target=folder/'source.mp4';sha=hashlib.sha256(a.source.read_bytes()).hexdigest()
if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()!=sha:raise SystemExit('Different P2 source exists; use a new trial folder instead of overwriting.')
if target.resolve()!=a.source.resolve():shutil.copy2(a.source,target)
(folder/'generation.json').write_text(json.dumps({'character':'gpt','action':'low-shy-tail-gather','provider':'PixVerse web','model':'PixVerse V6','inputMode':'first-last-frame','credits':30,'audio':False,'width':w,'height':h,'fps':fps,'seconds':n/fps,'references':['reference-audit/tail-anchor-builtin-v2-720.png','reference-audit/keyframe-shy-v1-720.png'],'prompt':'docs/animation-lab/gpt-pixverse-p2-prompt.txt','sourceSha256':sha,'productionApproved':False,'originalExportPreserved':True},ensure_ascii=False,indent=2),encoding='utf8')
if a.process:subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],check=True)
print(json.dumps({'ready':True,'folder':str(folder),'productionApproved':False}))
