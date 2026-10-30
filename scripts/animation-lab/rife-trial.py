"""Offline RIFE trial; two RGB passes reconstruct alpha. Never crossfades source limbs."""
from pathlib import Path
import subprocess, argparse, json, time
import numpy as np
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser();parser.add_argument('--characters',nargs='+',default=['claude','grok']);args=parser.parse_args()
base=Path('test-results/animation-lab');tool=Path('.animation-lab/rife/rife-ncnn-vulkan-20221029-windows').resolve()
report=[]
for name in args.characters:
 for action,count,fps in [('walk',33,48),('look',121,30)]:
  folder=base/name/action;start=time.time()
  for bg in ['black','white']:
   out=folder/(bg+'-rife');out.mkdir(exist_ok=True)
   if len(list(out.glob('*.png')))!=count:
    command=[str(tool/'rife-ncnn-vulkan.exe'),'-i',str((folder/bg).resolve()),'-o',str(out.resolve()),'-m',str(tool/'rife-v4.6'),'-n',str(count),'-g','1','-j','1:2:2','-f','%08d.png']
    result=subprocess.run(command,capture_output=True,text=True)
    (folder/(bg+'-rife.log')).write_text(result.stderr,encoding='utf8')
    if result.returncode:raise RuntimeError(result.stderr[-1000:])
  frames=[];output=folder/'rgba-rife';output.mkdir(exist_ok=True)
  for i,(black,white) in enumerate(zip(sorted((folder/'black-rife').glob('*.png')),sorted((folder/'white-rife').glob('*.png')))):
   b=np.asarray(Image.open(black).convert('RGB'),dtype=np.float32)/255
   w=np.asarray(Image.open(white).convert('RGB'),dtype=np.float32)/255
   alpha=np.clip(1-np.median(w-b,axis=2),0,1);alpha[alpha<.018]=0
   rgb=np.clip(b/np.maximum(alpha[...,None],.001),0,1)
   rgba=np.concatenate([rgb,alpha[...,None]],axis=2)
   frame=Image.fromarray((rgba*255).astype('uint8'),'RGBA');frame.save(output/f'{i:08}.png');frames.append(frame)
  # Closed endpoint is excluded from the loop: it is already the following cycle's first frame.
  frames=frames[:-1]
  frames[0].save(folder/'rife-trial.webp',save_all=True,append_images=frames[1:],duration=round(1000/fps),loop=0,lossless=True)
  # Opaque QA preview makes transparent edge artefacts visible in all viewers.
  previews=[]
  for f in frames:
   p=Image.new('RGBA',f.size,'#eee9ef');p.alpha_composite(f);previews.append(p.convert('RGB'))
  previews[0].save(folder/'rife-preview.gif',save_all=True,append_images=previews[1:],duration=round(1000/fps),loop=0)
  strip=Image.new('RGB',(256*8,286),'#eee9ef');d=ImageDraw.Draw(strip)
  for j in range(8):
   i=round(j*(len(frames)-1)/7);strip.paste(previews[i],(j*256,26));d.text((j*256+8,6),f'{name} {action} frame {i}',fill='black')
  strip.save(folder/'rife-contact.png')
  item={'character':name,'action':action,'frames':len(frames),'fps':fps,'seconds':round(time.time()-start,2),'mode':'local RIFE v4.6 GPU 1, separate black/white passes, reconstructed alpha','output':str(folder/'rife-trial.webp')};report.append(item);print(json.dumps(item),flush=True)
(base/'rife-trial-report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
