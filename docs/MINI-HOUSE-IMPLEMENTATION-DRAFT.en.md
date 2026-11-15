# Mini-house implementation and acceptance · 2026-11-15

Implemented in source `0.5.0-alpha.1`. The original design rationale remains below; the following describes delivered behavior and remaining validation.

## Delivered behavior

- Transparent heart-roof house in the existing brand colors. Roof charms hold pin, settings and hide controls clear of resident art; drag the roof and resize from the lower corner. Bounds persist separately from world state.
- A compact default trio; additional residents remain configurable. Minimum 320×280 for up to four and 420×370 for more, bounded by the display work area. Resizing does not request AI or replay locomotion. Wandering is disabled; approaches are small positional gestures.
- A shared subtitle and chat/pet/affection/feed controls occupy the base. Chat unfolds below; selecting a resident opens private chat there. Long speech bubbles no longer cover roof controls.
- Provider/model/key setup unfolds from the same object. Only a successful connection test enables API mode; an empty key input retains a securely saved key. Errors are visible with no disguised scripted fallback. Advanced cast/relationship/agent configuration remains a secondary workbench.
- `HouseEvent → generateHousePlan → parseHousePlan → SceneDirector` handles public chat, touch, feed, praise, private entry/return, visits and autonomous life. Private conversation still uses its isolated character context. The house planner sees public speech and completed events, never private transcripts. Turning action tools off forces idle intentions.
- Autonomous generation allows silence, is capped at six requests/hour and stops when hidden or in DND. Stop, cast changes and configuration changes invalidate stale responses. Hover waits 800ms before dispatch.
- One shared CG session expands the transparent host above the house, preserving house position; chat expands below. Insufficient headroom folds the CG into an affordance. Near the bottom edge, expanding chat may move the house upward to stay on-screen.
- GPT retains the approved 225-frame `idle-subject-s1-clean-v3.webm` and P1 pat animation. No new art or video was generated.

## Repeatable checks

```powershell
npm test
npm run build
node scripts/verify-mini-house.mjs --packaged
node scripts/verify-house-ai.mjs --packaged
node scripts/verify-gpt-idle-loop.mjs --packaged --house
```

Mini/AI checks use isolated profiles; the AI test uses a local SSE fixture without real credentials or API billing. Coverage includes accessible roof buttons, three/seven residents, group/private chat, single CG ownership, persisted size, failed/successful setup, generated touch/feed responses and private isolation. GPT validation decodes the full loop and checks frame identity, progression and pause recovery. Mock success is not proof of real provider connectivity.

Still validate long-term engagement, personality, real latency/cost and multi-monitor/DPI ergonomics. One household model produces bounded multi-character turns; these are not independently running agents.

The user accepts this direction and adds user-resizable house dimensions, closely grouped residents with less walking, and CG directly above and outside the house. Dimensions below are starting points for validation, not fixed requirements.

## Intended use

The main experience is a small shared home on the desktop: watch the residents, join their conversation, or talk privately with one of them. Dock/free pets remain optional views of the same world.

- Compact mode shows closely grouped residents, a few furnishings, current speech and a chat affordance. An initial room target around 360×240 is resizable in width and height and needs real-screen/DPI validation.
- Opening chat expands history and composition below the room in the same window.
- Selecting a resident switches that conversation area to private chat; private transcripts are not broadcast to others.
- Setup becomes provider/key/model → connection test → one action to save and start live companionship. Offline demo remains explicit.
- Configuration and cast selection live in secondary settings. Everyday touch/feed/praise interactions remain accessible without a prominent animation catalogue.

Validate with DeepSeek, Claude and GPT first; keep the other residents optional. Distinct reactions and continuity matter more than seven sequential answers.

## Compact layout and resizing

- Resize the visible house through edge/corner handles and persist its position/dimensions. Expanding chat adds space below without changing the room's saved size. Preserve character aspect ratios and foot anchors; respect display work area and DPI.
- Cluster the trio around one small furnishing/rug. Claude and DeepSeek may start adjacent, with GPT nearby; initial composition must not hard-code every later relationship choice.
- Disable aimless patrol by default. Retain natural idle/expression details without constant side-to-side jitter. Move briefly for a purpose such as approaching someone or making room. Skip travel when already close; never run in place.
- Permit partial overlap while retaining the earlier at-most-half overlap constraint, legible faces and usable hit areas. Depth ordering can create cozy crowding; avoid permanent full occlusion.
- Layout uses actual body extents including tails/wings and transparent video padding, not the whole 16:9 plate. Never crop limbs or shrink unlimited residents into unreadable sizes. Minimum bounds depend on cast count and usable hit targets.
- Reposition on cast/layout/event changes, not continuous per-frame repulsion that causes jitter or deadlocks.
- Resize is a view transform, not locomotion: no walk intents, animation restarts, new model requests or new scene sessions. Skipped travel must not bypass the actual interaction's completion/settlement.

Do not stretch characters, invent missing sitting poses or substitute another GPT identity to fit the composition.

## CG above the roof

- In compact mode, anchor one shared CG card outside the visible room at its top center, with a small roof gap. Keep residents and chat unobscured; every event has one player regardless of cast size.
- Start around 80% of room width, preserve media aspect ratio and cap the size. Resize responsively without automatically enlarging the room for playback.
- Introduce it through actual interaction, approach and dialogue. Present an attached card without system chrome, a separate taskbar entry or focus stealing.
- A normal Electron window cannot paint beyond its native bounds using CSS overflow. Prefer one transparent host covering the union of house, upper CG and lower chat, with separately persisted `houseBounds`. Expand the host upward while keeping the house's screen position fixed, then restore it on collapse. Empty transparent regions must pass input through.
- If a platform requires an attached transparent auxiliary window, synchronize move/resize/minimize, hide its taskbar entry and preserve chat focus. One session owns playback across all views.
- When upper screen space is insufficient, shrink only to a readable limit, then fold into a user-openable roof-edge affordance. Do not leave the work area, cover the room or move the house the user positioned.

## Pre-implementation diagnosis (alpha.6 history)

A read-only check found the saved profile still in demo mode with DeepSeek and `deepseek-flash`. Saving a connection does not enable live chat.

Ordinary group/private messages pass API mode into `sequence`, which already supports generated replies and the `perform_action` loop. Pat/feed/hover, private greetings, praise, social/yuri scenes and most companion stories still use local dialogue/plans. The optional story model call writes only a short aside without action tools. Shared event memory is not a unified part of ordinary generation context.

These gaps need an event pipeline, not just a prompt change or a default-argument flip.

## Proposed interaction pipeline

User feeds DeepSeek → immediate supported local animation → event/context reaches the house model → it selects a short response, optional other participants and action intentions → the existing director validates and executes → actual public speech enters room chat → completed events update memory.

Keep personas, reviewed assets and execution constraints stable. Generate the current words and intentions. The application remains responsible for availability, timing, permissions, cancellation and CG eligibility.

## Implementation order

1. Introduce bounded `HouseEvent` input with event ID, kind, actors, payload, time and visibility. Route chat, touch/feed, private entry/return and autonomous life through it. Mechanical animation needs no model request.
2. Use one bounded house-planning request for a few participants and steps, allowing silence. Validate structured output against known actors and supported actions. Preserve optional per-character provider overrides without default seven-way fan-out.
3. Reuse SceneDirector priorities, presence, DND, cooldowns, cancellation and completion receipts. Discard stale model responses. Do not disguise API failure as generated local dialogue.
4. Write public speech only when performed; record actual completed events. Keep private contexts separate.
5. Extract existing chat/history into a room-bottom expandable component. Route the old group-chat entry there. Do not force-scroll readers of older history.
6. Add a compact renderer sharing the same engine/world/session. The current roughly 1000px minimum-width workspace cannot simply be shrunk. Multiple views must not duplicate autonomy, requests or CG playback.

## Autonomous life and CG

Evaluate whether to speak based on recent events, unfinished topics, attention and quiet/natural/lively preferences. Allow silence, enforce budgets/cooldowns and stop autonomous generation during absence or DND.

CG follows a contextual relationship event. The model can propose an intention; the application checks participants, preferences, assets and cooldowns. Use the external roof anchor above, with a recoverable folded affordance when headroom is insufficient.

## Acceptance

Live-mode chat and touch/feed/private-entry responses really use the model and vary with context. Users can understand watching, joining and private chat within a minute. Room speech and chat share continuity; subsequent interactions recall actual past events. Offline status and API errors remain honest. Rapid input, cast changes, DND and timeouts cannot cause stale scenes, duplicate requests or invented memories.

Resize and chat expansion preserve the house's position and user-selected size, character identity/extents and clickable targets without locomotion or model requests. A compact trio must avoid patrol, collision jitter and full occlusion across cast/DPI changes. CG appears once above the room, follows bounds, preserves chat focus and desktop input, and folds recoverably near screen edges.

This is a product hypothesis requiring validation, not a claim about all users. Test the three-resident watch–join–remember loop first.

References: [AIRI](https://github.com/moeru-ai/airi) for real-time companion architecture; [Open-LLM-VTuber](https://docs.llmvtuber.com/en/docs/intro/) for desktop/window views, proactive dialogue and expressive actions. Their capabilities do not implement this project's shared multi-character life events automatically.

The current delivery implements the direction above without new media generation.
