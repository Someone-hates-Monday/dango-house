# v0.3.1 透明立绘修复

正常比例立绘原来引用带白底的 JPG；CSS multiply 无法提供真实透明通道，独立的混合上下文还会使白底保持可见。七位角色的群聊及私聊现在统一引用 `public/portraits/*-alpha-v1.png`，移除 multiply 混合。

透明版本使用内置 image_gen 编辑。原始 JPG 保留，派生图不是逐像素不变的抠图；提示词、生成结果路径与哈希见 `asset-edits-v031.json`，美术署名及许可继续适用。Claude 的分层部件试稿仍为实验资产，本次修复没有将其启用为正式动画。

验证：构建通过，29 项逻辑测试通过；`node scripts/check-portraits.mjs` 在独立测试档案中逐一验证七位角色的群聊与私聊图片加载、四角透明、保留浅色不透明细节，并输出深浅底色截图至 `test-results/portraits-v031/`。发布后可运行同一脚本加 `--packaged` 检查实际打包资源。

Windows 输出位于 `release/v0.3.1/`，原用户资料仍由应用读取，不在升级脚本中修改。
