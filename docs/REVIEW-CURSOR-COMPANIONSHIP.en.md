# Cursor companionship review and next steps

[简体中文 — evidence and repair contract](REVIEW-CURSOR-COMPANIONSHIP.zh-CN.md) · [Repair prompt](CURSOR-REPAIR-PROMPT.md)

2026-11-04. Reviewed Cursor commits through `bc486ab`, reproduced locally with the unrelated manual-CG addition. No new push or Release.

## Verdict

Partially accepted for continued internal testing, not ready for the next formal release or automatic CG unlocks. Presence rendering and reply provenance improve the app. The social director, completion events and cancellation are still incomplete.

82 ordinary tests pass (79 baseline plus three CG tests), build passes, existing Electron smoke passes, all 109 DeepSeek clips pass playback/menu regression. An added real-UI matrix verifies 7/3/2/0 room and Dock counts, visible-but-quiet residents and an empty cast surviving restart.

## Reproduced blockers

- **Premature completion:** `companion-story` and `playYuri` record memories/rewards when queuing, so cancelling an unfinished story still grants a completed relationship event. Generic `perform` also grants approach-based bond points outside completion.
- **Director bypass:** the engine still executes `this.scene`, never consumes `SceneDirector.due`, and legacy rivalry/social/model reactions bypass priorities. Three pats can overwrite a participant in a user-selected story.
- **Presence boundary gaps:** direct `perform` can animate absent residents and increase bonds toward absent targets. Audit feed/visit/clip/praise, private UI and agent/bridge callbacks too; visual filtering alone is insufficient.
- **Story-model wiring:** actual `generateReply` ignores `_input`, so `storyLlmPrompt` never reaches the provider. A no-op action callback still enables tools. The story controller is not cancelled by Stop; late model notices still appear.
- **Private-return idempotency:** duplicate returns create duplicate memories. The existing test permits duplication despite its comment. The current opening event also makes the first return look like a repeated visit.

Run `node --import tsx scripts/review-companion-contract.mjs`: all seven new contract checks currently fail. Reports live in ignored `test-results/cursor-review`. They use controlled local fixtures without personal API keys. Do not weaken or remove these assertions to claim acceptance.

## Repair order

1. Make one director execution source; validate present participants at the engine boundary; link interruption and completion; commit event/reward outcomes once per completed job, never on scheduling.
2. Implement or disable genuine one-request, tool-free story enrichment with cancellation identity and actual provider provenance. Make private sessions individually identifiable and return handling idempotent.
3. Only after these pass, improve arrival/animation-aware choreography and attach approved CG to completed matching events. Preserve the existing animation library.

## CG delivery

A local Wan2.2 I2V A14B FP8 trial produced 832×480, 81 frames at 16fps (5.0625s), in 927.66 seconds. Observed total VRAM usage peaked near 17.66GiB at three-second sampling intervals, including desktop use. Faces/designs remain coherent in sampled frames, with visible blink/tilt/hair-hand response; slight camera pullback and modest motion remain. Accepted for manual trial, not automated production playback or an embrace-animation claim.

The built-in imagegen starting illustration uses existing portrait references; this image stage is not local inference. Runtime WebM/poster/provenance are under `public/cg`; raw media and weights remain ignored. The existing room and desktop renderers support a silent, bounded manual preview without a new native window. CG tests cover one host, collapse/continue, close, expiry, DND, stale callbacks and no restore replay. Physical Windows click-through still needs native acceptance.

The local ComfyUI process was stopped after generation to release GPU memory. The design preview remains at `http://127.0.0.1:4320/`. Preserve all CG changes in the next Cursor iteration. Return a factual handoff for Codex review before publishing further implementation or a Release.
