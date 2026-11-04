**Language / 语言 / 言語:** [简体中文](HANDOFF-AGENT-P0P1.zh-CN.md) · [English](HANDOFF-AGENT-P0P1.en.md) · [日本語](HANDOFF-AGENT-P0P1.ja.md) · [Index](HANDOFF-AGENT-P0P1.md)

# 交接：Agent / 共同观影 P0+P1 / Handoff: Agent & Watch Party P0+P1

日期 / Date: 2026-11-01（正文仍描述当日 P0/P1；**2026-11-04 起增量见** [HANDOFF-COMPANION-BRIDGE.md](HANDOFF-COMPANION-BRIDGE.md)）  
基于公开规划 / Based on: [AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md)、[AGENT-REFERENCES.md](AGENT-REFERENCES.md)

> **后续增量：** 争宠/百合、`pairTone`、Playwright 浏览路径、可选抽帧、`Agent Bridge`（MCP/REST）已另文交接。下表「未实现」中浏览/抽帧条目以新交接为准，勿再当作完全空白。

## 已实现 / Implemented

| 能力 | 说明 | 真实程度 |
| --- | --- | --- |
| 异步工具注册与回执 | `electron/agent/tools.ts`：未知工具 / 缺权限 / 取消均返回 `ToolReceipt`，不执行副作用 | **真实执行** |
| 独立任务生命周期 | `electron/agent/runtime.ts`：start / pause / resume / cancel；与 `engine.stop()` 聊天取消隔离 | **真实执行** |
| 预算 | 步骤、时长、媒体秒数、发言人数、讨论轮数 | **真实执行** |
| 本地短视频导入 | 校验扩展名/大小，拷贝到 `%APPDATA%/Qiting/media-cache`，指纹缓存 | **真实执行** |
| 共享证据 | `perceiveLocalVideo`：有旁路字幕 → `transcript_only`；否则 `metadata_only`；可选 ffprobe 时长 | **真实执行**（无视觉模型） |
| 观影讨论 | 2–3 人独立观点 + 有限互评；映射已有 `think` / `wave` / `approach` / `shy` | **离线脚本 grounded**（依据证据，非七人复读） |
| UI | 侧栏「一起看」、`TaskTray`、选文件 IPC | **真实路径** |
| URL 来源 | 工具存在但诚实失败，不假装解析成功 | **接口预留** |

## 未实现 / Not done（勿当成已完成）

- ~~视觉抽帧 / Playwright 浏览~~ → **已有代码路径**，人手冒烟与便携包策略见 [HANDOFF-COMPANION-BRIDGE](HANDOFF-COMPANION-BRIDGE.md)；**视觉模型解读 / Gemini 原生视频 / ASR 仍未做**
- LangGraph.js（当前为轻量状态机；未叠多个 Agent 框架）
- 自主外出、实时陪看、剧透时钟
- API 模式下用聊天模型生成观影发言（现一律走证据脚本讨论，避免无视觉却冒充看懂）

## 如何运行 / How to run

```powershell
cd C:\Users\Someone\Desktop\DesktopPet
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

应用内：侧栏 **一起看** → 选最多三位 → **选择视频并一起看**。  
同目录放置 `.vtt` / `.srt` 可得到「仅字幕」覆盖。  
取消任务用任务托盘，不要依赖群聊「停止」（停止只取消聊天回合）。

## 如何验收 / Acceptance checks

1. 无 Key：导入本地短视频 → 出现任务与覆盖标注 → 2–3 人发言内容引用不同证据点。  
2. 无字幕文件：覆盖为「仅元数据」，文案不声称看见画面。  
3. 观影进行中点群聊「停止」：任务不变为 `cancelled`。  
4. 任务托盘「取消」后状态为 `cancelled`，不再继续往群聊塞讨论。  
5. 推荐区为空或明确写需 P2；无模型编造的 B 站/YouTube 链接。  
6. Dock / 摸摸 / 已有动作不回归（本改动未改动画资源管线）。

## 关键文件 / Key files

```
src/shared/agent.ts
electron/agent/{runtime,tools}.ts
electron/media/{source,perceive}.ts
electron/social/discussion.ts
src/WatchParty.tsx
src/TaskTray.tsx
tests/agent-runtime.test.ts
electron/engine.ts · electron/main.ts · electron/preload.ts
```

## 安全与数据 / Safety & data

- API Key 仍只经连接设置写入本机加密存储；本功能不要求也不读取 Key。  
- 媒体缓存位于 userData，不进 Git（`*.mp4` / `*.sqlite` 已忽略）。  
- 外站文本/字幕视为不可信观察，不能提升工具权限。  
- 进程退出时 `shutdownAgents()`；落盘 state 清空 agent UI，避免复活幽灵任务。

## 建议下一步 / Suggested next steps

1. 按 [HANDOFF-COMPANION-BRIDGE](HANDOFF-COMPANION-BRIDGE.md) 做人手验收（争宠体感、Bridge 真机、浏览/抽帧冒烟）。  
2. 若需要「看懂画面」：在抽帧之上接视觉模型，仍输出同一 `VideoEvidence`，禁止无证据声称。  
3. 需要时再评估接入 LangGraph.js，替换而非叠加编排层。

## 模拟 vs 真实 / Simulated vs real

| 项目 | 状态 |
| --- | --- |
| 工具回执 / 取消 / 导入 / 字幕解析 / UI | 真实 |
| 角色讨论文案 | 基于证据的本地导演脚本（非 LLM 实时） |
| 「看懂画面」 | **未验证**；无视觉配置时禁止声称 |
| 推荐三条真实视频 | P0/P1 有意留空；**浏览任务路径已加**，待真站验收（见 Companion Bridge 交接） |
