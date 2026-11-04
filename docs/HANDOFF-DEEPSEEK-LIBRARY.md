# DeepSeek 动作库交接 / Animation library handoff

2026-11-04，本地 v0.3.8；接续 Companion Bridge 交接，不覆盖其未完成事项。

- 上游 PC2005-cloud/dsh-pet 提交 `81ca3a0b6ad9802362656e7b93a5b4f757b2b91b` 共 109 段全部导入。原 10 段保留文件名，新 99 段使用 Git blob 前缀 ID。全部校验 SHA256/Git blob，并在 Electron 解码。
- 清单：`public/video/deepseek/manifest.json`；类型化索引：`src/shared/deepseek-clips.ts`；动作选择与语义映射：`src/shared/deepseek-animation.ts`。
- 共享 UI：`src/CompanionInteractions.tsx`；小屋、私聊、自由桌宠、Dock 均接入。DeepSeek 显示全部库；其他伙伴显示自己的通用交互与邀请伙伴。
- 新 action：`play-clip`（仅 DeepSeek，白名单 ID / 可选随机分类）、`companion-visit`（自身靠近及另一位回应）。未扩展 LLM perform_action schema 来枚举 109 段；模型原有动作可走语义映射，完整库通过 UI 选择。
- `VideoSprite` 支持完整单次片段、一个最新待播、睡觉开始/循环/起来、免打扰，以及 Dock 播放保持。移动先走动，不播放站姿滑行。
- 日常随机在自主开启、非 DND/专注/忙碌且空闲时低频检查，不播放随机变身或换色。食品库选择会增加好感，普通表演不增加。
- Dock 工具栏不能带 transform，否则固定菜单会偏移并导致页面滚动。菜单按钮需要覆盖 toolbar 的 32px 宽度规则。两处已修复，勿回归。
- `scripts/verify-deepseek-library.mjs --packaged` 已通过：109 段解码、动作队列、睡眠恢复、菜单边界/按钮可读、Dock 保持、DND、自由桌宠与私聊入口。
- `npm test` 54 项通过、构建通过。代表帧 alpha 校验与三张总览在 `test-results/deepseek-library`；不是完整逐帧美术验收。
- `release/v0.3.8` 已生成便携包和解包版；桌面快捷方式已更新。旧进程位于 `release/win-unpacked`，仍在运行，单实例阻止直接换新版。未强制终止，需用户从托盘正常退出再开新版。
- 本轮未提交即梦生成，也未动用其他视频服务额度。下一步仍是补 Kimi/Grok 专属互动、其他角色新增动作和可选的精确模型动作工具。
- 工作区包含前序 Agent / 三语 / 陪伴功能的大量未提交改动。本轮没有提交或公开发布全部工作区，接手时不要覆盖。

English: All 109 pinned upstream clips are imported and available through a shared picker in the room, private chat, free pets and Dock. Runtime checks include decoding, queued gestures, sleep lifecycle, menu usability and DND. The local 0.3.8 build is ready; quit the older tray process before starting it. No generation credits were used. Preserve the existing uncommitted Agent/companion/i18n changes.
