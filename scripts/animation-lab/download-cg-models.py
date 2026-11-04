"""Pinned-size/SHA256 official Comfy Wan 14B assets, resumable and local only."""
import concurrent.futures, hashlib, json, os, time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[2]
COMFY = ROOT / '.animation-lab/ComfyUI'
PROXY = {'https': 'http://127.0.0.1:15236'}
BASE = 'https://huggingface.co/Comfy-Org/Wan-2.2'
files = [
 ('diffusion_models', 'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors'),
 ('diffusion_models', 'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors'),
 ('text_encoders', 'umt5_xxl_fp8_e4m3fn_scaled.safetensors'),
 ('vae', 'wan_2.1_vae.safetensors'),
]
metadata = requests.get(BASE.replace('/Comfy-Org/', '/api/models/Comfy-Org/') + '/revision/main', proxies=PROXY, timeout=30).json()
revision = metadata['sha']
records = []
for folder, name in files:
    source_folder = 'https://huggingface.co/api/models/Comfy-Org/Wan-2.2/tree/' + revision + '/split_files/' + folder
    entries = requests.get(source_folder, proxies=PROXY, timeout=30).json()
    match = next((x for x in entries if x['path'].endswith('/' + name)), None)
    if not match and folder == 'text_encoders':
        repo = 'Comfy-Org/Wan_2.1_ComfyUI_repackaged'
        info = requests.get('https://huggingface.co/api/models/' + repo + '/revision/main', proxies=PROXY, timeout=30).json()
        rev = info['sha']
        entries = requests.get('https://huggingface.co/api/models/' + repo + '/tree/' + rev + '/split_files/' + folder, proxies=PROXY, timeout=30).json()
        match = next(x for x in entries if x['path'].endswith('/' + name))
        url = 'https://huggingface.co/' + repo + '/resolve/' + rev + '/' + match['path']
    else:
        if not match: raise RuntimeError('Missing official asset: ' + name)
        url = BASE + '/resolve/' + revision + '/' + match['path']
    records.append(dict(name=name, folder=folder, size=match['size'], sha256=match['lfs']['oid'], url=url))

def download(record):
    target = COMFY / 'models' / record['folder'] / record['name']
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + '.partial')
    if target.exists() and target.stat().st_size == record['size']:
        print('EXISTS', record['name'], flush=True)
    else:
        for attempt in range(6):
            offset = partial.stat().st_size if partial.exists() else 0
            try:
                response = requests.get(record['url'], headers={'Range': f'bytes={offset}-'} if offset else {}, proxies=PROXY, stream=True, timeout=(30, 120))
                response.raise_for_status()
                append = offset and response.status_code == 206
                downloaded = offset if append else 0
                last = time.time()
                with partial.open('ab' if append else 'wb') as stream:
                    for chunk in response.iter_content(4 * 1024 * 1024):
                        stream.write(chunk); downloaded += len(chunk)
                        if time.time() - last > 25:
                            print(record['name'], round(downloaded / 1e9, 2), '/', round(record['size'] / 1e9, 2), 'GB', flush=True); last=time.time()
                if downloaded != record['size']: raise RuntimeError('incomplete download')
                break
            except Exception as error:
                print('RETRY', record['name'], attempt + 1, type(error).__name__, flush=True)
                if attempt == 5: raise
        os.replace(partial, target)
    digest = hashlib.sha256()
    with target.open('rb') as stream:
        for chunk in iter(lambda: stream.read(16 * 1024 * 1024), b''): digest.update(chunk)
    if digest.hexdigest() != record['sha256']: raise RuntimeError('SHA256 mismatch: ' + record['name'])
    print('VERIFIED', record['name'], flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(download, records))
out = ROOT / 'test-results/cg-lab/model-manifest.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(dict(revision=revision, files=records), indent=2), encoding='utf8')
print('ALL VERIFIED', flush=True)
