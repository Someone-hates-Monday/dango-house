# GPT Q 版即梦交接（尾巴根尖 + 成片下载）

给后续 Agent（含 GPT）接手「GPT 西方龙娘 Q 桌宠 · Seedance 网页」时用。  
**身份验收规则仍以** [`character-consistency.json`](character-consistency.json) **为准**；本页补「为什么容易反」与「本机已跑通的下载」。

## 0. 生产红线（先读）

| 项 | 路径 / 规则 |
| --- | --- |
| 已验收、勿擅自替换 | `public/video/gpt/idle-jimeng-v1.webm`、`public/video/gpt/pat-pixverse-p1.webm` |
| Q 日常锚 | `public/community/gpt/idle.webp`；次选 `thinking.webp` |
| 中性参考禁皇冠 | 勿用 `proud.webp` 当中性首帧（可作角度，禁止复制皇冠） |
| 未验收试片 | 只落 `test-results/animation-lab/gpt/…`，`replacePublic: false` |
| 物种 | **西方龙**（分段骨质角、膜翅、厚鳞尾收唯一细尖）；**禁止**中国龙长须角／末端鳍片／叶片／箭头 |

B1（affection/chat/rice）曾漂成中国龙外观 → 淘汰参考；C1 用多姿势成熟设定重做，仍待用户目视验收后才能谈映射生产。

---

## 1. 尾巴根尖颠倒：原因与避坑

### 1.1 根因（参考图诱导，不只是提示词）

正面 idle／绿幕锚图里，尾巴常**贴身侧**：

- 靠身体／翼下那截：**粗、圆、显眼**（还常被发／裙挡一点）  
- 真正末端：**在脚边、细、不起眼**

模型常把「显眼粗圆」读成**末端装饰**，把「脚下细尖」读成**连身体的根** → 根尖对调，再抬高、加鳍片。  
所以：**单写「西方龙尾、不要中国龙」不够**；必须消歧首帧构图 + 固定读序 + 动作包络。

### 1.2 固定读序（提示词每次照抄因果链）

```
骨盆后方粗根（翼根下方）→ 身体右侧向下弯的粗尾身 → 底部向内逐渐收成唯一细尖（靠近脚／踝）
```

反例必须同屏写出：

- 上方／靠身粗段 = **根**，永远不是尖  
- 禁止把靠身粗段当成末端  
- 禁止末端鳍片／叶片／箭头／毛簇／第二尖  
- 禁止抬到腰／翼旁当「尖」

与 consistency 对齐：`character-consistency.json#gpt.tail`。

### 1.3 参考图分工（多图时）

| 角色 | 用途 | 禁令 |
| --- | --- | --- |
| idle／绿幕锚 | **外观 + 开场站姿** 真值 | 勿仅靠它消歧根尖 |
| thinking／community 多姿势 | 身份锁（角翼裙） | proud 皇冠忽略 |
| **结构说明图**（侧／后，尾根清楚伸出） | **只解释**根→尖解剖 | **禁止**当动作目标；禁止抄大幅侧摆 |
| shy／happy 关键帧 | 额外姿势身份 | 不是时间轴脚本 |

实操：结构图用于「根尖一眼分清」；动作包络仍压在 idle 站姿的**膝下／脚边**。

### 1.4 动作包络（防「抬尾当尖」）

- 尾尖**始终低于膝盖、靠近脚边**  
- 不先甩高再落下；不横扫双腿前；不穿裙腿  
- 害羞：自**身体侧粗根**驱动，向近腿收，再连续展开恢复（勿整尾瞬移）  
- 开心：右侧低位小幅左右轻摆，尖稍后跟随  

### 1.5 验收（前 1–2 秒定生死）

历史翻车多在**片头**就把上方变尖或长出鳍片。前几帧根尖错 → 整段作废，别等片尾「看起来还行」。  
检查清单：根仍在骨盆／翼下粗端；尖在低位收成一点；无末端鳍；与已验收 idle／pat 的几何读法一致（用旧片对齐，勿用新片去「纠正」旧片）。

### 1.6 一句话

**结构图消歧 + 根→尖读序 + 膝下包络 + 前几帧验收**；正面贴身首帧本身会骗模型。

### 1.7 若仍反转（2026-11-05 greeting-D1）

提示词 + 旧 Q0/QS 已不够。暂停视频，按 [`gpt-tail-direction-fix-plan.zh-CN.md`](gpt-tail-direction-fix-plan.zh-CN.md) 先重做 **Q0-clear／QS-clear** 静帧再校准。

---

## 2. 即梦成片：本机已成功的下载法

人在环总协议见 [`docs/cg-production/jimeng-human-in-loop.md`](../cg-production/jimeng-human-in-loop.md)。  
下列是 Cursor 内置浏览器会话里**实际跑通**的路径（CP-001／GPT C1 等同法）。

### 2.1 不要依赖的路径

- CDP `Page.setDownloadBehavior`／点页面「下载」→ 内置浏览器常**无落盘路径**  
- computer-use 坐标连点下载  
- 把 Cookie 贴进聊天或写进仓库  

用户本机 Chrome 点「下载」+ `watch-jimeng-download.py` 仍可用，但是否必须看会话。

### 2.2 成功路径：页面 `<video>` 直链 → curl

生成完成（出现「重新编辑」等）后：

1. **锁定当前结果卡上的 `<video>`**（先 `play()` 一下，让 `currentSrc` 就绪）。  
2. 用 CDP `Runtime.evaluate` 收集候选，优先：

   - `videoWidth === 1280 && videoHeight === 720`  
   - `duration` 约 **5s**（本仓桌宠条；长片／教程预览常更长，勿下错）  
   - `src` 含 `vlabvod.com` / `video/tos` / `mime_type=video_mp4`

3. 在本机 PowerShell **无 Cookie** 直拉（CDN 签名 URL 通常短时有效）：

```powershell
$url = "<video.currentSrc 完整 URL>"
$out = "test-results/animation-lab/gpt/jimeng-gpt-<id>/raw.mp4"
New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null
curl.exe -L --fail --retry 3 -o $out $url
# 核对：文件约数 MB；ffprobe 或播放确认 1280x720、~5s
```

4. 写同目录 `generation.json`：`id`、模型、时长、分辨率、积分、refs、`productionApproved: false`、`replacePublic: false`。  
5. **不要**自动替换 `public/video/gpt/*`。

### 2.3 挑错片时的过滤

页面上常混有历史预览／长片：

- 丢弃超长 `duration`（例如 >30s）或非 720P 的 `video`  
- 刚点「生成」后只取**最新**出现的 5s／720P 源  
- 标题／会话文案含本条工单名（如「GPT收到喜爱C1」）时再归档，避免串条  

### 2.4 上传／提交侧（易踩坑）

- 优先合成一张「西方设定拼图」+ idle + 绿幕锚，减少芯片上传失败  
- 粘贴后清掉提示框里的**文件名文本节点**，只留图，避免文件名污染提示词  
- 勿误点「720全景图」等非目标入口；扣费弹窗停手交给用户  

工单与 paste 目录示例：`test-results/animation-lab/jimeng-jobs/gpt-*-c1/`。

---

## 3. 当前批次状态（2026-11-05，接手时核对磁盘）

| 条 | 归档目录 | 备注 |
| --- | --- | --- |
| affection C1 | `test-results/animation-lab/gpt/jimeng-gpt-affection-c1/` | 有 `raw.mp4`；未生产批准 |
| chat C1 | `…/jimeng-gpt-chat-c1/` | 同上 |
| rice C1 | `…/jimeng-gpt-rice-c1/` | 有 `raw.mp4`；未生产批准 |
| B1 系列 | `…/*-b1/` | 中国龙漂移，**勿作外观真值** |

提示词模板见各工单 `PROMPT.zh.txt`（含身份锁、参考图角色、尾硬约束）。

---

## 4. 给下一位 Agent 的最短清单

1. 读本页 §1 + `character-consistency.json#gpt`  
2. 不碰已验收 idle／pat，除非用户明确授权替换  
3. 新条：多图角色分清 + 根→尖读序 + 膝下包络  
4. 出片：`<video>.currentSrc` → `curl -L` → `raw.mp4` + `generation.json`  
5. 用户目视通过前：`productionApproved` 保持 false  
