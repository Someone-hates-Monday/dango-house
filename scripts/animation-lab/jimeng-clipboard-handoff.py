"""Reliable Jimeng handoff without screen clicking.

Stage 1: put first-frame PNG on clipboard → you Ctrl+V in Jimeng.
Stage 2: put prompt text on clipboard → you Ctrl+V into the prompt box.
Stage 3: optionally start download watcher after you click Download in the browser.

Uses free Jimeng web quota; does not call Ark API or pay.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parents[2]


def set_clipboard_image(png: Path) -> None:
    # PowerShell: System.Windows.Forms clipboard image
    ps = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "Add-Type -AssemblyName System.Drawing; "
        f"$img=[System.Drawing.Image]::FromFile('{png}'); "
        "[System.Windows.Forms.Clipboard]::SetImage($img); "
        "$img.Dispose(); "
        "'ok'"
    )
    r = subprocess.run(
        ['powershell', '-NoProfile', '-Command', ps],
        capture_output=True, text=True, check=False,
    )
    if r.returncode != 0 or 'ok' not in (r.stdout or ''):
        raise SystemExit(f'clipboard image failed: {r.stderr or r.stdout}')


def set_clipboard_text(text: str) -> None:
    # Prefer clip.exe with UTF-16LE (Windows clipboard text)
    data = text.encode('utf-16le')
    r = subprocess.run(['clip'], input=data, check=False)
    if r.returncode != 0:
        raise SystemExit('clipboard text failed')


def pause(msg: str) -> None:
    print(msg, flush=True)
    input('按 Enter 继续… ')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--job',
        default=str(root / 'test-results/animation-lab/jimeng-jobs/cp001-rin-xia-hair-v1'),
    )
    parser.add_argument('--watch', action='store_true', help='after handoff, watch Downloads')
    parser.add_argument('--timeout', type=int, default=1200)
    args = parser.parse_args()

    job_dir = Path(args.job)
    if job_dir.is_file():
        job_dir = job_dir.parent
    first = job_dir / 'paste' / 'first-frame.png'
    prompt = job_dir / 'PROMPT.zh.txt'
    if not first.is_file():
        raise SystemExit(f'missing {first}')
    if not prompt.is_file():
        raise SystemExit(f'missing {prompt}')

    print('=== 即梦剪贴板交接（不点屏幕）===', flush=True)
    print('请先在本机 Chrome 打开即梦 → 切到「视频生成」/图生视频（不要用 Agent 聊天档）。', flush=True)
    print('准备好粘贴位置后回来按 Enter。', flush=True)
    pause('1/3 即将复制首帧图片到剪贴板')

    set_clipboard_image(first.resolve())
    print(f'已复制图片: {first}', flush=True)
    print('到即梦参考图区域 Ctrl+V 粘贴（避开文件选择框）。粘贴成功后再回这里按 Enter。', flush=True)
    pause('2/3 即将复制提示词到剪贴板')

    text = prompt.read_text(encoding='utf-8').strip()
    set_clipboard_text(text)
    print(f'已复制提示词 ({len(text)} 字): {prompt.name}', flush=True)
    print('到提示词框 Ctrl+V；核对：5s / 16:9 / 免费可用模型；点生成。', flush=True)
    print('遇扣费/开通弹窗：停下你自己确认。不要用 rin-xia-v2/end.png 当尾帧。', flush=True)
    pause('3/3 生成完成后，在浏览器点「下载」，再按 Enter 开始监视 Downloads')

    if args.watch:
        watcher = root / 'scripts/animation-lab/watch-jimeng-download.py'
        cmd = [
            sys.executable, str(watcher),
            '--job', str(job_dir / 'job.json'),
            '--timeout', str(args.timeout),
        ]
        print('启动下载监视…', flush=True)
        raise SystemExit(subprocess.call(cmd))

    print('未加 --watch。下载后可手动运行:', flush=True)
    print(
        f'  .animation-lab\\venv\\Scripts\\python.exe scripts\\animation-lab\\watch-jimeng-download.py '
        f'--job {job_dir.relative_to(root)}\\job.json',
        flush=True,
    )


if __name__ == '__main__':
    main()
