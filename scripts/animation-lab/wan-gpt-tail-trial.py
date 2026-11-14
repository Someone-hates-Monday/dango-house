"""Local Wan2.2 TI2V experiment: GPT shy-tail body language (Q chibi vs adult CG).

Experiment only — does not replace public production assets. Requires user-authorized run.
"""
from __future__ import annotations
import argparse, json, logging, os, sys, time
from pathlib import Path

root = Path(__file__).resolve().parents[2]
lab = root / '.animation-lab'
source = next((lab / 'wan-source').glob('Wan-Video-Wan2.2-*'))
init = source / 'wan/__init__.py'
backup = source / 'wan/__init__.upstream.py'
if not backup.exists():
    backup.write_bytes(init.read_bytes())
init.write_text(
    '# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.\n'
    'from .textimage2video import WanTI2V\n',
    encoding='utf8',
)
t5_file = source / 'wan/modules/t5.py'
t5_backup = source / 'wan/modules/t5.upstream.py'
if not t5_backup.exists():
    t5_backup.write_bytes(t5_file.read_bytes())
t5_source = (
    t5_backup.read_text(encoding='utf8')
    .replace('device=device).eval().requires_grad_(False)', 'device="meta").eval().requires_grad_(False)')
    .replace(
        "model.load_state_dict(torch.load(checkpoint_path, map_location='cpu'))",
        "model.load_state_dict(torch.load(checkpoint_path, map_location='cpu', mmap=True, weights_only=True), assign=True)",
    )
)
t5_file.write_text(t5_source, encoding='utf8')
sys.path.insert(0, str(source))
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

import torch
from PIL import Image
import imageio.v2 as imageio
import wan
from wan.configs.wan_ti2v_5B import ti2v_5B
import wan.modules.model as model_module
from wan.modules.attention import attention

model_module.flash_attention = attention

parser = argparse.ArgumentParser()
parser.add_argument('--form', choices=['q', 'cg'], required=True)
parser.add_argument('--frames', type=int, default=49)
parser.add_argument('--steps', type=int, default=30)
parser.add_argument('--area', type=int, default=512 * 512)
parser.add_argument('--seed', type=int, default=241104)
parser.add_argument('--take', type=int, default=1)
parser.add_argument('--probe', action='store_true')
args = parser.parse_args()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
print('Wan runtime', torch.__version__, torch.cuda.get_device_name(0), 'form', args.form, flush=True)
if args.probe:
    sys.exit(0)

model_dir = lab / 'models/Wan2.2-TI2V-5B'
for p in ['Wan2.2_VAE.pth', 'models_t5_umt5-xxl-enc-bf16.pth']:
    if not (model_dir / p).exists():
        raise RuntimeError('Model download incomplete: ' + p)

tag = f"wan-shy-tail-{args.form}" + (f'-v{args.take}' if args.take > 1 else '')
out = root / 'test-results/animation-lab/gpt' / tag
out.mkdir(parents=True, exist_ok=True)

# Scene: shy body language — restrained smile/blush + continuous western dragon-tail curl then recover.
# Tail geometry from docs/animation-lab/character-consistency.json (root vs tip must not reverse).
tail_rules = (
    'One continuous western dragon tail only: thick root beside the upper-right of the hips, '
    'curve down the character\'s right side, then left along the bottom to a single tapered tip. '
    'Never reverse root and tip. No extra tip ornament, fin, leaf, plume, second tail, or whale fluke.'
)
motion = (
    'Emotion: shy. She lowers her gaze slightly, soft blush, restrained expression — not exaggerated. '
    'PRIMARY ACTION is the tail: driven from the body-side root, the same tail gradually curls inward '
    'toward the near lower leg, holds briefly, then visibly uncoils and recovers to the neutral curve '
    'with reducing amplitude. Delayed motion toward the tip. Feet stay planted, torso upright, '
    'two arms only, horns and wings unchanged. No camera move, no new props, no human hands entering frame.'
)

if args.form == 'q':
    src = Image.open(root / 'public/community/gpt/idle.webp').convert('RGBA')
    design = (
        'A single cute silver-white-haired chibi dragon girl, purple eyes, dragon horns and small wings, '
        'western dragon tail with scales, elegant pale dress. Preserve the exact chibi proportions, face, '
        'horns, wings, clothes and illustration style of the input image. ' + tail_rules
    )
    canvas_size = 512
    bg = (40, 190, 115)
    floor_y = 465
    max_w, max_h = 360, 410
else:
    rgb = Image.open(root / 'public/portraits/gpt.jpg').convert('RGB')
    mask = Image.new('L', rgb.size)
    mask.putdata([0 if (r > 245 and g > 245 and b > 245) else 255 for r, g, b in rgb.getdata()])
    src = rgb.convert('RGBA')
    src.putalpha(mask)
    design = (
        'A single elegant adult-proportion anime dragon girl, long silver-white hair, purple eyes, '
        'large curved horns, bat-like dragon wings, white layered dress with silver knots, western scaled dragon tail. '
        'Preserve the exact adult character design, face, outfit, horns, wings and style of the input. ' + tail_rules
    )
    canvas_size = 512
    bg = (40, 190, 115)
    floor_y = 490
    max_w, max_h = 300, 450

canvas = Image.new('RGB', (canvas_size, canvas_size), bg)
alpha = src.getchannel('A')
bbox = alpha.point(lambda x: 255 if x > 20 else 0).getbbox() or src.getbbox()
figure = src.crop(bbox)
scale = min(max_w / figure.width, max_h / figure.height)
figure = figure.resize((max(1, round(figure.width * scale)), max(1, round(figure.height * scale))), Image.Resampling.LANCZOS)
canvas.paste(figure, ((canvas_size - figure.width) // 2, floor_y - figure.height), figure)
canvas.save(out / 'reference.png')

prompt = (
    design + ' ' + motion +
    ' Locked camera, full body including horns, feet and the entire tail always visible, '
    'solid uniform green background, one continuous animation shot, anime 2D look.'
)
negative = (
    'static pasted tail, frozen tail, mechanical constant wagging, motion only at tip, teleporting coil, '
    'tail through dress or legs, disconnected root, reversed tip and root, second tail, whale fluke, '
    'extra limbs, three arms, deformed hands, generated human hand, changing clothes, changing face, '
    'changing body size, cropped head, cropped feet, cropped tip, camera motion, zoom, text, watermark, '
    'room, floor texture, multiple people, morphing face, different character'
)

record = {
    'experiment': 'gpt-shy-tail-local-wan',
    'form': args.form,
    'scene': 'shy-tail-curl-recover',
    'model': 'Wan-AI/Wan2.2-TI2V-5B',
    'code_commit': json.loads((lab / 'wan-code-version.json').read_text(encoding='utf8'))['commit'],
    'source_image': str((root / ('public/community/gpt/idle.webp' if args.form == 'q' else 'public/portraits/gpt.jpg')).relative_to(root)).replace('\\', '/'),
    'prompt': prompt,
    'negative_prompt': negative,
    'frames': args.frames,
    'steps': args.steps,
    'max_area': args.area,
    'seed': args.seed,
    'fps': 24,
    'mode': 'local image-to-video, native PyTorch SDPA; no remote API; not production-approved',
    'consistency': 'docs/animation-lab/character-consistency.json#gpt.tailBodyLanguage.shy',
}
(out / 'generation.json').write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding='utf8')

start = time.time()
print('Loading official TI2V weights', flush=True)
pipe = wan.WanTI2V(config=ti2v_5B, checkpoint_dir=str(model_dir), t5_cpu=False, init_on_cpu=True, convert_model_dtype=True)
print('Generating shy-tail', args.form, flush=True)
video = pipe.generate(
    prompt,
    img=canvas,
    max_area=args.area,
    frame_num=args.frames,
    shift=5.0,
    sampling_steps=args.steps,
    guide_scale=5.0,
    n_prompt=negative,
    seed=args.seed,
    offload_model=True,
)
images = ((video.detach().float().cpu().clamp(-1, 1) + 1) * 127.5).permute(1, 2, 3, 0).numpy().astype('uint8')
frames = out / 'frames'
frames.mkdir(exist_ok=True)
for i, f in enumerate(images):
    Image.fromarray(f).save(frames / f'{i:08}.png')
imageio.mimwrite(out / 'raw.mp4', images, fps=24, codec='libx264', quality=8)
record.update(
    seconds=round(time.time() - start, 2),
    size=list(images.shape[1:3]),
    peak_vram_GB=round(torch.cuda.max_memory_allocated() / 1e9, 2),
    output=str((out / 'raw.mp4').relative_to(root)).replace('\\', '/'),
)
(out / 'generation.json').write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding='utf8')
print('DONE', json.dumps({'form': args.form, 'seconds': record['seconds'], 'out': record['output']}), flush=True)
