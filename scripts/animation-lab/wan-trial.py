"""Local, offline image-to-video trial using the pinned official Wan implementation."""
import sys,os,json,time,argparse,logging
from pathlib import Path

root=Path(__file__).resolve().parents[2];lab=root/'.animation-lab'
source=next((lab/'wan-source').glob('Wan-Video-Wan2.2-*'))
# Only load the TI2V entry point: the upstream umbrella also imports optional
# speech/video readers that have no Windows wheels and are unused in this trial.
init=source/'wan/__init__.py'
backup=source/'wan/__init__.upstream.py'
if not backup.exists():backup.write_bytes(init.read_bytes())
init.write_text('# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.\nfrom .textimage2video import WanTI2V\n',encoding='utf8')
# Allocate T5 on meta and attach the verified checkpoint directly, avoiding a
# costly random initialization and a second full copy of the encoder weights.
t5_file=source/'wan/modules/t5.py';t5_backup=source/'wan/modules/t5.upstream.py'
if not t5_backup.exists():t5_backup.write_bytes(t5_file.read_bytes())
t5_source=t5_backup.read_text(encoding='utf8').replace('device=device).eval().requires_grad_(False)','device="meta").eval().requires_grad_(False)').replace("model.load_state_dict(torch.load(checkpoint_path, map_location='cpu'))","model.load_state_dict(torch.load(checkpoint_path, map_location='cpu', mmap=True, weights_only=True), assign=True)")
t5_file.write_text(t5_source,encoding='utf8')
sys.path.insert(0,str(source));os.environ['HF_HUB_OFFLINE']='1';os.environ['TOKENIZERS_PARALLELISM']='false'
import torch
from PIL import Image
import imageio.v2 as imageio
import wan
from wan.configs.wan_ti2v_5B import ti2v_5B
import wan.modules.model as model_module
from wan.modules.attention import attention
# Native PyTorch SDPA replaces the optional Linux FlashAttention dependency.
model_module.flash_attention=attention

parser=argparse.ArgumentParser();parser.add_argument('--action',choices=['look','walk'],default='look');parser.add_argument('--frames',type=int,default=49);parser.add_argument('--steps',type=int,default=30);parser.add_argument('--area',type=int,default=512*512);parser.add_argument('--seed',type=int,default=241028);parser.add_argument('--take',type=int,default=1);parser.add_argument('--probe',action='store_true');args=parser.parse_args()
logging.basicConfig(level=logging.INFO,format='%(asctime)s %(message)s')
print('Wan runtime',torch.__version__,torch.cuda.get_device_name(0),flush=True)
if args.probe:sys.exit(0)
out=root/'test-results/animation-lab/claude'/('wan-'+args.action+(f'-v{args.take}' if args.take>1 else ''));out.mkdir(parents=True,exist_ok=True)
model=lab/'models/Wan2.2-TI2V-5B'
for p in ['Wan2.2_VAE.pth','models_t5_umt5-xxl-enc-bf16.pth']:
 if not (model/p).exists():raise RuntimeError('Model download incomplete: '+p)

reference=Image.open(root/'public/community/claude/idle.webp').convert('RGBA')
# A plain removable background avoids forcing the diffusion model to invent a room.
canvas=Image.new('RGB',(512,512),(40,190,115));bbox=reference.getchannel('A').point(lambda x:255 if x>24 else 0).getbbox();reference=reference.crop(bbox)
scale=min(360/reference.width,410/reference.height);reference=reference.resize((round(reference.width*scale),round(reference.height*scale)),Image.Resampling.LANCZOS)
canvas.paste(reference,((512-reference.width)//2,465-reference.height),reference);canvas.save(out/'reference.png')
design='A single cute orange-haired chibi girl, amber eyes, sunflower hair ornament with black ribbons, cream white and orange gold scholarly dress and black shoes, holding her small brown book. Preserve the exact character, body proportions, outfit and anime illustration style of the input.'
motion=('She remains in the same spot, gently turns her head and eyes to look left, then looks right, then returns her gaze to the viewer. Natural small head motion, a soft blink, hair tips lightly follow the movement. Both feet stay planted, body remains upright.' if args.action=='look' else 'She jogs in place facing right. A clear repeated full running gait: left foot reaches forward while right foot pushes back, both feet pass beneath the body, then right foot reaches forward while left foot pushes back. Smooth alternating knee bends and foot contacts, small natural body bounce, hair follows behind. The entire body stays centred at the same size.')
prompt=design+' '+motion+' Locked camera, complete body and hair always visible, solid uniform green background, no scene change, no zoom, no new objects, one continuous animation shot.'
negative='extra limbs, three legs, missing legs, fused feet, sliding feet, duplicate hair, deformed hands, changing clothes, changing face, changing body size, cropped head, cropped feet, camera motion, zoom, text, watermark, room, floor texture, multiple people, walking backwards, turning body around'
if args.take>1:
 prompt='Dynamic 2D character animation. The girl distinctly turns her face toward the left side of the screen until shown in a three-quarter view. She pauses briefly, then turns back to face the camera and blinks. Her long orange hair follows the turn with soft secondary motion. Her feet and torso stay in place. Locked camera, same uniform green background, preserve the input character design.'
 negative+='; static image, motionless face, morphing face, different character'
record={'model':'Wan-AI/Wan2.2-TI2V-5B','code_commit':json.loads((lab/'wan-code-version.json').read_text())['commit'],'action':args.action,'prompt':prompt,'negative_prompt':negative,'frames':args.frames,'steps':args.steps,'max_area':args.area,'seed':args.seed,'fps':24,'mode':'local image-to-video, native PyTorch SDPA; no remote API'}
(out/'generation.json').write_text(json.dumps(record,indent=2),encoding='utf8')
start=time.time();print('Loading official TI2V weights',flush=True)
pipe=wan.WanTI2V(config=ti2v_5B,checkpoint_dir=str(model),t5_cpu=False,init_on_cpu=True,convert_model_dtype=True)
print('Generating',args.action,flush=True)
video=pipe.generate(prompt,img=canvas,max_area=args.area,frame_num=args.frames,shift=3. if args.take>1 else 5.,sampling_steps=args.steps,guide_scale=5.,n_prompt=negative,seed=args.seed,offload_model=True)
images=((video.detach().float().cpu().clamp(-1,1)+1)*127.5).permute(1,2,3,0).numpy().astype('uint8')
frames=out/'frames';frames.mkdir(exist_ok=True)
for i,f in enumerate(images):Image.fromarray(f).save(frames/f'{i:08}.png')
imageio.mimwrite(out/'raw.mp4',images,fps=24,codec='libx264',quality=8)
record.update(seconds=round(time.time()-start,2),size=list(images.shape[1:3]),peak_vram_GB=round(torch.cuda.max_memory_allocated()/1e9,2))
(out/'generation.json').write_text(json.dumps(record,indent=2),encoding='utf8');print('DONE',json.dumps(record),flush=True)
