# 更新记录 / Changelog

## 0.5.0-alpha.10 · 2026-11-16 · Connected companion scenes / 聊天驱动同伴演出

- 公共聊天按语义选择同伴场景；私聊邀请工具接通真实走近、接话、Q版动作及一份共享CG，取消的邀请不延迟偷跑。Semantic public scenes and private invitation tools execute movement, peer replies, gestures and a shared CG, with cancellation guards.
- “你们自己玩”和用户回来可由模型更新持久相处偏好，底部显示当前状态；不擅自开启自动闲聊。Persist independent-play preference from explicit user intent and show it in the footer without enabling disabled autonomy.
- 七位角色口语卡去除强制道具梗；新版语气上下文不再回放旧台词，可见历史与明确记忆保留。Separate conversational voices from props; migrate generation context while preserving visible history and explicit memories.
- 156 项测试、公开/私聊端到端、真实 DeepSeek 联动与七位角色对白抽查通过。156 tests, public/private integration, live DeepSeek scene checks and seven voice samples passed.

## 0.5.0-alpha.9 · 2026-11-16 · Pointer attention / 鼠标停留回应

- 小屋和自由桌宠停留后先有单次轻微视觉反馈，再等待模型；GPT 保持验收视频，不启用旧立绘。A single dwell acknowledgement precedes API speech and preserves GPT’s approved video.
- 忙碌、场景占用或 API 失败不再误计问候冷却；主动闲聊开关不再禁止用户悬停互动。Dropped/failed greetings do not burn cooldown; pointer input is independent of autonomous chatter.
- 短暂划过、点击、拖动、失焦和免打扰取消等待；成功问候保留频率限制。Cancel accidental dwell while retaining successful-speech limits.
- 148 项测试、真实指针隔离检查及一次真实 DeepSeek GPT 问候通过。148 tests, isolated pointer integration and a live DeepSeek GPT greeting passed.

## 0.5.0-alpha.8 · 2026-11-15 · Companion voices / 自然陪伴对白

- 七位角色共用结构化表达指引，普通善意互动不再默认以责怪、拒绝反转或收费收尾。Shared voice guidance favors natural responses to ordinary kindness without obligatory corrective endings.
- 旧对白成为有限、标明虚构的语气参考；公共和私聊文字由模型生成，当前输入明确传递，生成器缺失不退回本地台词。Legacy dialogue becomes bounded style references; model output stays intact, current input is explicit, and missing generators report errors.
- 提醒先准时通知，空闲时再由模型回应，不抢占正在进行的场景。Reminders notify on time, with model responses only when idle.
- 144 项测试、隔离端到端检查与六项真实 DeepSeek 检查通过。144 tests, isolated end-to-end checks and six live DeepSeek interactions passed.

## 0.5.0-alpha.7 · 2026-11-15 · Attention belongs to the interaction / 区分用户与同伴互动

- 摸头、投喂、喜爱和私聊优先回应用户，不再强制补第二人或自动走向同伴；明确的同伴交流仍保留多人接话与移动。User interactions accept solo responses; explicit social scenes retain exchanges and purposeful movement.
- 移除提示中的固定回应与演示上下文污染，关闭 API 动作附赠固定同伴台词。Remove canned prompt replies, local-script context and implicit scripted API-tool responses.
- 按互动对象过滤 CG，并在聊天记录区分 AI、本地与历史来源。Filter CG by audience and label model/demo/history provenance.
- 139 项测试、隔离端到端检查和四项真实 DeepSeek 互动检查通过。139 tests, isolated end-to-end checks and four live DeepSeek interactions passed.

## 0.5.0-alpha.6 · 2026-11-15 · Stable window and reactions / 窗口与动画稳定性

- 为气泡/CG 保留稳定的透明上方空间；修正新消息与秒级时钟竞态，避免对白导致窗口反复收缩、展开；相同原生边界不重复 setBounds。Stable transparent headroom and immediate bubbles; avoid redundant native resizing during dialogue.
- 修复 Claude 退出免打扰/停止后的视频冻结，以及走路结束不能正确切入互动的状态判断。Recover Claude idle after DND/stop and correctly hand off from travel to gestures.
- 摸头、投喂和直接选择的动画优先播放；DeepSeek 正常走路结束直接衔接到达动作，明确摔倒演出不变。Prioritize direct gestures and hand off DeepSeek travel without an unrelated recovery tail.
- 吃白饭按实际素材长度保留；演示中的分享动作等投喂完成再开始。Honor the rice clip duration before starting a sharing scene.

## 0.5.0-alpha.5 · 2026-11-15 · Walk over to chat / 走近再聊

- 分离目的性移动与随意巡游，按实际角色坐标显示行走和停留；不再固定站位或只偏移几像素。Separate purposeful travel from wandering and render real paths with persistent destinations.
- 同伴接话可走近对方，模型可用 `gather` 约两三位到窗边、地毯或家具附近；到位后再发言并推迟后续演出。Approach peers or gather at a shared spot; speech and later steps wait for arrival.
- 路线预留同伴占用空间，允许部分重叠但控制在一半以内；无可用路线或已靠近时不原地走路。Reserve paths and limit overlap; no walking in place when blocked or already near.
- 保留 GPT 已验收的视频形象；有现成走路动画的角色使用对应素材，其他角色移动时保留形象并轻微起伏。Keep approved identities; use reviewed walk clips where available and subtle stepping otherwise.

## 0.5.0-alpha.4 · 2026-11-15 · Cleaner roof / 简洁屋顶

- 去掉“拖动小屋”文字把手，保留屋顶空白处/边缘按住拖动与位置记忆。Remove the labelled drag grip; retain blank-roof/edge dragging and persisted position.

## 0.5.0-alpha.3 · 2026-11-15 · Shared conversations & dragging / 接话与拖动

- 小屋大脑改为规划相关角色的短回合交流，加入关系取向、同伴接话和无台词动作；显式互动的独白最多做一次有时限的模型补全。Plan connected multi-resident exchanges with social affinities, reply targets and silent reactions; at most one bounded expansion of a solitary explicit response.
- 悬停和主动问候不能取消已排好的同伴台词；对白按长度留出阅读时间。Hover/autonomy cannot interrupt queued replies; pace turns for reading.
- 私聊期间继续显示其他角色的公开气泡，保留私聊记录隔离。Public speech remains visible during private chat without leaking private transcripts.
- 新增明确的“拖动小屋”屋顶把手和主进程拖动处理，保存实际窗口位置。Explicit roof grip moves the native window and persists position.

## 0.5.0-alpha.2 · 2026-11-15 · Clear controls / 清晰的控制与全局设置

- 恢复带角色名的气泡对白，在小屋上方一次显示一段；点气泡展开完整记录，CG 优先使用上方空间。Restore speaker-labelled speech bubbles; open history from the bubble, with CG taking priority above the house.
- 屋檐设置直接打开完整全局设置，分为小屋与聊天、伙伴与关系、AI 连接和高级选项；桌宠/Dock、私聊后端覆盖、Agent 插件联动归入高级功能。One complete global settings page, grouped by daily house use, relationships, AI connection and advanced features.
- 删除重复的紧凑连接表单及未使用旧设置；设置侧栏不再展示角色选择，避免误认为逐角色配置。Remove duplicate setup UIs and the misleading resident selector in global settings.
- 明确显示“× 返回小屋”“× 关闭聊天”“× 收起”；置顶按钮以颜色、图钉方向和文字反馈真实状态，并跨重启保存。Explicit labelled close/back controls; pin color, direction and text reflect native persisted state.

## 0.5.0-alpha.1 · 2026-11-15 · A tiny shared home / 桌面迷你小屋

- 透明爱心房子替代主工作台入口；沿屋檐排列按钮，底座承载互动与短句，下方展开聊天与连接表单。A transparent house, roof controls, shared base and attached chat/setup panel.
- 紧凑三人默认阵容、可调整并记忆的房屋尺寸；保留多人和桌宠/Dock 高级入口。Compact trio, persisted resizing, optional larger casts and Dock/free-pet views.
- API 模式统一生成群聊和触摸、投喂、夸奖、私聊欢迎、同伴生活的回复/动作；测试成功后自动启用；错误不回退成伪 AI 剧本。Bounded model-directed house events, automatic enablement after connection testing, honest errors.
- 单份 CG 在房子外上方播放，聊天在下方；空间不足时折叠提示。One shared CG above the house, chat below, folded affordance when space is insufficient.
- 保留 GPT 正确的 225 帧循环与 P1 动画；增加迷你窗口、模拟 API 和解码循环验收。Retain approved GPT media and add native-window/API-fixture/decoded-loop checks.

## 0.4.0-alpha.6 · 2026-11-15 · Readable settings / 设置页易读性

- 修正文本输入框的整行样式错误作用于复选框；工具开关、角色勾选和说明重新靠近，统一字号与点击区域。Fix full-width checkbox styling and keep controls beside their labels; improve text and hit targets.
- 为 DeepSeek 官方接口提供可点击填写的 `deepseek-flash` / `deepseek-v4-pro` 示例，保留自定义输入，明确第三方中转需按其控制台填写。Add official DeepSeek model examples with editable IDs and gateway guidance.
- 设置页保留当前后端，不再把 DeepSeek 等已选服务重置为 GLM；移除已不存在的手动预览文案。Preserve the active provider and remove obsolete preview instructions.
- 中英日设置页与两种窗口尺寸完成布局检查；新版仍使用已清理的 GPT 待机素材。Check settings across three locales and two window sizes; retain the cleaned GPT idle.

## 0.4.0-alpha.5 · 2026-11-15 · Remove contaminated tail / 清理污染尾帧

- 复现并确认：S1 文件实际 241 帧，末尾 16 帧是导出目录残留的另一名龙女，清单误记为 225 帧。Confirmed 16 stale PNG frames of a different character were appended to the 225-frame S1 export.
- 无损移除错误尾帧，全部正常 225 帧的解码 RGBA 哈希不变；摸头视频不变。Stream-copy repair preserves every correct frame and alpha; P1 unchanged.
- 修复导出脚本的残留帧处理、输出帧数限制与编码后帧数校验；运行验收检查实际时长与完整解码循环。Fix stale-frame isolation, encoder frame caps and actual-count/full-loop verification.

## 0.4.0-alpha.4 · 2026-11-15 · GPT video-only / GPT 独立视频呈现

- 根据用户复测，alpha.3 仍闪变，撤销“调整备用图切换即可解决”的假设。User retest still found identity flashes in alpha.3.
- GPT 站立形态只挂载最新已接受的即梦 S1 待机与 P1 摸头视频，不再挂载任何备用立绘/动作图集；未补齐的动作继续使用视频和互动特效，不混入其他形象。GPT standing form mounts approved videos only; unsupported cues retain that identity and interaction effects.
- 媒体等待、循环和错误不再切到备用人物。Dock 趴姿及小头像仍是独立展示用途。No alternate character on waiting, loop boundaries or media errors; Dock resting art and small avatars remain separate presentations.

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
