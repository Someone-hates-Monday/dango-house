# 陪伴闭环 · 百合亲密 · Agent 能干

**Language / 语言 / 言語:** [简体中文](COMPANIONSHIP-YURI-PLAN.zh-CN.md) · [English](COMPANIONSHIP-YURI-PLAN.en.md) · [日本語](COMPANIONSHIP-YURI-PLAN.ja.md)

日期：2026-11-01。基于现有七人小屋、P0/P1 观影脚手架与 [AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md)。

## 目标

1. **对用户争宠**：偏爱有 streak 与后果，而不只是短剧按钮。
2. **角色间百合**：留座、贴贴、转赠点心、双人日常；服务喜欢看 AI 娘彼此亲密的用户。
3. **能干**：本地观影已有 → 可见浏览拿真实 URL → 可选视觉证据。

## 调性

软甜～暧昧日常（害羞、并肩、牵手暗示、吃醋），**非 NSFW**。设置「亲密浓度」：`soft` / `warm` / `vivid`。CP 线索沿用 `social.ts`（Claude×DeepSeek、GPT×DeepSeek、Grok×GPT、星猫×黑狐、陪读等），不另起冲突正史。

## Track A — 陪伴

| 字段 | 含义 |
| --- | --- |
| `favor.focusId` / `favor.streak` | 近期偏爱对象与连续次数 |
| `settings.pairTone` | 亲密浓度 |
| `bonds` 阈值 | ≥40 日常 · ≥60 亲密 · ≥80 专属双人 |

规则：夸赞 / 私聊 / 投喂抬高 affection 与 favor；对位 CP 抬 bond；连续偏爱 ≥3 触发争宠升级；高 bond 空闲优先播双人亲密场景。免打扰与专注抑制自主互动。

## Track B — Agent

1. P2：Playwright 独立 profile、可见窗口、预算与取消；推荐卡只含真实打开成功的 URL。
2. 可选视觉适配器写入同一 `VideoEvidence`；无视觉时保持诚实覆盖标注。

## 验收摘要

- 连续偏爱同一人三次 → 他人吃醋/讨好可复现。
- bond 达阈值 → 空闲可自动双人亲密；`soft` 与 `vivid` 台词不同且非成人向。
- 浏览任务：可见进度 + 可点开 URL；聊天 Stop 不取消 Agent。
