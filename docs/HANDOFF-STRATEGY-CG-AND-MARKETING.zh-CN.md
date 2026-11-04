# 交接备忘：传播策略 · CG · 生成平台（给 GPT / Codex）

日期：2026-11-04  
范围：产品与素材策略讨论结论，**不是**本轮 `CURSOR-COMPANIONSHIP-NEXT` 的实现规格。  
本轮代码实施以 [CURSOR-COMPANIONSHIP-NEXT.zh-CN.md](CURSOR-COMPANIONSHIP-NEXT.zh-CN.md) 为准。  
相关产品定位：[PRODUCT-REVIEW.zh-CN.md](PRODUCT-REVIEW.zh-CN.md)

## 1. 关于 dsh-pet / 大肥鱼「怎么火的」

- 火的不只是桌宠插件，而是 **DeepSeek Logo 梗（蓝色大肥鱼）× 画师锚点（如 ZipZipPipe）× DSH 宿主流量 × 可二创配方**。
- 后期破圈更多来自「养鱼上 B 站评论/直播」类 Agent 玩法，伴随「鱼灾」反噬；**不要学刷评论区传播**。
- `dsh-pet` 官方只开箱 DeepSeek 鲸鱼娘约百段透明视频；Claude/GPT 等 **没有同等官方全动画包**，多为自建 pet pack、立绘插件或 Codex 精灵表。
- 制作方式是 **配方化批量生成（豆包）+ 全库 Premiere 手工抠像**，不是纯白嫖随手攒，也不是全自动付费一键出库；作者未公开账单。

## 2. 团子小屋该怎么宣传

- **对外一句话**：七个 AI 娘住在同一间桌面小屋——会争宠、会吃醋、会一起趴 Dock。
- **不要主打**「也是 DeepSeek 桌宠 / 我们也有 109 段」；109 段是上游红利，须署名，原创卖点是 **多角色共同生活与关系**。
- **钩子短视频**：Dock 排排趴、争宠偏心、多人同框 vs 单角色对比、「一个 Key 全屋假扮」诚实标签。
- **渠道**：B 站/小红书/抖音短片优先；绿色包解压即开；genderswapai 等索引；MCP/桥给开发者第二波。
- **节奏**：每周关系瞬间短片 > 长功能说明。

## 3. 宣传片与应用内 CG

- **宣传片**：在 Q 版实机互动之外，加 **1–2 段 AI 视频 CG**，做成 Galgame「播了过场」的感觉会更好；必须字幕区分「剧情演出 / 实机演示」，避免画质预期欺诈。
- **应用内**：吃醋、争宠、双人张力等 **偶发高潮** 可播短 CG；**禁止**用 CG 替代日常表情层。默认仍是 Q 版；关系事件才升格；可跳过、有冷却。
- **本轮代码实施不做生视频**（NEXT 规格明确禁止）。上述 CG 是后续素材/运营路线，勿塞进本轮提交。

## 4. 豆包 vs 即梦；额度 vs 会员（后续 CG 制作）

| 用途 | 建议 |
| --- | --- |
| 试提示词、单人短互动草稿 | **豆包日免** |
| 表情张力、双人同框、定稿 CG | **即梦** |
| 验证阶段 | **只用现有免费/赠送积分**，不开会员 |
| 提示词跑通、准备进宣传/进游戏后 | 再考虑 **即梦短期会员或积分包** |

配法：豆包打样 → 即梦定稿；会员晚于「产能计划」，避免空转订阅。

## 5. 与本轮实现的边界（务必遵守）

- 本文件 **不修订**「在场 / 静音分离」等代码规格；冲突时以 NEXT 为准。
- 本轮：**真正在场集合、场景导演、三闭环、可选单次 LLM、来源标签**；不做浏览升级、Live2D、语音、七模型自治、网站生视频。
- 保留全部既有动画与 DeepSeek 109 段；Dock 安静趴伏；无 Key 本地试玩必须完整。

## 6. 给 GPT 的阅读顺序（实施本轮时）

1. [CURSOR-COMPANIONSHIP-NEXT.zh-CN.md](CURSOR-COMPANIONSHIP-NEXT.zh-CN.md)（最终规格）  
2. [HANDOFF-HOUSE-BRAIN.zh-CN.md](HANDOFF-HOUSE-BRAIN.zh-CN.md)（旧「muted 减员」已被 NEXT 修订）  
3. [HANDOFF-COMPANION-BRIDGE.zh-CN.md](HANDOFF-COMPANION-BRIDGE.zh-CN.md)  
4. [HANDOFF-DEEPSEEK-LIBRARY.md](HANDOFF-DEEPSEEK-LIBRARY.md)  
5. [PRODUCT-REVIEW.zh-CN.md](PRODUCT-REVIEW.zh-CN.md)  
6. 完成后写 [HANDOFF-CURSOR-COMPANIONSHIP.md](HANDOFF-CURSOR-COMPANIONSHIP.md)

English one-liner: Marketing/CG conclusions only; implement companionship NEXT, not video generation this round.
