# GPT 闪变追查 / GPT identity flash investigation

## 最新结论：alpha.4 / Current decision: alpha.4

用户确认 alpha.3 仍会切到错误形象并出现更多闪变，下面 alpha.2/3 的证据只是历史排查，不能当作问题已经解决。alpha.4 从 GPT 站立 Sprite 路由和 ReactionVideoSprite 内同时删除备用图的挂载路径：不再用其他图集表达 think/wave/read/jump/sad 等未完成视频的提示，也不在媒体失败时降级为另一张人物图。普通动作提示继续使用 S1 视频，保留已有互动特效与已验证 P1 摸头完整播放。Dock 趴姿与侧边栏小头像不属于这个站立视频表面。

The user reports alpha.3 still flashes. Earlier evidence is historical, not proof of resolution. Alpha.4 removes the standing GPT rig subtree entirely and prevents the video renderer from revealing atlas art on cues or failures. Unsupported cues keep S1 and existing effects; approved P1 still plays fully. Dock resting art and small avatars are separate surfaces.

**后续约束**：不得给 GPT 站立待机重新接入通用 RigSprite、静态立绘、随机候选或降级图片。新增动作须使用同一主体、经审片的独立视频，不要通过临时混图补动作。不要为修闪变删除 S1 帧或整段换回旧待机。

**Invariant**: standing GPT has no generic rig/static/random/fallback character art. Add only reviewed same-identity action videos. Never trim S1 or roll back the accepted idle to hide a rendering issue.

`scripts/verify-gpt-fallback.mjs` 已改成检查 **无备用 DOM**：循环边界、五种动作提示、P1 完成、waiting/stalled/error 事件都不能挂载或显示备用图。旧版脚本检查“会切图且图集正确”不再符合产品要求。

The verifier now checks absence of alternate-art DOM across loops, five cues, P1 completion and media events. Verifying a correct fallback image is no longer the desired behavior.

alpha.4 打包验收：114 项单元测试与构建通过；`verify-gpt-fallback.mjs --packaged` 在四次循环边界、五种提示、P1 完成和媒体等待/报错下均没有备用图 DOM；待机连续 115 个不同画面、两次循环，暂停恢复通过；P1 全长、连摸队列、投喂保持视频、Dock 站立与免打扰通过。截图和 JSON 保存在本地忽略的 `test-results/gpt-identity-audit/`、`test-results/review-2026-11-14/` 与 `test-results/gpt-p1-integration/`。脚本按顺序运行：并发 Electron 窗口可能造成后台 rAF 节流，不适合逐帧切换验收。

Packaged alpha.4 passes 114 unit tests/build, four loop boundaries, five cues, media-event guards, 115 distinct idle frames, pause recovery, full P1/queue, feeding identity, Dock standing and DND. Run frame-sensitive Electron checks sequentially because background windows can throttle rAF.

## 历史排查 / Earlier investigation

用户提供的截图为灰发、深色服装的不同角色，确认来自刚更新的 0.4.0-alpha.2 桌面程序。不能继续解释成用户打开旧版本，也不能把两个实验废片的隔离等同于已经定位截图来源。

The user confirmed the screenshot came from the updated alpha.2 desktop app. Do not dismiss it as an old app or equate lab-candidate quarantine with finding this incident's cause.

## 当前证据 / Evidence

- 在 Electron 中按每帧展开 S1 待机全部 225 帧、P1 摸头全部 121 帧和 Oct29 历史待机 225 帧，未见截图中的灰发角色。联系表位于本地忽略目录 `test-results/gpt-identity-audit/`。All decoded frames were inspected; the reported identity was not observed.
- alpha.2 的 asar 中 GPT 图集、静态参考与 S1 视频逐字节匹配 public 文件。Packaged files match source bytes.
- 重启真实用户桌面进程并临时连接本机调试端口，记录实际房间 DOM：skin=animated、S1 地址；强制 think 时 fallback 截图为正确白龙。现场证据 `live-alpha2.json/png`、`live-forced-think.png`、`live-transition.json` 不入库。The actual user process uses S1; a forced fallback renders the correct white dragon.

## 本轮修复 / Changes

- `ReactionVideoSprite` 不再因 4.2 秒残留特效包络覆盖 idle；普通非 idle 动作仍使用动作图集，摸头仍播完整 P1。Standing idle no longer yields to leftover FX; other actions and full P1 remain available.
- `RigSprite` 使用带不可变版本标记的白龙图集地址，保持原始上游文件不变；图集 SHA-256 为 `6d7cd4d4a33f2babda645dc1cb8b6b719530029b511e126ac6611fa1142a718f`，新增校验。Reviewed atlas identity is hash-checked and cache-versioned.
- 媒体表面 `data-character-file` / `data-idle-src` 与 canvas `data-texture-src` 可用于后续现场追踪；不包含 API Key、对话或新的网络接口。Local diagnostics contain no secrets or new network interface.

## 验证边界 / Limits

截图中的具体灰发角色未在这次运行中复现，不能声称完整根因已经查明。上述修复针对已确认的多余 fallback 条件和旧资源缓存风险，不删掉合法待机帧。后续若再现，优先采集当时媒体、姿态、纹理来源与实际绘制画面，而非再次整段替换素材。

The exact flash is still unconfirmed. These changes address an observed fallback condition and stale-cache risk, not a proven explanation for every reported pixel. Capture live sources and rendered output if it recurs; do not roll back the accepted animation on speculation.
