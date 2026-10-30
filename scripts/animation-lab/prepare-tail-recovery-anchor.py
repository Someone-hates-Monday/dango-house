"""Technical green-screen composite of the candidate's existing last frame, no redraw."""
from PIL import Image
from pathlib import Path
folder=Path('test-results/animation-lab/cast-v1/gpt/pixverse-tail-p2')
frame=Image.open(folder/'normalized-rgba/00000065.png').convert('RGBA')
canvas=Image.new('RGBA',frame.size,(0,255,0,255));canvas.alpha_composite(frame)
canvas.convert('RGB').save(folder/'recovery-start.png')
