# 团子小屋：定位与插件验收（2026-11-04）

[English](PRODUCT-REVIEW.en.md)

## 适合坚持的方向

七位伙伴共同生活的桌面小屋：群聊和私聊、争宠与关系、投喂摸头、Dock 排排趴，再让外部 Agent 通过工具使用这些身体。与单角色问答相比，差异来自伙伴之间的关系和连续生活感。

目前的强项是多角色共同场景、关系状态、同一套交互跨房间/私聊/桌宠/Dock 使用，以及角色形象和模型服务可以分离。DeepSeek 的 109 段素材来自上游，不属于本项目原创优势；我们的工作是整理、适配、交互映射与播放衔接。

## 与相关项目对照

- [DSH Pet](https://github.com/PC2005-cloud/dsh-pet)：透明动画桌宠、轻便使用与 DIY 素材链值得参考。本项目在多角色关系和共同场景上投入更多，但 Electron 体积与维护成本也更大。
- [CrossPet](https://github.com/lokicorvus/crosspet)：跟随 AI 服务切换形象、根据工作状态表演，工具工作流定位清晰。我们更偏共同生活与娱乐；外部 Agent 桥仍需更多真实客户端安装验证。
- [AIRI](https://github.com/moeru-ai/airi)：实时语音和游戏互动能力值得学习。我们当前没有同等完整的实时声音、游戏和感知链路。
- [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)：免手动语音、打断与 Live2D 是成熟的个体陪伴路线。我们当前主要采用视频/帧动画，不能宣称拥有同等自由的表情口型控制。

以上是按本地实现与各项目公开说明判断的产品方向差异，不是同环境性能评测，也不覆盖所有商业陪伴产品。

## 当前差距与优先级

1. 动画覆盖不均衡：DeepSeek 最丰富；其他角色应补齐高频互动，再考虑更多角色。
2. 连续生活感需要加深：关系变化有真实状态，但不少社交和观影讨论仍由本地剧本驱动，不能当成七个自主 Agent。
3. 真正看懂视频尚未完成：字幕/元数据证据与抽帧占位，不等于视觉理解；网页打开成功也不等于内容推荐质量已验证。
4. 插件安装体验仍可简化：目前需要运行主程序、启用桥、安装 Node 并将配置加入外部客户端。
5. 素材采用各自条款，代码 MIT 不代表所有美术都可商用。

建议先加强“多位伙伴相互陪伴”的可玩性、其余角色动画与长期记忆，再扩展浏览和视觉。插件是外部 Agent 的陪伴舞台，不应因为加入工具而削弱日常的可爱和安静。

## 本次插件验证

复现：`npm run build`；将 `@modelcontextprotocol/sdk@1.32.2` 安装到 `test-results/mcp-client`；运行 `node scripts/verify-agent-bridge.mjs`。打包版使用 `--packaged`，检查 `release/v当前版本/win-unpacked`。

使用隔离的 Electron 用户目录和官方 MCP SDK，不读取用户真实 API Key，不调用付费模型。验证：

- 标准 stdio 初始化、10 个工具发现、7 位角色读取；
- 摸头/投喂/夸奖改变实际应用状态，表演指令到达角色动作；
- 未认证 REST 请求、无效角色与未知工具被拒绝；
- 快照不返回连接凭据与桥 token；关闭桥后访问失败。

修复了 stdio 使用 `Content-Length` 的协议错误，按 [MCP stdio 规范](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports) 改为每行 JSON。打包时将脚本放到 `app.asar.unpacked`，避免外部 Node 无法读取 `app.asar`。

这证明标准客户端能控制运行中的应用；未声称已在 Cursor、Claude Desktop、Codex 各自 UI 中安装验收。浏览、视频理解及真实 API 质量不在本次桥测试范围内。测试报告与截图保存在忽略目录 `test-results/agent-bridge`。

## 图标

三位原创团子一起趴在 Dock 上，屋顶包含爱心，表达“共享小屋、伙伴关系、桌面陪伴”。不使用七个模型商标堆叠。母版与多尺寸 Windows ICO 位于 `build/brand`；`scripts/brand.mjs` 同步到应用资源，保留旧图标便于比较。
