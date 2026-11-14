# 补充调研：百合／女友向创作手法 · AI CG 控制流程

[English notes](CG-YURI-AND-CONTROL-SUPPLEMENT.en.md) · 已有基础稿：[CG-ACTING-AND-POV-RESEARCH.zh-CN.md](CG-ACTING-AND-POV-RESEARCH.zh-CN.md) · 策略备忘：[HANDOFF-STRATEGY-CG-AND-MARKETING.zh-CN.md](HANDOFF-STRATEGY-CG-AND-MARKETING.zh-CN.md) · **制作细则**：[人设·互动·分镜 Playbook](CG-PERSONA-SHOT-INTERACTION-PLAYBOOK.zh-CN.md)

调研日期：2026-11-04。**仍只调研与整理；不恢复图片／视频推理，除非用户另行指示。**  
复核补充：可执行边界、验收与工单以 [制作契约](CG-PRODUCTION-CONTRACT.zh-CN.md) 为准；候选工具不代表本机已验证，叙事建议不代表社区统一人设。
本文补 Codex 已写内容的缺口，不重复「先结构后表演」「两条演出线」「头顶气泡规格」等结论。  
若需要「如何钉死人设并据此设计互动／分镜／活动方式」的逐步工作纸，用 Playbook，不要只停留在本文件的控制原则表。

## 0. Codex 已覆盖 vs 本文补什么

| 已有（ACTING 文） | 本文补 |
| --- | --- |
| 双人肢体归属、分区、Wan Fun Control 方向 | 可装的插件包、Animate／LivePortrait／FaceDetailer 分职 |
| CP／女友向分线与项目原创分镜 | 百合／女友向**叙事与互动设计手法**（可落到剧情与 CG 验收） |
| 即梦曾踩过的首尾帧模型限制（实验日志） | Seedance 2.x **可靠控制清单**、@ 全能参考、表情写法 |
| IPAdapter 维护模式警示 | 身份锁 vs 表情驱动 vs 姿态驱动的**分层管线** |
| Monika 问候规则作陪伴参考 | Galgame Event CG 稀缺性、亲昵要素、立绘差分节奏 |

---

## 1. 百合与女友向：创作思路（可落到产品）

### 1.1 两条偏好轴，不要合成一种「甜」

同人生态里常见两轴：

- **角色×角色（百合／CP）**：观众旁观她们的距离、反差、小动作；暧昧来自「看见与被看见」。
- **角色×用户（女友／陪伴向）**：镜头＝用户位置；亲昵来自「她为你做的一件小事 + 等你回应」。

产品上已定：可并存、可偏科、不强迫二选一（见 ACTING 文）。制作上仍要**分素材、分提示词、分验收**——裁切双人片当女友向会丢视线与递物方向。

### 1.2 百合日常常用手法（非 NSFW）

综合同人／VN 讨论与作品经验，可靠手法是「慢燃细节」而不是一次塞满拥抱：

| 手法 | 做法 | 对本项目的映射 |
| --- | --- | --- |
| 反差表情 | 一方从容、一方慌乱；不同步眨眼／脸红 | 已定 Claude×大鱼演法；静帧分区验收 |
| 视线戏 | 偷看 → 对上 → 移开 → 再对上 | CG 分镜三拍；气泡停顿等待用户 |
| 距离戏 | 负空间缩小、身体微倾、同框但不交叉过多手臂 | 先姿态草稿，再加接触 |
| 小行动亲密 | 留座、分饭、合书、递物、并肩 | 已有 seat-share／star-fox／chose-her |
| 反应镜头 | 「对方没看时」的软表情 | 尾帧／收尾静帧单独验 |
| 尾巴／道具当表演 | 有起因—过程—停稳，不作待机噪声 | 鲸尾规则已写；勿恢复无意义横摆 |
| 对立性格互撞 | 角色在核心维度相反，互动自然出戏 | 七人设保持差异，不统一成「甜宠口癖」 |

参考入口（旁证，非照搬剧情）：社区对慢燃视线／构图的整理、[Butterfly Soup 作者谈「对别人凶只对你软」与拉近立绘距离](https://www.gamedeveloper.com/business/road-to-the-igf-brianna-lei-s-i-butterfly-soup-i-)、VN 讨论里「沉默、拉近立绘、POV 暗示贴近」等；本地 CP／女友向索引仍见 ACTING 文 B 站条目。

### 1.3 女友向／陪伴向手法

比「一直盯镜头微笑」更稳的是 **事件型亲密**（与 Monika 式情境问候同向）：

1. **发现你**（视线落到镜头）  
2. **做一件小事**（留饭、合书提醒、指书页、嘴硬留座）  
3. **停稳等待**（已验收末帧，不倒放摇摆）  
4. **用户选择** → **对应短回应** → **记忆一句**  

抽象情绪词（「非常爱你」）弱于身体细节（「嘴角微扬、目光移开半秒再回来、碗朝你推近」）。不默认用户性别、不画固定性别的「用户手」。

### 1.4 Galgame／同人 CG 调度（省钱又有记忆点）

[Event CG 机制讨论](https://forums.fuwanovel.moe/blogs/entry/4209-event-cgs-%E2%80%93-an-anatomy-of-visual-novels/)与恋爱 VN 指南的共性：

- **稀缺**：CG 只给高潮／关系节点；日常靠立绘差分与气泡。团子小屋已定「默认 Q 版，关系事件才升格」。
- **对比**：全屏 CG 与日常 UI 反差越大，记忆越强；宣传片须字幕标明「剧情演出／实机」。
- **差分**：同一 CG 的表情／视线差分，比重新生成整段视频便宜；LivePortrait 类适合「静帧表情轨」。
- **选择有重量**：靠近／给空间、说破／装傻，应改变后续 trust／距离，而不是两条台词汇合同一结局。

亲昵感可对照「十要素」做验收清单（渴望对方幸福、共处愉悦、尊重、可依靠、相互理解、分享时间／物、接受／给予支持、亲切沟通、珍重）——约会戏不必十项全满，但**至少落实 3–4 项可观察行为**，避免只喊口号。中文整理见[月幕亲昵感约会场景文](https://www.ymgal.games/co/article/470740299916771328)（案例为异性恋 Gal，手法可转译到百合／用户向）。

日文向 CG 发注习惯：**先定「要传达什么」→ 参考图定构图／姿势 → 再写差分列表**（[恒石涼平 CG 发注系列](https://note.com/ryodist/n/n501a6d02e3ee)）。与 ACTING 文「三张静帧过关再视频」一致。

### 1.5 立绘／表情层（程序内，不靠视频）

[Sprite dynamics 讨论](https://amai-works.itch.io/complex-relations/devlog/201432/sprite-dynamics)：表情若只有「开心／生气」一档，无法承载潜台词。建议每名角色至少保留：中性、柔笑、害羞（视线旁移）、慌乱、温柔、轻微吃醋、思考——**台词与表情可错位**（嘴上嘴硬、脸上松一点）。争宠时旁观者只用短反应，不抢私聊主角。

---

## 2. AI CG／动作／表情：可靠控制分层

总原则（与 Codex 一致，这里写成流水线）：

```
身份锁（谁） → 结构锁（四肢归属） → 表演锁（表情／小动作） → 时间锁（首尾／控制轨） → 短片验证 → 再加长
```

不要用一句提示词同时解决四层。

### 2.1 ComfyUI：按任务选栈（官方文档优先）

本机既有路线：Wan2.2 I2V A14B FP8、Comfy 锁定提交、**曾用 `--disable-all-custom-nodes`**。下列栈是「恢复生成后可评估」的候选；**未在本轮安装或跑通**，不能写成已验收产能。

| 目标 | 推荐方向 | 关键包／权重 | 注意 |
| --- | --- | --- | --- |
| 单人／已定首帧动起来 | [Wan2.2 官方 I2V](https://docs.comfy.org/tutorials/video/wan/wan2_2) | high/low noise 14B、UMT5、Wan VAE | 提示词写**运动与运镜**，少改身份 |
| 姿态／深度／线稿控运动 | [Wan2.2 Fun Control](https://docs.comfy.org/tutorials/video/wan/wan2-2-fun-control) | `wan2.2_fun_control_{high,low}_noise_14B_*`；控制视频 | 需控制轨；不是「I2V+一张 OpenPose 静图」自动升级 |
| 表演者表情＋肢体迁移到角色 | [Wan2.2 Animate](https://docs.comfy.org/tutorials/video/wan/wan2-2-animate) Move／Mix | Animate 权重；预处理姿态脸 | 官方依赖 **ComfyUI-KJNodes**、**comfyui_controlnet_aux**；单人更稳 |
| 只要脸／头表情轨（轻量） | LivePortrait 系 | [ComfyUI-AdvancedLivePortrait](https://github.com/PowerHouseMan/ComfyUI-AdvancedLivePortrait) | 表情编辑候选；不生成递碗／手臂；二次元适配与双脸合成须实测 |
| 静帧表情编辑／关键帧链 | 同上 Expression Editor | `motion_link` 命令：`索引=过渡帧:等待帧` | 适合「害羞→偷看→停稳」无全身大位移 |
| 视频后面部清晰度 | Impact FaceDetailer／WanFaceDetailer 类 | [ComfyUI-Impact-Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack)；社区 Wan 低噪修脸流程 | 低 denoise（如 ~0.3）少步；防改身份 |
| 关键帧脸修复后再 FLF | InstantID／IP-Adapter 仅作用于**静帧** | IPAdapter plus 已维护模式，需另验版本 | 社区经验：末帧修脸 → 同 seed 再 FLF；非 Wan 原生 |

**加速 LoRA（LightX2V 等）**：官方 Fun Control 模板有 4-step 与非加速 FP8 两版，官方提示加速可能损失运动表现。是否影响本项目身份与表演须做同分镜对照，不能由此断言模型会「改变性格」。

**双人**：仍优先「分区静帧过结构 → 短 I2V／Fun Control」；Animate／LivePortrait 默认单主体，双人拥抱不要指望一次 Move 解决四臂归属。

**建议插件包（恢复实验时按需，勿一次全开）：**

1. `comfyui_controlnet_aux` — DWPose／深度等预处理  
2. `ComfyUI-KJNodes` — Animate 模板 Points Editor 等  
3. `ComfyUI-Impact-Pack` — FaceDetailer／分割  
4. `ComfyUI-AdvancedLivePortrait` — 表情轨（可选）  
5. 仅当官方模板需要时再加对应 Wan Animate／Fun Control 自定义节点  

与当前「无自定义节点」锁定运行冲突时：**另开实验 Comfy 根目录**，勿污染已锁 14B 复现环境。

### 2.2 表情控制：三种可靠路径（择一主路径）

1. **分镜静帧差分**（最稳）：靠近／接触／回应三张图，表情在图里验收，再 I2V／首尾帧。适合百合反差脸。  
2. **控制视频驱动**（Fun Control／Animate）：真人／Q 版简模演一遍「手抬到发饰」，再贴角色外观。适合动作归属。  
3. **LivePortrait 表情轨**（轻）：已有合格半身静帧时，只做眨眼、嘴角、轻微转头；**不做大幅度转身或双手交叉**。

忌：全局提示写「A 害羞 B 从容」却无分区／无双脸参考——易表情互染（Codex 已引 Reddit 讨论）。

### 2.3 即梦／Seedance：可靠控制清单

本地已证实：

- 全能参考 + 单张立绘可出待机草稿，但绿幕／背景常不合格（`docs/animation-lab/jimeng-first-trial.md`）。  
- **带尾帧时旧模型会拒**：「已使用尾帧图，暂不支持此模型」；1.0 Fast／部分档与尾帧不兼容（`gpt-tail-keyframes-plan.md`）。

社区／文档可核对的可靠做法（界面以实时网页为准）：

| 模式 | 何时用 | 要点 |
| --- | --- | --- |
| 仅首帧 | 单人小动作草稿 | 提示写清单一运镜 + 具体面部动作 |
| 首尾帧 | 状态 A→B（未触→轻触、正视→害羞） | **同比例、同主体**；先确认当前账号所选模型支持尾帧；不按版本名推断兼容；差别过大要补动作参考 |
| 全能参考 `@` | 定稿表情／运镜／动作 | `@图片1 作为首帧`；`参考@视频1的面部表情和动作`（写清参考的是脸还是运镜）；可加音频但桌宠素材通常关原声 |
| 参考图（非首帧） | 只锁人设不锁构图 | 素材角色及组合限制按当前模型、网页或 API 的官方说明逐项核实，尚无本项目统一兼容结论 |

提示词结构可借鉴 CRAFTS：Context／Reference／Action／Framing／Timeline／Style——**情绪写成可见细节**（眉眼舒展、目光看向镜头、嘴角上扬），少写「很甜蜜」。

GPT Q 尾巴：正面贴身首帧易把靠身粗段误读为末端；须结构图消歧、根→尖读序、膝下包络，见 [`animation-lab/gpt-jimeng-q-handoff.zh-CN.md`](animation-lab/gpt-jimeng-q-handoff.zh-CN.md)。成片落盘优先页面 `<video>.currentSrc`（vlabvod）+ 本机 `curl -L`，详见同页与 [`cg-production/jimeng-human-in-loop.md`](cg-production/jimeng-human-in-loop.md)。

本项目使用已有角色立绘；当前平台上传限制与素材授权需分别核对，不把某平台／某模型的一条限制推广到所有产品。积分策略是候选安排：豆包打样 → 即梦候选定稿；不得假设账号仍有免费额度或定稿必然更好。

接龙：上一段尾帧 → 下一段首帧；或 API `return_last_frame`（方舟文档路径，网页则以导出帧为准）。

### 2.4 豆包 vs 即梦 vs 本地 Wan（更新对照）

| | 豆包 | 即梦 Seedance | 本地 Wan2.2 |
| --- | --- | --- | --- |
| 适合 | 提示词／单人短草稿 | 表情张力、首尾帧、全能参考定稿 | 可复现、可审计、无按次云费 |
| 弱项 | 区域／额度不稳定 | 积分／会员／模型与尾帧兼容性 | 双人结构难、耗时长 |
| 本项目 | 打样 | 宣传／应用内高潮 CG 候选 | 已跑通 I2V 基线；Animate／Fun Control 待评 |

---

## 3. 推荐「恢复生成后」的最小可靠流程

**仍须用户明确恢复指示后再执行。**

### A. 百合双人（例：大小姐留座接触戏）

1. 身份锚点图固定（发饰／服／鲸尾连接）。  
2. 骨架／简模标四臂归属 → 三张静帧（靠近／接触／回应），分区检两张脸。  
3. 本地：短 I2V **或** Fun Control（控制轨来自简模表演）；失败则只交静帧差分。  
4. 云端定稿：即梦首尾帧（首＝靠近、尾＝回应）或 `@图` + `@短控制视频` 只参考手臂轨迹。  
5. 验收：四肢归属、表情反差、尾巴停稳、无 Meltdown 脸漂；再谈加长。

### B. 女友向单人（例：大鱼留饭）

1. 眼平、注视镜头的合格半身静帧。  
2. LivePortrait 仅候选承担「发现你」的头脸表情；**递碗的手臂、碗与身体运动不能由它负责**，需 Animate Move／控制视频或已验收静帧差分；各路线均待本机验证。  
3. 或即梦：`@立绘为首帧`，提示写递物与停顿，**单一运镜**。  
4. 接入产品：发现片段 → 停稳 → 用户点选 → 回应片段；完成才记事件（生命周期已修）。

### C. 不要做的

- 未过静帧结构就开长视频／多段批量。  
- 加速 LoRA 直接出关系定稿。  
- 双人提示词堆情感词却无 mask／无控制轨。  
- 用争宠旁白 CG 替代日常表情层。  
- 把试玩／排队当成「共同回忆已写入」。

---

## 4. 与团子小屋现状的衔接

- **剧情侧**：seat-share／chose-her／争宠已有离线闭环；创作手法应优先enrich **分镜与台词反差**，而不是再堆故事数量。  
- **CG 侧**：V1 手动试片保留；头顶气泡为已定展示规格，程序未改；V2 尾帧已弃。  
- **控制侧**：本地 Comfy 复现锁与「实验用自定义节点」分开；即梦尾帧必须先选对模型。  
- **未完成验证**：Wan Animate／Fun Control 本机双人；LivePortrait 双脸合成；即梦绿幕／透明管线量产。

## 5. 主要来源（抽样）

- Comfy 官方：Wan2.2 I2V、[Fun Control](https://docs.comfy.org/tutorials/video/wan/wan2-2-fun-control)、[Animate](https://docs.comfy.org/tutorials/video/wan/wan2-2-animate)  
- LivePortrait：[AdvancedLivePortrait 作者仓库](https://github.com/PowerHouseMan/ComfyUI-AdvancedLivePortrait)  
- 即梦／Seedance：首尾帧指南、全能参考 @ 语法、图生视频 role 划分（网页／第三方整理，以官方界面为准）  
- 叙事：Fuwa Event CG 解剖、Multic 浪漫 VN 指南、月幕亲昵要素、Butterfly Soup IGF 访谈、Complex Relations sprite 文  

**证据边界**：未逐条复现全部云教程；插件版本会变；积分与模型名以账号当前页为准。本文是制作方法论补充，不是已跑通的生产 Runbook。
