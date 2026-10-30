"""Build an unblended diagnostic join and endpoint comparisons, not production media."""
from pathlib import Path
import json,subprocess
import imageio_ffmpeg,numpy as np
from PIL import Image,ImageDraw
root=Path('test-results/animation-lab/cast-v1/gpt');out=root/'doubao-recovery-r1'
p2=sorted((root/'pixverse-tail-p2/normalized-rgba').glob('*.png'))[:66]
r1=sorted((out/'normalized-rgba').glob('*.png'))
assert len(p2)==66 and len(r1)==241
frames=p2+r1
p=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-pix_fmt','rgba','-s','640x360','-r','24','-i','pipe:0','-an','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-crf','25','-b:v','0',str(out/'joined-diagnostic.webm')],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
for path in frames:p.stdin.write(Image.open(path).convert('RGBA').resize((640,360),Image.Resampling.LANCZOS).tobytes())
p.stdin.close();assert p.wait()==0
def pixels(path):
 a=np.array(Image.open(path).convert('RGBA'),np.float32)/255
 return np.dstack((a[:,:,:3]*a[:,:,3:],a[:,:,3:]))
a,b=pixels(p2[-1]),pixels(r1[0]);roi=(a[:,:,3]>.05)|(b[:,:,3]>.05)
error=float(np.abs(a[roi]-b[roi]).mean()*255)
samples=[('P2 last / frame65',p2[-1]),('R1 first / frame0',r1[0]),('R1 mid / frame131',r1[131]),('R1 last / frame240',r1[-1])]
sheet=Image.new('RGB',(1280,780),'#302837');draw=ImageDraw.Draw(sheet)
for i,(label,path) in enumerate(samples):
 im=Image.new('RGBA',(1280,720),'#302837');im.alpha_composite(Image.open(path).convert('RGBA'));sheet.paste(im.convert('RGB').resize((640,360)),(i%2*640,i//2*390+30));draw.text((i%2*640+12,i//2*390+8),label,fill='white')
sheet.save(out/'join-check.png')
report={'productionApproved':False,'frames':len(frames),'fps':24,'duration':len(frames)/24,'joinAtSeconds':66/24,'joinPremultipliedRgbaMeanDifference255':error,'method':'direct forward concatenation, no crossfade, reverse, freeze or generated frames','issues':[{'frame':131,'seconds':131/24,'finding':'Tail rises to wing level and opens outward much more than requested.'},{'frame':153,'seconds':153/24,'finding':'Tail extends far sideways; small-sway requirement not met.'}],'limits':['Join error is a diagnostic measure, not a visual pass threshold.','End pose still needs comparison to neutral idle; no production adoption.']}
(out/'visual-review.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report))
