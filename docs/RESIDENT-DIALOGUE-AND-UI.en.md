# Individual speech, clear recipients and playful attention

Version: 0.5.0-alpha.11, 2026-11-16.

## Visible changes

- Each resident owns a recent speech bubble, labeled “speaker → recipient.” Speaking and listening have distinct indicators. User, peer and group addresses stay separate.
- Clicking a bubble opens the appropriate public/private transcript at that message, without starting a scene. Private speech stays out of public history.
- Bubbles use the existing fixed headroom with collision avoidance; older lines fade and expire. CG hides speech and prevents earlier lines from reappearing afterward. Multi-character CG still uses one shared player.
- Icon-only roof controls hang below the eaves, retaining tooltips, accessible names and pin state. Settings navigation covers the full top of its scrollport; resident selection uses actual portraits.

## Model and scheduling contract

Speech carries `audience` (`user`, `companions`, `group`), an exact `replyTo` for a specific peer, and a shared `sceneId`. Parsing, queued steps, arrival delivery and stored messages preserve these fields. One beat addresses one recipient; switching to the user requires a separate beat. Context includes earlier recipients, and the model is instructed to answer questions and continue the immediate topic.

Playful attention-seeking has its own toggle, separate from girl–girl affection and CG. Praise, private selection or repeated affectionate input may invite another resident to seek the user's attention, without forcing pair romance, CG or guilt. A rival must actually speak to the user; teasing the favored resident alone does not satisfy this requirement. Cooldown starts only when rival speech is delivered, so cancelled work does not consume it.

A live API failure was traced to redundant nonstandard `focus` values on non-chat events, which previously rejected the entire plan. Such events now keep their event-defined focus and ignore irrelevant labels; public chat still validates enums. Missing required responses get at most one bounded model repair, with no canned replacement dialogue.

## Verification and handoff

- 163 unit tests cover public/private isolation, placement, arrival metadata, rivalry settings, delivery-based cooldown and parsing repairs.
- `scripts/verify-resident-dialogue.mjs` uses an isolated profile and local fixture API to verify renderer/IPC behavior, recipients, listeners, collision avoidance, passive transcript reading, rivalry settings and zero native window resizes. It supports `--packaged`.
- Live DeepSeek checks passed for coherent Claude/DeepSeek question-and-answer turns, another resident inviting the user, and GPT private audience isolation. Generated dialogue can still occasionally sound awkward.
- Screenshots and reports live in ignored `test-results`. Approved GPT video assets remain unchanged.
- The real user profile was restored to the core three residents and a 360×300 house. Use isolated profiles for all-cast tests. Never reapply an incompatible `all` preset after restoring individual presence; it would expand the roster and window again. Preserve credentials and visible history.

Source/local packaging and public GitHub Releases are separate delivery steps.
