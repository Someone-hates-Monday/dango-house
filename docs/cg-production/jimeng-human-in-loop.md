# 即梦人在环协议（网页）

## 用户偏好：普通队列优先（2026-11-05）

默认不使用会员加速、优先生成或额外积分换速度，用户不急。Cursor/Codex 均应关闭可选加速，保留普通队列。若当前入口只提供加速或费用不清，先核对实际选项和消耗，不擅自接受更贵模式。会员身份标识不等于加速开关；记录模型、普通/优先队列、提交价格与实际余额差，缺失记未知。尚未独立核实加速计费规则，不写成所有模型统一倍率。

目标：你只做登录／授权／扣费相关手动步；之后由 Agent 填参、提交（在你已打开的会话里）、监视下载、归档与后处理。**不**声称全自动，**不**代点支付。

## 浏览器选型（下载）

**优先：你本机已登录的 Chrome／Edge。** Cursor／Codex 内置浏览器**不**作为下载主路径——历史上文件选择器易超时，下载事件常拿不到落盘路径，甚至手动点下载也不稳定。约定：生成完成后**你在本机浏览器点下载**，Agent 监视 `Downloads` 再归档。

## 可靠交接（默认；禁止屏幕连点）

不要用 computer-use／坐标点击操作即梦网页（慢、易失焦、改版即碎）。默认流程：

1. Agent 备好工单与 `paste/first-frame.png`、`PROMPT.zh.txt`
2. 运行 `scripts/animation-lab/jimeng-clipboard-handoff.py --job … --watch`
3. 你在本机 Chrome：切「视频生成」→ Ctrl+V 图 → Ctrl+V 词 → 点生成 → 点下载
4. 脚本监视 `Downloads` → 归档 → 再跑审计

更自动但**不吃网页免费额度**的路线：火山方舟 Seedance API（另计费）。网页免费额度仍走上面交接。

## 你负责（会话开始或过期时）

1. 用本机浏览器打开并登录即梦（保持登录）。
2. 首次素材授权、会员／积分不足时的确认或充值（仅你操作）。
3. 若系统文件框无法自动：按提示把参考图拷进剪贴板或放到约定目录。
4. 告诉 Agent：「门已开」+ 当前可用积分大致情况（可选）。

## Agent 负责（门开之后）

1. 按工单填：模型档、时长、比例、提示词、首帧／尾帧（优先粘贴，避开文件框）。
2. 点生成（若弹出扣费／开通，**停下交给你**）。
3. 等任务完成 → 点页面下载（或你点一次下载也行）。
4. 监视约定下载目录出现新 MP4 → 复制到 `test-results/animation-lab/...`，写 `generation.json`（时间、文件名、哈希、工单 id）。
5. 跑现有审计／抠像脚本（如 `audit-jimeng.py`），**不**自动替换 `public/`。

## 约定目录

- 浏览器下载：`C:/Users/Someone/Downloads`（可改；以本机设置为准）
- 归档根：`test-results/animation-lab/jimeng-inbox/`
- 工单：`docs/cg-production/work-orders/` 或 `test-results/animation-lab/jimeng-jobs/`

## 下载与批量落盘（实测边界）

内置浏览器／Cursor computer-use **不能可靠触发系统下载**（CDP `Page.setDownloadBehavior`／文件系统上传在内置浏览器侧被拒绝或无路径回传）。可行做法：

1. **单条（本机 Chrome）**：生成完成后你在本机 Chrome 点「下载」→ `scripts/animation-lab/watch-jimeng-download.py` 监视 `Downloads` 归档。  
2. **Agent 会话内已跑通（优先于假点下载）**：成片出现后，对结果卡 `<video>` 先 `play()`，取 `currentSrc`（`*vlabvod.com*`／`video/tos`／`mime_type=video_mp4`），用本机 `curl.exe -L --fail -o …/raw.mp4 <url>` 直拉。筛选 **本条分辨率与时长**（桌宠常见 1280×720、~5s），丢掉页面上的长预览／旧片。CDN 签名 URL 短时有效；**勿**把 Cookie 贴进聊天或写入仓库。GPT 专用步骤与挑错片见 [`docs/animation-lab/gpt-jimeng-q-handoff.zh-CN.md`](../animation-lab/gpt-jimeng-q-handoff.zh-CN.md) §2。Claude 动作补全工单与锚图见 [`CLAUDE-ACTION-HANDOFF.zh-CN.md`](../animation-lab/CLAUDE-ACTION-HANDOFF.zh-CN.md)；归档目录建议 `test-results/animation-lab/claude/jimeng-<job-id>/`，同样先审两臂—书本再抠像，不覆盖现有六类生产片。  
3. **半批量**：打开即梦「资产」→ 逐条打开成片 → 本机下载或同上直链 curl。  
4. **真批量**：优先 **火山方舟 API**（任务结果直接给 `video_url`，脚本下载）；网页没有官方「一键导出全部」时不要硬模拟连点。  
5. 历史试片若已在本机 Downloads，用已有 `import-*.py`／按文件名复制进 `test-results/`。

## 明确不做

- 保存或索取账号密码、支付、绕过验证码  
- 未获「门已开」时强行批量提交  
- 把网页试片直接标 `approved` 入库  
