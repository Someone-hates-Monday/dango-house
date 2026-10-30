"""Import the user-downloaded tail-correction trial and preserve its complete action."""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('--source');p.add_argument('--version',type=int,choices=[2,3,4,5],default=3);p.add_argument('--process',action='store_true');a=p.parse_args()
source=Path(a.source) if a.source else Path.home()/'Downloads'/f'gpt-pat-v{a.version}.mp4'
if not source.is_file():
    print(json.dumps({'ready':False,'expected':str(source)}));sys.exit(0)
folder=Path(f'test-results/animation-lab/cast-v1/gpt/doubao-pat-v{a.version}');folder.mkdir(parents=True,exist_ok=True)
target=folder/'source.mp4'
if source.resolve()!=target.resolve():shutil.copy2(source,target)
reference={2:'tail-detail.png',3:'tail-direction.png',4:'tail-structure-builtin-v1.png',5:'tail-anchor-builtin-v2-720.png'}[a.version]
references=['test-results/animation-lab/cast-v1/gpt/reference-audit/'+reference]
roles=['single generated near-original-pose first frame']
if a.version!=5:
    references.insert(0,'test-results/animation-lab/cast-v1/gpt/anchor.png')
    roles=['original appearance, proportions, composition and first frame','supporting tail structure only; not a final frame or costume reference']
(folder/'generation.json').write_text(json.dumps({'character':'gpt','action':'pat','version':a.version,'provider':'Doubao web','model':'Seedance 2.0 Mini','requestedSeconds':10,'references':references,'referenceRoles':roles,'tailRule':'Thick upper root is body-side and occluded; tail curves right-down and then left along the bottom to its own thin lower tip. Never reverse root and tip. No attached endpoint ornament.','sourceSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'productionApproved':False},indent=2),encoding='utf8')
if a.process:subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],check=True)
print(json.dumps({'ready':True,'folder':str(folder),'productionApproved':False}))
