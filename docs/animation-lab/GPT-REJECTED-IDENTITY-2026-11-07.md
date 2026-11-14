# GPT 错误身份候选隔离 / Rejected GPT identity candidates

2026-11-07。用户报告测试时曾闪现非白色、近东方龙的另一角色；无法确定触发动作。

复查发现 `test-results/animation-lab/gpt/idle-candidates/c1.mp4`、`c2.mp4` 确为不同身份：鹿角/东方龙风格、不同服装。已连同关联帧图移入 `.animation-lab/rejected/gpt-wrong-identity-c1-c2/`，附 SHA256 与 `rejection.json`；原候选目录留拒收标记。不可作为动作、主体参考、随机池、降级或正式待机。用户回忆为漏挂参考导致，现有任务元数据不足以独立证实该原因。

**运行追查边界**：当前源码 GPT 视频映射只有 `idle-subject-s1.webm` 和 `pat-pixverse-p1.webm`。已抽查四份 public GPT 视频（包括旧版和备份）及 Claude 视频，每片取多个时刻；未见上述两名错误角色。GPT 图集和成体肖像也不是这两个候选。dist 的四份 GPT 视频与 public 哈希一致；源码、脚本与现有文档未发现 c1/c2 引用。本轮未复现那次一闪，因此不能宣称已定位运行时触发原因，不能把“实验区存在”写成“程序正在调用”。未因猜测回滚合法 S1 待机或 P1 摸头。

`node --import tsx scripts/verify-gpt-asset-boundary.mjs` 检查当前 GPT 映射资源、构建一致性，并扫描 public/dist 媒体拒绝两段废片的原始哈希。它是字节级来源检查，不识别重新编码后的内容，也不覆盖旧发行包、浏览器缓存或其他正在运行的版本。

候选身份错误不得仅改文件名或抠像后入库。后续如重现，记录角色 ID、触发事件、实际媒体 URL/哈希与截图，再修具体路由；无需用户猜动作。若制作新审片页，废片需明确 REJECTED，禁止自动轮播混在通过素材中。

English: Two visibly incorrect dragon-character candidates (c1/c2) were quarantined outside public/build assets, with source hashes and rejection metadata. No current runtime reference was found, and current built GPT videos match public files. The reported brief appearance was not reproduced; this is **not** a claim that a runtime trigger has been identified or fixed. Valid S1 idle and P1 pat remain unchanged. The boundary verifier rejects the exact retired video bytes in public/dist; it does not perform visual recognition or inspect old releases/caches.
