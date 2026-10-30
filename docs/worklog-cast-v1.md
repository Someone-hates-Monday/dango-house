# 其余五位动画扩展 · 承接 v0.3.3

## 保留的已完成工作

DS 原视频动作、Claude 已验收的六段视频、Dock 接触线、横条修复、工具栏命中区域、互动排队与勿扰不因本轮试制而替换。

Claude 相比 DS 仍缺独立走跑、难过、摔倒到起身；现有移动和趴姿仍为原渲染路径。这些留在后续队列，不冒充已完成。

## 本轮已执行

- 为 GPT、Gemini、GLM、Kimi、Grok 准备现有角色首帧，1280×720，角色高度 468，脚底 y=612，纯绿幕。Kimi/Grok 从当前图集完整单格提取；没有重新设计角色。
- 五个不同待机提示已实际提交即梦 Seedance 1.0 Fast，5 秒 / 720P / 首帧图生视频；账户余额从 76 到 26，使用已有积分 50，无充值和订阅。
- GPT/Gemini/GLM/Kimi/Grok 的任务名分别为「角色名待机V1」。生成页保留为同一个会话，网页截图见 test-results/animation-lab/cast-v1/generation-proof.png。
- 提示词与下一阶段专属交互配方：animation-lab/cast-v1.json。
- 本地导入入口：`.animation-lab/venv/Scripts/python.exe scripts/animation-lab/import-cast.py --process`。只读取 Downloads 中明确包含这些任务名的 jimeng MP4，不读取浏览器账户数据。

## 当前依赖和后续顺序

1. 用户已完成五个原片下载，全部导入并完成首轮透明处理。五段均无人物触及原片边界；GPT/Gemini 直接首尾衔接有明显姿态差异，改为无叙事待机专用的正向／反向往返循环，不用于任何叙事交互。
2. 对五段逐个检查原片裁切、角色一致性、眨眼连续性、透明边缘、脚底位置、循环接缝；不合格先补拍。
3. 基于通过的统一首帧补摸头、收到喜爱、私聊、投喂和偶发特殊动作；每人按各自人设，不复用 Claude 全部动作。交互配方已经准备，尚未提交这些生成任务。
4. 再接入真实应用和 Dock，逐项验证后发布下一版。当前正式版仍为 v0.3.3。
5. 即梦剩余 26 积分不足以覆盖全部互动。豆包实测跳转到区域限制页面，提示先登录，已打开扫码登录并请用户自行完成登录与协议确认。登录前不能确认其免费视频额度，也未在豆包生成或声称验证其效果。

预览：`http://127.0.0.1:4319/test-results/animation-lab/cast-v1/review.html`。本轮五位仍为待机试制，正式版保持 v0.3.3，互动生成与生产接入仍在队列。

后续进展：用户已完成豆包登录。GPT 摸头 V1–V3 实际生成但尾巴结构不合格，均不入生产；局部冻结合成也不能解决身体连接问题。现已由内置 image_gen 自行生成并保存清晰尾巴结构参考，作为辅助图提交 V4，仍以原始首帧锁定外观。详见 `animation-lab/doubao-trial-v1.md`。其余四位互动待 GPT 路线验收后继续，Claude 移动/摔倒恢复等既有欠项保留。


## v0.3.4：用户验收 GPT P1 摸头

用户选择完整 5 秒 PixVerse P1，已接入 GPT 摸头（小屋、桌宠与 Dock 站立形态共用 Sprite）。完整正向 121 帧，未截取、倒放或冻结尾巴；连续摸头保留当前播放，排队最新一次请求。Dock 通过播放状态保持站立至动作结束。其他行为维持原路径，Claude、DS 和其余角色不替换。

验证入口 scripts/verify-gpt-reaction.mjs 检查真实 Electron 媒体时长与透明通道、完整播放、排队、非摸头动作回退、Dock 鼠标移开后的完整播放、勿扰暂停；支持 --packaged。输出 test-results/gpt-p1-integration。其余四位专属互动、五位待机的最终验收，以及 Claude 独立移动/恢复仍待后续完成。历史 v0.3.3 记录是当时状态，本节为最新增量。


## v0.3.5：Gemini / GLM 摸头与显示边界修复

实际生成并下载 Gemini摸头回应A1、GLM摸头回应A1，各241帧/24fps/10.042秒，1280×720原片，完整正向透明处理到640×360 VP9 alpha。原片与接触表保存在 cast-interactions-v1/<角色>/pat，source SHA256 分别为32aac46acae49101cbd4541e5450268183e9107a43ad381722ff62b91b0d5a63、7d2a8ffd17ed9c3979cb50cb7ec71d753110c50bc7295dd8dddb1043b97d09c0。已核对首帧身份、明暗背景接触表和边界检测；轻微生成线条变化仍可能存在。production 的 patVideos 仅包含经过检查的 GPT P1、Gemini 和 GLM，不自动加载试验素材。

用户明确淘汰本轮豆包 GPT 收到喜爱与私聊：尾巴方向/结构错误。两段不下载、不采用、不映射到生产。GPT仍保留已验收P1。GPT米饭、Kimi摸头、Grok摸头实际请求被豆包今日免费额度用完拦截，未出片。偶发动作及其余配套动作的提示词已准备但未提交，不能称作完成。

显示裁切根因包括 .sprite.atlas 的 contain:paint 优先级高于 .rig-sprite 的 contain:layout，以及视频 object-fit:cover 在元素内裁掉画幅。已对实际角色视频/rig表面明确设 contain:layout、overflow:visible，视频和快照按16:9自然画幅居中，高度和脚底不变；没有缩小人物规避问题。verify-video-bounds.mjs 使用本地无用户资料的无头浏览器，检查实际应用中GPT第33/55帧在1280/900宽度下的透明像素范围和所有裁切祖先，并验证DS/Claude视频完整画幅。

verify-cast-reactions.mjs 已验证完整10秒、排队、恢复原渲染、Dock移开鼠标仍播完及勿扰暂停；开发和隔离打包版通过。打包测试使用明确 --user-data-dir 并断言路径，避免与运行中的用户版混用。32项测试、GPT P1回归通过。最终样式更新后重新构建与打包；包内资源仍需核对。

网页进展：Vidu保持登录，显示20积分和Q4 1080p免费一次；标准文件选择器超时，图片粘贴已成功，尚未提交Kimi生成。随后页面变为文生图，未将未知页面状态当作已成功生成。用户要求失败时改用Chrome。Chrome已安装，网页插件返回chrome不可用；用Computer Use启动了真实Chrome，但读取新标签页时工具因无法确认当前网址停止本轮控制，此后没有继续Windows或外部网页输入。需用户先在Chrome手动打开已知Vidu页后，下轮重建状态继续；不要重复内置浏览器失败上传。

最终交付核对：显示范围测试已扩展到自由桌宠、Dock站立和私聊Q版，GPT抬尾第33帧在各模式均没有被裁切祖先遮挡。test-results/video-bounds/verification.json记录透明像素实际范围；packaged-assets.json确认最终ASAR中的CSS与测试构建相同，GPT/Gemini/GLM三份生产视频与验收文件字节一致。最终v0.3.5便携包已构建，桌面快捷方式已指向新版；由于本轮原生窗口控制已被停止，运行中的旧版未强行结束，需要从托盘退出旧版再启动。


## v0.3.6：五位待机真正接入

用户指出已有五段待机未进程序。已重新检查五张明暗接触表与原片边界报告，并将 GPT/Gemini/GLM/Kimi/Grok 的透明 draft.webm 复制为 public/video/<角色>/idle-jimeng-v1.webm；逐角色 idle-manifest.json / idle-production-review.json 保留来源、帧数、循环方式和轻微生成变化限制。这些素材是待机专用往返循环，不用于倒放摸头、吃饭等叙事动作。

ReactionVideoSprite 增加独立待机层：安静站立播放；有专属摸头时完整播放并排队；结束回待机；无视频的动作继续 rig；Dock趴下不加载站立视频。显式传入免打扰状态，避免旧 stoppedAt 或关闭自主走动把待机永久暂停。头像改用轻量原渲染，避免在侧栏重复解码。

verify-cast-idle.mjs 已通过五段实际解码帧增长、透明角、首尾回绕、挥手切换与恢复、Dock站起待机/离开趴下、免打扰暂停。裁切回归通过；摸头和完整互动回归及32项测试再次运行，结果待最终发布核对。

保留上一轮队列：Kimi/Grok专属摸头、GPT除P1以外的互动、各自米饭/私聊/喜爱/偶发动作，以及Claude独立移动/恢复均未冒充完成。

Google查询：官方Gemini功能表将视频生成列在AI订阅功能中；Google Vids官方2026-04-02公告给个人账号每月10次免费视频生成。来源 https://support.google.com/gemini/answer/16275805?hl=en 和 https://blog.google/products-and-platforms/products/workspace/google-vids-updates-lyria-veo/ 。没有实际核实用户Google账号权限或生成新片。Chrome真实窗口已在PixVerse页面，但再次读取窗口状态时，Computer Use因无法确定当前浏览器URL而中止本轮；未继续任何外部网站输入，不能再要求用户重复打开页面来假装能解决。

交付核对：v0.3.6开发版与隔离打包版的五位待机验证均通过；Gemini/GLM完整10秒摸头、GPT完整P1、队列、Dock、免打扰及32项单元测试通过。实际包内五份idle视频与测试资源字节一致，CSS与最终构建一致，证据为test-results/cast-idle/packaged-assets.json与packaged-verification.json。Chrome网址识别失败后没有继续外部网页操作；Google免费生成只是已查证候选入口，没有假称实际生成新片。


## v0.3.7：实际运行版本与旧动作绘制余量

用户仍看不到待机，实查主进程仍为release/v0.3.4，旧版驻留与单实例机制使新快捷方式没有替换正在运行的程序。用户数据同时为dnd=true、petsVisible=false、room.wandering=false。已先通过SQLite在线backup保留AppData/Qiting/backups/before-v036-20261030-184410/garden.sqlite；确认无程序运行后，仅将dnd改为false、petsVisible改为true，保留关闭走动与其余数据。旧进程在重启前已退出，未执行原本准备的强制结束。启动036后又触发显示主窗口，真实Windows截图和AX都确认036路径和版本，终于完成实际接入。

用户另指出Kimi其他动作可能越界。RigSprite改为在216×240逻辑坐标外增加48像素绘制边距，画布与CSS反向偏移抵消，不改变人物缩放或脚底位置；小屋侧边界使用0.75倍角色宽度作为绘制留白。源图集不做扩大相邻格采样，不引入相邻头发。verify-rig-bounds.mjs在真实本地应用测试8类Kimi动作×左右两侧，逐次确认有效像素不触及画布边界、没有裁切祖先、脚底和尺寸锚点不变，并要求行走确实经过多个帧。该测试不宣称修补原图集已有的绘画缺陷。

五段待机、Gemini/GLM专属摸头、视频裁切、Dock与32项单元测试均通过。当前037打包与实际启动核对正在完成；新动画生成保持暂停，先完成已有资源适配。

最终交付：v0.3.7已构建并通过包内CSS/播放器与测试构建字节比对。已直接启动用户实际主程序，真实Windows窗口AX记录file路径v0.3.7及侧栏版本v0.3.7，主进程路径亦一致；证据test-results/live-adaptation/v037-running.png。桌面快捷方式已更新，用户无需再次退出旧版。隔离打包版五位待机通过；Dock接触线在125%缩放下7位最大偏差0.4px。聊天/共同记忆保留，本轮仅明确恢复dnd=false、petsVisible=true，关闭自主走动的原偏好保留。
