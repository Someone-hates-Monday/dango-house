# Fan-art acting research: pair scenes and viewer-directed companionship

[简体中文 — detailed research and shot specification](CG-ACTING-AND-POV-RESEARCH.zh-CN.md) · [Craft & control supplement](CG-YURI-AND-CONTROL-SUPPLEMENT.en.md)

2026-11-04. **Generation is paused at the user's request.** The V2 end frame failed arm-anatomy review; its local video job was cancelled and did not replace V1. This research does not authorize restarting image/video inference.

For yuri/girlfriend narrative craft and ComfyUI / Jimeng control packages beyond this file, see [CG-YURI-AND-CONTROL-SUPPLEMENT.zh-CN.md](CG-YURI-AND-CONTROL-SUPPLEMENT.zh-CN.md).

## Evidence and limits

Creator discussions describe [interacting LoRA characters](https://www.reddit.com/r/StableDiffusion/comments/1f2co1b/any_advice_to_create_two_interacting_lora/) and [different emotions on two faces](https://www.reddit.com/r/StableDiffusion/comments/1tovdor/2_characters_with_different_emotions_in_sdxlillu/) using regional conditioning and inpainting. These are individual experiences, not universal recipes. Older SDXL methods apply to still-image preparation, not automatically to Wan video tracking.

The [multi-character guide](https://github.com/Haoming02/All-in-One-Stable-Diffusion-Guide/blob/main/MultiChara/README.md) addresses feature mixing. A [two-person Wan masking failure](https://www.reddit.com/r/StableDiffusion/comments/1vk2liq/focusing_a_wan_22_facebody_swap_on_only_one_of/) illustrates why wording cannot fix a mask selecting the wrong person. Identity separation does not guarantee correct shoulders, elbows and wrists.

[Official Wan Fun Control documentation](https://docs.comfy.org/tutorials/video/wan/wan2-2-fun-control) provides pose/depth/edge control routes. They require their own workflow and assets; this research did not install or validate them.

Pair-fanwork entries include [DS×Claude](https://www.bilibili.com/video/BV191Yr6bEYy/) and [Claude's confession](https://www.bilibili.com/video/BV1PTHB6BEbA/). Viewer-oriented material includes [the girlfriend-themed DeepSeek work](https://www.bilibili.com/video/BV166nW6REyR/) and a [creator's daily-life collection](https://www.bilibili.com/video/BV1BHH76BEYY/) listing giving flowers, waiting for the viewer, warming hands and asking for headpats.

Some Bilibili pages returned 412. Titles, visible descriptions and indexes were checked, but these videos were not all watched frame by frame. The acting suggestions below are original project proposals, not claims about exact shots in inaccessible footage or universal character canon.

[Monika After Story's greeting implementation](https://raw.githubusercontent.com/Monika-After-Story/MonikaModDev/master/Monika%20After%20Story/game/script-greetings.rpy) is a useful non-video companionship reference for context, priorities, relationship ranges and repeat rules. Borrow the mechanism of contextual responses, not its entire persona or dialogue.

## Two distinct acting lines

**Pair scene:** Claude stays composed and gently teasing while DeepSeek becomes bashful. Stage approach, one clearly owned touch, then a response. Specify separate gaze targets, expressions and posture for each woman. DeepSeek's whale tail makes one motivated response and settles; do not restore constant idle swaying. This is a scene choice, not a rule that DeepSeek must always be shy.

**Viewer companionship:** use eye-level framing and gaze toward the camera. A pair clip cropped to one character is not a first-person girlfriend interaction. The invitation, object transfer and waiting beat must address the viewer. Do not assume the user's gender or invent fixed gendered viewer hands.

Original suggestions: DeepSeek saves food and waits for acceptance; Claude closes her book and calmly leans toward the viewer; GPT glances away then checks the response to a reserved seat; Kimi invites shared reading. Gemini, GLM and Grok retain their existing project personalities rather than sharing one generic flirtatious reaction.

Use invitation clip → stable waiting pose → actual user choice → matching response → memory closing. Silence, skip and cancellation are valid outcomes. Prerecorded video does not provide continuous eye tracking or arbitrary lip-sync. Pair-oriented and user-oriented preferences can coexist; preserve friend/pet/romance settings.

## Revised production gate

Before expensive video inference: keep consistent character references; verify each arm's shoulder–elbow–wrist–hand ownership; establish occlusion with a pose/3D sketch; correct faces independently; approve three still storyboard poses. Start with one short action, then assess temporal continuity. More detailed prompts cannot rescue an invalid reference.

Check node support and maintenance instead of copying old settings blindly; [IPAdapter plus is in maintenance mode](https://github.com/cubiq/ComfyUI_IPAdapter_plus).

## Head-anchored film bubble

The latest requested direction replaces the fixed corner card: chibi participants first approach/orient, then a compact film bubble appears above their rendered head midpoint. Viewer-oriented scenes anchor to the selected resident. Initial targets are 280–340px wide in the room and 300–360px on desktop, clamped to available space without covering faces or controls. Use actual rendered positions, a stable pointer, no focus stealing or new window, and a chibi closing reaction. Full-stage CG should be an explicit replay expansion rather than default coverage.

This remains a next-step presentation specification; this research round did not implement the bubble or adopt the rejected V2 frame.

## Model alternatives

The tested Wan14B FP8 clip used an observed 17.66GiB total VRAM and 927.66 seconds. Spare VRAM is not evidence that precision upgrades fix acting. [HunyuanVideo 1.5](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5) and [LTX's current 2.5/22B route](https://github.com/Lightricks/LTX-2) are candidates, not locally verified improvements. Hunyuan's native instructions target Linux; Windows support must be tested separately. Compare approved identical references for motion, anatomy, emotion/gaze, tail continuity and runtime only after the user resumes generation.
