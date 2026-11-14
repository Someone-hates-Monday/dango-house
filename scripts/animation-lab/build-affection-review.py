"""Archive metadata and preview for the four affection key poses; no image editing."""
from pathlib import Path
from PIL import Image
import hashlib, html, json

root=Path(__file__).resolve().parents[2]
spec=root/'docs/cg-production/affection-2026-11-12.prompts.json'
jobs=json.loads(spec.read_text(encoding='utf-8'))['jobs']
out=root/'test-results/cg-lab/affection-2026-11-12'
out.mkdir(parents=True,exist_ok=True)
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
entries=[]; cards=[]
for j in jobs:
    name=f'{j["id"]}-{j["name"]}.png'
    p=out/name
    assert p.is_file(),f'Missing requested image: {p}'
    with Image.open(p) as im: im.verify()
    with Image.open(p) as im: size=list(im.size)
    refs=[{'file':r,'sha256':digest(root/r)} for r in j['refs']]
    prompt=out/(p.stem+'.prompt.txt');prompt.write_text(j['prompt']+'\n',encoding='utf-8')
    notes=[]
    if j['id']=='TRIO-001': notes.append('Actual pose differs from requested hands: Claude reaches LEFT, RIGHT on book; DeepSeek pats seat LEFT, RIGHT on apron. Preserve actual hand ownership in video.')
    if j['id'].startswith('POV-'): notes.append('Close-up framing; head/horn edges near or beyond border. Not a full-body structure reference or pre-contact start frame.')
    entries.append({'id':j['id'],'file':name,'sha256':digest(p),'dimensions':size,'reviewNotes':notes,
                    'references':refs,'promptFile':prompt.name,'tool':'built-in image_gen',
                    'model':'not exposed by tool','status':'candidate-key-pose-static-review',
                    'videoGenerated':False,'runtimeAccepted':False,'distributionApproved':False})
    cards.append(f'<section><h2>{html.escape(j["id"])}</h2><a href="{name}"><img src="{name}" alt="{html.escape(j["name"])}"></a><p>{html.escape(j["name"])} · {size[0]}×{size[1]}</p></section>')
manifest={'batchStarted':'2026-11-12','completed':'2026-11-13','scope':'Four affection key poses; no video or public replacement',
          'limits':['Not pre-contact start frames.','Video must independently verify contact/hand/tail continuity.','Residual generated clothing/background details require continuity checks.'],
          'images':entries}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>亲密 CG 参考 / Affection key poses</title><style>body{font:16px system-ui;margin:28px auto;max-width:1280px;padding:0 20px;background:#fff5ef;color:#473746}img{width:100%;border-radius:12px}section{margin:32px 0}a{color:#96455f}</style><h1>贴贴 · 对你心动 · 一起等你</h1><p>4 张关键姿态参考 / Four key poses. 非视频，非已验收首帧，不自动接入运行素材。</p>'+''.join(cards)+'</html>'
(out/'review.html').write_text(page,encoding='utf-8')
print('PASS: 4 decoded images, reference hashes, prompts, manifest and review page.')
