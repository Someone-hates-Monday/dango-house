**Language / 语言 / 言語:** [简体中文](HANDOFF-COMPANION-BRIDGE.zh-CN.md) · [English](HANDOFF-COMPANION-BRIDGE.en.md) · [日本語](HANDOFF-COMPANION-BRIDGE.ja.md) · [Index](HANDOFF-COMPANION-BRIDGE.md)

# 交接：陪伴闭环 · 百合 · Agent 能干 · 插件桥

日期：2026-11-04  
基于：[COMPANIONSHIP-YURI-PLAN.md](COMPANIONSHIP-YURI-PLAN.md)、[AGENT-BRIDGE.md](AGENT-BRIDGE.md)、[AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md)  
前序交接：[HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md)（P0/P1 观影脚手架仍有效；本文覆盖其后增量）

## 产品定位（交接时勿偏航）

- **主形态仍是桌面 App**（团子小屋）：陪伴、争宠、百合日常、桌宠、本地观影。
- **Agent 是垂直技能**（找片 / 观影任务 / 诚实证据），不是 Cursor/Codex 级通用 harness。
- **插件是可选衍生**：本机 Bridge + MCP/REST，让外部 Agent 把小屋当「舞台/身体」；需 **App 正在运行**。不要改成「纯插件丢弃 App」。

## 已实现（代码在仓，不等于人手验收通过）

### Track A — 陪伴 / 百合

| 能力 | 落点 | 真实程度 |
| --- | --- | --- |
| `favor.focusId` / `favor.streak` | `src/shared/favor.ts`、`director` 落盘恢复 | **真实状态** |
| 亲密浓度 `pairTone` soft/warm/vivid | 设置 UI + `settings.pairTone` | **真实设置** |
| bond 档位 ≥40/60/80 | `src/shared/bonds.ts` | **真实阈值** |
| 连续偏爱争宠升级 | `GardenEngine.queueRivalryEscalation` | **有逻辑**；单测只断言系统 notice |
| 百合场景包 | `src/shared/social-yuri.ts` + i18n | **脚本场景**（非 LLM） |
| SocialBar 双人亲密 / 群像 | `src/SocialBar.tsx` | **UI 已接** |
| 空闲自动播双人糖 | `engine.tick` 与 social 交替 | **有触发**；DND/专注抑制已接线，**缺手测** |
| 今日偏爱 / 最黏一对 | `src/FavorStrip.tsx` | **只读反馈** |

### Track B — Agent 能干（相对 P0/P1 的增量）

| 能力 | 落点 | 真实程度 |
| --- | --- | --- |
| P2 可见浏览找片 | `electron/agent/browse.ts`、`browse_web_videos`、`browse-start` | **依赖 Playwright**；仅收录打开成功的 URL；无 Playwright 时诚实空结果 |
| 推荐卡真实 URL | WatchParty / runtime 填充路径 | **代码路径在**；**未做真站冒烟** |
| 可选视觉抽帧 | `electron/media/vision.ts` → `sampled_av` | **有 ffmpeg 才升级**；**无视觉模型描述像素**；失败则保持 metadata/transcript |
| URL 解析成片 | `resolve_url_video` | **仍诚实失败**（接口保留） |

### 插件桥（App + 可选插件）

| 能力 | 落点 | 真实程度 |
| --- | --- | --- |
| 本机 HTTP 桥 `127.0.0.1` + Bearer | `electron/bridge/http.ts`、`bridge.json` | **真实**；单测覆盖鉴权与 call |
| MCP stdio 中转 | `dist-electron/bridge-mcp.cjs` | **已构建**；**未做** Cursor/Claude/Codex 真机连通验收 |
| 设置开关与一键复制配置 | `src/Connections.tsx` | **UI 已接**；**缺手测** |
| 示例清单 | `plugins/*.example` | 示例路径需换成用户本机路径；优先用设置页复制的片段 |

## 自动化已覆盖 vs 尚未验收

| 层级 | 状态 |
| --- | --- |
| `npm test`（含 `companionship` / `bridge` / 既有 agent） | 通过（交接时约 50） |
| `npm run build`（含 `bridge-mcp.cjs`；Playwright 对 esbuild external） | 通过 |
| 连续偏爱三次 → **角色插入表演**（不只 notice） | **未人手验收** |
| soft vs vivid 台词可感差异 | **未人手验收** |
| 空闲自动百合 + DND/专注抑制 | **未人手验收** |
| Playwright 可见窗找片 → 可点 URL；托盘取消；Stop≠取消任务 | **未冒烟** |
| 有/无 ffmpeg 时覆盖标注诚实性 | **未冒烟** |
| 设置启用 Bridge → Cursor MCP `garden_get_snapshot` / `garden_praise` | **未真机验收** |
| portable 包内 Playwright 可用 | **很可能不可用**（playwright 在 devDependencies，未打进 files） |

## 未实现 / 勿当成已完成

- 视觉模型「看懂画面」/ Gemini 原生视频 / ASR  
- 任意 URL 观影闭环  
- Agent P3 自主外出、P4 实时陪看  
- LangGraph 等多重编排框架  
- 插件商店级一键安装 / 签名分发  
- Live2D、语音、成人向内容、通用 coding agent  

规划里写明不在范围的，不要当欠债塞进本交接。

## 如何运行

```powershell
cd C:\Users\Someone\Desktop\DesktopPet
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

- 陪伴：互动小屋 / 群聊夸赞与投喂；设置里调「亲密浓度」；侧栏 SocialBar 播双人亲密。  
- 浏览：一起看 → 外出找片（需本机可 `import('playwright')` 且浏览器已装）。  
- 插件：设置 → **Agent 插件桥** → 启用 → 复制 Cursor/Claude/Codex/REST 配置 → **保持小屋运行**。  
- 取消 Agent 任务用 **任务托盘**，不要依赖群聊「停止」。

## 建议人手验收清单（按优先级）

1. **争宠**：连续夸同一人 3 次 → 至少一位未偏爱角色插入吃醋/讨好（可复现）。  
2. **百合**：将某对 bond 抬过亲密阈值 → 空闲或 SocialBar 出双人短场景；soft / vivid 台词不同且非 NSFW。  
3. **抑制**：免打扰或专注开启时，上述自主互动不打断。  
4. **浏览**（可选环境）：「找两条治愈向短片」→ 可见浏览 → 推荐卡可打开 URL；托盘可取消；聊天 Stop 不取消浏览任务。  
5. **视觉诚实**：无 ffmpeg / 抽帧失败时不声称看见画面；有抽帧时为 `sampled_av` 且文案承认未用视觉模型解读。  
6. **Bridge**：启用后 REST `GET /v1/snapshot` 需 Bearer；错误 token → 401；关小屋后 MCP/REST 失败。  
7. **外部 Agent**（至少一家）：Cursor 或 Claude Desktop 装上复制的 MCP 配置，能调用 `garden_get_snapshot` 与 `garden_praise`。  
8. **回归**：Dock / 摸摸 / 本地观影 P0P1 清单仍成立（见前序交接）。

## 关键文件

```
# 陪伴 / 百合
src/shared/{favor,bonds,social-yuri,types,director}.ts
electron/engine.ts
src/{SocialBar,FavorStrip,Connections}.tsx
tests/companionship.test.ts

# Agent 增量
electron/agent/{runtime,browse}.ts
electron/media/vision.ts
src/WatchParty.tsx

# 插件桥
src/shared/bridge.ts
electron/bridge/{http,persist,mcp-stdio}.ts
dist-electron/bridge-mcp.cjs   # build 产出
plugins/*.example
tests/bridge.test.ts
docs/AGENT-BRIDGE*.md
```

## 安全与数据

- Bridge 仅 `127.0.0.1`；token 在 `%APPDATA%/Qiting/bridge.json`；**不**经 Bridge 暴露 API Key。  
- 快照不含 `connections` 密钥类字段。  
- 外站页面 / 字幕不可提升 grants。  
- Agent UI 落盘仍清空，避免幽灵任务；Bridge `enabled` 随 `settings.agentBridge` 恢复。

## 单脑驱动 / 假扮 / 减员（2026-11-04 增量）

完整交接（验收清单、路由图、关键文件）见 **[HANDOFF-HOUSE-BRAIN.zh-CN.md](HANDOFF-HOUSE-BRAIN.zh-CN.md)**。

- **默认小屋大脑**：一把 Key + 一人设面具驱动全员；API 模式显示「由 X 代言」。  
- **今日在场**：全员 / 核心三人 / 自定义 → `muted`。  
- **高级覆盖**：`characterProviders`；缺 Key 回落并 notice。

## 建议下一步（给下一位）

1. 先完成上文 **人手验收 1–3 与 6–7**（体感 + 插件真连通）。  
2. 再补浏览/视觉冒烟；若要便携包可用浏览，需把 Playwright 运行时纳入发布策略并写清体积代价。  
3. 同步过时表述：以本文与 [AGENT-BRIDGE](AGENT-BRIDGE.md) 为准；P0/P1 细节仍看 [HANDOFF-AGENT-P0P1](HANDOFF-AGENT-P0P1.md)。  
4. 不要为了「更像完整 Agent」重做产品；优先加深舞台契约与诚实证据。  
5. 人手点一遍：只配一把 GLM Key → 全员可聊；核心三人减员；某角色 override 无 Key 时出现回落 notice。

## 模拟 vs 真实（速查）

| 项目 | 状态 |
| --- | --- |
| favor / pairTone / bond 阈值 / 场景脚本 | 真实状态机 + 本地剧本 |
| 争宠「插入表演」体感 | 逻辑有，**待手测** |
| Playwright 找片 | 代码真实，**待环境冒烟** |
| 视觉「看懂」 | **未做**（仅可选抽帧占位） |
| MCP 给 Cursor 等用 | 中转真实，**待真机安装验收** |
| 观影讨论台词 | 仍为证据 grounded 本地导演（非七人 LLM 实时看片） |

## 2026-11-04 插件验收增量

已使用官方 MCP SDK 对真实开发版和 0.3.9 打包版完成握手、10 个工具发现、状态读取、摸头/投喂/夸奖、角色动作与鉴权/禁用验证。修复 stdio 封包与 app.asar 内脚本不可被外部 Node 运行的问题。宿主客户端 UI 安装仍需单独验收；详见 [定位与验收](PRODUCT-REVIEW.zh-CN.md) 及 `scripts/verify-agent-bridge.mjs`。
