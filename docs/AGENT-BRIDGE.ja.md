**Language:** [简体中文](AGENT-BRIDGE.zh-CN.md) · [English](AGENT-BRIDGE.en.md) · [日本語](AGENT-BRIDGE.ja.md) · [Index](AGENT-BRIDGE.md)

# Agent プラグイン橋：アプリ本体 + 任意プラグイン

団子小屋は **独立デスクトップアプリのまま**です。任意でローカル Agent Bridge を有効にすると、Cursor / Claude Desktop / Codex などが小屋を「人格ある舞台」として呼べます。製品をプラグイン専用にはしません。

## 形態

| 形態 | 担当 | 説明 |
| --- | --- | --- |
| **App（既定）** | ユーザーが小屋を開く | 陪伴・争寵・観影・デスクトップペット |
| **Plugin（任意）** | 外部 Agent が MCP/REST | **小屋起動中**かつ橋が有効であること |

## 手順

1. 団子小屋 → **設定** → **Agent プラグイン橋** → 有効化
2. Cursor / Claude / Codex / DeepSeek の設定をコピー
3. 各クライアントの MCP / harness 設定に貼り付け
4. **小屋を起動したまま**にする（プラグインは中継のみ）

セキュリティ：`127.0.0.1` のみ、Bearer token は userData の `bridge.json`、API Key は露出しません。

詳細なエンドポイントとツール一覧は [中国語版](AGENT-BRIDGE.zh-CN.md) / [English](AGENT-BRIDGE.en.md) および `plugins/*.example` を参照。

## 引き継ぎ

実装・未验收・次の手は [HANDOFF-COMPANION-BRIDGE.ja.md](HANDOFF-COMPANION-BRIDGE.ja.md)。
