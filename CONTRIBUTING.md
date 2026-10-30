# 一起装修团子小屋 / Contributing

谢谢你愿意给小屋添一盏灯。欢迎中英文 Issue 和 PR，也欢迎第一次参与开源的朋友。  
Thank you for bringing a little light to the house. Issues and PRs in Chinese or English are welcome, including first-time contributions.

## 开始之前 / Before you start

先查现有 Issue。小修复可直接提交 PR；新依赖、持久化格式、模型协议或大玩法先用 Issue 说明。不要提交 Key、私人聊天、账号、用户数据库或未脱敏截图。  
Check existing issues. Small fixes can go straight to a PR; discuss new dependencies, persistence formats, provider protocols, or major features first. Never submit keys, private chats, accounts, user databases, or unredacted screenshots.

Windows x64 / Node.js 22.15+。运行 `npm.cmd ci`、`npm.cmd run dev`；提交前运行 `npm.cmd test` 和 `npm.cmd run build`。窗口、Dock、IPC 或动画改动还需相应桌面检查（`npm.cmd run test:desktop` 等）。无法运行的检查请说明。  
Use Windows x64 / Node.js 22.15+. Run `npm.cmd ci` and `npm.cmd run dev`; run unit tests and build before submitting. Window, Dock, IPC, and animation changes also need relevant desktop checks. State any checks you could not run.

桌面测试使用独立存档，不能拿日常存档做破坏性迁移测试。普通协议测试用模拟响应；真实 API 检查必须主动选择执行并说明额度消耗。  
Use isolated desktop profiles, never your daily data for destructive migrations. Mock protocol responses; live API checks require explicit opt-in with quota costs explained.

自动检查配置目前以 [CI 模板](docs/ci/README.md) 提供，尚未启用，提交者仍需自行运行检查。  
Automated checks are provided as a CI template and are not yet enabled; contributors must run checks locally.

## 代码约定 / Code conventions

- **清楚胜过花巧 / Clarity first.** 新应用代码用 TypeScript，沿用邻近命名与排版，不为小改动重排整个文件。Use TypeScript, follow nearby conventions, and avoid unrelated whole-file reformatting.
- **边界明确 / Clear boundaries.** `src/shared` 放类型与纯逻辑；`electron` 负责状态、持久化、IPC、模型请求；React 负责展示。共享逻辑不依赖 DOM 或密钥。Keep shared logic pure, backend responsibilities in Electron, and presentation in React.
- **保留安全边界 / Preserve security.** 保持 context isolation 和 sandbox，渲染器只走 preload API；验证 IPC、工具和端点输入；保留超时、取消、错误脱敏。Use preload APIs, validate inputs, and preserve cancellation, timeouts, and redacted errors.
- **异步结果有归属 / Own async results.** 停止或切换频道后不写入旧回合结果；私聊与群聊上下文隔离。测试实际可见行为，不只复写实现。Do not write stale results after cancellation or channel changes. Isolate private/group context and test observable behavior.
- **小步提交 / Focused PRs.** 一个 PR 聚焦一个问题，写清触发条件、最终行为和验证，UI 改动附干净截图。Describe triggers, results, and validation; include clean screenshots for UI changes.
- **照顾可访问性 / Accessibility.** 保留控件标签、足够命中区域和键盘操作；普通状态不用持续闪烁。Keep labels, usable hit targets, and keyboard access; avoid persistent flashing.

## 动画、素材与剧情 / Animation, assets & stories

检查脸、比例、服装、尾根连接、尾尖、浅深背景、完整肢体、宽动作边界、脚底、循环接缝和恢复姿势。跑步应对应真实位移；增帧或缩小人物不能代替结构修复。  
Check face, proportions, outfit, tail attachment/tip, light/dark backgrounds, limbs, bounds, foot contact, loop seams, and recovery. Running should match displacement; more frames or smaller scaling do not repair structure.

叙事动作完整向前播放，不倒放吃饭、跌倒或摸头来凑循环；待机往返循环单独评估。新素材先验收再接入，不覆盖上游原始文件，记录来源、作者、工具、许可、哈希和已知瑕疵。  
Play narrative reactions forward in full; do not reverse eating, falling, or headpats to loop them. Evaluate idle ping-pong loops separately. Review before integration; preserve originals and document creators, tools, terms, hashes, and limitations.

提交素材前确认分发和修改权限。代码贡献使用 MIT；第三方美术、人设保留各自许可。权利不清时提交来源线索，不直接上传。AI 辅助代码与生成素材请说明使用情况，提交者负责审查、许可和质量。  
Confirm redistribution and modification rights. Code contributions use MIT; art and persona adaptations retain their own terms. Submit source leads rather than unclear assets. Disclose AI assistance; contributors remain responsible for review, licensing, and quality.

剧情保持温柔、有趣和角色差异；争宠是善意撒娇，不羞辱用户，也不制造消费、在线时长或感情负担。社区解读注明出处，原创演绎不称官方正史。  
Stories should be warm, playful, and distinct. Rivalry is gentle banter, never humiliation or pressure to spend, stay online, or prove affection. Attribute community interpretations and distinguish fan stories from official canon.
