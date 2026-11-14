"""Copy audited draft.webm into public/video/claude/ with production names. Does not touch idle/pat/affection/chat/rice/bookmark."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[2]
base = root / "test-results/animation-lab/claude"
public = root / "public/video/claude"
# Prefer A4 over A3 when both exist.
mapping = [
    ("listen", ["jimeng-claude-listen-a3"]),
    ("rivalry-soft", ["jimeng-claude-rivalry-soft-a3"]),
    ("chosen-again", ["jimeng-claude-chosen-again-a3"]),
    ("gpt-joke", ["jimeng-claude-gpt-joke-a3"]),
    ("success", ["jimeng-claude-success-a3"]),
    ("reassure", ["jimeng-claude-reassure-a4", "jimeng-claude-reassure-a3"]),
    ("hesitate", ["jimeng-claude-hesitate-a4", "jimeng-claude-hesitate-a3"]),
    ("thinking", ["jimeng-claude-thinking-a4", "jimeng-claude-thinking-a3"]),
    ("goodnight", ["jimeng-claude-goodnight-a4", "jimeng-claude-goodnight-a3"]),
    ("fish-shy", ["jimeng-claude-fish-shy-a4"]),
    ("walk", ["jimeng-claude-walk-cycle-a4"]),
    ("walk-opposite", ["jimeng-claude-walk-opposite-a4"]),
    ("recover-step", ["jimeng-claude-recover-step-a4"]),
    ("turn-to-left", ["jimeng-claude-turn-to-left-a4"]),
    ("turn-to-right", ["jimeng-claude-turn-to-right-a4"]),
]
preserve = {"idle.webm", "pat.webm", "affection.webm", "chat.webm", "rice.webm", "bookmark.webm", "NOTICE.md"}
report = []
for name, folders in mapping:
    src = None
    used = None
    for folder in folders:
        cand = base / folder / "draft.webm"
        if cand.exists() and cand.stat().st_size > 1000:
            src = cand
            used = folder
            break
    if not src:
        report.append({"name": name, "status": "missing-draft"})
        continue
    dest = public / f"{name}.webm"
    if dest.name in preserve:
        report.append({"name": name, "status": "skipped-preserve"})
        continue
    shutil.copy2(src, dest)
    report.append(
        {
            "name": name,
            "status": "installed",
            "from": used,
            "bytes": dest.stat().st_size,
            "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(),
        }
    )
    print(f"installed {name} ← {used}", flush=True)

out = base / "install-claude-drafts-report.json"
out.write_text(json.dumps(report, indent=2), encoding="utf8")
print(json.dumps(report, indent=2), flush=True)
