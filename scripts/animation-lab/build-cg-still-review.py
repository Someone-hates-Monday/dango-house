"""Build provenance manifests and inspection pages; never edits images or runtime media."""
from pathlib import Path
from PIL import Image
import hashlib
import html
import json

root = Path(__file__).resolve().parents[2]
docs = root / 'docs/cg-production'
spec = json.loads((docs / 'reference-stills-2026-11-08.prompts.json').read_text(encoding='utf-8'))
records = json.loads((docs / 'reference-stills-2026-11-08.records.json').read_text(encoding='utf-8'))
by_id = {(r['group'], r['shot']): r for r in records}
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):
    return p.relative_to(root).as_posix()
style = 'body{font:16px system-ui;background:#fff7f0;color:#493a40;margin:28px auto;max-width:1440px;padding:0 20px}a{color:#8b4a67}img{width:100%;height:auto;display:block;border-radius:12px}section{margin:32px 0}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}figure{margin:0}figcaption{padding:10px 0}small{overflow-wrap:anywhere}.warning{padding:16px;background:#f5e3db;border-radius:12px}'
sections = []
all_files = []
for group in spec['groups']:
    folder = root / 'test-results/cg-lab' / group['dir']
    entries = []
    figures = []
    for name, shot_prompt in group['shots']:
        record = by_id[group['id'], name]
        p = folder / 'stills' / (name + '.png')
        assert p.is_file(), p
        with Image.open(p) as im:
            im.verify()
        with Image.open(p) as im:
            size = list(im.size)
        refs = []
        for reference in record['references']:
            rp = root / reference
            assert rp.is_file(), rp
            refs.append({'file': reference, 'sha256': sha(rp)})
        prompt_file = folder / 'stills' / (name + '.prompt.txt')
        prompt_file.write_text(record['prompt'] + '\n', encoding='utf-8')
        entry = {'shot': name, 'file': rel(p), 'sha256': sha(p), 'dimensions': size,
                 'tool': 'built-in image_gen', 'model': 'not exposed by tool',
                 'references': refs, 'promptFile': rel(prompt_file), 'promptSha256': sha(prompt_file),
                 'review': 'initial-visual-review-static-pose-only',
                 'productionApproved': False, 'runtimeAccepted': False}
        entries.append(entry)
        all_files.append(entry)
        figures.append(f'<figure><a href="stills/{name}.png"><img src="stills/{name}.png" alt="{html.escape(name)}"></a><figcaption>{html.escape(name)}<br><small>{size[0]}×{size[1]} · SHA256 {entry["sha256"][:16]}…</small></figcaption></figure>')
    manifest = {'id': group['id'], 'date': '2026-11-08', 'status': 'reference-stills-candidate',
                'scope': 'storyboard/pose reference; not pixel-locked keyframes or video acceptance',
                'notes': ['Same pair/room intended; decor and framing have residual generative drift.',
                          'No public CG replacement, video generation or automatic rewards in this pass.'],
                'images': entries}
    (folder / 'stills-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    warning = '<p class="warning">静帧候选 / Pose references only. 非硬时序关键帧；视频过程、衔接和运行接入未验收。点击原图检查手、书、碗和鲸尾。</p>'
    page = f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{group["id"]} still review</title><style>{style}</style><h1>{group["id"]}</h1>{warning}<div class="shots">'+''.join(figures)+'</div><p><a href="stills-manifest.json">Manifest</a></p></html>'
    (folder / 'review.html').write_text(page, encoding='utf-8')
    figures_index = ''.join(f.replace('href="stills/', f'href="../{group["dir"]}/stills/').replace('src="stills/', f'src="../{group["dir"]}/stills/') for f in figures)
    sections.append(f'<section><h2><a href="../{group["dir"]}/review.html">{group["id"]}</a></h2><div class="shots">{figures_index}</div></section>')
    work_file = docs / 'work-orders' / (group['id'] + '.json')
    work = json.loads(work_file.read_text(encoding='utf-8'))
    work['generationAuthorized'] = True
    work['generationAuthorizationScope'] = 'reference-stills-only; user 2026-11-08'
    work['videoGenerationAuthorized'] = False
    work['referenceStills'] = {'status': 'generated-static-review-only', 'manifest': rel(folder / 'stills-manifest.json'),
                             'reviewPage': rel(folder / 'review.html'), 'images': [e['file'] for e in entries],
                             'reviewDocument': 'docs/cg-production/CG-STILLS-REVIEW-2026-11-08.zh-CN.md'}
    (work_file).write_text(json.dumps(work, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
index = root / 'test-results/cg-lab/stills-2026-11-08'
index.mkdir(parents=True, exist_ok=True)
(index / 'review.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CG reference stills</title><style>'+style+'</style><h1>CP-002–005 · 参考图审片 / Still review</h1><p class="warning">12 张独立正常比例参考；不是已生成的视频。保留背景，不自动覆盖 public，不自动奖励。</p>'+''.join(sections)+'</html>', encoding='utf-8')
(index / 'verification.json').write_text(json.dumps({'date': '2026-11-08', 'decodedImages': len(all_files), 'groups': len(spec['groups']), 'missing': [], 'scope': 'image decode and provenance; no video/runtime acceptance', 'files': all_files}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Validated {len(all_files)} images; wrote four manifests and five review pages.')
