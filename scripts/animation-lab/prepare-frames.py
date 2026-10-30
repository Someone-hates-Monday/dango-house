from PIL import Image, ImageChops
from pathlib import Path
import json

root=Path('test-results/animation-lab')
for name in ['claude','grok','gpt','gemini','kimi']:
    sheet=Image.open(f'public/animated/{name}.webp').convert('RGBA')
    sequences={'walk':[(1,i) for i in range(8)]+[(1,0)],'look':[(0,0)]+[(9,i) for i in [1,2,3,4,5,4,3,2,1]]+[(0,0)]}
    for action,cells in sequences.items():
        source=root/name/action/'source';source.mkdir(parents=True,exist_ok=True)
        for i,(r,c) in enumerate(cells):
            frame=sheet.crop((c*192,r*208,(c+1)*192,(r+1)*208))
            canvas=Image.new('RGBA',(256,256));canvas.alpha_composite(frame,(32,24))
            canvas.save(source/f'{i:08}.png')
            # Two backgrounds allow recovering foreground alpha after RGB-only interpolation.
            for bg,color in [('black',(0,0,0)),('white',(255,255,255))]:
                folder=root/name/action/bg;folder.mkdir(parents=True,exist_ok=True)
                rgb=Image.new('RGBA',canvas.size,color+(255,));rgb.alpha_composite(canvas);rgb.convert('RGB').save(folder/f'{i:08}.png')
print('Prepared five original-source walk and look sequences, with closed endpoints and two alpha passes.')
