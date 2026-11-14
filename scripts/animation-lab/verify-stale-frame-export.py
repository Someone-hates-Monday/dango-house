from pathlib import Path
import subprocess,json,time,sys
import imageio_ffmpeg,cv2
from PIL import Image
folder=Path('test-results')/('jimeng-stale-tail-regression-'+str(time.time_ns()));folder.mkdir(parents=True)
ff=imageio_ffmpeg.get_ffmpeg_exe()
r=subprocess.run([ff,'-y','-f','lavfi','-i','color=c=0xf8eaf2:s=1280x720:r=24','-vf','drawbox=x=500:y=200:w=240:h=400:color=blue:t=fill','-frames:v','8','-c:v','libx264','-pix_fmt','yuv420p',str(folder/'source.mp4')],capture_output=True)
assert r.returncode==0,r.stderr[-1000:]
frames=folder/'normalized-rgba';frames.mkdir();Image.new('RGBA',(1280,720),'red').save(frames/'00000008.png')
r=subprocess.run([sys.executable,'scripts/animation-lab/audit-jimeng.py','--folder',str(folder),'--gesture'],capture_output=True,text=True)
assert r.returncode==0,r.stderr[-2000:]
capture=cv2.VideoCapture(str(folder/'draft.webm'));count=0
while capture.read()[0]:count+=1
capture.release()
assert count==8,count
assert not (frames/'00000008.png').exists()
assert len(list((folder/'stale-frame-archive').glob('*/00000008.png')))==1
print(json.dumps({'pipelineRegressionPassed':True,'actualDecodedFrames':count,'staleFrameArchived':True,'folder':str(folder)}))
