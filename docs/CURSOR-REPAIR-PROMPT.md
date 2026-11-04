# Cursor 修正任务 / Cursor repair prompt

```text
继续团子小屋。先读 docs/REVIEW-CURSOR-COMPANIONSHIP.zh-CN.md、docs/HANDOFF-CURSOR-COMPANIONSHIP.md、docs/CG-MOMENTS.zh-CN.md。上一轮的在场显示和基本演示已有进展，但本次 Codex 补充的 7 项行为验收全部失败；不要以原 79 项测试通过就宣称 A/B/C 完整完成。

先运行 node --import tsx scripts/review-companion-contract.mjs 看真实复现，再修复：
1. 真正让 SceneDirector 成为唯一队列执行源，所有旧群像/双人、争宠、模型回应、空闲戏接同一个优先级与取消生命周期，不再维护平行的 this.scene 与 director.current。
2. 共同完成事件与双向 bond 奖励只能在剧情真正完成后，按作业实例幂等提交；取消、失败、缺席不算完成。移除 perform 接近动作无条件刷 bond 的旁路。完成不只是最后一步刚被排入/发出，要考虑动作/到达的收尾边界与超时。
3. 在统一引擎入口阻止缺席操作者和缺席角色目标，覆盖 perform、feed、visit、clip、praise、私聊与 Agent/MCP 回调。静音与缺席仍不同；安静角色可见，缺席者须显式请回。
4. 修好可选故事模型：实际 HTTP 请求收到专用剧情提示，最多一次、禁用形象工具，与故事取消控制器/实例绑定，Stop/退场/替换后不消费晚到结果。现在 generateReply 忽略 _input，不能继续直接把 storyLlmPrompt 塞进去。如果暂时做不对就禁用该增强，保留完整离线剧情。
5. 私聊访问使用每角色/每次访问实例，返回结算幂等；首次返回不是“又一次”，真正复访才走回忆分支。不要让试玩按钮成为重复记账的借口。

保留 Codex 本轮 CGMoment、cg-moment.css、public/cg、CG 文档和生成/验证脚本。这是用户刚刚明确授权的后续工作，不要像 bc486ab 那样删除正在进行的视频脚本。模型、原片与用户数据仍在忽略目录，绝不上传。当前 CG 已有合格的温柔关爱手动试片和现有 renderer 内试映，不创建独立窗口；先保留手动，不把当前提前提交的事件当成自动 CG 解锁依据。

把现在把“刚排队”当“完成”的旧测试改成真实成功/取消对照。不要删除、弱化或改写 scripts/review-companion-contract.mjs 来适配错误行为；可以为修正后的合理接口更新调用方式，并保留同等行为要求。完成后这些检查必须全绿，外加 npm test、npm run build、真实人数矩阵/重启、既有互动和 109 段素材回归、CG 运行检查。测试使用隔离档案与受控 HTTP fixture，不用个人 Key 或付费模型。

这轮优先修生命周期，不增加浏览/语音/Live2D/七 Agent 框架，也不再生成一批新剧情掩盖问题。按导演与事件、模型与私聊、验收证据三个本地提交交付；若有未完成项明确列出，不自动推送或发 Release。更新 docs/HANDOFF-CURSOR-REPAIR.md，写实际完成内容、命令结果、截图、边界和残留问题，交回 Codex 再审。
```

English: follow the linked review, make all seven behavior contracts pass without weakening them, preserve the new manual CG work, fix lifecycle/completion/presence/model/private-session issues before adding features, and return a factual local handoff for Codex review before publication.
