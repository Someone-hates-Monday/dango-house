"""Deterministic matting/normalization of a user-approved video trial; no art generation."""
from pathlib import Path
import json, subprocess, hashlib, argparse
import cv2, numpy as np, imageio_ffmpeg
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser()
parser.add_argument('--folder',default='test-results/animation-lab/claude/jimeng-idle-v1')
parser.add_argument('--gesture',action='store_true',help='Preserve the entire reaction, including preparation and recovery')
parser.add_argument('--ping-pong',action='store_true',help='Idle-only forward/reverse loop; never use for narrative gestures')
args=parser.parse_args()
folder=Path(args.folder)
capture=cv2.VideoCapture(str(folder/'source.mp4'))
source_fps=capture.get(cv2.CAP_PROP_FPS)
rgb_frames=[]
while True:
    ok,bgr=capture.read()
    if not ok: break
    rgb_frames.append(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))
capture.release()
assert rgb_frames

def smooth(x):
    t=np.clip(x,0,1)
    return t*t*(3-2*t)

mattes=[];bounds=[]
for rgb8 in rgb_frames:
    rgb=rgb8.astype(np.float32)/255
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
    hue,saturation,value=hsv[:,:,0],hsv[:,:,1],hsv[:,:,2]
    green=smooth((hue-64)/6)*(1-smooth((hue-170)/6))*smooth((saturation-.10)/.05)*smooth((value-.10)/.05)
    alpha=1-green
    n,labels,stats,_=cv2.connectedComponentsWithStats((alpha>.6).astype(np.uint8),8)
    assert n>1
    main=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
    body=(labels==main).astype(np.uint8)
    ys,xs=np.where(body)
    bounds.append([int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)])
    # Isolate the character cutout. The original export, including its labels,
    # remains source.mp4; the comparison page explicitly labels this AI-derived.
    keep=body.copy()
    if args.gesture:
        # Preserve nearby disconnected props such as a spoon, bowl or bookmark.
        for component in range(1,n):
            x,y,w,h,area=stats[component]
            if area>=48 and x+w>xs.min()-100 and x<xs.max()+100 and y+h>ys.min()-100 and y<ys.max()+100:
                keep[labels==component]=1
    alpha*=cv2.dilate(keep,np.ones((5,5),np.uint8))
    alpha[alpha<.01]=0
    background=np.median(rgb[:12].reshape(-1,3),axis=0)
    foreground=np.clip((rgb-(1-alpha[:,:,None])*background)/np.maximum(alpha[:,:,None],.001),0,1)
    rgba=np.dstack((foreground,alpha))
    mattes.append(Image.fromarray(np.round(rgba*255).astype(np.uint8)))

b=np.array(bounds);heights=b[:,3]-b[:,1];widths=b[:,2]-b[:,0]
anchor=b[:max(1,round(source_fps*.25))] if args.gesture else b
scale=min(468/np.median(anchor[:,3]-anchor[:,1]),1024/(b[:,2].max()-b[:,0].min()))
center=float(np.median((anchor[:,0]+anchor[:,2])/2));floor=float(np.median(anchor[:,3]))
offset=(round(640-center*scale),round(612-floor*scale))
normalized=[]
for frame in mattes:
    layer=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(1280,720));canvas.alpha_composite(layer,offset)
    normalized.append(canvas)

def pixels(im):
    a=np.asarray(im.resize((320,180)),np.float32)/255
    return np.dstack((a[:,:,:3]*a[:,:,3:],a[:,:,3:]))

small=[pixels(im) for im in normalized]
def difference(a,b):
    region=(a[:,:,3]>.05)|(b[:,:,3]>.05)
    return float(np.abs(a[region]-b[region]).mean()*255)

adjacent=[difference(a,b) for a,b in zip(small,small[1:])]
candidates=[]
for start in range(min(13,len(small))):
    for end in range(max(start+72,len(small)-14),len(small)):
        candidates.append((difference(small[start],small[end]),start,end))
score,start,end=(difference(small[0],small[-1]),0,len(small)-1) if args.gesture else min(candidates)
selected=normalized[start:end+1]
if args.ping_pong:
    assert not args.gesture,'Narrative gestures cannot be reversed'
    selected=selected+selected[-2::-1]
raw_seam=difference(small[0],small[-1])
rgba_dir=folder/'normalized-rgba';rgba_dir.mkdir(exist_ok=True)
for i,im in enumerate(selected): im.save(rgba_dir/f'{i:08}.png')

# Contact sheets preserve full framing and inspect opacity over both backgrounds.
sheet=Image.new('RGB',(1280,6*205),'#eee8ef');draw=ImageDraw.Draw(sheet)
for row,bg in enumerate(['#f8eaf2','#282333']):
    for j,i in enumerate(np.linspace(0,len(selected)-1,12).round().astype(int)):
        x=j%4*320;y=(row*3+j//4)*205
        comp=Image.new('RGBA',(1280,720),bg);comp.alpha_composite(selected[i])
        sheet.paste(comp.convert('RGB').resize((320,180)),(x,y+25))
        draw.text((x+6,y+6),f'{bg} / source frame {i+start}',fill='black')
sheet.save(folder/'contact-alpha.png')

ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
result=subprocess.run([ffmpeg,'-y','-framerate','24','-i',str(rgba_dir/'%08d.png'),'-vf','scale=640:360','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-b:v','0','-crf','24','-an',str(folder/'draft.webm')],capture_output=True,text=True)
assert result.returncode==0,result.stderr[-2000:]
previews=[im.resize((640,360),Image.Resampling.LANCZOS) for im in selected]
previews[0].save(folder/'draft.webp',save_all=True,append_images=previews[1:],duration=42,loop=0,lossless=True)
report={
    'sourceSha256':hashlib.sha256((folder/'source.mp4').read_bytes()).hexdigest(),
    'sourceFrames':len(rgb_frames),'sourceFps':source_fps,'outputFps':24,
    'sourceBodyWidthRange':[int(widths.min()),int(widths.max())],
    'sourceBodyHeightRange':[int(heights.min()),int(heights.max())],
    'sourceFootRange':[int(b[:,3].min()),int(b[:,3].max())],
    'scale':float(scale),'offset':offset,'selectedSourceFrames':[start,end],
    'outputFrames':len(selected),'outputDuration':len(selected)/24,
    'seamRgbaMeanDifference255':0 if args.ping_pong else score,'forwardSeamDifference255':score,'originalSeamDifference255':raw_seam,
    'medianAdjacentDifference255':float(np.median(adjacent)),
    'normalizedContactRange':[float(612+(b[:,3].min()-floor)*scale),float(612+(b[:,3].max()-floor)*scale)],
    'backgroundAsRequested':False,'approved':False,'gestureFullDuration':args.gesture,'idlePingPong':args.ping_pong,
    'sourceTouchesFrame':bool(np.any(b[:,0]<=2) or np.any(b[:,1]<=2) or np.any(b[:,2]>=rgb_frames[0].shape[1]-2) or np.any(b[:,3]>=rgb_frames[0].shape[0]-2)),
    'note':'Character-only AI-generated draft; full original export retained. Frame-window selection uses no morphing, crossfade or generated in-between frames. Visual motion, pale edges and seam still require review.'
}
(folder/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
