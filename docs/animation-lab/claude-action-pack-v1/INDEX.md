# Claude动作补全提示词

先读[交接](../CLAUDE-ACTION-HANDOFF.zh-CN.md)、[**GPT 审查稿（已进应用）**](../CLAUDE-PACK-GPT-REVIEW.en.md)、[差异化说明](A3-DIFFERENTIATION.zh-CN.md)、[行礼脚法](OJOU-CURTSEY.zh.txt)、[衔接配方](../DSH-PROMPT-LESSONS-FOR-CLAUDE.zh-CN.md)。

## 实装状态（2026-11-06）

| 状态 | 内容 |
|---|---|
| 生产原六片 | `idle/pat/affection/chat/rice/bookmark`（保留；映射上 chat/affection 优先走新片） |
| 已装入 public + pack | A3 全身：`rivalry-soft` `gpt-joke` `success`；A4：`thinking` `goodnight` `fish-shy` `reassure` `hesitate` `walk` `walk-opposite` `recover-step` `turn-to-left` `turn-to-right` |
| 半身截断已撤出 | `listen` / `chosen-again` A3（磁盘仍有归档）；运行时私聊→`chat`、夸奖→`affection`（原生产全身） |
| 应用接线 | `claude-animation.ts` · `claude-pack.ts` · `ClaudeVideoSprite`（双走循环窗）· `claude-clips.ts` 片库 · engine `play-clip`（rin）· CompanionInteractions |
| 走路 | `walk-left`→walk+scaleX；`walk-right`→walkOpposite；turn/recover **未**进状态机 |
| 暂缓 | 坐下/sleep/Dock；需开书或单臂静帧的欢迎/留座/共读/理发丝 |

处理脚本：`batch-audit-claude.py` → `install-claude-drafts.py`；走路循环窗 `prepare-claude-walk.py`（对面走已有 `walk-clip.json`）。

## 站姿可试 / 已出片

- [认真倾听](listen.zh.txt) · [被冷落](rivalry-soft.zh.txt) · [再次被选中](chosen-again.zh.txt) · [安慰](reassure.zh.txt)
- [捂嘴笑](gpt-joke.zh.txt) · [思考](thinking.zh.txt) · [完成耸肩](success.zh.txt) · [犹豫行礼](hesitate.zh.txt) · [晚安行礼](goodnight.zh.txt)
- [大鱼挡脸](fish-shy.zh.txt) · [走路](walk-cycle.zh.txt) · [对面走](walk-opposite.zh.txt) · [转左](turn-to-left.zh.txt) · [转右](turn-to-right.zh.txt) · [停步](recover-step.zh.txt)

## 需静帧（未开拍或未进包）

- [欢迎合书](welcome-back.zh.txt) · [留座](offer-seat.zh.txt) · [喊大鱼](fish-invite.zh.txt) · [共读](pov-read.zh.txt) · [理发丝](hair-tidy.zh.txt)
- [入睡/小憩/醒来](sleep-enter.zh.txt) · [Dock下/上](dock-down.zh.txt)（坐姿钉板缺失，整组暂缓）
