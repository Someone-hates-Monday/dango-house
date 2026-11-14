"""Watch a download folder for a new MP4, archive into a Jimeng job folder, write generation.json.

Human still clicks Download in the browser; this only claims the file afterward.
Does not pay, login, or replace public/ assets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def newest_mp4(folder: Path, after_mtime: float) -> Path | None:
    candidates = [
        p for p in folder.glob('*.mp4')
        if p.is_file() and p.stat().st_mtime > after_mtime and not p.name.endswith('.crdownload')
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser()
    parser.add_argument('--job', required=True, help='path to job.json or job folder')
    parser.add_argument('--downloads', default=str(Path.home() / 'Downloads'))
    parser.add_argument('--timeout', type=int, default=900, help='seconds to wait for a new mp4')
    parser.add_argument('--poll', type=float, default=2.0)
    args = parser.parse_args()

    job_path = Path(args.job)
    if job_path.is_dir():
        job_path = job_path / 'job.json'
    job = json.loads(job_path.read_text(encoding='utf-8'))
    archive = root / job.get('archiveTo', f"test-results/animation-lab/jimeng-inbox/{job['id']}")
    archive.mkdir(parents=True, exist_ok=True)

    downloads = Path(args.downloads)
    if not downloads.is_dir():
        raise SystemExit(f'missing downloads folder: {downloads}')

    started = time.time()
    print(f"watching {downloads} for new .mp4 (timeout {args.timeout}s) → {archive}", flush=True)
    found: Path | None = None
    while time.time() - started < args.timeout:
        cand = newest_mp4(downloads, after_mtime=started - 1)
        if cand is not None:
            # Wait until size stable (download finished)
            s1 = cand.stat().st_size
            time.sleep(1.5)
            if cand.exists() and cand.stat().st_size == s1 and s1 > 0:
                found = cand
                break
        time.sleep(args.poll)

    if found is None:
        raise SystemExit('timeout: no new mp4 in downloads')

    dest = archive / 'source.mp4'
    shutil.copy2(found, dest)
    digest = sha256(dest)
    meta = {
        'jobId': job['id'],
        'character': job.get('character'),
        'form': job.get('form'),
        'scene': job.get('scene'),
        'provider': 'jimeng-web',
        'importedAt': datetime.now(timezone.utc).isoformat(),
        'downloadSourceName': found.name,
        'downloadSourcePath': str(found),
        'sourceSha256': digest,
        'bytes': dest.stat().st_size,
        'promptZh': job.get('promptZh'),
        'promptEn': job.get('promptEn'),
        'references': job.get('references'),
        'productionApproved': False,
        'originalExportPreserved': True,
    }
    (archive / 'generation.json').write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    job['status'] = 'archived'
    job['archivedAt'] = meta['importedAt']
    job['archivePath'] = str(archive.relative_to(root)).replace('\\', '/')
    job_path.write_text(json.dumps(job, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'archived → {dest}', flush=True)
    print(f'sha256 {digest}', flush=True)
    audit = job.get('postProcess', {}).get('auditScript')
    if audit:
        gesture = ' --gesture' if job.get('postProcess', {}).get('gestureFlag') else ''
        print(
            f"next: .animation-lab\\venv\\Scripts\\python.exe {audit} "
            f"--folder {archive.relative_to(root)}{gesture}",
            flush=True,
        )


if __name__ == '__main__':
    main()
