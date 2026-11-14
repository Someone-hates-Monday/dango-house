# 身份卡目录（草稿）

对照 [制作契约 §2](../../CG-PRODUCTION-CONTRACT.zh-CN.md)。**本目录全部为 `draft`，未批准生成，不可当 runtime manifest。**

## 四层依据（每字段记录 `value / evidence / scope / status`）

| 层 | 含义 | status 常用值 |
| --- | --- | --- |
| `selectedVisual` | 已选外观锚点（立绘路径、SHA256、作者原页） | `anchored` / `needs-view-check` / `conflict` |
| `projectPersonality` | 本仓 `characters.ts` / `social.ts` 运行人格 | `in-code` |
| `community` | 具体作品条目，绑定到「哪一条设定」 | `title-meta-only` / `watched` / `unverified` |
| `sceneActing` | 仅绑定工单的本场演法 | `work-order-bound` / `empty` |

冲突时：**先保住 `selectedVisual`。** Q 版日常锚与成年体 CG 锚分开记，不假定发饰／尾型自动一致。

## 文件

| ID | 文件 | 形态 |
| --- | --- | --- |
| xia | [xia.json](xia.json) | 成年体锚 + Q 日常另注 |
| rin | [rin.json](rin.json) | 同上 |
| shiori | [shiori.json](shiori.json) | 同上；尾根规则见 consistency |
| gemini | [gemini.json](gemini.json) | 同上 |
| glm | [glm.json](glm.json) | 眼罩／铃铛逐项待锚图确认 |
| kimi | [kimi.json](kimi.json) | 生产 Q 以 fywdy 为准；成年体另有 ZipZipPipe 锚 |
| grok | [grok.json](grok.json) | 同上 |

证据台账：[../evidence-ledger.json](../evidence-ledger.json)  
工单草案：[../work-orders/](../work-orders/)

## 下一步（仍不生成）

1. 对照 `public/portraits/*.jpg` 与 alpha 版，把 `needs-view-check` 字段改成逐项通过／缺视角。  
2. 给证据台账里「可观看」条目补时间码（仅在实际可播时）。  
3. 填 CP-001／POV-001 的 `sceneActing`，再画静态分镜规格。  
4. 头顶气泡与播放回执按契约 §4 先做 V1 布局，再谈视频实验。
