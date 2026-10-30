from PIL import Image
from pathlib import Path
counts = [6,8,8,4,5,8,6,6,6]
for path in Path('public/animated').glob('*.webp'):
    im = Image.open(path).convert('RGBA')
    print(path.name, im.size)
    for row,count in enumerate(counts):
        problems=[]
        for col in range(count):
            a=im.crop((col*192,row*208,(col+1)*192,(row+1)*208)).getchannel('A')
            box=a.point(lambda p:255 if p>50 else 0).getbbox()
            if box and (box[0]<2 or box[2]>190 or box[1]<2 or box[3]>206):
                problems.append((col,box))
        if problems: print(' edge contact row',row,problems)
