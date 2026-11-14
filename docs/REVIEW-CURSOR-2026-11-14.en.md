# Cursor review and experience fixes — 2026-11-14

[中文](REVIEW-CURSOR-2026-11-14.zh-CN.md)

The relationship-CG prototype is now demonstrable: approach/dialogue before playback, overhead positioning, cast-aware solo eligibility and real ended receipts work. Cursor added some event-to-CG bindings, so the older “manual only” launch snapshot is no longer current. This is not arbitrary chat sentiment recognition or a complete romance game.

Reviewed HEAD 35b3760 plus the dirty working tree. No push or release. Existing portable packages remain unchanged; restart source-based apps to load the new build.

Fixes made after the user's follow-up:

- Restore GPT's historically accepted Oct29 idle with a verified SHA256 and a new `idle-reviewed-oct29-v2.webm` URL. Archive alternative runtime idles outside public. This changes the actual active mapping, not just lab rejection labels. The exact previously observed wrong frame was not independently reproduced.
- Remove a GPT-specific freeze branch that suppressed feeding/walking actions. Keep the idle readiness latch while restoring action fallback.
- Correct the Claude reach clip's runtime/manifest participant from xia to rin, retaining its legacy asset filename.
- Add spoken invitations for solo previews, and make DeepSeek the initiator of her shoulder-lean scene.
- Persist independent girl–girl affection and event-CG settings. User-facing romantic event clips require Lover mode; manual previews remain available. Cancel pending/active automatic scenes when preferences disallow them.
- Replace technical staging captions and some debug labels with character-facing copy; English core captions updated too. This is not full UI localization.

Trigger rules: praising Claude/GPT in Lover mode plays the existing response, then a delayed personal invitation and the appropriate solo CG. Settled seat-sharing, pair intimacy, visits and food-sharing map to their respective clips. A completed welcome showcase can lead to the shared-user invitation in Lover mode. Pair intimacy is independent of the user's role. Automatic clips have a two-minute global interval; manual previews do not. Petting does not summon a CG on every click. Automatic events currently use the room host, while manual previews may use desktop.

Evidence: initial 107/107 tests and build passed; final **112/112 and build pass**. Four source-build renderer CG cases played and produced genuine ended receipts, including solo playback without unrelated characters. A 23-second/115-sample GPT idle observation crossed two loops with no fallback-state seam flash; it verifies source/state, not every pixel's identity. Full P1 playback, queued pats, feeding fallback, Dock and DND checks pass. Media provenance checks pass. The legacy CG smoke script was updated to wait for the new prelude; an async IPC issue in the new review harness was also corrected rather than blamed on playback.

See `test-results/review-2026-11-14/` and the dated unit/build logs. This does not certify real API dialogue, all nine CGs frame by frame, native mouse hit testing, mixed-DPI displays or the portable package. Finish one bounded release-package pass and first-use observation before promotion; do not expand the cast/media again.

The final legacy CG runtime script also passes room playback, collapse/reopen, reward-free ended receipts, single desktop host/close and DND cancellation. It now waits for the prelude and captures an atomic IPC state snapshot. Each session mounts a keyed video element rather than reusing a previous media instance. See `test-results/cg-lab/runtime/verification.json`.

Follow-up: one card per session/host, centered over the full participating cast (solo, pair or group), with renderer-level ownership to prevent duplicate mounts. Four runtime cases pass one-card/zero-mirror assertions. Group geometry includes all participants; existing media remains solo/pair. Room-standing GPT sampling now checks pixels as well as time: 115 distinct rendered frames across two loops. Unexpected idle pause recovery and Stop-to-new-action recovery pass. No media was replaced in this follow-up. Final unit count: 113/113; build passes.
