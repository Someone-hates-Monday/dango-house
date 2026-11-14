# Cursor CG plan review and still handoff — 2026-11-08

[中文](CG-STILLS-REVIEW-2026-11-08.zh-CN.md) · [Prompt set](reference-stills-2026-11-08.prompts.json)

CP-002/004/005 are suitable for reference-still production. CP-003 needs one explicit prop-transfer branch and remains a high-risk video trial. Keep CP-001's current installed clip according to the latest Cursor work order; do not regenerate its stills or overwrite November 8 status with an older review. This pass authorizes reference images only, not video submissions, public CG replacement or automatic rewards.

## Staging corrections

- **002, window seat:** no bowl. Standing invitation → both seated → book closes and shoulder distance narrows. DeepSeek stays screen-left and Claude screen-right.
- **003, bowl:** choose acceptance, not a mixture of acceptance/refusal/eating. DeepSeek holds one bowl with two hands → Claude's right hand joins → Claude holds it while DeepSeek withdraws. Claude keeps her book on her left throughout. Preserve the blue floral white porcelain bowl produced in the first still.
- **004, shared reading:** one book and an existing red ribbon bookmark. The edge obscures only part of DeepSeek's lower face; keep eyes visible and supporting hands traceable. The initial middle still switched the support hand, so it was retained under rejected and a correction requested.
- **005, DeepSeek initiates:** proximity, Claude's brief surprised pause and acceptance; hands remain on each woman's own lap/book. Affection need not require complex touching.

## Fanwork research before generation

Reviewed the [Claude gallery](https://genderswapai.com/zh-CN/ai-gijinka/claude), the actual Blackcat PV cover and ZipZipPipe Claude wallpaper. The wallpaper informs restrained side-glance/warm lighting; the cover confirms the cast style but contains extra characters/text, so it is not a generation input. Identity references remain the project's selected adult portraits; the installed CG poster supplies the established room/style.

Creator work leads: [Claude eating rice](https://www.bilibili.com/video/BV1MKH96sEZL/), [Claude and DeepSeek's daily interaction](https://www.bilibili.com/video/BV15kaY6vEKC/), [DeepSeek initiating a face inspection](https://www.bilibili.com/video/BV1GGeb64ESo/), and [Blackcat's pair PV](https://www.bilibili.com/video/BV191Yr6bEYy/). Public metadata/search indexes were available; Bilibili page retrieval returned 412 and full videos were **not watched**. These are theme leads, not verified shot/timecode references. The PV's indexed creator description additionally explains an iterative method: provide Codex with persona/reference inputs, review the first pass shot by shot, select feasible shots, then rerun using reference video and revised prompts. We adopt that review loop, not an unavailable original prompt set. Each fan author has their own interpretation, as the [pair collection](https://genderswapai.com/zh-CN/ai-gijinka/yuri) explains; do not turn one staging choice into universal canon.

## Prompt/workflow guidance

Search-readable portions of the [official Seedance guide](https://docs.volcengine.com/docs/ark/seedance-2-0-prompt-guide?lang=zh) call for explicit character/reference roles and note duplicate-character risks with multi-view inputs. Full-page retrieval timed out. The community [Emily2040 workflow](https://github.com/Emily2040/seedance-2.0) is an additional process reference, not a tested capability guarantee or an installed skill.

Each image uses two identity anchors plus the scene/previous pose. Generate individual stills, not a multi-person turnaround collage. S1/S2/S3 are storyboard/pose references, **not three guaranteed timed keyframes**. Check the actual Jimeng mode before claiming first/last-frame control. Trial 002/005 first, then 004, and the 003 transfer last. Normal queue only; no membership acceleration or purchases.

## Delivery boundaries

Use the requested `test-results/cg-lab/<sequence>/stills/` filenames. Each group has a manifest and review page; record SHA256, actual dimensions, reference hashes, tool, prompts and limitations. Generated with built-in image_gen, copied non-destructively into the project. No video model or API key was used. Backgrounds remain intact.

Individual pose approval is separate from cross-frame continuity, video process correctness and runtime acceptance. Record remaining camera/decor/gaze drift rather than promising seamless interpolation. Rejected attempts stay outside the canonical three stills. Video trials must independently verify hand transfer, book ownership, tail attachment and recovery. Use actual generated end frames for continuation; stop after two repeated structural failures and simplify. New videos remain candidates until reviewed; do not redo accepted CP-001 or publish these references automatically.
