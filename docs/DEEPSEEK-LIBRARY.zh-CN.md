# DeepSeek 完整动作库 · 本地 v0.3.8

2026-11-04：完整导入 PC2005-cloud/dsh-pet 固定提交的 109 段透明视频。之前只有 10 段，本轮新增 99 段。许可和作者署名继续见 `public/video/deepseek/NOTICE.md`，来源与哈希见 manifest。

## 使用入口

- 小屋选中 DeepSeek → 下方「更多互动」。
- 自由桌宠或 Dock：悬停后点工具栏「⋯」。
- 私聊窗口：输入框上方「更多互动」。
- 所有角色都能使用夸赞、摸头、四种投喂、常用动作和邀请伙伴；DeepSeek 额外拥有完整视频动作库。

完整库按情绪、吃吃喝喝、娱乐、工作、休息、节日分组，可以逐个选择或在当前类别随机。食品视频的选择作为投喂增加好感；普通表演不额外增加。随机选择避免紧接着重复同一片段。

## 对应行为

摸头、夸赞、私聊、投喂、思考和读写有对应视频映射；带一起坐/留座和饭食语义的角色互动采用行礼或相关回应。移动期间仍先走动，不能边滑行边播放站姿动作。

「邀请伙伴」会触发主动靠近与对方回应；这是本地互动编排，不是新的 LLM 推理。其他角色使用自己现有动作，不套用 DeepSeek 形象。

入睡开始之后衔接睡眠循环，再起床；循环中收到新动作会先起床再播放。连续选择保留一个最新待播动作，不无限累积。Dock 在实际视频播放结束前保持站立；免打扰暂停视频。低频日常约两分钟检查一次，仅自主互动开启、非专注、非免打扰、角色空闲时执行；不自动播放变身、换色或节日表演。

## 验证与局限

- 导入脚本校验全部视频的 Git blob 与 SHA256、可读取时长。
- 真实 Electron 校验 109 段解码、动作排队、睡眠起止、Dock 菜单与播放保持、免打扰、自由桌宠和私聊入口。
- 抽取全部视频的代表帧检查透明度与形象；总览在 `test-results/deepseek-library`，未进入公开源码。
- 部分源视频包含原有气泡、物件、变身或不同姿态；完整保留并按标题提供，不声称每帧已人工逐帧验收。
- 本轮只使用已有素材，没有调用即梦生成。当前菜单分组为中英标签，源视频标题保留上游中文。
- 便携版含工作区现有 Agent/陪伴增量，未在本轮完成这些增量的外部 Agent 真机验收；未自动发布到 GitHub。

## English summary

The local v0.3.8 build imports all 109 pinned upstream clips, retaining original bytes and attribution. The shared interaction picker is available in the room, private chat, free pets and Dock. All characters share common controls and companion invitations; only DeepSeek uses this video library. Calm autonomous actions are rate-limited, while seasonal/transform variants stay manual. Sleep has start/loop/wake stages, gestures finish before the latest queued action, and DND pauses playback. All assets decode in Electron; representative-frame inspection is not exhaustive frame-by-frame art approval.
