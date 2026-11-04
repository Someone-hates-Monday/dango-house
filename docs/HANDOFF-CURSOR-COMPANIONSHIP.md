# Handoff: Cursor companionship NEXT (A/B/C)

Date: 2026-11-04  
Spec: [CURSOR-COMPANIONSHIP-NEXT.zh-CN.md](CURSOR-COMPANIONSHIP-NEXT.zh-CN.md)  
Strategy notes (marketing/CG, not this code): [HANDOFF-STRATEGY-CG-AND-MARKETING.zh-CN.md](HANDOFF-STRATEGY-CG-AND-MARKETING.zh-CN.md)  
Repo commits (local, not pushed as Release):

1. `2e06188` — **A** presentIds ≠ mute  
2. `a3a16da` — **B** director / events / three offline loops  
3. `4dc5428` — **C** reply origins, optional story LLM hook, try-play + docs  

## Done

### A — Present cast
- `presentIds` is the living cast (room / Dock / free pets / stage).  
- `muted` only quiets **present** speakers.  
- Settings: seven checkboxes + all/core/custom presets writing **present**, not mute-as-absence.  
- Migration: old `core`+muted-as-cast → three present; old all/custom → everyone present, keep quiet flags.  
- Absent private-open → notice + invite-back; no ghost scenes.

### B — Stories & memory
- `SceneDirector` + `companionEvents` (≤200, persisted, no keys).  
- Offline loops: **chose-her** (private Claude + rivals + return wrap), **seat-share**, **star-fox**; variants from prior events.  
- Bond bumps only from shared beats / yuri completion; pats use `applyFavor(..., 0)`.  
- Try-play strip on room SocialBar.

### C — Origins & optional LLM
- Each character reply stamps `origin: { backend: local|model, provider?, model? }` (actual backend after fallback).  
- Optional one-shot story aside when API mode + model (`story-llm.ts`); failure keeps local plan.  
- Chat UI shows origin label.

## Key files
`src/shared/cast.ts`, `events.ts`, `scene-director.ts`, `companion-stories.ts`, `story-llm.ts`, `director.ts`, `types.ts`, `electron/engine.ts`, `electron/provider.ts`, `electron/main.ts`, `Connections.tsx`, `Room.tsx`, `DockCast.tsx`, `DesktopPet.tsx`, `SocialBar.tsx`, `main.tsx`, i18n zh/en/ja, `tests/cast.test.ts`, `tests/companion-stories.test.ts`, `tests/reply-origin.test.ts`, `scripts/verify-companion-experience.mjs`

## Commands run
```
npm test          # 79 pass
npm run build     # tsc + vite + electron bundle OK
node scripts/verify-companion-experience.mjs   # success:true; isolation via GARDEN_TEST_DATA
```
Electron checks included: core→3 Dock/room pets, rivalry bubbles, try-play seat-share event, soft≠vivid pair lines, mute cancels queue, DND clears reactions.  
Screenshots (gitignored): `test-results/companion-experience/` — `cast-settings.png`, `rivalry-room.png`, `rivalry-dock.png`, `seat-share.png`, `pair-scene.png`, `verification.json`.

## Not done / known gaps
- Full structured LLM rewriting of story **beats** (only optional short system aside).  
- Cursor/Claude/Codex MCP install not re-verified this round.  
- No new video generation; DeepSeek 109 pack unchanged.  
- Double `private-return` if both UI and window `closed` race — closed handler is the source of truth.  
- Do not treat unit tests alone as full human playtest of rivalry feel.

## For Codex review
1. P0 migration + Dock/room counts for all/core/two/zero.  
2. Three stories + cancel/DND/present filters.  
3. Origin honesty + no personal key use in tests.
