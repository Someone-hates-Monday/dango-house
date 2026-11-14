# GPT 动作提示词索引

独立完整提示词共 32 条。先看 ../GPT-ACTION-BATCH-HANDOFF.zh-CN.md。道具／Dock／睡眠工单未备起始图前不得提交。

- P0 [收到喜爱](affection.zh.txt) — 中性参考组；逐条验收
- P0 [被选私聊](private-chat.zh.txt) — 中性参考组；逐条验收
- P0 [投喂白饭](rice.zh.txt) — 需先验收持碗首帧；Q0不是持碗图，不可假装现成
- P1 [摸头轻回应](pat-alt.zh.txt) — 中性参考组；逐条验收
- P0 [鼠标靠近问候](greeting.zh.txt) — 中性参考组；逐条验收
- P0 [认真倾听](listen.zh.txt) — 中性参考组；逐条验收
- P0 [轻微吃醋](rivalry.zh.txt) — 中性参考组；逐条验收
- P0 [被重新选中](relieved.zh.txt) — 中性参考组；逐条验收
- P0 [私聊返回](return.zh.txt) — 中性参考组；逐条验收
- P1 [冷静思考](think.zh.txt) — 中性参考组；逐条验收
- P1 [完成后的认可](success.zh.txt) — 中性参考组；逐条验收
- P1 [疲惫休息](tired.zh.txt) — 中性参考组；逐条验收
- P1 [困倦哈欠](yawn.zh.txt) — 中性参考组；逐条验收
- P1 [入睡](sleep-enter.zh.txt) — 需先验收坐姿目标帧；结尾不回站立
- P1 [安静小憩](sleep-loop.zh.txt) — 使用sleep-enter验收末帧；不要Q0站姿首帧
- P1 [醒来起身](wake.zh.txt) — 使用sleep-loop姿态首帧；不得瞬切站姿
- P2 [向左短走](walk-left.zh.txt) — 中性参考组；逐条验收
- P2 [原地行走循环](walk-in-place.zh.txt) — 中性参考组；逐条验收
- P2 [Dock趴下](dock-down.zh.txt) — 需独立Dock姿态钉板；不在视频里画真实系统Dock
- P2 [Dock站起](dock-up.zh.txt) — 起点用dock-down验收末帧；统一支撑线
- P1 [偶尔看看你](idle-look.zh.txt) — 中性参考组；逐条验收
- P1 [安静安慰](comfort.zh.txt) — 中性参考组；逐条验收
- P1 [看向大鱼](pair-look-ds.zh.txt) — 中性参考组；逐条验收
- P1 [看向Claude](pair-look-claude.zh.txt) — 中性参考组；逐条验收
- P1 [旁观她们靠近](pair-bystander.zh.txt) — 中性参考组；逐条验收
- P0 [嘴硬留座](reserved-seat.zh.txt) — 中性参考组；逐条验收
- P0 [被夸却不承认](praise-denial.zh.txt) — 中性参考组；逐条验收
- P1 [陪你忙自己的事](quiet-wait.zh.txt) — 中性参考组；逐条验收
- P1 [被大鱼逗到](fish-tease.zh.txt) — 题材来自戛然而纸女同事篇；细节为原创演法，非已看过的镜头复刻
- P1 [替你处理好了](help-ack.zh.txt) — 中性参考组；逐条验收
- P1 [晚安前多看一眼](soft-goodnight.zh.txt) — 中性参考组；逐条验收
- P0 [等到你回来](reunion.zh.txt) — 中性参考组；逐条验收
