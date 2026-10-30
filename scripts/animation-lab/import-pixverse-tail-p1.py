"""Import the explicitly downloaded P1 trial without modifying production assets."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, sys
import cv2

p=argparse.ArgumentParser()
p.add_argument('--source',type=Path,default=Path.home()/'Downloads'/'gpt-tail-p1.mp4')
p.add_argument('--process',action='store_true')
a=p.parse_args()
if not a.source.is_file():
    print(json.dumps({'ready':False,'expected':str(a.source)}));sys.exit(0)
cap=cv2.VideoCapture(str(a.source))
fps=cap.get(cv2.CAP_PROP_FPS);count=cap.get(cv2.CAP_PROP_FRAME_COUNT)
width=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));height=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT));cap.release()
if fps<=0 or width!=1280 or height!=720 or not 4.5<count/fps<5.6:
    raise SystemExit('Unexpected P1 media dimensions/duration; check selected download before import.')
folder=Path('test-results/animation-lab/cast-v1/gpt/pixverse-tail-p1')
folder.mkdir(parents=True,exist_ok=True)
target=folder/'source.mp4'
digest=hashlib.sha256(a.source.read_bytes()).hexdigest()
if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()!=digest:
    raise SystemExit('P1 already has a different source; preserve it and create a versioned trial instead.')
if a.source.resolve()!=target.resolve():shutil.copy2(a.source,target)
(folder/'generation.json').write_text(json.dumps({
    'character':'gpt','action':'shy-tail-gather','provider':'PixVerse web',
    'model':'PixVerse V6','seconds':count/fps,'fps':fps,'width':width,'height':height,
    'credits':40,'audio':False,'inputMode':'first-last-frame',
    'references':['reference-audit/tail-anchor-builtin-v2-720.png','reference-audit/keyframe-shy-v1-720.png'],
    'prompt':'docs/animation-lab/gpt-pixverse-p1-prompt.txt','sourceSha256':digest,
    'productionApproved':False,'originalExportPreserved':True,
    'note':'Technical cutout excludes background and export labels; source.mp4 remains untouched. Visual movement review still required.'
},ensure_ascii=False,indent=2),encoding='utf8')
if a.process:
    subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],check=True)
print(json.dumps({'ready':True,'folder':str(folder),'productionApproved':False}))
