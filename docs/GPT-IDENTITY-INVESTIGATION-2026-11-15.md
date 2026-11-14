# GPT 闪变追查 / GPT identity flash investigation

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
