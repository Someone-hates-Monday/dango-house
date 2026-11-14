"""Submit GPT shy-tail Q/CG jobs to local Comfy Wan2.2 I2V A14B FP8. Requires Comfy on 127.0.0.1:8188."""
from __future__ import annotations
import argparse, json, shutil, time
from pathlib import Path
import requests

root = Path(__file__).resolve().parents[2]
comfy = root / '.animation-lab/ComfyUI'
base = 'http://127.0.0.1:8188'

parser = argparse.ArgumentParser()
parser.add_argument('--form', choices=['q', 'cg'], required=True)
parser.add_argument('--seed', type=int, default=2026110414)
args = parser.parse_args()

out = root / f'test-results/animation-lab/gpt/wan14b-shy-tail-{args.form}'
out.mkdir(parents=True, exist_ok=True)
ref = out / 'reference.png'
if not ref.exists():
    raise SystemExit('missing reference; run prepare-gpt-shy-tail-refs.py first')

input_name = f'dango-gpt-shy-tail-{args.form}.png'
shutil.copy2(ref, comfy / 'input' / input_name)

tail = (
    'Preserve the exact single western dragon tail from the reference: thick root beside the hips '
    '(upper-right of the body), curving down the character\'s right side then left along the bottom '
    'to one tapered tip. Never reverse root and tip. No second tail, whale fluke, fin, leaf, or tip ornament.'
)
motion = (
    'PRIMARY ACTION is shy tail body language: from the body-side root the same tail gradually curls '
    'inward toward the near lower leg, holds briefly, then visibly uncoils and recovers to the neutral curve '
    'with reducing amplitude and delayed tip motion. Soft shy gaze down, light blush, restrained expression. '
    'Feet planted, torso upright, two arms only, horns and wings unchanged. Subtle breathing only otherwise.'
)
if args.form == 'q':
    positive = (
        'A high quality anime chibi full-body shot of one silver-white-haired dragon girl with purple eyes, '
        'horns, small wings and scaled western dragon tail, standing on a solid pure green background. '
        'Preserve the exact character, face, proportions, dress, horns, wings and tail of the reference image. '
        + tail + ' ' + motion +
        ' Locked camera, unchanged composition, full body including horns, feet and entire tip always visible. '
        'Single continuous shot, no zoom, no scene change. Clean anime illustration.'
    )
    bg_neg = 'room, floor texture, complex background,'
else:
    positive = (
        'A high quality anime adult-proportion full-body shot of one elegant silver-white-haired dragon girl '
        'with purple eyes, large curved horns, bat-like wings, white layered dress with silver knots, '
        'and a scaled western dragon tail, standing on a plain dark neutral backdrop. '
        'Preserve the exact character, face, outfit, horns, wings and tail of the reference image. '
        + tail + ' ' + motion +
        ' Locked camera, unchanged composition, full body including horns, feet and entire tip always visible. '
        'Single continuous shot, no zoom, no scene change. Detailed clean anime illustration, stable costume.'
    )
    bg_neg = 'bright green dress contamination, chroma spill,'

negative = (
    bg_neg + ' static pasted tail, frozen tail, mechanical constant wagging, motion only at tip, teleporting coil, '
    'tail through dress or legs, disconnected root, reversed tip and root, second tail, whale fluke, '
    'extra people, duplicated faces, face morphing, changing hair colors, changing costumes, extra arms, '
    'extra hands, fused fingers, distorted hands, missing fingers, generated human hand, giant motion, jumping, '
    'sudden head turn, shaking camera, zoom, pan, scene cut, frame flicker, text, captions, watermark, logo, nudity'
)


def node(kind, **inputs):
    return {'class_type': kind, 'inputs': inputs}


g = {
    '1': node('UNETLoader', unet_name='wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors', weight_dtype='default'),
    '2': node('UNETLoader', unet_name='wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors', weight_dtype='default'),
    '3': node('ModelSamplingSD3', model=['1', 0], shift=8.0),
    '4': node('ModelSamplingSD3', model=['2', 0], shift=8.0),
    '5': node('CLIPLoader', clip_name='umt5_xxl_fp8_e4m3fn_scaled.safetensors', type='wan', device='default'),
    '6': node('VAELoader', vae_name='wan_2.1_vae.safetensors'),
    '7': node('LoadImage', image=input_name),
    '8': node('CLIPTextEncode', clip=['5', 0], text=positive),
    '9': node('CLIPTextEncode', clip=['5', 0], text=negative),
    '10': node('WanImageToVideo', positive=['8', 0], negative=['9', 0], vae=['6', 0], width=832, height=480, length=81, batch_size=1, start_image=['7', 0]),
    '11': node('KSamplerAdvanced', model=['3', 0], add_noise='enable', noise_seed=args.seed, steps=24, cfg=3.5, sampler_name='euler', scheduler='simple', positive=['10', 0], negative=['10', 1], latent_image=['10', 2], start_at_step=0, end_at_step=12, return_with_leftover_noise='enable'),
    '12': node('KSamplerAdvanced', model=['4', 0], add_noise='disable', noise_seed=0, steps=24, cfg=3.5, sampler_name='euler', scheduler='simple', positive=['10', 0], negative=['10', 1], latent_image=['11', 0], start_at_step=12, end_at_step=24, return_with_leftover_noise='disable'),
    '13': node('VAEDecode', samples=['12', 0], vae=['6', 0]),
    '14': node('CreateVideo', images=['13', 0], fps=16.0),
    '15': node('SaveVideo', video=['14', 0], filename_prefix=f'gpt/dango-gpt-shy-tail-{args.form}', format='mp4', codec='h264'),
}
(out / 'workflow-api.json').write_text(json.dumps(g, indent=2), encoding='utf8')

# Wait until Comfy is up.
for _ in range(120):
    try:
        if requests.get(base + '/system_stats', timeout=2).ok:
            break
    except Exception:
        time.sleep(2)
else:
    raise SystemExit('ComfyUI not reachable at 127.0.0.1:8188')

start = time.time()
r = requests.post(base + '/prompt', json={'prompt': g, 'client_id': f'dango-gpt-shy-{args.form}'}, timeout=60)
if not r.ok:
    raise RuntimeError(r.text)
pid = r.json()['prompt_id']
print('QUEUED', args.form, pid, flush=True)
record = {
    'status': 'running',
    'prompt_id': pid,
    'model': 'Wan2.2 I2V A14B high/low FP8 scaled',
    'form': args.form,
    'scene': 'shy-tail-curl-recover',
    'comfy_version': 'v0.3.75',
    'seed': args.seed,
    'width': 832,
    'height': 480,
    'frames': 81,
    'steps': 24,
    'fps': 16,
    'positive': positive,
    'negative': negative,
    'local_inference': True,
    'source_image': str(ref.relative_to(root)).replace('\\', '/'),
    'approved': False,
    'note': '14B Comfy rerun after mistaken TI2V-5B trial; experiment only',
}
(out / 'generation.json').write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding='utf8')

while True:
    history = requests.get(base + '/history/' + pid, timeout=60).json().get(pid)
    if history:
        (out / 'comfy-history.json').write_text(json.dumps(history, indent=2), encoding='utf8')
        if history.get('status', {}).get('status_str') == 'error':
            raise RuntimeError('Comfy execution failed; see comfy-history.json')
        assets = []
        for v in history.get('outputs', {}).values():
            for kind in ('images', 'videos', 'gifs'):
                assets.extend(x for x in v.get(kind, []) if x.get('filename', '').endswith(('.mp4', '.webm')))
        if assets:
            item = assets[0]
            source = comfy / 'output' / item.get('subfolder', '') / item['filename']
            shutil.copy2(source, out / 'raw.mp4')
            record.update(status='generated_pending_visual_review', seconds=round(time.time() - start, 2), output=str((out / 'raw.mp4').relative_to(root)).replace('\\', '/'))
            (out / 'generation.json').write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding='utf8')
            print('DONE', args.form, out / 'raw.mp4', 'seconds', record['seconds'], flush=True)
            break
    time.sleep(5)
