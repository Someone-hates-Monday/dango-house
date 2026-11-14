"""Run audit-jimeng --gesture on every Claude archive that has source.mp4 but no draft.webm."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
py = root / ".animation-lab/venv/Scripts/python.exe"
audit = root / "scripts/animation-lab/audit-jimeng.py"
base = root / "test-results/animation-lab/claude"
prefer = [
    "jimeng-claude-listen-a3",
    "jimeng-claude-rivalry-soft-a3",
    "jimeng-claude-chosen-again-a3",
    "jimeng-claude-gpt-joke-a3",
    "jimeng-claude-success-a3",
    "jimeng-claude-reassure-a3",
    "jimeng-claude-hesitate-a3",
    "jimeng-claude-fish-shy-a4",
    "jimeng-claude-goodnight-a4",
    "jimeng-claude-thinking-a4",
    "jimeng-claude-walk-cycle-a4",
]
folders = []
for name in prefer:
    d = base / name
    if (d / "source.mp4").exists() and not (d / "draft.webm").exists():
        folders.append(d)
# Also any other jimeng-claude-* with source and no draft
for d in sorted(base.glob("jimeng-claude-*")):
    if d in folders:
        continue
    if (d / "source.mp4").exists() and not (d / "draft.webm").exists():
        # Skip rejected A2 monotone batch unless nothing else
        if d.name.endswith("-a2"):
            continue
        folders.append(d)

print(f"auditing {len(folders)} folders", flush=True)
failed = []
for d in folders:
    print(f"==> {d.name}", flush=True)
    r = subprocess.run([str(py), str(audit), "--folder", str(d), "--gesture"])
    if r.returncode != 0:
        failed.append(d.name)
        print(f"FAIL {d.name}", flush=True)
if failed:
    print("failed:", ", ".join(failed), flush=True)
    sys.exit(1)
print("ok", flush=True)
