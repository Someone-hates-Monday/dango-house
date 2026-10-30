# 素材与第三方说明 / Third-party notices

团子小屋的代码与素材不使用统一许可。代码的 MIT 不覆盖第三方角色、美术、视频、品牌或社区人设改编。请保留目录内原始声明与 manifest；下述索引不扩大任何授权。  
Code and assets do not share a single license. MIT does not cover third-party characters, art, video, brands, or persona adaptations. Preserve per-directory notices and manifests; this index grants no additional rights.

## 社区形象 / Community artwork

- [`public/community`](public/community/NOTICE.md)：[lokicorvus/CrossPet](https://github.com/lokicorvus/crosspet) 的角色图片与定义，声明 CC BY-NC-SA 4.0。设计来源包括上善无形、ZipZipPipe 与社区版本，详见原始署名。Character images/definitions from CrossPet, declared CC BY-NC-SA 4.0; see retained attribution for design origins.
- [`public/animated`](public/animated/NOTICE.md)：[fywdy/chatgpt-chibi-pets](https://github.com/fywdy/chatgpt-chibi-pets) 的 Q 版图集，CC BY-NC 4.0。上游说明其包含生成式图像与筛选修复。Chibi atlases under CC BY-NC 4.0; upstream documents generated images and subsequent selection/repair.
- [`public/video/deepseek`](public/video/deepseek/NOTICE.md)：[PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet) 的透明视频，保留上游许可、README、来源和哈希。禁止商用，衍生保留作者地址；原角色权益另行适用。Transparent videos with upstream license, README, provenance, and hashes; noncommercial with attribution requirements, separate from code MIT.
- [`public/portraits`](public/portraits/UPSTREAM-NOTICE.md)：经 [shuaizenge/ai-girls](https://github.com/shuaizenge/ai-girls) 整理的立绘，作者包括 [ZipZipPipe](https://www.pixiv.net/users/18604994)。逐文件来源及许可状态在 [`manifest.json`](public/portraits/manifest.json)。部分作品使用作者开放分享/二创说明，而非统一标准许可；不要推断全部为 MIT、CC0 或已获得商业授权。Portraits have per-file rights, including author sharing/derivative statements rather than one universal license. Do not infer MIT, CC0, or commercial permission.

DeepSeek 的原角色「溟月」来自上善无形，女仆二次设计来自 ZipZipPipe。相关设计的 CC BY-NC-SA 条件继续适用。其他角色的具体版本以各自来源记录为准，不能把一家上游的声明概括到所有原始创作者。  
DeepSeek's original character originates with 上善无形; the maid derivative is by ZipZipPipe. Applicable CC BY-NC-SA conditions remain. Follow each character's source records rather than assuming one upstream notice covers every creator.

## 项目加工与生成派生 / Project processing & generated derivatives

- [`public/repaired`](public/repaired/NOTICE.md)：等待/害羞与部分趴伏姿态由内置图像模型参考既有形象生成，沿用来源署名和非商业约束，具体条款见声明。Generated waiting/blushing and selected resting poses retain underlying attribution and noncommercial terms.
- [`public/portraits/ALPHA-NOTICE.md`](public/portraits/ALPHA-NOTICE.md)：立绘透明化属于技术处理，不变更原设计权益。Portrait alpha processing does not alter design rights.
- `public/rigged`：渲染用角色姿态/绑定资源是来源形象的派生数据，不是独立授权的新角色。Rendering/rig resources are derivatives of source characters, not independently licensed new designs.
- [`public/video/claude`](public/video/claude/NOTICE.md)：即梦 / Seedance 生成的同人派生视频。Claude 的原形象署名、非商业及适用的相同方式共享要求保留。Fan derivative clips generated with Jimeng/Seedance retain underlying design terms.
- `public/video/gpt`、`gemini`、`glm`、`kimi`、`grok`：即梦生成的待机；GPT 摸头来自 PixVerse P1，Gemini/GLM 摸头来自豆包。生成来源、验收状态、帧数与哈希见对应 manifest。生成并不把原角色变为项目原创，也不免除角色或平台条款。Jimeng idles, PixVerse GPT headpat, and Doubao Gemini/GLM headpats are recorded in their manifests. Generation does not remove character or platform obligations.
- `src/shared/characters.ts` 与 `src/shared/social.ts`：基于明确社区版本的人设改编与项目原创小剧情。改编部分维持对应来源条件；原创对白不冒充官方设定或视频原文。Persona adaptations retain applicable source terms; original scenes are not official canon or copied video transcripts.

生成记录是来源记录，不是对素材商业使用的法律保证。完整发行包按非商业同人项目提供。  
Generation records document provenance, not a guarantee of commercial rights. The complete distribution is provided as a noncommercial fan project.

## 依赖与实验 / Dependencies & experiments

Electron、Chromium、React 等运行依赖保留各自许可证；打包产物附 Electron / Chromium 声明，npm 依赖见锁文件。实验用 RIFE/Wan 说明与许可证在 `docs/animation-lab`；模型权重、环境与原始试片不上传、不随应用发行。  
Runtime dependencies retain their own licenses; packaged builds include Electron/Chromium notices and npm dependencies are locked. RIFE/Wan experiment notices are in `docs/animation-lab`; weights, environments, and raw trials are not distributed.

## 品牌与更正 / Brands & corrections

所有 AI 产品名和商标归对应权利人所有。本项目不代表 OpenAI、Anthropic、Google、DeepSeek、智谱、Moonshot 或 xAI，不暗示合作或背书。  
AI product names and trademarks belong to their owners. This project does not represent or imply endorsement by their companies.

如需署名更正或移除素材，请附文件路径、作品原始链接及可核实的权属信息，通过 Issue 或 **2872397866@qq.com** 联系。  
For attribution corrections or removal requests, provide the file path, original work URL, and verifiable rights information in an issue or email **2872397866@qq.com**.
