**Language:** [简体中文](HANDOFF-COMPANION-BRIDGE.zh-CN.md) · [English](HANDOFF-COMPANION-BRIDGE.en.md) · [日本語](HANDOFF-COMPANION-BRIDGE.ja.md) · [Index](HANDOFF-COMPANION-BRIDGE.md)

# 引き継ぎ：陪伴ループ · 百合 · Agent · プラグイン橋

日付：2026-11-04  
根拠：[COMPANIONSHIP-YURI-PLAN.md](COMPANIONSHIP-YURI-PLAN.md)、[AGENT-BRIDGE.md](AGENT-BRIDGE.md)、[AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md)  
前段：[HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md)（P0/P1 は有効。本稿はその後の増分）

## 製品方針

- **本体はデスクトップ App**のまま。
- Agent は縦割り技能（探し・観影・正直な証拠）。汎用 coding harness ではない。
- プラグインは **任意**：ローカル Bridge + MCP/REST。外部 Agent が小屋を「舞台」として使う。**App 起動必須**。プラグイン専用化しない。

## コード上は実装済み（人手验收とは別）

偏愛 streak / `pairTone` / bond 閾値 / 争寵エスカレーション / 百合シーン / SocialBar / アイドル二人 / FavorStrip。  
Playwright 閲覧（開けた URL のみ）/ 任意 FFmpeg 抽帧（`sampled_av`、視覚モデルなし）/ URL 解決は誠実に失敗。  
HTTP Bridge + `bridge-mcp.cjs` + 設定画面のコピー。HTTP 単体テストあり。**Cursor 等への実機接続未验收**。portable に Playwright が入っていない可能性大。

## 未実装

視覚モデル理解、URL 観影、P3 外出、P4 リアル陪看、複数オーケストレーション枠、ストア級ワンクリック導入、Live2D / 音声 / 成人向け / 汎用 coding agent。

## 実行

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

設定 → Agent プラグイン橋を有効化し、小屋を起動したまま。Agent 取消は **タスクトレイ**（チャット Stop ではない）。

## 人手验收（優先）

1. 同一キャラを 3 回褒める → 他者が割り込む。  
2. bond を上げて二人シーン；soft ≠ vivid；非成人。  
3. DND / 集中で自律を抑制。  
4. 閲覧（Playwright 可なら）実 URL・取消・Stop 非連動。  
5. ffmpeg 有無での正直な coverage。  
6. Bridge の Bearer / 401 / App 終了後の失敗。  
7. Cursor か Claude で `garden_get_snapshot` / `garden_praise`。  
8. P0/P1 観影回帰。

詳細表・ファイル一覧は [中国語版](HANDOFF-COMPANION-BRIDGE.zh-CN.md) を正本とする。

## 小屋の脳 / 在場（2026-11-04）

詳細は [HANDOFF-HOUSE-BRAIN.ja.md](HANDOFF-HOUSE-BRAIN.ja.md)。
