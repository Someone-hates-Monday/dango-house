# GPT review brief: Claude animation pack in production

**Audience:** GPT (code/design review). **Date:** 2026-11-06.  
**Status:** Candidates installed in `public/video/claude/` and wired into the app. **Not** human-stamped frame-by-frame. Sit / sleep / Dock **deferred** (DeepSeek also has no dedicated sit-down clip).

Chinese index: [claude-action-pack-v1/INDEX.md](claude-action-pack-v1/INDEX.md) · Handoff history: [CLAUDE-ACTION-HANDOFF.en.md](CLAUDE-ACTION-HANDOFF.en.md)

---

## What to review

1. **Visual QA** of each new WebM (identity, book/arms, green fringe, feet, flower/ribbon asymmetry).
2. **Runtime mapping** correctness (tables below) — wrong clip on a user action is a ship blocker.
3. **Walk L/R** behaviour: `walk.webm` faces left, `walk-opposite` faces right — map pose→matching clip; mirror only as fallback.
4. **Gaps called out as intentional** vs accidental omissions.

Do **not** treat “file exists in public” as approval. Do **not** overwrite the original six (`idle` `pat` `affection` `chat` `rice` `bookmark`) unless the user explicitly asks.

---

## How to play clips in the app

1. Invite **Claude** (`rin`) into the room / desktop.
2. Open **更多互动 / More interactions** on Claude.
3. Use the **clip library** (groups: Core / Emotion / Social / Food / Move) or **随机表演 / Random**.
4. Current natural paths: private chat → chat; praise → affection; walk left/right; goodnight via social routing. Cropped listen/chosenAgain A3 clips are retired. Feed fish → fishShy is an existing semantic mismatch (book-covering, not eating); see the [November 7 review](../PROGRESS-ACCEPTANCE-2026-11-07.en.md).

---

## Production files

All under `public/video/claude/`. Lab drafts: `test-results/animation-lab/claude/jimeng-claude-*-a{3,4}/draft.webm` (sha256 matched to public at install).

| File | Clip id | Batch | Notes |
|---|---|---|---|
| idle.webm | idle | prior | Keep |
| pat.webm | pat | prior | Keep |
| affection.webm | affection | prior | Active praise fallback; cropped chosenAgain retired |
| chat.webm | chat | prior | Active private/chat fallback; cropped listen retired |
| rice.webm | rice | prior | Keep |
| bookmark.webm | bookmark | prior | Keep |
| listen.webm | — | A3 | **Waist-cropped; retired from runtime** |
| rivalry-soft.webm | rivalrySoft | A3 | |
| chosen-again.webm | — | A3 | **Waist-cropped; retired from runtime** |
| gpt-joke.webm | gptJoke | A3 | |
| success.webm | success | A3 | |
| thinking.webm | thinking | A4 | |
| goodnight.webm | goodnight | A4 | Curtsey / goodnight — **not** sleep loop |
| fish-shy.webm | fishShy | A4 | |
| reassure.webm | reassure | A4 | |
| hesitate.webm | hesitate | A4 | |
| walk.webm | walk | A4 | Loop window `claudeWalkClip` |
| walk-opposite.webm | walkOpposite | A4 | Loop window `claudeWalkOppositeClip` |
| recover-step.webm | recoverStep | A4 | In pack + library; **state machine not wired** |
| turn-to-left.webm | turnToLeft | A4 | Same |
| turn-to-right.webm | turnToRight | A4 | Same |

NOTICE: `public/video/claude/NOTICE.md`.

---

## Runtime map (shipped)

### Interaction → clip (`claudeInteractionClip`)

| Interaction | Clip |
|---|---|
| pat | pat |
| affection (praise) | affection (full-body production; chosen-again A3 retired) |
| chat (private-open etc.) | chat (full-body production; listen A3 retired) |
| bookmark | bookmark |
| feed rice | rice |
| feed fish | fishShy |
| feed cake | affection |
| feed tea | chat |
| trip | rivalrySoft |
| kind `clip` + clipId | that id if valid |

### Pose → clip (`claudePoseClip`) — when no / idle interaction path uses pose

| Pose | Clip |
|---|---|
| walk-left | walk (asset faces left) |
| walk-right | walkOpposite (asset faces right) |
| think | thinking |
| read | bookmark |
| wave | chat |
| jump | success |
| sad | rivalrySoft |
| wait | hesitate |
| else | idle |

Display fit: the current `claude-display.ts` fit map has no per-clip zoom/lift overrides. Claude walk no longer uses DeepSeek’s 83% shrink. Verify contact lines visually; do not assume the historical rice/listen adjustments are active.

### Social attach on `perform` without interaction (`socialClaudeClip`, engine `rin`)

| Signal | Clip |
|---|---|
| action sleep / goodnight bubble | goodnight |
| comfort bubble | reassure |
| joke / GPT bubble | gptJoke |
| fish + shy bubble | fishShy |
| action think | thinking |
| celebrate / jump | success |
| shy | hesitate |
| sad | rivalrySoft |
| wave (no special bubble) | — (pose → chat) |

Code: `src/shared/claude-animation.ts`, `src/claude-pack.ts`, `src/ClaudeVideoSprite.tsx`, `src/shared/claude-clips.ts`, `src/CompanionInteractions.tsx`, `electron/engine.ts` (`play-clip` for `rin`).

---

## Walk timings (provisional)

```
claudeWalkClip:         enter/loop 0.58 → 4.42, exit → 5.04
claudeWalkOppositeClip: enter/loop 2.21 → 4.21, exit → 5.04
```

From mid-window seam search on `normalized-rgba`. Human must verify foot cycle and flower side. Opposite clip seam score on full file is high; loop window is tighter.

---

## Intentionally not shipped

| Item | Reason |
|---|---|
| Sit-down / sleep enter-loop-wake / Dock up-down | No sit still; DeepSeek also lacks a true sit-down clip; user deferred |
| Route B turn→walk→recover state machine | Media in pack; engine still hard-cuts L/R walk |
| welcome-back / offer-seat / fish-invite / pov-read / hair-tidy | Need open-book or one-arm stills first |
| Auto-replace of original six | Protected until explicit approval |

---

## Review checklist (copy for reply)

For each new clip (A3/A4), mark **pass / fail / defer** with one line reason:

- [ ] Identity matches Q anchor (hair, flower, dress, book)
- [ ] Two arms + book continuity (no teleport book, no third arm)
- [ ] Full body / feet in frame where required
- [ ] Matt clean (no green fringe / bars on dark & light bg)
- [ ] Action readable and distinct from siblings (esp. A3 differentiation)
- [ ] Mapping: correct trigger in app (use clip library + natural actions)
- [ ] Walk L/R: facing + flower side acceptable under scaleX / opposite asset
- [ ] goodnight ≠ sleep; no false “she sat down” claim

**Ship recommendation:** approve subset / hold all / list remakes.

---

## Tests

```text
npm test -- tests/claude-animation.test.ts
```

Expect Claude-named tests green. Unrelated suite failures elsewhere are out of scope for this pack.
