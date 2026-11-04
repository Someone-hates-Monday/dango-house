# Handoff: Cursor companionship lifecycle repair

Date: 2026-11-04  
Trigger: Codex review — `scripts/review-companion-contract.mjs` 7/7 red despite prior A/B/C claims ([REVIEW-CURSOR-COMPANIONSHIP.zh-CN.md](REVIEW-CURSOR-COMPANIONSHIP.zh-CN.md)).  
Base note: prior handoff [HANDOFF-CURSOR-COMPANIONSHIP.md](HANDOFF-CURSOR-COMPANIONSHIP.md) overstated completion; this round fixes the contract failures.

## Local commits (not pushed)

1. **Director & events** — sole `SceneDirector` queue, settle-before-commit rewards, absent entry gates, removed approach bond farm.  
2. **Model & private** — `generateStoryAside` / story prompt path without tools; visit-scoped idempotent `private-return`; revisit copy keys off prior `private-return`.  
3. **Verification** — this handoff + contract evidence paths.

## What actually changed

### 1. Sole scene queue
- Removed parallel `this.scene[]`. All social / yuri / showcase / feed-share / visit / rivalry / companion-story / model-reply steps go through `director.schedule` → `tick` → `director.due`.
- Priorities: `user` > `reaction` > `idle`. Rivalry cannot overwrite an in-flight user story.
- `stop` / `freezeRoom` / cast leave call `cancelScenes()` (abort story aside + `director.clear()`).

### 2. Completion ≠ enqueue
- Rewards (`companionEvents` + bidirectional `bondBump`) live on `SceneJob.reward`.
- After the last step fires, director waits `DEFAULT_SETTLE_MS` (4500), then `tick` calls `commitJobReward` once via `tryCommit` (job-id idempotent).
- Cancel / Stop / replace / missing cast → no commit.
- `perform` approach no longer unconditional `bonds += 2`.

### 3. Absent vs mute
- Unified gate on `perform` (actor + character target). Also feed / praise / visit / clip / private-send / private-open.
- Mute still keeps resident visible; absence needs invite-back.
- Agent/MCP `perform` callback hits the same gate.

### 4. Story LLM
- `generateStoryAside` — prompt is the HTTP user content, **no** avatar tools, one shot.
- `generateReply` routes inputs containing `极短的旁白` to that path (contract injects `generateReply` as engine `generate`).
- Aside bound to `storyAbort` + `storyJobId`; Stop/clear discards late text.
- Offline beats always schedule first; aside failure is silent.

### 5. Private visit instances
- `privateVisits: Map<id, { visitId, settled, openedAt }>`.
- Return commits **once** per open visit; stray/double return is a no-op.
- `privateReturnLine` “又回来了” only after a prior **`private-return`** event (not `chose-companion`).

### 6. CG preserved
- Codex CGMoment / `cg-moment.css` / `public/cg` / docs / verify scripts kept.
- Manual try-film only; no auto-unlock from premature companion events.
- No independent CG window.

## Commands & results

| Command | Result |
|---------|--------|
| `node --import tsx scripts/review-companion-contract.mjs` | **7/7 pass** → `test-results/cursor-review/contracts.json` |
| `npm test` | **85 pass** / 0 fail |
| `npm run build` | tsc + vite + electron bundle OK |
| `node --import tsx scripts/verify-cast-matrix.mjs` | success — 7→3→2→0 room/Dock; quiet visible; zero cast restart |
| `node --import tsx scripts/verify-companion-experience.mjs` | success — rivalry, seat-share after settle, soft≠vivid, mute cancel, DND |
| `node --import tsx scripts/verify-deepseek-library.mjs` | success — 109 assets decode + queues |
| `node --import tsx scripts/verify-cg-moment.mjs` | success — in-renderer silent clip; DND dismiss; no new window |

Tests used isolated profiles / HTTP fixtures only — **no personal API keys or paid models**.

## Screenshots (gitignored)

- Contract JSON: `test-results/cursor-review/contracts.json`
- Experience: `test-results/companion-experience/` — `cast-settings.png`, `rivalry-room.png`, `rivalry-dock.png`, `seat-share.png`, `pair-scene.png`, `verification.json`
- CG: `test-results/cg-lab/` (design-room / design-desktop etc.)

## Key files

`src/shared/scene-director.ts`, `src/shared/companion-stories.ts`, `electron/engine.ts`, `electron/provider.ts`, `tests/scene-director.test.ts`, `tests/companion-stories.test.ts`, `tests/world.test.ts`, `scripts/review-companion-contract.mjs` (**not weakened**).

## Boundaries / residual

- Settle window is fixed 4500ms — long walks that finish after settle could theoretically commit slightly early relative to body pose; still better than queue-as-done. Optional: settle on max(`until`, travel).
- `generateReply` still ignores ordinary `_input` for chat (messages come from state); only story marker routes aside. Dedicated `generateStoryAside` is the real path.
- Chose-her reward also waits settle after private-open rivals — UI may show beats before the event row appears.
- No browse / voice / Live2D / seven-Agent framework this round.
- No new story batch; no auto CG unlock; no push; no Release.
- Prior HANDOFF-CURSOR-COMPANIONSHIP claims of “B complete” should be read as **superseded** by this repair for lifecycle contracts.

## For Codex re-review

1. Re-run `node --import tsx scripts/review-companion-contract.mjs` — must stay 7/7.  
2. Confirm no parallel scene array; rewards only after settle + `tryCommit`.  
3. Confirm story HTTP body contains prompt, `tools` absent; Stop suppresses late aside.  
4. Confirm private-return idempotent per visit; first wrap ≠ revisit copy.  
5. CG still manual-only; 109 pack + cast matrix green.
