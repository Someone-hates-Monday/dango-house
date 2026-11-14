# CG and interaction production contract

[中文完整规格](CG-PRODUCTION-CONTRACT.zh-CN.md) · [Playbook](CG-PERSONA-SHOT-INTERACTION-PLAYBOOK.en.md)

2026-11-04. Process and acceptance only. Generation remains paused; no node installation, credit consumption, push or release. This contract governs acceptance and integration, while the Playbook supplies creative methods and the supplement lists candidate tools. Latest user decisions take precedence.

## Persona evidence

Separate selected artwork, runtime persona, attributed community interpretations and scene-specific acting. Record each field's value, evidence, scope and status. A title does not prove a shot or facial expression. Claude's composure versus DeepSeek's shyness is this scene's direction, not permanent canon.

Every character needs a versioned identity sheet: reference paths and hashes, creator/source, form/style, immutable features, optional expressions, prop ownership, tail attachment/tip, user/partner behavior, drift bans and unresolved issues. The existing seven-character prose summary is not seven approved sheets. Do not invent GLM accessories or a Kimi book from prose that conflicts with the selected image. Consult `animation-lab/character-consistency.json`. Q-style to normal-proportion mappings require explicit checks.

The new fanwork catalog is useful as a subject pool, but qualitative popularity and project “canon” require field-level sources. An index listing is not a popularity ranking. Actual hugs/tail entanglement are structural-risk tasks; holding a bowl is distinct from handing it off. Learn beats from community clips without distributing them as final assets. New CG uses the project's approved room background rather than unrelated scenery.

## Tool boundaries

- [Wan2.2](https://docs.comfy.org/tutorials/video/wan/wan2_2) has separate I2V and first/last-frame templates; save the actual workflow.
- [Fun Control](https://docs.comfy.org/tutorials/video/wan/wan2-2-fun-control) needs a control video and matching weights. [Animate](https://docs.comfy.org/tutorials/video/wan/wan2-2-animate) has Move/Mix and preprocessing dependencies. Neither is validated locally for two-character contact yet.
- [AdvancedLivePortrait](https://github.com/PowerHouseMan/ComfyUI-AdvancedLivePortrait) is a face-expression candidate, not an arm or bowl animation tool. Anime suitability and multi-face compositing require tests.
- Check cloud account/model reference roles, first/last-frame compatibility and actual credit cost. No universal version or quality guarantee is established.

Keep the proven local environment pinned. Use a separate experimental environment. Record workflow/node revisions, model hashes, seed, settings, time and failures. Proposed stop rule: two short failures of the same structural kind mean return to the storyboard/control track. Do not keep buying retries or adding prompt prose.

## Runtime capability and future protocol

Current: Q-style SceneDirector settles using reported body/movement end times; essential failures cancel. V1 CG remains manual-only in a fixed card. Its video-ended callback closes the card; it does not acknowledge director success.

Planned, not implemented: head-anchored bubbles, cross-segment BEAT_WAIT/CHOICE_2, media completion receipts, independently configurable user-romance/character-CP preferences and identity-sheet-driven asset selection.

Future states: requested → preparing → playing → holding → awaiting-choice → playing-response → completed; failed/cancelled are separate terminals. WATCH omits choice states. Receipts carry session/job/segment/host IDs; reject stale, duplicate and hidden-host callbacks. Actual video end or an explicitly accepted timed-still mode acknowledges success. Timeout is failure/fallback, not completion. An enqueue, play start or estimated duration is insufficient.

Real user choices branch once. No response or “later” ends quietly without an affection penalty. Props remain continuous between segments. Required Q actions and media must both finish before a once-only reward; cancelled/skipped/failed previews never fabricate completed memories. Release actor occupancy, playback and hit regions on cancellation. Preserve the boundary that chat Stop does not cancel independent Agent tasks.

Head bubbles: approach first, anchor above the rendered participant midpoint (single participant for POV), clamp to available space, contain the full frame, preserve faces and controls. Initial room width 280–340px and desktop 300–360px are design targets. Test compact windows, scaling, screen edges, Dock/free modes, multiple displays, departure, Stop, DND and host changes. Do not auto-play across separate hosts/displays. Native physical click-through requires desktop acceptance, beyond Playwright.

## First draft work orders

**CP-001 — Claude adjusts DeepSeek's hair ornament.** WATCH, adult-presented SFW normal-proportion characters, fixed camera. Three stills: notice/lean, one specified character-right hand touches the confirmed ornament while the other holds the book, then composed Claude versus shy DeepSeek with one motivated whale-tail tuck and settle. Trace all four arms. V2's rejected arms are not reusable. Only after approved stills and the user's generation-resume instruction test 2–3 seconds of contact. Two contact failures trigger a gaze-only fallback. Preview has no reward.

**POV-001 — DeepSeek saved rice for the user.** BEAT_WAIT, eye-level camera, no invented user hands. Notice → gently offer the same bowl → accepted stable hold → “thank you”/“later” response. If a bowl handoff is not visually valid, keep it and use a coherent “I'll put it here for you” response. Never teleport a prop or claim the user ate. LivePortrait may test facial response only; body/prop motion needs another method. Until the state machine exists, this is a review-page storyboard, not an implemented interactive product feature.

## Acceptance and assets

Record pass/fail/not-run with reviewer/date/evidence for identity/structure, acting/timing, visual delivery and runtime/publication. Inspect contact and occlusion transitions frame by frame, plus normal/slow playback. Hard anatomy failures cannot be offset by attractive art. Loop acceptance is separate from one-shot relationship scenes.

CG retains its background. Transparent Q assets require real alpha tested on light/dark/colored backgrounds, no stripes, spill or clipping. Check expression readability at minimum bubble size. Keep before/after compositing evidence. Check decode failure, late playback, pause, duplicate clicks, skip, departure, stale receipts, cancellation and fallback.

Stages: draft → identity-checked → storyboard-checked → trial → art-accepted → runtime-accepted. Redistribution and automatic playback are separate approvals, never inferred from runtime acceptance. Retain source/creator/license notices; code MIT does not license the art. Save parent version, file hashes, reference hashes, workflow/platform job, timing, crop/alpha/anchor, rejection reasons and rollback mapping. [Work-order template](cg-production/work-order.template.json) is a planning record, not a loadable application manifest.

Next: implement the bubble and receipt lifecycle with the existing manual clip; establish seven identity sheets and the two storyboard packages; only resume generation on user instruction, then compare one variable at a time before expanding production.
