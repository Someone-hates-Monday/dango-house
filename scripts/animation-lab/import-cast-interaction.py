"""Import an explicitly identified trial, preserving source and review boundaries."""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,sys
import cv2
p=argparse.ArgumentParser()
p.add_argument('--job',required=True)
p.add_argument('--source',required=True,type=Path)
p.add_argument('--process',action='store_true')
a=p.parse_args()
manifest=Path('test-results/animation-lab/cast-interactions-v1/jobs.json')
data=json.loads(manifest.read_text(encoding='utf8'))
job=next((j for j in data['jobs'] if j['id']==a.job),None)
if not job: raise SystemExit('Unknown job; use the prepared manifest id.')
if job['status']=='already-shipped-p1': raise SystemExit('Approved P1 is immutable here; use a new job version.')
if not a.source.is_file(): raise SystemExit('Source file is missing.')
cap=cv2.VideoCapture(str(a.source));fps=cap.get(cv2.CAP_PROP_FPS);count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));w=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));h=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT));ok,_=cap.read();cap.release()
if not ok or w<640 or h<360 or not 4<=count/max(fps,1)<=16: raise SystemExit('Unexpected/unreadable video; verify selected export.')
if abs(fps-24)>.02: raise SystemExit('Audit encoder currently requires 24fps; do not silently change source timing.')
digest=hashlib.sha256(a.source.read_bytes()).hexdigest();folder=Path(job['folder']);folder.mkdir(parents=True,exist_ok=True);target=folder/'source.mp4'
if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()!=digest: raise SystemExit('Different source exists; create a versioned job instead of overwriting.')
if a.source.resolve()!=target.resolve(): shutil.copy2(a.source,target)
generation={'jobId':job['id'],'title':job['title'],'character':job['character'],'action':job['action'],'reference':job['reference'],'prompt':job.get('submittedPrompt',job['prompt']),'sourceFile':a.source.name,'sourceSha256':digest,'frames':count,'fps':fps,'duration':count/fps,'width':w,'height':h,'productionApproved':False,'originalExportPreserved':True}
(folder/'generation.json').write_text(json.dumps(generation,ensure_ascii=False,indent=2),encoding='utf8')
job.update(status='source-imported',sourceSha256=digest)
(folder/'import-status.json').write_text(json.dumps({'status':job['status'],'sourceSha256':digest}),encoding='utf8')
if a.process:
 subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],check=True)
 job['status']='awaiting-visual-review'
 (folder/'import-status.json').write_text(json.dumps({'status':job['status'],'sourceSha256':digest}),encoding='utf8')
print(json.dumps({'job':job['id'],'status':job['status'],'sourceFrames':count,'duration':count/fps,'productionApproved':False}))
