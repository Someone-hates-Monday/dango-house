# From desktop pets to browsing companions

**Language / 语言 / 言語:** [简体中文](AGENT-WATCH-PARTY-PLAN.zh-CN.md) · [English](AGENT-WATCH-PARTY-PLAN.en.md) · [日本語](AGENT-WATCH-PARTY-PLAN.ja.md)

Research and code review: 2026-11-01. **Proposal plus an in-progress P0/P1 scaffold** (local import, task runtime, honest evidence labels, offline watch discussion). Browsing discovery, vision/native video understanding, verified recommendation URLs, and live co-watching are still unimplemented. Handoff: [HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md). Reference catalog: [AGENT-REFERENCES.md](AGENT-REFERENCES.md).

## Recommendation

Start with a short-video watch party: a user supplies a link/file, one perception module analyzes it, two or three characters discuss it, then recommend a verified next video. Build cancellation, recovery, and budget controls underneath; add autonomous browsing and live co-watching afterward.

Preferred stack: retain Electron/TypeScript; Playwright for visible browser actions; SQLite for tasks/evidence/preferences; FFmpeg for media; either Gemini's native video interface or captions/ASR plus sampled frames and a vision model; existing text providers for character dialogue; LangGraph.js for resumable workflows (or keep the lightweight state machine until proven).

## Three experiences

1. **Task agents** — one operator per browser tab; characters volunteer, director picks; failures surface honestly.
2. **Browsing outings** — start with explicit tasks; later opt-in outings with budgets; Dock shows expandable bubbles only.
3. **Watch parties** — offline/local first (P0/P1 done scaffold), then live spoiler-safe co-watching; never invent recommendation URLs.

## Acceptance (P0/P1)

- Import local short video into isolated cache
- Shared evidence with honest coverage labels
- 2–3 speakers with distinct cites; chat Stop does not cancel agent tasks
- Pause/resume/cancel via task tray

## Deferred

Vision/native video, Playwright discovery, LangGraph.js adoption decision, live co-watching, real next-URL recommendations.

The Chinese page keeps the full original research write-up.
