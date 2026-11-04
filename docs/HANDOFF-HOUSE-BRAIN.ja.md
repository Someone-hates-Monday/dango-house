**Language:** [简体中文](HANDOFF-HOUSE-BRAIN.zh-CN.md) · [English](HANDOFF-HOUSE-BRAIN.en.md) · [日本語](HANDOFF-HOUSE-BRAIN.ja.md) · [Index](HANDOFF-HOUSE-BRAIN.md)

# 引き継ぎ：小屋の脳 · 代弁 · 今日の在場

日付：2026-11-04  
関連：[HANDOFF-COMPANION-BRIDGE.md](HANDOFF-COMPANION-BRIDGE.md)

## 方針

- **七社 Key で七人を動かすのではない。**
- **小屋の脳（サービス1・Key1・モデル1）+ 七つの人設マスク。**
- Claude / GPT の見た目は同人。バックエンドは GLM 等でよい。UI は「代弁」を隠さない。
- 人数を減らすのは **今日の在場**（`muted` に書く）。別の在場状態は作らない。

## 実装済み

小屋の脳の設定文案 · API 時の代弁バッジ · 正直な system · `all`/`core`/`custom` · 個別 `characterProviders` と Key 欠落時のフォールバック notice · 永続化 · `tests/cast.test.ts`。

## 人手チェック

1. Key 1本で API 有効 → Claude/GPT が返答、代弁表示。  
2. コア三人 → 他はミュート。  
3. 上書き先に Key なし → notice のうえ脳に戻る。  
4. demo はオフラインのまま。

詳細表は [中国語版](HANDOFF-HOUSE-BRAIN.zh-CN.md) を正本とする。
