"""Build 832x480 start frames for GPT shy-tail 14B I2V (Q + CG). Experiment only."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
out_q = root / 'test-results/animation-lab/gpt/wan14b-shy-tail-q'
out_cg = root / 'test-results/animation-lab/gpt/wan14b-shy-tail-cg'
for d in (out_q, out_cg):
    d.mkdir(parents=True, exist_ok=True)

W, H = 832, 480


def paste_figure(src: Image.Image, bg_rgb: tuple[int, int, int], max_h: int, floor: int) -> Image.Image:
    canvas = Image.new('RGB', (W, H), bg_rgb)
    if src.mode != 'RGBA':
        rgb = src.convert('RGB')
        # Drop near-white paper for adult JPG portraits.
        mask = Image.new('L', rgb.size)
        mask.putdata([0 if (r > 245 and g > 245 and b > 245) else 255 for r, g, b in rgb.getdata()])
        src = rgb.convert('RGBA')
        src.putalpha(mask)
    alpha = src.getchannel('A')
    bbox = alpha.point(lambda x: 255 if x > 20 else 0).getbbox() or src.getbbox()
    fig = src.crop(bbox)
    scale = min((W * 0.62) / fig.width, max_h / fig.height)
    fig = fig.resize((max(1, round(fig.width * scale)), max(1, round(fig.height * scale))), Image.Resampling.LANCZOS)
    x = (W - fig.width) // 2
    y = floor - fig.height
    canvas.paste(fig, (x, y), fig)
    return canvas


# Q: chibi idle on chroma green (desktop-pet pipeline convention).
q = paste_figure(Image.open(root / 'public/community/gpt/idle.webp').convert('RGBA'), (0, 255, 0), 400, 440)
q.save(out_q / 'reference.png')

# CG: adult portrait on neutral gray to reduce green bleed into white dress (still experiment).
cg = paste_figure(Image.open(root / 'public/portraits/gpt.jpg'), (48, 52, 58), 430, 455)
cg.save(out_cg / 'reference.png')
print({'q': str(out_q / 'reference.png'), 'cg': str(out_cg / 'reference.png'), 'size': [W, H]})
