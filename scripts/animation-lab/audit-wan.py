"""Make inspectable contact sheets and removable-background drafts; never auto-approves art."""
from pathlib import Path
import argparse,json,subprocess
from PIL import Image,ImageDraw
import numpy as np,cv2,imageio_ffmpeg
parser=argparse.ArgumentParser();parser.add_argument('action',choices=['look','walk']);parser.add_argument('--take',type=int,default=1);args=parser.parse_args()
folder=Path('test-results/animation-lab/claude')/('wan-'+args.action+(f'-v{args.take}' if args.take>1 else ''))
files=sorted((folder/'frames').glob('*.png'));assert files,'No generated frames'
out=folder/'rgba';out.mkdir(exist_ok=True);bounds=[];frames=[]
def smooth(v):
 t=np.clip(v,0,1);return t*t*(3-2*t)
for i,p in enumerate(files):
 rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255
 r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
 score=(g-np.maximum(r,b))/np.maximum(g,.01)
 alpha=1-smooth((score-.065)/.25)
 binary=(alpha>.5).astype('uint8');n,labels,stats,_=cv2.connectedComponentsWithStats(binary,8)
 keep=np.zeros_like(binary)
 for j in range(1,n):
  if stats[j,cv2.CC_STAT_AREA]>60:keep[labels==j]=1
 nearby=cv2.dilate(keep,np.ones((5,5),np.uint8));alpha*=nearby
 alpha=cv2.GaussianBlur(alpha,(3,3),.5);alpha[alpha<.015]=0
 bg=np.median(np.concatenate([rgb[:8].reshape(-1,3),rgb[-8:].reshape(-1,3)]),axis=0)
 foreground=np.clip((rgb-(1-alpha[:,:,None])*bg)/np.maximum(alpha[:,:,None],.001),0,1)
 rgba=np.concatenate([foreground,alpha[:,:,None]],axis=2)
 image=Image.fromarray(np.round(rgba*255).astype('uint8'));image.save(out/f'{i:08}.png');frames.append(image)
 ys,xs=np.where(alpha>.1);bounds.append([int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())])
contact=Image.new('RGB',(4*256,3*282),'#eee9ef');draw=ImageDraw.Draw(contact)
raw=Image.new('RGB',contact.size,'#eee9ef');rawdraw=ImageDraw.Draw(raw)
for j in range(12):
 i=round(j*(len(files)-1)/11);x=(j%4)*256;y=(j//4)*282
 comp=Image.new('RGBA',(512,512),'#eee9ef');comp.alpha_composite(frames[i]);contact.paste(comp.convert('RGB').resize((256,256)),(x,y+24));draw.text((x+8,y+5),f'{i/24:.2f}s / frame {i}',fill='black')
 raw.paste(Image.open(files[i]).resize((256,256)),(x,y+24));rawdraw.text((x+8,y+5),f'{i/24:.2f}s / frame {i}',fill='black')
contact.save(folder/'contact-alpha.png');raw.save(folder/'contact-raw.png')
frames[0].save(folder/'draft.webp',save_all=True,append_images=frames[1:],duration=42,loop=0,lossless=True)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
result=subprocess.run([ffmpeg,'-y','-framerate','24','-i',str(out/'%08d.png'),'-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-b:v','0','-crf','24','-an',str(folder/'draft.webm')],capture_output=True,text=True)
assert result.returncode==0,result.stderr[-1000:]
widths=[b[2]-b[0] for b in bounds];heights=[b[3]-b[1] for b in bounds]
report={'frames':len(frames),'widthRange':[min(widths),max(widths)],'heightRange':[min(heights),max(heights)],'bounds':bounds,'approved':False,'note':'Needs visual identity, motion and loop inspection; chroma removal is a draft, not a quality pass.'}
(folder/'audit.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='bounds'}))
