# 更新记录 / Changelog

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
