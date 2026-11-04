# デスクトップペットから「見て・巡る」仲間へ

**Language / 语言 / 言語:** [简体中文](AGENT-WATCH-PARTY-PLAN.zh-CN.md) · [English](AGENT-WATCH-PARTY-PLAN.en.md) · [日本語](AGENT-WATCH-PARTY-PLAN.ja.md)

調査日：2026-11-01。**提案＋P0/P1 足場**（ローカル取り込み、タスク実行、正直な証拠ラベル、オフライン観影トーク）。閲覧で探す・視覚/ネイティブ動画理解・実在推薦URL・リアルタイム同伴は未実装。引き継ぎは [HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md)。参考一覧は [AGENT-REFERENCES.md](AGENT-REFERENCES.md)。

## 方針

短尺の「いっしょに見る」を先に：リンク/ローカル → 理解 → 2〜3人が根拠つきで話す → 検証済みの次本。取消・再開・予算の Agent 基盤を同時に。

推奨スタック：Electron/TS、Playwright、SQLite、FFmpeg、Gemini ネイティブ動画または字幕/ASR+抽帧+視覚、既存テキスト接続、必要なら LangGraph.js（当面は軽量ステートマシン可）。

## 受け入れ（P0/P1）

隔離キャッシュへのローカル短尺取り込み、カバー注釈つき共有証拠、2〜3人の独立引用、チャット停止は Agent を止めない、タスクトレイで pause/resume/cancel。

詳細な原文は中国語ページを参照。
