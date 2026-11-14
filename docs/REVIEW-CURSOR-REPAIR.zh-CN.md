# Cursor 生命周期修复复审

后续状态：`a28dc00` 已修复本页三项 P2，独立复验通过。见 [最新验收](ACCEPTANCE-CURSOR-REPAIR-2026-11-04.zh-CN.md)。以下保留修复前记录。

[English](REVIEW-CURSOR-REPAIR.en.md)

日期：2026-11-04。审查 HEAD：`447795a982a925fdc26a0859e6b3003e723352bb`，范围为 `e63c9a9..447795a`。这是修复验收，不包含本地未提交的表演调研文档。没有修改运行代码、生成媒体、推送或发版。

结论：上一轮七项阻塞检查已全部修复，但本轮增加的三个生命周期边界仍失败，暂不认定完整验收通过。以下均通过隔离状态、禁用自主行为和受控时钟复现，不使用个人 API Key。

## 发现

### [P2] 完成结算仍早于动作收尾

位置：`src/shared/scene-director.ts:126–129`，`electron/engine.ts:602`。

`due()` 在派发最后一拍后固定等待 4500ms，不参考实际 `bodies.until`、到达时间或素材结束时间。标准全员 `seat-share` 的最后一拍在第 9 秒执行，动作持续 7 秒；第 13.5 秒已经写入共同事件和双向关系奖励，但最后动作仍剩 2500ms。此时 Stop 也不能撤销已提交奖励。交接将其描述为长途移动的理论边界，实际默认剧情就会触发。

修复方向：派发后收集该作业实际拥有的动作/移动结束时间，等所有必要步骤成功且到达收尾边界再结算；不能把全局时刻其他操作写入的动作误算为本作业。失败/跳过必要步骤应取消成功奖励。补充最后动作进行中取消与正常结束的对照。

### [P2] 同伴拜访在队列准入前执行，绕过用户剧情优先级

位置：`electron/engine.ts:390–395`。

先启动 `seat-share`，再触发 `companion-visit(rin → kimi)`。`perform()` 先改写 Claude 的身体、气泡和移动，随后导演才因当前 user 优先级拒绝 reaction 作业；即时台词还会照常发出。屏幕上的留座邀请已经被拜访台词替换，而原剧情仍在继续并可能获奖。统一未来步骤队列没有覆盖这次即时副作用。

修复方向：将初始 approach 和台词也放入作业，由同一准入成功后执行；或者明确按用户操作取消/替换旧作业，不能留下“队列拒绝、身体已执行”的半状态。现有 pat→rivalry 检查不足以覆盖此入口。

### [P2] 私聊对象退场后仍提交返回成功记忆

位置：`electron/engine.ts:319–333`，退场时的 `privateVisits` 清理。

依次 `private-open(rin)` → `cast-present(rin,false)` → `private-return(rin)`，仍写入 `private-return` 事件。当前只用在场检查包住动作和台词，事件提交在检查之外；退场也未取消访问实例。后续迟到的关闭通知或试玩入口能写出缺席角色的成功收束记忆，并影响复访分支。

修复方向：访问对象退场时取消对应实例；返回时验证访问仍有效且对象在场，拒绝迟到通知。重复返回的幂等性已修好，应保留。

## 本次实际验证

- `npm test`：85/85 通过。
- `node --import tsx scripts/review-companion-contract.mjs`：旧七项 7/7 通过。其报告里的 `reviewedCursorHead: bc486ab` 是脚本硬编码的旧标签；本次实际代码为上面的 HEAD。
- `npm run build`：通过。
- `verify-cast-matrix.mjs`：7/3/2/0 小屋和 Dock、静音可见、空阵容重启通过。
- `verify-companion-experience.mjs`：偏爱争宠、留座、语气差异、退场取消、DND 通过。
- `verify-deepseek-library.mjs`：109 段真实 Electron 解码、完整动作队列、睡眠/唤醒、小屋/桌面/私聊入口通过。
- `verify-cg-moment.mjs`：现有 renderer 内播放、桌面单宿主、收起/关闭、DND 通过。物理 Windows 点击穿透仍须原生桌面验收；这不等于头顶气泡已实现。
- 新增 `node --import tsx scripts/review-companion-repair.mjs`：上述三项 **0/3 通过，预期红色**；输出 `test-results/cursor-re-review/contracts.json`，记录真实 HEAD。

所有 Electron 检查使用隔离测试档案，没有调用付费模型。验证的是源码构建，不是重新发布的安装包。

## 下一步交给 Cursor

先修这三项，不增加剧情/浏览框架，不生成媒体。保留原七项与新三项断言，不通过延长固定等待时间掩盖动作生命周期。交付正常完成、最后一拍中途取消、拜访与用户剧情冲突、私聊退场后迟到返回的对照证据。全绿后再做头顶 CG 气泡与双人/用户向分镜，生成仍保持暂停，等待用户恢复指示。
