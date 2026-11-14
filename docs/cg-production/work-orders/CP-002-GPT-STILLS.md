# 交给 GPT：CP-002～005 静帧

**2026-11-08 更新**：用户已授权审核后制作参考图；本轮只生成静帧，不提交视频。原草案下列“或”分支由[本轮复核](../CG-STILLS-REVIEW-2026-11-08.zh-CN.md)具体化，以[实际提示词](../reference-stills-2026-11-08.prompts.json)、各组 `stills-manifest.json` 和审片页为准：002 不带碗、两人最终坐下；003 固定接过分支、不演吃饭；004 保持书臂归属；005 无手部触点。候选图不等于视频/运行验收通过。

CP-001 已用现成 `public/cg/rin-xia-hair-v1` 实装，**不必再生成发饰三静帧**。  
下列仅在你准备开下一批时，把对应段落复制给 GPT；生成后按「输出路径」落盘。

## 共用身份锚（上传给 GPT／绘图模型）

| 角色 | 本地文件 |
|---|---|
| Claude | `public/portraits/claude.jpg`（可选 alpha：`claude-alpha-v1.png`） |
| DeepSeek | `public/portraits/deepseek.jpg`（可选 alpha：`deepseek-alpha-v1.png`） |

要求：成年体正常比例；小屋暖色室内；固定机位；SFW；识别锚：橙发花饰抱书／蓝发女仆双叶鲸尾。左右＝角色自身左右。

---

## CP-002 窗边并肩留座

**输出目录：** `test-results/cg-lab/cp-002-window-seat/stills/`  
**文件名：** `S1-offer.png` · `S2-sit-close.png` · `S3-book-close.png`  
**画幅：** 16:9，建议 1280×720

**S1 提示词：**  
同一对角色，Claude（橙发、太阳花发饰、抱书）站在窗边，用角色自身右手轻指身旁空座位，书仍在左手／身侧。DeepSeek（蓝发女仆、鲸尾）站在一步外看座位。无手触脸、无拥抱。暖色小屋、固定镜头、全身入画。

**S2 提示词：**  
同上身份。DeepSeek 已坐窗边，碗可在膝或小桌；两人肩距缩短但手臂未缠绕。Claude 仍抱书站或半坐。表情：鱼开心，Claude 温和。禁止接吻与手触脸。

**S3 提示词：**  
同上。Claude 合上书挨近停稳；鱼轻笑看向窗外或偷看 Claude。鲸尾低位安静。无第三者、无文字水印。

---

## CP-003 干饭搭子递半碗

**输出目录：** `test-results/cg-lab/cp-003-share-bowl/stills/`  
**文件名：** `S1-offer-bowl.png` · `S2-hand-bowl.png` · `S3-settle.png`

**S1：** 鱼双手端同一白瓷碗向前；Claude 抱书站立面对她。碗是唯一道具焦点。  
**S2：** 碗在两人之间传递瞬间——鱼递出，Claude 一手轻接或轻推回；书不消失；四臂可追溯。禁止接吻。  
**S3：** 分享一小口或婉拒后双方停稳；表情动机不同（鱼得意／Claude 礼貌）。

---

## CP-004 共读书签夹页

**输出目录：** `test-results/cg-lab/cp-004-bookmark/stills/`  
**文件名：** `S1-open-book.png` · `S2-blocked-peek.png` · `S3-bookmark.png`

**S1：** Claude 开书指某一页；鱼侧身看。书＝Claude 主权。  
**S2：** 鱼凑近时脸被书挡一瞬的轻喜剧；无手臂缠绕。  
**S3：** 书签夹入；两人并肩停稳，肩距稳定。

---

## CP-005 鱼先凑近（CP-001 触点降级）

**输出目录：** `test-results/cg-lab/cp-005-fish-leads/stills/`  
**文件名：** `S1-fish-approach.png` · `S2-claude-startle.png` · `S3-nod-settle.png`

**S1：** 鱼先靠向 Claude 肩侧；Claude 抱书未伸手。  
**S2：** Claude 愣住看鱼；纯视线差，无手触点。  
**S3：** Claude 轻点头收书；鱼轻红偷看。用于接触结构失败时的降级路线。

---

## 回传清单

每张附：原文件 SHA256、用的参考图、模型名、是否改脸／改尾。放入对应目录后告诉 Cursor 路径即可验收，勿直接覆盖 `public/cg/rin-xia-hair-v1`。
