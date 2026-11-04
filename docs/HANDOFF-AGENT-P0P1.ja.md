# 引き継ぎ：Agent / いっしょに見る P0+P1

**Language / 语言 / 言語:** [简体中文](HANDOFF-AGENT-P0P1.zh-CN.md) · [English](HANDOFF-AGENT-P0P1.en.md) · [日本語](HANDOFF-AGENT-P0P1.ja.md)

日付: 2026-11-01（P0/P1 時点）。**以降の増分:** [HANDOFF-COMPANION-BRIDGE.md](HANDOFF-COMPANION-BRIDGE.md)。[AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md) 準拠。

## 実装済み

- 非同期ツール回执と未知ツール拒否
- チャット停止と独立したタスク寿命
- ローカル短尺の取り込みと media-cache
- `metadata_only` / `transcript_only` の共有証拠
- 2〜3人の根拠付きオフライン議論と既存動作
- 「いっしょに見る」UI・タスクトレイ・設定での表示言語切替

## 未実装

- 視覚**モデル**理解 / Gemini ネイティブ動画 / ASR（抽帧パスは後続交接を参照）
- Playwright 探しはコード上あり。**人手冒煙と portable 同梱**は未了（Companion Bridge 交接）
- LangGraph.js（当面は軽量状態機械）
- 外出とリアルタイム陪看

## 実行

`npm.cmd test` · `npm.cmd run build` · `npm.cmd run dev` → **いっしょに見る**。

キャンセルはタスクトレイから。チャットの停止ボタンでは止めません。
