# 演示录制 / Recording scenes

日常界面不提供试玩条、剧情点播或 CG 预览清单。摸头、投喂、夸奖、聊天与邀请伙伴仍正常使用；角色关系与已完成的互动触发对应演出，继续遵守恋人模式、百合偏好、CG 自动播放、在场、免打扰与冷却条件。

Normal UI has no tryout strip, story selector or CG preview menu. Ordinary interactions and completed relationship events trigger scenes, subject to relationship preferences, cast presence, DND and cooldowns.

## 本机录制脚本 / Local recording harness

```powershell
node scripts/demo-scene.mjs --scene claude-affection --packaged
node scripts/demo-scene.mjs --scene gpt-affection --packaged
node scripts/demo-scene.mjs --scene shared-seat --packaged --seconds 45
```

脚本启动独立 demo 存档，设置适合录制的关系偏好，然后派发真实互动（夸奖或留座），等待前置动作与对白自然进入 CG；检查只出现一个播放器。默认片段开始后保留 30 秒供外部录屏，再退出。去掉 `--packaged` 可使用开发构建，需先 `npm run build`。不会读取用户的聊天存档或 API Key。

The script opens an isolated demo profile, sets recording preferences, dispatches a real interaction and waits for its prelude and automatic CG. It checks a single player, stays open for 30 seconds after playback starts, then exits. Omit `--packaged` for the source build. User chat data and keys are untouched.

已有本机自动化仍可通过 Electron preload 的 `window.garden.dispatch` 使用 `cg-preview` 做素材验收，参见 `scripts/review-cg-release.mjs`。这不是远程后门：没有增加监听端口、认证绕过或普通用户可见的隐藏菜单。录制入口仅存在于仓库脚本，生产应用不注册新的全局快捷键。

Existing local automation can use the preload dispatch and `cg-preview` for asset review. This adds no network listener, authentication bypass or hidden product menu; recording controls stay in repository scripts.

## GPT 待机修正 / GPT idle correction

2026-11-15：撤销误退到 Oct29 的整段回滚，恢复此前接入的主体 S1。正式文件 `idle-subject-s1-restored-v2.webm`，SHA-256 `98190d86c7307693348f40a5e617e81c982ac1e387d35d4892dfe540005d3604`。保留循环解码边界与暂停恢复修复，不将“看见错帧”视为退回整个合法动画的依据。

Restore the previously integrated S1 idle after the mistaken whole-clip Oct29 rollback. Keep loop-seam and pause-recovery fixes; identity incidents need actual runtime-source evidence before replacing an accepted animation.

## 本轮验证 / Verification

- 0.4.0-alpha.2: `npm test` 113/113，生产构建通过；public/dist 290 个媒体文件散列边界检查通过。113 unit tests, production build and 290-file media boundary check passed.
- 打包版 S1 待机：115 次采样有 115 个不同画面，循环两次；意外暂停与停止后动作恢复通过。Packaged S1 idle renders 115 distinct frames, wraps twice and recovers playback.
- `claude-affection` 开发构建，`gpt-affection` 与 `shared-seat` 打包构建：均从真实互动进入 automatic CG，只有一个播放器，日常界面无上述演示入口。Claude source-build and GPT/shared-seat packaged scenarios reach automatic CG through real interactions with one player and no visible demo controls.

上述演出验收在独立离线存档进行，不等同于真实 API 全组合或多屏原生鼠标验收。Scene checks use isolated offline profiles; they do not cover all live providers or native multi-monitor input.
