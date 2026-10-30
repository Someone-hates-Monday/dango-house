from pathlib import Path
from PIL import Image
import imageio_ffmpeg,subprocess,json
base=Path('test-results/animation-lab');ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
for name in ['claude','grok']:
 for action,fps in [('walk',48),('look',30)]:
  folder=base/name/action;files=sorted((folder/'rgba-rife').glob('*.png'));out=folder/'rife-trial.webm'
  result=subprocess.run([ffmpeg,'-y','-framerate',str(fps),'-i',str(folder/'rgba-rife/%08d.png'),'-frames:v',str(len(files)-1),'-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-b:v','0','-crf','24','-an',str(out)],capture_output=True,text=True)
  if result.returncode:raise RuntimeError(result.stderr[-1000:])
  print(name,action,out.stat().st_size)
