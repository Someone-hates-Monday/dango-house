# Handoff: Agent / Watch Party P0+P1

**Language / 语言 / 言語:** [简体中文](HANDOFF-AGENT-P0P1.zh-CN.md) · [English](HANDOFF-AGENT-P0P1.en.md) · [日本語](HANDOFF-AGENT-P0P1.ja.md)

Date: 2026-11-01 (P0/P1 snapshot). **Later increments:** [HANDOFF-COMPANION-BRIDGE.md](HANDOFF-COMPANION-BRIDGE.md). Based on [AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md).

## Implemented

- Async tool receipts and unknown-tool rejection (`electron/agent/tools.ts`)
- Independent task lifecycle (pause/resume/cancel) separate from chat `stop()`
- Local short-video import into `%APPDATA%/Qiting/media-cache`
- Shared evidence with `metadata_only` / `transcript_only` coverage
- Offline grounded discussion for 2–3 speakers + existing motion mapping
- Watch Together UI and task tray; UI language selectable in settings

## Not done

- Vision **model** understanding / Gemini native video / ASR (FFmpeg sample path exists later — see Companion Bridge handoff)
- Playwright browse path now exists in code; **human smoke + portable packaging** still open (see Companion Bridge)
- LangGraph.js (lightweight state machine for now)
- Outings and live spoiler-safe co-watching

## How to run

`npm.cmd test` · `npm.cmd run build` · `npm.cmd run dev` → **Watch together**.

Cancel via the task tray, not the chat Stop button.
