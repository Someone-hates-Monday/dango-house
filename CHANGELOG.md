# 更新记录 / Changelog

## 0.4.0-alpha.3 · 2026-11-15 · Idle identity guard / 待机形象切换防护

- 修正待机遇到残留互动特效时短暂切换备用图的条件；不删帧、不回滚 S1。Keep standing idle active while leftover interaction effects finish; preserve S1.
- 固定 GPT 备用图版本地址与白龙图集散列，增加运行中媒体/纹理来源标记。Pin reviewed fallback identity and expose local source diagnostics.
- 新增循环边界与备用动作的打包验收脚本。Add packaged loop-boundary and fallback-action verification.
- 用户截图中的灰发龙女尚未在当前源码与打包进程中复现；不将防护修复写成已定位该截图的完整根因。The reported grey-haired identity has not been reproduced; these guards are not proof of the screenshot's root cause.

## 0.4.0-alpha.2 · 2026-11-15 · Natural encounters / 自然相遇

- 恢复 GPT 已接入的主体 S1 待机，撤销误退 Oct29 的整段回滚，保留循环与暂停修复。Restore accepted S1 idle while retaining playback fixes.
- 移除试玩条、剧情演示按钮与 CG 点播菜单；普通互动和角色关系继续触发演出。Remove tryout/story/CG preview controls; retain interaction-driven scenes.
- 增加独立存档的本机录制脚本，详见 [录制说明 / Recording](docs/DEMO-RECORDING.md)。Add an isolated local recording harness.

## 0.4.0-alpha.1 · 2026-11-15 · Relationship scenes / 关系演出

- 接入九段关系与用户向 CG，支持前置对话、单人/双人/多人共用一个头顶播放器和结束/取消回执。Nine relationship/POV clips, dialogue preludes, shared overhead playback and completion/cancellation receipts.
- 增加独立百合与事件短片偏好；用户恋爱 CG 跟随恋人模式，事件片带冷却。Independent pair-affection/event-clip preferences, Lover-mode POV scenes and cooldowns.
- 恢复已确认的 GPT 多帧待机，移除运行候选，修复暂停后动作恢复与意外停帧。Restore reviewed GPT idle and repair paused playback without removing normal animation.
- 完善角色在场、剧情结算、私聊返回、Claude 动作和播放边界；保留离线演示与可选 API/Agent Bridge。Improve cast/story lifecycle, Claude actions and playback while retaining offline demo and optional API/Agent Bridge.
- 公开测试版本；原生多屏混合 DPI 和真实 API 组合的完整覆盖仍待持续验证。Public alpha; mixed-DPI and real-provider combinations remain subject to ongoing testing.

## 0.3.9 · 2026-11-04 · Source Alpha / 源码 Alpha

- 修复 MCP stdio 消息格式及打包脚本路径；官方 MCP SDK 对真实开发版与打包版完成端到端验收。Fix MCP stdio framing and packaged entry paths; verify both development and packaged apps with the official MCP SDK.
- 新图标采用三位团子共享 Dock 与爱心小屋，包含多尺寸 ICO。New shared-Dock/heart-roof mark with multi-resolution Windows ICO.
- [定位对比与验收范围](docs/PRODUCT-REVIEW.zh-CN.md) · [Product review and test scope](docs/PRODUCT-REVIEW.en.md)。各宿主客户端 UI 安装仍待单独验证。Individual host-client UI installation remains unverified.
- 验收单脑人设路由、缺 Key 回落与核心三人；修复重复吃醋角色、换阵容遗留剧情、自动互动开关漏管场景等问题。Verify persona routing/fallback and cast presets; fix duplicate rivals, stale scenes and autonomy gating.
- [下一阶段实施规格](docs/CURSOR-COMPANIONSHIP-NEXT.zh-CN.md) · [Next-stage specification](docs/CURSOR-COMPANIONSHIP-NEXT.en.md)：真正人数编辑、共享事件记忆与三个可玩社交闭环仍是计划。Presence editing, event memory and richer social loops remain planned.

## Unreleased · Companionship / bridge + Agent P0–P2 paths

- 争宠 favor streak、亲密浓度 `pairTone`、bond 档位、百合场景包、FavorStrip；详见 [docs/HANDOFF-COMPANION-BRIDGE.md](docs/HANDOFF-COMPANION-BRIDGE.md)。Favor streak, pairTone, bond tiers, yuri scenes, FavorStrip.
- Playwright 可见浏览路径（仅真实打开成功的 URL）；可选 FFmpeg 抽帧升为 `sampled_av`（无视觉模型）。Browse path with verified URLs; optional frame sampling without a vision model.
- 可选本机 Agent Bridge（HTTP + MCP），设置页复制 Cursor / Claude / Codex / REST 配置；App 仍为主形态。Optional localhost bridge; app remains primary.
- **小屋大脑**：一个 Key 驱动全员人设；「由 X 代言」诚实标签；今日在场（全员/核心三人/自定义）；可选角色后端覆盖与回落。House brain + cast presets + per-character provider overrides.
- 既有 P0/P1 观影脚手架与三语 UI 保留。Prior watch-party scaffold and locales remain.
- 人手验收、真机 MCP、便携包内 Playwright 仍开放，见交接文档。Manual acceptance, live MCP installs, and portable Playwright packaging remain open — see the handoff.

## 0.3.7 · 2026-10-30 · Alpha

- 为图集补充绘制余量，小屋边缘留出宽动作空间，修复 Kimi 等裁切，保持人物大小与脚底锚点。Pad atlas rendering and room edges to prevent clipping while preserving scale and foot anchors.
- 真实验证 DeepSeek 流式回复、GPT 人设和形象工具。Verify live DeepSeek streaming, GPT persona, and avatar tools.
- 整理公开仓库、双语介绍、实拍与社区文档。Prepare the public repository, bilingual introduction, runtime screenshots, and community docs.

## 0.3.6

接入 GPT、Gemini、GLM、Kimi、Grok 视频待机，关闭走动仍待机，免打扰暂停。Integrate five video idles, preserving playback with wandering off and pausing in Do Not Disturb.

## 0.3.5

接入 Gemini、GLM 完整摸头视频，修复容器与视频裁切。Integrate complete Gemini/GLM headpats and fix clipping.

## 0.3.4

接入完整 GPT PixVerse P1 摸头，不倒放不裁短。Integrate the full GPT P1 reaction without reversing or trimming.

## 0.3.0–0.3.3

加入 Dock、悬停站起、正常比例立绘、Claude 互动、排队与渲染修复。Add Dock resting, hover wake-up, full-proportion portraits, Claude reactions, queuing, and rendering fixes.

## 0.1–0.2

建立七人小屋、模型连接、互动、投喂好感、群像与来源记录。Establish the house, providers, interaction, affection, social scenes, and provenance.
