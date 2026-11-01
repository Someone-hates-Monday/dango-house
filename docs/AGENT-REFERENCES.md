# Agent、浏览与视频参考索引 / Agent, browser & video references

核查日期：2026-11-01。共 **29 个 GitHub 项目**，另附官方视频文档。每项链接指向上游一手来源；“优先/候选/借鉴”是团子小屋选型判断，不是已完成集成或生产压测。项目功能、许可和维护状态可能变化，实际采用时锁定 release/commit、重新核对依赖与模型条款。  
Checked 2026-11-01: **29 GitHub projects** plus official video documentation. Priorities are project-specific judgments, not completed integration or production benchmarks. Pin and recheck chosen releases, terms, and dependencies before implementation.

阅读顺序：先看 1、6、12、15–19，再看 21–23 的角色体验，最后评估实时与实验项目。完整路线见 [功能规划](AGENT-WATCH-PARTY-PLAN.md)。  
Start with 1, 6, 12, 15–19; then study character UX in 21–23; evaluate realtime/experimental options later. See the implementation plan for architecture and acceptance criteria.

## 浏览器与网页 / Browsers & web

1. **[Microsoft Playwright](https://github.com/microsoft/playwright) — 优先基础 / Preferred foundation.** 已在本项目用于桌面测试，可复用自动化经验；浏览任务仍需独立 profile、可见执行和权限层。适合固定站点与确定性步骤，不自动替模型规划或理解视频。Already used for project tests; suitable for deterministic browser execution, with separate profiles/policy. It is not a planner or video model.

2. **[Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) — 工具互通候选 / Interoperability option.** 用结构化可访问性快照暴露浏览器工具，适合将来让外部 Agent 连接。当前本地任务直接调用 Playwright 更易收窄能力。官方明确它不是安全隔离。Accessibility-backed MCP tools; useful for external agents. Direct Playwright is simpler for our first narrow workflows. MCP is not a security boundary.

3. **[Stagehand](https://github.com/browserbase/stagehand) — 模糊交互候选 / Model-driven interaction option.** 提供 act/observe/extract 等语义操作，本地运行需 Chrome。适合难写稳定定位器的步骤；本地兼容、模型支持、失败重试和成本需实测，不能承诺可接管任意 Electron 网页。Semantic interaction/extraction; assess local compatibility, providers, recovery, and cost rather than assuming universal integration.

4. **[Browser Use](https://github.com/browser-use/browser-use) — Python 外挂候选 / Python worker option.** 开源浏览器 Agent 库，可本地运行；采用它需 Python 子进程和事件桥。官方区分免费 MIT 库与收费推理/云浏览器，不是免费无限浏览服务。Local browser-agent library with a Python integration cost. Model inference and hosted browsers are separately billed.

5. **[Firecrawl](https://github.com/firecrawl/firecrawl) — 批量读取候选 / Extraction alternative.** 网页搜索、抓取、结构化提取可减少脆弱点击；不等于播放并理解视频。自托管主要 AGPL，SDK 与部分内容另有许可，云端能力也需核对。Useful for web context, not video perception. Review self-hosted, SDK, and cloud terms separately.

## Agent 编排与模型工具 / Orchestration & tools

6. **[LangGraph.js](https://github.com/langchain-ai/langgraphjs) — 优先编排候选 / Preferred orchestration candidate.** TypeScript 图式工作流、持久执行与人工介入适合任务暂停/恢复；需验证 SQLite checkpoint adapter、取消语义和 Electron 打包。不要为一个固定脚本直接引入全部生态。Resumable graph workflows fit our stack; validate persistence, cancellation, and packaging before adoption.

7. **[Mastra](https://github.com/mastra-ai/mastra) — 同语言替代 / TypeScript alternative.** 提供 Agent、工作流与应用开发能力；与 LangGraph.js 二选一试验。当前核心多为 Apache-2.0，`ee/` 企业目录另有许可，不能把整个仓库概括为同一开源许可。A broader TS framework; compare against LangGraph.js rather than installing both. Core and enterprise directories have different terms.

8. **[MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — 后期工具生态 / Later tool interoperability.** 连接现有 MCP tools，不替代任务导演。当前主线 v2 拆分 client/server，旧 `@modelcontextprotocol/sdk` 是 v1；不要照旧教程盲装。Official tool protocol SDK; choose and pin the current client/server generation deliberately.

9. **[Vercel AI SDK](https://github.com/vercel/ai) — 模型适配参考 / Provider abstraction option.** 可借鉴工具与多供应商统一抽象；本项目已有 SSE 和 Anthropic/兼容协议，不为接 Agent 先整体重写。验证工具结果、取消与私聊隔离等现有行为是否保留。Useful provider/tool abstractions; avoid replacing proven streaming behavior without a migration need.

10. **[Microsoft Agent Framework](https://github.com/microsoft/agent-framework) — 跨运行时参考 / Cross-runtime alternative.** Python/.NET 多 Agent 工作流方案；对现有 Electron/TS 不是最轻量依赖，可用于未来独立后端或参考检查点与协作。Relevant for a separate Python/.NET backend, not the smallest first integration here.

11. **[AutoGen](https://github.com/microsoft/autogen) — 历史参考，不作为新核心 / Historical, not a new dependency.** 本次官方仓库明确标记归档/不再维护，并引导新用户至 Microsoft Agent Framework。可以研究轮次与协作设计，不能因旧教程热门就推荐为当前成熟底座。Upstream is marked archived and points new work toward Agent Framework; use for historical design study only.

## 视频获取、理解与证据 / Video inputs, perception & evidence

12. **[Google Gen AI JS SDK](https://github.com/googleapis/js-genai) — 原生云视频优先候选 / Native cloud-video candidate.** 配合 [视频理解](https://ai.google.dev/gemini-api/docs/video-understanding) 与 [Live API](https://ai.google.dev/gemini-api/docs/live-api) 官方文档。能走视频输入不代表任意视频网站 URL 都能直用；项目的兼容聊天入口也不自动支持原生文件与实时协议。Use dedicated native APIs, with account/source validation.

13. **[Qwen3-VL](https://github.com/QwenLM/Qwen3-VL) — 本地/可替换视觉候选 / Visual model candidate.** 官方提供视频与抽帧输入方式；适合画面事实、场景和字幕画面的结合。音轨另配 ASR，检查量化、显存与当前模型许可。Visual video understanding with separate audio transcription; benchmark hardware and chosen weights.

14. **[MiniCPM-V / MiniCPM-o](https://github.com/OpenBMB/MiniCPM-V) — 端侧多模态探索 / On-device multimodal option.** 原 MiniCPM-o 链接重定向到统一仓库，按具体 V/o 模型区分能力。适合后期研究低延迟视听互动，不把任何型号都称为实时全模态。Choose the exact visual or omni model; capabilities and deployment costs differ.

15. **[FFmpeg](https://github.com/FFmpeg/FFmpeg) — 成熟媒体基础 / Established media foundation.** 抽音轨、抽帧、裁片与转码，适合 worker 中运行；不是语义理解器。打包时记录所用构建、编解码选项、许可和 notices。Use for media processing, with explicit build/codec terms in distributed binaries.

16. **[faster-whisper](https://github.com/SYSTRAN/faster-whisper) — 本地 ASR 候选 / Local ASR.** 无字幕时转录音轨并保留时间戳；Windows CPU/GPU 性能与依赖另测。它只能反映语音，不知道画面里发生什么。Timestamped transcription, not visual understanding.

17. **[PySceneDetect](https://github.com/Breakthrough/PySceneDetect) — 采样辅助 / Sampling helper.** 检测镜头变化，帮助分配抽帧预算；不是语义事件或笑点检测，长镜头内仍可能发生关键动作。Scene changes can guide frame sampling but do not capture all important events.

18. **[yt-dlp](https://github.com/yt-dlp/yt-dlp) — 可选来源解析 / Optional source resolver.** 获取受支持来源的元数据、字幕或可访问媒体；平台改版与账号限制会影响可用性。只处理授权可访问的内容，不承诺突破付费/DRM。Source extraction is conditional on support/access; no bypass guarantees.

19. **[BiliNote](https://github.com/JefferyHcool/BiliNote) — 中文视频流程优先参考 / Chinese video-pipeline reference.** 视频链接到笔记、截图和跳转的产品流程值得借鉴；上游说明支持 B 站等来源。适合参考导入/转录/证据 UI，不等于七角色实时共同观看。参考时检查当前具体平台支持，不能把项目简介当本站账号实测。Study source handling and evidence-linked notes; verify current platform paths locally.

20. **[Nemo2011/bilibili-api](https://github.com/Nemo2011/bilibili-api) — 归档接口资料 / Archived interface reference.** 本次页面显示 2026-07-06 已归档，不能直接当持续维护的生产依赖。第一版应靠用户给链接/文件和受控浏览；如采用社区 fork，需另选活跃版本并逐接口测试。Archived upstream; evaluate any maintained fork separately rather than assuming stability.

## 角色陪伴与多人交流 / Character and group UX

21. **[AIRI](https://github.com/moeru-ai/airi) — 陪伴产品参考 / Companion design reference.** 参考角色表现、桌面形态、语音与外部能力的组织方式。它不是本项目全部需求的一键插件，也不能据其演示证明我们的七人观影已可用。Study the product structure without assuming drop-in integration.

22. **[Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) — 感知与动作映射参考 / Perception-to-avatar reference.** 官方列出摄像头/屏幕视觉、Live2D 表情映射与主动发言；适合研究“看见—说话—表情”事件链。不会自动提供去重、跨角色讨论和视频推荐。Useful multimodal/avatar patterns; group discussion and recommendations remain our work.

23. **[SillyTavern](https://github.com/SillyTavern/SillyTavern) — 群聊人设参考 / Group persona reference.** 重点看角色卡、多人发言顺序和上下文组织；不是浏览器 Agent 运行时。上游 AGPL，不直接复制进 MIT 代码后忽略许可。Study interaction design and respect its separate license when reusing code.

24. **[OWL / CAMEL](https://github.com/camel-ai/owl) — 多 Agent 实验参考 / Multi-agent experimentation.** 可研究任务分解、协作和工具执行轨迹；主要 Python、目标偏通用任务，不作为陪伴群聊的直接替换。Borrow coordination ideas, not an entire desktop architecture.

## 实时与新兴“看视频”项目 / Realtime & emerging watch tools

25. **[Pipecat](https://github.com/pipecat-ai/pipecat) — 实时媒体候选 / Realtime media.** 音视频流水线、实时交互与供应商连接，适合语音陪看阶段；不负责角色关系、节目推荐或站点抓取。Realtime transport/pipelines, not the whole companion app.

26. **[LiveKit Agents](https://github.com/livekit/agents) — 房间与音视频候选 / Room/media infrastructure.** 适合多人音视频、流接入与 Agent 会话；自部署与云服务是不同成本路线。本地纯文本观影首版不需要先部署整套实时基础设施。Relevant later for realtime sessions, unnecessary for the first text watch party.

27. **[Vision Agents](https://github.com/GetStream/vision-agents) — 实时视听参考 / Realtime perception reference.** 面向能看和听的 Agent，需结合其视频/模型供应商验证。适合研究流媒体感知，不能把宣传中的低延迟当本项目测得指标。Study streaming patterns; benchmark rather than adopting marketing performance claims.

28. **[claude-video](https://github.com/bradautomates/claude-video) — 新兴流程参考 / Emerging pipeline reference.** 上游将下载、帧和转录交给 Agent，可帮助理解“让 Agent 看视频”的常见工程拆分。作为候选先评估，不认定已具备生产 SLA、任意平台兼容或人物间讨论。Useful workflow example, not an independently validated production stack.

29. **[Watch Skill / DeepWatch](https://github.com/oxbshw/watch-skill) — 新兴证据层参考 / Emerging evidence tooling.** 上游描述视频/音频/屏幕的时间戳证据、MCP/CLI/REST 接口，和我们的共享证据设计接近。是否采用须做 Windows 集成、权限、数据与依赖审计；本次只核查一手说明，未实跑。Promising evidence contracts and interfaces, requiring local validation before adoption.

## 成熟方案不等于整套成熟产品 / Foundation maturity is not product completeness

Playwright、FFmpeg、ASR 与已有模型接口解决底层执行和感知的一部分；**“七位伙伴有各自偏好、共同看过且不剧透、讨论不复读、推荐可验证视频”仍是我们需要设计和测试的产品层**。没有核实到一个能直接作为插件装入团子小屋、同时完成全部玩法的现成库。  
Established execution/media tools solve parts of the problem. Distinct preferences, shared grounded viewing, spoiler-safe discussion, and verified recommendations remain product engineering. No reviewed library is a verified drop-in solution for all of these requirements.

所谓免费需分开看：源码许可、浏览器运行、下载带宽、模型推理、搜索服务、实时传输都可能各自计费或要求硬件。不能因仓库开源或服务有试用额度，就向下载用户承诺整条流程免费。  
Separate source licensing from browser hosting, bandwidth, inference, search, and realtime transport costs; open source or trial credit does not make the entire workflow free.
