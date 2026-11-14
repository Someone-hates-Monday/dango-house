"""Cut a walk loop window + optional L/R mirror draft from an audited Jimeng walk folder.

Expects audit-jimeng.py --gesture already produced draft.webm / normalized-rgba.
Does not overwrite public/. Writes walk-clip.json timings for ClaudeVideoSprite.

Route A (default): one facing + CSS/ffmpeg hflip for the opposite direction.
Route B: generate a second facing + turn clips separately; this script only helps Route A.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image


def rgba_diff(a: np.ndarray, b: np.ndarray) -> float:
    region = (a[:, :, 3] > 0.05) | (b[:, :, 3] > 0.05)
    if not np.any(region):
        return 0.0
    return float(np.abs(a[region] - b[region]).mean() * 255)


def small(im: Image.Image) -> np.ndarray:
    a = np.asarray(im.resize((320, 180)), np.float32) / 255
    return np.dstack((a[:, :, :3] * a[:, :, 3:], a[:, :, 3:]))


def propose_clip(duration: float, fps: float, loop_start_f: int, loop_end_f: int) -> dict:
    """Map selected loop frames onto enter/loop/exit seconds (DeepSeek-shaped)."""
    enter_end = max(0.35, loop_start_f / fps)
    loop_start = loop_start_f / fps
    loop_end = loop_end_f / fps
    # Prefer a short exit at the end of the source after the loop window.
    exit_start = min(duration - 0.9, loop_end + 0.15)
    if exit_start <= loop_end:
        exit_start = loop_end
    exit_end = duration
    return {
        "enterEnd": round(enter_end, 3),
        "loopStart": round(loop_start, 3),
        "loopEnd": round(loop_end, 3),
        "exitStart": round(exit_start, 3),
        "exitEnd": round(exit_end, 3),
        "canonicalFacing": "left",
        "mirrorForWalkRight": True,
        "note": "Provisional timings from mid-window seam search; human must verify feet and flower side.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--folder",
        default="test-results/animation-lab/claude/jimeng-claude-walk-cycle-a4",
    )
    parser.add_argument("--mirror-preview", action="store_true")
    parser.add_argument("--min-loop-sec", type=float, default=1.6)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    folder = Path(args.folder)
    if not folder.is_absolute():
        folder = root / folder

    rgba_dir = folder / "normalized-rgba"
    draft = folder / "draft.webm"
    assert draft.exists(), f"missing {draft}; run audit-jimeng.py --gesture first"
    assert rgba_dir.is_dir(), f"missing {rgba_dir}"

    frames = sorted(rgba_dir.glob("*.png"))
    assert frames, "empty normalized-rgba"
    fps = 24.0
    duration = len(frames) / fps
    pix = [small(Image.open(p).convert("RGBA")) for p in frames]

    # Search a mid-body loop (skip first/last ~15%) so enter/exit remain available.
    lo = max(1, int(len(frames) * 0.12))
    hi = min(len(frames) - 2, int(len(frames) * 0.88))
    min_len = max(int(args.min_loop_sec * fps), 24)
    best = None
    for start in range(lo, hi - min_len):
        for end in range(start + min_len, hi + 1):
            score = rgba_diff(pix[start], pix[end])
            cand = (score, start, end)
            if best is None or cand < best:
                best = cand
    assert best is not None
    score, start, end = best
    clip = propose_clip(duration, fps, start, end)
    clip["seamRgbaMeanDifference255"] = score
    clip["loopSourceFrames"] = [start, end]
    clip["sourceFrames"] = len(frames)
    clip["sourceDuration"] = round(duration, 3)
    (folder / "walk-clip.json").write_text(json.dumps(clip, indent=2), encoding="utf8")
    print(json.dumps(clip, indent=2), flush=True)

    # Export a tight loop webm for visual seam review (not production).
    loop_dir = folder / "loop-rgba"
    loop_dir.mkdir(exist_ok=True)
    for i, src in enumerate(frames[start : end + 1]):
        Image.open(src).convert("RGBA").save(loop_dir / f"{i:08}.png")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    loop_out = folder / "loop-draft.webm"
    r = subprocess.run(
        [
            ffmpeg,
            "-y",
            "-framerate",
            "24",
            "-i",
            str(loop_dir / "%08d.png"),
            "-vf",
            "scale=640:360",
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-auto-alt-ref",
            "0",
            "-b:v",
            "0",
            "-crf",
            "24",
            "-an",
            str(loop_out),
        ],
        capture_output=True,
        text=True,
    )
    assert r.returncode == 0, r.stderr[-2000:]
    print(f"wrote {loop_out.relative_to(root)}", flush=True)

    if args.mirror_preview:
        # Horizontal flip of full draft for walk-right QA (flower/ribbon will swap sides).
        mirror = folder / "draft-mirrored.webm"
        r = subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                str(draft),
                "-vf",
                "hflip",
                "-c:v",
                "libvpx-vp9",
                "-pix_fmt",
                "yuva420p",
                "-auto-alt-ref",
                "0",
                "-b:v",
                "0",
                "-crf",
                "24",
                "-an",
                str(mirror),
            ],
            capture_output=True,
            text=True,
        )
        assert r.returncode == 0, r.stderr[-2000:]
        print(f"wrote {mirror.relative_to(root)} (hflip preview; asymmetry check required)", flush=True)

    # Quick contact: first/mid/last of loop vs mirrored first
    sheet = Image.new("RGB", (960, 360), "#1a1a1a")
    picks = [0, (end - start) // 2, end - start]
    for col, idx in enumerate(picks):
        im = Image.open(loop_dir / f"{idx:08}.png").convert("RGBA").resize((320, 180))
        bg = Image.new("RGBA", (320, 180), "#3a2f45")
        bg.alpha_composite(im)
        sheet.paste(bg.convert("RGB"), (col * 320, 0))
        flipped = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        bg2 = Image.new("RGBA", (320, 180), "#2f3a45")
        bg2.alpha_composite(flipped)
        sheet.paste(bg2.convert("RGB"), (col * 320, 180))
    contact = folder / "walk-loop-mirror-contact.png"
    sheet.save(contact)
    print(f"wrote {contact.relative_to(root)}", flush=True)


if __name__ == "__main__":
    main()
