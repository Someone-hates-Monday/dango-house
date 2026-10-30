"""Technical crop/scale of generated green-screen reference; no art redrawing."""
from pathlib import Path
from PIL import Image
import numpy as np
import argparse
p=argparse.ArgumentParser();p.add_argument('--name',default='tail-anchor-builtin-v2');args=p.parse_args()
root=Path('test-results/animation-lab/cast-v1/gpt/reference-audit')
im=Image.open(root/(args.name+'.png')).convert('RGB')
a=np.asarray(im).astype(int)
green=(a[:,:,1]>150)&(a[:,:,1]>a[:,:,0]*1.4)&(a[:,:,1]>a[:,:,2]*1.4)
y,x=np.where(~green)
box=(int(x.min()),int(y.min()),int(x.max())+1,int(y.max())+1)
crop=im.crop(box)
scale=468/crop.height
crop=crop.resize((round(crop.width*scale),468),Image.Resampling.LANCZOS)
out=Image.new('RGB',(1280,720),(0,255,0))
out.paste(crop,((1280-crop.width)//2,612-468))
out.save(root/(args.name+'-720.png'))
print({'bounds':box,'output':str(root/(args.name+'-720.png')),'characterHeight':468,'floor':612})
