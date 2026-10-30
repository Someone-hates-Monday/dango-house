from PIL import Image
for name in ['claude','grok']:
    im=Image.open('public/animated/'+name+'.webp').convert('RGBA')
    for row in [3,6,7,8]:
        for col in range(6):
            a=im.crop((col*192,row*208,(col+1)*192,(row+1)*208)).getchannel('A')
            bounds=[]
            for y in range(208):
                pixels=[x for x in range(192) if a.getpixel((x,y))>80]
                bounds.append((min(pixels),max(pixels)) if pixels else (-1,-1))
            runs=[]
            for side in [0,1]:
                best=0;last=-1;n=0;at=0
                for y,b in enumerate(bounds):
                    v=b[side]
                    if v>=0 and v==last:n+=1
                    else:n=1
                    if n>best:best=n;at=v
                    last=v
                runs.append((best,at))
            print(name,row,col,runs)
