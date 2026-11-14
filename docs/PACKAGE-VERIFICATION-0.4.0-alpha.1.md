# 0.4.0-alpha.1 打包验收 / Package verification

2026-11-15。Windows x64 portable；桌面快捷方式指向 `release/v0.4.0-alpha.1/win-unpacked/团子小屋.exe`。Release outputs are local build artifacts, excluded from Git.

- `npm test`: 113/113 通过 / passed.
- Production TypeScript, Vite and Electron build passed / 生产构建通过。
- `node --import tsx scripts/verify-gpt-asset-boundary.mjs`: public/dist 290 个媒体文件无已撤回错误候选，GPT 待机与摸头散列一致。290 media files checked; rejected identities absent and mapped asset hashes match.
- `node scripts/verify-gpt-idle-loop.mjs --packaged`: 新打包程序，115 次采样、115 个不同画面、两次循环；意外暂停和停止后新动作均能恢复。Packaged app: 115 distinct rendered frames, two loop wraps, pause recovery and restart verified.
- `node scripts/review-cg-release.mjs --packaged`: 小屋双人、Claude 单人、GPT 单人、桌面双人四场景完成真实解码与 ended 回执；每场仅一个共享播放器，另一宿主无重复。Four packaged CG scenarios decode and finish with one shared player and no duplicate host.

测试使用独立 demo 存档，未读取或迁移用户 API Key。多屏混合 DPI、真实 API 服务组合及所有原生鼠标交互不属于此次完整覆盖范围。Tests use isolated demo profiles; mixed-DPI, live-provider combinations and exhaustive native mouse interactions are outside this verification scope.

两段半身裁切候选 `listen` / `chosen-again` 已归档到本地忽略的 `.animation-lab/rejected/claude-cropped/`，不随包发布。Two cropped Claude candidates are archived locally and excluded from the package.

本次仅更新源码仓库与本机桌面应用；GitHub Releases 下载入口仍指向既有公开版本，新便携包不因 Git push 自动上传。This update publishes source and updates the local desktop app; pushing Git does not upload the new binary to GitHub Releases.
