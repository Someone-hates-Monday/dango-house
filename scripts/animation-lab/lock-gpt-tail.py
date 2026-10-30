"""Video compositing: retain the intact source-frame tail; never redraw character art."""
from pathlib import Path
import json,subprocess
import numpy as np,cv2,imageio_ffmpeg
from PIL import Image,ImageDraw
folder=Path('test-results/animation-lab/cast-v1/gpt/doubao-pat-v3')
audit=json.loads((folder/'audit.json').read_text());src=sorted((folder/'normalized-rgba').glob('*.png'))
reference=np.array(Image.open(src[0]).convert('RGBA'));h,w=reference.shape[:2]
# The tail is behind the right hair/wing edge. Freeze that small occluding edge
# with the tail, preserving the open/close eye, bow, hands and torso animation.
polygon=np.array([(748,450),(780,430),(815,435),(850,420),(935,390),(955,650),(700,650),(710,590),(734,575),(760,560),(780,540),(780,520),(770,500),(748,482)],np.float32)
polygon=polygon*audit['scale']+np.array(audit['offset']);polygon=np.round(polygon).astype(np.int32)
region=np.zeros((h,w),np.uint8);cv2.fillPoly(region,[polygon],1)
weight=np.clip(cv2.distanceTransform(region,cv2.DIST_L2,5)/6,0,1)[:,:,None]
ref=reference.astype(np.float32)/255;refp=np.dstack((ref[:,:,:3]*ref[:,:,3:],ref[:,:,3:]))
out=folder/'tail-locked-rgba';out.mkdir(exist_ok=True);outside_max=0;core_max=0;contacts=[];tail_pixels=[]
for i,path in enumerate(src):
    original=np.array(Image.open(path).convert('RGBA'));a=original.astype(np.float32)/255
    premul=np.dstack((a[:,:,:3]*a[:,:,3:],a[:,:,3:]))
    mixed=premul*(1-weight)+refp*weight
    rgba=np.dstack((np.divide(mixed[:,:,:3],mixed[:,:,3:],out=np.zeros_like(mixed[:,:,:3]),where=mixed[:,:,3:]>0),mixed[:,:,3:]))
    result=np.round(np.clip(rgba,0,1)*255).astype(np.uint8)
    # Exact unchanged pixels outside the mask (including transparent RGB).
    result[region==0]=original[region==0]
    core=weight[:,:,0]>=1;result[core]=reference[core]
    outside_max=max(outside_max,int(np.abs(result[region==0].astype(int)-original[region==0]).max()))
    core_max=max(core_max,int(np.abs(result[core].astype(int)-reference[core]).max()))
    im=Image.fromarray(result);im.save(out/f'{i:08}.png')
    if i in [0,65,109,130,152,196,240]:contacts.append((i,Image.fromarray(original),im))
sheet=Image.new('RGB',(1120,len(contacts)*210),'#e8dfea');draw=ImageDraw.Draw(sheet)
for row,(i,before,after) in enumerate(contacts):
    for col,(im,label) in enumerate([(before,'generated'),(after,'tail locked')]):
        comp=Image.new('RGBA',(w,h),'#2c2634');comp.alpha_composite(im)
        sheet.paste(comp.convert('RGB').resize((320,180)),(col*560,row*210+25))
        crop=comp.crop((690,380,950,650)).resize((180,187));sheet.paste(crop.convert('RGB'),(col*560+340,row*210+22))
        draw.text((col*560+8,row*210+4),f'{label} / frame {i}',fill='black')
sheet.save(folder/'tail-repair-contact.png')
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
r=subprocess.run([ffmpeg,'-y','-framerate','24','-i',str(out/'%08d.png'),'-vf','scale=640:360','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-b:v','0','-crf','24','-an',str(folder/'tail-locked.webm')],capture_output=True,text=True)
assert r.returncode==0,r.stderr[-1000:]
report={'method':'reference-frame video compositing with continuous 6 px inner feather','referenceFrame':0,'frames':len(src),'duration':len(src)/24,'maskPolygon':polygon.tolist(),'outsideMaskMaxRgbaDifference':outside_max,'lockedCoreMaxRgbaDifference':core_max,'newDrawnPixels':False,'tailMotion':'fixed original geometry; local lower hair/wing edge also fixed for occlusion','productionApproved':False}
(folder/'tail-repair.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report))
