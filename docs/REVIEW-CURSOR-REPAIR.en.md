# Cursor lifecycle repair re-review

Follow-up: `a28dc00` fixes all three P2 findings; independent acceptance passes. See [current acceptance](ACCEPTANCE-CURSOR-REPAIR-2026-11-04.en.md). The following is the historical pre-fix review.

[中文](REVIEW-CURSOR-REPAIR.zh-CN.md)

Date: 2026-11-04. Reviewed HEAD: `447795a982a925fdc26a0859e6b3003e723352bb`; range `e63c9a9..447795a`. Runtime code was not changed. No media generation, push or release.

The previous seven contracts now pass. Three additional reproducible lifecycle defects remain, so full acceptance is pending.

## Findings

1. **[P2] Rewards precede actual action completion** (`src/shared/scene-director.ts:126–129`). The fixed 4500ms settlement starts when the last beat is dispatched. In the default full-cast seat-share scene, the last action starts at 9s and lasts 7s, but the shared event and bond reward commit at 13.5s with 2500ms still remaining. Stop cannot undo that success. Track job-owned execution/arrival/end boundaries and failed required steps, rather than simply increasing a constant.
2. **[P2] Companion visits execute before queue admission** (`electron/engine.ts:390–395`). Start seat-share, then visit `rin → kimi`: the immediate perform overwrites Claude's bubble/body/movement before the director rejects its reaction-priority job. The old user scene continues. Include the initial action and speech in the admitted job, or explicitly cancel/replace the previous user job.
3. **[P2] An absent private visitor still records a successful return** (`electron/engine.ts:319–333`). Open a private visit with rin, remove rin from the cast, then dispatch private-return: a return event is still committed. Presence guards only the animation and speech, not the event. Invalidate visits on departure and reject stale return notifications while preserving duplicate-return idempotency.

## Verification

- Unit tests: 85/85 pass; previous behavioral contracts: 7/7 pass; build passes.
- Actual isolated Electron runs pass cast counts/restart, companionship experience, all 109 DeepSeek clips and manual CG playback checks.
- Native Windows physical click-through remains a separate acceptance limit. The current CG remains the V1 card; a head-anchored bubble was not implemented in this round.
- New `node --import tsx scripts/review-companion-repair.mjs`: **0/3 pass**, intentionally red. Evidence: `test-results/cursor-re-review/contracts.json`, with actual HEAD. The old contract report still has a hardcoded `bc486ab` label.
- Tests used isolated profiles and controlled fixtures, without personal keys or paid models. Source builds were tested, not a newly packaged release.

Fix these three cases before adding features. Preserve both contract suites; include successful completion versus cancellation during the final action, conflicting visits, and stale private returns after departure. Media generation remains paused pending the user's instruction to resume.
