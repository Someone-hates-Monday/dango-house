import time,json
from pathlib import Path
import av
from PIL import Image,ImageDraw
out=Path('test-results/cg-lab/rin-xia-v1')
print('Waiting for local generated MP4 for frame audit',flush=True)
while not (out/'raw.mp4').exists():time.sleep(5)
container=av.open(str(out/'raw.mp4'));stream=container.streams.video[0];fps=float(stream.average_rate);frames=[f.to_image() for f in container.decode(video=0)];container.close()
indices=[round(i*(len(frames)-1)/8) for i in range(9)]
canvas=Image.new('RGB',(1248,792),'#f3eaf2');d=ImageDraw.Draw(canvas)
for k,i in enumerate(indices):
 frame=frames[i];frame.save(out/f'qa-frame-{i:03}.png');thumb=frame.resize((416,240),Image.Resampling.LANCZOS);x=k%3*416;y=k//3*264;canvas.paste(thumb,(x,y));d.text((x+10,y+243),f'frame {i} / {i/fps:.2f}s',fill='#5d455e')
canvas.save(out/'contact-sheet.png');data={'frames':len(frames),'fps':fps,'seconds':len(frames)/fps,'width':frames[0].width,'height':frames[0].height,'samples':indices,'approved':False,'note':'Contact sheet prepared; visual review still required.'};(out/'decode-audit.json').write_text(json.dumps(data,indent=2),encoding='utf8');print(json.dumps(data),flush=True)
