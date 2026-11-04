# 交给 Cursor 的提示词 / Prompt for Cursor

下面整段可直接复制。详细中文规格及英文摘要在相邻文档。

```text
请接手团子小屋 Dango House（Windows/Electron/React/TypeScript），工作目录 C:\Users\Someone\Desktop\DesktopPet，仓库 https://github.com/Someone-hates-Monday/dango-house。

先读 docs/CURSOR-COMPANIONSHIP-NEXT.zh-CN.md（本轮最终规格），再读 docs/HANDOFF-HOUSE-BRAIN.zh-CN.md、docs/HANDOFF-COMPANION-BRIDGE.zh-CN.md、docs/HANDOFF-DEEPSEEK-LIBRARY.md 和 docs/PRODUCT-REVIEW.zh-CN.md。有冲突时以 NEXT 规格为准，它明确修订了“用静音模拟人数”的旧设计。

产品重心是 AI 娘共同生活的有趣互动、百合日常和对用户的善意争宠。保留 App、群聊、独立私聊、可布置房间、自由桌宠、Dock 排排趴，以及可选 MCP/REST 舞台桥。一把模型 Key 演绎不同人设即可，角色身份不等于官方厂商 API。不要把项目改成万能 Agent 控制台。

请直接实施，按规格分三次本地提交：A 真正在场集合、与静音分离、编辑 UI、全路径筛选及旧数据迁移；B 可取消的单一场景导演、有界共享事件记忆、三个有变化且动作同步的离线社交闭环；C 可选一次请求生成短场景、每条回复实际后端来源、易发现试玩入口和文档。先让 A/B 完整可玩，再做 C；不能以增加一堆按钮或更换几句台词冒充完整体验。

必须做的故事：选 Claude 私聊→她开心、其他 1–2 人按性格争宠→返回收尾；Claude 给 DeepSeek 留座/分享→双方回应与记忆；Gemini 与 GLM 的友情价关心→个性化旁观。各自有至少两种结尾或后续，缺席成员不幽灵出场。关系增长来自实际共同事件，不因用户摸头自动刷 CP。保留现有人设差异，不以责备/情绪勒索催用户回来。

保留全部既有动画与 DeepSeek 的 109 段素材、完整播放和睡觉起落过程；不要把所有互动降级为一套傻笑。Dock 保持安静趴伏和可用交互，禁止恢复无意义横移。房间/自由桌宠靠近后再表演，边界不能裁尾巴，覆盖不超过一半；没有对应动作时使用能力匹配的真实降级。

重用现有技术栈；不做生视频、浏览升级、Live2D、语音、七模型自治或框架迁移。无 Key 的本地试玩必须完整；真实 API 可选且预算受限。不要读取或提交用户凭据，不要为测试消耗个人模型额度，使用隔离用户目录。

实现后运行 npm test、npm run build、更新后的 scripts/verify-companion-experience.mjs 以及必要回归。关键验收是全员/三人/两人/零人的实际房间与 Dock 数量、重启、静音与缺席分离、取消/免打扰/专注、故事变化、真实事件记忆和后端来源。提供真实截图与复现步骤，不把仅有单测或状态字段当成体验验收。

完成后写 docs/HANDOFF-CURSOR-COMPANIONSHIP.md：实际完成范围、关键文件、迁移规则、运行过的命令和结果、截图路径、未做项与已知问题。保持本地提交可审查，先不要自动推下一阶段实现或发正式 Release；用户会把结果交回 Codex 审核，再决定下一步。若遇到缺失条件，继续完成独立可做部分，并准确说明阻塞，不要反复要求用户确认常规实现选择。
```

English instruction: implement the adjacent English/Chinese specification in three local commits, preserve existing assets and behavior, verify real Electron interactions with isolated profiles, and provide the requested handoff for Codex review before publishing the next implementation.
