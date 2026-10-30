"""Extract only the existing forward gathering phase; never freeze or reverse frames."""
from pathlib import Path
import json,subprocess
import imageio_ffmpeg
folder=Path('test-results/animation-lab/cast-v1/gpt/pixverse-tail-p2')
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ffmpeg,'-y','-framerate','24','-i',str(folder/'normalized-rgba/%08d.png'),'-frames:v','66','-vf','scale=640:360','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-crf','25','-b:v','0',str(folder/'gather-candidate.webm')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
(folder/'visual-review.json').write_text(json.dumps({
 'productionApproved':False,'fullTrialStatus':'needs-motion-revision',
 'sourceFrames':121,'fullDuration':121/24,
 'reviewedEvidence':['contact-alpha.png','normalized-rgba/00000065.png','normalized-rgba/00000098.png'],
 'findings':['Low gathering motion is visible in the first phase.','Late tail swing rises outward again; frame 98 at 4.083s is clear evidence.','Entire five-second trial does not satisfy low-motion constraint.'],
 'candidate':{'path':'gather-candidate.webm','sourceFramesInclusive':[0,65],'frames':66,'fps':24,'duration':66/24,'method':'forward prefix of original normalized frames; no invented frames, freeze, reverse, or crossfade','status':'candidate only, requires viewing','missing':['release/uncoil','happy gentle sway','recovery to neutral']}
},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'candidateFrames':66,'duration':2.75,'productionApproved':False}))
