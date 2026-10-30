from PIL import Image
import json
for f in json.load(open('test-results/selected-frames.json')):
    im=Image.open('public/animated/'+f['file']+'.webp').convert('RGBA')
    a=im.crop((f['column']*192,f['row']*208,(f['column']+1)*192,(f['row']+1)*208)).getchannel('A')
    bounds=[]
    for y in range(208):
        xs=[x for x in range(192) if a.getpixel((x,y))>80]
        bounds.append((min(xs),max(xs)) if xs else (-1,-1))
    longest=0
    for side in [0,1]:
        last=-1;n=0
        for b in bounds:
            v=b[side];n=n+1 if v>=0 and v==last else 1;longest=max(n,longest);last=v
    if longest>24: print(f,longest)
