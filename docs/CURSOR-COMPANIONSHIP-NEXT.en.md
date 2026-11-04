# Next stage: a shared life for the companions

[简体中文 — detailed implementation contract](CURSOR-COMPANIONSHIP-NEXT.zh-CN.md) · [Cursor prompt](CURSOR-NEXT-PROMPT.md)

2026-11-04. This is a future implementation specification, not a list of completed features. Baseline: local 0.3.9 source plus pre-publication fixes.

## Review

The current app is suitable for a feature Alpha. It has directional bonds, favor streaks, rivalry reactions, five pair scenes, private chat, animation playback and an external-agent stage. One backend can perform several distinct personas. Controlled SSE tests cover shared-backend prompts and missing-key fallback without personal credentials or paid requests.

Cast editing is incomplete: core-three limits speakers but all seven avatars still render in the room and Dock. Social scenes work, including distinct soft/vivid dialogue, but are scripted and lack durable consequences, variation and convincing reciprocal choreography. The main value is playful relationships between residents and the user's attention, rather than a generic agent dashboard.

63 unit tests, build and real Electron UI checks passed during review. Evidence is in ignored `test-results/companion-experience`; rerun `scripts/verify-companion-experience.mjs`. This is not a long-duration human playtest.

## P0: presence and quiet are different

This deliberately revises the previous handoff's reuse of `muted` for cast reduction. Add one canonical presence set with shared selectors. Render present residents; choose speakers from present, unmuted residents. Keep quiet residents visible. Add direct seven-card selection, correct counts, all/core presets and a safe empty cast.

Apply presence across room, desktop, Dock, chat, private entry, scenes, invitations, relationship summaries, reminders and bridge/runtime tools. Removing a participant cancels her movement, delayed reactions and scene participation; no orphan pair scenes or hidden API requests. Explicitly invite an absent resident back before private interaction.

Preserve saved chats, bonds, skins, connections and overrides. Migrate old core presets to the core presence set and retain quiet flags only among present residents. Legacy all/custom states default to all present and preserve mute flags, avoiding unintended disappearance. Test migration and restart.

## P1: three complete social loops

Use one cancellable scene director: explicit user interaction takes priority over reactions and ambient scenes. Each scene has participants, source, priority, steps, outcome and cancellation identity. Prefer 2–4 short turns over six simultaneous jealous reactions. Pair dialogue and visible responses must share timing with supported actions. Approach first, then act; no standing slides.

Keep Dock resting behavior and avoid pointless horizontal wandering. Use existing poses, direction and bubbles. Preserve complete video frames, ground anchors, playback transitions and overlap limits. Track recent scenes with at least a five-minute identical-scene cooldown. DND, focus and disabled autonomy suppress automatic scenes without catch-up bursts.

Add a bounded local interaction-event memory (about 200 events, clearable). User petting changes user affection/favor; only actual shared events increase resident-to-resident bonds. Absent residents do not gain relationship points magically. Start with existing affection/favor/bonds, not a new complex emotion simulator.

Keep private-chat contexts isolated. Shared events can describe public actions such as being selected for company, but must not copy private transcripts to group chat, other residents or bridge snapshots.

Required offline stories, each with two meaningful outcomes or callbacks:

1. Select Claude for private chat: her happy greeting, one or two personality-specific rival reactions, then a natural return-to-room closing.
2. Claude saves DeepSeek a seat/meal: reciprocal response, optional GPT observer, actual outcome updates bonds and is remembered later.
3. Gemini shares or asks for affection; GLM disguises care as a friendship discount, with one suitable observer. Missing participants cause a different complete scene or a quiet skip.

Keep personality differences and non-adult, gentle romance. Do not guilt users. Preserve friend/pet/romance preferences and pair intensity.

Complete the offline loops first. Optionally generate a short structured scene with one budgeted house-backend request, validated participants and allowed action intents. Missing keys, invalid output, timeout or cancellation use an accepted local fallback or stop quietly. Do not call seven separate models. Store/display actual provider/model and local/model provenance per reply, including fallback.

## Discoverability and acceptance

Within two minutes, a new user without keys can try a full attention–reaction–closing loop. Use clear entry buttons in the existing UI; avoid another settings dashboard. Show a recent shared memory behind relationship feedback. Update Chinese/English copy and keep Japanese keys complete.

Required evidence: accurate all/three/two/zero rendering and restart; separate quiet/presence; three reciprocal stories with variation; event-driven bond changes and memory clearing; cooldowns and interruption/cancellation; controlled backend tests; real Electron screenshots of room, three-resident Dock, rivalry and pair scenes. Keep DeepSeek's 109 clips, full playback/sleep transitions and unclipped animation bounds intact.

Run `npm test`, `npm run build` and updated real Electron smoke checks using isolated profiles without personal keys.

## Delivery and review

Create three local commits: A presence/migration, B director/events/offline loops, C optional generation/provenance/discoverability/docs. Clearly mark C as deferred if incomplete. Do not expand browsing, voice, Live2D, frameworks or general multi-agent orchestration.

Write `docs/HANDOFF-CURSOR-COMPANIONSHIP.md` with actual behavior, files, migration, executed checks, screenshots, limitations and reproduction steps. Return the result to this conversation for Codex review before the next implementation push or formal release, unless the user explicitly directs otherwise.
