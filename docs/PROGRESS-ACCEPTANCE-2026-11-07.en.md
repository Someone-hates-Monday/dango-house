# Working-tree acceptance and next production pass — 2026-11-07

[中文](PROGRESS-ACCEPTANCE-2026-11-07.zh-CN.md)

## Decision

Proceed with **small GPT animation trials and CG storyboards**, while repairing runtime regressions before automatic relationship scenes or a promotional build. This review covers `8ef2fd0` **plus the dirty working tree**, not the published portable package. No generation, credits, publishing, or release was performed during this review.

## Verification

- Unit tests: **91/95 pass**, four companion-story failures involving private selection, seat-sharing, star-fox and completion/event clearing.
- Build: pass. Companion contract script: **7/7 pass**. Repair script: **1/3 pass**; rejected visits still perform actions, and absent private visitors still produce return events.
- Floating UI: Dock/free menu bounds, menu/bubble/CG avoidance and single-open-menu checks pass. Some menu opening is programmatic; this does not prove native mouse click-through.
- Existing CG V1: room playback, collapse, desktop single host, close and DND checks pass. This is not acceptance of a new overhead bubble or automatic CG.
- Original Claude interaction verification passes: pat, rice, affection, bookmark, private chat/Dock, complete reaction queue and DND.
- Added `scripts/verify-claude-library.mjs` checks actual engine selection, decoding, playback and sampled transparent corners for the manual library. Fourteen entries passed before manual `walk` timed out. Separate recover/turn checks are recorded in `selected-verification.json`; the initial run is in `test-results/claude-library/verification.json`. It does not certify anatomy or acting.

Evidence is under `test-results/progress-review-2026-11-07/` and the original verification directories. Historical scripts report HEAD without describing dirty changes; do not attribute working-tree regressions to the unchanged commit.

## Runtime blockers

1. `engine.tick()` no longer reports `noteOwnedEnd` or calls `sealSettle`, while SceneDirector still requires settlement reports. Essential failures are skipped/swallowed. Restore completion and cancellation without losing the new arrival-delayed reactions.
2. `companion-visit` performs approach/speech before queue arbitration. Queue the whole visit; rejection must have no body, speech or reward side effects.
3. Cast removal no longer cancels private visits, and `private-return` records an event even when the visitor is absent. Restore cancellation and validity checks, including late/duplicate returns and reinvitation.

These protections existed in `a28dc00` and are removed by the current engine diff. Merge the fixes selectively; do not revert the whole engine and lose the new Claude work. Require 95/95 unit tests, repair 3/3, contract 7/7 and build before accepting the runtime baseline. Test cancellation of pending arrival reactions as well.

**Additional P2:** manually selecting Claude walk does not play. `play-clip` sets a think pose, while the video player's gesture branch filters out walk clips and enters walking only from walk poses. The manual `walk` trial timed out; the opposite clip uses the same filter but was not independently reached in that run. Separate one-shot library preview from engine-driven walking loops; require both clips, Stop/DND and the full 19-entry library to pass after repair. Added tests may increase the total beyond 95.

## What is actually integrated

**Claude:** 19 library/pack entries: six originals and 13 additions. Cropped `listen`/`chosenAgain` A3 candidates are excluded; chat, praise and wave use the original chat/affection clips. New clips still need full-frame art review. Turn/recover clips exist for manual selection; the full turn→walk→recover chain is unfinished. Fish feeding currently maps to book-covering `fishShy`, and trip maps to rivalry; neither should be presented as eating or falling. Use explicit situational routing and honest fallbacks.

**GPT:** idle now routes to `idle-subject-s1.webm`; its manifest names subject `GPT白龙Q版v1`, Seedance 2.0 mini, 225 frames/9.375 seconds and ping-pong processing. The old P1 pat remains. Sampled frames show one naturally tapering tail, but do not prove new movements/occlusions will work. Existing approval metadata is not independent frame-by-frame acceptance. Do not reuse the unapproved tied-hair rear reference as a new identity anchor.

**CG:** the usable implementation is V1 manual Claude/DeepSeek playback. Overhead anchoring, branching interaction, director playback-success receipts and trio CG are unfinished. CP-001 remains a historical draft without accepted segments. Update authorization for a concrete new batch when execution begins; do not blanket-approve historical drafts.

## Production order

1. **Repair the baseline and review Claude.** Keep code fixes separate from media. Review all 13 new clips at speed and frame by frame: identity, book/arms, turn transitions, feet, alpha and horizontal artifacts. Remake full-body listen/reselection before duplicating good originals.
2. **GPT trial pair: affection and private selection.** Use the current subject and verified references; save reference hashes/roles, original video hash, actual model/settings/cost and subject-slot evidence. Five seconds each, normal queue, **no membership acceleration or purchases**. Affection: softened eyes, tiny smile, look away/back, one low tail sway. Private selection: attentive eye lift, small nod/lean and listening hold, tail gently gathering beside the feet without crossing legs. Keep her cooler and more restrained than Claude, but warm toward a familiar user. Begin/end stably, play reactions forward once; preserve source clips. Two repeated structural failures stop the route for reference repair.
3. **Then four distinct GPT reactions:** mild jealousy, being selected again, looking toward DeepSeek and looking toward Claude. Give each a distinct emotional intention, visible gesture and fallback. Test in room and pet menus before natural triggers. Prop feeding, sleep chains, Dock transitions and tail wrapping wait for approved pose/prop references. The existing 32 prompts are a creative library, not a requirement to copy DeepSeek-specific actions.
4. **Finish one CG before expanding.** CP-001: Claude tidies DeepSeek's accessory; first approve approach, single-contact and reaction stills. Keep Claude composed and DeepSeek bashful/stealing a glance, with a small whale-tail reaction. On repeated arm failures, simplify to proximity and gaze.
5. **Overhead presentation with existing V1 first.** Anchor to the pair midpoint, contain the full image, avoid faces/menus/chat and scale to available space. Collapse when space is inadequate. Native hit testing, scaling and secondary displays require separate desktop acceptance. Start as manual WATCH with no reward; implement session/job/segment/host-bound ended/cancel receipts before automatic relationship rewards.
6. **Next CGs:** single-person GPT reserving a seat/welcoming the user back; then her restrained jealousy while observing Claude and DeepSeek. Start with separate reaction shots, not complex three-person contact. These cover pair romance, user companionship and rivalry without repeating one generic shy routine.

## Cursor handoff

Read this review, the CG production contract, Claude review brief and GPT action handoff. Repair the three engine regressions while preserving the new library and pending-arrival work; do not weaken tests. Submit a separate logic fix with unit/repair/contract/build and existing UI evidence. Review Claude before replacing any original clips. Trial only GPT affection/private selection first with the current subject, verified references, normal queue and a two-failure stop rule. New videos remain candidates until art and runtime acceptance. For CG, first deliver CP-001 stills and overhead layout using V1; no automatic reward until genuine playback/cancel receipts are verified. Do not independently push, release or regenerate the entire cast. Report implemented, candidate, unverified and failed work separately.
